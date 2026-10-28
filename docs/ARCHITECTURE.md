# AWESEARCH architecture and delivery plan

## Product surfaces

1. **Search home:** one query box; tabs for All, Local, and Web; result cards clearly identify their source.
2. **Local index:** user-selected directories, incremental scans, exclusions, file metadata, extracted text, snippets, ranking, and index controls.
3. **File workspace:** indexed paths, type filters, preview/open actions, favorites, and saved searches.
4. **Web discovery:** provider adapters return normalized results (title, URL, snippet, source, timestamp). Provider failures must be visible.
5. **Browser:** a safe navigation shell. Full modern web compatibility requires an established browser engine/webview; this project must not claim to implement Chromium.
6. **ASL library manager:** discover, install, update, disable, and remove extension packages, with permissions shown before install.

## Platform architecture

- **Shared UI:** React + TypeScript + Vite.
- **Desktop/mobile wrapper:** Tauri 2, Rust core. Targets: Windows, macOS, Linux, Android. Each target requires platform-specific build/signing and real-device tests.
- **Native index:** SQLite with FTS5, normalized metadata, content hashes, mtime/size, extractor version, and index schema version.
- **Web prototype:** IndexedDB/local browser storage. Browser security means it can index only explicitly selected files/folders and cannot continuously scan arbitrary paths.
- **Extraction:** bounded workers; file-size and time limits; parser sandboxing; MIME sniffing rather than trusting extensions. First-party extractors should cover text/Markdown/HTML/JSON/CSV; PDF and office formats need tested adapters.
- **Search:** Unicode normalization, case folding, tokenization per language, exact phrase support, prefix matching, BM25 ranking, then optional semantic/reranking extensions.
- **Web providers:** adapters are configured by users or server-side deployments. Do not embed secret API keys in web builds.
- **Privacy:** local index remains local unless the user explicitly chooses a remote feature and sees what data is sent.

## ASL (AWE Search Library) extension model

An ASL package is a versioned archive containing a manifest, code/data assets, and optional models. Extensions declare capabilities: `extract.text`, `analyze.language`, `rank.results`, `search.web`, or `ui.panel`. No extension may access arbitrary files, run native code, or make network requests without explicit permission. Native extensions should be signed and sandboxed; web extensions should run in a restricted worker/iframe with a narrow message API. See ASL.md.

## Milestones

- **M0 — Bootstrap:** repository structure, responsive UI, local selected-file prototype, documentation, CI.
- **M1 — Reliable local index:** native SQLite FTS5 service, directory selection, incremental watcher, exclusions, cancellation, crash recovery, extractor tests.
- **M2 — Web search:** provider interface, one working provider integration, deduplication, pagination, error states, safe link handling.
- **M3 — File manager:** indexed-folder tree, previews, file actions, saved searches and bookmarks.
- **M4 — ASL:** manifest schema, validation, signing, permission UI, sandbox, package lifecycle, sample extractor.
- **M5 — Platforms:** Tauri shell, Android SAF integration, desktop packaging, web deployment, keyboard/accessibility and localization.
- **M6 — AI micro-tools:** optional compact local classifiers/extractors/rankers; measurable resource budgets and graceful disable switch.
- **M7 — Release quality:** threat model, dependency audit, tests on actual OS/device matrix, backups/recovery, performance benchmarks and signed releases.

## Acceptance gates

A release is not considered complete merely because CI passes. Each milestone needs unit/integration tests, performance and resource measurements, platform-specific manual tests, and an honest list of limitations. No claim of "100% bug-free" is realistic; release readiness is based on measured coverage and known-issue disclosure.
