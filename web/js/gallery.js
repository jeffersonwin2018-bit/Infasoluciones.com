/* Galería visual: colecciones con carga diferida y ampliación accesible. */
(() => {
  'use strict';

  const items = window.INFA_GALLERY;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
  const total = $('[data-gallery-total]');
  if (total && Array.isArray(items)) total.textContent = String(items.length);

  $$('[data-gallery-count]').forEach(element => {
    const category = element.dataset.galleryCount;
    const count = Array.isArray(items) ? items.filter(item => item.category === category).length : 0;
    element.textContent = `${count} ${count === 1 ? 'imagen' : 'imágenes'}`;
  });

  const host = $('[data-gallery-category]');
  const grid = $('#galleryGrid');
  if (!host || !grid) return;

  const category = host.dataset.galleryCategory;
  const collection = Array.isArray(items) ? items.filter(item => item.category === category) : [];
  const status = $('[data-gallery-status]', host);
  if (!Array.isArray(items)) {
    if (status) status.textContent = 'No se pudo cargar el índice de imágenes.';
    return;
  }
  if (!collection.length) {
    if (status) status.textContent = 'No hay imágenes disponibles en esta colección.';
    return;
  }

  grid.innerHTML = collection.map(item => `
    <figure class="gallery-card${item.kind === 'graphic' ? ' is-graphic' : ''}">
      <button class="gallery-thumb" type="button" data-gallery-open aria-label="Ampliar ${escape(item.title)}">
        <img src="${escape(item.src)}" alt="${escape(item.alt)}" loading="lazy" decoding="async">
        <span class="gallery-zoom" aria-hidden="true">Ampliar ↗</span>
      </button>
      <figcaption><span class="gallery-card-label">${item.kind === 'graphic' ? 'Ficha visual' : 'Archivo visual'}</span><strong>${escape(item.title)}</strong></figcaption>
    </figure>`).join('');

  if (status) status.textContent = `${collection.length} ${collection.length === 1 ? 'imagen' : 'imágenes'}`;

  const lightbox = $('#galleryLightbox');
  const lightboxImage = $('img', lightbox);
  const lightboxCaption = $('figcaption', lightbox);
  const closeButton = $('.gallery-lightbox-close', lightbox);
  const lightboxFigure = $('figure', lightbox);
  const controls = document.createElement('div');
  controls.className = 'gallery-lightbox-controls';
  controls.innerHTML = '<button type="button" data-gallery-previous aria-label="Ver imagen anterior">← Anterior</button><span data-gallery-position aria-live="polite"></span><button type="button" data-gallery-next aria-label="Ver imagen siguiente">Siguiente →</button>';
  lightboxFigure.append(controls);
  const previousButton = $('[data-gallery-previous]', controls);
  const nextButton = $('[data-gallery-next]', controls);
  const position = $('[data-gallery-position]', controls);
  let currentIndex = 0;

  const showImage = index => {
    currentIndex = (index + collection.length) % collection.length;
    const item = collection[currentIndex];
    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt;
    lightboxCaption.textContent = item.title;
    position.textContent = `${currentIndex + 1} / ${collection.length}`;
    previousButton.disabled = collection.length < 2;
    nextButton.disabled = collection.length < 2;
  };

  grid.addEventListener('click', event => {
    const button = event.target.closest('[data-gallery-open]');
    if (!button || !lightbox) return;
    const card = button.closest('.gallery-card');
    currentIndex = [...grid.querySelectorAll('.gallery-card')].indexOf(card);
    showImage(currentIndex);
    lightbox.showModal();
    closeButton.focus();
  });
  previousButton.addEventListener('click', () => showImage(currentIndex - 1));
  nextButton.addEventListener('click', () => showImage(currentIndex + 1));
  lightbox.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showImage(currentIndex - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      showImage(currentIndex + 1);
    }
  });

  grid.querySelectorAll('img').forEach(image => image.addEventListener('error', () => {
    const card = image.closest('.gallery-card');
    card.classList.add('is-unavailable');
    image.alt = 'Imagen no disponible';
    const message = document.createElement('span');
    message.className = 'gallery-unavailable';
    message.textContent = 'No se pudo cargar esta imagen.';
    card.querySelector('.gallery-thumb').append(message);
  }, { once: true }));

  closeButton?.addEventListener('click', () => lightbox.close());
  lightbox?.addEventListener('click', event => {
    if (event.target === lightbox) lightbox.close();
  });

  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }), { rootMargin: '80px 0px', threshold: 0.08 });
    grid.querySelectorAll('.gallery-card').forEach(card => observer.observe(card));
  }
})();
