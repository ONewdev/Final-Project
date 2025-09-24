// controllers/customPaymentsController.js
const db = require('../db');
const path = require('path');

exports.createPayment = async (req, res) => {
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

    const imagePath = `/uploads/custom_payments/${path.basename(file.path)}`;

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

    return res.status(201).json({ success: true, payment_id: id, image: imagePath });
  } catch (e) {
    console.error('createPayment error:', e);
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

      // ไม่เปลี่ยนสถานะ order (ยังคง waiting_payment)
      await trx('notifications').insert({
        customer_id: payment.customer_id,
        type: 'warning',
        title: 'ไม่สามารถยืนยันการชำระเงิน',
        message: `ออเดอร์ #${payment.custom_order_id} หลักฐานไม่ผ่าน: ${note || 'กรุณาอัปโหลดใหม่'}`
      });
    });

    res.json({ success: true });
  } catch (e) {
    console.error('rejectPayment error:', e);
    res.status(500).json({ message: 'failed to reject payment' });
  }
};
