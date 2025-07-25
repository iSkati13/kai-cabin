import admin from 'firebase-admin';

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
const db = admin.firestore();

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

  try {
    const snapshot = await db.collection('subscriptions').where('email', '==', email).get();
    if (snapshot.empty) {
      return res.status(200).json({ success: true }); // Already unsubscribed
    }
    const batch = db.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Unsubscribe error:', err);
    res.status(500).json({ success: false, message: 'Failed to unsubscribe' });
  }
} 