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
    console.log("Received booking:", req.body); // 🔹 Debug log

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

    // Create email
    const mailOptions = {
      from: `"DP Travels Booking" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      subject: `🧳 New Booking Request from ${name}`,
      html: `
        <div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; background:#f8f9fb; padding:30px;">
          <div style="max-width:600px; margin:0 auto; background:#fff; border-radius:10px; box-shadow:0 2px 10px rgba(0,0,0,0.06); overflow:hidden;">
            <div style="background:linear-gradient(135deg,#0d47a1,#1976d2); padding:20px 25px;">
              <h2 style="color:#fff; margin:0; font-weight:600;">New Tour Booking Request</h2>
            </div>
            <div style="padding:25px;">
              <table style="width:100%; border-collapse:collapse;">
                <tr><td style="padding:8px 0;"><strong>👤 Name:</strong></td><td>${name}</td></tr>
                <tr><td style="padding:8px 0;"><strong>📧 Email:</strong></td><td>${email}</td></tr>
                <tr><td style="padding:8px 0;"><strong>📞 Phone:</strong></td><td>${phone}</td></tr>
                <tr><td style="padding:8px 0;"><strong>📍 Destination:</strong></td><td>${destination}</td></tr>
                <tr><td style="padding:8px 0;"><strong>🚗 Cab Type:</strong></td><td>${cab}</td></tr>
                <tr><td style="padding:8px 0;"><strong>👥 Travellers:</strong></td><td>${travellers}</td></tr>
                <tr><td style="padding:8px 0;"><strong>📅 Booking Date:</strong></td><td>${formattedDate}</td></tr>
                ${message ? `<tr><td style="padding:8px 0; vertical-align:top;"><strong>📝 Message:</strong></td><td>${message}</td></tr>` : ''}
              </table>
              <div style="margin-top:25px; text-align:center;">
                <a href="mailto:${email}" style="display:inline-block; padding:10px 20px; background:linear-gradient(135deg,#0d47a1,#1976d2); color:#fff; text-decoration:none; border-radius:8px; font-weight:500;">
                  Reply to ${name}
                </a>
              </div>
            </div>
            <div style="background:#f4f6f8; padding:15px 25px; text-align:center; font-size:0.9rem; color:#555;">
              This booking was submitted via <strong>DP Travels</strong> website.<br>
              <span style="font-size:0.85rem; color:#888;">© ${new Date().getFullYear()} DP Travels</span>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: 'Booking request sent successfully!' });
  } catch (err) {
    console.error("Error sending booking:", err);
    res.status(500).json({ success: false, error: 'Error submitting booking. Please try again later.', details: err.message });
  }
});



// ✅ Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
