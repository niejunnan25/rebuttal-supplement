(() => {
  'use strict';
  const {tr,at,P}=E2R;
  const C={
    'event-comparison':{at:8.6,m:[[8.1,'Before the drop',''],[8.6,'Bottle lands on table',''],[9.2,'Retraction ends',''],[10.3,'Bottle still on table',''],[14.3,'Reference state recovered','']]},
    'success-short':{tab:tr('11.8 s',''),at:6.2,m:[[0,'Start',''],[6.2,'Blue bowl stacked',''],[11.8,'Complete','']]},
    'success-long-1':{tab:tr('29.3 s',''),at:15,m:[[0,'Start',''],[15,'Blue bowl stacked',''],[29.3,'Complete','']]},
    'success-long-2':{tab:tr('30.9 s',''),at:15,m:[[0,'Start',''],[15,'Blue bowl stacked',''],[30.9,'Complete','']]},
    'stall-early':{tab:tr('Early stall · 8.4–26.6 s',''),at:26.6,m:[[8.4,'Stall begins',''],[26.6,'Stall ends',''],[36,'Advancing again','']]},
    'stall-late':{tab:tr('Later stall · 36.9–44.7 s',''),at:44.7,m:[[36.9,'Stall begins',''],[44.7,'Stall ends',''],[55.6,'Complete','']]},
    'bottle-stall':{at:4.6,m:[[4.6,'Reference a · on table',''],[10.7,'Still on table',''],[13,'Lifted','']]},
    'bottle-regression':{at:7.2,m:[[7.2,'Reference a · lifted',''],[10,'Dropped',''],[27.9,'Still on table','']]},
    'brush-stall':{at:3.9,m:[[3.9,'Reference a · on table',''],[23.4,'Still on table',''],[26.4,'Lifted','']]},
    'shoe-regression':{at:37.3,m:[[37.3,'Reference a · held',''],[37.7,'Dropped',''],[79.9,'Still outside box','']]},
    'drop':{at:17.8,m:[[7.2,'Before the drop',''],[17.8,'After drop, empty gripper moving',''],[27.9,'End of recording','']]},
    'recovery':{at:14.3,m:[[8.1,'Before the drop',''],[11.4,'After the drop',''],[14.3,'Re-grasped','']]}
  };
  for(const fig of document.querySelectorAll('[data-cases]')){
    const ids=fig.dataset.cases.split(','),tabs=fig.querySelector('.tabs'),host=fig.querySelector('.player'),moments=fig.querySelector('.kfs');let api=null,current;
    function mount(id){current=id;api=E2R.player(host,id,{at:C[id].at,marks:C[id].m.map(m=>m[0])});tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.case===id)));moments.replaceChildren();
      for(const [t,en,zh] of C[id].m){const b=document.createElement('button');b.className='kf'+(P[id]?.series?' multimodel':'');b.type='button';b.dataset.time=t;const label=document.createElement('b');label.textContent=`${t.toFixed(1)} ${tr('s','')} · ${tr(en,zh)}`;b.append(label);
        if(P[id]){const values=document.createElement('span');values.className='values';if(P[id].series){E2R.series(P[id]).forEach(m=>{const v=document.createElement('span');v.dataset.model=m.id;v.dataset.value=at(id,t,m.id);v.textContent=m.name+' '+at(id,t,m.id).toFixed(4);values.append(v);});}else{values.dataset.value=at(id,t);values.textContent=at(id,t).toFixed(3);values.style.display='inline';values.style.marginLeft='6px';}b.append(values);}
        b.onclick=()=>api.seek(t);moments.append(b);
      }
      mark(C[id].at);
    }
    function mark(t){moments.querySelectorAll('button').forEach(b=>{const on=Math.abs(+b.dataset.time-t)<.04;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));});}
    host.addEventListener('e2rtime',e=>mark(e.detail));
    if(ids.length>1){for(const id of ids){const b=document.createElement('button');b.type='button';b.dataset.case=id;b.textContent=C[id].tab;b.onclick=()=>mount(id);tabs.append(b);}}else tabs.hidden=true;
    const details=fig.closest('details');if(details){details.addEventListener('toggle',()=>{if(details.open&&!api)mount(ids[0]);else if(!details.open)api?.pause();});}else mount(ids[0]);
  }
  document.addEventListener('play',e=>{document.querySelectorAll('video').forEach(v=>{if(v!==e.target)v.pause();});},true);
  document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',async()=>{const text=REPLIES[b.dataset.copy].en,out=b.nextElementSibling;try{await navigator.clipboard.writeText(text);out.textContent=tr('Copied','');}catch{out.textContent=tr('Select and copy the English response below.','');let field=b.parentElement.querySelector('textarea');if(!field){field=document.createElement('textarea');field.readOnly=true;field.setAttribute('aria-label','English response');b.parentElement.append(field);}field.value=text;field.focus();field.select();}}));
  const link=document.querySelector('[data-language]');if(link){const base=link.getAttribute('href');const sync=()=>link.setAttribute('href',base+location.hash);sync();window.addEventListener('hashchange',sync);}
})();
