# Firebase Security Guide for Kai's Cabin

## 🔒 Security Overview

This document outlines the security measures implemented for Kai's Cabin's Firebase setup to ensure safe public deployment.

## 🚨 Important: API Key Security

### The Firebase API Key is NOT a Secret
- **Firebase API keys are designed to be public** and are safe to include in frontend code
- The API key alone cannot be used to access your data
- Security is enforced through **Firestore Security Rules** and **HTTP Referrer Restrictions**

### What Makes It Safe
1. **HTTP Referrer Restrictions** - API key only works from authorized domains
2. **Firestore Security Rules** - Server-side validation and access control
3. **Client-side validation** - Additional input sanitization and rate limiting
4. **reCAPTCHA integration** - Prevents automated abuse

## 🔧 Security Measures Implemented

### 1. HTTP Referrer Restrictions (CRITICAL)
**Action Required**: Set up in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/kais-cabin-admin/settings/general)
2. Navigate to Project Settings > General > Your Apps
3. Click on your web app
4. Under "Authorized domains", add:
   - `kaiscabin.com`
   - `www.kaiscabin.com`
   - `localhost` (for development)
   - `127.0.0.1` (for development)

### 2. Firestore Security Rules
**Status**: ✅ Implemented in `firestore.rules`

- **Public Collections** (`amenities`, `gallery`): Read-only access
- **Reservations**: Create-only with strict validation
- **Rate Limiting**: Max 3 submissions per hour per user
- **Input Validation**: All fields validated server-side

### 3. Client-Side Security
**Status**: ✅ Implemented in `booking.js`

- Input sanitization and validation
- Rate limiting (local storage)
- Suspicious content detection
- reCAPTCHA integration
- Business rule enforcement

### 4. Centralized Configuration
**Status**: ✅ Implemented

- Single source of truth in `js/firebase-config.js`
- Easy to update and maintain
- Consistent across all modules

## 🛡️ Additional Security Recommendations

### 1. Enable Firebase App Check (Optional but Recommended)
```javascript
// Add to your Firebase initialization
import { initializeAppCheck, reCAPTCHAEnterpriseProvider } from "firebase/app-check";

const appCheck = initializeAppCheck(app, {
  provider: reCAPTCHAEnterpriseProvider('your-recaptcha-site-key'),
  isTokenAutoRefreshEnabled: true
});
```

### 2. Monitor Usage
- Set up Firebase Usage Alerts
- Monitor for unusual activity
- Review logs regularly

### 3. Regular Security Audits
- Review security rules quarterly
- Update dependencies regularly
- Test rate limiting effectiveness

## 🔄 Regenerating API Key (If Needed)

If you need to regenerate the API key:

1. **Firebase Console**: Project Settings > General > Your Apps
2. **Regenerate API Key**: Click "Regenerate" next to the API key
3. **Update Configuration**: Replace the key in `js/firebase-config.js`
4. **Deploy**: Update your website with the new configuration

## 📋 Security Checklist

- [ ] HTTP Referrer restrictions configured
- [ ] Firestore security rules deployed
- [ ] Client-side validation implemented
- [ ] Rate limiting active
- [ ] reCAPTCHA integrated
- [ ] Input sanitization in place
- [ ] Monitoring alerts set up
- [ ] Regular security reviews scheduled

## 🚨 Emergency Contacts

If you suspect a security breach:
1. **Immediate**: Regenerate API key in Firebase Console
2. **Investigate**: Check Firebase logs for unusual activity
3. **Update**: Deploy new configuration
4. **Monitor**: Watch for continued suspicious activity

## 📚 Resources

- [Firebase Security Documentation](https://firebase.google.com/docs/rules)
- [Firebase Security Best Practices](https://firebase.google.com/docs/projects/api-keys)
- [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)

---

**Last Updated**: January 2025
**Next Review**: April 2025 