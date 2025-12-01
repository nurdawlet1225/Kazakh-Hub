# 🔴 URGENT: Firebase API Key Invalid - Fix Now

## Current Problem
Your API key `AIzaSyCQV1oUnC4GISVmWPAk-fIk-3UoEYBink` is **INVALID** and causing authentication errors.

## Quick Fix (5 minutes)

### Option 1: Get New API Key from Firebase Console (RECOMMENDED)

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/
   - Select project: **kazakh-hub**

2. **Get Your Web App Config**
   - Click ⚙️ (gear icon) → **Project settings**
   - Scroll to **"Your apps"** section
   - Find your web app (or create one if missing)
   - Click **</>** icon to view config
   - **Copy the `apiKey` value** (should start with `AIza...`)

3. **Update `.env` File**
   - Open `frontend/.env`
   - Replace `VITE_FIREBASE_API_KEY=AIzaSyCQV1oUnC4GISVmWPAk-fIk-3UoEYBink`
   - With: `VITE_FIREBASE_API_KEY=<your-new-api-key-from-firebase>`
   - **Save** the file

4. **Fix API Key Restrictions** (CRITICAL!)
   - Go to: https://console.cloud.google.com/
   - Select project: **kazakh-hub**
   - Navigate to: **APIs & Services** → **Credentials**
   - Find your API key (starts with `AIza...`)
   - Click on it to **Edit**
   - **API restrictions**: 
     - Select **"Restrict key"**
     - Enable these APIs:
       - ✅ **Identity Toolkit API**
       - ✅ **Cloud Firestore API**
       - ✅ **Firebase Installations API**
   - **Application restrictions**:
     - For development: Select **"None"**
   - Click **Save**

5. **Enable Required APIs**
   - In Google Cloud Console: **APIs & Services** → **Library**
   - Search and enable:
     - **Identity Toolkit API**
     - **Cloud Firestore API**
     - **Firebase Installations API**

6. **Restart Dev Server**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

### Option 2: Regenerate API Key (If Option 1 doesn't work)

1. **Google Cloud Console** → **APIs & Services** → **Credentials**
2. Find your API key
3. Click **Delete** (or **Regenerate** if available)
4. Create a **new API key**:
   - Click **+ CREATE CREDENTIALS** → **API key**
   - Copy the new key
   - Configure restrictions (as in Option 1, Step 4)
5. Update `.env` with the new key
6. Restart dev server

## Verify It's Fixed

1. Open browser DevTools (F12)
2. Check Console tab
3. Should see: `✅ Firebase initialized successfully`
4. No more API key errors!

## Still Not Working?

### Check 1: Verify Environment Variables
In browser console, type:
```javascript
import.meta.env.VITE_FIREBASE_API_KEY
```
Should show your API key (not `undefined`).

### Check 2: API Key Format
- Must start with `AIza`
- Should be ~39 characters long
- No spaces or line breaks

### Check 3: Common Issues
- ❌ Forgot to restart dev server → ✅ **Restart it!**
- ❌ API restrictions blocking localhost → ✅ Set to "None" for development
- ❌ APIs not enabled → ✅ Enable Identity Toolkit API
- ❌ Wrong project → ✅ Use API key from **kazakh-hub** project

## Need Help?

- Firebase Console: https://console.firebase.google.com/
- Google Cloud Console: https://console.cloud.google.com/
- Check other docs: `FIREBASE_API_KEY_FIX.md`, `FIREBASE_API_KEY_FIX_STEPS.md`





