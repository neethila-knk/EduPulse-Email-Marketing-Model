import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "../components/Layout/Layout";
import PageHeader from "../components/Layout/PageHeader";
import Button from "../components/UI/Button";
import { authApi, isAuthenticated } from "../utils/authUtils";
import overlayImage from "../assets/elements.svg";
import Toast from "../components/UI/Toast";
import Alert from "../components/UI/Alert";

interface User {
  id: string;
  username: string;
  email: string;
  provider: string;
}

interface AuthResponse {
  user: User;
}

interface Campaign {
  _id: string;
  campaignName: string;
  subject: string;
  recipientCount: number;
  clusterName: string;
  status: string;
  createdAt: string;
  sentAt?: string;
  metrics?: {
    opens: number;
    clicks: number;
    bounces: number;
    unsubscribes: number;
  };
}

// Adding LocationState interface for the useLocation hook
interface LocationState {
  message?: string;
}
const getStatusLabel = (status: string): string => {
  if (status === "ongoing") return "Ongoing";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const CampaignsList: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState;
  const [message, setMessage] = useState<string | null>(
    locationState?.message || null
  );

  const [toast, setToast] = useState<{
    message: string;
    type?: "success" | "error" | "info" | "warning";
  } | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Campaigns | EduPulse";
    // Validate auth token & fetch user
    const validateSession = async () => {
      try {
        const userResponse = await authApi.get<AuthResponse>("/auth/me");
        setUser(userResponse.data.user);
      } catch (error) {
        console.error("Session expired:", error);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        navigate("/login", {
          state: { message: "Your session has expired. Please log in again." },
        });
      }
    };

    const fetchData = async () => {
      await validateSession();

      try {
        const campaignsResponse = await authApi.get<Campaign[]>(
          "/api/campaigns"
        );
        setCampaigns(campaignsResponse.data);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Auto-clear message
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
        window.history.replaceState({}, document.title);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [navigate, locationState?.message, message]);

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

  const handleDeleteCampaign = async (id: string) => {
    setCampaignToDelete(id);
    setShowAlert(true);
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-yellow-100 text-yellow-800";
      case "sending":
        return "bg-blue-100 text-blue-800";
      case "ongoing":
        return "bg-orange-100 text-orange-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
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
    <Layout onLogout={handleLogout} user={user}>
      <PageHeader
        title="Email Campaigns"
        subheading="Manage your email campaigns"
        showBackButton={true}
        onBack={() => navigate("/dashboard")}
        size="small"
        overlayImage={overlayImage}
        action={
          <div className="flex justify-end">
            <Button
              onClick={() => navigate("/new-campaign")}
              variant="secondary"
              size="md"
            >
              <span className="mr-2">+</span> New Campaign
            </Button>
          </div>
        }
      />

      <div className="container mx-auto px-4 md:px-6 py-8">
        {/* Success/Error Message */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {campaigns.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No campaigns yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first email campaign to engage your audience
            </p>
            <Button variant="primary" onClick={() => navigate("/new-campaign")}>
              Create Campaign
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden shadow">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                    Campaign Name
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                    Audience
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                    Recipients
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                    Created
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign._id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900">
                        {campaign.campaignName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {campaign.subject}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700">
                      {campaign.clusterName || "Unknown Audience"}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700">
                      {campaign.recipientCount}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                          campaign.status
                        )}`}
                      >
                       {getStatusLabel(campaign.status)}

                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700">
                      {formatDate(campaign.createdAt)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/campaigns/${campaign._id}`)}
                          className="text-green-600 font-medium hover-lift-noShadow hover:text-green-800"
                        >
                          View
                        </button>
                        {campaign.status !== "sent" && (
                          <button
                            onClick={() => handleDeleteCampaign(campaign._id)}
                            className="text-red-600 font-medium hover-lift-noShadow hover:text-red-800"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showAlert && campaignToDelete && (
        <Alert
          title="Delete Campaign"
          message="Are you sure you want to delete this campaign? This action cannot be undone."
          type="warning"
          position="top-center"
          confirmText="Delete"
          cancelText="Cancel"
          onCancel={() => {
            setShowAlert(false);
            setCampaignToDelete(null);
          }}
          onConfirm={async () => {
            try {
              await authApi.delete(`/api/campaigns/${campaignToDelete}`);
              setCampaigns(campaigns.filter((c) => c._id !== campaignToDelete));
              setToast({
                message: "Campaign deleted successfully",
                type: "success",
              });
            } catch (error) {
              console.error("Error deleting campaign:", error);
              setToast({ message: "Failed to delete campaign", type: "error" });
            } finally {
              setShowAlert(false);
              setCampaignToDelete(null);
            }
          }}
        />
      )}
    </Layout>
  );
};

export default CampaignsList;
