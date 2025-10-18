const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const sendResetEmail = async (to, resetURL) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',       // Gmail SMTP host
    port: 587,                    // TLS port
    secure: false,                // TLS (false for 587)
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS // Gmail App Password
    }
  });

  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.6;">
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password. This link will expire in 15 minutes.</p>
      <p><a href="${resetURL}">Reset your password</a></p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: 'Password Reset',
    html
  });
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate reset token and expiry
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expiry;
    await user.save();

    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    try {
      // Try sending email
      await sendResetEmail(user.email, resetURL);
      res.json({ message: 'Password reset link sent to your email' });
    } catch (emailErr) {
      // Email failed, but still return token for testing
      console.error('Email sending failed:', emailErr);
      res.json({
        message: 'Password reset token generated (email failed)',
        token // <-- useful for testing Postman & frontend
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    console.log('Validating token:', token); // ✅ for Postman testing

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.log('Token invalid or expired');
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    console.log('Token is valid for user:', user.email);
    res.json({ message: 'Token is valid', email: user.email }); // optional email for testing
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    console.log('Resetting password for token:', token);

    if (!password) return res.status(400).json({ message: 'Password is required' });

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.log('Token invalid or expired');
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log('Password reset successfully for user:', user.email);

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  register,
  forgotPassword,
  validateResetToken,
  resetPassword
};
