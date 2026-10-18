// Portfolio filters combine a language with one category.
const filters = { language: 'all', category: 'all' };
document.querySelectorAll('[data-group]').forEach(button => {
  button.addEventListener('click', () => {
    const group = button.dataset.group;
    filters[group] = button.dataset.value;
    document.querySelectorAll(`[data-group="${group}"]`).forEach(control => {
      control.setAttribute('aria-pressed', String(control === button));
    });
    let shown = 0;
    document.querySelectorAll('.project').forEach(project => {
      const matches = Object.entries(filters).every(([key, value]) =>
        value === 'all' || (project.dataset[key] || '').split(/\s+/).includes(value)
      );
      project.hidden = !matches;
      if (matches) shown++;
    });
    const empty = document.getElementById('empty');
    const count = document.getElementById('result-count');
    if (empty) empty.hidden = shown > 0;
    if (count) count.textContent = shown + (shown === 1 ? ' piece' : ' pieces');
  });
});

// Native anchors work without JavaScript. Highlight the section being read.
const storySections = document.querySelectorAll('[data-story-section]');
if (storySections.length && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    const active = entries.filter(entry => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (!active) return;
    document.querySelectorAll('[data-section-link]').forEach(link => {
      if (link.dataset.sectionLink === active.target.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-70px 0px -65% 0px', threshold: 0 });
  storySections.forEach(section => observer.observe(section));
}

// View the supplied photos at full size, with Escape and focus restoration.
const photoDialog = document.getElementById('photo-dialog');
if (photoDialog) {
  const image = document.getElementById('lightbox-image');
  const caption = document.getElementById('photo-caption');
  let opener;
  document.querySelectorAll('[data-photo]').forEach(button => {
    button.addEventListener('click', () => {
      opener = button;
      image.src = button.dataset.photo;
      image.alt = button.querySelector('img').alt;
      caption.textContent = button.dataset.caption;
      photoDialog.showModal();
    });
  });
  photoDialog.querySelector('.photo-close').addEventListener('click', () => photoDialog.close());
  photoDialog.addEventListener('close', () => opener?.focus());
  photoDialog.addEventListener('click', event => {
    if (event.target !== photoDialog) return;
    const rect = photoDialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) photoDialog.close();
  });
}
