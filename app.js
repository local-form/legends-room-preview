(() => {
  const BOOKSY = 'https://booksy.com/en-us/463423_a-j-the-legends-room-grooming-bar_barber-shop_28510_bloomfield';
  const book = id => `${BOOKSY}?do=open-widget&variantId=${id}`;
  // Real Booksy services, prices ("from") and times, read 2026-11-08.
  const S = {
    cut:      { n: 'Haircut', p: 45, t: 60, id: 10538197 },
    brows:    { n: 'Haircut with eyebrows', p: 48, t: 60, id: 10527893 },
    beard:    { n: 'Haircut with beard', p: 50, t: 60, id: 10538192 },
    bb:       { n: 'Haircut, beard & eyebrows', p: 55, t: 60, id: 10527890 },
    towel:    { n: 'Haircut, beard, eyebrows & hot towel', p: 60, t: 60, id: 10538207 },
    design:   { n: 'Haircut, beard, eyebrows & freestyle design', p: 65, t: 60, id: 10527886 },
    vip:      { n: 'VIP Cut', s: 'Cut, hot towel massage, black mask', p: 70, t: 60, id: 10789365 },
    teen:     { n: 'Teenager haircut (13–19)', p: 40, t: 45, id: 10527895 },
    kid:      { n: 'Kids haircut (1–12)', p: 35, t: 45, id: 10527887 },
    cleanup:  { n: 'The Cleanup!', p: 40, t: 30, id: 11034832 },
    shape:    { n: 'Shapeup', s: 'In between cuts, razor included', p: 25, t: 30, id: 10527891 },
    shapeB:   { n: 'Shapeup with beard', p: 30, t: 30, id: 10527894 },
    shapeBB:  { n: 'Shapeup, beard & eyebrows', p: 35, t: 30, id: 10527892 },
    bigen:    { n: 'Bigen on the beard', p: 15, t: 15, id: 10527888 },
    eyebrows: { n: 'Eyebrows', p: 10, t: 15, id: 10527885 },
    smpC:     { n: 'SMP consultation', p: null, t: 60, id: 10527871 },
    smp1:     { n: 'SMP procedure, session 1', p: null, t: 300, id: 10527872 }
  };
  const OPTS = { adult: ['cut', 'brows', 'beard', 'bb', 'towel', 'design', 'vip'], teen: ['teen'], kid: ['kid'] };
  // A.J.'s cuts, named as he names them on Booksy.
  const CUTS = [
    { k: 'burst', n: 'Burst Fade', img: 'assets/img/cut-burst.webp', who: 'adult', s: 'cut' },
    { k: 'low-taper', n: 'Low Taper Fade', img: 'assets/img/cut-low-taper.webp', who: 'adult', s: 'cut' },
    { k: 'pompadour', n: 'Pompadour, Beard Lining', img: 'assets/img/cut-pompadour.webp', who: 'adult', s: 'beard' },
    { k: 'skintight', n: 'Skintight Fade', img: 'assets/img/cut-skintight.webp', who: 'adult', s: 'beard' },
    { k: 'combover', n: 'Low Skin Fade Combover', img: 'assets/img/cut-combover.webp', who: 'adult', s: 'cut' },
    { k: 'beard-brows', n: 'Cut, Beard & Brows', img: 'assets/img/cut-beard-brows.webp', who: 'adult', s: 'bb' },
    { k: 'kids-design', n: 'Kids Skintight Fade + Design', img: 'assets/img/cut-kids-design.webp', who: 'kid', s: 'kid', note: 'Ask A.J. about adding a design' },
    { k: 'freestyle', n: 'Freestyle Design', img: 'assets/img/cut-freestyle.webp', who: 'adult', s: 'design' }
  ];
  const $ = (q, el = document) => el.querySelector(q);
  const price = s => s.p == null ? 'Ask' : `$${s.p}+`;
  const time = m => m >= 60 ? (m % 60 ? `${Math.floor(m / 60)} hr ${m % 60} min` : `${m / 60} hr${m > 60 ? 's' : ''}`) : `${m} min`;
  window.LR = { S, book, price, time };

  const ticket = $('#ticket'), scrim = $('#scrim'), list = $('#cutlist');
  const desk = matchMedia('(min-width:1000px)');
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cur = null, who = 'adult', svc = 'cut', lastFocus = null, mi = 0;

  // the board: every cut, with its Booksy price
  list.innerHTML = CUTS.map((c, i) => `<button class="cut" type="button" role="listitem" aria-pressed="${i === 0}" data-i="${i}" aria-label="${c.n}, ${price(S[c.s])}. Show in the mirror">
    <img src="${c.img}" alt="" width="900" height="1125" loading="${i < 4 ? 'eager' : 'lazy'}"><span class="n">${c.n}${c.who === 'kid' ? ' <em class="kid">kids</em>' : ''}</span><span class="p">${price(S[c.s])}</span></button>`).join('');

  // the mirror: each cut arrives with a clipper pass, bottom to top
  const mCur = $('#m-cur'), mNxt = $('#m-nxt'), line = $('.clip-line'), glass = $('.glass');
  let busy = null;
  function plate(c) {
    const s = S[c.s];
    $('#m-name').textContent = c.n;
    $('#m-meta').textContent = `${s.n.replace(/\s*\(.*\)/, '')} · ${price(s)} · ${time(s.t)}`;
    const b = $('#m-book'); b.href = book(s.id); b.setAttribute('aria-label', `Book ${c.n} (${s.n}, ${price(s)}) on A.J.'s Booksy`);
    $('#m-count').textContent = `${String(CUTS.indexOf(c) + 1).padStart(2, '0')} / ${String(CUTS.length).padStart(2, '0')}`;
    list.querySelectorAll('.cut').forEach(t => t.setAttribute('aria-pressed', String(+t.dataset.i === CUTS.indexOf(c))));
  }
  function pass(el, done) {
    const h = glass.clientHeight;
    const a = el.animate([{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 1100, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'both' });
    line.animate([{ transform: `translateY(${h}px)`, opacity: 1 }, { transform: 'translateY(0)', opacity: 1, offset: .92 }, { transform: 'translateY(0)', opacity: 0 }], { duration: 1150, easing: 'cubic-bezier(.65,0,.35,1)' });
    el.animate([{ transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 1600, easing: 'cubic-bezier(.16,1,.3,1)' });
    a.onfinish = () => done && done(a);
  }
  async function show(i, anim = true) {
    i = (i + CUTS.length) % CUTS.length;
    if (i === mi && anim) return;
    const c = CUTS[i]; mi = i; plate(c);
    mCur.alt = `${c.n} by A.J. at The Legends Room`;
    if (rm || !anim || !mNxt.animate) { mCur.src = c.img; return; }
    const token = busy = {};
    mNxt.src = c.img; try { await mNxt.decode(); } catch (e) {}
    if (busy !== token) return;
    mNxt.hidden = false;
    pass(mNxt, a => {
      if (busy !== token) return;
      mCur.src = c.img;
      mCur.decode().catch(() => {}).then(() => { if (busy === token) { mNxt.hidden = true; a.cancel(); } });
    });
  }
  // first paint: the sharp photo, wiped in by the clipper as soon as it has loaded (never a blurred stand-in)
  plate(CUTS[0]);
  let landed = 0;
  const land = () => { if (!landed) landed = performance.now(); };
  // the photo is visible and sharp from the first paint; the clipper line just sweeps over it once
  const ready = mCur.complete && mCur.naturalWidth ? Promise.resolve() : new Promise(r => { mCur.addEventListener('load', r, { once: true }); mCur.addEventListener('error', r, { once: true }); });
  ready.then(() => { land(); if (!rm && line.animate) { const h = glass.clientHeight; line.animate([{ transform: `translateY(${h}px)`, opacity: 0 }, { opacity: 1, offset: .1 }, { transform: 'translateY(0)', opacity: 1, offset: .9 }, { transform: 'translateY(0)', opacity: 0 }], { duration: 900, easing: 'cubic-bezier(.65,0,.35,1)' }); } });
  // slow auto-turn until someone picks a cut: each cut holds at least 5.5 s; paused off screen, in a hidden tab or while the ticket is open
  let auto = !rm, vis = true, timer = null;
  const HOLD = 5500;
  let last = 0;   // when the mirror last finished changing
  const tick = () => { clearTimeout(timer); if (!auto) return; timer = setTimeout(() => {
    if (landed && !last) last = landed;
    if (last && performance.now() - last >= HOLD && vis && !document.hidden && !ticket.classList.contains('open')) { show(mi + 1); last = performance.now() + 1100; }
    tick(); }, 500); };
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { vis = es[0].isIntersecting; }).observe(glass);
  tick();
  const stopAuto = () => { auto = false; clearTimeout(timer); };
  list.addEventListener('click', e => {
    const t = e.target.closest('.cut'); if (!t) return;
    stopAuto(); show(+t.dataset.i);
    if (!desk.matches && $('.mwrap').getBoundingClientRect().top < 0) $('.mwrap').scrollIntoView({ behavior: rm ? 'auto' : 'smooth', block: 'start' });
  });
  $('#m-custom').addEventListener('click', () => { stopAuto(); open(CUTS[mi].k); });
  $('#m-book').addEventListener('click', stopAuto);
  window.LRshow = i => { stopAuto(); return show(i); };

  const adds = $('#adds'), hint = $('#t-hint');
  const SET = { cut: [], brows: ['brows'], beard: ['beard'], bb: ['beard', 'brows'], towel: ['beard', 'brows', 'towel'], design: ['beard', 'brows', 'design'], vip: ['vip'] };
  let on = new Set();
  function resolve() {
    if (who !== 'adult') return who;
    if (on.has('vip')) return 'vip';
    if (on.has('towel')) return 'towel';
    if (on.has('design')) return 'design';
    if (on.has('beard') && on.has('brows')) return 'bb';
    if (on.has('beard')) return 'beard';
    if (on.has('brows')) return 'brows';
    return 'cut';
  }
  function total() {
    const s = S[svc];
    $('#t-sum').textContent = s.n; $('#t-price').textContent = price(s); $('#t-time').textContent = time(s.t);
    $('#t-book').href = book(s.id);
    $('#t-book').setAttribute('aria-label', `Book ${s.n} on A.J.'s Booksy (opens Booksy)`);
  }
  function sync(msg = '') {
    svc = resolve();
    adds.querySelectorAll('input').forEach(i => { i.checked = on.has(i.value); i.disabled = who !== 'adult'; });
    hint.textContent = who !== 'adult' ? 'Add-ons for kids and teens aren\'t listed on Booksy. Ask A.J. at the chair.' : msg;
    total();
  }
  function open(k, focus = true) {
    cur = CUTS.find(c => c.k === k) || CUTS[0];
    who = cur.who; svc = cur.s;
    const img = $('.t-img'); img.src = cur.img; img.alt = cur.n;
    $('#t-name').textContent = cur.n;
    $('#t-note').textContent = cur.note || 'Photo from A.J.\'s Booksy';
    ticket.querySelectorAll('input[name=who]').forEach(r => r.checked = r.value === who);
    on = new Set(SET[cur.s] || []); sync();
    lastFocus = document.activeElement;
    ticket.classList.add('open'); ticket.setAttribute('aria-hidden', 'false');
    scrim.hidden = false; if (!desk.matches) document.documentElement.classList.add('sheet-open');
    if (focus) setTimeout(() => $('.t-close').focus({ preventScroll: true }), rm ? 0 : 300);
  }
  function close() {
    ticket.classList.remove('open'); ticket.setAttribute('aria-hidden', 'true');
    scrim.hidden = true; document.documentElement.classList.remove('sheet-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  ticket.addEventListener('change', e => {
    const v = e.target.value;
    if (e.target.name === 'who') { who = v; return sync(); }
    if (!adds.contains(e.target)) return;
    let msg = '';
    if (e.target.checked) {
      on.add(v);
      if (v === 'vip') { on = new Set(['vip']); msg = 'The VIP Cut is its own service: cut, hot towel massage and black mask.'; }
      else on.delete('vip');
      if (v === 'towel' || v === 'design') {
        if (!on.has('beard') || !on.has('brows')) msg = `On A.J.'s menu the ${v === 'towel' ? 'hot towel' : 'freestyle design'} comes with beard and eyebrows, so we added them.`;
        on.add('beard'); on.add('brows'); on.delete(v === 'towel' ? 'design' : 'towel');
        if (!msg && v === 'design') msg = '';
      }
    } else {
      on.delete(v);
      if (v === 'beard' || v === 'brows') { on.delete('towel'); on.delete('design'); }
    }
    sync(msg);
  });
  $('.t-close').addEventListener('click', close);
  scrim.addEventListener('click', close);
  addEventListener('keydown', e => { if (e.key === 'Escape' && ticket.classList.contains('open')) close(); });
  $('#t-req').addEventListener('click', () => { if (window.LRfill) window.LRfill(svc); close(); });
  window.LRopen = open; window.LRclose = close;

  const q = new URLSearchParams(location.search).get('cut');
  const qi = CUTS.findIndex(c => c.k === q);
  if (qi > 0) { auto = false; clearTimeout(timer); mi = -1; show(qi, false); }
})();

// full menu, grouped; every row books its Booksy service
(() => {
  const { S, book, price, time } = window.LR;
  const G = [
    ['Cuts', ['cut', 'brows', 'beard', 'bb', 'towel', 'design', 'vip']],
    ['Touch-ups', ['cleanup', 'shape', 'shapeB', 'shapeBB']],
    ['Kids & teens', ['kid', 'teen']],
    ['Beard & brows', ['bigen', 'eyebrows']],
    ['SMP', ['smpC', 'smp1']]
  ];
  const row = k => { const s = S[k]; return `<a class="mrow" href="${book(s.id)}" target="_blank" rel="noopener" aria-label="Book ${s.n}, ${s.p == null ? 'price at consultation' : price(s)}, ${time(s.t)}, on Booksy"><span class="n">${s.n}${s.s ? `<small>${s.s}</small>` : ''}</span><span class="p">${price(s)}<small>${time(s.t)}</small></span></a>`; };
  document.getElementById('menu-grid').innerHTML = G.map(([h, ks]) => `<div class="mcard" data-reveal><h3>${h}</h3>${ks.map(row).join('')}</div>`).join('');

  // request form, prefilled by the ticket
  const sel = document.getElementById('f-service'), form = document.getElementById('req-form');
  sel.innerHTML = G.map(([h, ks]) => `<optgroup label="${h}">${ks.map(k => `<option value="${k}">${S[k].n} (${price(S[k])})</option>`).join('')}</optgroup>`).join('');
  const d = new Date(), pad = n => String(n).padStart(2, '0'), iso = x => `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
  const day = document.getElementById('f-day'); day.min = iso(d);
  window.LRfill = k => { if (S[k]) sel.value = k; };
  form.addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(form), err = document.getElementById('f-err');
    const name = (f.get('name') || '').trim(), phone = (f.get('phone') || '').trim();
    if (!name || phone.replace(/\D/g, '').length < 10) { err.textContent = !name ? 'Add your name so the shop knows who to text.' : 'Add a 10-digit phone number so the shop can text you back.'; return; }
    if (day.value && new Date(day.value + 'T12:00').getDay() === 0) { err.textContent = 'The shop is closed on Sundays. Pick another day.'; return; }
    err.textContent = '';
    const s = S[f.get('service')];
    const when = day.value ? new Date(day.value + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 'any day';
    document.getElementById('f-done-t').textContent = `${s.n}, ${when}, ${String(f.get('time')).toLowerCase()}, for ${name.split(' ')[0]}.`;
    document.getElementById('f-done-book').href = book(s.id);
    form.hidden = true; const done = document.getElementById('f-done'); done.hidden = false; done.focus();
  });

  // today in the hours table
  const rows = document.querySelectorAll('.hours tbody tr'), t = (d.getDay() + 6) % 7; if (rows[t]) rows[t].classList.add('today');

  // reveal
  const els = [...document.querySelectorAll('[data-reveal]')];
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-visible')); return; }
  const n = new Map();
  els.forEach(e => { const p = e.parentElement, i = n.get(p) || 0; e.style.setProperty('--d', Math.min(i, 6) * .08 + 's'); n.set(p, i + 1); });
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } }), { threshold: .01, rootMargin: '0px 0px -8% 0px' });
  els.forEach(e => io.observe(e));
  setTimeout(() => els.forEach(e => { if (e.getBoundingClientRect().top < innerHeight) e.classList.add('is-visible'); }), 1500);
})();

// phone menu: opens/closes, closes on link tap, Escape, outside tap or going desktop
(() => {
  const html = document.documentElement, btn = document.querySelector('.menu-btn'), nav = document.getElementById('nav');
  const set = open => { html.classList.toggle('nav-open', open); btn.setAttribute('aria-expanded', open); btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); };
  btn.addEventListener('click', () => set(!html.classList.contains('nav-open')));
  nav.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && html.classList.contains('nav-open')) { set(false); btn.focus(); } });
  document.addEventListener('click', e => { if (html.classList.contains('nav-open') && !e.target.closest('.head')) set(false); });
  matchMedia('(min-width:1000px)').addEventListener('change', () => set(false));
})();
