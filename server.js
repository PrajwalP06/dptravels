const express = require('express');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json()); // parse JSON body


// ✅ Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "'unsafe-inline'" // Only if absolutely necessary
      ],
      styleSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://fonts.googleapis.com",
        "'unsafe-inline'"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com"
      ],
      frameSrc: ["'self'", "https://www.google.com"],

      // ✅ FIXED: allow external connections for CDN `.map` requests
      connectSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com"
      ],

      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Optional: helps when loading external resources
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ✅ Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Rate limiting (prevents abuse)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false
}));

// ✅ Serve static files (e.g., HTML, CSS, JS)
app.use(express.static('public'));

// ✅ Root route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// ✅ Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 60000,
  rateLimit: 10
});// ✅ Contact form route
app.post("/send-query", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // ✅ Validate required fields
    const requiredFields = ["name", "email", "phone", "message"];
    const missingFields = requiredFields.filter(
      (field) => !req.body[field] || req.body[field].trim() === ""
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // ✅ Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format.",
      });
    }

    // ✅ Limit message length
    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: "Message is too long (max 1000 characters).",
      });
    }

    // ✅ Create transporter (configure with your email credentials)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // your email
        pass: process.env.EMAIL_PASS, // app password
      },
    });

    // ✅ Define email content
    const mailOptions = {
      from: `"Website Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL || process.env.EMAIL_USER,
      subject: "📩 New Contact Form Query",
      html: `
        <h3>New Contact Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    };

    // ✅ Send email
    await transporter.sendMail(mailOptions);

    // ✅ Respond to frontend
    res.json({
      success: true,
      message: "Your message has been sent successfully!",
    });
  } catch (err) {
    console.error("❌ Error in /send-query:", err);
    res.status(500).json({
      success: false,
      error: "Server error. Please try again later.",
    });
  }
});



app.post('/send-booking', async (req, res) => {
  try {
    console.log("Received booking:", req.body);

    const { name, email, phone, destination, cab, travellers, bookingDate, message } = req.body;

    // Required fields
    const requiredFields = ['name', 'email', 'phone', 'destination', 'cab', 'travellers', 'bookingDate'];
    const missingFields = requiredFields.filter(f => !req.body[f] || String(req.body[f]).trim() === '');
    if (missingFields.length > 0) {
      return res.status(400).json({ success: false, error: `Missing required fields: ${missingFields.join(', ')}` });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    // Format date
    const formattedDate = new Date(bookingDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    // Email content
    const mailOptions = {
      from: `"DP Travels Booking" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL || process.env.EMAIL_USER,
      subject: `🧳 New Booking Request from ${name}`,
      html: `<p>New booking details:</p>
             <ul>
               <li>Name: ${name}</li>
               <li>Email: ${email}</li>
               <li>Phone: ${phone}</li>
               <li>Destination: ${destination}</li>
               <li>Cab: ${cab}</li>
               <li>Travellers: ${travellers}</li>
               <li>Booking Date: ${formattedDate}</li>
               ${message ? `<li>Message: ${message}</li>` : ''}
             </ul>`
    };

    await transporter.sendMail(mailOptions);

    // Always respond with JSON
    res.status(200).json({ success: true, message: 'Booking request sent successfully!' });

  } catch (err) {
    console.error("Error sending booking:", err);

    // Catch any errors and respond with valid JSON
    res.status(500).json({
      success: false,
      error: 'Error submitting booking. Please try again later.',
      details: err.message || 'Unknown server error'
    });
  }
});



// ✅ Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
