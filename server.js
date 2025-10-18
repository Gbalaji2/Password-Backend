// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Health check
app.get('/api/health', (req, res) => {
  console.log('Health check ping');
  res.json({ ok: true });
});

// ✅ Base route
app.get('/', (req, res) => {
  res.send('Password reset backend is live 🚀');
});

// ✅ Auth routes
app.use('/api/auth', authRoutes);

// Port binding
const PORT = process.env.PORT || 5000;

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('MongoDB connected');
    console.log('Environment PORT:', PORT);
    // Start server after DB connection
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Mongo connection error:', err.message);
    process.exit(1); // Stop process if DB connection fails
  });
