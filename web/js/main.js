/* INFA Soluciones — interacciones ligeras y contenido desde content.js. */
(() => {
  'use strict';
  const data = window.INFA_CONTENT || {};
  const number = data.company?.whatsapp || '51922456016';
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const wa = message => `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  const mainScript = [...document.scripts].find(script => /(?:^|\/)js\/main\.js(?:$|\?)/.test(script.src));
  const imageRoot = new URL('../assets/images/', mainScript?.src || location.href);
  const fallbackImages = {
    metal: 'illustrations/portones.optimized.webp',
    carpinteria: 'image10.jpeg',
    hidraulica: '20121106_115723.jpg',
    modulos: 'illustrations/estructuralatadrywall.optimized.webp',
    mantenimiento: '20121105_201740.jpg',
    default: '20121105_185219.jpg'
  };
  $$('img:not(.gallery-card img)').forEach(image => image.addEventListener('error', () => {
    if (image.dataset.fallbackApplied || image.closest('.brand, .footer-logo, .service-page-icon')) return;
    image.dataset.fallbackApplied = 'true';
    const context = `${image.alt} ${image.closest('[data-category]')?.dataset.category || ''}`.toLowerCase();
    const category = /metal|soldadura|port[oó]n/.test(context) ? 'metal'
      : /carpinter[ií]a|mueble|melamina/.test(context) ? 'carpinteria'
      : /hidr[aá]ul|tuber[ií]a|agua/.test(context) ? 'hidraulica'
      : /m[oó]dul|construcci[oó]n|drywall|infraestructura/.test(context) ? 'modulos'
      : /manten/.test(context) ? 'mantenimiento' : 'default';
    image.src = new URL(fallbackImages[category], imageRoot).href;
  }, { once: true }));
  $$('[data-whatsapp]').forEach(a => { a.href = wa('Hola INFA Soluciones, quisiera conversar sobre un proyecto.'); a.target='_blank'; a.rel='noopener noreferrer'; });
  const whatsappIcon = '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M16.04 3C8.88 3 3.06 8.78 3.06 15.9c0 2.28.6 4.5 1.75 6.46L3 29l6.86-1.79a13.1 13.1 0 0 0 6.18 1.56h.01c7.15 0 12.97-5.79 12.97-12.9 0-3.45-1.35-6.69-3.8-9.12A12.9 12.9 0 0 0 16.04 3Zm0 23.58h-.01c-1.92 0-3.8-.51-5.44-1.48l-.39-.23-4.07 1.06 1.09-3.96-.25-.4a10.7 10.7 0 0 1-1.65-5.67c0-5.9 4.83-10.7 10.73-10.7 2.85 0 5.53 1.1 7.55 3.12a10.6 10.6 0 0 1 3.13 7.56c0 5.9-4.83 10.7-10.69 10.7Zm5.88-8.02c-.32-.16-1.91-.94-2.21-1.05-.3-.11-.51-.16-.73.16-.21.32-.84 1.05-1.03 1.27-.19.21-.38.24-.7.08-.32-.16-1.36-.5-2.6-1.59-.96-.85-1.61-1.9-1.8-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.38.48-.57.16-.19.21-.32.32-.54.1-.21.05-.4-.03-.56-.08-.16-.73-1.74-1-2.38-.26-.63-.53-.54-.73-.55h-.62c-.22 0-.57.08-.87.4-.3.32-1.14 1.1-1.14 2.68 0 1.58 1.17 3.1 1.33 3.31.16.21 2.3 3.5 5.57 4.9.78.34 1.39.54 1.86.69.78.25 1.49.22 2.05.13.63-.09 1.91-.78 2.18-1.53.27-.76.27-1.4.19-1.53-.08-.13-.3-.21-.62-.38Z"/></svg>';
  let whatsappFloat = $('.whatsapp-float');
  if (!whatsappFloat) {
    whatsappFloat = document.createElement('a');
    whatsappFloat.className = 'whatsapp-float';
    whatsappFloat.dataset.whatsapp = '';
    whatsappFloat.href = 'https://wa.me/';
    document.body.append(whatsappFloat);
  }
  whatsappFloat.setAttribute('aria-label', 'Abrir conversación con INFA Soluciones por WhatsApp');
  whatsappFloat.href = wa('Hola INFA Soluciones, quisiera conversar sobre un proyecto.');
  whatsappFloat.target = '_blank';
  whatsappFloat.rel = 'noopener noreferrer';
  whatsappFloat.innerHTML = whatsappIcon;
  const headerInner = $('.header-inner');
  if (headerInner && !$('.header-facebook', headerInner) && data.company?.facebook) {
    const facebook = document.createElement('a');
    facebook.className = 'header-facebook';
    facebook.href = data.company.facebook;
    facebook.target = '_blank';
    facebook.rel = 'noopener noreferrer';
    facebook.setAttribute('aria-label', 'Visitar INFA Soluciones en Facebook');
    facebook.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M13.5 21v-8.2h2.8l.4-3.2h-3.2v-2c0-.9.3-1.5 1.6-1.5h1.7V3.2c-.3 0-1.4-.2-2.6-.2-2.6 0-4.4 1.6-4.4 4.5v2.1H7v3.2h2.8V21h3.7Z"/></svg>';
    $('.menu-toggle', headerInner)?.before(facebook);
  }
  $$('[data-whatsapp-number]').forEach(n => n.textContent = `+${number.slice(0,2)} ${number.slice(2,5)} ${number.slice(5,8)} ${number.slice(8)}`);
  const serviceSelect=$('#projectType');
  if(serviceSelect && data.services) {
    const requestedService = new URLSearchParams(location.search).get('servicio');
    serviceSelect.replaceChildren(new Option('Selecciona una opción', ''));
    data.services.forEach(item => serviceSelect.add(new Option(item.title, item.id)));
    if(requestedService && data.services.some(item => item.id === requestedService)) serviceSelect.value = requestedService;
  }
  const schema=$('#faqSchema'); if(schema && data.faqs) schema.textContent=JSON.stringify({'@context':'https://schema.org','@type':'FAQPage',mainEntity:data.faqs.map(item=>({'@type':'Question',name:item.question,acceptedAnswer:{'@type':'Answer',text:item.answer}}))});
  const serviceGrid = $('#serviceGrid');
  if(serviceGrid && data.services) serviceGrid.innerHTML = data.services.map((s,i)=>`<article class="service-card"><div class="service-visual"><img src="${escape(s.image)}" width="1200" height="800" alt="${escape(s.alt)}" loading="lazy" decoding="async"></div><span class="service-kicker">${String(i+1).padStart(2,'0')} / División técnica</span><h3>${escape(s.title)}</h3><p>${escape(s.description)}</p><ul>${s.items.map(item=>`<li>${escape(item)}</li>`).join('')}</ul><a class="text-link" target="_blank" rel="noopener" href="${wa(`Hola INFA Soluciones, deseo solicitar una propuesta para ${s.title}.`)}">Solicitar propuesta <span aria-hidden="true">↗</span></a></article>`).join('');
  const stats = $('#differentiatorGrid');
  if(stats && data.differentiators) stats.innerHTML = data.differentiators.map((d,i)=>`<article class="bento-card metric-card"><span class="eyebrow bento-tag">0${i+1} / ${escape(d.label)}</span><div class="bento-num" data-metric>${escape(d.number)}</div><h3>${escape(d.label)}</h3><p>${escape(d.detail)}</p></article>`).join('');
  const studies = $('#studyGrid');
  if(studies && data.projects) studies.innerHTML = data.projects.map(p=>{const category=['metal','carpinteria','modulos','mantenimiento','hidraulica'].find(id=>p.id.includes(id))||'metal'; const imageSrc=p.image||new URL(fallbackImages[category],imageRoot).href; const imageAlt=p.image?escape(p.alt):'Imagen de referencia del archivo visual'; return `<article class="study-card" data-category="${category}"><button class="study-image" type="button" disabled><img src="${escape(imageSrc)}" alt="${imageAlt}" loading="lazy" decoding="async">${p.image?'':'<span class="study-reference-label">Imagen de referencia</span>'}</button><div class="study-content"><p class="eyebrow">${escape(p.service)}</p><h3>${escape(p.title)}</h3><dl><div><dt>Ubicación</dt><dd>${escape(p.location)}</dd></div><div><dt>Tipo de obra</dt><dd>${escape(p.workType)}</dd></div><div><dt>Plazo</dt><dd>${escape(p.duration)}</dd></div></dl><p><b>Reto</b><br>${escape(p.challenge)}</p><p><b>Solución</b><br>${escape(p.solution)}</p><p><b>Resultado</b><br>${escape(p.result)}</p></div></article>`;}).join('');
  $$('.study-image').forEach(button=>{
    const image=$('img',button);
    if(image){
      const activate=()=>{if(!image.naturalWidth)return;button.dataset.lightboxSrc=image.getAttribute('src');button.dataset.lightboxAlt=image.alt;button.disabled=false;};
      const fallback=()=>{image.src=new URL(fallbackImages[button.closest('.study-card')?.dataset.category]||fallbackImages.default,imageRoot).href;image.alt='Imagen de referencia del archivo visual';button.dataset.reference='true';button.querySelector('.study-reference-label')?.remove();const label=document.createElement('span');label.className='study-reference-label';label.textContent='Imagen de referencia';button.append(label);};
      image.addEventListener('load',activate,{once:true});
      image.addEventListener('error',fallback,{once:true});
      if(image.complete){if(image.naturalWidth)activate();else fallback();}
    }
  });
  $$('#studyFilters [data-study-filter]').forEach(button=>button.addEventListener('click',()=>{$$('#studyFilters [data-study-filter]').forEach(item=>{const active=item===button;item.classList.toggle('is-active',active);item.setAttribute('aria-pressed',String(active));}); $$('.study-card').forEach(card=>card.hidden=button.dataset.studyFilter!=='all'&&card.dataset.category!==button.dataset.studyFilter);}));
  const lightbox=$('#projectLightbox'); $$('.study-image').forEach(button=>button.addEventListener('click',()=>{if(!button.dataset.lightboxSrc||!lightbox)return;const image=lightbox.querySelector('img');image.src=button.dataset.lightboxSrc;image.alt=button.dataset.lightboxAlt;lightbox.showModal();})); $('.lightbox-close')?.addEventListener('click',()=>lightbox?.close()); lightbox?.addEventListener('click',event=>{if(event.target===lightbox)lightbox.close();});
  const faq = $('#faqList');
  if(faq && data.faqs) faq.innerHTML = data.faqs.map((f,i)=>`<details><summary>${escape(f.question)}</summary><p>${escape(f.answer)}</p></details>`).join('');
  const form = $('#quoteForm'), emailLink = $('#emailProposal'), feedback = $('#formFeedback');
  if (emailLink) emailLink.hidden = true;
  const formValues = () => new FormData(form);
  const messageFor = fd => ['Hola INFA Soluciones, solicito una propuesta.','',`Nombre: ${fd.get('contactName')}`,`Empresa: ${fd.get('companyName')}`,`Cargo: ${fd.get('jobTitle')}`,`Teléfono: ${fd.get('contactPhone')}`,`Correo: ${fd.get('contactEmail')}`,`Tipo de proyecto: ${fd.get('projectType')}`,`Plazo estimado: ${fd.get('projectDeadline')}`,`Ubicación: ${fd.get('projectLocation')}`,`Mensaje: ${fd.get('projectDetails')}`].join('\n');
  form?.addEventListener('submit', event => { event.preventDefault(); if(!form.reportValidity()) return; const msg=messageFor(formValues()); window.open(wa(msg),'_blank','noopener,noreferrer'); feedback.textContent='Se abrió WhatsApp con los datos de la solicitud.'; });
  emailLink?.addEventListener('click',()=>{if(emailLink.dataset.mailto)window.location.assign(emailLink.dataset.mailto);});
  form?.addEventListener('input', () => { const fd=formValues(), email=data.company?.email||''; const ready=Boolean(email && !email.includes('COMPLETAR') && email.includes('@')); if(ready){emailLink.dataset.mailto=`mailto:${email}?subject=${encodeURIComponent('Solicitud de propuesta — '+(fd.get('companyName')||''))}&body=${encodeURIComponent(messageFor(fd))}`;emailLink.disabled=false;emailLink.hidden=false;}else{delete emailLink.dataset.mailto;emailLink.disabled=true;emailLink.hidden=true;} });
  const toggle=$('#menuToggle'), nav=$('#mainNav'), header=$('#siteHeader');
  const close=()=>{ nav?.classList.remove('is-open'); toggle?.setAttribute('aria-expanded','false'); document.body.classList.remove('menu-open'); };
  toggle?.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav?.classList.toggle('is-open',open);document.body.classList.toggle('menu-open',open);});
  $$('#mainNav a').forEach(a=>a.addEventListener('click',close)); addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  const scrollProgress = document.createElement('div');
  scrollProgress.className = 'scroll-progress';
  scrollProgress.setAttribute('aria-hidden', 'true');
  scrollProgress.innerHTML = '<span></span>';
  document.body.append(scrollProgress);
  const progressBar = $('span', scrollProgress);
  let scrollUpdateQueued = false;
  const updateScrollState = () => {
    const scrollable = document.documentElement.scrollHeight - innerHeight;
    progressBar.style.transform = `scaleX(${scrollable > 0 ? Math.min(scrollY / scrollable, 1) : 0})`;
    header?.classList.toggle('is-scrolled', scrollY > 10);
  };
  const scheduleScrollUpdate = () => {
    if (scrollUpdateQueued) return;
    scrollUpdateQueued = true;
    requestAnimationFrame(() => {
      updateScrollState();
      scrollUpdateQueued = false;
    });
  };
  addEventListener('scroll', scheduleScrollUpdate, { passive: true });
  addEventListener('resize', scheduleScrollUpdate, { passive: true });
  updateScrollState();
  $('#currentYear')?.replaceChildren(String(new Date().getFullYear()));
  // Slider comparativo opcional: se presenta solo con pares de fotos autorizados en content.js.
  if(data.beforeAfter?.length){const host=$('#comparisonTitle')?.closest('.shell')?.querySelector('.comparison-empty'); if(host) host.outerHTML=`<div class="comparison-sliders">${data.beforeAfter.map(item=>`<figure class="comparison-item"><div class="comparison-frame"><img src="${escape(item.after)}" alt="${escape(item.afterAlt)}" loading="lazy"><div class="comparison-before"><img src="${escape(item.before)}" alt="${escape(item.beforeAlt)}" loading="lazy"></div><input type="range" min="0" max="100" value="50" aria-label="Comparar antes y después"></div><figcaption>${escape(item.title)}</figcaption></figure>`).join('')}</div>`; $$('.comparison-frame input[type=range]').forEach(input=>input.addEventListener('input',()=>input.closest('.comparison-frame').style.setProperty('--split',`${input.value}%`))); }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    const targets = $$('.reveal,.service-card,.study-card,.metric-card,.section-index,.section-heading,.process-step,.home-visual-card,.gallery-preview-card,.service-page-card,.company-pillar-grid article,.company-photo-grid > *,.services-photo-grid figure,.gallery-collection-card,.contact-details,.contact-form,.contact-hero-image,.company-hero-copy,.services-hero-grid > *, .gallery-hero .shell > *, .gallery-subhero .shell > *');
    targets.forEach((element, index) => {
      element.classList.add('motion-reveal');
      element.style.setProperty('--motion-delay', `${index % 4 * 65}ms`);
    });
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      const metric = entry.target.querySelector('[data-metric]');
      if (metric && /^\d+$/.test(metric.textContent.trim())) {
        const target = Number(metric.textContent.trim()), start = performance.now(), duration = 650;
        const tick = now => {
          const progress = Math.min((now - start) / duration, 1);
          metric.textContent = String(Math.round(target * progress)).padStart(2, '0');
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
      observer.unobserve(entry.target);
    }), { rootMargin: '0px 0px -5% 0px', threshold: .12 });
    targets.forEach(element => observer.observe(element));
  }
})();
