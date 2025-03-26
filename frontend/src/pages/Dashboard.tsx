import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authApi, isAuthenticated } from "../utils/authUtils";
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

// Email marketing insights to display randomly
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
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [randomInsight, setRandomInsight] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();

  // Sample data - this would come from your API
  const stats = {
    total: 18,
    ongoing: 5,
    pending: 12,
    canceled: 2,
  };

  const campaigns: Campaign[] = [
    {
      id: "1",
      name: "Software engineering diploma",
      emailCount: 1000,
      status: "pending",
    },
    {
      id: "2",
      name: "Mixing and mastering course",
      emailCount: 500,
      status: "canceled",
    },
    {
      id: "3",
      name: "Music producing free course",
      emailCount: 5000,
      status: "completed",
    },
    {
      id: "4",
      name: "Computer hardware workshop",
      emailCount: 2500,
      status: "ongoing",
    },
  ];

  useEffect(() => {
    document.title = "Dashboard | EduPulse";
    // Get random insight when component mounts
    const randomIndex = Math.floor(
      Math.random() * emailMarketingInsights.length
    );
    setRandomInsight(emailMarketingInsights[randomIndex]);

    // Check for successful login message in state
    if (location.state && (location.state as any).message) {
      setAlert({
        type: "success",
        message: (location.state as any).message,
      });

      // Clear the state after showing the message
      window.history.replaceState({}, document.title);
    }

    // Check if user is authenticated
    if (!isAuthenticated()) {
      navigate("/login", {
        state: { message: "Please log in to access the dashboard" },
      });
      return;
    }

    const fetchUserData = async () => {
      try {
        // Properly type the response
        const response = await authApi.get<AuthResponse>("/auth/me");
        setUser(response.data.user);
      } catch (error) {
        console.error("Error fetching user data:", error);
        // If token is invalid, redirect to login
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
  }, [navigate, location]);

  const handleLogout = async () => {
    try {
      // Call the logout endpoint
      await authApi.get("/auth/logout");

      // Clear tokens from localStorage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      // Redirect to login
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
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

  // Create the greeting component
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

      {/* Using the PageHeader with the overlayImage prop */}
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

        {/* Stat cards that overlap the green background - now with better positioning */}
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
                    d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20"
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
              iconColor="text-gray-700"
            />
            <StatCard
              title="Pending"
              count={stats.pending}
              description="Pending to proceed"
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
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
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
              iconColor="text-red-600"
            />
          </div>
        </div>
      </div>
      {/* Campaign table */}
      <div className="container mx-auto px-6 mb-8 mt-10">
        <CampaignTable
          campaigns={campaigns}
          onViewAll={() => navigate("/campaigns")}
        />
      </div>
    </Layout>
  );
};

export default Dashboard;
