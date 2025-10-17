const express = require('express');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Security
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
        styleSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "'unsafe-inline'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
        frameSrc: ["'self'", "https://www.google.com"],
        connectSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Serve static files
app.use(express.static('public'));
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Must be Gmail App Password
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
});

// ==============================
// /send-query route
// ==============================
app.post('/send-query', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'message'];
    const missingFields = requiredFields.filter(f => !req.body[f] || req.body[f].trim() === '');
    if (missingFields.length > 0) {
      return res.status(400).json({ success: false, error: `Missing required fields: ${missingFields.join(', ')}` });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format.' });
    }

    // Limit message length
    if (message.length > 1000) {
      return res.status(400).json({ success: false, error: 'Message is too long (max 1000 characters).' });
    }

    // Email content
    const mailOptions = {
      from: `"Website Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL || process.env.EMAIL_USER,
      subject: '📩 New Contact Form Query',
      html: `
        <h3>New Contact Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'Your message has been sent successfully!' });
  } catch (err) {
    console.error('❌ Error in /send-query:', err);
    res.status(500).json({ success: false, error: err.message || 'Server error. Please try again later.' });
  }
});

// ==============================
// /send-booking route
// ==============================
app.post('/send-booking', async (req, res) => {
  try {
    const { name, email, phone, destination, cab, travellers, bookingDate, message } = req.body;

    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'destination', 'cab', 'travellers', 'bookingDate'];
    const missingFields = requiredFields.filter(f => !req.body[f] || String(req.body[f]).trim() === '');
    if (missingFields.length > 0) {
      return res.status(400).json({ success: false, error: `Missing required fields: ${missingFields.join(', ')}` });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    // Format date
    const formattedDate = new Date(bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    // Email content
    const mailOptions = {
      from: `"DP Travels Booking" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL || process.env.EMAIL_USER,
      subject: `🧳 New Booking Request from ${name}`,
      html: `
        <p>New booking details:</p>
        <ul>
          <li>Name: ${name}</li>
          <li>Email: ${email}</li>
          <li>Phone: ${phone}</li>
          <li>Destination: ${destination}</li>
          <li>Cab: ${cab}</li>
          <li>Travellers: ${travellers}</li>
          <li>Booking Date: ${formattedDate}</li>
          ${message ? `<li>Message: ${message}</li>` : ''}
        </ul>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'Booking request sent successfully!' });
  } catch (err) {
    console.error('❌ Error in /send-booking:', err);
    res.status(500).json({ success: false, error: err.message || 'Server error. Please try again later.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
