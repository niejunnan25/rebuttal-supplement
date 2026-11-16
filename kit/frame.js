/* Reviewer-page frame (approved 2026-11-14, "V11").
   Adds, at view time only: a sticky per-reviewer navigation, a page contents list,
   [n/N] numbers that match the OpenReview comments (comment 1 is the overview),
   the reviewer's own W/Q labels, and three-line clamping of long reviewer quotes.
   On the index page it renders the overview table from data/frame.js.
   Block content written by the section builders is never changed. */
(function () {
  const F = window.FRAME; if (!F) return;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (t, cls, html) => { const e = document.createElement(t); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const zh = (document.documentElement.lang || '').startsWith('zh');
  const T = (en, z) => (zh ? z : en);
  const file = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '');
  const lang = zh ? 'zh' : 'en';
  const blocksOf = r => (F.order[r] || []).map(id => F.blocks.find(b => b.reviewer === r && b.id === id)).filter(Boolean);
  const num = (r, id) => { const xs = F.order[r] || []; return `[${xs.indexOf(id) + 1}/${xs.length}]`; };

  function reviewerPage(r) {
    const main = $('main'); if (!main) return;
    document.body.classList.add('framed');
    $$('main section[id] article[id]').forEach(a => a.closest('section[id]').after(a));
    let blocks = $$('main > section[id], main > article[id]');
    const order = (F.order[r] || []).map(id => blocks.find(b => b.id === id)).filter(Boolean);
    blocks.filter(b => !order.includes(b)).forEach(b => order.push(b));
    const anchor = blocks[0] ? blocks[0].previousElementSibling : null;
    let prev = anchor; order.forEach(b => { if (prev) prev.after(b); else main.prepend(b); prev = b; });
    blocks = order;
    const N = blocks.length;   // the overview comment is not numbered; topics are [1/N]..[N/N]
    blocks.forEach((b, i) => {
      const m = F.blocks.find(x => x.reviewer === r && x.id === b.id) || {};
      b.classList.add('fr-block'); b.dataset.num = `[${i + 1}/${N}]`;
      const title = $('h2.question-title', b);
      if (title && !$('h1', b)) { const h = el('h1', 'question-title', title.innerHTML); title.replaceWith(h); }
      const k = $('.kicker', b);
      if (k) k.innerHTML = `<span class="fr-num">${b.dataset.num}</span><span class="fr-rv">Reviewer ${r}</span>${m.label ? `<span class="fr-lb">${m.label}</span>` : ''}${m.topic ? `<span class="fr-tp">${m.topic[lang]}</span>` : ''}`;
      $$('.quote blockquote', b).forEach(q => {
        if (q.scrollHeight > 3.4 * parseFloat(getComputedStyle(q).lineHeight)) {
          q.classList.add('fr-clamp');
          const t = el('button', 'fr-more', T('Show the full comment', '')); t.type = 'button';
          t.onclick = () => { const on = q.classList.toggle('fr-clamp'); t.textContent = on ? T('Show the full comment', '') : T('Show less', ''); };
          q.after(t);
        }
      });
    });
    const items = blocks.map(b => { const m = F.blocks.find(x => x.reviewer === r && x.id === b.id) || {}; return { id: b.id, n: b.dataset.num, m, t: ($('h1', b) || {}).textContent || b.id }; });
    const top = $('.top', main); const langLink = top ? $('a[data-language]', top) : null;
    const bar = el('nav', 'fr-bar');
    bar.innerHTML = `<a class="fr-home" href="index.html">${T('All responses', '')}</a><span class="fr-who">Reviewer ${r}</span><a href="#top">${T('Overview', '')}</a>` +
      items.map(x => `<a href="#${x.id}">${x.n} ${x.m.label || ''}${x.m.topic ? ' · ' + x.m.topic[lang] : ''}</a>`).join('');
    if (langLink) { langLink.classList.add('fr-lang'); bar.appendChild(langLink.cloneNode(true)); }
    document.body.prepend(bar);
    // left sidebar: same entries, highlighted as the reader scrolls (the top bar is only shown on narrow screens)
    const others = ['64X3', 'qD2Z', '3ufq'].filter(x => x !== r && (F.order[x] || []).length);
    const side = el('aside', 'fr-side');
    side.innerHTML = `<a class="fr-side-home" href="index.html">← ${T('All responses', '')}</a>` +
      `<div class="fr-side-h">Reviewer ${r}</div>` +
      `<a class="fr-side-i" href="#top"><span class="fr-side-t">${T('Overview', '')}</span></a>` +
      items.map(x => `<a class="fr-side-i" href="#${x.id}"><span class="fr-side-n">${x.n}${x.m.label ? ' · ' + x.m.label : ''}</span><span class="fr-side-t">${x.m.topic ? x.m.topic[lang] : x.t}</span></a>`).join('') +
      `<div class="fr-side-o">${T('Other reviewers', '')}</div>` + others.map(x => `<a class="fr-side-p" href="${x}.html">Reviewer ${x}</a>`).join('') +
      (langLink ? `<a class="fr-side-lang" href="${langLink.getAttribute('href')}">${langLink.textContent}</a>` : '');
    document.body.prepend(side); document.body.classList.add('fr-has-side');
    // sliding marker that glides to the highlighted entry
    const mk = el('div', 'fr-side-mk'); side.appendChild(mk); side.classList.add('fr-mk-on');
    const place = () => { const on = $('.fr-side-i.on', side); if (!on) { mk.style.opacity = '0'; return; } mk.style.opacity = '1'; mk.style.top = (on.offsetTop + 6) + 'px'; mk.style.height = (on.offsetHeight - 12) + 'px'; };
    new MutationObserver(place).observe(side, { subtree: true, attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', place);
    if (top) top.remove();
    const lede = T(`This page accompanies our responses to Reviewer ${r} on OpenReview. Each section below matches one comment, numbered [1/${N}] to [${N}/${N}] as in the comment titles, with the cited figures and videos placed after the paragraph that cites them.`,
                   '' + r + '' + N + '' + N + '/' + N + '');
    const toc = el('div', 'fr-toc'); toc.id = 'top';
    toc.innerHTML = `<div class="fr-eyebrow">${T('Anonymous submission · author response', '')}</div><h1 class="fr-title">${T('Responses to Reviewer', '')} ${r}${T('', '')}</h1><p class="fr-lede">${lede}</p><ul>` +
      items.map(x => `<li><a href="#${x.id}"><span class="fr-n">${x.n}</span><b>${x.m.label || ''}</b>${x.t}</a></li>`).join('') + '</ul>';
    main.prepend(toc);
    const links = [...$$('a[href^="#"]', bar), ...$$('a[href^="#"]', side)];
    const sections = [toc, ...blocks];
    let current = null;
    const spy = () => {
      const line = (bar.offsetParent ? bar.offsetHeight : 0) + 120;
      let cur = sections[0];
      for (const s of sections) { if (s.getBoundingClientRect().top <= line) cur = s; else break; }
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) cur = sections[sections.length - 1];
      if (cur === current) return; current = cur;
      const href = '#' + cur.id;
      links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === href));
      const sa = $(`a.fr-side-i[href="${href}"]`, side);
      if (sa) { const sr = side.getBoundingClientRect(), ar = sa.getBoundingClientRect(); if (ar.top < sr.top + 60 || ar.bottom > sr.bottom - 60) side.scrollTop += ar.top - sr.top - sr.height / 3; }
      const ba = $(`a[href="${href}"]`, bar); if (ba && bar.offsetParent) bar.scrollLeft = ba.offsetLeft - 120;
    };
    let ticking = false;
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; spy(); }); } }, { passive: true });
    window.addEventListener('resize', spy); spy();
    const go = () => {
      const h = decodeURIComponent(location.hash.slice(1)).split('@')[0]; if (!h) return;
      const t = document.getElementById(h); if (!t) return;
      const d = t.closest('details'); if (d) d.open = true;
      window.scrollTo(0, t.getBoundingClientRect().top + window.scrollY - (bar.offsetParent ? bar.offsetHeight : 0) - 14);
    };
    setTimeout(go, 80); setTimeout(go, 900); window.addEventListener('hashchange', () => setTimeout(go, 30));
  }

  function indexPage() {
    const main = $('main'); if (!main) return;
    document.body.classList.add('framed-index');
    const topNav = $('.top nav', main); if (topNav) topNav.style.display = 'none';
    const topHome = $('.top > a:not([data-language])', main); if (topHome) topHome.style.visibility = 'hidden';
    const dir = $('ul.directory', main);
    const reviewers = ['64X3', 'qD2Z', '3ufq'].filter(r => (F.order[r] || []).length);
    let html = '';
    if (F.general) {
      main.querySelectorAll(':scope > p').forEach(x => { if (!x.closest('.fr-index')) x.style.display = 'none'; });
      const h = $('main > h1'); if (h) h.textContent = T(F.general.title, '');
      html += `<div class="fr-general">${F.general[lang] || F.general.en}</div>`;
    }
    html += `<p class="fr-guide">${T('Each reviewer has one page. On OpenReview, each of our comments answers one point, and the numbers [n/N] below match the comment titles.',
                                         '')}</p>`;
    html += `<table class="fr-sum"><thead><tr><th>${T('Comment', '')}</th><th>${T('Point', '')}</th><th>${T('Short answer (from our response)', '')}</th><th>${T('Evidence', '')}</th></tr></thead><tbody>`;
    for (const r of reviewers) {
      const xs = blocksOf(r);
      html += `<tr><td class="fr-grp" colspan="4">Reviewer ${r} — ${xs.length} ${T('points', '')} · <a href="${r}.html">${T('open page', '')}</a></td></tr>`;
      for (const b of xs) {
        const c = b[lang] || b.en;
        html += `<tr><td><span class="fr-n">${num(r, b.id)}</span><br><span class="fr-lbt">${b.label}</span></td><td class="fr-q"><a href="${r}.html#${b.id}">${c.title}</a></td><td class="fr-a">${c.short || ''}</td><td class="fr-ev">${(c.figs || []).map(f => `<a href="${r}.html#${f.id}">${f.label}</a>`).join('') || `<span class="fr-none">${T('text and formulas', '')}</span>`}</td></tr>`;
      }
    }
    html += '</tbody></table>';
    const wrap = el('div', 'fr-index', html);
    if (dir) dir.before(wrap); else main.appendChild(wrap);
  }

  const run = () => { const key = document.body.dataset.reviewer || file; if (F.order[key]) reviewerPage(key); else if (file === 'index') indexPage(); };
  if (document.readyState === 'complete') setTimeout(run, 300); else window.addEventListener('load', () => setTimeout(run, 300));
})();
