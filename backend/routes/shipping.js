const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');

router.get('/districts', shippingController.listDistricts);
router.get('/subdistricts', shippingController.listSubdistricts);
router.get('/shipping/quote', shippingController.getQuote);

module.exports = router;
