# Firebase Setup Guide

## 🔥 Setting Up Firebase for Recipe Vault

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `recipe-vault` (or your preferred name)
4. Click "Continue"
5. Disable Google Analytics (optional) or keep it enabled
6. Click "Create project"

### Step 2: Register Your Web App

1. In the Firebase Console, click the **Web icon** (</>) to add a web app
2. Give your app a nickname: `Recipe Vault Web`
3. **Do NOT** check "Also set up Firebase Hosting"
4. Click "Register app"
5. You'll see your Firebase configuration - **copy these values**

### Step 3: Enable Authentication

1. In the left sidebar, click **"Authentication"**
2. Click **"Get started"**
3. Go to the **"Sign-in method"** tab
4. Enable **"Email/Password"**:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"
5. Enable **"Google"**:
   - Click on "Google"
   - Toggle "Enable" to ON
   - Select a support email
   - Click "Save"

### Step 4: Enable Firestore Database

1. In the left sidebar, click **"Firestore Database"**
2. Click **"Create database"**
3. Select **"Start in production mode"** (we'll add security rules later)
4. Choose a location (e.g., `us-central` or closest to your users)
5. Click "Enable"

### Step 5: Set Up Security Rules

1. In Firestore Database, go to the **"Rules"** tab
2. Replace the default rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own recipes
    match /users/{userId}/recipes/{recipeId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click **"Publish"**

### Step 6: Add Firebase Config to .env

Copy your Firebase configuration values and add them to `.env`:

```bash
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=recipe-vault-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=recipe-vault-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=recipe-vault-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### Step 7: Test the App

1. Start the dev server: `npm run dev`
2. Open http://localhost:5000
3. You should see the sign-in page
4. Try creating an account or signing in with Google!

## 🎉 What You Get

✅ **User Authentication**
- Email/password sign-up and sign-in
- Google Sign-In
- Secure session management

✅ **Protected Routes**
- Must be signed in to see recipes
- Automatic redirect to auth page

✅ **User Profile**
- Display user email/name
- Sign out button

## 🔜 Next Steps (Optional)

- Migrate recipes from local storage to Firestore
- Add recipe sharing between users
- Add user profile pictures
- Add password reset functionality

## 📝 Notes

- Your API keys are safe to expose in client-side code (they're designed for that)
- Security is enforced by Firebase Security Rules, not by hiding the config
- The `.env` file is in `.gitignore` to keep your keys out of version control
