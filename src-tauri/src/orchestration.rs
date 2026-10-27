use crate::{db_error, now, AppState};
use chrono::{Datelike, LocalResult, NaiveTime, TimeZone};
use chrono_tz::Tz;
use rusqlite::{params, OptionalExtension};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::{Emitter, Manager, State};

pub fn migrate(db: &rusqlite::Connection) -> Result<(), String> {
    db.execute_batch("CREATE TABLE IF NOT EXISTS schedules(id TEXT PRIMARY KEY,name TEXT NOT NULL,bot_id TEXT NOT NULL REFERENCES bots(id),title TEXT NOT NULL,description TEXT NOT NULL,config TEXT NOT NULL,enabled INTEGER NOT NULL,next_run_at INTEGER NOT NULL,last_run_at INTEGER NOT NULL DEFAULT 0,last_task_id TEXT NOT NULL DEFAULT '',last_error TEXT NOT NULL DEFAULT '');
      CREATE TABLE IF NOT EXISTS schedule_runs(id TEXT PRIMARY KEY,schedule_id TEXT NOT NULL,scheduled_for INTEGER NOT NULL,task_id TEXT NOT NULL,status TEXT NOT NULL,created_at INTEGER NOT NULL,UNIQUE(schedule_id,scheduled_for));
      CREATE UNIQUE INDEX IF NOT EXISTS delegate_once ON tasks(parent_id,parent_generation,delegate_call_id) WHERE parent_id<>'';
      CREATE INDEX IF NOT EXISTS task_root ON tasks(root_id);
      CREATE INDEX IF NOT EXISTS schedule_due ON schedules(enabled,next_run_at);
      UPDATE tasks SET root_id=id WHERE root_id='';").map_err(db_error)
}
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Schedule {
    #[serde(default)]
    pub id: String,
    pub name: String,
    pub bot_id: String,
    pub title: String,
    pub description: String,
    pub config: Value,
    pub enabled: bool,
    #[serde(default)]
    pub next_run_at: i64,
    #[serde(default)]
    pub last_run_at: i64,
    #[serde(default)]
    pub last_task_id: String,
    #[serde(default)]
    pub last_error: String,
}
fn validate_config(config: &Value) -> Result<(), String> {
    match config["kind"].as_str().unwrap_or("") {
        "once" => {
            if config["at"].as_i64().filter(|n| *n > 0).is_none() {
                return Err("Choose a valid date and time".into());
            }
        }
        "interval" => {
            if !config["seconds"]
                .as_i64()
                .is_some_and(|n| (60..=31_536_000).contains(&n))
            {
                return Err("Use an interval between one minute and one year".into());
            }
        }
        "daily" | "weekly" => {
            config["timezone"]
                .as_str()
                .ok_or("Choose a time zone")?
                .parse::<Tz>()
                .map_err(|_| "Choose a valid IANA time zone")?;
            NaiveTime::parse_from_str(config["time"].as_str().unwrap_or(""), "%H:%M")
                .map_err(|_| "Use a time in HH:MM format")?;
            if config["kind"] == "weekly"
                && !config["days"].as_array().is_some_and(|v| {
                    !v.is_empty()
                        && v.len() <= 7
                        && v.iter().all(|n| n.as_u64().is_some_and(|d| d <= 6))
                })
            {
                return Err("Choose at least one weekday".into());
            }
        }
        _ => return Err("Choose once, interval, daily, or weekly".into()),
    }
    if !["run_once", "skip"].contains(&config["missed"].as_str().unwrap_or("run_once")) {
        return Err("Choose a supported missed-run policy".into());
    }
    Ok(())
}
pub fn next_occurrence(config: &Value, after: i64) -> Result<Option<i64>, String> {
    validate_config(config)?;
    match config["kind"].as_str().unwrap() {
        "once" => Ok(config["at"].as_i64().filter(|n| *n > after)),
        "interval" => Ok(Some(
            after
                .checked_add(config["seconds"].as_i64().unwrap())
                .ok_or("Schedule date is too far away")?,
        )),
        _ => {
            let zone = config["timezone"].as_str().unwrap().parse::<Tz>().unwrap();
            let time =
                NaiveTime::parse_from_str(config["time"].as_str().unwrap(), "%H:%M").unwrap();
            let date = zone
                .timestamp_opt(after, 0)
                .single()
                .ok_or("Invalid schedule date")?
                .date_naive();
            for offset in 0..15 {
                let date = date
                    .checked_add_signed(chrono::Duration::days(offset))
                    .ok_or("Schedule date is too far away")?;
                if config["kind"] == "weekly"
                    && !config["days"]
                        .as_array()
                        .unwrap()
                        .iter()
                        .any(|v| v.as_u64() == Some(date.weekday().num_days_from_sunday() as u64))
                {
                    continue;
                }
                // A missing wall-clock time is skipped; a repeated time runs at its first occurrence.
                let candidate = match zone.from_local_datetime(&date.and_time(time)) {
                    LocalResult::Single(v) => Some(v),
                    LocalResult::Ambiguous(a, b) => Some(a.min(b)),
                    LocalResult::None => None,
                };
                if let Some(v) = candidate.filter(|v| v.timestamp() > after) {
                    return Ok(Some(v.timestamp()));
                }
            }
            Err("No valid occurrence was found in the next two weeks".into())
        }
    }
}
pub fn list(state: &AppState) -> Result<Vec<Schedule>, String> {
    let db = state.lock()?;
    let mut q=db.prepare("SELECT id,name,bot_id,title,description,config,enabled,next_run_at,last_run_at,last_task_id,last_error FROM schedules ORDER BY enabled DESC,next_run_at").map_err(db_error)?;
    let rows = q
        .query_map([], |r| {
            Ok(Schedule {
                id: r.get(0)?,
                name: r.get(1)?,
                bot_id: r.get(2)?,
                title: r.get(3)?,
                description: r.get(4)?,
                config: serde_json::from_str(&r.get::<_, String>(5)?).unwrap_or(json!({})),
                enabled: r.get::<_, i64>(6)? != 0,
                next_run_at: r.get(7)?,
                last_run_at: r.get(8)?,
                last_task_id: r.get(9)?,
                last_error: r.get(10)?,
            })
        })
        .map_err(db_error)?;
    rows.collect::<Result<_, _>>().map_err(db_error)
}
#[tauri::command]
pub fn schedule_list(state: State<'_, AppState>) -> Result<Vec<Schedule>, String> {
    list(&state)
}
#[tauri::command]
pub fn save_schedule(
    mut schedule: Schedule,
    state: State<'_, AppState>,
) -> Result<Schedule, String> {
    validate_config(&schedule.config)?;
    schedule.name = schedule.name.trim().into();
    schedule.title = schedule.title.trim().into();
    if schedule.name.is_empty()
        || schedule.name.chars().count() > 100
        || schedule.title.is_empty()
        || schedule.title.chars().count() > 160
        || schedule.description.chars().count() > 16000
    {
        return Err(
            "Give this routine a name, a task title, and context under 16,000 characters".into(),
        );
    }
    let bot = state
        .bots()?
        .into_iter()
        .find(|b| b.id == schedule.bot_id)
        .ok_or("Choose an available teammate")?;
    if schedule.enabled
        && (bot.provider_id.is_empty() || state.connection(&bot.provider_id).is_err())
    {
        return Err("Connect a model for this teammate before enabling the routine".into());
    }
    if schedule.id.is_empty() {
        schedule.id = uuid::Uuid::new_v4().to_string();
    } else if !list(&state)?.iter().any(|v| v.id == schedule.id) {
        return Err("This routine was removed".into());
    }
    let current = now();
    schedule.next_run_at = if schedule.config["kind"] == "once" {
        schedule.config["at"].as_i64().unwrap()
    } else {
        next_occurrence(&schedule.config, current)?.unwrap_or(0)
    };
    if schedule.enabled && schedule.next_run_at < current - 60 {
        return Err("Choose a future first run".into());
    }
    state.lock()?.execute("INSERT INTO schedules(id,name,bot_id,title,description,config,enabled,next_run_at) VALUES(?1,?2,?3,?4,?5,?6,?7,?8) ON CONFLICT(id) DO UPDATE SET name=excluded.name,bot_id=excluded.bot_id,title=excluded.title,description=excluded.description,config=excluded.config,enabled=excluded.enabled,next_run_at=excluded.next_run_at,last_error=''",params![schedule.id,schedule.name,schedule.bot_id,schedule.title,schedule.description,schedule.config.to_string(),schedule.enabled,schedule.next_run_at]).map_err(db_error)?;
    list(&state)?
        .into_iter()
        .find(|s| s.id == schedule.id)
        .ok_or("Could not read the saved routine".into())
}
#[tauri::command(rename_all = "camelCase")]
pub fn schedule_history(schedule_id: String, state: State<'_, AppState>) -> Result<Value, String> {
    let db = state.lock()?;
    let mut q=db.prepare("SELECT r.scheduled_for,r.task_id,r.status,COALESCE(t.status,''),COALESCE(t.error,'') FROM schedule_runs r LEFT JOIN tasks t ON t.id=r.task_id WHERE r.schedule_id=?1 ORDER BY r.created_at DESC LIMIT 100").map_err(db_error)?;
    let rows=q.query_map([schedule_id],|r|Ok(json!({"scheduledFor":r.get::<_,i64>(0)?,"taskId":r.get::<_,String>(1)?,"status":r.get::<_,String>(2)?,"taskStatus":r.get::<_,String>(3)?,"error":r.get::<_,String>(4)?}))).map_err(db_error)?;
    Ok(json!(rows
        .collect::<Result<Vec<_>, _>>()
        .map_err(db_error)?))
}
#[tauri::command(rename_all = "camelCase")]
pub fn delete_schedule(schedule_id: String, state: State<'_, AppState>) -> Result<(), String> {
    state
        .lock()?
        .execute("DELETE FROM schedules WHERE id=?1", [schedule_id])
        .map_err(db_error)?;
    Ok(())
}
fn root_task(
    db: &rusqlite::Connection,
    bot: &str,
    title: &str,
    description: &str,
    schedule: &str,
    time: i64,
) -> Result<String, String> {
    let id = uuid::Uuid::new_v4().to_string();
    db.execute("INSERT INTO tasks(id,title,description,bot_id,status,created_at,updated_at,root_id,schedule_id,auto_start) VALUES(?1,?2,?3,?4,'queued',?5,?5,?1,?6,1)",params![id,title,description,bot,time,schedule]).map_err(db_error)?;
    db.execute(
        "INSERT INTO task_events(task_id,message,created_at) VALUES(?1,'Routine queued',?2)",
        params![id, time],
    )
    .map_err(db_error)?;
    Ok(id)
}
#[tauri::command(rename_all = "camelCase")]
pub fn run_schedule_now(schedule_id: String, state: State<'_, AppState>) -> Result<String, String> {
    let s = list(&state)?
        .into_iter()
        .find(|s| s.id == schedule_id)
        .ok_or("Routine not found")?;
    let mut db = state.lock()?;
    let tx = db.transaction().map_err(db_error)?;
    let active:i64=tx.query_row("SELECT COUNT(*) FROM tasks WHERE schedule_id=?1 AND(status IN('queued','running') OR(status='paused' AND(waiting_approval=1 OR waiting_child<>'')))",[&schedule_id],|r|r.get(0)).map_err(db_error)?;
    if active > 0 {
        return Err("This routine already has an active run".into());
    }
    let slot:i64=tx.query_row("SELECT MIN(0,COALESCE(MIN(scheduled_for),0))-1 FROM schedule_runs WHERE schedule_id=?1",[&s.id],|r|r.get(0)).map_err(db_error)?;
    let task = root_task(&tx, &s.bot_id, &s.title, &s.description, &s.id, now())?;
    tx.execute("INSERT INTO schedule_runs(id,schedule_id,scheduled_for,task_id,status,created_at) VALUES(?1,?2,?3,?4,'manual',?5)",params![uuid::Uuid::new_v4().to_string(),s.id,slot,task,now()]).map_err(db_error)?;
    tx.commit().map_err(db_error)?;
    Ok(task)
}
pub fn claim_due(state: &AppState, current: i64) -> Result<usize, String> {
    let due = list(state)?
        .into_iter()
        .filter(|s| s.enabled && s.next_run_at <= current)
        .collect::<Vec<_>>();
    let mut count = 0;
    for s in due {
        let next = if s.config["kind"] == "interval" {
            let interval = s.config["seconds"].as_i64().unwrap_or(60);
            Some(s.next_run_at + ((current - s.next_run_at) / interval + 1) * interval)
        } else {
            next_occurrence(&s.config, current)?
        };
        let mut db = state.lock()?;
        let tx = db.transaction().map_err(db_error)?;
        if tx.execute("UPDATE schedules SET next_run_at=?2,enabled=?3,last_error='' WHERE id=?1 AND enabled=1 AND next_run_at=?4",params![s.id,next.unwrap_or(0),next.is_some(),s.next_run_at]).map_err(db_error)?!=1{continue;}
        if tx
            .query_row(
                "SELECT COUNT(*) FROM schedule_runs WHERE schedule_id=?1 AND scheduled_for=?2",
                params![s.id, s.next_run_at],
                |r| r.get::<_, i64>(0),
            )
            .map_err(db_error)?
            > 0
        {
            tx.commit().map_err(db_error)?;
            continue;
        }
        let active:i64=tx.query_row("SELECT COUNT(*) FROM tasks WHERE schedule_id=?1 AND(status IN('queued','running') OR(status='paused' AND(waiting_approval=1 OR waiting_child<>'')))",[&s.id],|r|r.get(0)).map_err(db_error)?;
        let ready:i64=tx.query_row("SELECT COUNT(*) FROM bots b JOIN connections c ON c.id=b.provider_id AND c.kind='model' WHERE b.id=?1",[&s.bot_id],|r|r.get(0)).map_err(db_error)?;
        let skipped = active > 0
            || (s.config["missed"] == "skip" && current - s.next_run_at > 60)
            || ready == 0;
        let task = if skipped {
            String::new()
        } else {
            count += 1;
            root_task(&tx, &s.bot_id, &s.title, &s.description, &s.id, current)?
        };
        let reason = if active > 0 {
            "skipped_overlap"
        } else if ready == 0 {
            "missing_model"
        } else if skipped {
            "skipped_missed"
        } else {
            "queued"
        };
        tx.execute("INSERT OR IGNORE INTO schedule_runs(id,schedule_id,scheduled_for,task_id,status,created_at) VALUES(?1,?2,?3,?4,?5,?6)",params![uuid::Uuid::new_v4().to_string(),s.id,s.next_run_at,task,reason,current]).map_err(db_error)?;
        tx.execute(
            "UPDATE schedules SET last_run_at=?2,last_task_id=?3,last_error=?4 WHERE id=?1",
            params![
                s.id,
                current,
                task,
                if ready == 0 {
                    "Connect a model to resume this routine"
                } else {
                    ""
                }
            ],
        )
        .map_err(db_error)?;
        tx.commit().map_err(db_error)?;
    }
    Ok(count)
}
pub fn delegate(state: &AppState, parent: &str, call: &str, args: &Value) -> Result<Value, String> {
    let bot = args["botId"]
        .as_str()
        .ok_or("Choose a teammate ID from team_directory")?;
    let title = args["title"].as_str().unwrap_or("").trim();
    let description = args["description"].as_str().unwrap_or("");
    if title.is_empty() || title.chars().count() > 160 || description.chars().count() > 16000 {
        return Err("Delegated work needs a title and context under 16,000 characters".into());
    }
    let mut db = state.lock()?;
    let tx = db.transaction().map_err(db_error)?;
    let (root,generation):(String,i64)=tx.query_row("SELECT CASE WHEN root_id='' THEN id ELSE root_id END,generation FROM tasks WHERE id=?1",[parent],|r|Ok((r.get(0)?,r.get(1)?))).map_err(db_error)?;
    let existing:Option<(String,String,String,String)>=tx.query_row("SELECT id,status,output,error FROM tasks WHERE parent_id=?1 AND parent_generation=?2 AND delegate_call_id=?3",params![parent,generation,call],|r|Ok((r.get(0)?,r.get(1)?,r.get(2)?,r.get(3)?))).optional().map_err(db_error)?;
    if let Some((id, status, output, error)) = existing {
        return Ok(
            if ["completed", "failed", "canceled"].contains(&status.as_str()) {
                json!({"taskId":id,"status":status,"output":output.chars().take(30000).collect::<String>(),"error":error})
            } else {
                json!({"waitingChild":id})
            },
        );
    }
    let mut q=tx.prepare("WITH RECURSIVE ancestry(id,parent_id,bot_id,depth) AS(SELECT id,parent_id,bot_id,0 FROM tasks WHERE id=?1 UNION ALL SELECT t.id,t.parent_id,t.bot_id,a.depth+1 FROM tasks t JOIN ancestry a ON t.id=a.parent_id WHERE a.depth<4) SELECT bot_id,depth FROM ancestry").map_err(db_error)?;
    let ancestors = q
        .query_map([parent], |r| {
            Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1)?))
        })
        .map_err(db_error)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(db_error)?;
    drop(q);
    if ancestors.len() >= 4 || ancestors.iter().any(|a| a.0 == bot) {
        return Err(
            "Delegation is limited to three levels and cannot return to an ancestor teammate"
                .into(),
        );
    }
    let count: i64 = tx
        .query_row(
            "SELECT COUNT(*) FROM tasks WHERE root_id=?1 AND parent_id<>''",
            [&root],
            |r| r.get(0),
        )
        .map_err(db_error)?;
    if count >= 32 {
        return Err("This task has reached its 32 delegated-task limit".into());
    }
    let ready:i64=tx.query_row("SELECT COUNT(*) FROM bots b JOIN connections c ON c.id=b.provider_id AND c.kind='model' WHERE b.id=?1",[bot],|r|r.get(0)).map_err(db_error)?;
    if ready == 0 {
        return Err("This teammate needs a connected model before it can receive work".into());
    }
    let id = uuid::Uuid::new_v4().to_string();
    tx.execute("INSERT INTO tasks(id,title,description,bot_id,status,created_at,updated_at,parent_id,root_id,auto_start,parent_generation,delegate_call_id) VALUES(?1,?2,?3,?4,'queued',?5,?5,?6,?7,1,?8,?9)",params![id,title,description,bot,now(),parent,root,generation,call]).map_err(db_error)?;
    tx.execute("INSERT INTO task_events(task_id,message,created_at) VALUES(?1,'Delegated task received',?2)",params![id,now()]).map_err(db_error)?;
    tx.commit().map_err(db_error)?;
    Ok(json!({"waitingChild":id}))
}
pub fn cancel_tree(state: &AppState, id: &str) -> Result<(), String> {
    let ids = {
        let db = state.lock()?;
        let mut q=db.prepare("WITH RECURSIVE tree(id) AS(SELECT id FROM tasks WHERE id=?1 UNION ALL SELECT t.id FROM tasks t JOIN tree p ON t.parent_id=p.id) SELECT id FROM tree").map_err(db_error)?;
        let rows = q
            .query_map([id], |r| r.get::<_, String>(0))
            .map_err(db_error)?;
        rows.collect::<Result<Vec<_>, _>>().map_err(db_error)?
    };
    if ids.is_empty() {
        return Err("Task not found".into());
    }
    let mut active = state.active.lock().map_err(db_error)?;
    for id in ids {
        if let Some(handle) = active.remove(&id) {
            handle.abort();
        }
        let db = state.lock()?;
        db.execute("UPDATE tasks SET status='canceled',waiting_approval=0,waiting_child='',updated_at=?2 WHERE id=?1 AND status IN('queued','running','paused')",params![id,now()]).map_err(db_error)?;
        db.execute(
            "UPDATE approvals SET status='rejected' WHERE task_id=?1 AND status='pending'",
            [&id],
        )
        .map_err(db_error)?;
    }
    Ok(())
}
pub fn start(app: tauri::AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut timer = tokio::time::interval(std::time::Duration::from_secs(2));
        loop {
            timer.tick().await;
            let state = app.state::<AppState>();
            if let Err(error) = tick(&app, &state) {
                eprintln!("Scheduler: {error}");
            }
        }
    });
}
fn tick(app: &tauri::AppHandle, state: &AppState) -> Result<(), String> {
    let queued = claim_due(state, now())?;
    let (ready, parents) = {
        let db = state.lock()?;
        let mut q=db.prepare("SELECT id FROM tasks WHERE status='queued' AND auto_start=1 ORDER BY created_at LIMIT 8").map_err(db_error)?;
        let ready = q
            .query_map([], |r| r.get::<_, String>(0))
            .map_err(db_error)?
            .collect::<Result<Vec<_>, _>>()
            .map_err(db_error)?;
        let mut q=db.prepare("SELECT p.id FROM tasks p JOIN tasks c ON c.id=p.waiting_child WHERE p.status='paused' AND p.waiting_child<>'' AND c.status IN('completed','failed','canceled') LIMIT 8").map_err(db_error)?;
        let parents = q
            .query_map([], |r| r.get::<_, String>(0))
            .map_err(db_error)?
            .collect::<Result<Vec<_>, _>>()
            .map_err(db_error)?;
        (ready, parents)
    };
    let mut changed = queued > 0;
    for (id, resume) in parents
        .into_iter()
        .map(|id| (id, true))
        .chain(ready.into_iter().map(|id| (id, false)))
    {
        match crate::launch(app.clone(), id.clone(), resume) {
            Ok(()) => changed = true,
            Err(e) if e.contains("concurrent task limit") => break,
            Err(e) => {
                state.lock()?.execute("UPDATE tasks SET status='failed',error=?2 WHERE id=?1 AND status<>'running'",params![id,e]).map_err(db_error)?;
                changed = true;
            }
        }
    }
    if changed {
        let _ = app.emit("workspace-updated", json!({"scheduler":true}));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    fn state() -> AppState {
        let dir = std::env::temp_dir().join(format!("benchhand-routines-{}", uuid::Uuid::new_v4()));
        let db = crate::open_database(&dir.join("workspace.sqlite3")).unwrap();
        db.execute("INSERT INTO connections(id,kind,label,config,account,verified_at) VALUES('model','model','Test','{}','',0)",[]).unwrap();
        db.execute("UPDATE bots SET provider_id='model'", [])
            .unwrap();
        AppState {
            db: std::sync::Mutex::new(db),
            data_dir: dir,
            client: reqwest::Client::new(),
            active: std::sync::Mutex::new(Default::default()),
            downloads: std::sync::Mutex::new(Default::default()),
        }
    }
    fn schedule(state: &AppState, id: &str, config: Value, at: i64) {
        state.lock().unwrap().execute("INSERT INTO schedules(id,name,bot_id,title,description,config,enabled,next_run_at) VALUES(?1,?1,'research','Routine task','',?2,1,?3)",params![id,config.to_string(),at]).unwrap();
    }
    #[test]
    fn calendar_handles_time_zones_weekdays_and_daylight_saving() {
        let stamp = |s: &str| chrono::DateTime::parse_from_rfc3339(s).unwrap().timestamp();
        let c = json!({"kind":"daily","time":"02:30","timezone":"America/New_York"});
        assert_eq!(
            next_occurrence(&c, stamp("2026-03-08T05:00:00Z")).unwrap(),
            Some(stamp("2026-03-09T06:30:00Z"))
        );
        let c = json!({"kind":"daily","time":"01:30","timezone":"America/New_York"});
        assert_eq!(
            next_occurrence(&c, stamp("2026-11-01T04:00:00Z")).unwrap(),
            Some(stamp("2026-11-01T05:30:00Z"))
        );
        assert_eq!(
            next_occurrence(&c, stamp("2026-11-01T05:31:00Z")).unwrap(),
            Some(stamp("2026-11-02T06:30:00Z"))
        );
        let c = json!({"kind":"weekly","time":"09:00","timezone":"Asia/Kolkata","days":[1]});
        assert_eq!(
            next_occurrence(&c, stamp("2026-10-20T00:00:00Z")).unwrap(),
            Some(stamp("2026-10-26T03:30:00Z"))
        );
        assert!(next_occurrence(&json!({"kind":"interval","seconds":0}), 0).is_err());
    }
    #[test]
    fn due_runs_are_idempotent_coalesce_and_do_not_overlap() {
        let s = state();
        schedule(&s, "repeat", json!({"kind":"interval","seconds":60}), 100);
        assert_eq!(claim_due(&s, 1000).unwrap(), 1);
        assert_eq!(claim_due(&s, 1000).unwrap(), 0);
        assert_eq!(claim_due(&s, 1060).unwrap(), 0);
        assert_eq!(
            s.lock()
                .unwrap()
                .query_row("SELECT COUNT(*) FROM tasks", [], |r| r.get::<_, i64>(0))
                .unwrap(),
            1
        );
        assert_eq!(
            s.lock()
                .unwrap()
                .query_row(
                    "SELECT status FROM schedule_runs ORDER BY created_at DESC LIMIT 1",
                    [],
                    |r| r.get::<_, String>(0)
                )
                .unwrap(),
            "skipped_overlap"
        );
        schedule(
            &s,
            "skip",
            json!({"kind":"once","at":100,"missed":"skip"}),
            100,
        );
        assert_eq!(claim_due(&s, 1000).unwrap(), 0);
        schedule(&s, "once", json!({"kind":"once","at":100}), 100);
        assert_eq!(claim_due(&s, 1000).unwrap(), 1);
        s.lock()
            .unwrap()
            .execute(
                "UPDATE schedules SET enabled=1,next_run_at=100 WHERE id='once'",
                [],
            )
            .unwrap();
        assert_eq!(claim_due(&s, 1000).unwrap(), 0);
        let dir = s.data_dir.clone();
        drop(s);
        fs_cleanup(dir);
    }
    #[test]
    fn delegation_reuses_calls_returns_results_blocks_loops_and_cancels_tree() {
        let s = state();
        s.lock().unwrap().execute("INSERT INTO tasks(id,title,bot_id,status,created_at,updated_at,root_id,generation) VALUES('root','Parent','research','running',1,1,'root',1)",[]).unwrap();
        let args = json!({"botId":"operations","title":"Child","description":"Context"});
        let first = delegate(&s, "root", "call-1", &args).unwrap();
        let child = first["waitingChild"].as_str().unwrap();
        assert_eq!(delegate(&s, "root", "call-1", &args).unwrap(), first);
        assert!(delegate(
            &s,
            child,
            "loop",
            &json!({"botId":"research","title":"Loop"})
        )
        .is_err());
        s.lock()
            .unwrap()
            .execute(
                "UPDATE tasks SET status='completed',output='Child result' WHERE id=?1",
                [child],
            )
            .unwrap();
        assert_eq!(
            delegate(&s, "root", "call-1", &args).unwrap()["output"],
            "Child result"
        );
        let other = delegate(
            &s,
            "root",
            "call-2",
            &json!({"botId":"code","title":"Other child"}),
        )
        .unwrap();
        cancel_tree(&s, "root").unwrap();
        assert_eq!(
            s.task(other["waitingChild"].as_str().unwrap())
                .unwrap()
                .status,
            "canceled"
        );
        assert_eq!(s.task(child).unwrap().status, "completed");
        let dir = s.data_dir.clone();
        drop(s);
        fs_cleanup(dir);
    }
    fn fs_cleanup(dir: std::path::PathBuf) {
        std::fs::remove_dir_all(dir).unwrap();
    }
}
