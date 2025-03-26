import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, isAuthenticated } from '../utils/authUtils';
import Layout from '../components/Layout/Layout';
import Button from '../components/UI/Button';
import { Campaign } from '../types';
import PageHeader from '../components/Layout/PageHeader';

interface User {
  id: string;
  username: string;
  email: string;
  provider: string;
}

interface AuthResponse {
  user: User;
}

const CampaignsPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Sample data - this would come from your API
  const campaigns: Campaign[] = [
    {
      id: '1',
      name: 'Software engineering diploma',
      emailCount: 1000,
      status: 'pending',
    },
    {
      id: '2',
      name: 'Mixing and mastering course',
      emailCount: 500,
      status: 'canceled',
    },
    {
      id: '3',
      name: 'Music producing free course',
      emailCount: 5000,
      status: 'completed',
    },
    {
      id: '4',
      name: 'Computer hardware workshop',
      emailCount: 2500,
      status: 'ongoing',
    },
    {
      id: '5',
      name: 'Data science certification',
      emailCount: 3200,
      status: 'pending',
    },
    {
      id: '6',
      name: 'Web development bootcamp',
      emailCount: 4500,
      status: 'completed',
    },
    {
      id: '7',
      name: 'UI/UX design workshop',
      emailCount: 1800,
      status: 'ongoing',
    },
    {
      id: '8',
      name: 'AI and machine learning course',
      emailCount: 2100,
      status: 'pending',
    },
  ];

  useEffect(() => {
    document.title = "Campaigns | EduPulse";

    // Check if user is authenticated
    if (!isAuthenticated()) {
      navigate('/login', { state: { message: 'Please log in to access campaigns' } });
      return;
    }
    
    const fetchUserData = async () => {
      try {
        const response = await authApi.get<AuthResponse>('/auth/me');
        setUser(response.data.user);
      } catch (error) {
        console.error('Error fetching user data:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/login', { state: { message: 'Your session has expired. Please log in again.' } });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authApi.get('/auth/logout');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle view campaign analytics
  const handleViewCampaign = (campaignId: string) => {
    navigate(`/campaignanalytics/${campaignId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }
  
  return (
    <Layout onLogout={handleLogout} user={user}>
      <div className="flex flex-col">
        {/* Using the reusable PageHeader component */}
        <PageHeader 
          title="All Campaigns"
          size="small"
          showBackButton={true}
          onBack={() => navigate('/dashboard')}
          action={
            <Button 
              variant="secondary" 
              onClick={() => navigate('/new-campaign')}
              className="shadow-sm"
            >
              Create New Campaign
            </Button>
          }
        />
        
        {/* Content area - Proper spacing with padding instead of negative margin */}
        <div className="container mx-auto px-6 pt-8 mb-8">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-800">Campaign List</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Project name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Amount of emails
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {campaign.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {campaign.emailCount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-md ${
                          campaign.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          campaign.status === 'ongoing' ? 'bg-gray-800 text-white' :
                          campaign.status === 'completed' ? 'bg-green-600 text-white' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          className="mr-2 text-green-600 hover:text-green-900"
                          onClick={() => handleViewCampaign(campaign.id)}
                        >
                          View
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => console.log('Delete', campaign.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-white border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Showing <span className="font-medium text-gray-900">8</span> campaigns
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                    Previous
                  </button>
                  <button className="px-3 py-1 bg-green-600 text-white rounded-md text-sm">
                    1
                  </button>
                  <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                    2
                  </button>
                  <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CampaignsPage;