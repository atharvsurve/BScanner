// models/Card.js
const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  company: { type: String, required: true },
  website: { type: String, required: false },
  createdAt: { type: Date, default: Date.now }
});

const Card = mongoose.model('Card', cardSchema);

// Export both the model and schema
module.exports = {
  Card, 
  cardSchema
};