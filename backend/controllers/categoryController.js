// controllers/categoryController.js
const db = require('../db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

/* ---------- ตั้งค่าโฟลเดอร์อัปโหลด ---------- */
const baseUploadDir = path.join(__dirname, '..', 'public', 'uploads');
const categoryUploadDir = path.join(baseUploadDir, 'categories');
if (!fs.existsSync(categoryUploadDir)) {
  fs.mkdirSync(categoryUploadDir, { recursive: true });
}

/* ---------- ตั้งค่า multer สำหรับรับรูป ---------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, categoryUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  },
});
const fileFilter = (req, file, cb) => {
  if (file?.mimetype?.startsWith('image/')) return cb(null, true);
  cb(new Error('Only image files are allowed'));
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/* ---------- helper ---------- */
function deleteIfExists(filename) {
  if (!filename) return;
  const full = path.join(categoryUploadDir, filename);
  if (fs.existsSync(full)) fs.unlinkSync(full);
}

/* =========================================
 *                 CRUD
 * ========================================= */
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await db('category')
      .select('category_id', 'category_name', 'image_url', db.raw('COALESCE(status, 1) AS status'))
      .orderBy('category_id', 'asc');
    res.json(categories);
  } catch (err) {
    console.error('Get Categories Error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่' });
  }
};

exports.addCategory = async (req, res) => {
  try {
    const { category_name } = req.body;
    if (!category_name || !String(category_name).trim()) {
      return res.status(400).json({ error: 'กรุณาระบุชื่อหมวดหมู่' });
    }

    const [category_id] = await db('category').insert({
      category_name: String(category_name).trim(),
      image_url: null, // อัปโหลดทีหลัง
    });

    const newCategory = await db('category')
      .select('category_id', 'category_name', 'image_url')
      .where({ category_id })
      .first();

    res.status(201).json(newCategory);
  } catch (err) {
    console.error('Add Category Error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name } = req.body;

    const exists = await db('category').where({ category_id: id }).first();
    if (!exists) return res.status(404).json({ error: 'ไม่พบหมวดหมู่ที่ต้องการแก้ไข' });

    await db('category')
      .where({ category_id: id })
      .update({ category_name: String(category_name || '').trim() });

    const updatedCategory = await db('category')
      .select('category_id', 'category_name', 'image_url')
      .where({ category_id: id })
      .first();

    res.json(updatedCategory);
  } catch (err) {
    console.error('Update Category Error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check dependencies: products referencing this category
    const [{ cnt: productCount }] = await db('products')
      .where({ category_id: id })
      .count({ cnt: '*' });
    if (Number(productCount) > 0) {
      return res.status(409).json({
        error: `ไม่สามารถลบได้ เนื่องจากมีสินค้าในหมวดหมู่นี้อยู่ ${productCount} รายการ กรุณาย้ายหรือลบสินค้าก่อน`,
        inUse: { products: Number(productCount) },
      });
    }

    const row = await db('category').where({ category_id: id }).first();
    if (!row) return res.status(404).json({ error: 'ไม่พบหมวดหมู่ที่ต้องการลบ' });

    try {
      // ลบ record (ถ้าติด FK จะ throw)
      await db('category').where({ category_id: id }).del();
      // ลบไฟล์รูป (ถ้าจะลบไฟล์ด้วยตอนลบหมวดหมู่)
      if (row.image_url) deleteIfExists(row.image_url);
      res.json({ success: true });
    } catch (e) {
      if (e && (e.code === 'ER_ROW_IS_REFERENCED_2' || e.errno === 1451)) {
        return res.status(409).json({
          error: 'ลบไม่ได้: มีข้อมูลที่เชื่อมโยงอยู่ (เช่น มีสินค้าอยู่ในหมวดหมู่นี้)',
        });
      }
      throw e;
    }
  } catch (err) {
    console.error('Delete Category Error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบหมวดหมู่' });
  }
};

/* =========================================
 *        อัปโหลด/ลบรูป (อยู่ไฟล์เดียวกัน)
 * ========================================= */

// middleware ของ multer (export ไว้ใช้ใน routes)
exports.uploadSingleImage = upload.single('image');

// POST /api/categories/:id/image
exports.uploadImage = async (req, res) => {
  try {
    const { id } = req.params;

    const cat = await db('category').where({ category_id: id }).first();
    if (!cat) {
      if (req.file?.filename) deleteIfExists(req.file.filename);
      return res.status(404).json({ error: 'ไม่พบหมวดหมู่' });
    }

    // ลบรูปเก่า ถ้ามี
    if (cat.image_url && cat.image_url !== req.file?.filename) {
      deleteIfExists(cat.image_url);
    }

    await db('category')
      .where({ category_id: id })
      .update({ image_url: req.file?.filename || null });

    const updated = await db('category')
      .select('category_id', 'category_name', 'image_url')
      .where({ category_id: id })
      .first();

    res.json(updated);
  } catch (err) {
    console.error('Upload category image error:', err);
    res.status(500).json({ error: 'อัปโหลดรูปภาพล้มเหลว' });
  }
};

// DELETE /api/categories/:id/image
exports.deleteImage = async (req, res) => {
  try {
    const { id } = req.params;

    const cat = await db('category').where({ category_id: id }).first();
    if (!cat) return res.status(404).json({ error: 'ไม่พบหมวดหมู่' });

    if (cat.image_url) deleteIfExists(cat.image_url);

    await db('category')
      .where({ category_id: id })
      .update({ image_url: null });

    const updated = await db('category')
      .select('category_id', 'category_name', 'image_url')
      .where({ category_id: id })
      .first();

    res.json(updated);
  } catch (err) {
    console.error('Delete category image error:', err);
    res.status(500).json({ error: 'ลบรูปภาพล้มเหลว' });
  }
};

// PATCH /api/categories/:id/status
exports.setCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let { status } = req.body || {};
    status = Number(status);
    if (!(status === 0 || status === 1)) {
      return res.status(400).json({ error: 'Invalid status. Expect 0 or 1.' });
    }

    const exists = await db('category').where({ category_id: id }).first();
    if (!exists) return res.status(404).json({ error: 'Category not found' });

    await db('category').where({ category_id: id }).update({ status });

    const updated = await db('category')
      .select('category_id', 'category_name', 'image_url', db.raw('COALESCE(status, 1) AS status'))
      .where({ category_id: id })
      .first();

    res.json(updated);
  } catch (err) {
    console.error('Set category status error:', err);
    res.status(500).json({ error: 'ไม่สามารถอัปเดตสถานะได้' });
  }
};
