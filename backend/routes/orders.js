
const express = require('express');
const router = express.Router();
const db = require('../db');
const orderController = require('../controllers/ordersController');
const { generateReceiptPdf } = require('../controllers/ordersController');

// à¸ˆà¸³à¸™à¸§à¸™à¸­à¸­à¹€à¸”à¸­à¸£à¹Œà¹ƒà¸«à¸¡à¹ˆ (pending)


// à¸ªà¸£à¹‰à¸²à¸‡à¸„à¸³à¸ªà¸±à¹ˆà¸‡à¸‹à¸·à¹‰à¸­à¹ƒà¸«à¸¡à¹ˆ
router.post('/create', orderController.createOrder);

// à¸”à¸¶à¸‡à¸„à¸³à¸ªà¸±à¹ˆà¸‡à¸‹à¸·à¹‰à¸­à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸” (à¸ªà¸³à¸«à¸£à¸±à¸š admin)
router.get('/', orderController.getAllOrders);

// à¸”à¸¶à¸‡à¸„à¸³à¸ªà¸±à¹ˆà¸‡à¸‹à¸·à¹‰à¸­à¸•à¸²à¸¡ customer_id
router.get('/customer/:customer_id', orderController.getOrdersByCustomer);

// à¸­à¸±à¸›à¹€à¸”à¸•à¸ªà¸–à¸²à¸™à¸°à¸„à¸³à¸ªà¸±à¹ˆà¸‡à¸‹à¸·à¹‰à¸­
router.patch('/:id/status', orderController.updateOrderStatus);

// à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´à¸„à¸³à¸ªà¸±à¹ˆà¸‡à¸‹à¸·à¹‰à¸­ (à¸£à¸­à¸‡à¸£à¸±à¸šà¸—à¸±à¹‰à¸‡ PATCH à¹à¸¥à¸° PUT)
router.patch('/:id/approve', orderController.approveOrder);
router.put('/:id/approve', orderController.approveOrder);


// à¸ˆà¸±à¸”à¸ªà¹ˆà¸‡à¸ªà¸´à¸™à¸„à¹‰à¸² (à¸­à¸±à¸›à¹€à¸”à¸•à¸ªà¸–à¸²à¸™à¸°à¹€à¸›à¹‡à¸™ shipped)
router.put('/:id/ship', orderController.shipOrder);

// à¸¢à¸à¹€à¸¥à¸´à¸à¸„à¸³à¸ªà¸±à¹ˆà¸‡à¸‹à¸·à¹‰à¸­
router.patch('/:id/cancel', orderController.cancelOrder);

router.get('/unread-count', async (req, res) => {
  try {
    const result = await db('orders').where('status', 'pending').count('id as count').first();
    res.json({ count: Number(result.count || 0) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', orderController.getOrderById);

router.get('/:orderId/receipt', generateReceiptPdf);


module.exports = router;


