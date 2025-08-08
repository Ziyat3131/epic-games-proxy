// api/free-games.js
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
  const urlSlug = game?.urlSlug || '';
  const productSlugRaw = game?.productSlug || '';
  const pageSlug = game?.catalogNs?.mappings?.[0]?.pageSlug || '';

  const storeUrl = buildStoreUrl({ productSlugRaw, pageSlug, urlSlug });

  return { title, description, image, urlSlug, storeUrl };
}

function buildStoreUrl({ productSlugRaw, pageSlug, urlSlug }) {
  const base = 'https://store.epicgames.com';
  const locale = 'en-US';
  const clean = (s) => (s || '').replace(/^\/+/, '');

  const productSlug = clean(productSlugRaw);
  const page = clean(pageSlug);
  const url = clean(urlSlug);

  if (productSlug) {
    if (productSlug.startsWith('p/') || productSlug.startsWith('bundles/')) {
      return `${base}/${locale}/${productSlug}`;
    }
    return `${base}/${locale}/p/${productSlug}`;
  }
  if (page) return `${base}/${locale}/p/${page}`;
  if (url) return `${base}/${locale}/p/${url}`;
  return `${base}/${locale}/`;
}