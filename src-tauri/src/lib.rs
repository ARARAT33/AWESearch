use serde::Serialize;
use std::{fs, path::PathBuf, time::UNIX_EPOCH};
use walkdir::{DirEntry, WalkDir};

const MAX_NATIVE_FILES: usize = 10_000;
const MAX_NATIVE_TEXT_PER_FILE: usize = 2_000_000;
const MAX_NATIVE_TEXT_TOTAL: usize = 50_000_000;

#[derive(Serialize)]
struct NativeIndexedFile {
    id: String,
    name: String,
    path: String,
    size: u64,
    modified: u64,
    #[serde(rename = "type")]
    file_type: String,
    text: String,
}

fn should_visit(entry: &DirEntry) -> bool {
    if !entry.file_type().is_dir() {
        return true;
    }
    !matches!(
        entry.file_name().to_str(),
        Some(".git" | "node_modules" | "target" | "dist" | ".cache" | ".next")
    )
}

fn is_text_extension(extension: &str) -> bool {
    matches!(
        extension,
        "txt"
            | "md"
            | "markdown"
            | "html"
            | "htm"
            | "json"
            | "csv"
            | "xml"
            | "yaml"
            | "yml"
            | "log"
            | "ts"
            | "tsx"
            | "js"
            | "jsx"
            | "css"
            | "scss"
            | "py"
            | "rs"
            | "go"
            | "java"
            | "kt"
            | "c"
            | "h"
            | "cpp"
            | "sh"
            | "toml"
            | "ini"
            | "sql"
            | "svg"
    )
}

fn read_bounded_text(path: &std::path::Path, remaining_total: usize) -> String {
    if remaining_total == 0 {
        return String::new();
    }
    let Ok(mut contents) = fs::read_to_string(path) else {
        return String::new();
    };
    let max_bytes = MAX_NATIVE_TEXT_PER_FILE.min(remaining_total);
    if contents.len() > max_bytes {
        let mut end = max_bytes;
        while !contents.is_char_boundary(end) {
            end -= 1;
        }
        contents.truncate(end);
    }
    contents.replace('\0', " ")
}

#[tauri::command]
fn index_folder(path: String) -> Result<Vec<NativeIndexedFile>, String> {
    let root = PathBuf::from(path)
        .canonicalize()
        .map_err(|error| format!("Could not open the selected folder: {error}"))?;
    if !root.is_dir() {
        return Err("The selected path is not a folder.".to_string());
    }

    let mut indexed = Vec::new();
    let mut total_text_bytes = 0usize;

    for entry in WalkDir::new(&root)
        .follow_links(false)
        .max_depth(32)
        .into_iter()
        .filter_entry(should_visit)
    {
        let Ok(entry) = entry else {
            continue;
        };
        if !entry.file_type().is_file() {
            continue;
        }
        if indexed.len() >= MAX_NATIVE_FILES {
            break;
        }

        let Ok(metadata) = entry.metadata() else {
            continue;
        };
        let size = metadata.len();
        let relative_path = entry
            .path()
            .strip_prefix(&root)
            .unwrap_or(entry.path())
            .to_string_lossy()
            .replace('\\', "/");
        let name = entry.file_name().to_string_lossy().into_owned();
        let extension = entry
            .path()
            .extension()
            .and_then(|value| value.to_str())
            .unwrap_or("")
            .to_ascii_lowercase();
        let modified = metadata
            .modified()
            .unwrap_or(UNIX_EPOCH)
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis()
            .min(u64::MAX as u128) as u64;

        let text = if is_text_extension(&extension) && size <= MAX_NATIVE_TEXT_PER_FILE as u64 {
            read_bounded_text(
                entry.path(),
                MAX_NATIVE_TEXT_TOTAL.saturating_sub(total_text_bytes),
            )
        } else {
            String::new()
        };
        total_text_bytes = total_text_bytes.saturating_add(text.len());

        indexed.push(NativeIndexedFile {
            id: format!("{relative_path}:{size}:{modified}"),
            name,
            path: relative_path,
            size,
            modified,
            file_type: if extension.is_empty() {
                "file".to_string()
            } else {
                extension
            },
            text,
        });
    }

    Ok(indexed)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![index_folder])
        .run(tauri::generate_context!())
        .expect("error while running AWESEARCH");
}

#[cfg(test)]
mod tests {
    use super::{
        index_folder, is_text_extension, MAX_NATIVE_FILES, MAX_NATIVE_TEXT_PER_FILE,
        MAX_NATIVE_TEXT_TOTAL,
    };

    #[test]
    fn native_index_limits_are_bounded() {
        assert_eq!(MAX_NATIVE_FILES, 10_000);
        assert_eq!(MAX_NATIVE_TEXT_PER_FILE, 2_000_000);
        assert_eq!(MAX_NATIVE_TEXT_TOTAL, 50_000_000);
    }

    #[test]
    fn native_index_only_reads_known_text_extensions() {
        assert!(is_text_extension("txt"));
        assert!(is_text_extension("rs"));
        assert!(!is_text_extension("exe"));
        assert!(!is_text_extension("pdf"));
    }

    #[test]
    fn indexes_a_selected_folder_recursively() {
        use std::{
            fs,
            time::{SystemTime, UNIX_EPOCH},
        };

        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let root = std::env::temp_dir().join(format!("awesearch-native-test-{unique}"));
        let nested = root.join("nested");
        fs::create_dir_all(&nested).unwrap();
        fs::write(nested.join("hello.txt"), "local native search works").unwrap();
        fs::write(nested.join("ignored.exe"), [0_u8, 1, 2, 3]).unwrap();

        let result = index_folder(root.to_string_lossy().into_owned()).unwrap();
        assert_eq!(result.len(), 2);
        let text_file = result.iter().find(|file| file.name == "hello.txt").unwrap();
        assert_eq!(text_file.path, "nested/hello.txt");
        assert_eq!(text_file.text, "local native search works");
        let binary_file = result
            .iter()
            .find(|file| file.name == "ignored.exe")
            .unwrap();
        assert!(binary_file.text.is_empty());

        fs::remove_dir_all(root).unwrap();
    }
}
