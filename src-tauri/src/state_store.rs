use serde_json::Value;
use std::fs;
use std::path::Path;

pub fn load_state_file(path: &Path) -> Option<Value> {
    if !path.exists() {
        return None;
    }
    let raw = fs::read_to_string(path).ok()?;
    serde_json::from_str::<Value>(&raw).ok()
}

pub fn save_state_file(path: &Path, state: &Value) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create state directory: {e}"))?;
    }
    let formatted = serde_json::to_string_pretty(state)
        .map_err(|e| format!("Failed to serialize state: {e}"))?;
    let tmp_path = path.with_extension("json.tmp");
    fs::write(&tmp_path, formatted).map_err(|e| format!("Failed to write temp state: {e}"))?;
    fs::rename(&tmp_path, path).map_err(|e| format!("Failed to commit state file: {e}"))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use tempfile::tempdir;

    #[test]
    fn saves_and_loads_state_roundtrip() {
        let dir = tempdir().expect("tempdir");
        let state_path = dir.path().join("nested").join("workbench-state.json");

        assert!(load_state_file(&state_path).is_none());

        let payload = json!({
            "schemaVersion": 2,
            "activeTab": "checker",
            "builderModIds": ["embeddium", "modernfix"]
        });
        save_state_file(&state_path, &payload).expect("save_state_file");

        let loaded = load_state_file(&state_path).expect("loaded state");
        assert_eq!(loaded, payload);
    }
}
