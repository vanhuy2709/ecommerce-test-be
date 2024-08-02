const mongoose = require('mongoose');
const categoryModel = require('../models/category.model');
const productModel = require('../models/product.model');

// Get all Category
const getAllCategory = async (req, res) => {
  try {
    const categoryList = await categoryModel.find();

    // Sum Product in Category
    const countProductbyCategory = Promise.all(categoryList.map(async category => {
      const countProduct = await productModel
        .find({ category: category._id })
        .countDocuments()

      return countProduct;
    }))
    const countProduct = await countProductbyCategory;

    if (!categoryList) {
      return res.status(404).json({
        success: false
      })
    }

    const listCategory = categoryList.map((category, index) => {
      return {
        ...category._doc,
        countProduct: countProduct[index]
      }
    })

    return res.status(200).json(listCategory);

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    })
  }
}

// Get Category by ID
const getCategoryById = async (req, res) => {
  const categoryId = req.params.categoryId;

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json('Category ID is not valid')
  }

  try {
    const category = await categoryModel.findById(categoryId);
    const listProductByCategory = await productModel
      .find({ category: categoryId })
      .countDocuments()

    if (!category) {
      return res.status(404).json('Category ID is not found')
    }

    return res.status(200).json({
      ...category._doc,
      countProduct: listProductByCategory
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error
    })
  }
}

// Create Category
const createCategory = async (req, res) => {
  const { name, icon, color } = req.body;

  if (!name) {
    return res.status(400).json('Name is required');
  }

  // Validate Upload File
  // const file = req.file;
  // if (!file) {
  //   return res.status(400).json('No Image in the request');
  // }
  // const fileName = req.file.filename;
  // const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

  const newCategory = {
    name,
    // icon: `${basePath}${fileName}`,
    icon,
    color
  }

  try {
    const category = await categoryModel.create(newCategory);

    return res.status(201).json(category);

  } catch (error) {
    return res.status(500).json({
      message: 'Internal Server Error',
      error
    })
  }
};

// Update Category
const updateCategoryById = async (req, res) => {
  const categoryId = req.params.categoryId;
  const { name, icon, color } = req.body;

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json({
      success: false,
      message: 'Category ID is not valid'
    })
  }
  if (!name) {
    return res.status(400).json('Name is required');
  }

  try {
    const category = await categoryModel.findByIdAndUpdate(
      categoryId,
      {
        name,
        icon,
        color,
      },
      { new: true }
    )

    if (!category) {
      return res.status(404).json(category);
    }

    return res.status(200).json(category);

  } catch (error) {
    return res.status(500).json({
      success: false,
      error
    })
  }
}

// Delete Category by ID
const deleteCategoryById = async (req, res) => {
  const categoryId = req.params.categoryId;

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json('Category ID is not valid')
  }

  try {
    const category = await categoryModel.findByIdAndDelete(categoryId);

    if (!category) {
      return res.status(404).json('Category ID is not found')
    }

    return res.status(200).json({
      success: true,
      message: 'Delete Successfully'
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      error
    })
  }
}

module.exports = {
  getAllCategory,
  getCategoryById,
  createCategory,
  updateCategoryById,
  deleteCategoryById
}