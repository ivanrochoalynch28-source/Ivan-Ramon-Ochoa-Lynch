(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.querySelector('.site-header');
  const menu = document.querySelector('.menu-toggle');
  const closeMenu = () => { document.body.classList.remove('menu-open'); menu?.setAttribute('aria-expanded','false'); };
  menu?.addEventListener('click', () => {
    const open = !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open); menu.setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('#main-nav a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && document.body.classList.contains('menu-open')) {closeMenu();menu.focus();} });

  if ('IntersectionObserver' in window && !reduced.matches) {
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if(entry.isIntersecting) { entry.target.classList.add('is-visible'); reveal.unobserve(entry.target); }
    }), {threshold:0.05,rootMargin:'0px 0px 40px 0px'});
    document.querySelectorAll('.reveal').forEach(el => { el.classList.add('will-reveal'); reveal.observe(el); });
    setTimeout(() => document.querySelectorAll('.will-reveal:not(.is-visible)').forEach(el => {
      if(el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-visible');
    }), 1100);
  }

  const top = document.querySelector('.back-top');
  const progress = document.querySelector('.reading-progress span');
  const storySections = Array.from(document.querySelectorAll('[data-story-section]'));
  let tick = false;
  const onScroll = () => {
    if(tick) return; tick = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      header?.classList.toggle('has-scrolled', y > 30);
      top?.classList.toggle('visible', y > 600);
      if(progress) { const total = document.documentElement.scrollHeight - innerHeight; progress.style.width = (total > 0 ? 100*y/total : 0) + '%'; }
      if(storySections.length){
        const anchorLine = Math.min(innerHeight * .4, 260);
        let active = storySections[0];
        storySections.forEach(section => {if(section.getBoundingClientRect().top <= anchorLine) active = section;});
        document.querySelectorAll('[data-section-link]').forEach(link => {
          if(link.dataset.sectionLink === active.id) link.setAttribute('aria-current','location');
          else link.removeAttribute('aria-current');
        });
      }
      if(!reduced.matches) document.documentElement.style.setProperty('--scroll-turn', (y * .035) + 'deg');
      tick = false;
    });
  };
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
  top?.addEventListener('click', () => window.scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'}));

  const fields = { language:'all',category:'all' };
  const url = new URL(location.href);
  for(const key of Object.keys(fields)) {
    const value = url.searchParams.get(key);
    if(value && document.querySelector(`[data-filter="${key}"][data-value="${value}"]`)) fields[key] = value;
  }
  function filterWriting(updateUrl=true) {
    document.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed',String(fields[button.dataset.filter]===button.dataset.value)));
    let count=0;
    document.querySelectorAll('[data-language][data-category]').forEach(card => {
      const show = Object.entries(fields).every(([key,val]) => val==='all' || (card.dataset[key] || '').split(' ').includes(val));
      card.hidden=!show; if(show){count++;card.classList.add('is-visible');}
    });
    const counter = document.getElementById('result-count'); if(counter) counter.textContent=count+(count===1?' piece':' pieces');
    const empty = document.querySelector('.empty-state'); if(empty)empty.hidden=count>0;
    if(updateUrl){const next=new URL(location.href); for(const [k,v] of Object.entries(fields)){if(v==='all')next.searchParams.delete(k);else next.searchParams.set(k,v);} history.replaceState(null,'',next);}
  }
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
    fields[button.dataset.filter]=button.dataset.value;
    if(document.startViewTransition && !reduced.matches) document.startViewTransition(()=>filterWriting()); else filterWriting();
  }));
  document.querySelector('[data-reset-filters]')?.addEventListener('click',()=>{fields.language='all';fields.category='all';filterWriting();});
  if(document.getElementById('result-count'))filterWriting(false);

  const dialog=document.querySelector('.gallery-dialog');
  const photoData=document.getElementById('photo-data');
  const photos=photoData?JSON.parse(photoData.textContent):[];
  let index=0,opener;
  function showPhoto(n){
    index=(n+photos.length)%photos.length;const [slug,caption,alt]=photos[index];
    const image=document.getElementById('gallery-image');
    image.classList.add('is-loading');
    image.onload=()=>image.classList.remove('is-loading');
    image.onerror=()=>image.classList.remove('is-loading');
    image.alt=alt;
    image.src=`/Ivan-Ramon-Ochoa-Lynch/assets/photos/${slug}-1600.webp`;
    if(image.complete && image.naturalWidth)requestAnimationFrame(()=>image.classList.remove('is-loading'));
    document.getElementById('gallery-caption').textContent=caption;
    document.getElementById('gallery-count').textContent=String(index+1).padStart(2,'0')+' / '+String(photos.length).padStart(2,'0');
  }
  document.querySelectorAll('[data-photo]').forEach(button=>button.addEventListener('click',()=>{
    opener=button;showPhoto(Number(button.dataset.photo));dialog.showModal();dialog.querySelector('[data-gallery-close]').focus();
  }));
  dialog?.querySelector('[data-gallery-close]').addEventListener('click',()=>dialog.close());
  dialog?.querySelector('.gallery-prev').addEventListener('click',()=>showPhoto(index-1));
  dialog?.querySelector('.gallery-next').addEventListener('click',()=>showPhoto(index+1));
  dialog?.addEventListener('close',()=>opener?.focus({preventScroll:true}));
  dialog?.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  dialog?.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();showPhoto(index-1);}if(e.key==='ArrowRight'){e.preventDefault();showPhoto(index+1);}});

  function selectPlace(place,changeHash=true){
    const panel=document.querySelector(`[data-place-panel="${place}"]`);if(!panel)return;
    document.body.dataset.activePlace=place;
    document.querySelectorAll('[data-place-panel]').forEach(p=>{p.hidden=p!==panel;p.classList.remove('entering');});
    requestAnimationFrame(()=>panel.classList.add('entering'));
    document.querySelectorAll('[data-select-place]').forEach(button=>{
      const selected=button.dataset.selectPlace===place;
      if(button.tagName.toLowerCase()==='button')button.setAttribute('aria-pressed',String(selected));
      else if(selected)button.setAttribute('aria-current','location');else button.removeAttribute('aria-current');
    });
    document.querySelectorAll('[data-interest]').forEach(b=>b.setAttribute('aria-pressed','false'));
    if(changeHash)history.replaceState(null,'','#place-'+place);
  }
  document.querySelectorAll('[data-select-place]').forEach(button=>button.addEventListener('click',e=>{e.preventDefault();selectPlace(button.dataset.selectPlace);}));
  document.querySelectorAll('[data-interest]').forEach(button=>button.addEventListener('click',()=>{selectPlace(button.dataset.interest);button.setAttribute('aria-pressed','true');}));
  const initial=location.hash.replace('#place-','');if(initial&&initial!==location.hash)selectPlace(initial,false);

  document.querySelectorAll('[data-reader]').forEach(button=>button.addEventListener('click',()=>{
    const choice=button.dataset.reader;
    document.querySelectorAll('[data-reader-panel]').forEach(panel=>panel.hidden=panel.dataset.readerPanel!==choice);
    document.querySelectorAll('[data-reader]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    onScroll();
  }));
})();
