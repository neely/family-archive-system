# Family Archive System — Journal

Append-only. Newest entry on top. Never edit past entries — this is history,
not current state. One entry per session: the shutdown debrief.

---

## 2026-07-16 — Framework design session + repo setup

**Did:** Designed the full system in a single extended conversation (outside
this repo, in Claude chat) — schema for people and artifacts, evidence-level
tracking with audit history, two-tier privacy model gated on death date,
change management workflow with a proposed-changes queue, artifact groups
with typed multi-view support (full/detail/verso/recto/page_N/context), and
a GUI manager spec (not yet built). Ran an archival-standards audit against
the design. Built a full-featured demo site (fictional Voss family). Then
created the actual GitHub repos — this system repo plus the first family
pair (ash-archive-source, ash-archive) — using a caller-supplied PAT and the
agent-context-project-template, and redistributed the session's docs
(HANDOFF.md, ARCHIVAL_AUDIT.md, GUI_MANAGER_SPEC.md) into this kit's five-file
structure.

**Least confident about (Q1):**
- The bootstrap-without-GEDCOM annotation approach hasn't been run against
  real messy family material yet — only reasoned about in the abstract.
  Would be proven right/wrong by actually running it on whatever Ash family
  material turns up. Real handwriting, ambiguous relationships, and
  conflicting oral history will surface schema gaps the demo data didn't.
- Confidence-is-record-level-not-field-level was a deliberate simplification,
  but I don't yet know if it'll feel insufficient once real conflicting
  sources show up within a single document (e.g. one letter that's reliable
  about a date but speculative about a relationship). Would be proven wrong
  if `openQuestions` starts feeling inadequate to carry that nuance in
  practice.

**Unstated assumptions (Q2):**
- Assumed the maintainer (Benjamin) will always be the one running annotation
  sessions — no workflow was designed for multiple people independently
  proposing changes to the same archive concurrently (mailto submissions are
  async and fine, but simultaneous direct JSON edits by two people were never
  considered).
- Assumed GitHub Pages + GitHub Actions remain free and available at current
  terms for the life of this project — no contingency planned if that changes.

**Biggest thing being missed (Q3):**
- Physical preservation of the original artifacts (the actual painting, the
  actual letters) is completely outside this system's scope and was flagged
  in the audit but not acted on. Given four families' worth of physical
  material, this may be more urgent than the software side.

**Suggested improvement (Q5):** Before starting the Ash bootstrap session,
do one real trial run with a small, deliberately messy piece of material
(one letter, one photo with an ambiguous inscription) to pressure-test the
schema before committing to it across a full family. Cheaper to find schema
gaps on one document than after 50 records exist.
