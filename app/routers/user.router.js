const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
// const middlewareController = require('../middlewares/verifyToken.middleware');

router.post('/', userController.createUser);

router.get('/', userController.getAllUser);
router.get('/:userId', userController.getUserById);

router.put('/change-password/:userId', userController.updatePasswordUserById);
router.put('/:userId', userController.updateUserById);

router.delete('/:userId', userController.deleteUserById);

module.exports = router;