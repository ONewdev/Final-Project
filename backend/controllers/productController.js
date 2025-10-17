const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('ไฟล์รูปต้องเป็น JPEG/PNG/WebP เท่านั้น'), ok);
  },
});
const uploadProductImage = upload.single('image');

// ================= Handlers =================

const getAllProducts = async (req, res) => {
  try {
    const { category_id, status } = req.query;

    let query = db('products')
      .leftJoin('category', 'products.category_id', 'category.category_id')
      .select(
        'products.id',
        'products.product_code',
        'products.name',
        'products.description',
        'products.category_id',
        'category.category_name as category_name',
        'products.price',
        'products.quantity',
        'products.image_url',
        'products.status',
        'products.created_at',
        'products.updated_at',
        'products.size',
        'products.color'
      );

    if (category_id) query = query.where('products.category_id', category_id);
    if (status) query = query.where('products.status', status);

    const products = await query;
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ✅ ใหม่: ใช้ “โชว์” โค้ดถัดไปในฟอร์มเท่านั้น (อาจเปลี่ยนได้เมื่อมีการเพิ่มพร้อมกันหลายคน)
const getNextProductCode = async (req, res) => {
  try {
    const row = await db('products')
      .where('product_code', 'like', 'PD-%')
      .max({ max_num: db.raw('CAST(SUBSTRING(product_code, 4) AS UNSIGNED)') })
      .first();

    const currentMax = Number(row?.max_num) || 0;
    const nextNumber = currentMax + 1;
    const nextCode = `PD-${String(nextNumber).padStart(4, '0')}`;

    res.json({ next_code: nextCode });
  } catch (err) {
    console.error('Error getNextProductCode:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ==== Add new product: ออกโค้ดอัตโนมัติ PD-0001, PD-0002, ... ====
const addProduct = async (req, res) => {
  try {
    const { name, description, category_id, price, quantity, status, size, color } = req.body;
    const imageUrl = req.file ? `/uploads/products/${req.file.filename}` : null;

    if (!name || price === undefined || quantity === undefined) {
      return res.status(400).json({ message: 'กรุณากรอก ชื่อสินค้า, ราคา และ จำนวน ให้ครบ' });
    }

    const row = await db('products')
      .where('product_code', 'like', 'PD-%')
      .max({ max_num: db.raw('CAST(SUBSTRING(product_code, 4) AS UNSIGNED)') })
      .first();

    const currentMax = Number(row?.max_num) || 0;
    const nextNumber = currentMax + 1;
    let product_code = `PD-${String(nextNumber).padStart(4, '0')}`;

    const newProduct = {
      product_code,
      name,
      description: description || null,
      category_id: category_id || null,
      price: Number(price),
      quantity: Number(quantity),
      status: status || 'active',
      image_url: imageUrl,
      size: size || null,
      color: color || null,
    };

    // กันชน Unique ซ้ำเล็กน้อย
    const MAX_RETRY = 3;
    let insertedId = null;

    for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
      try {
        const [id] = await db('products').insert(newProduct);
        insertedId = id;
        break;
      } catch (e) {
        if (e && e.code === 'ER_DUP_ENTRY') {
          const row2 = await db('products')
            .where('product_code', 'like', 'PD-%')
            .max({ max_num: db.raw('CAST(SUBSTRING(product_code, 4) AS UNSIGNED)') })
            .first();
          const n2 = (Number(row2?.max_num) || 0) + 1;
          newProduct.product_code = `PD-${String(n2).padStart(4, '0')}`;
          continue;
        }
        throw e;
      }
    }

    if (!insertedId) throw new Error('ไม่สามารถเพิ่มสินค้าได้ (insert ล้มเหลว)');

    const newlyAddedProduct = await db('products')
      .leftJoin('category', 'products.category_id', 'category.category_id')
      .select(
        'products.id',
        'products.product_code',
        'products.name',
        'products.description',
        'products.category_id',
        db.raw('category.category_name as category_name'),
        'products.price',
        'products.quantity',
        'products.image_url',
        'products.status',
        'products.size',
        'products.color',
        'products.created_at',
        'products.updated_at'
      )
      .where('products.id', insertedId)
      .first();

    return res.status(201).json(newlyAddedProduct);
  } catch (err) {
    console.error('Error in addProduct:', err);
    res.status(500).json({ message: 'เพิ่มสินค้าไม่สำเร็จ', error: err.message });
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, category_id, price, quantity, status, size, color } = req.body;

  try {
    const updateData = {
      name,
      description,
      category_id: category_id === '' ? null : category_id,
      price: price !== undefined ? Number(price) : undefined,
      quantity: quantity !== undefined ? Number(quantity) : undefined,
      status,
      updated_at: db.fn.now(),
      size,
      color
    };

    if (req.file) {
      updateData.image_url = `/uploads/products/${req.file.filename}`;
    }

    await db('products').where({ id }).update(updateData);

    const updatedProduct = await db('products')
      .leftJoin('category', 'products.category_id', 'category.category_id')
      .select(
        'products.id',
        'products.product_code',
        'products.name',
        'products.description',
        'products.category_id',
        'category.category_name as category_name',
        'products.price',
        'products.quantity',
        'products.image_url',
        'products.status',
        'products.size',
        'products.color',
        'products.created_at',
        'products.updated_at'
      )
      .where('products.id', id)
      .first();

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateProductStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await db('products')
      .where({ id })
      .update({ status, updated_at: db.fn.now() });

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating status:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await db('products')
      .leftJoin('category', 'products.category_id', 'category.category_id')
      .select(
        'products.id',
        'products.product_code',
        'products.name',
        'products.description',
        'products.category_id',
        'category.category_name as category_name',
        'products.price',
        'products.quantity',
        'products.image_url',
        'products.status',
        'products.size',
        'products.color',
        'products.created_at',
        'products.updated_at'
      )
      .where('products.id', id)
      .first();

    if (!product) return res.status(404).json({ message: 'ไม่พบสินค้านี้' });

    res.json(product);
  } catch (error) {
    console.error('Error fetching product by ID:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getPopularProducts = async (req, res) => {
  try {
    const rows = await db('products as p')
      .leftJoin('product_ratings as r', 'p.id', 'r.product_id')
      .leftJoin('category as c', 'p.category_id', 'c.category_id')
      .groupBy(
        'p.id',
        'p.product_code',
        'p.name',
        'p.description',
        'p.category_id',
        'c.category_name',
        'p.price',
        'p.quantity',
        'p.image_url',
        'p.status',
        'p.size',
        'p.color'
      )
      .select(
        'p.id',
        'p.product_code',
        'p.name',
        'p.description',
        'p.category_id',
        db.raw('c.category_name as category_name'),
        'p.price',
        'p.quantity',
        'p.image_url',
        'p.status',
        'p.size',
        'p.color',
        db.raw('COALESCE(AVG(r.rating), 0) as avg_rating'),
        db.raw('COUNT(r.id) as rating_count')
      )
      .orderBy([{ column: 'avg_rating', order: 'desc' }, { column: 'rating_count', order: 'desc' }])
      .limit(8);

    const products = rows.map(r => ({
      ...r,
      avg_rating: Number(r.avg_rating) || 0,
      rating_count: Number(r.rating_count) || 0,
    }));

    res.json(products);
  } catch (err) {
    console.error('Error fetching popular products:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  uploadProductImage,
  getAllProducts,
  getNextProductCode,      // ✅ export ใหม่
  addProduct,
  updateProduct,
  updateProductStatus,
  getProductById,
  getPopularProducts
};
