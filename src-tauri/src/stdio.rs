//! Persistent, newline-delimited MCP sessions. Programs are launched directly, never through a shell.
use crate::{db_error, Connection};
use serde_json::{json, Value};
use std::{
    collections::HashMap,
    path::PathBuf,
    process::Stdio,
    sync::{Arc, OnceLock},
};
use tokio::{
    io::{AsyncBufReadExt, AsyncWriteExt, BufReader},
    process::{Child, ChildStdin, ChildStdout},
};
struct Session {
    child: Child,
    input: ChildStdin,
    output: BufReader<ChildStdout>,
    sequence: u64,
}
type Shared = Arc<tokio::sync::Mutex<Option<Session>>>;
static SESSIONS: OnceLock<tokio::sync::Mutex<HashMap<String, Shared>>> = OnceLock::new();
pub fn executable(name: &str) -> Result<PathBuf, String> {
    let path = PathBuf::from(name);
    if path.is_absolute() {
        return path
            .is_file()
            .then_some(path)
            .ok_or("Executable not found".into());
    }
    if name.contains(['/', '\\']) || name.is_empty() {
        return Err("Use an executable name on PATH or an absolute path".into());
    }
    for dir in std::env::split_paths(&std::env::var_os("PATH").unwrap_or_default()) {
        for suffix in if cfg!(windows) {
            vec![".exe", ""]
        } else {
            vec![""]
        } {
            let p = dir.join(format!("{name}{suffix}"));
            if p.is_file() {
                return Ok(p);
            }
        }
    }
    Err(format!(
        "Install {name} and restart Teammate so it is available on PATH"
    ))
}
impl Session {
    async fn send(&mut self, value: &Value) -> Result<(), String> {
        let text = value.to_string();
        self.input
            .write_all(text.as_bytes())
            .await
            .map_err(db_error)?;
        self.input.write_all(b"\n").await.map_err(db_error)?;
        self.input.flush().await.map_err(db_error)
    }
    async fn rpc(&mut self, method: &str, args: Value) -> Result<Value, String> {
        self.sequence += 1;
        let id = self.sequence;
        self.send(&json!({"jsonrpc":"2.0","id":id,"method":method,"params":args}))
            .await?;
        tokio::time::timeout(std::time::Duration::from_secs(120),async{
            for _ in 0..1000{
                let mut bytes=Vec::new();
                loop{let part=self.output.fill_buf().await.map_err(db_error)?;if part.is_empty(){return Err("The plugin process closed its output. Check its runtime and configuration.".into());}let n=part.iter().position(|b|*b==b'\n').map(|n|n+1).unwrap_or(part.len());let done=part[n-1]==b'\n';if bytes.len()+n>2_000_000{return Err("Plugin response exceeded 2 MB".into());}bytes.extend_from_slice(&part[..n]);self.output.consume(n);if done{break;}}
                let value:Value=serde_json::from_slice(&bytes).map_err(|_|"Plugin stdout must contain only newline-delimited JSON-RPC messages")?;
                if value.get("method").is_some()&&value.get("id").is_some(){let result=if value["method"]=="ping"{json!({"jsonrpc":"2.0","id":value["id"],"result":{}})}else{json!({"jsonrpc":"2.0","id":value["id"],"error":{"code":-32601,"message":"This client does not support server-initiated requests"}})};self.send(&result).await?;continue;}
                if value["id"]!=id{continue;}
                if value.get("error").is_some(){return Err(format!("Plugin returned an RPC error ({})",value["error"]["code"]));}
                return value.get("result").cloned().ok_or("Plugin returned an invalid response".into());
            }Err("Plugin sent too many unrelated messages".into())
        }).await.map_err(|_|"Plugin timed out after two minutes".to_string())?
    }
}
async fn spawn(config: &Value, secret: &str) -> Result<Session, String> {
    let command = config["command"]
        .as_str()
        .ok_or("Plugin executable is missing")?;
    let program = executable(command)?;
    if cfg!(windows)
        && program
            .extension()
            .is_some_and(|s| s == "cmd" || s == "bat")
    {
        return Err("Use node.exe with a script path instead of a command script".into());
    }
    let args = config["args"]
        .as_array()
        .ok_or("Plugin arguments must be an array")?;
    if args.len() > 100
        || args
            .iter()
            .any(|v| !v.as_str().is_some_and(|s| s.len() < 16000))
    {
        return Err("Invalid plugin arguments".into());
    }
    let mut cmd = tokio::process::Command::new(program);
    for a in args {
        cmd.arg(a.as_str().unwrap());
    }
    if let Some(dir) = config["cwd"].as_str() {
        cmd.current_dir(dir);
    }
    if !secret.is_empty() {
        let values: Value =
            serde_json::from_str(secret).map_err(|_| "Plugin credentials are invalid")?;
        for (k, v) in values
            .as_object()
            .ok_or("Plugin credentials must be an object")?
        {
            if !k.chars().all(|c| c.is_ascii_alphanumeric() || c == '_') || k.is_empty() {
                return Err("Invalid environment variable name".into());
            }
            cmd.env(k, v.as_str().ok_or("Environment values must be text")?);
        }
    }
    cmd.stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .kill_on_drop(true);
    #[cfg(windows)]
    cmd.creation_flags(0x08000000);
    let mut child = cmd.spawn().map_err(|_| {
        "Could not start the plugin. Check its executable, runtime, and working directory."
    })?;
    let mut s = Session {
        input: child.stdin.take().unwrap(),
        output: BufReader::new(child.stdout.take().unwrap()),
        child,
        sequence: 0,
    };
    s.rpc("initialize",json!({"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"Teammate","version":env!("CARGO_PKG_VERSION")}})).await?;
    s.send(&json!({"jsonrpc":"2.0","method":"notifications/initialized"}))
        .await?;
    Ok(s)
}
pub async fn request(
    c: &Connection,
    secret: &str,
    method: &str,
    args: Value,
) -> Result<Value, String> {
    let map = SESSIONS.get_or_init(Default::default);
    let shared = map
        .lock()
        .await
        .entry(c.id.clone())
        .or_insert_with(|| Arc::new(tokio::sync::Mutex::new(None)))
        .clone();
    let mut session = shared.lock().await;
    if session.is_none() {
        *session = Some(spawn(&c.config, secret).await?);
    }
    let result = session.as_mut().unwrap().rpc(method, args).await;
    if result.is_err() {
        *session = None;
    }
    result
}
pub async fn stop(id: &str) {
    if let Some(shared) = SESSIONS
        .get_or_init(Default::default)
        .lock()
        .await
        .remove(id)
    {
        let mut guard = shared.lock().await;
        if let Some(mut session) = guard.take() {
            let _ = session.child.kill().await;
        }
    }
}
pub async fn stop_all() {
    let ids = SESSIONS
        .get_or_init(Default::default)
        .lock()
        .await
        .keys()
        .cloned()
        .collect::<Vec<_>>();
    for id in ids {
        stop(&id).await;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[tokio::test]
    async fn persistent_process_keeps_state_and_restarts_after_stop() {
        let fixture =
            PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../tests/fixtures/mcp-stdio.mjs");
        assert!(fixture.is_file());
        let c = Connection {
            id: uuid::Uuid::new_v4().to_string(),
            kind: "mcp".into(),
            label: "Fixture".into(),
            config: json!({"command":"node","args":[fixture],"transport":"stdio"}),
            account: String::new(),
            verified_at: 0,
        };
        assert_eq!(
            request(&c, "", "tools/list", json!({})).await.unwrap()["tools"][0]["name"],
            "echo"
        );
        for n in 1..=2 {
            assert_eq!(
                request(
                    &c,
                    "",
                    "tools/call",
                    json!({"name":"echo","arguments":{"text":"hello"}})
                )
                .await
                .unwrap()["content"][0]["text"],
                format!("{n}:hello")
            );
        }
        stop(&c.id).await;
        assert_eq!(
            request(
                &c,
                "",
                "tools/call",
                json!({"name":"echo","arguments":{"text":"new"}})
            )
            .await
            .unwrap()["content"][0]["text"],
            "1:new"
        );
        stop(&c.id).await;
    }
}
