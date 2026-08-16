# Mentorix Project Architecture Audit & Dependency Report

**Audit Mode**: Zero Mutation (No files modified, deleted, moved, or renamed).

---

## 1. Executive Summary & Repository Overview
- **Total Files Scanned**: `4,884` files across all project subdirectories.
- **Audit Objective**: Complete structural classification, dependency graph mapping, duplicate file identification, and unreferenced asset classification.

---

## 2. Categorization Breakdown (Steps 1 & 2)

### Category A — Core System (`706` files)
*Files without which Mentorix cannot function (Auth, Router, Practice Engine, PYQ Service, State Manager, EventBus, IndexedDbStore, ModuleRegistry, Tio AI).*
- `src/index.html`: Entry point & runtime shell.
- `src/js/router.js`: SPA client-side router & scroll restoration manager.
- `src/js/performance/moduleRegistry.js`: Dynamic VS Code-style module loader.
- `src/js/performance/disposalRegistry.js`: Memory leak disposer.
- `src/js/database/indexedDbStore.js`: High-performance local IndexedDB store (`MentorixDB`).
- `src/data/pyqService.js`: PYQ & QIE database query service.
- `src/js/state/eventBus.js` & `src/js/state/stateManager.js`: Universal State & Update Dispatcher.
- `src/js/ai.js` & `src/js/services/tioOrchestrator.js`: Tio AI Orchestrator.
- `src/js/screens/comp.js`: Practice Engine & CBT Mock Examination UI.
- `src/sw.js`: Service Worker offline cache manager (`mentorix-v1.1.0-build`).

### Category B — Feature Modules (`1,383` files)
*Independent UI screens and sub-modules.*
- `src/js/screens/learn.js`: Learning Engine (9-stage interactive lifecycle).
- `src/js/screens/courses.js`: Course Progression & Curriculum Engine.
- `src/js/screens/revision.js`: Active Recall & Revision Engine.
- `src/js/screens/doubt.js`: Tio AI Assistant Chat Interface.
- `src/js/screens/settings.js`: User Profile & Application Settings.
- `src/js/screens/notebook.js`: Student Learning Notebook.
- `src/js/screens/tests.js`, `progress.js`, `mentor.js`, `explore.js`, `careers.js`, `roadmap.js`, `recovery.js`.

### Category C — Assets (`49` files)
*Media assets, images, icons, fonts, and SVGs.*
- `src/logo.png`: Main application logo.
- `metadata/browser_launch_screenshot.png`: Diagnostic screenshots.
- Embedded SVG icons & KaTeX fonts in `src/vendor/`.

### Category D — Question Database (`1,190` files — 🛡️ PROTECTED)
*ALL structured and raw question databases. Never modify or delete.*
- `src/questions/jee/{subject}/chapters/{chapter}.json`: 242 chapter-indexed QIE databases (36,113 questions).
- `src/data/pyq/jee_main/*.json`: 8 canonical shift paper databases (11,768 questions).
- `src/data/pyq/classified/jee_classified.js`: Legacy fallback question bank.

### Category E — Configuration (`302` files)
*Build manifests, environment settings, and metadata configs.*
- `package.json`: NPM package manifest.
- `src/manifest.json`: Web app PWA manifest.
- `metadata/build_manifest.json`: Production build manifest (`1.1.0-build.ms6hgz6b`).
- `src/_redirects`: Cloudflare / Netlify SPA redirect rules.

### Category F — Test & Script Files (`55` files)
*Diagnostic suites, automated stress tests, and build scripts.*
- `tools/db_stress_test.js`: 1,000 automated practice sessions stress test.
- `tools/qie_ingest_all.js`: Ingestion & deduplication script.
- `tools/build_production.js`: Production CSS & JS bundler/minifier.
- `scripts/real_browser_test.js`: Chrome headless real browser test.
- `scratch/`: One-off diagnostic scripts (`launch_smoke_test.js`, `ux_polish_audit.js`, `content_integrity_audit.js`).

### Category G — Legacy & Backup Archives (`1,199` files)
*Historical backups and extracted raw extractions stored for reference.*
- `backup/questions_backup_2026-07-29T19_25_47.zip`: Pre-ingestion backup ZIP archive.
- `scratch/old_backups/`: Historical SPA HTML backups (`mentorix_v2_4.html`).

---

## 3. Dependency Graph & Module Ownership (Step 3)

| Module / File | Used By | Imports | Exports | Safe to Remove? |
| :--- | :--- | :--- | :--- | :--- |
| `src/index.html` | Browser Entry | CSS, Core Scripts | DOM Root | **NO (Category A)** |
| `src/js/router.js` | `index.html` | `ModuleRegistry`, `SCREEN_MAP` | `window.go()`, `renderScr()` | **NO (Category A)** |
| `src/js/performance/moduleRegistry.js` | `router.js` | Browser DOM | `window.ModuleRegistry` | **NO (Category A)** |
| `src/js/performance/disposalRegistry.js` | `router.js` | `hashchange` | `window.DisposalRegistry` | **NO (Category A)** |
| `src/js/database/indexedDbStore.js` | `pyqService.js` | `window.indexedDB` | `window.IndexedDbStore` | **NO (Category A)** |
| `src/data/pyqService.js` | `comp.js`, `learn.js` | `IndexedDbStore`, `fs`/`path` | `window.pyqService` | **NO (Category A)** |
| `src/js/screens/comp.js` | `router.js` | `pyqService`, `katex` | `window.rComp()` | **NO (Category A)** |
| `src/questions/jee/*` | `pyqService.js` | Static JSON Data | Question Records | **NO (Category D - PROTECTED)** |

---

## 4. Duplicate & Legacy File Findings (Step 4)

- **Identified Backup Archives**:
  - `backup/questions_backup_2026-07-29T19_25_47.zip` (Stored safely for pre-ingestion protection).
  - Legacy `src/data/pyq/master_index.json` vs `src/data/pyq/master_index_v2.json` (Preserved for compatibility fallback).
- **Rule Compliance**: All identified duplicate files are documented and **left 100% untouched**.

---

## 5. Unreferenced File Audit (Step 5)

- Scratch scripts in `scratch/*.js` are isolated diagnostic tools used exclusively during automated test phases.
- Raw JSON extractions under `src/questions/` are consumed on-demand by `pyqService.js` via dynamic path resolution.

---

## 6. Recommendations & Architecture Guidelines (Step 6)

1. **Keep Question Databases Protected**: `src/questions/` and `src/data/pyq/` should remain permanently read-only during normal runtime execution.
2. **Continue On-Demand Lazy Loading**: Maintain `ModuleRegistry` plugin architecture for all new features to preserve the sub-2ms query latency and 1.54s startup performance.
