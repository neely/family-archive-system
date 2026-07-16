# Archival Practices Audit
**Document type:** Reference — not build instructions  
**Purpose:** Compare this system's design against established archival and
genealogical standards. Identifies where the system aligns, where it diverges
by conscious choice, and where genuine gaps exist.

---

## Summary Verdict

The system is archivally sound for a personal family archive maintained by
a non-specialist. It maps onto professional practice more closely than most
genealogy software, particularly in its handling of evidence levels, source
citation, audit history, and the separation of raw data from display logic.
The gaps that exist are real but appropriate to the scale and purpose of the
project. None of them are correctness problems — they are places where
professional archives invest effort that is not warranted here.

---

## Standard 1: Source Citation

**Professional standard (Evidence Explained, Elizabeth Shown Mills):**
Every factual claim should be traceable to a specific source. Citations
should identify the source, the information it contains, and the evidence
it provides. The distinction between original sources, derivative sources,
and authored works is fundamental.

**This system:**
- Every field with tracked history carries a `source` string
- Every proposed change carries a `source` and `submitted_by`
- Confidence levels (high/med/low) map roughly onto primary/secondary/oral
- The `confidence_notes` field on person records provides free-text source basis

**Alignment:** Good. The `source` field is present everywhere it matters.
The confidence tier system is a simplified but workable proxy for the
original/derivative/authored distinction.

**Gap:** The system uses a free-text `source` string rather than a structured
citation. Professional practice would distinguish between, for example:
- "1880 US Federal Census, Milwaukee County, Wisconsin, ED 142, p. 8, dwelling 74"
- "Oral history, Margaret Kowalski, recorded by maintainer, 2024-09-01"
- "Family photograph, reverse inscription, held by Diane Voss-Kettner"

A free-text string captures this but doesn't enforce it. Over time source
strings will vary in format and completeness depending on the maintainer's
attention on a given day.

**Recommendation:** Not worth fixing with schema enforcement — the overhead
isn't justified. Instead, establish a personal house style for source strings
and document it here. Consistent format matters more than structured fields
for a single-maintainer archive.

**Suggested house style:**
```
Record type, jurisdiction/location, date — "1880 US Census, Milwaukee Co. WI, 1880"
Photograph/object, holder, date examined — "Cabinet card, Diane Voss-Kettner collection, examined 2024-11"
Oral history, informant, date — "Oral history, Margaret Kowalski, 2024-09-01"
Letter/document, sender/recipient, date, holder — "Letter, Maria Voss to Friederike Heller, Jun 1858, family archive"
```

---

## Standard 2: Separation of Source, Information, and Evidence

**Professional standard:**
Archivists distinguish between:
- The **source** (the document or artifact itself)
- The **information** (what the source says)
- The **evidence** (what the information proves, given its context)

A death certificate is an original source. It contains information about
cause of death (direct, from attending physician — high reliability) and
birthdate (indirect, from informant who may not have known — lower reliability).
The evidence value of each field differs even within the same document.

**This system:**
Applies a single confidence rating to the entire artifact record. A letter
might be `confidence: high` but contain both a confirmed date (witnessed by
the writer) and a rumored relationship (hearsay from a third party). The
system cannot currently distinguish between these within a single source.

**Alignment:** Partial. Field-level confidence is not implemented — only
record-level confidence. This is a real simplification.

**Gap:** This is the most technically significant departure from professional
practice. The workaround is the `openQuestions` array and the `confidence_notes`
free-text field — you can annotate field-level uncertainty in prose even if
it isn't structured.

**Recommendation:** Accept this limitation consciously. Retrofitting field-level
confidence across every fact in the archive is not worth the schema complexity
for a personal project. Use `openQuestions` to flag specific field-level
uncertainties as they arise. Document this decision here so a future maintainer
understands why confidence is record-level rather than field-level.

---

## Standard 3: Provenance

**Professional standard:**
Provenance — the chain of custody of a document or object — is a core
archival concept. An item's reliability and authenticity are partly determined
by where it has been and who has held it. Professional archives maintain
provenance records for every accession.

**This system:**
The `source` field on artifact records captures current holder and sometimes
chain of custody in free text. The `condition` field notes physical state.
There is no structured provenance chain field.

**Alignment:** Adequate. The `source` field captures what matters most for
a family archive — who currently holds the item and how it came to be there.

**Gap:** No structured chain of custody. For most family artifacts this is:
original owner → family member → current holder. This can be captured in
the `desc` or `source` fields in prose and is sufficient at this scale.

**Where this matters:** If any items are genuinely historically significant —
early photographs by known photographers, documents of public record significance,
objects with auction or exhibition history — a more formal provenance note in
the `desc` field is warranted. Flag these with a `historically_significant: true`
field for future attention.

---

## Standard 4: Original Order and Arrangement

**Professional standard:**
Archives preserve the original arrangement of records — the order in which
they were created and kept — because that order itself carries meaning.
Rearranging records destroys contextual information.

**This system:**
Not applicable in the traditional sense. Family artifacts typically arrive
without a meaningful original arrangement — they are found in boxes, drawers,
and attics. The archive imposes a structure (people + artifacts + timeline)
that is an authored arrangement, not a preserved original order.

**Alignment:** N/A — appropriate departure. The archival principle of original
order applies to institutional records (a company's files, a government agency's
correspondence) where the filing system reflects organizational logic. It does
not meaningfully apply to a dispersed family collection.

**What replaces it here:** Provenance and relationship linking. The `people`
array on artifact records and the `artifacts` array on person records create
the contextual web that institutional archives preserve through original order.

---

## Standard 5: Description Standards (EAD, Dublin Core, ISAD(G))

**Professional standard:**
Archival description standards (Encoded Archival Description, Dublin Core,
International Standard Archival Description) define controlled vocabularies
and field structures for describing records. These standards enable
interoperability — an item described in EAD at one archive can be understood
by systems at another.

**This system:**
Uses a custom schema with no alignment to any external standard. Fields are
named and structured for practical use, not interoperability.

**Alignment:** Deliberate departure. Interoperability is not a goal of this
system. The archive is personal, the audience is family, and the overhead of
standards compliance is not warranted.

**Gap — and why it matters more than it seems:**
Dublin Core has 15 elements and takes ten minutes to implement as an optional
export. If this archive ever grows to the point where items should be shared
with a historical society, public library, or university special collections,
a Dublin Core export would make that straightforward. Without it, donation
requires manual re-description.

**Recommendation:** Add Dublin Core as a future export option in the build
script, not as a live schema requirement. The mapping is mostly obvious:
`title` → dc:title, `date` → dc:date, `desc` → dc:description,
`people` → dc:subject, `source` → dc:source, `type` → dc:type.
Document this mapping here for when it becomes relevant.

**Dublin Core mapping (for future implementation):**
| Archive field | Dublin Core element |
|--------------|-------------------|
| `title` | dc:title |
| `desc` | dc:description |
| `type` | dc:type |
| `date` | dc:date |
| `people` (linked names) | dc:subject |
| `source` | dc:source |
| `condition` | dc:description (append) |
| `id` | dc:identifier |
| archive name | dc:publisher |

---

## Standard 6: Controlled Vocabulary

**Professional standard:**
Archives use controlled vocabularies — standardized lists of terms — for
subject headings, geographic names, personal names, and record types.
The Library of Congress Subject Headings (LCSH), Getty Thesaurus of Geographic
Names (TGN), and Library of Congress Name Authority File (LCNAF) are standard
references. Controlled vocabulary enables consistent searching and prevents
the same concept being described in ten different ways.

**This system:**
Free-text fields throughout. Record types (`type` field on artifacts) are
semi-controlled by convention but not enforced. Geographic names are
free-text. Subject tags are not implemented.

**Alignment:** Partial. The record type list (Correspondence, Photograph,
Document, Object, Manuscript, Painting, Audio, Video) is a de facto
controlled vocabulary for that field. Everything else is free text.

**Gap:** Geographic names in particular will drift. "Milwaukee, WI" and
"Milwaukee, Wisconsin" and "Milwaukee" will all appear in a growing archive.
This makes filtering and searching unreliable over time.

**Recommendation:** Establish a place name style guide and apply it consistently.
Use the format `City, State Abbreviation, Country (if non-US)`:
- Milwaukee, WI
- Chicago, IL
- Tübingen, Württemberg, Germany (historical name preferred for historical records)
- New York, NY

For person name authority: use full legal name at birth as the primary name,
with married names and variants in the `facts` field under "Name variants."
IDs use birth name regardless of later name changes.

---

## Standard 7: Appraisal

**Professional standard:**
Archivists appraise records to determine what should be kept, what can be
discarded, and what should be transferred elsewhere. Not everything is worth
keeping. Appraisal involves assessing evidential value, informational value,
and intrinsic value.

**This system:**
No appraisal framework. Everything goes in. The `unannotated` flag identifies
items not yet described but does not facilitate decisions about what to keep.

**Alignment:** Intentional departure. For a personal family archive, the
appraisal decision has already been made: keep everything the family has.
The loss risk runs in one direction only — things are lost, not over-accumulated.
Appraisal is a concern for institutional archives managing millions of records,
not a family project.

**Where this could matter:** Digital photographs. Your mom may send 200 photos
of the same object from slightly different angles. Some curation is warranted —
not appraisal in the archival sense, but practical selection of the best views
before ingestion. The image intake workflow (selecting role: full/detail/verso)
is the appropriate mechanism for this.

---

## Standard 8: Preservation

**Professional standard:**
Archives maintain items in conditions that prevent deterioration. For digital
archives: format migration (as file formats become obsolete), fixity checking
(verifying files haven't been corrupted), backup redundancy, and media
refreshment. For physical items: appropriate storage, environmental controls,
handling procedures.

**This system:**
**Digital preservation — adequate:**
- GitHub provides version history (every commit is a backup)
- JSON is a plain text format that will be readable indefinitely
- JPEG is a widely supported format with no near-term obsolescence risk
- GitHub's infrastructure provides geographic redundancy

**Digital preservation — gaps:**
- No fixity checking (no checksums verifying image files haven't been corrupted)
- No format migration plan (not needed now but worth noting for 20+ year horizon)
- Single-platform dependency on GitHub

**Physical preservation — outside system scope:**
The archive digitizes physical items but does not address the physical items
themselves. Family photographs, letters, and objects should ideally be stored
in:
- Acid-free enclosures (archival boxes and folders, available from Gaylord Archival)
- Stable temperature and humidity (avoid attics, basements)
- Away from light

This is the most actionable gap in the whole project — and it has nothing
to do with software. The physical originals are irreplaceable. The digital
copies are valuable. Both matter.

**Recommendation:** When collecting materials, note storage conditions.
Items in poor conditions should be prioritized for scanning. Physical
originals held by family members should be identified in the `source` field
with enough detail that they could be located if the holder moves or passes away.

---

## Standard 9: Access and Privacy

**Professional standard:**
Archives balance open access (the public value of historical records) against
privacy (the rights of living individuals and recently deceased persons).
Many archives apply closure periods — records about living people or people
deceased within 75 years may be restricted.

**This system:**
The `died: null` gate on living people's private fields is a direct
implementation of this principle — arguably more rigorous than many
institutional archives, which apply blanket time-based rules rather than
per-record gates.

**Alignment:** Strong. The two-tier model (private full record + public
sanitized record) is architecturally sound and the gate mechanism is clean.

**Gap:** No closure period for recently deceased. A person who died last year
gets their full record immediately published on the next build. Professional
archives might restrict records for 25–75 years after death depending on
the sensitivity of the information.

**Recommendation:** For most family archive content this is not a concern —
birth dates and occupations of deceased relatives are not sensitive. If
particularly sensitive information exists (criminal records, medical details,
adoptions not publicly known), consider adding an optional `restrict_until`
date field that extends the sanitization gate beyond death date.

---

## Standard 10: Genealogical Proof Standard (GPS)

**Professional standard (Board for Certification of Genealogists):**
The Genealogical Proof Standard requires:
1. A reasonably exhaustive search of sources
2. Complete and accurate citations for each source
3. Analysis of each source for information and evidence quality
4. Resolution of conflicting evidence
5. A soundly reasoned, coherently written conclusion

**This system:**
Maps onto GPS better than most genealogy software:
- Evidence levels (confirmed/proposed/superseded) address points 3 and 4
- The `openQuestions` field addresses unresolved conflicts (point 4)
- Source strings on every tracked field address point 2
- The conflict flagging in proposed changes addresses point 4

**Gap:** Point 5 — written conclusion — is the bio text on person records.
The system supports it but doesn't require it. Records with `unannotated: true`
have not met the GPS standard because no synthesis has been written.

**Recommendation:** Treat the `bio` field as the GPS conclusion for each
person. A record is not truly complete until it has at least one bio paragraph
that synthesizes the evidence and sources. The `unannotated` flag already
serves this purpose — an unannotated record is one where the GPS process
is incomplete.

---

## What This System Does That Most Genealogy Software Does Not

Worth noting the ways this system exceeds standard practice:

**Audit history with superseded values.** Most genealogy software overwrites
old data. This system preserves superseded values with source attribution.
That is better practice than Ancestry, FamilySearch, or most desktop software.

**Proposed changes as a first-class concept.** The separation between proposed
and confirmed is not common in consumer genealogy tools. It reflects the
archival principle that claims require evaluation before acceptance.

**Artifact groups with typed views.** The role-based view system
(full/detail/verso/recto/page_N/context) reflects museum cataloguing practice
and is more sophisticated than most family archive tools.

**Private fields with automatic promotion on death.** The `died: null` gate
is a clean implementation of access restriction that most tools do not have.

**Separation of source data from display.** The JSON-as-source-of-truth,
site-as-presentation-layer architecture means the data can outlast any
particular display technology. The JSON will still be readable in 50 years.
The HTML site can be rebuilt from it at any time.

---

## Recommended Additional Reading

If you want to go deeper on any of these standards:

- **Evidence Explained** (Elizabeth Shown Mills) — the definitive guide to
  genealogical source citation. Covers every source type encountered in
  family research. Dense but authoritative.

- **Describing Archives: A Content Standard (DACS)** — the US standard for
  archival description. Freely available from the Society of American Archivists.
  More relevant if materials are ever donated to an institution.

- **Genealogical Proof Standard** — the Board for Certification of Genealogists
  publishes this freely. Short document, worth reading once.

- **Gaylord Archival** (gaylord.com) — supplier of archival storage materials.
  Relevant for the physical preservation gap noted above.

---

*This audit should be revisited if the archive grows significantly in scale,
if materials of potential institutional significance are identified, or if
donation to a historical society or library becomes a consideration.*
