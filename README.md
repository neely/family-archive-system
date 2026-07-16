# Family Archive System

A reusable personal archival system for building self-hosted, zero-subscription
family genealogy archives — a family tree, an artifact browser with grouped
multi-view support, a chronological timeline, and a contributor feedback loop,
all built on plain JSON with no backend and no ongoing cost.

**Not a single archive.** This repo holds the schema, build pipeline, and GUI
spec shared across multiple independent family archive projects. Each family
gets its own private/public repo pair (see `NOTES.md` → "Multi-family model").

## What it is

Each family archive is a private repo (full data, including private fields for
living people) paired with a public repo (auto-generated sanitized site). A
GitHub Action rebuilds and redeploys the public site whenever the private
repo changes. The archive grows through annotation sessions with an AI
assistant — physical materials (scans, photos, letters) get fed in, structured
records come out, a human reviews and applies the changes.

## Structure

```
build.js       — sanitizes private fields from living people's records
manage.js      — CLI tool for reviewing and applying proposed changes
deploy.yml     — GitHub Actions workflow template (goes in a family's
                  private repo at .github/workflows/deploy.yml)
templates/
  voss-family.html   — reference demo site (fictional family, full
                        feature set: tree, artifacts with multi-view
                        lightbox, timeline, mailto contribution flow)
reference/
  GUI_MANAGER_SPEC.md    — build spec for the not-yet-built local Python GUI
  ARCHIVAL_AUDIT.md      — comparison against professional archival standards
```

## Using this to start a family archive

1. Create `[family]-archive-source` (private) and `[family]-archive` (public)
   from the `agent-context-project-template`
2. Copy `build.js`, `manage.js`, `deploy.yml` into the source repo
3. Copy `templates/voss-family.html` into the public repo as `index.html`,
   strip the demo data
4. Follow the schema and workflow in `NOTES.md` here to bootstrap the first
   `family-archive-full.json`
5. See `reference/GUI_MANAGER_SPEC.md` when ready to build the local manager

First family underway: **Ash**. See `PLAN.md` for status.
