const messageModel = require('../models/message.model');

// Create Message
const createMessage = async (req, res) => {
  const { chatId, senderId, text } = req.body;

  const message = new messageModel({
    chatId, senderId, text
  })

  try {
    const response = await message.save();

    return res.status(200).json(response);

  } catch (error) {
    return res.status(500).json({
      message: 'Internal Server Error',
      error
    })
  }
}

// Get Message
const getMessage = async (req, res) => {

  const { chatId } = req.params;

  try {
    const message = await messageModel.find({ chatId });

    return res.status(200).json(message);

  } catch (error) {
    return res.status(500).json({
      message: 'Internal Server Error',
      error
    })
  }

}


module.exports = { createMessage, getMessage };