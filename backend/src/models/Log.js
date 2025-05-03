const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  level: {
    type: String,
    required: true,
    enum: ['info', 'warning', 'error']
  },
  message: {
    type: String,
    required: true
  },
  details: {
    method: String,
    duration: Number,
    userAgent: String,
    ip: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Log', logSchema); 