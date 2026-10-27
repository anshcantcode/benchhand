//! Phone access: a small JSON API for the Benchhand Android app.
//!
//! Off until the user pairs a phone. It answers only peers on a Tailscale network (100.64.0.0/10)
//! or this computer, and every request needs the bearer token shown once in the pairing code.
//! Only a SHA-256 hash of the token is stored. Decisions go through the same code paths as the
//! desktop window, so an approval from the phone is checked and recorded exactly like one made here.
use crate::{db_error, now, orchestration, AppState};
use rusqlite::{params, OptionalExtension};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::{
    io::Read,
    net::IpAddr,
    sync::{Arc, Mutex},
};
use tauri::{Emitter, Manager, State};

pub const DEFAULT_PORT: u16 = 47615;
const MAX_BODY: usize = 256 * 1024;

static SERVER: Mutex<Option<Arc<tiny_http::Server>>> = Mutex::new(None);
static FAILURES: Mutex<Vec<i64>> = Mutex::new(Vec::new());

fn config(state: &AppState) -> Result<Value, String> {
    let v: Option<String> = state
        .lock()?
        .query_row(
            "SELECT value FROM preferences WHERE key='remote'",
            [],
            |r| r.get(0),
        )
        .optional()
        .map_err(db_error)?;
    Ok(v.and_then(|v| serde_json::from_str(&v).ok())
        .unwrap_or(json!({"enabled":false,"port":DEFAULT_PORT})))
}
fn save_config(state: &AppState, v: &Value) -> Result<(), String> {
    state
        .lock()?
        .execute(
            "INSERT INTO preferences(key,value) VALUES('remote',?1) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            [v.to_string()],
        )
        .map_err(db_error)?;
    Ok(())
}
fn hash(token: &str) -> String {
    Sha256::digest(token.as_bytes())
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect()
}
fn computer_name() -> String {
    std::env::var("COMPUTERNAME")
        .or_else(|_| std::env::var("HOSTNAME"))
        .unwrap_or_else(|_| "This computer".into())
}
/// A Tailscale address counts as allowed; so does this computer, for local testing.
pub fn allowed_peer(ip: IpAddr) -> bool {
    match ip {
        IpAddr::V4(v4) => {
            let o = v4.octets();
            v4.is_loopback() || (o[0] == 100 && (64..128).contains(&o[1]))
        }
        IpAddr::V6(v6) => {
            v6.is_loopback()
                || v6
                    .to_ipv4_mapped()
                    .is_some_and(|v4| allowed_peer(IpAddr::V4(v4)))
                || v6.segments()[..3] == [0xfd7a, 0x115c, 0xa1e0]
        }
    }
}
fn tailscale_ip() -> Option<String> {
    let mut candidates = vec!["tailscale".to_string()];
    if cfg!(windows) {
        candidates.push(r"C:\Program Files\Tailscale\tailscale.exe".into());
    }
    for exe in candidates {
        let mut cmd = std::process::Command::new(&exe);
        cmd.args(["ip", "-4"]);
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            cmd.creation_flags(0x0800_0000);
        }
        if let Ok(out) = cmd.output() {
            let ip = String::from_utf8_lossy(&out.stdout)
                .trim()
                .lines()
                .next()?
                .to_string();
            if out.status.success() && ip.parse::<IpAddr>().is_ok_and(allowed_peer) {
                return Some(ip);
            }
        }
    }
    None
}

pub fn start(app: &tauri::AppHandle) -> Result<(), String> {
    let state = app.state::<AppState>();
    let c = config(&state)?;
    stop();
    if c["enabled"] != true || c["tokenHash"].as_str().unwrap_or("").is_empty() {
        return Ok(());
    }
    let port = c["port"].as_u64().unwrap_or(DEFAULT_PORT as u64) as u16;
    let server = Arc::new(tiny_http::Server::http(("0.0.0.0", port)).map_err(|_| {
        format!("Port {port} is in use. Close the app using it and turn phone access on again.")
    })?);
    *SERVER.lock().map_err(db_error)? = Some(server.clone());
    let app = app.clone();
    std::thread::spawn(move || {
        for request in server.incoming_requests() {
            let app = app.clone();
            std::thread::spawn(move || handle(&app, request));
        }
    });
    Ok(())
}
pub fn stop() {
    if let Ok(mut s) = SERVER.lock() {
        if let Some(server) = s.take() {
            server.unblock();
        }
    }
}

fn respond(request: tiny_http::Request, code: u16, body: Value) {
    let header =
        tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap();
    let _ = request.respond(
        tiny_http::Response::from_string(body.to_string())
            .with_status_code(code)
            .with_header(header),
    );
}
fn too_many_failures(record: bool) -> bool {
    let Ok(mut f) = FAILURES.lock() else {
        return true;
    };
    let t = now();
    f.retain(|x| t - x < 60);
    if record {
        f.push(t);
    }
    f.len() > 20
}
fn handle(app: &tauri::AppHandle, mut request: tiny_http::Request) {
    if !request.remote_addr().is_some_and(|a| allowed_peer(a.ip())) {
        return respond(
            request,
            403,
            json!({"error":"Connect through Tailscale to reach this computer."}),
        );
    }
    if too_many_failures(false) {
        return respond(
            request,
            429,
            json!({"error":"Too many attempts. Wait a minute and try again."}),
        );
    }
    let state = app.state::<AppState>();
    let c = match config(&state) {
        Ok(c) => c,
        Err(e) => return respond(request, 500, json!({"error":e})),
    };
    let token = request
        .headers()
        .iter()
        .find(|h| h.field.equiv("Authorization"))
        .and_then(|h| h.value.as_str().strip_prefix("Bearer ").map(str::to_owned))
        .unwrap_or_default();
    let expected = c["tokenHash"].as_str().unwrap_or("");
    if c["enabled"] != true || expected.is_empty() || hash(&token) != expected {
        too_many_failures(true);
        return respond(
            request,
            401,
            json!({"error":"This phone isn't paired. Pair it again from Preferences on the computer."}),
        );
    }
    if now() - c["lastSeen"].as_i64().unwrap_or(0) > 30 {
        let mut c = c.clone();
        c["lastSeen"] = json!(now());
        let _ = save_config(&state, &c);
    }
    let mut body = String::new();
    if request
        .as_reader()
        .take(MAX_BODY as u64 + 1)
        .read_to_string(&mut body)
        .is_err()
        || body.len() > MAX_BODY
    {
        return respond(request, 413, json!({"error":"The request is too large."}));
    }
    let input: Value = if body.trim().is_empty() {
        json!({})
    } else {
        match serde_json::from_str(&body) {
            Ok(v) => v,
            Err(_) => {
                return respond(
                    request,
                    400,
                    json!({"error":"The request isn't valid JSON."}),
                )
            }
        }
    };
    let method = request.method().as_str().to_owned();
    let url = request.url().split('?').next().unwrap_or("").to_owned();
    let parts: Vec<&str> = url.trim_matches('/').split('/').collect();
    let result = route(app, &method, &parts, &input);
    match result {
        Ok(v) => {
            if method != "GET" {
                let _ = app.emit("workspace-updated", json!({"source":"phone"}));
            }
            respond(request, 200, v)
        }
        Err((code, e)) => respond(request, code, json!({"error":e})),
    }
}

type Reply = Result<Value, (u16, String)>;
fn bad(e: String) -> (u16, String) {
    (400, e)
}
pub(crate) fn route(app: &tauri::AppHandle, method: &str, parts: &[&str], input: &Value) -> Reply {
    let state = app.state::<AppState>();
    match (method, parts) {
        ("GET", ["v1", "summary"]) => summary(&state).map_err(|e| (500, e)),
        ("GET", ["v1", "tasks", id, "events"]) => events(&state, id).map_err(|e| (500, e)),
        ("POST", ["v1", "approvals", id, "decision"]) => {
            let decision = input["decision"].as_str().unwrap_or("").to_owned();
            let arguments = input.get("arguments").filter(|v| !v.is_null()).cloned();
            crate::decide_approval((*id).into(), decision, arguments, app.clone()).map_err(bad)?;
            Ok(json!({"ok":true}))
        }
        ("POST", ["v1", "tasks"]) => {
            // Check before creating, so a task that cannot start is not left behind.
            let bot_id = input["botId"].as_str().unwrap_or("");
            let bot = state
                .bots()
                .map_err(|e| (500, e))?
                .into_iter()
                .find(|b| b.id == bot_id)
                .ok_or((404, "Teammate not found".to_owned()))?;
            if bot.provider_id.is_empty() {
                return Err((
                    400,
                    "Choose a model for this teammate on the computer first".into(),
                ));
            }
            let id = crate::create_task(
                input["title"].as_str().unwrap_or("").into(),
                input["description"].as_str().unwrap_or("").into(),
                input["botId"].as_str().unwrap_or("").into(),
                state,
            )
            .map_err(bad)?;
            crate::start_task(id.clone(), app.clone()).map_err(bad)?;
            Ok(json!({"taskId":id}))
        }
        ("POST", ["v1", "routines", id, "run"]) => {
            let task = orchestration::run_schedule_now((*id).into(), state).map_err(bad)?;
            Ok(json!({"taskId":task}))
        }
        ("POST", ["v1", "routines", id, "enabled"]) => {
            let mut s = orchestration::list(&state)
                .map_err(|e| (500, e))?
                .into_iter()
                .find(|s| s.id == *id)
                .ok_or((404, "This routine was removed".to_string()))?;
            s.enabled = input["enabled"]
                .as_bool()
                .ok_or(bad("Say whether the routine is on".into()))?;
            let saved = orchestration::save_schedule(s, state).map_err(bad)?;
            serde_json::to_value(saved).map_err(|e| (500, e.to_string()))
        }
        _ => Err((404, "Not found".into())),
    }
}

fn events(state: &AppState, task_id: &str) -> Result<Value, String> {
    let db = state.lock()?;
    let mut q = db
        .prepare(
            "SELECT message,created_at FROM task_events WHERE task_id=?1 ORDER BY id LIMIT 200",
        )
        .map_err(db_error)?;
    let rows = q
        .query_map([task_id], |r| {
            Ok(json!({"message":r.get::<_,String>(0)?,"at":r.get::<_,i64>(1)?}))
        })
        .map_err(db_error)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(db_error)?;
    Ok(json!({ "events": rows }))
}

/// Everything the phone's four screens need, in one read.
fn summary(state: &AppState) -> Result<Value, String> {
    let connections = state.connections()?;
    let model_of = |provider: &str| {
        connections
            .iter()
            .find(|c| c.id == provider)
            .map(|c| c.config["model"].as_str().unwrap_or(&c.label).to_string())
            .unwrap_or_default()
    };
    let bots = state.bots()?;
    let db = state.lock()?;
    let approval = |r: &rusqlite::Row| -> rusqlite::Result<Value> {
        Ok(json!({
            "id": r.get::<_,String>(0)?, "taskId": r.get::<_,String>(1)?, "title": r.get::<_,String>(2)?,
            "target": r.get::<_,String>(3)?, "summary": r.get::<_,String>(4)?, "status": r.get::<_,String>(5)?,
            "createdAt": r.get::<_,i64>(6)?, "toolName": r.get::<_,String>(7)?,
            "arguments": serde_json::from_str::<Value>(&r.get::<_,String>(8)?).unwrap_or(json!({})),
            "edited": r.get::<_,i64>(9)? != 0, "botId": r.get::<_,String>(10)?, "taskTitle": r.get::<_,String>(11)?,
            "taskStartedAt": r.get::<_,i64>(12)?,
        }))
    };
    let select = "SELECT a.id,a.task_id,a.title,a.target,a.summary,a.status,a.created_at,a.tool_name,a.arguments,a.edited,t.bot_id,t.title,t.created_at FROM approvals a JOIN tasks t ON t.id=a.task_id";
    let pending = db
        .prepare(&format!(
            "{select} WHERE a.status='pending' ORDER BY a.created_at"
        ))
        .map_err(db_error)?
        .query_map([], approval)
        .map_err(db_error)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(db_error)?;
    let recent = db
        .prepare(&format!(
            "{select} WHERE a.status<>'pending' ORDER BY a.created_at DESC LIMIT 12"
        ))
        .map_err(db_error)?
        .query_map([], approval)
        .map_err(db_error)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(db_error)?;
    let since = now() - 86_400;
    let mut team = Vec::new();
    for b in &bots {
        let (running, waiting, last): (i64, i64, Option<String>) = db
            .query_row(
                "SELECT SUM(status='running'),SUM(status='paused' AND waiting_approval=1),(SELECT title FROM tasks WHERE bot_id=?1 ORDER BY updated_at DESC LIMIT 1) FROM tasks WHERE bot_id=?1",
                [&b.id],
                |r| Ok((r.get::<_, Option<i64>>(0)?.unwrap_or(0), r.get::<_, Option<i64>>(1)?.unwrap_or(0), r.get(2)?)),
            )
            .map_err(db_error)?;
        let runs_today: i64 = db
            .query_row(
                "SELECT COUNT(*) FROM tasks WHERE bot_id=?1 AND created_at>=?2",
                params![b.id, since],
                |r| r.get(0),
            )
            .map_err(db_error)?;
        team.push(json!({
            "id": b.id, "name": b.name, "role": b.role, "color": b.color, "model": model_of(&b.provider_id),
            "running": running, "waiting": waiting, "lastTask": last.unwrap_or_default(), "runsToday": runs_today,
        }));
    }
    let running: Vec<Value> = db
        .prepare("SELECT t.id,t.title,t.bot_id,t.updated_at FROM tasks t WHERE t.status='running' ORDER BY t.updated_at DESC LIMIT 10")
        .map_err(db_error)?
        .query_map([], |r| {
            Ok(json!({"id":r.get::<_,String>(0)?,"title":r.get::<_,String>(1)?,"botId":r.get::<_,String>(2)?,"updatedAt":r.get::<_,i64>(3)?}))
        })
        .map_err(db_error)?
        .collect::<Result<_, _>>()
        .map_err(db_error)?;
    drop(db);
    let routines = orchestration::list(state)?;
    let tz = state.settings()?["timezone"]
        .as_str()
        .unwrap_or("")
        .to_string();
    Ok(json!({
        "computer": computer_name(), "version": env!("CARGO_PKG_VERSION"), "now": now(), "timezone": tz,
        "pending": pending, "recent": recent, "team": team, "running": running, "routines": routines,
    }))
}

#[tauri::command]
pub fn remote_status(state: State<'_, AppState>) -> Result<Value, String> {
    let c = config(&state)?;
    let running = SERVER.lock().map(|s| s.is_some()).unwrap_or(false);
    Ok(json!({
        "enabled": c["enabled"] == true, "running": running, "port": c["port"].as_u64().unwrap_or(DEFAULT_PORT as u64),
        "pairedAt": c["pairedAt"].as_i64().unwrap_or(0), "lastSeen": c["lastSeen"].as_i64().unwrap_or(0),
        "address": tailscale_ip(),
    }))
}
/// Makes a new pairing code. Any phone paired before stops working.
#[tauri::command]
pub fn remote_pair(app: tauri::AppHandle) -> Result<Value, String> {
    let state = app.state::<AppState>();
    let address = tailscale_ip().ok_or(
        "Tailscale isn't running on this computer. Install it from tailscale.com, sign in, then try again.",
    )?;
    let token = format!(
        "{}{}",
        uuid::Uuid::new_v4().simple(),
        uuid::Uuid::new_v4().simple()
    );
    let mut c = config(&state)?;
    let port = c["port"].as_u64().unwrap_or(DEFAULT_PORT as u64);
    c["enabled"] = json!(true);
    c["port"] = json!(port);
    c["tokenHash"] = json!(hash(&token));
    c["pairedAt"] = json!(now());
    c["lastSeen"] = json!(0);
    save_config(&state, &c)?;
    start(&app)?;
    let name = computer_name();
    let code = format!(
        "benchhand://pair?h={address}&p={port}&t={token}&n={}",
        name.chars()
            .filter(|c| c.is_ascii_alphanumeric() || *c == '-')
            .collect::<String>()
    );
    let qr = qrcode::QrCode::with_error_correction_level(code.as_bytes(), qrcode::EcLevel::M)
        .map_err(|_| "Could not draw the pairing code")?
        .render::<qrcode::render::svg::Color>()
        .min_dimensions(240, 240)
        .quiet_zone(true)
        .build();
    Ok(json!({"code":code,"qr":qr,"address":address,"port":port,"computer":name}))
}
#[tauri::command]
pub fn remote_disable(state: State<'_, AppState>) -> Result<(), String> {
    let mut c = config(&state)?;
    c["enabled"] = json!(false);
    c["tokenHash"] = json!("");
    save_config(&state, &c)?;
    stop();
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn only_tailscale_and_loopback_peers_are_allowed() {
        for ok in [
            "100.108.98.74",
            "100.64.0.1",
            "100.127.255.254",
            "127.0.0.1",
            "::1",
            "fd7a:115c:a1e0::1",
        ] {
            assert!(allowed_peer(ok.parse().unwrap()), "{ok}");
        }
        for no in [
            "100.63.255.255",
            "100.128.0.1",
            "192.168.1.20",
            "10.0.0.5",
            "8.8.8.8",
            "fe80::1",
        ] {
            assert!(!allowed_peer(no.parse().unwrap()), "{no}");
        }
    }
    #[test]
    fn tokens_are_stored_as_hashes() {
        let h = hash("abc");
        assert_eq!(h.len(), 64);
        assert_ne!(h, "abc");
        assert_eq!(h, hash("abc"));
    }
}
