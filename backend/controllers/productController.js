const db = require('../db'); 
const multer = require('multer');
const path = require('path');
const fs = require('fs');


const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });
const uploadProductImage = upload.single('image'); // ใช้กับ field name="image"


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
        'products.updated_at'
      );

    // ✅ เพิ่มเงื่อนไข filter หมวดหมู่ ถ้ามี
    if (category_id) {
      query = query.where('products.category_id', category_id);
    }
    // ✅ เพิ่ม filter สถานะ ถ้ามี
    if (status) {
      query = query.where('products.status', status);
    }

    const products = await query;

    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};



// 2. Add new product (พร้อมรูป)
const addProduct = async (req, res) => {
  try {
    const { product_code, name, description, category_id, price, quantity, status } = req.body;
    const imageUrl = req.file ? `/uploads/products/${req.file.filename}` : null;

    const newProduct = {
      product_code,
      name,
      description,
      category_id: category_id || null, // Ensure empty string becomes null if needed
      price,
      quantity,
      status,
      image_url: imageUrl,
    };

    // For MySQL/SQLite, this returns an array with the new ID, e.g., [123]
    const [insertedProductId] = await db('products').insert(newProduct);

    // Check if the insert was successful and we got an ID
    if (!insertedProductId) {
        throw new Error("Failed to insert product, no ID returned.");
    }

    const newlyAddedProduct = await db('products')
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
            'products.status'
        )
        // Correctly use the ID variable here
        .where('products.id', insertedProductId)
        .first();

    if (!newlyAddedProduct) {
        return res.status(404).json({ message: 'Could not find newly created product.'});
    }

    res.status(201).json(newlyAddedProduct);

  } catch (err) {
    // This will now log the detailed database error to your server console
    console.error("Error in addProduct:", err);
    res.status(500).json({ message: 'เพิ่มสินค้าไม่สำเร็จ', error: err.message });
  }
};





const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { product_code, name, description, category_id, price, quantity, status } = req.body;
  console.log(req.file); // ตรวจสอบว่ามีไฟล์อัปโหลดหรือไม่

  try {
    // เตรียมข้อมูลที่จะอัปเดต
    const updateData = {
      // allow updating product code as well
      product_code,
      name,
      description,
      // normalize empty string to null for optional foreign key
      category_id: category_id === '' ? null : category_id,
      price,
      quantity,
      status,
      updated_at: db.fn.now()
    };

    // ถ้ามีการอัปโหลดรูปใหม่ (req.file)
    if (req.file) {
      updateData.image_url = `/uploads/products/${req.file.filename}`;
    }

    await db('products').where({ id }).update(updateData);

    // ดึงข้อมูล product ที่อัปเดตล่าสุดส่งกลับไป
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
        'products.created_at',
        'products.updated_at'
      )
      .where('products.id', id)
      .first();

    if (!product) {
      return res.status(404).json({ message: 'ไม่พบสินค้านี้' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product by ID:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  uploadProductImage,
  getAllProducts,
  addProduct,
  updateProduct,
  updateProductStatus,
  getProductById
};
