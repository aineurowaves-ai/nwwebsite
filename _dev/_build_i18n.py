import json, re, time
from bs4 import BeautifulSoup

# Import extractors from previous version (inline)
def extract_i18n(html):
    soup = BeautifulSoup(html, "html.parser")
    out = {}
    for el in soup.select("[data-i18n]"):
        key = el.get("data-i18n")
        if key not in out:
            out[key] = el.decode_contents().strip()
    for el in soup.select("[data-i18n-placeholder]"):
        out[el.get("data-i18n-placeholder")] = el.get("placeholder", "")
    return out

def extract_v3_map(html):
    soup = BeautifulSoup(html, "html.parser")
    m = {}
    nav = soup.select_one(".nav-links")
    if nav:
        for k, a in zip(["nav.services", "nav.audit", "nav.cases", "nav.insights", "nav.academy", "nav.contact"], nav.select("a")):
            m[k] = a.get_text(strip=True)
    cta = soup.select_one(".nav-cta")
    if cta: m["nav.cta"] = cta.decode_contents().strip()
    hero = soup.select_one(".hero")
    if hero:
        if hero.select_one(".hero-tag"): m["hero.tag"] = hero.select_one(".hero-tag").get_text(strip=True)
        title = hero.select_one(".hero-title")
        if title:
            spans = [s for s in title.children if getattr(s, "name", None) == "span"]
            if len(spans) >= 2:
                m["hero.titleAccent"] = spans[0].get_text(strip=True)
                m["hero.titleRest"] = spans[1].get_text(strip=True)
        if hero.select_one(".hero-desc"): m["hero.desc"] = hero.select_one(".hero-desc").get_text(" ", strip=True)
        for k, b in zip(["hero.btn1", "hero.btn2"], hero.select(".hero-buttons a")): m[k] = b.get_text(strip=True)
    if soup.find("title"): m["meta.title"] = soup.find("title").get_text(strip=True)
    md = soup.find("meta", attrs={"name": "description"})
    if md: m["meta.description"] = md.get("content", "")
    pos = soup.find("section", id="positioning")
    if pos:
        if pos.select_one(".section-tag"): m["positioning.tag"] = pos.select_one(".section-tag").get_text(strip=True)
        t = pos.select_one(".section-title")
        if t:
            m["positioning.title"] = "".join(str(x).strip() for x in t.contents if isinstance(x, str)).strip() or t.get_text(strip=True).split("\n")[0]
            g = t.select_one(".gradient-text")
            if g: m["positioning.titleAccent"] = g.get_text(strip=True)
        ps = pos.select(".col-text p")
        if len(ps) >= 2:
            m["positioning.p1"] = ps[0].get_text(" ", strip=True)
            m["positioning.p2"] = ps[1].decode_contents().strip()
        for i, card in enumerate(pos.select(".mini-card"), 1):
            m[f"positioning.card{i}h"] = card.select_one("h4").get_text(strip=True)
            m[f"positioning.card{i}p"] = card.select_one("p").get_text(" ", strip=True)
    quote = soup.select_one(".quote-block")
    if quote:
        ps = quote.select("p")
        m["quote.p1"] = ps[0].get_text(" ", strip=True)
        m["quote.p2"] = ps[1].decode_contents().strip()
        m["quote.footer"] = quote.select_one("footer span").get_text(strip=True)
    audit = soup.find("section", id="audit")
    if audit:
        m["audit.title"] = audit.select_one(".section-title").get_text(strip=True)
        m["audit.desc"] = audit.select_one(".section-desc").get_text(" ", strip=True)
        m["audit.label"] = audit.select_one(".audit-label").get_text(strip=True)
        m["audit.amount"] = audit.select_one(".audit-amount").get_text(strip=True)
        m["audit.btn"] = audit.select_one(".btn").get_text(strip=True)
    ind = soup.find("section", id="industries")
    if ind:
        m["industries.subtitle"] = ind.select_one(".section-subtitle").get_text(strip=True)
        m["industries.title"] = ind.select_one(".section-title").get_text(strip=True)
        for i, card in enumerate(ind.select(".industry-card"), 1):
            m[f"industries.i{i}h"] = card.select_one("h4").get_text(strip=True)
            m[f"industries.i{i}p"] = card.select_one("p").get_text(strip=True)
    srv = soup.find("section", id="services")
    if srv:
        m["services.title"] = srv.select_one(".section-title").get_text(strip=True)
        m["services.desc"] = srv.select_one(".section-desc").get_text(" ", strip=True)
        for si, card in enumerate(srv.select(".service-card"), 1):
            m[f"services.s{si}badge"] = card.select_one(".service-badge").get_text(strip=True)
            h3 = card.select_one("h3")
            if h3 and si == 3: m["services.s3title"] = h3.get_text(strip=True)
            m[f"services.s{si}desc"] = card.select_one(".service-body > p").get_text(" ", strip=True)
            for li, item in enumerate(card.select("li"), 1): m[f"services.s{si}l{li}"] = item.get_text(strip=True)
            m[f"services.s{si}price"] = card.select_one(".service-price").get_text(strip=True)
            m[f"services.s{si}btn"] = card.select_one(".service-footer .btn").get_text(strip=True)
    for sec in soup.select(".section"):
        tit = sec.select_one(".section-title")
        if tit and "болю" in tit.get_text():
            m["solutions.title"] = tit.get_text(strip=True)
            for i, card in enumerate(sec.select(".solution-card"), 1):
                m[f"solutions.s{i}h"] = card.select_one("h4").get_text(strip=True)
                m[f"solutions.s{i}p"] = card.select_one("p").get_text(strip=True)
    stats = soup.select_one(".section-stats")
    if stats:
        for lab, item in zip(["stats.l1", "stats.l2", "stats.l3", "stats.l4"], stats.select(".stat-item")):
            m[lab] = item.select_one(".stat-label").get_text(strip=True)
        nums = stats.select(".stat-number")
        if len(nums) > 1: m["stats.n2"] = nums[1].get_text(strip=True)
    proc = soup.find("section", id="process")
    if proc:
        m["process.title"] = proc.select_one(".section-title").get_text(strip=True)
        m["process.desc"] = proc.select_one(".section-desc").get_text(" ", strip=True)
        for i, step in enumerate(proc.select(".process-step"), 1):
            if i > 1 and step.select_one("h3"): m[f"process.s{i}h"] = step.select_one("h3").get_text(strip=True)
            m[f"process.s{i}p"] = step.select_one("p").get_text(" ", strip=True)
    pain_grid = soup.select_one(".pain-grid")
    if pain_grid:
        sec = pain_grid.find_parent("section")
        m["pain.tag"] = sec.select_one(".section-tag").get_text(strip=True)
        m["pain.title"] = sec.select_one(".section-title").get_text(strip=True)
        for i, card in enumerate(sec.select(".pain-card"), 1):
            m[f"pain.c{i}h"] = card.select_one("h4").get_text(strip=True)
            m[f"pain.c{i}p"] = card.select_one("p").get_text(strip=True)
            m[f"pain.c{i}s"] = card.select_one(".pain-solution").decode_contents().strip()
        vis = sec.select_one(".pain-visual")
        hs = vis.select("h4")
        m["pain.beforeTitle"], m["pain.afterTitle"] = hs[0].get_text(strip=True), hs[1].get_text(strip=True)
        for k, t in zip(["pain.b1","pain.b2","pain.b3","pain.b4","pain.a1","pain.a2","pain.a3","pain.a4"], vis.select(".pain-visual-text")):
            m[k] = t.get_text(strip=True)
    for sec in soup.select(".section"):
        tag = sec.select_one(".section-tag")
        if tag and "Сценарії" in tag.get_text():
            m["usecases.tag"] = tag.get_text(strip=True)
            m["usecases.title"] = sec.select_one(".section-title").get_text(strip=True)
            for i, card in enumerate(sec.select(".usecase-card"), 1):
                m[f"usecases.u{i}h"] = card.select_one("h4").get_text(strip=True)
                for li, item in enumerate(card.select("li"), 1): m[f"usecases.u{i}l{li}"] = item.get_text(strip=True)
    for sec in soup.select(".section"):
        tag = sec.select_one(".section-tag")
        if tag and "Інтеграції" in tag.get_text():
            m["integrations.tag"] = tag.get_text(strip=True)
            m["integrations.title"] = sec.select_one(".section-title").get_text(strip=True)
            m["integrations.desc"] = sec.select_one(".section-desc").get_text(" ", strip=True)
            for i, card in enumerate(sec.select(".integration-card"), 1):
                m[f"integrations.i{i}h"] = card.select_one("h4").get_text(strip=True)
                m[f"integrations.i{i}p"] = card.select_one("p").get_text(strip=True)
            btn = sec.select_one(".center-cta .btn")
            if btn: m["integrations.cta"] = btn.get_text(strip=True)
    cases = soup.find("section", id="cases")
    if cases:
        m["cases.tag"] = cases.select_one(".section-tag").get_text(strip=True)
        m["cases.title"] = cases.select_one(".section-title").get_text(strip=True)
        m["cases.desc"] = cases.select_one(".section-desc").get_text(" ", strip=True)
        for i, card in enumerate(cases.select(".case-card"), 1):
            m[f"cases.c{i}p"] = card.select_one(".case-body p").get_text(" ", strip=True)
        if cases.select_one(".cases-note"): m["cases.note"] = cases.select_one(".cases-note").get_text(strip=True)
        m["cases.cta"] = cases.select_one(".center-cta .btn").get_text(strip=True)
    about = soup.find("section", id="about")
    if about:
        m["about.tag"] = about.select_one(".section-tag").get_text(strip=True)
        m["about.subtitle"] = about.select_one(".section-subtitle").get_text(strip=True)
        m["about.title"] = about.select_one(".section-title").get_text(strip=True)
        ps = about.select(".about-content p")
        m["about.p1"] = ps[0].decode_contents().strip()
        m["about.p2"] = ps[1].get_text(" ", strip=True)
        for k, b in zip(["about.btn1", "about.btn2"], about.select(".about-buttons a")): m[k] = b.get_text(strip=True)
    academy = soup.find("section", id="academy")
    if academy:
        m["academy.title"] = academy.select_one(".section-title").get_text(strip=True)
        m["academy.desc"] = academy.select_one(".section-desc").get_text(" ", strip=True)
        for i, card in enumerate(academy.select(".academy-card"), 1):
            m["academy.badge"] = card.select_one(".academy-badge").get_text(strip=True)
            m[f"academy.c{i}h"] = card.select_one("h4").get_text(strip=True)
            m[f"academy.c{i}p"] = card.select_one("p").get_text(strip=True)
        meta = academy.select(".academy-meta div")
        if len(meta) >= 2:
            m["academy.meta1"] = meta[0].decode_contents().strip()
            m["academy.meta2"] = meta[1].decode_contents().strip()
    faq = soup.find("section", id="faq")
    if faq:
        m["faq.title"] = faq.select_one(".section-title").get_text(strip=True)
        m["faq.desc"] = faq.select_one(".section-desc").get_text(" ", strip=True)
        m["faq.btn"] = faq.select_one(".faq-side .btn").get_text(strip=True)
        for i, item in enumerate(faq.select(".faq-item"), 1):
            m[f"faq.q{i}"] = item.select_one(".faq-question").get_text(strip=True).rstrip("+").strip()
            m[f"faq.a{i}"] = item.select_one(".faq-answer p").get_text(" ", strip=True)
    contact = soup.find("section", id="contact")
    if contact:
        m["contact.title"] = contact.select_one(".section-title").get_text(strip=True)
        m["contact.desc"] = contact.select_one(".section-desc").get_text(" ", strip=True)
        form = contact.select_one("#contact-form")
        m["form.name"] = form.select('[name="name"]')[0].get("placeholder", "")
        m["form.phone"] = form.select('[name="phone"]')[0].get("placeholder", "")
        m["form.company"] = form.select('[name="company"]')[0].get("placeholder", "")
        m["form.message"] = form.select('[name="message"]')[0].get("placeholder", "")
        m["form.consent"] = form.select_one(".form-consent span").get_text(strip=True)
        m["form.submit"] = form.select_one('button[type="submit"]').decode_contents().strip()
    m["form.success"] = "Запит отримано!"
    foot = soup.select_one(".footer")
    if foot:
        m["footer.desc"] = foot.select_one(".footer-desc").decode_contents().strip()
        m["footer.services"] = foot.select(".footer-links h5")[0].get_text(strip=True)
        for i, a in enumerate(foot.select(".footer-links")[0].select("a"), 1): m[f"footer.l{i}"] = a.get_text(strip=True)
        m["footer.contacts"] = foot.select(".footer-links h5")[1].get_text(strip=True)
        m["footer.privacy"] = foot.select_one(".footer-bottom a").get_text(strip=True)
    return m

def load_cache(path):
    try:
        return json.load(open(path, encoding="utf-8"))
    except FileNotFoundError:
        return None

def translate_dict(src, target, cache_path):
    from deep_translator import GoogleTranslator
    cache = load_cache(cache_path) or {}
    tr = GoogleTranslator(source="en", target=target)
    out = dict(cache)
    for i, (k, v) in enumerate(src.items()):
        if k in out:
            continue
        if not v:
            out[k] = v
            continue
        try:
            if "<" in v:
                parts = re.split(r"(<[^>]+>)", v)
                out[k] = "".join(p if p.startswith("<") else (tr.translate(p) if p.strip() else p) for p in parts)
            else:
                out[k] = tr.translate(v)
        except Exception:
            out[k] = v
        cache[k] = out[k]
        if i % 15 == 0:
            time.sleep(0.2)
            json.dump(cache, open(cache_path, "w", encoding="utf-8"), ensure_ascii=False)
    json.dump(cache, open(cache_path, "w", encoding="utf-8"), ensure_ascii=False)
    return out

en = extract_i18n(open("../index.html", encoding="utf-8").read())
uk_map = extract_v3_map(open("../_backup-versions/v3/index.html", encoding="utf-8").read())
uk = {**en, **uk_map}
de = load_cache("_cache_de.json") or translate_dict(en, "de", "_cache_de.json")
print("FR...")
fr = load_cache("_cache_fr.json") or translate_dict(en, "fr", "_cache_fr.json")
print("ES...")
es = load_cache("_cache_es.json") or translate_dict(en, "es", "_cache_es.json")

META = {
    "en": {"title": "Neurowaves — AI business process automation for B2B", "description": "Neurowaves builds an AI sales loop: agents, websites, CRM/ERP, SEO, follow-up, analytics. In 7–10 days we find leaks and fix the first losses without extra chaos."},
    "uk": {"title": uk_map.get("meta.title", ""), "description": uk_map.get("meta.description", "")},
    "de": {"title": "Neurowaves — KI-Automatisierung für B2B", "description": "Neurowaves baut einen KI-Vertriebskreislauf: Agenten, Websites, CRM/ERP, SEO, Follow-up, Analytics. In 7–10 Tagen finden wir Lecks und schließen erste Verluste."},
    "fr": {"title": "Neurowaves — Automatisation IA B2B", "description": "Neurowaves construit une boucle commerciale IA : agents, sites, CRM/ERP, SEO, relances, analytics. En 7–10 jours, nous trouvons les fuites et corrigeons les premières pertes."},
    "es": {"title": "Neurowaves — Automatización IA para B2B", "description": "Neurowaves construye un circuito de ventas con IA: agentes, sitios, CRM/ERP, SEO, seguimiento, analítica. En 7–10 días encontramos fugas y cerramos las primeras pérdidas."},
}
STR = {"en": en, "uk": uk, "de": de, "fr": fr, "es": es}
open("../i18n.js", "w", encoding="utf-8").write(f"""/* Neurowaves i18n */
(function () {{
  const LANGS = ['en', 'de', 'fr', 'es', 'uk'];
  const LANG_LABELS = {{ en: 'EN', de: 'DE', fr: 'FR', es: 'ES', uk: 'UK' }};
  const META = {json.dumps(META, ensure_ascii=False)};
  const STR = {json.dumps(STR, ensure_ascii=False)};
  function t(lang, key) {{ return (STR[lang] && STR[lang][key]) || STR.en[key] || ''; }}
  function applyLang(lang) {{
    if (!LANGS.includes(lang)) lang = 'en';
    localStorage.setItem('nw-lang', lang);
    document.documentElement.lang = lang === 'uk' ? 'uk' : lang;
    const meta = META[lang] || META.en;
    document.title = meta.title;
    const md = document.getElementById('meta-description');
    if (md) md.setAttribute('content', meta.description);
    document.querySelectorAll('[data-i18n]').forEach((el) => {{
      const val = t(lang, el.getAttribute('data-i18n'));
      if (!val) return;
      if (/<[a-z]/i.test(val)) el.innerHTML = val; else el.textContent = val;
    }});
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {{
      const val = t(lang, el.getAttribute('data-i18n-placeholder'));
      if (val) el.placeholder = val;
    }});
    const cur = document.getElementById('lang-current');
    if (cur) cur.textContent = LANG_LABELS[lang];
    document.querySelectorAll('.lang-option').forEach((btn) => btn.classList.toggle('active', btn.dataset.lang === lang));
    window.dispatchEvent(new CustomEvent('nw:lang', {{ detail: {{ lang }} }}));
  }}
  window.NW_I18N = {{ LANGS, LANG_LABELS, META, STR, applyLang, t, getLang: () => localStorage.getItem('nw-lang') || 'en' }};
  document.addEventListener('DOMContentLoaded', () => applyLang(localStorage.getItem('nw-lang') || 'en'));
}})();
""")
print("done", len(en))
