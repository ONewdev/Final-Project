const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const paymentController = require('../controllers/paymentController');
let io;
try {
  io = require('../app').io;
} catch (_) {
  io = null;
}

// Ensure upload directory exists and configure disk storage
const paymentsUploadDir = path.join(__dirname, '../public/uploads/payments');
try {
  if (!fs.existsSync(paymentsUploadDir)) {
    fs.mkdirSync(paymentsUploadDir, { recursive: true });
  }
} catch (_) { /* ignore */ }

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, paymentsUploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.mimetype);
    cb(ok ? null : new Error('Invalid file type'), ok);
  },
});

// รองรับทั้ง proof_image และ image
function flexibleSingleFile(req, res, next) {
  // รองรับทั้งสอง field
  const uploadFields = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'proof_image', maxCount: 1 }
  ]);
  uploadFields(req, res, function (err) {
    // log เพื่อ debug
    console.log('Uploaded files:', req.files);
    // ถ้ามีไฟล์ image หรือ proof_image ให้ map ไปที่ req.file เพื่อให้ controller ใช้งานได้เหมือนเดิม
    if (req.files?.image?.[0]) {
      req.file = req.files.image[0];
    } else if (req.files?.proof_image?.[0]) {
      req.file = req.files.proof_image[0];
    }
    next(err);
  });
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
    // after status change, emit updated pending count for admin sidebar badges
    try {
      if (io) {
        const row = await db('payments').where({ status: 'pending' }).count({ c: '*' }).first();
        const pendingCount = Number(row?.c || row?.count || 0);
        io.emit('paymentOrderCheck:unread:set', pendingCount);
      }
    } catch (e) {
      console.warn('emit paymentOrderCheck:unread:set failed:', e?.message || e);
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


