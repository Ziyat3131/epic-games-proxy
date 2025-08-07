const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());

app.get('/free-games', async (req, res) => {
  try {
    const response = await fetch('https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=US&allowCountries=US');
    const data = await response.json();

    const games = data.data.Catalog.searchStore.elements
      .filter(game => game.promotions && game.promotions.promotionalOffers.length > 0)
      .map(game => ({
        title: game.title,
        description: game.description,
        image: game.keyImages[0]?.url,
        urlSlug: game.urlSlug
      }));

    res.json(games);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});