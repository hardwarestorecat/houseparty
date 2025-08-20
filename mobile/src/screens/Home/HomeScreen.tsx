import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import api from '../../api';
import presenceService from '../../services/presence';

interface User {
  _id: string;
  username: string;
  profilePicture?: string;
  isInHouse: boolean;
}

interface Party {
  _id: string;
  name: string;
  hostId: User;
  participants: User[];
  maxParticipants: number;
  createdAt: string;
}

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();

  const [activeParties, setActiveParties] = useState<Party[]>([]);
  const [friendsInHouse, setFriendsInHouse] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      // Fetch active parties
      const partiesResponse = await api.get('/parties');
      setActiveParties(partiesResponse.data.parties);

      // Fetch friends in house
      const friendsResponse = await api.get('/users/friends/in-house');
      setFriendsInHouse(friendsResponse.data.friends);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load data on mount and when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchData();
      
      // Enter the house when screen is focused
      presenceService.enterHouse();
      
      return () => {
        // No need to leave the house here, as we want to stay "in the house"
        // while the app is open, even if navigating to other screens
      };
    }, [fetchData])
  );

  // Set up presence service event listeners
  useEffect(() => {
    // Listen for user entered event
    const userEnteredListener = (data: any) => {
      // Refresh data when a friend enters the house
      fetchData();
    };

    // Listen for user left event
    const userLeftListener = (data: any) => {
      // Refresh data when a friend leaves the house
      fetchData();
    };

    // Listen for party created event
    const partyCreatedListener = (data: any) => {
      // Refresh data when a new party is created
      fetchData();
    };

    // Listen for party ended event
    const partyEndedListener = (data: any) => {
      // Refresh data when a party ends
      fetchData();
    };

    // Add event listeners
    presenceService.on('user_entered', userEnteredListener);
    presenceService.on('user_left', userLeftListener);
    presenceService.on('party_created', partyCreatedListener);
    presenceService.on('party_ended', partyEndedListener);

    // Clean up
    return () => {
      presenceService.removeListener('user_entered', userEnteredListener);
      presenceService.removeListener('user_left', userLeftListener);
      presenceService.removeListener('party_created', partyCreatedListener);
      presenceService.removeListener('party_ended', partyEndedListener);
    };
  }, [fetchData]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Navigate to party list
  const navigateToPartyList = () => {
    navigation.navigate('PartyList' as never);
  };

  // Navigate to create party
  const navigateToCreateParty = () => {
    navigation.navigate('CreateParty' as never);
  };

  // Join party
  const joinParty = async (partyId: string) => {
    try {
      setLoading(true);
      const response = await api.post(`/parties/${partyId}/join`);
      
      // Navigate to video chat
      navigation.navigate('VideoChat' as never, {
        partyId,
        token: response.data.token,
        uid: response.data.uid,
      } as never);
    } catch (error) {
      console.error('Failed to join party:', error);
      Alert.alert('Error', 'Failed to join party. Please try again.');
      setLoading(false);
    }
  };

  // Render party item
  const renderPartyItem = ({ item }: { item: Party }) => (
    <TouchableOpacity
      style={styles.partyItem}
      onPress={() => joinParty(item._id)}
      disabled={loading}
    >
      <View style={styles.partyInfo}>
        <Text style={styles.partyName}>{item.name}</Text>
        <Text style={styles.partyHost}>
          Hosted by {item.hostId._id === user?._id ? 'You' : item.hostId.username}
        </Text>
        <View style={styles.partyDetails}>
          <View style={styles.partyDetail}>
            <Ionicons name="people" size={16} color="#666" />
            <Text style={styles.partyDetailText}>
              {item.participants.length}/{item.maxParticipants}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.partyAction}>
        <Ionicons name="videocam" size={24} color="#6200ee" />
        <Text style={styles.partyActionText}>Join</Text>
      </View>
    </TouchableOpacity>
  );

  // Render friend item
  const renderFriendItem = ({ item }: { item: User }) => (
    <View style={styles.friendItem}>
      <View style={styles.friendAvatar}>
        <Text style={styles.friendInitial}>{item.username.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.username}</Text>
        <View style={styles.statusContainer}>
          <View style={styles.statusIndicator} />
          <Text style={styles.statusText}>In the house</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>House Party</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={navigateToCreateParty}
          disabled={loading}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
        </View>
      ) : (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={
            <>
              {/* Active Parties Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Active Parties</Text>
                  <TouchableOpacity onPress={navigateToPartyList}>
                    <Text style={styles.seeAllText}>See All</Text>
                  </TouchableOpacity>
                </View>

                {activeParties.length > 0 ? (
                  <FlatList
                    data={activeParties.slice(0, 3)}
                    renderItem={renderPartyItem}
                    keyExtractor={(item) => item._id}
                    horizontal={false}
                    scrollEnabled={false}
                  />
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No active parties</Text>
                    <TouchableOpacity
                      style={styles.startPartyButton}
                      onPress={navigateToCreateParty}
                    >
                      <Text style={styles.startPartyText}>Start a Party</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Friends in House Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Friends in the House</Text>
                </View>

                {friendsInHouse.length > 0 ? (
                  <FlatList
                    data={friendsInHouse}
                    renderItem={renderFriendItem}
                    keyExtractor={(item) => item._id}
                    horizontal={false}
                    scrollEnabled={false}
                  />
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No friends in the house</Text>
                    <Text style={styles.emptySubtext}>
                      Invite your friends to join House Party
                    </Text>
                  </View>
                )}
              </View>
            </>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#6200ee']}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
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
    color: '#333',
  },
  createButton: {
    backgroundColor: '#6200ee',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#6200ee',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  partyHost: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  partyDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partyDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  partyDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  partyAction: {
    alignItems: 'center',
  },
  partyActionText: {
    fontSize: 12,
    color: '#6200ee',
    marginTop: 5,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  friendInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4caf50',
    marginRight: 5,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  startPartyButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 15,
  },
  startPartyText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default HomeScreen;

