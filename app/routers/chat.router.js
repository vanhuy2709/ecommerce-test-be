const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');


router.post('/', chatController.createChat);
router.get('/:userId', chatController.findUserChats);
router.get('/find/:firstId/:secondId', chatController.findChat);

module.exports = router;