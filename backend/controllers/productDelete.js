const db = require('../db');
const path = require('path');
const fs = require('fs');

// DELETE /api/products/:id with dependency checks
async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    const product = await db('products').where({ id }).first();
    if (!product) return res.status(404).json({ message: 'ไม่พบสินค้า' });

    // Check dependencies
    const [{ cnt: cartCount }] = await db('carts').where({ product_id: id }).count({ cnt: '*' }).catch(() => [{ cnt: 0 }]);
    const [{ cnt: orderItemCount }] = await db('order_items').where({ product_id: id }).count({ cnt: '*' }).catch(() => [{ cnt: 0 }]);
    const [{ cnt: ratingCount }] = await db('product_ratings').where({ product_id: id }).count({ cnt: '*' }).catch(() => [{ cnt: 0 }]);
    const [{ cnt: favoriteCount }] = await db('favorites').where({ product_id: id }).count({ cnt: '*' }).catch(() => [{ cnt: 0 }]);

    const inUse = {
      carts: Number(cartCount) || 0,
      order_items: Number(orderItemCount) || 0,
      product_ratings: Number(ratingCount) || 0,
      favorites: Number(favoriteCount) || 0,
    };

    if (inUse.carts > 0 || inUse.order_items > 0 || inUse.product_ratings > 0) {
      return res.status(409).json({
        error: `ไม่สามารถลบได้ เนื่องจากมีการอ้างอิงอยู่ (ตะกร้า: ${inUse.carts}, รายการสั่งซื้อ: ${inUse.order_items}, รีวิว: ${inUse.product_ratings})`,
        inUse,
      });
    }

    // Remove image file if exists
    if (product.image_url) {
      try {
        const publicRoot = path.join(__dirname, '..', 'public');
        const relPath = String(product.image_url).replace(/^\/+/, '');
        const fullPath = path.join(publicRoot, relPath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      } catch (_) {}
    }

    await db('products').where({ id }).del();
    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting product:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { deleteProduct };

