# House Party

A user-to-user live stream mobile app for Android and iOS that allows friends to join video chats when they "enter the house".

## Features

- Real-time video chat with up to 10 users simultaneously
- Push notifications when friends enter the house
- Automatic video chat joining via notifications
- Friend management system with requests and search
- Invitation system for users not currently in the app
- Enhanced notification preferences
- Advanced video and audio quality settings
- Data usage optimization options

### Future Enhancements
- Chat functionality within video calls
- Screen sharing capabilities
- Profile customization with photo upload
- Contact import from phone
- End-to-end encryption
- Background blur and virtual backgrounds

## Tech Stack

### Backend
- Node.js with Express (TypeScript)
- MongoDB Atlas
- Socket.io for real-time presence
- Custom JWT authentication
- Vercel for hosting

### Mobile
- React Native for cross-platform development
- Agora.io SDK for video streaming
- Firebase Cloud Messaging for push notifications

## Project Structure

```
houseparty/
├── backend/           # TypeScript Express backend
│   ├── src/
│   │   ├── config/    # Configuration files
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/    # MongoDB models
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
│
├── mobile/            # React Native mobile app
│   ├── src/
│   │   ├── api/       # API client
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── navigation/
│   │   ├── screens/
│   │   ├── services/  # Video, notifications, etc.
│   │   ├── store/     # State management
│   │   └── utils/
│   ├── android/
│   ├── ios/
│   └── package.json
│
└── package.json       # Root package.json for shared scripts
```

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- MongoDB Atlas account
- Agora.io account
- Firebase project (for push notifications)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Detailed Setup Guide

### 1. Setting Up the Development Environment

#### Backend Setup

1. Clone the repository and checkout the development branch
```bash
git clone https://github.com/hardwarestorecat/houseparty.git
cd houseparty
git checkout codegen-bot/initial-project-setup
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

4. Edit the `.env` file with your credentials:
```
# MongoDB - Create a free cluster at https://www.mongodb.com/cloud/atlas
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/houseparty

# JWT Secrets - Generate strong random strings
JWT_ACCESS_TOKEN_SECRET=your_access_token_secret
JWT_REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Agora.io - Get credentials at https://console.agora.io/
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate

# Firebase - Get server key from Firebase Console > Project Settings > Cloud Messaging
FIREBASE_SERVER_KEY=your_firebase_server_key
```

5. Start the backend server
```bash
npm run dev
```

The server should start on http://localhost:5000

#### Mobile Setup

1. Install mobile dependencies
```bash
cd ../mobile
npm install
```

2. Install Expo CLI globally (if not already installed)
```bash
npm install -g expo-cli
```

3. Set up environment variables
```bash
cp .env.example .env
```

4. Edit the `.env` file with your credentials:
```
API_URL=http://localhost:5000/api
AGORA_APP_ID=your_agora_app_id
```

### 2. Running the Mobile App

#### Using Expo Go (Easiest Method)

1. Start the Expo development server
```bash
npx expo start
```

2. Install the Expo Go app on your physical device:
   - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)

3. Scan the QR code displayed in your terminal with:
   - Android: Use the Expo Go app to scan
   - iOS: Use the Camera app to scan

#### Using Android Emulator

1. Install and set up Android Studio:
   - Download from [developer.android.com](https://developer.android.com/studio)
   - During installation, make sure to select "Android Virtual Device"
   - Open Android Studio and go to "SDK Manager" to install the latest Android SDK

2. Create a virtual device:
   - In Android Studio, go to "AVD Manager"
   - Click "Create Virtual Device"
   - Select a device (e.g., Pixel 4) and click "Next"
   - Select a system image (e.g., Android 11) and click "Next"
   - Name your device and click "Finish"

3. Start the emulator:
   - In Android Studio's AVD Manager, click the play button next to your virtual device
   - Wait for the emulator to fully boot up

4. Start the Expo development server with Android option:
```bash
npx expo start --android
```

#### Using iOS Simulator (macOS Only)

1. Install Xcode from the Mac App Store

2. Set up the iOS simulator:
   - Open Xcode
   - Go to "Preferences" > "Components"
   - Install a simulator (e.g., iPhone 13)

3. Start the Expo development server with iOS option:
```bash
npx expo start --ios
```

### 3. Testing the Authentication System

Once you have the backend running and the mobile app launched on your device or emulator, you can test the authentication system:

1. **Registration Flow**:
   - Launch the app and tap "Sign Up" on the login screen
   - Fill in the registration form with:
     - Username: Choose any username
     - Email: Use a valid email format (e.g., test@example.com)
     - Phone: Enter a valid phone number format
     - Password: At least 6 characters
   - Tap "Sign Up"
   - You'll be redirected to the verification screen
   - In a real environment, you would receive an email with OTP
   - For testing, check the backend console logs to find the OTP
   - Enter the OTP in the verification screen

2. **Login Flow**:
   - Enter the email and password you registered with
   - Tap "Sign In"
   - You should be logged in and see the Home screen

3. **Profile and Settings**:
   - Navigate to the Profile tab
   - Test toggling notification and auto-join settings
   - Try the logout functionality

### 4. Troubleshooting

#### Backend Issues:
- Ensure MongoDB connection string is correct
- Check that all required environment variables are set
- Verify the server is running on the expected port
- Look for error messages in the console

#### Mobile App Issues:
- Make sure the API_URL in the .env file points to your running backend
- For Android emulator, use `http://10.0.2.2:5000/api` instead of localhost
- For iOS simulator, use `http://localhost:5000/api`
- For physical devices on the same network, use your computer's local IP address

#### Connection Issues:
- Ensure your device/emulator and backend server are on the same network
- Check firewall settings that might block connections
- Verify the backend server is accessible from your device/emulator

## Development

### Backend
```bash
cd backend
npm run dev
```

### Mobile
```bash
cd mobile
npm run start
```

## Deployment

### Backend
The backend is deployed to Vercel.

### Mobile
The mobile app can be built for Android and iOS using the standard React Native build process.

## License
[MIT](LICENSE)
