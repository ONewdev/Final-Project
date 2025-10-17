const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');

// Existing routes
router.get('/districts', shippingController.listDistricts);
router.get('/subdistricts', shippingController.listSubdistricts);
router.get('/shipping/quote', shippingController.getQuote);

// New shipping rates management routes
router.get('/provinces', shippingController.getProvinces);
router.get('/shipping-rates', shippingController.getAllShippingRates);
router.post('/shipping-rates', shippingController.createShippingRate);
router.put('/shipping-rates/:id', shippingController.updateShippingRate);
router.delete('/shipping-rates/:id', shippingController.deleteShippingRate);

module.exports = router;
