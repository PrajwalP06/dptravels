// =======================
// DP Travels Server (Enhanced Resend API Version)
// =======================

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const { Resend } = require("resend");
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
// RESEND CONFIG
// =======================
if (!process.env.RESEND_API_KEY) {
  console.warn("⚠️ Missing RESEND_API_KEY in environment variables!");
}

const resend = new Resend(process.env.RESEND_API_KEY);
const SENDER_EMAIL = process.env.SENDER_EMAIL || "noreply@dptravels.in";
const RECEIVER_EMAIL = process.env.RECEIVER_EMAIL || SENDER_EMAIL;

// =======================
// Helper - Send Email (with retry)
// =======================
async function sendEmailWithRetry(emailData, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await resend.emails.send(emailData);
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
      from: `DP Travels <${SENDER_EMAIL}>`,
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
      from: `DP Travels <${SENDER_EMAIL}>`,
      to: RECEIVER_EMAIL,
      subject: `🧳 New Booking Request from ${name}`,
      html: `
        <h3>New Booking Request</h3>
        <ul>
          <li><b>Name:</b> ${name}</li>
          <li><b>Email:</b> ${email}</li>
          <li><b>Phone:</b> ${phone}</li>
          <li><b>Destination:</b> ${destination}</li>
          <li><b>Cab:</b> ${cab}</li>
          <li><b>Travellers:</b> ${travellers}</li>
          <li><b>Booking Date:</b> ${formattedDate}</li>
          ${message ? `<li><b>Message:</b> ${message}</li>` : ""}
        </ul>
        <hr>
        <p style="font-size:12px;color:#555;">Sent automatically from DP Travels website.</p>
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
app.listen(PORT, () => {
  console.log(`🚀 DP Travels server running on port ${PORT}`);
});
