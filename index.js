const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

app.get('/free-games', async (req, res) => {
  try {
    const response = await axios.get(
      'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=US&allowCountries=US'
    );
    const elements = response.data.data.Catalog.searchStore.elements;
    const freeGames = elements.filter(game =>
      game.promotions &&
      game.promotions.promotionalOffers &&
      game.promotions.promotionalOffers.length > 0
    ).map(game => ({
      title: game.title,
      description: game.description,
      imageUrl: game.keyImages[0]?.url || '',
      endDate: game.promotions.promotionalOffers[0].promotionalOffers[0].endDate,
    }));

    res.json(freeGames);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));