const db = require('../db');

// Simple server-side price estimator
function calculatePrice(input = {}) {
  const qty = Math.max(1, Number.isFinite(Number(input.quantity)) ? Math.floor(Number(input.quantity)) : 1);
  const areaM2 = Number(input.parsed && input.parsed.areaM2) > 0 ? Number(input.parsed.areaM2) : 1;
  let pricePerM2 = 1500;
  if (typeof input.type === 'string') {
    const t = input.type.toLowerCase();
    if (t.includes('door')) pricePerM2 = 1800;
    else if (t.includes('window')) pricePerM2 = 1600;
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
      hasScreen, roundFrame, swingType, mode, fixedLeftM2, fixedRightM2, priceClient, user_id
    } = req.body;

    const userId = user_id; // In production, prefer req.user?.id from auth middleware
    if (!userId) return res.status(401).json({ message: 'unauthorized' });

    const widthNum = Number(width);
    const heightNum = Number(height);
    const qty = Math.max(1, Number.isFinite(Number(quantity)) ? Math.floor(Number(quantity)) : 1);
    if (!category || !productType || !widthNum || !heightNum) {
      return res.status(400).json({ message: 'invalid input' });
    }

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
      status: 'pending',
      created_at: db.fn.now(),
    };

    await db('custom_orders').insert(insertPayload);
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
    let query = db('custom_orders').select('*').orderBy('created_at', 'desc');
    if (user_id) {
      const uid = Number(user_id);
      if (!uid) return res.status(400).json({ message: 'invalid user_id' });
      query = query.where({ user_id: uid });
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

exports.updateOrderStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'invalid id' });

    let { status } = req.body || {};
    if (!status || typeof status !== 'string') {
      return res.status(400).json({ message: 'invalid status' });
    }

    const normalized = status === 'finished' ? 'completed' : status;
    const allowed = new Set([
      'pending',
      'approved',
      'waiting_payment',
      'paid',
      'in_production',
      'delivering',
      'completed',
      'rejected',
    ]);
    if (!allowed.has(normalized)) {
      return res.status(400).json({ message: 'invalid status' });
    }

    const updated = await db('custom_orders')
      .where({ id })
      .update({ status: normalized, updated_at: db.fn.now() });

    if (!updated) return res.status(404).json({ message: 'custom order not found' });
    return res.json({ success: true });
  } catch (e) {
    console.error('updateOrderStatus error:', e);
    return res.status(500).json({ message: 'failed to update status' });
  }
};

