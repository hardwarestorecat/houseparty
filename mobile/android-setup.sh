#!/bin/bash

# Android SDK Setup Script for WSL2
# This script sets up Android SDK for React Native/Expo development in WSL2

# Create directories
mkdir -p ~/Android/Sdk
mkdir -p ~/.gradle

# Set environment variables
echo "# Android SDK Environment Variables" >> ~/.bashrc
echo "export ANDROID_HOME=~/Android/Sdk" >> ~/.bashrc
echo "export PATH=\$PATH:\$ANDROID_HOME/emulator" >> ~/.bashrc
echo "export PATH=\$PATH:\$ANDROID_HOME/tools" >> ~/.bashrc
echo "export PATH=\$PATH:\$ANDROID_HOME/tools/bin" >> ~/.bashrc
echo "export PATH=\$PATH:\$ANDROID_HOME/platform-tools" >> ~/.bashrc

# Source the updated bashrc
source ~/.bashrc

# Install required packages
sudo apt-get update
sudo apt-get install -y openjdk-11-jdk-headless unzip curl

# Download Android SDK command line tools
mkdir -p ~/Android/Sdk/cmdline-tools
cd ~/Android/Sdk/cmdline-tools
curl -O https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
unzip commandlinetools-linux-9477386_latest.zip
mkdir -p latest
mv cmdline-tools/* latest/
rmdir cmdline-tools
rm commandlinetools-linux-9477386_latest.zip

# Accept licenses and install required SDK components
yes | ~/Android/Sdk/cmdline-tools/latest/bin/sdkmanager --licenses
~/Android/Sdk/cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"

# Create a configuration file for Expo
mkdir -p ~/.expo
cat > ~/.expo/settings.json << EOL
{
  "androidToolsPath": "$HOME/Android/Sdk"
}
EOL

# Create a local.properties file for the project
echo "sdk.dir=$HOME/Android/Sdk" > ./android/local.properties

echo "Android SDK setup complete!"
echo "Please restart your terminal or run 'source ~/.bashrc' to apply the environment variables."
echo "You can now run 'npx expo start --android' to start your app on Android."
