# Family Archive System — Roadmap

Repo: **github.com/neely/family-archive-system**

---

## Status
- **Active:** Phase 2 — First family deployment (Ash)
- **Last updated:** 2026-07-16
- **Next action:** Populate `ash-archive-source/data/family-archive-full.json`
  with a first real bootstrap pass — get material from Ash side of family
  (GEDCOM if on Ancestry, or a document/notes dump), run the bootstrap
  annotation session prompt from NOTES.md, review output before committing.

<!-- This block is the "you are here" pointer. Overwrite it every shutdown.
     It lives ONLY here — never duplicate current state in another file. -->

---

## Conventions
- Keep README.md in sync with what's actually live.
- Add decisions to NOTES.md when made; mark settled ones `(locked)`.
- Check off phases below as completed.

---

## ✓ Phase 1 — Framework design
- Schema designed: person records, artifact records with grouped multi-view
  support, relationship arrays, evidence-level tracking (confirmed/proposed/
  superseded) — see NOTES.md for full schema, this is `(locked)`
- Two-tier privacy model designed: private full repo + public sanitized repo,
  gated on `died: null` for living people — `(locked)`
- Change management workflow designed: proposed-changes.json queue,
  manage.js CLI review tool, bidirectional relationship enforcement
- build.js written — sanitizes private fields, unwraps tracked field objects
  for public display, strips history from living people
- manage.js written — interactive CLI accept/reject/skip loop with history
  tracking and append-action support (for artifact views)
- deploy.yml written — GitHub Action: private repo push → build →
  push sanitized output to paired public repo
- Demo site built (voss-family.html) — fictional family, full feature set:
  tree with detail panels, artifact grid with filters (person/location/
  period/type/unannotated/open-questions), multi-view lightbox filmstrip,
  timeline, mailto contribute buttons (artifact + propose-a-change on people)
- GUI manager specified but not built — see reference/GUI_MANAGER_SPEC.md.
  Chat-interface workaround documented as a permanent first-class intake
  method, not just a stopgap, since it needs no API key
- Archival practices audit completed — see reference/ARCHIVAL_AUDIT.md.
  System holds up well against professional standards; gaps are conscious
  and documented (free-text citations, record-level not field-level
  confidence, no physical preservation scope)
- Multi-family model settled: one system repo (this one) + N family repo
  pairs, each family independent, GUI is project-agnostic (opens any
  folder matching the expected structure) — `(locked)`

## Phase 2 — First family deployment (Ash)  ← ACTIVE
- [x] Repos created: ash-archive-source (private), ash-archive (public)
- [ ] Populate first-pass family-archive-full.json for Ash family
- [ ] Set up GitHub Action secret (PUBLIC_REPO_TOKEN) on ash-archive-source
      — use a fresh narrowly-scoped token for this, not a broad session PAT
- [ ] Enable GitHub Pages on ash-archive (public repo)
- [ ] Verify deploy.yml pipeline runs end to end
- [ ] Do first real annotation session with actual Ash family material
- [ ] Update maintainer email in index.html mailto functions (currently
      placeholder your@email.com)
- [ ] Capture lessons learned back into this repo's NOTES.md before
      starting the next family

## Future — Remaining families
- Branstrom — not started, mirrors Ash pattern once proven
- Beal — not started
- Neely — not started
- GUI manager build (Python/tkinter) — deferred until Ash annotation
  sessions reveal what the spec got right/wrong in practice

---

## Handoff → next session
Start prompt:
> Read AGENTS.md, this status block, and NOTES.md in full. Then help me
> bootstrap ash-archive-source/data/family-archive-full.json from
> [GEDCOM export / notes document / whatever material has been gathered].
> Use the bootstrap annotation session prompt in NOTES.md → "Building the
> tree without a GEDCOM" as the starting point.
