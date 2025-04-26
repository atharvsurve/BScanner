const mongoose = require('mongoose');
const { cardSchema } = require('../models/Card'); // Import just the schema

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: String,
  role: {
    type: String,
    enum: ['user', 'admin'], // Only 'user' or 'admin' allowed
    default: 'user',         // Default is 'user'
  },
  businessCards: [cardSchema], // Use the imported schema
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
