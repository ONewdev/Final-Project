const express = require('express');
const router = express.Router();
const interactionController = require('../controllers/interactionController');

// Rating routes
router.get('/rating/status', interactionController.checkRatingStatus); 
router.post('/ratings', interactionController.submitOrUpdateRating); 
router.get('/rating/summary', interactionController.getRatingSummary);

// Favorite routes
router.post('/favorite', interactionController.favoriteProduct);
router.post('/unfavorite', interactionController.unfavoriteProduct);
router.get('/favorite/status', interactionController.checkFavoriteStatus);

module.exports = router;
