const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password fields are required' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const query = `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING id, email
    `;
    
    const result = await db.query(query, [email, passwordHash]);
    return res.status(201).json({ 
      message: 'Registration complete', 
      user: result.rows[0] 
    });

  } catch (err) {
    console.error('Signup Error:', err.message);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'This email is already in use' });
    }
    return res.status(500).json({ error: 'Server error during signup.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const userQuery = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userQuery.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials provided' });
    }

    const user = userQuery.rows[0];
    const storedHash = user.password_hash || user.password || user.passwordHash;
    
    if (!storedHash) {
      return res.status(500).json({ error: 'Password configuration mismatch inside database data records' });
    }

    const isPasswordValid = await bcrypt.compare(password, storedHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials provided' });
    }

    const secretKey = process.env.JWT_SECRET || 'fallback_secret_key_for_local_dev';

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      secretKey,
      { expiresIn: '24h' }
    );

    return res.json({
      message: 'Welcome back!',
      token,
      user: { id: user.id, email: user.email }
    });

  } catch (err) {
    console.error('Login Error:', err.message);
    return res.status(500).json({ error: 'Server error during login.' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const userQuery = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userQuery.rows.length === 0) {
      return res.json({ message: 'If that email exists in our system, a recovery link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 3600000);

    await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
      [token, tokenExpires, email]
    );

    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
      }
    });

    const resetLink = `http://localhost:5173/reset-password?token=${token}`;

    await transporter.sendMail({
      from: '"Taskly Workspace Alerts" <security@taskly.com>',
      to: email,
      subject: "Taskly Account Security - Password Reset Request",
      html: `
        <div style="font-family: sans-serif; padding: 24px; color: #1f2937;">
          <h2 style="color: #10b981;">Taskly Recovery Center</h2>
          <p>We received a request to reset your workspace security credentials. Click the button below to establish a new password:</p>
          <a href="${resetLink}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; margin: 16px 0;">Reset My Password</a>
          <p style="font-size: 12px; color: #6b7280;">This secure link will automatically expire in 60 minutes. If you did not trigger this request, please disregard this alert transmission safely.</p>
        </div>
      `
    });

    return res.json({ message: 'If that email exists in our system, a recovery link has been sent.' });
  } catch (err) {
    console.error('Forgot Password Failure:', err);
    return res.status(500).json({ error: 'Internal recovery sequence error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password parameters are required' });

    const userQuery = await db.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > CURRENT_TIMESTAMP',
      [token]
    );

    if (userQuery.rows.length === 0) {
      return res.status(400).json({ error: 'Recovery link is invalid or has expired.' });
    }

    const user = userQuery.rows[0];
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    await db.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [newPasswordHash, user.id]
    );

    return res.json({ message: 'Credentials updated successfully. You can now log into your workspace!' });
  } catch (err) {
    console.error('Reset Password Failure:', err);
    return res.status(500).json({ error: 'Internal compilation reset error' });
  }
};

module.exports = { signup, login, forgotPassword, resetPassword };