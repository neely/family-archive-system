# Family Archive System

## Resuming work — start here

**If you're a fresh Claude session picking this up cold**, regardless of
which repo the person opened first, do this before anything else:

1. Read **this repo's** `AGENTS.md`, `PLAN.md` (status block), and `NOTES.md`
   in full — this is the framework, the schema, and every locked decision.
2. If the person is working on a specific family, go to that family's
   `-source` repo and read its `PLAN.md` and `NOTES.md` too (family-specific
   status and decisions only — the schema lives here, not there).
3. Only then start helping.

**Repo map (update as new families come online):**

| Repo | Role |
|------|------|
| [`neely/family-archive-system`](https://github.com/neely/family-archive-system) | Hub. Schema, workflow, tooling, cross-family decisions. **Always read first.** |
| [`neely/ash-archive-source`](https://github.com/neely/ash-archive-source) (private) | Ash family — full data, private fields |
| [`neely/ash-archive`](https://github.com/neely/ash-archive) (public) | Ash family — deployed public site (auto-generated, don't hand-edit) |
| `[family]-archive-source` / `[family]-archive` | Same pattern, not yet created: Branstrom, Beal, Neely |

**The exact prompt to give a fresh session:**
> Read neely/family-archive-system's AGENTS.md, PLAN.md, and NOTES.md in
> full. [If working on a specific family:] Then read neely/[family]-
> archive-source's PLAN.md and NOTES.md. Then help me with [task].

---

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

## Site features (what index.html actually does)

**Family Tree tab** — auto-generated generational layout from parent/child
relationships. Click any person for a detail panel: portrait, bio, key
facts, confidence badge, open questions, linked artifact thumbnails, and a
"Propose a change" mailto button.

**Artifacts tab** — grid with filters (person, location, time period, type,
"needs annotation" toggle, "has open questions" toggle) and a live count.
Click any artifact for a modal: if it has multiple `views` (e.g. a
painting's full image, signature detail, and verso), a filmstrip lets you
switch between them. A "Send an update" mailto button on every item.

**Timeline tab** — chronological event list, major events highlighted, each
event links back to the relevant person.

## Technology stack and cost

| Component | Technology | Cost |
|-----------|-----------|------|
| Site hosting | Cloudflare Pages (see NOTES.md — not GitHub Pages) | Free |
| Private data storage | GitHub private repo | Free |
| Build pipeline | GitHub Actions | Free (2,000 min/month) |
| Image storage (current) | Repo `/images/` | Free |
| Image storage (future, if needed) | Cloudflare R2 | Free up to 10GB |
| Dependencies | Zero — pure HTML/CSS/JS | Free |
| Claude API (optional, GUI text-intake automation only) | Sonnet-class model | ~$0.01–0.03/call, likely a few $/year total — chat-mode intake (no API key) works fine without this |
| Domain (optional) | Custom subdomain, e.g. `ash.benneely.com` | ~$12/yr for the root domain, subdomains free |

Total ongoing cost: $0 (or ~$12/year if using a custom domain you don't
already own).

## Using this to start a family archive

Full first-time setup checklist:

- [ ] Create `[family]-archive-source` (private) and `[family]-archive`
      (public) from `agent-context-project-template`
- [ ] Copy `build.js`, `manage.js` into the source repo root
- [ ] Copy `deploy.yml` into the source repo at
      `.github/workflows/deploy.yml`
- [ ] Copy `templates/voss-family.html` into the public repo as
      `index.html`; the demo data is gone as of the fetch-based rewrite —
      it'll render an empty state until real data exists
- [ ] Create `data/family-archive-full.json` in the source repo:
      `{"people": [], "artifacts": [], "timeline": []}`
- [ ] Create `data/proposed-changes.json`: `{"changes": []}`
- [ ] Create `archive-config.json` in the source repo root (see
      GUI_MANAGER_SPEC.md → Project Model for the shape)
- [ ] Set up Cloudflare Pages pointed at the public repo (see NOTES.md —
      Cloudflare, not GitHub Pages, is the deployment target)
- [ ] Generate a fresh, narrowly-scoped GitHub PAT (contents:write on the
      public repo only) and add it as the `PUBLIC_REPO_TOKEN` secret on the
      source repo (Settings → Secrets → Actions)
- [ ] Set `PUBLIC_REPO_OWNER` / `PUBLIC_REPO_NAME` repo variables on the
      source repo (Settings → Variables → Actions)
- [ ] Update the maintainer email in `index.html` — search for
      `your@email.com`, two occurrences (`buildMailtoLink`,
      `buildPersonMailtoLink`)
- [ ] Push a small test change to the source repo, confirm the Action runs
      and the public repo updates
- [ ] Follow NOTES.md's schema and bootstrap prompt to populate the first
      real `family-archive-full.json`

First family underway: **Ash**. See `PLAN.md` for status.
