#!/usr/bin/env python3
"""Sanity check between data/apps.json, assets/questions.js and assets/burrows.js.

Answers four questions:
  1. Does every project from awesome-selfhosted survive into the catalogue?
  2. Does every project sit in at least one browsable category?
  3. Which categories does the questionnaire actually touch?
  4. Does the rabbit hole cover what the questionnaire leaves out, and does
     every burrow still have projects nobody has been shown yet?

Exit code is 1 if something is broken (missing project, dangling reference,
a burrow that would deal an empty hand).
"""
import json, os, re, sys, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
nrm = lambda s: re.sub(r'[^a-z0-9]', '', (s or '').lower())
slug = lambda s: re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', (s or '').lower())).strip('-')

db = json.load(open(os.path.join(ROOT, 'data', 'apps.json'), encoding='utf-8'))
apps, cats = db['apps'], {c['id']: c for c in db['categories']}
names = {}
for a in apps:
    for n in [a['n']] + a.get('aka', []):
        names.setdefault(nrm(n), a)

problems = 0
print(f"catalogue: {len(apps)} projects, {len(cats)} categories, "
      f"{db['counts']['withIcon']} with an official logo\n")

# 1 -------------------------------------------------------------------------
src = os.path.join(ROOT, '.cache', 'awesome-selfhosted-data', 'software')
if os.path.isdir(src):
    import yaml
    want, missing = 0, []
    for fn in glob.glob(os.path.join(src, '*.yml')):
        y = yaml.safe_load(open(fn, encoding='utf-8'))
        if any('Proprietary' in str(x) for x in (y.get('licenses') or [])) or y.get('archived'):
            continue
        want += 1
        if nrm(y.get('name') or '') not in names:
            missing.append(y.get('name'))
    print(f"awesome-selfhosted: {want - len(missing)}/{want} projects present")
    if missing:
        problems += 1
        print('  MISSING:', ', '.join(missing[:20]))
else:
    print('awesome-selfhosted: source cache not present, skipping (run build_data.py first)')

# 2 -------------------------------------------------------------------------
orphans = [a['n'] for a in apps if not a.get('c')]
unknown = [a['n'] for a in apps if any(c not in cats for c in a.get('c', []))]
print(f"categorised: {len(apps) - len(orphans)}/{len(apps)} projects")
if orphans or unknown:
    problems += 1
    print('  ORPHANS:', orphans[:10], unknown[:10])

# 3 -------------------------------------------------------------------------
q = open(os.path.join(ROOT, 'assets', 'questions.js'), encoding='utf-8').read()
refs = []
for blk in re.findall(r"i:\s*(\[[^\]]*\]|'[^']*'|\"[^\"]*\")", q):
    refs += [a or b for a, b in re.findall(r"'([^']*)'|\"([^\"]*)\"", blk)]
dangling = sorted({r for r in refs if nrm(r) not in names})
tags = re.findall(r"tag:'([^']*)'", q)
bad_tags = sorted({t for t in tags if slug(t) not in cats})
touched = {slug(t) for t in tags}
covered = sum(cats[t]['n'] for t in touched if t in cats)

n_questions = len(re.findall(r'\{ g:', q))
print(f"\nquestionnaire: {n_questions} questions, "
      f"{len(refs)} project references, {len(touched)} categories addressed directly")
print(f"  projects inside those categories: {covered} "
      f"({covered * 100 // len(apps)}% of the catalogue)")
print(f"  the remaining categories stay reachable through the explore view")
if dangling:
    problems += 1
    print('  DANGLING PROJECT REFERENCES:', ', '.join(dangling))
if bad_tags:
    problems += 1
    print('  DANGLING CATEGORY REFERENCES:', ', '.join(bad_tags))

# 4 -------------------------------------------------------------------------
bur = open(os.path.join(ROOT, 'assets', 'burrows.js'), encoding='utf-8').read()
blocks = re.findall(r"\{ id:'(b_[a-z0-9_]+)',\s*r:'([a-z]+)',\s*c:(\[[^\]]*\]|'[^']*')(.*?)\n\s*h:", bur, re.S)
bids = {b[0] for b in blocks}
bcats, bad_bcats, bad_near, thin = set(), [], [], []
named = set()
for blk in re.findall(r"i:\s*(\[[^\]]*\]|'[^']*'|\"[^\"]*\")", q):
    for a, b in re.findall(r"'([^']*)'|\"([^\"]*)\"", blk):
        nm = names.get(nrm(a or b))
        if nm:
            named.add(nm['id'])
for bid, realm, cspec, rest in blocks:
    cs = re.findall(r"'([^']*)'", cspec)
    for c in cs:
        bcats.add(c)
        if c not in cats:
            bad_bcats.append(f'{bid} -> {c}')
    near = re.search(r"near:\[([^\]]*)\]", rest)
    for x in re.findall(r"'([^']*)'", near.group(1) if near else ''):
        if x not in bids:
            bad_near.append(f'{bid} -> {x}')
    fresh = [a for a in apps if not a.get('x') and a['id'] not in named
             and any(c in a.get('c', []) for c in cs)]
    if not fresh:
        thin.append(bid)

print(f"\nrabbit hole: {len(bids)} burrows over {len(bcats)} categories")
print(f"  projects the questionnaire can name: {len(named)}")
print(f"  projects only reachable past it: {len(apps) - len(named)}")
uncovered = [c for c in cats.values() if c['id'] not in touched and c['id'] not in bcats]
print(f"  categories touched by neither questions nor burrows: {len(uncovered)}"
      + (' (' + ', '.join(c['name'] for c in uncovered) + ')' if uncovered else ''))
if bad_bcats:
    problems += 1
    print('  DANGLING BURROW CATEGORIES:', ', '.join(bad_bcats))
if bad_near:
    problems += 1
    print('  DANGLING BURROW NEIGHBOURS:', ', '.join(bad_near))
if thin:
    problems += 1
    print('  BURROWS WITH NO FRESH PROJECTS:', ', '.join(thin))

biggest = sorted((c for c in cats.values() if c['id'] not in touched),
                 key=lambda c: -c['n'])[:12]
print('\nlargest categories without their own question (explore only):')
for c in biggest:
    print(f"  {c['n']:>4}  {c['name']}")

print('\nOK' if not problems else f'\n{problems} problem(s) found')
sys.exit(1 if problems else 0)
