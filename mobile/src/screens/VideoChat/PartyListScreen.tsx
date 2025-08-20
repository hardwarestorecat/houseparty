import React, { useState, useEffect, useCallback } from 'react';
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
import api from '../../api';

interface User {
  _id: string;
  username: string;
  profilePicture?: string;
}

interface Party {
  _id: string;
  name: string;
  hostId: User;
  participants: User[];
  maxParticipants: number;
  createdAt: string;
}

const PartyListScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();

  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch parties
  const fetchParties = useCallback(async () => {
    try {
      const response = await api.get('/parties');
      setParties(response.data.parties);
    } catch (error) {
      console.error('Failed to fetch parties:', error);
      Alert.alert('Error', 'Failed to load parties. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load parties on mount
  useEffect(() => {
    fetchParties();
  }, [fetchParties]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchParties();
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

  // Navigate to create party
  const navigateToCreateParty = () => {
    navigation.navigate('CreateParty' as never);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
          <View style={styles.partyDetail}>
            <Ionicons name="time" size={16} color="#666" />
            <Text style={styles.partyDetailText}>
              {formatDate(item.createdAt)}
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

  // Render empty component
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="videocam-off" size={60} color="#ccc" />
      <Text style={styles.emptyText}>No active parties</Text>
      <Text style={styles.emptySubtext}>
        Start a new party or wait for your friends to start one
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={navigateToCreateParty}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.createButtonText}>Start a Party</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Active Parties</Text>
        <TouchableOpacity
          style={styles.createIconButton}
          onPress={navigateToCreateParty}
        >
          <Ionicons name="add" size={24} color="#6200ee" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
        </View>
      ) : (
        <FlatList
          data={parties}
          renderItem={renderPartyItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyComponent}
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
  createIconButton: {
    padding: 5,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 400,
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
    marginBottom: 30,
  },
  createButton: {
    backgroundColor: '#6200ee',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default PartyListScreen;

