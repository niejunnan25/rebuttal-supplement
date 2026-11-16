/* Seek fallback for hosts that ignore HTTP Range (4open /w/, python http.server).
   When the target time is outside the seekable range, play forward muted at 16x until it is reached;
   for a backward jump, reload from 0 first. Leaves normal hosts untouched. */
(function () {
  const P = HTMLMediaElement.prototype, D = Object.getOwnPropertyDescriptor(P, 'currentTime');
  if (!D || P.__seekfix) return; P.__seekfix = true;
  const end = v => { const s = v.seekable; return s && s.length ? s.end(s.length - 1) : 0; };
  async function ff(v) {
    if (v.__ffRun) return; v.__ffRun = true;
    const muted = v.muted, rate = v.playbackRate, wasPaused = v.__ffWasPaused;
    try {
      v.muted = true;
      while (true) {
        const t = v.__ffTarget, now = D.get.call(v);
        if (now > t + 0.3) { v.load(); await new Promise(r => { const f = () => { v.removeEventListener('loadeddata', f); r(); }; v.addEventListener('loadeddata', f); setTimeout(r, 15000); }); }
        v.playbackRate = 16; try { await v.play(); } catch (e) { break; }
        await new Promise(r => { const k = setInterval(() => { const c = D.get.call(v), g = v.__ffTarget - c; if (g < 1.5 && v.playbackRate > 1) v.playbackRate = 1; if (g <= 0 || c > v.__ffTarget + 0.3 || v.ended) { clearInterval(k); r(); } }, 10); setTimeout(() => { clearInterval(k); r(); }, 40000); });
        v.pause();
        if (Math.abs(D.get.call(v) - v.__ffTarget) < 0.35 || v.ended) break;
      }
    } finally {
      v.playbackRate = rate; v.muted = muted; v.__ffRun = false;
      v.dispatchEvent(new Event('seeked')); v.dispatchEvent(new Event('timeupdate'));
      if (!wasPaused) v.play().catch(() => {});
    }
  }
  Object.defineProperty(P, 'currentTime', {
    configurable: true, enumerable: D.enumerable,
    get() { return D.get.call(this); },
    set(t) {
      t = +t;
      if (this.__ffRun) { this.__ffTarget = t; return; }
      if (!(this.readyState >= 1) || t <= end(this) + 0.01 || Math.abs(t - D.get.call(this)) < 0.05) { D.set.call(this, t); return; }
      this.__ffTarget = t; this.__ffWasPaused = this.paused; ff(this);
    }
  });
})();
