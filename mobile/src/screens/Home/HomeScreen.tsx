import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import presenceService from '../../services/presence';
import api from '../../api';

interface User {
  _id: string;
  username: string;
  profilePicture?: string;
}

interface Party {
  _id: string;
  name: string;
  hostId: string;
  participants: User[];
  createdAt: string;
}

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();

  const [usersInHouse, setUsersInHouse] = useState<User[]>([]);
  const [activeParties, setActiveParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Initialize presence service
  useEffect(() => {
    const initPresence = async () => {
      try {
        // Initialize presence service
        await presenceService.init(api.defaults.baseURL || '');
        
        // Set up event listeners
        presenceService.on('user_entered', handleUserEntered);
        presenceService.on('user_left', handleUserLeft);
        presenceService.on('party_created', handlePartyCreated);
        presenceService.on('party_ended', handlePartyEnded);
        
        // Load initial data
        loadData();
      } catch (error) {
        console.error('Failed to initialize presence service:', error);
      }
    };

    initPresence();

    // Clean up
    return () => {
      presenceService.cleanup();
    };
  }, []);

  // Load data
  const loadData = async () => {
    setLoading(true);
    
    try {
      // Get users in house
      await fetchUsersInHouse();
      
      // Get active parties
      await fetchActiveParties();
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch users in house
  const fetchUsersInHouse = async () => {
    try {
      // Get users in house from presence service
      presenceService.getUsersInHouse(async (userIds) => {
        if (userIds.length === 0) {
          setUsersInHouse([]);
          return;
        }
        
        // Get user details from API
        const response = await api.post('/users/details', { userIds });
        setUsersInHouse(response.data.users);
      });
    } catch (error) {
      console.error('Failed to fetch users in house:', error);
      throw error;
    }
  };

  // Fetch active parties
  const fetchActiveParties = async () => {
    try {
      const response = await api.get('/parties');
      setActiveParties(response.data.parties);
    } catch (error) {
      console.error('Failed to fetch active parties:', error);
      throw error;
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Handle user entered event
  const handleUserEntered = (userData: any) => {
    // Refresh users in house
    fetchUsersInHouse();
  };

  // Handle user left event
  const handleUserLeft = (userData: any) => {
    // Refresh users in house
    fetchUsersInHouse();
  };

  // Handle party created event
  const handlePartyCreated = (partyData: any) => {
    // Refresh active parties
    fetchActiveParties();
  };

  // Handle party ended event
  const handlePartyEnded = (partyData: any) => {
    // Refresh active parties
    fetchActiveParties();
  };

  // Navigate to party list
  const navigateToPartyList = () => {
    navigation.navigate('PartyList' as never);
  };

  // Navigate to create party
  const navigateToCreateParty = () => {
    // TODO: Implement create party screen
    Alert.alert('Create Party', 'This feature is coming soon!');
  };

  // Navigate to invite friends
  const navigateToInvite = () => {
    navigation.navigate('Invite' as never);
  };

  // Join party
  const joinParty = async (partyId: string) => {
    try {
      await api.post(`/parties/${partyId}/join`);
      
      // Navigate to video chat
      navigation.navigate('VideoChat' as never, { partyId } as never);
    } catch (error) {
      console.error('Failed to join party:', error);
      Alert.alert('Error', 'Failed to join party. Please try again.');
    }
  };

  // Render user item
  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => Alert.alert('User', `${item.username} is in the house!`)}
    >
      <View style={styles.userAvatar}>
        <Text style={styles.userInitial}>{item.username.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.userName}>{item.username}</Text>
      <View style={styles.userStatus} />
    </TouchableOpacity>
  );

  // Render party item
  const renderPartyItem = ({ item }: { item: Party }) => (
    <TouchableOpacity
      style={styles.partyItem}
      onPress={() => joinParty(item._id)}
    >
      <View style={styles.partyInfo}>
        <Text style={styles.partyName}>{item.name}</Text>
        <Text style={styles.partyHost}>
          Hosted by {item.hostId === user?._id ? 'You' : item.participants.find(p => p._id === item.hostId)?.username}
        </Text>
        <Text style={styles.partyParticipants}>
          {item.participants.length} {item.participants.length === 1 ? 'person' : 'people'} in this party
        </Text>
      </View>
      <View style={styles.partyAction}>
        <Ionicons name="videocam" size={24} color="#6200ee" />
        <Text style={styles.partyActionText}>Join</Text>
      </View>
    </TouchableOpacity>
  );

  // Render empty component
  const renderEmptyComponent = (message: string) => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
        </View>
      ) : (
        <>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>House Party</Text>
            <TouchableOpacity
              style={styles.inviteButton}
              onPress={navigateToInvite}
            >
              <Ionicons name="person-add" size={24} color="#6200ee" />
            </TouchableOpacity>
          </View>

          {/* Users in House */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>In The House</Text>
              <Text style={styles.sectionCount}>{usersInHouse.length}</Text>
            </View>
            <FlatList
              data={usersInHouse}
              renderItem={renderUserItem}
              keyExtractor={(item) => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.usersList}
              ListEmptyComponent={() => renderEmptyComponent('No one is in the house right now')}
            />
          </View>

          {/* Active Parties */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Parties</Text>
              <TouchableOpacity onPress={navigateToPartyList}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={activeParties}
              renderItem={renderPartyItem}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.partiesList}
              ListEmptyComponent={() => renderEmptyComponent('No active parties right now')}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={['#6200ee']}
                />
              }
            />
          </View>

          {/* Create Party Button */}
          <TouchableOpacity
            style={styles.createPartyButton}
            onPress={navigateToCreateParty}
          >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.createPartyText}>Start a Party</Text>
          </TouchableOpacity>
        </>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  inviteButton: {
    padding: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ee',
    backgroundColor: '#f0e6ff',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#6200ee',
    fontWeight: '500',
  },
  usersList: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    minHeight: 100,
  },
  userItem: {
    alignItems: 'center',
    marginHorizontal: 10,
    width: 70,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  userInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  userName: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  userStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    position: 'absolute',
    top: 0,
    right: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  partiesList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    minHeight: 200,
  },
  partyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  partyInfo: {
    flex: 1,
  },
  partyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  partyHost: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  partyParticipants: {
    fontSize: 12,
    color: '#999',
  },
  partyAction: {
    alignItems: 'center',
  },
  partyActionText: {
    fontSize: 12,
    color: '#6200ee',
    marginTop: 5,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  createPartyButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#6200ee',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  createPartyText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default HomeScreen;

