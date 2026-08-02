# PLAN.md

## Goal

- Replace the ad-hoc `docs/Concept.md` + `docs/Architecture.md` + draw.io UML set with the four-document system (`requirements.md` / `specification.md` / `architecture.md` / `design.md`), with all diagrams rewritten as Mermaid.

## Approach

- **Four documents under `docs/`**, split by update frequency, not by topic: `requirements.md` (why/for whom) → `specification.md` (what to build) → `architecture.md` (how — always-on policy) → `design.md` (how — per-feature detail).
- **Mermaid instead of draw.io**: diagrams live inline in the Markdown, so a diagram edit is a text diff reviewable in a PR. The draw.io flow required exporting a `.png` alongside every `.drawio` edit, and the two silently drifted.
- **`docs/architecture.md` is the always-on document.** `AGENTS.md` `Key References` points at it; `design.md` is loaded per feature.
- **Old content is redistributed, not copied wholesale**: `Concept.md` §1–5 → `requirements.md`; `Concept.md` §6 + `Architecture.md` §1 design principles → `architecture.md`; `Architecture.md` §2–3 → `requirements.md`; §4–6 → `design.md`; §7 申し送り事項 → `architecture.md` ADR log + `requirements.md` scope-out.
- **ADR entries are append-only.** A reversed decision gets a new entry linking back to the old one; the old entry is never edited.

## Rejected

- **Keep draw.io as the diagram source**: rejected — binary-ish XML that GitHub cannot diff, and it needs a re-exported PNG per edit, which is exactly how the current `.drawio`/`.png` pairs drifted.
- **Keep `Concept.md` as a fifth document**: rejected — it is a point-in-time startup artifact whose "future work" items (Excel export) are already shipped, so it now contradicts the code. Its still-true content moves into `requirements.md`.
- **Write test cases into the design documents**: rejected — test code is authoritative. Documents carry policy (`architecture.md`) and perspectives (`design.md`) only.
- **Keep the `Handoff Snapshot` section in `AGENTS.md`**: rejected — coverage numbers and surviving-mutant counts expire; `AGENTS.md` holds only permanent, deterministic information. Moved here.

## Next

- Migration is complete on branch `docs/design-docs-migration`; awaiting permission to commit and open the PR.
- After the PR merges, fold this file down to the `Latest Quality Gate` section only — the migration's Why now lives in ADR-007.

## Undecided

- None.

## Latest Quality Gate (2026-07-14, v0.2.1)

Carried over from the old `AGENTS.md` handoff snapshot. Re-run rather than trust these numbers if they matter.

- format / lint / typecheck clean; **153 unit tests pass** (15 files).
- **Branch coverage: 94.82%** (110/116); **mutation score: 98.06%** (354 killed / 7 survived / 0 no-cov). Both above the 90% bar.
- **Surviving mutants (7):** `handlers.ts` (2), `register-handlers.ts` (2), `studio-service.ts` (2), `settings-parsing.ts` (1). Not blocking.
- E2E (Playwright) **not run** on that pass — it needs a full `pnpm build` plus an Electron download.
- **No known open bugs.**
