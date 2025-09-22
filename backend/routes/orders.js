// ดึงข้อมูล order ตาม id

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/ordersController');
const { generateReceiptPdf } = require('../controllers/ordersController');


// สร้างคำสั่งซื้อใหม่
router.post('/create', orderController.createOrder);

// ดึงคำสั่งซื้อทั้งหมด (สำหรับ admin)
router.get('/', orderController.getAllOrders);

// ดึงคำสั่งซื้อตาม customer_id
router.get('/customer/:customer_id', orderController.getOrdersByCustomer);

// อัปเดตสถานะคำสั่งซื้อ
router.patch('/:id/status', orderController.updateOrderStatus);

// อนุมัติคำสั่งซื้อ (รองรับทั้ง PATCH และ PUT)
router.patch('/:id/approve', orderController.approveOrder);
router.put('/:id/approve', orderController.approveOrder);


// จัดส่งสินค้า (อัปเดตสถานะเป็น shipped)
router.put('/:id/ship', orderController.shipOrder);

// ยกเลิกคำสั่งซื้อ
router.patch('/:id/cancel', orderController.cancelOrder);

router.get('/:id', orderController.getOrderById);

router.get('/:orderId/receipt', generateReceiptPdf);


module.exports = router;

