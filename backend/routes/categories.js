// routes/category.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/categoryController');

// CRUD
router.get('/', ctrl.getAllCategories);
router.post('/', ctrl.addCategory);
router.patch('/:id', ctrl.updateCategory);
router.delete('/:id', ctrl.deleteCategory);
router.patch('/:id/status', ctrl.setCategoryStatus);

// รูปภาพ (field: image)
router.post('/:id/image', ctrl.uploadSingleImage, ctrl.uploadImage);
router.delete('/:id/image', ctrl.deleteImage);

module.exports = router;
