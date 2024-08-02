const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { uploadOptions } = require('../middlewares/uploadOptions.middleware');

router.get('/', categoryController.getAllCategory);
router.get('/:categoryId', categoryController.getCategoryById);

router.post('/', uploadOptions.single('icon'), categoryController.createCategory);

router.put('/:categoryId', categoryController.updateCategoryById);

router.delete('/:categoryId', categoryController.deleteCategoryById);

module.exports = router;