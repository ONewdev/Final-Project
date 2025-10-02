// routes/contactInfoRoutes.js
const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');


router.get('/', contactController.getContact);
router.put('/', contactController.uploadQrImage, contactController.updateContact);
router.post('/', contactController.uploadQrImage, contactController.createContact);
router.put('/:id', contactController.uploadQrImage, contactController.updateContactById);

module.exports = router;
