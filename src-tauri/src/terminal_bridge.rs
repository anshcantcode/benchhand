//! Local terminal access shares the desktop task engine and its approval checks.
use crate::{db_error, terminal_shared, AppState};
use rusqlite::{params, Connection};
use serde_json::{json, Value};
use std::{
    io::Read,
    sync::{Arc, Mutex},
};
use tauri::Manager;

static SERVER: Mutex<Option<(Arc<tiny_http::Server>, String, String)>> = Mutex::new(None);
const MAX_BODY: u64 = 256 * 1024;

pub fn start(app: &tauri::AppHandle) -> Result<(), String> {
    let state = app.state::<AppState>();
    let id = terminal_shared::credential_id(&state.data_dir)?;
    let server = Arc::new(tiny_http::Server::http(("127.0.0.1", 0)).map_err(db_error)?);
    let port = server
        .server_addr()
        .to_ip()
        .ok_or("Terminal listener is unavailable")?
        .port();
    let token = format!(
        "{}{}",
        uuid::Uuid::new_v4().simple(),
        uuid::Uuid::new_v4().simple()
    );
    let credentials = json!({"port":port,"token":token}).to_string();
    crate::write_secret(&id, &credentials)?;
    *SERVER.lock().map_err(db_error)? = Some((server.clone(), id, credentials));
    let app = app.clone();
    std::thread::spawn(move || {
        for request in server.incoming_requests() {
            handle(&app, request, &token);
        }
    });
    Ok(())
}

pub fn stop() {
    if let Ok(mut state) = SERVER.lock() {
        if let Some((server, id, credentials)) = state.take() {
            server.unblock();
            if crate::read_secret(&id).is_ok_and(|value| value == credentials) {
                if let Ok(entry) = crate::secret_entry(&id) {
                    let _ = entry.delete_credential();
                }
            }
        }
    }
}

fn respond(request: tiny_http::Request, status: u16, body: Value) {
    let header =
        tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap();
    let _ = request.respond(
        tiny_http::Response::from_string(body.to_string())
            .with_status_code(status)
            .with_header(header),
    );
}

fn handle(app: &tauri::AppHandle, mut request: tiny_http::Request, token: &str) {
    let supplied = request
        .headers()
        .iter()
        .find(|h| h.field.equiv("Authorization"))
        .and_then(|h| h.value.as_str().strip_prefix("Bearer "))
        .unwrap_or("");
    let origin = request.headers().iter().any(|h| h.field.equiv("Origin"));
    if !authorized(supplied, origin, token) {
        return respond(
            request,
            403,
            json!({"error":"Terminal authorization failed"}),
        );
    }
    let method = request.method().as_str().to_string();
    let path = request.url().split('?').next().unwrap_or("").to_owned();
    let parts: Vec<_> = path.trim_matches('/').split('/').collect();
    let mut bytes = Vec::new();
    if request
        .as_reader()
        .take(MAX_BODY + 1)
        .read_to_end(&mut bytes)
        .is_err()
        || bytes.len() as u64 > MAX_BODY
    {
        return respond(request, 413, json!({"error":"Request is too large"}));
    }
    let input: Value = if bytes.is_empty() {
        json!({})
    } else {
        match serde_json::from_slice(&bytes) {
            Ok(value) => value,
            Err(_) => return respond(request, 400, json!({"error":"Invalid request"})),
        }
    };
    let result = match (method.as_str(), parts.as_slice()) {
        ("GET", ["v1", "tasks"]) => app
            .state::<AppState>()
            .tasks()
            .and_then(|tasks| serde_json::to_value(tasks).map_err(db_error))
            .map_err(|error| (500, error)),
        ("GET", ["v1", "tasks", id]) => app
            .state::<AppState>()
            .task(id)
            .and_then(|task| serde_json::to_value(task).map_err(db_error))
            .map_err(|error| (404, error)),
        ("GET", ["v1", "tasks", id, "events", "after", cursor]) => {
            match cursor.parse::<i64>().ok().filter(|n| *n >= 0) {
                Some(after) => app
                    .state::<AppState>()
                    .lock()
                    .and_then(|db| event_page(&db, id, after))
                    .map_err(|error| (500, error)),
                None => Err((400, "Invalid activity cursor".into())),
            }
        }
        ("GET", ["v1", "summary"] | ["v1", "tasks", _, "events"])
        | ("POST", ["v1", "tasks"] | ["v1", "approvals", _, "decision"]) => {
            crate::remote::route(app, &method, &parts, &input)
        }
        _ => Err((404, "Not found".into())),
    };
    match result {
        Ok(value) => respond(request, 200, value),
        Err((code, error)) => respond(request, code, json!({"error":error})),
    }
}

fn event_page(db: &Connection, task_id: &str, after: i64) -> Result<Value, String> {
    let mut query = db.prepare("SELECT id,message,created_at FROM task_events WHERE task_id=?1 AND id>?2 ORDER BY id LIMIT 200").map_err(db_error)?;
    let events = query.query_map(params![task_id, after], |row| {
        Ok(json!({"id":row.get::<_,i64>(0)?,"message":row.get::<_,String>(1)?,"at":row.get::<_,i64>(2)?}))
    }).map_err(db_error)?.collect::<Result<Vec<_>, _>>().map_err(db_error)?;
    Ok(json!({"events":events}))
}

fn authorized(a: &str, origin: bool, b: &str) -> bool {
    if origin || b.is_empty() {
        return false;
    }
    if a.len() != b.len() {
        return false;
    }
    a.bytes()
        .zip(b.bytes())
        .fold(0u8, |difference, (x, y)| difference | (x ^ y))
        == 0
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn tokens_must_match_exactly() {
        assert!(super::authorized("abcdef", false, "abcdef"));
        assert!(!super::authorized("abcdef", true, "abcdef"));
        assert!(!super::authorized("abcdeg", false, "abcdef"));
        assert!(!super::authorized("abc", false, "abcdef"));
        assert!(!super::authorized("", false, ""));
    }

    #[test]
    fn activity_pages_include_every_event_without_other_tasks() {
        let db = Connection::open_in_memory().unwrap();
        db.execute_batch("CREATE TABLE task_events(id INTEGER PRIMARY KEY, task_id TEXT, message TEXT, created_at INTEGER)").unwrap();
        for id in 1..=251 {
            db.execute(
                "INSERT INTO task_events VALUES (?1,'target',?2,0)",
                params![id, format!("event {id}")],
            )
            .unwrap();
        }
        db.execute(
            "INSERT INTO task_events VALUES (252,'other','hidden',0)",
            [],
        )
        .unwrap();
        let first = event_page(&db, "target", 0).unwrap();
        assert_eq!(first["events"].as_array().unwrap().len(), 200);
        let last_id = first["events"][199]["id"].as_i64().unwrap();
        let next = event_page(&db, "target", last_id).unwrap();
        assert_eq!(next["events"].as_array().unwrap().len(), 51);
        assert_eq!(next["events"][0]["message"], "event 201");
        assert_eq!(next["events"][50]["message"], "event 251");
        assert!(event_page(&db, "target", 251).unwrap()["events"]
            .as_array()
            .unwrap()
            .is_empty());
    }
}
