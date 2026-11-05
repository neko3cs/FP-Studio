# AGENTS.md

## Key References

- `docs/architecture.md` — **Read this every session.** Technology choices, layer structure, dependency direction, invariants, and the ADR log (append-only).
- `docs/design.md` — Read when working on a specific feature. Module/class structure, processing flows, state transitions, per-feature test perspectives.
- `docs/requirements.md` / `docs/specification.md` — Why the product exists and what it must do. Read when a change touches scope, screens, or the data model.
- `src/README.md` — Developer-facing build and test instructions.

When a document and the code disagree, **the code is authoritative** — fix the document.

## What This Project Is (and Is Not)

**Non-negotiables. Do not propose or implement anything that breaks these:**

- IFPUG standard difficulty rules and weight tables are **read-only**. Do not re-add UI for editing them — that UI existed once and was deliberately reverted in Issue #1 (see ADR-007).
- VAF (Value Adjustment Factor) is **intentionally excluded**. The tool counts UFP only. Do not add VAF calculation without an explicit user request (see ADR-002).
- All business data stays **local** (SQLite). No cloud sync. The update feed is the only outbound network call, and it never carries user data (see ADR-006).
- `analyzeFunctionPoint()` in `shared/fp.ts` is the **single source of truth** for difficulty/FP. The Excel export's formulas are the one deliberate duplicate — change both together (see ADR-005).

## Commands

Run everything from `src/` (the pnpm workspace root), not the repo root.

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test            # Vitest
pnpm test:coverage
pnpm test:mutation   # Stryker, slow
pnpm test:e2e        # Playwright; does a full build first
pnpm dev
pnpm build
```

Use the `test-code` skill for the full post-implementation quality gate.

### GitHub Actions

CI design is documented in `docs/architecture.md` under 「CI での実行」.

- CI's format check covers workflow files too: `pnpm exec prettier --check . ../.github` (fix with `--write`). Plain `pnpm format` does not touch `../.github`.
- `gh workflow run` only works once the workflow exists on the default branch.
- Coverage, mutation reports and E2E traces are in each run's Artifacts (kept 7 days).

## Releasing

Releases are run by `.github/workflows/release.yml` on a `release-*` tag push. Rationale and the unsigned-build trade-offs are in ADR-009.

1. Bump `version` in `src/package.json` and get it merged to `main` (normal commit/PR rules apply).
2. Push the tag `release-<version>` (e.g. `release-0.3.0`) from that commit. The workflow fails if the tag and `package.json` disagree. Do not switch to electron-builder's default `v` prefix: the project kept `release-` for continuity with past tags, and `tagNamePrefix` in `electron-builder.yml` must stay in sync with the workflow trigger and its version check.
3. The workflow runs the full Tests workflow, then each OS job uploads into a single **draft** release.
4. Before asking the user to publish, confirm the draft contains `latest.yml`, `latest-mac.yml`, `latest-linux.yml` and the `.blockmap` files, and that each `url` in them matches an uploaded asset name.
5. **Promoting the draft to a published release ships an update to every user — get explicit user approval first.**

- Never build and upload release assets by hand. Manual uploads omitted `latest*.yml`, which silently broke auto-update for every release up to 0.2.1.
- Builds are intentionally unsigned (cost). Do not add code signing or notarization unless the user asks. Consequence: macOS auto-update does not work (Squirrel.Mac requires a signature); Windows auto-update does.
- `artifactName` in `electron-builder.yml` uses `${name}` (`fp-studio`), not `${productName}`. The space in "FP Studio" makes uploaded file names diverge from the URLs written into `latest*.yml`.
- To check packaging locally without signing credentials (verified with electron-builder 26.15.3):
  `pnpm exec electron-vite build && CSC_IDENTITY_AUTO_DISCOVERY=false pnpm exec electron-builder --mac --publish never`, then inspect `dist/latest-mac.yml`. Delete `dist/` afterwards.

## Development Rules

- **Commit/push requires explicit user permission.**
- Follow the TDD cycle enforced by the `test-as-tdd` skill. Conventions for layering, naming, error handling, and test naming are in `docs/architecture.md` (共通規約).
- Keep the docs in sync when behavior changes: `docs/design.md` for module/flow changes, `docs/specification.md` for screens, data, or messages, `docs/architecture.md` for a new decision (append a new ADR — never edit an existing one).

## Gotchas

Things that have actually cost time. Not derivable from the code.

- `pnpm install`/`pnpm update` can fail with `ERR_PNPM_PUBLIC_HOIST_PATTERN_DIFF` (stale `node_modules` vs. `.npmrc`'s `shamefully-hoist=true`) or hang waiting on a TTY prompt to remove `node_modules`. Run `CI=true pnpm install` to resolve non-interactively.
- After bumping the `electron` devDependency, the first `pnpm test:e2e` run can time out on the first spec while Playwright downloads the new Electron binary mid-run. Re-run the suite once the binary is cached — this is not a real regression.
- `better-sqlite3` is built for Electron, so its ABI does not match the Node that runs vitest. The DB-query layer cannot be unit-tested; only Playwright e2e exercises real SQLite. Rationale and the workaround (`repositories/settings-parsing.ts`) are in `docs/architecture.md`.
- `DifficultyRule.det` buckets with strict `<`, `reference` with `<=`. They look symmetric and are not. The Excel formula must mirror this exactly — the exact-string assertions in `src/src/main/export/project-excel.test.ts` guard it; keep them when touching either side.
- Unit tests run on Windows in CI. Build expected file paths with `path.join()`, never a hardcoded `/`-separated literal (see `app-paths.test.ts`).
