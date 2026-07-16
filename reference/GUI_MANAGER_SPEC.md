# GUI Manager — Build Specification
**Status:** Specified, not yet built  
**Purpose:** Local desktop tool for reviewing proposed changes, adding new records, and ingesting images  
**Replaces:** `manage.js` (CLI) for day-to-day use — manage.js remains as fallback  
**Runtime:** Python + tkinter (standard library, no install needed beyond Python)  
**Scope:** Maintainer-only, runs locally, never deployed

---

## What Problem This Solves

After an annotation session, `proposed-changes.json` may contain 20–50 entries —
new people, corrected dates, added relationships, new artifacts. Reviewing these
one at a time in a terminal is tedious. A GUI with radio buttons, side-by-side
comparison, and bulk actions makes a long review session practical.

Image ingest is currently manual (resize, rename, move to images/, update JSON).
The GUI automates that entirely: drop an image, get an ID, get a resized file,
get a proposed artifact record.

---

## Files This Tool Reads and Writes

```
private repo/
├── data/
│   ├── family-archive-full.json     ← read + write
│   └── proposed-changes.json        ← read + write
└── images/
    └── *.jpg / *.png / *.heic       ← write (resized copies on ingest)
```

No other files touched. No network calls. No cloud.

---

## Project Model

The GUI is project-agnostic. A "project" is a folder on your local machine
containing the expected archive structure. The GUI can open any number of
projects and remembers recent ones.

### Project folder structure

```
my-family-archive/
├── archive-config.json          ← project identity and settings
├── data/
│   ├── family-archive-full.json ← master record
│   └── proposed-changes.json   ← change queue
└── images/
    └── *.jpg / *.png
```

### archive-config.json

```json
{
  "archive_name": "The Kowalski Family Archive",
  "maintainer_email": "you@email.com",
  "public_repo": "github.com/you/kowalski-archive",
  "created": "2024-11",
  "notes": "Maternal side. Primary contact: mom."
}
```

### Project selector (startup screen)

```
┌─────────────────────────────────────────────────────────────┐
│  Family Archive Manager                                      │
│                                                              │
│  Recent projects:                                            │
│  📁  The Kowalski Family Archive    last opened 2 days ago  │
│  📁  The Voss Family Archive        last opened 1 week ago  │
│  📁  The DeLuca Family Archive      last opened 3 weeks ago │
│                                                              │
│  [Open project folder...]    [New project...]               │
└─────────────────────────────────────────────────────────────┘
```

Opening a project validates that the folder contains the expected structure.
If `data/proposed-changes.json` doesn't exist it is created empty.
If `data/family-archive-full.json` doesn't exist the GUI offers to initialize
a minimal one from the schema template.

Recent projects are stored in a small local config file in the user's home
directory (`~/.family-archive-manager.json`) — not inside any project folder.

### New project wizard

```
┌─────────────────────────────────────────────────────────────┐
│  New Project                                                 │
│                                                              │
│  Archive name:    [_________________________________]        │
│  Folder location: [_________________________________] [...]  │
│  Maintainer email:[_________________________________]        │
│  Public repo URL: [_________________________________]        │
│  Notes:           [_________________________________]        │
│                                                              │
│  [Create]                                                    │
└─────────────────────────────────────────────────────────────┘
```

Creates the folder structure, writes `archive-config.json`, initializes
empty `family-archive-full.json` with the correct top-level schema
(`{people: [], artifacts: [], timeline: []}`), and initializes empty
`proposed-changes.json` (`{changes: []}`).

---

## Three Panels


The GUI is a single window with a tab bar: **Review**, **Intake**, **Archive**.

---

## Panel 1: Review

The main workhorse. Mirrors manage.js but visual.

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  REVIEW QUEUE          [3 pending] [12 accepted] [2 rejected]│
├──────────────┬──────────────────────────────────────────────┤
│ QUEUE LIST   │  CHANGE DETAIL                               │
│              │                                               │
│ ● chg_001    │  Target:   margaret_kowalski_1934            │
│   person     │  Name:     Margaret Kowalski                 │
│   born_full  │  Field:    born_full                         │
│              │                                               │
│ ● chg_002    │  CURRENT                                     │
│   person     │  ┌──────────────────────────────────┐        │
│   parents    │  │ 1934-08-03                        │        │
│              │  │ source: oral history, Sep 2024    │        │
│ ○ chg_003    │  └──────────────────────────────────┘        │
│   artifact   │                                               │
│   date       │  PROPOSED                                     │
│              │  ┌──────────────────────────────────┐        │
│ ○ chg_004    │  │ 1934-09-03                        │        │
│   person     │  │ source: birth cert scan, Nov 2024 │        │
│   siblings   │  │ from: Diane Voss-Kettner (mailto) │        │
│              │  └──────────────────────────────────┘        │
│              │                                               │
│              │  Notes: CONFLICT — oral history vs            │
│              │  primary source. Recommend accept.            │
│              │                                               │
│              │  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│              │  │ ● Accept │ │ ○ Reject │ │ ○ Skip   │     │
│              │  └──────────┘ └──────────┘ └──────────┘     │
│              │                                               │
│              │  Rejection reason: ____________________       │
│              │                                               │
│              │  [Apply & Next →]                            │
├──────────────┴──────────────────────────────────────────────┤
│ [Accept All Uncontested]  [Apply Batch]  [Save & Quit]      │
└─────────────────────────────────────────────────────────────┘
```

### Queue list (left pane)

- Scrollable list of all pending changes
- Each entry shows: change ID, target type (person/artifact), field name
- Filled circle (●) = pending, check (✓) = decided this session, dash (–) = skipped
- Click any entry to load it in the detail pane
- Color coding: orange = conflict noted in `notes` field, white = clean

### Detail pane (right)

- Target name resolved from the archive (not just the ID)
- Current value box and Proposed value box, side by side or stacked
- Source and submitter shown under each box
- Notes field shown if present (conflict warnings appear here)
- Three radio buttons: Accept / Reject / Skip
- Rejection reason text field (enabled only when Reject is selected)
- "Apply & Next" button: applies the decision, advances to next pending item

### Bulk actions (bottom bar)

**Accept All Uncontested** — auto-accepts all pending changes where:
- `notes` field is empty or contains no "CONFLICT" keyword
- proposed value is not null/empty
- target exists in the archive
Shows a confirmation dialog listing what will be accepted before doing anything.

**Apply Batch** — applies all decided-but-not-yet-saved changes in one write.
Keeps changes in memory until this is clicked, so you can flip decisions before committing.

**Save & Quit** — writes both JSON files, shows summary (N accepted, N rejected, N skipped).

### Behavior on accept

Identical to manage.js:
- Current value moves to `{field}_history` array with status `superseded`
- New value written as tracked object: `{value, status: "confirmed", source, updated}`
- Bidirectional relationship enforcement: if adding a parent, child's `parents` array
  also gets updated, and parent's `children` array gets the child added

### Behavior on reject

- Change entry marked `status: "rejected"`, reason stored
- Nothing in main archive changes

---

## Panel 2: Intake

For adding new information. Two sub-modes: Image and Text/Email.

### Image intake

The first question on image intake is always: is this a new artifact or an additional view of an existing one? The answer determines the rest of the form.

```
┌─────────────────────────────────────────────────────────────┐
│  IMAGE INTAKE                                                │
│                                                              │
│  ┌─────────────────────────────────────────┐                │
│  │                                         │                │
│  │     Drop image here, or [Browse...]     │                │
│  │     Supports: JPG, PNG, HEIC            │                │
│  └─────────────────────────────────────────┘                │
│                                                              │
│  File loaded: IMG_4823.heic  (5.1 MB)                       │
│  Preview: [thumbnail]                                        │
│                                                              │
│  ── This image is ──────────────────────────────────────    │
│  ● New artifact                                             │
│  ○ Additional view of existing artifact                     │
│                                                              │
│  ════════════════════════════════════════════════════════   │
│  [NEW ARTIFACT FIELDS shown when ● New artifact]            │
│                                                              │
│  ── ID Assignment ──────────────────────────────────────    │
│  Auto-suggested ID:  painting_grandmother_rose              │
│  Override:           [________________________]             │
│                                                              │
│  ── Processing ─────────────────────────────────────────    │
│  Resize to 2400px:  ● Yes  ○ No (keep original)            │
│  Output format:     ● JPG  ○ PNG                            │
│  View role:         [full ▼]                                │
│  Output filename:   painting_grandmother_rose_full.jpg      │
│                                                              │
│  ── Artifact Record ────────────────────────────────────    │
│  Title:        [________________________________]           │
│  Date:         [________________________________]           │
│  Type:         [Painting ▼]                                 │
│  Description:  [________________________________]           │
│                [________________________________]           │
│  People:       [🔍 Search by name, date, or role... ▼]     │
│                 📷 Rose Kowalski [rose_kowalski_1889]  ✕    │
│  Condition:    [________________________________]           │
│  Source:       [________________________________]           │
│  Annotated:    ● No (flag for annotation later)  ○ Yes      │
│                                                              │
│  [Add to proposed-changes.json]                             │
│                                                              │
│  ════════════════════════════════════════════════════════   │
│  [ADDITIONAL VIEW FIELDS shown when ○ Additional view]      │
│                                                              │
│  ── Link to existing artifact ──────────────────────────    │
│  [🔍 Search artifacts by title, person, date...         ▼] │
│   🖼️  Untitled Landscape — Rose Kowalski, 1923             │
│       [painting_grandmother_rose]               ← selected  │
│                                                              │
│  ── This view ──────────────────────────────────────────    │
│  Role:     [detail ▼]                                       │
│  Caption:  [Signature, lower right — 'R. Kowalski 1923'__] │
│  Filename: painting_grandmother_rose_detail_1.jpg   (auto) │
│                                                              │
│  Resize to 2400px:  ● Yes  ○ No                            │
│                                                              │
│  [Add view to artifact]                                     │
└─────────────────────────────────────────────────────────────┘
```

**What happens on submit — new artifact:**

1. Image resized to max 2400px long edge using Pillow
2. HEIC converted to JPG if needed
3. File written to `images/{artifact_id}_full.jpg`
4. Proposed change entry appended to `proposed-changes.json`:
   ```json
   {
     "id": "chg_NNN",
     "target_type": "artifact",
     "target_id": "NEW:painting_grandmother_rose",
     "field": "full_record",
     "proposed_value": {
       "id": "painting_grandmother_rose",
       "emoji": "🖼️",
       "title": "Untitled Landscape — Rose Kowalski",
       "date": "1923",
       "date_year": 1923,
       "type": "Painting",
       "people": ["rose_kowalski_1889"],
       "primary_image": "painting_grandmother_rose_full.jpg",
       "views": [
         {
           "id": "painting_grandmother_rose_full",
           "role": "full",
           "image": "painting_grandmother_rose_full.jpg",
           "caption": "Complete painting"
         }
       ],
       "desc": "...",
       "condition": "...",
       "source": "...",
       "unannotated": true,
       "confidence": "med"
     },
     "source": "Image intake, maintainer",
     "submitted": "2024-11-14",
     "submitted_by": "maintainer",
     "status": "proposed"
   }
   ```

**What happens on submit — additional view:**

1. Image resized and written to `images/painting_grandmother_rose_detail_1.jpg`
   (filename auto-generated: `{artifact_id}_{role}.jpg`, with `_{N}` suffix
   added automatically if that filename already exists)
2. Proposed change entry appended:
   ```json
   {
     "id": "chg_NNN",
     "target_type": "artifact",
     "target_id": "painting_grandmother_rose",
     "field": "views",
     "proposed_value": {
       "id": "painting_grandmother_rose_detail_1",
       "role": "detail",
       "image": "painting_grandmother_rose_detail_1.jpg",
       "caption": "Signature, lower right — 'R. Kowalski 1923'"
     },
     "change_action": "append",
     "source": "Image intake, maintainer",
     "submitted": "2024-11-14",
     "submitted_by": "maintainer",
     "status": "proposed"
   }
   ```
   Note `change_action: "append"` — tells manage.js/GUI to append this view
   to the existing `views` array rather than replace it.

The image file is written immediately in both cases. The record change goes
through the review queue.

### Text/Email intake

```
┌─────────────────────────────────────────────────────────────┐
│  TEXT / EMAIL INTAKE                                         │
│                                                              │
│  Paste the source text below — an email, notes, letter      │
│  transcription, or any freeform family information.         │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  [large text area]                                  │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Source description:  [Diane's email, Nov 14 2024_____]    │
│  Submitted by:        [Diane Voss-Kettner______________]    │
│                                                              │
│  [Generate Proposed Changes via Claude API]                 │
│                                                              │
│  ── Output ────────────────────────────────────────────    │
│  Status: ● Ready  ○ Processing...  ○ Done (4 changes)       │
│                                                              │
│  [Preview proposed changes]  [Add to review queue]          │
└─────────────────────────────────────────────────────────────┘
```

**What happens on Generate:**

1. Reads current `family-archive-full.json`
2. Calls Claude API with the annotation session prompt (from HANDOFF.md)
   passing both the archive JSON and the pasted text
3. Parses returned proposed-change entries
4. Shows a preview list (change ID, target, field, proposed value)
5. On "Add to review queue": appends to `proposed-changes.json`, 
   switches to Review panel with new items highlighted

**Claude API call:**
Uses `claude-sonnet-4-20250514`. The system prompt is the annotation session
prompt from HANDOFF.md. The archive JSON is included in the user message.
Requires `ANTHROPIC_API_KEY` set as an environment variable.

---

## Panel 3: Archive

Read-only browser of current `family-archive-full.json`. Not the public site —
a data view for spotting gaps and navigating quickly.

```
┌─────────────────────────────────────────────────────────────┐
│  ARCHIVE BROWSER         [Search: _______________]          │
├──────────────────────────┬──────────────────────────────────┤
│  PEOPLE  (14)            │  Margaret Kowalski               │
│                          │  margaret_kowalski_1934          │
│  Filter: [All ▼]         │                                  │
│  Sort:   [Name ▼]        │  Born:      1934 (living)        │
│                          │  Birthplace: Milwaukee, WI       │
│  ● Confirmed (8)         │  Confidence: high                │
│  ◐ Partial (4)           │                                  │
│  ○ Sparse (2)            │  Parents:   Irene Kowalski       │
│                          │             Frank Kowalski       │
│  Kowalski, Frank    ◐    │  Siblings:  Joseph Kowalski      │
│  Kowalski, Irene    ●    │             Anna Kowalski        │
│  Kowalski, Margaret ●    │  Spouse:    Robert DeLuca        │
│  Kowalski, Joseph   ○    │  Children:  Diane DeLuca         │
│  ...                     │             Thomas DeLuca        │
│                          │                                  │
│  ARTIFACTS  (11)         │  Open questions (2):             │
│                          │  ? Middle name unknown           │
│  Filter: [All ▼]         │  ? Frank's occupation not conf.  │
│                          │                                  │
│  ● photo_kowalski_c1940  │  Artifacts (3):                  │
│  ◐ letter_1934           │  📷 photo_kowalski_c1940         │
│  ○ scan_doc_001          │  📜 letter_1934                  │
│                          │  📒 account_book_vol2            │
│                          │                                  │
│                          │  [Add proposed change for this   │
│                          │   person →]                      │
└──────────────────────────┴──────────────────────────────────┘
```

**Features:**
- People list and artifacts list in left pane, filterable and sortable
- Confidence indicators (●◐○) match the site's high/med/low scheme
- Click any person or artifact to see their full record in the right pane
- Relationships shown as clickable names (click to navigate to that person)
- "Add proposed change" button opens a lightweight form to directly propose
  a correction without going through the full text intake flow
- Unannotated artifacts flagged visually

---

## UI Convention: Dropdowns and Association Lookups

Any dropdown in the GUI that associates one record with another — people on
artifacts, artifacts on people, parent/child relationships, additional views —
follows this convention globally.

### Display format

```
{emoji}  {title or name}  [{id}]
```

Examples:
```
📷  Kowalski family gathering, c. 1940  [photo_kowalski_c1940]
📜  Letter, Maria to Friederike, June 1858  [letter_1858_maria]
🖼️  Untitled Landscape — Rose Kowalski, 1923  [painting_grandmother_rose]
👩  Rose Kowalski (1889–1952)  [rose_kowalski_1889]
👨  Frank Kowalski (1885–1941)  [frank_kowalski_1885]
```

The ID in brackets is confirmation, not the primary identifier. The human-readable
string is what you read. The ID is what you verify.

### Search behavior

Every association dropdown has a search box at the top. Search matches against:
- Title or name
- Linked people names (for artifacts)
- Date or date_year
- ID itself

Typing "Rose" surfaces the painting, any photos she appears in, any letters
she wrote. Typing "1923" surfaces everything from that period. Typing
"painting_" surfaces all paintings by ID prefix.

Results are sorted: exact name match first, then partial name, then date,
then ID match. Maximum 20 results shown before asking to refine.

### No bare ID entry

The GUI never asks the user to type an ID directly for association purposes.
IDs are always selected from a searched dropdown. This prevents typos from
entering the archive. The one exception: the ID assignment field when creating
a new artifact, where the GUI suggests an ID and you can override it — but
even here a collision check runs against existing IDs before accepting.

---

## Artifact Display in the Site (Modal Lightbox)

When the `views` array has more than one entry, the artifact modal renders
a lightbox rather than a static image.

```
┌──────────────────────────────────────────────────┐
│  Untitled Landscape — Rose Kowalski              ✕│
├──────────────────────────────────────────────────┤
│                                                  │
│                                                  │
│           [primary image — full view]            │
│                                                  │
│                                                  │
│  Complete painting, raking light photograph      │
│                                                  │
│  ┌────────┐  ┌────────┐  ┌────────┐             │
│  │ full   │  │ detail │  │ verso  │             │
│  │ ██████ │  │ ██████ │  │ ██████ │             │
│  └────────┘  └────────┘  └────────┘             │
│   ▲ active                                       │
├──────────────────────────────────────────────────┤
│  Painting · 1923 · Rose Kowalski                 │
│  Held by: Diane Voss-Kettner                     │
│  Confidence: ● High                              │
│                                                  │
│  [Propose a change]  [Send an update ✉]         │
└──────────────────────────────────────────────────┘
```

- Filmstrip thumbnails are labeled with their role
- Active view indicated by underline or border on thumbnail
- Caption updates when a different thumbnail is clicked
- For `page_N` views, thumbnails are ordered numerically and labeled "p.1", "p.2" etc
- Single-view artifacts show no filmstrip — just the image and caption

### Artifact card thumbnail (grid view)

Always shows `primary_image` (the `full` view). If the artifact has multiple
views, a small badge in the corner indicates the count:

```
┌──────────────────┐
│                  │
│   [full image]  ③│  ← badge: 3 views available
│                  │
├──────────────────┤
│ Untitled Lands…  │
│ Painting · 1923  │
└──────────────────┘
```

---

## Technical Implementation Notes


### Stack

```
Python 3.x (standard library where possible)
├── tkinter          — GUI framework (stdlib, no install)
├── Pillow           — image resize and format conversion (pip install Pillow)
├── pillow-heif      — HEIC support (pip install pillow-heif)
├── anthropic        — Claude API for text intake (pip install anthropic)
└── json             — reading/writing archive files (stdlib)
```

Total pip installs: 3 packages. No web framework, no database, no server.

### Running it

```bash
# One-time setup
pip install Pillow pillow-heif anthropic

# Set API key (only needed for text intake panel)
export ANTHROPIC_API_KEY=your_key_here

# Run
python manager.py
```

### File paths

Hardcoded relative to the script location, matching the private repo structure:
```python
ARCHIVE_PATH = Path(__file__).parent / 'data' / 'family-archive-full.json'
CHANGES_PATH = Path(__file__).parent / 'data' / 'proposed-changes.json'
IMAGES_PATH  = Path(__file__).parent / 'images'
```

### Image processing

```python
from PIL import Image
import pillow_heif

pillow_heif.register_heif_opener()  # adds HEIC support to Pillow

def ingest_image(source_path, output_id, max_size=2400):
    img = Image.open(source_path)
    # Resize: only shrink, never enlarge
    img.thumbnail((max_size, max_size), Image.LANCZOS)
    output_path = IMAGES_PATH / f"{output_id}.jpg"
    img.convert('RGB').save(output_path, 'JPEG', quality=88, optimize=True)
    return output_path
```

### ID generation suggestion

For images, suggest an ID based on:
- Type prefix: `photo_`, `scan_`, `doc_`
- Surname if inferable from context (ask user)
- Approximate date if known
- Collision check against existing artifact IDs

```python
def suggest_image_id(filename, existing_ids):
    base = Path(filename).stem.lower()
    base = re.sub(r'[^a-z0-9]', '_', base)
    base = re.sub(r'_+', '_', base).strip('_')
    candidate = f"photo_{base}"
    # Deduplicate
    if candidate in existing_ids:
        candidate = f"{candidate}_2"
    return candidate
```

### Change ID generation

```python
def next_change_id(changes):
    if not changes:
        return 'chg_001'
    nums = [int(c['id'].split('_')[1]) for c in changes if c['id'].startswith('chg_')]
    return f"chg_{max(nums) + 1:03d}" if nums else 'chg_001'
```

### Bidirectional relationship enforcement on accept

When a change adds/modifies a relationship field (parents, siblings, spouses, children),
the manager must update the referenced records too:

```python
RELATIONSHIP_INVERSE = {
    'parents':  'children',
    'children': 'parents',
    'siblings': 'siblings',   # bidirectional same field
    'spouses':  'spouses',    # bidirectional same field
}

def enforce_bidirectional(archive, person_id, field, new_value):
    inverse_field = RELATIONSHIP_INVERSE.get(field)
    if not inverse_field:
        return
    for related_id in new_value:
        related = find_person(archive, related_id)
        if related:
            current = related.get(inverse_field, [])
            if isinstance(current, dict):  # tracked field
                current = current.get('value', [])
            if person_id not in current:
                current.append(person_id)
                related[inverse_field] = current  # will be wrapped on next tracked write
```

---

## Build Order

When building this tool, implement in this order:

1. **File I/O layer** — load/save archive and changes JSON, path config
2. **Review panel** — queue list, detail pane, radio buttons, Apply & Next
3. **Accept/reject logic** — history tracking, bidirectional relationships
4. **Bulk accept** — conflict detection, confirmation dialog
5. **Archive browser** — read-only, navigation, gap spotting
6. **Image intake** — file picker, Pillow resize, ID suggestion, artifact record form
7. **Text intake** — text area, Claude API call, preview, append to queue

Stop after step 4 and the tool is already useful. Steps 5–7 are enhancements.

---

## What This Does Not Do

- Does not deploy to GitHub (that remains a manual `git push` after review)
- Does not edit bio text or researcher_notes (free-form fields, edit JSON directly)
- Does not validate the entire archive schema (that is build.js's job)
- Does not run on mobile or as a web app (local desktop only)
- Does not require an internet connection except for text intake (Claude API)

---

*This spec is complete enough to hand to Claude in a future session and say "build this."  
Reference manage.js for the accept/reject logic already implemented in JS —  
the Python version should produce identical output to the JSON files.*
---

## Phase 1 Intake: Chat Interface Workflow (No API Required)

Before the GUI's text intake panel is built — or as a permanent alternative for
users who prefer it — the Claude chat interface serves as the intake engine.
The GUI generates a ready-to-copy prompt and processes the pasted response.
No API key needed. No automation. Full human review of Claude's output before
anything touches the JSON.

### The split

```
GUI responsibility:
  - Build a context-aware prompt (archive subset + pasted source text)
  - Accept pasted response from Claude chat
  - Parse, validate, and write proposed changes to proposed-changes.json

Your responsibility:
  - Copy prompt → paste into Claude chat (claude.ai)
  - Copy response → paste back into GUI
```

Claude chat handles the expensive reasoning. The GUI handles the bookkeeping.

### Intake panel UI (Phase 1 version)

```
┌─────────────────────────────────────────────────────────────┐
│  INTAKE                         ● Chat mode  ○ API mode     │
│                                                              │
│  ── Step 1: Paste your source material ─────────────────    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Paste email, notes, transcription, or describe    │   │
│  │   the photograph(s) you will upload in chat]        │   │
│  └─────────────────────────────────────────────────────┘   │
│  Source description:  [_________________________________]   │
│  Submitted by:        [_________________________________]   │
│                                                              │
│  ── Step 2: Generate prompt ────────────────────────────    │
│  [Generate Prompt]                                          │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Generated prompt appears here — read-only]        │   │
│  │                                                     │   │
│  │  Includes: schema, relevant archive subset,         │   │
│  │  source text, instructions for proposed-change      │   │
│  │  output format                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│  [Copy to clipboard]                                        │
│                                                              │
│  ── Step 3: Paste Claude's response ───────────────────    │
│  [Open Claude chat ↗]   (opens claude.ai in browser)       │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Paste Claude's response here]                     │   │
│  └─────────────────────────────────────────────────────┘   │
│  [Parse & Validate]                                         │
│                                                              │
│  ── Step 4: Validation results ────────────────────────    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ✓  chg_007  margaret_kowalski_1934  born_full       │   │
│  │  ✓  chg_008  frank_kowalski_1885     occupation      │   │
│  │  ⚠  chg_009  irene_kowalski_c1887   parents          │   │
│  │     ID not found — did you mean irene_kowalski_1887? │   │
│  │  ✓  chg_010  NEW:joseph_kowalski_1936  full_record   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  [Fix issues]  [Add to review queue]                        │
└─────────────────────────────────────────────────────────────┘
```

### Step 2: What the prompt generator builds

The GUI does not send the entire archive. It builds a targeted context:

1. Extracts names and apparent IDs from the pasted source text using simple
   string matching against the archive (no AI needed for this step)
2. Pulls only the matching person and artifact records from the archive
3. If no matches found, includes a compact people index
   (id + name + birth year only, one line each) so Claude can reference
   existing records without the full record weight
4. Wraps everything in the standard annotation session prompt from HANDOFF.md
5. Appends the source text and output format instructions

This keeps the prompt lean even as the archive grows.

**Compact people index format (fallback when no matches found):**
```
Existing people in archive (id | name | born):
margaret_kowalski_1934 | Margaret Kowalski | 1934
irene_kowalski_1887 | Irene Kowalski | 1887
frank_kowalski_1885 | Frank Kowalski | 1885
...
```

### Step 4: Validation on paste-back

When Claude's response is pasted in, the GUI parses it and checks each
proposed change entry before writing anything:

| Check | Action on failure |
|-------|------------------|
| Valid JSON structure | Highlight malformed entry, ask to fix or skip |
| `target_id` exists in archive | Warn + suggest closest match by name similarity |
| `target_id` starts with `NEW:` | Flag as new record, show preview, confirm |
| `field` is a known schema field | Warn — may be a hallucinated field name |
| `proposed_value` type matches field | Warn — e.g. string where array expected |
| Relationship ID references exist | Warn for each unknown ID in parents/siblings/etc |

Warnings do not block — they surface issues for you to resolve. You can
override any warning and accept the change anyway. The point is to catch
ID typos and hallucinated field names before they corrupt the archive.

### Fix issues flow

For each warning, a small inline form:
- ID not found → dropdown of closest matches from archive, or "create new"
- Unknown field → dropdown of valid schema fields, or "keep as custom"
- Type mismatch → show expected type, let you edit the value inline

### For image intake in chat mode

Images are not pasted into the GUI — they go directly into Claude chat.
The GUI's role is:

1. Generate the prompt (same as above, but noting "I will upload image(s) 
   in chat — please describe what you see and produce artifact records")
2. You upload the image(s) in Claude chat alongside the prompt
3. You paste Claude's response back into the GUI
4. GUI validates and queues the proposed artifact records
5. GUI handles the actual image file: resize, rename, place in images/

So the image file itself is handled locally by the GUI (Pillow resize),
but the description and record generation comes from Claude chat.

### When to use API mode vs chat mode

| Situation | Recommended mode |
|-----------|-----------------|
| Getting started, no API key | Chat mode |
| Occasional intake, prefer review | Chat mode |
| High-volume intake sessions | API mode |
| Images to annotate | Chat mode (upload in chat) |
| Simple single-person addition | Chat mode |
| Budget-conscious | Chat mode (free) |

Chat mode is a permanent first-class option, not a temporary workaround.
The only thing API mode adds is removing the copy-paste steps.

---
