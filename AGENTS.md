# AGENTS.md

## Key References

- `docs/architecture.md` — **Read this every session.** Technology choices, layer structure, dependency direction, invariants, and the ADR log (append-only).
- `docs/design.md` — Read when working on a specific feature. Module/class structure, processing flows, state transitions, per-feature test perspectives.
- `docs/requirements.md` / `docs/specification.md` — Why the product exists and what it must do. Read when a change touches scope, screens, or the data model.
- `PLAN.md` — In-flight work and the latest quality-gate snapshot. Not a spec; it expires.
- `src/README.md` — Developer-facing build, test, and distribution instructions.

When a document and the code disagree, **the code is authoritative** — fix the document.

## What This Project Is (and Is Not)

**Non-negotiables. Do not propose or implement anything that breaks these:**

- IFPUG standard difficulty rules and weight tables are **read-only**. Do not re-add UI for editing them — that UI existed once and was deliberately reverted in Issue #1 (see ADR-007).
- VAF (Value Adjustment Factor) is **intentionally excluded**. The tool counts UFP only. Do not add VAF calculation without an explicit user request (see ADR-002).
- All business data stays **local** (SQLite). No cloud sync. The update feed is the only outbound network call, and it never carries user data (see ADR-006).
- `analyzeFunctionPoint()` in `shared/fp.ts` is the **single source of truth** for difficulty/FP. The Excel export's formulas are the one deliberate duplicate — change both together (see ADR-005).

Architecture, layering, data model, and the full ADR log live in `docs/`. Source code is under `src/` (that subdirectory is the pnpm workspace root).

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

- **Never edit binary build artifacts** directly.
- **Commit/push requires explicit user permission.** Follow the `git-rule` skill.
- Follow the TDD cycle enforced by the `test-as-tdd` skill. Conventions for layering, naming, error handling, and test naming are in `docs/architecture.md` (共通規約).
- Keep the docs in sync when behavior changes: `docs/design.md` for module/flow changes, `docs/specification.md` for screens, data, or messages, `docs/architecture.md` for a new decision (append a new ADR — never edit an existing one).

## Gotchas

Things that have actually cost time. Not derivable from the code.

- `pnpm install`/`pnpm update` can fail with `ERR_PNPM_PUBLIC_HOIST_PATTERN_DIFF` (stale `node_modules` vs. `.npmrc`'s `shamefully-hoist=true`) or hang waiting on a TTY prompt to remove `node_modules`. Run `CI=true pnpm install` to resolve non-interactively.
- After bumping the `electron` devDependency, the first `pnpm test:e2e` run can time out on the first spec while Playwright downloads the new Electron binary mid-run. Re-run the suite once the binary is cached — this is not a real regression.
- `better-sqlite3` is built for Electron, so its ABI does not match the Node that runs vitest. The DB-query layer cannot be unit-tested; only Playwright e2e exercises real SQLite. Rationale and the workaround (`repositories/settings-parsing.ts`) are in `docs/architecture.md`.
- `DifficultyRule.det` buckets with strict `<`, `reference` with `<=`. They look symmetric and are not. The Excel formula must mirror this exactly.

## Incidents

| Date | What went wrong | Prevention |
| :--- | :--- | :--- |
| 2026-07-03 | `app-paths.test.ts` hardcoded the expected path as a POSIX literal (`/tmp/appdata/FP Studio`), which fails on Windows because `path.join` returns backslash-separated paths there | Build expected path values with `join()` (as the other tests in the same file already did) instead of hardcoding a separator style |
| 2026-07-14 | Excel export difficulty formula used `<=` for DET buckets, diverging from `analyzeFunctionPoint`'s strict `<` at boundaries (58 divergent cases on Excel recalc, e.g. EI DET=5/16) | Guard the JS↔formula sync with exact-string assertions in `project-excel.test.ts`; remember DET uses `<`, reference uses `<=` |
