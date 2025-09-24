const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// GET /api/products/popular
router.get('/', productController.getPopularProducts);

module.exports = router;
