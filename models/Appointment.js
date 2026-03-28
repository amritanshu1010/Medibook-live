const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  doctorId: { type: Number, required: true },
  doctorName: { type: String, required: true },
  doctorSpec: { type: String, required: true },
  date: { type: Date, required: true },
  slot: { type: String, required: true },
  fee: { type: Number, required: true },
  patient: {
    name: String,
    phone: String,
    email: String,
    age: String,
    reason: String
  },
  status: { type: String, default: 'upcoming' },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
