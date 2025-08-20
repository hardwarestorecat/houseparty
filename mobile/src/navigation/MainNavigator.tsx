import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import notificationService from '../services/notifications';
import presenceService from '../services/presence';

// Screens
import HomeScreen from '../screens/Home/HomeScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import FriendsScreen from '../screens/Friends/FriendsScreen';
import SettingsScreen from '../screens/Profile/SettingsScreen';
import PartyListScreen from '../screens/VideoChat/PartyListScreen';
import CreatePartyScreen from '../screens/VideoChat/CreatePartyScreen';
import VideoChatScreen from '../screens/VideoChat/VideoChatScreen';
import InviteToPartyScreen from '../screens/VideoChat/InviteToPartyScreen';

// Define tab navigator params
type TabParamList = {
  Home: undefined;
  Friends: undefined;
  Profile: undefined;
};

// Define stack navigator params
type MainStackParamList = {
  Tabs: undefined;
  Settings: undefined;
  PartyList: undefined;
  CreateParty: undefined;
  VideoChat: {
    partyId: string;
    token: string;
    uid: number;
  };
  InviteToParty: {
    partyId: string;
    partyName: string;
  };
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<MainStackParamList>();

// Tab Navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Friends') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-circle';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Friends" component={FriendsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Main Navigator
const MainNavigator = () => {
  const { isAuthenticated, user, accessToken } = useAuthStore();

  // Initialize services
  useEffect(() => {
    if (isAuthenticated && user && accessToken) {
      // Initialize notification service
      notificationService.init().then(() => {
        console.log('Notification service initialized');
      });

      // Initialize presence service
      presenceService.init('http://localhost:5000').then(() => {
        console.log('Presence service initialized');
      });

      // Set up notification listeners
      const cleanup = notificationService.setupListeners();

      return () => {
        // Clean up services
        cleanup();
        presenceService.cleanup();
      };
    }
  }, [isAuthenticated, user, accessToken]);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="PartyList" component={PartyListScreen} />
      <Stack.Screen name="CreateParty" component={CreatePartyScreen} />
      <Stack.Screen name="VideoChat" component={VideoChatScreen} />
      <Stack.Screen name="InviteToParty" component={InviteToPartyScreen} />
    </Stack.Navigator>
  );
};

export default MainNavigator;

