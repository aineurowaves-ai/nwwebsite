/* ============ STARFIELD BACKGROUND — ORBIT AROUND LOGO ============ */
(function () {
  const canvas = document.getElementById('stars-canvas');
  const ctx = canvas.getContext('2d');
  let w, h;
  let mouseX = 0, mouseY = 0;
  let smoothX = 0, smoothY = 0;

  const STAR_COUNT = 250;
  const ORBIT_SPEED = 0.00012;
  const stars = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function getLogoCenter() {
    return { x: w * 0.5, y: h * 0.5 };
  }

  function createStars() {
    for (let i = 0; i < STAR_COUNT; i++) {
      const dist = 150 + Math.random() * Math.max(w, h) * 0.9;
      stars.push({
        angle: Math.random() * Math.PI * 2,
        dist: dist,
        speed: (0.6 + Math.random() * 0.8) * ORBIT_SPEED * (800 / dist),
        size: Math.random() * 1.4 + 0.3,
        opacity: Math.random() * 0.4 + 0.1,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
        ellipse: 0.5 + Math.random() * 0.5,
        tilt: (Math.random() - 0.5) * 0.4
      });
    }
  }

  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * -180;
    mouseY = (e.clientY / window.innerHeight - 0.5) * -120;
  });

  function isLightTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light';
  }

  function getStarRgb() {
    return getComputedStyle(document.documentElement).getPropertyValue('--star-color').trim() || '200, 200, 255';
  }

  function drawParticle(sx, sy, size, alpha, light) {
    const rgb = getStarRgb();
    ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
    if (light) {
      const side = Math.max(2.5, size * 3.8);
      ctx.fillRect(Math.round(sx - side / 2), Math.round(sy - side / 2), side, side);
    } else {
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function draw(time) {
    ctx.clearRect(0, 0, w, h);
    const center = getLogoCenter();
    const light = isLightTheme();

    smoothX += (mouseX - smoothX) * 0.04;
    smoothY += (mouseY - smoothY) * 0.04;

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.angle += s.speed;

      const ox = Math.cos(s.angle) * s.dist;
      const oy = Math.sin(s.angle) * s.dist * s.ellipse;

      const cos_t = Math.cos(s.tilt);
      const sin_t = Math.sin(s.tilt);
      const rx = ox * cos_t - oy * sin_t;
      const ry = ox * sin_t + oy * cos_t;

      const depthFactor = s.dist / 800;
      const sx = center.x + rx + smoothX * depthFactor;
      const sy = center.y + ry + smoothY * depthFactor;

      if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) continue;

      const twinkle = Math.sin(time * s.twinkleSpeed + s.twinkleOffset) * 0.3 + 0.7;
      const alphaScale = light ? 0.7 : 1;
      const alpha = Math.min(s.opacity * twinkle * alphaScale, light ? 0.32 : 0.55);

      drawParticle(sx, sy, s.size, alpha, light);
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  createStars();
  requestAnimationFrame(draw);
})();

/* ============ 3D LOGO — SCROLL ANIMATION ============ */
(function () {
  const logo3d = document.getElementById('logo-3d-bg');
  const logoInner = document.getElementById('logo-3d-inner');
  if (!logo3d || !logoInner) return;

  const isInnerPage = !!document.querySelector('.hero.page-hero');
  let scrollY = 0;
  const heroHeight = () => window.innerHeight;

  function easeInOutSine(x) { return -(Math.cos(Math.PI * x) - 1) / 2; }

  function getLogoConfig() {
    const w = window.innerWidth;
    if (w <= 480) return { startX: 50, endX: 50, startScale: 0.5, endScale: 0.42 };
    if (w <= 768) return { startX: 50, endX: 50.5, startScale: 0.62, endScale: 0.48 };
    if (w <= 1024) return { startX: 55, endX: 50.5, startScale: 0.78, endScale: 0.55 };
    return { startX: 75, endX: 50.5, startScale: 1, endScale: 0.7 };
  }

  function getBaseOpacity() {
    const w = window.innerWidth;
    if (isInnerPage) {
      if (w <= 768) return 0.2;
      if (w <= 1024) return 0.28;
      return 0.42;
    }
    if (w <= 480) return 0.32;
    if (w <= 768) return 0.4;
    if (w <= 1024) return 0.5;
    return 1;
  }

  function updateLogo() {
    const { startX, endX, startScale, endScale } = getLogoConfig();
    const progress = Math.min(scrollY / (heroHeight() * 1.2), 1);
    const eased = easeInOutSine(progress);
    const currentX = startX + (endX - startX) * eased;
    const currentScale = startScale + (endScale - startScale) * eased;

    logoInner.style.transform = `translate(-50%, -50%) scale(${currentScale})`;
    logo3d.style.left = currentX + '%';
    logo3d.style.opacity = getBaseOpacity() * (1 - eased * 0.3);
  }

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    requestAnimationFrame(updateLogo);
  });
  window.addEventListener('resize', () => {
    requestAnimationFrame(updateLogo);
  });

  updateLogo();
})();

/* ============ SUBTLE MOUSE PARALLAX ON LOGO ============ */
(function () {
  const logoInner = document.getElementById('logo-3d-inner');
  if (!logoInner) return;

  const coarsePointer = window.matchMedia('(pointer: coarse)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function shouldAnimate() {
    return window.innerWidth > 1024 && !coarsePointer.matches && !reducedMotion.matches;
  }

  let mx = 0, my = 0, cx = 0, cy = 0;

  window.addEventListener('mousemove', (e) => {
    if (!shouldAnimate()) return;
    mx = (e.clientX / window.innerWidth - 0.5) * 12;
    my = (e.clientY / window.innerHeight - 0.5) * 8;
  });

  function tick() {
    if (shouldAnimate()) {
      cx += (mx - cx) * 0.04;
      cy += (my - cy) * 0.04;
      logoInner.style.marginLeft = cx + 'px';
      logoInner.style.marginTop = cy + 'px';
    } else {
      logoInner.style.marginLeft = '0px';
      logoInner.style.marginTop = '0px';
    }
    requestAnimationFrame(tick);
  }
  tick();
})();

/* ============ THEME & LANGUAGE (nav) ============ */
function initNavPreferences() {
  const root = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const langDetails = document.getElementById('lang-details');
  const langMenu = document.getElementById('lang-menu');

  const storedTheme = localStorage.getItem('nw-theme');
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  root.setAttribute('data-theme', storedTheme || (prefersLight ? 'light' : 'dark'));

  themeToggle?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    localStorage.setItem('nw-theme', next);
    langDetails?.removeAttribute('open');
  });

  langMenu?.querySelectorAll('.lang-option').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const lang = btn.dataset.lang;
      if (window.NW_I18N?.applyLang) {
        window.NW_I18N.applyLang(lang);
      }
      langDetails?.removeAttribute('open');
    });
  });

  document.addEventListener('click', (e) => {
    if (langDetails?.hasAttribute('open') && !langDetails.contains(e.target)) {
      langDetails.removeAttribute('open');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavPreferences);
} else {
  initNavPreferences();
}

/* ============ NAVBAR SCROLL ============ */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

/* ============ MOBILE MENU ============ */
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');
navToggle?.addEventListener('click', () => {
  navLinks?.classList.toggle('active');
});
navLinks?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => navLinks.classList.remove('active'));
});

/* ============ FAQ ACCORDION ============ */
document.querySelectorAll('.faq-question').forEach((btn) => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const isActive = item.classList.contains('active');
    document.querySelectorAll('.faq-item').forEach((el) => el.classList.remove('active'));
    if (!isActive) item.classList.add('active');
  });
});

/* ============ SCROLL REVEAL ============ */
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -60px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

document.querySelectorAll(
  '.service-card, .solution-card, .pain-card, .usecase-card, .integration-card, ' +
  '.case-card-link, .academy-card, .process-step, .stat-item, .industry-card, .mini-card, .positioning-grid .mini-card'
).forEach((el) => {
  el.classList.add('fade-in');
  observer.observe(el);
});

/* ============ FORM SUBMIT ============ */
document.getElementById('contact-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const lang = window.NW_I18N?.getLang() || 'en';
  const defaultLabel = window.NW_I18N?.t(lang, 'form.submit') || btn.textContent;
  btn.textContent = window.NW_I18N?.t(lang, 'form.success') || 'Request received!';
  btn.style.pointerEvents = 'none';
  btn.style.opacity = '0.7';
  setTimeout(() => {
    btn.textContent = defaultLabel;
    btn.style.pointerEvents = '';
    btn.style.opacity = '';
    e.target.reset();
  }, 3000);
});
