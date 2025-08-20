import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import api from '../../api';

const CreatePartyScreen = () => {
  const navigation = useNavigation();

  const [partyName, setPartyName] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle create party
  const handleCreateParty = async () => {
    // Validate party name
    if (!partyName.trim()) {
      setError('Party name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create party
      const response = await api.post('/parties', {
        name: partyName,
        maxParticipants,
      });

      // Navigate to video chat
      navigation.navigate('VideoChat' as never, {
        partyId: response.data.party._id,
        token: response.data.token,
        uid: response.data.uid,
      } as never);
    } catch (error: any) {
      console.error('Create party error:', error);
      setError(error.response?.data?.error || 'Failed to create party');
      Alert.alert('Error', 'Failed to create party. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>Create a Party</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.form}>
            {/* Party Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Party Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter a name for your party"
                value={partyName}
                onChangeText={setPartyName}
                maxLength={30}
              />
              <Text style={styles.charCount}>{partyName.length}/30</Text>
            </View>

            {/* Max Participants Slider */}
            <View style={styles.sliderContainer}>
              <Text style={styles.label}>Max Participants</Text>
              <Slider
                style={styles.slider}
                minimumValue={2}
                maximumValue={10}
                step={1}
                value={maxParticipants}
                onValueChange={setMaxParticipants}
                minimumTrackTintColor="#6200ee"
                maximumTrackTintColor="#d1d1d1"
                thumbTintColor="#6200ee"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderMinLabel}>2</Text>
                <Text style={styles.sliderValueLabel}>{maxParticipants}</Text>
                <Text style={styles.sliderMaxLabel}>10</Text>
              </View>
            </View>

            {/* Error Message */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Create Button */}
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateParty}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="videocam" size={20} color="#fff" />
                  <Text style={styles.createButtonText}>Start Party</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 34, // Same width as back button for centering
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 25,
    position: 'relative',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  charCount: {
    position: 'absolute',
    right: 10,
    bottom: 15,
    fontSize: 12,
    color: '#999',
  },
  sliderContainer: {
    marginBottom: 30,
  },
  slider: {
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  sliderMinLabel: {
    fontSize: 12,
    color: '#999',
  },
  sliderMaxLabel: {
    fontSize: 12,
    color: '#999',
  },
  sliderValueLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#6200ee',
    height: 50,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default CreatePartyScreen;

