# AGENTS.md

## Key References

- `docs/requirements_project-startup.md` — Initial requirements definition (startup phase). Some items noted as future work have since been implemented (e.g., Excel export). Treat the codebase as authoritative for current state.
- `src/README.md` — Developer-facing build, test, and distribution instructions.

## What This Project Is (and Is Not)

FP Studio is a desktop application for estimating software scale using the IFPUG-compliant Function Point (FP) method. It calculates Unadjusted Function Points (UFP) and estimated effort from DET/FTR/RET inputs.

**Non-negotiables:**
- IFPUG standard difficulty rules and weight tables are **read-only**. Do not re-add UI for editing them. This was intentionally reverted in Issue #1 to prevent non-standard customization.
- VAF (Value Adjustment Factor) is **intentionally excluded**. The tool focuses on UFP counting only — do not add VAF calculation without explicit user request.
- All data must remain **local-only** (SQLite). No cloud sync, no external API calls for business data.

## Architecture

Electron three-process architecture via `electron-vite`:

```
Renderer (React) → preload (window.fpStudio) → IPC → Main → Service → Repository → SQLite
```

- **`src/src/shared/`** — Types and FP calculation logic shared between Main and Renderer
- **`src/src/main/`** — Electron main process: IPC handlers, service layer, repository, DB, export
- **`src/src/preload/`** — Injects `window.fpStudio` (typed `StudioApi`) into Renderer context
- **`src/src/renderer/`** — React frontend using Fluent UI React Components

All source code lives under `src/` (the `src/` subdirectory is the npm/pnpm workspace root).

## Data Models / Domain Concepts

**Function Types:** `EI` (External Input), `EO` (External Output), `EQ` (External Inquiry), `ILF` (Internal Logical File), `EIF` (External Interface File)

**Reference label:** EI/EO/EQ use **FTR** (File Type Referenced); ILF/EIF use **RET** (Record Element Type). See `getReferenceLabel()` in `shared/fp.ts`.

**Difficulty Matrix:** DET and reference count are bucketed by type-specific thresholds (`DEFAULT_DIFFICULTY_RULES`) and mapped to Low/Average/High via a 3×3 matrix (`DIFFICULTY_MATRIX`). Weight is then looked up from `DEFAULT_WEIGHT_TABLE`.

**DB Schema (Drizzle ORM + SQLite):**
- `projects`: id, name, description, productivity (real), createdAt, updatedAt
- `function_entries`: id, projectId (FK cascade), name, functionType, det, referenceCount, difficulty, functionPoints, note, createdAt, updatedAt
- `settings`: KV store (keys: `defaultProductivity`, `difficultyRules`, `weightTable`)

**Data storage path:**
- macOS: `~/Library/Application Support/FP Studio/`
- Windows: `~/AppData/Roaming/FP Studio/`

## Commands

All commands must be run from the `src/` directory.

```bash
# Format
pnpm format

# Lint
pnpm lint

# Type check
pnpm typecheck

# Unit tests (Vitest)
pnpm test

# Unit tests with coverage
pnpm test:coverage

# Mutation tests (Stryker)
pnpm test:mutation

# E2E tests (Playwright — requires a full build)
pnpm test:e2e

# Dev server
pnpm dev

# Build (type-check + electron-vite build)
pnpm build
```

Use the `/test-ts-project` skill to run format → unit → coverage → mutation tests in sequence.

## Development Rules

- **Implementation order for new features:** `shared/fp.ts` (types/logic) → `shared/ipc.ts` (channel + API types) → `main/ipc/handlers.ts` → `preload/index.ts` → renderer hooks/components.
- **Never edit `.pbxproj` or binary build artifacts** directly.
- **Commit/push requires explicit user permission.** Follow the `git-rule` skill.
- Function entries are ordered by `createdAt DESC`; projects are ordered by `updatedAt DESC`. Preserve this ordering.
- `productivity` is stored per-project as a `real` value rounded to 2 decimal places. Global `defaultProductivity` in settings is the fallback when a project has no override.

## Why Certain Decisions Were Made

- **Difficulty rules and weight tables are read-only:** An earlier version allowed editing these values (Issue #1). This was reverted because allowing non-standard values undermines the IFPUG compliance that is the core value proposition of the app.
- **VAF excluded:** The requirements intentionally simplify to UFP-only counting to reduce learning cost and speed up estimation. Full FP with 14-item VAF is deferred to a potential future release.
- **Local SQLite only:** Business estimates contain sensitive and confidential project information. No cloud dependency ensures offline use and data privacy.
- **Electron chosen over web:** Cross-platform distribution (Windows/Mac) with no internet requirement and native file system access for SQLite and Excel export.
- **Fluent UI React Components:** Provides accessible, production-quality desktop-style components consistent with Windows and modern design expectations.

## Implicit Constraints

- `analyzeFunctionPoint()` in `shared/fp.ts` is the single source of truth for difficulty/FP calculation. The Excel export intentionally replicates this logic as Excel formulas (using `LET`/`INDEX`/`MATCH`) so exported files remain self-contained — keep both in sync if the calculation changes.
- The `settings` table stores `difficultyRules` and `weightTable` as JSON strings. Changing the schema of these types requires a migration and careful backward-compatibility handling in `parseJsonSetting()`.
- `electron-updater` auto-update is wired up in `main/update-manager.ts`. Update state is pushed to the renderer via IPC events (`UPDATE_EVENTS.stateChanged`). Do not block the main process during update checks.

## Open Issues

- **VAF (补正係数) support not implemented.** Requirements note this as a future consideration. No current blocker — it is a scope decision.
- **Custom weight table (enterprise master management screen) not implemented.** The `settings` table already stores `weightTable` as JSON, so infrastructure exists. The UI for editing it was removed in Issue #1 and is currently read-only.

## Current State (2026-06-24)

- Version: **v0.2.0** (latest release)
- Unit test coverage: ~97% (achieved in pre-v0.1.2 work); mutation score: 100%
- E2E (Playwright): covers core project and function entry flows
- **Recent changes:**
  - Issue #1 resolved: Difficulty rule and weight table editing removed; settings panel is now read-only
  - Issue #2 resolved: Project duplication and rename added
  - Project creation moved to a dialog (PR #4)
- **No known open bugs.** Branch `main` is clean.
- Next likely work: new feature requests via GitHub Issues.
