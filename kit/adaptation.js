(() => {
  'use strict';
  const zh=document.documentElement.lang.startsWith('zh'), tr=(en,cn)=>zh?cn:en;
  for(const fig of document.querySelectorAll('[data-annotation]')){
    let initialized=false;
    function init(){
      if(initialized)return; initialized=true;
      const video=fig.querySelector('video'),data=window.ADAPTATION_CASES[fig.dataset.annotation];
      const play=fig.querySelector('[data-play]'),scrub=fig.querySelector('input[type="range"]'),out=fig.querySelector('output'),cursor=fig.querySelector('[data-cursor]'),error=fig.querySelector('.annotation-error');
      const max=(data.frames-1)/data.fps,svg=fig.querySelector('svg');
      let axisWidth=360,left=18,width=324;
      const playText=tr('Play','');
      let request=0,drag=null;
      function render(){
        const t=Math.min(max,video.currentTime||0);
        if(scrub){scrub.value=t;if(data.hide_time)scrub.setAttribute('aria-valuetext',Math.round(t/max*100)+'%');}if(out)out.textContent=`${t.toFixed(data.fps>10?2:1)} / ${max.toFixed(data.fps>10?2:1)} ${tr('s','')}`;
        if(cursor){const x=left+width*t/max;cursor.setAttribute('x1',x);cursor.setAttribute('x2',x);}
        fig.querySelectorAll('[data-seek]').forEach(b=>b.setAttribute('aria-pressed',String(Math.abs(+b.dataset.seek-t)<.45/data.fps)));
      }
      if(svg?.hasAttribute('data-compact-axis')){
        const resizeAxis=()=>{
          const w=svg.getBoundingClientRect().width;if(w<=36)return;
          axisWidth=w;width=w-left*2;svg.setAttribute('viewBox',`0 0 ${w} 46`);
          const x=t=>left+width*t/max;
          svg.querySelector('[data-axis-track]').setAttribute('x2',w-left);
          const band=svg.querySelector('[data-axis-band]');band.setAttribute('x',x(data.a));band.setAttribute('width',x(data.end)-x(data.a));
          svg.querySelectorAll('[data-anchor-seek]').forEach(g=>{const pos=x(+g.dataset.anchorSeek);g.querySelector('rect').setAttribute('x',pos-12);g.querySelector('circle').setAttribute('cx',pos);g.querySelector('line').setAttribute('x1',pos);g.querySelector('line').setAttribute('x2',pos);g.querySelector('text').setAttribute('x',pos);});
          render();
        };
        new ResizeObserver(resizeAxis).observe(svg);resizeAxis();
      }
      function seek(t){video.pause();video.currentTime=Math.max(0,Math.min(max,Math.round(t*data.fps)/data.fps));render();}
      video.addEventListener('loadedmetadata',()=>{video.defaultPlaybackRate=data.default_rate||1;video.playbackRate=video.defaultPlaybackRate;seek(data.initial_time??data.a);});
      video.addEventListener('timeupdate',render);video.addEventListener('seeked',render);
      video.addEventListener('play',()=>{play.textContent=tr('Pause','');play.setAttribute('aria-pressed','true');const tick=()=>{render();if(!video.paused)request=requestAnimationFrame(tick);};cancelAnimationFrame(request);tick();});
      video.addEventListener('pause',()=>{play.textContent=playText;play.setAttribute('aria-pressed','false');cancelAnimationFrame(request);render();});
      video.addEventListener('error',()=>error.textContent=tr('The video could not be loaded.',''));
      play.addEventListener('click',async()=>{if(video.paused){if(video.currentTime>=max)seek(0);try{await video.play();error.textContent='';}catch{error.textContent=tr('Use Play to retry loading the video.','');}}else video.pause();});
      fig.querySelector('select')?.addEventListener('change',e=>video.playbackRate=+e.target.value);
      const zoom=fig.querySelector('[data-zoom]');if(zoom)zoom.addEventListener('click',()=>{const on=fig.querySelector('.annotation-video-frame').classList.toggle('is-zoomed');zoom.setAttribute('aria-pressed',String(on));zoom.textContent=on?tr('Show full frame',''):tr('Enlarge workspace','');});
      fig.querySelector('[data-fullscreen]').addEventListener('click',()=>{if(video.requestFullscreen)video.requestFullscreen().catch(()=>{});else if(video.webkitEnterFullscreen)video.webkitEnterFullscreen();});
      scrub?.addEventListener('input',()=>seek(+scrub.value));
      fig.querySelectorAll('[data-seek]').forEach(b=>b.addEventListener('click',()=>seek(+b.dataset.seek)));
      function point(e){const box=svg.getBoundingClientRect();seek((((e.clientX-box.left)/box.width)*axisWidth-left)/width*max);}
      svg?.addEventListener('pointerdown',e=>{
        if(e.button!==0)return;e.preventDefault();svg.setPointerCapture(e.pointerId);
        const anchor=e.target.closest('[data-anchor-seek]');drag={x:e.clientX,anchor:anchor?+anchor.dataset.anchorSeek:null,moved:false};
        if(drag.anchor!==null)seek(drag.anchor);else point(e);
      });
      svg?.addEventListener('pointermove',e=>{if(svg.hasPointerCapture(e.pointerId)&&drag){if(Math.abs(e.clientX-drag.x)>2)drag.moved=true;if(drag.moved)point(e);}});
      svg?.addEventListener('pointerup',e=>{if(svg.hasPointerCapture(e.pointerId)){if(drag&&drag.anchor!==null&&!drag.moved)seek(drag.anchor);else point(e);svg.releasePointerCapture(e.pointerId);drag=null;}});
      svg?.addEventListener('pointercancel',()=>{drag=null;});
      video.src=video.dataset.src;video.load();render();
    }
    const details=fig.closest('details'),panel=fig.closest('[data-real-panel]');
    if(panel){fig.addEventListener('annotationactivate',init);if(!panel.hidden)init();}
    else if(details){details.addEventListener('toggle',()=>{if(details.open)init();else fig.querySelector('video').pause();});if(details.open)init();}else init();
  }
  const gallery=document.querySelector('.annotation-gallery');
  if(gallery){
    let task='bowls',kind='stall';
    function select(){
      gallery.querySelectorAll('[data-real-panel]').forEach(panel=>{const on=panel.dataset.realPanel===`${task}-${kind}`;panel.hidden=!on;if(on)panel.querySelector('[data-annotation]').dispatchEvent(new Event('annotationactivate'));else panel.querySelector('video').pause();});
      gallery.querySelectorAll('[data-real-task]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.realTask===task)));
      gallery.querySelectorAll('[data-real-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.realKind===kind)));
    }
    gallery.querySelectorAll('[data-real-task]').forEach(b=>b.addEventListener('click',()=>{task=b.dataset.realTask;select();}));
    gallery.querySelectorAll('[data-real-kind]').forEach(b=>b.addEventListener('click',()=>{kind=b.dataset.realKind;select();}));
  }
})();
