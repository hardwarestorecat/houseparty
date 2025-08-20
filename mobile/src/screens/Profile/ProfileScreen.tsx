import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import notificationService from '../../services/notifications';

const ProfileScreen = () => {
  const { user, logout, loading } = useAuthStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoJoinEnabled, setAutoJoinEnabled] = useState(true);

  // Toggle notifications
  const toggleNotifications = (value: boolean) => {
    setNotificationsEnabled(value);
    // TODO: Save notification preferences to backend
  };

  // Toggle auto join
  const toggleAutoJoin = (value: boolean) => {
    setAutoJoinEnabled(value);
    // TODO: Save auto join preferences to backend
  };

  // Handle logout
  const handleLogout = async () => {
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
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  // Handle edit profile
  const handleEditProfile = () => {
    // TODO: Navigate to edit profile screen
    Alert.alert('Edit Profile', 'This feature is coming soon!');
  };

  // Handle change password
  const handleChangePassword = () => {
    // TODO: Navigate to change password screen
    Alert.alert('Change Password', 'This feature is coming soon!');
  };

  // Handle privacy policy
  const handlePrivacyPolicy = () => {
    // TODO: Navigate to privacy policy screen
    Alert.alert('Privacy Policy', 'This feature is coming soon!');
  };

  // Handle terms of service
  const handleTermsOfService = () => {
    // TODO: Navigate to terms of service screen
    Alert.alert('Terms of Service', 'This feature is coming soon!');
  };

  // Handle about
  const handleAbout = () => {
    // TODO: Navigate to about screen
    Alert.alert('About', 'House Party v1.0.0');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.username ? user.username.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={handleEditProfile}
            >
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.username}>{user?.username || 'User'}</Text>
          <Text style={styles.email}>{user?.email || 'email@example.com'}</Text>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={handleEditProfile}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          {/* Notifications */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={24} color="#6200ee" />
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#d1d1d1', true: '#b794f6' }}
              thumbColor={notificationsEnabled ? '#6200ee' : '#f4f3f4'}
            />
          </View>

          {/* Auto Join */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="videocam" size={24} color="#6200ee" />
              <Text style={styles.settingText}>Auto-join Video Chat</Text>
            </View>
            <Switch
              value={autoJoinEnabled}
              onValueChange={toggleAutoJoin}
              trackColor={{ false: '#d1d1d1', true: '#b794f6' }}
              thumbColor={autoJoinEnabled ? '#6200ee' : '#f4f3f4'}
            />
          </View>

          {/* Change Password */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleChangePassword}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="lock-closed" size={24} color="#6200ee" />
              <Text style={styles.settingText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          {/* Privacy Policy */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handlePrivacyPolicy}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="shield" size={24} color="#6200ee" />
              <Text style={styles.settingText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>

          {/* Terms of Service */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleTermsOfService}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="document-text" size={24} color="#6200ee" />
              <Text style={styles.settingText}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>

          {/* About */}
          <TouchableOpacity style={styles.settingItem} onPress={handleAbout}>
            <View style={styles.settingInfo}>
              <Ionicons name="information-circle" size={24} color="#6200ee" />
              <Text style={styles.settingText}>About</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="log-out" size={20} color="#fff" />
              <Text style={styles.logoutText}>Logout</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6200ee',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  editProfileButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#6200ee',
    borderRadius: 20,
  },
  editProfileText: {
    color: '#6200ee',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    marginHorizontal: 20,
    marginBottom: 30,
    paddingVertical: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default ProfileScreen;

