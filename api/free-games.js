import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    const response = await fetch(
      'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=US&allowCountries=US'
    );
    const data = await response.json();

    const games = data.data.Catalog.searchStore.elements
      .filter(game => game.promotions && game.promotions.promotionalOffers.length > 0)
      .map(game => ({
        title: game.title,
        description: game.description,
        image: game.keyImages[0]?.url,
        urlSlug: game.urlSlug
      }));

    res.status(200).json(games);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}