use sha2::{Digest, Sha256};
use std::path::Path;

pub const SERVICE: &str = "dev.localteam.teammate";

pub fn credential_id(dir: &Path) -> Result<String, String> {
    let path =
        std::fs::canonicalize(dir).map_err(|_| "Open Benchhand before connecting the terminal")?;
    let hash = Sha256::digest(path.to_string_lossy().as_bytes());
    Ok(format!(
        "terminal-{}",
        hash.iter()
            .map(|byte| format!("{byte:02x}"))
            .collect::<String>()
    ))
}
