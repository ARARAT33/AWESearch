# ASL — AWE Search Library

ASL packages extend AWESEARCH with search providers, text extractors, language analyzers, ranking modules, and small optional AI helpers.

## Proposed package layout

```text
example.asl
├── manifest.json
├── README.md
├── assets/
└── module/
    └── entry.js
```

## Manifest v1 draft

```json
{
  "format": "asl",
  "manifestVersion": 1,
  "id": "org.example.plain-text-extractor",
  "name": "Plain Text Extractor",
  "version": "1.0.0",
  "description": "Extracts UTF-8 text from supported text files.",
  "apiVersion": "1",
  "entry": "module/entry.js",
  "capabilities": ["extract.text"],
  "fileTypes": ["txt", "md", "csv", "json"],
  "permissions": [],
  "resourceLimits": {
    "maxMemoryMb": 32,
    "maxExecutionMs": 1500,
    "maxInputBytes": 2000000
  }
}
```

This is a design proposal, not yet an implemented package loader.

## Required rules

- Validate schema, IDs, versions, file paths, archive size, and hashes before install.
- Reject path traversal, symlinks escaping the package, duplicate manifest keys, and unsupported API versions.
- Display publisher, version, requested capabilities, network access, and data-handling behavior before install.
- No network permission by default. No arbitrary filesystem access by default.
- A web-search extension receives the query string only; it does not receive local file contents unless a separate explicit user action authorizes it.
- Extractors receive a bounded byte stream and return plain text plus structured metadata; they cannot choose arbitrary output paths.
- Run web modules in a worker with a narrow API. Native code must be signed, sandboxed, and platform-reviewed.
- Provide disable, uninstall, update rollback, and permission revocation.
- Do not automatically download model weights. Show model size, license, memory estimate, and origin.
- Treat all extension output and extracted documents as untrusted data.

## Initial library categories

- `extract.text`: text/Markdown/HTML/CSV/JSON and later PDF/Office formats.
- `analyze.language`: Unicode normalization, language detection, tokenization, stemming.
- `search.web`: provider adapters returning normalized search results.
- `rank.results`: lexical ranking and optional lightweight reranking.
- `ai.local`: optional compact on-device helpers with explicit resource limits.
- `ui.panel`: extension UI, isolated from privileged app APIs.

## Status

Manifest, package layout, permissions, and threat model are specified here. Installer, signatures, sandbox, catalog, and runtime are future implementation work.
