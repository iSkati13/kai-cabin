#!/bin/bash

# Deploy Firestore Security Rules for Kai's Cabin
# This script deploys the security rules to Firebase

echo "🔒 Deploying Firestore Security Rules for Kai's Cabin..."

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    echo "firebase login"
    exit 1
fi

# Check if firebase project is initialized
if [ ! -f "firebase.json" ]; then
    echo "📁 Initializing Firebase project..."
    firebase init firestore
fi

# Deploy the security rules
echo "🚀 Deploying security rules..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo "✅ Security rules deployed successfully!"
    echo "🔍 You can verify the rules in the Firebase Console:"
    echo "https://console.firebase.google.com/project/kais-cabin-admin/firestore/rules"
else
    echo "❌ Failed to deploy security rules. Please check your Firebase configuration."
    exit 1
fi

echo ""
echo "🎉 Security setup complete!"
echo "📋 Next steps:"
echo "1. Configure HTTP referrer restrictions in Firebase Console"
echo "2. Test the booking form functionality"
echo "3. Monitor for any security alerts" 