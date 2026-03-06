import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
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
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // Get the users ID token
      const { data } = await GoogleSignin.signIn();
      const idToken = data.idToken;

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      await auth().signInWithCredential(googleCredential);
      
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
    setLoading(true);
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      console.log('User created:', user);
      Alert.alert("Success!", "Your account has been created!");
      router.replace('/(tabs)');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert("Error", "That email address is already in use!");
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert("Error", "That email address is invalid!");
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
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
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
    <SafeAreaView className="flex-1 bg-gray-50">
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
