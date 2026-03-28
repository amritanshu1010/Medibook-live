const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  name: { type: String },
  role: { type: String, default: 'patient' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
