import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    const response = await fetch(
      'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=US&allowCountries=US'
    );
    const data = await response.json();

    const elements = data?.data?.Catalog?.searchStore?.elements || [];
    const nowFree = [];
    const nextFree = [];

    for (const game of elements) {
      const promos = game?.promotions;
      const currentOffers = promos?.promotionalOffers || [];
      const upcomingOffers = promos?.upcomingPromotionalOffers || [];

      const normalized = normalizeGame(game);

      if (currentOffers.length > 0) {
        const p = currentOffers[0]?.promotionalOffers?.[0];
        if (p) {
          nowFree.push({
            ...normalized,
            startDate: p.startDate,
            endDate: p.endDate,
            type: 'current',
          });
        }
      } else if (upcomingOffers.length > 0) {
        const p = upcomingOffers[0]?.promotionalOffers?.[0];
        if (p) {
          nextFree.push({
            ...normalized,
            startDate: p.startDate,
            endDate: p.endDate,
            type: 'upcoming',
          });
        }
      }
    }

    res.status(200).json({ current: nowFree, upcoming: nextFree });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

function normalizeGame(game) {
  const title = game?.title ?? '';
  const description = game?.description ?? '';
  const image = game?.keyImages?.[0]?.url || '';

  // Slug kaynakları
  const urlSlug = game?.urlSlug || '';
  const productSlugRaw = game?.productSlug || '';
  const mappings = Array.isArray(game?.catalogNs?.mappings)
    ? game.catalogNs.mappings
    : [];

  // mapping’lerden pageSlug bul (tercihen productHome)
  const mapping = mappings.find(m => m.pageType === 'productHome') || mappings[0] || {};
  const pageSlug = mapping.pageSlug || '';

  const { storeUrl, searchUrl } = buildUrls({
    title,
    productSlugRaw,
    pageSlug,
    urlSlug,
  });

  return { title, description, image, urlSlug, storeUrl, searchUrl };
}

function buildUrls({ title, productSlugRaw, pageSlug, urlSlug }) {
  const base = 'https://store.epicgames.com';
  const locale = 'en-US';

  const clean = (s) =>
    (s || '')
      .trim()
      .replace(/^\/+/, '')          // baştaki / temizle
      .replace(/\?.*$/, '')         // query string at
      .replace(/\/home$/, '');      // /home son ekini at

  const hasLocale = (s) => /^[a-z]{2}-[A-Z]{2}\//.test(s || '');
  const isFullUrl = (s) => /^https?:\/\//i.test(s || '');

  // Önce productSlug
  let p = clean(productSlugRaw);
  // Bazı productSlug'lar komple URL gelebilir:
  if (isFullUrl(p)) {
    try {
      const u = new URL(p);
      p = clean(u.pathname);
      if (hasLocale(p)) return { storeUrl: `${base}/${p}`, searchUrl: makeSearchUrl(base, locale, title) };
    } catch (_) {}
  }

  if (p) {
    if (hasLocale(p)) {
      return { storeUrl: `${base}/${p}`, searchUrl: makeSearchUrl(base, locale, title) };
    }
    if (p.startsWith('p/') || p.startsWith('bundles/')) {
      return { storeUrl: `${base}/${locale}/${p}`, searchUrl: makeSearchUrl(base, locale, title) };
    }
    return { storeUrl: `${base}/${locale}/p/${p}`, searchUrl: makeSearchUrl(base, locale, title) };
  }

  // Sonra pageSlug
  const page = clean(pageSlug);
  if (page) {
    if (hasLocale(page)) {
      return { storeUrl: `${base}/${page}`, searchUrl: makeSearchUrl(base, locale, title) };
    }
    return { storeUrl: `${base}/${locale}/p/${page}`, searchUrl: makeSearchUrl(base, locale, title) };
  }

  // Son çare urlSlug
  const url = clean(urlSlug);
  if (url) {
    if (hasLocale(url)) {
      return { storeUrl: `${base}/${url}`, searchUrl: makeSearchUrl(base, locale, title) };
    }
    return { storeUrl: `${base}/${locale}/p/${url}`, searchUrl: makeSearchUrl(base, locale, title) };
  }

  // Hiçbiri yoksa arama sayfası
  return { storeUrl: `${base}/${locale}/search?q=${encodeURIComponent(title)}`, searchUrl: makeSearchUrl(base, locale, title) };
}

function makeSearchUrl(base, locale, title) {
  return `${base}/${locale}/search?q=${encodeURIComponent(title || '')}`;
}