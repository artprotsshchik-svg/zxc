use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::Path;

pub const DEFAULT_HOT_DB_MANIFEST_URL: &str =
    "https://artprotsshchik-svg.github.io/1/data/manifest.json";
pub const DEFAULT_RELEASES_API_URL: &str =
    "https://api.github.com/repos/artprotsshchik-svg/1/releases/latest";
pub const DEFAULT_RELEASES_PAGE_URL: &str =
    "https://github.com/artprotsshchik-svg/1/releases";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct HotManifestSummary {
    pub updated_at: String,
    pub sha256: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoteHotDbManifest {
    pub schema_version: u32,
    pub updated_at: String,
    pub sha256: String,
    #[serde(default)]
    pub bytes: Option<u64>,
    #[serde(default = "default_bundle_file")]
    pub bundle_file: String,
}

fn default_bundle_file() -> String {
    "db-bundle.json".to_string()
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HotDbCheckResult {
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppUpdateCheckResult {
    pub ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GitHubLatestRelease {
    tag_name: String,
}

pub fn load_cached_hot_manifest(cache_dir: &Path) -> Option<HotManifestSummary> {
    let path = cache_dir.join("hot-db-manifest.json");
    let raw = fs::read_to_string(path).ok()?;
    let parsed: RemoteHotDbManifest = serde_json::from_str(&raw).ok()?;
    Some(HotManifestSummary {
        updated_at: parsed.updated_at,
        sha256: parsed.sha256,
    })
}

pub fn verify_sha256_hex(bytes: &[u8], expected_hex: &str) -> bool {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    let actual = hex::encode(hasher.finalize());
    actual.eq_ignore_ascii_case(expected_hex.trim())
}

pub fn is_newer_semver(current: &str, candidate: &str) -> bool {
    let parse = |v: &str| -> Option<(u64, u64, u64)> {
        let trimmed = v.trim().trim_start_matches(['v', 'V']);
        let core = trimmed.split(['-', '+']).next()?;
        let mut parts = core.split('.');
        let major = parts.next()?.parse::<u64>().ok()?;
        let minor = parts.next().unwrap_or("0").parse::<u64>().ok()?;
        let patch = parts.next().unwrap_or("0").parse::<u64>().ok()?;
        Some((major, minor, patch))
    };

    match (parse(current), parse(candidate)) {
        (Some(cur), Some(next)) => next > cur,
        _ => false,
    }
}

pub async fn check_and_cache_hot_db(cache_dir: &Path, manifest_url: &str) -> HotDbCheckResult {
    let client = match reqwest::Client::builder()
        .user_agent("VerstakSborok-Desktop/0.1")
        .build()
    {
        Ok(c) => c,
        Err(err) => {
            return HotDbCheckResult {
                status: "error".to_string(),
                updated_at: None,
                message: Some(format!("HTTP client error: {err}")),
            };
        }
    };

    let manifest = match client.get(manifest_url).send().await {
        Ok(resp) if resp.status().is_success() => match resp.json::<RemoteHotDbManifest>().await {
            Ok(m) => m,
            Err(err) => {
                return HotDbCheckResult {
                    status: "error".to_string(),
                    updated_at: None,
                    message: Some(format!("Invalid manifest JSON: {err}")),
                };
            }
        },
        Ok(resp) => {
            return HotDbCheckResult {
                status: "error".to_string(),
                updated_at: None,
                message: Some(format!("Manifest request returned HTTP {}", resp.status())),
            };
        }
        Err(err) => {
            return HotDbCheckResult {
                status: "error".to_string(),
                updated_at: None,
                message: Some(format!("Network error: {err}")),
            };
        }
    };

    if let Some(cached) = load_cached_hot_manifest(cache_dir) {
        if cached.sha256.eq_ignore_ascii_case(&manifest.sha256) {
            return HotDbCheckResult {
                status: "up-to-date".to_string(),
                updated_at: Some(manifest.updated_at),
                message: None,
            };
        }
    }

    let base_url = manifest_url
        .rsplit_once('/')
        .map(|(prefix, _)| prefix)
        .unwrap_or("https://artprotsshchik-svg.github.io/1/data");
    let bundle_url = format!("{base_url}/{}", manifest.bundle_file);

    let bundle_bytes = match client.get(&bundle_url).send().await {
        Ok(resp) if resp.status().is_success() => match resp.bytes().await {
            Ok(b) => b,
            Err(err) => {
                return HotDbCheckResult {
                    status: "error".to_string(),
                    updated_at: None,
                    message: Some(format!("Failed to read bundle bytes: {err}")),
                };
            }
        },
        Ok(resp) => {
            return HotDbCheckResult {
                status: "error".to_string(),
                updated_at: None,
                message: Some(format!("Bundle request returned HTTP {}", resp.status())),
            };
        }
        Err(err) => {
            return HotDbCheckResult {
                status: "error".to_string(),
                updated_at: None,
                message: Some(format!("Bundle download error: {err}")),
            };
        }
    };

    if !verify_sha256_hex(&bundle_bytes, &manifest.sha256) {
        return HotDbCheckResult {
            status: "error".to_string(),
            updated_at: None,
            message: Some("SHA-256 checksum mismatch for db-bundle.json".to_string()),
        };
    }

    if let Err(err) = fs::create_dir_all(cache_dir) {
        return HotDbCheckResult {
            status: "error".to_string(),
            updated_at: None,
            message: Some(format!("Failed to create hot-db cache dir: {err}")),
        };
    }

    if let Err(err) = fs::write(cache_dir.join(&manifest.bundle_file), &bundle_bytes) {
        return HotDbCheckResult {
            status: "error".to_string(),
            updated_at: None,
            message: Some(format!("Failed to write bundle cache: {err}")),
        };
    }

    if let Ok(manifest_json) = serde_json::to_string_pretty(&manifest) {
        let _ = fs::write(cache_dir.join("hot-db-manifest.json"), manifest_json);
    }

    HotDbCheckResult {
        status: "updated".to_string(),
        updated_at: Some(manifest.updated_at),
        message: Some("Локальный кэш базы модов обновлён".to_string()),
    }
}

pub async fn check_github_release(current_version: &str) -> AppUpdateCheckResult {
    let client = match reqwest::Client::builder()
        .user_agent("VerstakSborok-Desktop/0.1")
        .build()
    {
        Ok(c) => c,
        Err(_) => {
            return AppUpdateCheckResult {
                ok: false,
                version: None,
                message: Some("Проверяйте новые версии в разделе Releases на GitHub".to_string()),
            };
        }
    };

    match client.get(DEFAULT_RELEASES_API_URL).send().await {
        Ok(resp) if resp.status().is_success() => match resp.json::<GitHubLatestRelease>().await {
            Ok(rel) => {
                let version = rel.tag_name.trim_start_matches(['v', 'V']).to_string();
                if is_newer_semver(current_version, &rel.tag_name) {
                    AppUpdateCheckResult {
                        ok: true,
                        version: Some(version.clone()),
                        message: Some(format!("Доступна новая версия {version} в GitHub Releases")),
                    }
                } else {
                    AppUpdateCheckResult {
                        ok: true,
                        version: Some(current_version.to_string()),
                        message: Some("Установлена актуальная версия".to_string()),
                    }
                }
            }
            Err(_) => AppUpdateCheckResult {
                ok: false,
                version: None,
                message: Some("Проверяйте новые версии в разделе Releases на GitHub".to_string()),
            },
        },
        _ => AppUpdateCheckResult {
            ok: false,
            version: None,
            message: Some("Проверяйте новые версии в разделе Releases на GitHub".to_string()),
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn verifies_sha256_correctly() {
        let data = b"hello modpack";
        let mut hasher = Sha256::new();
        hasher.update(data);
        let digest = hex::encode(hasher.finalize());

        assert!(verify_sha256_hex(data, &digest));
        assert!(verify_sha256_hex(data, &digest.to_uppercase()));
        assert!(!verify_sha256_hex(b"tampered", &digest));
    }

    #[test]
    fn compares_semver_tags() {
        assert!(is_newer_semver("0.1.0", "v0.1.1"));
        assert!(is_newer_semver("0.1.0", "0.2.0"));
        assert!(is_newer_semver("1.0.0", "2.0.0"));
        assert!(!is_newer_semver("0.1.0", "v0.1.0"));
        assert!(!is_newer_semver("0.2.0", "v0.1.9"));
    }
}
