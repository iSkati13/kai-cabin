const allowedOrigins = ['http://localhost:5500', 'https://iskati13.github.io'];

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  const { token } = req.body;
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!token) {
    return res.status(400).json({ success: false, message: 'No token provided' });
  }
  if (!secret) {
    return res.status(500).json({ success: false, message: 'Server misconfiguration: missing reCAPTCHA secret' });
  }
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secret}&response=${token}`
    });
    const data = await response.json();
    if (data.success && data.score > 0.5) {
      res.json({ success: true, score: data.score });
    } else {
      res.status(400).json({ success: false, score: data.score, message: 'Failed reCAPTCHA', errors: data['error-codes'] });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}; 