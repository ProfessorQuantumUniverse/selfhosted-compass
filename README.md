# 🧭 Selfhosted Compass

**A guided way through 2,300+ free, self-hostable projects.**
Answer a few questions about what you actually want to run and get a stack — not a list of 2,300 links.

👉 **[Live version](https://<your-user>.github.io/selfhosted-compass/)** · [single-file offline build](dist/selfhosted-compass.html)

---

## What it does

* **A questionnaire, not a directory.** ~95 questions in 12 sections. Every one is *yes / no / already got it*.
* **Follow-up questions where it matters.** Whenever several good projects solve the same problem, you get a
  second question with the trade-offs spelled out — Portainer vs. Dockge vs. Komodo, Jellyfin vs. Kodi,
  Immich vs. PhotoPrism vs. Ente, Nginx Proxy Manager vs. Traefik vs. Caddy, Restic vs. Borg vs. Kopia.
* **Must-haves get added on their own.** Ten containers and no reverse proxy, no backup, no monitoring is
  a bad time. The result page fills those gaps based on what you actually picked and how you expose your
  services (LAN, VPN or public).
* **“Already got it”** on every question and every card. Owned projects drop out and the next best
  alternative moves up.
* **A rabbit hole.** All 177 categories are browsable, sortable and filterable — genealogy, library systems,
  XMPP servers, energy monitoring, offline Wikipedia. Every result card links into its own category.
* **Search across everything**, including “alternative to …” data, so `trello`, `dropbox` or `unifi` find
  the right projects.
* **A personal list** with Markdown / JSON / repo-URL export, kept in `localStorage`.

Free software only. Proprietary and archived projects are filtered out during the build.

## Data sources

| Source | What it contributes |
| --- | --- |
| [awesome-selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted) (CC-BY-SA-3.0) | the backbone: 1,273 projects with categories, licences, platforms and star counts |
| [awesome-sysadmin](https://github.com/awesome-foss/awesome-sysadmin) (CC-BY-SA-4.0) | what awesome-selfhosted delegates: monitoring, backup, VPN, SSO, containers, virtualisation, CI/CD |
| [selfh.st/apps](https://selfh.st/apps/) | ~1,300 entries, many niche, plus “self-hosted alternative to X” and maintenance status |
| [selfh.st/icons](https://selfh.st/icons/) | 1,600+ official project logos |
| [`scripts/curated.json`](scripts/curated.json) | projects missing from all three (Watchtower, CasaOS, SABnzbd, Jellyseerr, WLED, UniFi Network Optimizer, Kiwix, …) |

`scripts/coverage.py` asserts that **all 1,273 awesome-selfhosted projects survive the merge** and that
every project ends up in at least one browsable category.

## Repository layout

```
index.html              app shell
assets/style.css        all styling
assets/questions.js     the question catalogue — edit this to change the advice
assets/app.js           engine: scoring, results, explore, search, list
data/apps.json          generated catalogue (912 KB) — the only data file the app loads
scripts/build_data.py   merges the sources into data/apps.json
scripts/curated.json    hand written additions
scripts/build_standalone.py   bundles everything into dist/selfhosted-compass.html
scripts/coverage.py     consistency check between data and questions
```

## Running it

```bash
python -m http.server 8000   # any static server; opening index.html via file:// blocks the fetch
```

Or just open [`dist/selfhosted-compass.html`](dist/selfhosted-compass.html) — one file, data inlined,
works offline (logos and the web font need a connection).

## Hosting on GitHub Pages

1. Push this repository to GitHub.
2. *Settings → Pages → Source: Deploy from a branch*, branch `main`, folder `/ (root)`.
3. Done — `.nojekyll` is already there so the `assets/` folder is served as is.

## Refreshing the data

```bash
python scripts/build_data.py        # re-download everything (needs pyyaml; gh CLI optional, for star counts)
python scripts/build_data.py --offline   # rebuild from .cache/ without hitting the network
python scripts/build_standalone.py  # rebuild the single-file version
python scripts/coverage.py          # verify nothing got lost
```

The optional workflow in `.github/workflows/refresh-data.yml` does this on a schedule and commits the result.

## Adding your own advice

Everything opinionated lives in [`assets/questions.js`](assets/questions.js):

```js
{ g:'media', id:'m_video', q:'Stream your own movies and TV shows?',
  h:'A media server with apps for TV, phone and browser — like Jellyfin or Kodi',
  tag:'Media Streaming - Multimedia Streaming',      // category used for alternatives
  aq:'What does your living room look like?',        // follow-up question
  alts:[ { i:'Jellyfin', l:'Jellyfin', w:'The free standard, clients for everything' },
         { i:'Kodi',     l:'Kodi',     w:'Player running directly on the TV box' } ]}
```

`i` refers to a project by any name it carries in `data/apps.json` (including aliases), or to a list of
projects for a whole stack. `alts[0]` is the default pick. Run `python scripts/coverage.py` afterwards —
it fails if a name no longer resolves.

## Licence

Code: MIT. Catalogue data keeps the licences of its sources (CC-BY-SA); project names and logos belong to
their respective projects.
