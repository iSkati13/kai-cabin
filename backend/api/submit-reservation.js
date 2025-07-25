import nodemailer from 'nodemailer';
import { getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';

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
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        type: process.env.FIREBASE_TYPE,
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
        universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
      }),
    });
  }
  const firestore = getFirestore();
  const allowedOrigins = ['http://localhost:5500', 'https://iskati13.github.io'];
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  const { reservationData, recaptchaToken } = req.body;
  if (!recaptchaToken) {
    return res.status(400).json({ success: false, message: 'No reCAPTCHA token provided.' });
  }
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    return res.status(500).json({ success: false, message: 'Server misconfiguration: missing reCAPTCHA secret' });
  }
  try {
    const googleUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const googleBody = `secret=${secret}&response=${recaptchaToken}`;
    
    const recaptchaRes = await fetch(googleUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: googleBody
    });
    const recaptchaData = await recaptchaRes.json();
    
    if (!recaptchaData.success || recaptchaData.score < 0.5) {
      return res.status(400).json({ success: false, message: 'reCAPTCHA verification failed. Please refresh the page and try again.' });
    }
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentSubmissionsSnap = await firestore.collection('reservations')
      .where('email', '==', reservationData.email)
      .where('submittedAt', '>=', admin.firestore.Timestamp.fromDate(oneDayAgo))
      .orderBy('submittedAt', 'desc')
      .get();
    const submissions = recentSubmissionsSnap.docs.map(doc => doc.data());
    const submissionsLastHour = submissions.filter(sub => sub.submittedAt && sub.submittedAt.toDate() > oneHourAgo);
    if (submissionsLastHour.length >= 5) {
      return res.status(429).json({ success: false, message: 'You have reached the maximum of 5 reservation attempts per hour. Please wait before trying again.' });
    }
    if (submissions.length >= 20) {
      return res.status(429).json({ success: false, message: 'You have reached the maximum of 20 reservation attempts per day. Please try again tomorrow.' });
    }
    if (submissions.length > 0) {
      const lastSubmission = submissions[0].submittedAt.toDate();
      const minutesSinceLast = (now - lastSubmission) / (1000 * 60);
      if (minutesSinceLast < 1) {
        const waitMins = Math.ceil(1 - minutesSinceLast);
        return res.status(429).json({ success: false, message: `Please wait ${waitMins} more minute(s) before submitting another reservation.` });
      }
    }
    const duplicateQuery = await firestore.collection('reservations')
      .where('email', '==', reservationData.email)
      .where('checkin', '==', reservationData.checkin)
      .where('checkout', '==', reservationData.checkout)
      .get();
    if (!duplicateQuery.empty) {
      return res.status(429).json({ success: false, message: 'You have already submitted a reservation for these dates. If you need to make changes, please contact us.' });
    }
    await firestore.collection('reservations').add({
      ...reservationData,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
      approved: false
    });
    const { firstName, lastName, email, phone, address, guests, checkin, checkout } = reservationData;
    const receiptText = `Hi ${firstName},\n\nThank you for your reservation at Kai's Cabin! Here are your reservation details:\n\nName: ${firstName} ${lastName}\nEmail: ${email}\nPhone: ${phone}\nAddress: ${address}\nGuests: ${guests}\nCheck-in: ${checkin}\nCheck-out: ${checkout}\n\nIf you have any questions or need to make changes, please reply to this email.\n\nWe look forward to hosting you!\n\nBest regards,\nKai's Cabin Team`;
    const receiptHtml = `<p>Hi <b>${firstName}</b>,</p><p>Thank you for your reservation at <b>Kai's Cabin</b>! Here are your reservation details:</p><ul><li><b>Name:</b> ${firstName} ${lastName}</li><li><b>Email:</b> ${email}</li><li><b>Phone:</b> ${phone}</li><li><b>Address:</b> ${address}</li><li><b>Guests:</b> ${guests}</li><li><b>Check-in:</b> ${checkin}</li><li><b>Check-out:</b> ${checkout}</li></ul><p>If you have any questions or need to make changes, please reply to this email.</p><p>We look forward to hosting you!<br><b>Kai's Cabin Team</b></p>`;
    await transporter.sendMail({
      from: `"Kai's Cabin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reservation Confirmation – Kai\'s Cabin',
      text: receiptText,
      html: receiptHtml
    });
    return res.json({ success: true, message: 'Reservation submitted successfully!' });
  } catch (err) {
    console.error('Reservation submission error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}; 