import axios from 'axios';
//import type { AxiosRequestConfig, AxiosResponse } from 'axios';

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

interface ErrorResponse {
  message: string;
}

// Setup axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add interceptor to include the access token in requests
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
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
          const refreshToken = localStorage.getItem('refreshToken');
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
          localStorage.setItem('accessToken', accessToken);
          
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

export const login = async (email: string, password: string): Promise<{ success: boolean; user?: UserData; message?: string }> => {
  try {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = response.data;
    
    // Store tokens and user data
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { success: true, user };
  } catch (error) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response: { data: any } };
      return { 
        success: false, 
        message: axiosError.response?.data?.message || 'Login failed' 
      };
    }
    return { success: false, message: 'An unexpected error occurred' };
  }
};

export const register = async (userData: {
  username: string;
  email: string;
  password: string;
}): Promise<{ success: boolean; user?: UserData; message?: string }> => {
  try {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    const { accessToken, refreshToken, user } = response.data;
    
    // Store tokens and user data
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { success: true, user };
  } catch (error) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response: { data: any } };
      return { 
        success: false, 
        message: axiosError.response?.data?.message || 'Registration failed' 
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
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
};

export const getUser = (): UserData | null => {
  const userString = localStorage.getItem('user');
  return userString ? JSON.parse(userString) : null;
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('accessToken');
};

export const authApi = api; // Export the configured axios instance

// OAuth links
export const googleAuthUrl = `${API_URL}/auth/google`;