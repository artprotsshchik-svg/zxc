use serde::Serialize;
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ScanModsFolderResult {
    pub canceled: bool,
    pub folder_path: String,
    pub jar_files: Vec<String>,
    pub has_connector_folder: bool,
    pub has_embeddium_sodium_alias: bool,
}

impl ScanModsFolderResult {
    pub fn canceled_result() -> Self {
        Self {
            canceled: true,
            folder_path: String::new(),
            jar_files: Vec::new(),
            has_connector_folder: false,
            has_embeddium_sodium_alias: false,
        }
    }
}

pub fn scan_mods_directory(folder_path: &Path) -> ScanModsFolderResult {
    let mut jar_files: Vec<String> = Vec::new();
    let mut has_connector_folder = false;

    if let Ok(entries) = fs::read_dir(folder_path) {
        for entry in entries.flatten() {
            let Ok(file_type) = entry.file_type() else {
                continue;
            };
            let name = entry.file_name().to_string_lossy().into_owned();
            let lower = name.to_lowercase();

            if file_type.is_file() && lower.ends_with(".jar") {
                jar_files.push(name);
            } else if file_type.is_dir() && lower.contains("connector") {
                has_connector_folder = true;
            }
        }
    }

    jar_files.sort_by(|a, b| {
        a.to_lowercase()
            .cmp(&b.to_lowercase())
            .then_with(|| a.cmp(b))
    });

    let has_embeddium_sodium_alias = jar_files.iter().any(|name| {
        let lower = name.to_lowercase();
        lower.contains("embeddium") || lower.contains("sodium")
    });

    ScanModsFolderResult {
        canceled: false,
        folder_path: folder_path.to_string_lossy().into_owned(),
        jar_files,
        has_connector_folder,
        has_embeddium_sodium_alias,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use tempfile::tempdir;

    #[test]
    fn scans_jars_sorts_and_detects_connector_and_embeddium() {
        let dir = tempdir().expect("tempdir");
        File::create(dir.path().join("ModernFix-5.19.jar")).unwrap();
        File::create(dir.path().join("embeddium-0.3.31.JAR")).unwrap();
        File::create(dir.path().join("README.txt")).unwrap();
        fs::create_dir(dir.path().join("Connector")).unwrap();

        let res = scan_mods_directory(dir.path());
        assert!(!res.canceled);
        assert_eq!(
            res.jar_files,
            vec!["embeddium-0.3.31.JAR", "ModernFix-5.19.jar"]
        );
        assert!(res.has_connector_folder);
        assert!(res.has_embeddium_sodium_alias);
    }

    #[test]
    fn handles_missing_directory_without_panicking() {
        let dir = tempdir().expect("tempdir");
        let missing = dir.path().join("nonexistent");
        let res = scan_mods_directory(&missing);
        assert!(!res.canceled);
        assert!(res.jar_files.is_empty());
        assert!(!res.has_connector_folder);
        assert!(!res.has_embeddium_sodium_alias);
    }
}
