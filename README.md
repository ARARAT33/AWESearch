# AWESEARCH

**One search box for your files and the web.** AWESEARCH is the AWE ecosystem's cross-platform search and browsing workspace, designed for Android, Linux, Windows, macOS, and the web.

## UI previews

These SVG preview images are stored in the repository so the product direction is visible directly on GitHub. They are **illustrative UI previews**, not screenshots captured from a deployed production service; result cards use sample content.

### Desktop workspace

![AWESEARCH desktop workspace preview](docs/screenshots/desktop-home.svg)

### Local search results

![AWESEARCH local results preview](docs/screenshots/local-results.svg)

### Mobile responsive layout

![AWESEARCH mobile layout preview](docs/screenshots/mobile-home.svg)

## Product goals

- **Local-first indexed search:** users choose folders; an index supports fast filename and extracted-text search. Folder access is explicit and revocable.
- **Web discovery:** a provider-based web search interface returns links, titles, snippets, and source information. Search providers must be configured; no fake results.
- **Browser workspace:** URL navigation and saved links, with a clear distinction between the app's search interface and a full browser engine.
- **File manager:** browse indexed files, filter by type, open files using the operating system/browser, and manage indexed folders.
- **ASL extensions:** installable AWE Search Library packages for local extractors, language analyzers, ranking, and search providers. Extensions run with explicit permissions and must not silently access files or transmit content.
- **Multilingual UI:** language packs and Unicode-aware search; initial UI languages include English, Armenian, and Russian.
- **Small AI helpers:** optional, lightweight local extractors/rankers; AI is an enhancement, never required for core search.

## Repository status

This repository is being bootstrapped. The current web prototype provides a responsive UI, client-side file selection, an in-browser index, and local filename/text search. Browser security limits which folders a website can access. Reliable background indexing of arbitrary folders, OS file-manager integration, native browser engine integration, and signed ASL packages require the native app and backend work described in `docs/ARCHITECTURE.md`.

## Run the web prototype

Requirements: Node.js 20+.

```bash
npm install
npm run dev
npm run build
```

## Platform plan

- **Web:** Vite + React; file access only after explicit user selection, browser-dependent.
- **Windows / macOS / Linux:** Tauri 2 desktop shell with native filesystem/indexing service.
- **Android:** Tauri 2 Android target, with Android Storage Access Framework permissions and scoped folder access.
- **Index:** SQLite FTS5 on native platforms; IndexedDB in web prototype.
- **Text extraction:** pluggable, sandboxed extractors for plain text, Markdown, HTML, PDF, and office documents.
- **Search:** local index first; external web providers configured separately.
- **ASL:** versioned, signed, permission-declared extension bundles. See `docs/ASL.md`.

## Security principles

1. Never index a folder without explicit consent.
2. Never upload local file content to web search or AI services by default.
3. Make index location, excluded folders, file types, and deletion controls visible.
4. Treat extracted documents and extension packages as untrusted input.
5. Keep web search and local search results clearly labeled.
6. Do not claim full browser-engine support until a real engine is integrated and tested.

## License

License decision pending.
