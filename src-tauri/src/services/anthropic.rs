//! Claude Messages API translation for Benchhand's shared tool and approval flow.
use super::{body_json, content_text, structured_result};
use crate::db_error;
use reqwest::Client;
use serde_json::{json, Value};

const VERSION: &str = "2023-06-01";

fn auth(request: reqwest::RequestBuilder, token: &str) -> Result<reqwest::RequestBuilder, String> {
    if token.is_empty() {
        return Err("Enter an Anthropic API key".into());
    }
    Ok(request
        .header("x-api-key", token)
        .header("anthropic-version", VERSION))
}

pub(super) async fn models(client: &Client, base: &str, token: &str) -> Result<Value, String> {
    let mut models = Vec::new();
    let mut cursor = String::new();
    for _ in 0..20 {
        let mut url = reqwest::Url::parse(&format!("{base}/models")).map_err(db_error)?;
        url.query_pairs_mut().append_pair("limit", "1000");
        if !cursor.is_empty() {
            url.query_pairs_mut().append_pair("after_id", &cursor);
        }
        let response = auth(client.get(url), token)?
            .send()
            .await
            .map_err(|_| "Could not reach the model server")?;
        let page = body_json(response, token).await?;
        let entries = page["data"]
            .as_array()
            .ok_or("The server did not return a model list")?;
        models.extend(
            entries
                .iter()
                .filter_map(|item| item["id"].as_str().map(str::to_owned)),
        );
        if page["has_more"] != true {
            models.sort();
            models.dedup();
            if models.is_empty() {
                return Err(
                    "The server is reachable but has no models available to this account.".into(),
                );
            }
            return Ok(json!({"models":models}));
        }
        let next = page["last_id"]
            .as_str()
            .filter(|id| !id.is_empty() && *id != cursor)
            .ok_or("The model list could not be paginated")?;
        cursor = next.to_owned();
    }
    Err("The model list is too large to load".into())
}

fn blocks(content: &Value) -> Result<Vec<Value>, String> {
    if let Some(text) = content.as_str() {
        return Ok(vec![json!({"type":"text","text":text})]);
    }
    let mut result = Vec::new();
    for part in content.as_array().into_iter().flatten() {
        match part["type"].as_str().unwrap_or("") {
            "text" => result.push(json!({"type":"text","text":part["text"]})),
            "image_url" => {
                let url = part["image_url"]["url"].as_str().unwrap_or("");
                let (mime, data) = url
                    .strip_prefix("data:")
                    .and_then(|s| s.split_once(";base64,"))
                    .ok_or("Unsupported image format")?;
                if !["image/png", "image/jpeg", "image/gif", "image/webp"].contains(&mime) {
                    return Err("Unsupported image format".into());
                }
                result.push(json!({"type":"image","source":{"type":"base64","media_type":mime,"data":data}}));
            }
            _ => return Err("Unsupported model input".into()),
        }
    }
    Ok(result)
}

fn push_message(history: &mut Vec<Value>, role: &str, content: Vec<Value>) {
    if content.is_empty() {
        return;
    }
    if let Some(last) = history.last_mut().filter(|m| m["role"] == role) {
        last["content"].as_array_mut().unwrap().extend(content);
    } else {
        history.push(json!({"role":role,"content":content}));
    }
}

fn push_tool_result(history: &mut Vec<Value>, result: Value) {
    if let Some(last) = history.last_mut().filter(|m| m["role"] == "user") {
        let content = last["content"].as_array_mut().unwrap();
        let index = content
            .iter()
            .take_while(|part| part["type"] == "tool_result")
            .count();
        content.insert(index, result);
    } else {
        push_message(history, "user", vec![result]);
    }
}

pub(super) async fn turn(
    client: &Client,
    base: &str,
    token: &str,
    config: &Value,
    messages: &[Value],
    tools: &[Value],
    observe: &mut impl FnMut(&str, &str),
) -> Result<Value, String> {
    let system = messages
        .iter()
        .filter(|m| m["role"] == "system")
        .map(|m| content_text(&m["content"]))
        .collect::<Vec<_>>()
        .join("\n");
    let mut history = Vec::new();
    for message in messages {
        match message["role"].as_str().unwrap_or("") {
            "system" => {}
            "tool" => push_tool_result(
                &mut history,
                json!({"type":"tool_result","tool_use_id":message["tool_call_id"],"content":message["content"].as_str().unwrap_or("")}),
            ),
            "user" => push_message(&mut history, "user", blocks(&message["content"])?),
            "assistant" => {
                if let Some(saved) = message["_anthropic_content"].as_array() {
                    push_message(&mut history, "assistant", saved.clone());
                } else {
                    push_message(&mut history, "assistant", blocks(&message["content"])?);
                }
            }
            _ => return Err("Unsupported model conversation role".into()),
        }
    }
    let mode = config["toolMode"].as_str().unwrap_or("native");
    let mut body =
        json!({"model":config["model"],"max_tokens":4096,"system":system,"messages":history});
    if mode == "native" && !tools.is_empty() {
        body["tools"] = json!(tools.iter().map(|tool| json!({"name":tool["function"]["name"],"description":tool["function"]["description"],"input_schema":tool["function"]["parameters"]})).collect::<Vec<_>>());
    }
    let response = auth(client.post(format!("{base}/messages")).json(&body), token)?
        .send()
        .await
        .map_err(|_| "Could not reach the model server")?;
    let value = body_json(response, token).await?;
    if value["stop_reason"] == "max_tokens" {
        return Err("The model response exceeded its output limit. Try a smaller task.".into());
    }
    let content = value["content"]
        .as_array()
        .ok_or("The model returned no output")?;
    let mut texts = Vec::new();
    let mut calls = Vec::new();
    for block in content {
        match block["type"].as_str().unwrap_or("") {
            "text" => {
                if let Some(text) = block["text"].as_str() {
                    texts.push(text);
                }
            }
            "tool_use" => {
                if !block["id"].is_string()
                    || !block["name"].is_string()
                    || !block["input"].is_object()
                {
                    return Err("The model returned an invalid tool request".into());
                }
                calls.push(json!({"id":block["id"],"type":"function","function":{"name":block["name"],"arguments":block["input"].to_string()}}));
            }
            _ => {}
        }
    }
    if calls.len() > 8 {
        return Err("The model requested too many simultaneous tool calls".into());
    }
    let text = texts.join("\n");
    observe("model_output", &text);
    if value["usage"].is_object() {
        observe("usage", &value["usage"].to_string());
    }
    if mode == "structured" {
        return Ok(structured_result(&text));
    }
    let mut result = json!({"role":"assistant","content":text,"_anthropic_content":content});
    if !calls.is_empty() {
        result["tool_calls"] = json!(calls);
    }
    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn all_tool_results_precede_images_when_calls_run_together() {
        let mut history = vec![
            json!({"role":"assistant","content":[{"type":"tool_use","id":"one"},{"type":"tool_use","id":"two"}]}),
        ];
        push_tool_result(
            &mut history,
            json!({"type":"tool_result","tool_use_id":"one","content":"ok"}),
        );
        push_message(
            &mut history,
            "user",
            vec![json!({"type":"image","source":{}})],
        );
        push_tool_result(
            &mut history,
            json!({"type":"tool_result","tool_use_id":"two","content":"ok"}),
        );
        assert_eq!(history[1]["content"][0]["tool_use_id"], "one");
        assert_eq!(history[1]["content"][1]["tool_use_id"], "two");
        assert_eq!(history[1]["content"][2]["type"], "image");
    }

    #[tokio::test]
    async fn models_follow_provider_pagination_and_require_a_key() {
        let server = crate::test_support::MockServer::new(|_, path, _| {
            if path.contains("after_id=") {
                json!({"data":[{"id":"model-b"}],"has_more":false})
            } else {
                json!({"data":[{"id":"model-a"}],"has_more":true,"last_id":"model-a"})
            }
        });
        assert!(models(&Client::new(), &server.url, "").await.is_err());
        assert_eq!(
            models(&Client::new(), &server.url, "test-key")
                .await
                .unwrap()["models"],
            json!(["model-a", "model-b"])
        );
    }

    #[tokio::test]
    async fn provider_receives_version_and_api_key_headers() {
        let server = tiny_http::Server::http("127.0.0.1:0").unwrap();
        let address = server.server_addr().to_ip().unwrap();
        let worker = std::thread::spawn(move || {
            let request = server.recv().unwrap();
            let header = |name: &'static str| {
                request
                    .headers()
                    .iter()
                    .find(|h| h.field.equiv(name))
                    .map(|h| h.value.as_str().to_owned())
            };
            assert_eq!(header("x-api-key").as_deref(), Some("test-key"));
            assert_eq!(header("anthropic-version").as_deref(), Some(VERSION));
            assert!(!request.url().contains("test-key"));
            request
                .respond(tiny_http::Response::from_string(
                    r#"{"data":[{"id":"model-a"}],"has_more":false}"#,
                ))
                .unwrap();
        });
        models(&Client::new(), &format!("http://{address}"), "test-key")
            .await
            .unwrap();
        worker.join().unwrap();
    }

    #[tokio::test]
    async fn tool_calls_results_and_image_round_trip() {
        let server = crate::test_support::MockServer::new(|_, path, body| {
            assert_eq!(path, "/v1/messages");
            assert_eq!(body["system"], "Help.");
            assert_eq!(body["tools"][0]["name"], "workspace_read");
            if body["messages"].as_array().unwrap().len() == 1 {
                json!({"content":[{"type":"text","text":"Reading."},{"type":"tool_use","id":"tool-1","name":"workspace_read","input":{"path":"notes.txt"}}],"stop_reason":"tool_use"})
            } else {
                assert_eq!(body["messages"][1]["content"][1]["id"], "tool-1");
                assert_eq!(body["messages"][2]["content"][0]["tool_use_id"], "tool-1");
                assert_eq!(
                    body["messages"][2]["content"][1]["source"]["media_type"],
                    "image/png"
                );
                json!({"content":[{"type":"text","text":"Done."}],"stop_reason":"end_turn","usage":{"input_tokens":10}})
            }
        });
        let config = json!({"model":"test","toolMode":"native"});
        let tools = vec![
            json!({"type":"function","function":{"name":"workspace_read","description":"Read","parameters":{"type":"object"}}}),
        ];
        let mut messages = vec![
            json!({"role":"system","content":"Help."}),
            json!({"role":"user","content":"Read it."}),
        ];
        let first = turn(
            &Client::new(),
            &format!("{}/v1", server.url),
            "test-key",
            &config,
            &messages,
            &tools,
            &mut |_, _| {},
        )
        .await
        .unwrap();
        assert_eq!(
            first["tool_calls"][0]["function"]["arguments"],
            r#"{"path":"notes.txt"}"#
        );
        messages.push(first);
        messages.push(json!({"role":"tool","tool_call_id":"tool-1","content":"contents"}));
        messages.push(json!({"role":"user","content":[{"type":"image_url","image_url":{"url":"data:image/png;base64,YWJj"}}]}));
        let result = turn(
            &Client::new(),
            &format!("{}/v1", server.url),
            "test-key",
            &config,
            &messages,
            &tools,
            &mut |_, _| {},
        )
        .await
        .unwrap();
        assert_eq!(result["content"], "Done.");
    }
}
