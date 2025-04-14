import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Define response types for better type safety
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  admin: AdminData;
  message?: string;
}

interface RefreshTokenResponse {
  accessToken: string;
}

interface AdminData {
  _id: string;
  username: string;
  email: string;
  role: string;
}

// Setup axios instance with base URL
export const adminApi = axios.create({
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
adminApi.interceptors.request.use(
  (config) => {
    const accessToken = safeGet('adminToken');
    // Make sure config.headers exists
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add interceptor to handle token refresh on 401 errors
adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip token refresh logic for login, register, logout, or refresh endpoints
    const excludedPaths = ["/admin/login", "/admin/register", "/admin/logout", "/admin/refresh-token"];
    if (excludedPaths.some(path => originalRequest.url?.includes(path))) {
      return Promise.reject(error);
    }

    if (error?.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = safeGet('adminRefreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post<RefreshTokenResponse>(
          `${API_URL}/admin/refresh-token`, 
          { refreshToken }
        );

        const { accessToken } = response.data;
        safeStore('adminToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return adminApi(originalRequest);
      } catch (refreshError) {
        adminLogout();
        window.location.href = '/admin/login?expired=true';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);


export const adminLogin = async (email: string, password: string) => {
  try {
    const response = await adminApi.post<AuthResponse>('/admin/login', { email, password });
    const { accessToken, refreshToken, admin } = response.data;
    
    // Store tokens and admin data
    safeStore('adminToken', accessToken);
    safeStore('adminRefreshToken', refreshToken);
    safeStore('admin', JSON.stringify(admin));
    
    return { 
      success: true, 
      admin, 
      message: response.data.message || 'Login successful' 
    };
  } catch (error: any) {
    console.log("Admin login error:", error);
    
    // Check for blocked account (403 status code)
    if (error.response?.status === 403) {
      return { 
        success: false, 
        message: error.response.data.message || 'Your account has been deactivated',
        error: 'ACCOUNT_DEACTIVATED',
        errors: { auth: 'Account deactivated' }
      };
    }
    
    // Check if we have a response with data
    if (error.response?.data) {
      const { data } = error.response;
      
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

export const adminRegister = async (userData: {
  username: string;
  email: string;
  password: string;
}) => {
  try {
    const response = await adminApi.post<AuthResponse>('/admin/register', userData);
    const { accessToken, refreshToken, admin } = response.data;
    
    // Store tokens and admin data
    safeStore('adminToken', accessToken);
    safeStore('adminRefreshToken', refreshToken);
    safeStore('admin', JSON.stringify(admin));
    
    return { 
      success: true, 
      admin,
      message: 'Registration successful'
    };
  } catch (error: any) {
    if (error.response?.data) {
      return { 
        success: false, 
        message: error.response.data.message || 'Registration failed',
        errors: error.response.data.errors
      };
    }
    return { 
      success: false, 
      message: 'An unexpected error occurred',
      errors: {}
    };
  }
};

export const adminLogout = async (): Promise<void> => {
  try {
    // Call the logout API endpoint
    await adminApi.get('/admin/logout');
  } catch (error) {
    console.error('Admin logout API error:', error);
  } finally {
    // Clear local storage regardless of API response
    safeRemove('adminToken');
    safeRemove('adminRefreshToken');
    safeRemove('admin');
  }
};

export const getAdmin = (): AdminData | null => {
  const adminString = safeGet('admin');
  return adminString ? JSON.parse(adminString) : null;
};

export const isAdminAuthenticated = (): boolean => {
  return !!safeGet('adminToken');
};

export const adminAuthApi = adminApi; // Export the configured axios instance