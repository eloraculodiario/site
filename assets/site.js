// assets/site.js
document.addEventListener('DOMContentLoaded', async () => {
  // cambia este valor cuando subas cambios para bustear la caché
  const v = '2025-11-02-02';

  async function inject(selector, url){
    const host = document.querySelector(selector);
    if (!host) return;
    const r = await fetch(`${url}?v=${v}`, { cache: 'no-store' });
    if (r.ok) host.outerHTML = await r.text();
  }

  await inject('[data-include="partials/header.html"]', 'partials/header.html');
  await inject('[data-include="partials/footer.html"]', 'partials/footer.html');

  // resalta enlace activo
  const nav = document.getElementById('site-nav');
  if (nav){
    const here = location.pathname.split('/').pop() || 'index.html';
    [...nav.querySelectorAll('a')].forEach(a => {
      const target = a.getAttribute('href');
      if ((here === '' && target === './') || here === target) a.classList.add('active');
      if (here === 'index.html' && target === './') a.classList.add('active');
    });
  }
});

