// backend/routes/chat.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.get('/contacts', chatController.getContacts);
router.get('/', chatController.getMessages);
router.post('/', chatController.sendMessage);
router.get('/unread-count', chatController.getUnreadCount);
router.post('/mark-read', chatController.markRead);

module.exports = router;
