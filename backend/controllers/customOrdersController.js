// controllers/customOrdersController.js
const db = require('../db');

// Simple server-side price estimator
function calculatePrice(input = {}) {
  const qty = Math.max(1, Number.isFinite(Number(input.quantity)) ? Math.floor(Number(input.quantity)) : 1);
  const areaM2 = Number(input.parsed && input.parsed.areaM2) > 0 ? Number(input.parsed.areaM2) : 1;

  // ปรับให้รองรับคีย์เวิร์ดไทยด้วย
  let pricePerM2 = 1500;
  if (typeof input.type === 'string') {
    const t = input.type.toLowerCase();
    if (t.includes('door') || t.includes('ประตู')) pricePerM2 = 1800;
    else if (t.includes('window') || t.includes('หน้าต่าง')) pricePerM2 = 1600;
  }

  let base = areaM2 * pricePerM2;
  if (input.hasScreen) base += 500;
  if (input.roundFrame) base += 800;
  if (input.swingType && String(input.swingType).includes('2')) base += 7000;
  if (input.mode && String(input.mode).toLowerCase().includes('fixed')) {
    const left = Number(input.fixedLeftM2) || 0;
    const right = Number(input.fixedRightM2) || 0;
    base += (left + right) * 1200;
  }
  return Math.max(0, Math.round(base) * qty);
}

exports.estimatePrice = async (req, res) => {
  try {
    const input = req.body || {};
    const price = calculatePrice({
      type: input.productType,
      quantity: Number(input.quantity) || 1,
      color: input.color,
      size: input.size,
      parsed: input.parsed,
      hasScreen: !!input.hasScreen,
      roundFrame: !!input.roundFrame,
      swingType: input.swingType,
      mode: input.mode,
      fixedLeftM2: Number(input.fixedLeftM2) || 0,
      fixedRightM2: Number(input.fixedRightM2) || 0,
    });
    return res.json({ estimatedPrice: price });
  } catch (e) {
    return res.status(500).json({ message: 'estimation failed' });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const {
      category, productType, width, height, unit, color, quantity, details,
      hasScreen, roundFrame, swingType, mode, fixedLeftM2, fixedRightM2, priceClient, user_id,

      // ===== ฟิลด์ใหม่: การจัดส่ง/รับหน้าร้าน =====
      shipping_method,           // 'pickup' | 'delivery'
      shipping_fee,              // number
      shipping_address,          // string
      phone,                     // string
      province_id,               // int|null
      district_id,               // int|null
      subdistrict_id,            // int|null
      postal_code                // string(<=5)|null
    } = req.body || {};

    // In production, prefer req.user?.id from auth middleware
    const userId = user_id;
    if (!userId) return res.status(401).json({ message: 'unauthorized' });

    const widthNum = Number(width);
    const heightNum = Number(height);
    const qty = Math.max(1, Number.isFinite(Number(quantity)) ? Math.floor(Number(quantity)) : 1);
    if (!category || !productType || !widthNum || !heightNum) {
      return res.status(400).json({ message: 'invalid input' });
    }

    // ===== ตรวจ/normalize ฟิลด์การจัดส่ง =====
    const method = (shipping_method === 'delivery') ? 'delivery' : 'pickup';
    let shipFee = Number(shipping_fee);
    if (!Number.isFinite(shipFee) || shipFee < 0) shipFee = 0;

    const provId = Number(province_id) || null;
    const distId = Number(district_id) || null;
    const subdistId = Number(subdistrict_id) || null;
    const postal = (typeof postal_code === 'string' && postal_code.trim().length <= 5) ? postal_code.trim() : null;
    const phoneSan = (typeof phone === 'string' && phone.trim()) ? phone.trim() : null;
    const addrSan = (typeof shipping_address === 'string' && shipping_address.trim())
      ? shipping_address.trim()
      : (method === 'pickup' ? 'รับหน้าร้าน' : null);

    const insertPayload = {
      user_id: userId,
      category: String(category),
      product_type: String(productType),
      width: widthNum,
      height: heightNum,
      unit: unit === 'm' ? 'm' : 'cm',
      color: color || '',
      quantity: qty,
      details: details || null,
      has_screen: hasScreen ? 1 : 0,
      round_frame: roundFrame ? 1 : 0,
      swing_type: swingType || '',
      mode: mode || '',
      fixed_left_m2: Number(fixedLeftM2) || 0,
      fixed_right_m2: Number(fixedRightM2) || 0,
      price: Math.max(0, Math.round(Number(priceClient) || 0)),

      // ==== ฟิลด์ใหม่: บันทึกลง custom_orders (ต้องมีคอลัมน์ตามที่เพิ่มใน DB) ====
      shipping_method: method,               // ENUM('pickup','delivery')
      shipping_fee: shipFee,                 // DECIMAL(10,2)
      shipping_address: addrSan,             // VARCHAR(500)
      phone: phoneSan,                       // VARCHAR(20)
      province_id: provId,                   // INT
      district_id: distId,                   // INT
      subdistrict_id: subdistId,             // INT
      postal_code: postal,                   // VARCHAR(5)

      status: 'pending',
      created_at: db.fn.now(),
    };

    const [customOrderId] = await db('custom_orders').insert(insertPayload);
    
    // ส่ง socket event แจ้งเตือน admin
    try {
      const { io } = require('../app');
      if (io) {
        io.emit('customOrder:new', { customOrderId, user_id: userId, price: insertPayload.price });
      }
    } catch (err) {
      console.warn('Socket notification failed:', err.message);
    }
    
    return res.status(201).json({ success: true });
  } catch (e) {
    console.error('createOrder error:', e);
    return res.status(500).json({ message: 'failed to create order' });
  }
};

// List custom orders: admin (all) or by user_id
exports.listOrders = async (req, res) => {
  try {
    const { user_id } = req.query || {};
    let query = db('custom_orders as o')
      .leftJoin('customers as c', 'o.user_id', 'c.id')
      .select(
        'o.*',
        db.raw('c.name as customer_name')
      )
      .orderBy('o.created_at', 'desc');

    if (user_id) {
      const uid = Number(user_id);
      if (!uid) return res.status(400).json({ message: 'invalid user_id' });
      query = query.where('o.user_id', uid);
    }

    const rows = await query;
    const shaped = rows.map(r => ({
      ...r,
      status: r.status === 'completed' ? 'finished' : r.status,
    }));
    return res.json(shaped);
  } catch (e) {
    console.error('listOrders error:', e);
    return res.status(500).json({ message: 'cannot list custom orders' });
  }
};

const ALLOWED = new Set(['pending','approved','waiting_payment','paid','in_production','delivering','completed','rejected']);

// แผนผังการย้ายสถานะ (อนุญาตเฉพาะบางเส้นทาง)
const NEXT = {
  pending: ['approved','rejected','waiting_payment'],
  waiting_payment: ['paid','rejected'],
  paid: ['in_production','rejected'],
  approved: ['in_production','rejected'],
  in_production: ['delivering','rejected'],
  delivering: ['completed'],
  completed: [],
  rejected: []
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'invalid id', reason: 'ID is missing or not a number' });

    let { status } = req.body || {};
    if (!status || typeof status !== 'string') {
      return res.status(400).json({ message: 'invalid status', reason: 'Status is missing or not a string' });
    }
    // map FE->DB
    let target = (status === 'finished') ? 'completed' : status;
    // map admin "approved" action into waiting_payment step so user is prompted to pay
    if (target === 'approved') target = 'waiting_payment';
    if (!ALLOWED.has(target)) {
      return res.status(400).json({ message: 'invalid status', reason: `Status '${target}' is not allowed` });
    }

    // fetch current status and user for notifications
    const current = await db('custom_orders').where({ id }).first('status', 'user_id');
    if (!current) return res.status(404).json({ message: 'custom order not found', reason: 'Order ID not found in database' });
    // ตรวจเส้นทาง
    if (!NEXT[current.status]?.includes(target)) {
      return res.status(409).json({ message: `cannot change status from ${current.status} to ${target}`, reason: 'Transition not allowed by backend rules', currentStatus: current.status, targetStatus: target });
    }

    await db.transaction(async trx => {
      await trx('custom_orders')
        .where({ id })
        .update({ status: target, updated_at: trx.fn.now() });

      // log การเปลี่ยนสถานะ (ไม่ให้ล้มทั้งระบบหากตารางหาย)
      try {
        await trx('custom_order_status_logs').insert({
          order_id: id,
          from_status: current.status,
          to_status: target,
          changed_at: trx.fn.now()
        });
      } catch (logErr) {
        console.warn('custom_order_status_logs insert failed, continuing. Error:', logErr?.message || logErr);
      }

      // เมื่อตั้งเป็น waiting_payment ให้แจ้งลูกค้าไปชำระเงิน
      if (target === 'waiting_payment') {
        try {
          await trx('notifications').insert({
            customer_id: current.user_id,
            type: 'info',
            title: 'กรุณาชำระเงิน',
            message: `ออเดอร์ #${id} ได้รับการอนุมัติ กรุณาชำระเงินเพื่อดำเนินการต่อ`
          });
        } catch (notifErr) {
          console.warn('notifications insert failed (non-fatal). Error:', notifErr?.message || notifErr);
        }
      }
    });

    return res.json({ success: true });
  } catch (e) {
    console.error('updateOrderStatus error:', e);
    return res.status(500).json({ message: 'failed to update status', reason: e?.message || e });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'invalid id' });

    // ดึงออเดอร์ + ลูกค้า
    const order = await db('custom_orders as o')
      .leftJoin('customers as c', 'o.user_id', 'c.id')
      .select(
        'o.*',
        db.raw('c.name as customer_name')
      )
      .where('o.id', id)
      .first();

    if (!order) return res.status(404).json({ message: 'not found' });

    // แนบไฟล์ (ถ้ามีตารางไฟล์)
    let files = [];
    try {
      files = await db('custom_order_files')
        .select('id','filename','url')
        .where({ order_id: id });
    } catch (_) {}

    // shape สถานะให้ FE
    const shaped = {
      ...order,
      status: order.status === 'completed' ? 'finished' : order.status,
      files
    };
    return res.json(shaped);
  } catch (e) {
    console.error('getOrderById error:', e);
    return res.status(500).json({ message: 'cannot get detail' });
  }
};
