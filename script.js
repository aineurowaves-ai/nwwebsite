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
  let canvas = null;
  let canvasCtx = null;
  let rafId = 0;
  let videoFrameCb = null;

  const LOGO_VIDEO_DARK = 'assets/logo-3d.webm';
  const LOGO_VIDEO_LIGHT = 'assets/logo-3d-light.webm';

  const heroHeight = () => window.innerHeight;
  const isMobile = () => window.innerWidth <= 768;
  const isHomeMobileHero = () => !isInnerPage && isMobile();

  function easeInOutSine(x) { return -(Math.cos(Math.PI * x) - 1) / 2; }

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
    const startScale = w <= 480 ? 0.7 : 0.8;
    const logoSize = logo3d.offsetWidth || (w <= 480 ? 340 : 400);
    const logoHalf = (logoSize * startScale) / 2;
    const gap = 28;
    if (content) {
      const bottom = content.getBoundingClientRect().bottom;
      mobileStartTop = ((bottom + gap + logoHalf) / window.innerHeight) * 100;
      mobileStartTop = Math.min(Math.max(mobileStartTop, 68), 88);
    } else {
      mobileStartTop = 80;
    }
  }

  function getHomeMobileScrollProgress() {
    if (!heroEl) return 1;
    const range = Math.max(heroEl.offsetHeight - window.innerHeight * 0.15, window.innerHeight * 0.55);
    return Math.min(scrollY / range, 1);
  }

  function getLogoConfig() {
    const w = window.innerWidth;
    if (w <= 480) return { startX: 50, endX: 50, startScale: 0.78, endScale: 0.68 };
    if (w <= 768) return { startX: 50, endX: 50.5, startScale: 0.88, endScale: 0.75 };
    if (w <= 1024) return { startX: 55, endX: 50.5, startScale: 0.78, endScale: 0.55 };
    return { startX: 75, endX: 50.5, startScale: 1, endScale: 0.7 };
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

  function updateLogo() {
    const mobile = isMobile();
    const w = window.innerWidth;

    if (isHomeMobileHero()) {
      if (scrollY < 2) recalcMobileStartTop();
      const eased = easeInOutSine(getHomeMobileScrollProgress());
      const startScale = w <= 480 ? 0.7 : 0.8;
      const endScale = w <= 480 ? 0.66 : 0.74;
      const currentTop = mobileStartTop + (50 - mobileStartTop) * eased;
      const currentScale = startScale + (endScale - startScale) * eased;

      logo3d.style.display = '';
      logo3d.style.visibility = 'visible';
      logo3d.style.top = currentTop + '%';
      logo3d.style.left = '50%';
      logo3d.style.opacity = '1';
      logoInner.style.opacity = '1';
      logoInner.style.transform = `translate(-50%, -50%) scale(${currentScale})`;
      return;
    }

    const progress = Math.min(scrollY / (heroHeight() * 1.2), 1);
    const eased = easeInOutSine(progress);
    const { startX, endX, startScale, endScale } = getLogoConfig();
    const currentX = startX + (endX - startX) * eased;
    const currentScale = startScale + (endScale - startScale) * eased;
    const fade = getBaseOpacity() * (1 - eased * 0.2);

    logo3d.style.display = '';
    logo3d.style.visibility = 'visible';
    logo3d.style.top = '';

    logoInner.style.transform = `translate(-50%, -50%) scale(${currentScale})`;
    logoInner.style.opacity = mobile ? '1' : String(fade);
    logo3d.style.opacity = mobile ? '1' : String(fade);
    if (mobile) {
      logo3d.style.top = '50%';
      logo3d.style.left = '50%';
    } else {
      logo3d.style.left = currentX + '%';
    }
  }

  ensureLogoVideo();
  setupMobileCanvas();
  recalcMobileStartTop();

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    requestAnimationFrame(updateLogo);
  }, { passive: true });

  window.addEventListener('resize', () => {
    recalcMobileStartTop();
    setupMobileCanvas();
    resizeCanvas();
    requestAnimationFrame(updateLogo);
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      recalcMobileStartTop();
      requestAnimationFrame(updateLogo);
    });
  }

  window.addEventListener('load', () => {
    recalcMobileStartTop();
    requestAnimationFrame(updateLogo);
  });

  requestAnimationFrame(() => {
    recalcMobileStartTop();
    updateLogo();
  });
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
