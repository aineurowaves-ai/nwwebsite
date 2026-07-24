/* Service landing helpers — sticky CTA + cases carousel */
(function () {
  function initSvcStickyCta() {
    const sticky = document.getElementById('svc-sticky-cta');
    const contact = document.getElementById('svc-contact');
    if (!sticky || !contact) return;
    const showSticky = () => {
      const rect = contact.getBoundingClientRect();
      const pastHero = window.scrollY > 400;
      const beforeContact = rect.top > window.innerHeight * 0.6;
      sticky.classList.toggle('is-visible', pastHero && beforeContact);
      sticky.setAttribute('aria-hidden', pastHero && beforeContact ? 'false' : 'true');
    };
    showSticky();
    window.addEventListener('scroll', showSticky, { passive: true });
  }

  function initSvcCasesCarousel() {
    const track = document.getElementById('svc-cases-carousel-track');
    const viewport = document.querySelector('[data-svc-cases-viewport]');
    if (!track || !viewport) return;

    const prevBtn = document.querySelector('[data-svc-cases-prev]');
    const nextBtn = document.querySelector('[data-svc-cases-next]');
    const cases = window.NW_CASES || [];

    const render = () => {
      const lang = window.NW_I18N?.getLang() || 'en';
      track.innerHTML = cases.map((item) => {
        const badge = window.NW_I18N?.t(lang, `cases.${item.id}badge`) || '';
        const title = window.NW_I18N?.t(lang, `cases.${item.id}title`) || item.slug;
        const desc = window.NW_I18N?.t(lang, `cases.${item.id}p`) || '';
        return `<a href="/cases/${item.slug}/" class="case-card-link svc-cases-carousel-card">
          <article class="case-card glass">
            <div class="case-img case-img--${item.img}" aria-hidden="true"></div>
            <div class="case-body">
              <div class="case-badge">${badge}</div>
              <h4>${title}</h4>
              <p>${desc}</p>
            </div>
          </article>
        </a>`;
      }).join('');
      updateButtons();
    };

    const scrollStep = () => {
      const card = track.querySelector('.svc-cases-carousel-card');
      if (!card) return viewport.clientWidth * 0.8;
      const style = getComputedStyle(track);
      const gap = parseFloat(style.columnGap || style.gap || '16') || 16;
      return card.getBoundingClientRect().width + gap;
    };

    const updateButtons = () => {
      const max = viewport.scrollWidth - viewport.clientWidth - 4;
      const left = viewport.scrollLeft;
      if (prevBtn) prevBtn.disabled = left <= 4;
      if (nextBtn) nextBtn.disabled = left >= max;
    };

    prevBtn?.addEventListener('click', () => {
      viewport.scrollBy({ left: -scrollStep(), behavior: 'smooth' });
    });
    nextBtn?.addEventListener('click', () => {
      viewport.scrollBy({ left: scrollStep(), behavior: 'smooth' });
    });
    viewport.addEventListener('scroll', updateButtons, { passive: true });
    window.addEventListener('resize', updateButtons);
    window.addEventListener('nw:lang', render);
    render();
  }

  function boot() {
    if (!document.body.classList.contains('svc-landing-page')) return;
    initSvcStickyCta();
    initSvcCasesCarousel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
