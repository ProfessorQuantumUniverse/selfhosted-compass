/* Selfhosted Compass - application logic
   Data comes from data/apps.json (built by scripts/build_data.py).
   The single file build in dist/ inlines the same data as window.__DATA__. */

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
const nrm = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const slug = s => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const arr = x => Array.isArray(x) ? x : [x];
const esc = s => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const kfmt = n => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : String(n || 0);
const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };

let DB = null, APPS = [], CATS = {}, REALMS = [], BY_ID = {}, BY_NAME = {}, BY_CAT = {};
let NAMED = new Set();       // every project the questionnaire can name - the rabbit hole avoids these
let BUR = {};                // burrow id -> burrow

/* ------------------------------------------------------------------ state */
const PROFILE = [
  { id:'exp', t:'How much experience do you have?', h:'Controls how complex the suggestions may get.',
    o:[['new','Beginner'],['mid','Some practice'],['pro','Veteran']], d:'mid' },
  { id:'plat', t:'How do you run things?', h:'Decides whether container tooling shows up.',
    o:[['docker','Docker / Compose'],['vm','Proxmox / VMs'],['bare','Straight on the host'],['k8s','Kubernetes']], d:'docker' },
  { id:'hw', t:'On what hardware?', h:'Heavyweights get pushed down on small machines.',
    o:[['pi','Raspberry Pi & co.'],['mini','Mini PC / NAS'],['big','Proper server']], d:'mini' },
  { id:'exposure', t:'How do you reach your services?', h:'Public access pulls in security must-haves.',
    o:[['lan','LAN only'],['vpn','Through a VPN'],['public','Public with a domain']], d:'lan' },
];

const BLANK = () => ({
  prof:{}, taste:{}, areas:[], ans:{}, pick:{}, owned:[], list:[],
  qmode:'deck', pos:{}, seenResults:false,
  rh:{ ans:{}, path:[], seen:[], last:null },
});
let S = BLANK();
PROFILE.forEach(p => S.prof[p.id] = p.d);
TASTE.forEach(t => S.taste[t.id] = t.d);

const KEY_STORE = 'shc3';
const save = () => { try { localStorage.setItem(KEY_STORE, JSON.stringify(S)); } catch (e) {} };
function load() {
  try {
    const cur = JSON.parse(localStorage.getItem(KEY_STORE));
    if (cur) return cur;
    const old = JSON.parse(localStorage.getItem('shc2'));   // carry over an earlier run
    if (old) return { prof:old.prof, ans:old.ans, pick:old.pick, owned:old.owned, list:old.list };
  } catch (e) {}
  return null;
}

/* answers: y = yes, p = yes and this is why I am here, n = no, h = already got it */
const isYes = id => S.ans[id] === 'y' || S.ans[id] === 'p';
const activeGroups = () => S.areas && S.areas.length ? GROUPS.filter(g => S.areas.includes(g.id)) : GROUPS;
const activeNeeds = () => { const ids = activeGroups().map(g => g.id); return NEEDS.filter(n => ids.includes(n.g)); };
const groupNeeds = gid => NEEDS.filter(n => n.g === gid);

/* ------------------------------------------------------------------ images */
function srcs(p) {
  const l = [];
  if (p.ic) l.push('https://cdn.jsdelivr.net/gh/selfhst/icons/png/' + p.ic + '.png');
  if (p.gh) l.push('https://github.com/' + encodeURIComponent(p.gh) + '.png?size=96');
  const h = (p.u || p.s || '').match(/^https?:\/\/([^/]+)/);
  if (h && !/github\.com|gitlab\.com|codeberg\.org|sourceforge/.test(h[1]))
    l.push('https://icons.duckduckgo.com/ip3/' + h[1] + '.ico');
  return l;
}
function icon(p, cls) {
  const l = srcs(p), letter = esc((p.n || '?')[0].toUpperCase());
  if (!l.length) return `<span class="ph ${cls || ''}">${letter}</span>`;
  return `<img class="${cls || ''}" src="${esc(l[0])}" data-f="${esc(JSON.stringify(l.slice(1)))}"
    data-l="${letter}" onerror="imgErr(this)" alt="${esc(p.n)} logo">`;
}
function imgErr(el) {
  let f = []; try { f = JSON.parse(el.dataset.f || '[]'); } catch (e) {}
  if (f.length) { el.src = f.shift(); el.dataset.f = JSON.stringify(f); return; }
  const s = document.createElement('span');
  s.className = 'ph ' + el.className.replace('ph', '');
  s.textContent = el.dataset.l || '?';
  el.replaceWith(s);
}
// some hosts never answer and never fire onerror - move on after a while
setInterval(() => $$('img[data-f]').forEach(el => {
  if (el.complete && el.naturalWidth > 0) { el.removeAttribute('data-f'); return; }
  const r = el.getBoundingClientRect();
  if (r.bottom < -300 || r.top > innerHeight + 300 || !r.width) return;
  const t = +(el.dataset.t || 0) + 1; el.dataset.t = t;
  if (t >= 3) { el.dataset.t = 0; imgErr(el); }
}), 2000);


/* ------------------------------------------------------------------ icons
   Small stroked line icons, drawn in currentColor - no emoji anywhere. */
const ICONS = {
  media:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m10.5 9.5 4.5 2.5-4.5 2.5z"/>',
  files:'<path d="M3 7.5A2 2 0 0 1 5 5.5h3.6l1.9 2H19a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  home:'<path d="m3.8 11 8.2-6.6 8.2 6.6"/><path d="M6.3 9.9V19h11.4V9.9"/><path d="M10.3 19v-4.4h3.4V19"/>',
  net:'<path d="m12 3.4 7 2.6v5.6c0 3.9-2.8 7-7 8.9-4.2-1.9-7-5-7-8.9V6z"/><path d="m9.3 12 1.9 1.9 3.6-3.7"/>',
  prod:'<path d="M4.5 19.5h4L20 8a2.1 2.1 0 0 0-3-3L5.5 16.5z"/><path d="m14.5 6.5 3 3"/>',
  comm:'<path d="M4 6.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9.5L4.8 19.3a.5.5 0 0 1-.8-.4z"/>',
  dev:'<path d="m9 8.5-3.6 3.6L9 15.7"/><path d="m15 8.5 3.6 3.6L15 15.7"/>',
  ai:'<rect x="7" y="7" width="10" height="10" rx="2.2"/><path d="M10.2 3.4v3.2M13.8 3.4v3.2M10.2 17.4v3.2M13.8 17.4v3.2M3.4 10.2h3.2M3.4 13.8h3.2M17.4 10.2h3.2M17.4 13.8h3.2"/>',
  life:'<path d="M5.6 8.5h12.8l-1.1 11a1.5 1.5 0 0 1-1.5 1.3H8.2a1.5 1.5 0 0 1-1.5-1.3z"/><path d="M9.2 8.5a2.8 2.8 0 0 1 5.6 0"/>',
  web:'<circle cx="12" cy="12" r="8.4"/><path d="M3.6 12h16.8"/><path d="M12 3.6c2.4 2.5 2.4 14.3 0 16.8-2.4-2.5-2.4-14.3 0-16.8z"/>',
  learn:'<path d="M5 5.4A1.9 1.9 0 0 1 6.9 3.5H19v14H6.9A1.9 1.9 0 0 0 5 19.4z"/><path d="M5 19.4v1.1h14"/><path d="M9 7.5h6"/>',
  ops:'<rect x="3.6" y="4.4" width="16.8" height="6" rx="1.6"/><rect x="3.6" y="13.6" width="16.8" height="6" rx="1.6"/><path d="M7 7.4h.01M7 16.6h.01"/>',
  games:'<rect x="2.8" y="7.2" width="18.4" height="9.6" rx="4.2"/><path d="M7 10.6v2.8M5.6 12h2.8"/><path d="M15.6 11.4h.01M18 13.2h.01"/>',
  misc:'<circle cx="12" cy="12" r="1.4"/><circle cx="5.4" cy="12" r="1.4"/><circle cx="18.6" cy="12" r="1.4"/>',
  compass:'<circle cx="12" cy="12" r="8.4"/><path d="M15.6 8.4 13.7 13.7 8.4 15.6 10.3 10.3z"/>',
  folder:'<path d="M3 7.5A2 2 0 0 1 5 5.5h3.6l1.9 2H19a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  search:'<circle cx="11" cy="11" r="6.4"/><path d="m19.8 19.8-4.2-4.2"/>',
  list:'<path d="M9 6.5h11M9 12h11M9 17.5h11"/><path d="M4.6 6.5h.01M4.6 12h.01M4.6 17.5h.01"/>',
  sliders:'<path d="M4 8.4h8.2M16.6 8.4H20M4 15.6h3.4M11.8 15.6H20"/><circle cx="14.4" cy="8.4" r="2.2"/><circle cx="9.6" cy="15.6" r="2.2"/>',
  star:'<path d="m12 4.6 2.3 4.7 5.2.8-3.8 3.6.9 5.2-4.6-2.5-4.6 2.5.9-5.2-3.8-3.6 5.2-.8z"/>',
  check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  plus:'<path d="M12 5.5v13M5.5 12h13"/>',
  close:'<path d="m6.5 6.5 11 11M17.5 6.5l-11 11"/>',
  down:'<path d="M12 5v13"/><path d="m6.5 12.5 5.5 5.5 5.5-5.5"/>',
  back:'<path d="M19 12H5"/><path d="m11.5 5.5-6 6.5 6 6.5"/>',
  dice:'<rect x="4.2" y="4.2" width="15.6" height="15.6" rx="3.4"/><path d="M9 9h.01M15 15h.01M12 12h.01"/>',
  layers:'<path d="m12 3.6 8.4 4.2-8.4 4.2L3.6 7.8z"/><path d="m3.6 12 8.4 4.2 8.4-4.2"/><path d="m3.6 16.2 8.4 4.2 8.4-4.2"/>',
  bolt:'<path d="M13.4 3.2 5.8 13.4h5.2l-.4 7.4 7.6-10.2h-5.2z"/>',
};
function svg(name, size) {
  const d = ICONS[name] || ICONS.folder;
  return `<svg class="i" viewBox="0 0 24 24" width="${size || 18}" height="${size || 18}"
    fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
    stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
}

/* ------------------------------------------------------------------ lookup */
function P(name) { return BY_NAME[nrm(name)] || null; }
function catId(tagName) { return slug(tagName); }

function score(p) {
  let s = Math.log2((p.st || 0) + 2) * 10;
  const pf = (p.p || []).join(' ').toLowerCase();
  if (S.prof.plat === 'docker' && /docker/.test(pf)) s += 14;
  if (S.prof.hw === 'pi' && /(java|clojure|scala|elixir)/.test(pf)) s -= 22;
  if (S.prof.hw === 'pi' && /(go|rust|php|c\b)/.test(pf)) s += 6;
  if (S.prof.exp === 'new') s += Math.log2((p.st || 0) + 2) * 3;
  const y = +(p.up || '').slice(0, 4), now = new Date().getFullYear();
  if (y && y >= now - 1) s += 10; else if (y && y < now - 2) s -= 18;
  if (p.h === 'R') s -= 25; else if (p.h === 'Y') s -= 8;
  if (p.x) s -= 500;
  return s;
}
function pool(tagNames, skip) {
  const ids = arr(tagNames).map(catId);
  const out = [];
  ids.forEach(id => (BY_CAT[id] || []).forEach(p => {
    if (p.x || (skip && skip.has(p.id)) || out.includes(p)) return;
    out.push(p);
  }));
  return out.sort((a, b) => score(b) - score(a));
}

/* --------------------------------------------------------------- taste fit
   Every alternative may carry t:'suite unix polish lean new proven'.
   Where a tag is missing the data itself stands in: language for weight,
   stars for how proven something is, a multi-project answer for shape. */
const OPPOSITE = { suite:'unix', unix:'suite', polish:'lean', lean:'polish', new:'proven', proven:'new' };
function wanted() { return [S.taste.shape || 'unix', S.taste.weight || 'polish', S.taste.age || 'proven']; }
function tasteFit(alt) {
  if (alt.nx) return -1e6;      // a deliberately narrower answer - offered, never auto-picked
  const tags = (alt.t || '').split(' ').filter(Boolean), want = wanted();
  let s = 0;
  tags.forEach(t => { if (want.includes(t)) s += 10; else if (want.includes(OPPOSITE[t])) s -= 8; });
  const p = arr(alt.i).map(P).filter(Boolean)[0];
  if (!p) return s;
  if (!tags.includes('lean') && !tags.includes('polish')) {
    const lang = (p.p || []).join(' ').toLowerCase();
    if (/\b(go|rust|c\+\+|zig)\b/.test(lang)) s += S.taste.weight === 'lean' ? 5 : -2;
    if (/(java|scala|clojure|ruby|elixir)/.test(lang)) s += S.taste.weight === 'polish' ? 3 : -5;
  }
  if (!tags.includes('new') && !tags.includes('proven')) {
    // popularity stands in for "proven" - capped so it can never outweigh a real tag
    const pop = Math.min(6, Math.log2((p.st || 0) + 2) / 2.5);
    s += S.taste.age === 'proven' ? pop : -pop / 2;
  }
  if (!tags.includes('suite') && !tags.includes('unix') && arr(alt.i).length > 2)
    s += S.taste.shape === 'unix' ? 4 : -4;
  return s;
}
function autoPick(n) {
  const alts = n.alts || [];
  if (alts.length < 2) return 0;
  if (n.fx) return 0;          // this follow-up asks what you want, not how - taste stays out
  // alts[0] is the editorial default; taste has to disagree properly before it moves
  let best = 0, bs = -1e9;
  alts.forEach((a, i) => { const s = tasteFit(a) + (i === 0 ? 6 : 0); if (s > bs) { bs = s; best = i; } });
  return best;
}
/* questions where the follow-up is a real fork in the road */
const decisions = () => activeNeeds().filter(n => isYes(n.id) && (n.alts || []).length > 1);

/* ------------------------------------------------------------------ routing */
const ROUTES = () => ['#/', '#/setup', '#/areas', ...activeGroups().map(g => '#/q/' + g.id), '#/decide', '#/results'];
let KEYS = null;                       // views that want the keyboard set this
function route() {
  const h = location.hash || '#/';
  const [, sec, arg] = h.split('/');
  closeDrawer(); KEYS = null;
  if (h.startsWith('#/q/')) return viewQuestions(arg);
  if (h.startsWith('#/c/')) return viewCategory(arg);
  if (h.startsWith('#/search')) return viewSearch(decodeURIComponent(arg || ''));
  switch ('#/' + (sec || '')) {
    case '#/setup': return viewSetup();
    case '#/areas': return viewAreas();
    case '#/decide': return viewDecide();
    case '#/results': return viewResults();
    case '#/rabbit': return viewRabbit();
    case '#/explore': return viewExplore();
    case '#/list': return viewList();
    default: return viewIntro();
  }
}
function goto(h) { if (location.hash === h) route(); else location.hash = h; }
function nextRoute(step) {
  const r = ROUTES(), i = r.indexOf(location.hash || '#/');
  goto(r[Math.max(0, Math.min(r.length - 1, (i < 0 ? 0 : i) + step))]);
}

function render(html) {
  $('#app').innerHTML = html;
  window.scrollTo({ top: 0, behavior: 'instant' });
  chrome();
}
function chrome() {
  const answered = activeNeeds().filter(n => S.ans[n.id]).length;
  const h = location.hash || '#/';
  const opened = Object.values(S.rh.ans).filter(a => a === 'y').length;
  const tabs = [
    ['#/', 'Start', 0],
    ['#/areas', 'Questionnaire', 0],
    ['#/results', 'Results', 0],
    ['#/rabbit', 'Rabbit hole', opened],
    ['#/explore', 'Explore', 0],
    ['#/list', 'My list', S.list.length],
  ];
  $('#tabs').innerHTML = tabs.map(([href, label, n]) => {
    const on = href === '#/' ? h === '#/'
      : href === '#/areas' ? (h.startsWith('#/q/') || h === '#/setup' || h === '#/areas' || h === '#/decide')
      : href === '#/explore' ? (h.startsWith('#/explore') || h.startsWith('#/c/') || h.startsWith('#/search'))
      : h.startsWith(href);
    return `<button class="tab${on ? ' on' : ''}" onclick="goto('${href}')">${label}${
      n ? `<span class="n">${n}</span>` : ''}</button>`;
  }).join('');
  const r = ROUTES(), i = r.indexOf(h);
  $('#pbar').style.width = (i <= 0 ? 0 : Math.round(i / (r.length - 1) * 100)) + '%';
  $('#q').placeholder = `Search ${APPS.length.toLocaleString('en-US')} projects…`;
  document.title = answered
    ? `Selfhosted Compass — ${answered} answers`
    : 'Selfhosted Compass — find the self-hosted projects that fit you';
}

/* ------------------------------------------------------------------ intro */
function viewIntro() {
  const saved = Object.keys(S.ans).length;
  const fresh = APPS.length - NAMED.size;
  render(`
  <section class="hero">
    <h1>Find <span>your</span> self-hosted stack.</h1>
    <p class="lead">Instead of reading through ${APPS.length.toLocaleString('en-US')} projects: pick the corners you care about,
      answer a short run of questions, and get a stack — then climb down the rabbit hole into the
      ${fresh.toLocaleString('en-US')} projects the questions never mention.</p>
    <div class="cta">
      <button class="btn" onclick="goto('#/setup')">${saved ? 'Continue' : 'Start the questionnaire'} →</button>
      <button class="btn ghost" onclick="goto('#/rabbit')">${svg('layers',14)} Straight to the rabbit hole</button>
      ${saved ? `<button class="btn ghost" onclick="resetAll()">Start over</button>` : ''}
    </div>
    <div class="stats">
      <div class="stat"><b>${APPS.length.toLocaleString('en-US')}</b><span>free projects</span></div>
      <div class="stat"><b>${NEEDS.length}</b><span>questions</span></div>
      <div class="stat"><b>${BURROWS.length}</b><span>rabbit holes</span></div>
      <div class="stat"><b>${Object.keys(CATS).length}</b><span>categories</span></div>
    </div>
    <div class="howto">
      <div class="s"><i>1</i><b>Pick your corners</b><p>Twelve areas. Skip the ones you do not care about and their questions never appear.</p></div>
      <div class="s"><i>2</i><b>Run the deck</b><p>One question at a time, or the whole section as a list. Yes, no, already got it — or "this is why I am here".</p></div>
      <div class="s"><i>3</i><b>Decide once, at the end</b><p>Three questions about taste pre-pick every "which one?" for you. You only overrule what you disagree with.</p></div>
      <div class="s"><i>4</i><b>Then go down</b><p>The rabbit hole deals cards from the ${fresh.toLocaleString('en-US')} projects you have not met. Saying yes takes you deeper, not onwards.</p></div>
    </div>
  </section>`);
}

/* ------------------------------------------------------------------ setup */
function viewSetup() {
  render(`
  <div class="ghead"><div class="ic">${svg('sliders',22)}</div><div><h2>Your setup</h2>
    <p>So the recommendations match your hardware and your patience. Defaults are already sensible.</p></div></div>
  <div class="pgrid">${PROFILE.map(q => `
    <div class="pc"><h3>${esc(q.t)}</h3><p>${esc(q.h)}</p><div class="opts">${
      q.o.map(o => `<button class="opt${S.prof[q.id] === o[0] ? ' a' : ''}" data-p="${q.id}" data-v="${o[0]}">${esc(o[1])}</button>`).join('')
    }</div></div>`).join('')}</div>
  <div class="nav">
    <button class="btn ghost" onclick="goto('#/')">← Back</button>
    <div class="navr"><span class="hint">Four settings, then you choose which areas to answer at all.</span>
      <button class="btn" onclick="goto('#/areas')">Next →</button></div>
  </div>`);
  $('.pgrid').onclick = e => {
    const b = e.target.closest('[data-p]'); if (!b) return;
    S.prof[b.dataset.p] = b.dataset.v; save();
    $$(`[data-p="${b.dataset.p}"]`).forEach(x => x.classList.toggle('a', x === b));
  };
}

/* ------------------------------------------------------- areas (the gate)
   The single biggest saving in the questionnaire: skip a whole area and its
   questions never get asked. */
function areaPreview(g) {
  const seen = new Set(), out = [];
  groupNeeds(g.id).forEach(n => (n.alts || []).forEach(a => arr(a.i).forEach(x => {
    const p = P(x); if (p && !seen.has(p.id)) { seen.add(p.id); out.push(p); }
  })));
  return out.sort((a, b) => (b.st || 0) - (a.st || 0)).slice(0, 6);
}
function viewAreas() {
  const chosen = S.areas && S.areas.length ? S.areas : GROUPS.map(g => g.id);
  const total = NEEDS.filter(n => chosen.includes(n.g)).length;
  render(`
  <div class="ghead"><div class="ic">${svg('compass',22)}</div><div><h2>Which corners are you here for?</h2>
    <p>Everything is on to start with. Switch off what you do not care about — those questions are then never asked.</p></div></div>
  <div class="areas" id="areas">${GROUPS.map(g => {
    const on = chosen.includes(g.id), qs = groupNeeds(g.id).length;
    return `<button class="area${on ? ' on' : ''}" data-g="${g.id}">
      <div class="ah"><span class="ic">${svg(g.ic,18)}</span><b>${esc(g.t)}</b>
        <span class="mark">${on ? svg('check',13) : svg('plus',13)}</span></div>
      <p>${esc(g.s)}</p>
      <div class="afoot"><div class="logos">${areaPreview(g).map(p => icon(p, 'sm')).join('')}</div>
        <span class="cnt">${qs} questions</span></div></button>`;
  }).join('')}</div>
  <div class="nav">
    <div class="navl">
      <button class="btn ghost sm" onclick="setAreas('all')">Select all</button>
      <button class="btn ghost sm" onclick="setAreas('none')">Clear</button>
      <label class="modeswitch" title="How the questions are presented">
        <button class="opt${S.qmode === 'deck' ? ' a' : ''}" onclick="setMode('deck')">Card deck</button>
        <button class="opt${S.qmode === 'list' ? ' a' : ''}" onclick="setMode('list')">List</button>
      </label>
    </div>
    <div class="navr"><span class="hint" id="acount">${total} question${total === 1 ? '' : 's'} · roughly ${
        Math.max(1, Math.round(total / 12))} minute${Math.max(1, Math.round(total / 12)) === 1 ? '' : 's'}</span>
      <button class="btn" onclick="startQuestions()">Start →</button></div>
  </div>`);
  $('#areas').onclick = e => {
    const b = e.target.closest('[data-g]'); if (!b) return;
    const g = b.dataset.g, cur = S.areas && S.areas.length ? S.areas.slice() : GROUPS.map(x => x.id);
    const i = cur.indexOf(g);
    if (i < 0) cur.push(g); else cur.splice(i, 1);
    S.areas = cur; save(); viewAreas();
  };
}
function setAreas(what) {
  S.areas = what === 'all' ? GROUPS.map(g => g.id) : [];
  if (what === 'none') S.areas = ['__none__'];       // an explicit empty choice
  save(); viewAreas();
}
function setMode(m) { S.qmode = m; save(); route(); }
function startQuestions() {
  const gs = activeGroups();
  if (!gs.length) return toast('Pick at least one area first');
  goto('#/q/' + gs[0].id);
}

/* ------------------------------------------------------------------ questions */
function previewOf(n, k) {
  const out = [], seen = new Set();
  (n.alts || []).forEach(a => arr(a.i).forEach(x => {
    const p = P(x); if (p && !seen.has(p.id)) { seen.add(p.id); out.push(p); }
  }));
  if (out.length < 3 && n.tag) pool(n.tag).slice(0, 3).forEach(p => { if (!seen.has(p.id)) { seen.add(p.id); out.push(p); } });
  return out.slice(0, k || 4);
}
function answerRow(n) {
  const a = S.ans[n.id] || '';
  return `<div class="opts ans">
    <button class="opt${a === 'y' ? ' a' : ''}" data-n="${n.id}" data-a="y"><kbd>1</kbd>Yes</button>
    <button class="opt pri${a === 'p' ? ' a' : ''}" data-n="${n.id}" data-a="p"><kbd>2</kbd>${svg('bolt',12)} Top priority</button>
    <button class="opt${a === 'n' ? ' a n' : ''}" data-n="${n.id}" data-a="n"><kbd>3</kbd>No</button>
    <button class="opt${a === 'h' ? ' a h' : ''}" data-n="${n.id}" data-a="h"><kbd>4</kbd>Already got it</button>
  </div>`;
}
function qHTML(n) {
  const a = S.ans[n.id] || '';
  const st = a === 'p' ? 'pri' : a === 'y' ? 'yes' : a === 'h' ? 'have' : a === 'n' ? 'no' : '';
  return `<div class="q ${st}" id="q-${n.id}">
    <div class="qh">
      <div class="qt"><b>${esc(n.q)}</b><small>${esc(n.h || '')}</small></div>
      ${answerRow(n)}
    </div>
    <div class="qlogos">${previewOf(n).map(p => icon(p, 'sm')).join('')}
      ${(n.alts || []).length > 1 ? `<span class="hint">${n.alts.length} options — you pick at the end</span>` : ''}</div>
  </div>`;
}
function stackBar(last) {
  const yes = activeNeeds().filter(n => isYes(n.id)).length;
  const pri = activeNeeds().filter(n => S.ans[n.id] === 'p').length;
  return `<div class="stackbar"><b>${yes}</b> in your stack${pri ? ` · <b>${pri}</b> core` : ''}
    ${last ? `<span class="added">${svg('plus',11)} ${esc(last)}</span>` : ''}</div>`;
}
function viewQuestions(gid) {
  const gs = activeGroups();
  const gi = gs.findIndex(g => g.id === gid);
  if (gi < 0) return goto(gs.length ? '#/q/' + gs[0].id : '#/areas');
  return S.qmode === 'deck' ? viewDeck(gi) : viewQList(gi);
}
function sectionSteps(gs, gi) {
  return `<div class="steps">${gs.map((x, i) => {
    const done = groupNeeds(x.id).filter(n => S.ans[n.id]).length, all = groupNeeds(x.id).length;
    return `<div class="step ${i === gi ? 'cur' : done >= all ? 'done' : done ? 'part' : ''}"
      title="${esc(x.t)} — ${done}/${all}" onclick="goto('#/q/${x.id}')"></div>`;
  }).join('')}</div>`;
}

/* ---- deck: one question at a time, keyboard driven --------------------- */
function deckAt(gi) {
  const gs = activeGroups(), g = gs[gi], qs = groupNeeds(g.id);
  let i = S.pos[g.id] || 0;
  if (i >= qs.length) i = qs.length - 1;
  return { gs, g, qs, i };
}
function viewDeck(gi, lastAdded) {
  const { gs, g, qs, i } = deckAt(gi);
  const n = qs[i];
  const doneAll = activeNeeds().filter(x => S.ans[x.id]).length;
  const totalAll = activeNeeds().length;
  render(`
  <div class="ghead"><div class="ic">${svg(g.ic,22)}</div><div><h2>${esc(g.t)}</h2><p>${esc(g.s)}</p></div>
    <button class="btn ghost sm" onclick="setMode('list')">Show as list</button></div>
  ${sectionSteps(gs, gi)}
  ${stackBar(lastAdded)}
  <div class="deck" id="deck">
    <div class="dcount">Question ${doneAll + (S.ans[n.id] ? 0 : 1)} of ${totalAll}
      <span class="dsec">${esc(g.t)} · ${i + 1}/${qs.length}</span></div>
    <div class="dcard" id="q-${n.id}">
      <h3>${esc(n.q)}</h3>
      <p>${esc(n.h || '')}</p>
      <div class="dlogos">${previewOf(n, 5).map(p =>
        `<span class="dl" onclick="openApp('${p.id}')" title="${esc(p.n)}">${icon(p)}<i>${esc(p.n)}</i></span>`).join('')}</div>
      ${answerRow(n)}
      ${(n.alts || []).length > 1 ? `<div class="dnote">${n.alts.length} ways to do this — you choose once, at the end.</div>` : ''}
    </div>
    <div class="dnav">
      <button class="btn ghost sm" onclick="deckStep(-1)">${svg('back',13)} Back</button>
      <span class="hint">Keys 1–4 to answer, ← and → to move, S to skip the section</span>
      <button class="btn ghost sm" onclick="deckStep(1)">Skip →</button>
    </div>
  </div>
  <div class="nav">
    <button class="btn ghost" onclick="goto('#/areas')">← Areas</button>
    <div class="navr"><span class="hint">Unanswered counts as no</span>
      <button class="btn" onclick="goto('#/decide')">Skip to the decisions →</button></div>
  </div>`);
  $('#deck').onclick = e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    setAns(b.dataset.n, b.dataset.a);
  };
  KEYS = e => {
    const k = e.key.toLowerCase();
    if ('1234'.includes(k)) { e.preventDefault(); setAns(n.id, ({ 1:'y', 2:'p', 3:'n', 4:'h' })[k]); return; }
    if (k === 'arrowright') { e.preventDefault(); deckStep(1); }
    if (k === 'arrowleft') { e.preventDefault(); deckStep(-1); }
    if (k === 's') { e.preventDefault(); deckSection(1); }
  };
}
function setAns(id, a) {
  S.ans[id] = a; save();
  const n = NEEDS.find(x => x.id === id);
  let added = '';
  if (a === 'y' || a === 'p') { const { ids } = pickFor(n); if (ids.length) added = ids.map(p => p.n).join(' + '); }
  if (S.qmode === 'list') { refreshQ(id); return; }
  deckStep(1, added);
}
function deckStep(dir, added) {
  const gs = activeGroups();
  const gi = gs.findIndex(g => g.id === (location.hash.split('/')[2]));
  if (gi < 0) return;
  const g = gs[gi], qs = groupNeeds(g.id);
  const i = (S.pos[g.id] || 0) + dir;
  if (i >= qs.length) {
    if (gi + 1 < gs.length) { S.pos[g.id] = qs.length - 1; save(); return goto('#/q/' + gs[gi + 1].id); }
    S.pos[g.id] = qs.length - 1; save(); return goto('#/decide');
  }
  if (i < 0) {
    if (gi > 0) { const pg = gs[gi - 1]; S.pos[pg.id] = groupNeeds(pg.id).length - 1; save(); return goto('#/q/' + pg.id); }
    return;
  }
  S.pos[g.id] = i; save();
  viewDeck(gi, added);
}
function deckSection(dir) {
  const gs = activeGroups(), gi = gs.findIndex(g => g.id === (location.hash.split('/')[2]));
  if (gi < 0) return;
  if (gi + dir < 0) return;
  if (gi + dir >= gs.length) return goto('#/decide');
  goto('#/q/' + gs[gi + dir].id);
}

/* ---- list: the whole section at once ---------------------------------- */
function viewQList(gi) {
  const gs = activeGroups(), g = gs[gi], qs = groupNeeds(g.id);
  render(`
  <div class="ghead"><div class="ic">${svg(g.ic,22)}</div><div><h2>${esc(g.t)}</h2><p>${esc(g.s)}</p></div>
    <button class="btn ghost sm" onclick="setMode('deck')">Show as a deck</button></div>
  ${sectionSteps(gs, gi)}
  ${stackBar()}
  <div id="qs">${qs.map(qHTML).join('')}</div>
  <div class="nav">
    <button class="btn ghost" onclick="${gi ? `goto('#/q/${gs[gi - 1].id}')` : `goto('#/areas')`}">← Back</button>
    <div class="navr">
      <span class="hint">Section ${gi + 1} of ${gs.length} · unanswered counts as no</span>
      <button class="btn" onclick="${gi + 1 < gs.length ? `goto('#/q/${gs[gi + 1].id}')` : `goto('#/decide')`}">${
        gi + 1 < gs.length ? 'Next' : 'To the decisions'} →</button>
    </div>
  </div>`);
  $('#qs').onclick = e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    S.ans[b.dataset.n] = b.dataset.a; save(); refreshQ(b.dataset.n);
  };
}
function refreshQ(id) {
  const n = NEEDS.find(x => x.id === id), el = $('#q-' + id);
  if (el) el.outerHTML = qHTML(n);
  const sb = $('.stackbar'); if (sb) sb.outerHTML = stackBar();
  chrome();
}

/* ---------------------------------------------------------- the decisions
   Every "which one?" in one place, each already answered by your taste. */
function viewDecide() {
  const ds = decisions();
  render(`
  <div class="ghead"><div class="ic">${svg('sliders',22)}</div><div><h2>Three questions, then you are done</h2>
    <p>These decide the ${ds.length} follow-up${ds.length === 1 ? '' : 's'} below for you. Change one and every suggestion moves with it.</p></div></div>
  <div class="tgrid" id="taste">${TASTE.map(t => `
    <div class="pc"><h3>${esc(t.t)}</h3><p>${esc(t.h)}</p>
      <div class="opts col">${t.o.map(o => `
        <button class="opt wide${S.taste[t.id] === o[0] ? ' a' : ''}" data-t="${t.id}" data-v="${o[0]}">
          <b>${esc(o[1])}</b><small>${esc(o[2])}</small></button>`).join('')}</div></div>`).join('')}</div>
  ${ds.length ? `<div class="band"><h3>Your picks</h3><div class="ln"></div>
      <button class="btn tiny ghost" onclick="clearPicks()">Reset all to the suggestion</button></div>
    <div id="picks">${ds.map(pickRow).join('')}</div>`
    : `<div class="empty"><b>Nothing to decide yet</b>
        Answer a few questions with yes and the forks in the road show up here.</div>`}
  <div class="nav">
    <button class="btn ghost" onclick="backToQuestions()">← Back to the questions</button>
    <div class="navr"><span class="hint">Suggestions follow your taste — overrule any of them</span>
      <button class="btn" onclick="goto('#/results')">See the result →</button></div>
  </div>`);
  $('#taste').onclick = e => {
    const b = e.target.closest('[data-t]'); if (!b) return;
    S.taste[b.dataset.t] = b.dataset.v; save(); viewDecide();
  };
  const pk = $('#picks');
  if (pk) pk.onclick = e => {
    const b = e.target.closest('[data-n]'); if (!b) return;
    S.pick[b.dataset.n] = b.dataset.v === 'auto' ? null : +b.dataset.v;
    save();
    const row = $('#pick-' + b.dataset.n);
    if (row) row.outerHTML = pickRow(NEEDS.find(n => n.id === b.dataset.n));
  };
}
function pickRow(n) {
  const auto = autoPick(n), cur = S.pick[n.id];
  return `<div class="pickrow" id="pick-${n.id}">
    <div class="ph2"><b>${esc(n.aq || n.q)}</b>
      <small>${esc(n.q.replace(/\?$/, ''))} · ${n.fx ? 'this one is about what you want, so it is your call'
        : cur == null ? 'following your taste' : 'your choice'}</small></div>
    <div class="pgrid2">
      ${n.alts.map((a, i) => { const pr = arr(a.i).map(P).filter(Boolean)[0];
        const on = cur == null ? i === auto : cur === i;
        return `<button class="v${on ? ' a' : ''}${i === auto ? ' sug' : ''}" data-n="${n.id}" data-v="${i}">
          ${pr ? icon(pr) : '<span class="ph">?</span>'}
          <div><b>${esc(a.l)}</b><small>${esc(a.w || '')}</small></div>
          ${i === auto ? `<i class="sg">${n.fx ? 'our default' : 'suggested'}</i>` : ''}</button>`; }).join('')}
      ${cur != null ? `<button class="v auto" data-n="${n.id}" data-v="auto">
        <span class="ph">${svg('back',13)}</span><div><b>Back to the suggestion</b><small>Let my taste decide again</small></div></button>` : ''}
    </div></div>`;
}
function clearPicks() { S.pick = {}; save(); viewDecide(); }
function backToQuestions() { const gs = activeGroups(); goto(gs.length ? '#/q/' + gs[gs.length - 1].id : '#/areas'); }

/* ------------------------------------------------------------------ results */
function ownedSet() {
  const o = new Set(S.owned);
  NEEDS.forEach(n => {
    if (S.ans[n.id] === 'h') (n.alts || []).forEach(a => arr(a.i).forEach(x => {
      const p = P(x); if (p) o.add(p.id);
    }));
  });
  return o;
}
function pickFor(n) {
  const alts = n.alts || [];
  const idx = S.pick[n.id] != null ? S.pick[n.id] : autoPick(n);
  let chosen = alts[idx] || null;
  let ids = chosen ? arr(chosen.i).map(P).filter(Boolean) : [];
  if (!ids.length && alts.length) {
    const first = alts.map(a => ({ a, p: arr(a.i).map(P).filter(Boolean) })).filter(x => x.p.length)[0];
    if (first) { chosen = first.a; ids = first.p; }
  }
  if (!ids.length) { const q = pool(n.tag); if (q.length) ids = [q[0]]; }
  return { ids, chosen };
}
function buildResult() {
  const own = ownedSet(), core = [], also = [], seen = new Set();
  activeNeeds().filter(n => isYes(n.id)).forEach(n => {
    const { ids, chosen } = pickFor(n);
    let list = ids.filter(p => !own.has(p.id));
    if (!list.length) {
      const rest = (n.alts || []).flatMap(a => arr(a.i)).map(P).filter(Boolean)
        .filter(p => !own.has(p.id) && !seen.has(p.id));
      if (rest.length) list = [rest[0]];
      else { const q = pool(n.tag, new Set([...own, ...seen])); if (q.length) list = [q[0]]; }
    }
    list.forEach(p => {
      if (seen.has(p.id)) return;
      seen.add(p.id);
      const row = { p, need: n, why: (chosen && chosen.w ? chosen.w + ' — ' : '') + 'matches: ' + n.q.replace(/\?$/, '') };
      (S.ans[n.id] === 'p' ? core : also).push(row);
    });
  });
  const res = [...core, ...also];
  const ctx = {
    total: res.length,
    docker: S.prof.plat === 'docker',
    exposure: S.prof.exposure,
    dockerCount: res.filter(r => (r.p.p || []).join(' ').toLowerCase().includes('docker')).length,
    webCount: res.filter(r => !/^sysadmin-(backups|software-containers|virtualization)$/.test(r.p.c[0] || '')).length,
    has: id => isYes(id),
  };
  const musts = [];
  MUSTS.forEach(m => {
    const p = P(m.i); if (!p || seen.has(p.id) || own.has(p.id)) return;
    if (m.need && (S.ans[m.need] === 'h' || isYes(m.need))) return;
    if (!m.c(ctx)) return;
    seen.add(p.id);
    musts.push({ p, why: m.why, need: NEEDS.find(n => n.id === m.need) });
  });
  return { core, also, res, musts, own };
}
function altList(r, skip) {
  const out = [];
  if (r.need && r.need.alts) r.need.alts.forEach(a => {
    const p = arr(a.i).map(P).filter(Boolean)[0];
    if (p && !skip.has(p.id)) { skip.add(p.id); out.push({ p, w: a.w }); }
  });
  if (r.need && r.need.tag) pool(r.need.tag, skip).slice(0, 4).forEach(p => {
    skip.add(p.id); out.push({ p, w: (p.d || '').slice(0, 90) });
  });
  return out.slice(0, 6);
}
function card(r, i, kind) {
  const p = r.p;
  const dk = (p.p || []).some(x => /docker|k8s/i.test(x));
  const alts = r.need ? altList(r, new Set([p.id])) : [];
  const cat = CATS[p.c[0]];
  const inList = S.list.includes(p.id);
  const badge = kind === 'must' ? 'must-have' : kind === 'core' ? 'core' : '#' + i;
  return `<div class="card${kind === 'must' ? ' must' : ''}${kind === 'core' ? ' core' : ''}">
    <div class="ch" onclick="openApp('${p.id}')" style="cursor:pointer">
      ${icon(p)}
      <div class="t"><b>${esc(p.n)}</b><small>${esc(cat ? cat.name : '')}</small></div>
      <span class="rank">${badge}</span>
    </div>
    <p class="desc">${esc(p.d)}</p>
    ${r.why ? `<div class="why">${esc(r.why)}</div>` : ''}
    <div class="tags">
      ${p.st ? `<span class="tg st">${svg('star',11)} ${kfmt(p.st)}</span>` : ''}
      ${dk ? '<span class="tg dk">Docker</span>' : ''}
      ${p.lic && p.lic[0] ? `<span class="tg li">${esc(p.lic[0])}</span>` : ''}
      ${p.up ? `<span class="tg${p.h && p.h !== 'G' ? ' h-' + p.h : ''}">active ${esc(p.up.slice(0, 7))}</span>` : ''}
      ${p.alt && p.alt.length ? `<span class="tg alt">replaces ${esc(p.alt.slice(0, 2).join(', '))}</span>` : ''}
    </div>
    <div class="acts">
      <a class="btn sm ghost" href="${esc(p.u || p.s)}" target="_blank" rel="noopener">Website</a>
      ${p.s && p.s !== p.u ? `<a class="btn sm ghost" href="${esc(p.s)}" target="_blank" rel="noopener">Code</a>` : ''}
      ${alts.length ? `<button class="btn sm ghost" onclick="this.closest('.card').querySelector('.alts').classList.toggle('on')">Alternatives (${alts.length})</button>` : ''}
      ${cat ? `<button class="btn sm ghost" onclick="goto('#/c/${cat.id}')">${svg('down',13)} Dig deeper</button>` : ''}
      <button class="btn sm ${inList ? 'on' : 'ghost'}" onclick="toggleList('${p.id}')">${inList ? svg('check',13) + ' On my list' : svg('plus',13) + ' My list'}</button>
      ${kind === 'must' || r.need ? `<button class="btn sm ghost" onclick="markOwned('${p.id}')">Already got it</button>` : ''}
    </div>
    ${alts.length ? `<div class="alts">${alts.map(a =>
      `<div class="alt" onclick="openApp('${a.p.id}')">${icon(a.p)}
        <div><b>${esc(a.p.n)}</b> <span>${esc(a.w || '')}</span></div></div>`).join('')}</div>` : ''}
  </div>`;
}
function viewResults() {
  const { core, also, res, musts, own } = buildResult();
  const ownList = [...own].map(id => BY_ID[id]).filter(Boolean);
  const answered = activeNeeds().filter(n => S.ans[n.id]).length;
  if (!answered) {
    return render(`<div class="empty"><b>Nothing answered yet</b>
      Run through the questionnaire and your recommendations appear here.
      <div class="cta" style="margin-top:18px"><button class="btn" onclick="goto('#/setup')">Start →</button></div></div>`);
  }
  const fresh = APPS.length - NAMED.size;
  render(`
  <div class="hero" style="padding:44px 0 6px">
    <h1 style="font-size:clamp(26px,4vw,40px)">${res.length} projects for you${musts.length ? ` + ${musts.length} must-haves` : ''}</h1>
    <p class="lead" style="font-size:16px">Out of ${APPS.length.toLocaleString('en-US')} free projects, from ${answered} answers.
      ${core.length ? `${core.length} of them come from the questions you marked as the reason you are here.` : ''}</p>
    <div class="cta">
      <button class="btn sm" onclick="addAllToList()">Add everything to my list</button>
      <button class="btn sm ghost" onclick="copyMd()">Copy as Markdown</button>
      <button class="btn sm ghost" onclick="window.print()">Print / PDF</button>
      <button class="btn sm ghost" onclick="goto('#/decide')">Change the picks</button>
      <button class="btn sm ghost" onclick="goto('#/areas')">Change answers</button>
    </div>
  </div>
  ${core.length ? `<div class="band"><h3>${svg('bolt',14)} Your core stack</h3><div class="ln"></div><span class="cnt">${core.length}</span></div>
    <div class="grid">${core.map(r => card(r, 0, 'core')).join('')}</div>` : ''}
  ${also.length ? `<div class="band"><h3>${core.length ? 'Also a good fit' : 'Your recommendations'}</h3><div class="ln"></div><span class="cnt">${also.length}</span></div>
    <div class="grid">${also.map((r, i) => card(r, i + 1, '')).join('')}</div>` : ''}
  ${musts.length ? `<div class="band"><h3>Must-haves for this setup</h3><div class="ln"></div><span class="cnt">${musts.length}</span></div>
    <div class="grid">${musts.map(r => card(r, 0, 'must')).join('')}</div>` : ''}
  <div class="rabbit" style="margin-top:38px">
    <span class="em">${svg('layers',30)}</span>
    <div><b>Now the other ${fresh.toLocaleString('en-US')}</b>
      <p>The questions above can only name ${NAMED.size} projects. The rabbit hole deals cards from everything else —
        ${BURROWS.length} corners of the catalogue, and every yes takes you a level deeper instead of moving you on.</p></div>
    <button class="btn" onclick="goto('#/rabbit')">Go down →</button>
  </div>
  ${ownList.length ? `<div class="band"><h3>You already have</h3><div class="ln"></div><span class="cnt">${ownList.length}</span></div>
    <div class="chips">${ownList.map(p => `<span class="chip">${esc(p.n)}
      <i onclick="unown('${p.id}')" title="remove" style="cursor:pointer">${svg('close',11)}</i></span>`).join('')}</div>` : ''}`);
  S.seenResults = true; save();
}

/* ================================================================ RABBIT HOLE
   Cards drawn only from projects the questionnaire never names. Saying yes
   opens the burrow and unlocks its neighbours - you descend rather than
   scroll on. Saying no steers the deck away from that whole realm. */
function bPool(b, limit) {
  const own = ownedSet(), seen = new Set(), out = [];
  arr(b.c).forEach(cid => (BY_CAT[cid] || []).forEach(p => {
    if (p.x || seen.has(p.id) || own.has(p.id) || NAMED.has(p.id)) return;
    seen.add(p.id); out.push(p);
  }));
  out.sort((x, y) => score(y) - score(x));
  if (b.pin) b.pin.slice().reverse().forEach(nm => {
    const p = P(nm), i = out.indexOf(p);
    if (i > 0) { out.splice(i, 1); out.unshift(p); }
  });
  return limit ? out.slice(0, limit) : out;
}
function rhAffinity() {
  const w = {};
  REALMS.forEach(r => w[r.id] = 0);
  NEEDS.forEach(n => { if (isYes(n.id) && w[n.g] != null) w[n.g] += S.ans[n.id] === 'p' ? 2 : 1; });
  BURROWS.forEach(b => {
    const a = S.rh.ans[b.id];
    if (w[b.r] == null) return;
    if (a === 'y') w[b.r] += 3; else if (a === 'n') w[b.r] -= 1.5;
  });
  return w;
}
function rhUnlocked() {
  const u = new Set();
  BURROWS.forEach(b => { if (S.rh.ans[b.id] === 'y') (b.near || []).forEach(x => u.add(x)); });
  return u;
}
function rhQueue() {
  const w = rhAffinity(), u = rhUnlocked();
  return BURROWS
    .filter(b => !'ynh'.includes(S.rh.ans[b.id] || '_') && bPool(b, 1).length)
    .map(b => ({ b, s: (w[b.r] || 0) * 3 + (u.has(b.id) ? 14 : 0) + (b.deep ? -1 : 1)
      + (hash(b.id) % 7) - (S.rh.ans[b.id] === 's' ? 60 : 0) }))
    .sort((x, y) => y.s - x.s)
    .map(x => x.b);
}
function rhStats() {
  const opened = BURROWS.filter(b => S.rh.ans[b.id] === 'y').length;
  const fresh = APPS.length - NAMED.size;
  return { opened, total: BURROWS.length, seen: S.rh.seen.length, fresh };
}
function rhMark(list) {
  let changed = false;
  list.forEach(p => { if (!S.rh.seen.includes(p.id)) { S.rh.seen.push(p.id); changed = true; } });
  if (changed) save();
}
function rhAnswer(id, a, where) {
  S.rh.ans[id] = a;
  if (a === 'y') {
    if (S.rh.path[S.rh.path.length - 1] !== id) S.rh.path.push(id);
  } else if (where === 'deck') {
    S.rh.path = [];
  }
  S.rh.last = null;
  save(); viewRabbit();
}
function rhClimb(i) { S.rh.path = S.rh.path.slice(0, i + 1); save(); viewRabbit(); }
function rhSurface() { S.rh.path = []; S.rh.last = null; save(); viewRabbit(); }
function rhReopen(id) {
  S.rh.ans[id] = 'y'; S.rh.path = [id]; S.rh.last = null; save();
  goto('#/rabbit');                       // may be reached from a category page
}

function rhHead() {
  const st = rhStats(), pct = Math.round(st.opened / st.total * 100);
  return `<div class="ghead rh"><div class="ic">${svg('layers',22)}</div>
    <div><h2>The rabbit hole</h2>
      <p>${st.fresh.toLocaleString('en-US')} projects the questionnaire never mentions, in ${st.total} corners.
        ${st.opened ? `You have opened ${st.opened} corner${st.opened === 1 ? '' : 's'} and met ${st.seen} project${st.seen === 1 ? '' : 's'} down here.`
          : 'Nothing opened yet — say yes to a card and it takes you down instead of on.'}</p>
      <div class="cover"><i style="width:${Math.max(1.5, pct)}%"></i></div></div>
    <button class="btn ghost sm" onclick="surprise()">${svg('dice',13)} Surprise me</button></div>`;
}
function rhAnsRow(id, where) {
  return `<div class="opts ans">
    <button class="opt" onclick="rhAnswer('${id}','y','${where}')"><kbd>1</kbd>Show me${where === 'deck' ? ' — go deeper' : ''}</button>
    <button class="opt" onclick="rhAnswer('${id}','n','${where}')"><kbd>2</kbd>Not for me</button>
    <button class="opt" onclick="rhAnswer('${id}','h','${where}')"><kbd>3</kbd>Already got it</button>
  </div>`;
}
function rhTaste() {
  const w = rhAffinity();
  const top = REALMS.map(r => [r, w[r.id] || 0]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (!top.length) return '';
  return `<div class="lean">Leaning towards <b>${top.map(x => esc(x[0].name)).join('</b>, <b>')}</b> — the deck follows that.</div>`;
}
function rhBurrowCard(b) {
  const ps = bPool(b, 4), cat = CATS[arr(b.c)[0]];
  return `<div class="dcard rhcard">
    <span class="realm">${svg(b.r,12)} ${esc((REALMS.find(r => r.id === b.r) || {}).name || '')}${b.deep ? ' · the part nobody names' : ''}</span>
    <h3>${esc(b.q)}</h3>
    <p>${esc(b.h)}</p>
    <div class="dlogos">${ps.map(p =>
      `<span class="dl" onclick="openApp('${p.id}')" title="${esc(p.n)}">${icon(p)}<i>${esc(p.n)}</i></span>`).join('')}</div>
    ${rhAnsRow(b.id, 'deck')}
    <div class="dnote">${bPool(b).length} project${bPool(b).length === 1 ? '' : 's'} waiting in ${esc(cat ? cat.name : 'this corner')}${
      (b.near || []).length ? ` · opens ${b.near.length} more question${b.near.length === 1 ? '' : 's'}` : ''}</div>
  </div>`;
}
function rhNeighbour(id) {
  const b = BUR[id]; if (!b) return '';
  const a = S.rh.ans[id];
  const n = bPool(b, 3);
  if (!n.length) return '';
  return `<div class="nb${a ? ' done' : ''}">
    <div class="nbh"><b>${esc(b.q)}</b><small>${esc(b.h)}</small></div>
    <div class="nblogos">${n.map(p => icon(p, 'sm')).join('')}</div>
    ${a === 'y' ? `<button class="btn tiny ghost" onclick="rhReopen('${id}')">Open again</button>`
      : a ? `<span class="hint">${a === 'h' ? 'you have this' : 'skipped'}</span>`
      : `<div class="opts ans tiny">
          <button class="opt" onclick="rhAnswer('${id}','y','near')">Go deeper</button>
          <button class="opt" onclick="rhAnswer('${id}','n','near')">No</button>
          <button class="opt" onclick="rhAnswer('${id}','h','near')">Got it</button></div>`}
  </div>`;
}
function viewRabbit() {
  const path = S.rh.path.filter(id => BUR[id]);
  S.rh.path = path;
  if (S.rh.last) return viewSurprise();
  if (!path.length) {
    const q = rhQueue();
    if (!q.length) {
      return render(`${rhHead()}
        <div class="empty"><b>You have been through every corner</b>
          ${BURROWS.length} rabbit holes answered. What is left is the explore view and the search box.
          <div class="cta" style="margin-top:16px">
            <button class="btn" onclick="goto('#/explore')">Explore the categories</button>
            <button class="btn ghost" onclick="rhReset()">Clear the rabbit hole and start again</button></div></div>`);
    }
    const b = q[0];
    rhMark(bPool(b, 4));
    render(`${rhHead()}
      ${rhTaste()}
      <div class="deck">
        <div class="dcount">Card ${BURROWS.filter(x => S.rh.ans[x.id]).length + 1} · ${q.length} corners left
          <span class="dsec">say yes and you go down, not on</span></div>
        ${rhBurrowCard(b)}
        <div class="dnav">
          <button class="btn ghost sm" onclick="rhSkip()">Deal another card</button>
          <span class="hint">Keys 1–3 to answer</span>
          <button class="btn ghost sm" onclick="goto('#/explore')">Browse categories instead</button>
        </div>
      </div>`);
    KEYS = e => {
      const k = e.key;
      if ('123'.includes(k)) { e.preventDefault(); rhAnswer(b.id, ({ 1:'y', 2:'n', 3:'h' })[k], 'deck'); }
    };
    return;
  }

  /* --- you are down a hole --- */
  const b = BUR[path[path.length - 1]];
  const ps = bPool(b, 12);
  rhMark(ps);
  const near = (b.near || []).filter(id => BUR[id] && bPool(BUR[id], 1).length);
  const cats = arr(b.c).map(c => CATS[c]).filter(Boolean);
  render(`${rhHead()}
  <div class="crumbs deep">
    <a onclick="rhSurface()">Surface</a>
    ${path.map((id, i) => ` › ${i === path.length - 1
      ? `<b>${esc(BUR[id].q.replace(/\?$/, ''))}</b>`
      : `<a onclick="rhClimb(${i})">${esc(BUR[id].q.replace(/\?$/, ''))}</a>`}`).join('')}
    <span class="depth">${svg('layers',12)} ${path.length} level${path.length === 1 ? '' : 's'} down</span>
  </div>
  <div class="burrow">
    <h2>${esc(b.q)}</h2>
    <p class="lead" style="font-size:15.5px">${esc(b.h)}</p>
    <div class="chips">${cats.map(c => `<span class="chip" onclick="goto('#/c/${c.id}')">${esc(c.name)}<i>${c.n}</i></span>`).join('')}</div>
  </div>
  ${ps.length ? `<div class="band"><h3>Down here</h3><div class="ln"></div><span class="cnt">${bPool(b).length}</span></div>
    <div class="grid tight">${ps.map(miniCard).join('')}</div>` : ''}
  ${near.length ? `<div class="band"><h3>Where this leads</h3><div class="ln"></div><span class="cnt">${near.length}</span></div>
    <div class="nbs">${near.map(rhNeighbour).join('')}</div>` : ''}
  <div class="nav">
    <button class="btn ghost" onclick="${path.length > 1 ? `rhClimb(${path.length - 2})` : `rhSurface()`}">${svg('back',13)} ${path.length > 1 ? 'One level up' : 'Back to the surface'}</button>
    <div class="navr">
      ${bPool(b).length > 12 ? `<button class="btn ghost sm" onclick="goto('#/c/${arr(b.c)[0]}')">All ${bPool(b).length} in this category</button>` : ''}
      <button class="btn" onclick="rhSurface()">Deal a new card →</button></div>
  </div>`);
}
function rhSkip() {
  const q = rhQueue();
  if (q.length) { S.rh.ans[q[0].id] = 's'; save(); }   // s = shown and passed over, may come back later
  viewRabbit();
}
function rhReset() {
  if (!confirm('Forget every rabbit hole answer and start the descent again?')) return;
  S.rh = { ans:{}, path:[], seen:[], last:null }; save(); viewRabbit();
}
function surprise() {
  const own = ownedSet();
  const cand = APPS.filter(p => !p.x && !NAMED.has(p.id) && !own.has(p.id) && !S.list.includes(p.id)
    && p.d && p.c.length && (p.st || 0) > 40 && p.h !== 'R');
  if (!cand.length) return toast('Nothing left to surprise you with');
  S.rh.last = cand[Math.floor(Math.random() * cand.length)].id;
  save(); viewSurprise();
}
function viewSurprise() {
  const p = BY_ID[S.rh.last];
  if (!p) { S.rh.last = null; return viewRabbit(); }
  rhMark([p]);
  const cat = CATS[p.c[0]];
  const home = BURROWS.find(b => arr(b.c).includes(p.c[0]));
  const why = [];
  if (p.alt && p.alt.length) why.push(`It replaces ${esc(p.alt.slice(0, 3).join(', '))}.`);
  if (cat) why.push(`Nobody asked you about ${esc(cat.name)} — there are ${cat.n} projects in there.`);
  if ((p.st || 0) > 3000) why.push(`${kfmt(p.st)} people starred it and you had never heard of it.`);
  render(`${rhHead()}
  <div class="deck">
    <div class="dcount">A random one from the ${rhStats().fresh.toLocaleString('en-US')} you have not met</div>
    <div class="dcard rhcard surprise">
      <span class="realm">${svg('dice',12)} ${esc(cat ? cat.name : 'somewhere in the catalogue')}</span>
      <div class="sh">${icon(p)}<h3>${esc(p.n)}</h3></div>
      <p>${esc(p.d)}</p>
      <div class="tags">
        ${p.st ? `<span class="tg st">${svg('star',11)} ${kfmt(p.st)}</span>` : ''}
        ${p.lic && p.lic[0] ? `<span class="tg li">${esc(p.lic[0])}</span>` : ''}
        ${p.up ? `<span class="tg">active ${esc(p.up.slice(0, 7))}</span>` : ''}
      </div>
      <div class="why">${why.join(' ')}</div>
      <div class="acts">
        <button class="btn sm" onclick="toggleList('${p.id}')">${S.list.includes(p.id) ? svg('check',13) + ' On my list' : svg('plus',13) + ' Add to my list'}</button>
        <button class="btn sm ghost" onclick="openApp('${p.id}')">Details</button>
        <a class="btn sm ghost" href="${esc(p.u || p.s)}" target="_blank" rel="noopener">Website</a>
        ${home ? `<button class="btn sm ghost" onclick="rhReopen('${home.id}')">${svg('down',13)} Open that corner</button>` : ''}
      </div>
    </div>
    <div class="dnav">
      <button class="btn ghost sm" onclick="rhSurface()">${svg('back',13)} Back to the deck</button>
      <span class="hint">Press R for another one</span>
      <button class="btn ghost sm" onclick="surprise()">${svg('dice',13)} Another</button>
    </div>
  </div>`);
  KEYS = e => { if (e.key.toLowerCase() === 'r') { e.preventDefault(); surprise(); } };
}

/* ------------------------------------------------------------------ explore
   Unchanged: the full category tree stays exactly where it was. */
function viewExplore() {
  const byRealm = {};
  Object.values(CATS).forEach(c => (byRealm[c.realm] = byRealm[c.realm] || []).push(c));
  render(`
  <div class="ghead"><div class="ic">${svg('compass',22)}</div><div><h2>Explore everything</h2>
    <p>All ${APPS.length.toLocaleString('en-US')} free projects, grouped into ${Object.keys(CATS).length} categories.
      If you would rather be asked than browse, the <a onclick="goto('#/rabbit')">rabbit hole</a> deals the same
      catalogue out one question at a time.</p></div></div>
  <div class="toolbar">
    <input id="catfilter" placeholder="Filter categories… (try: genealogy, dns, comics)" style="flex:1;min-width:220px">
    <select id="sortcats">
      <option value="n">Most projects first</option>
      <option value="a">Alphabetical</option>
    </select>
  </div>
  <div id="realms" class="realms"></div>`);
  const draw = () => {
    const f = nrm($('#catfilter').value), sort = $('#sortcats').value;
    $('#realms').innerHTML = REALMS.map(r => {
      let cs = (byRealm[r.id] || []).filter(c => !f || nrm(c.name).includes(f));
      if (!cs.length) return '';
      cs = cs.sort((a, b) => sort === 'a' ? a.name.localeCompare(b.name) : b.n - a.n);
      const total = cs.reduce((s, c) => s + c.n, 0);
      return `<div class="realm">
        <h3>${esc(r.name)}</h3>
        <p>${cs.length} categories · ${total} projects</p>
        <div class="chips">${cs.slice(0, f ? 60 : 14).map(c =>
          `<span class="chip" onclick="goto('#/c/${c.id}')">${esc(c.name)}<i>${c.n}</i></span>`).join('')}
          ${!f && cs.length > 14 ? `<span class="chip" onclick="$('#catfilter').focus()">+${cs.length - 14} more…</span>` : ''}
        </div></div>`;
    }).join('') || `<div class="empty"><b>Nothing matches</b>Try a different word.</div>`;
  };
  $('#catfilter').oninput = draw; $('#sortcats').onchange = draw; draw();
}
function viewCategory(id) {
  const c = CATS[id];
  if (!c) return goto('#/explore');
  const realm = REALMS.find(r => r.id === c.realm) || { name: '' };
  const apps = (BY_CAT[id] || []).slice().sort((a, b) => score(b) - score(a));
  const siblings = Object.values(CATS).filter(x => x.realm === c.realm && x.id !== id)
    .sort((a, b) => b.n - a.n).slice(0, 12);
  const home = BURROWS.find(b => arr(b.c).includes(id));
  render(`
  <div class="crumbs"><a onclick="goto('#/explore')">Explore</a> › <a onclick="goto('#/explore')">${esc(realm.name)}</a> › <b>${esc(c.name)}</b></div>
  <div class="ghead"><div class="ic">${svg('folder',22)}</div><div><h2>${esc(c.name)}</h2>
    <p>${apps.length} free projects in this category, ranked by popularity and activity.</p></div>
    ${home ? `<button class="btn ghost sm" onclick="rhReopen('${home.id}')">${svg('layers',13)} Down the rabbit hole here</button>` : ''}</div>
  <div class="toolbar">
    <input id="inCat" placeholder="Filter in this category…" style="flex:1;min-width:200px">
    <select id="sortApps">
      <option value="rank">Best match first</option>
      <option value="stars">Most stars</option>
      <option value="fresh">Recently active</option>
      <option value="name">Alphabetical</option>
    </select>
    <label class="hint" style="display:flex;gap:6px;align-items:center">
      <input type="checkbox" id="onlyDocker"> Docker only</label>
  </div>
  <div id="catgrid" class="grid tight" style="margin-top:14px"></div>
  ${siblings.length ? `<div class="band"><h3>Neighbouring categories</h3><div class="ln"></div></div>
    <div class="chips">${siblings.map(s => `<span class="chip" onclick="goto('#/c/${s.id}')">${esc(s.name)}<i>${s.n}</i></span>`).join('')}</div>` : ''}`);
  const draw = () => {
    const f = nrm($('#inCat').value), sort = $('#sortApps').value, dk = $('#onlyDocker').checked;
    let list = apps.filter(p =>
      (!f || nrm(p.n + ' ' + p.d).includes(f)) &&
      (!dk || (p.p || []).some(x => /docker|k8s/i.test(x))));
    if (sort === 'stars') list = list.slice().sort((a, b) => b.st - a.st);
    if (sort === 'name') list = list.slice().sort((a, b) => a.n.localeCompare(b.n));
    if (sort === 'fresh') list = list.slice().sort((a, b) => (b.up || '').localeCompare(a.up || ''));
    $('#catgrid').innerHTML = list.length
      ? list.map(p => miniCard(p)).join('')
      : `<div class="empty"><b>Nothing left</b>Loosen the filter.</div>`;
  };
  $('#inCat').oninput = draw; $('#sortApps').onchange = draw; $('#onlyDocker').onchange = draw;
  draw();
}
function miniCard(p) {
  const inList = S.list.includes(p.id);
  const cat = CATS[p.c[0]];
  return `<div class="card">
    <div class="ch" onclick="openApp('${p.id}')" style="cursor:pointer">${icon(p)}
      <div class="t"><b>${esc(p.n)}</b><small>${esc(cat ? cat.name : '')}</small></div></div>
    <p class="desc">${esc((p.d || '').slice(0, 150))}</p>
    <div class="tags">
      ${p.st ? `<span class="tg st">${svg('star',11)} ${kfmt(p.st)}</span>` : ''}
      ${p.lic && p.lic[0] ? `<span class="tg li">${esc(p.lic[0])}</span>` : ''}
      ${p.up ? `<span class="tg${p.h && p.h !== 'G' ? ' h-' + p.h : ''}">${esc(p.up.slice(0, 7))}</span>` : ''}
    </div>
    <div class="acts">
      <a class="btn tiny ghost" href="${esc(p.u || p.s)}" target="_blank" rel="noopener">Website</a>
      <button class="btn tiny ghost" onclick="openApp('${p.id}')">Details</button>
      <button class="btn tiny ${inList ? 'on' : 'ghost'}" onclick="toggleList('${p.id}')">${inList ? svg('check',13) : svg('plus',13)} List</button>
    </div></div>`;
}

/* ------------------------------------------------------------------ search */
function viewSearch(q) {
  const res = search(q);
  render(`
  <div class="ghead"><div class="ic">${svg('search',22)}</div><div><h2>“${esc(q)}”</h2>
    <p>${res.length} match${res.length === 1 ? '' : 'es'} across name, description, category and “alternative to”.</p></div></div>
  ${res.length ? `<div class="grid tight" style="margin-top:16px">${res.slice(0, 90).map(miniCard).join('')}</div>`
    : `<div class="empty"><b>Nothing found</b>Try a shorter word, or browse the categories.
      <div class="cta" style="margin-top:16px"><button class="btn ghost" onclick="goto('#/explore')">Explore categories</button></div></div>`}`);
}
function search(q) {
  const t = nrm(q); if (!t) return [];
  const out = [];
  APPS.forEach(p => {
    const name = nrm(p.n), aka = (p.aka || []).map(nrm).join(' ');
    let s = 0;
    if (name === t) s = 1000;
    else if (name.startsWith(t)) s = 500;
    else if (name.includes(t)) s = 300;
    else if (aka.includes(t)) s = 250;
    else if ((p.alt || []).some(a => nrm(a).includes(t))) s = 200;
    else if (p.c.some(c => CATS[c] && nrm(CATS[c].name).includes(t))) s = 120;
    else if (nrm(p.d).includes(t)) s = 60;
    if (s) out.push([s + Math.log2((p.st || 0) + 2), p]);
  });
  return out.sort((a, b) => b[0] - a[0]).map(x => x[1]);
}

/* ------------------------------------------------------------------ my list */
function viewList() {
  const items = S.list.map(id => BY_ID[id]).filter(Boolean);
  if (!items.length) {
    return render(`<div class="empty"><b>Your list is empty</b>
      Add projects from the results or while you are down the rabbit hole — the list survives a reload and exports to Markdown or JSON.
      <div class="cta" style="margin-top:18px">
        <button class="btn" onclick="goto('#/results')">Go to results</button>
        <button class="btn ghost" onclick="goto('#/rabbit')">Rabbit hole</button></div></div>`);
  }
  const byRealm = {};
  items.forEach(p => {
    const c = CATS[p.c[0]], r = c ? c.realm : 'misc';
    (byRealm[r] = byRealm[r] || []).push(p);
  });
  render(`
  <div class="ghead"><div class="ic">${svg('list',22)}</div><div><h2>My list</h2>
    <p>${items.length} projects, grouped the way you would probably deploy them.</p></div></div>
  <div class="toolbar">
    <button class="btn sm ghost" onclick="copyList('md')">Copy as Markdown</button>
    <button class="btn sm ghost" onclick="copyList('json')">Copy as JSON</button>
    <button class="btn sm ghost" onclick="copyList('urls')">Copy repo URLs</button>
    <button class="btn sm ghost" onclick="window.print()">Print / PDF</button>
    <button class="btn sm ghost" onclick="clearList()">Clear list</button>
  </div>
  ${REALMS.filter(r => byRealm[r.id]).map(r => `
    <div class="band"><h3>${esc(r.name)}</h3><div class="ln"></div><span class="cnt">${byRealm[r.id].length}</span></div>
    <div class="grid tight">${byRealm[r.id].map(miniCard).join('')}</div>`).join('')}`);
}
function toggleList(id) {
  const i = S.list.indexOf(id);
  if (i < 0) { S.list.push(id); toast(`${esc(BY_ID[id].n)} added to your list`); }
  else { S.list.splice(i, 1); toast(`${esc(BY_ID[id].n)} removed`); }
  save(); route();
}
function addAllToList() {
  const { res, musts } = buildResult();
  [...res, ...musts].forEach(r => { if (!S.list.includes(r.p.id)) S.list.push(r.p.id); });
  save(); toast(`${S.list.length} projects on your list`); route();
}
function clearList() { if (confirm('Remove everything from your list?')) { S.list = []; save(); route(); } }
function markOwned(id) { if (!S.owned.includes(id)) S.owned.push(id); save(); toast(`${esc(BY_ID[id].n)} marked as already running`); route(); }
function unown(id) { S.owned = S.owned.filter(x => x !== id); save(); route(); }
function resetAll() {
  if (!confirm('Discard all answers, your list, the rabbit hole and everything marked as owned?')) return;
  localStorage.removeItem(KEY_STORE); localStorage.removeItem('shc2');
  location.hash = '#/'; location.reload();
}

/* ------------------------------------------------------------------ drawer */
function openApp(id) {
  const p = BY_ID[id]; if (!p) return;
  const cats = p.c.map(c => CATS[c]).filter(Boolean);
  const related = cats.length
    ? (BY_CAT[cats[0].id] || []).filter(x => x.id !== p.id).sort((a, b) => score(b) - score(a)).slice(0, 6) : [];
  const inList = S.list.includes(p.id);
  $('#drawer').innerHTML = `
    <button class="x" onclick="closeDrawer()" aria-label="Close">${svg('close',15)}</button>
    <div class="dh">${icon(p)}<div><h2>${esc(p.n)}</h2>
      <small>${esc(cats.map(c => c.name).join(' · '))}</small></div></div>
    <div class="sec"><p>${esc(p.d)}</p></div>
    ${p.alt && p.alt.length ? `<div class="sec"><h4>Self-hosted alternative to</h4>
      <div class="chips">${p.alt.map(a => `<span class="chip">${esc(a)}</span>`).join('')}</div></div>` : ''}
    <div class="sec"><h4>Facts</h4><div class="kv">
      ${p.st ? `<b>Stars</b><span>${p.st.toLocaleString('en-US')}</span>` : ''}
      ${p.lic && p.lic.length ? `<b>Licence</b><span>${esc(p.lic.join(', '))}</span>` : ''}
      ${p.p && p.p.length ? `<b>Runs on</b><span>${esc(p.p.join(', '))}</span>` : ''}
      ${p.up ? `<b>Last activity</b><span>${esc(p.up)}${p.h === 'R' ? ' (looks stale)' : p.h === 'Y' ? ' (quiet lately)' : ''}</span>` : ''}
      ${p.aka && p.aka.length ? `<b>Also known as</b><span>${esc(p.aka.join(', '))}</span>` : ''}
      <b>Listed in</b><span>${esc((p.src || []).join(', '))}</span>
    </div></div>
    <div class="sec"><div class="chips">
      <a class="btn sm" href="${esc(p.u || p.s)}" target="_blank" rel="noopener">Website</a>
      ${p.s ? `<a class="btn sm ghost" href="${esc(p.s)}" target="_blank" rel="noopener">Source code</a>` : ''}
      ${p.demo ? `<a class="btn sm ghost" href="${esc(p.demo)}" target="_blank" rel="noopener">Live demo</a>` : ''}
      <button class="btn sm ${inList ? 'on' : 'ghost'}" onclick="toggleList('${p.id}');openApp('${p.id}')">${inList ? svg('check',14) + ' On my list' : svg('plus',14) + ' Add to my list'}</button>
    </div></div>
    ${cats.length ? `<div class="sec"><h4>Categories</h4><div class="chips">${cats.map(c =>
      `<span class="chip" onclick="closeDrawer();goto('#/c/${c.id}')">${esc(c.name)}<i>${c.n}</i></span>`).join('')}</div></div>` : ''}
    ${related.length ? `<div class="sec"><h4>Similar projects</h4>
      ${related.map(r => `<div class="alt" onclick="openApp('${r.id}')">${icon(r)}
        <div><b>${esc(r.n)}</b> <span>${kfmt(r.st)} stars · ${esc((r.d || '').slice(0, 70))}</span></div></div>`).join('')}</div>` : ''}`;
  $('#drawer').classList.add('on'); $('#scrim').classList.add('on');
}
function closeDrawer() { $('#drawer').classList.remove('on'); $('#scrim').classList.remove('on'); }

/* ------------------------------------------------------------------ export */
function toast(m) {
  const t = $('#toast'); t.innerHTML = m; t.classList.add('on');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 2200);
}
function clip(text, msg) {
  navigator.clipboard.writeText(text).then(() => toast(msg), () => toast('Clipboard blocked by the browser'));
}
function copyMd() {
  const { core, also, musts } = buildResult();
  let m = '# My self-hosting shortlist\n';
  if (core.length) {
    m += '\n## Core stack\n';
    core.forEach((r, i) => m += `${i + 1}. **${r.p.n}** — ${r.p.d} <${r.p.u || r.p.s}> (${r.p.st} stars)\n`);
  }
  if (also.length) {
    m += '\n## Also a good fit\n';
    also.forEach((r, i) => m += `${i + 1}. **${r.p.n}** — ${r.p.d} <${r.p.u || r.p.s}> (${r.p.st} stars)\n`);
  }
  if (musts.length) {
    m += '\n## Must-haves\n';
    musts.forEach(r => m += `- **${r.p.n}** — ${r.why} <${r.p.u || r.p.s}>\n`);
  }
  m += `\n_Generated with Selfhosted Compass._\n`;
  clip(m, 'Recommendations copied as Markdown');
}
function copyList(fmt) {
  const items = S.list.map(id => BY_ID[id]).filter(Boolean);
  if (fmt === 'json') return clip(JSON.stringify(items.map(p =>
    ({ name: p.n, description: p.d, website: p.u, source: p.s, stars: p.st, licence: p.lic })), null, 2), 'List copied as JSON');
  if (fmt === 'urls') return clip(items.map(p => p.s || p.u).join('\n'), 'Repository URLs copied');
  clip('# My self-hosted list\n\n' + items.map(p =>
    `- **${p.n}** — ${p.d} <${p.u || p.s}>`).join('\n') + '\n', 'List copied as Markdown');
}

/* ------------------------------------------------------------------ boot */
function index(db) {
  DB = db; APPS = db.apps; REALMS = db.realms;
  CATS = {}; db.categories.forEach(c => CATS[c.id] = c);
  BY_ID = {}; BY_NAME = {}; BY_CAT = {};
  APPS.forEach(p => {
    BY_ID[p.id] = p;
    [p.n, ...(p.aka || [])].forEach(n => { const k = nrm(n); if (!BY_NAME[k]) BY_NAME[k] = p; });
    p.c.forEach(c => (BY_CAT[c] = BY_CAT[c] || []).push(p));
  });
  BUR = {}; BURROWS.forEach(b => BUR[b.id] = b);
  // everything the questionnaire can put in front of you - the rabbit hole starts after this
  NAMED = new Set();
  NEEDS.forEach(n => (n.alts || []).forEach(a => arr(a.i).forEach(x => { const p = P(x); if (p) NAMED.add(p.id); })));
  MUSTS.forEach(m => { const p = P(m.i); if (p) NAMED.add(p.id); });

  // sanity check in the console - keeps both catalogues honest
  const missing = [], empty = [];
  NEEDS.forEach(n => {
    (n.alts || []).forEach(a => arr(a.i).forEach(x => { if (!P(x)) missing.push(x); }));
    if (n.tag && !CATS[catId(n.tag)]) missing.push('category: ' + n.tag);
  });
  MUSTS.forEach(m => { if (!P(m.i)) missing.push(m.i); });
  BURROWS.forEach(b => {
    arr(b.c).forEach(c => { if (!CATS[c]) missing.push('burrow category: ' + c); });
    (b.near || []).forEach(x => { if (!BUR[x]) missing.push('burrow neighbour: ' + x); });
    (b.pin || []).forEach(x => { if (!P(x)) missing.push('burrow pin: ' + x); });
    if (!bPool(b, 1).length) empty.push(b.id);
  });
  if (missing.length) console.warn('[compass] unresolved references:', [...new Set(missing)]);
  if (empty.length) console.warn('[compass] burrows with no fresh projects left:', empty);
}
function boot(db) {
  index(db);
  const saved = load();
  if (saved) S = Object.assign(S, saved, {
    prof: Object.assign({}, S.prof, saved.prof || {}),
    taste: Object.assign({}, S.taste, saved.taste || {}),
    rh: Object.assign({ ans:{}, path:[], seen:[], last:null }, saved.rh || {}),
    pos: saved.pos || {},
  });
  addEventListener('hashchange', route);
  const qi = $('#q');
  let deb;
  qi.oninput = () => {
    clearTimeout(deb);
    deb = setTimeout(() => {
      const v = qi.value.trim();
      if (v.length >= 2) goto('#/search/' + encodeURIComponent(v));
      else if (location.hash.startsWith('#/search')) goto('#/explore');
    }, 220);
  };
  addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeDrawer(); if (document.activeElement === qi) qi.blur(); }
    if (e.key === '/' && document.activeElement !== qi) { e.preventDefault(); qi.focus(); }
    const tag = (document.activeElement || {}).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (KEYS) KEYS(e);
  });
  route();
}
(function start() {
  if (window.__DATA__) return boot(window.__DATA__);         // single file build
  fetch('data/apps.json')
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(boot)
    .catch(err => {
      $('#app').innerHTML = `<div class="empty"><b>Could not load data/apps.json</b>
        ${location.protocol === 'file:'
          ? 'Opening index.html straight from disk blocks the fetch. Run <code>python -m http.server</code> in this folder, or use the single file build in <code>dist/</code>.'
          : esc(String(err))}</div>`;
    });
})();
