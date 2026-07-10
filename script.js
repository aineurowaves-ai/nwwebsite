/* Neurowaves site — build 2026-07-06-v80 */
(function forceDarkTheme() {
  document.documentElement.setAttribute('data-theme', 'dark');
  try { localStorage.removeItem('nw-theme'); } catch (_) {}
})();

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

  const heroEl = document.querySelector('.hero:not(.page-hero)') || document.querySelector('.hero');
  const isInnerPage = !!document.querySelector('.hero.page-hero');
  const logoVideo = logoInner.querySelector('.logo-video');
  const logoFallback = logoInner.querySelector('.logo-fallback');
  let scrollY = 0;
  let mobileStartTop = 76;
  let mobileStartOffsetY = 0;
  let smoothOffsetY = 0;
  let smoothScale = 0.8;
  let canvas = null;
  let canvasCtx = null;
  let rafId = 0;
  let videoFrameCb = null;

  const LOGO_VIDEO_DARK = '/assets/logo-3d.webm';
  const LOGO_VIDEO_LIGHT = '/assets/logo-3d-light.webm';

  const heroHeight = () => window.innerHeight;
  const isMobile = () => window.innerWidth <= 768;
  const isHomeMobileHero = () => !isInnerPage && isMobile();

  function easeInOutSine(x) { return -(Math.cos(Math.PI * x) - 1) / 2; }
  function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function isLightTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light';
  }

  function hideFallback() {
    logoInner.classList.add('is-video-active');
    if (logoFallback) logoFallback.style.display = 'none';
  }

  function tryPlay() {
    if (!logoVideo) return;
    const p = logoVideo.play();
    if (p && typeof p.then === 'function') p.then(hideFallback).catch(() => {});
  }

  function syncMobileLogoSource() {
    if (!logoVideo || !isMobile()) return;
    const want = isLightTheme() ? LOGO_VIDEO_LIGHT : LOGO_VIDEO_DARK;
    if (!logoVideo.src.includes(want)) {
      logoVideo.src = want;
      logoVideo.load();
      logoVideo.addEventListener('loadeddata', tryPlay, { once: true });
    }
  }

  function ensureLogoVideo() {
    if (!logoVideo) return;
    logoVideo.muted = true;
    logoVideo.playsInline = true;
    logoVideo.setAttribute('playsinline', '');
    logoVideo.setAttribute('webkit-playsinline', '');
    logoVideo.preload = 'auto';
    logoVideo.loop = true;

    logoVideo.addEventListener('playing', hideFallback);
    syncMobileLogoSource();
    logoVideo.addEventListener('loadeddata', tryPlay, { once: true });
    tryPlay();

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) tryPlay();
    });
    document.addEventListener('touchstart', tryPlay, { passive: true });

    new MutationObserver(() => {
      syncMobileLogoSource();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  function stopCanvasLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    if (videoFrameCb && logoVideo && typeof logoVideo.cancelVideoFrameCallback === 'function') {
      logoVideo.cancelVideoFrameCallback(videoFrameCb);
    }
    videoFrameCb = null;
  }

  function removeMobileCanvas() {
    stopCanvasLoop();
    if (canvas) {
      canvas.remove();
      canvas = null;
      canvasCtx = null;
    }
    if (logoVideo) logoVideo.classList.remove('logo-video--source');
    logoInner.classList.remove('is-canvas-active');
  }

  function resizeCanvas() {
    if (!canvas) return;
    const cssSize = Math.max(1, Math.round(logo3d.offsetWidth || 400));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.round(cssSize * dpr);
    if (canvas.width !== px) {
      canvas.width = px;
      canvas.height = px;
    }
  }

  function keyMatte(imageData) {
    const light = isLightTheme();
    const maxCutoff = light ? 22 : 18;
    const spreadMax = light ? 5 : 4;
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const max = Math.max(r, g, b);
      const spread = max - Math.min(r, g, b);
      /* Neutral near-black matte only — keep colored logo parts and shadows */
      if (max <= maxCutoff && spread <= spreadMax) {
        d[i + 3] = 0;
      }
    }
  }

  function drawLogoFrame() {
    if (!canvasCtx || !logoVideo || logoVideo.readyState < 2) return;
    const w = canvas.width;
    const h = canvas.height;
    canvasCtx.clearRect(0, 0, w, h);
    canvasCtx.drawImage(logoVideo, 0, 0, w, h);
    const imageData = canvasCtx.getImageData(0, 0, w, h);
    keyMatte(imageData);
    canvasCtx.putImageData(imageData, 0, 0);

    if (logoVideo.paused && !document.hidden) tryPlay();
  }

  function startCanvasLoop() {
    stopCanvasLoop();
    if (!canvas || !logoVideo) return;

    if (typeof logoVideo.requestVideoFrameCallback === 'function') {
      const step = () => {
        if (!isMobile() || !canvas) return;
        drawLogoFrame();
        videoFrameCb = logoVideo.requestVideoFrameCallback(step);
      };
      videoFrameCb = logoVideo.requestVideoFrameCallback(step);
    } else {
      const loop = () => {
        if (!isMobile() || !canvas) return;
        drawLogoFrame();
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    }
  }

  function setupMobileCanvas() {
    if (!isMobile() || !logoVideo) {
      removeMobileCanvas();
      return;
    }

    logoVideo.classList.add('logo-video--source');
    logoInner.classList.add('is-canvas-active');
    hideFallback();
    syncMobileLogoSource();

    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'logo-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      logoInner.appendChild(canvas);
      canvasCtx = canvas.getContext('2d', { alpha: true, willReadFrequently: true });
    }

    resizeCanvas();
    startCanvasLoop();
  }

  function recalcMobileStartTop() {
    if (!isHomeMobileHero() || !heroEl) return;
    const content = heroEl.querySelector('.hero-content');
    const w = window.innerWidth;
    const vh = window.innerHeight;
    const startScale = w <= 480 ? 0.7 : 0.8;
    const logoSize = logo3d.offsetWidth || (w <= 480 ? 340 : 400);
    const logoHalf = (logoSize * startScale) / 2;
    const gap = 28;

    if (content) {
      const heroDocTop = heroEl.getBoundingClientRect().top + window.scrollY;
      const contentBottomDoc = heroDocTop + content.offsetTop + content.offsetHeight;
      const logoCenterY = contentBottomDoc + gap + logoHalf;
      mobileStartTop = (logoCenterY / vh) * 100;
      mobileStartTop = Math.min(Math.max(mobileStartTop, 68), 88);
    } else {
      mobileStartTop = 80;
    }

    mobileStartOffsetY = ((mobileStartTop - 50) / 100) * vh;
    if (window.scrollY < 1) {
      smoothOffsetY = mobileStartOffsetY;
      smoothScale = startScale;
    }
  }

  function getHomeMobileScrollProgress() {
    if (!heroEl) return 1;
    const range = Math.max(heroEl.offsetHeight - window.innerHeight * 0.12, window.innerHeight * 0.72);
    return Math.min(scrollY / range, 1);
  }

  function getLogoConfig() {
    const w = window.innerWidth;
    if (w <= 480) return { startX: 50, endX: 50, startScale: 0.78, endScale: 0.68 };
    if (w <= 768) return { startX: 50, endX: 50, startScale: 0.88, endScale: 0.75 };
    if (w <= 1024) return { startX: 55, endX: 50, startScale: 0.78, endScale: 0.55 };
    return { startX: 75, endX: 50, startScale: 1, endScale: 0.7 };
  }

  function getBaseOpacity() {
    const w = window.innerWidth;
    if (isInnerPage) {
      if (w <= 768) return 0.5;
      if (w <= 1024) return 0.28;
      return 0.42;
    }
    if (w <= 1024) return 0.5;
    return 1;
  }

  function applyHomeMobileLogo(eased, w) {
    const startScale = w <= 480 ? 0.7 : 0.8;
    const endScale = w <= 480 ? 0.66 : 0.74;
    const targetOffsetY = mobileStartOffsetY * (1 - eased);
    const targetScale = startScale + (endScale - startScale) * eased;
    const follow = prefersReducedMotion ? 1 : 0.16;

    smoothOffsetY += (targetOffsetY - smoothOffsetY) * follow;
    smoothScale += (targetScale - smoothScale) * follow;

    logo3d.style.display = '';
    logo3d.style.visibility = 'visible';
    logo3d.style.left = '50%';
    logo3d.style.opacity = '1';
    logo3d.style.transform = 'translateX(-50%)';
    const smoothTop = 50 + (smoothOffsetY / window.innerHeight) * 100;
    logo3d.style.top = `${smoothTop}%`;
    logoInner.style.marginLeft = '0';
    logoInner.style.marginTop = '0';
    logoInner.style.opacity = '1';
    logoInner.style.transform = `translateY(-50%) scale(${smoothScale})`;
  }

  function updateLogo() {
    const mobile = isMobile();
    const w = window.innerWidth;

    if (isHomeMobileHero()) {
      const eased = easeOutCubic(getHomeMobileScrollProgress());
      applyHomeMobileLogo(eased, w);
      return;
    }

    logo3d.style.transform = '';

    const progress = Math.min(scrollY / (heroHeight() * 1.2), 1);
    const eased = easeInOutSine(progress);
    const { startX, endX, startScale, endScale } = getLogoConfig();
    const currentX = startX + (endX - startX) * eased;
    const currentScale = startScale + (endScale - startScale) * eased;
    const fade = getBaseOpacity() * (1 - eased * 0.2);

    logo3d.style.display = '';
    logo3d.style.visibility = 'visible';
    logo3d.style.top = '';

    logoInner.style.marginLeft = '0';
    logoInner.style.marginTop = '0';
    logoInner.style.transform = mobile
      ? `translateY(-50%) scale(${currentScale})`
      : `translate(-50%, -50%) scale(${currentScale})`;
    logoInner.style.opacity = mobile ? '1' : String(fade);
    logo3d.style.opacity = mobile ? '1' : String(fade);
    if (mobile) {
      logo3d.style.top = '50%';
      logo3d.style.left = '50%';
      logo3d.style.transform = 'translateX(-50%)';
    } else {
      logo3d.style.transform = '';
      logo3d.style.left = currentX + '%';
    }
  }

  ensureLogoVideo();
  setupMobileCanvas();
  recalcMobileStartTop();

  function onScroll() {
    scrollY = window.scrollY;
    updateLogo();
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  function onResize() {
    recalcMobileStartTop();
    setupMobileCanvas();
    resizeCanvas();
    updateLogo();
  }

  window.addEventListener('resize', onResize);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      recalcMobileStartTop();
      updateLogo();
    });
  }

  window.addEventListener('load', () => {
    recalcMobileStartTop();
    updateLogo();
  });

  requestAnimationFrame(() => {
    recalcMobileStartTop();
    updateLogo();
  });

  if (isHomeMobileHero() && !prefersReducedMotion) {
    function homeLogoTick() {
      if (isHomeMobileHero()) {
        const eased = easeOutCubic(getHomeMobileScrollProgress());
        applyHomeMobileLogo(eased, window.innerWidth);
      }
      requestAnimationFrame(homeLogoTick);
    }
    requestAnimationFrame(homeLogoTick);
  }
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

/* ============ SERVICES NAV DROPDOWN ============ */
const SERVICE_NAV_ITEMS = [
  { href: '/services/', key: 'nav.servicesAll' },
  { href: '/services/ai-chat-bots/', key: 'services.s1title' },
  { href: '/services/ai-voice-bot/', key: 'services.s2title' },
  { href: '/services/google-ai-promotion/', key: 'services.s3title' },
  { href: '/services/crm-implementation/', key: 'services.s4title' },
];

function initServicesNavDropdown() {
  const navLinks = document.getElementById('nav-links');
  if (!navLinks || navLinks.querySelector('.nav-services-dropdown')) return;

  const servicesLink = navLinks.querySelector(':scope > a[href="/services/"]');
  if (!servicesLink) return;

  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const dropdown = document.createElement('div');
  dropdown.className = 'nav-dropdown nav-services-dropdown';

  const row = document.createElement('div');
  row.className = 'nav-dropdown-row';

  const labelLink = document.createElement('a');
  labelLink.href = '/services/';
  labelLink.className = 'nav-dropdown-label';
  if (servicesLink.classList.contains('active') || path === '/services' || path.startsWith('/services/')) {
    labelLink.classList.add('active');
  }

  const label = document.createElement('span');
  label.setAttribute('data-i18n', 'nav.services');
  label.textContent = servicesLink.textContent;
  labelLink.append(label);

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'nav-dropdown-toggle';
  toggleBtn.setAttribute('aria-expanded', 'false');
  toggleBtn.setAttribute('aria-label', 'Toggle services menu');

  const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  chevron.setAttribute('class', 'nav-dropdown-chevron');
  chevron.setAttribute('viewBox', '0 0 24 24');
  chevron.setAttribute('aria-hidden', 'true');
  chevron.innerHTML = '<path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
  toggleBtn.append(chevron);

  row.append(labelLink, toggleBtn);

  const menu = document.createElement('div');
  menu.className = 'nav-dropdown-menu';
  menu.setAttribute('role', 'menu');

  SERVICE_NAV_ITEMS.forEach((item) => {
    const link = document.createElement('a');
    const itemPath = item.href.replace(/\/$/, '') || '/';
    link.href = item.href;
    link.setAttribute('role', 'menuitem');
    link.setAttribute('data-i18n', item.key);
    link.textContent = window.NW_I18N?.t(window.NW_I18N?.getLang() || 'en', item.key) || item.key;
    if (path === itemPath || (itemPath !== '/services' && path.startsWith(itemPath))) {
      link.classList.add('active');
    }
    menu.append(link);
  });

  dropdown.append(row, menu);
  servicesLink.replaceWith(dropdown);

  toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isOpen = dropdown.classList.toggle('is-open');
    toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.classList.contains('is-open')) return;
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('is-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });

  navLinks.addEventListener('click', (e) => {
    if (e.target.closest('.nav-dropdown-menu a')) {
      dropdown.classList.remove('is-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ============ THEME & LANGUAGE (nav) ============ */
function initNavPreferences() {
  const root = document.documentElement;
  const langDetails = document.getElementById('lang-details');
  const langMenu = document.getElementById('lang-menu');

  root.setAttribute('data-theme', 'dark');
  localStorage.removeItem('nw-theme');

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

function initNav() {
  initServicesNavDropdown();
  initNavPreferences();

  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  navToggle?.addEventListener('click', () => {
    navLinks?.classList.toggle('active');
    const openDropdown = navLinks?.querySelector('.nav-services-dropdown.is-open');
    if (openDropdown) {
      openDropdown.classList.remove('is-open');
      openDropdown.querySelector('.nav-dropdown-toggle')?.setAttribute('aria-expanded', 'false');
    }
  });
  navLinks?.addEventListener('click', (e) => {
    if (e.target.closest('a')) navLinks.classList.remove('active');
  });

  window.NW_I18N?.applyLang(window.NW_I18N?.getLang() || localStorage.getItem('nw-lang') || 'en');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNav);
} else {
  initNav();
}

/* ============ NAVBAR SCROLL ============ */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
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
  '.case-card-link, .academy-card, .process-step, .stat-item, .industry-card, .mini-card, .positioning-grid .mini-card, ' +
  '.contact-team-card'
).forEach((el) => {
  el.classList.add('fade-in');
  observer.observe(el);
});

/* ============ FORM SUBMIT (Web3Forms) ============ */
document.querySelectorAll('.contact-form').forEach((form) => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    if (!btn || btn.disabled) return;

    const lang = window.NW_I18N?.getLang() || 'en';
    const defaultLabel = window.NW_I18N?.t(lang, 'form.submit') || btn.textContent;
    const sendingLabel = window.NW_I18N?.t(lang, 'form.sending') || 'Sending...';

    btn.disabled = true;
    btn.textContent = sendingLabel;
    btn.style.opacity = '0.7';

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      const data = await response.json();

      if (data.success) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'form_submit_success',
          form_name: 'contact',
          form_location: /^\/contact\/?$/.test(window.location.pathname) ? 'contact_page' : 'homepage',
          form_language: lang,
        });
        btn.textContent = window.NW_I18N?.t(lang, 'form.success') || 'Thanks — we\'ll be in touch!';
        form.reset();
        setTimeout(() => {
          btn.textContent = defaultLabel;
          btn.disabled = false;
          btn.style.opacity = '';
        }, 4000);
      } else {
        throw new Error(data.message || 'Submit failed');
      }
    } catch {
      btn.textContent = window.NW_I18N?.t(lang, 'form.error') || 'Could not send — please try again or email us.';
      btn.disabled = false;
      btn.style.opacity = '';
      setTimeout(() => {
        btn.textContent = defaultLabel;
      }, 5000);
    }
  });
});

/* ============ CRYSTAL CURSOR (desktop / fine pointer only) ============ */
(function initCrystalCursor() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  document.documentElement.classList.add('nw-custom-cursor');

  const cursorSvgDefs = (suffix) => `
    <defs>
      <linearGradient id="nw-crystal-fill-${suffix}" x1="3" y1="2" x2="18" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#f5f3ff"/>
        <stop offset="28%" stop-color="#ddd6fe"/>
        <stop offset="58%" stop-color="#c084fc"/>
        <stop offset="100%" stop-color="#7c3aed"/>
      </linearGradient>
      <linearGradient id="nw-crystal-shine-${suffix}" x1="3" y1="2" x2="10" y2="14" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="rgba(255,255,255,0.85)"/>
        <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
      </linearGradient>
      <linearGradient id="nw-crystal-edge-${suffix}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,0.9)"/>
        <stop offset="100%" stop-color="rgba(192,132,252,0.45)"/>
      </linearGradient>
    </defs>`;

  const arrowPath = 'M2.5 1.5 L2.5 18.5 L7.2 14.2 L10.2 20.8 L12.4 19.7 L9.6 13.2 L16.5 13.2 Z';
  const handPath = 'M8.2 3.2c0-1.2 1.6-1.2 1.6 0v5.1h1.1V4.1c0-1.2 1.6-1.2 1.6 0v4.2h1.1V5.6c0-1.2 1.5-1.2 1.5 0v6.8c0 3.4-2.2 6.2-5.8 7.1l-1.1 2.4c-0.5 1.1-2.2 0.6-2.2-0.7v-2.8C3.3 20.8 1.5 18.3 1.5 15.2V8.4c0-1.2 1.5-1.2 1.5 0v2.5h1.1V3.2z';

  const cursor = document.createElement('div');
  cursor.className = 'nw-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = `
    <div class="nw-cursor-arrow">
      <svg class="nw-cursor-svg" viewBox="0 0 20 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        ${cursorSvgDefs('arrow')}
        <path d="${arrowPath}" fill="rgba(124,58,237,0.28)"/>
        <path d="${arrowPath}" fill="url(#nw-crystal-fill-arrow)" stroke="url(#nw-crystal-edge-arrow)" stroke-width="0.85" stroke-linejoin="round"/>
        <path d="M2.5 1.5 L2.5 11.5 L7.5 10.5 L9.5 13.2 Z" fill="url(#nw-crystal-shine-arrow)" opacity="0.55"/>
      </svg>
    </div>
    <div class="nw-cursor-hand">
      <svg class="nw-cursor-svg" viewBox="0 0 22 26" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        ${cursorSvgDefs('hand')}
        <path d="${handPath}" fill="rgba(124,58,237,0.28)"/>
        <path d="${handPath}" fill="url(#nw-crystal-fill-hand)" stroke="url(#nw-crystal-edge-hand)" stroke-width="0.85" stroke-linejoin="round"/>
      </svg>
    </div>`;
  document.body.appendChild(cursor);

  const interactiveSelector =
    'a, button, summary, input, textarea, select, label, [role="button"], [role="menuitem"], .btn, .faq-question, .nav-toggle, .lang-option';

  let visible = false;

  function show() {
    if (visible) return;
    visible = true;
    cursor.classList.add('is-visible');
  }

  function hide() {
    visible = false;
    cursor.classList.remove('is-visible', 'is-hover', 'is-active');
  }

  document.addEventListener('mousemove', (e) => {
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top = `${e.clientY}px`;
    show();
  }, { passive: true });

  document.addEventListener('mouseover', (e) => {
    cursor.classList.toggle('is-hover', !!e.target.closest(interactiveSelector));
  });

  document.addEventListener('mousedown', () => cursor.classList.add('is-active'));
  document.addEventListener('mouseup', () => cursor.classList.remove('is-active'));
  document.addEventListener('mouseleave', hide);
})();
