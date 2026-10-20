#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod agent;
mod computer;
mod desktop;
mod marketplace;
mod models;
mod orchestration;
mod services;
mod stdio;
#[cfg(test)]
mod test_support;

use rusqlite::{params, Connection as Database, OptionalExtension};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{
    collections::HashMap,
    fs,
    path::PathBuf,
    sync::Mutex,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{Emitter, Manager, State};
use uuid::Uuid;

pub struct AppState {
    db: Mutex<Database>,
    data_dir: PathBuf,
    client: reqwest::Client,
    active: Mutex<HashMap<String, tokio::task::AbortHandle>>,
    downloads: Mutex<HashMap<String, Value>>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Bot {
    id: String,
    name: String,
    role: String,
    description: String,
    instructions: String,
    color: String,
    provider_id: String,
}
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    id: String,
    title: String,
    description: String,
    bot_id: String,
    bot_name: String,
    status: String,
    created_at: i64,
    updated_at: i64,
    output: String,
    error: String,
    waiting_approval: bool,
    parent_id: String,
    waiting_child: String,
    schedule_id: String,
}
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Connection {
    id: String,
    kind: String,
    label: String,
    config: Value,
    account: String,
    verified_at: i64,
}
#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionInput {
    #[serde(default)]
    id: String,
    kind: String,
    label: String,
    config: Value,
    #[serde(default)]
    secret: String,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Approval {
    id: String,
    task_id: String,
    title: String,
    target: String,
    summary: String,
    status: String,
    created_at: i64,
    tool_name: String,
    arguments: Value,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct TaskEvent {
    id: i64,
    message: String,
    created_at: i64,
}

fn now() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}
fn db_error(error: impl std::fmt::Display) -> String {
    error.to_string()
}
fn defaults() -> Value {
    json!({"workspaceName":"My workspace","ownerName":"","theme":"dark","accent":"#54c2a4",
      "density":"comfortable","fontSize":14,"radius":6,"sidebarCompact":false,
      "reduceMotion":false,"font":"sans","background":"flat","defaultView":"home",
      "showActivity":true,"showStarters":true,"setupComplete":false,"maxSteps":12,"visionProviderId":"",
      "rootStepBudget":60,"maxConcurrentRuns":3,"runInBackground":false,"computerEnabled":false,"computerInput":false,"computerBotIds":[],"computerHideWindow":true,"computerExpiresAt":0})
}
fn validate_settings(input: &Value) -> Result<Value, String> {
    let mut settings = defaults();
    let obj = input.as_object().ok_or("Settings must be an object")?;
    for (key, value) in obj {
        if settings.get(key).is_some() {
            settings[key] = value.clone();
        }
    }
    for (key, max) in [
        ("workspaceName", 60),
        ("ownerName", 60),
        ("visionProviderId", 100),
    ] {
        let text = settings[key].as_str().ok_or("Names must be text")?.trim();
        if text.chars().count() > max || (key == "workspaceName" && text.is_empty()) {
            return Err("Use a workspace name between 1 and 60 characters".into());
        }
        settings[key] = json!(text);
    }
    for (key, allowed) in [
        ("theme", vec!["dark", "light", "system"]),
        ("density", vec!["comfortable", "compact"]),
        ("font", vec!["sans", "mono"]),
        ("background", vec!["glow", "flat"]),
        ("defaultView", vec!["home", "tasks", "team", "connections"]),
    ] {
        if !allowed.contains(&settings[key].as_str().unwrap_or("")) {
            return Err(format!("Invalid {key}"));
        }
    }
    let accent = settings["accent"]
        .as_str()
        .ok_or("Choose a valid accent color")?;
    if accent.len() != 7
        || !accent.starts_with('#')
        || !accent[1..].chars().all(|c| c.is_ascii_hexdigit())
    {
        return Err("Use a six digit hex accent color".into());
    }
    for (key, min, max) in [
        ("fontSize", 12, 18),
        ("radius", 0, 24),
        ("maxSteps", 1, 30),
        ("rootStepBudget", 1, 300),
        ("maxConcurrentRuns", 1, 8),
    ] {
        let value = settings[key].as_i64().ok_or(format!("Invalid {key}"))?;
        if !(min..=max).contains(&value) {
            return Err(format!("{key} must be between {min} and {max}"));
        }
    }
    for key in [
        "sidebarCompact",
        "reduceMotion",
        "showActivity",
        "showStarters",
        "setupComplete",
        "runInBackground",
        "computerEnabled",
        "computerInput",
        "computerHideWindow",
    ] {
        if !settings[key].is_boolean() {
            return Err(format!("Invalid {key}"));
        }
    }
    if !settings["computerBotIds"].as_array().is_some_and(|ids| {
        ids.len() <= 100
            && ids
                .iter()
                .all(|v| v.as_str().is_some_and(|s| s.len() <= 100))
    }) {
        return Err("Choose valid teammates for computer access".into());
    }
    if !settings["computerExpiresAt"]
        .as_i64()
        .is_some_and(|n| n >= 0)
    {
        return Err("Invalid computer access expiry".into());
    }
    Ok(settings)
}
fn open_database(path: &PathBuf) -> Result<Database, String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(db_error)?;
    }
    let db = Database::open(path).map_err(db_error)?;
    db.execute_batch("PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS bots(id TEXT PRIMARY KEY,name TEXT NOT NULL,role TEXT NOT NULL,description TEXT NOT NULL,model_label TEXT NOT NULL DEFAULT 'Not connected');
      CREATE TABLE IF NOT EXISTS tasks(id TEXT PRIMARY KEY,title TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',bot_id TEXT NOT NULL REFERENCES bots(id),status TEXT NOT NULL CHECK(status IN ('queued','running','paused','completed','failed','canceled')),created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,is_demo INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS approvals(id TEXT PRIMARY KEY,task_id TEXT NOT NULL REFERENCES tasks(id),title TEXT NOT NULL,target TEXT NOT NULL,summary TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('pending','approved','rejected')),created_at INTEGER NOT NULL,is_demo INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS task_events(id INTEGER PRIMARY KEY AUTOINCREMENT,task_id TEXT NOT NULL REFERENCES tasks(id),message TEXT NOT NULL,created_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS preferences(key TEXT PRIMARY KEY,value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS connections(id TEXT PRIMARY KEY,kind TEXT NOT NULL,label TEXT NOT NULL,config TEXT NOT NULL,account TEXT NOT NULL,verified_at INTEGER NOT NULL);").map_err(db_error)?;
    for (table, column, definition) in [
        ("bots", "instructions", "TEXT NOT NULL DEFAULT ''"),
        ("bots", "color", "TEXT NOT NULL DEFAULT '#54c2a4'"),
        ("bots", "provider_id", "TEXT NOT NULL DEFAULT ''"),
        ("tasks", "output", "TEXT NOT NULL DEFAULT ''"),
        ("tasks", "error", "TEXT NOT NULL DEFAULT ''"),
        ("tasks", "continuation", "TEXT NOT NULL DEFAULT ''"),
        ("tasks", "waiting_approval", "INTEGER NOT NULL DEFAULT 0"),
        ("tasks", "parent_id", "TEXT NOT NULL DEFAULT ''"),
        ("tasks", "root_id", "TEXT NOT NULL DEFAULT ''"),
        ("tasks", "waiting_child", "TEXT NOT NULL DEFAULT ''"),
        ("tasks", "schedule_id", "TEXT NOT NULL DEFAULT ''"),
        ("tasks", "auto_start", "INTEGER NOT NULL DEFAULT 0"),
        ("tasks", "generation", "INTEGER NOT NULL DEFAULT 0"),
        ("tasks", "parent_generation", "INTEGER NOT NULL DEFAULT 0"),
        ("tasks", "delegate_call_id", "TEXT NOT NULL DEFAULT ''"),
        ("tasks", "budget_remaining", "INTEGER NOT NULL DEFAULT 60"),
        ("approvals", "tool_name", "TEXT NOT NULL DEFAULT ''"),
        ("approvals", "arguments", "TEXT NOT NULL DEFAULT '{}'"),
    ] {
        let mut stmt = db
            .prepare(&format!("PRAGMA table_info({table})"))
            .map_err(db_error)?;
        let columns = stmt
            .query_map([], |r| r.get::<_, String>(1))
            .map_err(db_error)?
            .collect::<Result<Vec<_>, _>>()
            .map_err(db_error)?;
        if !columns.iter().any(|c| c == column) {
            db.execute_batch(&format!(
                "ALTER TABLE {table} ADD COLUMN {column} {definition}"
            ))
            .map_err(db_error)?;
        }
    }
    orchestration::migrate(&db)?;
    marketplace::migrate(&db)?;
    db.execute_batch("DELETE FROM approvals WHERE is_demo=1; DELETE FROM task_events WHERE task_id IN(SELECT id FROM tasks WHERE is_demo=1); DELETE FROM tasks WHERE is_demo=1;
      UPDATE tasks SET status='paused',error='The app restarted during this run. Run it again when ready.' WHERE status='running';").map_err(db_error)?;
    db.execute("UPDATE tasks SET status='failed',error='The app restarted while this delegated task was running. Its parent will receive this failure.' WHERE parent_id<>'' AND status='paused' AND waiting_approval=0 AND waiting_child=''",[]).map_err(db_error)?;
    for (id,name,role,description,color,instructions) in [
      ("research","Scout","Research & synthesis","Turns scattered information into clear decisions.","#7aa7e0","Research carefully. Cite sources returned by tools. Distinguish evidence from inference. Produce a concise, useful result."),
      ("operations","Atlas","Planning & operations","Keeps projects organized and moving forward.","#8bd7b6","Turn goals into concrete plans. Highlight priorities, dependencies, and next actions. Ask for approval before external changes."),
      ("code","Forge","Engineering & GitHub","Understands issues and helps ship better software.","#efb47c","Be a precise software teammate. Use repository and issue information when available. Explain changes and tradeoffs clearly."),
    ] {
      db.execute("INSERT OR IGNORE INTO bots(id,name,role,description,instructions,color,provider_id,model_label) VALUES(?1,?2,?3,?4,?5,?6,'','Not connected')",params![id,name,role,description,instructions,color]).map_err(db_error)?;
      db.execute("UPDATE bots SET name=?2,role=?3,description=?4,instructions=?5,color=?6 WHERE id=?1 AND instructions=''",params![id,name,role,description,instructions,color]).map_err(db_error)?;
    }
    Ok(db)
}
impl AppState {
    fn lock(&self) -> Result<std::sync::MutexGuard<'_, Database>, String> {
        self.db
            .lock()
            .map_err(|_| "Local storage is busy. Try again.".into())
    }
    fn settings(&self) -> Result<Value, String> {
        let value: Option<String> = self
            .lock()?
            .query_row(
                "SELECT value FROM preferences WHERE key='settings'",
                [],
                |r| r.get(0),
            )
            .optional()
            .map_err(db_error)?;
        match value {
            Some(v) => validate_settings(&serde_json::from_str::<Value>(&v).map_err(db_error)?),
            None => Ok(defaults()),
        }
    }
    fn connections(&self) -> Result<Vec<Connection>, String> {
        let db = self.lock()?;
        let mut stmt=db.prepare("SELECT id,kind,label,config,account,verified_at FROM connections ORDER BY verified_at DESC").map_err(db_error)?;
        let rows = stmt
            .query_map([], |r| {
                Ok(Connection {
                    id: r.get(0)?,
                    kind: r.get(1)?,
                    label: r.get(2)?,
                    config: serde_json::from_str(&r.get::<_, String>(3)?).unwrap_or(json!({})),
                    account: r.get(4)?,
                    verified_at: r.get(5)?,
                })
            })
            .map_err(db_error)?;
        rows.collect::<Result<Vec<_>, _>>().map_err(db_error)
    }
    fn connection(&self, id: &str) -> Result<Connection, String> {
        self.connections()?
            .into_iter()
            .find(|c| c.id == id)
            .ok_or("This connection was removed. Connect it again.".into())
    }
    fn bots(&self) -> Result<Vec<Bot>, String> {
        let db = self.lock()?;
        let mut stmt=db.prepare("SELECT id,name,role,description,instructions,color,provider_id FROM bots ORDER BY rowid").map_err(db_error)?;
        let rows = stmt
            .query_map([], |r| {
                Ok(Bot {
                    id: r.get(0)?,
                    name: r.get(1)?,
                    role: r.get(2)?,
                    description: r.get(3)?,
                    instructions: r.get(4)?,
                    color: r.get(5)?,
                    provider_id: r.get(6)?,
                })
            })
            .map_err(db_error)?;
        rows.collect::<Result<Vec<_>, _>>().map_err(db_error)
    }
    fn tasks(&self) -> Result<Vec<Task>, String> {
        let db = self.lock()?;
        let mut stmt=db.prepare("SELECT t.id,t.title,t.description,t.bot_id,b.name,t.status,t.created_at,t.updated_at,t.output,t.error,t.waiting_approval,t.parent_id,t.waiting_child,t.schedule_id FROM tasks t JOIN bots b ON b.id=t.bot_id ORDER BY t.created_at DESC,t.rowid DESC LIMIT 500").map_err(db_error)?;
        let rows = stmt
            .query_map([], |r| {
                Ok(Task {
                    id: r.get(0)?,
                    title: r.get(1)?,
                    description: r.get(2)?,
                    bot_id: r.get(3)?,
                    bot_name: r.get(4)?,
                    status: r.get(5)?,
                    created_at: r.get(6)?,
                    updated_at: r.get(7)?,
                    output: r.get(8)?,
                    error: r.get(9)?,
                    waiting_approval: r.get::<_, i64>(10)? != 0,
                    parent_id: r.get(11)?,
                    waiting_child: r.get(12)?,
                    schedule_id: r.get(13)?,
                })
            })
            .map_err(db_error)?;
        rows.collect::<Result<Vec<_>, _>>().map_err(db_error)
    }
    fn task(&self, id: &str) -> Result<Task, String> {
        self.lock()?.query_row("SELECT t.id,t.title,t.description,t.bot_id,b.name,t.status,t.created_at,t.updated_at,t.output,t.error,t.waiting_approval,t.parent_id,t.waiting_child,t.schedule_id FROM tasks t JOIN bots b ON b.id=t.bot_id WHERE t.id=?1",[id],|r|Ok(Task{id:r.get(0)?,title:r.get(1)?,description:r.get(2)?,bot_id:r.get(3)?,bot_name:r.get(4)?,status:r.get(5)?,created_at:r.get(6)?,updated_at:r.get(7)?,output:r.get(8)?,error:r.get(9)?,waiting_approval:r.get::<_,i64>(10)?!=0,parent_id:r.get(11)?,waiting_child:r.get(12)?,schedule_id:r.get(13)?})).optional().map_err(db_error)?.ok_or("Task not found".into())
    }
    fn event(&self, task_id: &str, message: &str) -> Result<(), String> {
        self.lock()?
            .execute(
                "INSERT INTO task_events(task_id,message,created_at) VALUES(?1,?2,?3)",
                params![task_id, message, now()],
            )
            .map_err(db_error)?;
        Ok(())
    }
}
fn secret_entry(id: &str) -> Result<keyring::Entry, String> {
    keyring::Entry::new("dev.localteam.teammate", id)
        .map_err(|_| "Your operating system credential store is unavailable.".into())
}
fn read_secret(id: &str) -> Result<String, String> {
    match secret_entry(id)?.get_password() {
        Ok(s) => Ok(s),
        Err(keyring::Error::NoEntry) => Ok(String::new()),
        Err(_) => Err("Unlock your operating system credential store and try again.".into()),
    }
}
fn write_secret(id: &str, secret: &str) -> Result<(), String> {
    secret_entry(id)?.set_password(secret).map_err(|_| {
        "Could not save the secret. Unlock your operating system credential store and retry.".into()
    })
}
fn connection_secret(connection: &Connection) -> Result<String, String> {
    if connection.config["hasSecret"] == true {
        read_secret(&connection.id)
    } else {
        Ok(String::new())
    }
}

#[tauri::command]
fn bootstrap(state: State<'_, AppState>) -> Result<Value, String> {
    let db = state.lock()?;
    let mut stmt=db.prepare("SELECT id,task_id,title,target,summary,status,created_at,tool_name,arguments FROM approvals ORDER BY created_at DESC LIMIT 100").map_err(db_error)?;
    let approvals = stmt
        .query_map([], |r| {
            Ok(Approval {
                id: r.get(0)?,
                task_id: r.get(1)?,
                title: r.get(2)?,
                target: r.get(3)?,
                summary: r.get(4)?,
                status: r.get(5)?,
                created_at: r.get(6)?,
                tool_name: r.get(7)?,
                arguments: serde_json::from_str(&r.get::<_, String>(8)?).unwrap_or(json!({})),
            })
        })
        .map_err(db_error)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(db_error)?;
    drop(stmt);
    drop(db);
    Ok(
        json!({"settings":state.settings()?,"bots":state.bots()?,"tasks":state.tasks()?,"connections":state.connections()?,"approvals":approvals,"schedules":orchestration::list(&state)?,"plugins":marketplace::installed(&state)?,"pluginSources":marketplace::sources(&state)?,"downloads":state.downloads.lock().map_err(db_error)?.values().cloned().collect::<Vec<_>>(),"device":{"os":std::env::consts::OS,"arch":std::env::consts::ARCH,"threads":std::thread::available_parallelism().map(|n|n.get()).unwrap_or(1),"version":env!("CARGO_PKG_VERSION")}}),
    )
}
#[tauri::command]
fn save_settings(settings: Value, state: State<'_, AppState>) -> Result<Value, String> {
    let mut validated = validate_settings(&settings)?;
    let current = state.settings()?;
    for key in [
        "computerEnabled",
        "computerInput",
        "computerBotIds",
        "computerExpiresAt",
    ] {
        validated[key] = current[key].clone();
    }
    state
        .lock()?
        .execute(
            "INSERT OR REPLACE INTO preferences(key,value) VALUES('settings',?1)",
            [validated.to_string()],
        )
        .map_err(db_error)?;
    Ok(validated)
}
#[tauri::command]
fn save_bot(mut bot: Bot, state: State<'_, AppState>) -> Result<Bot, String> {
    for (text, max) in [
        (&bot.name, 60),
        (&bot.role, 100),
        (&bot.description, 300),
        (&bot.instructions, 12000),
    ] {
        if text.chars().count() > max {
            return Err(format!("Keep this field under {max} characters"));
        }
    }
    bot.name = bot.name.trim().to_string();
    if bot.name.is_empty() {
        return Err("Give your teammate a name".into());
    }
    if bot.id.is_empty() {
        bot.id = Uuid::new_v4().to_string();
    }
    if bot.id.len() > 80
        || !bot
            .id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
        return Err("Invalid teammate identifier".into());
    }
    if bot.color.len() != 7
        || !bot.color.starts_with('#')
        || !bot.color[1..].chars().all(|c| c.is_ascii_hexdigit())
    {
        return Err("Choose a valid teammate color".into());
    }
    if !bot.provider_id.is_empty() && state.connection(&bot.provider_id)?.kind != "model" {
        return Err("Choose a model connection".into());
    }
    state.lock()?.execute("INSERT INTO bots(id,name,role,description,instructions,color,provider_id,model_label) VALUES(?1,?2,?3,?4,?5,?6,?7,'Configured') ON CONFLICT(id) DO UPDATE SET name=excluded.name,role=excluded.role,description=excluded.description,instructions=excluded.instructions,color=excluded.color,provider_id=excluded.provider_id",params![bot.id,bot.name,bot.role,bot.description,bot.instructions,bot.color,bot.provider_id]).map_err(db_error)?;
    Ok(bot)
}
#[tauri::command(rename_all = "camelCase")]
fn delete_bot(bot_id: String, state: State<'_, AppState>) -> Result<(), String> {
    if state.bots()?.len() <= 1 {
        return Err("Keep at least one teammate in your workspace".into());
    }
    let count: i64 = state
        .lock()?
        .query_row(
            "SELECT COUNT(*) FROM tasks WHERE bot_id=?1",
            [&bot_id],
            |r| r.get(0),
        )
        .map_err(db_error)?;
    if count > 0 {
        return Err("This teammate has task history. You can edit its name, instructions, and model instead.".into());
    }
    state
        .lock()?
        .execute("DELETE FROM bots WHERE id=?1", [bot_id])
        .map_err(db_error)?;
    Ok(())
}
#[tauri::command(rename_all = "camelCase")]
fn create_task(
    title: String,
    description: String,
    bot_id: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let title = title.trim();
    if title.is_empty() || title.chars().count() > 160 {
        return Err("Use a task title between 1 and 160 characters".into());
    }
    if description.chars().count() > 16000 {
        return Err("Keep task details under 16,000 characters".into());
    }
    if !state.bots()?.iter().any(|b| b.id == bot_id) {
        return Err("Choose an available teammate".into());
    }
    let id = Uuid::new_v4().to_string();
    state.lock()?.execute("INSERT INTO tasks(id,title,description,bot_id,status,created_at,updated_at) VALUES(?1,?2,?3,?4,'queued',?5,?5)",params![id,title,description.trim(),bot_id,now()]).map_err(db_error)?;
    state.event(&id, "Task created")?;
    Ok(id)
}
#[tauri::command(rename_all = "camelCase")]
fn task_events(task_id: String, state: State<'_, AppState>) -> Result<Vec<TaskEvent>, String> {
    let db = state.lock()?;
    let mut stmt = db
        .prepare("SELECT id,message,created_at FROM task_events WHERE task_id=?1 ORDER BY id")
        .map_err(db_error)?;
    let rows = stmt
        .query_map([task_id], |r| {
            Ok(TaskEvent {
                id: r.get(0)?,
                message: r.get(1)?,
                created_at: r.get(2)?,
            })
        })
        .map_err(db_error)?;
    rows.collect::<Result<Vec<_>, _>>().map_err(db_error)
}
fn launch(app: tauri::AppHandle, task_id: String, resume: bool) -> Result<(), String> {
    let state = app.state::<AppState>();
    let task = state.task(&task_id)?;
    if task.status == "running" {
        return Err("This task is already running".into());
    }
    if task.waiting_approval && !resume {
        return Err("Review the pending approval first".into());
    }
    if !task.waiting_child.is_empty() && !resume {
        return Err("Cancel this run and its delegated work before starting it again".into());
    }
    let limit = state.settings()?["maxConcurrentRuns"].as_i64().unwrap_or(3);
    let bot = state
        .bots()?
        .into_iter()
        .find(|b| b.id == task.bot_id)
        .ok_or("Teammate not found")?;
    if bot.provider_id.is_empty() {
        return Err("Choose a model in this teammate's settings before running a task".into());
    }
    let provider = state.connection(&bot.provider_id)?;
    if provider.kind != "model" {
        return Err("Choose a model connection".into());
    }
    let _ = connection_secret(&provider)?;
    let budget = state.settings()?["rootStepBudget"].as_i64().unwrap_or(60);
    let changed = state.lock()?.execute("UPDATE tasks SET status='running',waiting_approval=0,error='',output=CASE WHEN ?3 THEN output ELSE '' END,generation=generation+CASE WHEN ?3 THEN 0 ELSE 1 END,root_id=CASE WHEN root_id='' THEN id ELSE root_id END,budget_remaining=CASE WHEN NOT ?3 AND parent_id='' THEN ?4 ELSE budget_remaining END,updated_at=?2 WHERE id=?1 AND status<>'running' AND (waiting_approval=0 OR ?3) AND (SELECT COUNT(*) FROM tasks WHERE status='running')<?5",params![task_id,now(),resume,budget,limit]).map_err(db_error)?;
    if changed != 1 {
        return Err("Your concurrent task limit is reached, or this task is already running. Wait or increase the limit in Preferences.".into());
    }
    state.event(
        &task_id,
        if resume {
            "Resuming after your decision"
        } else {
            "Run started"
        },
    )?;
    let id = task_id.clone();
    let app_copy = app.clone();
    let mut active = state.active.lock().map_err(db_error)?;
    let handle = tauri::async_runtime::spawn(async move {
        let result = agent::run(&app_copy, &id, resume).await;
        let state = app_copy.state::<AppState>();
        if let Err(error) = result {
            let _=state.lock().and_then(|db|db.execute("UPDATE tasks SET status='failed',error=?2,updated_at=?3 WHERE id=?1 AND status='running'",params![id,error,now()]).map_err(db_error));
            let _ = state.event(&id, &format!("Run stopped: {error}"));
        }
        if let Ok(mut active) = state.active.lock() {
            active.remove(&id);
        }
        let _ = app_copy.emit("workspace-updated", json!({"taskId":id}));
    });
    active.insert(task_id, handle.inner().abort_handle());
    Ok(())
}
#[tauri::command(rename_all = "camelCase")]
fn start_task(task_id: String, app: tauri::AppHandle) -> Result<(), String> {
    launch(app, task_id, false)
}
#[tauri::command(rename_all = "camelCase")]
fn cancel_task(task_id: String, app: tauri::AppHandle) -> Result<(), String> {
    let state = app.state::<AppState>();
    orchestration::cancel_tree(&state, &task_id)?;
    let _ = app.emit("workspace-updated", json!({"taskId":task_id}));
    Ok(())
}
#[tauri::command(rename_all = "camelCase")]
fn decide_approval(
    approval_id: String,
    decision: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    if !["approved", "rejected"].contains(&decision.as_str()) {
        return Err("Choose approve or reject".into());
    }
    let state = app.state::<AppState>();
    let task_id: String = state
        .lock()?
        .query_row(
            "SELECT task_id FROM approvals WHERE id=?1 AND status='pending'",
            [&approval_id],
            |r| r.get(0),
        )
        .optional()
        .map_err(db_error)?
        .ok_or("This approval is no longer pending")?;
    let changed = state
        .lock()?
        .execute(
            "UPDATE approvals SET status=?2 WHERE id=?1 AND status='pending'",
            params![approval_id, decision],
        )
        .map_err(db_error)?;
    if changed == 0 {
        return Err("This approval is no longer pending".into());
    }
    // The persisted continuation contains the exact proposal that was reviewed.
    if let Err(error) = launch(app.clone(), task_id, true) {
        state
            .lock()?
            .execute(
                "UPDATE approvals SET status='pending' WHERE id=?1",
                [approval_id],
            )
            .map_err(db_error)?;
        return Err(error);
    }
    Ok(())
}
#[tauri::command]
async fn probe_model(input: ConnectionInput, state: State<'_, AppState>) -> Result<Value, String> {
    let token = if input.secret.is_empty() && !input.id.is_empty() {
        connection_secret(&state.connection(&input.id)?)?
    } else {
        input.secret.clone()
    };
    services::probe_model(&state.client, &input.config, &token).await
}
#[tauri::command]
async fn save_connection(
    mut input: ConnectionInput,
    state: State<'_, AppState>,
) -> Result<Connection, String> {
    if !input.id.is_empty() && state.connection(&input.id)?.config["pluginId"].is_string() {
        return Err("Manage this connection through its installed plugin in Marketplace".into());
    }
    if input.label.trim().is_empty() || input.label.chars().count() > 80 {
        return Err("Use a connection name between 1 and 80 characters".into());
    }
    let token = if input.secret.is_empty() && !input.id.is_empty() {
        connection_secret(&state.connection(&input.id)?)?
    } else {
        input.secret.clone()
    };
    if input.id.is_empty() {
        input.id = Uuid::new_v4().to_string();
    }
    let (mut config, account) =
        services::verify_connection(&state.client, &input.kind, &input.config, &token).await?;
    config["hasSecret"] = json!(!token.is_empty());
    if !token.is_empty() {
        write_secret(&input.id, &token)?;
    }
    let c = Connection {
        id: input.id,
        kind: input.kind,
        label: input.label.trim().to_string(),
        config,
        account,
        verified_at: now(),
    };
    let db = state.lock()?;
    db.execute("INSERT INTO connections(id,kind,label,config,account,verified_at) VALUES(?1,?2,?3,?4,?5,?6) ON CONFLICT(id) DO UPDATE SET kind=excluded.kind,label=excluded.label,config=excluded.config,account=excluded.account,verified_at=excluded.verified_at",params![c.id,c.kind,c.label,c.config.to_string(),c.account,c.verified_at]).map_err(db_error)?;
    if c.kind == "model" {
        db.execute(
            "UPDATE bots SET provider_id=?1 WHERE provider_id=''",
            [&c.id],
        )
        .map_err(db_error)?;
    }
    Ok(c)
}
#[tauri::command(rename_all = "camelCase")]
async fn test_connection(
    connection_id: String,
    state: State<'_, AppState>,
) -> Result<Value, String> {
    let c = state.connection(&connection_id)?;
    let token = connection_secret(&c)?;
    let account = if c.kind == "mcp" && c.config["transport"] == "stdio" {
        let result = stdio::request(&c, &token, "tools/list", json!({})).await?;
        let list = result["tools"]
            .as_array()
            .filter(|v| v.len() <= 100)
            .ok_or("The server must expose at most 100 tools")?;
        // Health checks never replace the catalog used by pending approvals.
        // A reviewed plugin installation is the path for adopting new tools.
        format!("{} tools", list.len())
    } else {
        services::verify_connection(&state.client, &c.kind, &c.config, &token)
            .await?
            .1
    };
    state
        .lock()?
        .execute(
            "UPDATE connections SET verified_at=?2,account=?3 WHERE id=?1",
            params![c.id, now(), account],
        )
        .map_err(db_error)?;
    Ok(json!({"account":account,"ok":true}))
}
#[tauri::command(rename_all = "camelCase")]
fn remove_connection(connection_id: String, app: tauri::AppHandle) -> Result<(), String> {
    let state = app.state::<AppState>();
    let connection = state.connection(&connection_id)?;
    if connection.config["pluginId"].is_string() {
        return Err(
            "Uninstall this plugin from Marketplace to remove its connection and managed runtime"
                .into(),
        );
    }
    if connection.config["hasSecret"] == true {
        match secret_entry(&connection_id)?.delete_credential() {
            Ok(()) | Err(keyring::Error::NoEntry) => {}
            Err(_) => return Err(
                "Unlock the credential store before disconnecting so its secret can be removed."
                    .into(),
            ),
        }
    }
    // Cancel active requests before revoking the shared tool connection.
    state.active.lock().map_err(db_error)?.retain(|id, handle| {
        if id.starts_with("download:") {
            true
        } else {
            handle.abort();
            false
        }
    });
    let db = state.lock()?;
    db.execute("UPDATE tasks SET status='paused',error='A connection was disconnected. Review connections and run again.' WHERE status='running'",[]).map_err(db_error)?;
    db.execute(
        "UPDATE bots SET provider_id='' WHERE provider_id=?1",
        [&connection_id],
    )
    .map_err(db_error)?;
    db.execute("DELETE FROM connections WHERE id=?1", [&connection_id])
        .map_err(db_error)?;
    Ok(())
}
#[tauri::command(rename_all = "camelCase")]
async fn browse_connection(
    connection_id: String,
    action: String,
    arguments: Value,
    state: State<'_, AppState>,
) -> Result<Value, String> {
    let c = state.connection(&connection_id)?;
    let token = connection_secret(&c)?;
    let allowed = match c.kind.as_str() {
        "github" => ["repositories", "issues"].contains(&action.as_str()),
        "slack" => ["channels", "history"].contains(&action.as_str()),
        "mcp" => action == "tools",
        _ => false,
    };
    if !allowed {
        return Err("This action is not available in the connection browser".into());
    }
    services::integration_action(&state.client, &c, &token, &action, &arguments).await
}
#[tauri::command]
fn open_external(url: String) -> Result<(), String> {
    let parsed = reqwest::Url::parse(&url).map_err(|_| "Invalid link")?;
    if parsed.scheme() != "https" || !parsed.username().is_empty() || parsed.password().is_some() {
        return Err("Only secure web links can be opened".into());
    }
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        std::process::Command::new("rundll32.exe")
            .args(["url.dll,FileProtocolHandler", &url])
            .creation_flags(0x08000000)
            .spawn()
            .map_err(db_error)?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(db_error)?;
    }
    Ok(())
}
fn main() {
    let mut builder = tauri::Builder::default();
    if std::env::var_os("TEAMMATE_DATA_DIR").is_none() {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _, _| {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.show();
                let _ = w.set_focus();
            }
        }));
    }
    builder
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--background"]),
        ))
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let dir = if let Some(value) = std::env::var_os("TEAMMATE_DATA_DIR") {
                let path = PathBuf::from(value);
                if !path.is_absolute() {
                    return Err(std::io::Error::other(
                        "TEAMMATE_DATA_DIR must be an absolute directory",
                    )
                    .into());
                }
                path
            } else {
                app.path().app_data_dir()?
            };
            let db = open_database(&dir.join("teammate.sqlite3")).map_err(std::io::Error::other)?;
            let client = reqwest::Client::builder()
                .user_agent("Teammate/0.3")
                .connect_timeout(std::time::Duration::from_secs(10))
                .timeout(std::time::Duration::from_secs(180))
                .redirect(reqwest::redirect::Policy::none())
                .build()?;
            app.manage(AppState {
                db: Mutex::new(db),
                data_dir: dir,
                client,
                active: Mutex::new(HashMap::new()),
                downloads: Mutex::new(HashMap::new()),
            });
            computer::reset(&app.state::<AppState>()).map_err(std::io::Error::other)?;
            desktop::setup(app)?;
            orchestration::start(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            bootstrap,
            save_settings,
            save_bot,
            delete_bot,
            create_task,
            task_events,
            start_task,
            cancel_task,
            decide_approval,
            probe_model,
            save_connection,
            test_connection,
            remove_connection,
            browse_connection,
            open_external,
            computer::set_computer_access,
            computer::computer_preview,
            desktop::autostart_status,
            desktop::set_autostart,
            marketplace::marketplace_search,
            marketplace::save_plugin_source,
            marketplace::delete_plugin_source,
            marketplace::review_plugin,
            marketplace::import_plugin,
            marketplace::install_plugin,
            marketplace::uninstall_plugin,
            marketplace::toggle_plugin,
            marketplace::plugin_theme,
            orchestration::save_schedule,
            orchestration::schedule_list,
            orchestration::schedule_history,
            orchestration::delete_schedule,
            orchestration::run_schedule_now,
            models::local_models,
            models::download_model,
            models::cancel_download
        ])
        .build(tauri::generate_context!())
        .expect("Teammate could not start")
        .run(|app, event| {
            if matches!(event, tauri::RunEvent::Exit) {
                desktop::stop(app);
                if let Ok(active) = app.state::<AppState>().active.lock() {
                    for h in active.values() {
                        h.abort();
                    }
                }
                tauri::async_runtime::block_on(stdio::stop_all());
            }
        });
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn settings_validate_and_ignore_unknown_keys() {
        let mut s = defaults();
        s["workspaceName"] = json!("  Studio  ");
        s["token"] = json!("never-save");
        let v = validate_settings(&s).unwrap();
        assert_eq!(v["workspaceName"], "Studio");
        assert!(v.get("token").is_none());
        s["accent"] = json!("url(evil)");
        assert!(validate_settings(&s).is_err());
        s = defaults();
        s["maxSteps"] = json!(999);
        assert!(validate_settings(&s).is_err());
    }
    #[test]
    fn migration_preserves_tasks_and_removes_demo() {
        let path = std::env::temp_dir().join(format!("teammate-{}.sqlite3", Uuid::new_v4()));
        {
            let db = open_database(&path).unwrap();
            db.execute("INSERT INTO tasks(id,title,bot_id,status,created_at,updated_at) VALUES('real','Keep me','research','running',1,1)",[]).unwrap();
            db.execute("INSERT INTO tasks(id,title,bot_id,status,created_at,updated_at,is_demo) VALUES('demo','Remove me','research','queued',1,1,1)",[]).unwrap();
        }
        {
            let db = open_database(&path).unwrap();
            assert_eq!(
                db.query_row("SELECT status FROM tasks WHERE id='real'", [], |r| r
                    .get::<_, String>(0))
                    .unwrap(),
                "paused"
            );
            assert_eq!(
                db.query_row("SELECT COUNT(*) FROM tasks WHERE is_demo=1", [], |r| r
                    .get::<_, i64>(0))
                    .unwrap(),
                0
            );
        }
        let _ = fs::remove_file(path);
    }
    #[cfg(windows)]
    #[test]
    fn credential_store_roundtrip() {
        let id = format!("test-{}", Uuid::new_v4());
        write_secret(&id, "test-value-only").unwrap();
        assert_eq!(read_secret(&id).unwrap(), "test-value-only");
        secret_entry(&id).unwrap().delete_credential().unwrap();
        assert!(read_secret(&id).unwrap().is_empty());
    }
}
