(() => {
  'use strict';

  /* =====================================================================
     Helpers
     ===================================================================== */
  const ME = 'p-me';
  const K_MIN = 0.2;
  const K_MAX = 2.6;
  const SVGNS = 'http://www.w3.org/2000/svg';
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const now = () => Date.now();
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const newId = (p) => p + '-' + Math.random().toString(36).slice(2, 9) + now().toString(36).slice(-3);
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isWide = () => matchMedia('(min-width: 860px)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } };
  const norm = (s) => String(s == null ? '' : s).trim().toLowerCase();
  const str = (v) => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '');
  const arr = (v) => (Array.isArray(v) ? v : typeof v === 'string' && v.trim() ? v.split(',') : []).map(str).filter(Boolean);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const uc1 = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
  const lc1 = (s) => (s && s.length > 1 && s[1] === s[1].toLowerCase() ? s[0].toLowerCase() + s.slice(1) : s);
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const avg = (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'style') el.style.cssText = v;
        else if (k === 'value') el.value = v;
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : String(v));
      }
    }
    return add(el, kids);
  }
  function add(el, kids) {
    for (const c of kids.flat(Infinity)) {
      if (c == null || c === false || c === '') continue;
      el.append(c instanceof Node ? c : String(c));
    }
    return el;
  }

  const ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
    userPlus: '<circle cx="9.5" cy="8" r="3.8"/><path d="M2.5 20.5c0-3.9 3.1-7 7-7 2 0 3.8.8 5 2.1"/><path d="M19 13v7M15.5 16.5h7"/>',
    more: '<circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    fit: '<path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15"/>',
    mic: '<rect x="9" y="3" width="6" height="11.5" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
    up: '<path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/>',
    stop: '<rect x="7" y="7" width="10" height="10" rx="2.2" fill="currentColor" stroke="none"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m21 15.5-4.8-4.8L7 20"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    link: '<path d="M9.5 14.5 14.5 9.5"/><path d="m11 6.5 1.4-1.4a4.2 4.2 0 0 1 6 6L17 12.5"/><path d="m13 17.5-1.4 1.4a4.2 4.2 0 0 1-6-6L7 11.5"/>',
    edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    target: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    pin: '<path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7.5h1M14 7.5h1M9 11.5h1M14 11.5h1M9 15.5h1M14 15.5h1"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h9"/>',
    spark: '<path d="M12 3c.4 4.6 2.4 6.6 7 7-4.6.4-6.6 2.4-7 7-.4-4.6-2.4-6.6-7-7 4.6-.4 6.6-2.4 7-7Z"/><path d="M19 15.5c.2 1.8 1 2.6 2.5 2.8-1.6.2-2.3 1-2.5 2.7-.2-1.7-1-2.5-2.5-2.7 1.6-.2 2.3-1 2.5-2.8Z"/>',
    swap: '<path d="M7 7h12l-3.5-3.5M17 17H5l3.5 3.5"/>',
    download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
    upload: '<path d="M12 20V9M7 13.5l5-5 5 5M5 4h14"/>',
    graph: '<circle cx="6" cy="6.5" r="2.5"/><circle cx="18" cy="8" r="2.5"/><circle cx="10" cy="18" r="2.5"/><path d="m8.4 7 7.2.6M7 8.8l2.1 6.9M16.6 10l-5 6"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    camera: '<path d="M4 8.5h3l2-3h6l2 3h3V19H4Z"/><circle cx="12" cy="13" r="3.3"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6"/>',
    cloud: '<path d="M7 18.5a4.5 4.5 0 1 1 .8-8.9A6 6 0 0 1 19.2 11 3.8 3.8 0 0 1 18 18.5Z"/>',
    device: '<rect x="7" y="3" width="10" height="18" rx="2.2"/><path d="M11 17.5h2"/>',
    warn: '<path d="M12 4 2.8 19.5h18.4Z"/><path d="M12 10v4.2M12 17v.1"/>',
    tag: '<path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3-8.7 8.7Z"/><circle cx="8" cy="8" r="1.4"/>',
    note: '<path d="M6 3.5h9l3.5 3.5v13.5H6Z"/><path d="M9 11h6.5M9 14.5h6.5M9 18h4"/>',
    erase: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    loader: '<path d="M12 3a9 9 0 1 0 9 9" />',
    bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2H4.5Z"/><path d="M10 21h4"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    cake: '<path d="M4 20h16M5 20v-7a1.5 1.5 0 0 1 1.5-1.5h11A1.5 1.5 0 0 1 19 13v7"/><path d="M5 15.5c1.2 1 2.3 1 3.5 0s2.3-1 3.5 0 2.3 1 3.5 0 2.3-1 3.5 0M12 11.5V8M12 5.5v.1"/>',
    contacts: '<rect x="5" y="3" width="15" height="18" rx="2.5"/><circle cx="12.5" cy="10" r="2.6"/><path d="M8.5 16.5a4 4 0 0 1 8 0M3 7.5h3M3 12h3M3 16.5h3"/>',
    ask: '<path d="M20.5 12a8.5 8.5 0 0 1-12.4 7.6L3.5 20.5l1-4.3A8.5 8.5 0 1 1 20.5 12Z"/><path d="M9.8 9.6a2.3 2.3 0 0 1 4.5.6c0 1.6-2.3 2-2.3 3.4"/><circle cx="12" cy="16.6" r=".9" fill="currentColor" stroke="none"/>',
  };
  function icon(name, size) {
    const s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('class', 'i');
    s.setAttribute('aria-hidden', 'true');
    if (size) s.style.setProperty('--s', size + 'px');
    s.innerHTML = ICONS[name] || '';
    return s;
  }

  function hueOf(s) {
    let x = 7;
    for (const ch of String(s)) x = (x * 31 + ch.codePointAt(0)) >>> 0;
    return x % 360;
  }
  function initials(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    const a = [...parts[0]][0] || '';
    const b = parts.length > 1 ? [...parts[parts.length - 1]][0] || '' : '';
    return (a + b).toUpperCase();
  }
  function wordIndex(hay, needle) {
    if (!needle) return -1;
    const re = new RegExp('(^|[^\\p{L}\\p{N}])(' + escRe(needle) + ')(?![\\p{L}\\p{N}])', 'iu');
    const m = re.exec(hay);
    return m ? m.index + m[1].length : -1;
  }

  /* =====================================================================
     Vocabulary
     ===================================================================== */
  const CATS = [
    { key: 'family', label: 'Family', one: 'Family' },
    { key: 'friend', label: 'Friends', one: 'Friend' },
    { key: 'work', label: 'Work', one: 'Work' },
    { key: 'romantic', label: 'Partners', one: 'Partner' },
    { key: 'mentor', label: 'Mentors', one: 'Mentor' },
    { key: 'other', label: 'Other', one: 'Other' },
  ];
  const CAT_KEYS = CATS.map((c) => c.key);
  const CAT = Object.fromEntries(CATS.map((c) => [c.key, c]));
  const STRENGTH = ['Distant', 'Casual', 'Close', 'Very close'];
  const PRESETS = ['friend', 'close friend', 'partner', 'spouse', 'sibling', 'parent', 'child', 'cousin', 'coworker', 'manager', 'direct report', 'co-founder', 'investor', 'client', 'mentor', 'classmate', 'roommate', 'neighbor', 'acquaintance'];
  const CAT_WORDS = {
    family: ['mother', 'father', 'mom', 'mum', 'dad', 'parent', 'son', 'daughter', 'child', 'kid', 'brother', 'sister', 'sibling', 'cousin', 'aunt', 'uncle', 'niece', 'nephew', 'grand', 'in-law', 'step', 'twin', 'relative', 'family', 'godmother', 'godfather', 'godson', 'goddaughter', 'stepmom', 'stepdad'],
    romantic: ['wife', 'husband', 'spouse', 'girlfriend', 'boyfriend', 'fianc', 'partner', 'ex', 'date', 'lover', 'significant other', 'crush'],
    mentor: ['mentor', 'mentee', 'coach', 'teacher', 'professor', 'tutor', 'student', 'advisor', 'adviser', 'protégé', 'protege'],
    work: ['coworker', 'co-worker', 'colleague', 'boss', 'manager', 'report', 'employee', 'employer', 'founder', 'cofounder', 'co-founder', 'client', 'customer', 'investor', 'portfolio', 'business', 'contractor', 'vendor', 'supplier', 'recruiter', 'board', 'assistant', 'intern', 'banker', 'lawyer', 'accountant', 'agent', 'supervisor', 'hire', 'ceo', 'cto', 'cfo', 'lp', 'gp', 'analyst', 'associate'],
    friend: ['friend', 'roommate', 'classmate', 'neighbor', 'neighbour', 'buddy', 'pal', 'bestie', 'bff', 'flatmate', 'housemate', 'schoolmate', 'teammate'],
  };
  function inferCat(type) {
    const t = norm(type);
    if (!t) return 'other';
    if (/(managing|general|limited|business|law|senior|equity|founding|venture|work|sales|channel|startup) partner|partner at/.test(t)) return 'work';
    const pm = t.match(/(\S+)\s+partner\b/);
    if (pm && !/^(life|domestic|romantic|long-term|longtime|my|their|his|her)$/.test(pm[1])) return 'friend';
    for (const k of ['family', 'romantic', 'mentor', 'work', 'friend']) {
      for (const w of CAT_WORDS[k]) {
        const re = new RegExp('(^|[^a-z])' + escRe(w) + (w.length <= 3 ? '(?![a-z])' : ''));
        if (re.test(t)) return k;
      }
    }
    return 'other';
  }

  /* =====================================================================
     State
     ===================================================================== */
  const S = {
    people: {},
    rels: {},
    view: { x: 0, y: 0, k: 1 },
    selected: null,
    selRel: null,
    filter: 'all',
    mode: 'add',
    ready: false,
    loadedOnce: false,
    store: null,
    override: new Map(),
    ns: 1,
    attached: null,
    version: 0,
  };
  const E = {};

  function withMe(people) {
    if (!people[ME]) {
      people[ME] = { kind: 'person', id: ME, isMe: true, name: '', title: '', company: '', location: '', traits: [], details: '', email: '', phone: '', photo: '', x: 0, y: 0, virtual: true };
    }
    // People without a position (e.g. written by another tool) get a stable spiral spot around you.
    const loose = Object.values(people).filter((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y)).sort((a, b) => (a.id < b.id ? -1 : 1));
    loose.forEach((p, i) => {
      const a = i * 2.4 + 0.6;
      const r = 190 + 46 * Math.sqrt(i) * 2;
      const anchor = people[ME] || { x: 0, y: 0 };
      p.x = Math.round((Number.isFinite(anchor.x) ? anchor.x : 0) + Math.cos(a) * r);
      p.y = Math.round((Number.isFinite(anchor.y) ? anchor.y : 0) + Math.sin(a) * r * 0.8);
    });
    for (const p of Object.values(people)) if (!Array.isArray(p.traits)) p.traits = arr(p.traits);
    return people;
  }

  const peopleList = () => Object.values(S.people);
  const others = () => peopleList().filter((p) => p.id !== ME);
  const relList = () => Object.values(S.rels).filter((r) => S.people[r.a] && S.people[r.b] && r.a !== r.b);
  const relsOf = (id) => relList().filter((r) => r.a === id || r.b === id);
  const otherEnd = (r, id) => (r.a === id ? r.b : r.a);
  const pos = (id) => S.override.get(id) || S.people[id] || { x: 0, y: 0 };
  const nodeTf = (q) => `translate(${q.x}px, ${q.y}px)` + (S.ns !== 1 ? ` scale(${S.ns})` : '');

  function nameOf(id, full = true) {
    if (id === ME) return 'You';
    const p = S.people[id];
    if (!p) return 'Someone';
    const n = (p.name || '').trim() || 'Unnamed';
    return full ? n : n.split(/\s+/)[0];
  }
  const possessive = (n) => (n === 'You' ? 'your' : n + '’s');
  function relSentence(r, full = false) {
    const A = nameOf(r.a, full);
    const B = nameOf(r.b, full);
    const t = lc1((r.type || '').trim());
    if (!t) return A === 'You' ? `You know ${B}` : B === 'You' ? `You know ${A}` : `${A} and ${B} know each other`;
    return `${A} ${A === 'You' ? 'are' : 'is'} ${possessive(B)} ${t}`;
  }
  function roleLine(p) {
    if (p.title && p.company) return `${p.title} at ${p.company}`;
    return p.title || p.company || '';
  }
  function avatar(p, cls = 'miniav') {
    const isMe = p && p.id === ME;
    const el = h('div', { class: cls + (isMe ? ' me' : ''), style: `--h:${hueOf(p ? p.name || p.id : '?')}`, 'aria-hidden': 'true' });
    if (p && p.photo) el.append(h('img', { src: p.photo, alt: '', draggable: 'false' }));
    else el.append(isMe ? 'You' : initials(p ? p.name : '?'));
    return el;
  }
  function matchExisting(name, includeMe = false) {
    const n = norm(name).replace(/[’']s$/, '');
    if (!n) return null;
    if (includeMe && /^(me|i|myself|you|p-me)$/.test(n)) return ME;
    const list = others().filter((p) => p.name);
    const full = list.filter((p) => norm(p.name) === n);
    if (full.length === 1) return full[0].id;
    if (!n.includes(' ')) {
      const firsts = list.filter((p) => norm(p.name).split(/\s+/)[0] === n);
      if (firsts.length === 1) return firsts[0].id;
    }
    return null;
  }

  function bfsPath(from, to, avoidMe = true) {
    if (from === to) return [];
    const adj = new Map();
    for (const r of relList()) {
      if (!adj.has(r.a)) adj.set(r.a, []);
      if (!adj.has(r.b)) adj.set(r.b, []);
      adj.get(r.a).push(r);
      adj.get(r.b).push(r);
    }
    const prev = new Map([[from, null]]);
    const q = [from];
    while (q.length) {
      const cur = q.shift();
      if (cur === to) break;
      for (const r of adj.get(cur) || []) {
        const nx = otherEnd(r, cur);
        if (prev.has(nx)) continue;
        if (avoidMe && nx === ME && to !== ME) continue;
        prev.set(nx, { id: cur, r });
        q.push(nx);
      }
    }
    if (!prev.has(to)) return avoidMe ? bfsPath(from, to, false) : null;
    const path = [];
    let cur = to;
    while (prev.get(cur)) {
      const step = prev.get(cur);
      path.unshift(step.r);
      cur = step.id;
    }
    return path;
  }

  /* =====================================================================
     Storage — the artifact's private per-person store when available, else this browser
     ===================================================================== */
  function bodyOf(o) {
    const b = { ...o };
    delete b.id;
    delete b.virtual;
    return JSON.parse(JSON.stringify(b));
  }

  class LocalStore {
    constructor(reason) {
      this.mode = 'local';
      this.reason = reason || 'standalone';
      this.key = 'kith.v1';
      this.docs = {};
      this.ok = true;
      try {
        const raw = localStorage.getItem(this.key);
        if (raw) this.docs = JSON.parse(raw).docs || {};
      } catch {
        this.ok = false;
      }
      addEventListener('pagehide', () => this.flush());
    }
    subscribe(cb) {
      this.cb = cb;
      setTimeout(() => this.emit(), 0);
      addEventListener('storage', (e) => {
        if (e.key !== this.key) return;
        try { this.docs = JSON.parse(e.newValue || '{}').docs || {}; } catch { /* ignore */ }
        this.emit();
      });
    }
    emit() {
      const people = {};
      const rels = {};
      for (const [id, v] of Object.entries(this.docs)) {
        if (v.kind === 'person') people[id] = { ...v, id, traits: [...(v.traits || [])] };
        else if (v.kind === 'rel') rels[id] = { ...v, id };
      }
      this.cb({ people, rels });
    }
    put(id, body) { this.docs[id] = body; this.save(); }
    del(id) { delete this.docs[id]; this.save(); }
    busy() { return false; }
    save() {
      clearTimeout(this.t);
      this.t = setTimeout(() => this.flush(), 250);
    }
    flush() {
      clearTimeout(this.t);
      try {
        localStorage.setItem(this.key, JSON.stringify({ v: 1, docs: this.docs }));
      } catch {
        if (!this.warned) toast('This browser won’t save any more. Export a backup from the menu so nothing is lost.');
        this.warned = true;
      }
    }
  }

  class CloudStore {
    constructor(db, uid) {
      this.mode = 'cloud';
      this.col = db.collection('data/users/' + uid);
      this.slots = new Map();
      this.active = 0;
      this.waiting = [];
    }
    subscribe(cb, onErr) {
      this.unsub = this.col.onSnapshot(
        (snap) => {
          const people = {};
          const rels = {};
          for (const d of snap.docs) {
            const v = d.data();
            if (!v) continue;
            if (v.kind === 'person') people[d.id] = { ...v, id: d.id, traits: [...(v.traits || [])] };
            else if (v.kind === 'rel') rels[d.id] = { ...v, id: d.id };
          }
          // Writes still waiting in our queue aren't in the snapshot yet; lay them over it.
          for (const [id, slot] of this.slots) {
            if (!slot.next) continue;
            if (slot.next.op === 'del') { delete people[id]; delete rels[id]; continue; }
            const b = slot.next.body;
            if (b.kind === 'person') people[id] = { ...b, id, traits: [...(b.traits || [])] };
            else rels[id] = { ...b, id };
          }
          cb({ people, rels, fromCache: snap.metadata && snap.metadata.fromCache });
        },
        (e) => onErr && onErr(e),
      );
    }
    put(id, body) { this.enqueue(id, { op: 'set', body }); }
    del(id) { this.enqueue(id, { op: 'del' }); }
    busy() { return this.slots.size > 0; }
    enqueue(id, job) {
      let s = this.slots.get(id);
      if (!s) { s = { running: false, next: null }; this.slots.set(id, s); }
      s.next = job;
      syncBadge();
      this.pump(id);
    }
    async pump(id) {
      const s = this.slots.get(id);
      if (!s || s.running || !s.next) return;
      if (this.active >= 4) { if (!this.waiting.includes(id)) this.waiting.push(id); return; }
      const job = s.next;
      s.next = null;
      s.running = true;
      this.active++;
      try {
        await this.write(id, job);
      } catch (e) {
        this.fail(e);
      } finally {
        s.running = false;
        this.active--;
        if (!s.next) this.slots.delete(id);
        else this.pump(id);
        while (this.active < 4 && this.waiting.length) this.pump(this.waiting.shift());
        syncBadge();
      }
    }
    async write(id, job, retried) {
      const ref = this.col.doc(id);
      try {
        if (job.op === 'set') await ref.set(job.body);
        else await ref.delete();
      } catch (e) {
        const code = e && e.code;
        if (!retried && (code === 'unavailable' || code === 'resource_exhausted')) {
          await sleep(700 + Math.random() * 900);
          return this.write(id, job, true);
        }
        throw e;
      }
    }
    fail(e) {
      const code = e && e.code;
      if (code === 'quota_exceeded') toast('Your map is full. Delete some people or connections to save more.');
      else if (code === 'invalid_argument') toast('That change couldn’t be saved. A photo or note may be too large.');
      else toast('A change didn’t save. Check your connection and try again.');
    }
  }

  function syncBadge() {
    if (!E.sync || !S.store) return;
    const cloud = S.store.mode === 'cloud';
    const busy = S.store.busy();
    E.sync.className = 'sync' + (cloud ? ' cloud' : '') + (busy ? ' busy' : '');
    E.sync.title = busy ? 'Saving…' : cloud ? 'Saved to your Claude account' : 'Saved in this browser';
  }

  function savePerson(p) {
    const next = { ...p, kind: 'person', updatedAt: now() };
    delete next.virtual;
    if (!next.createdAt) next.createdAt = now();
    S.people[next.id] = next;
    S.store.put(next.id, bodyOf(next));
    return next;
  }
  function saveRel(r) {
    const next = { ...r, kind: 'rel', updatedAt: now() };
    if (!next.createdAt) next.createdAt = now();
    S.rels[next.id] = next;
    S.store.put(next.id, bodyOf(next));
    return next;
  }
  function removeDoc(id) {
    delete S.people[id];
    delete S.rels[id];
    S.store.del(id);
  }
  function deletePerson(id) {
    const p = S.people[id];
    if (!p || id === ME) return;
    const gone = relsOf(id).map(clone);
    const keep = clone(p);
    for (const r of gone) removeDoc(r.id);
    removeDoc(id);
    if (S.selected === id) S.selected = null;
    withMe(S.people);
    onData();
    toast(`Deleted ${p.name || 'person'}`, {
      action: 'Undo',
      run: () => {
        savePerson(keep);
        for (const r of gone) saveRel(r);
        onData();
      },
    });
  }

  /* =====================================================================
     Claude (the artifact's sample capability), with on-device fallbacks
     ===================================================================== */
  const AI = { sample: null, ok: false, images: false, imageTypes: [], tried: false };
  async function initAI() {
    if (!window.claude || typeof window.claude.use !== 'function') return;
    try {
      const s = await window.claude.use('sample');
      if (!s) return;
      AI.sample = s;
      AI.ok = true;
      try {
        const lim = await s.limits();
        AI.images = !!(lim && lim.images);
        AI.imageTypes = (lim && lim.images && lim.images.mediaTypes) || [];
      } catch { /* no images */ }
    } catch { /* unavailable */ }
    updateComposer();
  }
  const AI_OFF = ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'];
  function aiFailed(e) {
    if (e && AI_OFF.includes(e.code)) {
      AI.ok = false;
      updateComposer();
    }
  }
  function aiErrorText(e) {
    const code = e && e.code;
    if (AI_OFF.includes(code)) return 'Claude is turned off for this page, so Kith read it on this device instead.';
    if (code === 'rate_limited') return 'Claude is busy or you’ve reached your usage limit. Try again in a minute.';
    if (code === 'session_expired') return 'Your Claude session expired. Sign in again to use Claude here.';
    if (code === 'prompt_too_large') return 'That was too long for one go. Try a shorter piece.';
    if (code === 'image_rejected') return 'Claude couldn’t open that picture. Try a PNG or JPEG screenshot.';
    if (code === 'refused') return 'Claude declined that one. Try rewording it.';
    if (code === 'invalid_json') return 'Claude’s answer came back garbled. Try again.';
    return 'Claude couldn’t be reached just now. Try again in a moment.';
  }

  function networkText(maxNotes = 1200) {
    const lines = ['People:'];
    const me = S.people[ME];
    const meBits = [];
    if (me) {
      if (me.name) meBits.push('name: ' + me.name);
      if (roleLine(me)) meBits.push(roleLine(me));
      if (me.location) meBits.push('lives in ' + me.location);
      if (me.details) meBits.push('notes: ' + me.details.replace(/\s+/g, ' ').slice(0, maxNotes));
    }
    lines.push(`- You [${ME}] (the owner of this map)${meBits.length ? ': ' + meBits.join('; ') : ''}`);
    for (const p of others().sort((a, b) => (a.name || '').localeCompare(b.name || ''))) {
      const bits = [];
      if (p.title && p.company) bits.push(`${p.title} at ${p.company}`);
      else if (p.company) bits.push(`works at ${p.company}`);
      else if (p.title) bits.push(p.title);
      if (p.location) bits.push('lives in ' + p.location);
      if (p.traits && p.traits.length) bits.push('traits: ' + p.traits.join(', '));
      if (p.details) bits.push('notes: ' + p.details.replace(/\s+/g, ' ').slice(0, maxNotes));
      if (p.email) bits.push('email ' + p.email);
      if (p.phone) bits.push('phone ' + p.phone);
      if (p.birthday) bits.push('birthday ' + birthdayText(p.birthday));
      if (p.lastContact) bits.push(`last caught up ${p.lastContact} (${relDays(dayNum(p.lastContact) - todayNum())})`);
      const di = dueInfo(p);
      if (di) bits.push(`wants to keep in touch ${cadenceLabel(di.cadence).toLowerCase()}; next catch-up ${di.left < 0 ? 'overdue by ' + -di.left + ' days' : di.left === 0 ? 'due today' : 'due in ' + di.left + ' days'}`);
      const recent = (p.log || []).filter((e) => e.note).slice(0, 3).map((e) => `${e.d}: ${e.note.replace(/\s+/g, ' ').slice(0, 200)}`);
      if (recent.length) bits.push('recent catch-ups: ' + recent.join(' | '));
      lines.push(`- ${p.name || 'Unnamed'} [${p.id}]${bits.length ? ': ' + bits.join('; ') : ''}`);
    }
    lines.push('', 'Relationships (each reads "A is B’s type"):');
    const rels = relList();
    if (!rels.length) lines.push('- none yet');
    for (const r of rels) {
      const d = (r.description || '').replace(/\s+/g, ' ').slice(0, maxNotes);
      lines.push(`- ${relSentence(r, true)} (${r.category || 'other'}, ${STRENGTH[clamp(r.strength || 2, 1, 4) - 1].toLowerCase()})${d ? '. ' + d : ''}`);
    }
    const text = lines.join('\n');
    if (text.length > 190000 && maxNotes > 120) return networkText(Math.floor(maxNotes / 4));
    return text;
  }

  function parsePrompt(note, withImage) {
    const rows = [`${ME} | You (the author)${S.people[ME] && S.people[ME].name ? ' — ' + S.people[ME].name : ''}`];
    for (const p of others().slice(0, 800)) rows.push([p.id, p.name || 'Unnamed', p.title || '', p.company || '', p.location || ''].join(' | '));
    return [
      'You turn a note about people into structured data for a personal relationship map.',
      '',
      `The note’s author owns the map. Refer to the author with ref "${ME}" (I, me, my, we).`,
      '',
      'People already on the map (ref | name | title | company | location):',
      rows.join('\n'),
      '',
      'Note:',
      '"""',
      note || '(no text — read the attached image)',
      '"""',
      withImage ? '\nThe attached image is part of the note — for example a screenshot of a profile, contact card, email signature, chat or org chart. Read the people and facts in it.\n' : '',
      'Reply with only JSON in this shape:',
      '{"people":[{"ref":"existing ref, or new1, new2…","name":"Full Name","title":"","company":"","location":"","traits":[],"details":"","email":"","phone":"","birthday":"","lastContact":"","touchNote":"","cadenceDays":0}],',
      ' "relationships":[{"from":"ref","to":"ref","type":"sister","category":"family","strength":2,"description":""}]}',
      '',
      'Rules:',
      '- Reuse an existing ref when the note means someone already on the map (a first name alone counts when only one person on the map has it). Otherwise make a new ref.',
      '- List a person only when the note says something about them or connects them to someone. For people already on the map include only fields the note adds or changes; use "" or [] for the rest.',
      '- title is the job title, company the employer, location the city or area where they live or work.',
      '- traits: short descriptors of character, interests or habits ("funny", "vegetarian", "runs marathons").',
      '- details: other facts worth remembering, as short plain sentences (family, history, preferences, dates). Don’t repeat other fields.',
      '- type: a short lowercase noun phrase chosen so "<from> is <to>’s <type>" reads correctly: "sister", "college roommate", "co-founder", "manager", "investor", "friend".',
      '- category: family, friend, work, romantic, mentor or other.',
      '- strength: 1 distant, 2 casual, 3 close, 4 very close. Use 2 unless the note suggests otherwise.',
      '- description: what the note says about how the two know each other, in the note’s own terms; "" if nothing.',
      `- Today is ${todayStr()}. birthday: "YYYY-MM-DD", or "--MM-DD" when the year isn’t given; "" if not mentioned.`,
      '- lastContact: the date (YYYY-MM-DD) the author last met, called or messaged this person, when the note says so ("had coffee with Sarah today", "called Mike yesterday"); otherwise "". touchNote: one short line on what they talked about, when lastContact is set.',
      '- cadenceDays: only when the note asks to keep in touch at an interval ("check in with Dan every month" → 30); otherwise 0.',
      '- Never invent facts. If the note mentions no people, reply {"people":[],"relationships":[]}.',
    ].join('\n');
  }

  const ASK_RULES = [
    'You are Kith, a private assistant for one person’s map of the people they know. Answer the owner’s questions using only the map below. "You" in the map is the owner.',
    '',
    'How to answer:',
    '- Be direct and brief: one to four sentences, or a short list with "- " bullets when listing people.',
    '- Use people’s full names exactly as written in the map so the app can link them.',
    '- Speak to the owner as "you". Refer to other people by name or as "they".',
    '- If the map doesn’t contain the answer, say so in one sentence and suggest what to add.',
    '- Never invent jobs, places, traits or relationships. You may offer a reasonable inference if you label it as a guess.',
    '- No headings or tables.',
  ].join('\n');

  function questionFacts(q) {
    const ids = mentioned(q);
    const meToo = /\b(i|me|my|myself|mine)\b/i.test(q);
    const out = [];
    const pair = ids.length >= 2 ? [ids[0], ids[1]] : ids.length === 1 && meToo ? [ids[0], ME] : null;
    if (pair) {
      const path = bfsPath(pair[0], pair[1]);
      if (path && path.length) out.push(`- Shortest chain between ${nameOf(pair[0])} and ${nameOf(pair[1])}: ` + path.map((r) => relSentence(r, true)).join('; then '));
      else if (path === null) out.push(`- ${nameOf(pair[0])} and ${nameOf(pair[1])} are not linked on the map.`);
    }
    for (const id of ids.slice(0, 3)) out.push(`- ${nameOf(id)} has ${plural(relsOf(id).length, 'connection', 'connections')} on the map.`);
    return out.join('\n');
  }

  /* =====================================================================
     On-device note reader (used when Claude isn't available)
     ===================================================================== */
  const NAME_STOP = new Set(('i im i’m i\'m ive i’ve i\'ve id he she they we you it my our his her their its the a an and but or also then so just only even ' +
    'today yesterday tomorrow tonight last next this that these those there here when where while after before since because if ' +
    'met meet works work worked lives live lived talked spoke chatted had have has call called saw see texted emailed ' +
    'in at on from for with to of by about via into onto mr mrs ms dr prof sir hi hey hello dear note notes trait traits company location email phone title role details ' +
    'monday tuesday wednesday thursday friday saturday sunday january february march april june july august september october november december ' +
    'is are was were be been am will would should could can cannot not yes no ok okay please thanks thank new old great good nice very really super both all every each some any ' +
    'mom dad mum grandma grandpa auntie uncle sis bro ' +
    'remind remember ask tell check text message ping follow schedule book send invite introduce intro thank congratulate wish buy get find add having grabbed caught catch keep stay reach touch let make need want try ' +
    'series seed round raising raised pre').split(/\s+/));
  const ORG_WORDS = new Set('university college school inc llc ltd corp corporation company group labs lab capital ventures partners bank hospital institute foundation sales marketing engineering operations legal finance demo conference summit airport church club gym cafe restaurant hotel studio studios agency systems technologies holdings media health medical team board committee'.split(' '));
  const PARTICLES = new Set(['de', 'da', 'del', 'della', 'di', 'van', 'von', 'der', 'den', 'la', 'le', 'du', 'bin', 'al', 'ibn', 'dos', 'das', 'st']);
  const REL_STOP = new Set(['and', 'but', 'who', 'whom', 'which', 'that', 'at', 'in', 'since', 'because', 'is', 'was', 'were', 'are', 'works', 'work', 'worked', 'lives', 'lived', 'living', 'based', 'currently', 'now', 'also', 'too', 'as', 'for', 'with', 'when', 'where', 'while', 'so', 'though', 'although', 'she', 'he', 'they', 'her', 'his', 'their', 'to', 'on', 'by', 'about', 'after', 'before', 'from', 'through', 'via', 'we', 'i', 'you', 'it', 'has', 'have', 'had', 'loves', 'likes', 'runs', 'whose', 'still', 'again', 'there', 'here', 'then', 'very', 'really', 'if', 'or', 'met', 'introduced', 'knows', 'know']);
  const NOT_TRAIT = new Set(['a', 'an', 'the', 'my', 'our', 'your', 'his', 'her', 'their', 'from', 'in', 'at', 'on', 'married', 'dating', 'engaged', 'based', 'working', 'living', 'moving', 'going', 'also', 'now', 'still', 'not', 'currently', 'getting', 'being', 'having', 'here', 'there', 'back', 'away', 'out', 'over', 'about', 'with', 'to', 'into', 'one', 'two', 'three', 'like', 'and', 'or', 'but', 'friends', 'friend', 'single', 'retired', 'pregnant']);
  const INTENS = /^(?:very|really|super|so|extremely|incredibly|quite|pretty|always|kind of|kinda|a bit|a little|genuinely|truly|totally|deeply)\s+/;
  const PERSON_NOUNS = new Set(['guy', 'person', 'woman', 'man', 'girl', 'dude', 'soul', 'human', 'kid', 'lady', 'gentleman', 'character', 'individual', 'people', 'fellow', 'chap', 'gal']);
  const PRAISE = new Set(['great', 'good', 'amazing', 'excellent', 'terrible', 'talented', 'brilliant', 'gifted', 'natural', 'avid', 'huge', 'big', 'true', 'fantastic', 'awesome', 'wonderful', 'lovely', 'kind', 'smart', 'sharp', 'nice', 'funny', 'fun', 'serious', 'hard', 'tough']);
  const TITLE_WORDS = /\b(ceo|cto|cfo|coo|cmo|cpo|vp|svp|evp|founder|co-?founder|head|director|president|partner|chair|chairman|chairwoman|owner|principal|manager|lead|engineer|designer|analyst|associate|investor|editor|producer|nurse|doctor|lawyer|attorney|teacher|professor|consultant|architect|developer|scientist|researcher|writer|chef|officer|advisor|adviser|recruiter|agent|banker|accountant|pm|intern|student|trader|broker|realtor|therapist|dentist|surgeon|pilot|artist|photographer|journalist|coach)s?\b/i;
  const VERBS_IN_ROW = /\b(is|are|was|works|worked|lives|lived|met|my|knows|married|introduced|loves|likes)\b/i;

  function cleanName(s) {
    return String(s || '').replace(/[’']s$/, '').replace(/[.,;:!?]+$/, '').replace(/\s+/g, ' ').trim();
  }
  function cleanOrg(s) {
    let w = String(s || '').replace(/[.,;:!?)]+$/, '').trim().split(/\s+/);
    while (w.length && /^(of|and|the|for|de|du|von|&|in|at)$/i.test(w[w.length - 1])) w.pop();
    return w.join(' ');
  }
  function singular(w) {
    const map = { children: 'child', people: 'person', wives: 'wife', besties: 'bestie', bffs: 'best friend' };
    const words = w.split(' ');
    let last = words.pop();
    if (map[last]) last = map[last];
    else if (/ies$/.test(last) && last.length > 4) last = last.slice(0, -3) + 'y';
    else if (/(ss|us)$/.test(last)) { /* keep */ }
    else if (/s$/.test(last) && last.length > 3) last = last.slice(0, -1);
    words.push(last);
    return words.join(' ');
  }
  function normType(t) {
    let words = norm(t).replace(/[“”"().!?]/g, '').split(/\s+/).filter(Boolean);
    while (words.length && /^(a|an|the|my|our|his|her|their|your|good|old|dear)$/.test(words[0]) && words.length > 1 && !/^(good|old|dear)$/.test(words[0])) words.shift();
    while (words.length && /^(a|an|the|my|our|his|her|their|your)$/.test(words[0])) words.shift();
    const out = [];
    for (const w of words) {
      if (REL_STOP.has(w) || !/^[a-zé'’-]+$/.test(w)) break;
      out.push(w);
      if (out.length >= 4) break;
    }
    let s = out.join(' ').replace(/[,;:]+$/, '');
    const syn = { bf: 'boyfriend', gf: 'girlfriend', bff: 'best friend', cofounder: 'co-founder', 'co founder': 'co-founder', coworker: 'coworker', 'co-worker': 'coworker', hubby: 'husband', wifey: 'wife', bestie: 'best friend', mum: 'mother', mom: 'mother', dad: 'father', sis: 'sister', bro: 'brother' };
    if (syn[s]) s = syn[s];
    if (/^(married|wed)$/.test(s)) s = 'spouse';
    if (/^(dating|together|a couple|couple|an item)$/.test(s)) s = 'partner';
    if (/^engaged$/.test(s)) s = 'fiancé';
    if (/^related$/.test(s)) s = 'relative';
    if (!s || /^(favorite|favourite|thing|stuff|time|plans?|meeting|call|idea|way)$/.test(s)) return '';
    return s;
  }

  function findNames(s) {
    const out = [];
    const toks = [];
    const re = /[\p{L}][\p{L}'’.\-]*/gu;
    let m;
    while ((m = re.exec(s))) toks.push({ w: m[0], i: m.index, end: m.index + m[0].length });
    const isCap = (w) => /^\p{Lu}/u.test(w) && !/^\p{Lu}{2,}$/u.test(w.replace(/[’'.]s?$/, ''));
    const gapOk = (a, b) => /^\s+$/.test(s.slice(a.end, b.i));
    let j = 0;
    while (j < toks.length) {
      if (!isCap(toks[j].w)) { j++; continue; }
      const grp = [toks[j]];
      let k = j;
      while (k + 1 < toks.length && !/[’']s$/.test(toks[k].w)) {
        const nx = toks[k + 1];
        if (!gapOk(toks[k], nx)) break;
        if (isCap(nx.w)) { grp.push(nx); k++; continue; }
        if (PARTICLES.has(nx.w) && k + 2 < toks.length && isCap(toks[k + 2].w) && gapOk(nx, toks[k + 2])) { grp.push(nx, toks[k + 2]); k += 2; continue; }
        break;
      }
      j = k + 1;
      const pre = s.slice(Math.max(0, grp[0].i - 40), grp[0].i);
      if (/\b(?:at|in|from|near|for|joined|founded|co-?founded|started|runs|leads|owns|heads|based|to)\s+$/i.test(pre) && NAME_STOP.has(grp[0].w.toLowerCase())) continue;
      while (grp.length && NAME_STOP.has(grp[0].w.toLowerCase().replace(/[’']s$/, '').replace(/\.$/, ''))) grp.shift();
      while (grp.length && NAME_STOP.has(grp[grp.length - 1].w.toLowerCase().replace(/[’']s$/, ''))) grp.pop();
      if (!grp.length) continue;
      const g = grp.slice(0, 4);
      if (g.some((x) => ORG_WORDS.has(x.w.toLowerCase().replace(/[’']s$/, '')))) continue;
      const first = g[0];
      const last = g[g.length - 1];
      const poss = /[’']s$/.test(last.w);
      const name = cleanName(s.slice(first.i, last.end));
      if (!name || name.length < 2) continue;
      const before = s.slice(Math.max(0, first.i - 40), first.i);
      if (/\b(?:at|in|from|near|for|joined|joining|founded|co-?founded|cofounded|started|runs|leads|owns|heads|left|quit|visit(?:ed|ing)?|via|of the|based|across|around|outside|inside|within|toward|towards)\s+$/i.test(before)) continue;
      if (/\b(?:moved|relocated|moving|went|flew|trip|going|heading|headed|back|commutes?|travel(?:l?ed|l?ing)?|drove|move)\s+(?:back\s+)?to\s+$/i.test(before)) continue;
      if (/(?:\b\p{Lu}[\p{L}]*|\b(?:head|director|vp|svp|evp|president|chief|chair|dean|professor|member|manager|lead|founder|ceo|cto|cfo|coo))\s+of\s+$/iu.test(before) && !/\b(?:friend|cousin|colleague|classmate|neighbou?r|relative|sister|brother|son|daughter|mother|father|wife|husband|partner)\s+of\s+$/i.test(before)) continue;
      out.push({ name, start: first.i, end: last.end, poss });
    }
    return out;
  }

  function parseLocal(text) {
    const d = { source: 'local', note: text, people: [], rels: [] };
    const entries = [];
    const byKey = new Map();
    let meEntry = null;
    let last = null;
    const blank = (ref, existingId, name) => ({ ref, existingId, name, title: '', company: '', location: '', traits: [], details: '', email: '', phone: '', birthday: '', lastContact: '', touchNote: '', cadenceDays: 0, include: true, uses: 0, dead: false });
    const me = () => meEntry || (meEntry = Object.assign(blank(ME, ME, ''), { me: true }));
    const knownPlaces = new Set(others().flatMap((p) => [norm(p.company), norm(p.location)]).filter(Boolean));

    function person(name) {
      name = cleanName(name);
      if (!name) return null;
      if (/^(i|me|myself)$/i.test(name)) return me();
      const key = name.toLowerCase();
      if (byKey.has(key)) return byKey.get(key);
      if (!key.includes(' ')) {
        for (const [k, v] of byKey) if (k.split(' ')[0] === key) return v;
      } else {
        const firstK = key.split(' ')[0];
        if (byKey.has(firstK)) { const v = byKey.get(firstK); if (!v.existingId) v.name = name; byKey.set(key, v); return v; }
      }
      const ex = matchExisting(name);
      if (ex) {
        for (const v of byKey.values()) if (v.existingId === ex) { byKey.set(key, v); return v; }
      }
      const e = blank(ex || 'new-' + (entries.length + 1), ex, ex ? S.people[ex].name : name);
      byKey.set(key, e);
      entries.push(e);
      return e;
    }
    function rel(A, B, type, desc) {
      if (!A || !B || A === B) return false;
      type = normType(type);
      if (!type) return false;
      A.uses++;
      B.uses++;
      if (d.rels.some((r) => r.from === A.ref && r.to === B.ref && r.type === type)) return true;
      const strong = /best|close|twin|spouse|wife|husband|sister|brother|partner|fiancé|mother|father|parent|child|son|daughter/.test(type);
      d.rels.push({ from: A.ref, to: B.ref, type, category: inferCat(type), strength: strong ? 3 : 2, description: desc || '', include: true });
      return true;
    }
    const addTraits = (P, list) => {
      if (!P) return false;
      let any = false;
      for (let t of list) {
        t = t.replace(INTENS, '').replace(INTENS, '').replace(/[.;:!?]+$/, '').trim();
        if (!t || t.length > 40 || NOT_TRAIT.has(t.split(' ')[0])) continue;
        if (!P.traits.some((x) => norm(x) === norm(t))) P.traits.push(t);
        any = true;
      }
      return any;
    };
    const setField = (P, f, v) => {
      v = f === 'company' ? cleanOrg(v) : String(v || '').replace(/[.,;:!?]+$/, '').trim();
      if (!P || !v) return false;
      if (f === 'location' || f === 'company') {
        if (/^(the|a|an|my|our)$/i.test(v)) return false;
      }
      P[f] = v;
      P.uses++;
      return true;
    };

    // ---- list-style rows: "Sarah Chen — Stripe — San Francisco — funny, climber"
    const lines = String(text || '').replace(/\r/g, '').split('\n');
    const prose = [];
    for (const line of lines) {
      const raw = line.trim().replace(/^[-*•\d.)\s]+(?=\p{Lu})/u, '');
      if (!raw) continue;
      let segs = raw.split(/\s*(?:\||\t|;|\s[–—-]\s)\s*/);
      if (segs.length < 2 && (raw.match(/,/g) || []).length >= 2) segs = raw.split(/\s*,\s*/);
      const nameLike = /^\p{Lu}[\p{L}'’.\-]+(?:\s+\p{Lu}[\p{L}'’.\-]+){0,3}$/u.test(segs[0] || '');
      if (segs.length >= 2 && nameLike && !VERBS_IN_ROW.test(raw)) {
        const P = person(segs[0]);
        if (!P) continue;
        P.uses++;
        for (const seg0 of segs.slice(1)) {
          const seg = seg0.trim();
          if (!seg) continue;
          let mm;
          if ((mm = seg.match(/[\w.+-]+@[\w-]+\.[\w.-]+/))) P.email = mm[0];
          else if ((mm = seg.match(/^\+?[\d][\d\s().-]{6,}\d$/))) P.phone = mm[0];
          else if ((mm = seg.match(/^(?:at|@)\s+(.+)$/i))) setField(P, 'company', mm[1]);
          else if ((mm = seg.match(/^(.+?)\s+(?:at|@)\s+(.+)$/))) { setField(P, 'title', mm[1]); setField(P, 'company', mm[2]); }
          else if ((mm = seg.match(/^(?:lives in|based in|in|from)\s+(.+)$/i))) setField(P, 'location', mm[1]);
          else if (/^[a-z]/.test(seg)) addTraits(P, seg.split(/\s*(?:,|\band\b)\s*/));
          else if (TITLE_WORDS.test(seg) && !P.title) setField(P, 'title', seg);
          else if (!P.company) setField(P, 'company', seg);
          else if (!P.location) setField(P, 'location', seg);
          else P.details = (P.details ? P.details + ' ' : '') + seg + '.';
        }
        last = P;
      } else {
        prose.push(raw);
      }
    }

    // ---- sentences
    const ABBR = /\b(Mr|Mrs|Ms|Dr|St|Jr|Sr|Inc|Co|Ltd|Prof|vs|etc|Corp|Mt)\./g;
    const sentences = prose.join('\n').replace(ABBR, '$1\u0002').replace(/([.!?])\s+(?=[\p{Lu}"“(@])/gu, '$1\u0001').split(/\u0001|;\s+|\n+/).map((s) => s.replace(/\u0002/g, '.').trim()).filter(Boolean);

    const W = "[a-z][a-z'’\\-]*";
    const RW = `(?!(?:${[...REL_STOP].join('|')})\\b)${W}`;
    const RELW = `((?:${RW}\\s+){0,3}${RW})`;
    const TW = "[A-Za-z][A-Za-z'’\\-]*";
    const TITLEW = `((?:${TW}\\s+){0,3}${TW})`;
    const SUBJ = '(@\\d+|I)';
    const SUBJS = '((?:@\\d+(?:,\\s*|\\s+and\\s+|\\s*&\\s*))*@\\d+|I)';
    const OBJ = '(@\\d+|me)';
    const ORGC = "[\\p{L}\\p{N}&.'’+\\-]";
    const ORG = `((?:@\\d+|[\\p{Lu}\\p{N}]${ORGC}*)(?:\\s+(?:[\\p{Lu}\\p{N}&]${ORGC}*|of|and|the|for|de|du|von|&))*)`;
    const PLACE = "((?:@\\d+|\\p{Lu}[\\p{L}.'’\\-]*)(?:(?:\\s+|,\\s*)(?:\\p{Lu}[\\p{L}.'’\\-]*))*)";
    const R = (src) => new RegExp(src, 'gu');

    for (const sentence of sentences) {
      const names = findNames(sentence);
      const ents = [];
      const raws = [];
      let t = '';
      let cursor = 0;
      for (const nm of names) {
        const P = person(nm.name);
        if (!P) continue;
        let idx = ents.indexOf(P);
        if (idx < 0) { idx = ents.length; ents.push(P); raws.push(nm.name); }
        t += sentence.slice(cursor, nm.start) + '@' + idx + (nm.poss ? "'s" : '');
        cursor = nm.end;
      }
      t += sentence.slice(cursor);
      t = t.replace(/’/g, "'");
      // pronouns point at a name earlier in this sentence, else the last person we talked about
      const lead = t.match(/@(\d+)/);
      const pron = /\b(?:he|she|they|his|her|their|him|them)\b/i.exec(t);
      const target = lead && pron && lead.index < pron.index ? ents[+lead[1]] : last;
      if (target) {
        let L = ents.indexOf(target);
        if (L < 0) { L = ents.length; ents.push(target); raws.push(target.name); }
        const tok = '@' + L;
        t = t
          .replace(/\b(?:he|she|they)'s\b/gi, tok + ' is')
          .replace(/\bthey're\b/gi, tok + ' are')
          .replace(/\b(?:he|she|they)\b/gi, tok)
          .replace(/\b(?:his|their)\b/gi, tok + "'s")
          .replace(/\bher\b(?=\s+(?:at|in|on|through|via|last|yesterday|today|and|again|for|from|to|with|when|while|back|since|$)|[.,;!?]|$)/gi, tok)
          .replace(/\bher\b/gi, tok + "'s")
          .replace(/\b(?:him|them)\b/gi, tok);
      }
      t = t.replace(/\bI'm\b/g, 'I am').replace(/^(my|our|works|lives|met|also|just|recently|currently|then|and|but|plus|both|the|a|an|we|loves|likes)\b/i, (w) => w.toLowerCase());

      const E2 = (tok) => (tok === 'I' || tok === 'me' || tok === 'us' ? me() : ents[+String(tok).slice(1)] || null);
      const subjList = (s) => (s === 'I' ? [me()] : (s.match(/@\d+/g) || []).map(E2).filter(Boolean));
      const deref = (s) =>
        String(s || '').replace(/@(\d+)/g, (_, i) => {
          const P = ents[+i];
          if (P && P !== last) P.dead = true;
          return raws[+i] || '';
        });
      const firstTok = t.match(/@(\d+)/);
      const subject = firstTok ? ents[+firstTok[1]] : null;
      if (subject) t = t.replace(/\b(and|but|who) (?=(?:also |now |currently |recently |still |just )?(?:works?|worked|lives|lived|is|was|moved|relocated|runs|founded|co-?founded|leads|loves|likes|enjoys|has|plays)\b)/g, `$1 @${ents.indexOf(subject)} `);
      let facts = 0;
      const consumed = [];
      const run = (src, fn, consume = true) => {
        for (const m of t.matchAll(R(src))) {
          if (consumed.some(([a, b]) => m.index < b && m.index + m[0].length > a)) continue;
          if (fn(m) !== false) {
            facts++;
            if (consume) consumed.push([m.index, m.index + m[0].replace(/@\d+(?:'s)?$/, '').length]);
          }
        }
      };
      const long = sentence.split(/\s+/).length > 7 ? sentence : '';

      // relationships
      run(`(@\\d+)'s ${RELW},? (@\\d+)`, (m) => rel(E2(m[3]), E2(m[1]), m[2], long));
      run(`${SUBJ} (?:is|was|am|are|has been) (?:also )?(@\\d+)'s ${RELW}`, (m) => rel(E2(m[1]), E2(m[2]), m[3], long));
      run(`(@\\d+) (?:is|was|has been|'s) (?:also |now |still )?(?:my|our) ${RELW}`, (m) => rel(E2(m[1]), me(), m[2], long));
      run(`\\b(?:my|our) ${RELW},? (@\\d+)`, (m) => rel(E2(m[2]), me(), m[1], long));
      run(`(@\\d+)(?:,|\\s[-—–]|:)\\s*(?:my|our) ${RELW}`, (m) => rel(E2(m[1]), me(), m[2], long));
      run(`${SUBJ} and ${SUBJ.replace('|I)', '|I|me)')} are (?:both |now |still |also |all )?(?:(my|our) )?${RELW}`, (m) => {
        const A = E2(m[1]);
        const B = E2(m[2]);
        const type = singular(norm(m[4]));
        if (m[3]) return rel(A, me(), type, long) && rel(B, me(), type, long);
        return rel(A, B, type, long);
      });
      run(`${SUBJ} (?:is |was |got |am )?(?:married to|wed to) ${OBJ}`, (m) => rel(E2(m[1]), E2(m[2]), 'spouse', long));
      run(`${SUBJ} (?:is |am |was |are )?(?:dating|seeing|going out with|together with|in a relationship with) ${OBJ}`, (m) => rel(E2(m[1]), E2(m[2]), 'partner', long));
      run(`${SUBJ} (?:is |am |was |got )?engaged to ${OBJ}`, (m) => rel(E2(m[1]), E2(m[2]), 'fiancé', long));
      run(`${SUBJ} (?:works?|worked|working|is working|has worked) (?:closely )?(?:with|alongside) ${OBJ}`, (m) => rel(E2(m[1]), E2(m[2]), 'coworker', long));
      run(`${SUBJ} (?:reports|reported|report) to ${OBJ}`, (m) => rel(E2(m[1]), E2(m[2]), 'direct report', long));
      run(`${SUBJ} (?:manages|managed|supervises|supervised|hired) ${OBJ}`, (m) => rel(E2(m[1]), E2(m[2]), 'manager', long));
      run(`${SUBJ} (?:mentors|mentored|coaches|coached|advises|advised) ${OBJ}`, (m) => rel(E2(m[1]), E2(m[2]), 'mentor', long));
      run(`(@\\d+) introduced (?:me|us) to (@\\d+)`, (m) => rel(E2(m[2]), me(), 'acquaintance', `Introduced by ${raws[+m[1].slice(1)]}.` + (long ? ' ' + long : '')) && (E2(m[1]).uses++, true));
      run(`(?:^|\\bI )(?:just |first |recently )?(?:met|know|knew) (@\\d+) (through|via|from|at|in|on|during|when|while|back in|over) ([^,;.]+)`, (m) => rel(E2(m[1]), me(), 'acquaintance', `Met ${m[2]} ${deref(m[3]).trim()}.`));
      run(`(@\\d+) and I (met|go back|grew up|went to school|studied|worked|work|play|played|used to work)`, (m) => {
        const v = m[2];
        const type = /grew/.test(v) ? 'childhood friend' : /school|studied/.test(v) ? 'classmate' : /work/.test(v) ? (/used|worked/.test(v) ? 'former coworker' : 'coworker') : /go back/.test(v) ? 'old friend' : /play/.test(v) ? 'friend' : 'acquaintance';
        return rel(E2(m[1]), me(), type, long);
      });
      run(`${SUBJ} (?:co-?founded|cofounded|started|launched|built) ${ORG} (?:together )?with ${OBJ}`, (m) => {
        const A = E2(m[1]);
        const B = E2(m[3]);
        const org = cleanOrg(deref(m[2]));
        for (const P of [A, B]) if (P) { setField(P, 'company', org); if (!P.title) P.title = 'Co-founder'; }
        return rel(A, B, 'co-founder', long);
      });
      run(`(@\\d+) is (?:a |an )?(friend|colleague|coworker|co-worker|classmate|neighbor|neighbour|roommate|cousin|relative|client|investor) of ${OBJ.replace('|me)', '|me|mine)')}`, (m) => rel(E2(m[1]), m[3] === 'mine' ? me() : E2(m[3]), m[2], long));
      run(`(@\\d+|I) (?:knows?|knew) ${OBJ}`, (m) => rel(E2(m[1]), E2(m[2]), 'acquaintance', long));

      // work
      run(`${SUBJS} (?:now |currently |still |also |both |all )?(?:works?|worked|is working|are working|has worked|working) (?:at|for) ${ORG}(?:,? as (?:a |an |the )?((?:[A-Za-z&\\-]+\\s+){0,4}[A-Za-z&\\-]+))?(?:,? in ${PLACE})?`, (m) => {
        const org = cleanOrg(deref(m[2]));
        let ok = false;
        for (const P of subjList(m[1])) {
          ok = setField(P, 'company', org) || ok;
          if (m[3]) setField(P, 'title', m[3]);
          if (m[4]) setField(P, 'location', deref(m[4]));
        }
        return ok;
      });
      run(`${SUBJ} (?:is|was|am)? ?(?:the |a |an )?((?:[Cc][Ee][Oo]|[Cc][Tt][Oo]|[Cc][Ff][Oo]|[Cc][Oo][Oo]|CMO|CPO|VP|vp|SVP|EVP|[Ff]ounder|[Cc]o-?founder|[Cc]ofounder|[Hh]ead|[Dd]irector|[Pp]resident|[Pp]artner|[Cc]hair|[Oo]wner|[Pp]rincipal|[Mm]anaging [Dd]irector|[Gg]eneral [Pp]artner|GM|[Gg]eneral [Mm]anager)(?: of [A-Za-z ]+?)?) (?:of|at) ${ORG}(?:,? in ${PLACE})?`, (m) => {
        const P = E2(m[1]);
        const title = m[2].replace(/\b(ceo|cto|cfo|coo|cmo|cpo|vp|svp|evp|gm)\b/gi, (x) => x.toUpperCase());
        setField(P, 'title', uc1(title));
        if (m[4]) setField(P, 'location', deref(m[4]));
        return setField(P, 'company', deref(m[3]));
      });
      run(`${SUBJ}(?:,| is| was| am| -| —| –|:)\\s*(?:a |an |the |now |currently )?([^,;:.@]{2,60}?)\\s+(?:at|@)\\s+${ORG}(?:,? in ${PLACE})?`, (m) => {
        const title = m[2].trim();
        if (/\b(my|our|friend|sister|brother|wife|husband|partner|mom|dad|mother|father|cousin|roommate|neighbor|working|based|living|staying|still|back|over)\b/i.test(title)) return false;
        if (title.split(/\s+/).length > 7) return false;
        const P = E2(m[1]);
        setField(P, 'title', uc1(title));
        if (m[4]) setField(P, 'location', deref(m[4]));
        return setField(P, 'company', deref(m[3]));
      });
      run(`${SUBJS} (?:both |all |together |jointly )?(founded|co-?founded|cofounded|run|runs|lead|leads|own|owns|heads|started|chairs) ${ORG}(?:,? in ${PLACE})?`, (m) => {
        const subs = subjList(m[1]);
        const v = m[2].toLowerCase();
        const title = /co-?founded|cofounded/.test(v) || (subs.length > 1 && /founded|started/.test(v)) ? 'Co-founder' : /founded|started/.test(v) ? 'Founder' : /own/.test(v) ? 'Owner' : /chairs/.test(v) ? 'Chair' : '';
        const org = deref(m[3]);
        let ok = false;
        for (const P of subs) {
          if (!P.title && title) P.title = title;
          ok = setField(P, 'company', org) || ok;
          if (m[4]) setField(P, 'location', deref(m[4]));
        }
        if (title === 'Co-founder') for (let i = 1; i < subs.length; i++) rel(subs[i], subs[0], 'co-founder', long);
        return ok;
      });
      run(`(@\\d+|I) (?:is|was|am) (?:a|an) ${TITLEW}(?=\\s*(?:[,.;!]|$)|\\s+(?:and|who|in|based|from|with)\\b)`, (m) => {
        const words = norm(m[2]).split(/\s+/);
        const tail = words[words.length - 1];
        const P = E2(m[1]);
        if (!P) return false;
        if (PERSON_NOUNS.has(tail)) return addTraits(P, [words.slice(0, -1).join(' ')].filter(Boolean)) || false;
        if (inferCat(m[2]) !== 'other' && !TITLE_WORDS.test(m[2])) return false;
        if (PRAISE.has(words[0]) && !TITLE_WORDS.test(m[2])) return addTraits(P, [m[2]]);
        if (P.title) return addTraits(P, [m[2]]);
        return setField(P, 'title', uc1(m[2]));
      });

      // place
      run(`${SUBJS} (?:now |currently |recently |just |also |both |all |still )?(?:lives|live|lived|is living|are living|living|is based|are based|based|resides|is located|has moved|have moved|moved|relocated|is moving|are moving|moving)(?: back| out)? (?:in|to|near|outside(?: of)?|out of) ${PLACE}`, (m) => {
        let ok = false;
        for (const P of subjList(m[1])) ok = setField(P, 'location', deref(m[2])) || ok;
        return ok;
      });
      run(`(@\\d+) is (?:originally )?from ${PLACE}`, (m) => {
        const P = E2(m[1]);
        if (!P) return false;
        if (P.location) { P.details = (P.details ? P.details + ' ' : '') + `Originally from ${deref(m[2])}.`; return true; }
        return setField(P, 'location', deref(m[2]));
      });
      run(`\\bbased (?:in|out of) ${PLACE}`, (m) => (subject ? setField(subject, 'location', deref(m[1])) : false));

      // traits & interests
      run(`\\btraits?:\\s*([^.;\\n]+)`, (m) => addTraits(subject || last, m[1].split(/\s*(?:,|\band\b|\/)\s*/)));
      run(`(@\\d+|I) (?:is|was|'s|seems|seemed|can be|comes across as|am) ((?:(?:very|really|super|so|extremely|incredibly|quite|pretty|always|genuinely|truly|totally) )*${W}(?:(?:,\\s*|,?\\s+and\\s+|,?\\s+but\\s+|\\s*&\\s*)(?:(?:very|really|super|so|extremely|incredibly|quite|pretty) )*${W})*)(?=\\s*(?:[,.;!]|$)|\\s+(?:and|but|who|with|when|about)\\s)`, (m) => {
        const P = E2(m[1]);
        const words = m[2].split(/\s*(?:,|\band\b|\bbut\b|&)\s*/).map((w) => w.trim()).filter(Boolean);
        if (!words.length || NOT_TRAIT.has(words[0].replace(INTENS, '').split(' ')[0])) return false;
        if (words.some((w) => inferCat(w) !== 'other')) return false;
        return addTraits(P, words);
      });
      run(`(?:(@\\d+|I)|\\band)(?: (?:also|really|absolutely))? (loves|likes|enjoys|adores|is into|is obsessed with|is passionate about|is a fan of|is a huge fan of|collects|plays) ([^,.;]+)`, (m) => {
        const P = m[1] ? E2(m[1]) : subject || last;
        if (!P) return false;
        const phrase = `${m[2].replace(/^is /, '')} ${deref(m[3]).trim()}`.trim();
        if (phrase.split(/\s+/).length <= 5) return addTraits(P, [phrase]);
        P.details = (P.details ? P.details + ' ' : '') + uc1(phrase) + '.';
        return true;
      });

      // contacts
      const em = sentence.match(/[\w.+-]+@[\w-]+\.[\w.-]+\w/);
      const ph = sentence.match(/\+?\d[\d\s().-]{7,}\d/);
      const holder = subject || last;
      if (holder && em) { holder.email = em[0]; facts++; }
      if (holder && ph && !/^\d{4}$/.test(ph[0]) && !/^\d{4}-\d{2}-\d{2}$/.test(ph[0].trim())) { holder.phone = ph[0].trim(); facts++; }
      const inSentence = ents.filter((P, i) => P && P !== meEntry && t.includes('@' + i));
      const bm = /\b(?:birthday|bday|b-day|born)\b(?:\s+is|\s+was|\s+on|:)?\s+(?:on\s+)?([A-Za-z]{3,9}\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?|\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?[A-Za-z]{3,9}(?:,?\s+\d{4})?|\d{4}-\d{2}-\d{2}|\d{1,2}[/.]\d{1,2}(?:[/.]\d{2,4})?)/i.exec(sentence);
      if (bm && holder && holder !== meEntry) { const b = parseBirthday(bm[1]); if (b) { holder.birthday = b; facts++; } }
      const tm = /\b(today|this morning|this afternoon|tonight|yesterday|last night)\b/i.exec(sentence);
      if (tm && /\b(met|meet|saw|see|talked|talk|spoke|speak|called|call|had (?:coffee|lunch|dinner|drinks|breakfast|a call|a chat|a meeting)|caught up|catch up|ran into|texted|chatted|visited|hung out|facetimed|grabbed)\b/i.test(sentence)) {
        const when = /yesterday|last night/i.test(tm[1]) ? fromDayNum(todayNum() - 1) : todayStr();
        for (const P of inSentence.length ? inSentence : holder && holder !== meEntry ? [holder] : []) { P.lastContact = when; P.touchNote = sentence.replace(/\s+/g, ' ').trim(); P.uses++; facts++; }
      }
      const cm = /\b(?:keep in touch|stay in touch|catch up|check in|reach out|touch base|remind me)\b[^.]*?\bevery\s+(day|week|other week|two weeks|2 weeks|couple of weeks|month|other month|couple of months|few months|2 months|two months|3 months|three months|quarter|6 months|six months|half year|year)\b/i.exec(sentence);
      if (cm) {
        const w = cm[1].toLowerCase();
        const days = /day|^week/.test(w) ? 7 : /other week|two weeks|2 weeks|couple of weeks/.test(w) ? 14 : /^month/.test(w) ? 30 : /other month|couple of months|2 months|two months/.test(w) ? 60 : /few months|3 months|three months|quarter/.test(w) ? 90 : /6 months|six months|half/.test(w) ? 180 : 365;
        for (const P of inSentence.length ? inSentence : holder && holder !== meEntry ? [holder] : []) { P.cadenceDays = nearestCadence(days); P.uses++; facts++; }
      }

      // anything we couldn't structure goes into notes on the person it's about
      if (!facts) {
        const P = subject || last;
        if (P && P !== meEntry) {
          const clean = sentence.replace(/\s+/g, ' ').trim();
          const sent = /[.!?]$/.test(clean) ? clean : clean + '.';
          if (!norm(P.details).includes(norm(sent))) P.details = (P.details ? P.details + ' ' : '') + sent;
          P.uses++;
        }
      }
      if (subject && subject !== meEntry) last = subject;
    }

    // people the note only mentioned in passing as a company or place are dropped
    for (const e of entries) {
      const hasFacts = e.title || e.company || e.location || e.traits.length || e.details || e.email || e.phone || e.birthday || e.lastContact || e.cadenceDays;
      const inRel = d.rels.some((r) => r.from === e.ref || r.to === e.ref);
      if (e.existingId && !hasFacts) continue;
      if (!hasFacts && !inRel && (e.dead || !e.name.includes(' ') || knownPlaces.has(norm(e.name)))) continue;
      if (e.dead && !hasFacts && !inRel) continue;
      d.people.push(e);
    }
    if (meEntry && (meEntry.title || meEntry.company || meEntry.location || meEntry.traits.length || meEntry.email || meEntry.phone)) d.people.push(meEntry);
    const live = new Set([ME, ...d.people.map((p) => p.ref), ...entries.filter((e) => e.existingId).map((e) => e.ref)]);
    d.rels = d.rels.filter((r) => live.has(r.from) && live.has(r.to));
    for (const r of d.rels) {
      for (const ref of [r.from, r.to]) {
        const e = entries.find((x) => x.ref === ref);
        if (e && !e.existingId && !d.people.includes(e)) d.people.push(e);
      }
    }
    return d;
  }

  function normalizeDraft(raw, note, source) {
    const d = { source, note, people: [], rels: [] };
    const alias = new Map([[ME, ME], ['me', ME], ['p-me', ME]]);
    const ppl = Array.isArray(raw && raw.people) ? raw.people : [];
    for (const x of ppl) {
      if (!x || typeof x !== 'object') continue;
      const ref = str(x.ref || x.id) || 'new' + (d.people.length + 1);
      const name = str(x.name);
      let existing = S.people[ref] ? ref : alias.get(ref) || null;
      if (!existing && name) existing = matchExisting(name);
      if (!existing && !name) continue;
      if (alias.has(ref) && !existing) continue;
      const entry = {
        ref: existing || ref,
        existingId: existing,
        name: existing && existing !== ME ? S.people[existing].name : existing === ME ? '' : name,
        newName: existing && existing !== ME && name && norm(name) !== norm(S.people[existing].name) && norm(name).includes(norm(S.people[existing].name)) ? name : '',
        title: str(x.title),
        company: str(x.company),
        location: str(x.location),
        traits: arr(x.traits),
        details: str(x.details),
        email: str(x.email),
        phone: str(x.phone),
        birthday: parseBirthday(x.birthday) || (/^--\d{2}-\d{2}$/.test(str(x.birthday)) ? str(x.birthday) : ''),
        lastContact: dayNum(str(x.lastContact)) != null && str(x.lastContact).slice(0, 10) <= todayStr() ? str(x.lastContact).slice(0, 10) : '',
        touchNote: str(x.touchNote),
        cadenceDays: nearestCadence(x.cadenceDays),
        include: true,
      };
      if (existing === ME && name) entry.myName = name;
      alias.set(ref, entry.ref);
      if (existing) alias.set(existing, existing);
      if (d.people.some((p) => p.ref === entry.ref)) continue;
      d.people.push(entry);
    }
    const resolve = (x) => {
      x = str(x);
      if (alias.has(x)) return alias.get(x);
      if (S.people[x]) return x;
      return matchExisting(x, true);
    };
    const rels = Array.isArray(raw && raw.relationships) ? raw.relationships : Array.isArray(raw && raw.rels) ? raw.rels : [];
    for (const r of rels) {
      if (!r || typeof r !== 'object') continue;
      const a = resolve(r.from);
      const b = resolve(r.to);
      if (!a || !b || a === b) continue;
      const type = lc1(str(r.type));
      const category = CAT_KEYS.includes(r.category) ? r.category : inferCat(type);
      d.rels.push({ from: a, to: b, type, category, strength: clamp(Math.round(Number(r.strength) || 2), 1, 4), description: str(r.description), include: true });
    }
    const hasFacts = (p) => p.title || p.company || p.location || p.traits.length || p.details || p.email || p.phone || p.newName || p.myName || p.birthday || p.lastContact || p.cadenceDays;
    d.people = d.people.filter((p) => !p.existingId || hasFacts(p));
    return d;
  }

  /* =====================================================================
     On-device answers (used when Claude isn't available)
     ===================================================================== */
  function mentioned(q) {
    const ql = q.toLowerCase();
    const ps = others().filter((p) => p.name);
    const firsts = {};
    const lasts = {};
    for (const p of ps) {
      const parts = norm(p.name).split(/\s+/);
      firsts[parts[0]] = (firsts[parts[0]] || 0) + 1;
      if (parts.length > 1) lasts[parts[parts.length - 1]] = (lasts[parts[parts.length - 1]] || 0) + 1;
    }
    const hits = [];
    for (const p of ps) {
      const parts = norm(p.name).split(/\s+/);
      let idx = wordIndex(ql, norm(p.name));
      if (idx < 0 && parts[0].length >= 2 && firsts[parts[0]] === 1) idx = wordIndex(ql, parts[0]);
      if (idx < 0 && parts.length > 1) {
        const l = parts[parts.length - 1];
        if (l.length >= 3 && lasts[l] === 1) idx = wordIndex(ql, l);
      }
      if (idx >= 0) hits.push({ id: p.id, idx });
    }
    hits.sort((a, b) => a.idx - b.idx);
    return [...new Set(hits.map((x) => x.id))];
  }
  const bold = (id) => (id === ME ? 'You' : `**${nameOf(id)}**`);

  function describePerson(id) {
    const p = S.people[id];
    const lines = [];
    const role = roleLine(p);
    const where = [role, p.location].filter(Boolean).join(', ');
    lines.push(where ? `${bold(id)}: ${where}.` : `${bold(id)} is on your map.`);
    const mine = relsOf(id).filter((r) => r.a === ME || r.b === ME);
    for (const r of mine) lines.push(`${relSentence(r, true)}.${r.description ? ' ' + r.description : ''}`);
    if (!mine.length) {
      const path = bfsPath(ME, id);
      if (path && path.length) lines.push(`You’re connected through ${path.length - 1 === 1 ? nameOf(otherEnd(path[0], ME)) : 'a chain of people'}: ${path.map((r) => relSentence(r, true)).join('; ')}.`);
    }
    if (p.traits && p.traits.length) lines.push(`Traits: ${p.traits.join(', ')}.`);
    if (p.details) lines.push(`Notes: ${p.details}`);
    const tl = touchLine(p);
    if (tl) lines.push(`Keep in touch: ${tl}.`);
    if (p.birthday) lines.push(`Birthday: ${fmtBirthday(p.birthday)}.`);
    const rest = relsOf(id).filter((r) => r.a !== ME && r.b !== ME);
    if (rest.length) {
      lines.push('', 'Their connections:');
      for (const r of rest) lines.push(`- ${relSentence(r, true)}${r.description ? ' — ' + r.description : ''}`);
    }
    if (p.email || p.phone) lines.push('', [p.email, p.phone].filter(Boolean).join(' · '));
    return lines.join('\n');
  }
  function describePair(a, b) {
    const direct = relList().filter((r) => (r.a === a && r.b === b) || (r.a === b && r.b === a));
    const lines = [];
    if (direct.length) {
      for (const r of direct) lines.push(`${relSentence(r, true)} (${STRENGTH[clamp(r.strength || 2, 1, 4) - 1].toLowerCase()}).${r.description ? ' ' + r.description : ''}`);
    } else {
      const path = bfsPath(a, b);
      if (path && path.length) {
        lines.push(`${a === ME ? 'You' : bold(a)} and ${b === ME ? 'you' : bold(b)} aren’t directly connected. The shortest link:`);
        for (const r of path) lines.push(`- ${relSentence(r, true)}`);
      } else {
        lines.push(`${a === ME ? 'You' : bold(a)} and ${b === ME ? 'you' : bold(b)} aren’t connected on your map yet. Drag a thread between them to add how they know each other.`);
      }
    }
    if (a !== ME && b !== ME) {
      const na = new Set(relsOf(a).map((r) => otherEnd(r, a)));
      const mutual = relsOf(b).map((r) => otherEnd(r, b)).filter((x) => na.has(x));
      if (mutual.length) lines.push('', `People they both know: ${[...new Set(mutual)].map((x) => (x === ME ? 'you' : nameOf(x))).join(', ')}.`);
    }
    return lines.join('\n');
  }
  function listPeople(title, ids, sub) {
    if (!ids.length) return '';
    return [`${title} (${ids.length}):`, ...ids.map((id) => `- ${bold(id)}${sub && sub(id) ? ' — ' + sub(id) : ''}`)].join('\n');
  }

  function answerLocal(q) {
    const ps = others();
    if (!ps.length) return 'Your map is empty so far. Add someone with the Add box, for example: “Sarah Chen runs design at Stripe and is my college roommate.”';
    const ql = ' ' + q.toLowerCase().replace(/[?!.]/g, ' ') + ' ';
    const ids = mentioned(q);
    const meToo = /\b(i|me|my|myself|mine)\b/i.test(q);
    if (ids.length >= 2) return describePair(ids[0], ids[1]);
    if (ids.length === 1) {
      if (meToo && /\b(how|connected|link|linked|know|relationship|relate|related|met)\b/.test(ql)) return describePair(ids[0], ME) + '\n\n' + describePerson(ids[0]).split('\n').slice(0, 1).join('');
      return describePerson(ids[0]);
    }
    if (/\b(catch up|catch-up|overdue|reach out|keep in touch|lost touch|haven.?t (talked|spoken|seen|called)|due|follow up|neglect)/.test(ql)) {
      const rows = ps.map((p) => ({ p, i: dueInfo(p) })).filter((r) => r.i).sort((a, b) => a.i.left - b.i.left);
      if (!rows.length) return 'You haven’t set any keep-in-touch reminders yet. Open a person and choose how often you want to catch up.';
      const now2 = rows.filter((r) => r.i.left <= 7);
      const list = now2.length ? now2 : rows.slice(0, 5);
      return [now2.length ? 'Time to catch up:' : 'No one is due this week. Coming up next:', ...list.map((r) => `- ${bold(r.p.id)} — ${touchLine(r.p)}`)].join('\n');
    }
    if (/\bbirthdays?\b/.test(ql)) {
      const rows = ps.map((p) => ({ p, b: birthdayInfo(p) })).filter((r) => r.b).sort((a, b) => a.b.days - b.b.days);
      if (!rows.length) return 'No birthdays saved yet. Add them in a person’s Edit form, or import contacts that have them.';
      return ['Upcoming birthdays:', ...rows.slice(0, 8).map((r) => `- ${bold(r.p.id)} — ${r.b.label.replace(/, \d{4}$/, '')}, ${r.b.days === 0 ? 'today' : relDays(r.b.days)}${r.b.age ? ` (turns ${r.b.age})` : ''}`)].join('\n');
    }
    // a specific relationship type: "who are my cousins", "investors"
    const types = [...new Set(relList().map((r) => norm(r.type)).filter(Boolean))].sort((a, b) => b.length - a.length);
    for (const t of types) {
      if (wordIndex(ql, t) >= 0 || wordIndex(ql, t + 's') >= 0 || wordIndex(ql, singular(t) + 's') >= 0) {
        const rs = relList().filter((r) => norm(r.type) === t && (!meToo || r.a === ME || r.b === ME));
        if (rs.length) return [`${uc1(t)} (${rs.length}):`, ...rs.map((r) => `- ${relSentence(r, true)}${r.description ? ' — ' + r.description : ''}`)].join('\n');
      }
    }
    // companies, places, traits, titles
    const fields = [
      ['company', (v) => `People at ${v}`, (id) => S.people[id].title],
      ['location', (v) => `People in ${v}`, (id) => roleLine(S.people[id])],
    ];
    for (const [f, label, sub] of fields) {
      const vals = [...new Set(ps.map((p) => p[f]).filter(Boolean))].sort((a, b) => b.length - a.length);
      for (const v of vals) {
        const short = v.split(/[,(]/)[0].trim();
        const key = norm(v).split(/[\s,&/()-]+/).find((w) => w.length >= 4 && !ORG_WORDS.has(w) && !NAME_STOP.has(w));
        const hit = wordIndex(ql, v.toLowerCase()) >= 0 || (short.length > 2 && wordIndex(ql, short.toLowerCase()) >= 0) || (f === 'company' && key && wordIndex(ql, key) >= 0);
        if (hit) {
          const hits = ps.filter((p) => norm(p[f]) === norm(v) || norm(p[f]).startsWith(norm(short)) || (f === 'company' && key && norm(p[f]).split(/[\s,&/()-]+/).includes(key))).map((p) => p.id);
          return listPeople(label(v), hits, sub);
        }
      }
    }
    const traits = [...new Set(ps.flatMap((p) => p.traits || []).map(norm))].sort((a, b) => b.length - a.length);
    for (const t of traits) {
      if (t.length > 2 && wordIndex(ql, t) >= 0) {
        const hits = ps.filter((p) => (p.traits || []).some((x) => norm(x) === t)).map((p) => p.id);
        return listPeople(`People you’ve described as “${t}”`, hits, (id) => roleLine(S.people[id]));
      }
    }
    const titleHits = ps.filter((p) => p.title && norm(p.title).split(/[\s,&/-]+/).some((w) => w.length > 2 && (wordIndex(ql, w) >= 0 || wordIndex(ql, w + 's') >= 0)));
    if (titleHits.length) return listPeople('Matching roles', titleHits.map((p) => p.id), (id) => roleLine(S.people[id]));
    // kinds of relationship
    const catWords = { family: /\b(family|relatives?|related)\b/, friend: /\b(friends?|buddies|pals)\b/, work: /\b(work|colleagues?|coworkers?|co-workers?|professional|business|investors?|clients?)\b/, romantic: /\b(partners?|spouses?|dating|married|romantic|couples?)\b/, mentor: /\b(mentors?|mentees?|coach(es)?|advisors?)\b/ };
    for (const [cat, re] of Object.entries(catWords)) {
      if (re.test(ql)) {
        const rs = relList().filter((r) => r.category === cat && (!meToo || r.a === ME || r.b === ME));
        if (!rs.length) return `There are no ${CAT[cat].label.toLowerCase()} connections${meToo ? ' to you' : ''} on your map yet.`;
        return [`${CAT[cat].label} (${rs.length}):`, ...rs.map((r) => `- ${relSentence(r, true)}${r.description ? ' — ' + r.description : ''}`)].join('\n');
      }
    }
    if (/\b(closest|close|best|inner circle|most important|strongest)\b/.test(ql)) {
      const rs = relList().filter((r) => (r.a === ME || r.b === ME) && (r.strength || 2) >= 3).sort((x, y) => (y.strength || 2) - (x.strength || 2));
      if (rs.length) return ['Your closest connections:', ...rs.map((r) => `- ${relSentence(r, true)} (${STRENGTH[(r.strength || 2) - 1].toLowerCase()})`)].join('\n');
    }
    if (/\b(missing|incomplete|no details|without|empty|haven.?t|unknown)\b/.test(ql)) {
      const hits = ps.filter((p) => !p.details && !p.company && !(p.traits || []).length).map((p) => p.id);
      return hits.length ? listPeople('People with almost nothing written about them', hits) : 'Everyone on your map has at least a few details.';
    }
    if (/\b(how many|count|number of|total)\b/.test(ql)) return `Your map has ${plural(ps.length, 'person', 'people')} and ${plural(relList().length, 'connection', 'connections')}.`;
    if (/\b(isolated|not connected|unconnected|alone|no connections)\b/.test(ql)) {
      const hits = ps.filter((p) => !relsOf(p.id).length).map((p) => p.id);
      return hits.length ? listPeople('People with no connections yet', hits) : 'Everyone on your map is connected to someone.';
    }
    // plain keyword search
    const words = (ql.match(/[\p{L}\d][\p{L}\d'’-]{2,}/gu) || []).filter((w) => !NAME_STOP.has(w) && !/^(who|what|whom|where|which|does|tell|show|find|list|anyone|someone|people|person|know|knows)$/.test(w));
    if (words.length) {
      const hay = (p) => norm([p.name, p.title, p.company, p.location, (p.traits || []).join(' '), p.details, relsOf(p.id).map((r) => r.description || '').join(' ')].join(' '));
      const hits = ps.filter((p) => words.some((w) => hay(p).includes(w))).map((p) => p.id);
      if (hits.length) return listPeople(`People whose notes mention “${words.join(' ')}”`, hits, (id) => roleLine(S.people[id]));
    }
    return 'I couldn’t find that on your map. Try asking about a person by name, a company, a city, a trait or a kind of relationship.';
  }

  /* =====================================================================
     Map rendering
     ===================================================================== */
  const nodeEls = new Map();
  const edgeEls = new Map();
  const curve = new Map();

  function fillNode(el, p) {
    const isMe = p.id === ME;
    const av = h('div', { class: 'av', style: `--h:${hueOf(p.name || p.id)}` }, p.photo ? h('img', { src: p.photo, alt: '', draggable: 'false' }) : isMe ? 'You' : initials(p.name));
    const label = isMe ? 'You' : p.name || 'Unnamed';
    const knob = h('button', { class: 'knob', type: 'button', 'data-id': p.id, tabindex: '-1', 'aria-label': `Connect ${isMe ? 'yourself' : label} to someone`, title: 'Drag onto someone to connect' }, icon('link', 14));
    const sub = isMe ? p.name || '' : p.company || p.title || p.location || '';
    const ds = dueState(p);
    const ring = ds ? h('span', { class: 'ring ' + ds, title: ds === 'due' ? 'Time to catch up' : 'Birthday coming up' }) : '';
    el.classList.toggle('is-due', ds === 'due');
    el.replaceChildren(ring, av, knob, h('div', { class: 'nm' }, label), sub ? h('div', { class: 'sub' }, sub) : '');
    el.setAttribute('aria-label', isMe ? 'You' : label);
  }
  function renderNodes() {
    const seen = new Set();
    for (const p of peopleList()) {
      seen.add(p.id);
      let el = nodeEls.get(p.id);
      if (!el) {
        el = h('div', { class: 'node' + (p.id === ME ? ' me' : ''), 'data-id': p.id });
        if (S.loadedOnce) {
          el.classList.add('new');
          setTimeout(() => el.classList.remove('new'), 700);
        }
        nodeEls.set(p.id, el);
        E.nodes.append(el);
        el._sig = null;
      }
      const sig = [p.name, p.company, p.title, p.location, p.photo ? p.photo.length + p.photo.slice(-24) : '', dueState(p)].join('|');
      if (el._sig !== sig) { el._sig = sig; fillNode(el, p); }
      el.style.transform = nodeTf(pos(p.id));
    }
    for (const [id, el] of nodeEls) if (!seen.has(id)) { el.remove(); nodeEls.delete(id); }
    const empty = !others().length;
    const meEl = nodeEls.get(ME);
    if (meEl) meEl.classList.toggle('pulse', empty && S.ready);
  }
  function geom(r) {
    const A = pos(r.a);
    const B = pos(r.b);
    const c = curve.get(r.id) || { i: 0, n: 1 };
    const [P, Q] = r.a < r.b ? [A, B] : [B, A];
    const dx = Q.x - P.x;
    const dy = Q.y - P.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const bend = c.n === 1 ? Math.min(len * 0.06, 36) : (c.i - (c.n - 1) / 2) * 54 + Math.min(len * 0.04, 20);
    const cx = (P.x + Q.x) / 2 + nx * bend * 2;
    const cy = (P.y + Q.y) / 2 + ny * bend * 2;
    const f = (v) => v.toFixed(1);
    return { d: `M${f(A.x)} ${f(A.y)}Q${f(cx)} ${f(cy)} ${f(B.x)} ${f(B.y)}`, mx: (P.x + 2 * cx + Q.x) / 4, my: (P.y + 2 * cy + Q.y) / 4, A, B, cx, cy };
  }
  function layoutLabels() {
    const placed = [];
    const dots = peopleList().map((p) => pos(p.id));
    const rad = 34 * S.ns;
    const inter = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    const rels = relList().sort((x, y) => (y.strength || 2) - (x.strength || 2) || (x.createdAt || 0) - (y.createdAt || 0));
    for (const r of rels) {
      const e = edgeEls.get(r.id);
      if (!e || e.label.hidden) continue;
      if (!e.w) e.w = e.label.offsetWidth || 90;
      const g = geom(r);
      let best = null;
      for (const t of [0.5, 0.4, 0.6, 0.31, 0.69, 0.24, 0.76]) {
        const u = 1 - t;
        const x = u * u * g.A.x + 2 * u * t * g.cx + t * t * g.B.x;
        const y = u * u * g.A.y + 2 * u * t * g.cy + t * t * g.B.y;
        const box = { x: x - e.w / 2 - 3, y: y - 14, w: e.w + 6, h: 28 };
        let score = Math.abs(t - 0.5) * 60;
        for (const b of placed) score += inter(box, b) / 8;
        for (const d of dots) score += inter(box, { x: d.x - rad, y: d.y - rad, w: rad * 2, h: rad * 2 + 30 }) / 5;
        if (!best || score < best.score) best = { score, x, y, box };
        if (score === 0) break;
      }
      placed.push(best.box);
      e.label.style.transform = `translate(${best.x.toFixed(1)}px, ${best.y.toFixed(1)}px) translate(-50%, -50%)`;
    }
  }
  function placeEdge(r, e) {
    const g = geom(r);
    e.line.setAttribute('d', g.d);
    e.hit.setAttribute('d', g.d);
    e.label.style.transform = `translate(${g.mx.toFixed(1)}px, ${g.my.toFixed(1)}px) translate(-50%, -50%)`;
  }
  function renderEdges() {
    const groups = new Map();
    for (const r of relList()) {
      const k = r.a < r.b ? r.a + '|' + r.b : r.b + '|' + r.a;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(r);
    }
    curve.clear();
    for (const list of groups.values()) {
      list.sort((x, y) => (x.createdAt || 0) - (y.createdAt || 0) || (x.id < y.id ? -1 : 1));
      list.forEach((r, i) => curve.set(r.id, { i, n: list.length }));
    }
    const seen = new Set();
    for (const r of relList()) {
      seen.add(r.id);
      let e = edgeEls.get(r.id);
      if (!e) {
        const g = document.createElementNS(SVGNS, 'g');
        const line = document.createElementNS(SVGNS, 'path');
        const hit = document.createElementNS(SVGNS, 'path');
        line.setAttribute('class', 'line');
        hit.setAttribute('class', 'hit');
        g.append(line, hit);
        g.dataset.rel = r.id;
        E.edgeG.append(g);
        const label = h('button', { class: 'elabel', type: 'button', 'data-rel': r.id, tabindex: '-1' });
        E.labels.append(label);
        e = { g, line, hit, label, sig: '', born: S.loadedOnce };
        edgeEls.set(r.id, e);
      }
      const cat = CAT_KEYS.includes(r.category) ? r.category : 'other';
      const st = clamp(r.strength || 2, 1, 4);
      const sig = [cat, st, r.type || '', nameOf(r.a), nameOf(r.b)].join('|');
      if (e.sig !== sig) {
        e.sig = sig;
        e.g.setAttribute('class', `edge cat-${cat} s-${st}`);
        e.label.className = `elabel cat-${cat}`;
        e.label.replaceChildren(h('i'), uc1((r.type || '').trim()));
        e.label.hidden = !(r.type || '').trim();
        e.label.setAttribute('aria-label', relSentence(r));
        e.w = 0;
      }
      placeEdge(r, e);
      if (e.born && !reduceMotion()) {
        e.born = false;
        const len = Math.ceil(e.line.getTotalLength ? e.line.getTotalLength() : 300);
        e.g.style.setProperty('--len', len);
        e.g.classList.add('born');
        setTimeout(() => e.g.classList.remove('born'), 900);
      }
    }
    for (const [id, e] of edgeEls) if (!seen.has(id)) { e.g.remove(); e.label.remove(); edgeEls.delete(id); }
    layoutLabels();
  }
  function renderPositions() {
    for (const [id, el] of nodeEls) el.style.transform = nodeTf(pos(id));
    for (const r of relList()) {
      const e = edgeEls.get(r.id);
      if (e) placeEdge(r, e);
    }
  }
  function moveNode(id) {
    const el = nodeEls.get(id);
    if (el) el.style.transform = nodeTf(pos(id));
    for (const r of relList()) {
      if (r.a !== id && r.b !== id) continue;
      const e = edgeEls.get(r.id);
      if (e) placeEdge(r, e);
    }
  }
  function applyFocus() {
    const sel = S.selected && S.people[S.selected] ? S.selected : null;
    const selRel = !sel && S.selRel && S.rels[S.selRel] ? S.selRel : null;
    const f = S.filter;
    const focus = !!(sel || selRel || f !== 'all');
    const lit = new Set();
    for (const r of relList()) {
      const e = edgeEls.get(r.id);
      if (!e) continue;
      let on = f === 'all' || r.category === f;
      if (sel) on = on && (r.a === sel || r.b === sel);
      if (selRel) on = r.id === selRel;
      e.g.classList.toggle('dim', !on);
      e.label.classList.toggle('dim', !on);
      e.g.classList.toggle('hot', on && !!(sel || selRel));
      if (on) { lit.add(r.a); lit.add(r.b); }
    }
    if (sel) lit.add(sel);
    for (const [id, el] of nodeEls) {
      el.classList.toggle('dim', focus && !lit.has(id));
      el.classList.toggle('sel', id === sel);
    }
  }
  function renderFilters() {
    const rels = relList();
    const counts = {};
    for (const r of rels) counts[r.category] = (counts[r.category] || 0) + 1;
    E.app.classList.toggle('has-filters', !!rels.length);
    if (!rels.length) { E.filters.replaceChildren(); S.filter = 'all'; return; }
    if (S.filter !== 'all' && !counts[S.filter]) S.filter = 'all';
    const chips = [h('button', { class: 'chip glass', type: 'button', 'aria-pressed': String(S.filter === 'all'), onclick: () => setFilter('all') }, 'All', h('span', { class: 'n' }, rels.length))];
    for (const c of CATS) {
      if (!counts[c.key]) continue;
      chips.push(h('button', { class: `chip glass cat-${c.key}`, type: 'button', 'aria-pressed': String(S.filter === c.key), onclick: () => setFilter(S.filter === c.key ? 'all' : c.key) }, h('i'), c.label, h('span', { class: 'n' }, counts[c.key])));
    }
    E.filters.replaceChildren(...chips);
  }
  function setFilter(f) {
    S.filter = f;
    renderFilters();
    applyFocus();
  }
  function renderChrome() {
    const n = others().length;
    const m = relList().length;
    E.stats.textContent = `${plural(n, 'person', 'people')} · ${plural(m, 'connection', 'connections')}`;
    E.empty.hidden = !(S.ready && n === 0);
    syncBadge();
    renderTouchBadge();
    renderDueBanner();
  }
  function render() {
    renderNodes();
    renderEdges();
    renderFilters();
    renderChrome();
    applyFocus();
  }
  function onData() {
    S.version++;
    nameRe = null;
    render();
    refreshSheet();
  }

  /* =====================================================================
     Camera
     ===================================================================== */
  let viewSaveT = 0;
  function applyView() {
    const { x, y, k } = S.view;
    E.world.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${k})`;
    let g = 24 * k;
    while (g < 13) g *= 2;
    while (g > 52) g /= 2;
    E.stage.style.backgroundSize = `${g}px ${g}px`;
    E.stage.style.backgroundPosition = `${x}px ${y}px`;
    E.world.classList.toggle('far', k < 0.6);
    const ns = Math.round(clamp(0.74 / k, 1, 2.5) * 50) / 50;
    if (ns !== S.ns) {
      S.ns = ns;
      for (const [id, el] of nodeEls) el.style.transform = nodeTf(pos(id));
    }
  }
  function saveViewSoon() {
    clearTimeout(viewSaveT);
    viewSaveT = setTimeout(() => lsSet('kith.view', JSON.stringify(S.view)), 400);
  }
  function stageRect() { return E.stage.getBoundingClientRect(); }
  function zoomAt(sx, sy, factor) {
    const k2 = clamp(S.view.k * factor, K_MIN, K_MAX);
    const f = k2 / S.view.k;
    S.view.x = sx - (sx - S.view.x) * f;
    S.view.y = sy - (sy - S.view.y) * f;
    S.view.k = k2;
    applyView();
    saveViewSoon();
  }
  function toWorld(cx, cy) {
    const r = stageRect();
    return { x: (cx - r.left - S.view.x) / S.view.k, y: (cy - r.top - S.view.y) / S.view.k };
  }
  function visibleRect() {
    const r = stageRect();
    let top = E.filters.childElementCount && !(sheetIsOpen() && !isWide()) ? 112 : 74;
    let bottom = r.height - (E.composer.offsetHeight || 96) - 22;
    let right = r.width;
    if (sheetIsOpen()) {
      if (isWide()) right -= 428;
      else bottom = r.height - E.sheet.offsetHeight - 10;
    }
    if (!E.empty.hidden) bottom = Math.min(bottom, r.height - E.empty.offsetHeight - 170);
    if (bottom - top < 140) top = Math.max(10, bottom - 140);
    const left = isWide() ? 20 : 0;
    return { left, top, right, bottom, w: right - left, h: bottom - top };
  }
  let tween = 0;
  function stopTween() { cancelAnimationFrame(tween); tween = 0; }
  function animateView(to, ms = 480) {
    stopTween();
    if (reduceMotion() || ms === 0) { S.view = { ...to }; applyView(); saveViewSoon(); return; }
    const from = { ...S.view };
    const t0 = performance.now();
    const step = (t) => {
      const u = clamp((t - t0) / ms, 0, 1);
      const e = 1 - Math.pow(1 - u, 3);
      S.view = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, k: from.k + (to.k - from.k) * e };
      applyView();
      if (u < 1) tween = requestAnimationFrame(step);
      else { tween = 0; saveViewSoon(); }
    };
    tween = requestAnimationFrame(step);
  }
  function frame(ids, { maxK = 1.15, minK = 0.3, ms = 480 } = {}) {
    const ps = ids.map((id) => S.people[id]).filter(Boolean);
    if (!ps.length) return;
    const vr = visibleRect();
    const box = (sc) => {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const p of ps) {
        const q = pos(p.id);
        x0 = Math.min(x0, q.x - 90 * sc); x1 = Math.max(x1, q.x + 90 * sc);
        y0 = Math.min(y0, q.y - 46 * sc); y1 = Math.max(y1, q.y + 78 * sc);
      }
      return [x0, y0, x1, y1];
    };
    let [x0, y0, x1, y1] = box(1);
    let k = clamp(Math.min(vr.w / (x1 - x0), vr.h / (y1 - y0)), minK, maxK);
    const sc = clamp(0.74 / k, 1, 2.5);
    if (sc > 1) {
      [x0, y0, x1, y1] = box(sc);
      k = clamp(Math.min(vr.w / (x1 - x0), vr.h / (y1 - y0)), minK, maxK);
    }
    animateView({ k, x: vr.left + vr.w / 2 - ((x0 + x1) / 2) * k, y: vr.top + vr.h / 2 - ((y0 + y1) / 2) * k }, ms);
  }
  const fitAll = (ms) => frame(Object.keys(S.people), { ms });
  function ensureVisible(id, ms = 420) {
    const p = S.people[id];
    if (!p) return;
    const vr = visibleRect();
    const q = pos(id);
    const sx = q.x * S.view.k + S.view.x;
    const sy = q.y * S.view.k + S.view.y;
    const pad = 90;
    if (sx > vr.left + pad && sx < vr.right - pad && sy > vr.top + pad && sy < vr.bottom - pad) return;
    const k = clamp(S.view.k, 0.55, 1.4);
    animateView({ k, x: vr.left + vr.w / 2 - q.x * k, y: vr.top + vr.h / 2 - q.y * k }, ms);
  }
  function centerOn(id) {
    const q = pos(id);
    const vr = visibleRect();
    const k = clamp(Math.max(S.view.k, 0.95), 0.5, 1.3);
    animateView({ k, x: vr.left + vr.w / 2 - q.x * k, y: vr.top + vr.h / 2 - q.y * k });
  }
  function viewCenter() {
    const vr = visibleRect();
    return { x: (vr.left + vr.w / 2 - S.view.x) / S.view.k, y: (vr.top + vr.h / 2 - S.view.y) / S.view.k };
  }
  function segDist(x, y, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy || 1;
    const t = clamp(((x - x1) * dx + (y - y1) * dy) / l2, 0, 1);
    return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
  }
  function freeSpot(ax, ay, taken = []) {
    const pts = peopleList().filter((p) => Number.isFinite(p.x)).map((p) => [pos(p.id).x, pos(p.id).y]).concat(taken);
    const segs = relList().map((r) => [pos(r.a).x, pos(r.a).y, pos(r.b).x, pos(r.b).y]).filter((q) => q.every(Number.isFinite));
    const cx = avg(pts.map((q) => q[0]));
    const cy = avg(pts.map((q) => q[1]));
    const away = Math.atan2(ay - cy, ax - cx);
    const outward = pts.length > 2 && Math.hypot(ax - cx, ay - cy) > 40;
    for (let r = 190; r < 2600; r += 55) {
      const steps = Math.max(12, Math.round((2 * Math.PI * r) / 60));
      let best = null;
      for (let i = 0; i < steps; i++) {
        const a = (i * 2 * Math.PI) / steps + r;
        const x = ax + r * Math.cos(a);
        const y = ay + r * Math.sin(a) * 0.85;
        let dn = Infinity;
        for (const [px, py] of pts) dn = Math.min(dn, Math.hypot(px - x, (py - y) * 1.2));
        if (dn < 175) continue;
        let de = Infinity;
        for (const q of segs) de = Math.min(de, segDist(x, y, ...q));
        if (de < 64) continue;
        const score = Math.min(dn, 420) + Math.min(de, 220) * 0.6 + (outward ? Math.cos(a - away) * 140 : 0);
        if (!best || score > best.score) best = { score, x, y };
      }
      if (best) return { x: Math.round(best.x), y: Math.round(best.y) };
    }
    return { x: Math.round(ax + (Math.random() - 0.5) * 400), y: Math.round(ay + (Math.random() - 0.5) * 300) };
  }

  /* =====================================================================
     Pointer: pan, pinch, drag people, drag threads between people
     ===================================================================== */
  const ptrs = new Map();
  let G = null;

  function nodeAt(cx, cy, exclude) {
    const w = toWorld(cx, cy);
    let best = null;
    let bestD = Math.max(44 * S.ns, 30 / S.view.k);
    for (const p of peopleList()) {
      if (p.id === exclude) continue;
      const q = pos(p.id);
      const d = Math.hypot(q.x - w.x, q.y - w.y - 8);
      if (d < bestD) { best = p.id; bestD = d; }
    }
    return best;
  }
  let dropEl = null;
  function setDropTarget(id) {
    const el = id ? nodeEls.get(id) : null;
    if (el === dropEl) return;
    if (dropEl) dropEl.classList.remove('drop');
    dropEl = el;
    if (el) el.classList.add('drop');
  }
  function drawGhost(from, cx, cy) {
    const a = pos(from);
    const target = nodeAt(cx, cy, from);
    const b = target ? pos(target) : toWorld(cx, cy);
    E.ghost.setAttribute('d', `M${a.x} ${a.y}L${b.x} ${b.y}`);
    setDropTarget(target);
  }
  function startPinch() {
    if (G && G.type === 'node' && G.moved) finishNodeDrag(G, false);
    if (G && G.type === 'connect') { E.ghost.style.display = 'none'; setDropTarget(null); }
    const [a, b] = [...ptrs.values()];
    G = { type: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, c0: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, view: { ...S.view } };
  }
  function movePinch() {
    const [a, b] = [...ptrs.values()];
    if (!a || !b) return;
    const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    const c = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const r = stageRect();
    const k = clamp((G.view.k * d) / G.d0, K_MIN, K_MAX);
    const wx = (G.c0.x - r.left - G.view.x) / G.view.k;
    const wy = (G.c0.y - r.top - G.view.y) / G.view.k;
    S.view = { k, x: c.x - r.left - wx * k, y: c.y - r.top - wy * k };
    applyView();
  }
  function finishNodeDrag(g, cancelled) {
    g.el.classList.remove('dragging');
    const o = S.override.get(g.id);
    S.override.delete(g.id);
    if (o && !cancelled) savePerson({ ...S.people[g.id], x: Math.round(o.x), y: Math.round(o.y) });
    moveNode(g.id);
    layoutLabels();
  }
  function onDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 1) return;
    hideHint();
    if (document.activeElement && document.activeElement !== document.body && E.app.contains(document.activeElement) && !E.sheet.contains(document.activeElement)) document.activeElement.blur();
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { E.stage.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    if (ptrs.size === 2) { startPinch(); return; }
    if (ptrs.size > 2) return;
    stopTween();
    const t = e.target;
    const base = { sx: e.clientX, sy: e.clientY, moved: false, pid: e.pointerId };
    const knob = t.closest && t.closest('.knob');
    const node = t.closest && t.closest('.node');
    const rel = t.closest && t.closest('[data-rel]');
    if (e.button === 1) G = { ...base, type: 'pan', view: { ...S.view } };
    else if (knob) G = { ...base, type: 'connect', from: knob.dataset.id };
    else if (node) {
      const id = node.dataset.id;
      const p = S.people[id];
      G = { ...base, type: 'node', id, ox: p.x, oy: p.y, el: node };
    } else if (rel) G = { ...base, type: 'edge', id: rel.dataset.rel, view: { ...S.view } };
    else G = { ...base, type: 'pan', view: { ...S.view } };
  }
  function onMove(e) {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (G && G.type === 'pinch') { movePinch(); return; }
    if (!G || e.pointerId !== G.pid) return;
    const dx = e.clientX - G.sx;
    const dy = e.clientY - G.sy;
    if (!G.moved && Math.hypot(dx, dy) > (e.pointerType === 'touch' ? 9 : 4)) {
      G.moved = true;
      if (G.type === 'edge') G.type = 'pan';
      if (G.type === 'pan') E.stage.classList.add('grabbing');
      if (G.type === 'node') G.el.classList.add('dragging');
      if (G.type === 'connect') E.ghost.style.display = '';
    }
    if (!G.moved) return;
    if (G.type === 'pan') {
      S.view.x = G.view.x + dx;
      S.view.y = G.view.y + dy;
      applyView();
    } else if (G.type === 'node') {
      S.override.set(G.id, { x: G.ox + dx / S.view.k, y: G.oy + dy / S.view.k });
      moveNode(G.id);
    } else if (G.type === 'connect') {
      drawGhost(G.from, e.clientX, e.clientY);
    }
  }
  function onUp(e, lost) {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.delete(e.pointerId);
    const cancelled = lost === true || e.type === 'pointercancel';
    if (G && G.type === 'pinch') {
      if (ptrs.size < 2) { G = null; saveViewSoon(); }
      return;
    }
    if (!G || e.pointerId !== G.pid) return;
    const g = G;
    G = null;
    E.stage.classList.remove('grabbing');
    if (g.type === 'pan') {
      if (g.moved) saveViewSoon();
      else if (!cancelled) tapEmpty();
    } else if (g.type === 'node') {
      if (g.moved) finishNodeDrag(g, cancelled);
      else if (!cancelled) selectPerson(g.id, { open: true });
    } else if (g.type === 'connect') {
      E.ghost.style.display = 'none';
      setDropTarget(null);
      if (cancelled) return;
      if (!g.moved) { openSheet('pick', { from: g.from }, { root: true }); return; }
      const target = nodeAt(e.clientX, e.clientY, g.from);
      if (target) {
        try { navigator.vibrate && navigator.vibrate(12); } catch { /* ignore */ }
        S.selected = null;
        S.selRel = null;
        applyFocus();
        openSheet('relEdit', { a: g.from, b: target, fresh: true }, { root: true });
      } else toast('Let go on top of a person to connect them.');
    } else if (g.type === 'edge') {
      if (!cancelled) openRel(g.id);
    }
  }
  function tapEmpty() {
    if (sheetIsOpen()) closeSheet();
    else if (S.selected || S.selRel) { S.selected = null; S.selRel = null; applyFocus(); }
  }
  function onWheel(e) {
    e.preventDefault();
    stopTween();
    const r = stageRect();
    const sx = e.clientX - r.left;
    const sy = e.clientY - r.top;
    let dx = e.deltaX;
    let dy = e.deltaY;
    if (e.deltaMode === 1) { dx *= 16; dy *= 16; }
    const wheelMouse = e.deltaMode === 1 || (dx === 0 && Math.abs(dy) >= 50 && Number.isInteger(dy));
    if (e.ctrlKey || e.metaKey || wheelMouse) zoomAt(sx, sy, Math.exp(-dy * (e.ctrlKey ? 0.011 : 0.0019)));
    else {
      S.view.x -= dx;
      S.view.y -= dy;
      applyView();
      saveViewSoon();
    }
  }

  function selectPerson(id, { open = false, center = false, push = false } = {}) {
    S.selected = id;
    S.selRel = null;
    applyFocus();
    if (open) openSheet('person', { id }, push ? {} : { root: true });
    requestAnimationFrame(() => requestAnimationFrame(() => (center ? centerOn(id) : ensureVisible(id))));
    if (open && !lsGet('kith.tip.knob') && relList().length < 3) {
      lsSet('kith.tip.knob', '1');
      setTimeout(() => toast(finePointer ? 'Tip: hover a person and drag the black knob onto someone else to connect them.' : 'Tip: drag the black knob on a photo onto someone else to connect them.', { ms: 6000 }), 900);
    }
  }
  function openRel(id, push = false) {
    S.selRel = id;
    S.selected = null;
    applyFocus();
    openSheet('rel', { id }, push ? {} : { root: true });
    const r = S.rels[id];
    if (r) requestAnimationFrame(() => requestAnimationFrame(() => {
      const vr = visibleRect();
      const off = [r.a, r.b].some((x) => {
        const q = pos(x);
        const sx = q.x * S.view.k + S.view.x;
        const sy = q.y * S.view.k + S.view.y;
        return sx < vr.left + 50 || sx > vr.right - 50 || sy < vr.top + 50 || sy > vr.bottom - 50;
      });
      if (off) frame([r.a, r.b], { maxK: Math.max(S.view.k, 0.7) });
    }));
  }

  /* =====================================================================
     Tidy layout — force-directed, seeded from where people are now
     ===================================================================== */
  function tidy() {
    const ids = Object.keys(S.people);
    if (ids.length < 2) return;
    const P = new Map(ids.map((id, i) => [id, { x: S.people[id].x + Math.cos(i) * 0.5, y: S.people[id].y + Math.sin(i) * 0.5, dx: 0, dy: 0 }]));
    const list = [...P.values()];
    const rels = relList();
    const L = 235;
    let temp = L;
    for (let it = 0; it < 600; it++) {
      for (const a of list) { a.dx = 0; a.dy = 0; }
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i];
          const b = list[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.max(Math.hypot(dx, dy), 8);
          const f = (L * L) / d;
          a.dx += (dx / d) * f; a.dy += (dy / d) * f;
          b.dx -= (dx / d) * f; b.dy -= (dy / d) * f;
        }
      }
      for (const r of rels) {
        const a = P.get(r.a);
        const b = P.get(r.b);
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.max(Math.hypot(dx, dy), 1);
        const f = (d * d) / L;
        a.dx -= (dx / d) * f; a.dy -= (dy / d) * f;
        b.dx += (dx / d) * f; b.dy += (dy / d) * f;
      }
      if (it > 300 && list.length < 260) {
        for (const r of rels) {
          const a = P.get(r.a);
          const b = P.get(r.b);
          for (const [id, c] of P) {
            if (id === r.a || id === r.b) continue;
            const vx = b.x - a.x;
            const vy = b.y - a.y;
            const l2 = vx * vx + vy * vy || 1;
            const u = clamp(((c.x - a.x) * vx + (c.y - a.y) * vy) / l2, 0, 1);
            const px = a.x + u * vx;
            const py = a.y + u * vy;
            const d = Math.hypot(c.x - px, c.y - py) || 0.01;
            if (d > 95 || u <= 0 || u >= 1) continue;
            const f = ((95 - d) / 95) * L * 2.2;
            c.dx += ((c.x - px) / d) * f; c.dy += ((c.y - py) / d) * f;
            a.dx -= ((c.x - px) / d) * f * 0.25; a.dy -= ((c.y - py) / d) * f * 0.25;
            b.dx -= ((c.x - px) / d) * f * 0.25; b.dy -= ((c.y - py) / d) * f * 0.25;
          }
        }
      }
      const mx = avg(list.map((a) => a.x));
      const my = avg(list.map((a) => a.y));
      for (const a of list) {
        a.dx -= (a.x - mx) * 0.16;
        a.dy -= (a.y - my) * 0.16;
        const len = Math.hypot(a.dx, a.dy) || 1;
        const step = Math.min(len, temp);
        a.x += (a.dx / len) * step;
        a.y += (a.dy / len) * step;
      }
      temp = Math.max(1, temp * 0.986);
    }
    for (let it = 0; it < 80; it++) {
      let moved = false;
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i];
          const b = list[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy) || 0.01;
          if (d >= 175) continue;
          const push = (175 - d) / 2;
          a.x += (dx / d) * push; a.y += (dy / d) * push;
          b.x -= (dx / d) * push; b.y -= (dy / d) * push;
          moved = true;
        }
      }
      if (!moved) break;
    }
    // turn the longest axis of the map to match the screen, and keep you where you were
    const mx = avg(list.map((a) => a.x));
    const my = avg(list.map((a) => a.y));
    let sxx = 0, syy = 0, sxy = 0;
    for (const a of list) { sxx += (a.x - mx) ** 2; syy += (a.y - my) ** 2; sxy += (a.x - mx) * (a.y - my); }
    const axis = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    const vr = visibleRect();
    const rot = (vr.w >= vr.h ? 0 : Math.PI / 2) - axis;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    for (const a of list) {
      const x = a.x - mx;
      const y = a.y - my;
      a.x = x * cos - y * sin;
      a.y = x * sin + y * cos;
    }
    const me = P.get(ME);
    const home = S.people[ME];
    const ox = home.x - me.x;
    const oy = home.y - me.y;
    for (const a of list) { a.x += ox; a.y += oy; }
    const from = new Map(ids.map((id) => [id, { x: S.people[id].x, y: S.people[id].y }]));
    const t0 = performance.now();
    const ms = reduceMotion() ? 0 : 700;
    const step = (t) => {
      const u = ms ? clamp((t - t0) / ms, 0, 1) : 1;
      const e = 1 - Math.pow(1 - u, 3);
      for (const id of ids) {
        const a = from.get(id);
        const b = P.get(id);
        S.override.set(id, { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e });
      }
      renderPositions();
      if (u < 1) requestAnimationFrame(step);
      else {
        S.override.clear();
        for (const id of ids) {
          const b = P.get(id);
          const p = S.people[id];
          if (Math.hypot(p.x - b.x, p.y - b.y) > 2) savePerson({ ...p, x: Math.round(b.x), y: Math.round(b.y) });
        }
        render();
        fitAll();
      }
    };
    requestAnimationFrame(step);
  }

  /* =====================================================================
     Sheet / side panel
     ===================================================================== */
  const Sheet = { stack: [] };
  const VIEWS = {};
  const sheetIsOpen = () => !E.sheet.hidden && !E.sheet.classList.contains('away');

  function openSheet(view, args = {}, { root = false, replace = false } = {}) {
    if (root) {
      Sheet.stack = [];
      if (!['person', 'rel', 'relEdit', 'pick', 'personEdit'].includes(view) && (S.selected || S.selRel)) {
        S.selected = null;
        S.selRel = null;
        applyFocus();
      }
    }
    else if (replace) Sheet.stack.pop();
    Sheet.stack.push({ view, args });
    renderSheet(true);
  }
  function renderSheet(fresh) {
    const top = Sheet.stack[Sheet.stack.length - 1];
    if (!top) { closeSheet(); return; }
    const out = VIEWS[top.view](top.args);
    if (!out) {
      Sheet.stack.pop();
      if (Sheet.stack.length) renderSheet(true);
      else closeSheet();
      return;
    }
    const scroll = E.sheetBody.scrollTop;
    E.sheetTitle.textContent = out.title || '';
    E.sheetBody.replaceChildren(out.body);
    if (out.foot) { E.sheetFoot.replaceChildren(out.foot); E.sheetFoot.hidden = false; }
    else { E.sheetFoot.replaceChildren(); E.sheetFoot.hidden = true; }
    E.sheetBack.hidden = Sheet.stack.length < 2;
    E.sheet.classList.toggle('peek', out.size === 'peek');
    E.sheetBody.scrollTop = fresh ? 0 : scroll;
    showSheet();
    if (out.after) requestAnimationFrame(() => out.after());
  }
  function refreshSheet() {
    if (!sheetIsOpen()) return;
    const top = Sheet.stack[Sheet.stack.length - 1];
    if (!top || !VIEWS[top.view].live) return;
    const a = document.activeElement;
    if (a && E.sheet.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
    renderSheet(false);
  }
  VIEWS.person = (a) => VIEW_PERSON(a);
  function showSheet() {
    const wasOpen = sheetIsOpen();
    E.sheet.hidden = false;
    E.app.classList.add('sheet-open');
    E.app.classList.toggle('panel', isWide());
    if (!wasOpen) {
      void E.sheet.offsetHeight;
      E.sheet.classList.remove('away');
    }
    hideHint();
  }
  function closeSheet() {
    if (E.sheet.hidden) return;
    Sheet.stack = [];
    E.sheet.classList.add('away');
    E.app.classList.remove('sheet-open', 'panel');
    S.selected = null;
    S.selRel = null;
    applyFocus();
    stopDictation(true);
    const done = () => { if (E.sheet.classList.contains('away')) E.sheet.hidden = true; };
    if (reduceMotion()) done();
    else setTimeout(done, 380);
    if (document.activeElement && E.sheet.contains(document.activeElement)) document.activeElement.blur();
  }
  function sheetBack() {
    Sheet.stack.pop();
    const top = Sheet.stack[Sheet.stack.length - 1];
    if (!top) { closeSheet(); return; }
    if (top.view === 'person') { S.selected = top.args.id; S.selRel = null; applyFocus(); }
    if (top.view === 'rel') { S.selRel = top.args.id; S.selected = null; applyFocus(); }
    renderSheet(true);
  }

  // drag the sheet down to dismiss it (phones)
  function wireSheetDrag() {
    let d = null;
    const start = (e) => {
      if (isWide() || e.target.closest('button')) return;
      d = { y: e.clientY, id: e.pointerId, dy: 0 };
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      E.sheet.classList.add('dragging');
    };
    const move = (e) => {
      if (!d || e.pointerId !== d.id) return;
      d.dy = e.clientY - d.y;
      E.sheet.style.transform = `translateY(${d.dy > 0 ? d.dy : d.dy / 4}px)`;
    };
    const end = (e) => {
      if (!d || e.pointerId !== d.id) return;
      E.sheet.classList.remove('dragging');
      E.sheet.style.transform = '';
      if (d.dy > 90) closeSheet();
      else if (d.dy < -40) E.sheet.classList.remove('peek');
      d = null;
    };
    for (const el of [E.sheetGrab, E.sheetHead]) {
      el.addEventListener('pointerdown', start);
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
    }
  }

  /* ---------- person ---------- */
  function relItem(r, fromId) {
    const other = S.people[otherEnd(r, fromId)];
    const cat = CAT_KEYS.includes(r.category) ? r.category : 'other';
    return h(
      'button',
      { class: `rel-item cat-${cat}`, type: 'button', onclick: () => openRel(r.id, true) },
      avatar(other),
      h('div', {}, h('div', { class: 't' }, nameOf(other.id), h('span', { class: 'tag' }, h('i'), r.type ? lc1(r.type) : CAT[cat].one)), h('div', { class: 'd' }, relSentence(r) + (r.description ? '. ' + r.description : ''))),
      icon('right'),
    );
  }
  function VIEW_PERSON(args) {
    const { id } = args;
    const p = S.people[id];
    if (!p) return null;
    S.selected = id;
    const isMe = id === ME;
    const first = nameOf(id, false);
    const role = roleLine(p);
    const meta = h('div', { class: 'meta' });
    if (p.location) meta.append(h('span', {}, icon('pin'), p.location));
    const bd = birthdayInfo(p);
    if (bd) meta.append(h('span', { class: bd.days <= 7 ? 'soon' : '' }, icon('cake'), bd.label.replace(/, \d{4}$/, '') + (bd.days === 0 ? ' · today' : bd.days <= 30 ? ` · ${relDays(bd.days)}` : '')));
    if (isMe) meta.append(h('span', {}, icon('users'), 'This is you'));
    const head = h('div', { class: 'p-head' }, avatar(p, 'bigav'), h('div', { style: 'min-width:0' }, h('h3', { class: 'p-name' }, isMe ? p.name || 'You' : p.name || 'Unnamed'), role ? h('div', { class: 'p-role' }, role) : '', meta.childElementCount ? meta : ''));
    const act = (ic, label, fn) => h('button', { class: 'act', type: 'button', onclick: fn }, icon(ic), label);
    const actions = h(
      'div',
      { class: 'actions' },
      act('link', 'Connect', () => openSheet('pick', { from: id })),
      act('spark', 'Ask', () => askAbout(id)),
      act('edit', 'Edit', () => openSheet('personEdit', { id })),
      act('target', 'Center', () => centerOn(id)),
    );
    const body = h('div', {}, head, actions);
    if (!isMe) body.append(touchSection(p, args));
    if (p.traits && p.traits.length) body.append(h('div', { class: 'eyebrow' }, 'Traits'), h('div', { class: 'traits' }, p.traits.map((t) => h('span', { class: 'trait' }, t))));
    body.append(h('div', { class: 'eyebrow' }, 'Details'));
    body.append(p.details ? h('p', { class: 'prose' }, p.details) : h('p', { class: 'muted-note' }, isMe ? 'Add your name and anything else you want Kith to know about you.' : `Nothing written about ${first} yet. Tap Edit, or type a note in the Add box.`));
    if (p.email || p.phone || p.link) {
      const rows = [];
      if (p.email) rows.push(contactRow('mail', p.email));
      if (p.phone) rows.push(contactRow('phone', p.phone));
      if (p.link && /^https?:\/\//i.test(p.link)) rows.push(h('div', { class: 'contact-row' }, icon('link', 18), h('a', { href: p.link, target: '_blank', rel: 'noopener noreferrer' }, p.link.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')), h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Copy link', onclick: (e) => copyText(p.link, e.currentTarget) }, icon('copy', 17))));
      body.append(h('div', { class: 'eyebrow' }, 'Contact'), h('div', { class: 'contact' }, rows));
    }
    const rels = relsOf(id).sort((a, b) => (otherEnd(a, id) === ME ? -1 : 0) - (otherEnd(b, id) === ME ? -1 : 0) || (b.strength || 2) - (a.strength || 2));
    body.append(h('div', { class: 'eyebrow' }, `Connections · ${rels.length}`, h('button', { class: 'link', type: 'button', onclick: () => openSheet('pick', { from: id }) }, icon('plus', 15), 'Connect')));
    if (rels.length) body.append(h('div', { class: 'rel-list' }, rels.map((r) => relItem(r, id))));
    else body.append(h('p', { class: 'muted-note' }, `Drag the black knob on ${isMe ? 'your' : first + '’s'} photo onto someone, or tap Connect.`));
    return { title: '', body, size: 'peek' };
  }
  VIEWS.person.live = true;
  function contactRow(ic, value) {
    return h('div', { class: 'contact-row' }, icon(ic, 18), h('span', {}, value), h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Copy ' + value, onclick: (e) => copyText(value, e.currentTarget) }, icon('copy', 17)));
  }
  async function copyText(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied');
    } catch {
      const sp = btn && btn.previousElementSibling;
      if (sp) {
        const r = document.createRange();
        r.selectNodeContents(sp);
        const sel = getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
        toast('Selected — copy it from the menu');
      }
    }
  }

  /* =====================================================================
     Keep in touch: dates, catch-up cadences, birthdays
     ===================================================================== */
  const DAY = 86400000;
  const CADENCES = [[0, 'Off', 'Off'], [7, 'Every week', 'Weekly'], [14, 'Every 2 weeks', '2 weeks'], [30, 'Every month', 'Monthly'], [90, 'Every 3 months', '3 months'], [180, 'Every 6 months', '6 months'], [365, 'Every year', 'Yearly']];
  const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const pad2 = (n) => String(n).padStart(2, '0');
  const ymd = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const todayStr = () => ymd();
  function dayNum(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
    return m ? Math.round(Date.UTC(+m[1], +m[2] - 1, +m[3]) / DAY) : null;
  }
  const todayNum = () => dayNum(todayStr());
  function fromDayNum(n) {
    const d = new Date(n * DAY);
    return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
  }
  function fmtDay(s) {
    const n = dayNum(s);
    if (n == null) return '';
    const d = new Date(n * DAY);
    const opts = { month: 'short', day: 'numeric', timeZone: 'UTC' };
    if (d.getUTCFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
    return d.toLocaleDateString(undefined, opts);
  }
  // d = target day minus today
  function relDays(d) {
    if (d === 0) return 'today';
    if (d === 1) return 'tomorrow';
    if (d === -1) return 'yesterday';
    const a = Math.abs(d);
    const t = a < 14 ? `${a} days` : a < 60 ? `${Math.round(a / 7)} weeks` : a < 548 ? `${Math.round(a / 30.4)} months` : plural(Math.round(a / 365), 'year', 'years');
    return d > 0 ? `in ${t}` : `${t} ago`;
  }
  const cadenceLabel = (days, short) => {
    const c = CADENCES.find((x) => x[0] === days);
    return c ? c[short ? 2 : 1] : `Every ${days} days`;
  };
  function nearestCadence(days) {
    days = Math.round(Number(days) || 0);
    if (days <= 0) return 0;
    return CADENCES.slice(1).reduce((best, c) => (Math.abs(c[0] - days) < Math.abs(best - days) ? c[0] : best), 30);
  }
  // Birthdays are kept as "YYYY-MM-DD", or "--MM-DD" when the year isn't known.
  function parseBirthday(s) {
    s = String(s || '').trim().replace(/T.*$/, '');
    if (!s) return '';
    const ok = (y, mo, d) => {
      if (!(mo >= 1 && mo <= 12 && d >= 1 && d <= 31)) return '';
      if (y && (y < 1900 || y > new Date().getFullYear())) y = 0;
      return (y ? String(y) : '-') + '-' + pad2(mo) + '-' + pad2(d);
    };
    let m;
    if ((m = /^(\d{4})-?(\d{2})-?(\d{2})$/.exec(s))) return ok(+m[1], +m[2], +m[3]);
    if ((m = /^--(\d{2})-?(\d{2})$/.exec(s))) return ok(0, +m[1], +m[2]);
    if ((m = /^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?$/.exec(s))) {
      let mo = +m[1];
      let d = +m[2];
      if (mo > 12) [mo, d] = [d, mo];
      let y = m[3] ? +m[3] : 0;
      if (y && y < 100) y += y > (new Date().getFullYear() % 100) ? 1900 : 2000;
      return ok(y, mo, d);
    }
    if ((m = /^([a-z]{3,})\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?$/i.exec(s))) {
      const mo = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()) + 1;
      return mo ? ok(m[3] ? +m[3] : 0, mo, +m[2]) : '';
    }
    if ((m = /^(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([a-z]{3,})\.?(?:,?\s+(\d{4}))?$/i.exec(s))) {
      const mo = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()) + 1;
      return mo ? ok(m[3] ? +m[3] : 0, mo, +m[1]) : '';
    }
    return '';
  }
  function birthdayText(b) {
    const m = /^(\d{4}|-)-(\d{2})-(\d{2})$/.exec(b || '');
    if (!m) return '';
    const mon = MONTHS[+m[2] - 1];
    return `${mon[0].toUpperCase() + mon.slice(1)} ${+m[3]}${m[1] === '-' ? '' : ', ' + m[1]}`;
  }
  function fmtBirthday(b) {
    const m = /^(\d{4}|-)-(\d{2})-(\d{2})$/.exec(b || '');
    if (!m) return '';
    const d = new Date(Date.UTC(2000, +m[2] - 1, +m[3]));
    const md = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
    return m[1] === '-' ? md : `${md}, ${m[1]}`;
  }
  function birthdayInfo(p) {
    const m = /^(\d{4}|-)-(\d{2})-(\d{2})$/.exec((p && p.birthday) || '');
    if (!m) return null;
    const t = todayNum();
    let y = new Date(t * DAY).getUTCFullYear();
    const at = (yy) => {
      let mm = m[2];
      let dd = m[3];
      const leap = (yy % 4 === 0 && yy % 100 !== 0) || yy % 400 === 0;
      if (mm === '02' && dd === '29' && !leap) dd = '28';
      return dayNum(`${yy}-${mm}-${dd}`);
    };
    let next = at(y);
    if (next < t) next = at(++y);
    return { days: next - t, date: fromDayNum(next), age: m[1] === '-' ? null : y - +m[1], label: fmtBirthday(p.birthday) };
  }
  function dueInfo(p) {
    const c = Math.round(Number(p && p.cadence) || 0);
    if (!c || !p || p.id === ME) return null;
    const base = p.lastContact || p.cadenceFrom || (p.createdAt ? ymd(new Date(p.createdAt)) : todayStr());
    const due = dayNum(base) + c;
    return { cadence: c, due, left: due - todayNum(), logged: !!p.lastContact };
  }
  function dueState(p) {
    const i = dueInfo(p);
    if (i && i.left <= 0) return 'due';
    const b = birthdayInfo(p);
    if (b && b.days <= 1) return 'bday';
    return '';
  }
  function remindersNow() {
    let n = 0;
    for (const p of others()) {
      const i = dueInfo(p);
      const b = birthdayInfo(p);
      if ((i && i.left <= 0) || (b && b.days === 0)) n++;
    }
    return n;
  }
  function touchLine(p, short) {
    const i = dueInfo(p);
    const last = p.lastContact ? `last talked ${relDays(dayNum(p.lastContact) - todayNum())}` : 'no catch-up logged yet';
    if (!i) return p.lastContact ? uc1(last) : '';
    const when = i.left < 0 ? `Overdue by ${relDays(-i.left).replace(/^in /, '')}` : i.left === 0 ? 'Due today' : `Due ${relDays(i.left)}`;
    return short ? `${when} · ${last}` : `${when} · ${cadenceLabel(i.cadence).toLowerCase()} · ${last}`;
  }
  function logTouch(id, date = todayStr(), note = '', { quiet = false } = {}) {
    const p = S.people[id];
    if (!p || id === ME) return;
    const before = clone(p);
    const log = [{ d: date, note: String(note || '').trim() }, ...(p.log || [])].sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : 0)).slice(0, 60);
    const lastContact = !p.lastContact || date > p.lastContact ? date : p.lastContact;
    savePerson({ ...p, log, lastContact });
    onData();
    if (!quiet) toast(`Logged a catch-up with ${nameOf(id, false)}`, { action: 'Undo', run: () => { savePerson(before); onData(); } });
  }
  function setCadence(id, days) {
    const p = S.people[id];
    if (!p || id === ME) return;
    savePerson({ ...p, cadence: days, cadenceFrom: days && !p.lastContact ? p.cadenceFrom || todayStr() : p.cadenceFrom || '' });
    onData();
  }
  function cadencePicker(value, onPick, small) {
    const box = h('div', { class: 'choice' + (small ? ' small' : '') });
    const draw = (v) => box.replaceChildren(...CADENCES.map(([d, , short]) => h('button', { type: 'button', 'aria-pressed': String(v === d), onclick: () => { draw(d); onPick(d); } }, short)));
    draw(value || 0);
    return box;
  }
  function cadenceSelect(value, onPick, id) {
    const sel = h('select', { class: 'input', id }, CADENCES.map(([d, long]) => h('option', { value: String(d) }, d ? long : "Don't remind me")));
    sel.value = String(value || 0);
    sel.addEventListener('change', () => { const v = +sel.value; sel.blur(); onPick(v); });
    return sel;
  }

  function touchSection(p, args) {
    const wrap = h('div', {});
    const i = dueInfo(p);
    wrap.append(h('div', { class: 'eyebrow' }, 'Keep in touch', h('button', { class: 'link', type: 'button', onclick: () => openSheet('logTouch', { id: p.id }) }, icon('check', 15), 'Log a catch-up')));
    const state = !i ? '' : i.left <= 0 ? ' late' : i.left <= 7 ? ' soon' : '';
    const lines = [];
    if (i) {
      lines.push(h('b', {}, i.left < 0 ? `Catch-up overdue by ${relDays(-i.left).replace(/^in /, '')}` : i.left === 0 ? 'Time to catch up today' : `Next catch-up ${relDays(i.left)} · ${fmtDay(fromDayNum(i.due))}`));
      lines.push(h('span', {}, p.lastContact ? `Last talked ${relDays(dayNum(p.lastContact) - todayNum())} (${fmtDay(p.lastContact)})` : 'No catch-up logged yet'));
    } else {
      lines.push(h('b', {}, 'No reminder'));
      lines.push(h('span', {}, p.lastContact ? `Last talked ${relDays(dayNum(p.lastContact) - todayNum())} (${fmtDay(p.lastContact)}). Pick how often to catch up.` : 'Pick how often you want to catch up and Kith will remind you.'));
    }
    wrap.append(h('div', { class: 'touch-card' + state }, icon(i && i.left <= 0 ? 'bell' : 'clock', 20), h('div', {}, lines)));
    wrap.append(cadencePicker(i ? i.cadence : 0, (d) => setCadence(p.id, d), true));
    const log = p.log || [];
    if (log.length) {
      const show = args.allLog ? log : log.slice(0, 4);
      wrap.append(
        h('div', { class: 'eyebrow' }, `Catch-ups · ${log.length}`, log.length > 4 ? h('button', { class: 'link', type: 'button', onclick: () => { args.allLog = !args.allLog; renderSheet(false); } }, args.allLog ? 'Show fewer' : 'Show all') : ''),
        h('ol', { class: 'log' }, show.map((e) => h('li', {}, h('span', { class: 'when' }, fmtDay(e.d)), h('span', {}, e.note || 'Caught up')))),
      );
    }
    return wrap;
  }

  VIEWS.logTouch = ({ id }) => {
    const p = S.people[id];
    if (!p) return null;
    const date = h('input', { class: 'input', type: 'date', id: 'lt-date', value: todayStr(), max: todayStr() });
    const note = h('textarea', { class: 'input', id: 'lt-note', rows: '3', placeholder: 'What did you talk about? Anything to follow up on? (optional)' });
    let cad = dueInfo(p) ? dueInfo(p).cadence : 0;
    const body = h(
      'form',
      { class: 'form', onsubmit: (e) => { e.preventDefault(); save(); } },
      h('div', { class: 'p-head' }, avatar(p, 'bigav'), h('div', {}, h('h3', { class: 'p-name' }, p.name || 'Unnamed'), h('div', { class: 'p-role' }, touchLine(p) || 'No reminder set'))),
      h('div', { class: 'field' }, h('label', { for: 'lt-date' }, 'When'), date),
      h('div', { class: 'field' }, h('label', { for: 'lt-note' }, 'Note'), note),
      h('div', { class: 'field' }, h('span', { class: 'lbl' }, 'Keep in touch'), cadencePicker(cad, (d) => { cad = d; }, true)),
    );
    function save() {
      const d = dayNum(date.value) != null && date.value <= todayStr() ? date.value : todayStr();
      if (cad !== (dueInfo(p) ? dueInfo(p).cadence : 0)) savePerson({ ...S.people[id], cadence: cad, cadenceFrom: S.people[id].cadenceFrom || todayStr() });
      logTouch(id, d, note.value);
      sheetBack();
    }
    const foot = h('div', { class: 'foot-row' }, h('button', { class: 'btn', type: 'button', onclick: () => (Sheet.stack.length > 1 ? sheetBack() : closeSheet()) }, 'Cancel'), h('button', { class: 'btn primary', type: 'button', onclick: save }, icon('check', 18), 'Log catch-up'));
    return { title: 'Log a catch-up', body, foot };
  };

  function touchRow(p, sub, action) {
    return h(
      'div',
      { class: 'touch-row' },
      h('button', { class: 'touch-main', type: 'button', onclick: () => selectPerson(p.id, { open: true, push: true, center: true }) }, avatar(p), h('div', {}, h('div', { class: 't' }, p.name || 'Unnamed'), h('div', { class: 'd' }, sub))),
      action || '',
    );
  }
  VIEWS.touch = () => {
    const rows = others().map((p) => ({ p, i: dueInfo(p), b: birthdayInfo(p) }));
    const withRem = rows.filter((r) => r.i);
    const sortLeft = (a, b) => a.i.left - b.i.left;
    const due = withRem.filter((r) => r.i.left <= 0).sort(sortLeft);
    const week = withRem.filter((r) => r.i.left > 0 && r.i.left <= 7).sort(sortLeft);
    const soon = withRem.filter((r) => r.i.left > 7 && r.i.left <= 30).sort(sortLeft);
    const later = withRem.filter((r) => r.i.left > 30).sort(sortLeft);
    const bdays = rows.filter((r) => r.b && r.b.days <= 30).sort((a, b) => a.b.days - b.b.days);
    const caught = (p) => h('button', { class: 'btn sm', type: 'button', onclick: () => logTouch(p.id) }, icon('check', 15), 'Caught up');
    const body = h('div', {});
    const section = (label, list, render) => {
      if (!list.length) return;
      body.append(h('div', { class: 'eyebrow' }, `${label} · ${list.length}`), h('div', { class: 'touch-list' }, list.map(render)));
    };
    if (!withRem.length) {
      body.append(h('div', { class: 'status-card' }, icon('bell'), h('div', {}, h('b', {}, 'Stay close to the people who matter'), 'Choose how often you want to catch up with someone. When it’s been too long, they show up here and get a dot on the map. Log a catch-up and the clock resets.')));
    }
    section('Time to catch up', due, (r) => touchRow(r.p, touchLine(r.p, true), caught(r.p)));
    section('Birthdays', bdays, (r) => touchRow(r.p, `${r.b.days === 0 ? 'Today' : uc1(relDays(r.b.days))} · ${r.b.label.replace(/, \d{4}$/, '')}${r.b.age ? ` · turns ${r.b.age}` : ''}`, r.b.days <= 1 ? caught(r.p) : ''));
    section('This week', week, (r) => touchRow(r.p, touchLine(r.p, true), caught(r.p)));
    section('Next 30 days', soon, (r) => touchRow(r.p, touchLine(r.p, true)));
    section('Later', later, (r) => touchRow(r.p, touchLine(r.p, true)));
    // suggest the people closest to you who don't have a reminder yet
    const strength = (id) => Math.max(0, ...relsOf(id).filter((r) => r.a === ME || r.b === ME).map((r) => r.strength || 2));
    const sugg = others().filter((p) => !dueInfo(p) && strength(p.id) > 0).sort((a, b) => strength(b.id) - strength(a.id)).slice(0, 8);
    if (sugg.length) {
      body.append(h('div', { class: 'eyebrow' }, 'Set up reminders'), h('div', { class: 'touch-list' }, sugg.map((p) => touchRow(p, roleLine(p) || relsOf(p.id).filter((r) => r.a === ME || r.b === ME).map((r) => relSentence(r))[0] || '', h('div', { class: 'mini-select' }, cadenceSelect(0, (d) => setCadence(p.id, d)))))));
    }
    if (others().length < 5) body.append(h('div', { class: 'eyebrow' }, 'Bring in more people'), h('button', { class: 'btn', type: 'button', onclick: () => openSheet('importHelp', {}) }, icon('contacts', 18), 'Import your contacts'));
    return { title: 'Keep in touch', body };
  };
  VIEWS.touch.live = true;

  function renderDueBanner() {
    if (!E.dueBanner) return;
    const due = others().map((p) => ({ p, i: dueInfo(p) })).filter((r) => r.i && r.i.left <= 0).sort((a, b) => a.i.left - b.i.left);
    const key = todayStr() + ':' + due.map((r) => r.p.id).join(',');
    const off = !due.length || lsGet('kith.banner.hide') === key;
    E.dueBanner.hidden = off;
    E.app.classList.toggle('has-due', !off);
    if (off) return;
    const shown = due.slice(0, 3);
    const when = (i) => (i.left === 0 ? 'Due today' : `${relDays(-i.left).replace(/^in /, '')} overdue`);
    E.dueBanner.replaceChildren(
      h(
        'div',
        { class: 'db-head' },
        h('span', { class: 'db-dot', 'aria-hidden': 'true' }),
        h('button', { class: 'db-title', type: 'button', onclick: () => openSheet('touch', {}, { root: true }) }, 'Time to catch up', h('span', { class: 'db-n' }, due.length)),
        h('button', { class: 'icon-btn db-x', type: 'button', 'aria-label': 'Hide until tomorrow', title: 'Hide until tomorrow', onclick: () => { lsSet('kith.banner.hide', key); renderDueBanner(); } }, icon('x', 15)),
      ),
      h(
        'div',
        { class: 'db-list' },
        shown.map((r) => h('button', { class: 'db-person', type: 'button', onclick: () => selectPerson(r.p.id, { open: true, center: true }) }, h('span', { class: 'db-av' }, avatar(r.p)), h('span', { class: 'db-name' }, r.p.name || 'Unnamed'), h('span', { class: 'db-when' }, when(r.i)))),
        due.length > shown.length ? h('button', { class: 'db-more', type: 'button', onclick: () => openSheet('touch', {}, { root: true }) }, `+${due.length - shown.length} more`) : '',
      ),
    );
  }
  function renderTouchBadge() {
    if (!E.touchBadge) return;
    const n = remindersNow();
    E.touchBadge.hidden = !n;
    E.touchBadge.textContent = n > 99 ? '99+' : String(n);
    E.btnTouch.setAttribute('aria-label', n ? `Keep in touch: ${n} due` : 'Keep in touch');
  }

  /* =====================================================================
     Contact import: vCard (.vcf) and CSV (Google, Outlook, LinkedIn, Apple…)
     ===================================================================== */
  const vUnesc = (s) => String(s).replace(/\\n/gi, '\n').replace(/\\([,;:\\])/g, '$1');
  function vSplit(s) {
    const out = [];
    let cur = '';
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === '\\' && i + 1 < s.length) { cur += c + s[i + 1]; i++; }
      else if (c === ';') { out.push(cur); cur = ''; }
      else cur += c;
    }
    out.push(cur);
    return out.map(vUnesc);
  }
  function vValue(prop) {
    let v = prop.value;
    if (/QUOTED-PRINTABLE/i.test(prop.params.ENCODING || '') || 'QUOTED-PRINTABLE' in prop.params) {
      const bytes = [];
      const enc = new TextEncoder();
      v.replace(/=([0-9A-F]{2})|([\s\S])/gi, (m0, hex, ch) => {
        if (hex) bytes.push(parseInt(hex, 16));
        else bytes.push(...enc.encode(ch));
        return '';
      });
      try { v = new TextDecoder((prop.params.CHARSET || 'utf-8').toLowerCase()).decode(new Uint8Array(bytes)); } catch { v = new TextDecoder().decode(new Uint8Array(bytes)); }
    }
    return v;
  }
  function parseVCards(text) {
    const lines = String(text).replace(/\r\n?/g, '\n').split('\n');
    const unf = [];
    for (const line of lines) {
      const prev = unf[unf.length - 1];
      if (prev != null && /^[ \t]/.test(line)) { unf[unf.length - 1] = prev + line.slice(1); continue; }
      if (prev != null && /=$/.test(prev) && /QUOTED-PRINTABLE/i.test(prev.split(':')[0])) { unf[unf.length - 1] = prev.slice(0, -1) + line; continue; }
      unf.push(line);
    }
    const out = [];
    let props = null;
    for (const line of unf) {
      if (/^BEGIN:VCARD/i.test(line)) { props = []; continue; }
      if (/^END:VCARD/i.test(line)) { if (props) { const c = cardToContact(props); if (c) out.push(c); } props = null; continue; }
      if (!props) continue;
      const i = line.indexOf(':');
      if (i < 0) continue;
      const parts = line.slice(0, i).split(';');
      let name = parts[0].toUpperCase();
      if (name.includes('.')) name = name.split('.').pop();
      const params = {};
      const types = [];
      for (const pr of parts.slice(1)) {
        const eq = pr.indexOf('=');
        const k = (eq < 0 ? 'TYPE' : pr.slice(0, eq)).toUpperCase();
        const v = eq < 0 ? pr : pr.slice(eq + 1);
        if (eq < 0 && /^(QUOTED-PRINTABLE|BASE64|B)$/i.test(v)) params.ENCODING = v;
        else params[k] = params[k] ? params[k] + ',' + v : v;
        if (k === 'TYPE') types.push(...v.toLowerCase().replace(/"/g, '').split(','));
      }
      props.push({ name, params, types, value: line.slice(i + 1) });
    }
    return out;
  }
  function cardToContact(props) {
    const all = (n) => props.filter((p) => p.name === n);
    const best = (list) => list.find((p) => p.types.includes('pref') || 'PREF' in p.params) || list.find((p) => p.types.includes('cell') || p.types.includes('mobile') || p.types.includes('iphone')) || list[0];
    const text = (p) => (p ? vUnesc(vValue(p)).trim() : '');
    let name = text(all('FN')[0]);
    const n = all('N')[0];
    let given = '';
    let family = '';
    if (n) {
      const parts = vSplit(vValue(n));
      family = (parts[0] || '').trim();
      given = (parts[1] || '').trim();
      if (!name) name = [parts[3], given, parts[2], family, parts[4]].map((x) => (x || '').trim()).filter(Boolean).join(' ');
    }
    const org = all('ORG')[0];
    const company = org ? (vSplit(vValue(org))[0] || '').trim() : '';
    const isOrg = all('X-ABSHOWAS').some((p) => /company/i.test(p.value));
    if (isOrg && !given && !family) return null;
    if (!name || (name === company && !given && !family)) return null;
    const adr = best(all('ADR'));
    let location = '';
    if (adr) {
      const a = vSplit(vValue(adr));
      location = [a[3], a[4] || a[6]].map((x) => (x || '').trim()).filter(Boolean).join(', ');
    }
    const email = text(best(all('EMAIL'))).replace(/^mailto:/i, '');
    const phone = text(best(all('TEL'))).replace(/^tel:/i, '');
    const urls = [...all('URL'), ...all('X-SOCIALPROFILE')].map(text).filter((u) => /^https?:\/\//i.test(u));
    const link = urls.find((u) => /linkedin\.com/i.test(u)) || urls[0] || '';
    let photo = '';
    const ph = all('PHOTO')[0];
    if (ph) {
      const v = ph.value.replace(/\s+/g, '');
      if (/^data:image\//i.test(v)) photo = v;
      else if (/^(b|base64)$/i.test(ph.params.ENCODING || '') && v.length > 100) {
        const type = (ph.params.TYPE || ph.types[0] || 'jpeg').toLowerCase().replace(/^image\//, '');
        photo = `data:image/${type === 'jpg' ? 'jpeg' : type};base64,${v}`;
      }
    }
    return {
      name: name.replace(/\s+/g, ' '),
      title: text(all('TITLE')[0]) || text(all('ROLE')[0]),
      company,
      email,
      phone,
      location,
      birthday: parseBirthday(text(all('BDAY')[0])),
      details: text(all('NOTE')[0]),
      link,
      photo,
    };
  }
  function parseCSV(text) {
    text = String(text).replace(/^﻿/, '');
    const head = text.split('\n').slice(0, 8).join('\n');
    const count = (ch) => (head.match(new RegExp('\\' + ch, 'g')) || []).length;
    const sep = count('\t') > count(',') ? '\t' : count(';') > count(',') ? ';' : ',';
    const rows = [];
    let row = [];
    let cell = '';
    let q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"' && cell === '') q = true;
      else if (c === sep) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
      } else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((x) => x.trim()));
  }
  const CSV_ROLES = [
    ['name', /^(full ?name|name|display ?name|contact ?name|contact)$/],
    ['first', /^(first|given)( ?name)?$/],
    ['middle', /^(middle|additional)( ?name)?$/],
    ['last', /^(last|family|sur)( ?name)?$|^surname$/],
    ['company', /^(company|company ?name|employer|organi[sz]ation|organi[sz]ation ?(1 ?)?(- ?)?name)$/],
    ['title', /^(job ?title|title|position|role|organi[sz]ation ?(1 ?)?(- ?)?title)$/],
    ['email', /e-?mail/],
    ['phone', /phone|mobile|^tel/],
    ['city', /city/],
    ['region', /region|state|province/],
    ['country', /country/],
    ['location', /^(location|address|home address|place)$/],
    ['birthday', /birth/],
    ['notes', /^notes?$/],
    ['url', /url|website|web ?page|linkedin/],
    ['connected', /connected on/],
  ];
  function csvToContacts(rows) {
    let hi = -1;
    let map = null;
    for (let r = 0; r < Math.min(rows.length, 15) && hi < 0; r++) {
      const m = {};
      rows[r].forEach((hd, c) => {
        const k = norm(hd).replace(/\s+/g, ' ');
        if (!k || /(- ?|\b)(type|label)$/.test(k) || /phonetic|yomi/.test(k)) return;
        const role = CSV_ROLES.find(([, re]) => re.test(k));
        if (role) (m[role[0]] = m[role[0]] || []).push(c);
      });
      const known = ['name', 'first', 'last', 'email', 'company', 'phone'].filter((k) => m[k]).length;
      if (known >= 2 && (m.name || m.first || m.last)) { hi = r; map = m; }
    }
    if (hi < 0) return [];
    const out = [];
    for (const row of rows.slice(hi + 1)) {
      const g = (k) => {
        for (const c of map[k] || []) { const v = (row[c] || '').trim(); if (v) return v; }
        return '';
      };
      const name = (g('name') || [g('first'), g('middle'), g('last')].filter(Boolean).join(' ')).replace(/\s+/g, ' ').trim();
      if (!name) continue;
      const loc = g('location') || [g('city'), g('region') || g('country')].filter(Boolean).join(', ');
      const url = g('url');
      const conn = g('connected');
      const details = [g('notes'), conn ? `Connected on LinkedIn ${conn}.` : ''].filter(Boolean).join('\n');
      out.push({ name, title: g('title'), company: g('company'), email: g('email').split(/\s*:::\s*/)[0], phone: g('phone').split(/\s*:::\s*/)[0], location: loc, birthday: parseBirthday(g('birthday')), details, link: /^https?:\/\//i.test(url) ? url : '', photo: '' });
    }
    return out;
  }
  function readContactsText(text) {
    if (/BEGIN:VCARD/i.test(text)) return parseVCards(text);
    return csvToContacts(parseCSV(text));
  }
  function matchContact(c) {
    const em = norm(c.email);
    for (const p of others()) {
      if (em && norm(p.email) === em) return p.id;
    }
    const n = norm(c.name);
    const same = others().filter((p) => norm(p.name) === n);
    return same.length === 1 ? same[0].id : null;
  }
  function openContacts(text, source) {
    let list = [];
    try { list = readContactsText(text); } catch { list = []; }
    const seen = new Set();
    list = list.filter((c) => {
      const k = norm(c.name) + '|' + norm(c.email);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    if (!list.length) {
      toast('No contacts found in that file. Use a .vcf file or a CSV with a name column.');
      return;
    }
    for (const c of list) c.existingId = matchContact(c);
    openSheet('importReview', { contacts: list, source }, { root: true });
  }
  function importContactsFile(file) {
    const fr = new FileReader();
    fr.onload = () => openContacts(String(fr.result || ''), file.name || 'your file');
    fr.onerror = () => toast('That file couldn’t be read.');
    fr.readAsText(file);
  }
  const canPickContacts = () => 'contacts' in navigator && 'ContactsManager' in window && !(window.claude && window.claude.use);
  async function pickPhoneContacts() {
    try {
      const avail = await navigator.contacts.getProperties();
      const want = ['name', 'email', 'tel', 'address', 'icon'].filter((x) => avail.includes(x));
      const picked = await navigator.contacts.select(want, { multiple: true });
      const list = picked.map((c) => {
        const a = (c.address || [])[0];
        return { name: ((c.name || [])[0] || '').trim(), title: '', company: '', email: (c.email || [])[0] || '', phone: (c.tel || [])[0] || '', location: a ? [a.city, a.region || a.country].filter(Boolean).join(', ') : '', birthday: '', details: '', link: '', photo: (c.icon || [])[0] || '' };
      }).filter((c) => c.name);
      if (!list.length) return;
      for (const c of list) c.existingId = matchContact(c);
      openSheet('importReview', { contacts: list, source: 'your phone' }, { root: true });
    } catch { /* the person closed the picker */ }
  }

  VIEWS.importHelp = () => {
    const step = (title, ...lines) => h('details', { class: 'howto' }, h('summary', {}, title, icon('right', 16)), h('ol', {}, lines.map((l) => h('li', {}, l))));
    const body = h(
      'div',
      { class: 'form' },
      h('p', { class: 'muted-note' }, 'Bring people in from a contacts file. You choose who to add, and anyone already on your map gets filled in instead of duplicated. Nothing is uploaded anywhere else.'),
      canPickContacts() ? h('button', { class: 'btn primary', type: 'button', onclick: pickPhoneContacts }, icon('contacts', 18), 'Pick from this phone’s contacts') : '',
      h('button', { class: 'btn' + (canPickContacts() ? '' : ' primary'), type: 'button', onclick: () => { E.fileContacts.value = ''; E.fileContacts.click(); } }, icon('upload', 18), 'Choose a contacts file (.vcf or .csv)'),
      h('div', { class: 'eyebrow' }, 'How to get the file'),
      step('iPhone', 'Open the Contacts app and tap Lists (top left).', 'Touch and hold All Contacts (or any list), then tap Export.', 'Save it to Files, come back here and choose that file.', 'For one person: open the contact, tap Share Contact, then Save to Files.'),
      step('Mac', 'Open the Contacts app and select the people you want (⌘A selects everyone).', 'Choose File → Export → Export vCard.', 'Choose the saved .vcf file here.'),
      step('Google / Android', 'Go to contacts.google.com.', 'Click Export, choose vCard or Google CSV, then Export.', 'Choose the downloaded file here.'),
      step('Outlook', 'In Outlook on the web, open People.', 'Choose Manage contacts → Export contacts, then Export.', 'Choose the downloaded .csv file here.'),
      step('LinkedIn', 'Open Settings & Privacy → Data privacy → Get a copy of your data.', 'Pick Connections, then Request archive. LinkedIn emails you a link.', 'Open the download and choose Connections.csv here.'),
      h('p', { class: 'muted-note' }, 'Tip: you can also drop a .vcf or .csv file anywhere on the map, or paste a contact card.'),
    );
    return { title: 'Import contacts', body };
  };

  VIEWS.importReview = (args) => {
    const list = args.contacts;
    const st = args._st || (args._st = { q: '', sel: new Set(list.map((c, i) => (list.length <= 40 && !c.existingId ? i : -1)).filter((i) => i >= 0)), cadence: 0 });
    const body = h('div', {});
    const nNew = list.filter((c) => !c.existingId).length;
    body.append(h('p', { class: 'review-note' }, `Found ${plural(list.length, 'contact', 'contacts')} in ${args.source}${nNew < list.length ? `, ${list.length - nNew} already on your map` : ''}. Pick who to add — people already on your map just get their empty fields filled in.`));
    const search = h('input', { class: 'input', type: 'search', placeholder: 'Search name, company or city', 'aria-label': 'Search contacts', value: st.q });
    const count = h('span', { class: 'imp-count' });
    const listEl = h('div', { class: 'imp-list' });
    const more = h('p', { class: 'muted-note', style: 'padding:6px 2px' });
    const hay = (c) => norm([c.name, c.title, c.company, c.location, c.email].join(' '));
    const visible = () => list.map((c, i) => i).filter((i) => !st.q || hay(list[i]).includes(norm(st.q)));
    const addBtn = h('button', { class: 'btn primary', type: 'button' });
    const paintCount = () => {
      const n = st.sel.size;
      count.textContent = `${n} selected`;
      addBtn.disabled = !n;
      addBtn.replaceChildren(icon('check', 18), n ? `Add ${plural(n, 'person', 'people')}` : 'Add people');
    };
    const draw = () => {
      const idx = visible();
      const cap = 300;
      listEl.replaceChildren(
        ...idx.slice(0, cap).map((i) => {
          const c = list[i];
          const on = st.sel.has(i);
          const row = h(
            'button',
            { class: 'imp-row' + (on ? ' on' : ''), type: 'button', 'aria-pressed': String(on) },
            h('span', { class: 'toggle', 'aria-hidden': 'true' }, icon('check')),
            c.photo && typeof c.photo === 'string' ? h('div', { class: 'miniav' }, h('img', { src: c.photo, alt: '' })) : avatar({ id: 'x', name: c.name }),
            h('div', {}, h('div', { class: 't' }, c.name, c.existingId ? h('span', { class: 'badge upd' }, 'On map') : ''), h('div', { class: 'd' }, [c.title && c.company ? `${c.title} at ${c.company}` : c.title || c.company, c.location].filter(Boolean).join(' · ') || c.email || c.phone || ' ')),
          );
          row.addEventListener('click', () => {
            if (st.sel.has(i)) st.sel.delete(i);
            else st.sel.add(i);
            const now2 = st.sel.has(i);
            row.classList.toggle('on', now2);
            row.setAttribute('aria-pressed', String(now2));
            paintCount();
          });
          return row;
        }),
      );
      more.textContent = idx.length > cap ? `Showing ${cap} of ${idx.length}. Search to find the rest; Select all still selects every match.` : idx.length ? '' : 'No contacts match that.';
      paintCount();
    };
    search.addEventListener('input', () => { st.q = search.value; draw(); });
    const bar = h(
      'div',
      { class: 'imp-bar' },
      h('button', { class: 'btn sm', type: 'button', onclick: () => { for (const i of visible()) st.sel.add(i); draw(); } }, 'Select all'),
      h('button', { class: 'btn sm ghost', type: 'button', onclick: () => { for (const i of visible()) st.sel.delete(i); draw(); } }, 'Clear'),
      count,
    );
    body.append(h('div', { class: 'search-box', style: 'position:relative' }, icon('search', 18), search), bar, listEl, more);
    if (list.length > 150) body.append(h('p', { class: 'muted-note' }, 'Big maps get crowded. Start with the people who matter most; you can import again later.'));
    body.append(h('div', { class: 'field', style: 'margin-top:14px' }, h('label', { for: 'imp-cad' }, 'Remind me to keep in touch with them'), cadenceSelect(st.cadence, (d) => { st.cadence = d; }, 'imp-cad')));
    addBtn.addEventListener('click', async () => {
      const chosen = [...st.sel].sort((a, b) => a - b).map((i) => list[i]);
      if (!chosen.length) return;
      addBtn.disabled = true;
      await applyImport(chosen, st.cadence, (msg) => addBtn.replaceChildren(msg));
    });
    draw();
    const foot = h('div', { class: 'foot-row' }, h('button', { class: 'btn', type: 'button', onclick: closeSheet }, 'Cancel'), addBtn);
    return { title: 'Import contacts', body, foot };
  };

  async function applyImport(chosen, cadence, progress) {
    const withPhoto = chosen.filter((c) => c.photo);
    let done = 0;
    for (const c of withPhoto) {
      try { c.photoSmall = await readPhoto(c.photo, 128); } catch { c.photoSmall = ''; }
      done++;
      if (done % 5 === 0 || done === withPhoto.length) progress(`Preparing photos ${done}/${withPhoto.length}…`);
    }
    const created = [];
    const before = {};
    const today = todayStr();
    const fresh = chosen.filter((c) => !c.existingId).sort((a, b) => (a.company || '~').localeCompare(b.company || '~') || a.name.localeCompare(b.name));
    // new people go in a tidy block beside the map, colleagues next to each other
    const pts = peopleList().map((p) => pos(p.id));
    const maxX = Math.max(...pts.map((q) => q.x));
    const midY = avg(pts.map((q) => q.y));
    const cols = Math.max(3, Math.ceil(Math.sqrt(fresh.length * 1.4)));
    const rowsN = Math.ceil(fresh.length / cols);
    const x0 = maxX + 300;
    const y0 = midY - ((rowsN - 1) * 150) / 2;
    fresh.forEach((c, i) => {
      const id = newId('p');
      created.push(id);
      savePerson({
        id,
        name: c.name,
        title: c.title || '',
        company: c.company || '',
        location: c.location || '',
        traits: [],
        details: c.details || '',
        email: c.email || '',
        phone: c.phone || '',
        link: c.link || '',
        birthday: c.birthday || '',
        photo: c.photoSmall || '',
        cadence: cadence || 0,
        cadenceFrom: cadence ? today : '',
        x: Math.round(x0 + (i % cols) * 185),
        y: Math.round(y0 + Math.floor(i / cols) * 150),
      });
    });
    let updated = 0;
    for (const c of chosen.filter((x) => x.existingId)) {
      const cur = S.people[c.existingId];
      if (!cur) continue;
      const next = clone(cur);
      let changed = false;
      for (const f of ['title', 'company', 'location', 'email', 'phone', 'link', 'birthday']) {
        if (!next[f] && c[f]) { next[f] = c[f]; changed = true; }
      }
      if (!next.photo && c.photoSmall) { next.photo = c.photoSmall; changed = true; }
      if (c.details && !norm(next.details).includes(norm(c.details))) { next.details = next.details ? next.details.trim() + '\n' + c.details : c.details; changed = true; }
      if (cadence && !next.cadence) { next.cadence = cadence; next.cadenceFrom = today; changed = true; }
      if (!changed) continue;
      before[cur.id] = clone(cur);
      savePerson(next);
      updated++;
    }
    onData();
    closeSheet();
    setTimeout(() => (created.length ? frame([...created, ...Object.keys(S.people).slice(0, 400)], { minK: 0.25 }) : null), 60);
    const msg = [created.length ? `Added ${plural(created.length, 'person', 'people')}` : '', updated ? `updated ${plural(updated, 'person', 'people')}` : ''].filter(Boolean).join(', ');
    toast(uc1(msg || 'Nothing new to add'), {
      action: created.length || updated ? 'Undo' : null,
      ms: 8000,
      run: () => {
        for (const id of created) removeDoc(id);
        for (const v of Object.values(before)) savePerson(v);
        withMe(S.people);
        onData();
      },
    });
  }

  /* ---------- relationship ---------- */
  VIEWS.rel = ({ id }) => {
    const r = S.rels[id];
    if (!r || !S.people[r.a] || !S.people[r.b]) return null;
    S.selRel = id;
    const cat = CAT_KEYS.includes(r.category) ? r.category : 'other';
    const A = S.people[r.a];
    const B = S.people[r.b];
    const side = (p) => h('button', { class: 'side', type: 'button', onclick: () => selectPerson(p.id, { open: true, push: true }) }, avatar(p, 'bigav'), h('span', {}, nameOf(p.id)));
    const thread = document.createElementNS(SVGNS, 'svg');
    thread.setAttribute('class', 'thread');
    thread.setAttribute('viewBox', '0 0 70 40');
    thread.innerHTML = `<path d="M0 26 Q35 6 70 26" fill="none" stroke="var(--c)" stroke-width="${[1.6, 2.2, 3, 4][clamp(r.strength || 2, 1, 4) - 1]}" stroke-linecap="round"${(r.strength || 2) === 1 ? ' stroke-dasharray="1.5 6"' : ''}/>`;
    const st = clamp(r.strength || 2, 1, 4);
    const body = h(
      'div',
      { class: `cat-${cat}` },
      h('div', { class: 'r-hero' }, side(A), thread, side(B)),
      h('p', { class: 'r-sentence' }, relSentence(r, true) + '.'),
      h('div', { class: 'r-meta' }, h('span', { class: 'pill' }, h('i'), CAT[cat].one), h('span', { class: 'pill' }, h('span', { class: 'meter' }, [1, 2, 3, 4].map((i) => h('b', { class: i <= st ? 'on' : '' }))), STRENGTH[st - 1])),
      h('div', { class: 'eyebrow' }, 'How they know each other'),
      r.description ? h('p', { class: 'quote' }, r.description) : h('p', { class: 'quote empty-q' }, 'Nothing written yet. Tap Edit to describe how they know each other and what matters about it.'),
    );
    const foot = h(
      'div',
      { class: 'foot-row' },
      h('button', { class: 'btn', type: 'button', onclick: () => openAsk(r.a === ME || r.b === ME ? `What do I know about my relationship with ${nameOf(otherEnd(r, ME))}?` : `What do I know about how ${nameOf(r.a)} and ${nameOf(r.b)} know each other?`) }, icon('spark', 18), 'Ask'),
      h('button', { class: 'btn primary', type: 'button', onclick: () => openSheet('relEdit', { id }) }, icon('edit', 18), 'Edit'),
    );
    return { title: 'Connection', body, foot, size: 'peek' };
  };
  VIEWS.rel.live = true;

  function personSelect(id, value, onChange) {
    const list = [S.people[ME], ...others().sort((a, b) => (a.name || '').localeCompare(b.name || ''))];
    const sel = h('select', { class: 'input', id }, list.map((p) => h('option', { value: p.id }, p.id === ME ? 'You' : p.name || 'Unnamed')));
    sel.value = value;
    sel.addEventListener('change', () => onChange(sel.value));
    return sel;
  }

  VIEWS.relEdit = (args) => {
    const r = args.id ? S.rels[args.id] : null;
    if (args.id && !r) return null;
    const st = args._st || (args._st = r ? { a: r.a, b: r.b, type: r.type || '', category: r.category || 'other', strength: r.strength || 2, description: r.description || '', catTouched: true } : { a: args.a, b: args.b, type: '', category: 'friend', strength: 2, description: '', catTouched: false });
    const preview = h('div', { class: 'sentence-preview' });
    const paint = () => {
      preview.className = `sentence-preview cat-${st.category}`;
      preview.replaceChildren(h('span', { class: 'dot' }), st.type.trim() ? relSentence({ a: st.a, b: st.b, type: st.type }) + '.' : relSentence({ a: st.a, b: st.b, type: '…' }));
    };
    const selA = personSelect('rel-a', st.a, (v) => { st.a = v; paint(); });
    const selB = personSelect('rel-b', st.b, (v) => { st.b = v; paint(); });
    const typeIn = h('input', { class: 'input', id: 'rel-type', value: st.type, placeholder: 'sister, college roommate, investor…', autocomplete: 'off', enterkeyhint: 'done' });
    const catBox = h('div', { class: 'choice' });
    const drawCats = () => catBox.replaceChildren(...CATS.map((c) => h('button', { type: 'button', class: `cat-${c.key}`, 'aria-pressed': String(st.category === c.key), onclick: () => { st.category = c.key; st.catTouched = true; drawCats(); paint(); } }, h('i'), c.one)));
    const presetBox = h('div', { class: 'choice small' });
    const drawPresets = () => presetBox.replaceChildren(...PRESETS.map((t) => h('button', { type: 'button', 'aria-pressed': String(norm(st.type) === t), onclick: () => { st.type = t; typeIn.value = t; st.category = inferCat(t); drawCats(); drawPresets(); paint(); } }, t)));
    typeIn.addEventListener('input', () => {
      st.type = typeIn.value;
      if (!st.catTouched) { st.category = inferCat(st.type); drawCats(); }
      drawPresets();
      paint();
    });
    const strBox = h('div', { class: 'choice' });
    const drawStr = () => strBox.replaceChildren(...STRENGTH.map((s, i) => h('button', { type: 'button', 'aria-pressed': String(st.strength === i + 1), onclick: () => { st.strength = i + 1; drawStr(); } }, s)));
    const desc = h('textarea', { class: 'input', id: 'rel-desc', rows: '4', placeholder: 'How do they know each other? When did they meet? Anything worth remembering?' });
    desc.value = st.description;
    desc.addEventListener('input', () => { st.description = desc.value; });
    drawCats(); drawPresets(); drawStr(); paint();
    const swap = h('button', { class: 'swap', type: 'button', 'aria-label': 'Swap the two people', title: 'Swap', onclick: () => { [st.a, st.b] = [st.b, st.a]; selA.value = st.a; selB.value = st.b; paint(); } }, icon('swap', 18));
    const err = h('p', { class: 'muted-note', style: 'color:var(--danger)', hidden: true });
    const body = h(
      'form',
      { class: 'form', onsubmit: (e) => { e.preventDefault(); save(); } },
      preview,
      h('div', { class: 'pair' }, h('div', { class: 'field' }, h('label', { for: 'rel-a' }, 'Person'), selA), swap, h('div', { class: 'field' }, h('label', { for: 'rel-b' }, 'is this person’s'), selB)),
      h('div', { class: 'field' }, h('label', { for: 'rel-type' }, 'Relationship'), typeIn, presetBox),
      h('div', { class: 'field' }, h('span', { class: 'lbl' }, 'Kind'), catBox),
      h('div', { class: 'field' }, h('span', { class: 'lbl' }, 'Closeness'), strBox),
      h('div', { class: 'field' }, h('label', { for: 'rel-desc' }, 'Describe their relationship'), desc),
      err,
    );
    function save() {
      if (st.a === st.b) { err.textContent = 'Pick two different people.'; err.hidden = false; return; }
      const type = st.type.trim();
      const base = r ? clone(r) : { id: newId('r'), createdAt: now() };
      const saved = saveRel({ ...base, a: st.a, b: st.b, type, category: st.category, strength: st.strength, description: st.description.trim() });
      onData();
      if (args.fresh) {
        const [n1, n2] = [st.a, st.b].map((x) => (x === ME ? 'you' : nameOf(x, false)));
        toast(`Connected ${uc1(n1)} and ${n2}`);
        openRel(saved.id);
      } else sheetBack();
    }
    let confirmBox = null;
    const foot = h('div', { class: 'foot-row' });
    const drawFoot = () => {
      if (confirmBox) {
        foot.replaceChildren(h('div', { class: 'confirm', style: 'flex:1' }, h('p', {}, 'Delete this connection?'), h('div', { class: 'foot-row' }, h('button', { class: 'btn', type: 'button', onclick: () => { confirmBox = null; drawFoot(); } }, 'Keep'), h('button', { class: 'btn danger solid', type: 'button', onclick: () => { const keep = clone(r); removeDoc(r.id); onData(); closeSheet(); toast('Connection deleted', { action: 'Undo', run: () => { saveRel(keep); onData(); } }); } }, 'Delete'))));
        return;
      }
      foot.replaceChildren(
        r ? h('button', { class: 'btn danger icon-only', type: 'button', 'aria-label': 'Delete connection', title: 'Delete', onclick: () => { confirmBox = true; drawFoot(); } }, icon('trash', 18)) : '',
        h('button', { class: 'btn', type: 'button', onclick: () => (Sheet.stack.length > 1 ? sheetBack() : closeSheet()) }, 'Cancel'),
        h('button', { class: 'btn primary', type: 'button', onclick: save }, r ? 'Save' : 'Connect'),
      );
    };
    drawFoot();
    return { title: r ? 'Edit connection' : 'New connection', body, foot, after: () => { if (!r && finePointer) typeIn.focus({ preventScroll: true }); } };
  };

  /* ---------- person form ---------- */
  function tagBox(initial, id) {
    const tags = [...initial];
    const wrap = h('div', { class: 'tagbox' });
    const inp = h('input', { id, placeholder: '', autocomplete: 'off', enterkeyhint: 'done', 'aria-label': 'Add a trait' });
    const draw = () => {
      inp.placeholder = tags.length ? 'Add another' : 'funny, loyal, runs marathons…';
      wrap.replaceChildren(...tags.map((t, i) => h('span', { class: 'tag' }, t, h('button', { type: 'button', 'aria-label': 'Remove ' + t, onclick: () => { tags.splice(i, 1); draw(); inp.focus(); } }, icon('x')))), inp);
    };
    const commit = () => {
      const parts = inp.value.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
      if (!parts.length) return false;
      for (const t of parts) if (!tags.some((x) => norm(x) === norm(t))) tags.push(t);
      inp.value = '';
      draw();
      return true;
    };
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); if (commit()) inp.focus(); }
      else if (e.key === 'Backspace' && !inp.value && tags.length) { tags.pop(); draw(); inp.focus(); }
    });
    inp.addEventListener('blur', () => commit());
    wrap.addEventListener('click', (e) => { if (e.target === wrap) inp.focus(); });
    draw();
    return { el: wrap, get: () => { commit(); return tags; } };
  }
  async function readPhoto(src, s = 200) {
    const own = typeof src !== 'string';
    const url = own ? URL.createObjectURL(src) : src;
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = s;
      c.height = s;
      const ctx = c.getContext('2d');
      const m = Math.min(img.naturalWidth, img.naturalHeight);
      ctx.drawImage(img, (img.naturalWidth - m) / 2, (img.naturalHeight - m) / 2, m, m, 0, 0, s, s);
      return c.toDataURL('image/jpeg', s < 160 ? 0.8 : 0.84);
    } finally {
      if (own) URL.revokeObjectURL(url);
    }
  }
  function datalist(id, field) {
    const vals = [...new Set(others().map((p) => p[field]).filter(Boolean))].sort();
    return h('datalist', { id }, vals.map((v) => h('option', { value: v })));
  }
  VIEWS.personEdit = (args) => {
    const p = args.id ? S.people[args.id] : null;
    if (args.id && !p) return null;
    const isMe = args.id === ME;
    const st = args._st || (args._st = p ? { ...clone(p), birthdayText: birthdayText(p.birthday) } : { name: args.name || '', title: '', company: '', location: '', traits: [], details: '', email: '', phone: '', photo: '', link: '', birthdayText: '', cadence: 0 });
    const field = (key, label, attrs = {}) => {
      const inp = h('input', { class: 'input', id: 'pe-' + key, value: st[key] || '', autocomplete: 'off', ...attrs });
      inp.addEventListener('input', () => { st[key] = inp.value; if (key === 'name') paintAv(); });
      return h('div', { class: 'field' }, h('label', { for: 'pe-' + key }, label), inp);
    };
    const avWrap = h('span', {});
    const paintAv = () => avWrap.replaceChildren(avatar({ id: isMe ? ME : 'x', name: st.name, photo: st.photo }, 'bigav'));
    paintAv();
    const photoBtn = h('button', { class: 'photo-btn', type: 'button', 'aria-label': st.photo ? 'Change photo' : 'Add a photo', onclick: () => pickPhoto() }, avWrap, h('span', { class: 'cam' }, icon('camera')));
    function pickPhoto() {
      E.filePhoto.value = '';
      E.filePhoto.onchange = async () => {
        const f = E.filePhoto.files && E.filePhoto.files[0];
        if (!f) return;
        try { st.photo = await readPhoto(f); paintAv(); } catch { toast('That picture couldn’t be opened. Try a JPEG or PNG.'); }
      };
      E.filePhoto.click();
    }
    const tags = tagBox(st.traits || [], 'pe-traits');
    const details = h('textarea', { class: 'input', id: 'pe-details', rows: '5', placeholder: 'Family, history, what you talked about, birthdays, things to follow up on…' });
    details.value = st.details || '';
    details.addEventListener('input', () => { st.details = details.value; });
    const err = h('p', { class: 'muted-note', style: 'color:var(--danger)', hidden: true });
    const body = h(
      'form',
      { class: 'form', onsubmit: (e) => { e.preventDefault(); save(); } },
      h('div', { class: 'photo-row' }, photoBtn, field('name', isMe ? 'Your name' : 'Name', { placeholder: isMe ? 'Your name' : 'Full name', autocapitalize: 'words' })),
      st.photo ? h('button', { class: 'btn ghost sm', type: 'button', style: 'justify-self:start;margin-top:-6px', onclick: () => { st.photo = ''; renderSheet(false); } }, 'Remove photo') : '',
      h('div', { class: 'row2' }, field('title', 'Title or role', { placeholder: 'Head of Design' }), field('company', 'Company', { placeholder: 'Stripe', list: 'dl-company' })),
      field('location', 'Location', { placeholder: 'San Francisco', list: 'dl-location' }),
      h('div', { class: 'field' }, h('label', { for: 'pe-traits' }, 'Traits'), tags.el),
      h('div', { class: 'field' }, h('label', { for: 'pe-details' }, 'Details'), details),
      h('div', { class: 'row2' }, field('email', 'Email', { type: 'email', placeholder: 'name@example.com', inputmode: 'email' }), field('phone', 'Phone', { type: 'tel', placeholder: '+1 555 0100', inputmode: 'tel' })),
      h('div', { class: 'row2' }, field('birthdayText', 'Birthday', { placeholder: 'Mar 14 or 1990-03-14' }), field('link', 'Link', { type: 'url', placeholder: 'linkedin.com/in/…', inputmode: 'url' })),
      isMe ? '' : h('div', { class: 'field' }, h('label', { for: 'pe-cadence' }, 'Keep in touch'), cadenceSelect(+st.cadence || 0, (d) => { st.cadence = d; }, 'pe-cadence')),
      datalist('dl-company', 'company'),
      datalist('dl-location', 'location'),
      err,
    );
    function save() {
      st.traits = tags.get();
      const name = (st.name || '').trim();
      if (!name && !isMe) { err.textContent = 'Add a name first.'; err.hidden = false; $('#pe-name').focus(); return; }
      const bText = (st.birthdayText || '').trim();
      const birthday = parseBirthday(bText);
      if (bText && !birthday) { err.textContent = 'Write the birthday like “Mar 14” or “1990-03-14”.'; err.hidden = false; $('#pe-birthdayText').focus(); return; }
      let link = (st.link || '').trim();
      if (link && !/^https?:\/\//i.test(link)) link = 'https://' + link;
      const cadence = isMe ? 0 : +st.cadence || 0;
      const fields = { name, title: (st.title || '').trim(), company: (st.company || '').trim(), location: (st.location || '').trim(), traits: st.traits, details: (st.details || '').trim(), email: (st.email || '').trim(), phone: (st.phone || '').trim(), photo: st.photo || '', birthday, link, cadence };
      if (cadence && !(p && (p.lastContact || p.cadenceFrom))) fields.cadenceFrom = todayStr();
      let saved;
      if (p) saved = savePerson({ ...p, ...fields });
      else {
        const c = Number.isFinite(args.x) ? { x: args.x, y: args.y } : freeSpot(viewCenter().x, viewCenter().y);
        saved = savePerson({ id: newId('p'), ...fields, x: Math.round(c.x), y: Math.round(c.y) });
      }
      onData();
      if (p) sheetBack();
      else {
        openSheet('person', { id: saved.id }, { root: true });
        selectPerson(saved.id);
        toast(`Added ${saved.name}`);
      }
    }
    let confirming = false;
    const foot = h('div', { class: 'foot-row' });
    const drawFoot = () => {
      if (confirming) {
        const n = relsOf(p.id).length;
        foot.replaceChildren(h('div', { class: 'confirm', style: 'flex:1' }, h('p', {}, `Delete ${p.name || 'this person'}${n ? ` and ${plural(n, 'connection', 'connections')}` : ''}?`), h('div', { class: 'foot-row' }, h('button', { class: 'btn', type: 'button', onclick: () => { confirming = false; drawFoot(); } }, 'Keep'), h('button', { class: 'btn danger solid', type: 'button', onclick: () => { closeSheet(); deletePerson(p.id); } }, 'Delete'))));
        return;
      }
      foot.replaceChildren(
        p && !isMe ? h('button', { class: 'btn danger icon-only', type: 'button', 'aria-label': 'Delete person', title: 'Delete', onclick: () => { confirming = true; drawFoot(); } }, icon('trash', 18)) : '',
        h('button', { class: 'btn', type: 'button', onclick: () => (Sheet.stack.length > 1 ? sheetBack() : closeSheet()) }, 'Cancel'),
        h('button', { class: 'btn primary', type: 'button', onclick: save }, p ? 'Save' : 'Add person'),
      );
    };
    drawFoot();
    return { title: p ? (isMe ? 'About you' : `Edit ${nameOf(p.id, false)}`) : 'New person', body, foot, after: () => { if (!p && finePointer) $('#pe-name').focus(); } };
  };

  /* ---------- pick someone to connect / search ---------- */
  function peopleFinder({ exclude, onPick, placeholder, includeMe }) {
    const inp = h('input', { class: 'input', type: 'search', placeholder, autocomplete: 'off', enterkeyhint: 'go', 'aria-label': placeholder });
    const list = h('div', { class: 'list' });
    let rows = [];
    let k = 0;
    const hl = (text, q) => {
      if (!q) return text;
      const i = norm(text).indexOf(q);
      if (i < 0) return text;
      return [text.slice(0, i), h('mark', {}, text.slice(i, i + q.length)), text.slice(i + q.length)];
    };
    const draw = () => {
      const q = norm(inp.value);
      const pool = [...(includeMe ? [S.people[ME]] : []), ...others().sort((a, b) => (a.name || '').localeCompare(b.name || ''))].filter((p) => p && p.id !== exclude);
      const hay = (p) => norm([p.id === ME ? 'you me' : p.name, p.title, p.company, p.location, (p.traits || []).join(' ')].join(' '));
      rows = q ? pool.filter((p) => hay(p).includes(q)) : pool;
      k = 0;
      list.replaceChildren(
        ...rows.map((p, i) =>
          h('button', { class: 'row-btn' + (i === k && q ? ' kbd' : ''), type: 'button', onclick: () => onPick(p.id) }, avatar(p), h('div', {}, h('div', { class: 't' }, hl(p.id === ME ? 'You' : p.name || 'Unnamed', q)), h('div', { class: 'd' }, hl([roleLine(p), p.location].filter(Boolean).join(' · ') || ' ', q))), icon('right', 16)),
        ),
      );
      if (!rows.length) list.append(h('p', { class: 'muted-note', style: 'padding:8px 10px' }, others().length ? 'No one matches that.' : 'No one on your map yet.'));
    };
    inp.addEventListener('input', draw);
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && rows[k]) { e.preventDefault(); onPick(rows[k].id); }
    });
    draw();
    return { body: h('div', {}, h('div', { class: 'search-box', style: 'position:relative' }, icon('search', 18), inp), list), focus: () => inp.focus() };
  }
  VIEWS.pick = ({ from }) => {
    if (!S.people[from]) return null;
    const f = peopleFinder({ exclude: from, includeMe: from !== ME, placeholder: 'Find someone', onPick: (id) => openSheet('relEdit', { a: from, b: id, fresh: true }, { replace: true }) });
    return { title: `Connect ${from === ME ? 'yourself' : nameOf(from, false)} to…`, body: f.body, after: () => finePointer && f.focus() };
  };
  VIEWS.search = () => {
    const f = peopleFinder({ includeMe: true, placeholder: 'Name, company, city or trait', onPick: (id) => selectPerson(id, { open: true, center: true }) });
    return { title: 'Find a person', body: f.body, after: () => f.focus() };
  };

  /* ---------- review what was read from a note ---------- */
  VIEWS.review = ({ draft }) => {
    const d = draft;
    const nameFor = (ref) => {
      if (ref === ME) return 'You';
      if (S.people[ref]) return nameOf(ref);
      const e = d.people.find((p) => p.ref === ref);
      return (e && (e.name || '').trim()) || 'New person';
    };
    const body = h('div', {});
    const intro = d.source === 'claude' ? 'Claude read your note. Check it over, change anything, then add it to your map.' : 'Read on this device. It catches the common patterns, so check names and details before adding.';
    body.append(h('p', { class: 'review-note' }, d.fallback ? d.fallback + ' ' : '', intro));
    if (d.note) body.append(h('div', { class: 'source-quote' }, d.note));
    const relBoxes = [];
    const repaintRels = () => relBoxes.forEach((f) => f());
    if (d.people.length) body.append(h('div', { class: 'eyebrow' }, `People · ${d.people.length}`));
    for (const p of d.people) {
      const isNew = !p.existingId;
      const cur = p.existingId ? S.people[p.existingId] : null;
      const card = h('div', { class: 'dcard' + (p.include ? '' : ' off') });
      const tog = h('button', { class: 'toggle', type: 'button', 'aria-pressed': String(p.include), 'aria-label': 'Include ' + (p.name || 'this person'), onclick: () => { p.include = !p.include; tog.setAttribute('aria-pressed', String(p.include)); card.classList.toggle('off', !p.include); updateCount(); } }, icon('check'));
      const avEl = h('span', {}, avatar({ id: p.existingId || 'x', name: p.name || p.myName || '?', photo: cur && cur.photo }));
      let head;
      if (isNew) {
        const nameIn = h('input', { class: 'input', value: p.name, placeholder: 'Name', 'aria-label': 'Name', autocapitalize: 'words' });
        nameIn.addEventListener('input', () => { p.name = nameIn.value; avEl.replaceChildren(avatar({ id: 'x', name: p.name })); repaintRels(); });
        head = h('div', { class: 'dcard-head' }, avEl, nameIn, h('span', { class: 'badge new' }, 'New'), tog);
      } else head = h('div', { class: 'dcard-head' }, avEl, h('div', { class: 'nm' }, p.existingId === ME ? 'You' : cur.name), h('span', { class: 'badge upd' }, 'Update'), tog);
      const inp = (key, label, full) => {
        const el = key === 'details' ? h('textarea', { class: 'input', rows: '2' }) : h('input', { class: 'input', autocomplete: 'off' });
        el.value = key === 'traits' ? p.traits.join(', ') : p[key] || '';
        el.placeholder = cur && cur[key] && key !== 'traits' && key !== 'details' ? cur[key] : label;
        el.setAttribute('aria-label', label);
        el.addEventListener('input', () => { if (key === 'traits') p.traits = el.value.split(',').map((s) => s.trim()).filter(Boolean); else p[key] = el.value; });
        return h('label', { class: full ? 'full' : '' }, h('span', { class: 'mini-lbl' }, label), el);
      };
      const grid = h('div', { class: 'dgrid' }, inp('title', 'Title'), inp('company', 'Company'), inp('location', 'Location'), inp('traits', 'Traits'), inp('details', 'Details', true));
      if (p.email || p.phone) grid.append(inp('email', 'Email'), inp('phone', 'Phone'));
      if (p.birthday) {
        p.birthdayText = birthdayText(p.birthday);
        grid.append(inp('birthdayText', 'Birthday'));
      }
      if (p.lastContact) {
        const dt = h('input', { class: 'input', type: 'date', value: p.lastContact, max: todayStr(), 'aria-label': 'Last talked' });
        dt.addEventListener('input', () => { p.lastContact = dt.value; });
        grid.append(h('label', {}, h('span', { class: 'mini-lbl' }, 'Last talked'), dt), inp('touchNote', 'Catch-up note'));
      }
      if (p.cadenceDays || p.lastContact) grid.append(h('label', { class: 'full' }, h('span', { class: 'mini-lbl' }, 'Keep in touch'), cadenceSelect(p.cadenceDays || 0, (v) => { p.cadenceDays = v; })));
      card.append(head, grid);
      body.append(card);
    }
    if (d.rels.length) body.append(h('div', { class: 'eyebrow' }, `Connections · ${d.rels.length}`));
    for (const r of d.rels) {
      const card = h('div', { class: 'dcard drel' + (r.include ? '' : ' off') });
      const tog = h('button', { class: 'toggle', type: 'button', 'aria-pressed': String(r.include), 'aria-label': 'Include this connection', onclick: () => { r.include = !r.include; tog.setAttribute('aria-pressed', String(r.include)); card.classList.toggle('off', !r.include); updateCount(); } }, icon('check'));
      const line = h('div', { class: 'drel-line' });
      const typeIn = h('input', { class: 'input', value: r.type, placeholder: 'relationship', 'aria-label': 'Relationship' });
      const paint = () => {
        const A = nameFor(r.from);
        const B = nameFor(r.to);
        card.className = `dcard drel cat-${r.category}` + (r.include ? '' : ' off');
        line.replaceChildren(h('span', { class: 'dot' }), `${A} ${A === 'You' ? 'are' : 'is'} ${possessive(B)}`, typeIn);
      };
      typeIn.addEventListener('input', () => { r.type = typeIn.value; r.category = inferCat(r.type); card.className = `dcard drel cat-${r.category}` + (r.include ? '' : ' off'); });
      relBoxes.push(paint);
      paint();
      const desc = h('input', { class: 'input', value: r.description, placeholder: 'How they know each other (optional)', 'aria-label': 'Description' });
      desc.addEventListener('input', () => { r.description = desc.value; });
      card.append(h('div', { class: 'dcard-head' }, line, tog), desc);
      body.append(card);
    }
    const addBtn = h('button', { class: 'btn primary', type: 'button', onclick: () => { closeSheet(); applyDraft(d); } });
    const updateCount = () => {
      const n = d.people.filter((p) => p.include).length + d.rels.filter((r) => r.include).length;
      addBtn.disabled = !n;
      addBtn.replaceChildren(icon('check', 18), 'Add to map');
    };
    updateCount();
    const foot = h('div', { class: 'foot-row' }, h('button', { class: 'btn', type: 'button', onclick: () => { E.input.value = d.note || ''; grow(); closeSheet(); } }, 'Back to note'), addBtn);
    return { title: 'Review', body, foot };
  };

  function applyTouchFields(next, p) {
    if (next.id === ME) return next;
    const b = p.birthdayText != null ? parseBirthday(p.birthdayText) || p.birthday : p.birthday;
    if (b) next.birthday = b;
    if (p.cadenceDays) { next.cadence = p.cadenceDays; if (!next.lastContact && !next.cadenceFrom) next.cadenceFrom = todayStr(); }
    const lc = dayNum(p.lastContact) != null && p.lastContact <= todayStr() ? p.lastContact : '';
    if (lc) {
      next.log = [{ d: lc, note: str(p.touchNote) }, ...(next.log || [])].sort((a, c) => (a.d < c.d ? 1 : a.d > c.d ? -1 : 0)).slice(0, 60);
      if (!next.lastContact || lc > next.lastContact) next.lastContact = lc;
    }
    return next;
  }
  function applyDraft(d) {
    const ids = { [ME]: ME };
    const created = [];
    const before = {};
    const touched = new Set();
    let wasVirtual = false;
    for (const p of d.people) {
      if (!p.include) continue;
      if (p.existingId) {
        const cur = S.people[p.existingId];
        if (!cur) continue;
        ids[p.ref] = cur.id;
        if (!cur.virtual) before[cur.id] = clone(cur);
        else wasVirtual = true;
        const next = clone(cur);
        for (const f of ['title', 'company', 'location', 'email', 'phone']) if (str(p[f])) next[f] = str(p[f]);
        if (p.newName) next.name = p.newName;
        if (p.myName && cur.id === ME && !cur.name) next.name = p.myName;
        for (const t of p.traits) if (!next.traits.some((x) => norm(x) === norm(t))) next.traits.push(t);
        const det = str(p.details);
        if (det && !norm(cur.details).includes(norm(det))) next.details = cur.details ? cur.details.trim() + '\n' + det : det;
        applyTouchFields(next, p);
        savePerson(next);
        touched.add(cur.id);
      } else {
        const name = str(p.name);
        if (!name) continue;
        const id = newId('p');
        ids[p.ref] = id;
        created.push(id);
        S.people[id] = applyTouchFields({ kind: 'person', id, name, title: str(p.title), company: str(p.company), location: str(p.location), traits: [...new Set(p.traits.map(str).filter(Boolean))], details: str(p.details), email: str(p.email), phone: str(p.phone), photo: '', x: NaN, y: NaN, createdAt: now() }, p);
      }
    }
    const resolve = (ref) => ids[ref] || (S.people[ref] && !String(ref).startsWith('new') ? ref : null);
    const liveRels = d.rels.filter((r) => r.include);
    // place new people next to whoever they're connected to
    const pending = [...created];
    const placed = [];
    const center = viewCenter();
    let guard = 0;
    while (pending.length && guard++ < 200) {
      let progress = false;
      for (let i = 0; i < pending.length; i++) {
        const id = pending[i];
        const anchors = liveRels
          .map((r) => { const a = resolve(r.from); const b = resolve(r.to); return a === id ? b : b === id ? a : null; })
          .filter((x) => x && S.people[x] && Number.isFinite(S.people[x].x));
        if (!anchors.length) continue;
        const spot = freeSpot(avg(anchors.map((x) => S.people[x].x)), avg(anchors.map((x) => S.people[x].y)), placed);
        Object.assign(S.people[id], spot);
        placed.push([spot.x, spot.y]);
        pending.splice(i--, 1);
        progress = true;
      }
      if (!progress && pending.length) {
        const id = pending.shift();
        const spot = freeSpot(center.x, center.y, placed);
        Object.assign(S.people[id], spot);
        placed.push([spot.x, spot.y]);
      }
    }
    for (const id of created) { savePerson(S.people[id]); touched.add(id); }
    const newRels = [];
    for (const r of liveRels) {
      const a = resolve(r.from);
      const b = resolve(r.to);
      if (!a || !b || a === b) continue;
      const type = str(r.type);
      const dup = relList().find((x) => ((x.a === a && x.b === b) || (x.a === b && x.b === a)) && norm(x.type) === norm(type));
      if (dup) {
        before[dup.id] = clone(dup);
        const nx = clone(dup);
        const desc = str(r.description);
        if (desc && !norm(dup.description).includes(norm(desc))) nx.description = (dup.description ? dup.description.trim() + '\n' : '') + desc;
        saveRel(nx);
      } else {
        const id = newId('r');
        saveRel({ id, a, b, type, category: CAT_KEYS.includes(r.category) ? r.category : inferCat(type), strength: clamp(r.strength || 2, 1, 4), description: str(r.description), createdAt: now() });
        newRels.push(id);
      }
      touched.add(a);
      touched.add(b);
    }
    onData();
    const parts = [];
    if (created.length) parts.push(created.length === 1 ? S.people[created[0]].name : plural(created.length, 'person', 'people'));
    if (newRels.length) parts.push(plural(newRels.length, 'connection', 'connections'));
    const upd = Object.values(before).filter((v) => v.kind === 'person').length + (wasVirtual ? 1 : 0);
    let msg = parts.length ? 'Added ' + parts.join(' and ') : '';
    if (upd) msg = msg ? `${msg}; updated ${plural(upd, 'person', 'people')}` : `Updated ${plural(upd, 'person', 'people')}`;
    toast(msg || 'Nothing new. That was already on your map.', {
      action: 'Undo',
      run: () => {
        for (const id of newRels) removeDoc(id);
        for (const id of created) removeDoc(id);
        for (const v of Object.values(before)) (v.kind === 'person' ? savePerson : saveRel)(v);
        if (wasVirtual) removeDoc(ME);
        withMe(S.people);
        onData();
      },
    });
    const focusIds = [...touched].filter((id) => S.people[id]);
    if (created.length === 1 && !newRels.length) selectPerson(created[0]);
    else if (focusIds.length) frame(focusIds, { maxK: 1.05 });
  }

  /* ---------- ask ---------- */
  const Chat = { turns: [], ctl: null };
  let nameRe = null;
  let nameIndex = new Map();
  function buildNameRe() {
    nameIndex = new Map();
    const names = [];
    for (const p of others()) {
      if (!p.name || p.name.length < 2) continue;
      nameIndex.set(p.name.toLowerCase(), p.id);
      names.push(p.name);
    }
    names.sort((a, b) => b.length - a.length);
    nameRe = names.length ? new RegExp('(^|[^\\p{L}\\p{N}])(' + names.map(escRe).join('|') + ')(?![\\p{L}\\p{N}])', 'giu') : false;
  }
  function linkNames(el, s) {
    if (nameRe === null) buildNameRe();
    if (!nameRe) { el.append(s); return; }
    let lastI = 0;
    for (const m of s.matchAll(nameRe)) {
      const start = m.index + m[1].length;
      const id = nameIndex.get(m[2].toLowerCase());
      if (!id) continue;
      el.append(s.slice(lastI, start));
      const p = S.people[id];
      el.append(h('button', { class: 'pchip', type: 'button', onclick: () => selectPerson(id, { open: true, push: true, center: true }) }, avatar(p), m[2]));
      lastI = start + m[2].length;
    }
    el.append(s.slice(lastI));
  }
  function inline(el, s) {
    for (const part of s.split(/(\*\*[^*]+\*\*)/g)) {
      if (!part) continue;
      if (/^\*\*[^*]+\*\*$/.test(part)) {
        const b = h('strong');
        linkNames(b, part.slice(2, -2));
        el.append(b);
      } else linkNames(el, part.replace(/(^|\s)\*([^*\n]+)\*/g, '$1$2').replace(/`([^`]+)`/g, '$1'));
    }
    return el;
  }
  function richText(text) {
    const frag = document.createDocumentFragment();
    let ul = null;
    let para = null;
    for (const raw of String(text).replace(/\r/g, '').split('\n')) {
      const line = raw.trimEnd();
      const m = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
      if (m) {
        if (!ul) { ul = h('ul'); frag.append(ul); }
        para = null;
        ul.append(inline(h('li'), m[1]));
        continue;
      }
      ul = null;
      if (!line.trim()) { para = null; continue; }
      if (!para) { para = h('p'); frag.append(para); } else para.append(document.createElement('br'));
      inline(para, line.replace(/^#{1,6}\s+/, ''));
    }
    return frag;
  }
  function suggestions() {
    const ps = others().filter((p) => p.name);
    if (!ps.length) return [];
    const deg = (id) => relsOf(id).length;
    const byDeg = [...ps].sort((a, b) => deg(b.id) - deg(a.id));
    const out = [`How do I know ${byDeg[0].name}?`];
    const count = (f) => {
      const c = {};
      for (const p of ps) if (p[f]) c[p[f]] = (c[p[f]] || 0) + 1;
      return Object.entries(c).sort((a, b) => b[1] - a[1])[0];
    };
    const co = count('company');
    if (co) out.push(`Who works at ${co[0]}?`);
    if (byDeg.length >= 3) {
      const a = byDeg[1];
      const b = byDeg.slice(2).find((x) => !relList().some((r) => (r.a === a.id && r.b === x.id) || (r.b === a.id && r.a === x.id))) || byDeg[2];
      out.push(`How is ${a.name} connected to ${b.name}?`);
    }
    const loc = count('location');
    if (loc) out.push(`Who do I know in ${loc[0]}?`);
    out.push(AI.ok || ps.some((p) => dueInfo(p)) ? 'Who should I catch up with soon?' : 'Who are my closest connections?');
    return out.slice(0, 4);
  }
  function askAbout(id) {
    if (id === ME) openAsk('Give me a quick overview of my network.');
    else openAsk(`Tell me about ${nameOf(id)} and how I know them.`);
  }
  function openAsk(q) {
    openSheet('ask', {}, { root: true });
    if (q) runAsk(q);
  }
  function answerEl(turn) {
    const a = turn.a;
    const wrap = h('div', { class: 'a' });
    const who = h('span', { class: 'who' }, icon(a.engine === 'claude' ? 'spark' : 'device'), a.engine === 'claude' ? 'Claude' : 'From your map');
    wrap.append(who);
    const bodyEl = h('div', { class: 'body' });
    if (a.text) bodyEl.append(richText(a.text));
    else if (a.pending) bodyEl.append(h('span', { class: 'thinking' }, h('i'), 'Thinking…'));
    wrap.append(bodyEl);
    if (a.error) wrap.append(h('div', { class: 'err' }, a.error));
    const tools = h('div', { class: 'tools-row' });
    if (a.pending) tools.append(h('button', { class: 'btn sm', type: 'button', onclick: () => Chat.ctl && Chat.ctl.abort() }, icon('stop', 14), 'Stop'));
    else if (a.engine === 'claude' && AI.ok && a.tier === 'quick' && turn === Chat.turns[Chat.turns.length - 1] && !a.error) tools.append(h('button', { class: 'btn sm', type: 'button', onclick: () => runAsk(turn.q, 'default', turn) }, icon('spark', 15), 'Think it through'));
    else if (a.error && a.retry) tools.append(h('button', { class: 'btn sm', type: 'button', onclick: () => runAsk(turn.q, a.tier || 'quick', turn) }, 'Try again'));
    if (tools.childElementCount) wrap.append(tools);
    turn.el = wrap;
    return wrap;
  }
  function paintTurn(turn) {
    if (!turn.el || !turn.el.isConnected) return;
    turn.el.replaceWith(answerEl(turn));
    const sb = E.sheetBody;
    if (sb.scrollHeight - sb.scrollTop - sb.clientHeight < 160) sb.scrollTop = sb.scrollHeight;
  }
  VIEWS.ask = () => {
    const body = h('div', {});
    if (!Chat.turns.length) {
      const sug = suggestions();
      body.append(h('p', { class: 'ask-intro' }, others().length ? 'Ask about anyone on your map — who they are, how you know them, how two people are connected, or who you know somewhere.' : 'Add a few people first, then ask things like “How do I know Sarah?” or “Who works at Stripe?”'));
      if (sug.length) body.append(h('div', { class: 'suggest' }, sug.map((s) => h('button', { type: 'button', onclick: () => runAsk(s) }, icon('ask'), s))));
    }
    const chat = h('div', { class: 'chat', id: 'chat' });
    for (const t of Chat.turns) chat.append(h('div', { class: 'q' }, t.q), answerEl(t));
    body.append(chat);
    const ta = h('textarea', { id: 'ask-input', rows: '1', placeholder: 'Ask a follow-up', enterkeyhint: 'send', 'aria-label': 'Ask a question' });
    const send = h('button', { class: 'send', type: 'button', 'aria-label': 'Ask', disabled: true }, icon('up'));
    const mic = h('button', { class: 'mic', type: 'button', 'aria-label': 'Speak' }, h('span', { class: 'bars', 'aria-hidden': 'true' }, h('span'), h('span'), h('span'), h('span')), icon('mic'));
    const go = () => {
      const q = ta.value.trim();
      if (!q) return;
      ta.value = '';
      send.disabled = true;
      growEl(ta);
      runAsk(q);
    };
    ta.addEventListener('input', () => { send.disabled = !ta.value.trim(); growEl(ta); });
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); go(); } });
    send.addEventListener('click', go);
    mic.addEventListener('click', () => toggleDictation(ta, mic, go));
    const foot = h('div', { class: 'ask-foot' }, mic, ta, send);
    return {
      title: 'Ask',
      body,
      foot,
      after: () => {
        E.sheetBody.scrollTop = E.sheetBody.scrollHeight;
        if (finePointer && !Chat.ctl) ta.focus();
      },
    };
  };
  async function runAsk(q, tier = 'quick', replace = null) {
    if (Chat.ctl) Chat.ctl.abort();
    const turn = replace || { q, a: null };
    turn.a = { text: '', pending: true, engine: AI.ok ? 'claude' : 'local', tier };
    if (!replace) Chat.turns.push(turn);
    if (Chat.turns.length > 30) Chat.turns.splice(0, Chat.turns.length - 30);
    const top = Sheet.stack[Sheet.stack.length - 1];
    if (top && top.view === 'ask' && sheetIsOpen()) renderSheet(false);
    else openSheet('ask', {}, { root: true });
    E.sheetBody.scrollTop = E.sheetBody.scrollHeight;
    if (!AI.ok) {
      await sleep(120);
      turn.a = { text: answerLocal(q), engine: 'local' };
      paintTurn(turn);
      return;
    }
    const ctl = new AbortController();
    Chat.ctl = ctl;
    const facts = questionFacts(q);
    const input = [{ role: 'user', content: ASK_RULES + `\n\nToday is ${todayStr()}.\n\n<map>\n` + networkText() + '\n</map>' }];
    for (const t of Chat.turns) {
      if (t === turn || !t.a || !t.a.text || t.a.error) continue;
      input.push({ role: 'user', content: t.q }, { role: 'assistant', content: t.a.text });
    }
    if (input.length > 9) input.splice(1, input.length - 9);
    input.push({ role: 'user', content: (facts ? 'Facts the app worked out from the map for this question:\n' + facts + '\n\n' : '') + 'Question: ' + q });
    try {
      const res = await AI.sample(input, {
        modelTier: tier,
        cache: false,
        signal: ctl.signal,
        onText: ({ text }) => {
          turn.a.text = text;
          turn.a.pending = false;
          paintTurn(turn);
        },
      });
      turn.a = { text: res.text, engine: 'claude', tier, error: res.truncated ? 'The answer was cut short. Ask for less at a time.' : '' };
    } catch (e) {
      if (e && e.code === 'cancelled') {
        turn.a = { text: e.text || '', engine: 'claude', tier, error: e.text ? 'Stopped.' : 'Stopped before an answer came back.', retry: true };
      } else if (e && AI_OFF.includes(e.code)) {
        aiFailed(e);
        turn.a = { text: answerLocal(q), engine: 'local' };
      } else {
        turn.a = { text: (e && e.code !== 'refused' && e.text) || '', engine: 'claude', tier, error: aiErrorText(e), retry: true };
        if (!turn.a.text) turn.a = { text: answerLocal(q), engine: 'local', error: aiErrorText(e) + ' Here’s what your map says directly.', retry: true, tier };
      }
    } finally {
      if (Chat.ctl === ctl) Chat.ctl = null;
    }
    paintTurn(turn);
  }

  /* ---------- menu ---------- */
  VIEWS.menu = () => {
    const hasEx = peopleList().some((p) => p.example);
    const item = (ic, t, d, fn, cls = '') => h('button', { class: 'row-btn ' + cls, type: 'button', onclick: fn }, h('span', { class: 'ico' }, icon(ic)), h('div', {}, h('div', { class: 't' }, t), d ? h('div', { class: 'd' }, d) : ''), '');
    const cloud = S.store.mode === 'cloud';
    const storage = cloud
      ? h('div', { class: 'status-card' }, icon('cloud'), h('div', {}, h('b', {}, 'Synced to your Claude account'), 'Open this page on your phone or computer and you’ll see the same map. It’s private to you, even if you share the link.'))
      : h('div', { class: 'status-card' }, icon('device'), h('div', {}, h('b', {}, 'Saved in this browser only'), S.store.reason === 'standalone' ? 'This copy keeps your map on this device. Export a backup to move it to your phone or computer.' : 'Kith couldn’t reach your Claude account, so changes stay on this device for now. Export a backup to be safe.'));
    const ai = h('div', { class: 'status-card' }, icon(AI.ok ? 'spark' : 'device'), h('div', {}, h('b', {}, AI.ok ? 'Claude reads notes and answers questions' : 'Notes and questions are handled on this device'), AI.ok ? 'Each request uses your Claude plan. Nothing is sent until you add a note or ask something.' : 'Claude isn’t available here, so Kith uses simpler on-device reading. Check what it finds before adding.'));
    let confirmErase = false;
    const eraseBox = h('div', {});
    const drawErase = () => {
      if (!confirmErase) {
        eraseBox.replaceChildren(item('erase', 'Erase everything', 'Delete every person and connection', () => { confirmErase = true; drawErase(); }, 'danger'));
        return;
      }
      eraseBox.replaceChildren(h('div', { class: 'confirm' }, h('p', {}, `Erase ${plural(others().length, 'person', 'people')} and ${plural(relList().length, 'connection', 'connections')}? You can undo for a few seconds afterwards.`), h('div', { class: 'foot-row' }, h('button', { class: 'btn', type: 'button', onclick: () => { confirmErase = false; drawErase(); } }, 'Keep'), h('button', { class: 'btn danger solid', type: 'button', onclick: eraseAll }, 'Erase'))));
    };
    drawErase();
    const body = h(
      'div',
      { style: 'display:grid;gap:4px' },
      h(
        'div',
        { class: 'list' },
        item('graph', 'Tidy up the map', 'Spread people out and untangle the threads', () => { closeSheet(); tidy(); }),
        item('fit', 'Fit everyone on screen', '', () => { closeSheet(); setTimeout(() => fitAll(), 50); }),
        item('bell', 'Keep in touch', 'Catch-ups that are due and upcoming birthdays', () => openSheet('touch', {}, { root: true })),
        item('contacts', 'Import contacts', 'From your phone, Google, Outlook or LinkedIn', () => openSheet('importHelp', {})),
        item('users', 'Edit your own details', 'Your name, work and notes about you', () => openSheet('personEdit', { id: ME })),
        item('download', 'Export a backup', 'Save everyone as a .json file', exportBackup),
        item('upload', 'Import a backup', 'Add people from a Kith .json file', () => { E.fileImport.value = ''; E.fileImport.click(); }),
        hasEx ? item('trash', 'Remove the example people', 'Keep only the people you added', removeExamples) : item('users', 'Show an example map', 'Ten made-up people to explore', loadExamples),
      ),
      h('div', { class: 'eyebrow' }, 'Where your map lives'),
      storage,
      ai,
      h('div', { class: 'eyebrow' }, 'Danger zone'),
      h('div', { class: 'list' }, eraseBox),
    );
    return { title: 'Kith', body };
  };
  function eraseAll() {
    const snap = { people: peopleList().filter((p) => !p.virtual).map(clone), rels: Object.values(S.rels).map(clone) };
    for (const r of Object.values(S.rels)) removeDoc(r.id);
    for (const p of peopleList()) if (!p.virtual) removeDoc(p.id);
    withMe(S.people);
    closeSheet();
    onData();
    fitAll();
    toast('Erased everything', {
      action: 'Undo',
      ms: 9000,
      run: () => {
        for (const p of snap.people) savePerson(p);
        for (const r of snap.rels) saveRel(r);
        onData();
        fitAll();
      },
    });
  }

  /* ---------- backup ---------- */
  VIEWS.exportText = ({ json }) => {
    const ta = h('textarea', { class: 'input', rows: '12', readonly: true, style: 'font:12px/1.45 var(--f-mono)' });
    ta.value = json;
    return {
      title: 'Backup',
      body: h('div', { class: 'form' }, h('p', { class: 'muted-note' }, 'This page can’t save files here. Copy the text below and keep it somewhere safe — paste it into a file named kith-backup.json to import it later.'), ta),
      foot: h('div', { class: 'foot-row' }, h('button', { class: 'btn primary', type: 'button', onclick: (e) => { ta.select(); copyText(json, e.currentTarget); } }, icon('copy', 18), 'Copy backup')),
    };
  };
  async function exportBackup() {
    const data = {
      app: 'kith',
      version: 1,
      exportedAt: new Date().toISOString(),
      people: peopleList().filter((p) => !p.virtual).map((p) => ({ ...bodyOf(p), id: p.id })),
      relationships: relList().map((r) => ({ ...bodyOf(r), id: r.id })),
    };
    const json = JSON.stringify(data, null, 2);
    const filename = `kith-backup-${new Date().toISOString().slice(0, 10)}.json`;
    if (window.claude && typeof window.claude.use === 'function') {
      const dl = await window.claude.use('downloads').catch(() => null);
      if (dl) {
        try {
          await dl.save({ filename, data: json });
          toast('Backup saved');
          return;
        } catch (e) {
          if (e && e.code === 'declined') return;
        }
      }
      openSheet('exportText', { json });
      return;
    }
    const a = h('a', { href: URL.createObjectURL(new Blob([json], { type: 'application/json' })), download: filename });
    document.body.append(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast('Backup downloaded');
  }
  const ID_OK = /^[\w.~:@+-]{1,120}$/;
  function cleanPerson(p) {
    const photo = typeof p.photo === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(p.photo) && p.photo.length < 220000 ? p.photo : '';
    const log = Array.isArray(p.log) ? p.log.filter((e) => e && dayNum(e.d) != null).slice(0, 60).map((e) => ({ d: String(e.d).slice(0, 10), note: str(e.note).slice(0, 2000) })) : [];
    const extra = { birthday: parseBirthday(p.birthday) || (/^--\d{2}-\d{2}$/.test(p.birthday || '') ? p.birthday : ''), link: /^https?:\/\//i.test(str(p.link)) ? str(p.link).slice(0, 500) : '', cadence: nearestCadence(p.cadence), cadenceFrom: dayNum(p.cadenceFrom) != null ? String(p.cadenceFrom).slice(0, 10) : '', lastContact: dayNum(p.lastContact) != null ? String(p.lastContact).slice(0, 10) : '', log };
    return { ...extra, id: p.id, kind: 'person', name: str(p.name).slice(0, 200), title: str(p.title).slice(0, 200), company: str(p.company).slice(0, 200), location: str(p.location).slice(0, 200), traits: arr(p.traits).slice(0, 60).map((t) => t.slice(0, 80)), details: str(p.details).slice(0, 20000), email: str(p.email).slice(0, 200), phone: str(p.phone).slice(0, 80), photo, x: Number.isFinite(p.x) ? Math.round(p.x) : NaN, y: Number.isFinite(p.y) ? Math.round(p.y) : NaN, example: !!p.example, createdAt: Number(p.createdAt) || now() };
  }
  function importData(d) {
    const people = Array.isArray(d && d.people) ? d.people : [];
    const rels = Array.isArray(d && d.relationships) ? d.relationships : Array.isArray(d && d.rels) ? d.rels : [];
    if (!people.length && !rels.length) { toast('That file has no people in it.'); return; }
    let np = 0;
    let nr = 0;
    const placed = [];
    for (const p of people) {
      if (!p || typeof p.id !== 'string' || !ID_OK.test(p.id)) continue;
      const v = cleanPerson(p);
      if (v.id !== ME && !v.name) continue;
      if (!Number.isFinite(v.x)) { const c = viewCenter(); Object.assign(v, freeSpot(c.x, c.y, placed)); placed.push([v.x, v.y]); }
      savePerson(v);
      np++;
    }
    for (const r of rels) {
      if (!r || typeof r.id !== 'string' || !ID_OK.test(r.id) || !S.people[r.a] || !S.people[r.b] || r.a === r.b) continue;
      saveRel({ id: r.id, a: r.a, b: r.b, type: str(r.type).slice(0, 120), category: CAT_KEYS.includes(r.category) ? r.category : inferCat(r.type), strength: clamp(Math.round(Number(r.strength) || 2), 1, 4), description: str(r.description).slice(0, 20000), example: !!r.example, createdAt: Number(r.createdAt) || now() });
      nr++;
    }
    closeSheet();
    onData();
    fitAll();
    toast(`Imported ${plural(np, 'person', 'people')} and ${plural(nr, 'connection', 'connections')}`);
  }
  function importFile(file) {
    const fr = new FileReader();
    fr.onload = () => {
      try { importData(JSON.parse(String(fr.result))); } catch { toast('That file isn’t a Kith backup.'); }
    };
    fr.readAsText(file);
  }

  /* ---------- example map ---------- */
  const EXAMPLE = {
    people: [
      ['ex-maya', 'Maya Okafor', 'Partner', 'Northwind Capital', 'New York', ['sharp', 'warm', 'early riser'], 'Ran the climate fintech dinner where you met in 2023. Training for the Berlin marathon.', -260, -150],
      ['ex-daniel', 'Daniel Reyes', 'Founder & CEO', 'Tidewater Labs', 'Austin', ['relentless', 'funny'], 'Raising a Series A this fall. Huge Longhorns fan.', 250, -120],
      ['ex-priya', 'Priya Raman', 'CTO', 'Tidewater Labs', 'Austin', ['calm under pressure', 'systems thinker'], 'Previously led infrastructure at a payments company.', 470, 50],
      ['ex-leo', 'Leo Brandt', 'Product designer', 'Freelance', 'Berlin', ['meticulous', 'dry humor'], '', 690, -110],
      ['ex-hannah', 'Hannah Kim', 'ICU nurse', 'Swedish Medical Center', 'Seattle', ['steady', 'generous'], 'Birthday March 14. Two kids, Ava and Sam.', -200, 240],
      ['ex-james', 'James Whitfield', 'Architect', 'Pine & Parallel', 'Seattle', ['quiet', 'great cook'], '', -470, 330],
      ['ex-sofia', 'Sofia Marchetti', 'Principal', 'Lumen Ventures', 'London', ['connector', 'direct'], 'Studied together at Oxford. Best person to ask about European fintech.', -560, -20],
      ['ex-omar', 'Omar Haddad', 'Head of Sales', 'Tidewater Labs', 'Austin', ['charismatic'], '', 470, 290],
      ['ex-grace', 'Grace Liu', 'Pediatrician', '', 'Brooklyn', ['thoughtful', 'hosts supper club'], 'Lives next door. Supper club every other Sunday.', 70, 330],
      ['ex-theo', 'Theo Novak', 'Retired CFO', '', 'Chicago', ['patient', 'old-school'], 'Monthly breakfast, first Tuesday.', -40, -320],
    ],
    rels: [
      ['ex-maya', ME, 'former manager', 'work', 3, 'Maya hired you into your first investing role and still reviews your big decisions.'],
      ['ex-daniel', ME, 'college roommate', 'friend', 4, 'Roommates for three years at UT. You talk most weeks.'],
      ['ex-daniel', 'ex-maya', 'portfolio founder', 'work', 3, 'Northwind led Tidewater’s seed round; Maya sits on the board.'],
      ['ex-priya', 'ex-daniel', 'co-founder', 'work', 4, 'Started Tidewater Labs together in 2022.'],
      ['ex-leo', 'ex-priya', 'partner', 'romantic', 4, 'Together six years; they split time between Austin and Berlin.'],
      ['ex-hannah', ME, 'sister', 'family', 4, ''],
      ['ex-james', 'ex-hannah', 'husband', 'romantic', 4, 'Married in 2019.'],
      ['ex-sofia', ME, 'friend', 'friend', 3, 'Met at Oxford. Catch up whenever either of you is in London or New York.'],
      ['ex-sofia', 'ex-maya', 'former colleague', 'work', 2, 'Both worked at Halden Partners early in their careers.'],
      ['ex-omar', 'ex-priya', 'direct report', 'work', 2, ''],
      ['ex-grace', ME, 'neighbor', 'friend', 3, 'Next door since 2021.'],
      ['ex-grace', 'ex-sofia', 'cousin', 'family', 3, ''],
      ['ex-theo', ME, 'mentor', 'mentor', 4, 'Monthly breakfast. Has helped you think through every career move since 2018.'],
      ['ex-theo', 'ex-maya', 'former boss', 'work', 2, 'Maya worked for Theo when he was CFO at Halden.'],
    ],
  };
  function loadExamples() {
    const me = pos(ME);
    const t = todayNum();
    const dd = (n) => fromDayNum(t + n);
    const soon = dd(4);
    const extra = {
      'ex-daniel': { cadence: 30, lastContact: dd(-41), log: [{ d: dd(-41), note: 'Dinner in Austin. Fundraising is slow; he wants intros to fintech angels.' }, { d: dd(-96), note: 'Called about the seed extension.' }] },
      'ex-maya': { cadence: 90, lastContact: dd(-97), log: [{ d: dd(-97), note: 'Coffee near her office. Asked how the new fund is going.' }] },
      'ex-theo': { cadence: 30, lastContact: dd(-12), log: [{ d: dd(-12), note: 'Monthly breakfast. Talked about board seats.' }] },
      'ex-sofia': { cadence: 90, lastContact: dd(-83), birthday: '1988-11-02' },
      'ex-grace': { cadence: 14, lastContact: dd(-3) },
      'ex-hannah': { birthday: '1991' + soon.slice(4) },
    };
    for (const [id, name, title, company, location, traits, details, x, y] of EXAMPLE.people) {
      savePerson({ id, name, title, company, location, traits, details, email: '', phone: '', photo: '', x: Math.round(me.x + x), y: Math.round(me.y + y), example: true, createdAt: now(), ...(extra[id] || {}) });
    }
    EXAMPLE.rels.forEach(([a, b, type, category, strength, description], i) => {
      saveRel({ id: 'ex-r' + i, a, b, type, category, strength, description, example: true, createdAt: now() + i });
    });
    closeSheet();
    onData();
    setTimeout(() => fitAll(700), 30);
    toast('Example map loaded. Remove it any time from the menu.');
  }
  function removeExamples() {
    const exPerson = (id) => !!(S.people[id] && S.people[id].example);
    for (const r of Object.values(S.rels)) if (r.example || exPerson(r.a) || exPerson(r.b)) removeDoc(r.id);
    for (const p of peopleList()) if (p.example) removeDoc(p.id);
    withMe(S.people);
    closeSheet();
    onData();
    fitAll();
    toast('Example people removed');
  }

  /* =====================================================================
     Composer: type, paste or speak
     ===================================================================== */
  const PH = { add: 'Type, paste or speak a note about someone', ask: 'Ask about anyone on your map' };
  const PH_SHORT = { add: 'Type, paste or speak…', ask: 'Ask about anyone…' };
  function setMode(m) {
    S.mode = m;
    for (const b of E.composer.querySelectorAll('.seg button')) b.setAttribute('aria-selected', String(b.dataset.mode === m));
    E.input.placeholder = (matchMedia('(max-width: 520px)').matches ? PH_SHORT : PH)[m];
    E.btnSend.setAttribute('aria-label', m === 'add' ? 'Add' : 'Ask');
    updateComposer();
  }
  function updateComposer() {
    if (!E.composer) return;
    if (!S.busy) {
      E.composerNote.className = 'composer-note';
      E.composerNote.textContent = S.mode === 'add' ? (AI.ok ? 'Claude reads it' : 'Read on this device') : AI.ok ? 'Claude answers' : 'Answers from your map';
    }
    E.btnImage.hidden = !(AI.ok && AI.images && S.mode === 'add');
    E.btnSend.disabled = !S.busy && !(E.input.value.trim() || S.attached);
  }
  function growEl(ta) {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 168) + 'px';
  }
  const grow = () => { growEl(E.input); updateComposer(); };
  function setBusy(on, note) {
    S.busy = on;
    E.btnSend.classList.toggle('busy', false);
    E.btnSend.replaceChildren(icon(on ? 'stop' : 'up'));
    E.btnSend.setAttribute('aria-label', on ? 'Stop' : S.mode === 'add' ? 'Add' : 'Ask');
    E.composerNote.className = 'composer-note' + (on ? ' busy' : '');
    if (on) E.composerNote.textContent = note || 'Working…';
    updateComposer();
  }
  const QUESTION = /^(who|whom|whose|what|where|when|why|how|which|tell me|show me|list|find|does|do i|did|is there|are there|can you|remind me)\b/i;
  const looksLikeQuestion = (t) => /\?\s*$/.test(t) || (QUESTION.test(t.trim()) && t.length < 220);

  let noteCtl = null;
  async function submitComposer() {
    if (S.busy) { if (noteCtl) noteCtl.abort(); return; }
    const text = E.input.value.trim();
    const img = S.attached;
    if (!text && !img) { E.input.focus(); return; }
    stopDictation(true);
    hideHint();
    if (S.mode === 'ask' || (!img && looksLikeQuestion(text))) {
      if (S.mode !== 'ask') setMode('ask');
      E.input.value = '';
      grow();
      openAsk(text);
      return;
    }
    await readNote(text, img);
  }
  async function readNote(text, img) {
    setBusy(true, img ? 'Reading the picture…' : 'Reading your note…');
    let draft = null;
    try {
      if (AI.ok) {
        noteCtl = new AbortController();
        try {
          const opts = { modelTier: img || text.length > 1400 ? 'default' : 'quick', signal: noteCtl.signal };
          if (img) opts.images = [img];
          const raw = await AI.sample.json(parsePrompt(text, !!img), opts);
          draft = normalizeDraft(raw, text, 'claude');
        } catch (e) {
          if (e && e.code === 'cancelled') return;
          aiFailed(e);
          if (img || !text) { toast(aiErrorText(e)); return; }
          draft = parseLocal(text);
          draft.fallback = aiErrorText(e);
        }
      } else {
        if (img) { toast('Reading pictures needs Claude, which isn’t available here. Paste the text instead.'); return; }
        await sleep(160);
        draft = parseLocal(text);
      }
    } finally {
      noteCtl = null;
      setBusy(false);
    }
    if (!draft.people.length && !draft.rels.length) {
      toast(draft.source === 'claude' ? 'Claude didn’t find anyone in that. Try naming the person.' : 'I couldn’t find anyone in that. Try a name, like “Sarah Chen runs design at Stripe.”');
      return;
    }
    E.input.value = '';
    clearAttach();
    grow();
    openSheet('review', { draft }, { root: true });
  }

  /* ---------- pictures ---------- */
  function attachImage(file) {
    if (!(AI.ok && AI.images)) {
      toast(AI.ok ? 'Pictures can’t be sent to Claude from here. Paste the text instead.' : 'Reading pictures needs Claude, which isn’t available here. Paste the text instead.');
      return;
    }
    if (AI.imageTypes.length && !AI.imageTypes.includes(file.type)) { toast('Use a PNG, JPEG, WebP or GIF picture.'); return; }
    clearAttach();
    S.attached = file;
    const url = URL.createObjectURL(file);
    S.attachedUrl = url;
    E.attach.replaceChildren(h('img', { src: url, alt: '' }), h('span', {}, 'Picture attached — Claude will read the people in it'), h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Remove picture', onclick: () => { clearAttach(); updateComposer(); } }, icon('x', 16)));
    E.attach.hidden = false;
    if (S.mode !== 'add') setMode('add');
    updateComposer();
  }
  function clearAttach() {
    if (S.attachedUrl) URL.revokeObjectURL(S.attachedUrl);
    S.attached = null;
    S.attachedUrl = null;
    E.attach.hidden = true;
    E.attach.replaceChildren();
  }
  function imageFrom(dt) {
    if (!dt) return null;
    for (const it of dt.items || []) if (it.kind === 'file' && /^image\//.test(it.type)) return it.getAsFile();
    for (const f of dt.files || []) if (/^image\//.test(f.type)) return f;
    return null;
  }
  const isEditable = (el) => el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

  /* ---------- speech ---------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const Dict = { rec: null, blocked: false, cancelled: false };
  function toggleDictation(target, btn, onDone) {
    if (Dict.rec) { stopDictation(false); return; }
    if (!SR || Dict.blocked) { dictationFallback(target); return; }
    let rec;
    try { rec = new SR(); } catch { Dict.blocked = true; dictationFallback(target); return; }
    rec.lang = navigator.language || 'en-US';
    rec.interimResults = true;
    rec.continuous = true;
    const base = target.value.trim() ? target.value.trim() + ' ' : '';
    let heard = false;
    rec.onresult = (ev) => {
      let fin = '';
      let interim = '';
      for (let i = 0; i < ev.results.length; i++) {
        const res = ev.results[i];
        if (res.isFinal) fin += res[0].transcript;
        else interim += res[0].transcript;
      }
      heard = true;
      target.value = (base + fin + interim).replace(/\s+/g, ' ').trimStart();
      target.dispatchEvent(new Event('input'));
    };
    rec.onerror = (ev) => {
      if (['not-allowed', 'service-not-allowed', 'audio-capture'].includes(ev.error)) {
        Dict.blocked = true;
        Dict.cancelled = true;
        dictationFallback(target);
      } else if (ev.error === 'no-speech') toast('I didn’t catch anything. Tap the mic and try again.');
      else if (ev.error !== 'aborted') toast('Listening stopped. Tap the mic to try again.');
    };
    rec.onend = () => {
      const mine = Dict.rec === rec;
      if (mine) Dict.rec = null;
      btn.classList.remove('on');
      btn.setAttribute('aria-label', 'Speak');
      const go = mine && heard && !Dict.cancelled && target.value.trim();
      Dict.cancelled = false;
      if (go && onDone) onDone();
    };
    Dict.rec = rec;
    Dict.btn = btn;
    btn.classList.add('on');
    btn.setAttribute('aria-label', 'Stop listening');
    try {
      rec.start();
      hideHint();
    } catch {
      Dict.rec = null;
      btn.classList.remove('on');
      Dict.blocked = true;
      dictationFallback(target);
    }
  }
  function stopDictation(cancel) {
    if (!Dict.rec) return;
    Dict.cancelled = !!cancel;
    try { Dict.rec.stop(); } catch { /* ignore */ }
  }
  function dictationTip() {
    const ua = navigator.userAgent;
    const plat = navigator.platform || '';
    const iOS = /iPhone|iPad|iPod/.test(ua) || (plat === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (iOS) return ['Tap the mic on your keyboard', 'Talk naturally — names, where they work, how you know them — then tap the arrow to add it.'];
    if (/Android/.test(ua)) return ['Tap the mic on your keyboard', 'Talk naturally, then tap the arrow to add it.'];
    if (/Mac/.test(plat)) return ['Press Fn twice to dictate', 'Or the microphone key. Talk naturally, then press Return to add it.'];
    if (/Win/.test(plat)) return ['Press Windows + H to dictate', 'Talk naturally, then press Enter to add it.'];
    return ['Use your keyboard’s voice typing', 'Talk naturally, then press Enter to add it.'];
  }
  let hintT = 0;
  function dictationFallback(target) {
    const [title, text] = dictationTip();
    target.focus();
    if (target !== E.input) { toast(`${title}. ${text}`); return; }
    E.hint.replaceChildren(h('span', { class: 'mic-dot' }, icon('mic', 18)), h('div', {}, h('b', {}, title), text), h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Close', onclick: hideHint }, icon('x', 16)));
    E.hint.hidden = false;
    clearTimeout(hintT);
    hintT = setTimeout(hideHint, 12000);
  }
  function hideHint() {
    if (E.hint) E.hint.hidden = true;
    clearTimeout(hintT);
  }

  /* =====================================================================
     Toast
     ===================================================================== */
  let toastT = 0;
  function toast(msg, { action, run, ms } = {}) {
    if (!E.toast) return;
    clearTimeout(toastT);
    E.toast.replaceChildren(h('span', {}, msg));
    if (action) E.toast.append(h('button', { type: 'button', onclick: () => { hideToast(); run(); } }, action));
    E.toast.hidden = false;
    void E.toast.offsetHeight;
    E.toast.classList.remove('away');
    toastT = setTimeout(hideToast, ms || (action ? 7000 : 3600));
  }
  function hideToast() {
    E.toast.classList.add('away');
    setTimeout(() => { if (E.toast.classList.contains('away')) E.toast.hidden = true; }, 300);
  }

  /* =====================================================================
     Boot
     ===================================================================== */
  function grab() {
    const ids = ['app', 'stage', 'world', 'edge-g', 'ghost', 'labels', 'nodes', 'filters', 'stats', 'sync', 'empty', 'composer', 'composer-note', 'input', 'btn-mic', 'btn-send', 'btn-image', 'attach', 'hint', 'sheet', 'sheet-grab', 'sheet-head', 'sheet-title', 'sheet-body', 'sheet-foot', 'sheet-back', 'sheet-close', 'toast', 'loader', 'loader-text', 'file-image', 'file-photo', 'file-import', 'drop-zone', 'btn-search', 'btn-add', 'btn-menu', 'btn-touch', 'touch-badge', 'file-contacts', 'btn-import-empty', 'due-banner', 'btn-zin', 'btn-zout', 'btn-fit', 'btn-example', 'btn-first'];
    for (const id of ids) E[id.replace(/-(\w)/g, (_, c) => c.toUpperCase())] = document.getElementById(id);
  }
  function wire() {
    E.ghost.removeAttribute('hidden');
    E.ghost.style.display = 'none';
    E.btnSearch.append(icon('search'));
    E.btnTouch.prepend(icon('bell'));
    E.btnTouch.addEventListener('click', () => openSheet('touch', {}, { root: true }));
    E.btnImportEmpty.addEventListener('click', () => openSheet('importHelp', {}, { root: true }));
    E.fileContacts.addEventListener('change', () => { const f = E.fileContacts.files && E.fileContacts.files[0]; if (f) importContactsFile(f); });
    E.btnAdd.append(icon('userPlus'));
    E.btnMenu.append(icon('more'));
    E.btnZin.append(icon('plus', 19));
    E.btnZout.append(icon('minus', 19));
    E.btnFit.append(icon('fit', 19));
    E.btnMic.append(icon('mic'));
    E.btnSend.append(icon('up'));
    E.btnImage.append(icon('image'));
    E.sheetBack.append(icon('back'));
    E.sheetClose.append(icon('x'));
    const scrim = document.getElementById('scrim');
    if (scrim) scrim.remove();

    E.stage.addEventListener('pointerdown', onDown);
    E.stage.addEventListener('pointermove', onMove);
    E.stage.addEventListener('pointerup', onUp);
    E.stage.addEventListener('pointercancel', onUp);
    E.stage.addEventListener('lostpointercapture', (e) => { if (ptrs.has(e.pointerId)) onUp(e, true); });
    E.stage.addEventListener('wheel', onWheel, { passive: false });
    E.stage.addEventListener('dblclick', (e) => {
      if (e.target.closest('.node, [data-rel]')) return;
      const w = toWorld(e.clientX, e.clientY);
      openSheet('personEdit', { x: w.x, y: w.y }, { root: true });
    });
    for (const ev of ['gesturestart', 'gesturechange']) E.stage.addEventListener(ev, (e) => e.preventDefault());

    E.btnSearch.addEventListener('click', () => openSheet('search', {}, { root: true }));
    E.btnAdd.addEventListener('click', () => openSheet('personEdit', {}, { root: true }));
    E.btnFirst.addEventListener('click', () => openSheet('personEdit', {}, { root: true }));
    E.btnExample.addEventListener('click', loadExamples);
    E.btnMenu.addEventListener('click', () => openSheet('menu', {}, { root: true }));
    const zc = (f) => { const r = stageRect(); const vr = visibleRect(); zoomAt(vr.left + vr.w / 2, vr.top + vr.h / 2 || r.height / 2, f); };
    E.btnZin.addEventListener('click', () => zc(1.25));
    E.btnZout.addEventListener('click', () => zc(0.8));
    E.btnFit.addEventListener('click', () => fitAll());
    E.sheetClose.addEventListener('click', closeSheet);
    E.sheetBack.addEventListener('click', sheetBack);
    wireSheetDrag();

    for (const b of E.composer.querySelectorAll('.seg button')) b.addEventListener('click', () => { setMode(b.dataset.mode); E.input.focus(); });
    E.composer.addEventListener('submit', (e) => { e.preventDefault(); submitComposer(); });
    E.input.addEventListener('input', () => { grow(); if (E.input.value) hideHint(); });
    E.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submitComposer(); }
      if (e.key === 'Escape') E.input.blur();
    });
    E.input.addEventListener('paste', (e) => {
      const img = imageFrom(e.clipboardData);
      const text = e.clipboardData && e.clipboardData.getData('text/plain');
      if (text && /BEGIN:VCARD/i.test(text)) { e.preventDefault(); openContacts(text, 'the pasted card'); return; }
      if (img && !(text && text.trim())) { e.preventDefault(); attachImage(img); }
    });
    E.btnMic.addEventListener('click', () => toggleDictation(E.input, E.btnMic, () => submitComposer()));
    E.btnImage.addEventListener('click', () => { E.fileImage.value = ''; E.fileImage.click(); });
    E.fileImage.addEventListener('change', () => { const f = E.fileImage.files && E.fileImage.files[0]; if (f) attachImage(f); });
    E.fileImport.addEventListener('change', () => { const f = E.fileImport.files && E.fileImport.files[0]; if (f) importFile(f); });

    // Paste anywhere on the map lands in the Add box.
    document.addEventListener('paste', (e) => {
      if (isEditable(e.target)) return;
      const img = imageFrom(e.clipboardData);
      const text = (e.clipboardData && e.clipboardData.getData('text/plain')) || '';
      if (!img && !text.trim()) return;
      e.preventDefault();
      if (/BEGIN:VCARD/i.test(text)) { openContacts(text, 'the pasted card'); return; }
      if (sheetIsOpen() && !isWide()) closeSheet();
      if (text.trim()) {
        E.input.value = (E.input.value.trim() ? E.input.value.trim() + '\n' : '') + text.trim();
        setMode(looksLikeQuestion(text) ? 'ask' : 'add');
        grow();
      }
      if (img) attachImage(img);
      E.input.focus();
    });

    // Drop a picture, a backup file or text onto the page.
    let dragDepth = 0;
    const hasStuff = (e) => e.dataTransfer && [...(e.dataTransfer.types || [])].some((t) => t === 'Files' || t === 'text/plain');
    E.app.addEventListener('dragenter', (e) => { if (!hasStuff(e)) return; e.preventDefault(); dragDepth++; E.dropZone.hidden = false; });
    E.app.addEventListener('dragover', (e) => { if (hasStuff(e)) e.preventDefault(); });
    E.app.addEventListener('dragleave', () => { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) E.dropZone.hidden = true; });
    E.app.addEventListener('drop', (e) => {
      if (!hasStuff(e)) return;
      e.preventDefault();
      dragDepth = 0;
      E.dropZone.hidden = true;
      const f = e.dataTransfer.files && e.dataTransfer.files[0];
      if (f && (/json/.test(f.type) || /\.json$/i.test(f.name))) { importFile(f); return; }
      if (f && (/vcard|csv/.test(f.type) || /\.(vcf|vcard|csv)$/i.test(f.name))) { importContactsFile(f); return; }
      if (f && /^image\//.test(f.type)) { attachImage(f); return; }
      const text = e.dataTransfer.getData('text/plain');
      if (text) { E.input.value = text.trim(); setMode('add'); grow(); E.input.focus(); }
    });

    document.addEventListener('keydown', (e) => {
      const typing = isEditable(document.activeElement);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSheet('search', {}, { root: true }); return; }
      if (e.key === 'Escape') {
        if (!E.hint.hidden) { hideHint(); return; }
        if (sheetIsOpen() && !typing) { closeSheet(); return; }
        if (!typing && (S.selected || S.selRel)) { S.selected = null; S.selRel = null; applyFocus(); }
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '/') { e.preventDefault(); if (sheetIsOpen() && !isWide()) closeSheet(); E.input.focus(); }
      else if (e.key === '+' || e.key === '=') zoomAt(stageRect().width / 2, stageRect().height / 2, 1.2);
      else if (e.key === '-') zoomAt(stageRect().width / 2, stageRect().height / 2, 1 / 1.2);
      else if (e.key === '0') fitAll();
    });

    const vv = window.visualViewport;
    const onVV = () => {
      if (!vv) return;
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      E.app.style.setProperty('--kb', (kb > 80 ? Math.round(kb) : 0) + 'px');
    };
    if (vv) { vv.addEventListener('resize', onVV); vv.addEventListener('scroll', onVV); }
    addEventListener('resize', () => { if (sheetIsOpen()) E.app.classList.toggle('panel', isWide()); });
    setMode('add');
  }

  let firstWait = 0;
  function receive(payload) {
    const { people, rels, fromCache } = payload;
    if (!S.ready && fromCache && !Object.keys(people).length && firstWait !== -1) {
      if (!firstWait) firstWait = setTimeout(() => { firstWait = -1; if (!S.ready) receive({ ...payload, fromCache: false }); }, 2500);
      return;
    }
    if (firstWait > 0) clearTimeout(firstWait);
    firstWait = -1;
    S.people = withMe(people);
    S.rels = rels;
    const first = !S.ready;
    if (first) {
      S.ready = true;
      render();
      const saved = (() => { try { return JSON.parse(lsGet('kith.view') || 'null'); } catch { return null; } })();
      if (saved && Number.isFinite(saved.k) && others().length) { S.view = { x: saved.x, y: saved.y, k: clamp(saved.k, K_MIN, K_MAX) }; applyView(); }
      else fitAll(0);
      E.loader.classList.add('away');
      setTimeout(() => { E.loader.hidden = true; }, 450);
      S.loadedOnce = true;
      refreshSheet();
      return;
    }
    onData();
  }
  let retried = false;
  function onStoreError(e) {
    if (e && e.code === 'unavailable' && !retried) {
      retried = true;
      setTimeout(() => S.store.subscribe(receive, onStoreError), 1500);
      return;
    }
    if (!S.ready) {
      E.loaderText.replaceWith(h('p', {}, 'Kith couldn’t open your saved map. Close this page and open it again.'));
      return;
    }
    toast('Lost the connection to your saved map. Reopen the page to reconnect.');
  }

  async function boot() {
    grab();
    wire();
    applyView();
    let store = null;
    let reason = 'standalone';
    if (window.claude && typeof window.claude.use === 'function') {
      initAI();
      try {
        const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
        const uid = user ? await user.id() : null;
        if (db && uid) store = new CloudStore(db, uid);
        else reason = 'no-account';
      } catch {
        reason = 'no-account';
      }
    } else {
      E.loader.hidden = true;
    }
    if (!store) store = new LocalStore(reason);
    S.store = store;
    syncBadge();
    store.subscribe(receive, onStoreError);
    if (store.mode === 'local' && reason !== 'standalone') setTimeout(() => toast('Couldn’t reach your Claude account, so this map is saved in this browser for now.'), 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
