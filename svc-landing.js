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

  function initSvcPricingCtas() {
    const form = document.querySelector('#svc-contact .contact-form');
    if (!form) return;

    const subjectEl = document.getElementById('svc-contact-subject');
    const intentEl = document.getElementById('svc-contact-intent');
    const serviceEl = document.getElementById('svc-contact-service');
    const messageEl = form.querySelector('textarea[name="message"]');

    const serviceLabel = {
      ads: 'Google Ads',
      seo: 'SEO',
    };

    document.querySelectorAll('[data-svc-pricing-cta]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const intent = btn.getAttribute('data-intent') || 'contact';
        const service = btn.getAttribute('data-service') || '';
        const label = serviceLabel[service] || service || 'Google Ads & SEO';
        const lang = window.NW_I18N?.getLang() || 'en';
        const msgKey = intent === 'buy'
          ? (service === 'seo' ? 'services.s3priceBuyMsgSeo' : 'services.s3priceBuyMsgAds')
          : (service === 'seo' ? 'services.s3priceContactMsgSeo' : 'services.s3priceContactMsgAds');
        const fallbackMsg = intent === 'buy'
          ? `I want to get started with ${label}.`
          : `I'd like to discuss ${label} for my business.`;
        const message = window.NW_I18N?.t(lang, msgKey) || fallbackMsg;

        if (subjectEl) {
          subjectEl.value = intent === 'buy'
            ? `Buy request — ${label}`
            : `Contact request — ${label}`;
        }
        if (intentEl) intentEl.value = intent;
        if (serviceEl) serviceEl.value = service;
        if (messageEl && !messageEl.value.trim()) messageEl.value = message;

        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: intent === 'buy' ? 'pricing_buy_click' : 'pricing_contact_click',
          pricing_intent: intent,
          pricing_service: service,
          pricing_service_label: label,
          page_path: window.location.pathname,
          form_language: lang,
        });
      });
    });
  }

  function boot() {
    if (!document.body.classList.contains('svc-landing-page')) return;
    initSvcStickyCta();
    initSvcCasesCarousel();
    initSvcPricingCtas();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
