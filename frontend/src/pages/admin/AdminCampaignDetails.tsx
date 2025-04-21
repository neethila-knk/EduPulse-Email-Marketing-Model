import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "../../components/Layout/PageHeader";
import AdminSidebar from "../../components/Layout/AdminSidebar";
import AdminNavbar from "../../components/Layout/AdminNavbar";
import Button from "../../components/UI/Button";
import Alert from "../../components/UI/Alert";
import Toast from "../../components/UI/Toast";
import {
  getAdmin,
  adminLogout,
  adminAuthApi,
} from "../../utils/adminAuthUtils";
import overlayImage from "../../assets/elements.svg";

interface CampaignDetail {
  _id: string;
  userId: string;
  campaignName: string;
  subject: string;
  fromEmail: string;
  clusterId: string;
  clusterName: string;
  recipientCount: number;
  htmlContent: string;
  plainBody: string;
  status: string;
  attachments: string[];
  metrics: {
    opens: number;
    clicks: number;
    bounces: number;
    unsubscribes: number;
  };
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "ongoing":
      return "bg-orange-100 text-orange-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "sent":
      return "bg-yellow-100 text-yellow-800";
    case "draft":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const AdminCampaignDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);
  const [adminUser, setAdminUser] = useState(getAdmin());
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const admin = getAdmin();
    if (!admin) {
      navigate("/admin/login");
      return;
    }

    setAdminUser(admin);
    document.title = "Campaign Details | EduPulse Marketing";
    fetchCampaignDetails();
  }, [id, navigate]);

  const fetchCampaignDetails = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const response = await adminAuthApi.get(`/admin/campaigns/${id}`);
      setCampaign(response.data as CampaignDetail);
    } catch (error) {
      console.error("Failed to fetch campaign details", error);
      setToast({ message: "Failed to fetch campaign details", type: "error" });

      // Check if error is due to authentication
      if (error instanceof Error && "response" in error && error.response) {
        const axiosError = error as any;
        if (
          axiosError.response.status === 401 ||
          axiosError.response.status === 403
        ) {
          setToast({
            message: "Your session has expired. Please log in again.",
            type: "error",
          });
          setTimeout(() => {
            navigate("/admin/login");
          }, 2000);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCampaign = async () => {
    try {
      await adminAuthApi.delete(`/admin/campaigns/${id}`);
      setToast({ message: "Campaign deleted successfully", type: "success" });
      setTimeout(() => navigate("/admin/campaigns"), 1500);
    } catch (error) {
      console.error("Failed to delete campaign", error);
      setToast({ message: "Failed to delete campaign", type: "error" });

      // Check if error is due to authentication
      if (error instanceof Error && "response" in error && error.response) {
        const axiosError = error as any;
        if (
          axiosError.response.status === 401 ||
          axiosError.response.status === 403
        ) {
          setToast({
            message: "Your session has expired. Please log in again.",
            type: "error",
          });
          setTimeout(() => {
            navigate("/admin/login");
          }, 2000);
        }
      }
    } finally {
      setShowDeleteAlert(false);
    }
  };

  const handleShowLogoutConfirmation = () => {
    setShowLogoutAlert(true);
  };

  const handleLogout = async () => {
    setShowLogoutAlert(false);
    await adminLogout();
    setToast({ type: "success", message: "Logged out successfully!" });
    setTimeout(() => navigate("/admin/login"), 1500);
  };

  return (
    <div className="flex h-screen">
      <AdminSidebar onLogout={handleShowLogoutConfirmation} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar user={adminUser} title="Campaign Overview" onLogout={handleShowLogoutConfirmation} />
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="relative">
            <PageHeader
              title={campaign?.campaignName || "Campaign Details"}
              subheading="Decide what stays and what goes."
              showBackButton={true}
              onBack={() => navigate("/admin/viewcampaigns")}
              size="small"
              overlayImage={overlayImage}
              action={
                <div className="flex justify-end">
                  <Button
                    onClick={() => navigate("/admin/viewcampaigns")}
                    variant="secondary"
                    size="md"
                  >
                    Back To Campaigns
                  </Button>
                </div>
              }
            />
          </div>

          <div className="container mx-auto px-6 py-8">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
              </div>
            ) : campaign ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Campaign Overview Card */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                      {campaign.campaignName}
                    </h2>
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        campaign.status
                      )}`}
                    >
                      {campaign.status}
                    </span>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Subject Line
                    </h3>
                    <p className="text-base text-gray-800">
                      {campaign.subject}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">
                        From Email
                      </h3>
                      <p className="text-base text-gray-800">
                        {campaign.fromEmail}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">
                        Audience
                      </h3>
                      <p className="text-base text-gray-800">
                        {campaign.clusterName}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">
                        Recipients
                      </h3>
                      <p className="text-base text-gray-800">
                        {campaign.recipientCount}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">
                        Created
                      </h3>
                      <p className="text-base text-gray-800">
                        {formatDate(campaign.createdAt)}
                      </p>
                    </div>
                    {campaign.sentAt && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">
                          Sent
                        </h3>
                        <p className="text-base text-gray-800">
                          {formatDate(campaign.sentAt)}
                        </p>
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">
                        Last Updated
                      </h3>
                      <p className="text-base text-gray-800">
                        {formatDate(campaign.updatedAt)}
                      </p>
                    </div>
                  </div>

                  {campaign.attachments && campaign.attachments.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">
                        Attachments
                      </h3>
                      <div className="p-4 bg-gray-50 rounded-md text-sm text-gray-700 max-h-60 overflow-y-auto">
                      <ul className="list-disc pl-5">
                        {campaign.attachments.map((attachment, index) => {
                          const fileName =
                            attachment.split("\\").pop() || attachment;
                          return (
                            <li key={index} className="text-gray-600">
                              {fileName}
                            </li>
                          );
                        })}
                      </ul>
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Email Content (Plain Text)
                    </h3>
                    <div className="p-4 bg-gray-50 rounded-md whitespace-pre-wrap text-sm text-gray-700 max-h-60 overflow-y-auto">
                      {campaign.plainBody}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Email Preview (HTML)
                    </h3>
                    <div className="border rounded-md overflow-hidden bg-white border-gray-300 shadow-sm">
                      <div className="bg-gray-100 border-b border-gray-300 px-4 py-2 flex items-center">
                        <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <div className="mx-auto text-xs text-gray-500">
                          Email Preview
                        </div>
                      </div>
                      <div className="p-4 h-140 overflow-y-auto">
                        <iframe
                          srcDoc={campaign.htmlContent}
                          title="Email Preview"
                          className="w-full h-full border-0"
                          sandbox="allow-same-origin"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats and Actions Cards */}
                <div className="space-y-6">
                  {/* Performance Metrics Card */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium mb-4">
                      Performance Metrics
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Opens</span>
                        <div className="flex items-center">
                          <span className="font-semibold text-gray-800">
                            {campaign.metrics.opens}
                          </span>
                          <span className="text-gray-500 text-sm ml-2">
                            (
                            {campaign.recipientCount > 0
                              ? (
                                  (campaign.metrics.opens /
                                    campaign.recipientCount) *
                                  100
                                ).toFixed(1)
                              : "0"}
                            %)
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Clicks</span>
                        <div className="flex items-center">
                          <span className="font-semibold text-gray-800">
                            {campaign.metrics.clicks}
                          </span>
                          <span className="text-gray-500 text-sm ml-2">
                            (
                            {campaign.recipientCount > 0
                              ? (
                                  (campaign.metrics.clicks /
                                    campaign.recipientCount) *
                                  100
                                ).toFixed(1)
                              : "0"}
                            %)
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Bounces</span>
                        <div className="flex items-center">
                          <span className="font-semibold text-gray-800">
                            {campaign.metrics.bounces}
                          </span>
                          <span className="text-gray-500 text-sm ml-2">
                            (
                            {campaign.recipientCount > 0
                              ? (
                                  (campaign.metrics.bounces /
                                    campaign.recipientCount) *
                                  100
                                ).toFixed(1)
                              : "0"}
                            %)
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Unsubscribes</span>
                        <div className="flex items-center">
                          <span className="font-semibold text-gray-800">
                            {campaign.metrics.unsubscribes}
                          </span>
                          <span className="text-gray-500 text-sm ml-2">
                            (
                            {campaign.recipientCount > 0
                              ? (
                                  (campaign.metrics.unsubscribes /
                                    campaign.recipientCount) *
                                  100
                                ).toFixed(1)
                              : "0"}
                            %)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Card */}
                  <div className="bg-white rounded-lg shadow p-6 space-y-3">
                    <h3 className="text-lg font-medium mb-4">Actions</h3>
                    {campaign.status === "draft" && (
                      <Button
                        onClick={() => navigate(`/admin/campaigns/${id}/send`)}
                        variant="primary"
                        size="md"
                        className="w-full"
                      >
                        Send Campaign
                      </Button>
                    )}
                    <Button
                      onClick={() => setShowDeleteAlert(true)}
                      variant="danger"
                      size="md"
                      className="w-full"
                    >
                      Delete Campaign
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Campaign not found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  The campaign you're looking for doesn't exist or you may not
                  have permission to view it.
                </p>
                <div className="mt-6">
                  <Button
                    onClick={() => navigate("/admin/campaigns")}
                    variant="primary"
                    size="md"
                  >
                    Back to Campaigns
                  </Button>
                </div>
              </div>
            )}
          </div>

          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </div>
      </div>

      {showDeleteAlert && (
        <Alert
          title="Confirm Deletion"
          message="Are you sure you want to permanently delete this campaign? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          position="top-center"
          onConfirm={handleDeleteCampaign}
          onCancel={() => setShowDeleteAlert(false)}
        />
      )}

      {showLogoutAlert && (
        <Alert
          title="Confirm Logout"
          message="Are you sure you want to log out of your admin session?"
          confirmText="Logout"
          cancelText="Cancel"
          position="top-center"
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutAlert(false)}
        />
      )}
    </div>
  );
};

export default AdminCampaignDetailPage;
