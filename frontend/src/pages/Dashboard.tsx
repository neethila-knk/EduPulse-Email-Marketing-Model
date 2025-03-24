import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi, isAuthenticated } from '../utils/authUtils';

interface User {
  id: string;
  username: string;
  email: string;
  provider: string;
}

interface AuthResponse {
  user: User;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for successful login message in state
    if (location.state && (location.state as any).message) {
      setAlert({
        type: 'success',
        message: (location.state as any).message
      });
      
      // Clear the state after showing the message
      window.history.replaceState({}, document.title);
    }
    
    // Check if user is authenticated
    if (!isAuthenticated()) {
      navigate('/login', { state: { message: 'Please log in to access the dashboard' } });
      return;
    }
    
    const fetchUserData = async () => {
      try {
        // Properly type the response
        const response = await authApi.get<AuthResponse>('/auth/me');
        setUser(response.data.user);
      } catch (error) {
        console.error('Error fetching user data:', error);
        // If token is invalid, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/login', { state: { message: 'Your session has expired. Please log in again.' } });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, location]);

  const handleLogout = async () => {
    try {
      // Call the logout endpoint
      await authApi.get('/auth/logout');
      
      // Clear tokens from localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Redirect to login
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {alert && (
        <div className={`p-4 ${alert.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} rounded-md mb-4 flex justify-between items-center`}>
          <p>{alert.message}</p>
          <button 
            onClick={() => setAlert(null)}
            className="text-sm font-medium"
          >
            ✕
          </button>
        </div>
      )}
      
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">EduPulse Dashboard</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Welcome, {user?.username}!</h2>
            
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-md font-medium mb-2">Your Account</h3>
              <p className="text-gray-600">Email: {user?.email}</p>
              <p className="text-gray-600">Account Type: {user?.provider}</p>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-md font-medium mb-2">Getting Started</h3>
              <p className="text-gray-600">
                This is your dashboard. Here you can manage your campaigns, 
                track your analytics, and customize your profile.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;