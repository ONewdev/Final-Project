// routes/customOrders.js
const express = require('express');
const ctrl = require('../controllers/customOrdersController');
const router = express.Router();

router.post('/orders/estimate', ctrl.estimatePrice);
router.post('/orders', ctrl.createOrder);
router.get('/orders', ctrl.listOrders);
router.get('/orders/:id', ctrl.getOrderById);        // NEW: รายละเอียด
router.put('/order/:id/status', ctrl.updateOrderStatus);

module.exports = router;
