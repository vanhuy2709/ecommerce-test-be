const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');

// POST
router.post('/', commentController.createComment);

// GET
router.get('/', commentController.getAllComment);
router.get('/get-user/:userId', commentController.getCommentByUser);
router.get('/get-product/:productId', commentController.getCommentByProduct);
router.get('/:commentId', commentController.getCommentById);

// PUT
router.put('/:commentId', commentController.updateCommentById)

// Delete
router.delete('/:commentId', commentController.deleteCommentById);

module.exports = router;