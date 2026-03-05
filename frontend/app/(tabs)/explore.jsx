import { Text, View, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import React from 'react';

export default function ExploreScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6">
        <View className="mt-12 mb-8">
          <Text className="text-4xl font-extrabold text-emerald-800 tracking-tight">Explore</Text>
          <Text className="text-lg text-emerald-600 font-medium">Discover new farming techniques</Text>
        </View>

        <View className="gap-4">
          <TouchableOpacity className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-50">
            <Text className="text-xl font-bold text-gray-800">Crop Science</Text>
            <Text className="text-gray-600 mt-1">Latest research on high-yield varieties</Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-50">
            <Text className="text-xl font-bold text-gray-800">Soil Management</Text>
            <Text className="text-gray-600 mt-1">Optimize your soil health for better results</Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-50">
            <Text className="text-xl font-bold text-gray-800">Market Trends</Text>
            <Text className="text-gray-600 mt-1">Track prices and demand for your products</Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-50">
            <Text className="text-xl font-bold text-gray-800">Equipment</Text>
            <Text className="text-gray-600 mt-1">Maintenance tips for your machinery</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
