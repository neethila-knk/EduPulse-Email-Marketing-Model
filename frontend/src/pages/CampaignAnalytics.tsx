import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { authApi, isAuthenticated } from "../utils/authUtils";
import Layout from "../components/Layout/Layout";
import PageHeader from "../components/Layout/PageHeader";
import overlayImage from "../assets/elements.svg";
import Button from "../components/UI/Button";
import CircularProgressChart from "../components/UI/CircularProgress";
import StatCard from "../components/UI/StatCard";
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

interface CampaignData {
  _id: string;
  campaignName: string;
  subject: string;
  fromEmail: string;
  clusterName: string;
  recipientCount: number;
  plainBody: string;
  htmlContent?: string;
  status:
    | "draft"
    | "ongoing"
    | "sending"
    | "sent"
    | "failed"
    | "completed"
    | "cancelled";
  createdAt: string;
  sentAt?: string;
  metrics: {
    opens: number;
    clicks: number;
    bounces: number;
    unsubscribes: number;
  };
  calculatedMetrics: {
    openRate: number;
    clickThroughRate: number;
    conversions: number;
    conversionRate: number;
  };
}

const CampaignDetails: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [campaignData, setCampaignData] = useState<CampaignData | null>(null);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "complete" | "schedule" | "cancel";
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    document.title = campaignData
      ? `${campaignData.campaignName} | EduPulse`
      : "Campaign Details | EduPulse";

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

    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await authApi.get<AuthResponse>("/auth/me");
        setUser(userResponse.data.user);

        // Fetch campaign details
        if (id) {
          const campaignResponse = await authApi.get(`/api/campaigns/${id}`);
          // Add type assertion to fix 'unknown' type error
          setCampaignData(campaignResponse.data as CampaignData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setAlert({
          type: "error",
          message: "Failed to load campaign data",
        });
        // Handle potential auth errors
        if ((error as any)?.response?.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          navigate("/login", {
            state: {
              message: "Your session has expired. Please log in again.",
            },
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, location, id]);

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
    navigate("/campaigns");
  };

  const updateCampaignStatus = async (status: string) => {
    try {
      const response = await authApi.patch(`/api/campaigns/${id}/status`, {
        status,
      });

      // Fix the 'response.data' type issue with proper type assertion
      const responseData = response.data as {
        message: string;
        campaign: { status: string };
      };

      setCampaignData((prevData) => {
        if (!prevData) return null;
        return {
          ...prevData,
          status: responseData.campaign.status as CampaignData["status"],
        };
      });

      setAlert({
        type: "success",
        message: `Campaign marked as ${status}`,
      });
    } catch (error) {
      console.error("Error updating campaign status:", error);
      setAlert({
        type: "error",
        message: `Failed to update campaign status`,
      });
    }
  };

  const handleMarkAsCompleted = () => {
    setConfirmAction({
      type: "complete",
      message: "Are you sure you want to mark this campaign as completed?",
      onConfirm: () => updateCampaignStatus("completed"),
    });
  };

  const handleMarkAsongoing = () => {
    setConfirmAction({
      type: "schedule",
      message: "Are you sure you want to mark this campaign as ongoing?",
      onConfirm: () => updateCampaignStatus("ongoing"),
    });
  };

  const handleCancelCampaign = () => {
    setConfirmAction({
      type: "cancel",
      message: "Are you sure you want to cancel this campaign?",
      onConfirm: () => updateCampaignStatus("cancelled"),
    });
  };

  // Helper functions to format data
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!campaignData) {
    return (
      <Layout onLogout={handleLogout} user={user}>
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-red-600">
            Campaign not found
          </h2>
          <p className="mt-2 mb-4">
            The campaign you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
          <Button variant="primary" onClick={handleBack}>
            Return to Campaigns
          </Button>
        </div>
      </Layout>
    );
  }

  // Create the status badge element
  const statusBadge = (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        campaignData.status === "sent" || campaignData.status === "completed"
          ? "bg-green-100 text-green-800"
          : campaignData.status === "sending"
          ? "bg-blue-100 text-blue-800"
          : campaignData.status === "ongoing"
          ? "bg-orange-100 text-orange-800"
          : campaignData.status === "cancelled"
          ? "bg-red-100 text-red-800"
          : "bg-gray-100 text-gray-800"
      }`}
    >
      {campaignData.status.charAt(0).toUpperCase() +
        campaignData.status.slice(1)}
    </span>
  );

  return (
    <Layout onLogout={handleLogout} user={user}>
      {alert && (
        <Toast
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Campaign Header */}
      <div className="relative">
        <PageHeader
          title={campaignData.campaignName}
          subheading={campaignData.subject}
          showBackButton={true}
          onBack={handleBack}
          size="large"
          overlayImage={overlayImage}
          action={
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {campaignData.status !== "completed" && (
                <Button
                  variant="secondary"
                  onClick={handleMarkAsCompleted}
                  className="w-full sm:w-auto"
                >
                  Mark as completed
                </Button>
              )}
              {campaignData.status !== "ongoing" &&
                campaignData.status !== "sending" && (
                  <Button
                    variant="pending"
                    onClick={handleMarkAsongoing}
                    className="w-full sm:w-auto"
                  >
                    Keep Analytics Going
                  </Button>
                )}
              {campaignData.status !== "cancelled" &&
                campaignData.status !== "sent" &&
                campaignData.status !== "completed" && (
                  <Button
                    variant="campaigncancel"
                    onClick={handleCancelCampaign}
                    className="w-full sm:w-auto"
                  >
                    Cancel Campaign
                  </Button>
                )}
            </div>
          }
        />

        {/* Campaign Stats */}
        <div className="container mx-auto px-3 sm:px-6 -mt-16 z-20 relative">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title="Emails sent"
              count={campaignData.recipientCount || 0}
              description={`To ${campaignData.clusterName} audience`}
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

            {/* Fixed StatCard - removed content prop and used description */}
            <StatCard
              title="Status"
              description={
                campaignData.sentAt
                  ? `Sent on ${formatDate(campaignData.sentAt)}`
                  : ""
              }
              count={undefined}
              content={
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    campaignData.status === "sent" ||
                    campaignData.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : campaignData.status === "sending"
                      ? "bg-blue-100 text-blue-800"
                      : campaignData.status === "ongoing"
                      ? "bg-orange-100 text-orange-800"
                      : campaignData.status === "cancelled"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {campaignData.status.charAt(0).toUpperCase() +
                    campaignData.status.slice(1)}
                </span>
              }
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
              iconColor="text-orange-600"
            />

            <StatCard
              title="Opened"
              count={campaignData.metrics?.opens || 0}
              description={`${
                campaignData.calculatedMetrics?.openRate || 0
              }% open rate`}
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              }
              iconColor="text-red"
            />

            <StatCard
              title="Clicked"
              count={campaignData.metrics?.clicks || 0}
              description={`${
                campaignData.calculatedMetrics?.clickThroughRate || 0
              }% click rate`}
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
                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                  />
                </svg>
              }
              iconColor="text-yellow-500"
            />
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="container mx-auto px-3 sm:px-6 py-6 sm:py-8">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            Analytics
          </h2>
          <div className="text-sm text-gray-500">
            {campaignData.createdAt &&
              `Created: ${formatDate(campaignData.createdAt)}`}
          </div>
        </div>

        {/* Status badge display */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">Campaign Status:</p>
          {statusBadge}
        </div>

        {/* Circular Charts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Open Rate</h3>
            <p className="text-sm text-gray-600 mb-3">
              <span className="font-medium text-green-600">Good:</span> &gt;25%
              <span className="mx-2">|</span>
              <span className="font-medium text-yellow-600">Average:</span>{" "}
              15-25%
              <span className="mx-2">|</span>
              <span className="font-medium text-red-600">Poor:</span> &lt;15%
            </p>
            <CircularProgressChart
              percentage={campaignData.calculatedMetrics?.openRate || 0}
              title="Open Rate"
            />
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-800 mb-2">
              Click-Through Rate
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              <span className="font-medium text-green-600">Good:</span> &gt;4%
              <span className="mx-2">|</span>
              <span className="font-medium text-yellow-600">Average:</span> 2-4%
              <span className="mx-2">|</span>
              <span className="font-medium text-red-600">Poor:</span> &lt;2%
            </p>
            <CircularProgressChart
              percentage={campaignData.calculatedMetrics?.clickThroughRate || 0}
              title="Click-Through Rate"
              subtitle="(CTR)"
            />
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-800 mb-2">
              Conversion Rate
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              <span className="font-medium text-green-600">Good:</span> &gt;5%
              <span className="mx-2">|</span>
              <span className="font-medium text-yellow-600">Average:</span> 1-5%
              <span className="mx-2">|</span>
              <span className="font-medium text-red-600">Poor:</span> &lt;1%
            </p>
            <CircularProgressChart
              percentage={campaignData.calculatedMetrics?.conversionRate || 0}
              title="Conversion Rate"
            />
          </div>
        </div>

        {/* Additional Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-800 mb-4">
              Campaign Performance
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Recipients</span>
                <span className="font-medium text-gray-800">
                  {formatNumber(campaignData.recipientCount || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Opened</span>
                <span className="font-medium text-gray-800">
                  {formatNumber(campaignData.metrics?.opens || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Clicked</span>
                <span className="font-medium text-gray-800">
                  {formatNumber(campaignData.metrics?.clicks || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Bounced</span>
                <span className="font-medium text-gray-800">
                  {formatNumber(campaignData.metrics?.bounces || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Unsubscribed</span>
                <span className="font-medium text-gray-800">
                  {formatNumber(campaignData.metrics?.unsubscribes || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Estimated Conversions</span>
                <span className="font-medium text-gray-800">
                  {formatNumber(
                    campaignData.calculatedMetrics?.conversions || 0
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-800 mb-4">
              Campaign Details
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subject Line</span>
                <span className="font-medium text-gray-800">
                  {campaignData.subject}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">From Email</span>
                <span className="font-medium text-gray-800">
                  {campaignData.fromEmail}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Audience</span>
                <span className="font-medium text-gray-800">
                  {campaignData.clusterName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                {statusBadge}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Created</span>
                <span className="font-medium text-gray-800">
                  {formatDate(campaignData.createdAt)}
                </span>
              </div>
              {campaignData.sentAt && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Sent</span>
                  <span className="font-medium text-gray-800">
                    {formatDate(campaignData.sentAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {confirmAction && (
        <Alert
          message={confirmAction.message}
          onConfirm={() => {
            confirmAction.onConfirm();
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
          confirmText="Yes"
          cancelText="No"
        />
      )}
    </Layout>
  );
};

export default CampaignDetails;
