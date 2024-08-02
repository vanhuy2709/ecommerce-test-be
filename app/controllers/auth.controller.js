const mongoose = require('mongoose');
const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const logIn = async (req, res) => {
  const user = await userModel.findOne({ email: req.body.email });

  try {
    if (!user) {
      return res.status(404).json('The user not found')
    }

    if (user && bcrypt.compareSync(req.body.password, user.password)) {
      const token = jwt.sign(
        {
          userId: user._id,
          isAdmin: user.isAdmin
        },
        process.env.SECRET_KEY,
        { expiresIn: '1d' }
      )

      const { password, ...others } = user._doc;
      const infoUser = {
        ...others
      }

      return res.status(200).json({
        user: infoUser,
        token: token
      })
    } else {
      res.status(400).json('Password is wrong')
    }
  } catch (error) {
    return res.status(500).json({
      message: 'Internal Server Error',
      error
    })
  }
}

const registerUser = async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    isAdmin,
    address,
    city,
    country } = req.body;

  if (!name) {
    return res.status(400).json('Name is required');
  }
  if (!email) {
    return res.status(400).json('Email is required');
  }
  if (!password) {
    return res.status(400).json('Password is required');
  }
  if (!phone) {
    return res.status(400).json('Phone is required');
  }

  const userExistEmail = await userModel.findOne({ email });
  const userExistPhone = await userModel.findOne({ phone });
  if (userExistEmail) {
    return res.status(400).json('Email have been exist');
  }
  if (userExistPhone) {
    return res.status(400).json('Phone number have been exist');
  }

  const newUser = {
    name,
    email,
    password: bcrypt.hashSync(password, 10),
    phone,
    isAdmin,
    address,
    city,
    country
  }

  try {
    const user = await userModel.create(newUser);

    return res.status(201).json(user);

  } catch (error) {
    return res.status(500).json({
      message: 'Internal Server Error',
      error
    })
  }
}

module.exports = {
  logIn,
  registerUser
}