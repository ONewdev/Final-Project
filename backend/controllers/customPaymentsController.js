// controllers/customPaymentsController.js
const db = require('../db');
const path = require('path');
const fs = require('fs');
let io;
try {
  io = require('../app').io;
} catch (_) {
  io = null;
}

exports.createPayment = async (req, res) => {
  let tempFile = null;
  
  try {
    const orderId = Number(req.params.id);
    const { amount, customer_id } = req.body; // FE ส่งมาด้วย
    if (!orderId || !amount || !customer_id) {
      return res.status(400).json({ message: 'invalid payload' });
    }

    const order = await db('custom_orders').where({ id: orderId }).first();
    if (!order) return res.status(404).json({ message: 'order not found' });

    // ต้องอยู่ช่วง waiting_payment ถึงจะอัปสลิปได้ (กันผิด flow)
    if (order.status !== 'waiting_payment') {
      return res.status(409).json({ message: `order status must be waiting_payment (current=${order.status})` });
    }

    const file = req.file; // multer
    if (!file) return res.status(400).json({ message: 'slip image required' });

    tempFile = file; // เก็บ reference เพื่อลบถ้าเกิด error

    // ตั้งชื่อไฟล์ใหม่ที่มีความหมาย
    const timestamp = Date.now();
    const originalName = file.originalname || 'slip';
    const extension = path.extname(originalName) || '.jpg';
    const newFileName = `order_${orderId}_${timestamp}${extension}`;
    const newFilePath = path.join(path.dirname(file.path), newFileName);

    // เปลี่ยนชื่อไฟล์
    fs.renameSync(file.path, newFilePath);

    const imagePath = `/uploads/custom_payments/${newFileName}`;

    const [id] = await db('custom_order_payments').insert({
      custom_order_id: orderId,
      customer_id,
      amount,
      image: imagePath,
      status: 'pending'
    });

    // แจ้งเตือนลูกค้า (ออปชัน)
    try {
      await db('notifications').insert({
        customer_id: customer_id,
        type: 'info',
        title: 'แจ้งชำระเงินแล้ว',
        message: `ออเดอร์ #${orderId} ส่งหลักฐานการชำระเงินแล้ว รอแอดมินตรวจสอบ`
      });
    } catch (_) {}

    // emit pending count for admin sidebar badge (custom orders)
    try {
      if (io) {
        const row = await db('custom_order_payments').where({ status: 'pending' }).count({ c: '*' }).first();
        const pendingCount = Number(row?.c || row?.count || 0);
        io.emit('paymentCustomCheck:unread:set', pendingCount);
      }
    } catch (e) {
      console.warn('emit paymentCustomCheck:unread:set failed:', e?.message || e);
    }

    return res.status(201).json({ success: true, payment_id: id, image: imagePath });
  } catch (e) {
    console.error('createPayment error:', e);
    
    // ลบไฟล์ชั่วคราวถ้าเกิด error
    if (tempFile && fs.existsSync(tempFile.path)) {
      try {
        fs.unlinkSync(tempFile.path);
      } catch (fileError) {
        console.error('Error cleaning up temp file:', fileError);
      }
    }
    
    return res.status(500).json({ message: 'failed to create payment' });
  }
};

exports.listPaymentsByOrder = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const rows = await db('custom_order_payments')
      .where({ custom_order_id: orderId })
      .orderBy('created_at', 'desc');
    res.json(rows);
  } catch (e) {
    console.error('listPaymentsByOrder error:', e);
    res.status(500).json({ message: 'failed to list payments' });
  }
};

exports.approvePayment = async (req, res) => {
  try {
    const pid = Number(req.params.paymentId);
    const adminId = req.user?.id || null; // ถ้ามี auth

    const payment = await db('custom_order_payments').where({ id: pid }).first();
    if (!payment) return res.status(404).json({ message: 'payment not found' });
    if (payment.status !== 'pending') {
      return res.status(409).json({ message: `cannot approve payment with status=${payment.status}` });
    }

    await db.transaction(async trx => {
      // 1) อัปเดต payment
      await trx('custom_order_payments').where({ id: pid }).update({
        status: 'approved',
        approved_at: trx.fn.now(),
        approved_by: adminId
      });

      // 2) อัปเดต order -> paid
      const order = await trx('custom_orders').where({ id: payment.custom_order_id }).first('status');
      if (!order) throw new Error('order not found in approve');

      // อนุญาตเฉพาะต้องมาจาก waiting_payment
      if (order.status !== 'waiting_payment') {
        throw new Error(`invalid order status ${order.status} for approve`);
      }

      await trx('custom_orders').where({ id: payment.custom_order_id }).update({
        status: 'paid',
        updated_at: trx.fn.now()
      });

      // 3) log สถานะ
      await trx('custom_order_status_logs').insert({
        order_id: payment.custom_order_id,
        from_status: 'waiting_payment',
        to_status: 'paid',
        changed_at: trx.fn.now()
      });

      // 4) แจ้งเตือนลูกค้า
      await trx('notifications').insert({
        customer_id: payment.customer_id,
        type: 'success',
        title: 'ชำระเงินสำเร็จ',
        message: `ออเดอร์ #${payment.custom_order_id} ได้รับการยืนยันการชำระเงินแล้ว`
      });
    });

    // broadcast updated pending count for admin sidebar badges
    try {
      if (io) {
        const row = await db('custom_order_payments').where({ status: 'pending' }).count({ c: '*' }).first();
        const pendingCount = Number(row?.c || row?.count || 0);
        io.emit('paymentCustomCheck:unread:set', pendingCount);
      }
    } catch (e) {
      console.warn('emit paymentCustomCheck:unread:set failed:', e?.message || e);
    }

    res.json({ success: true });
  } catch (e) {
    console.error('approvePayment error:', e);
    res.status(500).json({ message: 'failed to approve payment' });
  }
};

exports.rejectPayment = async (req, res) => {
  try {
    const pid = Number(req.params.paymentId);
    const { note } = req.body || {};
    const payment = await db('custom_order_payments').where({ id: pid }).first();
    if (!payment) return res.status(404).json({ message: 'payment not found' });
    if (payment.status !== 'pending') {
      return res.status(409).json({ message: `cannot reject payment with status=${payment.status}` });
    }

    await db.transaction(async trx => {
      await trx('custom_order_payments').where({ id: pid }).update({
        status: 'rejected',
        rejected_at: trx.fn.now(),
        note: note || null
      });

      // ลบไฟล์รูปภาพออกจากเซิร์ฟเวอร์ (ออปชัน)
      try {
        if (payment.image) {
          const imagePath = path.join(__dirname, '..', 'public', payment.image);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
      } catch (fileError) {
        console.error('Error deleting payment image:', fileError);
        // ไม่ให้ error นี้ทำให้ transaction ล้มเหลว
      }

      // ไม่เปลี่ยนสถานะ order (ยังคง waiting_payment)
      await trx('notifications').insert({
        customer_id: payment.customer_id,
        type: 'warning',
        title: 'ไม่สามารถยืนยันการชำระเงิน',
        message: `ออเดอร์ #${payment.custom_order_id} หลักฐานไม่ผ่าน: ${note || 'กรุณาอัปโหลดใหม่'}`
      });
    });

    // broadcast updated pending count for admin sidebar badges
    try {
      if (io) {
        const row = await db('custom_order_payments').where({ status: 'pending' }).count({ c: '*' }).first();
        const pendingCount = Number(row?.c || row?.count || 0);
        io.emit('paymentCustomCheck:unread:set', pendingCount);
      }
    } catch (e) {
      console.warn('emit paymentCustomCheck:unread:set failed:', e?.message || e);
    }

    res.json({ success: true });
  } catch (e) {
    console.error('rejectPayment error:', e);
    res.status(500).json({ message: 'failed to reject payment' });
  }
};

// ฟังก์ชันสำหรับล้างไฟล์เก่าที่ไม่ใช้แล้ว
exports.cleanupOldFiles = async () => {
  try {
    const uploadsDir = path.join(__dirname, '..', 'public', 'uploads', 'custom_payments');
    
    // ดึงไฟล์ทั้งหมดในโฟลเดอร์
    const files = fs.readdirSync(uploadsDir);
    
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      
      // ลบไฟล์ที่เก่ากว่า 30 วัน
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      if (stats.mtime < thirtyDaysAgo) {
        // ตรวจสอบว่าไฟล์นี้ยังถูกใช้อยู่ในฐานข้อมูลหรือไม่
        const isUsed = await db('custom_order_payments')
          .where('image', `/uploads/custom_payments/${file}`)
          .first();
        
        if (!isUsed) {
          fs.unlinkSync(filePath);
          console.log(`Deleted old unused file: ${file}`);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up old files:', error);
  }
};
