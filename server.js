// =======================
// DP Travels Server
// =======================

const express = require('express');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// =======================
// MIDDLEWARE
// =======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: ['http://localhost:3000', 'https://www.dptravels.in', 'https://dptravels.onrender.com'],
  methods: ['GET', 'POST'],
}));

// =======================
// SECURITY (Helmet)
// =======================
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com",
          "'unsafe-inline'",
        ],
        styleSrc: [
          "'self'",
          "https://cdn.jsdelivr.net",
          "https://fonts.googleapis.com",
          "'unsafe-inline'",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
        frameSrc: ["'self'", "https://www.google.com"],
        connectSrc: [
          "'self'",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com",
          "https://www.dptravels.in",
          "https://dptravels.onrender.com",
          "http://localhost:3000",
        ],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// =======================
// RATE LIMITING
// =======================
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

// =======================
// STATIC & HEALTH ROUTES
// =======================
app.use(express.static('public'));
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));
app.get('/health', (req, res) => res.json({ status: 'ok', message: 'Server alive' }));

// =======================
// NODEMAILER CONFIG
// =======================
console.log('[INIT] Initializing Nodemailer...');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use Gmail App Password
  },
});

transporter.verify((err, success) => {
  if (err) console.error('[ERROR] Email transporter failed:', err);
  else console.log('[SUCCESS] Email transporter ready ✅');
});

// =======================
// DEBUG HELPER
// =======================
const debugLog = (label, data) => {
  console.log(`[DEBUG] ${label}:`, typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
};

// =======================
// /send-query
// =======================
app.post('/send-query', async (req, res) => {
  console.log('\n====================');
  console.log('[INFO] /send-query request received');
  debugLog('Body', req.body);

  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
      console.warn('[WARN] Missing required fields');
      return res.status(400).json({ success: false, error: 'All fields are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.warn('[WARN] Invalid email format');
      return res.status(400).json({ success: false, error: 'Invalid email format.' });
    }

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

    debugLog('Mail options', mailOptions);
    console.log('[INFO] Sending email...');

    await transporter.sendMail(mailOptions);
    console.log('[SUCCESS] Email sent successfully ✅');

    return res.status(200).json({ success: true, message: 'Your message has been sent successfully!' });
  } catch (err) {
    console.error('[ERROR] /send-query failed:', err);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send email.',
        details: err.message,
      });
    }
  }
});

// =======================
// /send-booking
// =======================
app.post('/send-booking', async (req, res) => {
  console.log('\n====================');
  console.log('[INFO] /send-booking request received');
  debugLog('Body', req.body);

  try {
    const { name, email, phone, destination, cab, travellers, bookingDate, message } = req.body;

    if (!name || !email || !phone || !destination || !cab || !travellers || !bookingDate) {
      console.warn('[WARN] Missing booking fields');
      return res.status(400).json({ success: false, error: 'Missing required booking fields.' });
    }

    const formattedDate = new Date(bookingDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

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

    debugLog('Mail options', mailOptions);
    console.log('[INFO] Sending booking email...');

    await transporter.sendMail(mailOptions);
    console.log('[SUCCESS] Booking email sent ✅');

    return res.status(200).json({ success: true, message: 'Booking request sent successfully!' });
  } catch (err) {
    console.error('[ERROR] /send-booking failed:', err);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send booking email.',
        details: err.message,
      });
    }
  }
});

// =======================
// START SERVER
// =======================
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log('🌐 Base URL:', process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`);
});
