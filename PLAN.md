# Family Archive System — Roadmap

Repo: **github.com/neely/family-archive-system**

---

## Status
- **Active:** Phase 2 — First family deployment (Ash)
- **Last updated:** 2026-07-16
- **Next action:** Connect Cloudflare Pages to ash-archive (dashboard —
  can't be done via API/token), then set the PUBLIC_REPO_TOKEN secret and
  repo variables on ash-archive-source. Both are dashboard/manual actions,
  not something to hand to a Claude session. Once done, verify the pipeline
  with a test push before starting real annotation work. Full outstanding
  list in Phase 2 below.

<!-- This block is the "you are here" pointer. Overwrite it every shutdown.
     It lives ONLY here — never duplicate current state in another file. -->

---

## Conventions
- Keep README.md in sync with what's actually live.
- Add decisions to NOTES.md when made; mark settled ones `(locked)`.
- Check off phases below as completed.
- **Big-session trigger:** if a session touches more than ~5 files or spans
  more than one sitting, treat it as a big session per AGENTS.md — run all
  five debrief questions (not just Q1/Q5), and report the shutdown routine
  as an itemized list, not prose. Don't wait to be asked.

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
- Demo site built (voss-family.html, in templates/) — fictional family, full
  feature set: tree with detail panels, artifact grid with filters (person/
  location/period/type/unannotated/open-questions), multi-view lightbox
  filmstrip, timeline, mailto contribute buttons (artifact + propose-a-change
  on people). **Corrected during Ash repo setup (2026-07-16):** originally had
  all data hardcoded in the HTML/JS, which would have silently broken the
  entire private→public deploy pipeline (nothing for it to actually deliver).
  Converted to runtime fetch of family-archive.json + dynamic generation-depth
  tree layout. See NOTES.md known limitations for what this traded away
  (SVG connector lines) and what's still outstanding (real image rendering,
  still emoji placeholders).
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

**Infrastructure (blocking, do these before real annotation work):**
- [x] Repos created: ash-archive-source (private), ash-archive (public)
- [x] GitHub Pages enabled then disabled — Cloudflare Pages is the actual
      target, see NOTES.md → "Deployment target"
- [ ] **Cloudflare Pages connected** to ash-archive (dashboard action —
      Workers & Pages → Create → Connect to Git → neely/ash-archive → no
      build command, output directory `/`). Not something an API token can
      do; needs the Cloudflare dashboard.
- [ ] Custom subdomain decided and configured for Ash (pattern:
      `ash.benneely.com` or similar — not yet decided)
- [ ] **PUBLIC_REPO_TOKEN secret set** on ash-archive-source (Settings →
      Secrets → Actions) — generate a *fresh*, narrowly-scoped PAT for this
      (contents:write on ash-archive only), do not reuse a broad session PAT
- [ ] PUBLIC_REPO_OWNER / PUBLIC_REPO_NAME repo variables set on
      ash-archive-source (Settings → Variables → Actions) — values: `neely`
      / `ash-archive`
- [ ] Deploy pipeline verified end to end with a small test push (blocked
      on the two items above)
- [ ] Maintainer email updated in ash-archive/index.html — currently
      placeholder `your@email.com`, two occurrences

**Content work:**
- [ ] Populate first-pass family-archive-full.json for Ash family — see
      NOTES.md → "Bootstrap annotation session prompt"
- [ ] Do first real annotation session with actual Ash family material
- [ ] Real image rendering — artifact modal/grid currently show emoji
      placeholders, not `<img>` tags. Needs fixing before the first real
      photo is added to any family's archive. Fix in
      family-archive-system/templates/voss-family.html first, then
      re-copy to ash-archive/index.html (see NOTES.md → Propagation model)

**Wrap-up (do before starting the next family):**
- [ ] Capture lessons learned back into this repo's NOTES.md/PLAN.md
- [ ] Confirm which files changed here since Ash's repos were created, and
      manually re-sync the stabilized versions before spinning up
      Branstrom/Beal/Neely (see NOTES.md → Propagation model — this does
      NOT happen automatically)

## Future — Remaining families

| Family | Status | Private repo | Public repo |
|--------|--------|--------------|-------------|
| Ash | In progress | ash-archive-source | ash-archive |
| Branstrom | Not started | — | — |
| Beal | Not started | — | — |
| Neely | Not started | — | — |

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
