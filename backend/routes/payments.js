const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const paymentController = require('../controllers/paymentController');

const upload = multer({
  dest: path.join(__dirname, '../public/uploads/payments')
});

// รองรับทั้ง proof_image และ image
function flexibleSingleFile(req, res, next) {
  const field = req.headers['content-type']?.includes('multipart') && req.body?.image ? 'image' : 'proof_image';
  return upload.single(field)(req, res, next);
}

// แจ้งชำระเงิน (POST /api/payments)
router.post('/', flexibleSingleFile, paymentController.createPayment);

// ตรวจสอบสถานะการชำระเงิน (GET /api/payments/status/:order_id)
router.get('/status/:order_id', paymentController.checkPaymentStatus);

// อัปเดตสถานะการชำระเงิน (PUT /api/payments/:id/status)
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    // อัปเดตสถานะ payment
    await db('payments').where({ id }).update({ status });

    // ดึงข้อมูล payment เพื่อหา order_id, customer_id
    const payment = await db('payments').where({ id }).first();
    if (payment && status === 'approved') {
      // อัปเดตสถานะ order เป็น approved (รอแอดมินอนุมัติจัดส่ง)
      await db('orders').where({ id: payment.order_id }).update({ status: 'approved', approved_at: db.fn.now() });

      // เพิ่ม notification ให้ลูกค้า
      await db('notifications').insert({
        customer_id: payment.customer_id,
        type: 'success',
        title: 'ชำระเงินสำเร็จ',
        message: `คำสั่งซื้อ #${String(payment.order_id).padStart(4, '0')} ได้รับการยืนยันแล้ว รอแอดมินตรวจสอบและจัดส่ง`,
        created_at: new Date()
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'อัปเดตสถานะล้มเหลว' });
  }
});

// ดึงรายการการชำระเงินทั้งหมด (GET /api/payments?status=pending)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    // join กับ customers เพื่อดึงชื่อผู้โอน
    const payments = await db('payments')
      .leftJoin('customers', 'payments.customer_id', 'customers.id')
      .select(
        'payments.*',
        'customers.name as customer_name'
      )
      .modify((qb) => {
        if (status) qb.where('payments.status', status);
      })
      .orderBy('payments.created_at', 'desc');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลการโอนเงินได้' });
  }
});


module.exports = router;


