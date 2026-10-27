#[path = "../terminal_shared.rs"]
mod terminal_shared;

use serde_json::{json, Value};
use std::{
    io::{self, Write},
    path::PathBuf,
    time::Duration,
};

const HELP: &str = "Benchhand terminal\n\n  team                     List teammates and their models\n  tasks                    List recent tasks\n  run <teammate> <request> Start a task and follow its progress\n  show <task-id>           Show a task and its result\n  activity <task-id>       Inspect recorded model and tool activity\n  approvals                Review pending actions and exact inputs\n  approve <approval-id>    Approve one action and continue its task\n  reject <approval-id>     Reject one action and continue its task\n  help                     Show these commands\n  exit                     Leave the terminal\n\nRun `benchhand-terminal` for an interactive session, or pass a command directly. The desktop app runs the shared workspace in the background.";

struct Client {
    http: reqwest::Client,
    base: String,
    token: String,
}

fn data_dir() -> Result<PathBuf, String> {
    if let Some(path) = std::env::var_os("TEAMMATE_DATA_DIR") {
        let path = PathBuf::from(path);
        return if path.is_absolute() {
            Ok(path)
        } else {
            Err("TEAMMATE_DATA_DIR must be absolute".into())
        };
    }
    #[cfg(windows)]
    let base = std::env::var_os("APPDATA").map(PathBuf::from);
    #[cfg(target_os = "linux")]
    let base = std::env::var_os("XDG_DATA_HOME")
        .map(PathBuf::from)
        .or_else(|| std::env::var_os("HOME").map(|home| PathBuf::from(home).join(".local/share")));
    #[cfg(target_os = "macos")]
    let base = std::env::var_os("HOME")
        .map(|home| PathBuf::from(home).join("Library/Application Support"));
    base.map(|path| path.join(terminal_shared::SERVICE))
        .ok_or("Cannot locate the Benchhand data directory".into())
}

impl Client {
    fn connect() -> Result<Self, String> {
        let id = terminal_shared::credential_id(&data_dir()?)?;
        let entry = keyring::Entry::new(terminal_shared::SERVICE, &id)
            .map_err(|_| "The operating system credential store is unavailable")?;
        let value = entry
            .get_password()
            .map_err(|_| "Open Benchhand and unlock your credential store, then try again")?;
        let value: Value = serde_json::from_str(&value)
            .map_err(|_| "Terminal connection is invalid; restart Benchhand")?;
        let port = value["port"]
            .as_u64()
            .filter(|p| (1..=65535).contains(p))
            .ok_or("Terminal connection is invalid")?;
        let token = value["token"]
            .as_str()
            .filter(|s| s.len() == 64)
            .ok_or("Terminal connection is invalid")?
            .to_string();
        let http = reqwest::Client::builder()
            .timeout(Duration::from_secs(15))
            .redirect(reqwest::redirect::Policy::none())
            .no_proxy()
            .build()
            .map_err(|e| e.to_string())?;
        Ok(Self {
            http,
            base: format!("http://127.0.0.1:{port}"),
            token,
        })
    }
    async fn request(
        &self,
        method: reqwest::Method,
        path: &str,
        body: Option<Value>,
    ) -> Result<Value, String> {
        let mut request = self
            .http
            .request(method, format!("{}{path}", self.base))
            .bearer_auth(&self.token);
        if let Some(body) = body {
            request = request.json(&body);
        }
        let response = request.send().await.map_err(|_| {
            "Cannot reach Benchhand. Open or restart the desktop app and try again.".to_string()
        })?;
        let status = response.status();
        let value: Value = response
            .json()
            .await
            .map_err(|_| "Benchhand returned an invalid response")?;
        if !status.is_success() {
            return Err(value["error"]
                .as_str()
                .unwrap_or("Request failed")
                .to_string());
        }
        Ok(value)
    }
    async fn get(&self, path: &str) -> Result<Value, String> {
        self.request(reqwest::Method::GET, path, None).await
    }
    async fn post(&self, path: &str, body: Value) -> Result<Value, String> {
        self.request(reqwest::Method::POST, path, Some(body)).await
    }
}

async fn connect_or_start() -> Result<Client, String> {
    if let Ok(client) = Client::connect() {
        if tokio::time::timeout(Duration::from_secs(1), client.get("/v1/summary"))
            .await
            .is_ok_and(|result| result.is_ok())
        {
            return Ok(client);
        }
    }
    if std::env::var_os("TEAMMATE_DATA_DIR").is_some() {
        return Err(
            "Open Benchhand with the same TEAMMATE_DATA_DIR before connecting the terminal.".into(),
        );
    }
    let app = if let Some(path) = std::env::var_os("BENCHHAND_APP") {
        PathBuf::from(path)
    } else {
        let folder = std::env::current_exe()
            .map_err(|e| e.to_string())?
            .parent()
            .ok_or("Cannot locate Benchhand")?
            .to_path_buf();
        folder.join(if cfg!(windows) {
            "benchhand.exe"
        } else {
            "benchhand"
        })
    };
    let mut command = std::process::Command::new(app);
    command
        .arg("--terminal-background")
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null());
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x0800_0000);
    }
    command.spawn().map_err(|_| {
        "Cannot start Benchhand. Install the desktop app beside the terminal, or open it first."
    })?;
    for _ in 0..40 {
        tokio::time::sleep(Duration::from_millis(500)).await;
        if let Ok(client) = Client::connect() {
            if tokio::time::timeout(Duration::from_secs(1), client.get("/v1/summary"))
                .await
                .is_ok_and(|result| result.is_ok())
            {
                return Ok(client);
            }
        }
    }
    Err("Benchhand did not become available. Open it and unlock the credential store, then try again.".into())
}

fn text<'a>(value: &'a Value, key: &str) -> &'a str {
    value[key].as_str().unwrap_or("")
}
fn safe(value: &str) -> String {
    value
        .chars()
        .filter(|c| !c.is_control() || *c == '\n' || *c == '\t')
        .collect()
}
fn event(message: &str, details: bool) -> String {
    if let Ok(value) = serde_json::from_str::<Value>(message) {
        if let Some(title) = value["title"].as_str() {
            return if details && value["detail"].is_string() {
                format!("{}\n{}", safe(title), safe(text(&value, "detail")))
            } else {
                safe(title)
            };
        }
    }
    safe(message)
}
fn identifier(value: &str) -> Result<&str, String> {
    if !value.is_empty()
        && value.len() <= 80
        && value
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
        Ok(value)
    } else {
        Err("Use the full ID shown by Benchhand".into())
    }
}
fn show_task(task: &Value) {
    println!(
        "{}  [{}]  {}",
        safe(text(task, "id")),
        safe(text(task, "status")),
        safe(text(task, "title"))
    );
    if !text(task, "error").is_empty() {
        println!("Error: {}", safe(text(task, "error")));
    }
    if !text(task, "output").is_empty() {
        println!("\n{}", safe(text(task, "output")));
    }
    if task["waitingApproval"] == true {
        println!("\nWaiting for approval. Run `approvals` to review the action.");
    }
    if !text(task, "waitingChild").is_empty() {
        println!(
            "\nWaiting for delegated task {}.",
            safe(text(task, "waitingChild"))
        );
    }
}

async fn execute(client: &Client, line: &str) -> Result<bool, String> {
    let line = line.trim();
    let (command, rest) = line.split_once(char::is_whitespace).unwrap_or((line, ""));
    let rest = rest.trim_start();
    let (argument, remainder) = rest.split_once(char::is_whitespace).unwrap_or((rest, ""));
    match command {
        "" => {}
        "help" | "--help" | "-h" => println!("{HELP}"),
        "exit" | "quit" => return Ok(false),
        "team" => {
            for bot in client.get("/v1/summary").await?["team"]
                .as_array()
                .into_iter()
                .flatten()
            {
                println!(
                    "{}  {}  {}",
                    safe(text(bot, "id")),
                    safe(text(bot, "name")),
                    safe(if text(bot, "model").is_empty() {
                        "No model connected"
                    } else {
                        text(bot, "model")
                    })
                );
            }
        }
        "tasks" => {
            for task in client
                .get("/v1/tasks")
                .await?
                .as_array()
                .into_iter()
                .flatten()
            {
                println!(
                    "{}  [{}]  {}",
                    safe(text(task, "id")),
                    safe(text(task, "status")),
                    safe(text(task, "title"))
                );
            }
        }
        "show" => {
            let id = identifier(argument)?;
            show_task(&client.get(&format!("/v1/tasks/{id}")).await?);
        }
        "activity" => {
            let id = identifier(argument)?;
            let events = client.get(&format!("/v1/tasks/{id}/events")).await?;
            for item in events["events"].as_array().into_iter().flatten() {
                println!("{}\n", event(text(item, "message"), true));
            }
        }
        "approvals" => {
            let summary = client.get("/v1/summary").await?;
            let pending = summary["pending"]
                .as_array()
                .ok_or("Invalid approval list")?;
            if pending.is_empty() {
                println!("Nothing is waiting for approval.");
            }
            for item in pending {
                println!(
                    "\n{}  {}\nTarget: {}\nInputs:\n{}",
                    safe(text(item, "id")),
                    safe(text(item, "title")),
                    safe(text(item, "target")),
                    serde_json::to_string_pretty(&item["arguments"]).map_err(|e| e.to_string())?
                );
            }
        }
        decision @ ("approve" | "reject") => {
            let id = identifier(argument)?;
            client
                .post(
                    &format!("/v1/approvals/{id}/decision"),
                    json!({"decision":if decision == "approve" {"approved"} else {"rejected"}}),
                )
                .await?;
            println!("Decision recorded; the task will continue.");
        }
        "run" => {
            let bot = argument;
            let request = remainder.trim();
            if request.is_empty() {
                return Err("Use: run <teammate-id> <request>".into());
            }
            let bot = identifier(bot)?;
            let title: String = request.chars().take(160).collect();
            let result = client
                .post(
                    "/v1/tasks",
                    json!({"botId":bot,"title":title,"description":request}),
                )
                .await?;
            let id = identifier(text(&result, "taskId"))?;
            println!(
                "Started {id}. The task keeps running in Benchhand if you leave this terminal."
            );
            let mut seen = 0;
            loop {
                let events = client.get(&format!("/v1/tasks/{id}/events")).await?;
                if let Some(items) = events["events"].as_array() {
                    for item in items.iter().skip(seen) {
                        println!("  {}", event(text(item, "message"), false));
                    }
                    seen = items.len();
                }
                let task = client.get(&format!("/v1/tasks/{id}")).await?;
                if text(&task, "status") != "running" {
                    show_task(&task);
                    if matches!(text(&task, "status"), "failed" | "canceled") {
                        return Err("The task did not complete.".into());
                    }
                    break;
                }
                tokio::time::sleep(Duration::from_secs(2)).await;
            }
        }
        _ => return Err("Unknown command. Type `help` to see available commands.".into()),
    }
    Ok(true)
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    if args
        .first()
        .is_some_and(|arg| matches!(arg.as_str(), "--help" | "-h" | "help"))
    {
        println!("{HELP}");
        return;
    }
    let client = match connect_or_start().await {
        Ok(client) => client,
        Err(error) => {
            eprintln!("{}", safe(&error));
            std::process::exit(1);
        }
    };
    if !args.is_empty() && args.as_slice() != ["terminal"] {
        if let Err(error) = execute(&client, &args.join(" ")).await {
            eprintln!("{}", safe(&error));
            std::process::exit(1);
        }
        return;
    }
    println!("Benchhand terminal · type `help` for commands");
    loop {
        print!("benchhand › ");
        if io::stdout().flush().is_err() {
            break;
        }
        let mut line = String::new();
        match io::stdin().read_line(&mut line) {
            Ok(0) | Err(_) => break,
            Ok(_) => {}
        }
        match execute(&client, &line).await {
            Ok(false) => break,
            Ok(true) => {}
            Err(error) => eprintln!("{}", safe(&error)),
        }
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn untrusted_activity_cannot_send_terminal_control_sequences() {
        let message = r#"{"title":"Model output","detail":"hello\u001b[2Jworld"}"#;
        assert_eq!(super::event(message, false), "Model output");
        assert_eq!(super::event(message, true), "Model output\nhello[2Jworld");
        assert!(!super::safe("\u{1b}]0;title\u{7}").contains('\u{1b}'));
    }

    #[test]
    fn ids_cannot_change_api_paths() {
        assert!(super::identifier("task-123").is_ok());
        assert!(super::identifier("../approvals").is_err());
        assert!(super::identifier("").is_err());
    }
}
