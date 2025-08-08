const fetch = require('node-fetch');

module.exports = async (req, res) => {
  try {
    const response = await fetch(
      'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=US&allowCountries=US'
    );
    const data = await response.json();

    const elements = data.data.Catalog.searchStore.elements;

    const pickImage = (game) =>
      game.keyImages.find((img) => img.type === 'OfferImageWide')?.url ||
      game.keyImages[0]?.url;

    // Şu an ücretsiz oyunlar
    const current = elements
      .filter((g) => g.promotions?.promotionalOffers?.length > 0)
      .map((g) => {
        const offer = g.promotions.promotionalOffers[0].promotionalOffers[0];
        return {
          title: g.title,
          description: g.description,
          image: pickImage(g),
          urlSlug: g.urlSlug,
          startDate: offer.startDate,
          endDate: offer.endDate,
          type: 'current'
        };
      });

    // Gelecek hafta ücretsiz olacak oyunlar
    const upcoming = elements
      .filter((g) => g.promotions?.upcomingPromotionalOffers?.length > 0)
      .map((g) => {
        const offer = g.promotions.upcomingPromotionalOffers[0].promotionalOffers[0];
        return {
          title: g.title,
          description: g.description,
          image: pickImage(g),
          urlSlug: g.urlSlug,
          startDate: offer.startDate,
          endDate: offer.endDate,
          type: 'upcoming'
        };
      });

    res.status(200).json({ current, upcoming });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};