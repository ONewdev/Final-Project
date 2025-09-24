const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController.js');


router.get('/', notificationController.getNotificationsByCustomer);
router.post('/', notificationController.createNotification);
router.get('/unread_count', notificationController.getUnreadCountByCustomer);
router.post('/mark_read', notificationController.markAllReadByCustomer);
router.post('/:id/mark-read', notificationController.markReadById);
module.exports = router;
