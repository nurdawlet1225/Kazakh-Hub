# 🔧 Firebase API Key Error - Step-by-Step Fix

## Current Error
```
Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.)
```

## Quick Fix Steps

### Step 1: Verify API Key in Firebase Console

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/
   - Sign in with your Google account
   - Select project: **kazakh-hub**

2. **Get Your Web App Configuration**
   - Click the **gear icon (⚙️)** next to "Project Overview"
   - Click **Project settings**
   - Scroll down to **"Your apps"** section
   - Find your web app (or create one if it doesn't exist)
   - Click the **</>** icon to view the config

3. **Copy the API Key**
   - Look for `apiKey` in the config snippet
   - It should look like: `AIzaSy...` (about 39 characters long)
   - **Compare it with your `.env` file**

### Step 2: Update Your .env File

1. **Open** `frontend/.env` file
2. **Replace** the `VITE_FIREBASE_API_KEY` value with the one from Firebase Console
3. **Save** the file

### Step 3: Fix API Key Restrictions in Google Cloud Console

This is the **most common cause** of this error!

1. **Open Google Cloud Console**
   - Go to: https://console.cloud.google.com/
   - Make sure you're in the **kazakh-hub** project

2. **Navigate to API Key Settings**
   - Click **APIs & Services** in the left menu
   - Click **Credentials**
   - Find your API key (starts with `AIza...`)
   - **Click on the API key name** to edit it

3. **Fix API Restrictions**
   - Under **"API restrictions"**:
     - Select **"Restrict key"**
     - Make sure these APIs are checked:
       - ✅ **Identity Toolkit API** (Firebase Authentication)
       - ✅ **Cloud Firestore API**
       - ✅ **Firebase Installations API**
     - OR (for development only): Select **"Don't restrict key"**
   - Click **Save**

4. **Fix Application Restrictions**
   - Under **"Application restrictions"**:
     - For **development**: Select **"None"** (allows localhost)
     - For **production**: Select **"HTTP referrers"** and add:
       - `http://localhost:*`
       - `http://127.0.0.1:*`
       - Your production domain (e.g., `https://yourdomain.com/*`)
   - Click **Save**

### Step 4: Enable Required APIs

Make sure these APIs are enabled:

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for and enable:
   - **Identity Toolkit API**
   - **Cloud Firestore API**
   - **Firebase Installations API**

### Step 5: Restart Development Server

**IMPORTANT:** You MUST restart the dev server after changing `.env`!

1. **Stop** the server (press `Ctrl+C` in the terminal)
2. **Restart** it:
   ```bash
   npm run dev
   ```

### Step 6: Verify It Works

1. **Open** your app in the browser
2. **Open** browser DevTools (F12)
3. **Check** the Console tab
4. You should see: `✅ Firebase initialized successfully`
5. The API key error should be gone

## Still Not Working?

### Check 1: Verify Environment Variables Are Loaded

In browser console, type:
```javascript
import.meta.env.VITE_FIREBASE_API_KEY
```

It should show your API key (starts with `AIza...`). If it shows `undefined`, the `.env` file isn't being loaded.

**Fix:**
- Make sure `.env` is in the `frontend` directory (same level as `package.json`)
- Make sure variable names start with `VITE_`
- Restart the dev server

### Check 2: API Key Format

Your API key should:
- Start with `AIza`
- Be about 39 characters long
- Not have any spaces or line breaks

### Check 3: Check Browser Console

Look for any additional error messages that might give more clues.

## Common Mistakes

❌ **Wrong:** Forgetting to restart dev server after changing `.env`  
✅ **Correct:** Always restart after `.env` changes

❌ **Wrong:** API key has restrictions blocking localhost  
✅ **Correct:** Set Application restrictions to "None" for development

❌ **Wrong:** Required APIs not enabled  
✅ **Correct:** Enable Identity Toolkit API and Cloud Firestore API

❌ **Wrong:** Using wrong API key (from different project)  
✅ **Correct:** Copy API key from the correct Firebase project

## Need More Help?

- Check the main documentation: `FIREBASE_API_KEY_FIX.md`
- Firebase Console: https://console.firebase.google.com/
- Google Cloud Console: https://console.cloud.google.com/

