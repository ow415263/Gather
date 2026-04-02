# iOS Share Extension Setup Guide

## Overview
This guide will help you set up the iOS Share Extension for Foodie. This allows users to share recipe URLs directly from Safari, Instagram, TikTok, and other apps.

---

## Step 1: Create Share Extension Target in Xcode

1. **Open Xcode Project:**
   ```bash
   open ios/App/App.xcodeproj
   ```

2. **Add New Target:**
   - Click on the project in the navigator (top item, blue icon)
   - Click the "+" button at the bottom of the Targets list
   - Search for "Share Extension"
   - Click "Next"

3. **Configure Extension:**
   - **Product Name:** `FoodieShare`
   - **Language:** Swift
   - **Project:** App
   - **Embed in Application:** App
   - Click "Finish"

4. **Activate Scheme (if prompted):**
   - Click "Activate" when asked to activate the FoodieShare scheme

---

## Step 2: Replace ShareViewController.swift

1. **Locate the file:**
   - In Xcode, navigate to: `FoodieShare` → `ShareViewController.swift`

2. **Replace contents:**
   - Delete all existing code
   - Copy the contents from: `/Volumes/LaCie/Fudi-app/recipe-vault-main/ios/ShareViewController.swift`
   - Paste into the file

3. **IMPORTANT - Update App Group ID:**
   - Find this line: `let appGroupID = "group.YOUR_BUNDLE_ID.foodie"`
   - Replace `YOUR_BUNDLE_ID` with your actual bundle identifier
   - Example: If your bundle ID is `com.owen.foodie`, use `group.com.owen.foodie`

---

## Step 3: Configure App Groups

### For Main App Target:
1. Select **App** target in Xcode
2. Go to **Signing & Capabilities** tab
3. Click **"+ Capability"**
4. Search for and add **"App Groups"**
5. Click the **"+" button** under App Groups
6. Enter: `group.YOUR_BUNDLE_ID.foodie` (same as in ShareViewController)
7. Click **OK**

### For FoodieShare Target:
1. Select **FoodieShare** target
2. Repeat steps 2-7 above with the **same App Group ID**

> **⚠️ CRITICAL:** Both targets MUST use the exact same App Group ID!

---

## Step 4: Add URL Scheme to Main App

1. Select **App** target
2. Go to **Info** tab
3. Expand **URL Types**
4. Click **"+"** to add a new URL Type
5. Fill in:
   - **Identifier:** `com.yourcompany.foodie` (your bundle ID)
   - **URL Schemes:** `foodie`
   - **Role:** Editor
6. The scheme is now `foodie://` - this is what the Share Extension uses

---

## Step 5: Configure Share Extension Info.plist

1. **Locate Info.plist:**
   - Select `FoodieShare` target
   - Go to **Info** tab

2. **Configure NSExtension:**
   - Find `NSExtension` → `NSExtensionAttributes`
   - Under `NSExtensionActivationRule`, ensure it's a **Dictionary** (not a string)
   
3. **Add URL activation:**
   - Right-click on `NSExtensionActivationRule` → Add Row
   - Key: `NSExtensionActivationSupportsWebURLWithMaxCount`
   - Type: Number
   - Value: `1`

This ensures the share extension only appears when sharing URLs.

---

## Step 6: Sync Capacitor

Run this command to sync the changes:

```bash
npx cap sync ios
```

---

## Step 7: Build and Test

1. **Select Device:**
   - Choose your iPhone from the device dropdown (top of Xcode)

2. **Build Scheme:**
   - Make sure "App" scheme is selected (not FoodieShare)

3. **Run:**
   - Click the Play button (▶️)

4. **Test the Share Extension:**
   - Open Safari on your iPhone
   - Navigate to: `https://www.allrecipes.com/recipe/10813/best-chocolate-chip-cookies/`
   - Tap the Share button
   - Look for "Foodie" in the share sheet
   - Tap it → App should open and extract the recipe!

---

## Troubleshooting

### Share extension doesn't appear in share sheet:
- Verify App Groups are configured correctly with the SAME ID
-Verify `NSExtensionActivationRule` in Info.plist

### App doesn't open when extension is tapped:
- Check URL scheme is `foodie` (all lowercase)
- Verify App Group ID matches in both targets

### Recipe doesn't extract:
- Check browser console for `[App] Received shared URL:` log
- Verify `extractRecipe` Cloud Function is deployed

---

## Next Steps

After completing these steps, the Share Extension is fully functional! Users can now:
- Browse recipes on any website
- Tap Share → Foodie
- Have the recipe automatically extracted and saved

The app will handle the URL using the `useAppUrl` hook and trigger the existing `extractRecipe` Cloud Function.
