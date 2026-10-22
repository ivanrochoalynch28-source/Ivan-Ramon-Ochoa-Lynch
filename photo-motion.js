/* Bounded photographic depth. Scroll and pointer share one frame loop. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const photos = [...document.querySelectorAll('.photo')].map(figure => ({
    figure, frame: figure.querySelector('.photo-open'), rect: null,
    pointerX: 0, pointerY: 0, x: 0, y: 0, rx: 0, ry: 0
  })).filter(photo => photo.frame?.querySelector('img'));
  if (!photos.length || !('IntersectionObserver' in window)) return;
  const visible = new Set();
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  let raf = 0, measure = true, lastTime = 0;

  function schedule() {
    if (!raf && !reduced.matches && !document.hidden && visible.size) {
      raf = requestAnimationFrame(render);
    }
  }
  function render(time) {
    raf = 0;
    if (reduced.matches || document.hidden) return;
    // Time-based smoothing keeps the same weight on 60 Hz and 120 Hz screens.
    const delta = lastTime ? Math.min(50, time - lastTime) : 16.67;
    const ease = 1 - Math.pow(.82, delta / 16.67);
    lastTime = time;
    const refresh = measure;
    measure = false;
    // Read all geometry before writing styles.
    if (refresh) visible.forEach(photo => { photo.rect = photo.frame.getBoundingClientRect(); });
    let moving = false;
    visible.forEach(photo => {
      const rect = photo.rect;
      if (!rect || !rect.height) return;
      const scroll = clamp((innerHeight / 2 - rect.top - rect.height / 2) / (innerHeight / 2 + rect.height / 2), -1, 1);
      // Stay inside the 6% image overscan, including small mobile frames.
      const depth = Math.min(finePointer.matches ? 17 : 10, rect.height * .024);
      const target = {
        x: photo.pointerX * Math.min(7, rect.width * .015),
        y: scroll * depth * .72 + photo.pointerY * depth * .25,
        rx: -photo.pointerY * .85,
        ry: photo.pointerX * 1.15
      };
      for (const key of ['x','y','rx','ry']) {
        const distance = target[key] - photo[key];
        photo[key] = Math.abs(distance) < .01 ? target[key] : photo[key] + distance * ease;
        if (Math.abs(distance) > .02) moving = true;
        photo.frame.style.setProperty('--photo-' + key, photo[key].toFixed(3) + (key.startsWith('r') ? 'deg' : 'px'));
      }
    });
    if (moving) schedule(); else lastTime = 0;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const photo = photos.find(item => item.figure === entry.target);
      if (entry.isIntersecting) visible.add(photo); else visible.delete(photo);
      photo.figure.classList.toggle('motion-active', entry.isIntersecting && !reduced.matches);
    });
    measure = true;
    schedule();
  }, {rootMargin:'80px 0px', threshold:0});

  photos.forEach(photo => {
    observer.observe(photo.figure);
    photo.frame.addEventListener('pointermove', event => {
      if (reduced.matches || !finePointer.matches || event.pointerType === 'touch') return;
      const rect = photo.frame.getBoundingClientRect();
      photo.pointerX = clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1);
      photo.pointerY = clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1);
      schedule();
    }, {passive:true});
    const resetPointer = () => { photo.pointerX = photo.pointerY = 0; schedule(); };
    photo.frame.addEventListener('pointerleave', resetPointer, {passive:true});
    photo.frame.addEventListener('pointercancel', resetPointer, {passive:true});
    photo.frame.addEventListener('blur', resetPointer);
    photo.frame.querySelector('img').draggable = false;
  });
  function updateGeometry() { measure = true; schedule(); }
  addEventListener('scroll', updateGeometry, {passive:true});
  addEventListener('resize', updateGeometry, {passive:true});
  // Font swaps and image loads can alter document position without a scroll.
  document.fonts?.ready.then(updateGeometry);
  photos.forEach(photo => photo.frame.querySelector('img').addEventListener('load', updateGeometry, {once:true}));
  function reset() {
    cancelAnimationFrame(raf); raf = 0; lastTime = 0;
    photos.forEach(photo => {
      photo.pointerX = photo.pointerY = photo.x = photo.y = photo.rx = photo.ry = 0;
      for (const key of ['x','y','rx','ry']) photo.frame.style.removeProperty('--photo-' + key);
      photo.figure.classList.toggle('motion-active', visible.has(photo) && !reduced.matches);
    });
    measure = true; schedule();
  }
  reduced.addEventListener('change', reset);
  finePointer.addEventListener('change', reset);
  document.addEventListener('visibilitychange', reset);
  addEventListener('pageshow', updateGeometry);
})();
