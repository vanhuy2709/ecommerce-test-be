const mongoose = require('mongoose');
const orderModel = require('../models/order.model');
const orderItemModel = require('../models/orderItem.model');
const productController = require('../controllers/product.controller');
const nodemailer = require('nodemailer');

// Configure the transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // or another service if you're not using Gmail
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.APP_PASSWORD
  }
});

// Create Order
const createOrder = async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    city,
    country,
    phone,
    status,
    note,
    user,
  } = req.body;

  if (!shippingAddress) {
    return res.status(400).json('Shipping Address is required');
  }
  if (!city) {
    return res.status(400).json('City is required');
  }
  if (!country) {
    return res.status(400).json('Country is required');
  }
  if (!phone) {
    return res.status(400).json('Phone is required');
  }

  // Validate Quantity of Product (if quantity > product.countInStock => false)
  const checkValid = Promise.all(orderItems.map(async order => {
    return await productController.validateUpdateQuantityProductById(order.product, order.quantity);
  }))
  const checkValidResolved = await checkValid;
  if (checkValidResolved.includes(false)) {
    return res.status(400).json('Cant create order');
  }

  // If true => update countInStock Product
  orderItems.map(async order => {
    await productController.updateQuantityProductById(order.product, order.quantity);
  })

  // Create orderItems
  const orderItemsIds = Promise.all(orderItems.map(async item => {

    const newOrderItem = {
      quantity: item.quantity,
      product: item.product
    }
    const orderItem = await orderItemModel.create(newOrderItem);
    return orderItem._id;
    // C3:
    // let newOrderItem = new orderItemModel({
    //   quantity: orderItem.quantity,
    //   product: orderItem.product
    // })

    // newOrderItem = await newOrderItem.save();
    // return newOrderItem._id;
  }))

  const orderItemsIdsResolve = await orderItemsIds;

  // Sum Price
  const totalPrices = await Promise.all(orderItemsIdsResolve.map(async orderItemId => {
    const orderItem = await orderItemModel
      .findById(orderItemId)
      .populate('product', 'promotionPrice')

    const totalPrice = orderItem.product.promotionPrice * orderItem.quantity;

    return totalPrice;
  }))

  const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

  const newOrder = {
    orderItems: orderItemsIdsResolve,
    shippingAddress,
    city,
    country,
    phone,
    status,
    totalPrice: totalPrice.toFixed(2),
    note,
    user
  }

  try {
    const order = await orderModel.create(newOrder);

    await order.populate('user');

    const mailOptions = {
      from: {
        name: 'Ecommerce Shop',
        address: process.env.USER_EMAIL
      },
      to: [order.user.email],
      subject: 'Order Confirmation',
      html: `
      <p>
        Thank you for your order! Your Order ID: <b>${order._id}</b> has been received and is being processing.
      </p>
      <br/>
      <div>
        <span><b>Shipping Address:</b> ${order.shippingAddress}</span>
      <br/>
        <span><b>City:</b> ${order.city}</span>
      <br/>
        <span><b>District:</b> ${order.country}</span>
      <br/>
        <span><b>Your Phone Number:</b> ${order.phone}</span>
      <br/>
        <span><b>Total Price:</b> ${order.totalPrice}$</span>
      </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(201).json(order);

  } catch (error) {
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// Get all Order
const getAllOrder = async (req, res) => {

  try {
    const orderList = await orderModel
      .find()
      .populate('user', 'name')
      .sort({ 'dateOrdered': -1 });

    return res.status(200).json(orderList);

  } catch (error) {
    return res.status(500).json({
      message: 'Internal Server Error',
      error
    })
  }
}

// Get Order by ID
const getOrderById = async (req, res) => {
  const orderId = req.params.orderId;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json('Order ID is not valid')
  }

  try {
    const order = await orderModel
      .findById(orderId)
      .populate('user', 'name')
      .populate({
        path: 'orderItems', populate: {
          path: 'product', populate: 'category'
        }
      })

    if (!order) {
      return res.status(404).json('Order ID is not found');
    }

    return res.status(200).json(order);

  } catch (error) {
    return res.status(500).json({
      message: 'Internal Server Error',
      error
    })
  }
}

// Get Order Totalsales
const getOrderTotalSales = async (req, res) => {

  try {
    const totalSales = await orderModel.aggregate([
      { $group: { _id: null, totalsales: { $sum: '$totalPrice' } } }
    ])

    if (!totalSales) {
      return res.status(400).json('The order sales cannot be generated')
    }

    return res.status(200).json({
      totalsales: totalSales.pop().totalsales
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Internal Server Error',
      error
    })
  }
}

// Get Order Count
const getOrderCount = async (req, res) => {
  try {
    const orderCount = await orderModel.countDocuments();

    if (!orderCount) {
      return res.status(400).json('Cannot count orders')
    }

    return res.status(200).json({
      orderCount
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// Get User Order
const getUserAllOrder = async (req, res) => {

  let filter = {
    user: req.params.userId
  };

  // Filter by Status
  if (req.query.status) {
    filter = {
      ...filter,
      status: req.query.status
    }
  }

  // Pagination
  let page = parseInt(req.query.page);
  let limit = parseInt(req.query.limit);
  let skip = (page - 1) * limit;

  try {

    // Get list Order
    const userOrderList = await orderModel
      .find(filter)
      // .find({ user: req.params.userId })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'orderItems', populate: {
          path: 'product', populate: 'category'
        }
      })
      .sort({ 'dateOrdered': -1 });

    if (!userOrderList) {
      return res.status(404).json('User ID is not found')
    }

    // Get Count Order
    const count = await orderModel
      .find(filter)
      // .find({ user: req.params.userId })
      .populate({
        path: 'orderItems', populate: {
          path: 'product', populate: 'category'
        }
      })
      .sort({ 'dateOrdered': -1 });

    // Get Total Order
    const totalOrderByUser = await orderModel
      .find(filter)
      // .find({ user: req.params.userId })
      .countDocuments();

    return res.status(200).json({
      total: totalOrderByUser,
      count: count.length,
      limit: limit,
      data: userOrderList
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Internal Server Error',
      error
    })
  }
}

// Update Order by ID (Status)
const updateOrderStatusById = async (req, res) => {
  const orderId = req.params.orderId;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json('Order ID is not valid')
  }
  if (!status) {
    return res.status(400).json('Status is required');
  }

  try {
    const order = await orderModel.findByIdAndUpdate(
      orderId,
      {
        status
      },
      { new: true }
    )

    if (!order) {
      return res.status(404).json('Order ID is not found');
    }

    await order.populate('user');

    const mailOptions = {
      from: {
        name: 'Ecommerce Shop',
        address: process.env.USER_EMAIL
      },
      to: [order.user.email],
      subject: 'Delivered Your Order',
      // text: `Thank you for your order! Your order ID: ${order._id} has been delivered to you.`,
      html: `
      <p>Your order ID: ${order._id} has been delivered to you.</p>
      <br/>
      <div>
        <span><b>Shipping Address:</b> ${order.shippingAddress}</span>
      <br/>
        <span><b>City:</b> ${order.city}</span>
      <br/>
        <span><b>District:</b> ${order.country}</span>
      <br/>
        <span><b>Your Phone Number:</b> ${order.phone}</span>
      <br/>
        <span><b>Total Price:</b> ${order.totalPrice}$</span>
      </div>
      `
    };

    // await transporter.sendMail(mailOptions);

    return res.status(200).json(order);

  } catch (error) {
    return res.status(500).json({
      message: 'Internal Server Error',
      error
    })
  }
}

// Delete Order by ID
const deleteOrderById = async (req, res) => {
  const orderId = req.params.orderId;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json('Order ID is not valid')
  }

  try {
    const order = await orderModel.findByIdAndDelete(orderId);

    if (!order) {
      return res.status(404).json('Order ID is not found')
    }

    // If Cancel Order => Back quantity for product
    order.orderItems.map(async orderItem => {
      const checkOrderItem = await orderItemModel.findById(orderItem);
      await productController.backQuantityProductById(checkOrderItem.product, checkOrderItem.quantity);
    })

    // If Cancel Order => Delete Order Items
    order.orderItems.map(async orderItem => {
      await orderItemModel.findByIdAndDelete(orderItem);
    })

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
  createOrder,
  getAllOrder,
  getOrderById,
  updateOrderStatusById,
  deleteOrderById,
  getOrderTotalSales,
  getOrderCount,
  getUserAllOrder
}