#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rusqlite::{params, Connection, OptionalExtension};
use serde::Serialize;
use std::{
    fs,
    path::PathBuf,
    sync::Mutex,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{Manager, State};
use uuid::Uuid;

struct AppState {
    db: Mutex<Connection>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct Bot {
    id: String,
    name: String,
    role: String,
    description: String,
    model_label: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct Task {
    id: String,
    title: String,
    description: String,
    bot_id: String,
    bot_name: String,
    status: String,
    created_at: i64,
    updated_at: i64,
    is_demo: bool,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct Approval {
    id: String,
    task_id: String,
    task_title: String,
    bot_name: String,
    title: String,
    target: String,
    summary: String,
    status: String,
    created_at: i64,
    is_demo: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Dashboard {
    bots: Vec<Bot>,
    tasks: Vec<Task>,
    approvals: Vec<Approval>,
    queued_count: usize,
    completed_count: usize,
    pending_approval_count: usize,
}

fn now() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}

fn open_database(path: PathBuf) -> Result<Connection, Box<dyn std::error::Error>> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let db = Connection::open(path)?;
    db.execute_batch(
        "PRAGMA foreign_keys = ON;
         PRAGMA journal_mode = WAL;
         CREATE TABLE IF NOT EXISTS bots (
             id TEXT PRIMARY KEY,
             name TEXT NOT NULL,
             role TEXT NOT NULL,
             description TEXT NOT NULL,
             model_label TEXT NOT NULL
         );
         CREATE TABLE IF NOT EXISTS tasks (
             id TEXT PRIMARY KEY,
             title TEXT NOT NULL,
             description TEXT NOT NULL DEFAULT '',
             bot_id TEXT NOT NULL REFERENCES bots(id),
             status TEXT NOT NULL CHECK(status IN ('queued','running','paused','completed','failed','canceled')),
             created_at INTEGER NOT NULL,
             updated_at INTEGER NOT NULL,
             is_demo INTEGER NOT NULL DEFAULT 0
         );
         CREATE TABLE IF NOT EXISTS approvals (
             id TEXT PRIMARY KEY,
             task_id TEXT NOT NULL REFERENCES tasks(id),
             title TEXT NOT NULL,
             target TEXT NOT NULL,
             summary TEXT NOT NULL,
             status TEXT NOT NULL CHECK(status IN ('pending','approved','rejected')),
             created_at INTEGER NOT NULL,
             is_demo INTEGER NOT NULL DEFAULT 0
         );
         CREATE TABLE IF NOT EXISTS task_events (
             id INTEGER PRIMARY KEY AUTOINCREMENT,
             task_id TEXT NOT NULL REFERENCES tasks(id),
             message TEXT NOT NULL,
             created_at INTEGER NOT NULL
         );",
    )?;
    seed_database(&db)?;
    Ok(db)
}

fn seed_database(db: &Connection) -> rusqlite::Result<()> {
    let bots = [
        (
            "research",
            "Research",
            "Research teammate",
            "Find, analyze, and synthesize information.",
        ),
        (
            "operations",
            "Operations",
            "Operations teammate",
            "Keep recurring work organized and moving.",
        ),
        (
            "code",
            "Code",
            "Software teammate",
            "Build, fix, and improve software.",
        ),
    ];
    for (id, name, role, description) in bots {
        db.execute(
            "INSERT OR IGNORE INTO bots (id, name, role, description, model_label) VALUES (?1, ?2, ?3, ?4, 'Not connected')",
            params![id, name, role, description],
        )?;
    }

    let task_count: i64 = db.query_row("SELECT COUNT(*) FROM tasks", [], |row| row.get(0))?;
    if task_count == 0 {
        let timestamp = now();
        let task_id = "example-task";
        db.execute(
            "INSERT INTO tasks (id, title, description, bot_id, status, created_at, updated_at, is_demo)
             VALUES (?1, ?2, ?3, 'research', 'queued', ?4, ?4, 1)",
            params![
                task_id,
                "Research AI meeting note tools",
                "Example task. Connect a model before assigning real work.",
                timestamp
            ],
        )?;
        db.execute(
            "INSERT INTO task_events (task_id, message, created_at) VALUES (?1, 'Example task created. Model execution is not connected yet.', ?2)",
            params![task_id, timestamp],
        )?;
        db.execute(
            "INSERT INTO approvals (id, task_id, title, target, summary, status, created_at, is_demo)
             VALUES ('example-approval', ?1, 'Send recommendation to Product team', 'product-team@example.com', 'Example approval only. No email will be sent.', 'pending', ?2, 1)",
            params![task_id, timestamp],
        )?;
    }
    Ok(())
}

fn read_bots(db: &Connection) -> rusqlite::Result<Vec<Bot>> {
    let mut statement = db.prepare(
        "SELECT id, name, role, description, model_label FROM bots ORDER BY name COLLATE NOCASE",
    )?;
    let rows = statement.query_map([], |row| {
        Ok(Bot {
            id: row.get(0)?,
            name: row.get(1)?,
            role: row.get(2)?,
            description: row.get(3)?,
            model_label: row.get(4)?,
        })
    })?;
    rows.collect()
}

fn read_tasks(db: &Connection) -> rusqlite::Result<Vec<Task>> {
    let mut statement = db.prepare(
        "SELECT t.id, t.title, t.description, t.bot_id, b.name, t.status, t.created_at, t.updated_at, t.is_demo
         FROM tasks t JOIN bots b ON b.id = t.bot_id
         ORDER BY t.created_at DESC",
    )?;
    let rows = statement.query_map([], |row| {
        Ok(Task {
            id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            bot_id: row.get(3)?,
            bot_name: row.get(4)?,
            status: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
            is_demo: row.get::<_, i64>(8)? != 0,
        })
    })?;
    rows.collect()
}

fn read_approvals(db: &Connection) -> rusqlite::Result<Vec<Approval>> {
    let mut statement = db.prepare(
        "SELECT a.id, a.task_id, t.title, b.name, a.title, a.target, a.summary, a.status, a.created_at, a.is_demo
         FROM approvals a
         JOIN tasks t ON t.id = a.task_id
         JOIN bots b ON b.id = t.bot_id
         ORDER BY CASE a.status WHEN 'pending' THEN 0 ELSE 1 END, a.created_at DESC",
    )?;
    let rows = statement.query_map([], |row| {
        Ok(Approval {
            id: row.get(0)?,
            task_id: row.get(1)?,
            task_title: row.get(2)?,
            bot_name: row.get(3)?,
            title: row.get(4)?,
            target: row.get(5)?,
            summary: row.get(6)?,
            status: row.get(7)?,
            created_at: row.get(8)?,
            is_demo: row.get::<_, i64>(9)? != 0,
        })
    })?;
    rows.collect()
}

#[tauri::command]
fn get_dashboard(state: State<'_, AppState>) -> Result<Dashboard, String> {
    let db = state
        .db
        .lock()
        .map_err(|_| "Database is busy".to_string())?;
    let bots = read_bots(&db).map_err(|error| error.to_string())?;
    let tasks = read_tasks(&db).map_err(|error| error.to_string())?;
    let approvals = read_approvals(&db).map_err(|error| error.to_string())?;
    let queued_count = tasks.iter().filter(|task| task.status == "queued").count();
    let completed_count = tasks
        .iter()
        .filter(|task| task.status == "completed")
        .count();
    let pending_approval_count = approvals
        .iter()
        .filter(|item| item.status == "pending")
        .count();
    Ok(Dashboard {
        bots,
        tasks,
        approvals,
        queued_count,
        completed_count,
        pending_approval_count,
    })
}

#[tauri::command(rename_all = "camelCase")]
fn create_task(
    title: String,
    description: String,
    bot_id: String,
    state: State<'_, AppState>,
) -> Result<Task, String> {
    let title = title.trim();
    let description = description.trim();
    if title.is_empty() || title.chars().count() > 160 {
        return Err("Task title must be between 1 and 160 characters".to_string());
    }
    if description.chars().count() > 8000 {
        return Err("Task details must be 8,000 characters or fewer".to_string());
    }
    let db = state
        .db
        .lock()
        .map_err(|_| "Database is busy".to_string())?;
    let bot_exists: bool = db
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM bots WHERE id = ?1)",
            [&bot_id],
            |row| row.get(0),
        )
        .map_err(|error| error.to_string())?;
    if !bot_exists {
        return Err("Choose an available bot".to_string());
    }
    let id = Uuid::new_v4().to_string();
    let timestamp = now();
    db.execute(
        "INSERT INTO tasks (id, title, description, bot_id, status, created_at, updated_at, is_demo)
         VALUES (?1, ?2, ?3, ?4, 'queued', ?5, ?5, 0)",
        params![id, title, description, bot_id, timestamp],
    )
    .map_err(|error| error.to_string())?;
    db.execute(
        "INSERT INTO task_events (task_id, message, created_at) VALUES (?1, 'Task saved locally. Connect a model to start it.', ?2)",
        params![id, timestamp],
    )
    .map_err(|error| error.to_string())?;
    let task = db
        .query_row(
            "SELECT t.id, t.title, t.description, t.bot_id, b.name, t.status, t.created_at, t.updated_at, t.is_demo
             FROM tasks t JOIN bots b ON b.id = t.bot_id WHERE t.id = ?1",
            [&id],
            |row| {
                Ok(Task {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    description: row.get(2)?,
                    bot_id: row.get(3)?,
                    bot_name: row.get(4)?,
                    status: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                    is_demo: row.get::<_, i64>(8)? != 0,
                })
            },
        )
        .map_err(|error| error.to_string())?;
    Ok(task)
}

#[tauri::command(rename_all = "camelCase")]
fn cancel_task(task_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let db = state
        .db
        .lock()
        .map_err(|_| "Database is busy".to_string())?;
    let status: Option<String> = db
        .query_row(
            "SELECT status FROM tasks WHERE id = ?1",
            [&task_id],
            |row| row.get(0),
        )
        .optional()
        .map_err(|error| error.to_string())?;
    let Some(status) = status else {
        return Err("Task not found".to_string());
    };
    if !matches!(status.as_str(), "queued" | "paused" | "running") {
        return Err("This task can no longer be canceled".to_string());
    }
    let timestamp = now();
    db.execute(
        "UPDATE tasks SET status = 'canceled', updated_at = ?2 WHERE id = ?1",
        params![task_id, timestamp],
    )
    .map_err(|error| error.to_string())?;
    db.execute(
        "INSERT INTO task_events (task_id, message, created_at) VALUES (?1, 'Task canceled by you.', ?2)",
        params![task_id, timestamp],
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command(rename_all = "camelCase")]
fn decide_approval(
    approval_id: String,
    decision: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    if !matches!(decision.as_str(), "approved" | "rejected") {
        return Err("Choose approve or reject".to_string());
    }
    let db = state
        .db
        .lock()
        .map_err(|_| "Database is busy".to_string())?;
    let approval: Option<(String, i64)> = db
        .query_row(
            "SELECT task_id, is_demo FROM approvals WHERE id = ?1 AND status = 'pending'",
            [&approval_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()
        .map_err(|error| error.to_string())?;
    let Some((task_id, is_demo)) = approval else {
        return Err("This approval is no longer pending".to_string());
    };
    if is_demo != 1 {
        return Err("External actions are not connected in this prototype".to_string());
    }
    let timestamp = now();
    db.execute(
        "UPDATE approvals SET status = ?2 WHERE id = ?1 AND status = 'pending'",
        params![approval_id, decision],
    )
    .map_err(|error| error.to_string())?;
    let message = if decision == "approved" {
        "Example approval recorded. No email was sent."
    } else {
        "Example approval rejected. No email was sent."
    };
    db.execute(
        "INSERT INTO task_events (task_id, message, created_at) VALUES (?1, ?2, ?3)",
        params![task_id, message, timestamp],
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let path = app.path().app_data_dir()?.join("teammate.sqlite3");
            let db = open_database(path)?;
            app.manage(AppState { db: Mutex::new(db) });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_dashboard,
            create_task,
            cancel_task,
            decide_approval
        ])
        .run(tauri::generate_context!())
        .expect("Teammate failed to start");
}
