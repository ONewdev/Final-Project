// routes/contact.js
const express = require('express');
const router = express.Router();
const contact = require('../controllers/contactController');

// GET /api/contact
router.get('/', contact.getContact);

// POST /api/contact  (สร้างใหม่ หรืออัปเดตเรคคอร์ดเดียว หากมีอยู่แล้ว)
router.post('/', contact.uploadContactImages, contact.createContact);

// PUT /api/contact   (อัปเดตเรคคอร์ดเดียวแบบ singleton)
router.put('/', contact.uploadContactImages, contact.updateContact);

// PUT /api/contact/:id  (อัปเดตตาม id)
router.put('/:id', contact.uploadContactImages, contact.updateContactById);

module.exports = router;
