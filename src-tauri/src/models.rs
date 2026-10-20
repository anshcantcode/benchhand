use crate::{db_error, services, AppState};
use serde_json::{json, Value};
use std::time::Duration;
use tauri::{Emitter, Manager, State};

fn runtime_base(base: &str) -> Result<String, String> {
    let base = services::base_url(&json!({"baseUrl":base}))?;
    Ok(base.trim_end_matches("/v1").to_string())
}
fn model_name(model: &str) -> Result<&str, String> {
    let model = model.trim();
    if model.is_empty()
        || model.len() > 200
        || !model
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || "-_.:/".contains(c))
        || model.contains("..")
    {
        return Err(
            "Enter an Ollama model name, such as qwen3:8b or hf.co/owner/model:Q4_K_M".into(),
        );
    }
    Ok(model)
}
#[tauri::command(rename_all = "camelCase")]
pub async fn local_models(base_url: String, state: State<'_, AppState>) -> Result<Value, String> {
    let base = runtime_base(&base_url)?;
    let response = state
        .client
        .get(format!("{base}/api/tags"))
        .send()
        .await
        .map_err(|_| {
            "Start Ollama and check its server URL. You can download Ollama from ollama.com."
        })?;
    if !response.status().is_success() {
        return Err(format!(
            "Ollama returned {}. Check its server URL.",
            response.status().as_u16()
        ));
    }
    let result: Value = response
        .json()
        .await
        .map_err(|_| "The runtime returned an invalid model list")?;
    if !result["models"].is_array() {
        return Err("This server does not expose the Ollama model library API".into());
    }
    Ok(result)
}
#[tauri::command(rename_all = "camelCase")]
pub fn download_model(
    base_url: String,
    model: String,
    app: tauri::AppHandle,
) -> Result<String, String> {
    let base = runtime_base(&base_url)?;
    let model = model_name(&model)?.to_string();
    let state = app.state::<AppState>();
    let id = uuid::Uuid::new_v4().to_string();
    let mut downloads = state.downloads.lock().map_err(db_error)?;
    if downloads
        .values()
        .any(|v| v["model"] == model && v["baseUrl"] == base && v["state"] == "downloading")
    {
        return Err("This model is already downloading".into());
    }
    downloads.retain(|_, v| v["state"] == "downloading");
    if downloads.len() >= 2 {
        return Err("Wait for one of your two active downloads to finish".into());
    }
    downloads.insert(id.clone(), json!({"id":id,"model":model,"baseUrl":base,"state":"downloading","status":"Connecting to Ollama","completed":0,"total":0}));
    drop(downloads);
    let task_id = id.clone();
    let app_copy = app.clone();
    let mut active = state.active.lock().map_err(db_error)?;
    let handle = tauri::async_runtime::spawn(async move {
        let result = pull(&base, &model, |progress| {
            let state = app_copy.state::<AppState>();
            if let Ok(mut downloads) = state.downloads.lock() {
                if let Some(v) = downloads.get_mut(&task_id) {
                    for key in ["status", "completed", "total"] {
                        if let Some(value) = progress.get(key) {
                            v[key] = value.clone();
                        }
                    }
                }
            }
            let _ = app_copy.emit("model-download", json!({"id":task_id,"progress":progress}));
        })
        .await;
        let state = app_copy.state::<AppState>();
        if let Ok(mut downloads) = state.downloads.lock() {
            if let Some(v) = downloads.get_mut(&task_id) {
                v["state"] = json!(if result.is_ok() {
                    "completed"
                } else {
                    "failed"
                });
                v["status"] = json!(result.err().unwrap_or("Ready to connect".into()));
            }
        }
        if let Ok(mut active) = state.active.lock() {
            active.remove(&format!("download:{task_id}"));
        }
        let _ = app_copy.emit("workspace-updated", json!({"downloadId":task_id}));
    });
    active.insert(format!("download:{id}"), handle.inner().abort_handle());
    Ok(id)
}
async fn pull(base: &str, model: &str, progress: impl Fn(Value)) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .connect_timeout(Duration::from_secs(10))
        .timeout(Duration::from_secs(86400))
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(db_error)?;
    let mut response = client
        .post(format!("{base}/api/pull"))
        .json(&json!({"model":model,"stream":true}))
        .send()
        .await
        .map_err(|_| "Could not reach Ollama. Start the runtime and try again.")?;
    if !response.status().is_success() {
        return Err(format!(
            "Ollama returned {} while starting this download",
            response.status().as_u16()
        ));
    }
    let mut buffer = Vec::new();
    let mut success = false;
    while let Some(chunk) = response
        .chunk()
        .await
        .map_err(|_| "The download connection was interrupted. Retry to resume cached layers.")?
    {
        buffer.extend_from_slice(&chunk);
        if buffer.len() > 1_000_000 {
            return Err("Ollama returned an oversized progress record".into());
        }
        while let Some(end) = buffer.iter().position(|b| *b == b'\n') {
            let line: Vec<_> = buffer.drain(..=end).collect();
            if line.iter().all(u8::is_ascii_whitespace) {
                continue;
            }
            let value: Value = serde_json::from_slice(&line)
                .map_err(|_| "Ollama returned invalid download progress")?;
            if let Some(error) = value["error"].as_str() {
                return Err(error.chars().take(400).collect());
            }
            success |= value["status"] == "success";
            progress(value);
        }
    }
    if !buffer.is_empty() {
        let value: Value = serde_json::from_slice(&buffer).map_err(db_error)?;
        if let Some(e) = value["error"].as_str() {
            return Err(e.chars().take(400).collect());
        }
        success |= value["status"] == "success";
        progress(value);
    }
    if success {
        Ok(())
    } else {
        Err(
            "The download ended before Ollama reported success. Retry to resume cached layers."
                .into(),
        )
    }
}
#[tauri::command(rename_all = "camelCase")]
pub fn cancel_download(download_id: String, state: State<'_, AppState>) -> Result<(), String> {
    if let Some(handle) = state
        .active
        .lock()
        .map_err(db_error)?
        .remove(&format!("download:{download_id}"))
    {
        handle.abort();
    }
    if let Some(value) = state
        .downloads
        .lock()
        .map_err(db_error)?
        .get_mut(&download_id)
    {
        value["state"] = json!("canceled");
        value["status"] = json!("Canceled. Retry to resume cached layers.");
    }
    Ok(())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn validates_model_names_and_runtime_urls() {
        assert!(model_name("qwen3:8b").is_ok());
        assert!(model_name("hf.co/owner/model:Q4_K_M").is_ok());
        assert!(model_name("../secret").is_err());
        assert_eq!(
            runtime_base("http://127.0.0.1:11434/v1").unwrap(),
            "http://127.0.0.1:11434"
        );
        assert!(runtime_base("file:///tmp").is_err());
    }
    #[tokio::test]
    async fn pulls_real_http_progress_records() {
        let server = crate::test_support::MockServer::new(|_, path, body| {
            assert_eq!(path, "/api/pull");
            assert_eq!(body["model"], "test-model");
            json!({"status":"success"})
        });
        let updates = std::sync::Mutex::new(Vec::new());
        pull(&server.url, "test-model", |v| {
            updates.lock().unwrap().push(v)
        })
        .await
        .unwrap();
        assert_eq!(updates.lock().unwrap()[0]["status"], "success");
    }
}
