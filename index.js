// Import Library
const express = require('express');
const dotenv = require('dotenv').config();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const authJwt = require('./app/helpers/jwt');
const errorHandler = require('./app/helpers/errorHandler');

// Import Router
const productsRouter = require('./app/routers/product.route');
const categoryRouter = require('./app/routers/category.router');
const userRouter = require('./app/routers/user.router');
const authRouter = require('./app/routers/auth.router');
const orderRouter = require('./app/routers/order.router');
const commentRouter = require('./app/routers/comment.router');
const chatRouter = require('./app/routers/chat.router');
const messageRouter = require('./app/routers/message.router');

// App Initial
const app = express();

// Use bodyParser
app.use(cors());
app.options('*', cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use(authJwt());
app.use('/public/uploads', express.static(__dirname + '/public/uploads'))
app.use(errorHandler)

// Port
const port = process.env.PORT || 8000;

// Connect to MongoDB Database
mongoose
  .connect(process.env.CONNECTION_STRING_MONGO_DB)
  .then(() => {
    console.log('Database Connection is ready...');
  })
  .catch(err => {
    console.log(err);
  })

// Routers
app.use('/api/products', productsRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/orders', orderRouter);
app.use('/api/comments', commentRouter);
app.use('/api/chats', chatRouter);
app.use('/api/messages', messageRouter);

// Start server
app.listen(port, () => {
  console.log('Server is running on port: ', port);
})