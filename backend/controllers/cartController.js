const db = require('../db');

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function fetchCartItems(userId) {
  const rows = await db('carts as c')
    .join('products as p', 'c.product_id', 'p.id')
    .select(
      'c.id as cart_id',
      'c.product_id',
      'c.quantity',
      'c.created_at',
      'c.updated_at',
      'p.name',
      'p.price',
      'p.quantity as stock',
      'p.image_url',
      'p.status'
    )
    .where('c.user_id', userId)
    .orderBy('c.created_at', 'asc');

  return rows.map((row) => ({
    cart_id: row.cart_id,
    product_id: row.product_id,
    quantity: toNumber(row.quantity, 0),
    name: row.name,
    product_name: row.name,
    price: toNumber(row.price, 0),
    stock: row.stock !== null ? toNumber(row.stock, 0) : null,
    image_url: row.image_url,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

async function ensureProduct(productId) {
  const product = await db('products')
    .select('id', 'name', 'price', 'quantity', 'status', 'image_url')
    .where({ id: productId })
    .first();
  return product || null;
}

function clampQuantity(requested, stock) {
  const qty = Math.max(0, Math.floor(requested || 0));
  if (stock === null || stock === undefined) return qty;
  return Math.min(qty, Math.max(0, Number(stock)));
}

exports.list = async (req, res) => {
  try {
    const userId = req.customer?.user_id;
    if (!userId) {
      return res.status(401).json({ success: false, message: '?????????????????' });
    }
    const items = await fetchCartItems(userId);
    res.json({ success: true, items });
  } catch (error) {
    console.error('Cart:list error', error);
    res.status(500).json({ success: false, message: '???????????????????????????' });
  }
};

exports.addItem = async (req, res) => {
  try {
    const userId = req.customer?.user_id;
    const { product_id, quantity = 1 } = req.body || {};

    if (!userId) {
      return res.status(401).json({ success: false, message: '?????????????????' });
    }
    if (!product_id) {
      return res.status(400).json({ success: false, message: '???????????????' });
    }
    const product = await ensureProduct(product_id);
    if (!product || product.status === 'inactive') {
      return res.status(404).json({ success: false, message: '???????????' });
    }

    const requestQty = Math.max(1, Math.floor(Number(quantity) || 1));
    const existing = await db('carts')
      .select('id', 'quantity')
      .where({ user_id: userId, product_id })
      .first();

    const totalRequested = (existing ? Number(existing.quantity) : 0) + requestQty;
    const maxAllowed = clampQuantity(totalRequested, product.quantity);

    if (maxAllowed <= 0) {
      return res.status(400).json({ success: false, message: '?????????????????' });
    }
    if (maxAllowed < totalRequested) {
      return res.status(400).json({ success: false, message: '??????????????????????????' });
    }

    if (existing) {
      await db('carts')
        .where({ id: existing.id })
        .update({ quantity: maxAllowed, updated_at: db.fn.now() });
    } else {
      await db('carts').insert({
        user_id: userId,
        product_id,
        quantity: maxAllowed,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      });
    }

    const items = await fetchCartItems(userId);
    res.json({ success: true, items });
  } catch (error) {
    console.error('Cart:addItem error', error);
    res.status(500).json({ success: false, message: '???????????????????????????????' });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const userId = req.customer?.user_id;
    const productId = Number(req.params.productId);
    const { quantity } = req.body || {};

    if (!userId) {
      return res.status(401).json({ success: false, message: '?????????????????' });
    }
    if (!productId) {
      return res.status(400).json({ success: false, message: '???????????????' });
    }
    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ success: false, message: '????????????????????' });
    }

    const existing = await db('carts')
      .select('id', 'quantity')
      .where({ user_id: userId, product_id: productId })
      .first();

    if (!existing) {
      return res.status(404).json({ success: false, message: '???????????????????' });
    }

    const product = await ensureProduct(productId);
    if (!product) {
      await db('carts').where({ id: existing.id }).del();
      const items = await fetchCartItems(userId);
      return res.status(404).json({ success: false, message: '???????????', items });
    }

    const desiredQty = clampQuantity(quantity, product.quantity);
    if (desiredQty <= 0) {
      await db('carts').where({ id: existing.id }).del();
      const items = await fetchCartItems(userId);
      return res.json({ success: true, items });
    }

    if (desiredQty < quantity) {
      return res.status(400).json({ success: false, message: '??????????????????????????' });
    }

    await db('carts')
      .where({ id: existing.id })
      .update({ quantity: desiredQty, updated_at: db.fn.now() });

    const items = await fetchCartItems(userId);
    res.json({ success: true, items });
  } catch (error) {
    console.error('Cart:updateItem error', error);
    res.status(500).json({ success: false, message: '?????????????????????????????' });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const userId = req.customer?.user_id;
    const productId = Number(req.params.productId);

    if (!userId) {
      return res.status(401).json({ success: false, message: '?????????????????' });
    }
    if (!productId) {
      return res.status(400).json({ success: false, message: '???????????????' });
    }

    await db('carts')
      .where({ user_id: userId, product_id: productId })
      .del();

    const items = await fetchCartItems(userId);
    res.json({ success: true, items });
  } catch (error) {
    console.error('Cart:removeItem error', error);
    res.status(500).json({ success: false, message: '????????????????????????????????' });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const userId = req.customer?.user_id;
    if (!userId) {
      return res.status(401).json({ success: false, message: '?????????????????' });
    }

    await db('carts').where({ user_id: userId }).del();
    res.json({ success: true, items: [] });
  } catch (error) {
    console.error('Cart:clearCart error', error);
    res.status(500).json({ success: false, message: '??????????????????????' });
  }
};
