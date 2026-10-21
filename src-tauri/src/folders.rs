use crate::{db_error, AppState};
use rusqlite::{params, OptionalExtension};
use serde_json::{json, Value};
use std::path::{Path, PathBuf};
use tauri::{Manager, State};
use tauri_plugin_dialog::DialogExt;

pub fn list(state: &AppState) -> Result<Vec<Value>, String> {
    let db = state.lock()?;
    let mut query = db
        .prepare("SELECT bot_id,path FROM workspace_folders ORDER BY bot_id")
        .map_err(db_error)?;
    let rows = query
        .query_map([], |r| {
            Ok(json!({"botId":r.get::<_,String>(0)?,"path":r.get::<_,String>(1)?}))
        })
        .map_err(db_error)?;
    rows.collect::<Result<Vec<_>, _>>().map_err(db_error)
}
pub fn root(state: &AppState, bot: &str) -> Result<Option<PathBuf>, String> {
    let path: Option<String> = state
        .lock()?
        .query_row(
            "SELECT path FROM workspace_folders WHERE bot_id=?1",
            [bot],
            |r| r.get(0),
        )
        .optional()
        .map_err(db_error)?;
    path.map(|p| {
        let path = PathBuf::from(p);
        if !path.is_dir() {
            return Err("The attached folder is unavailable. Reconnect it in Folders.".into());
        }
        std::fs::canonicalize(path).map_err(db_error)
    })
    .transpose()
}
fn idle(state: &AppState, bot: &str) -> Result<(), String> {
    if !state.bots()?.iter().any(|b| b.id == bot) {
        return Err("Choose a teammate for this folder".into());
    }
    let active: bool = state
        .lock()?
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM tasks WHERE bot_id=?1 AND status IN ('running','paused'))",
            [bot],
            |r| r.get(0),
        )
        .map_err(db_error)?;
    if active {
        return Err("Stop this teammate's active tasks before changing its working folder".into());
    }
    Ok(())
}
fn attach(state: &AppState, bot: &str, path: &Path) -> Result<Value, String> {
    idle(state, bot)?;
    if !path.is_absolute() || !path.is_dir() {
        return Err("Choose an existing folder on this computer".into());
    }
    let path = std::fs::canonicalize(path).map_err(db_error)?;
    // Never turn an entire volume into a workspace by accident.
    if path.parent().is_none() {
        return Err("Choose a project folder, rather than an entire drive".into());
    }
    let text = path.to_string_lossy().to_string();
    // Keep the idle check and update atomic with task creation/start.
    let db = state.lock()?;
    let active: bool = db
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM tasks WHERE bot_id=?1 AND status IN ('running','paused'))",
            [bot],
            |r| r.get(0),
        )
        .map_err(db_error)?;
    if active {
        return Err("Stop this teammate's active tasks before changing its working folder".into());
    }
    db.execute("INSERT INTO workspace_folders(bot_id,path) VALUES(?1,?2) ON CONFLICT(bot_id) DO UPDATE SET path=excluded.path", params![bot,text]).map_err(db_error)?;
    Ok(json!({"botId":bot,"path":text}))
}
#[tauri::command(rename_all = "camelCase")]
pub fn attach_workspace_folder(
    bot_id: String,
    path: String,
    state: State<'_, AppState>,
) -> Result<Value, String> {
    attach(&state, &bot_id, Path::new(&path))
}
#[tauri::command(rename_all = "camelCase")]
pub async fn pick_workspace_folder(
    bot_id: String,
    app: tauri::AppHandle,
) -> Result<Option<Value>, String> {
    idle(&app.state::<AppState>(), &bot_id)?;
    let (tx, rx) = tokio::sync::oneshot::channel();
    app.dialog()
        .file()
        .set_title("Choose a working folder for your assistant")
        .pick_folder(move |folder| {
            let _ = tx.send(folder);
        });
    let Some(folder) = rx
        .await
        .map_err(|_| "The folder picker closed unexpectedly")?
    else {
        return Ok(None);
    };
    let path = folder
        .into_path()
        .map_err(|_| "Choose a local filesystem folder")?;
    attach(&app.state::<AppState>(), &bot_id, &path).map(Some)
}
#[tauri::command(rename_all = "camelCase")]
pub fn detach_workspace_folder(bot_id: String, state: State<'_, AppState>) -> Result<(), String> {
    idle(&state, &bot_id)?;
    let db = state.lock()?;
    let active: bool = db
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM tasks WHERE bot_id=?1 AND status IN ('running','paused'))",
            [&bot_id],
            |r| r.get(0),
        )
        .map_err(db_error)?;
    if active {
        return Err("Stop this teammate's active tasks before disconnecting this folder".into());
    }
    db.execute("DELETE FROM workspace_folders WHERE bot_id=?1", [&bot_id])
        .map_err(db_error)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{collections::HashMap, sync::Mutex};
    #[tokio::test]
    async fn local_folder_reads_and_reviewed_writes_use_the_selected_root() {
        let temp =
            std::env::temp_dir().join(format!("benchhand-folder-test-{}", uuid::Uuid::new_v4()));
        let project = temp.join("project");
        std::fs::create_dir_all(&project).unwrap();
        std::fs::write(project.join("notes.txt"), "Original notes").unwrap();
        let server = crate::test_support::MockServer::new(|_, _, body| {
            let count = body["messages"]
                .as_array()
                .unwrap()
                .iter()
                .filter(|m| m["role"] == "tool")
                .count();
            let message = match count {
                0 => {
                    json!({"role":"assistant","tool_calls":[{"id":"read","type":"function","function":{"name":"workspace_read","arguments":"{\"path\":\"notes.txt\"}"}}]})
                }
                1 => {
                    json!({"role":"assistant","tool_calls":[{"id":"write","type":"function","function":{"name":"workspace_write","arguments":"{\"path\":\"notes.txt\",\"content\":\"Reviewed notes\"}"}}]})
                }
                _ => json!({"role":"assistant","content":"Updated the selected project."}),
            };
            json!({"choices":[{"message":message}]})
        });
        let db = crate::open_database(&temp.join("state.sqlite3")).unwrap();
        db.execute("INSERT INTO connections(id,kind,label,config,account,verified_at) VALUES('folder-model','model','Fixture',?1,'fixture',1)",[json!({"baseUrl":format!("{}/v1",server.url),"model":"fixture"}).to_string()]).unwrap();
        db.execute(
            "UPDATE bots SET provider_id='folder-model' WHERE id='research'",
            [],
        )
        .unwrap();
        let state = AppState {
            db: Mutex::new(db),
            data_dir: temp.clone(),
            client: reqwest::Client::new(),
            active: Mutex::new(HashMap::new()),
            downloads: Mutex::new(HashMap::new()),
        };
        attach(&state, "research", &project).unwrap();
        assert!(attach(&state, "research", Path::new("relative/path")).is_err());
        state.lock().unwrap().execute("INSERT INTO tasks(id,title,description,bot_id,status,created_at,updated_at) VALUES('folder-task','Update notes','Read then update notes','research','running',1,1)",[]).unwrap();
        crate::agent::run_with(&state, "folder-task", false, None, || {})
            .await
            .unwrap();
        assert_eq!(
            std::fs::read_to_string(project.join("notes.txt")).unwrap(),
            "Original notes"
        );
        assert!(attach(&state, "research", &project).is_err());
        assert!(state.task("folder-task").unwrap().waiting_approval);
        let target: String = state
            .lock()
            .unwrap()
            .query_row(
                "SELECT target FROM approvals WHERE task_id='folder-task'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(
            PathBuf::from(target),
            std::fs::canonicalize(&project).unwrap()
        );
        state
            .lock()
            .unwrap()
            .execute(
                "UPDATE approvals SET status='approved' WHERE task_id='folder-task'",
                [],
            )
            .unwrap();
        state
            .lock()
            .unwrap()
            .execute(
                "UPDATE tasks SET status='running' WHERE id='folder-task'",
                [],
            )
            .unwrap();
        crate::agent::run_with(&state, "folder-task", true, None, || {})
            .await
            .unwrap();
        assert_eq!(
            std::fs::read_to_string(project.join("notes.txt")).unwrap(),
            "Reviewed notes"
        );
        assert_eq!(
            state.task("folder-task").unwrap().working_folder,
            std::fs::canonicalize(&project)
                .unwrap()
                .display()
                .to_string()
        );
        std::fs::remove_dir_all(&project).unwrap();
        assert!(root(&state, "research").is_err());
        drop(state);
        std::fs::remove_dir_all(temp).unwrap();
    }
}
