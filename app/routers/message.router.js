const express = require('express');
const messageController = require('../controllers/message.controller');

const router = express.Router();

router.post('/', messageController.createMessage);
router.get('/:chatId', messageController.getMessage);

module.exports = router;