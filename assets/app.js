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

let DB = null, APPS = [], CATS = {}, REALMS = [], BY_ID = {}, BY_NAME = {}, BY_CAT = {};

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

let S = { prof:{}, ans:{}, pick:{}, owned:[], list:[], seenResults:false };
PROFILE.forEach(p => S.prof[p.id] = p.d);

const save = () => { try { localStorage.setItem('shc2', JSON.stringify(S)); } catch (e) {} };
const load = () => { try { return JSON.parse(localStorage.getItem('shc2')); } catch (e) { return null; } };

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

/* ------------------------------------------------------------------ routing */
const ROUTES = () => ['#/', '#/setup', ...GROUPS.map(g => '#/q/' + g.id), '#/results'];
function route() {
  const h = location.hash || '#/';
  const [, sec, arg] = h.split('/');
  closeDrawer();
  if (h.startsWith('#/q/')) return viewQuestions(arg);
  if (h.startsWith('#/c/')) return viewCategory(arg);
  if (h.startsWith('#/search')) return viewSearch(decodeURIComponent(arg || ''));
  switch ('#/' + (sec || '')) {
    case '#/setup': return viewSetup();
    case '#/results': return viewResults();
    case '#/explore': return viewExplore();
    case '#/list': return viewList();
    default: return viewIntro();
  }
}
function goto(h) { location.hash = h; }
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
  const answered = NEEDS.filter(n => S.ans[n.id]).length;
  const h = location.hash || '#/';
  const tabs = [
    ['#/', 'Start', 0],
    ['#/q/' + GROUPS[0].id, 'Questionnaire', 0],
    ['#/results', 'Results', 0],
    ['#/explore', 'Explore', 0],
    ['#/list', 'My list', S.list.length],
  ];
  $('#tabs').innerHTML = tabs.map(([href, label, n]) => {
    const on = href === '#/' ? h === '#/'
      : href.startsWith('#/q/') ? h.startsWith('#/q/') || h === '#/setup'
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
  render(`
  <section class="hero">
    <h1>Find <span>your</span> self-hosted stack.</h1>
    <p class="lead">Instead of reading through ${APPS.length.toLocaleString('en-US')} projects: answer a few questions about
      what you actually want to run. You get around 20 matching projects, the must-haves that hold a stack together,
      and a rabbit hole to climb down whenever something looks interesting.</p>
    <div class="cta">
      <button class="btn" onclick="goto('#/setup')">${saved ? 'Continue' : 'Start the questionnaire'} →</button>
      <button class="btn ghost" onclick="goto('#/explore')">Just let me browse</button>
      ${saved ? `<button class="btn ghost" onclick="resetAll()">Start over</button>` : ''}
    </div>
    <div class="stats">
      <div class="stat"><b>${APPS.length.toLocaleString('en-US')}</b><span>free projects</span></div>
      <div class="stat"><b>${NEEDS.length}</b><span>questions</span></div>
      <div class="stat"><b>${Object.keys(CATS).length}</b><span>categories</span></div>
      <div class="stat"><b>${DB.counts.withIcon.toLocaleString('en-US')}</b><span>official logos</span></div>
    </div>
    <div class="howto">
      <div class="s"><i>1</i><b>Say what you want to do</b><p>Every question is yes / no / “already got it”. Skipping counts as no.</p></div>
      <div class="s"><i>2</i><b>Pick a flavour</b><p>Where several good options exist you get a follow-up question with the trade-offs spelled out.</p></div>
      <div class="s"><i>3</i><b>Get a stack, not a list</b><p>Results include the glue: reverse proxy, backups, monitoring, updates.</p></div>
      <div class="s"><i>4</i><b>Fall down the rabbit hole</b><p>Every result links into its category so you can browse all ${APPS.length.toLocaleString('en-US')} projects.</p></div>
    </div>
  </section>`);
}

/* ------------------------------------------------------------------ setup */
function viewSetup() {
  render(`
  <div class="ghead"><div class="ic">⚙️</div><div><h2>Your setup</h2>
    <p>So the recommendations match your hardware and your patience. Defaults are already sensible.</p></div></div>
  <div class="pgrid">${PROFILE.map(q => `
    <div class="pc"><h3>${q.t}</h3><p>${q.h}</p><div class="opts">${
      q.o.map(o => `<button class="opt${S.prof[q.id] === o[0] ? ' a' : ''}" data-p="${q.id}" data-v="${o[0]}">${o[1]}</button>`).join('')
    }</div></div>`).join('')}</div>
  <div class="nav">
    <button class="btn ghost" onclick="goto('#/')">← Back</button>
    <div class="navr"><span class="hint">${NEEDS.length} questions in ${GROUPS.length} sections — about 4 minutes.</span>
      <button class="btn" onclick="nextRoute(1)">Start →</button></div>
  </div>`);
  $('.pgrid').onclick = e => {
    const b = e.target.closest('[data-p]'); if (!b) return;
    S.prof[b.dataset.p] = b.dataset.v; save();
    $$(`[data-p="${b.dataset.p}"]`).forEach(x => x.classList.toggle('a', x === b));
  };
}

/* ------------------------------------------------------------------ questions */
function qHTML(n) {
  const a = S.ans[n.id] || '';
  const st = a === 'y' ? 'yes' : a === 'h' ? 'have' : a === 'n' ? 'no' : '';
  const alts = n.alts || [];
  return `<div class="q ${st}" id="q-${n.id}">
    <div class="qh">
      <div class="qt"><b>${esc(n.q)}</b><small>${esc(n.h || '')}</small></div>
      <div class="opts">
        <button class="opt${a === 'y' ? ' a' : ''}" data-n="${n.id}" data-a="y">Yes</button>
        <button class="opt${a === 'n' ? ' a n' : ''}" data-n="${n.id}" data-a="n">No</button>
        <button class="opt${a === 'h' ? ' a h' : ''}" data-n="${n.id}" data-a="h">Already got it</button>
      </div>
    </div>
    ${alts.length > 1 ? `<div class="vars${a === 'y' ? ' has' : ''}">
      <div class="vq">${esc(n.aq || 'Which one fits better?')}</div>
      <div class="vgrid">
        ${alts.map((v, i) => { const pr = P(arr(v.i)[0]);
          return `<button class="v${S.pick[n.id] === i ? ' a' : ''}" data-n="${n.id}" data-v="${i}">
            ${pr ? icon(pr) : '<span class="ph">?</span>'}
            <div><b>${esc(v.l)}</b><small>${esc(v.w || '')}</small></div></button>`; }).join('')}
        <button class="v${S.pick[n.id] == null ? ' a' : ''}" data-n="${n.id}" data-v="auto">
          <span class="ph">?</span><div><b>No preference</b><small>Give me the default pick</small></div></button>
      </div></div>` : ''}
  </div>`;
}
function viewQuestions(gid) {
  const gi = GROUPS.findIndex(g => g.id === gid);
  if (gi < 0) return goto('#/q/' + GROUPS[0].id);
  const g = GROUPS[gi], qs = NEEDS.filter(n => n.g === g.id);
  render(`
  <div class="ghead"><div class="ic">${g.ic}</div><div><h2>${g.t}</h2><p>${g.s}</p></div></div>
  <div class="steps">${GROUPS.map((x, i) =>
    `<div class="step ${i === gi ? 'cur' : i < gi ? 'done' : ''}" title="${esc(x.t)}"
      onclick="goto('#/q/${x.id}')"></div>`).join('')}</div>
  <div id="qs">${qs.map(qHTML).join('')}</div>
  <div class="nav">
    <button class="btn ghost" onclick="nextRoute(-1)">← Back</button>
    <div class="navr">
      <span class="hint">Section ${gi + 1} of ${GROUPS.length} · unanswered counts as no</span>
      <button class="btn" onclick="nextRoute(1)">${gi === GROUPS.length - 1 ? 'See results' : 'Next'} →</button>
    </div>
  </div>`);
  $('#qs').onclick = e => {
    const b = e.target.closest('[data-a]'), v = e.target.closest('button.v');
    if (b) { S.ans[b.dataset.n] = b.dataset.a; save(); refreshQ(b.dataset.n); return; }
    if (v) {
      const n = v.dataset.n;
      S.pick[n] = v.dataset.v === 'auto' ? null : +v.dataset.v;
      if (S.ans[n] !== 'y') S.ans[n] = 'y';
      save(); refreshQ(n);
    }
  };
}
function refreshQ(id) {
  const n = NEEDS.find(x => x.id === id), el = $('#q-' + id);
  if (el) el.outerHTML = qHTML(n);
  chrome();
}

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
  let chosen = (S.pick[n.id] != null && alts[S.pick[n.id]]) ? alts[S.pick[n.id]] : null;
  let ids = chosen ? arr(chosen.i).map(P).filter(Boolean) : [];
  if (!ids.length && alts.length) {
    const first = alts.map(a => ({ a, p: arr(a.i).map(P).filter(Boolean) })).filter(x => x.p.length)[0];
    if (first) { chosen = first.a; ids = first.p; }
  }
  if (!ids.length) { const q = pool(n.tag); if (q.length) ids = [q[0]]; }
  return { ids, chosen };
}
function buildResult() {
  const own = ownedSet(), res = [], seen = new Set();
  NEEDS.filter(n => S.ans[n.id] === 'y').forEach(n => {
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
      res.push({ p, need: n, why: (chosen && chosen.w ? chosen.w + ' — ' : '') + 'matches: ' + n.q.replace(/\?$/, '') });
    });
  });
  const ctx = {
    total: res.length,
    docker: S.prof.plat === 'docker',
    exposure: S.prof.exposure,
    dockerCount: res.filter(r => (r.p.p || []).join(' ').toLowerCase().includes('docker')).length,
    webCount: res.filter(r => !/^sysadmin-(backups|software-containers|virtualization)$/.test(r.p.c[0] || '')).length,
    has: id => S.ans[id] === 'y',
  };
  const musts = [];
  MUSTS.forEach(m => {
    const p = P(m.i); if (!p || seen.has(p.id) || own.has(p.id)) return;
    if (m.need && (S.ans[m.need] === 'h' || S.ans[m.need] === 'y')) return;
    if (!m.c(ctx)) return;
    seen.add(p.id);
    musts.push({ p, why: m.why, need: NEEDS.find(n => n.id === m.need) });
  });
  return { res, musts, own };
}
function altList(r, skip) {
  const out = [];
  if (r.need && r.need.alts) r.need.alts.forEach(a => {
    const p = P(arr(a.i)[0]);
    if (p && !skip.has(p.id)) { skip.add(p.id); out.push({ p, w: a.w }); }
  });
  if (r.need && r.need.tag) pool(r.need.tag, skip).slice(0, 4).forEach(p => {
    skip.add(p.id); out.push({ p, w: (p.d || '').slice(0, 90) });
  });
  return out.slice(0, 6);
}
function card(r, i, must) {
  const p = r.p;
  const dk = (p.p || []).some(x => /docker|k8s/i.test(x));
  const alts = r.need ? altList(r, new Set([p.id])) : [];
  const cat = CATS[p.c[0]];
  const inList = S.list.includes(p.id);
  return `<div class="card${must ? ' must' : ''}">
    <div class="ch" onclick="openApp('${p.id}')" style="cursor:pointer">
      ${icon(p)}
      <div class="t"><b>${esc(p.n)}</b><small>${esc(cat ? cat.name : '')}</small></div>
      <span class="rank">${must ? 'must-have' : '#' + i}</span>
    </div>
    <p class="desc">${esc(p.d)}</p>
    ${r.why ? `<div class="why">${esc(r.why)}</div>` : ''}
    <div class="tags">
      ${p.st ? `<span class="tg st">★ ${kfmt(p.st)}</span>` : ''}
      ${dk ? '<span class="tg dk">Docker</span>' : ''}
      ${p.lic && p.lic[0] ? `<span class="tg li">${esc(p.lic[0])}</span>` : ''}
      ${p.up ? `<span class="tg${p.h && p.h !== 'G' ? ' h-' + p.h : ''}">active ${esc(p.up.slice(0, 7))}</span>` : ''}
      ${p.alt && p.alt.length ? `<span class="tg alt">replaces ${esc(p.alt.slice(0, 2).join(', '))}</span>` : ''}
    </div>
    <div class="acts">
      <a class="btn sm ghost" href="${esc(p.u || p.s)}" target="_blank" rel="noopener">Website</a>
      ${p.s && p.s !== p.u ? `<a class="btn sm ghost" href="${esc(p.s)}" target="_blank" rel="noopener">Code</a>` : ''}
      ${alts.length ? `<button class="btn sm ghost" onclick="this.closest('.card').querySelector('.alts').classList.toggle('on')">Alternatives (${alts.length})</button>` : ''}
      ${cat ? `<button class="btn sm ghost" onclick="goto('#/c/${cat.id}')">Dig deeper ↓</button>` : ''}
      <button class="btn sm ${inList ? 'on' : 'ghost'}" onclick="toggleList('${p.id}')">${inList ? '✓ On my list' : '+ My list'}</button>
      ${must || r.need ? `<button class="btn sm ghost" onclick="markOwned('${p.id}')">Already got it</button>` : ''}
    </div>
    ${alts.length ? `<div class="alts">${alts.map(a =>
      `<div class="alt" onclick="openApp('${a.p.id}')">${icon(a.p)}
        <div><b>${esc(a.p.n)}</b> <span>${esc(a.w || '')}</span></div></div>`).join('')}</div>` : ''}
  </div>`;
}
function viewResults() {
  const { res, musts, own } = buildResult();
  const ownList = [...own].map(id => BY_ID[id]).filter(Boolean);
  const answered = NEEDS.filter(n => S.ans[n.id]).length;
  if (!answered) {
    return render(`<div class="empty"><b>Nothing answered yet</b>
      Run through the questionnaire and your recommendations appear here.
      <div class="cta" style="margin-top:18px"><button class="btn" onclick="goto('#/setup')">Start →</button></div></div>`);
  }
  render(`
  <div class="hero" style="padding:44px 0 6px">
    <h1 style="font-size:clamp(26px,4vw,40px)">${res.length} projects for you${musts.length ? ` + ${musts.length} must-haves` : ''}</h1>
    <p class="lead" style="font-size:16px">Picked out of ${APPS.length.toLocaleString('en-US')} free projects
      from ${answered} answered questions. Every card carries alternatives from the same category.</p>
    <div class="cta">
      <button class="btn sm" onclick="addAllToList()">Add everything to my list</button>
      <button class="btn sm ghost" onclick="copyMd()">Copy as Markdown</button>
      <button class="btn sm ghost" onclick="window.print()">Print / PDF</button>
      <button class="btn sm ghost" onclick="goto('#/q/${GROUPS[0].id}')">Change answers</button>
    </div>
  </div>
  ${res.length ? `<div class="band"><h3>Your recommendations</h3><div class="ln"></div><span class="cnt">${res.length}</span></div>
    <div class="grid">${res.map((r, i) => card(r, i + 1, false)).join('')}</div>` : ''}
  ${musts.length ? `<div class="band"><h3>Must-haves for this setup</h3><div class="ln"></div><span class="cnt">${musts.length}</span></div>
    <div class="grid">${musts.map(r => card(r, 0, true)).join('')}</div>` : ''}
  <div class="rabbit" style="margin-top:38px">
    <span class="em">🕳️</span>
    <div><b>Down the rabbit hole</b>
      <p>The questions only scratch the surface. ${Object.keys(CATS).length} categories are waiting —
        genealogy, library systems, XMPP servers, energy monitoring, offline Wikipedia.</p></div>
    <button class="btn" onclick="goto('#/explore')">Explore everything →</button>
  </div>
  ${ownList.length ? `<div class="band"><h3>You already have</h3><div class="ln"></div><span class="cnt">${ownList.length}</span></div>
    <div class="chips">${ownList.map(p => `<span class="chip">${esc(p.n)}
      <i onclick="unown('${p.id}')" title="remove" style="cursor:pointer">✕</i></span>`).join('')}</div>` : ''}`);
  S.seenResults = true; save();
}

/* ------------------------------------------------------------------ explore */
function viewExplore() {
  const byRealm = {};
  Object.values(CATS).forEach(c => (byRealm[c.realm] = byRealm[c.realm] || []).push(c));
  render(`
  <div class="ghead"><div class="ic">🕳️</div><div><h2>Explore everything</h2>
    <p>All ${APPS.length.toLocaleString('en-US')} free projects, grouped into ${Object.keys(CATS).length} categories.
      Pick a corner and climb down.</p></div></div>
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
  render(`
  <div class="crumbs"><a onclick="goto('#/explore')">Explore</a> › <a onclick="goto('#/explore')">${esc(realm.name)}</a> › <b>${esc(c.name)}</b></div>
  <div class="ghead"><div class="ic">📂</div><div><h2>${esc(c.name)}</h2>
    <p>${apps.length} free projects in this category, ranked by popularity and activity.</p></div></div>
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
      ${p.st ? `<span class="tg st">★ ${kfmt(p.st)}</span>` : ''}
      ${p.lic && p.lic[0] ? `<span class="tg li">${esc(p.lic[0])}</span>` : ''}
      ${p.up ? `<span class="tg${p.h && p.h !== 'G' ? ' h-' + p.h : ''}">${esc(p.up.slice(0, 7))}</span>` : ''}
    </div>
    <div class="acts">
      <a class="btn tiny ghost" href="${esc(p.u || p.s)}" target="_blank" rel="noopener">Website</a>
      <button class="btn tiny ghost" onclick="openApp('${p.id}')">Details</button>
      <button class="btn tiny ${inList ? 'on' : 'ghost'}" onclick="toggleList('${p.id}')">${inList ? '✓' : '+'} List</button>
    </div></div>`;
}

/* ------------------------------------------------------------------ search */
function viewSearch(q) {
  const res = search(q);
  render(`
  <div class="ghead"><div class="ic">🔎</div><div><h2>“${esc(q)}”</h2>
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
      Add projects from the results or while exploring — the list survives a reload and exports to Markdown or JSON.
      <div class="cta" style="margin-top:18px">
        <button class="btn" onclick="goto('#/results')">Go to results</button>
        <button class="btn ghost" onclick="goto('#/explore')">Explore</button></div></div>`);
  }
  const byRealm = {};
  items.forEach(p => {
    const c = CATS[p.c[0]], r = c ? c.realm : 'misc';
    (byRealm[r] = byRealm[r] || []).push(p);
  });
  render(`
  <div class="ghead"><div class="ic">📋</div><div><h2>My list</h2>
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
  if (!confirm('Discard all answers, your list and everything marked as owned?')) return;
  localStorage.removeItem('shc2'); location.hash = '#/'; location.reload();
}

/* ------------------------------------------------------------------ drawer */
function openApp(id) {
  const p = BY_ID[id]; if (!p) return;
  const cats = p.c.map(c => CATS[c]).filter(Boolean);
  const related = cats.length
    ? (BY_CAT[cats[0].id] || []).filter(x => x.id !== p.id).sort((a, b) => score(b) - score(a)).slice(0, 6) : [];
  const inList = S.list.includes(p.id);
  $('#drawer').innerHTML = `
    <button class="x" onclick="closeDrawer()">✕</button>
    <div class="dh">${icon(p)}<div><h2>${esc(p.n)}</h2>
      <small>${esc(cats.map(c => c.name).join(' · '))}</small></div></div>
    <div class="sec"><p>${esc(p.d)}</p></div>
    ${p.alt && p.alt.length ? `<div class="sec"><h4>Self-hosted alternative to</h4>
      <div class="chips">${p.alt.map(a => `<span class="chip">${esc(a)}</span>`).join('')}</div></div>` : ''}
    <div class="sec"><h4>Facts</h4><div class="kv">
      ${p.st ? `<b>Stars</b><span>★ ${p.st.toLocaleString('en-US')}</span>` : ''}
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
      <button class="btn sm ${inList ? 'on' : 'ghost'}" onclick="toggleList('${p.id}');openApp('${p.id}')">${inList ? '✓ On my list' : '+ Add to my list'}</button>
    </div></div>
    ${cats.length ? `<div class="sec"><h4>Categories</h4><div class="chips">${cats.map(c =>
      `<span class="chip" onclick="closeDrawer();goto('#/c/${c.id}')">${esc(c.name)}<i>${c.n}</i></span>`).join('')}</div></div>` : ''}
    ${related.length ? `<div class="sec"><h4>Similar projects</h4>
      ${related.map(r => `<div class="alt" onclick="openApp('${r.id}')">${icon(r)}
        <div><b>${esc(r.n)}</b> <span>★ ${kfmt(r.st)} · ${esc((r.d || '').slice(0, 70))}</span></div></div>`).join('')}</div>` : ''}`;
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
  const { res, musts } = buildResult();
  let m = '# My self-hosting shortlist\n\n## Recommendations\n';
  res.forEach((r, i) => m += `${i + 1}. **${r.p.n}** — ${r.p.d} <${r.p.u || r.p.s}> (★${r.p.st})\n`);
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
  // sanity check in the console - keeps the question catalogue honest
  const missing = [];
  NEEDS.forEach(n => {
    (n.alts || []).forEach(a => arr(a.i).forEach(x => { if (!P(x)) missing.push(x); }));
    if (n.tag && !CATS[catId(n.tag)]) missing.push('category: ' + n.tag);
  });
  MUSTS.forEach(m => { if (!P(m.i)) missing.push(m.i); });
  if (missing.length) console.warn('[compass] unresolved references:', [...new Set(missing)]);
}
function boot(db) {
  index(db);
  const saved = load();
  if (saved) S = Object.assign(S, saved, { prof: Object.assign({}, S.prof, saved.prof || {}) });
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
