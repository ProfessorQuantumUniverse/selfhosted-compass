#!/usr/bin/env python3
"""Build data/apps.json for Selfhosted Compass.

Merges three public catalogues of free self-hostable software:

  1. awesome-selfhosted-data   (YAML per project, categories + stars)
  2. awesome-sysadmin          (Markdown list: monitoring, backup, VPN, SSO, containers...)
  3. selfh.st /apps directory  (JSON, adds niche projects, icon slugs, "alternative to" data)

plus a small curated list of projects that are missing from all three.

Proprietary and archived entries are dropped - this catalogue is free software only.

Usage:  python scripts/build_data.py [--offline]
        --offline reuses whatever is already in .cache/
"""
import json, os, re, subprocess, sys, urllib.request, shutil, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, '.cache')
OUT = os.path.join(ROOT, 'data', 'apps.json')
OFFLINE = '--offline' in sys.argv
SELFHST = 'https://selfhst.github.io/cdn/directory/'

os.makedirs(CACHE, exist_ok=True)
os.makedirs(os.path.dirname(OUT), exist_ok=True)


def log(*a):
    print('  ', *a, flush=True)


def fetch(url, dest):
    dest = os.path.join(CACHE, dest)
    if OFFLINE and os.path.exists(dest):
        return dest
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'selfhosted-compass/1.0'})
        with urllib.request.urlopen(req, timeout=60) as r, open(dest, 'wb') as f:
            shutil.copyfileobj(r, f)
    except Exception as e:
        if os.path.exists(dest):
            log('WARN download failed, using cache:', url, e)
        else:
            raise
    return dest


def clone(url, name):
    path = os.path.join(CACHE, name)
    if os.path.isdir(os.path.join(path, '.git')):
        if not OFFLINE:
            subprocess.run(['git', '-C', path, 'pull', '--quiet', '--depth', '1'],
                           capture_output=True)
        return path
    subprocess.run(['git', 'clone', '--depth', '1', '--quiet', url, path], check=True)
    return path


nrm = lambda s: re.sub(r'[^a-z0-9]', '', (s or '').lower())


def repo_key(url):
    """Normalised owner/repo so the same project from two lists collapses into one."""
    m = re.match(r'(?:https?://)?(?:www\.)?(github|gitlab|codeberg)\.com?/([^/#?]+)/([^/#?]+)',
                 (url or '').replace('.git', ''))
    if not m:
        return None
    return f'{m.group(1)}:{m.group(2).lower()}/{m.group(3).lower()}'


def slug(s):
    return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', (s or '').lower())).strip('-')


# --------------------------------------------------------------------------- 1
def load_awesome_selfhosted():
    import yaml
    path = clone('https://github.com/awesome-selfhosted/awesome-selfhosted-data.git',
                 'awesome-selfhosted-data')
    out = []
    d = os.path.join(path, 'software')
    for fn in sorted(os.listdir(d)):
        if not fn.endswith('.yml'):
            continue
        y = yaml.safe_load(open(os.path.join(d, fn), encoding='utf-8'))
        lic = y.get('licenses') or []
        if any('Proprietary' in str(x) for x in lic) or y.get('archived'):
            continue
        out.append({
            'n': y.get('name') or fn[:-4],
            'd': (y.get('description') or '').strip(),
            'u': y.get('website_url') or y.get('source_code_url') or '',
            's': y.get('source_code_url') or '',
            'lic': [str(x) for x in lic],
            'plat': y.get('platforms') or [],
            'cat': y.get('tags') or [],
            'st': y.get('stargazers_count') or 0,
            'up': str(y.get('updated_at') or ''),
            'demo': y.get('demo_url') or '',
            'src': ['awesome-selfhosted'],
        })
    log(f'awesome-selfhosted: {len(out)} free, non-archived projects')
    return out


# --------------------------------------------------------------------------- 2
def load_awesome_sysadmin():
    path = clone('https://github.com/awesome-foss/awesome-sysadmin.git', 'awesome-sysadmin')
    txt = open(os.path.join(path, 'README.md'), encoding='utf-8').read()
    body = txt.split('## Software', 1)[1].split('## List of Licenses')[0]
    out, cat = [], None
    for line in body.split('\n'):
        m = re.match(r'^### (.+)$', line.strip())
        if m:
            cat = m.group(1).strip()
            continue
        m = re.match(r'^- \[([^\]]+)\]\(([^)]+)\)\s*-\s*(.*)$', line.strip())
        if not m or not cat:
            continue
        name, url, rest = m.groups()
        ticks = re.findall(r'`([^`]+)`', rest)
        if not ticks or 'Proprietary' in ticks[0] or '⊘' in rest:
            continue
        ms = re.search(r'\[Source Code\]\(([^)]+)\)', rest)
        desc = re.sub(r'`[^`]+`', '', re.sub(r'\s*\(\[.*$', '', rest)).strip()
        out.append({
            'n': name, 'd': desc, 'u': url, 's': ms.group(1) if ms else url,
            'lic': ticks[0].split('/'), 'plat': ticks[1].split('/') if len(ticks) > 1 else [],
            'cat': ['SysAdmin - ' + cat], 'st': 0, 'up': '', 'demo': '',
            'src': ['awesome-sysadmin'],
        })
    log(f'awesome-sysadmin: {len(out)} projects')
    return out


# --------------------------------------------------------------------------- 3
def load_selfhst():
    sw = json.load(open(fetch(SELFHST + 'software.json', 'selfhst-software.json'), encoding='utf-8'))
    tags = json.load(open(fetch(SELFHST + 'tags.json', 'selfhst-tags.json'), encoding='utf-8'))
    alts = json.load(open(fetch(SELFHST + 'alternatives.json', 'selfhst-alternatives.json'), encoding='utf-8'))
    lics = json.load(open(fetch(SELFHST + 'licenses.json', 'selfhst-licenses.json'), encoding='utf-8'))
    langs = json.load(open(fetch(SELFHST + 'languages.json', 'selfhst-languages.json'), encoding='utf-8'))
    tag_by_id = {t[0]: t[1] for t in tags}
    alt_by_id = {a[0]: a[1] for a in alts}
    out = []
    for r in sw:
        (_id, name, sl, site, repo, desc, host, lic_i, lang_i,
         icon_kind, icon_slug, icon_variant, _y, stars, forks, last,
         health, tag_ids, alt_ids) = r[:19]
        if host == 'Closed':                       # non-free entries in the selfh.st directory
            continue
        ic = ''
        if icon_kind == 'Icons':
            ic = icon_slug or sl
            if icon_variant == 'Light':
                ic = ic + '-light'
        out.append({
            'n': name,
            'd': (desc or '').strip(),
            'u': ('https://' + site) if site and not site.startswith('http') else (site or ''),
            's': ('https://' + repo) if repo and not repo.startswith('http') else (repo or ''),
            'lic': [lics[int(lic_i)]] if str(lic_i).isdigit() and int(lic_i) < len(lics) else [],
            'plat': [langs[int(lang_i)]] if str(lang_i).isdigit() and int(lang_i) < len(langs) else [],
            'cat': [], 'kw': [tag_by_id[t] for t in tag_ids if t in tag_by_id],
            'alt': [alt_by_id[a] for a in alt_ids if a in alt_by_id],
            'st': int(stars or 0), 'up': str(last or '')[:10], 'demo': '',
            'ic': ic, 'health': health, 'src': ['selfh.st'],
        })
    log(f'selfh.st: {len(out)} free projects')
    return out


# --------------------------------------------------------------------------- 4
def load_curated():
    """Projects missing from every list above, or important enough to guarantee."""
    path = os.path.join(ROOT, 'scripts', 'curated.json')
    out = json.load(open(path, encoding='utf-8'))
    for o in out:
        o.setdefault('st', 0); o.setdefault('up', ''); o.setdefault('demo', '')
        o.setdefault('lic', []); o.setdefault('plat', []); o.setdefault('kw', [])
        o['src'] = ['curated']
    log(f'curated: {len(out)} extra projects')
    return out


# --------------------------------------------------------------------------- merge
def merge(*groups):
    by_repo, by_name, order = {}, {}, []

    # display-name preference: a hand written name beats a directory name beats a list name
    PRIO = {'curated': 0, 'selfh.st': 1, 'awesome-selfhosted': 2, 'awesome-sysadmin': 3}

    def put(p):
        rk, nk = repo_key(p.get('s') or p.get('u')), nrm(p['n'])
        tgt = by_repo.get(rk) if rk else None
        if tgt is None:
            tgt = by_name.get(nk)
        if tgt is None:
            p.setdefault('kw', []); p.setdefault('alt', [])
            p['names'] = [p['n']]
            p['_prio'] = PRIO.get((p.get('src') or [''])[0], 9)
            order.append(p)
            if rk:
                by_repo[rk] = p
            by_name.setdefault(nk, p)
            return
        by_name.setdefault(nk, tgt)
        # keep every spelling so questions can refer to any of them
        if p['n'] not in tgt['names']:
            tgt['names'].append(p['n'])
        prio = PRIO.get((p.get('src') or [''])[0], 9)
        if prio < tgt.get('_prio', 9):
            tgt['_prio'] = prio
            tgt['n'] = p['n']
        # merge into existing record
        for k in ('cat', 'kw', 'alt', 'plat', 'lic', 'src'):
            tgt[k] = list(dict.fromkeys((tgt.get(k) or []) + (p.get(k) or [])))
        tgt['st'] = max(tgt.get('st') or 0, p.get('st') or 0)
        if len(p.get('d') or '') > len(tgt.get('d') or ''):
            tgt['d'] = p['d']
        for k in ('u', 's', 'demo', 'ic', 'health'):
            if not tgt.get(k) and p.get(k):
                tgt[k] = p[k]
        if (p.get('up') or '') > (tgt.get('up') or ''):
            tgt['up'] = p['up']

    for g in groups:
        for p in g:
            put(p)
    log(f'merged: {len(order)} unique projects')
    return order


# --------------------------------------------------------------------------- icons
def match_icons(apps):
    """Attach a selfh.st icon slug to everything we can."""
    try:
        tree = json.load(open(fetch(
            'https://api.github.com/repos/selfhst/icons/git/trees/main?recursive=1',
            'selfhst-icons-tree.json'), encoding='utf-8'))
        have = {p['path'][4:-4] for p in tree.get('tree', []) if p['path'].startswith('png/')}
    except Exception as e:
        log('WARN icon list unavailable:', e)
        return
    hit = 0
    for a in apps:
        if a.get('ic') and a['ic'] in have:
            hit += 1
            continue
        cands = []
        base = [a['n'], re.sub(r'\s*\(.*?\)', '', a['n'])]
        base.append(re.sub(r'(?i)\s*(community edition|community|self-?hosted|server|ce)$', '', base[1]).strip())
        m = re.match(r'https?://[^/]*/[^/]+/([^/#?]+)', a.get('s') or '')
        if m:
            base.append(m.group(1))
        m = re.match(r'https?://(?:www\.)?([^./]+)\.', a.get('u') or '')
        if m:
            base.append(m.group(1))
        for b in base:
            s = slug(b)
            if s:
                cands += [s, s.replace('-', '')]
        for c in dict.fromkeys(cands):
            for v in (c, c + '-light', c + '-dark'):
                if v in have:
                    a['ic'] = v
                    break
            if a.get('ic'):
                break
        if a.get('ic'):
            hit += 1
    log(f'icons: {hit}/{len(apps)} projects have an official logo')


# --------------------------------------------------------------------------- stars
def fill_stars(apps):
    """Fetch missing star counts through the gh CLI (optional)."""
    if OFFLINE or not shutil.which('gh'):
        log('stars: gh CLI unavailable, keeping what the sources provided')
        return
    todo = []
    for a in apps:
        if a.get('st'):
            continue
        m = re.match(r'https?://github\.com/([^/]+)/([^/#?]+)', (a.get('s') or a.get('u') or ''))
        if m:
            a['_gh'] = (m.group(1), m.group(2).replace('.git', ''))
            todo.append(a)
    got = 0
    for i in range(0, len(todo), 70):
        chunk = todo[i:i + 70]
        q = 'query{' + ' '.join(
            f'r{j}: repository(owner:"{p["_gh"][0]}",name:"{p["_gh"][1]}")'
            '{stargazerCount pushedAt}' for j, p in enumerate(chunk)) + '}'
        r = subprocess.run(['gh', 'api', 'graphql', '-f', f'query={q}'],
                           capture_output=True, text=True)
        try:
            data = json.loads(r.stdout).get('data') or {}
        except Exception:
            continue
        for j, p in enumerate(chunk):
            v = data.get(f'r{j}')
            if v:
                p['st'] = v['stargazerCount']
                p['up'] = (v.get('pushedAt') or '')[:10]
                got += 1
    for a in apps:
        a.pop('_gh', None)
    log(f'stars: resolved {got} additional repositories')


# --------------------------------------------------------------------------- taxonomy
REALMS = [
    ('media',  'Media & Entertainment'),
    ('files',  'Files, Photos & Documents'),
    ('home',   'Smart Home & Workshop'),
    ('net',    'Network, Access & Security'),
    ('prod',   'Productivity & Knowledge'),
    ('comm',   'Communication'),
    ('dev',    'Development'),
    ('ai',     'AI & Automation'),
    ('life',   'Everyday Life & Hobby'),
    ('web',    'Web, Business & Publishing'),
    ('ops',    'Server Operations'),
    ('games',  'Games'),
    ('learn',  'Science, Education & Culture'),
    ('misc',   'Everything Else'),
]
RULES = [
    ('media', r'media|music|audio|video|podcast|stream|movie|tv|photo|gallery|e-?book|comic|\bbooks?\b|subtitle|karaoke|radio|torrent|peer-to-peer|usenet|\*arr'),
    ('games', r'game|gaming|emulat|retro|minecraft'),
    ('home',  r'home autom|smart home|iot|internet of things|3d print|manufactur|surveillance|camera|energy|solar|automation - home|voice assistant|matter|zigbee'),
    ('net',   r'dns|vpn|proxy|network|firewall|router|adblock|ad block|dhcp|ipam|remote access|remote desktop|security|password|2fa|identity|authentication|sso|ldap|certificate|tunnel|web server|status page|monitor|uptime|speed test|honeypot|intrusion'),
    ('files', r'file|storage|backup|sync|cloud|document|pdf|paperless|archiv|nas|s3|object stor|filesystem|dropbox|office|spreadsheet|scan|ocr'),
    ('prod',  r'note|wiki|knowledge|task|todo|to-do|kanban|calendar|contact|bookmark|read|rss|feed|search|paste|snippet|time track|habit|journal|diary|mind map|productivity'),
    ('comm',  r'communicat|chat|messag|mail|email|irc|xmpp|matrix|forum|social|fediverse|activitypub|video conferenc|voip|sip|telephon|notification|push|newsletter|comment'),
    ('dev',   r'develop|git|code|ci/?cd|continuous|api|database|sql|low ?code|no ?code|serverless|faas|container registry|package|artifact|test|debug|localization|i18n|feature flag|paas|deploy|kubernetes|terraform|infrastructure as code|secrets'),
    ('ai',    r'\bai\b|artificial intelligence|llm|machine learning|genai|automation|workflow|chatbot|speech|transcri|ocr engine'),
    ('life',  r'recipe|cook|food|money|budget|financ|account|invoic|inventory|health|fitness|sport|travel|map|gps|genealog|family|pet|garden|plant|shopping|wish|habit|hobby|car|vehicle|weather|astro'),
    ('web',   r'cms|content manag|blog|publish|static site|e-?commerce|shop|crm|erp|analytics|form|survey|poll|booking|schedul|ticket|helpdesk|support|url shorten|link|seo|marketing|project manag|human resources|resource planning'),
    ('ops',   r'sysadmin|server|virtual|hypervisor|container|docker|orchestrat|log|metric|configuration manag|provision|cluster|queue|service discovery|control panel|self-hosting solution|asset manag|packaging|time server|troubleshoot|version control|distributed filesystem'),
    ('learn', r'learn|course|lms|educat|school|student|conference|research|science|librar|repository|dataset|museum|culture|language|dictionar|note-?taking for research|citation|bibliograph|agriculture|csa'),
]


# selfh.st tag names that the keyword rules cannot classify on their own
OVERRIDES = {
    'tracking': 'life', 'bookmarks and link sharing': 'prod', 'booking and scheduling': 'web',
    'video surveillance': 'home', 'manufacturing': 'home', 'games': 'games',
    'games - administrative utilities & control panels': 'games',
    'genealogy': 'learn', 'conference management': 'learn', 'language': 'learn',
    'community-supported agriculture (csa)': 'learn', 'communication - social networks and forums': 'comm',
    'communication - video conferencing': 'comm', 'front end': 'dev', 'downloads': 'media', 'dashboard': 'ops',
    'groupware': 'prod', 'personal dashboards': 'ops', 'visualization': 'ops',
    'privacy': 'net', 'events': 'prod', 'statistics': 'ops', 'television': 'media',
    'requests': 'media', 'updates': 'ops', 'grocery lists': 'life', 'workspace': 'prod',
    'terminal': 'dev', 'nvr': 'home', 'image sharing': 'files', 'landing page': 'web',
    'location': 'life', 'wealth management': 'life', 'customer engagement': 'web',
    'medical': 'life', 'relationships': 'life', 'subscriptions': 'life', 'voting': 'web',
    'webhooks': 'dev', 'whiteboard': 'prod', 'diagrams': 'prod', 'in-memory cache': 'dev',
    'maintenance': 'ops', 'screenshots': 'files', 'scrobble': 'media', 'wake-on-lan': 'net',
    'year-in-review': 'media', 'design': 'prod', 'flights': 'life', 'ide': 'dev',
    'paywalls': 'web', 'ssh': 'net', 'web desktop': 'prod', 'ambient sounds': 'media',
    'antivirus': 'net', 'backend': 'dev', 'clipboard': 'prod', 'latex': 'prod',
    'manga': 'media', 'observability': 'ops', 'receipts': 'life', 'recording': 'media',
    'runners': 'dev', 'tournaments': 'games', 'reading': 'media', 'comics': 'media',
    'notifications': 'comm', 'proxy': 'net', 'search': 'prod', 'security': 'net',
    'storage': 'files', 'sharing': 'files', 'streaming': 'media', 'productivity': 'prod',
}


def realm_for(cat):
    c = cat.lower()
    if c in OVERRIDES:
        return OVERRIDES[c]
    if c.startswith('sysadmin - '):
        rest = c[11:]
        for rid, rx in RULES:
            if re.search(rx, rest) and rid not in ('ops',):
                return rid if rid in ('net', 'dev', 'files') else 'ops'
        return 'ops'
    for rid, rx in RULES:
        if re.search(rx, c):
            return rid
    return 'misc'


# The two vocabularies (awesome-* and selfh.st) name the same thing differently.
# Key: slug of a category as it appears in a source. Value: the name we keep.
CANON = {
 # media
 'music': 'Media Streaming - Audio Streaming', 'music-streaming': 'Media Streaming - Audio Streaming',
 'podcasts': 'Media Streaming - Audio Streaming', 'radio': 'Media Streaming - Audio Streaming',
 'media-streaming': 'Media Streaming - Multimedia Streaming', 'videos': 'Media Streaming - Video Streaming',
 'live-streaming': 'Media Streaming - Video Streaming', 'television': 'Media Management',
 'movies': 'Media Management', 'requests': 'Media Management', 'subtitles': 'Media Management',
 'downloads': 'Media Management', 'torrents': 'File Transfer - Peer-to-peer Filesharing',
 'photos': 'Photo Galleries', 'books': 'Document Management - E-books',
 'audiobooks': 'Document Management - E-books', 'comics': 'Document Management - E-books',
 'manga': 'Document Management - E-books', 'bookmarks': 'Bookmarks and Link Sharing',
 'read-later': 'Bookmarks and Link Sharing', 'social-media': 'Communication - Social Networks and Forums',
 'video-conferencing': 'Communication - Video Conferencing', 'gaming': 'Games',
 # files
 'file-sharing': 'File Transfer - Single-click & Drag-n-drop Upload',
 'local-file-sharing': 'File Transfer - Single-click & Drag-n-drop Upload',
 'image-sharing': 'File Transfer - Single-click & Drag-n-drop Upload',
 'backups': 'SysAdmin - Backups', 'backup': 'SysAdmin - Backups',
 'file-transfer-and-sync': 'File Transfer & Synchronization', 'cloud-storage': 'File Transfer & Synchronization',
 'text-sync': 'File Transfer & Synchronization', 'file-management': 'File Transfer - Web-based File Managers',
 'archive': 'Archiving and Digital Preservation (DP)',
 'object-storage': 'File Transfer - Object Storage & File Servers',
 'office-suite': 'Office Suites', 'spreadsheet': 'Office Suites',
 'pdf': 'Document Management', 'document-signing': 'Document Management',
 'distributed-filesystems': 'SysAdmin - Distributed Filesystems',
 # home
 'smart-home': 'Internet of Things (IoT)', 'home-automation': 'Internet of Things (IoT)',
 'internet-of-things': 'Internet of Things (IoT)', 'nvr': 'Video Surveillance', '3d-printing': 'Manufacturing',
 # network and security
 'monitoring': 'SysAdmin - Monitoring & Status Pages', 'uptime': 'SysAdmin - Monitoring & Status Pages',
 'observability': 'SysAdmin - Monitoring & Status Pages',
 'antivirus': 'SysAdmin - Monitoring & Status Pages',
 'reverse-proxy': 'Web Servers', 'web-server': 'Web Servers',
 'authentication': 'SysAdmin - Identity Management - Single Sign-On (SSO)',
 '2fa': 'SysAdmin - Identity Management - Single Sign-On (SSO)',
 'identity-management': 'SysAdmin - Identity Management - Tools and web interfaces',
 'vpn': 'SysAdmin - VPN', 'networking': 'Network Utilities', 'speed-test': 'Network Utilities',
 'wake-on-lan': 'Network Utilities', 'dns-servers': 'DNS', 'ad-block': 'DNS', 'sysadmin-dns-servers': 'DNS',
 'sysadmin-dns-control-panels-domain-management': 'DNS',
 'dns-control-panels-domain-management': 'DNS',
 'password-manager': 'Password Managers', 'remote-desktop-clients': 'Remote Access', 'ssh': 'Remote Access',
 'firewall': 'SysAdmin - Router', 'router': 'SysAdmin - Router',
 'network-configuration-management': 'SysAdmin - Network Configuration Management',
 'it-asset-management': 'SysAdmin - IT Asset Management',
 # productivity
 'note-taking': 'Note-taking & Editors', 'wiki': 'Wikis',
 'tasks-and-to-do-lists': 'Task Management & To-do Lists', 'kanban': 'Task Management & To-do Lists',
 'rss': 'Feed Readers', 'feed-reader': 'Feed Readers', 'pastebin': 'Pastebins', 'code-snippets': 'Pastebins',
 'calendar': 'Calendar & Contacts', 'contacts': 'Calendar & Contacts', 'caldav-cardav': 'Calendar & Contacts',
 'search': 'Search Engines', 'diagrams': 'SysAdmin - Diagramming', 'diagramming': 'SysAdmin - Diagramming',
 'whiteboard': 'SysAdmin - Diagramming',
 # communication
 'email': 'Communication - Email - Complete Solutions',
 'messaging': 'Communication - Custom Communication Systems',
 'notifications': 'Communication - Custom Communication Systems',
 'forums': 'Communication - Social Networks and Forums',
 'social-news': 'Communication - Social Networks and Forums',
 'activitypub-fediverse': 'Communication - Social Networks and Forums',
 'newsletters': 'Communication - Email - Mailing Lists and Newsletters',
 # development
 'database': 'Database Management', 'relational-database': 'Database Management',
 'in-memory-cache': 'Database Management', 'deployment': 'SysAdmin - Deployment Automation',
 'deployment-automation': 'SysAdmin - Deployment Automation',
 'no-code-low-code': 'Software Development - Low Code',
 'continuous-integration-continuous-deployment': 'SysAdmin - Continuous Integration & Continuous Deployment',
 'git': 'Software Development - Project Management', 'ide': 'Software Development - IDE & Tools',
 'development-environment': 'Software Development - IDE & Tools', 'paas': 'SysAdmin - PaaS',
 'configuration-management': 'SysAdmin - Configuration Management',
 # ai
 'artificial-intelligence': 'Generative Artificial Intelligence (GenAI)', 'workflow-automation': 'Automation',
 # everyday life
 'budgeting': 'Money, Budgeting & Management', 'accounting': 'Money, Budgeting & Management',
 'wealth-management': 'Money, Budgeting & Management', 'receipts': 'Money, Budgeting & Management',
 'recipes': 'Recipe Management', 'fitness': 'Health and Fitness', 'health-and-wellness': 'Health and Fitness',
 'medical': 'Health and Fitness', 'gps': 'Maps and Global Positioning System (GPS)',
 'maps': 'Maps and Global Positioning System (GPS)', 'location': 'Maps and Global Positioning System (GPS)',
 'travel': 'Travel Organization', 'flights': 'Travel Organization',
 'genealogy-family-trees': 'Genealogy', 'grocery-lists': 'Inventory Management',
 # web and business
 'web-analytics': 'Analytics', 'blog': 'Blogging Platforms',
 'content-management': 'Content Management Systems (CMS)',
 'url-shortener': 'URL Shorteners', 'project-management': 'Software Development - Project Management',
 'support-ticketing': 'Ticketing', 'surveys-and-forms': 'Polls and Events', 'event-polls': 'Polls and Events',
 'voting': 'Polls and Events', 'events': 'Polls and Events', 'crm': 'Customer Relationship Management (CRM)',
 'erp': 'Resource Planning', 'human-resources': 'Human Resources Management (HRM)',
 'scheduling': 'Booking and Scheduling', 'static-site': 'Static Site Generators',
 # operations
 'docker': 'SysAdmin - Software Containers', 'software-containers': 'SysAdmin - Software Containers',
 'dashboard': 'Personal Dashboards', 'logs': 'SysAdmin - Log Management',
 'log-management': 'SysAdmin - Log Management', 'virtualization': 'SysAdmin - Virtualization',
 'control-panel': 'SysAdmin - Control Panels', 'control-panels': 'SysAdmin - Control Panels',
 'metrics-metric-collection': 'SysAdmin - Metrics & Metric Collection',
 'version-control': 'SysAdmin - Version control', 'sysadmin-miscellaneous': 'Miscellaneous',
 'tools': 'Miscellaneous', 'sysadmin-automation': 'Build and software organization tools',
 # learning
 'learning': 'Learning and Courses',
}


def build_categories(apps):
    """One flat, de-duplicated category list; every project lands in at least one."""
    cats = {}
    for a in apps:
        names = list(dict.fromkeys((a.get('cat') or []) + (a.get('kw') or [])))
        if not names:
            names = ['Miscellaneous']
        ids = []
        for n in names:
            cid = slug(n)
            if cid in CANON:                        # fold synonyms into one canonical category
                n = CANON[cid]
                cid = slug(n)
            if cid in ids:
                continue
            c = cats.setdefault(cid, {'id': cid, 'name': n.replace('SysAdmin - ', ''),
                                      'full': n, 'realm': realm_for(n), 'n': 0})
            c['n'] += 1
            ids.append(cid)
        a['c'] = ids
    for c in cats.values():
        c.pop('full', None)
    log(f'categories: {len(cats)} across {len(REALMS)} realms')
    return sorted(cats.values(), key=lambda c: (-c['n'], c['name']))


# --------------------------------------------------------------------------- main
def main():
    print('Building Selfhosted Compass data set...')
    apps = merge(load_awesome_selfhosted(), load_awesome_sysadmin(),
                 load_selfhst(), load_curated())
    fill_stars(apps)
    match_icons(apps)
    cats = build_categories(apps)

    GENERIC = {'docker', 'docker-compose', 'docker-swarm', 'git', 'vim', 'emacs', 'gnu-make',
               'apache-ant', 'apache-maven', 'gradle', 'bazel', 'rake', 'qemu', 'kvm', 'lxc',
               'openvz', 'systemd-nspawn', 'htop', 'podman', 'incus', 'xen', 'mercurial',
               'subversion', 'darcs', 'fossil', 'nginx', 'etcd', 'consul', 'micro', 'nano',
               'rtop', 'ruptime', 'curl', 'wget'}
    out = []
    for a in sorted(apps, key=lambda x: -(x.get('st') or 0)):
        m = re.match(r'https?://github\.com/([^/]+)/', a.get('s') or '')
        sid = slug(a['n']) or slug(a.get('s') or 'app')
        rec = {
            'id': sid, 'n': a['n'], 'd': (a.get('d') or '')[:300],
            'u': a.get('u') or a.get('s') or '', 's': a.get('s') or '',
            'lic': (a.get('lic') or [])[:2], 'p': (a.get('plat') or [])[:4],
            'c': a['c'], 'st': a.get('st') or 0, 'up': a.get('up') or '',
            'ic': a.get('ic') or '', 'gh': m.group(1) if m else '',
            'alt': (a.get('alt') or [])[:4], 'demo': a.get('demo') or '',
            'src': a.get('src', []),
        }
        aka = [x for x in (a.get('names') or []) if x != a['n']]
        if aka:
            rec['aka'] = aka
        if a.get('health'):
            rec['h'] = a['health']
        if sid in GENERIC:
            rec['x'] = 1                                    # tooling, never recommend as an "app"
        out.append(rec)

    # unique ids
    seen = {}
    for r in out:
        if r['id'] in seen:
            seen[r['id']] += 1
            r['id'] = f"{r['id']}-{seen[r['id']]}"
        else:
            seen[r['id']] = 1

    payload = {
        'generated': datetime.date.today().isoformat(),
        'counts': {'apps': len(out), 'categories': len(cats),
                   'withIcon': sum(1 for r in out if r['ic'])},
        'sources': [
            {'name': 'awesome-selfhosted', 'url': 'https://github.com/awesome-selfhosted/awesome-selfhosted', 'license': 'CC-BY-SA-3.0'},
            {'name': 'awesome-sysadmin', 'url': 'https://github.com/awesome-foss/awesome-sysadmin', 'license': 'CC-BY-SA-4.0'},
            {'name': 'selfh.st/apps', 'url': 'https://selfh.st/apps/', 'license': 'directory data'},
            {'name': 'selfh.st/icons', 'url': 'https://selfh.st/icons/', 'license': 'logos belong to their projects'},
        ],
        'realms': [{'id': a, 'name': b} for a, b in REALMS],
        'categories': cats,
        'apps': out,
    }
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, separators=(',', ':'))
    size = os.path.getsize(OUT) / 1024
    print(f'\nWrote {OUT}  ({size:.0f} KB)')
    print(f'  {len(out)} projects, {len(cats)} categories, '
          f'{payload["counts"]["withIcon"]} with official logo')


if __name__ == '__main__':
    main()
