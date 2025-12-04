// assets/site.js
document.addEventListener('DOMContentLoaded', async () => {
  // Sube este valor cuando hagas cambios para bustear la caché de parciales
  const VERSION = '2025-11-13-01';

  /**
   * Inyecta el HTML de un parcial en el elemento host.
   * Reemplaza el nodo host con el contenido obtenido.
   */
  async function inject(selector, url) {
    const host = document.querySelector(selector);
    if (!host) return;

    const withVersion = `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(VERSION)}`;
    try {
      const res = await fetch(withVersion, { cache: 'no-store' });
      if (!res.ok) {
        console.warn(`[site.js] No se pudo cargar ${url}: ${res.status} ${res.statusText}`);
        return;
      }
      const html = await res.text();
      host.outerHTML = html;
    } catch (err) {
      console.error(`[site.js] Error al inyectar ${url}:`, err);
    }
  }

  // Inyectar header y footer (si existen en la página)
  await inject('[data-include="partials/header.html"]', 'partials/header.html');
  await inject('[data-include="partials/footer.html"]', 'partials/footer.html');

  // Señal para otros scripts de que los parciales ya están en el DOM
  document.dispatchEvent(new CustomEvent('partials:loaded'));

  /** ---------------------------
   *  Resaltar enlace activo
   * --------------------------*/
  function normalizePath(p) {
    try {
      const u = new URL(p, window.location.href);
      let path = u.pathname;
      if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
      // Si no hay archivo, asumimos index.html
      const last = path.split('/').pop();
      if (!last || !last.includes('.')) path = `${path}/index.html`.replace('//', '/');
      return path.toLowerCase();
    } catch {
      return (p || '').toLowerCase();
    }
  }

  function highlightActiveLink() {
    const nav = document.getElementById('site-nav');
    if (!nav) return;

    const current = normalizePath(window.location.pathname || '/');
    const anchors = Array.from(nav.querySelectorAll('a[href]'));

    anchors.forEach((a) => {
      a.classList.remove('active');
      a.removeAttribute('aria-current');

      const href = a.getAttribute('href') || '';
      // Ignorar enlaces externos y anclas puras
      if (/^https?:\/\//i.test(href) || href.startsWith('#')) return;

      const target = normalizePath(href || './');
      const isRootLink = href === './' || href === '/' || href === '';

      const match =
        target === current ||
        (isRootLink && current.endsWith('/index.html'));

      if (match) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  highlightActiveLink();

  // Reaplicar en navegaciones del historial (por si hay SPA-lite)
  window.addEventListener('popstate', highlightActiveLink);

  /** ---------------------------
   *  Scroll suave en anclas internas
   * --------------------------*/
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('a[href^="#"]');
    if (!a) return;

    const id = a.getAttribute('href');
    if (id === '#' || id.length < 2) return;

    const target = document.querySelector(id);
    if (!target) return;

    ev.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Actualiza el hash sin recargar
    history.pushState(null, '', id);
    highlightActiveLink();
  });

  /** ---------------------------
   *  Mejoras menores de UX
   * --------------------------*/
  let usingKeyboard = false;
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && !usingKeyboard) {
      usingKeyboard = true;
      document.documentElement.classList.add('using-keyboard');
    }
  });
  window.addEventListener('mousedown', () => {
    if (usingKeyboard) {
      usingKeyboard = false;
      document.documentElement.classList.remove('using-keyboard');
    }
  });
  /** ---------------------------
   *  Menú Móvil
   * --------------------------*/
  function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');

    if (btn && menu) {
      btn.addEventListener('click', () => {
        menu.classList.toggle('hidden');
        const isExpanded = !menu.classList.contains('hidden');
        btn.setAttribute('aria-expanded', isExpanded);
        btn.textContent = isExpanded ? '✕' : '☰';
      });

      // Cerrar al hacer click en un enlace
      menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          menu.classList.add('hidden');
          btn.setAttribute('aria-expanded', 'false');
          btn.textContent = '☰';
        });
      });
    }
  }

  // Inicializar menú móvil después de cargar los parciales
  // Si los parciales ya se cargaron (porque inject es async pero await), se ejecuta.
  // Pero como inject es async y está en el mismo scope, se ejecutará después de inject.
  initMobileMenu();

  // Por si acaso, escuchar el evento custom
  document.addEventListener('partials:loaded', initMobileMenu);
});

