const express = require('express');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const { Script } = require('vm');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Middleware


app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",  // ✅ allow Bootstrap or any JS from jsDelivr
        "https://cdnjs.cloudflare.com", // (optional) for other CDNs
        "'unsafe-inline'" // Optional: if you use inline JS (not recommended)
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
      imgSrc: ["'self'", "data:"],
      frameSrc: ["'self'", "https://www.google.com"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"]
    }
  }
}));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Required for form submissions
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

// ✅ Serve static files
app.use(express.static('public'));

// ✅ Root GET route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// ✅ Nodemailer transporter setup
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
});

// ✅ Contact form POST route
app.post('/send-query', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // ✅ Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'message'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // ✅ Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    // ✅ Send email
    await transporter.sendMail({
      from: `"Website Form" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      subject: `New Query from ${name}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Subject:</strong> Queries</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    });

    res.status(200).json({ success: true, message: 'Message sent successfully!' });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      error: 'Error sending message',
      details: error.message
    });
  }
});



// send gtk modal from


app.post('/send-gtk', async (req, res) => {
  try {
    const { Name, Email, Ctno, nofTravellers,veh} = req.body;

    // ✅ Validate required fields
    const requiredFields = ['Name', 'Email', 'Ctno', 'nofTravellers','veh'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // ✅ Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(Email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    // ✅ Send email
    await transporter.sendMail({
      from: `"Website Form" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      subject: `New Query from ${Name}`,
      html: `
        <h3>New Gtk Booking</h3>
         <p><strong>Subject:</strong> Gtk Boking</p>
        <p><strong>Name:</strong> ${Name}</p>
        <p><strong>Email:</strong> ${Email}</p>
        <p><strong>No Of Travellers:</strong> ${nofTravellers}</p>
        <p><strong>Vehicle Type:</strong> ${veh}</p>
        <p><strong>Phone:</strong> ${Ctno}</p>
       
      
      `
    });

    //res.status(200).json({ success: true, message: 'Message sent successfully!' });
    //res.send('<h2>Message sent successully. </h2><a href="/">Go  Back</a> <script> setTimeout () => { window.location.href="/"; }, 3000); </script>');\

    res.send(' <head><meta http-equiv="refresh" content="3; url=/" /> </head> <body><h2>Messsage sent...</h2></body>');

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      error: 'Error sending message',
      details: error.message
    });
  }
});




// send Pelling modal from


app.post('/send-pelling', async (req, res) => {
  try {
    const { Name, Email, Ctno, nofTravellers,veh} = req.body;

    // ✅ Validate required fields
    const requiredFields = ['Name', 'Email', 'Ctno', 'nofTravellers','veh'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // ✅ Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(Email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    // ✅ Send email
    await transporter.sendMail({
      from: `"Website Form" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      subject: `New Query from ${Name}`,
      html: `
        <h3>New pelling Booking</h3>
         <p><strong>Subject:</strong> Pelling Booking</p>
        <p><strong>Name:</strong> ${Name}</p>
        <p><strong>Email:</strong> ${Email}</p>
        <p><strong>No Of Travellers:</strong> ${nofTravellers}</p>
        <p><strong>Vehicle Type:</strong> ${veh}</p>
        <p><strong>Phone:</strong> ${Ctno}</p>
       
      
      `
    });

    //res.status(200).json({ success: true, message: 'Message sent successfully!' });
    //res.send('<h2>Message sent successully. </h2><a href="/">Go  Back</a> <script> setTimeout () => { window.location.href="/"; }, 3000); </script>');\

    res.send(' <head><meta http-equiv="refresh" content="3; url=/" /> </head> <body><h2>Messsage sent...</h2></body>');

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      error: 'Error sending message',
      details: error.message
    });
  }
});



// send zuluk modal from


app.post('/send-Zuluk', async (req, res) => {
  try {
    const { Name, Email, Ctno, nofTravellers,veh} = req.body;

    // ✅ Validate required fields
    const requiredFields = ['Name', 'Email', 'Ctno', 'nofTravellers','veh'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // ✅ Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(Email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    // ✅ Send email
    await transporter.sendMail({
      from: `"Website Form" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      subject: `New Query from ${Name}`,
      html: `
        <h3>New zuluk Booking</h3>
         <p><strong>Subject:</strong> Zuluk Booking</p>
        <p><strong>Name:</strong> ${Name}</p>
        <p><strong>Email:</strong> ${Email}</p>
        <p><strong>No Of Travellers:</strong> ${nofTravellers}</p>
        <p><strong>Vehicle Type:</strong> ${veh}</p>
        <p><strong>Phone:</strong> ${Ctno}</p>
       
      
      `
    });

    //res.status(200).json({ success: true, message: 'Message sent successfully!' });
    //res.send('<h2>Message sent successully. </h2><a href="/">Go  Back</a> <script> setTimeout () => { window.location.href="/"; }, 3000); </script>');\

    res.send(' <head><meta http-equiv="refresh" content="3; url=/" /> </head> <body><h2>Messsage sent...</h2></body>');

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      error: 'Error sending message',
      details: error.message
    });
  }
});


// send Namchi modal from


app.post('/send-namchi', async (req, res) => {
  try {
    const { Name, Email, Ctno, nofTravellers,veh} = req.body;

    // ✅ Validate required fields
    const requiredFields = ['Name', 'Email', 'Ctno', 'nofTravellers','veh'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // ✅ Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(Email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    // ✅ Send email
    await transporter.sendMail({
      from: `"Website Form" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      subject: `New Query from ${Name}`,
      html: `
        <h3>New namchi Booking</h3>
         <p><strong>Subject:</strong> Namchi Booking</p>
        <p><strong>Name:</strong> ${Name}</p>
        <p><strong>Email:</strong> ${Email}</p>
        <p><strong>No Of Travellers:</strong> ${nofTravellers}</p>
        <p><strong>Vehicle Type:</strong> ${veh}</p>
        <p><strong>Phone:</strong> ${Ctno}</p>
       
      
      `
    });

    //res.status(200).json({ success: true, message: 'Message sent successfully!' });
    //res.send('<h2>Message sent successully. </h2><a href="/">Go  Back</a> <script> setTimeout () => { window.location.href="/"; }, 3000); </script>');\

    res.send(' <head><meta http-equiv="refresh" content="3; url=/" /> </head> <body><h2>Messsage sent...</h2></body>');

  } 
  catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
    success: false,
    error: 'Error sending message',
    details: error.message
    });
  }
});


// send Gurudongmar modal from


app.post('/send-guru', async (req, res) => {
  try {
    const { Name, Email, Ctno, nofTravellers,veh} = req.body;

    // ✅ Validate required fields
    const requiredFields = ['Name', 'Email', 'Ctno', 'nofTravellers','veh'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // ✅ Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(Email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    // ✅ Send email
    await transporter.sendMail({
      from: `"Website Form" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      subject: `New Query from ${Name}`,
      html: `
        <h3>New gurudongmar Booking</h3>
         <p><strong>Subject:</strong> Gurudongmar Booking</p>
        <p><strong>Name:</strong> ${Name}</p>
        <p><strong>Email:</strong> ${Email}</p>
        <p><strong>No Of Travellers:</strong> ${nofTravellers}</p>
        <p><strong>Vehicle Type:</strong> ${veh}</p>
        <p><strong>Phone:</strong> ${Ctno}</p>
       
      
      `
    });

   //res.status(200).json({ success: true, message: 'Message sent successfully!' });
   //res.send('<h2>Message sent successully. </h2><a href="/">Go  Back</a> <script> setTimeout () => { window.location.href="/"; }, 3000); </script>');\

   res.send(' <head><meta http-equiv="refresh" content="3; url=/" /> </head> <body><h2>Messsage sent...</h2></body>');

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      error: 'Error sending message',
      details: error.message
    });
  }
});


// send Tsomgo modal from


app.post('/send-tsomo', async (req, res) => {
  try {
    const { Name, Email, Ctno, nofTravellers,veh} = req.body;

    // ✅ Validate required fields
    const requiredFields = ['Name', 'Email', 'Ctno', 'nofTravellers','veh'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // ✅ Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(Email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    // ✅ Send email
    await transporter.sendMail({
      from: `"Website Form" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      subject: `New Query from ${Name}`,
      html: `
        <h3>New Tsomgo Booking</h3>
         <p><strong>Subject:</strong> Tsomgo Booking</p>
        <p><strong>Name:</strong> ${Name}</p>
        <p><strong>Email:</strong> ${Email}</p>
        <p><strong>No Of Travellers:</strong> ${nofTravellers}</p>
        <p><strong>Vehicle Type:</strong> ${veh}</p>
        <p><strong>Phone:</strong> ${Ctno}</p>
       
      
      `
    });

    //res.status(200).json({ success: true, message: 'Message sent successfully!' });
    //res.send('<h2>Message sent successully. </h2><a href="/">Go  Back</a> <script> setTimeout () => { window.location.href="/"; }, 3000); </script>');\

    res.send(' <head><meta http-equiv="refresh" content="3; url=/" /> </head> <body><h2>Messsage sent...</h2></body>');

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      error: 'Error sending message',
      details: error.message
    });
  }
});



// ✅ Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});




