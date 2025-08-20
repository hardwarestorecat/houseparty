import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import api from '../../api';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuthStore();

  const [settings, setSettings] = useState({
    notifications: true,
    autoJoinEnabled: true,
    videoQuality: 'standard',
    audioQuality: 'standard',
    dataUsage: 'balanced',
    notificationTypes: {
      friendRequests: true,
      friendJoined: true,
      partyInvites: true,
      appUpdates: true,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load user settings
  useEffect(() => {
    if (user && user.settings) {
      setSettings({
        notifications: user.settings.notifications,
        autoJoinEnabled: user.settings.autoJoinEnabled,
        videoQuality: user.settings.videoQuality || 'standard',
        audioQuality: user.settings.audioQuality || 'standard',
        dataUsage: user.settings.dataUsage || 'balanced',
        notificationTypes: user.settings.notificationTypes || {
          friendRequests: true,
          friendJoined: true,
          partyInvites: true,
          appUpdates: true,
        },
      });
      setLoading(false);
    }
  }, [user]);

  // Save settings
  const saveSettings = async () => {
    setSaving(true);

    try {
      await api.put('/users/settings', settings);
      Alert.alert('Success', 'Settings saved successfully.');
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle switch
  const toggleSwitch = (key: string, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Toggle notification type
  const toggleNotificationType = (key: string, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      notificationTypes: {
        ...prev.notificationTypes,
        [key]: value,
      },
    }));
  };

  // Set option
  const setOption = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => logout(),
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* General Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive push notifications
              </Text>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={(value) => toggleSwitch('notifications', value)}
              trackColor={{ false: '#d1d1d1', true: '#b794f6' }}
              thumbColor={settings.notifications ? '#6200ee' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Auto-join Parties</Text>
              <Text style={styles.settingDescription}>
                Automatically join parties when clicking notifications
              </Text>
            </View>
            <Switch
              value={settings.autoJoinEnabled}
              onValueChange={(value) => toggleSwitch('autoJoinEnabled', value)}
              trackColor={{ false: '#d1d1d1', true: '#b794f6' }}
              thumbColor={settings.autoJoinEnabled ? '#6200ee' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Notification Types */}
        {settings.notifications && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Types</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Friend Requests</Text>
                <Text style={styles.settingDescription}>
                  Notifications for new friend requests
                </Text>
              </View>
              <Switch
                value={settings.notificationTypes.friendRequests}
                onValueChange={(value) =>
                  toggleNotificationType('friendRequests', value)
                }
                trackColor={{ false: '#d1d1d1', true: '#b794f6' }}
                thumbColor={
                  settings.notificationTypes.friendRequests
                    ? '#6200ee'
                    : '#f4f3f4'
                }
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Friend Joined</Text>
                <Text style={styles.settingDescription}>
                  Notifications when friends enter the house
                </Text>
              </View>
              <Switch
                value={settings.notificationTypes.friendJoined}
                onValueChange={(value) =>
                  toggleNotificationType('friendJoined', value)
                }
                trackColor={{ false: '#d1d1d1', true: '#b794f6' }}
                thumbColor={
                  settings.notificationTypes.friendJoined
                    ? '#6200ee'
                    : '#f4f3f4'
                }
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Party Invites</Text>
                <Text style={styles.settingDescription}>
                  Notifications for party invitations
                </Text>
              </View>
              <Switch
                value={settings.notificationTypes.partyInvites}
                onValueChange={(value) =>
                  toggleNotificationType('partyInvites', value)
                }
                trackColor={{ false: '#d1d1d1', true: '#b794f6' }}
                thumbColor={
                  settings.notificationTypes.partyInvites
                    ? '#6200ee'
                    : '#f4f3f4'
                }
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>App Updates</Text>
                <Text style={styles.settingDescription}>
                  Notifications about app updates and new features
                </Text>
              </View>
              <Switch
                value={settings.notificationTypes.appUpdates}
                onValueChange={(value) =>
                  toggleNotificationType('appUpdates', value)
                }
                trackColor={{ false: '#d1d1d1', true: '#b794f6' }}
                thumbColor={
                  settings.notificationTypes.appUpdates
                    ? '#6200ee'
                    : '#f4f3f4'
                }
              />
            </View>
          </View>
        )}

        {/* Video Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Video Settings</Text>

          <Text style={styles.optionTitle}>Video Quality</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                settings.videoQuality === 'low' && styles.optionButtonActive,
              ]}
              onPress={() => setOption('videoQuality', 'low')}
            >
              <Text
                style={[
                  styles.optionText,
                  settings.videoQuality === 'low' && styles.optionTextActive,
                ]}
              >
                Low
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                settings.videoQuality === 'standard' &&
                  styles.optionButtonActive,
              ]}
              onPress={() => setOption('videoQuality', 'standard')}
            >
              <Text
                style={[
                  styles.optionText,
                  settings.videoQuality === 'standard' &&
                    styles.optionTextActive,
                ]}
              >
                Standard
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                settings.videoQuality === 'high' && styles.optionButtonActive,
              ]}
              onPress={() => setOption('videoQuality', 'high')}
            >
              <Text
                style={[
                  styles.optionText,
                  settings.videoQuality === 'high' && styles.optionTextActive,
                ]}
              >
                High
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.optionTitle}>Audio Quality</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                settings.audioQuality === 'low' && styles.optionButtonActive,
              ]}
              onPress={() => setOption('audioQuality', 'low')}
            >
              <Text
                style={[
                  styles.optionText,
                  settings.audioQuality === 'low' && styles.optionTextActive,
                ]}
              >
                Low
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                settings.audioQuality === 'standard' &&
                  styles.optionButtonActive,
              ]}
              onPress={() => setOption('audioQuality', 'standard')}
            >
              <Text
                style={[
                  styles.optionText,
                  settings.audioQuality === 'standard' &&
                    styles.optionTextActive,
                ]}
              >
                Standard
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                settings.audioQuality === 'high' && styles.optionButtonActive,
              ]}
              onPress={() => setOption('audioQuality', 'high')}
            >
              <Text
                style={[
                  styles.optionText,
                  settings.audioQuality === 'high' && styles.optionTextActive,
                ]}
              >
                High
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.optionTitle}>Data Usage</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                settings.dataUsage === 'low' && styles.optionButtonActive,
              ]}
              onPress={() => setOption('dataUsage', 'low')}
            >
              <Text
                style={[
                  styles.optionText,
                  settings.dataUsage === 'low' && styles.optionTextActive,
                ]}
              >
                Low
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                settings.dataUsage === 'balanced' && styles.optionButtonActive,
              ]}
              onPress={() => setOption('dataUsage', 'balanced')}
            >
              <Text
                style={[
                  styles.optionText,
                  settings.dataUsage === 'balanced' && styles.optionTextActive,
                ]}
              >
                Balanced
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                settings.dataUsage === 'high' && styles.optionButtonActive,
              ]}
              onPress={() => setOption('dataUsage', 'high')}
            >
              <Text
                style={[
                  styles.optionText,
                  settings.dataUsage === 'high' && styles.optionTextActive,
                ]}
              >
                High
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={styles.accountButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={20} color="#ff3b30" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveSettings}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Settings</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 34, // Same width as back button for centering
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 10,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  optionsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    borderRadius: 5,
  },
  optionButtonActive: {
    backgroundColor: '#6200ee',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  logoutText: {
    fontSize: 16,
    color: '#ff3b30',
    marginLeft: 10,
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  saveButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;

