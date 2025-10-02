// routes/customOrders.js
const express = require('express');
const path = require('path');
const multer = require('multer');
const ctrl = require('../controllers/customOrdersController');
const payCtrl = require('../controllers/customPaymentsController');
const router = express.Router();

/** ===================== Orders ===================== */
// ประเมินราคา
router.post('/orders/estimate', ctrl.estimatePrice);

// สร้างออเดอร์สั่งทำ
router.post('/orders', ctrl.createOrder);

// รายการออเดอร์ (admin ทั้งหมด หรือผ่าน ?user_id= แสดงของผู้ใช้)
router.get('/orders', ctrl.listOrders);

// รายละเอียดออเดอร์
router.get('/orders/:id', ctrl.getOrderById);

// อัปเดตสถานะ (พหูพจน์ - เส้นทางหลักใหม่)
router.put('/orders/:id/status', ctrl.updateOrderStatus);

// 🔁 เส้นทางเดิม (เอกพจน์) เก็บไว้ชั่วคราวเพื่อ compatibility
router.put('/order/:id/status', ctrl.updateOrderStatus);


/** ===================== Payments (Custom Orders) ===================== */
// ที่เก็บไฟล์สลิป
const slipDir = path.join(__dirname, '..', 'public', 'uploads', 'custom_payments');
const upload = multer({ dest: slipDir });

// ลูกค้าอัปโหลดสลิปให้ order ที่กำลัง "waiting_payment"
router.post('/orders/:id/payments', upload.single('image'), payCtrl.createPayment);

// ดูรายการสลิปของออเดอร์
router.get('/orders/:id/payments', payCtrl.listPaymentsByOrder);

// แอดมินอนุมัติสลิป -> order ไปสถานะ "paid"
router.put('/payments/:paymentId/approve', payCtrl.approvePayment);

// แอดมินปฏิเสธสลิป (แนบ note ได้) -> order คง "waiting_payment"
router.put('/payments/:paymentId/reject', payCtrl.rejectPayment);


module.exports = router;
