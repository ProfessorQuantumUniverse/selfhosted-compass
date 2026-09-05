#!/usr/bin/env python3
"""Sanity check between data/apps.json and assets/questions.js.

Answers three questions:
  1. Does every project from awesome-selfhosted survive into the catalogue?
  2. Does every project sit in at least one browsable category?
  3. Which categories does the questionnaire actually touch, and which are
     reachable only through the explore view?

Exit code is 1 if something is broken (missing project, dangling reference).
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

print(f"\nquestionnaire: {len(re.findall(r'\{ g:', q))} questions, "
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

biggest = sorted((c for c in cats.values() if c['id'] not in touched),
                 key=lambda c: -c['n'])[:12]
print('\nlargest categories without their own question (explore only):')
for c in biggest:
    print(f"  {c['n']:>4}  {c['name']}")

print('\nOK' if not problems else f'\n{problems} problem(s) found')
sys.exit(1 if problems else 0)
