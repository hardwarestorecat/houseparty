import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api';

interface User {
  _id: string;
  username: string;
  email: string;
  phone: string;
  profilePicture?: string;
  isInHouse?: boolean;
}

interface FriendRequest {
  _id: string;
  senderId: User;
  createdAt: string;
}

const FriendsScreen = () => {
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch friends
  const fetchFriends = useCallback(async () => {
    try {
      const response = await api.get('/friends');
      setFriends(response.data.friends);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
      Alert.alert('Error', 'Failed to load friends. Please try again.');
    }
  }, []);

  // Fetch friend requests
  const fetchFriendRequests = useCallback(async () => {
    try {
      const response = await api.get('/friends/requests');
      setFriendRequests(response.data.requests);
    } catch (error) {
      console.error('Failed to fetch friend requests:', error);
      Alert.alert('Error', 'Failed to load friend requests. Please try again.');
    }
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchFriends(), fetchFriendRequests()]);
    setLoading(false);
    setRefreshing(false);
  }, [fetchFriends, fetchFriendRequests]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Search users
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const response = await api.get(`/friends/search?query=${encodeURIComponent(query)}`);
      setSearchResults(response.data.users);
    } catch (error) {
      console.error('Failed to search users:', error);
      Alert.alert('Error', 'Failed to search users. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search query change
  const handleSearchQueryChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim().length >= 3) {
      searchUsers(text);
    } else {
      setSearchResults([]);
    }
  };

  // Send friend request
  const sendFriendRequest = async (userId: string) => {
    try {
      await api.post('/friends/request', { userId });
      
      // Remove user from search results
      setSearchResults((prev) => prev.filter((user) => user._id !== userId));
      
      Alert.alert('Success', 'Friend request sent successfully.');
    } catch (error: any) {
      console.error('Failed to send friend request:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to send friend request. Please try again.');
    }
  };

  // Respond to friend request
  const respondToFriendRequest = async (invitationId: string, accept: boolean) => {
    try {
      await api.post('/friends/respond', { invitationId, accept });
      
      // Remove request from list
      setFriendRequests((prev) => prev.filter((request) => request._id !== invitationId));
      
      // If accepted, refresh friends list
      if (accept) {
        fetchFriends();
      }
      
      Alert.alert('Success', accept ? 'Friend request accepted.' : 'Friend request declined.');
    } catch (error) {
      console.error('Failed to respond to friend request:', error);
      Alert.alert('Error', 'Failed to respond to friend request. Please try again.');
    }
  };

  // Remove friend
  const removeFriend = async (friendId: string) => {
    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/friends/${friendId}`);
              
              // Remove friend from list
              setFriends((prev) => prev.filter((friend) => friend._id !== friendId));
              
              Alert.alert('Success', 'Friend removed successfully.');
            } catch (error) {
              console.error('Failed to remove friend:', error);
              Alert.alert('Error', 'Failed to remove friend. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Render friend item
  const renderFriendItem = ({ item }: { item: User }) => (
    <View style={styles.friendItem}>
      <View style={styles.friendAvatar}>
        <Text style={styles.friendInitial}>{item.username.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.username}</Text>
        <Text style={styles.friendEmail}>{item.email}</Text>
      </View>
      <TouchableOpacity
        style={styles.friendAction}
        onPress={() => removeFriend(item._id)}
      >
        <Ionicons name="person-remove" size={20} color="#ff3b30" />
      </TouchableOpacity>
    </View>
  );

  // Render friend request item
  const renderFriendRequestItem = ({ item }: { item: FriendRequest }) => (
    <View style={styles.requestItem}>
      <View style={styles.friendAvatar}>
        <Text style={styles.friendInitial}>{item.senderId.username.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.senderId.username}</Text>
        <Text style={styles.friendEmail}>{item.senderId.email}</Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.requestAction, styles.acceptButton]}
          onPress={() => respondToFriendRequest(item._id, true)}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.requestAction, styles.declineButton]}
          onPress={() => respondToFriendRequest(item._id, false)}
        >
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render search result item
  const renderSearchResultItem = ({ item }: { item: User }) => (
    <View style={styles.searchResultItem}>
      <View style={styles.friendAvatar}>
        <Text style={styles.friendInitial}>{item.username.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.username}</Text>
        <Text style={styles.friendEmail}>{item.email}</Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => sendFriendRequest(item._id)}
      >
        <Ionicons name="person-add" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  // Render empty component for friends
  const renderEmptyFriends = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people" size={60} color="#ccc" />
      <Text style={styles.emptyText}>No friends yet</Text>
      <Text style={styles.emptySubtext}>
        Search for users to add them as friends
      </Text>
    </View>
  );

  // Render empty component for friend requests
  const renderEmptyRequests = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="mail" size={60} color="#ccc" />
      <Text style={styles.emptyText}>No friend requests</Text>
      <Text style={styles.emptySubtext}>
        Friend requests will appear here
      </Text>
    </View>
  );

  // Render empty component for search results
  const renderEmptySearchResults = () => (
    <View style={styles.emptyContainer}>
      {searchQuery.trim().length > 0 ? (
        <>
          <Ionicons name="search" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No users found</Text>
          <Text style={styles.emptySubtext}>
            Try a different search term
          </Text>
        </>
      ) : (
        <>
          <Ionicons name="search" size={60} color="#ccc" />
          <Text style={styles.emptyText}>Search for users</Text>
          <Text style={styles.emptySubtext}>
            Enter at least 3 characters to search
          </Text>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'friends' && styles.activeTabText,
            ]}
          >
            Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'requests' && styles.activeTabText,
            ]}
          >
            Requests
            {friendRequests.length > 0 && (
              <Text style={styles.badgeText}> ({friendRequests.length})</Text>
            )}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'add' && styles.activeTab]}
          onPress={() => setActiveTab('add')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'add' && styles.activeTabText,
            ]}
          >
            Add
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'add' && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by username, email, or phone"
            value={searchQuery}
            onChangeText={handleSearchQueryChange}
            clearButtonMode="while-editing"
          />
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
        </View>
      ) : (
        <>
          {activeTab === 'friends' && (
            <FlatList
              data={friends}
              renderItem={renderFriendItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={renderEmptyFriends}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={['#6200ee']}
                />
              }
            />
          )}

          {activeTab === 'requests' && (
            <FlatList
              data={friendRequests}
              renderItem={renderFriendRequestItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={renderEmptyRequests}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={['#6200ee']}
                />
              }
            />
          )}

          {activeTab === 'add' && (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResultItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={renderEmptySearchResults}
              ListFooterComponent={
                isSearching ? (
                  <ActivityIndicator
                    style={styles.searchingIndicator}
                    size="small"
                    color="#6200ee"
                  />
                ) : null
              }
            />
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6200ee',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#6200ee',
    fontWeight: '500',
  },
  badgeText: {
    color: '#6200ee',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 15,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 15,
    paddingBottom: 30,
    flexGrow: 1,
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
  friendEmail: {
    fontSize: 14,
    color: '#666',
  },
  friendAction: {
    padding: 10,
  },
  requestItem: {
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
  requestActions: {
    flexDirection: 'row',
  },
  requestAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  acceptButton: {
    backgroundColor: '#4caf50',
  },
  declineButton: {
    backgroundColor: '#ff3b30',
  },
  searchResultItem: {
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  searchingIndicator: {
    marginVertical: 20,
  },
});

export default FriendsScreen;

