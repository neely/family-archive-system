# Family Archive System — Notes & Knowledge Base

Topical, not chronological. This is the schema, the workflows, and the
reasoning behind every design decision. Read this in full on a cold start —
it's the single most important file in this repo.

---

## Deployment target: Cloudflare Pages, not GitHub Pages (locked, corrected 2026-07-16)

- What: Public repos deploy via **Cloudflare Pages**, connected directly to
  the GitHub repo through Cloudflare's dashboard (Workers & Pages → Create →
  Connect to Git → select repo → no build command, output directory `/`).
  Cloudflare auto-deploys on every push to `main`, same trigger the
  GitHub Actions pipeline already pushes to.
- Why: Matches the existing pattern for other projects (radio.benneely.com,
  recipes.benneely.com) — custom subdomains on a domain already owned,
  rather than a `neely.github.io/[repo]` URL. Cloudflare also gives R2
  (image storage upgrade path, see Image handling below) on the same
  platform if that's ever needed.
- **Correction:** GitHub Pages was enabled on ash-archive during initial
  setup (2026-07-16) before this was clarified. It should be disabled —
  Settings → Pages → set source to "None" — or just left inert; it does not
  conflict with Cloudflare Pages serving the same repo, but the GitHub
  Pages URL should not be treated as the canonical site.
- Setup per family: point Cloudflare Pages at `[family]-archive`, set a
  custom subdomain (pattern: `[family].benneely.com` or similar, TBD per
  family), no build step needed since the site is static HTML with a
  runtime fetch — Cloudflare just needs to serve the files as-is.

## Propagation model: hub → family repos (read this to understand the roadmap)

**There is no automatic sync.** This is the most important thing to
understand about how the four repos relate to each other.

`family-archive-system` is a **reference and template layer**, not a shared
dependency the family repos import at runtime. `build.js`, `manage.js`,
`deploy.yml`, and `templates/voss-family.html` here are the *canonical,
current* versions. Each family's `-source` and public repo get **copies** of
these files at setup time. If a bug gets fixed or a feature gets added here
later, it does **not** automatically appear in `ash-archive-source` or any
other family repo — someone (a future Claude session, most likely) has to
manually re-copy the updated file(s) into each family repo that needs it.

**Why this was the choice:** four independent, infrequently-changing repos
with occasional manual re-sync is simpler than git submodules, a package
registry, or a build step that pulls from this repo at deploy time — all of
which would add real complexity for a problem (schema/tooling changes) that
should be rare once the pattern is proven on Ash.

**What this means in practice:**
- Schema and workflow *decisions* (the stuff in this file) apply to all
  families immediately, by reference — every family repo's own NOTES.md
  says "read family-archive-system's NOTES.md first," so a decision made
  here is visible everywhere without copying.
- Schema and workflow *code* (build.js, manage.js, deploy.yml, the site
  template) only updates in a family repo when someone deliberately
  re-copies it there. **This is a manual step, not automatic.**
- When Ash's real-world use surfaces a bug or improvement in the shared
  code, the fix should be made **here first**, logged in this file and
  PLAN.md, then manually propagated to ash-archive-source / ash-archive.
  Only once Branstrom/Beal/Neely exist would it also need propagating to
  them.

**The actual roadmap, phase by phase:**

1. **Prove the pattern on Ash** (current phase). Get the pipeline actually
   running end to end, do real annotation sessions, find out what's wrong
   with the schema/template/workflow that only shows up with real messy
   data. Fix problems *here*, in family-archive-system, as they're found —
   and re-copy fixes into ash-archive-source/ash-archive as needed. Ash is
   deliberately the proving ground, not a production-quality archive yet.
2. **Stabilize.** Once Ash has real data flowing smoothly — bootstrap done,
   a few annotation sessions completed, the mailto loop tested with an
   actual family member — treat the framework as proven. Do one final pass
   updating this repo's docs with everything learned.
3. **Spin up the next three families**, following the now-proven setup
   checklist (README.md → "Using this to start a family archive"), copying
   the *stabilized* versions of build.js/manage.js/deploy.yml/template —
   not whatever was current back when Ash was set up.
4. **Build the GUI manager** (reference/GUI_MANAGER_SPEC.md), once the
   manual chat-mode + manage.js CLI workflow is well understood from actual
   use across at least Ash. Building it earlier risks specifying against
   assumptions that real use will contradict.

## Multi-family model (locked)

- What: One system repo (this one, `family-archive-system`) holds shared
  tooling, schema, and docs. Each family gets its own private/public repo
  pair: `[family]-archive-source` (private) and `[family]-archive` (public).
- Why: Four families (Ash, Branstrom, Beal, Neely) evolve independently at
  different paces with different maintainers of material. A single combined
  archive would force artificial connections between families that may not
  actually be related, and would complicate the private/public split per
  family. The GUI manager is project-agnostic — it opens any folder matching
  the expected structure, so one tool serves all four projects.
- Rejected: A single archive with `lineages` tags per person. Considered
  when it looked like the four families might need to show connections to
  each other, but confirmed they're four separate projects with different
  timelines — the tagging approach was solving a problem that doesn't exist
  here.

---

## Data Model

### Person record (full — private repo only)

```json
{
  "id": "unique_snake_case_identifier",
  "name": "Full Name",
  "born_year": 1941,
  "born_full": { "value": "1941-09-03", "status": "confirmed", "source": "Birth certificate scan, Nov 2024", "updated": "2024-11-14" },
  "born_full_history": [
    { "value": "1941-08-03", "status": "superseded", "source": "Oral history — recollection", "updated": "2024-09-01", "superseded_by": "Birth certificate scan, Nov 2024", "superseded_date": "2024-11-14" }
  ],
  "birthplace": "City, State",
  "died": null,
  "deathplace": null,
  "confidence": "high | med | low",
  "portrait": "filename.jpg or emoji placeholder",
  "portraitCaption": "Cabinet card, c. 1878. Original in family possession.",
  "bio": ["Paragraph one.", "Paragraph two."],
  "facts": { "Occupation": "Value", "Spouse": "Value" },
  "openQuestions": ["Question or uncertainty as a plain string."],
  "parents":  ["person_id_1", "person_id_2"],
  "siblings": ["person_id_3"],
  "spouses":  ["person_id_4"],
  "children": ["person_id_5", "person_id_6"],
  "artifacts": ["artifact_id_1", "artifact_id_2"],
  "confidence_notes": "Source basis for confidence rating.",
  "address": "PRIVATE, never displayed while living",
  "phone": "PRIVATE",
  "email": "PRIVATE",
  "researcher_notes": "PRIVATE, always stripped even after death"
}
```

**Tracked fields** (carry `{value, status, source, updated}` + a `_history`
array): `born_full`, `born_year`, `died`, `birthplace`, `deathplace`, `name`,
`confidence`, `parents`, `siblings`, `spouses`, `children`.
Not tracked: `bio`, `facts`, `openQuestions`, `researcher_notes`,
`portraitCaption` — free text, no history needed.

**Relationship arrays are always bidirectional.** If Margaret is in Frank's
`children`, Frank must be in Margaret's `parents`. manage.js and the GUI
enforce this on accept; annotation sessions must produce both sides.

### Artifact record

```json
{
  "id": "unique_snake_case_identifier",
  "emoji": "📜",
  "title": "Descriptive title",
  "date": "c. 1878  (human-readable, can be approximate)",
  "date_year": 1878,
  "type": "Correspondence | Photograph | Document | Object | Manuscript | Painting | Audio | Video",
  "people": ["person_id_1", "person_id_2"],
  "location_tags": ["Milwaukee, WI"],
  "desc": "Full description — provenance, content, what's known, what's uncertain.",
  "condition": "Condition note.",
  "source": "Where the physical item is held.",
  "confidence": "high | med | low",
  "primary_image": "artifact_id_full.jpg",
  "views": [
    { "id": "artifact_id_full", "role": "full", "image": "artifact_id_full.jpg", "caption": "Complete object" },
    { "id": "artifact_id_detail_1", "role": "detail", "image": "artifact_id_detail_1.jpg", "caption": "Signature, lower right" },
    { "id": "artifact_id_verso", "role": "verso", "image": "artifact_id_verso.jpg", "caption": "Reverse side" }
  ],
  "unannotated": false
}
```

**View roles:** `full` (required, first entry, used as grid thumbnail),
`detail` (signature, inscription, maker's mark, damage), `verso` (back),
`recto` (front, when verso also exists), `page_N` (multi-page docs, reading
order), `context` (object in its environment). Single-image artifacts still
use a one-entry `views` array for schema consistency.

**Filename convention:** `{artifact_id}_{role}.jpg`, or
`{artifact_id}_{role}_{N}.jpg` for multiple of the same role (multiple
details, multiple pages).

`unannotated: true` flags items ingested but not yet fully described — the
site's artifact filter surfaces these as a work queue.

---

## Evidence levels (locked)

| Status | Meaning | Public display |
|--------|---------|----------------|
| `confirmed` | Accepted by maintainer, sourced | Shown normally |
| `proposed` | New claim awaiting review | Not shown |
| `superseded` | Previously confirmed, replaced by better info | Not shown, kept in history |

`superseded` ≠ wrong. It means "best understanding until something better
arrived." Keep these — they're the audit trail. Old birthdates, maiden names
before a marriage was found, addresses that changed: all worth preserving,
not overwriting.

Confidence is **record-level, not field-level** — a deliberate simplification
vs. professional archival practice (see reference/ARCHIVAL_AUDIT.md, Standard
2). Retrofitting field-level confidence isn't worth the schema complexity for
a personal project. Use `openQuestions` to flag specific field-level
uncertainty in prose instead.

### Source citation house style (not schema-enforced, just convention)

```
Record type, jurisdiction/location, date  — "1880 US Census, Milwaukee Co. WI"
Photograph/object, holder, date examined  — "Cabinet card, Diane Voss-Kettner collection, examined 2024-11"
Oral history, informant, date             — "Oral history, Margaret Kowalski, 2024-09-01"
Letter/document, sender/recipient, date   — "Letter, Maria Voss to Friederike Heller, Jun 1858, family archive"
```

### Place name style (not schema-enforced, just convention)

`City, State Abbreviation, Country (if non-US)`. Use historical names for
historical records where meaningfully different (e.g. "Tübingen, Württemberg,
Germany" for a pre-unification record).

---

## Living people privacy gate (locked)

- What: `died: null` is the gate. build.js redacts `born_full`, `address`,
  `phone`, `email`, `researcher_notes` (and their `_history` arrays) to
  `[REDACTED]` for any person where `died` is null. `researcher_notes` is
  always stripped entirely regardless of living/deceased status.
- Why: No auth layer needed, no passphrase system, no backend. The private
  repo holds everything; the public repo is a build artifact. When a death
  date is added, the next build automatically promotes the full record —
  zero manual work at that point.
- Rejected: Client-side AES encryption with a shared family passphrase.
  Considered for letting living relatives see more than the public site
  shows, but the actual requirement was simpler — sole maintainer doesn't
  need multi-tier access, just needs private data captured now and
  auto-published later. Overkill for the real need.

### What's actually sensitive (the judgment behind the gate)

The gate mechanism above is about *when* data becomes public. This is about
*what* to treat carefully in the first place — matters when writing bio text
or facts for a living person, since those fields aren't redacted by the gate
and need to be safe as written from the start.

**Treat with care (living people):**
- **Full birthdate** (month+day+year together) — this is identity-verification
  data at banks and government agencies. Year alone is fine and is what the
  public site shows (`born_year`). Never put a full DOB in `bio` or `facts`
  prose even for a living person, since those fields aren't gated.
- **Current address, phone, email** — obviously private, and these are the
  fields the gate actually redacts.
- **Minors** — anyone under 18. Don't name them individually or include
  their photos in public-facing content, even if a parent or grandparent
  provided it. Age them out: "two grandchildren" not named children with
  photos. This applies regardless of the `died` gate — a minor's record, if
  one exists at all, should be written conservatively from the start rather
  than relying on the gate to protect them (the gate protects *contact
  info*, not identity/photo exposure, and minors deserve a stricter default).

**Actually fine, don't over-restrict:**
- Old addresses of deceased people — historical record, not sensitive
- Cause of death — fine
- Family disputes, estrangement, illegitimacy — this is genealogical record,
  not gossip; archives publish this routinely, treat it the same way
- Immigration records, census data — already public record

**Why this matters beyond the gate:** the public `family-archive.json` is a
scrapeable, machine-readable file — not just a webpage someone might casually
browse. Anyone can pull the whole dataset trivially. That's fine for
historical content but reinforces treating anyone born after roughly 1930
(i.e., plausibly still alive or close family of someone who is) with the
light touch described above, and being conservative by default for minors
regardless of what a well-meaning relative sends in.

**Practical rule when writing a living person's bio/facts:** if you wouldn't
say it to a stranger at a family reunion within earshot of the person it's
about, don't put it in a public-facing field.

---

## Change management workflow

### Where changes come from (three paths, same destination)

- **A — Document/notes exist:** annotation session with Claude, current
  archive + source material in, proposed-change entries out.
- **B — Mailto contribution arrives:** structured email from a "Propose a
  change" or "Send an update" button on the site, paste into an annotation
  session, same output.
- **C — Maintainer just knows something:** type directly as a proposed
  change entry.

All three converge on `data/proposed-changes.json` in the family's private
repo. Review with `manage.js` (or the future GUI).

### proposed-changes.json structure

```json
{
  "changes": [
    {
      "id": "chg_001",
      "target_type": "person",
      "target_id": "margaret_kowalski_1934",
      "field": "born_full",
      "proposed_value": "1934-09-03",
      "current_value": "1934-08-03",
      "source": "Birth certificate scan provided by Diane, Nov 2024",
      "submitted": "2024-11-14",
      "submitted_by": "Diane Voss-Kettner (mailto)",
      "status": "proposed",
      "notes": "CONFLICT: current value from oral history, proposed from primary source. Recommend accept."
    }
  ]
}
```

For new records: `"target_id": "NEW:some_new_id"`, `"field": "full_record"`,
`"proposed_value"` is the complete record object.

For appending to an array field (e.g. adding a view to an artifact):
`"change_action": "append"` — manage.js pushes rather than replaces.

## Building the tree

If a family member's material lives on Ancestry (not the case for Ash, but
may be for a future family): export the GEDCOM first — Tree → Export Tree,
two clicks — even though it's imperfect, it gives a bootstrap session a
skeleton to start from rather than nothing. GEDCOM only applies where
Ancestry data already exists; it's a shortcut when available, not a
required step. The general-case method below works fine without one.

### Bootstrap annotation session prompt (no GEDCOM)

When starting a family from scratch — no Ancestry export, just documents,
notes, or memory:

```
You are starting a family genealogy archive from scratch.

Here is a source document containing family information:
[paste or describe document]

Please:
1. Extract every person mentioned — name, dates, places, relationships
2. Assign each person a unique snake_case id: firstname_lastname_birthyear
   (use approximate year if exact unknown, e.g. margaret_kowalski_c1934)
3. Build relationship arrays: parents, siblings, spouses, children
   (use ids, not names — every relationship must be bidirectional)
4. Set confidence: high if confirmed by document, med if inferred, low if guessed
5. Add openQuestions for anything ambiguous or missing
6. Return a complete family-archive-full.json following the schema in this
   repo's NOTES.md

Expect gaps and low-confidence entries — a populated skeleton beats waiting
for completeness.
```

### Incremental single-record session prompt

```
You are helping maintain a family genealogy archive.

Here is the current knowledge base:
[paste family-archive-full.json, or a relevant subset]

Please add or update the following person/artifact based on:
[describe person / paste notes / describe photograph]

Ensure:
- Bidirectional relationship links
- Conflicts with existing records flagged in the notes field
- Return complete proposed-change entries, not a direct JSON edit
```

### Chat-mode intake (permanent first-class method, not a stopgap)

The Claude API costs pennies per call for this use case, but chat-mode
intake — pasting a generated prompt into claude.ai, pasting the response
back — needs no API key and is fully viable long-term, especially for image
uploads (Claude chat handles images natively; the API route would need the
image base64-encoded, more friction for no benefit at this scale).

Full workflow spec, including prompt-generation-from-archive-subset (to keep
prompts lean as the archive grows) and paste-back validation (ID existence
checks, field name checks, type checks): see reference/GUI_MANAGER_SPEC.md
→ "Phase 1 Intake: Chat Interface Workflow."

### What Claude does during an annotation session

When fed the current archive + new source material, the session should:
- **Extract** every knowable field: names, dates, places, relationships,
  physical descriptions, occupations, events
- **Match** mentioned people against existing records — "this letter
  mentions Aunt Rosa, is she already margaret_kowalski_1934's sibling
  rosa_kowalski_1912, or a new person?"
- **Flag conflicts** — "this document says 1889, existing record says 1891"
- **Surface open questions** for anything ambiguous — illegible names, torn
  pages, disputed dates
- **Set confidence** based on source type (primary document = high,
  secondary/oral = med, inference/rumor = low)
- **Mark `unannotated: false`** on artifact records once the description
  meets a reasonable threshold (not just a placeholder)

### Handwriting and image quality — practical expectations

- Printed/typed documents, census records: high extraction quality
- Clear photographs: good for identification if existing records provide
  context to match against
- Cursive letters, especially 19th century: do a rough manual transcription
  first, then feed the transcription in rather than relying on the model to
  read the handwriting directly from an image
- iPhone photos of artifacts: resize before ingest (see Image handling below)

### The mailto templates (used by the site, not by annotation sessions)

Both live in index.html and require no backend — clicking either opens the
person's mail client pre-filled, they type their addition, send it, and the
maintainer feeds the reply into an annotation session (Path B above).

**Artifact "Send an update" button** — pre-fills:
```
Subject: Archive update — {artifact_id}: {artifact_title}

Hi — I have something to add or correct about this archive item.
─────────────────────────────
Artifact ID: {id}
Title / Type / Date / Condition / Source / People linked
What we currently know: {desc}
Confidence: {confidence label}
─────────────────────────────
My additions / corrections:
[Type your notes here]
```

**Person "Propose a change" button** — pre-fills the same shape, plus a
checklist of common change types (correct a date, add/remove a parent/
sibling/spouse/child, correct a name, add a location, add an artifact,
other) so the sender only has to check a box and fill in specifics rather
than compose free-form.

Both are implemented as `buildMailtoLink()` / `buildPersonMailtoLink()` in
index.html — search there for the exact current templates, this is meant as
orientation, not the source of truth for the live wording.

### The manage.js review loop, walked through

```
node manage.js

─────────────────────────────────────────────
Change chg_001  [1 of 3 pending]
Target:   margaret_kowalski_1934 (Margaret Kowalski)
Field:    born_full
Current:  1934-08-03  (source: oral history, Sep 2024)
Proposed: 1934-09-03  (source: birth cert scan, Nov 2024)
From:     Diane Voss-Kettner (mailto)  —  2024-11-14

Accept [a], Reject [r], Skip [s], Quit [q]:
```

Accept moves the current value to `{field}_history` marked `superseded`,
writes the proposed value as the new `confirmed` tracked value. Reject
prompts for an optional reason, main record untouched. Skip leaves it
`proposed` for next time. `node manage.js --summary` shows the queue state
without entering the review loop.

### Conflict handling

When a proposed change conflicts with a confirmed value, the annotation
session should flag it in the change entry's `notes` field rather than
silently picking one:
```
"notes": "CONFLICT: current value (1934-08-03) from oral history. Proposed
value (1934-09-03) from birth certificate — higher-confidence primary
source, recommend accept."
```
Claude recommends, the maintainer decides via manage.js. The losing value
isn't discarded — it moves to `_history` with a note explaining why it lost.

---

## Image handling

- iPhone photos run 4–15MB depending on format/settings. Resize to max
  2400px long edge before committing — drops to 1–3MB, indistinguishable
  quality for archive purposes.
- HEIC preferred on capture (half the size of JPEG-equivalent); convert to
  JPEG on ingest for universal web compatibility.
- GitHub comfort threshold: repo under ~1GB. At 2-3MB average per image,
  that's 300+ images before it matters. Not a near-term concern for any of
  the four families.
- If a repo ever approaches the threshold: move images to Cloudflare R2
  (free tier, 10GB, no egress fees), reference by URL instead of relative
  path. No other architecture changes needed. Not needed yet for any family.

---

## Intentional, not bugs

- Confidence is record-level, not field-level. See Evidence Levels above.
- No closure period for recently-deceased beyond the `died: null` gate
  itself. Most family content (birthdates, occupations) isn't sensitive
  enough to need a longer restriction window. If something genuinely
  sensitive comes up for a specific person, handle with a manual
  `restrict_until` field extension rather than a system-wide rule.
- No structured provenance chain field — captured in prose in `source` and
  `desc`. Sufficient at family-archive scale (see ARCHIVAL_AUDIT.md,
  Standard 3).
- No appraisal/curation framework — everything the family has goes in.
  Loss risk runs one direction (things get lost, not over-accumulated) so
  there's no "what to discard" decision to make.

## Known permanent limitations

- Free-text source citations rather than structured citation fields — house
  style documented above, not schema-enforced. Accepted tradeoff for a
  single-maintainer project; structured citation fields aren't worth the
  overhead here.
- No fixity checking (checksums) on image files. GitHub's version history
  provides de facto backup/redundancy; not pursuing formal fixity checks
  unless the archive becomes something other than a personal project.
- Tree layout is auto-generated by generation depth (BFS from relationship
  arrays) with simple row-based rendering — no SVG connector lines. The
  original demo had hand-positioned connectors per family, which doesn't
  generalize across four families with different tree shapes. This is a
  real visual downgrade from the original demo; revisit if it looks too
  sparse once real family data is in place. Not worth solving generically
  (family tree auto-layout with proper connector routing is a genuinely
  hard graph-layout problem) unless it becomes an actual pain point.
- Artifact modal (and grid thumbnails) render emoji placeholders instead of
  real `<img>` tags — inherited from the original concept demo, never fixed
  since no real images existed to test against. Needs `<img src="images/
  {filename}">` wired in before the first real artifact photo is added to
  any family. Same fix applies to templates/voss-family.html here and to
  each family's deployed index.html.

## Dead-ends (do not re-explore)

- Did NOT build client-side passphrase-gated encryption for a "family
  access tier" — the actual requirement was simpler (see privacy gate
  section above). Don't reintroduce this unless multi-person editing access
  becomes a real requirement, which it currently is not (sole maintainer).
- Did NOT adopt a single combined archive with lineage tags across all four
  families — see Multi-family model above.
- Did NOT pursue GEDCOM as the primary bootstrap path for families without
  an Ancestry tree (Ash, and presumably others) — GEDCOM only applies where
  Ancestry data already exists. The bootstrap-from-document / bootstrap-from-
  conversation path is the general-case method and works fine without it.

---

## Reference

### GitHub free tier facts (checked, current as of this session)
- Unlimited public repos, unlimited private repos, both free
- 2,000 GitHub Actions minutes/month free — far more than this project needs
- Per-file hard limit 100MB, repo comfort threshold ~1GB

### Repo pair naming convention
`[family]-archive-source` (private), `[family]-archive` (public), lowercase
hyphenated. Established: `ash-archive-source` / `ash-archive`.

### Dropdown/association UI convention (for future GUI, applies everywhere)
Display format: `{emoji}  {title or name}  [{id}]`. Search matches name,
linked people, date, and ID — never require typing a bare ID. Full rationale
in reference/GUI_MANAGER_SPEC.md.
