# Selfhosted Compass

**A guided way through 2,300+ free, self-hostable projects.**
Pick the corners you care about, answer a short deck of questions, get a stack — then climb down the
rabbit hole into the 1,900 projects the questions never mention.

**[Live version](https://<your-user>.github.io/selfhosted-compass/)** · [single-file offline build](dist/selfhosted-compass.html)

---

## The two runs

### Run one: the questionnaire

Not 94 questions for everybody. Four steps, and the first one throws most of them away.

1. **Your setup** — experience, platform, hardware, how you reach your services. Four tiles.
2. **Which corners are you here for?** — the twelve areas as tiles, each with real logos and a
   question count. Switch an area off and its questions are never asked. Most people end up
   answering 25–40 instead of 94.
3. **The deck** — one question per screen, keys `1`–`4`, `←`/`→` to move, `S` to skip a section,
   with a live counter of what your stack is turning into. Prefer to scan a whole section instead?
   One switch turns the deck back into the old list, and the switch is on every screen.
   Answers are **yes / this is why I am here / no / already got it** — the second one is what splits
   the result into a core stack and the rest.
4. **The decisions** — every "which one?" collected in one place at the end instead of interrupting
   you thirty times. Three questions about taste — *all-in-one or a specialist per job*,
   *polish or frugality*, *newest or proven* — pre-decide all of them; each row shows the suggestion,
   why it won, and the alternatives one click away. Where a follow-up asks *what* you want rather
   than *how* (torrent or Usenet, comics or novels), taste stays out of it and the choice is yours.

The result is grouped: **core stack**, **also a good fit**, **must-haves for this setup** — the
reverse proxy, backup, monitoring and update watcher that a stack of that size and exposure needs.

### Run two: the rabbit hole

The questionnaire can only ever name **373 projects**. The other **1,939 are what the rabbit hole is
for**, and it never shows you one the questionnaire already offered.

It deals discovery cards — *"Keep a lifetime log of every song you play?"*, *"Serve your own maps,
routing and geocoding?"*, *"Software for a food co-op or a veg box scheme?"* — one at a time, three
answers each.

**Saying yes takes you down, not on.** The corner opens with its projects *and* the two to four
neighbouring questions that corner unlocks, so one card becomes a descent:

```
Surface › Put a better face on a tool you already run › Reskin the tools you run › Dashboards        4 levels down
```

A breadcrumb and a depth meter show how far in you are and let you climb back to any point. Saying
no steers the deck away from that whole realm; the deck states what it thinks you are leaning
towards and follows the areas you answered in run one. A coverage bar counts corners opened and
projects met, and **Surprise me** pulls one random project you have never been shown, with a line
about why it is worth a look.

163 corners, hand written, covering every category the questionnaire leaves untouched plus the deep
end of the ones it only skims.

The **Explore** tab is untouched: all 177 categories, filterable, sortable, every category page a
grid of its projects. It is now one way in rather than the only one.

## Everything else

* **"Already got it"** on every question and every card. Owned projects drop out and the next best
  alternative moves up.
* **Search across everything**, including "alternative to …" data, so `trello`, `dropbox` or `unifi`
  find the right projects.
* **A personal list** with Markdown / JSON / repo-URL export, kept in `localStorage`.
* Free software only. Proprietary and archived projects are filtered out during the build.

## Data sources

| Source | What it contributes |
| --- | --- |
| [awesome-selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted) (CC-BY-SA-3.0) | the backbone: 1,273 projects with categories, licences, platforms and star counts |
| [awesome-sysadmin](https://github.com/awesome-foss/awesome-sysadmin) (CC-BY-SA-4.0) | what awesome-selfhosted delegates: monitoring, backup, VPN, SSO, containers, virtualisation, CI/CD |
| [selfh.st/apps](https://selfh.st/apps/) | ~1,300 entries, many niche, plus "self-hosted alternative to X" and maintenance status |
| [selfh.st/icons](https://selfh.st/icons/) | 1,600+ official project logos |
| [`scripts/curated.json`](scripts/curated.json) | projects missing from all three (Watchtower, CasaOS, SABnzbd, Jellyseerr, WLED, UniFi Network Optimizer, Kiwix, …) |

`scripts/coverage.py` asserts that all 1,273 awesome-selfhosted projects survive the merge, that every
project ends up in at least one browsable category, and that no burrow would ever deal an empty hand.

## Repository layout

```
index.html              app shell
assets/style.css        all styling
assets/questions.js     the questionnaire — questions, taste axes, must-haves
assets/burrows.js       the rabbit hole — 163 discovery prompts and how they connect
assets/app.js           engine: gate, deck, taste scoring, results, descent, explore, search, list
data/apps.json          generated catalogue (912 KB) — the only data file the app loads
scripts/build_data.py   merges the sources into data/apps.json
scripts/curated.json    hand written additions
scripts/build_standalone.py   bundles everything into dist/selfhosted-compass.html
scripts/coverage.py     consistency check between data, questions and burrows
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

### A question

Everything opinionated about run one lives in [`assets/questions.js`](assets/questions.js):

```js
{ g:'media', id:'m_video', q:'Stream your own movies and TV shows?',
  h:'A media server with apps for TV, phone and browser — like Jellyfin or Kodi',
  tag:'Media Streaming - Multimedia Streaming',      // category used for alternatives
  fx:1,                                              // this follow-up asks WHAT, not HOW — taste stays out
  aq:'What does your living room look like?',        // follow-up question
  alts:[ { i:'Jellyfin', l:'Jellyfin', t:'polish proven', w:'The free standard, clients for everything' },
         { i:'Kodi',     l:'Kodi',     t:'lean proven',   w:'Player running directly on the TV box' } ]}
```

`i` refers to a project by any name it carries in `data/apps.json` (including aliases), or to a list
of projects for a whole stack. `alts[0]` is the editorial default and taste has to disagree properly
before it moves. `t` is any of `suite unix polish lean new proven` — the three taste questions score
against those, and where a tag is missing the data stands in (language for weight, stars for how
proven a thing is). `nx:1` on an alternative means *offer it, never auto-pick it* — for the option
that answers a narrower question than the one asked.

### A rabbit hole

[`assets/burrows.js`](assets/burrows.js):

```js
{ id:'b_scrobble', r:'media', c:'scrobble', near:['b_yearrev','b_mediastats','b_jukebox'],
  q:'Keep a lifetime log of every song you play?',
  h:'Your own Last.fm. Nobody sells the data, and it survives the next streaming service going under.' },
```

`c` is a category id (or several) from `data/apps.json`; the projects come from there, minus anything
the questionnaire could already have named. `near` is the descent — the questions this one unlocks.
`deep:true` marks a prompt about the unnamed part of a category the questionnaire does cover.
`pin:['Some Project']` pulls a project to the front.

Run `python scripts/coverage.py` afterwards — it fails on a name that no longer resolves, a category
or neighbour that does not exist, and on a burrow that has nothing left to show.

## Licence

Code: MIT. Catalogue data keeps the licences of its sources (CC-BY-SA); project names and logos belong to
their respective projects.
