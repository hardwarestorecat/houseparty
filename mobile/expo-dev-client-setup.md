# Setting Up Expo Dev Client for House Party App

This guide will help you set up Expo Dev Client for the House Party app, which provides a better development experience for testing on physical devices.

## What is Expo Dev Client?

Expo Dev Client is a development build of your app that includes the Expo SDK and development tools. It allows you to:

- Test your app on a physical device without having to rebuild it for every change
- Use native modules that aren't included in the Expo Go app
- Test your app in an environment closer to production

## Setup Instructions

### 1. Install EAS CLI

First, install the EAS CLI globally:

```bash
npm install -g eas-cli
```

### 2. Log in to your Expo account

```bash
eas login
```

If you don't have an Expo account, you can create one at [expo.dev](https://expo.dev/signup).

### 3. Configure the project

We've already created an `eas.json` file in the project root with the necessary configuration.

### 4. Build a development client

#### For Android:

```bash
cd /path/to/houseparty/mobile
eas build --profile development --platform android
```

#### For iOS:

```bash
cd /path/to/houseparty/mobile
eas build --profile development --platform ios
```

This will start a build on Expo's servers. When the build is complete, you'll receive a link to download the app.

### 5. Install the development client

#### For Android:

Download the APK from the link provided and install it on your device.

#### For iOS:

You'll need to register your device in the Apple Developer portal and install the app using TestFlight.

### 6. Run the development server

```bash
cd /path/to/houseparty/mobile
npx expo start --dev-client
```

### 7. Connect to the development server

Open the House Party Dev Client app on your device and scan the QR code displayed in your terminal.

## Building a Preview Version

If you want to create a standalone app for testing without the development tools:

```bash
eas build --profile preview --platform android
```

This will create an APK that you can share with testers.

## Troubleshooting

### Build Failures

If your build fails, check the build logs for specific errors. Common issues include:

- Missing dependencies
- Incompatible native module versions
- Incorrect configuration in `eas.json`

### Connection Issues

If your device can't connect to the development server:

1. Make sure your device and computer are on the same network
2. Try using a tunnel connection:
   ```bash
   npx expo start --dev-client --tunnel
   ```

### Native Module Issues

If you're having issues with native modules:

1. Make sure the module is compatible with Expo Dev Client
2. Check that the module is properly installed and linked
3. Rebuild the development client if you've added new native modules

## Additional Resources

- [Expo Dev Client Documentation](https://docs.expo.dev/development/getting-started/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Development in WSL2](https://docs.expo.dev/workflow/android-studio-emulator/)
