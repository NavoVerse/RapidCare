# RapidCare Android App

This folder contains a wrapper to instantly turn your live web app (`https://rapidcare-c2jt.onrender.com`) into a native Android App using **Capacitor**. 

The app acts as a native "thin client", so any changes deployed to Render will instantly reflect in the Android app without needing an app update!

## Prerequisites
- Node.js & npm
- Android Studio (to compile and build the actual `.apk` or `.aab`)

## How to Build the App

1. Install the Capacitor dependencies:
   ```powershell
   npm install @capacitor/core @capacitor/cli @capacitor/android
   ```

2. Generate the native Android project:
   ```powershell
   npx cap add android
   ```

3. Open the project in Android Studio:
   ```powershell
   npx cap open android
   ```

4. Once Android Studio opens, let it sync the Gradle files. After it's done, you can click the green **Play** button to run it on an emulator or a plugged-in Android phone, or go to **Build > Build Bundle(s) / APK(s) > Build APK(s)** to generate your installable Android app file!
