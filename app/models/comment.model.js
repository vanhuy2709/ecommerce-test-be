const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
}, {
  timestamps: true
})

module.exports = mongoose.model('Comment', commentSchema);