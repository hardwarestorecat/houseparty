# Setting Up Android Development in WSL2 for House Party App

This guide will help you set up Android development environment in WSL2 (Windows Subsystem for Linux) for the House Party app.

## Prerequisites

1. Windows 10 version 2004 or higher (Build 19041 or higher) or Windows 11
2. WSL2 installed with a Linux distribution (Ubuntu recommended)
3. Windows Terminal (recommended for better experience)

## Setup Steps

### 1. Install Required Windows Components

First, make sure you have the following installed on your Windows host:

- [Android Studio](https://developer.android.com/studio)
- [ADB for Windows](https://developer.android.com/studio/releases/platform-tools)

### 2. Set Up Android SDK in WSL2

We've created a script to automate the setup process. Follow these steps:

1. Open your WSL2 terminal
2. Navigate to the project directory:
   ```bash
   cd /path/to/houseparty/mobile
   ```
3. Make the setup script executable:
   ```bash
   chmod +x android-setup.sh
   ```
4. Run the setup script:
   ```bash
   ./android-setup.sh
   ```
5. Restart your terminal or run:
   ```bash
   source ~/.bashrc
   ```

### 3. Connect WSL2 to Windows ADB

To use a physical device or emulator running on Windows from WSL2:

1. Start ADB server on Windows (run in Windows Command Prompt or PowerShell):
   ```
   adb kill-server
   adb -a nodaemon server start
   ```

2. In your WSL2 terminal, set the ADB server address:
   ```bash
   export ADB_SERVER_SOCKET=tcp:127.0.0.1:5037
   ```

3. Add this line to your `~/.bashrc` to make it permanent:
   ```bash
   echo "export ADB_SERVER_SOCKET=tcp:127.0.0.1:5037" >> ~/.bashrc
   ```

### 4. Create Android Directory Structure

If the script didn't create the necessary directories, create them manually:

```bash
mkdir -p ~/Android/Sdk/platform-tools
mkdir -p ~/Android/Sdk/build-tools
mkdir -p ~/Android/Sdk/platforms
mkdir -p ~/Android/Sdk/cmdline-tools/latest
```

### 5. Configure Expo for Android Development

Create an Expo configuration file:

```bash
mkdir -p ~/.expo
echo '{
  "androidToolsPath": "~/Android/Sdk"
}' > ~/.expo/settings.json
```

### 6. Running the App on Android

Now you can run the app on Android:

```bash
cd /path/to/houseparty/mobile
npx expo start --android
```

## Troubleshooting

### ADB Connection Issues

If you have trouble connecting to ADB:

1. Make sure ADB server is running on Windows
2. Check that the `ADB_SERVER_SOCKET` environment variable is set correctly
3. Try restarting the ADB server on Windows:
   ```
   adb kill-server
   adb -a nodaemon server start
   ```

### Java Issues

If you encounter Java-related errors:

```bash
sudo apt update
sudo apt install openjdk-11-jdk
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
echo "export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64" >> ~/.bashrc
```

### Path Issues

If tools aren't found in the path:

```bash
echo "export ANDROID_HOME=~/Android/Sdk" >> ~/.bashrc
echo "export PATH=\$PATH:\$ANDROID_HOME/platform-tools" >> ~/.bashrc
echo "export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin" >> ~/.bashrc
echo "export PATH=\$PATH:\$ANDROID_HOME/build-tools/33.0.0" >> ~/.bashrc
source ~/.bashrc
```

## Using a Physical Device

1. Connect your Android device to your Windows machine via USB
2. Enable USB debugging on your device
3. In Windows, run:
   ```
   adb devices
   ```
   to verify the device is detected
4. In WSL2, you should now be able to see the device when running:
   ```bash
   adb devices
   ```

## Using Android Emulator

1. Create and start an emulator in Android Studio on Windows
2. In WSL2, the running emulator should be accessible via ADB

## Additional Resources

- [React Native Environment Setup](https://reactnative.dev/docs/environment-setup)
- [Expo Development in WSL2](https://docs.expo.dev/workflow/android-studio-emulator/)
- [Microsoft's WSL2 Documentation](https://docs.microsoft.com/en-us/windows/wsl/)
