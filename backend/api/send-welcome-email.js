const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email required' });

  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_PASS = process.env.EMAIL_PASS;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `Kai's Cabin <${EMAIL_USER}>`,
      to: email,
      subject: "Welcome to Kai's Cabin Updates!",
      html: `
        <h2>Welcome to Kai's Cabin!</h2>
        <p>Thank you for subscribing. You'll receive news, promos, and updates from us.</p>
        <p>If you wish to unsubscribe at any time, <a href=\"https://iskati13.github.io/kais-cabin/unsubscribe.html?email=${encodeURIComponent(email)}\">click here</a>.</p>
      `,
    });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ success: false, message: 'Failed to send email' });
  }
}; 