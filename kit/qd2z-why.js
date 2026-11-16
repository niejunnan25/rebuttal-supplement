/* qD2Z-only case controls; prediction rendering uses the unchanged shared kit. */
(() => {
  const {tr,P}=E2R, controls=window.WHY_CONTROLS, view=window.WHY_VIEW;
  for(const fig of document.querySelectorAll('[data-why-cases]')){
    const ids=fig.dataset.whyCases.split(','), tabs=fig.querySelector('.tabs'), host=fig.querySelector('.player');
    let api=null;
    function mount(id){
      const c=controls[id];
      // Give this section its own model selection without changing shared cases.
      const localId='qd2z-why-'+id, source=P[id];
      if(!P[localId]){
        const models=E2R.series(source).filter(m=>view.models.includes(m.id))
          .map(({points,...m})=>({...m,name:view.model_names[m.id]||m.name}));
        P[localId]={...source,id:localId,models,
          ...(source.series?{series:Object.fromEntries(models.map(m=>[m.id,source.series[m.id]]))}:{})};
      }
      api=E2R.player(host,localId,{at:c.at});
      tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.case===id)));
    }
    if(ids.length>1){for(const id of ids){const b=document.createElement('button');b.type='button';b.dataset.case=id;b.textContent=tr(...controls[id].tab);b.onclick=()=>mount(id);tabs.append(b);}}else tabs.hidden=true;
    const details=fig.closest('details');
    if(details)details.addEventListener('toggle',()=>{if(details.open&&!api)mount(ids[0]);else if(!details.open)api?.pause();});
    else mount(ids[0]);
  }
  function revealHash(){const target=document.getElementById(location.hash.slice(1));const details=target?.closest('details');if(details){details.open=true;requestAnimationFrame(()=>target.scrollIntoView());}}
  document.querySelector('#why').addEventListener('click',e=>{
    const link=e.target.closest('a[href^="#"]');
    if(!link)return;
    const target=document.getElementById(link.getAttribute('href').slice(1));
    const details=target?.closest('details');
    if(details)details.open=true;
  });
  window.addEventListener('hashchange',revealHash);revealHash();
})();
