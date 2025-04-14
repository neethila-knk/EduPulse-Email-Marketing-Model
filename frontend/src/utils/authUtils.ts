import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Define response types for better type safety
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserData;
  message?: string;
}

interface RefreshTokenResponse {
  accessToken: string;
}

interface UserData {
  id: string;
  username: string;
  email: string;
  provider: string;
}

// Setup axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Create an in-memory storage as a fallback
const memoryStorage: Record<string, string> = {};

// Helper function to safely store data with localStorage fallback to memory
const safeStore = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Error storing ${key} in localStorage, using memory storage instead:`, error);
    memoryStorage[key] = value;
  }
};

// Helper function to safely retrieve data with localStorage fallback from memory
const safeGet = (key: string): string | null => {
  try {
    const value = localStorage.getItem(key);
    return value;
  } catch (error) {
    console.warn(`Error retrieving ${key} from localStorage, using memory storage instead:`, error);
    return memoryStorage[key] || null;
  }
};

// Helper function to safely remove data from both storages
const safeRemove = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Error removing ${key} from localStorage:`, error);
  }
  delete memoryStorage[key];
};

// Add interceptor to include the access token in requests
api.interceptors.request.use(
  (config) => {
    const accessToken = safeGet('accessToken');
    // Make sure config.headers exists
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add interceptor to handle token refresh on 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Check if error has a response and status code
    if (error && error.response) {
      const originalRequest = error.config;
      if (originalRequest && 
          error.response.status === 401 && 
          !originalRequest.headers?._retry) {
        
        // Type assertion here
        if (originalRequest.headers) {
          originalRequest.headers._retry = true;
        }
        
        try {
          const refreshToken = safeGet('refreshToken');
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }
          
          // Request a new access token
          const response = await axios.post<RefreshTokenResponse>(
            `${API_URL}/auth/refresh-token`, 
            { refreshToken }
          );
          
          // Store the new access token
          const { accessToken } = response.data;
          safeStore('accessToken', accessToken);
          
          // Update the authorization header
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          
          // Retry the original request
          return api(originalRequest);
        } catch (refreshError) {
          // If refresh token is invalid, log the user out
          logout();
          window.location.href = '/login?expired=true';
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export const login = async (email: string, password: string) => {
  try {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = response.data;
    
    // Store tokens and user data
    safeStore('accessToken', accessToken);
    safeStore('refreshToken', refreshToken);
    safeStore('user', JSON.stringify(user));
    
    return { 
      success: true, 
      user, 
      message: response.data.message || 'Login successful' 
    };
  } catch (error: any) {
    console.log("Login error in authUtils:", error);
    
    // Check if we have a response with data
    if (error.response && error.response.data) {
      const { data } = error.response;
      
      console.log("Error response data:", data);
      
      // Return the complete error structure including errors object if it exists
      return { 
        success: false, 
        message: data.message || 'Login failed',
        errors: data.errors // Pass through the field-specific errors
      };
    }
    
    // Handle network or other errors
    return { 
      success: false, 
      message: error.message || 'An unexpected error occurred',
      errors: {}
    };
  }
};

export const register = async (userData: {
  username: string;
  email: string;
  password: string;
}) => {
  try {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    const { accessToken, refreshToken, user } = response.data;
    
    // Store tokens and user data
    safeStore('accessToken', accessToken);
    safeStore('refreshToken', refreshToken);
    safeStore('user', JSON.stringify(user));
    
    return { success: true, user };
  } catch (error: any) {
    if (error.response && error.response.data) {
      return { 
        success: false, 
        message: error.response.data.message || 'Registration failed',
        errors: error.response.data.errors
      };
    }
    return { success: false, message: 'An unexpected error occurred' };
  }
};

export const logout = async (): Promise<void> => {
  try {
    // Call the logout API endpoint
    await api.get('/auth/logout');
  } catch (error) {
    console.error('Logout API error:', error);
  } finally {
    // Clear local storage regardless of API response
    safeRemove('accessToken');
    safeRemove('refreshToken');
    safeRemove('user');
  }
};

export const getUser = (): UserData | null => {
  const userString = safeGet('user');
  return userString ? JSON.parse(userString) : null;
};

export const isAuthenticated = (): boolean => {
  return !!safeGet('accessToken');
};

export const authApi = api; // Export the configured axios instance

// OAuth links
export const googleAuthUrl = `${API_URL}/auth/google`;

