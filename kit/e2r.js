/* Shared video and evidence kit. Curves connect the recorded samples at their original times. */
(() => {
  'use strict';
  const D=window.REVIEW_DATA, BASE=new URL('../',document.currentScript.src), NS='http://www.w3.org/2000/svg';
  const P=Object.fromEntries(D.progress.map(c=>[c.id,c])), EV=Object.fromEntries(D.events.map(c=>[c.id,c]));
  const ZH=/^zh/i.test(document.documentElement.lang), tr=(en,zh)=>ZH?zh:en;
  const MODELS=[{id:'event2reward',name:'Event2Reward',color:'#1f4f8f',dash:''},{id:'robometer',name:'Robometer',color:'#bc712e',dash:'7 4'},{id:'dopamine',name:'Robo-Dopamine',color:'#7b5aa6',dash:'2 3'}];
  const BANDNAME={stall:tr('Progress stall',''),unrecovered:tr('Unrecovered regression',''),regression:tr('Regression and recovery','')};
  const COLORS={stall:'#e0a33a',unrecovered:'#c0463a',regression:'#7a68b4'};
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
  const mk=(tag,attrs,parent)=>{const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);parent?.append(n);return n;};
  function sample(points,t){let lo=0,hi=points.length;while(lo+1<hi){const m=(lo+hi)>>1;if(points[m][0]<=t+1e-8)lo=m;else hi=m;}return points[lo];}
  const series=c=>c.series?(c.models||MODELS).map(m=>({...m,name:ZH&&m.nameZh?m.nameZh:m.name,points:c.series[m.id]})):[{...MODELS[0],points:c.points}];
  const at=(id,t,model='event2reward')=>sample(P[id].series?P[id].series[model]:P[id].points,t)[1];
  const fmt=t=>Number(t).toFixed(1);
  function pointer(svg,getTime,onSeek){
    if(!onSeek)return;let active=null;
    svg.style.cursor='ew-resize';
    svg.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();active=e.pointerId;svg.setPointerCapture(active);onSeek(getTime(e));});
    svg.addEventListener('pointermove',e=>{if(active===e.pointerId){e.preventDefault();onSeek(getTime(e));}});
    svg.addEventListener('pointerup',e=>{if(active!==e.pointerId)return;onSeek(getTime(e));active=null;if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);});
    svg.addEventListener('pointercancel',()=>active=null);svg.addEventListener('lostpointercapture',()=>active=null);
  }
  function curve(host,id,o={}){
    const c=P[id], ss=series(c);host.classList.add('e2r-curve');
    const legend=el('div','e2r-legend');const outputs=[];
    ss.forEach(m=>{const item=el('span');const sw=mk('svg',{width:22,height:10,'aria-hidden':'true'},item);mk('line',{x1:0,x2:22,y1:5,y2:5,stroke:m.color,'stroke-width':2,'stroke-dasharray':m.dash},sw);item.append(el('span',null,m.name));const output=el('output');output.dataset.model=m.id;item.append(output);outputs.push(output);legend.append(item);});
    host.append(legend,el('div','e2r-axis',c.axisLabel?tr(...c.axisLabel):tr('Model score (0–1)','')));
    const svg=mk('svg',{class:'e2r-svg',role:'img','aria-label':c.curveLabel?tr(...c.curveLabel):tr('Raw prediction curves','')},host);
    let g,cur,dots=[],last=0;const xmax=o.xmax||c.end;
    function set(t){last=t;if(!g)return;const x=g.X(t);cur.setAttribute('x1',x);cur.setAttribute('x2',x);ss.forEach((m,i)=>{const point=sample(m.points,t);dots[i].setAttribute('cx',x);dots[i].setAttribute('cy',g.Y(point[1]));outputs[i].value=point[1].toFixed(c.series?4:3);outputs[i].dataset.value=point[1];outputs[i].dataset.sampleTime=point[0];});}
    function draw(){
      const w=Math.max(220,host.clientWidth),H=o.h||210,L=34,R=14,T=14,B=26,W=w-L-R,h=H-T-B;
      const X=t=>L+t/xmax*W,Y=v=>T+(1-v)*h;g={X,Y,L,W,w};svg.setAttribute('viewBox',`0 0 ${w} ${H}`);svg.setAttribute('width',w);svg.setAttribute('height',H);svg.replaceChildren();
      for(const p of [0,.5,1]){mk('line',{x1:L,x2:L+W,y1:Y(p),y2:Y(p),stroke:'#e5e7ea'},svg);mk('text',{x:L-6,y:Y(p)+3.5,'text-anchor':'end','font-size':11,fill:'#6a737d'},svg).textContent=p;}
      for(const [a,b] of c.bands||[])mk('rect',{x:X(a),y:T,width:X(b)-X(a),height:h,fill:COLORS[c.bandType||'stall'],opacity:.16},svg);
      const step=xmax<=20?2:xmax<=40?5:10;
      for(let t=0;t<=xmax+1e-6;t+=step)mk('text',{x:X(t),y:H-7,'text-anchor':'middle','font-size':11,fill:'#6a737d'},svg).textContent=t+(t===0?' s':'');
      for(const m of ss)mk('path',{'data-series':m.id,d:m.points.map(([t,v],i)=>(i?'L':'M')+X(t)+' '+Y(v)).join(''),fill:'none',stroke:m.color,'stroke-width':m.id==='event2reward'?2.3:1.9,'stroke-dasharray':m.dash,'stroke-linejoin':'round'},svg);
      for(const t of o.marks||[])mk('circle',{cx:X(t),cy:Y(at(id,t)),r:3.4,fill:'#fbfbf9',stroke:MODELS[0].color,'stroke-width':1.5},svg);
      cur=mk('line',{y1:T,y2:T+h,stroke:'#6a737d','stroke-width':1,opacity:.65},svg);dots=ss.map(m=>mk('circle',{r:3.7,fill:m.color,stroke:'#fff','stroke-width':1},svg));set(last);
    }
    pointer(svg,e=>{const b=svg.getBoundingClientRect();return Math.max(0,Math.min(c.end,((e.clientX-b.left)*g.w/b.width-g.L)/g.W*xmax));},o.onSeek);
    draw();let width=host.clientWidth;const ro=new ResizeObserver(()=>{if(Math.abs(host.clientWidth-width)>1){width=host.clientWidth;draw();}});ro.observe(host);
    return{set,redraw:draw,dispose:()=>ro.disconnect()};
  }
  function ann(host,id,o={}){
    const c=EV[id];host.classList.add('e2r-ann');
    const svg=mk('svg',{class:'e2r-svg',role:'img','aria-label':tr('Event annotation timeline','')},host);
    const labels=el('div','e2r-intervals');c.bands.forEach(b=>{const n=el('span',null,`${BANDNAME[b.type]} · ${b.start}–${b.end} ${tr('s','')}`);n.style.setProperty('--band',COLORS[b.type]);labels.append(n);});host.append(labels);
    let g,cur,last=0;
    function set(t){last=t;if(g){cur.setAttribute('x1',g.X(t));cur.setAttribute('x2',g.X(t));}}
    function draw(){
      const w=Math.max(220,host.clientWidth),H=110,L=25,R=25,W=w-L-R,X=t=>L+t/c.end*W;g={X,w,L,W};svg.setAttribute('width',w);svg.setAttribute('height',H);svg.setAttribute('viewBox',`0 0 ${w} ${H}`);svg.replaceChildren();
      mk('rect',{x:L,y:28,width:W,height:16,rx:3,fill:'#e5e7ea'},svg);
      for(const b of c.bands)mk('rect',{x:X(b.start),y:28,width:X(b.end)-X(b.start),height:16,rx:3,fill:COLORS[b.type]},svg);
      c.anchors.forEach(([t,k],i)=>{const x=X(t),y=60+(i%2)*19;mk('line',{x1:x,x2:x,y1:23,y2:y-12,stroke:'#38414b','stroke-width':1},svg);mk('text',{x:Math.max(30,Math.min(w-30,x)),y,'text-anchor':'middle','font-size':10.5,fill:'#38414b'},svg).textContent=`${k} · ${t}`;});
      for(const t of [0,c.end])mk('text',{x:X(t),y:101,'text-anchor':'middle','font-size':10.5,fill:'#6a737d'},svg).textContent=`${t} s`;
      cur=mk('line',{y1:12,y2:86,stroke:'#1c232b','stroke-width':1.4,opacity:.7},svg);set(last);
    }
    pointer(svg,e=>{const b=svg.getBoundingClientRect();return Math.max(0,Math.min(c.end,((e.clientX-b.left)*g.w/b.width-g.L)/g.W*c.end));},o.onSeek);
    draw();let width=host.clientWidth;const ro=new ResizeObserver(()=>{if(Math.abs(host.clientWidth-width)>1){width=host.clientWidth;draw();}});ro.observe(host);
    return{set,redraw:draw,dispose:()=>ro.disconnect()};
  }
  function player(host,id,o={}){
    host.e2r?.dispose();host.replaceChildren();host.classList.add('e2r-player');host.dataset.case=id;
    const c=P[id]||EV[id],vwrap=el('div','e2r-v'),v=el('video');v.muted=true;v.playsInline=true;v.preload='auto';v.controls=false;v.disablePictureInPicture=true;v.disableRemotePlayback=true;v.setAttribute('x-webkit-airplay','deny');v.setAttribute('aria-label',c.title);v.src=new URL(c.video,BASE);vwrap.append(v);
    const bar=el('div','e2r-bar'),play=el('button','e2r-btn e2r-play',tr('Play','')),time=el('span','e2r-time'),speeds=el('span','e2r-speeds');play.type='button';
    for(const speed of [.5,1,2]){const b=el('button','e2r-btn'+(speed===1?' is-on':''),speed+'×');b.type='button';b.setAttribute('aria-pressed',String(speed===1));b.onclick=()=>{v.playbackRate=speed;speeds.querySelectorAll('button').forEach(x=>{x.classList.toggle('is-on',x===b);x.setAttribute('aria-pressed',String(x===b));});};speeds.append(b);}bar.append(play,time,speeds);
    const chart=el('div','e2r-chart'),lab=el('div','e2r-lab');lab.append(el('span',null,tr('Press and drag to seek.','')));
    const range=el('input','e2r-scrub');range.type='range';range.min=0;range.max=c.end;range.step=.01;range.setAttribute('aria-label',tr('Execution time',''));lab.append(range);
    const error=el('div','e2r-error');error.setAttribute('role','status');lab.append(error);host.append(vwrap,bar,chart,lab);
    let raf=0,seekRaf=0,pending=null,dead=false,segmentEnd=null;
    const ch=(P[id]?curve:ann)(chart,id,{h:o.h,marks:o.marks,onSeek:seek});
    function display(t){ch.set(t);time.textContent=`${fmt(t)} / ${fmt(c.end)} ${tr('s','')}`;range.value=t;time.dataset.time=t;host.dispatchEvent(new CustomEvent('e2rtime',{detail:t}));}
    function pump(){seekRaf=0;if(dead||pending===null||v.readyState<1||v.seeking)return;const t=pending;pending=null;v.currentTime=Math.min(t,v.duration);display(t);}
    function queue(){if(!seekRaf)seekRaf=requestAnimationFrame(pump);}
    function seek(t){if(dead)return;v.pause();segmentEnd=null;pending=Math.max(0,Math.min(+t,c.end));display(pending);queue();}
    function update(){if(pending===null&&!v.seeking)display(Math.min(c.end,v.currentTime));if(segmentEnd!=null&&v.currentTime>=segmentEnd){v.pause();segmentEnd=null;} }
    function loop(){raf=0;if(dead)return;update();if(!v.paused)raf=requestAnimationFrame(loop);}
    function go(){if(dead)return;if(v.ended)seek(0);const p=v.play();p?.catch(()=>{if(!dead)error.textContent=tr('Playback could not start. Try Play again.','');});}
    v.addEventListener('loadedmetadata',queue);v.addEventListener('seeked',()=>{if(pending!==null)queue();else update();});v.addEventListener('timeupdate',update);
    v.addEventListener('play',()=>{play.textContent=tr('Pause','');if(!raf)raf=requestAnimationFrame(loop);});v.addEventListener('pause',()=>{play.textContent=tr('Play','');update();});
    v.addEventListener('error',()=>{if(!dead)error.textContent=tr('Video could not load.','');});
    play.onclick=()=>v.paused?go():v.pause();range.addEventListener('input',()=>seek(range.value));
    function dispose(){dead=true;cancelAnimationFrame(raf);cancelAnimationFrame(seekRaf);ch.dispose();v.pause();v.removeAttribute('src');v.load();}
    const api={video:v,seek,play:go,pause:()=>v.pause(),dispose,segment:(a,b)=>{seek(a);segmentEnd=b;go();}};host.e2r=api;seek(o.at??c.initial??0);return api;
  }
  window.E2R={data:D,P,EV,at,sample,series,curve,ann,player,MODELS,BANDNAME,ZH,tr};
})();
