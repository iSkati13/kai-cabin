# Kai's Cabin

A modern web application for managing reservations, guest bookings, and showcasing amenities for Kai's Cabin—a private resthouse getaway in Bulacan, Philippines.

---

## 🌟 Features
- Online booking form with reCAPTCHA v3 anti-spam
- Real-time calendar with blocked dates
- Email confirmation for guests
- Firestore database for reservations, amenities, and gallery
- Public gallery and amenities display
- Responsive, mobile-friendly design
- Secure backend API (Node.js, Vercel serverless)

---

## 🛠️ Tech Stack
- **Frontend:** HTML, CSS, Vanilla JS, Firebase JS SDK
- **Backend:** Node.js (Express-style), Vercel serverless functions
- **Database:** Firebase Firestore
- **Email:** Nodemailer (Gmail SMTP)
- **Security:** reCAPTCHA v3, Firestore Security Rules, CORS
- **Deployment:** Vercel (backend), GitHub Pages (frontend)

---

## 🚀 Getting Started

### 1. Clone the repo
```sh
git clone https://github.com/yourusername/kais-cabin.git
cd kais-cabin
```

### 2. Install backend dependencies
```sh
cd backend
npm install
```

### 3. Set up environment variables (backend)
Create a `.env` file in `backend/` with:
```
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-gmail-app-password
RECAPTCHA_SECRET_KEY=your-recaptcha-secret
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY_ID=...
FIREBASE_PRIVATE_KEY=... (use actual newlines)
FIREBASE_CLIENT_EMAIL=...
FIREBASE_CLIENT_ID=...
FIREBASE_AUTH_URI=...
FIREBASE_TOKEN_URI=...
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=...
FIREBASE_CLIENT_X509_CERT_URL=...
FIREBASE_UNIVERSE_DOMAIN=googleapis.com
```

### 4. Configure Firebase
- Set up Firestore and deploy security rules (`backend/firestore.rules`).
- Restrict API key usage to your domains in the Firebase Console.

### 5. Deploy
- **Backend:** Deploy `backend/` to Vercel (set root directory to `backend`).
- **Frontend:** Deploy static files (HTML, CSS, JS, assets) to GitHub Pages or your preferred static host.

---

## 🔒 Security Notes
- API keys are public but protected by domain restrictions and Firestore rules.
- All sensitive backend secrets are stored in environment variables (never committed).
- reCAPTCHA and backend rate limiting protect against spam/abuse.
- See `backend/SECURITY.md` and `backend/FIREBASE_SECURITY_ACTION_PLAN.md` for full details.

---

## 📋 Project Structure
```
kais-cabin/
├── backend/           # Vercel serverless backend
│   ├── api/           # API endpoints (submit-reservation, verify-recaptcha)
│   ├── tests/         # (Legacy) backend tests
│   ├── ...            # Config, scripts, docs
├── js/                # Frontend JS modules
├── css/               # CSS files
├── assets/            # Images, icons
├── favicon/           # Favicon and manifest
├── index.html         # Main frontend entry
├── README.md          # This file
```

---

## 👤 Contact
- **Author:** Jao Hendrick M. Esguerra
- **Email:** jaoesguerra4@gmail.com
- **GitHub:** [iskati13](https://github.com/iskati13)
- **Project:** [https://kais-cabin.vercel.app](https://kais-cabin.vercel.app)

---

## 📄 License
All rights reserved. This project is private and intended for portfolio/demo purposes only. 