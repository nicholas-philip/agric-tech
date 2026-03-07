import React, { useState, useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
// Fixed: Changed useSegment to useSegments
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import 'react-native-reanimated';
import '../global.css';
import auth from '@react-native-firebase/auth';

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();
  const colorScheme = useColorScheme();
  const router = useRouter();

  // Fixed: useSegments() returns an array of the current route path
  const segments = useSegments();

  const onAuthStateChanged = (user) => {
    setUser(user);
    if (initializing) setInitializing(false);
  };

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber;
  }, []);

  useEffect(() => {
    if (initializing) return;

    // Check if the user is currently in the (auth) group or (tabs) group
    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // If no user and not on a login screen, redirect to login
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // If user is logged in and trying to access login screen, redirect to home
      router.replace('/(tabs)');
    }
  }, [user, initializing, segments]);

  if (initializing) return null; // Or a loading spinner

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Define your route groups */}
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
