const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticateCustomer } = require('../middlewares/customerAuth');

router.get('/', authenticateCustomer, cartController.list);
router.post('/', authenticateCustomer, cartController.addItem);
router.put('/:productId', authenticateCustomer, cartController.updateItem);
router.delete('/:productId', authenticateCustomer, cartController.removeItem);
router.delete('/', authenticateCustomer, cartController.clearCart);

module.exports = router;
