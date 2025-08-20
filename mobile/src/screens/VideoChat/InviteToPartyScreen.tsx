import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import api from '../../api';

// Define route params type
type InviteToPartyRouteParams = {
  partyId: string;
  partyName: string;
};

type InviteToPartyRouteProp = RouteProp<{ InviteToParty: InviteToPartyRouteParams }, 'InviteToParty'>;

interface User {
  _id: string;
  username: string;
  profilePicture?: string;
  isSelected?: boolean;
}

const InviteToPartyScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<InviteToPartyRouteProp>();
  const { user } = useAuthStore();

  const { partyId, partyName } = route.params;

  const [friends, setFriends] = useState<User[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<User[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);

  // Fetch friends
  const fetchFriends = useCallback(async () => {
    try {
      const response = await api.get('/friends');
      setFriends(response.data.friends);
      setFilteredFriends(response.data.friends);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
      Alert.alert('Error', 'Failed to load friends. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load friends on mount
  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  // Filter friends based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter((friend) =>
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFriends(filtered);
    }
  }, [searchQuery, friends]);

  // Toggle friend selection
  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends((prev) => {
      if (prev.includes(friendId)) {
        return prev.filter((id) => id !== friendId);
      } else {
        return [...prev, friendId];
      }
    });
  };

  // Send invitations
  const sendInvitations = async () => {
    if (selectedFriends.length === 0) {
      Alert.alert('No Friends Selected', 'Please select at least one friend to invite.');
      return;
    }

    setInviting(true);

    try {
      // Send invitations one by one
      const invitationPromises = selectedFriends.map((friendId) =>
        api.post(`/parties/${partyId}/invite`, { userId: friendId })
      );

      await Promise.all(invitationPromises);

      Alert.alert(
        'Invitations Sent',
        `Invitations sent to ${selectedFriends.length} friend${selectedFriends.length > 1 ? 's' : ''}.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to send invitations:', error);
      Alert.alert('Error', 'Failed to send invitations. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  // Render friend item
  const renderFriendItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[
        styles.friendItem,
        selectedFriends.includes(item._id) && styles.friendItemSelected,
      ]}
      onPress={() => toggleFriendSelection(item._id)}
      disabled={inviting}
    >
      <View style={styles.friendAvatar}>
        <Text style={styles.friendInitial}>{item.username.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.friendName}>{item.username}</Text>
      <View style={styles.checkboxContainer}>
        {selectedFriends.includes(item._id) ? (
          <Ionicons name="checkmark-circle" size={24} color="#6200ee" />
        ) : (
          <View style={styles.checkbox} />
        )}
      </View>
    </TouchableOpacity>
  );

  // Render empty component
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people" size={60} color="#ccc" />
      <Text style={styles.emptyText}>No friends found</Text>
      <Text style={styles.emptySubtext}>
        {searchQuery.trim() !== ''
          ? 'Try a different search term'
          : 'Add friends to invite them to parties'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={inviting}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Invite Friends</Text>
          <View style={styles.placeholder} />
        </View>

        <Text style={styles.partyName}>to {partyName}</Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search friends"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200ee" />
          </View>
        ) : (
          <FlatList
            data={filteredFriends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyComponent}
          />
        )}

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.inviteButton,
              (selectedFriends.length === 0 || inviting) && styles.inviteButtonDisabled,
            ]}
            onPress={sendInvitations}
            disabled={selectedFriends.length === 0 || inviting}
          >
            {inviting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={20} color="#fff" />
                <Text style={styles.inviteButtonText}>
                  Send {selectedFriends.length > 0 ? `(${selectedFriends.length})` : ''}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  keyboardAvoidingView: {
    flex: 1,
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
  partyName: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 20,
    marginVertical: 10,
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
    paddingBottom: 100,
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
  friendItemSelected: {
    backgroundColor: '#f0e6ff',
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
  friendName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  checkboxContainer: {
    width: 30,
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 15,
  },
  inviteButton: {
    backgroundColor: '#6200ee',
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteButtonDisabled: {
    backgroundColor: '#b794f6',
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default InviteToPartyScreen;

