/* Interacciones de páginas internas. */
(() => {
  'use strict';

  const form = document.querySelector('#quoteForm');
  if (form) {
    const service = new URLSearchParams(location.search).get('servicio');
    const serviceSelect = form.querySelector('#projectType');
    const services = window.INFA_CONTENT?.services ?? [];

    if (serviceSelect) {
      serviceSelect.replaceChildren(new Option('Selecciona una opción', ''));
      services.forEach(item => serviceSelect.add(new Option(item.title, item.id)));
      if (service && services.some(item => item.id === service)) serviceSelect.value = service;
    }
  }

})();
