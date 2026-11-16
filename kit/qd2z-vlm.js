(() => {
  'use strict';
  const zh=document.documentElement.lang.startsWith('zh'), tr=(en,cn)=>zh?cn:en;
  const data=window.VLM_DATA, cases=Object.fromEntries(data.map(c=>[c.id,c]));
  const prefix=zh?'../':'', colors=['#1f4f8f','#bf6427'];
  const NS='http://www.w3.org/2000/svg';
  function svgEl(tag,attrs={},parent){const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(parent)parent.append(n);return n;}
  function lastPoint(points,t){let found=null;for(const p of points){if(p[0]<=t+1e-8)found=p;else break;}return found;}
  function textEl(tag,cls,text,parent){const n=document.createElement(tag);n.className=cls;n.textContent=text;if(parent)parent.append(n);return n;}

  for(const fig of document.querySelectorAll('[data-vlm-cases]')){
    const ids=fig.dataset.vlmCases.split(','), tabs=fig.querySelector('.tabs'), host=fig.querySelector('.vlm-host');
    let dispose=null, active=null;
    function mount(id){
      if(dispose)dispose();active=id;
      tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.case===id)));
      const c=cases[id];host.replaceChildren();host.dataset.case=id;
      textEl('div','vlm-title',c.title[zh?1:0],host);
      textEl('p','vlm-case-note',c.note[zh?1:0],host);
      const grid=textEl('div','vlm-player','',host), left=textEl('div','vlm-video-pane','',grid);
      const video=document.createElement('video');video.className='vlm-video';video.muted=true;video.playsInline=true;video.preload='metadata';video.src=prefix+c.video;video.poster=prefix+'assets/vlm/'+id+'-1.jpg';video.setAttribute('aria-label',c.title[zh?1:0]);left.append(video);
      const bar=textEl('div','vlm-controls','',left), play=textEl('button','btn vlm-play',tr('Play',''),bar);play.type='button';play.setAttribute('aria-pressed','false');
      const speed=document.createElement('select');speed.setAttribute('aria-label',tr('Playback speed',''));for(const v of [.5,1,2]){const o=document.createElement('option');o.value=v;o.textContent=v+'×';o.selected=v===1;speed.append(o);}bar.append(speed);speed.onchange=()=>video.playbackRate=+speed.value;
      const time=textEl('output','vlm-time','',bar);
      const full=textEl('button','btn',tr('Enlarge',''),bar);full.type='button';full.onclick=()=>{if(video.requestFullscreen)video.requestFullscreen().catch(()=>{});};
      const error=textEl('div','vlm-error','',left);error.setAttribute('role','status');video.addEventListener('error',()=>error.textContent=tr('Video could not be loaded.',''));
      const right=textEl('div','vlm-chart-pane','',grid), legend=textEl('div','vlm-legend','',right);
      ['Event2Reward','Astra'].forEach((name,i)=>{const item=textEl('span','',name,legend);const icon=svgEl('svg',{viewBox:'0 0 28 12'});svgEl('line',{x1:0,y1:6,x2:28,y2:6,stroke:colors[i],'stroke-width':2,'stroke-dasharray':i?'5 3':''},icon);item.prepend(icon);});
      const svg=svgEl('svg',{viewBox:'0 0 430 258',class:'vlm-chart',role:'img','aria-label':tr('Raw progress scores. Drag to seek the video.','')},right);
      const x0=35,x1=416,y0=24,y1=219,x=t=>x0+t/c.end*(x1-x0),y=v=>y1-v*(y1-y0);
      svgEl('rect',{x:x(c.event[0]),y:y0,width:x(c.event[1])-x(c.event[0]),height:y1-y0,fill:'#d3b477',opacity:.16},svg);
      for(const val of [0,.25,.5,.75,1]){svgEl('line',{x1:x0,x2:x1,y1:y(val),y2:y(val),stroke:'#e2e5e9'},svg);const t=svgEl('text',{x:x0-7,y:y(val)+4,'text-anchor':'end'},svg);t.textContent=val;}
      for(let t=0;t<=c.end;t+=5){const lab=svgEl('text',{x:x(t),y:y1+20,'text-anchor':'middle'},svg);lab.textContent=t;}
      const label=svgEl('text',{x:x0,y:13,class:'vlm-axis-title'},svg);label.textContent=tr('Predicted progress','');
      const axis=svgEl('text',{x:x1,y:255,'text-anchor':'end'},svg);axis.textContent=tr('Video time (s)','');
      c.anchors.forEach((t,i)=>{svgEl('line',{x1:x(t),x2:x(t),y1:y0,y2:y1,stroke:'#a99b85','stroke-dasharray':'3 3'},svg);const tag=svgEl('text',{x:x(t)+3,y:y0+12},svg);tag.textContent=i?'r':'a';});
      const markers=[];
      for(let k=1;k<=2;k++){
        svgEl('path',{d:c.points.map((p,i)=>(i?'L':'M')+x(p[0])+','+y(p[k])).join(' '),fill:'none',stroke:colors[k-1],'stroke-width':2,'stroke-dasharray':k===2?'6 4':''},svg);
        for(const p of c.points){const m=k===1?svgEl('circle',{cx:x(p[0]),cy:y(p[k]),r:3.5,fill:colors[k-1],stroke:'#fff','stroke-width':.8},svg):svgEl('rect',{x:x(p[0])-3,y:y(p[k])-3,width:6,height:6,fill:colors[k-1],stroke:'#fff','stroke-width':.6},svg);m.classList.add('vlm-point');m.dataset.time=p[0];m.dataset.value=p[k];m.dataset.model=k===1?'e2r':'astra';const title=svgEl('title',{},m);title.textContent=`${p[0].toFixed(1)} s · ${k===1?'Event2Reward':'Astra'} ${p[k].toFixed(4)}`;}
        markers.push(svgEl('circle',{r:6.5,fill:'none',stroke:colors[k-1],'stroke-width':2,visibility:'hidden'},svg));
      }
      const cursor=svgEl('line',{y1:y0,y2:y1,stroke:'#334155','stroke-width':1.2,'pointer-events':'none'},svg);
      const slider=document.createElement('input');slider.className='vlm-scrub';slider.type='range';slider.min=0;slider.max=c.end;slider.step=.1;slider.setAttribute('aria-label',tr('Video time in seconds',''));right.append(slider);
      const sample=textEl('p','vlm-sample','',right), readings=textEl('div','vlm-readings','',right);
      const outputs=['Event2Reward','Astra'].map((name,i)=>{const s=textEl('span','',name+' ',readings);s.style.color=colors[i];const o=textEl('output','','—',s);o.dataset.model=i?'astra':'e2r';return o;});
      textEl('p','vlm-band-label',tr('Shading: annotated event','')+` · ${c.event[0].toFixed(1)}–${c.event[1].toFixed(1)} `+tr('s',''),right);
      let current=c.initial,pending=null,dragging=false,raf=0,stopped=false;
      function render(t){current=Math.max(0,Math.min(c.end,t));time.textContent=`${current.toFixed(1)} / ${c.end.toFixed(1)} ${tr('s','')}`;time.dataset.time=current;slider.value=current;cursor.setAttribute('x1',x(current));cursor.setAttribute('x2',x(current));const p=lastPoint(c.points,current);sample.dataset.time=p?p[0]:'';sample.textContent=p?tr('Latest sampled score at ','')+p[0].toFixed(1)+' '+tr('s',''):tr('No sampled score yet','');outputs.forEach((o,i)=>{o.textContent=p?p[i+1].toFixed(4):'—';o.dataset.value=p?p[i+1]:'';markers[i].setAttribute('visibility',p?'visible':'hidden');if(p){markers[i].setAttribute('cx',x(p[0]));markers[i].setAttribute('cy',y(p[i+1]));}});}
      function flush(){if(stopped||pending===null||video.readyState<1||video.seeking)return;const t=pending;pending=null;if(Math.abs(video.currentTime-t)>.012)video.currentTime=t;}
      function seek(t){video.pause();render(t);pending=current;flush();}
      video.addEventListener('loadedmetadata',()=>flush());video.addEventListener('seeked',()=>{flush();if(pending===null&&!dragging)render(video.currentTime);});
      function tick(){if(stopped)return;if(!video.paused&&!dragging&&pending===null)render(video.currentTime);raf=requestAnimationFrame(tick);}
      video.addEventListener('play',()=>{play.textContent=tr('Pause','');play.setAttribute('aria-pressed','true');cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);});
      video.addEventListener('pause',()=>{play.textContent=tr('Play','');play.setAttribute('aria-pressed','false');cancelAnimationFrame(raf);});
      video.addEventListener('ended',()=>render(Math.min(video.currentTime,c.end)));
      play.onclick=()=>{if(video.paused){if(video.currentTime>=c.end-.05){pending=0;render(0);flush();}video.play().catch(()=>{error.textContent=tr('Press Play again after the video loads.','');});}else video.pause();};
      slider.addEventListener('input',()=>seek(+slider.value));
      function fromPointer(e){const r=svg.getBoundingClientRect(),v=(e.clientX-r.left)/r.width*430;return Math.max(0,Math.min(c.end,(v-x0)/(x1-x0)*c.end));}
      svg.addEventListener('pointerdown',e=>{if(e.button!==0)return;dragging=true;svg.setPointerCapture(e.pointerId);seek(fromPointer(e));e.preventDefault();});
      svg.addEventListener('pointermove',e=>{if(dragging)seek(fromPointer(e));});
      function finish(e){if(!dragging)return;seek(fromPointer(e));dragging=false;if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);}
      svg.addEventListener('pointerup',finish);svg.addEventListener('pointercancel',()=>{dragging=false;});
      render(c.initial);pending=c.initial;flush();
      dispose=()=>{stopped=true;cancelAnimationFrame(raf);video.pause();video.removeAttribute('src');video.load();};
    }
    for(const id of ids){const b=textEl('button','',cases[id].title[zh?1:0],tabs);b.type='button';b.dataset.case=id;b.onclick=()=>{if(active!==id)mount(id);};}
    const details=fig.closest('details');
    if(details){details.addEventListener('toggle',()=>{if(details.open&&!active)mount(ids[0]);if(!details.open)host.querySelector('video')?.pause();});}
    else mount(ids[0]);
  }
})();
