import { Platform } from 'react-native';

// Use 10.0.2.2 for Android emulator to access localhost:5000
// Use localhost/127.0.0.1 for iOS simulator
// Replace with your production server URL when deploying
export const API_BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:5000/api' 
  : 'http://localhost:5000/api';

export const ENDPOINTS = {
  AUTH: `${API_BASE_URL}/auth`,
  FIREBASE_LOGIN: `${API_BASE_URL}/auth/firebase-login`,
  ME: `${API_BASE_URL}/auth/me`,
  FARMS: `${API_BASE_URL}/farms`,
  ACTIVITIES: `${API_BASE_URL}/activities`,
  BATCHES: `${API_BASE_URL}/batches`,
  CLIMATE: `${API_BASE_URL}/climate`,
  AGRODEALERS: `${API_BASE_URL}/agrodealers`,
};
