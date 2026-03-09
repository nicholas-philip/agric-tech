import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
// Corrected SafeAreaView import to remove deprecation warning
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import auth, { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithCredential, 
  GoogleAuthProvider 
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS } from '../../constants';

// We removed the ROLES constant as the role is chosen after registration now.


const RoleButton = ({ label, icon, isSelected, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={{
      flex: 1,
      marginHorizontal: 4,
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isSelected ? '#10b981' : '#e5e7eb',
      backgroundColor: isSelected ? '#10b981' : '#ffffff',
      alignItems: 'center',
      justifyContent: 'center',
      // Manual shadow for stability
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    }}
  >
    <Ionicons 
      name={icon} 
      size={20} 
      color={isSelected ? 'white' : '#10b981'} 
      style={{ marginBottom: 4 }}
    />
    <Text 
      style={{
        fontSize: 10,
        fontWeight: 'bold',
        color: isSelected ? 'white' : '#047857',
        textAlign: 'center'
      }}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

export default function LoginScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '1036812190563-05cei91visu2mjbtqu9bfsfhndf31isv.apps.googleusercontent.com',
    });
  }, []);

  // Helper validation
  const validateInput = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please fill in both email and password.');
      return false;
    }
    return true;
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const { data } = await GoogleSignin.signIn();
      const idToken = data.idToken;

      const googleCredential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth(), googleCredential);

      Alert.alert("Success!", "Logged in with Google.");
      router.replace('/(tabs)');
    } catch (error) {
      console.error(error);
      Alert.alert("Google Sign-In Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!validateInput()) return;
    if (!isLogin && (!name.trim() || !phone.trim())) {
      Alert.alert('Missing Fields', 'Name and Phone are required for registration.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth(), email, password);
      const user = userCredential.user;
      
      // Sync with MongoDB backend
      const idToken = await user.getIdToken();
      const response = await fetch(ENDPOINTS.FIREBASE_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          name: name,
          phone: phone
        })
      });

      const result = await response.json();
      if (result.success) {
        await AsyncStorage.setItem('userToken', result.data.token);
        console.log('User synced with backend:', result.data.user);
        Alert.alert("Success!", "Account created and synced successfully!");
        router.replace('/(tabs)');
      } else {
        throw new Error(result.message || 'Failed to sync with backend');
      }
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert("Error", "That email address is already in use!");
      } else {
        Alert.alert("Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!validateInput()) return;
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth(), email, password);
      const user = userCredential.user;
      console.log('User logged in:', user);
      Alert.alert("Success!", "You have successfully logged in.");
      router.replace('/(tabs)');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        Alert.alert("Error", "User not found!");
      } else if (error.code === 'auth/wrong-password') {
        Alert.alert("Error", "Wrong password!");
      } else {
        Alert.alert("Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>

          <View className="items-center mb-10">
            <View className="w-20 h-20 bg-emerald-100 rounded-3xl items-center justify-center mb-6 shadow-sm">
              <View className="w-10 h-10 bg-emerald-500 rounded-md rotate-45" />
            </View>
            <Text className="text-4xl font-extrabold text-emerald-800 tracking-tight text-center">
              AgricTech

            </Text>
            <Text className="text-lg text-emerald-600 font-medium text-center mt-2">
              {isLogin ? 'Sign in to your account' : 'Create a new account'}
            </Text>
          </View>

          {!isLogin && (
            <View className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-50 mb-0">
               <View className="mb-4">
                <Text className="text-gray-700 font-bold mb-2 ml-1">Full Name</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 text-gray-800 rounded-2xl p-4 text-lg"
                  placeholder="John Doe"
                  placeholderTextColor="#9ca3af"
                  onChangeText={setName}
                  value={name}
                />
              </View>

              <View className="mb-0">
                <Text className="text-gray-700 font-bold mb-2 ml-1">Phone Number</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 text-gray-800 rounded-2xl p-4 text-lg"
                  placeholder="+254 700 000 000"
                  placeholderTextColor="#9ca3af"
                  onChangeText={setPhone}
                  value={phone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          )}

          <View className="mt-6 mb-6">
            {/* Choose role removed from here, user picks role after login */}
          </View>

          <View className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-50 mb-6">
            <View className="mb-4">
              <Text className="text-gray-700 font-bold mb-2 ml-1">Email Address</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 text-gray-800 rounded-2xl p-4 text-lg"
                placeholder="farmer@agrictech.com"
                placeholderTextColor="#9ca3af"
                onChangeText={setEmail}
                value={email}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View className="mb-6">
              <Text className="text-gray-700 font-bold mb-2 ml-1">Password</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 text-gray-800 rounded-2xl p-4 text-lg"
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                onChangeText={setPassword}
                value={password}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              onPress={isLogin ? handleLogin : handleSignUp}
              disabled={loading}
              className={`bg-emerald-500 py-4 rounded-2xl items-center shadow-sm ${loading ? 'opacity-70' : ''}`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-xl">
                  {isLogin ? 'Login' : 'Sign Up'}
                </Text>
              )}
            </TouchableOpacity>

            <View className="flex-row items-center my-6">
              <View className="flex-1 h-[1px] bg-gray-200" />
              <Text className="mx-4 text-gray-400 font-medium">OR</Text>
              <View className="flex-1 h-[1px] bg-gray-200" />
            </View>

            <TouchableOpacity 
              onPress={signInWithGoogle}
              disabled={loading}
              className="bg-white border border-gray-200 py-4 rounded-2xl flex-row items-center justify-center shadow-sm"
            >
              <Ionicons name="logo-google" size={24} color="#4285F4" style={{ marginRight: 12 }} />
              <Text className="text-gray-700 font-bold text-lg">
                Continue with Google
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={() => setIsLogin(!isLogin)}
            disabled={loading}
            className="items-center"
          >
            <Text className="text-emerald-700 font-semibold text-base py-4">
              {isLogin ? "Don't have an account? Sign up inside!" : 'Already have an account? Log in here.'}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
