#!/usr/bin/env python3
"""Bundle the whole app into dist/selfhosted-compass.html.

The result is one file with the data inlined, so it works from a USB stick,
an e-mail attachment or a file:// URL - no web server needed.

Usage:  python scripts/build_standalone.py
"""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
read = lambda *p: open(os.path.join(ROOT, *p), encoding='utf-8').read()

html = read('index.html')
data = read('data', 'apps.json')

html = html.replace(
    '<link rel="stylesheet" href="assets/style.css">',
    '<style>\n' + read('assets', 'style.css') + '\n</style>')
html = html.replace(
    '<script src="assets/questions.js"></script>\n<script src="assets/app.js"></script>',
    '<script>window.__DATA__=' + data + ';</script>\n'
    '<script>\n' + read('assets', 'questions.js') + '\n</script>\n'
    '<script>\n' + read('assets', 'app.js') + '\n</script>')
html = html.replace('<title>Selfhosted Compass',
                    '<title>Selfhosted Compass (offline)', 1)

os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
out = os.path.join(ROOT, 'dist', 'selfhosted-compass.html')
with open(out, 'w', encoding='utf-8') as f:
    f.write(html)

assert 'assets/app.js' not in html, 'app.js was not inlined'
assert '__DATA__' in html, 'data was not inlined'
print(f'Wrote {out}  ({os.path.getsize(out)/1024:.0f} KB)')
