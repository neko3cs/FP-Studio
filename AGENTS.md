# AGENTS.md

## Key References

- `docs/Concept.md` — Project concept document (startup phase). Frames the background, problem, and initial requirements. Some items noted as future work have since been implemented (e.g., Excel export). Treat the codebase as authoritative for current state.
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
- **Test naming convention:** All test names (`describe`/`it`) must be written in Japanese natural language so that the test suite reads as a specification document. Use nested `describe` blocks to group tests by feature and operation (e.g., `プロジェクト管理 > 一覧取得 > 生産性が未設定のときはデフォルト値を使う`). Follow the TDD cycle enforced by the `test-as-tdd` skill.

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
- `pnpm install`/`pnpm update` can fail with `ERR_PNPM_PUBLIC_HOIST_PATTERN_DIFF` (stale `node_modules` vs. `.npmrc`'s `shamefully-hoist=true`) or hang waiting on a TTY prompt to remove `node_modules`. Run `CI=true pnpm install` to resolve non-interactively.
- After bumping the `electron` devDependency, the first `pnpm test:e2e` run can time out on the first spec while Playwright downloads the new Electron binary mid-run. Re-run the suite once the binary is cached — this is not a real regression.

## Open Issues

- **VAF (補正係数) support not implemented.** Requirements note this as a future consideration. No current blocker — it is a scope decision.
- **Custom weight table (enterprise master management screen) not implemented.** The `settings` table already stores `weightTable` as JSON, so infrastructure exists. The UI for editing it was removed in Issue #1 and is currently read-only.

### Test suite gaps (noted 2026-07-14, pending review)

- **`vitest.config.ts` `coverage.include` references a non-existent file.** It lists `src/renderer/src/hooks/useSettingsForm.ts` (no longer exists) and omits the actual `useProjectProductivityForm.ts`. The `stryker.config.json` `mutate` list is correct, so the two are out of sync.
- **`export/project-excel.ts` has no direct test.** `handlers.test.ts` fully mocks `buildProjectWorkbook`, so the Excel-formula generation is unverified — high regression risk given it intentionally replicates `analyzeFunctionPoint()` logic and must stay in sync (see Implicit Constraints).
- **Component tests are excluded from coverage/mutation measurement.** `ProjectSummaryCards.tsx` / `FunctionEntryForm.tsx` have tests but appear in neither `coverage.include` nor `stryker.mutate`, so they contribute nothing to the measured scores.
- **`studio-repository.ts` (real SQLite layer) has no direct test.** It is mocked in the service-layer tests; actual DB interaction is unverified.

## Incidents

| Date | What went wrong | Prevention |
| :--- | :--- | :--- |
| 2026-07-03 | `app-paths.test.ts` hardcoded the expected path as a POSIX literal (`/tmp/appdata/FP Studio`), which fails on Windows because `path.join` returns backslash-separated paths there | Build expected path values with `join()` (as the other tests in the same file already did) instead of hardcoding a separator style |

## Handoff Snapshot (2026-07-14)

- Version: **v0.2.1** on `main`. Working branch `test/review-20260714` (test-review pass; only `AGENTS.md` changed so far).
- Full quality gate re-run on 2026-07-14: format / lint / typecheck all clean; **126 unit tests pass** (13 files).
- **Branch coverage: 95%** (76/80 branches); **mutation score: 98.29%** (345 killed / 6 survived / 0 no-cov). Both above the 90% bar.
- E2E (Playwright) **not run this pass** (requires full `pnpm build` + Electron download); last known green on core project / function-entry flows.
- **Surviving mutants (6):** `register-handlers.ts` `duplicateProject`/`renameProject` arrow bodies (return value unasserted), 2 in `handlers.ts`, 2 in `studio-service.ts` (`??` vs `&&` at :144, `!== undefined` guard at :325). Not blocking.
- Coverage measures 9 files; `useProjectProductivityForm.ts` is mutation-tested (100%) but **excluded from coverage measurement** — see Open Issues → Test suite gaps.
- **No known open bugs.**
