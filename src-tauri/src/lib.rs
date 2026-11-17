mod hot_db;
mod mods_scanner;
mod state_store;

use hot_db::{
    check_and_cache_hot_db, check_github_release, load_cached_hot_manifest, AppUpdateCheckResult,
    HotDbCheckResult, HotManifestSummary, DEFAULT_HOT_DB_MANIFEST_URL, DEFAULT_RELEASES_PAGE_URL,
};
use mods_scanner::{scan_mods_directory, ScanModsFolderResult};
use serde::Serialize;
use serde_json::Value;
use state_store::{load_state_file, save_state_file};
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMeta {
    pub app_version: String,
    pub hot_manifest: Option<HotManifestSummary>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DesktopUpdateStatusPayload {
    state: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    message: Option<String>,
}

fn app_data_root(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data dir: {e}"))
}

#[tauri::command]
fn desktop_get_meta(app: AppHandle) -> AppMeta {
    let hot_manifest = app_data_root(&app)
        .ok()
        .and_then(|dir| load_cached_hot_manifest(&dir.join("hot-db")));

    AppMeta {
        app_version: env!("CARGO_PKG_VERSION").to_string(),
        hot_manifest,
    }
}

#[tauri::command]
async fn desktop_scan_mods(app: AppHandle) -> Result<ScanModsFolderResult, String> {
    let selected = tauri::async_runtime::spawn_blocking(move || {
        app.dialog()
            .file()
            .set_title("Выберите папку mods")
            .blocking_pick_folder()
    })
    .await
    .map_err(|e| format!("Folder dialog task failed: {e}"))?;

    let Some(file_path) = selected else {
        return Ok(ScanModsFolderResult::canceled_result());
    };

    let path = file_path
        .into_path()
        .map_err(|e| format!("Invalid folder path: {e}"))?;

    Ok(scan_mods_directory(&path))
}

#[tauri::command]
fn desktop_load_state(app: AppHandle) -> Option<Value> {
    let dir = app_data_root(&app).ok()?;
    load_state_file(&dir.join("workbench-state.json"))
}

#[tauri::command]
fn desktop_save_state(app: AppHandle, state: Value) -> bool {
    let Ok(dir) = app_data_root(&app) else {
        return false;
    };
    save_state_file(&dir.join("workbench-state.json"), &state).is_ok()
}

#[tauri::command]
async fn desktop_check_hot_db(app: AppHandle) -> HotDbCheckResult {
    let Ok(dir) = app_data_root(&app) else {
        return HotDbCheckResult {
            status: "error".to_string(),
            updated_at: None,
            message: Some("Failed to resolve app data directory".to_string()),
        };
    };
    check_and_cache_hot_db(&dir.join("hot-db"), DEFAULT_HOT_DB_MANIFEST_URL).await
}

#[tauri::command]
async fn desktop_check_app_update(app: AppHandle) -> AppUpdateCheckResult {
    let _ = app.emit(
        "desktop://update-status",
        DesktopUpdateStatusPayload {
            state: "checking".to_string(),
            version: None,
            message: None,
        },
    );

    let result = check_github_release(env!("CARGO_PKG_VERSION")).await;
    let status_state = if !result.ok {
        "error"
    } else if result
        .version
        .as_deref()
        .is_some_and(|v| hot_db::is_newer_semver(env!("CARGO_PKG_VERSION"), v))
    {
        "available"
    } else {
        "none"
    };

    let _ = app.emit(
        "desktop://update-status",
        DesktopUpdateStatusPayload {
            state: status_state.to_string(),
            version: result.version.clone(),
            message: result.message.clone(),
        },
    );

    result
}

#[tauri::command]
fn desktop_install_app_update(app: AppHandle) -> Result<(), String> {
    app.opener()
        .open_url(DEFAULT_RELEASES_PAGE_URL, None::<&str>)
        .map_err(|e| format!("Failed to open releases page: {e}"))
}

#[tauri::command]
fn desktop_open_external(app: AppHandle, url: String) -> Result<(), String> {
    if !(url.starts_with("https://") || url.starts_with("http://")) {
        return Err("Only http:// and https:// URLs are allowed".to_string());
    }
    app.opener()
        .open_url(url, None::<&str>)
        .map_err(|e| format!("Failed to open external URL: {e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            desktop_get_meta,
            desktop_scan_mods,
            desktop_load_state,
            desktop_save_state,
            desktop_check_hot_db,
            desktop_check_app_update,
            desktop_install_app_update,
            desktop_open_external,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
