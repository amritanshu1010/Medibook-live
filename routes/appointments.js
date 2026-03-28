const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Appointment = require('../models/Appointment');

// Middleware to protect routes
const protect = (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Not authorized, no token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token failed' });
  }
};

// Get all appointments for logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user.id }).sort({ date: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching appointments' });
  }
});

// Book a new appointment
router.post('/', protect, async (req, res) => {
  try {
    const { doctorId, doctorName, doctorSpec, date, slot, fee, patient } = req.body;
    
    const newAppt = new Appointment({
      userId: req.user.id,
      doctorId,
      doctorName,
      doctorSpec,
      date,
      slot,
      fee,
      patient
    });

    const saved = await newAppt.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error booking appointment' });
  }
});

// Cancel appointment
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const appt = await Appointment.findOne({ _id: req.params.id, userId: req.user.id });
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    appt.status = 'cancelled';
    await appt.save();
    res.json(appt);
  } catch (err) {
    res.status(500).json({ error: 'Server error cancelling appointment' });
  }
});

module.exports = router;
