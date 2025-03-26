import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { authApi, isAuthenticated } from "../utils/authUtils";
import Layout from "../components/Layout/Layout";
import PageHeader from "../components/Layout/PageHeader";
import overlayImage from "../assets/elements.svg";
import Button from "../components/UI/Button";
import CircularProgressChart from "../components/UI/CircularProgress";
import StatCard from "../components/UI/StatCard";

interface User {
  id: string;
  username: string;
  email: string;
  provider: string;
}

interface AuthResponse {
  user: User;
}

interface CampaignData {
  title: string;
  emailsSent: number;
  openRate: number;
  clickThroughRate: number;
  conversionRate: number;
  status: 'active' | 'completed' | 'pending' | 'cancelled';
}

const CampaignDetails: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  // Sample campaign data - in real app this would be fetched from API
  const [campaignData, setCampaignData] = useState<CampaignData>({
    title: "Music producing free course",
    emailsSent: 500,
    openRate: 81,
    clickThroughRate: 22,
    conversionRate: 62,
    status: 'active'
  });

  useEffect(() => {
    document.title = `${campaignData.title} | EduPulse`;

    // Check for success message in location state
    if (location.state && (location.state as any).message) {
      setAlert({
        type: "success",
        message: (location.state as any).message,
      });
      window.history.replaceState({}, document.title);
    }

    // Check authentication
    if (!isAuthenticated()) {
      navigate("/login", {
        state: { message: "Please log in to view campaign details" },
      });
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await authApi.get<AuthResponse>("/auth/me");
        setUser(response.data.user);
        
        // In a real app, you would fetch the campaign details here
        // const campaignResponse = await api.get(`/campaigns/${id}`);
        // setCampaignData(campaignResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        navigate("/login", {
          state: { message: "Your session has expired. Please log in again." },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, location, id, campaignData.title]);

  const handleLogout = async () => {
    try {
      await authApi.get("/auth/logout");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleBack = () => {
    navigate('/campaigns');
  };

  const handleMarkAsCompleted = () => {
    setCampaignData({...campaignData, status: 'completed'});
    setAlert({
      type: "success",
      message: "Campaign marked as completed"
    });
  };

  const handleMarkAsPending = () => {
    setCampaignData({...campaignData, status: 'pending'});
    setAlert({
      type: "success",
      message: "Campaign marked as pending"
    });
  };

  const handleCancelCampaign = () => {
    setCampaignData({...campaignData, status: 'cancelled'});
    setAlert({
      type: "success",
      message: "Campaign has been cancelled"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <Layout onLogout={handleLogout} user={user}>
      {alert && (
        <div
          className={`p-4 ${
            alert.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          } rounded-md mx-6 mt-4 mb-3 flex justify-between items-center`}
        >
          <p>{alert.message}</p>
          <button
            onClick={() => setAlert(null)}
            className="text-sm font-medium"
          >
            ✕
          </button>
        </div>
      )}

      {/* Campaign Header */}
      <div className="relative">
        <PageHeader
          title={campaignData.title}
          showBackButton={true}
          onBack={handleBack}
          size="large"
          overlayImage={overlayImage}
          action={
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 md:space-x-4">
              <Button
                variant="secondary"
                onClick={handleMarkAsCompleted}
                className="shadow-sm text-xs sm:text-sm whitespace-nowrap"
              >
                Mark as completed
              </Button>
              <Button
                variant="pending"
                onClick={handleMarkAsPending}
                className="shadow-sm text-xs sm:text-sm whitespace-nowrap"
              >
                Mark as pending
              </Button>
              <Button
                variant="cancel"
                onClick={handleCancelCampaign}
                className="shadow-sm text-xs sm:text-sm whitespace-nowrap"
              >
                Cancel Campaign
              </Button>
            </div>
          }
        />

        {/* Campaign Stats */}
        <div className="container mx-auto px-3 sm:px-6 -mt-16 z-20 relative">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title="Emails sent"
              count={campaignData.emailsSent}
              description="Total no. of emails sent"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              }
              iconColor="text-green-600"
            />
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="container mx-auto px-3 sm:px-6 py-6 sm:py-8">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Analytics</h2>
          <button className="text-gray-500 hover:text-gray-700">
            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>

        

        {/* Circular Charts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Open Rate</h3>
            <p className="text-sm text-gray-600 mb-3">
              <span className="font-medium text-green-600">Good:</span> &gt;25% 
              <span className="mx-2">|</span>
              <span className="font-medium text-yellow-600">Average:</span> 15-25% 
              <span className="mx-2">|</span>
              <span className="font-medium text-red-600">Poor:</span> &lt;15%
            </p>
            <CircularProgressChart 
              percentage={campaignData.openRate} 
              title="Open Rate" 
              color="#dc2626" 
            />
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Click-Through Rate</h3>
            <p className="text-sm text-gray-600 mb-3">
              <span className="font-medium text-green-600">Good:</span> &gt;4% 
              <span className="mx-2">|</span>
              <span className="font-medium text-yellow-600">Average:</span> 2-4% 
              <span className="mx-2">|</span>
              <span className="font-medium text-red-600">Poor:</span> &lt;2%
            </p>
            <CircularProgressChart 
              percentage={campaignData.clickThroughRate} 
              title="Click-Through Rates" 
              subtitle="(CTR)" 
              color="#16a34a" 
            />
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Conversion Rate</h3>
            <p className="text-sm text-gray-600 mb-3">
              <span className="font-medium text-green-600">Good:</span> &gt;5% 
              <span className="mx-2">|</span>
              <span className="font-medium text-yellow-600">Average:</span> 1-5% 
              <span className="mx-2">|</span>
              <span className="font-medium text-red-600">Poor:</span> &lt;1%
            </p>
            <CircularProgressChart 
              percentage={campaignData.conversionRate} 
              title="Conversions" 
              color="#f59e0b" 
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CampaignDetails;