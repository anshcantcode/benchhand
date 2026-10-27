use crate::{db_error, now, services, stdio, AppState, Connection};
use base64::{engine::general_purpose::STANDARD, Engine};
use ed25519_dalek::{Signature, VerifyingKey};
use rusqlite::{params, OptionalExtension};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::{fs, io::Read, path::Path};
use tauri::{Emitter, Manager, State};
const REGISTRY: &str = "https://registry.modelcontextprotocol.io";
static MUTATION: tokio::sync::Mutex<()> = tokio::sync::Mutex::const_new(());
pub fn migrate(db: &rusqlite::Connection) -> Result<(), String> {
    db.execute_batch("CREATE TABLE IF NOT EXISTS plugin_sources(id TEXT PRIMARY KEY,label TEXT NOT NULL,url TEXT NOT NULL,public_key TEXT NOT NULL); CREATE TABLE IF NOT EXISTS plugins(id TEXT PRIMARY KEY,source TEXT NOT NULL,manifest TEXT NOT NULL,connections TEXT NOT NULL,bots TEXT NOT NULL,enabled INTEGER NOT NULL,installed_at INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS plugin_plans(id TEXT PRIMARY KEY,source TEXT NOT NULL,manifest TEXT NOT NULL,expires INTEGER NOT NULL);").map_err(db_error)
}
fn identifier(id: &str) -> Result<(), String> {
    if id.is_empty()
        || id.len() > 200
        || !id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || "._/-@".contains(c))
        || id.split('/').any(|s| s == ".." || s.is_empty())
    {
        return Err("Invalid plugin identifier".into());
    }
    Ok(())
}
fn hash(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}
fn safe_url(value: &str) -> Result<reqwest::Url, String> {
    let u = reqwest::Url::parse(value).map_err(|_| "Invalid source URL")?;
    if (u.scheme() != "https"
        && !(u.scheme() == "http"
            && [Some("127.0.0.1"), Some("localhost"), Some("[::1]")].contains(&u.host_str())))
        || !u.username().is_empty()
        || u.password().is_some()
    {
        return Err(
            "Use HTTPS, or a loopback HTTP development server, without embedded credentials".into(),
        );
    }
    Ok(u)
}
async fn fetch(state: &AppState, url: &str, limit: usize) -> Result<Vec<u8>, String> {
    safe_url(url)?;
    let mut r = state
        .client
        .get(url)
        .timeout(std::time::Duration::from_secs(30))
        .send()
        .await
        .map_err(|_| "The catalog could not be reached")?;
    if !r.status().is_success() {
        return Err(format!(
            "Catalog returned HTTP {}. Try again or choose another source.",
            r.status().as_u16()
        ));
    }
    let mut b = Vec::new();
    while let Some(c) = r
        .chunk()
        .await
        .map_err(|_| "The catalog download was interrupted")?
    {
        if b.len() + c.len() > limit {
            return Err("Catalog download exceeded its size limit".into());
        }
        b.extend_from_slice(&c);
    }
    Ok(b)
}
fn signed(bytes: &[u8], signature: &str, key: &str) -> Result<(), String> {
    let k: [u8; 32] = STANDARD
        .decode(key.trim())
        .map_err(|_| "Publisher key must be base64")?
        .try_into()
        .map_err(|_| "Publisher key must contain 32 bytes")?;
    let s = Signature::from_slice(
        &STANDARD
            .decode(signature.trim())
            .map_err(|_| "Signature must be base64")?,
    )
    .map_err(db_error)?;
    VerifyingKey::from_bytes(&k)
        .map_err(db_error)?
        .verify_strict(bytes, &s)
        .map_err(|_| "Publisher signature did not match. Nothing was installed.".into())
}
pub fn sources(state: &AppState) -> Result<Value, String> {
    let db = state.lock()?;
    let mut q = db
        .prepare("SELECT id,label,url,public_key FROM plugin_sources ORDER BY label")
        .map_err(db_error)?;
    let mut list = vec![
        json!({"id":"featured","label":"Featured tools","kind":"curated"}),
        json!({"id":"registry","label":"Official MCP Registry","kind":"registry","url":REGISTRY}),
    ];
    for r in q.query_map([],|r|Ok(json!({"id":r.get::<_,String>(0)?,"label":r.get::<_,String>(1)?,"url":r.get::<_,String>(2)?,"publicKey":r.get::<_,String>(3)?,"kind":"signed"}))).map_err(db_error)?{list.push(r.map_err(db_error)?);}
    Ok(json!(list))
}
pub fn installed(state: &AppState) -> Result<Value, String> {
    let db = state.lock()?;
    let mut q=db.prepare("SELECT id,source,manifest,connections,bots,enabled,installed_at FROM plugins ORDER BY installed_at DESC").map_err(db_error)?;
    let rows=q.query_map([],|r|Ok(json!({"id":r.get::<_,String>(0)?,"source":r.get::<_,String>(1)?,"manifest":serde_json::from_str::<Value>(&r.get::<_,String>(2)?).unwrap_or(json!({})),"connectionIds":serde_json::from_str::<Value>(&r.get::<_,String>(3)?).unwrap_or(json!([])),"botIds":serde_json::from_str::<Value>(&r.get::<_,String>(4)?).unwrap_or(json!([])),"enabled":r.get::<_,i64>(5)?!=0,"installedAt":r.get::<_,i64>(6)?}))).map_err(db_error)?;
    Ok(json!(rows
        .collect::<Result<Vec<_>, _>>()
        .map_err(db_error)?))
}
fn featured() -> Value {
    json!([
     {"id":"org.microsoft/playwright","name":"Playwright Browser","description":"Accessibility snapshots, Chrome automation, screenshots, and web workflows in a separate browser profile.","version":"catalog","repository":"https://github.com/microsoft/playwright-mcp","npm":"@playwright/mcp","args":[],"permissions":["Run a local browser server","Read and interact with browser pages","Network access"]},
     {"id":"org.modelcontextprotocol/filesystem","name":"Workspace Files","description":"Read and manage files in a directory you choose. Every tool call is reviewed before execution.","version":"catalog","repository":"https://github.com/modelcontextprotocol/servers","npm":"@modelcontextprotocol/server-filesystem","args":["{directory}"],"fields":[{"name":"directory","description":"Absolute directory this server may access","required":true}],"permissions":["Run a local process","Read and write the directory you select"]},
     {"id":"org.modelcontextprotocol/memory","name":"Persistent Memory","description":"A local knowledge graph for facts and relationships across tasks.","version":"catalog","repository":"https://github.com/modelcontextprotocol/servers","npm":"@modelcontextprotocol/server-memory","args":[],"permissions":["Run a local process","Store a knowledge graph in the plugin directory"]}
    ])
}
async fn catalog(
    state: &AppState,
    source: &str,
    query: &str,
    cursor: &str,
) -> Result<Value, String> {
    if source == "featured" {
        let entries = featured()
            .as_array()
            .unwrap()
            .iter()
            .filter(|v| {
                format!("{} {}", v["name"], v["description"])
                    .to_lowercase()
                    .contains(&query.to_lowercase())
            })
            .cloned()
            .collect::<Vec<_>>();
        return Ok(json!({"entries":entries,"nextCursor":""}));
    }
    if source == "registry" {
        let mut u = reqwest::Url::parse(&format!("{REGISTRY}/v0.1/servers")).unwrap();
        u.query_pairs_mut()
            .append_pair("limit", "24")
            .append_pair("version", "latest");
        if !query.is_empty() {
            u.query_pairs_mut().append_pair("search", query);
        }
        if !cursor.is_empty() {
            u.query_pairs_mut().append_pair("cursor", cursor);
        }
        let v: Value = serde_json::from_slice(&fetch(state, u.as_str(), 4_000_000).await?)
            .map_err(db_error)?;
        let entries=v["servers"].as_array().ok_or("The registry returned an invalid server list")?.iter().filter_map(|v|{let s=&v["server"];if s["name"].is_string(){Some(json!({"id":s["name"],"name":s.get("title").unwrap_or(&s["name"]),"description":s["description"],"version":s["version"],"repository":s["repository"]["url"],"server":s}))}else{None}}).collect::<Vec<_>>();
        return Ok(
            json!({"entries":entries,"nextCursor":v["metadata"]["nextCursor"].as_str().unwrap_or("")}),
        );
    }
    let entry = sources(state)?
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["id"] == source)
        .cloned()
        .ok_or("Catalog source was removed")?;
    let url = entry["url"].as_str().unwrap();
    let bytes = fetch(state, url, 4_000_000).await?;
    let signature =
        String::from_utf8(fetch(state, &format!("{url}.sig"), 1024).await?).map_err(db_error)?;
    signed(&bytes, &signature, entry["publicKey"].as_str().unwrap())?;
    let v: Value = serde_json::from_slice(&bytes).map_err(db_error)?;
    let list = v["plugins"]
        .as_array()
        .ok_or("A signed catalog must contain a plugins array")?;
    if list.len() > 500 {
        return Err("Catalog has more than 500 entries".into());
    }
    Ok(
        json!({"entries":list.iter().filter(|v|format!("{} {}",v["name"],v["description"]).to_lowercase().contains(&query.to_lowercase())).cloned().collect::<Vec<_>>(),"nextCursor":"","signatureVerified":true}),
    )
}
#[tauri::command(rename_all = "camelCase")]
pub async fn marketplace_search(
    source: String,
    query: String,
    cursor: String,
    state: State<'_, AppState>,
) -> Result<Value, String> {
    if query.len() > 200 || cursor.len() > 2000 {
        return Err("Search is too long".into());
    }
    catalog(&state, &source, &query, &cursor).await
}
#[tauri::command(rename_all = "camelCase")]
pub fn save_plugin_source(
    label: String,
    url: String,
    public_key: String,
    state: State<'_, AppState>,
) -> Result<Value, String> {
    safe_url(&url)?;
    if label.trim().is_empty() || label.len() > 100 {
        return Err("Give this catalog a name under 100 characters".into());
    }
    let bytes = STANDARD
        .decode(public_key.trim())
        .map_err(|_| "Use a base64 Ed25519 publisher public key")?;
    if bytes.len() != 32 {
        return Err("The publisher public key must be 32 bytes".into());
    }
    state
        .lock()?
        .execute(
            "INSERT INTO plugin_sources(id,label,url,public_key) VALUES(?1,?2,?3,?4)",
            params![
                uuid::Uuid::new_v4().to_string(),
                label.trim(),
                url,
                public_key.trim()
            ],
        )
        .map_err(db_error)?;
    sources(&state)
}
#[tauri::command(rename_all = "camelCase")]
pub fn delete_plugin_source(
    source_id: String,
    state: State<'_, AppState>,
) -> Result<Value, String> {
    state
        .lock()?
        .execute("DELETE FROM plugin_sources WHERE id=?1", [source_id])
        .map_err(db_error)?;
    sources(&state)
}
fn normalize_registry(server: &Value, variant: usize) -> Result<Value, String> {
    let mut variants = Vec::new();
    for r in server["remotes"].as_array().unwrap_or(&vec![]) {
        if r["type"] == "streamable-http" {
            variants.push(json!({"kind":"http","url":r["url"],"headers":r["headers"]}));
        }
    }
    for p in server["packages"].as_array().unwrap_or(&vec![]) {
        if p["registryType"] == "npm" && p["transport"]["type"] == "stdio" {
            variants.push(json!({"kind":"npm","package":p["identifier"],"version":p["version"],"environmentVariables":p["environmentVariables"],"packageArguments":p["packageArguments"]}));
        }
    }
    let selected = variants.get(variant).ok_or(
        "This listing has no supported transport. Choose Streamable HTTP or an npm stdio package.",
    )?;
    let mut m = json!({"id":server["name"],"name":server.get("title").unwrap_or(&server["name"]),"description":server["description"],"version":server["version"],"repository":server["repository"]["url"],"runtime":selected,"variants":variants,"permissions":["Access the configured service","Every imported tool call requires approval"]});
    if selected["kind"] == "npm" {
        m["permissions"] = json!([
            "Execute third-party code with your user account permissions",
            "Network and local file access",
            "Every imported tool call requires approval"
        ]);
    }
    let mut fields = Vec::new();
    for header in selected["headers"].as_array().unwrap_or(&vec![]) {
        if let Some(vars) = header["variables"].as_object() {
            for (name, v) in vars {
                fields.push(json!({"name":name,"description":v["description"],"secret":v["isSecret"].as_bool().unwrap_or(true),"required":v["isRequired"].as_bool().unwrap_or(true),"default":v["default"]}));
            }
        } else if header["value"].as_str().is_none() {
            fields.push(json!({"name":header["name"],"description":header["description"],"secret":true,"required":header["isRequired"].as_bool().unwrap_or(false)}));
        }
    }
    m["fields"] = json!(fields);
    Ok(m)
}
fn validate_manifest(m: &Value) -> Result<(), String> {
    let r = &m["runtime"];
    if r["packageArguments"]
        .as_array()
        .is_some_and(|a| a.iter().any(|v| v["isSecret"] == true))
    {
        return Err(
            "Pass secrets through environment variables or HTTP headers, not command arguments"
                .into(),
        );
    }
    let fields = m["fields"]
        .as_array()
        .into_iter()
        .flatten()
        .filter(|f| f["secret"] == true)
        .chain(
            r["environmentVariables"]
                .as_array()
                .into_iter()
                .flatten()
                .filter(|f| f["isSecret"] == true),
        );
    for field in fields {
        if let Some(name) = field["name"].as_str() {
            let placeholder = format!("{{{name}}}");
            if r["url"].as_str().is_some_and(|s| s.contains(&placeholder))
                || r["packageArguments"].as_array().is_some_and(|a| {
                    a.iter().any(|v| {
                        v["value"]
                            .as_str()
                            .is_some_and(|s| s.contains(&placeholder))
                    })
                })
                || r["args"].as_array().is_some_and(|a| {
                    a.iter()
                        .any(|v| v.as_str().is_some_and(|s| s.contains(&placeholder)))
                })
            {
                return Err("Pass secrets through environment variables or HTTP headers, not URLs or command arguments".into());
            }
        }
    }

    identifier(m["id"].as_str().ok_or("A plugin needs an id")?)?;
    if !m["name"]
        .as_str()
        .is_some_and(|s| !s.trim().is_empty() && s.len() <= 150)
        || !m["version"]
            .as_str()
            .is_some_and(|s| !s.is_empty() && s.len() <= 100)
    {
        return Err("A plugin needs a name and an exact version".into());
    }
    if m.to_string().len() > 1_000_000 {
        return Err("Plugin manifest is too large".into());
    }
    if let Some(runtime) = m.get("runtime") {
        match runtime["kind"].as_str().unwrap_or("") {
            "http" => {
                safe_url(runtime["url"].as_str().unwrap_or(""))?;
            }
            "npm" => {
                let pkg = runtime["package"].as_str().unwrap_or("");
                if pkg.is_empty()
                    || pkg.len() > 214
                    || !pkg
                        .chars()
                        .all(|c| c.is_ascii_alphanumeric() || "@/._-".contains(c))
                    || pkg.contains("..")
                {
                    return Err("Invalid npm package name".into());
                }
                let v = runtime["version"].as_str().unwrap_or("");
                if v.is_empty()
                    || !v
                        .chars()
                        .all(|c| c.is_ascii_alphanumeric() || ".-+".contains(c))
                    || ["latest", "next", "beta", "*"].contains(&v)
                {
                    return Err("Pin this npm plugin to an exact published version".into());
                }
            }
            "stdio" => {
                if runtime["command"].as_str().is_none() || !runtime["args"].is_array() {
                    return Err("A stdio plugin needs a command and argument array".into());
                }
            }
            _ => return Err("Supported runtimes are http, npm, and stdio".into()),
        }
    }
    if m.get("runtime").is_none() && m.get("bots").is_none() && m.get("theme").is_none() {
        return Err("A plugin must provide MCP tools, teammate templates, or a theme".into());
    }
    if m["bots"].as_array().is_some_and(|b| b.len() > 20) {
        return Err("A plugin may include at most 20 teammate templates".into());
    }
    Ok(())
}
fn plan(state: &AppState, source: &str, m: Value) -> Result<Value, String> {
    validate_manifest(&m)?;
    let id = uuid::Uuid::new_v4().to_string();
    state
        .lock()?
        .execute("DELETE FROM plugin_plans WHERE expires<?1", [now()])
        .map_err(db_error)?;
    state
        .lock()?
        .execute(
            "INSERT INTO plugin_plans(id,source,manifest,expires) VALUES(?1,?2,?3,?4)",
            params![id, source, m.to_string(), now() + 1800],
        )
        .map_err(db_error)?;
    Ok(json!({"planId":id,"manifest":m,"source":source,"sha256":hash(m.to_string().as_bytes())}))
}
#[tauri::command(rename_all = "camelCase")]
pub async fn review_plugin(
    source: String,
    plugin_id: String,
    variant: usize,
    version: Option<String>,
    state: State<'_, AppState>,
) -> Result<Value, String> {
    identifier(&plugin_id)?;
    let mut m = if source == "registry" {
        let mut u = reqwest::Url::parse(REGISTRY).unwrap();
        u.path_segments_mut().unwrap().extend([
            "v0.1",
            "servers",
            &plugin_id,
            "versions",
            version.as_deref().unwrap_or("latest"),
        ]);
        let v: Value = serde_json::from_slice(&fetch(&state, u.as_str(), 2_000_000).await?)
            .map_err(db_error)?;
        normalize_registry(&v["server"], variant)?
    } else {
        catalog(&state, &source, "", "").await?["entries"]
            .as_array()
            .unwrap()
            .iter()
            .find(|v| v["id"] == plugin_id)
            .cloned()
            .ok_or("This catalog entry is no longer available")?
    };
    if source == "featured" {
        let pkg = m["npm"].as_str().unwrap().to_string();
        let v: Value = serde_json::from_slice(
            &fetch(
                &state,
                &format!(
                    "https://registry.npmjs.org/{pkg}/{}",
                    version
                        .as_deref()
                        .filter(|s| !s.is_empty()
                            && s.len() < 100
                            && s.chars()
                                .all(|c| c.is_ascii_alphanumeric() || ".-+".contains(c)))
                        .unwrap_or("latest")
                ),
                2_000_000,
            )
            .await?,
        )
        .map_err(db_error)?;
        m["version"] = v["version"].clone();
        m["runtime"] = json!({"kind":"npm","package":pkg,"version":v["version"],"args":m["args"],"engines":v["engines"]});
    }
    if let Some(bundle) = m["bundle"].as_object() {
        let url = bundle["url"].as_str().ok_or("Bundle URL is required")?;
        let bytes = fetch(&state, url, 10_000_000).await?;
        if hash(&bytes) != bundle["sha256"].as_str().unwrap_or("") {
            return Err("The plugin bundle checksum did not match".into());
        }
        let loaded = bundle_manifest(&bytes)?;
        if loaded["id"] != m["id"] || loaded["version"] != m["version"] {
            return Err("Bundle identity did not match the catalog".into());
        }
        m = loaded;
    }
    plan(&state, &source, m)
}
fn bundle_manifest(bytes: &[u8]) -> Result<Value, String> {
    let mut z = zip::ZipArchive::new(std::io::Cursor::new(bytes)).map_err(db_error)?;
    if z.len() > 100 {
        return Err("Bundle contains more than 100 files".into());
    }
    let mut total = 0;
    for i in 0..z.len() {
        let f = z.by_index(i).map_err(db_error)?;
        if f.enclosed_name().is_none() || f.unix_mode().is_some_and(|m| m & 0o170000 == 0o120000) {
            return Err("Bundle contains an unsafe path".into());
        }
        total += f.size();
        if total > 20_000_000 {
            return Err("Unpacked bundle exceeds 20 MB".into());
        }
    }
    let mut f = z
        .by_name("teammate.json")
        .map_err(|_| "A bundle must contain teammate.json at its root")?;
    let mut bytes = Vec::new();
    f.by_ref()
        .take(1_000_001)
        .read_to_end(&mut bytes)
        .map_err(db_error)?;
    if bytes.len() > 1_000_000 {
        return Err("Manifest exceeds 1 MB".into());
    }
    serde_json::from_slice(&bytes).map_err(db_error)
}
#[tauri::command(rename_all = "camelCase")]
pub fn import_plugin(
    manifest: String,
    bundle: bool,
    state: State<'_, AppState>,
) -> Result<Value, String> {
    let m = if bundle {
        let bytes = STANDARD
            .decode(manifest)
            .map_err(|_| "Invalid bundle encoding")?;
        if bytes.len() > 10_000_000 {
            return Err("Bundle exceeds 10 MB".into());
        }
        bundle_manifest(&bytes)?
    } else {
        serde_json::from_str(&manifest).map_err(db_error)?
    };
    plan(&state, "local", m)
}

fn clean_directory(state: &AppState, path: &Path) -> Result<(), String> {
    let base = state.data_dir.join("plugins");
    if path.starts_with(&base) && path != base && path.exists() {
        fs::remove_dir_all(path).map_err(db_error)?;
    }
    Ok(())
}
fn no_active_work(state: &AppState) -> Result<(), String> {
    let n:i64=state.lock()?.query_row("SELECT COUNT(*) FROM tasks WHERE status='running' OR(status='paused' AND(waiting_approval=1 OR waiting_child<>''))",[],|r|r.get(0)).map_err(db_error)?;
    if n > 0 {
        return Err(
            "Finish or cancel active work and pending approvals before changing installed plugins"
                .into(),
        );
    }
    Ok(())
}
fn may_reuse_credentials(old: &Value, source: &str, manifest: &Value) -> bool {
    let previous = &old["manifest"]["runtime"];
    let current = &manifest["runtime"];
    old["source"] == source
        && previous["kind"] == current["kind"]
        && match current["kind"].as_str().unwrap_or("") {
            "http" => {
                previous["url"] == current["url"] && previous["headers"] == current["headers"]
            }
            "npm" => previous["package"] == current["package"],
            "stdio" => previous["command"] == current["command"],
            _ => false,
        }
}
fn substitute(text: &str, values: &Value) -> Result<String, String> {
    let mut result = text.to_string();
    while let Some(start) = result.find('{') {
        let end = result[start..]
            .find('}')
            .ok_or("Invalid plugin placeholder")?
            + start;
        let name = &result[start + 1..end];
        let value = values[name]
            .as_str()
            .ok_or(format!("Enter a value for {name}"))?;
        if value.contains(['{', '}']) {
            return Err("Plugin values cannot contain placeholder braces".into());
        }
        result.replace_range(start..=end, value);
    }
    Ok(result)
}
async fn prepare_runtime(
    _state: &AppState,
    m: &Value,
    values: &Value,
    dir: &Path,
) -> Result<Value, String> {
    let r = &m["runtime"];
    let mut config = json!({"enabledForAgents":true,"pluginId":m["id"]});
    match r["kind"].as_str().unwrap_or("") {
        "http" => {
            config["baseUrl"] = json!(substitute(r["url"].as_str().unwrap(), values)?);
            safe_url(config["baseUrl"].as_str().unwrap())?;
            config["transport"] = json!("http");
        }
        "stdio" => {
            config["transport"] = json!("stdio");
            config["command"] = r["command"].clone();
            config["args"] = json!(r["args"]
                .as_array()
                .unwrap()
                .iter()
                .map(|v| substitute(v.as_str().unwrap_or(""), values))
                .collect::<Result<Vec<_>, _>>()?);
            config["cwd"] = json!(dir);
        }
        "npm" => {
            let node = stdio::executable("node")?;
            let npm = node
                .parent()
                .unwrap()
                .join("node_modules/npm/bin/npm-cli.js");
            let npm = if npm.is_file() {
                npm
            } else {
                let mut found = None;
                for p in std::env::split_paths(&std::env::var_os("PATH").unwrap_or_default()) {
                    for candidate in [
                        p.join("node_modules/npm/bin/npm-cli.js"),
                        p.join("../lib/node_modules/npm/bin/npm-cli.js"),
                    ] {
                        if candidate.is_file() {
                            found = Some(candidate);
                            break;
                        }
                    }
                }
                found.ok_or("Install Node.js with npm, then restart Benchhand")?
            };
            let package = r["package"].as_str().unwrap();
            let version = r["version"].as_str().unwrap();
            let mut cmd = tokio::process::Command::new(&node);
            cmd.arg(npm)
                .args(["install", "--prefix"])
                .arg(dir)
                .args([
                    "--ignore-scripts",
                    "--engine-strict",
                    "--no-audit",
                    "--no-fund",
                    "--package-lock",
                    "--",
                ])
                .arg(format!("{package}@{version}"))
                .kill_on_drop(true)
                .stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::null());
            #[cfg(windows)]
            cmd.creation_flags(0x08000000);
            let status = tokio::time::timeout(std::time::Duration::from_secs(300), cmd.status())
                .await
                .map_err(|_| "Plugin installation timed out after five minutes")?
                .map_err(|_| "Could not run npm. Install Node.js and npm first.")?;
            if !status.success() {
                return Err(format!("npm could not install this exact plugin version. Required runtime: {}. Check Node.js compatibility, connectivity, and the package version. Install scripts are disabled.",r["engines"]));
            }
            let root = dir.join("node_modules").join(package);
            let meta: Value =
                serde_json::from_slice(&fs::read(root.join("package.json")).map_err(db_error)?)
                    .map_err(db_error)?;
            if meta["version"] != version {
                return Err("Installed package version did not match the reviewed version".into());
            }
            let bin = meta["bin"]
                .as_str()
                .or_else(|| {
                    meta["bin"]
                        .as_object()
                        .and_then(|v| v.values().next())
                        .and_then(Value::as_str)
                })
                .ok_or("This npm package does not expose a server executable")?;
            let script = root.join(bin).canonicalize().map_err(db_error)?;
            if !script.starts_with(root.canonicalize().map_err(db_error)?) {
                return Err("Package executable points outside its package".into());
            }
            // Keep the normal Windows path for Node's ESM entry-point detection.
            // canonicalize() uses a verbatim prefix which some packages compare incorrectly.
            let mut args = vec![root.join(bin).to_string_lossy().to_string()];
            for a in r["args"].as_array().unwrap_or(&vec![]) {
                args.push(substitute(
                    a.as_str().ok_or("Plugin arguments must be text")?,
                    values,
                )?);
            }
            for (i, a) in r["packageArguments"]
                .as_array()
                .unwrap_or(&vec![])
                .iter()
                .enumerate()
            {
                let name = a["name"].as_str().unwrap_or("");
                let key = if name.is_empty() {
                    format!("arg{i}")
                } else {
                    name.into()
                };
                let value = values[&key]
                    .as_str()
                    .or_else(|| a["value"].as_str())
                    .or_else(|| a["default"].as_str());
                if let Some(value) = value {
                    if a["type"] == "named" && !name.is_empty() {
                        args.push(name.into());
                    }
                    args.push(substitute(value, values)?);
                } else if a["isRequired"] == true {
                    return Err(format!("Enter required argument {key}"));
                }
            }
            config["transport"] = json!("stdio");
            config["command"] = json!(node);
            config["args"] = json!(args);
            config["cwd"] = json!(dir);
        }
        _ => return Err("Unknown plugin runtime".into()),
    }
    Ok(config)
}
#[tauri::command(rename_all = "camelCase")]
pub async fn install_plugin(
    plan_id: String,
    values: Value,
    app: tauri::AppHandle,
) -> Result<Value, String> {
    let _mutation = MUTATION.lock().await;
    let state = app.state::<AppState>();
    no_active_work(&state)?;
    if !values.is_object() || values.to_string().len() > 100_000 {
        return Err("Invalid plugin configuration".into());
    }
    let (source, text): (String, String) = state
        .lock()?
        .query_row(
            "SELECT source,manifest FROM plugin_plans WHERE id=?1 AND expires>?2",
            params![plan_id, now()],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )
        .optional()
        .map_err(db_error)?
        .ok_or("This review expired. Review the plugin again.")?;
    let m: Value = serde_json::from_str(&text).map_err(db_error)?;
    validate_manifest(&m)?;
    let id = m["id"].as_str().unwrap();
    let old = installed(&state)?
        .as_array()
        .unwrap()
        .iter()
        .find(|v| v["id"] == id)
        .cloned();
    let directory = state
        .data_dir
        .join("plugins")
        .join(hash(id.as_bytes()))
        .join(uuid::Uuid::new_v4().to_string());
    fs::create_dir_all(&directory).map_err(db_error)?;
    let _ = app.emit(
        "plugin-progress",
        json!({"id":id,"message":"Installing and checking tools…"}),
    );
    let mut created_secrets = Vec::new();
    let result=async{
        let mut connections=Vec::new();let mut bots=Vec::new();
        if m.get("runtime").is_some(){
            let mut config=prepare_runtime(&state,&m,&values,&directory).await?;
            let connection_id=uuid::Uuid::new_v4().to_string();
            let old_secret=if let Some(previous)=old.as_ref().filter(|o|may_reuse_credentials(o,&source,&m)){if let Some(id)=previous["connectionIds"].as_array().and_then(|v|v.first()).and_then(Value::as_str){crate::connection_secret(&state.connection(id)?)?}else{String::new()}}else{String::new()};
            let secret=if config["transport"]=="stdio"{
                let mut env=serde_json::from_str::<Value>(&old_secret).ok().filter(Value::is_object).unwrap_or(json!({}));
                for item in m["runtime"]["environmentVariables"].as_array().unwrap_or(&vec![]){
                    let name=item["name"].as_str().ok_or("Environment variable needs a name")?;
                    let value=values[name].as_str().or_else(||item["value"].as_str()).or_else(||item["default"].as_str()).or_else(||env[name].as_str());
                    if let Some(v)=value{env[name]=json!(v);}else if item["isRequired"]==true{return Err(format!("Enter {name}"));}
                }
                if let Some(extra)=values["environment"].as_object(){
                    for (k,v) in extra{env[k]=v.clone();}
                }
                if env.as_object().is_some_and(|m|m.is_empty()){String::new()}else{env.to_string()}
            }else if m["runtime"]["headers"].as_array().is_some_and(|v|!v.is_empty()){
                let mut headers=serde_json::from_str::<Value>(&old_secret).ok().filter(Value::is_object).unwrap_or(json!({}));
                for h in m["runtime"]["headers"].as_array().unwrap(){let name=h["name"].as_str().ok_or("A header needs a name")?;let value=if let Some(template)=h["value"].as_str(){Some(substitute(template,&values).or_else(|error|headers[name].as_str().map(str::to_owned).ok_or(error))?)}else{values[name].as_str().map(str::to_string).or_else(||headers[name].as_str().map(str::to_string))};if let Some(v)=value{headers[name]=json!(v);}else if h["isRequired"]==true{return Err(format!("Enter {name}"));}}
                headers.to_string()
            }else{values["token"].as_str().filter(|s|!s.is_empty()).unwrap_or(&old_secret).into()};
            let temp=Connection{id:connection_id.clone(),kind:"mcp".into(),label:m["name"].as_str().unwrap().into(),config:config.clone(),account:String::new(),verified_at:now()};
            let tools=if config["transport"]=="stdio"{stdio::request(&temp,&secret,"tools/list",json!({})).await}else{services::mcp_request(&state.client,config["baseUrl"].as_str().unwrap(),&secret,"tools/list",json!({})).await};
            stdio::stop(&connection_id).await;
            let tools=tools?;let tools=tools["tools"].as_array().filter(|v|v.len()<=100).ok_or("Plugin must expose at most 100 tools")?;
            config["tools"]=json!(tools);config["hasSecret"]=json!(!secret.is_empty());
            if !secret.is_empty(){crate::write_secret(&connection_id,&secret)?;created_secrets.push(connection_id.clone());}
            connections.push((connection_id,config,format!("{} tools",tools.len())));
        }
        if let Some(templates)=m["bots"].as_array(){for (i,b) in templates.iter().enumerate(){let id=old.as_ref().and_then(|o|o["botIds"].as_array()).and_then(|a|a.get(i)).and_then(Value::as_str).map(str::to_owned).unwrap_or_else(||uuid::Uuid::new_v4().to_string());let bot=crate::Bot{id,name:b["name"].as_str().unwrap_or("Teammate").chars().take(60).collect(),role:b["role"].as_str().unwrap_or("Assistant").chars().take(100).collect(),description:b["description"].as_str().unwrap_or("").chars().take(300).collect(),instructions:b["instructions"].as_str().unwrap_or("").chars().take(12000).collect(),color:"#54c2a4".into(),provider_id:String::new()};bots.push(bot);}}
        // Installation is committed only after the runtime answers tools/list.
        no_active_work(&state)?;
        {let mut db=state.lock()?;let tx=db.transaction().map_err(db_error)?;
        for (cid,config,account) in &connections{tx.execute("INSERT INTO connections(id,kind,label,config,account,verified_at) VALUES(?1,'mcp',?2,?3,?4,?5)",params![cid,m["name"].as_str().unwrap(),config.to_string(),account,now()]).map_err(db_error)?;}
        for b in &bots{tx.execute("INSERT OR IGNORE INTO bots(id,name,role,description,instructions,color,provider_id) VALUES(?1,?2,?3,?4,?5,?6,'')",params![b.id,b.name,b.role,b.description,b.instructions,b.color]).map_err(db_error)?;}
        tx.execute("INSERT INTO plugins(id,source,manifest,connections,bots,enabled,installed_at) VALUES(?1,?2,?3,?4,?5,1,?6) ON CONFLICT(id) DO UPDATE SET source=excluded.source,manifest=excluded.manifest,connections=excluded.connections,bots=excluded.bots,enabled=1,installed_at=excluded.installed_at",params![id,source,text,json!(connections.iter().map(|c|&c.0).collect::<Vec<_>>()).to_string(),json!(bots.iter().map(|b|&b.id).collect::<Vec<_>>()).to_string(),now()]).map_err(db_error)?;
        tx.execute("DELETE FROM plugin_plans WHERE id=?1",[plan_id]).map_err(db_error)?;tx.commit().map_err(db_error)?;}

        Ok::<_,String>(())
    }.await;
    if let Err(error) = result {
        for id in &created_secrets {
            if let Ok(entry) = crate::secret_entry(id) {
                let _ = entry.delete_credential();
            }
        }
        let _ = clean_directory(&state, &directory);
        return Err(error);
    }
    if let Some(old) = old {
        if let Err(error) = remove_resources(&state, &old, false).await {
            let _=app.emit("plugin-progress",json!({"id":id,"message":format!("Update installed. Old runtime cleanup needs attention: {error}")}));
        }
    }
    // Non-runtime templates need no installed files.
    if m.get("runtime").is_none() {
        let _ = clean_directory(&state, &directory);
    }
    let _ = app.emit("workspace-updated", json!({"plugins":true}));
    installed(&state)
}
async fn remove_resources(
    state: &AppState,
    entry: &Value,
    remove_bots: bool,
) -> Result<(), String> {
    for id in entry["connectionIds"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(Value::as_str)
    {
        stdio::stop(id).await;
        if let Ok(c) = state.connection(id) {
            if c.config["hasSecret"] == true {
                match crate::secret_entry(id)?.delete_credential() {
                    Ok(()) | Err(keyring::Error::NoEntry) => {}
                    Err(_) => {
                        return Err("Unlock the credential store before removing this plugin".into())
                    }
                }
            }
            if let Some(dir) = c.config["cwd"].as_str() {
                clean_directory(state, Path::new(dir))?;
            }
            state
                .lock()?
                .execute("DELETE FROM connections WHERE id=?1", [id])
                .map_err(db_error)?;
        }
    }
    if remove_bots {
        for id in entry["botIds"]
            .as_array()
            .unwrap_or(&vec![])
            .iter()
            .filter_map(Value::as_str)
        {
            state.lock()?.execute("DELETE FROM bots WHERE id=?1 AND NOT EXISTS(SELECT 1 FROM tasks WHERE bot_id=?1) AND NOT EXISTS(SELECT 1 FROM schedules WHERE bot_id=?1)",[id]).map_err(db_error)?;
        }
    }
    Ok(())
}
#[tauri::command(rename_all = "camelCase")]
pub async fn uninstall_plugin(plugin_id: String, app: tauri::AppHandle) -> Result<Value, String> {
    let _mutation = MUTATION.lock().await;
    let state = app.state::<AppState>();
    no_active_work(&state)?;
    let p = installed(&state)?
        .as_array()
        .unwrap()
        .iter()
        .find(|v| v["id"] == plugin_id)
        .cloned()
        .ok_or("Plugin is not installed")?;
    remove_resources(&state, &p, true).await?;
    state
        .lock()?
        .execute("DELETE FROM plugins WHERE id=?1", [plugin_id])
        .map_err(db_error)?;
    let _ = app.emit("workspace-updated", json!({"plugins":true}));
    installed(&state)
}
#[tauri::command(rename_all = "camelCase")]
pub async fn toggle_plugin(
    plugin_id: String,
    enabled: bool,
    app: tauri::AppHandle,
) -> Result<Value, String> {
    let _mutation = MUTATION.lock().await;
    let state = app.state::<AppState>();
    no_active_work(&state)?;
    let p = installed(&state)?
        .as_array()
        .unwrap()
        .iter()
        .find(|v| v["id"] == plugin_id)
        .cloned()
        .ok_or("Plugin is not installed")?;
    for id in p["connectionIds"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(Value::as_str)
    {
        let c = state.connection(id)?;
        let mut config = c.config;
        config["enabledForAgents"] = json!(enabled);
        state
            .lock()?
            .execute(
                "UPDATE connections SET config=?2 WHERE id=?1",
                params![id, config.to_string()],
            )
            .map_err(db_error)?;
        if !enabled {
            stdio::stop(id).await;
        }
    }
    state
        .lock()?
        .execute(
            "UPDATE plugins SET enabled=?2 WHERE id=?1",
            params![plugin_id, enabled],
        )
        .map_err(db_error)?;
    let _ = app.emit("workspace-updated", json!({"plugins":true}));
    installed(&state)
}
#[tauri::command(rename_all = "camelCase")]
pub fn plugin_theme(plugin_id: String, state: State<'_, AppState>) -> Result<Value, String> {
    let p = installed(&state)?
        .as_array()
        .unwrap()
        .iter()
        .find(|v| v["id"] == plugin_id && v["enabled"] == true)
        .cloned()
        .ok_or("Enable this plugin first")?;
    let theme = p["manifest"]["theme"]
        .as_object()
        .ok_or("This plugin has no theme")?;
    let mut settings = state.settings()?;
    for key in [
        "theme",
        "accent",
        "density",
        "fontSize",
        "radius",
        "font",
        "background",
        "reduceMotion",
        "sidebarCompact",
    ] {
        if let Some(v) = theme.get(key) {
            settings[key] = v.clone();
        }
    }
    let settings = crate::validate_settings(&settings)?;
    state
        .lock()?
        .execute(
            "INSERT OR REPLACE INTO preferences(key,value) VALUES('settings',?1)",
            [settings.to_string()],
        )
        .map_err(db_error)?;
    Ok(settings)
}

#[cfg(test)]
mod tests {
    use super::*;
    use ed25519_dalek::{Signer, SigningKey};
    #[test]
    fn secret_parameters_cannot_be_persisted_in_urls_or_arguments() {
        let mut m = json!({"id":"test/secrets","name":"Secret test","version":"1","fields":[{"name":"TOKEN","secret":true}],"runtime":{"kind":"http","url":"https://example.org/mcp/{TOKEN}"}});
        assert!(validate_manifest(&m).is_err());
        m["runtime"] = json!({"kind":"stdio","command":"node","args":["--key={TOKEN}"]});
        assert!(validate_manifest(&m).is_err());
        m["runtime"] = json!({"kind":"http","url":"https://example.org/mcp","headers":[{"name":"Authorization","value":"Bearer {TOKEN}"}]});
        assert!(validate_manifest(&m).is_ok());
    }
    #[test]
    fn credentials_stay_with_their_catalog_and_endpoint() {
        let m = json!({"runtime":{"kind":"http","url":"https://trusted.example/mcp"}});
        let old = json!({"source":"trusted","manifest":m});
        assert!(may_reuse_credentials(&old, "trusted", &m));
        assert!(!may_reuse_credentials(&old, "other-catalog", &m));
        let changed = json!({"runtime":{"kind":"http","url":"https://other.example/mcp"}});
        assert!(!may_reuse_credentials(&old, "trusted", &changed));
    }
    #[test]
    fn signatures_detect_changes_and_untrusted_keys() {
        let key = SigningKey::from_bytes(&[17; 32]);
        let bytes = b"{\"plugins\":[]}";
        let sig = STANDARD.encode(key.sign(bytes).to_bytes());
        let public = STANDARD.encode(key.verifying_key().to_bytes());
        assert!(signed(bytes, &sig, &public).is_ok());
        assert!(signed(b"changed", &sig, &public).is_err());
        assert!(signed(
            bytes,
            &sig,
            &STANDARD.encode(SigningKey::from_bytes(&[18; 32]).verifying_key().to_bytes())
        )
        .is_err());
    }
    #[test]
    fn rejects_unpinned_packages_unsafe_urls_and_bad_bundles() {
        let mut m = json!({"id":"test/plugin","name":"Plugin","version":"1.0.0","runtime":{"kind":"npm","package":"@example/server","version":"latest"}});
        assert!(validate_manifest(&m).is_err());
        m["runtime"]["version"] = json!("1.2.3");
        assert!(validate_manifest(&m).is_ok());
        assert!(safe_url("https://user:password@example.org").is_err());
        assert!(safe_url("http://example.org").is_err());
        assert!(safe_url("http://127.0.0.1:9000/mcp").is_ok());
        let mut bytes = std::io::Cursor::new(Vec::new());
        {
            let mut zip = zip::ZipWriter::new(&mut bytes);
            zip.start_file("../teammate.json", zip::write::SimpleFileOptions::default())
                .unwrap();
            std::io::Write::write_all(&mut zip, b"{}").unwrap();
            zip.finish().unwrap();
        }
        assert!(bundle_manifest(bytes.get_ref()).is_err());
    }
    #[test]
    fn registry_supports_http_and_npm_variants() {
        let s = json!({"name":"example/server","title":"Server","version":"1","remotes":[{"type":"streamable-http","url":"https://example.org/mcp"}],"packages":[{"registryType":"npm","identifier":"@example/server","version":"1.0.0","transport":{"type":"stdio"}}]});
        assert_eq!(
            normalize_registry(&s, 0).unwrap()["runtime"]["kind"],
            "http"
        );
        assert_eq!(normalize_registry(&s, 1).unwrap()["runtime"]["kind"], "npm");
        assert!(normalize_registry(&s, 2).is_err());
    }
}
