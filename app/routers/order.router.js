const express = require('express');
const orderController = require('../controllers/order.controller');
const router = express.Router();

router.post('/', orderController.createOrder);
router.get('/', orderController.getAllOrder);
router.get('/get/totalsales', orderController.getOrderTotalSales);
router.get('/get/count', orderController.getOrderCount);
router.get('/get/userorders/:userId', orderController.getUserAllOrder);
router.get('/:orderId', orderController.getOrderById);
router.put('/:orderId', orderController.updateOrderStatusById);
router.delete('/:orderId', orderController.deleteOrderById);

module.exports = router;