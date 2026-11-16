(() => {
  'use strict';
  const root = document.querySelector('#q5');
  if (!root || !window.E2R || !window.Q5_VIDEOS) return;
  const zh = E2R.ZH, tr = (en, cn) => zh ? cn : en;
  const all = Q5_VIDEOS;
  for (const c of all) E2R.EV[c.id] = {...c, title: c.title[zh ? 1 : 0]};
  // This renderer illustrates an inequality, never model predictions or labels.
  // The horizontal coordinates use the original annotation times. Vertical
  // coordinates are drawing positions only; there is no numerical progress scale.
  function relationDiagram(chart, c, seek) {
    const ns = 'http://www.w3.org/2000/svg';
    const band = c.bands.find(b => b.type === c.kind);
    const a = c.anchors.find(x => x[1] === 'a')[0];
    const stop = c.kind === 'stall' ? band.end : c.end;
    const endLabel = c.kind === 'stall' ? 'b' : 'T';
    const color = c.kind === 'stall' ? '#b88724' : '#c0463a';
    const block = document.createElement('div'); block.className = 'vg-relation';
    const heading = document.createElement('div'); heading.className = 'vg-relation-heading';
    heading.textContent = tr('Idealized progress · not a model prediction', '');
    const svg = document.createElementNS(ns, 'svg');
    svg.classList.add('vg-relation-svg'); svg.setAttribute('role', 'group');
    svg.setAttribute('aria-label', tr('Illustrative progress relation. Drag to seek the video.', ''));
    const rule = document.createElement('div'); rule.className = 'vg-relation-rule';
    rule.innerHTML = '<span>' + tr('Supervision', '') + '</span><span class="math">p<sub>t</sub> '
      + (c.kind === 'stall' ? '≈' : '&lt;') + ' p<sub>a</sub></span>';
    const explanation = document.createElement('div'); explanation.className = 'vg-relation-explanation';
    explanation.textContent = c.kind === 'stall'
      ? tr('Comparison states in the stall retain the progress at a.', '')
      : tr('Further attempts do not restore the progress achieved before the loss.', '');
    const outside = document.createElement('div'); outside.className = 'vg-outside'; outside.hidden = true;
    outside.textContent = tr('Playback is outside the time window shown here.', '');
    block.append(heading, svg, outside, rule, explanation);
    // The sketch already carries the primary interval. Retain the original
    // timeline only when it also contains other events, e.g. the brush recovery.
    const originalTimeline = chart.querySelector(':scope > .e2r-svg');
    if (c.bands.length === 1) {
      originalTimeline.style.display = 'none';
      originalTimeline.setAttribute('aria-hidden', 'true');
    } else {
      const more = document.createElement('div'); more.className = 'vg-annotation-heading';
      more.textContent = tr('All annotated events in this recording', '');
      originalTimeline.before(more);
    }
    chart.prepend(block);
    chart.classList.add('vg-with-relation');
    let geom, cursor, last = c.watch[0], active = null;
    function mk(tag, attrs, parent = svg) {
      const n = document.createElementNS(ns, tag);
      for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
      parent.append(n); return n;
    }
    function label(text, x, y, attrs = {}, parent = svg) {
      const n = mk('text', {x, y, ...attrs}, parent); n.textContent = text; return n;
    }
    function set(t) {
      last = t;
      if (geom) {
        const within = t >= geom.start - 0.001 && t <= geom.end + 0.001;
        cursor.style.display = within ? '' : 'none'; outside.hidden = within;
        if (within) { cursor.setAttribute('x1', geom.X(t)); cursor.setAttribute('x2', geom.X(t)); }
      }
    }
    function draw() {
      const width = Math.max(240, chart.clientWidth), height = 246;
      const L = 34, R = width - 18, top = 43, bottom = 199, reference = 66, lower = 127;
      // Zoom only the diagram. Preserve source times, full video, and full seek bar.
      const start = Math.max(0, a - 5);
      const end = c.kind === 'unrecovered' ? c.end : Math.min(c.end, Math.max(c.watch[1], stop));
      const X = t => L + (t - start) / (end - start) * (R - L);
      geom = {X, width, L, R, start, end};
      svg.setAttribute('width', width); svg.setAttribute('height', height);
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`); svg.replaceChildren();
      label(tr('Relative task progress (illustration)', ''), L, 15, {class:'vg-axis-title'});
      mk('line', {x1:L, x2:L, y1:top, y2:bottom, class:'vg-axis'});
      mk('line', {x1:L, x2:R, y1:bottom, y2:bottom, class:'vg-axis'});
      const shadedStart = Math.max(start, band.start), shadedEnd = Math.min(end, band.end);
      mk('rect', {x:X(shadedStart), y:top, width:X(shadedEnd)-X(shadedStart), height:bottom-top,
        fill:color, opacity:'.065'});
      mk('line', {x1:L, x2:R, y1:reference, y2:reference, class:'vg-reference'});
      label(c.kind === 'stall' ? tr('Progress at the reference state', '') : tr('Progress before the loss', ''),
        R, 35, {'text-anchor':'end',class:'vg-reference-caption'});
      const pa = label('p', L-8, reference+4, {'text-anchor':'end',class:'vg-math-label'});
      const sub = mk('tspan', {'baseline-shift':'sub','font-size':9}, pa); sub.textContent = 'a';
      const loss = Math.max(a, band.start);
      const path = c.kind === 'stall'
        ? `M ${X(a)} ${reference} L ${X(stop)} ${reference}`
        : `M ${X(a)} ${reference} L ${X(loss)} ${lower} L ${X(stop)} ${lower}`;
      mk('path', {d:path, fill:'none', stroke:color, 'stroke-width':3,'stroke-linejoin':'round',class:'vg-ideal-curve'});
      if (c.kind === 'unrecovered') {
        const dropX = (X(a) + X(loss)) / 2;
        const labelX = Math.min(R - (zh ? 65 : 85), Math.max(dropX + 20, L + 52));
        label(tr('Progress lost', ''), labelX, 103, {class:'vg-loss-label'});
        mk('line', {x1:labelX-7,x2:dropX+3,y1:99,y2:(reference+lower)/2,stroke:color,'stroke-width':1.2});
        const mid = (X(loss)+X(stop))/2;
        label(tr('Still below pre-loss progress', ''), mid, 159, {'text-anchor':'middle',class:'vg-loss-label'});
        label(tr('at the end of the recording', ''), mid, 177, {'text-anchor':'middle',class:'vg-loss-label'});
      } else {
        label(tr('Progress retained during the stall', ''), (L+R)/2, 123,
          {'text-anchor':'middle',class:'vg-retained-label'});
      }
      // Vertical positions illustrate relations only, not measured scores.
      function anchor(t, name, y, meaning) {
        const g = mk('g', {role:'button',tabindex:0,'data-reference':name,'data-time':t,
          'aria-label':`${name} · ${meaning} · ${t.toFixed(1)} ${tr('s','')}`,class:'vg-reference-point'});
        const x = X(t);
        mk('line',{x1:x,x2:x,y1:y,y2:bottom,stroke:'#aeb4bc','stroke-dasharray':'3 4'},g);
        mk('circle',{cx:x,cy:y,r:4.5,fill:'#fff',stroke:color,'stroke-width':2},g);
        // Keep the longer time label out of the point group's hit-test bounds.
        const caption = label(name,x,y-12,
          {'text-anchor':'middle',class:'vg-math-label'});
        if (name === 'a') {
          const timeLabel = label(`${t.toFixed(1)} ${tr('s','')}`,x+13,y-12,
            {'text-anchor':'start',class:'vg-anchor-time'});
          timeLabel.style.cursor = 'pointer';
          timeLabel.addEventListener('pointerdown',e=>e.stopPropagation());
          timeLabel.addEventListener('click',e=>{e.stopPropagation();seek(t);});
        }
        caption.style.cursor = 'pointer';
        caption.addEventListener('pointerdown', e=>e.stopPropagation());
        caption.addEventListener('click', e=>{e.stopPropagation();seek(t);});
        mk('rect',{x:x-16,y:y-26,width:32,height:bottom-y+32,fill:'transparent'},g);
        g.addEventListener('click', e=>{e.stopPropagation();seek(t);});
        g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();seek(t);}});
      }
      anchor(a,'a',reference,tr('Reference state',''));
      anchor(stop,endLabel,c.kind === 'stall' ? reference : lower,
        c.kind === 'stall' ? tr('End of stall','') : tr('End of recording',''));
      const ticks = width < 310 ? 2 : 3;
      for (let i=0;i<=ticks;i++) {
        const t=start+(end-start)*i/ticks, x=X(t);
        mk('line',{x1:x,x2:x,y1:bottom,y2:bottom+4,class:'vg-axis'});
        label(t.toFixed(1),x,bottom+19,{'text-anchor':i===0?'start':i===ticks?'end':'middle'});
      }
      label(tr('Recording time (seconds)',''),(L+R)/2,height-3,{'text-anchor':'middle',class:'vg-axis-title'});
      cursor = mk('line',{y1:top-4,y2:bottom,x1:X(last),x2:X(last),class:'vg-time-cursor'});
      set(last);
    }
    function pointerTime(e) {
      const box = svg.getBoundingClientRect();
      return Math.max(geom.start,Math.min(geom.end,geom.start+((e.clientX-box.left)*geom.width/box.width-geom.L)/(geom.R-geom.L)*(geom.end-geom.start)));
    }
    svg.addEventListener('pointerdown',e=>{
      if(e.button!==0 || e.target.closest('[data-reference]')) return;
      e.preventDefault();active=e.pointerId;svg.setPointerCapture(active);seek(pointerTime(e));
    });
    svg.addEventListener('pointermove',e=>{if(active===e.pointerId){e.preventDefault();seek(pointerTime(e));}});
    svg.addEventListener('pointerup',e=>{if(active===e.pointerId){seek(pointerTime(e));active=null;svg.releasePointerCapture(e.pointerId);}});
    svg.addEventListener('pointercancel',()=>active=null);
    svg.addEventListener('lostpointercapture',()=>active=null);
    draw(); let oldWidth=chart.clientWidth;
    const observer=new ResizeObserver(()=>{if(Math.abs(chart.clientWidth-oldWidth)>1){oldWidth=chart.clientWidth;draw();}});
    observer.observe(chart);
    return {set,dispose:()=>observer.disconnect()};
  }
  const controllers = {};
  for (const fig of root.querySelectorAll('[data-video-gallery]')) {
    const domain = fig.dataset.videoGallery;
    const cases = all.filter(c => c.domain === domain);
    const tabs = fig.querySelector('.tabs');
    const host = fig.querySelector('.vg-player');
    const note = fig.querySelector('.vg-note');
    const title = fig.querySelector('.vg-case-title');
    let api, diagram, current, rate = 2;
    host.addEventListener('e2rtime', e => diagram?.set(e.detail));
    function mount(id) {
      const c = cases.find(x => x.id === id);
      if (!c) return;
      current = c;
      if (api) rate = api.video.playbackRate;
      diagram?.dispose(); diagram = null;
      api = E2R.player(host, c.id, {at: Math.max(0, c.anchors.find(a=>a[1]==='a')[0]-5)});
      api.video.playbackRate = rate;
      api.video.defaultPlaybackRate = rate;
      host.querySelectorAll('.e2r-speeds button').forEach(b => {
        const on = Number.parseFloat(b.textContent) === rate;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', String(on));
      });
      // Concise display only: source times remain unchanged in the underlying data.
      host.querySelectorAll('.e2r-intervals span').forEach((span, i) => {
        const band = c.bands[i];
        span.textContent = `${E2R.BANDNAME[band.type]} · ${band.start.toFixed(1)}–${band.end.toFixed(1)} ${tr('s', '')}`;
      });
      diagram = relationDiagram(host.querySelector('.e2r-chart'), c, api.seek);
      host.querySelector('.e2r-lab > span').textContent = tr('Click a reference point or drag to seek.', '');
      tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.case === c.id)));
      title.textContent = c.title[zh ? 1 : 0];
      note.textContent = c.note[zh ? 1 : 0];
      fig.dataset.activeCase = c.id;
    }
    const counts = {stall: 0, unrecovered: 0};
    for (const c of cases) {
      const button = document.createElement('button');
      const label = c.kind === 'stall' ? tr('Stall', '') : tr('Unrecovered regression', '');
      button.type = 'button'; button.dataset.case = c.id;
      button.textContent = `${label} ${++counts[c.kind]}`;
      button.title = c.title[zh ? 1 : 0];
      button.addEventListener('click', () => { if (current?.id !== c.id) mount(c.id); });
      tabs.append(button);
    }
    fig.querySelectorAll('[data-jump]').forEach(button => button.addEventListener('click', () => {
      if (button.dataset.jump === 'watch') api.segment(...current.watch);
      else api.seek(button.dataset.jump === 'end' ? current.end : Math.max(0, current.anchors.find(a=>a[1]==='a')[0]-5));
    }));
    mount(cases[0].id);
    controllers[domain] = {mount};
  }
  function fromHash() {
    if (location.hash === '#fig4') controllers.sim?.mount('q5-bottle-drop');
    if (location.hash === '#fig3') controllers.sim?.mount('q5-bottle-stall');
    if (location.hash === '#fig5' || location.hash === '#real') controllers.real?.mount('q5-stack-late-stall');
    if (location.hash === '#fig6') controllers.real?.mount('q5-shoe-drop');
  }
  fromHash();
  window.addEventListener('hashchange', fromHash);
})();
