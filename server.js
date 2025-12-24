// =======================
// DP Travels Server (Nodemailer Gmail SMTP Version)
// =======================

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// =======================
// MIDDLEWARE
// =======================
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://www.dptravels.in",
      "https://dptravels.onrender.com",
    ],
    methods: ["GET", "POST"],
  })
);

// =======================
// SECURITY (Helmet)
// =======================
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// =======================
// RATE LIMITING
// =======================
app.use(
  rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 80, // limit each IP
    message: { success: false, error: "Too many requests. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// =======================
// STATIC & HEALTH ROUTES
// =======================
app.use(express.static("public"));
app.get("/", (req, res) => res.sendFile(__dirname + "/public/index.html"));
app.get("/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));

// =======================
// NODEMAILER (Gmail OAuth2) CONFIG
// =======================
const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

if (!EMAIL_ADDRESS || !CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.warn("⚠️ Missing Gmail OAuth2 credentials (EMAIL_ADDRESS, CLIENT_ID, etc.) in environment variables!");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: EMAIL_ADDRESS,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    refreshToken: REFRESH_TOKEN,
  },
});

// Send to yourself by default
const RECEIVER_EMAIL = process.env.RECEIVER_EMAIL || EMAIL_ADDRESS;

// =======================
// Helper - Send Email (with retry)
// =======================
async function sendEmailWithRetry(mailOptions, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await transporter.sendMail(mailOptions);
      return true;
    } catch (err) {
      console.error(`[ERROR] Attempt ${attempt} failed:`, err.message);
      if (attempt < retries) {
        console.log("Retrying in 2 seconds...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } else {
        throw err;
      }
    }
  }
}

// =======================
// /send-query
// =======================
app.post("/send-query", async (req, res) => {
  console.log("[INFO] /send-query called:", req.body);

  const { name, email, phone, message } = req.body;
  if (!name || !email || !phone || !message) {
    return res.status(400).json({ success: false, error: "All fields are required." });
  }

  try {
    await sendEmailWithRetry({
      from: `DP Travels <${EMAIL_ADDRESS}>`,
      to: RECEIVER_EMAIL,
      subject: "📩 New Contact Form Query",
      html: `
        <h3>New Contact Message</h3>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Message:</b> ${message}</p>
        <hr>
        <p style="font-size:12px;color:#555;">Sent automatically from DP Travels website.</p>
      `,
    });

    console.log("[SUCCESS] Contact email sent ✅");
    res.status(200).json({ success: true, message: "Your message has been sent successfully!" });
  } catch (error) {
    console.error("[ERROR] /send-query failed:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to send email.", details: error.message });
  }
});

// =======================
// /send-booking
// =======================
app.post("/send-booking", async (req, res) => {
  console.log("[INFO] /send-booking called:", req.body);

  const { name, email, phone, destination, cab, travellers, bookingDate, message } = req.body;
  if (!name || !email || !phone || !destination || !cab || !travellers || !bookingDate) {
    return res.status(400).json({ success: false, error: "Missing required booking fields." });
  }

  const formattedDate = new Date(bookingDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  try {
    await sendEmailWithRetry({
      from: `DP Travels <${EMAIL_ADDRESS}>`,
      to: RECEIVER_EMAIL,
      subject: `🧳 New Booking Request from ${name}`,
      html: `
      <div style="padding:30px;">
        <p style="font-size:16px; color:#333;">You’ve received a new booking request from <b>${name}</b>.</p>

        <table style="width:100%; border-collapse:collapse; margin-top:15px;">
          <tbody>
            <tr><td style="padding:8px 0; color:#555;"><b>Name:</b></td><td style="padding:8px 0; color:#111;">${name}</td></tr>
            <tr><td style="padding:8px 0; color:#555;"><b>Email:</b></td><td style="padding:8px 0; color:#111;">${email}</td></tr>
            <tr><td style="padding:8px 0; color:#555;"><b>Phone:</b></td><td style="padding:8px 0; color:#111;">${phone}</td></tr>
            <tr><td style="padding:8px 0; color:#555;"><b>Destination:</b></td><td style="padding:8px 0; color:#111;">${destination}</td></tr>
            <tr><td style="padding:8px 0; color:#555;"><b>Cab:</b></td><td style="padding:8px 0; color:#111;">${cab}</td></tr>
            <tr><td style="padding:8px 0; color:#555;"><b>Travellers:</b></td><td style="padding:8px 0; color:#111;">${travellers}</td></tr>
            <tr><td style="padding:8px 0; color:#555;"><b>Booking Date:</b></td><td style="padding:8px 0; color:#111;">${formattedDate}</td></tr>
            ${message
          ? `<tr><td style="padding:8px 0; color:#555; vertical-align:top;"><b>Message:</b></td><td style="padding:8px 0; color:#111;">${message}</td></tr>`
          : ""
        }
          </tbody>
        </table>

        <div style="margin-top:30px; text-align:center;">
          <a href="mailto:${email}" style="display:inline-block; background-color:#2dd4bf; color:#0f172a; text-decoration:none; padding:10px 20px; border-radius:6px; font-weight:600;">Reply to Customer</a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color:#f8fafc; padding:15px 30px; text-align:center; font-size:13px; color:#64748b; border-top: 1px solid #e2e8f0;">
        <p style="margin:0;">Sent automatically from <b>DP Travels</b></p>
        <p style="margin:4px 0 0;">www.dptravels.in</p>
      </div>
`,
    });

    console.log("[SUCCESS] Booking email sent ✅");
    res.status(200).json({ success: true, message: "Booking request sent successfully!" });
  } catch (error) {
    console.error("[ERROR] /send-booking failed:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to send booking email.", details: error.message });
  }
});

// =======================
// GLOBAL ERROR HANDLER
// =======================
app.use((err, req, res, next) => {
  console.error("💥 Unexpected error:", err);
  res.status(500).json({ success: false, error: "Internal server error." });
});

// =======================
// START SERVER
// =======================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 DP Travels server running on port ${PORT}`);
});
