require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Database Connection
const mongoURI = process.env.MONGO_URI;

if (!mongoURI || mongoURI.includes('REPLACE_ME')) {
  console.log('WARNING: Missing or default MONGO_URI in .env.');
  console.log('Starting server in static-only mode for frontend testing...');
  app.listen(PORT, () => console.log(`Static server running on port ${PORT}`));
} else {
  mongoose.connect(mongoURI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
  });
}
