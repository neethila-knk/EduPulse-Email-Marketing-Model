import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authApi, isAuthenticated, logout } from "../utils/authUtils";
import { fetchCampaigns, normalizeCampaignData } from "../utils/campaignService";
import Layout from "../components/Layout/Layout";
import StatCard from "../components/UI/StatCard";
import CampaignTable from "../components/Dashboard/CampaignTable";
import Button from "../components/UI/Button";
import { Campaign } from "../types";
import PageHeader from "../components/Layout/PageHeader";
import overlayImage from "../assets/elements.svg";

interface User {
  id: string;
  username: string;
  email: string;
  provider: string;
}

interface AuthResponse {
  user: User;
}

// Email marketing insights (unchanged)
const emailMarketingInsights = [
  "Segmented email campaigns can increase engagement by 720%",
  "Personalized subject lines can boost open rates by 55%",
  "The best time to send education emails is 7-9 AM and 6-8 PM",
  "Interactive emails can increase click-through rates by 280%",
  "Mobile-optimized emails can boost unique clicks by 20%",
  "A/B testing can improve conversion rates by 45%",
  "Education email marketing has an ROI of 4000%",
  "Welcome emails have an average open rate of 85%",
  "Adding course videos can increase click rates by 310%",
  "Follow-up emails have a 47% open rate",
  "Email subscribers are 3.5x more likely to share content",
  "Tuesdays and Thursdays have the highest open rates",
  "Re-engagement campaigns can recover 30% of lost leads",
];

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [dataError, setDataError] = useState<boolean>(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [randomInsight, setRandomInsight] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.title = "Dashboard | EduPulse";
    setRandomInsight(emailMarketingInsights[Math.floor(Math.random() * emailMarketingInsights.length)]);

    // Show alerts from navigation state
    if (location.state && (location.state as any).message) {
      setAlert({
        type: "success",
        message: (location.state as any).message,
      });
      window.history.replaceState({}, document.title);
    }

    // Check if user is authenticated
    if (!isAuthenticated()) {
      navigate("/login", {
        state: { message: "Please log in to access the dashboard" },
      });
      return;
    }

    // Load user data and campaigns
    const loadDashboardData = async () => {
      try {
        // First load user profile using user endpoint
        const userResponse = await authApi.get<AuthResponse>("/auth/me");
        setUser(userResponse.data.user);
        
        // Then load campaign data using the campaign service (which now uses the correct endpoint)
        const { campaigns: campaignData, isError } = await fetchCampaigns();
        
        // Process campaign data to ensure it matches our expected format
        const normalizedCampaigns = normalizeCampaignData(campaignData);
        setCampaigns(normalizedCampaigns);
        setDataError(isError);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [navigate, location]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/login");
    }
  };

  // Force refresh campaigns data
  const refreshCampaigns = async () => {
    setLoading(true);
    const { campaigns: refreshedCampaigns, isError } = await fetchCampaigns();
    setCampaigns(normalizeCampaignData(refreshedCampaigns));
    setDataError(isError);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Create greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Create greeting component
  const greetingComponent = (
    <div>
      <div className="text-lg font-medium mb-1">
        {getGreeting()}, {user?.username}! 👋
      </div>
      <div className="flex items-start text-sm">
        <div className="mr-2 mt-0.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <span className="font-medium">Did you know?</span> {randomInsight}
        </div>
      </div>
    </div>
  );

  // Calculate statistics from campaign data
  const stats = {
    total: campaigns.length,
    ongoing: campaigns.filter(c => c.status === "ongoing").length,
    sent: campaigns.filter(c => c.status === "sent").length, 
    canceled: campaigns.filter(c => c.status === "canceled").length,
    completed: campaigns.filter(c => c.status === "completed").length,
  };

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

      {dataError && (
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded-md mx-6 mt-4 mb-3 flex justify-between items-center">
          <div className="flex items-center">
            <p>We had trouble loading your campaign data. Showing sample data instead.</p>
            <button 
              onClick={refreshCampaigns}
              className="ml-3 bg-yellow-200 hover:bg-yellow-300 text-yellow-800 px-3 py-1 rounded text-sm"
            >
              Retry
            </button>
          </div>
          <button
            onClick={() => setDataError(false)}
            className="text-sm font-medium"
          >
            ✕
          </button>
        </div>
      )}

      <div className="relative">
        <PageHeader
          title="My Email Campaigns"
          greeting={greetingComponent}
          size="large"
          action={
            <Button
              variant="secondary"
              onClick={() => navigate("/new-campaign")}
              className="shadow-sm"
            >
              Create New Campaign
            </Button>
          }
          overlayImage={overlayImage}
        />

        <div className="container mx-auto px-6 relative -mt-20 z-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total"
              count={stats.total}
              description="Total no. of campaigns"
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
            <StatCard
              title="Ongoing"
              count={stats.ongoing}
              description="Ongoing campaigns"
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
                    d="M4 4v6h6M20 20v-6h-6M4 20l5-5M20 4l-5 5"
                  />
                </svg>
              }
              
              iconColor="text-orange-600"
            />
            <StatCard
              title="Needs Action"
              count={stats.sent}
              description="Waiting for an action"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-yellow-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M12 5a9 9 0 100 18 9 9 0 000-18z"
                  />
                </svg>
              }
              
              iconColor="text-yellow-500"
            />
            <StatCard
              title="Canceled"
              count={stats.canceled}
              description="Campaigns canceled"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              }
              
              iconColor="text-red-600"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 mb-8 mt-10">
        {campaigns.length > 0 ? (
          <CampaignTable
            campaigns={campaigns}
            onViewAll={() => navigate("/campaigns")}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h3 className="text-xl font-medium text-gray-800 mb-2">No campaigns yet</h3>
            <p className="text-gray-600 mb-4">Start creating your first email campaign to engage with your audience.</p>
            <Button variant="primary" onClick={() => navigate("/new-campaign")}>
              Create Your First Campaign
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;