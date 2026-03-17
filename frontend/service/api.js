import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration - Automatically detects environment
const DEV_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:5000/api' 
  : 'http://localhost:5000/api';

const PROD_URL = 'https://your-production-url.com/api'; // Replace with your production URL

export const API_BASE_URL = __DEV__ ? DEV_URL : PROD_URL;

const ENDPOINTS = {
  // Auth
  AUTH: '/auth',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FIREBASE_LOGIN: '/auth/firebase-login',
  ME: '/auth/me',
  UPDATE_PROFILE: '/auth/update',
  UPDATE_PASSWORD: '/auth/update-password',
  
  // Farms
  FARMS: '/farms',
  MY_FARMS: '/farms/my',
  NEARBY_FARMS: '/farms/nearby',
  
  // Activities
  ACTIVITIES: '/activities',
  MY_ACTIVITIES: '/activities/my',
  
  // Batches
  BATCHES: '/batches',
  MY_BATCHES: '/batches/my',
  BATCH_TRANSFER: '/batches/transfer',
  
  // Climate
  CLIMATE: '/climate',
  MY_CLIMATE: '/climate/my',
  
  // Credit
  CREDIT_PASSPORT: '/farmers/credit-passport',
  REFRESH_CREDIT: '/farmers/credit-passport/refresh',
  
  // Investors
  INVESTOR_FARMERS: '/investors/farmers',
  
  // Agro-Dealers
  AGRODEALERS: '/agrodealers',
  AGRODEALER_TRANSACTIONS: '/agrodealers/transactions',
  MY_TRANSACTIONS: '/agrodealers/transactions/my',
  
  // Agronomist
  AGRONOMIST_BASE: '/agronomist',
  RECOMMENDATIONS: '/agronomist/recommendations',
  MY_RECOMMENDATIONS: '/agronomist/recommendations/my',
  
  // Cooperatives
  COOPERATIVES: '/cooperatives',
  MY_COOPERATIVES: '/cooperatives/my',
};

/**
 * Generic fetch wrapper
 */
const apiFetch = async (endpoint, options = {}) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

// ==========================================
// AUTH API
// ==========================================
export const authApi = {
  login: async (credentials) => {
    const response = await apiFetch(ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.data?.token) {
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  register: async (userData) => {
    const response = await apiFetch(ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.data?.token) {
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  firebaseLogin: async (idToken, extraData = {}) => {
    const response = await apiFetch(ENDPOINTS.FIREBASE_LOGIN, {
      method: 'POST',
      body: JSON.stringify({ idToken, ...extraData }),
    });
    
    if (response.data?.token) {
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  getMe: () => apiFetch(ENDPOINTS.ME),

  updateProfile: (data) => apiFetch(ENDPOINTS.UPDATE_PROFILE, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  updatePassword: (passwords) => apiFetch(ENDPOINTS.UPDATE_PASSWORD, {
    method: 'PUT',
    body: JSON.stringify(passwords),
  }),

  logout: async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
  },

  isLoggedIn: async () => {
    const token = await AsyncStorage.getItem('userToken');
    return !!token;
  },

  getStoredUser: async () => {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },
};

// ==========================================
// FARMS API
// ==========================================
export const farmApi = {
  getMyFarms: () => apiFetch(ENDPOINTS.MY_FARMS),
  
  getFarm: (id) => apiFetch(`${ENDPOINTS.FARMS}/${id}`),
  
  createFarm: (data) => apiFetch(ENDPOINTS.FARMS, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  updateFarm: (id, data) => apiFetch(`${ENDPOINTS.FARMS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  deleteFarm: (id) => apiFetch(`${ENDPOINTS.FARMS}/${id}`, {
    method: 'DELETE',
  }),
  
  getNearbyFarms: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`${ENDPOINTS.NEARBY_FARMS}?${query}`);
  },
};

// ==========================================
// ACTIVITIES API
// ==========================================
export const activityApi = {
  getMyActivities: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`${ENDPOINTS.MY_ACTIVITIES}${query ? '?' + query : ''}`);
  },
  
  getActivitiesByFarm: (farmId) => apiFetch(`${ENDPOINTS.ACTIVITIES}/farm/${farmId}`),
  
  logActivity: (data) => apiFetch(ENDPOINTS.ACTIVITIES, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  updateActivity: (id, data) => apiFetch(`${ENDPOINTS.ACTIVITIES}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  deleteActivity: (id) => apiFetch(`${ENDPOINTS.ACTIVITIES}/${id}`, {
    method: 'DELETE',
  }),
};

// ==========================================
// BATCHES API
// ==========================================
export const batchApi = {
  getMyBatches: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`${ENDPOINTS.MY_BATCHES}${query ? '?' + query : ''}`);
  },
  
  getBatch: (batchId) => apiFetch(`${ENDPOINTS.BATCHES}/${batchId}`),
  
  getBatchHistory: (batchId) => apiFetch(`${ENDPOINTS.BATCHES}/${batchId}/history`),
  
  createBatch: (data) => apiFetch(ENDPOINTS.BATCHES, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  updateBatch: (batchId, data) => apiFetch(`${ENDPOINTS.BATCHES}/${batchId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  transferBatch: (data) => apiFetch(ENDPOINTS.BATCH_TRANSFER, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// ==========================================
// CLIMATE API
// ==========================================
export const climateApi = {
  getMyClimateProfiles: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`${ENDPOINTS.MY_CLIMATE}${query ? '?' + query : ''}`);
  },
  
  getClimateProfile: (id) => apiFetch(`${ENDPOINTS.CLIMATE}/${id}`),
  
  createClimateProfile: (data) => apiFetch(ENDPOINTS.CLIMATE, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  updateClimateProfile: (id, data) => apiFetch(`${ENDPOINTS.CLIMATE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  deleteClimateProfile: (id) => apiFetch(`${ENDPOINTS.CLIMATE}/${id}`, {
    method: 'DELETE',
  }),
};

// ==========================================
// CREDIT PASSPORT API
// ==========================================
export const creditApi = {
  getMyCreditPassport: () => apiFetch(ENDPOINTS.CREDIT_PASSPORT),
  
  refreshCreditScore: () => apiFetch(ENDPOINTS.REFRESH_CREDIT, {
    method: 'POST',
  }),
};

// ==========================================
// INVESTOR API
// ==========================================
export const investorApi = {
  getFarmers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`${ENDPOINTS.INVESTOR_FARMERS}${query ? '?' + query : ''}`);
  },
  
  getFarmer: (farmerId) => apiFetch(`${ENDPOINTS.INVESTOR_FARMERS}/${farmerId}`),
  
  getFarmerCredit: (farmerId) => apiFetch(`${ENDPOINTS.INVESTOR_FARMERS}/${farmerId}/credit`),
  
  getFarmerClimate: (farmerId) => apiFetch(`${ENDPOINTS.INVESTOR_FARMERS}/${farmerId}/climate`),
  
  getFarmerActivities: (farmerId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`${ENDPOINTS.INVESTOR_FARMERS}/${farmerId}/activities${query ? '?' + query : ''}`);
  },
};

// ==========================================
// AGRO-DEALER API
// ==========================================
export const agrodealerApi = {
  getAgrodealers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`${ENDPOINTS.AGRODEALERS}${query ? '?' + query : ''}`);
  },
  
  getAgrodealer: (id) => apiFetch(`${ENDPOINTS.AGRODEALERS}/${id}`),
  
  updateDealerProfile: (data) => apiFetch(ENDPOINTS.AGRODEALERS, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  recordTransaction: (data) => apiFetch(ENDPOINTS.AGRODEALER_TRANSACTIONS, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getMyTransactions: () => apiFetch(ENDPOINTS.MY_TRANSACTIONS),
  
  rateDealer: (dealerId, data) => apiFetch(`${ENDPOINTS.AGRODEALERS}/${dealerId}/rate`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// ==========================================
// AGRONOMIST API
// ==========================================
export const agronomistApi = {
  createRecommendation: (data) => apiFetch(ENDPOINTS.RECOMMENDATIONS, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getMyRecommendations: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`${ENDPOINTS.MY_RECOMMENDATIONS}${query ? '?' + query : ''}`);
  },
  
  getFarmerRecommendations: (farmerId) => 
    apiFetch(`${ENDPOINTS.RECOMMENDATIONS}/farmer/${farmerId}`),
  
  updateRecommendation: (id, data) => apiFetch(`${ENDPOINTS.RECOMMENDATIONS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  updateFarmerFeedback: (id, data) => apiFetch(`${ENDPOINTS.RECOMMENDATIONS}/${id}/feedback`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  getFarmerFarms: (farmerId) => 
    apiFetch(`${ENDPOINTS.AGRONOMIST_BASE}/farmers/${farmerId}/farms`),

  getFarmActivities: (farmId) => 
    apiFetch(`${ENDPOINTS.AGRONOMIST_BASE}/farms/${farmId}/activities`),
};

// ==========================================
// COOPERATIVE API
// ==========================================
export const cooperativeApi = {
  getCooperatives: () => apiFetch(ENDPOINTS.COOPERATIVES),
  
  getMyCooperatives: () => apiFetch(ENDPOINTS.MY_COOPERATIVES),
  
  getCooperative: (id) => apiFetch(`${ENDPOINTS.COOPERATIVES}/${id}`),
  
  createCooperative: (data) => apiFetch(ENDPOINTS.COOPERATIVES, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  updateCooperative: (id, data) => apiFetch(`${ENDPOINTS.COOPERATIVES}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  addMember: (id, data) => apiFetch(`${ENDPOINTS.COOPERATIVES}/${id}/members`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  removeMember: (cooperativeId, farmerId) => 
    apiFetch(`${ENDPOINTS.COOPERATIVES}/${cooperativeId}/members/${farmerId}`, {
      method: 'DELETE',
    }),
};

// ==========================================
// EXPORT
// ==========================================
export default {
  auth: authApi,
  farms: farmApi,
  activities: activityApi,
  batches: batchApi,
  climate: climateApi,
  credit: creditApi,
  investors: investorApi,
  agrodealers: agrodealerApi,
  agronomist: agronomistApi,
  cooperatives: cooperativeApi,
};