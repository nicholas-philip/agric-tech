
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';import { Ionicons } from '@expo/vector-icons';
// 1. Import Firebase Auth
import auth from '@react-native-firebase/auth';

export default function HomeScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              // 2. Sign out from Firebase
              // This triggers the useEffect in your root _layout.jsx
              // which will automatically redirect to the login screen.
              await auth().signOut();

              // 3. Optional: Manually replace the route for immediate feedback
              router.replace('/(auth)/login');
            } catch (error) {
              console.error("Error logging out:", error);
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6">
        <View className="mt-12 mb-8 flex-row justify-between items-start">
          <View>
            <Text className="text-4xl font-extrabold text-emerald-800 tracking-tight">
              AgricTech
            </Text>
            <Text className="text-lg text-emerald-600 font-medium">
              Welcome to the future of farming
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-50 p-3 rounded-2xl border border-red-100 active:bg-red-100"
          >
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-2">Getting Started</Text>
          <Text className="text-gray-600 leading-relaxed mb-4">
            Manage your crops, track soil health, and optimize your yield with our smart farming tools.
          </Text>
          <TouchableOpacity className="bg-emerald-500 py-3 rounded-xl items-center">
            <Text className="text-white font-bold text-lg">Quick Start</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between mb-8">
          <View className="bg-white rounded-2xl p-4 w-[48%] shadow-sm border border-emerald-50">
            <Text className="text-emerald-700 font-bold mb-1">Temperature</Text>
            <Text className="text-2xl font-black text-gray-800">24°C</Text>
          </View>
          <View className="bg-white rounded-2xl p-4 w-[48%] shadow-sm border border-emerald-50">
            <Text className="text-emerald-700 font-bold mb-1">Moisture</Text>
            <Text className="text-2xl font-black text-gray-800">68%</Text>
          </View>
        </View>

        <View className="mb-10">
          <Text className="text-xl font-bold text-gray-800 mb-4">Your Recent Fields</Text>
          {[1, 2, 3].map((i) => (
            <View key={i} className="flex-row items-center bg-white p-4 rounded-2xl mb-3 shadow-sm border border-emerald-50">
              <View className="w-12 h-12 bg-emerald-100 rounded-full items-center justify-center mr-4">
                <View className="w-6 h-6 bg-emerald-500 rounded-sm rotate-45" />
              </View>
              <View>
                <Text className="font-bold text-gray-800 text-lg">North Field {i}</Text>
                <Text className="text-emerald-600 text-sm font-medium">Ready for harvest in 12 days</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}