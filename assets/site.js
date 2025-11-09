// assets/site.js
document.addEventListener('DOMContentLoaded', async () => {
  // Sube este valor cuando hagas cambios para bustear la caché de parciales
  const VERSION = '2025-11-02-03';

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

  /** ---------------------------
   *  Resaltar enlace activo
   * --------------------------*/
  const nav = document.getElementById('site-nav');

  // Normaliza rutas para comparación más robusta
  const normalizePath = (p) => {
    try {
      // Si es relativo, crear URL con base en la actual
      const u = new URL(p, window.location.href);
      let path = u.pathname;
      // Quitar trailing slash excepto la raíz
      if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
      // Si no hay archivo, asumir index.html (comportamiento típico en sitios estáticos)
      if (!path.split('/').pop().includes('.')) path = `${path}/index.html`.replace('//', '/');
      return path.toLowerCase();
    } catch {
      return p.toLowerCase();
    }
  };

  if (nav) {
    const current = normalizePath(window.location.pathname || '/');
    const anchors = [...nav.querySelectorAll('a[href]')];

    anchors.forEach((a) => {
      const href = a.getAttribute('href') || '';
      // Ignorar enlaces externos y anclas puras
      if (/^https?:\/\//i.test(href) || href.startsWith('#')) return;

      const target = normalizePath(href || './');
      const isRootLink = href === './' || href === '/' || href === '';
      const match =
        target === current ||
        (isRootLink && (current.endsWith('/index.html') || current === '/index.html'));

      if (match) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
    });
  }

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
  });

  /** ---------------------------
   *  Mejoras menores de UX
   * --------------------------*/

  // Añade clase a <html> cuando se usa teclado (para estilos :focus visibles si lo deseas)
  let usingKeyboard = false;
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (!usingKeyboard) {
        usingKeyboard = true;
        document.documentElement.classList.add('using-keyboard');
      }
    }
  });
  window.addEventListener('mousedown', () => {
    if (usingKeyboard) {
      usingKeyboard = false;
      document.documentElement.classList.remove('using-keyboard');
    }
  });
});

