import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';

// Define route params type
type VerifyEmailRouteParams = {
  email: string;
};

type VerifyEmailRouteProp = RouteProp<{ VerifyEmail: VerifyEmailRouteParams }, 'VerifyEmail'>;

const VerifyEmailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<VerifyEmailRouteProp>();
  const { verifyEmail, loading, error, clearError } = useAuthStore();

  const { email } = route.params || { email: '' };
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Create refs for each OTP input
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Start countdown timer for resend button
  useEffect(() => {
    if (resendDisabled) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setResendDisabled(false);
            return 60;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [resendDisabled]);

  // Handle OTP input change
  const handleOtpChange = (text: string, index: number) => {
    // Only allow numbers
    if (!/^\d*$/.test(text)) return;

    // Update OTP array
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Clear error
    setOtpError('');
    clearError();

    // Move to next input if current input is filled
    if (text.length === 1 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle key press for backspace
  const handleKeyPress = (e: any, index: number) => {
    // Move to previous input on backspace if current input is empty
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Validate OTP
  const validateOtp = () => {
    // Check if OTP is complete
    if (otp.some((digit) => !digit)) {
      setOtpError('Please enter the complete verification code');
      return false;
    }

    return true;
  };

  // Handle verify OTP
  const handleVerify = async () => {
    if (!validateOtp()) return;

    try {
      // Join OTP digits
      const otpString = otp.join('');
      
      await verifyEmail(email, otpString);
      
      // Navigate to home screen on success
      Alert.alert(
        'Email Verified',
        'Your email has been verified successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // The auth store will handle the navigation based on isAuthenticated state
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Verification Failed', 'Invalid or expired verification code.');
    }
  };

  // Handle resend OTP
  const handleResend = async () => {
    try {
      // TODO: Implement resend OTP API call
      // await resendOtp(email);
      
      // Disable resend button for 60 seconds
      setResendDisabled(true);
      
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
    } catch (error) {
      Alert.alert('Resend Failed', 'Failed to resend verification code. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit verification code to
            </Text>
            <Text style={styles.email}>{email}</Text>
          </View>

          <View style={styles.form}>
            {/* OTP Input */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            {/* Error Message */}
            {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Verify Button */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleVerify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify</Text>
              )}
            </TouchableOpacity>

            {/* Resend Code */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive the code? </Text>
              <TouchableOpacity
                onPress={handleResend}
                disabled={resendDisabled}
              >
                <Text
                  style={[
                    styles.resendLink,
                    resendDisabled && styles.resendDisabled,
                  ]}
                >
                  {resendDisabled ? `Resend in ${countdown}s` : 'Resend'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  form: {
    width: '100%',
    alignItems: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: '#f9f9f9',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#6200ee',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  resendText: {
    color: '#666',
    fontSize: 14,
  },
  resendLink: {
    color: '#6200ee',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resendDisabled: {
    color: '#999',
  },
});

export default VerifyEmailScreen;

