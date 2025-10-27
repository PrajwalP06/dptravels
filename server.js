const express = require('express');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ========== MIDDLEWARE ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Security middleware
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

// ========== HEALTH CHECK ==========
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is alive!' });
});

// ========== NODEMAILER TRANSPORT ==========
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password (not normal password)
  },
});

// Verify transporter
transporter.verify((err, success) => {
  if (err) {
    console.error('❌ Email transporter error:', err.message);
  } else {
    console.log('✅ Email transporter ready');
  }
});

// ========== /send-query ==========
app.post('/send-query', async (req, res) => {
  try {
    console.log('📩 Received contact form:', req.body);
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({ success: false, error: 'All fields are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
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

    // Try sending mail safely
    await transporter.sendMail(mailOptions).catch(err => {
      console.error('❌ Mail send failed:', err.message);
      throw new Error('Mail sending failed. Check email credentials or Gmail App Password.');
    });

    return res.json({ success: true, message: 'Your message has been sent successfully!' });
  } catch (err) {
    console.error('❌ Error in /send-query:', err);
    // Always respond with JSON
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: 'Server error while sending email.',
        details: err.message,
      });
    }
  }
});

// ========== /send-booking ==========
app.post('/send-booking', async (req, res) => {
  try {
    console.log('🧾 Received booking:', req.body);
    const { name, email, phone, destination, cab, travellers, bookingDate, message } = req.body;

    if (!name || !email || !phone || !destination || !cab || !travellers || !bookingDate) {
      return res.status(400).json({ success: false, error: 'Missing required booking fields.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format.' });
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

    await transporter.sendMail(mailOptions).catch(err => {
      console.error('❌ Booking mail failed:', err.message);
      throw new Error('Failed to send booking email.');
    });

    return res.json({ success: true, message: 'Booking request sent successfully!' });
  } catch (err) {
    console.error('❌ Error in /send-booking:', err);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: 'Server error while processing booking.',
        details: err.message,
      });
    }
  }
});

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
