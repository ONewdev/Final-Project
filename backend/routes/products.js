// routes/products.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const productDelete = require('../controllers/productDelete');

// ===== Create (มีอัปโหลดรูป) =====
router.post('/', productController.uploadProductImage, productController.addProduct);

// ===== Read =====
router.get('/', productController.getAllProducts);
router.get('/popular', productController.getPopularProducts); // ถ้าไม่ใช้ ลบได้
router.get('/next-code', productController.getNextProductCode); // ✅ ใช้โชว์รหัสถัดไป
router.get('/:id', productController.getProductById);

// ===== Update =====
router.patch('/:id', productController.uploadProductImage, productController.updateProduct);
router.patch('/:id/status', productController.updateProductStatus);

// ===== Delete =====
router.delete('/:id', productDelete.deleteProduct);

module.exports = router;
