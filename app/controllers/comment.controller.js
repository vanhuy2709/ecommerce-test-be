const mongoose = require('mongoose');
const commentModel = require('../models/comment.model');
const productModel = require('../models/product.model');
const userModel = require('../models/user.model');

// Create Comment
const createComment = async (req, res) => {
  const { message, user, product, rating } = req.body;

  if (!message) {
    return res.status(400).json('Message is required');
  }
  if (!rating) {
    return res.status(400).json('Rating is required');
  }
  if (typeof rating !== 'number') {
    return res.status(400).json('Rating is must be a number');
  }
  if (rating < 0 || rating > 5) {
    return res.status(400).json('Rating is must be a value between 0 & 5');
  }
  if (!mongoose.Types.ObjectId.isValid(user)) {
    return res.status(400).json('User ID is not valid');
  }
  if (!mongoose.Types.ObjectId.isValid(product)) {
    return res.status(400).json('Product ID is not valid');
  }

  const userExist = await userModel.findOne({ _id: user })
  const productExist = await productModel.findOne({ _id: product });

  if (!userExist) {
    return res.status(404).json('User ID is not found');
  }
  if (!productExist) {
    return res.status(404).json('Product ID is not found');
  }

  const newComment = {
    message,
    rating,
    user,
    product
  }

  try {
    const comment = await commentModel.create(newComment);

    await reCalculateRatingOfProduct(comment.product);

    return res.status(201).json(comment);
  } catch (error) {
    // Error
    return res.status(500).json({
      message: 'Internal Server Error',
      error
    })
  }
}

// Get all Comment
const getAllComment = async (req, res) => {
  try {
    const commentList = await commentModel.find()
      .populate('user', ['name', 'email', 'phone'])
      .populate('product', ['name', 'image']);

    if (!commentList.length > 0) {
      return res.status(404).json("Don't have any comment")
    }
    return res.status(200).json(commentList);

  } catch (error) {
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// Get Comment by ID
const getCommentById = async (req, res) => {
  const commentId = req.params.commentId;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    return res.status(400).json('Comment ID is not valid')
  }

  try {
    const comment = await commentModel
      .findById(commentId)
      .populate('user', ['name', 'email', 'phone', 'isAdmin'])
      .populate('product', ['name', 'image'])

    if (!comment) {
      return res.status(404).json('Comment is not found')
    }

    return res.status(200).json(comment);
  } catch (error) {
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// Get Comment by User
const getCommentByUser = async (req, res) => {
  const userId = req.params.userId;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json('User ID is not valid')
  }

  try {
    const checkUser = await userModel.findOne({ _id: userId });
    if (!checkUser) {
      return res.status(404).json('User ID is not found');
    }

    const commentList = await commentModel
      .find({ user: userId })
      .select('message product createdAt')
      .populate('product', ['name', 'image'])

    return res.status(200).json({
      user: checkUser.name,
      data: commentList
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// Get Comment by Product
const getCommentByProduct = async (req, res) => {
  const productId = req.params.productId;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json('Product ID is not valid')
  }

  // Pagination
  let page = parseInt(req.query.page);
  let limit = parseInt(req.query.limit);
  let skip = (page - 1) * limit;

  try {
    const checkProduct = await productModel.findOne({ _id: productId });
    if (!checkProduct) {
      return res.status(404).json('Product ID is not found')
    }

    // Get List Comment (with Pagination)
    const commentList = await commentModel
      .find({ product: productId })
      .select('-product')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate('user', ['name', 'email', 'phone'])

    // Get List Comment of Product total
    const count = await commentModel
      .find({ product: productId })
      .select('-product')
      .populate('user', ['name', 'email', 'phone'])


    // Get Average Rating
    const averageRating = commentList.reduce((accumulator, currentValue) => {
      return accumulator + currentValue.rating;
    }, 0)

    return res.status(200).json({
      product: checkProduct.name,
      rating: Math.ceil(averageRating / commentList.length),
      numReviews: commentList.length,
      count: count.length,
      limit: limit,
      data: commentList,
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// Update Comment by ID
const updateCommentById = async (req, res) => {
  const commentId = req.params.commentId;
  const { message, rating } = req.body;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    return res.status(400).json('Comment ID is not valid')
  }
  if (!message) {
    return res.status(400).json('Message is required');
  }
  if (!rating) {
    return res.status(400).json('Rating is required');
  }

  const newComment = {
    message,
    rating
  }

  try {
    const comment = await commentModel.findByIdAndUpdate(commentId, newComment, { new: true });

    if (!comment) {
      return res.status(404).json('Comment ID is not found')
    }

    return res.status(200).json(comment)
  } catch (error) {
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error.message
    })
  }

}

// Delete Comment by ID
const deleteCommentById = async (req, res) => {
  const commentId = req.params.commentId;
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    return res.status(400).json('Comment ID is not valid')
  }

  try {
    const comment = await commentModel.findByIdAndDelete(commentId);

    if (!comment) {
      return res.status(404).json('Comment ID is not found');
    }

    await reCalculateRatingOfProduct(comment.product);

    return res.status(200).json('Delete Comment Success')
  } catch (error) {
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// Re-calculate Rating of Product
const reCalculateRatingOfProduct = async (productId) => {

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return false;
  }
  const productExist = await productModel.findOne({ _id: productId });
  if (!productExist) return false;

  // Get List Comment (with Pagination)
  const commentList = await commentModel.find({ product: productId })

  // Get List Comment of Product total
  const count = await commentModel.find({ product: productId })

  // Get Average Rating
  const averageRating = commentList.reduce((accumulator, currentValue) => {
    return accumulator + currentValue.rating;
  }, 0)

  const newProduct = {
    rating: Math.ceil(averageRating / commentList.length),
    numReviews: count.length
  }

  try {
    const product = await productModel.findByIdAndUpdate(
      productId,
      newProduct,
      { new: true }
    )

    if (!product) {
      return false;
    }

  } catch (error) {

    return false;
  }

}

module.exports = {
  createComment,
  getAllComment,
  getCommentById,
  getCommentByUser,
  getCommentByProduct,
  updateCommentById,
  deleteCommentById,
}