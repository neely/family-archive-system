# Family Archive System — Journal

Append-only. Newest entry on top. Never edit past entries — this is history,
not current state. One entry per session: the shutdown debrief.

---

## 2026-07-16 (correction) — Cloudflare Pages, not GitHub Pages; content transfer audit

**Did:** Two corrections to the prior entry below, made in the same overall
working session after a short break.

1. **Deployment target corrected.** GitHub Pages was enabled on ash-archive
   in the prior entry — wrong call. The maintainer's actual pattern (matches
   radio.benneely.com, recipes.benneely.com) is Cloudflare Pages on custom
   subdomains. Documented as a locked decision in NOTES.md. GitHub Pages
   should be disabled on ash-archive to avoid two live URLs for the same
   site; noted in PLAN.md for follow-up (needs manual dashboard action or a
   DELETE call to the Pages API).

2. **Content transfer audit.** Did a section-by-section diff of the original
   HANDOFF.md against what actually landed in NOTES.md/README.md/PLAN.md
   during the initial repo setup. Found real gaps: the Site Features
   description, the full mailto email templates (contribute + propose-a-
   change), explicit "what Claude does during an annotation session"
   behavior list, handwriting/image-quality practical notes, the manage.js
   review-loop walkthrough, conflict-handling example, the full first-time
   setup checklist, and the Technology Stack cost table had all been
   condensed away or dropped during the original condensation into the
   five-file structure. Restored all of them — Site Features and Tech Stack
   went into README.md (describes the product, not the reasoning), the rest
   into NOTES.md.

**Least confident about (Q1):** Whether this pass caught everything. The
audit was section-header-driven (diffing HANDOFF.md's `##`/`###` headers
against NOTES.md's) which catches missing sections but not necessarily
missing *detail within* a section that was kept. Would be proven wrong by a
future session hitting a gap this pass didn't catch — worth doing one more
close prose read-through of HANDOFF.md against NOTES.md if time allows,
rather than trusting the header-diff was fully sufficient.

**Suggested improvement (Q5):** When doing this kind of condensation-into-
a-template work in the future, do the content audit *immediately* after the
condensation, same session, rather than assuming it transferred cleanly and
discovering gaps two sessions later when the user asks. Cheaper to catch
immediately.

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
(HANDOFF.md, ARCHIVAL_AUDIT.md, GUI_MANAGER_SPEC.md) into this kit's
five-file structure.

While wiring up ash-archive, caught a real architectural bug in the demo
template: all family data was hardcoded directly in the HTML/JS rather than
loaded from JSON at runtime. This would have silently broken the entire
private→public deploy pipeline concept — build.js would produce a sanitized
family-archive.json, the Action would deploy it, and the site would never
actually read it. Fixed by converting to a fetch-based loader and replacing
the hand-authored per-family tree HTML with a dynamic generation-depth
layout algorithm (BFS from parent/child relationship arrays), since the
original's hand-positioned SVG connectors don't generalize across four
families with different tree shapes. Verified with `node --check` after the
fix (also caught and fixed a string-replacement bug of my own that mangled
a comment block during the edit).

Enabled GitHub Pages on ash-archive via the API — live (empty placeholder)
at https://neely.github.io/ash-archive/.

**Least confident about (Q1):**
- The bootstrap-without-GEDCOM annotation approach hasn't been run against
  real messy family material yet — only reasoned about in the abstract.
  Would be proven right/wrong by actually running it on whatever Ash family
  material turns up. Real handwriting, ambiguous relationships, and
  conflicting oral history will surface schema gaps the demo data didn't.
- The auto-layout tree algorithm hasn't been tested against a real, messier
  family shape — remarriages, half-siblings, people with no recorded
  relationships. Would be proven right/wrong once real Ash data exists.
- Confidence-is-record-level-not-field-level was a deliberate simplification,
  but I don't yet know if it'll feel insufficient once real conflicting
  sources show up within a single document. Would be proven wrong if
  `openQuestions` starts feeling inadequate to carry that nuance in practice.

**Unstated assumptions (Q2):**
- Assumed the maintainer (Benjamin) will always be the one running annotation
  sessions — no workflow was designed for multiple people independently
  proposing changes to the same archive concurrently.
- Assumed GitHub Pages + GitHub Actions remain free and available at current
  terms for the life of this project.

**Biggest thing being missed (Q3):**
- Physical preservation of the original artifacts (the actual painting, the
  actual letters) is completely outside this system's scope and was flagged
  in the audit but not acted on. Given four families' worth of physical
  material, this may be more urgent than the software side.
- Real image rendering (the modal/grid still show emoji placeholders, not
  actual `<img>` tags) will need to be built before the very first real
  artifact photo goes into any family's archive — currently the highest-
  priority unbuilt piece for making this genuinely usable.

**Suggested improvement (Q5):** Before starting the Ash bootstrap session,
do one real trial run with a small, deliberately messy piece of material
(one letter, one photo with an ambiguous inscription) to pressure-test the
schema before committing to it across a full family. Also: fix the real
image rendering gap before that trial run, since a "photo" that renders as
an emoji placeholder isn't a meaningful test of the artifact workflow.
