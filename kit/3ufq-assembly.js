/* 3ufq W2 only. Reuse the site's unchanged shared video/curve player. */
(() => {
  const root = document.querySelector('#assembly');
  if (!root || !window.ASSEMBLY_DATA || !window.E2R) return;
  const data = window.ASSEMBLY_DATA;
  const lang = E2R.ZH ? 'zh' : 'en';
  const $ = s => root.querySelector(s);
  const caseLabel = c => E2R.tr('Case ', '') + (data.cases.filter(x => x.task === c.task).indexOf(c) + 1);
  let task = 'plug', selected = null, api = null, stopAt = null, playRequest = 0;
  const setActive = (host, attr, value) => {
    host.querySelectorAll('button').forEach(b => {
      const active = b.dataset[attr] === value;
      b.setAttribute('aria-selected', String(active));
      b.setAttribute('aria-pressed', String(active));
      b.tabIndex = active ? 0 : -1;
    });
  };
  const chooseCase = c => {
    selected = c; stopAt = null; ++playRequest;
    $('.as-case-title').textContent = caseLabel(c) + ' · ' + c.title[lang];
    $('.as-main-view').textContent = task === 'plug' ? E2R.tr('Contact view','') : E2R.tr('Side camera','');
    // New scoped case IDs do not change the existing reviewer players or data.
    E2R.P[c.id] = {id:c.id, title:data.tasks[task][lang]+' · '+caseLabel(c),
      video:c.video, end:c.duration, models:c.models, series:c.series};
    api = E2R.player($('.as-player'), c.id, {at:0, h:210});
    const video = api.video;
    video.addEventListener('seeking',()=>{stopAt=null;});
    video.addEventListener('timeupdate',()=>{
      if(stopAt!==null && video.currentTime>=stopAt){video.pause();stopAt=null;}
    });
    setActive($('.as-cases'), 'case', c.number);
  };
  const chooseTask = id => {
    task = id;
    setActive($('.as-tasks'), 'task', id);
    $('.as-cases').replaceChildren();
    data.cases.filter(c => c.task === id).forEach(c => {
      const b = document.createElement('button');
      b.type='button'; b.dataset.case=c.number; b.setAttribute('role','tab');
      b.textContent=caseLabel(c); b.title=c.title[lang];
      b.setAttribute('aria-label',caseLabel(c)+' · '+c.title[lang]);
      b.onclick=()=>chooseCase(c); $('.as-cases').append(b);
    });
    chooseCase(data.cases.find(c=>c.task===id));
  };
  Object.entries(data.tasks).forEach(([id,meta])=>{
    const b=document.createElement('button'); b.type='button';b.dataset.task=id;
    b.setAttribute('role','tab');b.textContent=meta[lang];
    b.onclick=()=>chooseTask(id);$('.as-tasks').append(b);
  });
  for(const host of [$('.as-tasks'),$('.as-cases')]) host.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    const buttons=[...host.querySelectorAll('button')];
    const current=buttons.indexOf(e.target);if(current<0)return;
    e.preventDefault();
    const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(current+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
    buttons[next].click();buttons[next].focus();
  });
  // Start playback after seeking has finished. This also works when the video
  // was previously at its end; the shared Play action otherwise restarts at 0.
  const playRange=(start,end)=>{
    const current=api, request=++playRequest, video=current.video;
    const begin=()=>{
      if(request!==playRequest){video.removeEventListener('seeked',begin);return;}
      if(Math.abs(video.currentTime-start)>.2)return;
      video.removeEventListener('seeked',begin);stopAt=end;current.play();
    };
    video.addEventListener('seeked',begin);current.seek(start);
  };
  $('.as-key').onclick=()=>playRange(selected.start,selected.end);
  $('.as-full').onclick=()=>playRange(0,null);
  chooseTask(task);
})();
