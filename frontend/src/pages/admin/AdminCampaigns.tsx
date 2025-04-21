import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/Layout/PageHeader";
import AdminSidebar from "../../components/Layout/AdminSidebar";
import AdminNavbar from "../../components/Layout/AdminNavbar";
import Button from "../../components/UI/Button";
import Alert from "../../components/UI/Alert";
import Toast from "../../components/UI/Toast";
import SearchInput from "../../components/UI/SearchInput";
import {
  getAdmin,
  adminLogout,
  adminAuthApi,
} from "../../utils/adminAuthUtils";
import overlayImage from "../../assets/elements.svg";

interface CampaignsApiResponse {
  campaigns: Campaign[];
}

interface Campaign {
  _id: string;
  campaignName: string;
  subject: string;
  fromEmail: string;
  clusterName: string;
  recipientCount: number;
  status: string;
  metrics: {
    opens: number;
    clicks: number;
    bounces: number;
    unsubscribes: number;
  };
  createdAt: string;
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

const CampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [adminUser, setAdminUser] = useState(getAdmin());
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const admin = getAdmin();
    if (!admin) {
      navigate("/admin/login");
      return;
    }

    setAdminUser(admin);
    document.title = "Campaigns | EduPulse Marketing";
    fetchCampaigns();
  }, [navigate]);

  useEffect(() => {
    filterCampaigns();
  }, [searchTerm, campaigns]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await adminAuthApi.get<CampaignsApiResponse>(
        "/admin/campaigns"
      );

      if (response.data.campaigns) {
        setCampaigns(response.data.campaigns);
        setFilteredCampaigns(response.data.campaigns);
      } else {
        setCampaigns([]);
        setFilteredCampaigns([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch campaigns", error);
      setToast({
        message: "Failed to fetch campaigns. Please check your connection.",
        type: "error",
      });

      if (
        error.response &&
        (error.response.status === 401 || error.response.status === 403)
      ) {
        setToast({
          message: "Your session has expired. Please log in again.",
          type: "error",
        });
        setTimeout(() => {
          navigate("/admin/login");
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const filterCampaigns = () => {
    if (!searchTerm.trim()) {
      setFilteredCampaigns(campaigns);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = campaigns.filter(
      (campaign) =>
        campaign.campaignName.toLowerCase().includes(term) ||
        campaign.clusterName.toLowerCase().includes(term) ||
        campaign.fromEmail.toLowerCase().includes(term) ||
        campaign.status.toLowerCase().includes(term)
    );
    setFilteredCampaigns(filtered);
  };

  const handleSearch = () => {
    filterCampaigns();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleViewCampaign = (campaignId: string) => {
    navigate(`/admin/campaigns/${campaignId}`);
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

  const searchContainerComponent = (
    <div className="flex items-center space-x-4 w-full md:w-96">
      <SearchInput
        placeholder="Search campaigns..."
        value={searchTerm}
        onChange={handleSearchChange}
        onSearch={handleSearch}
        borderColor="border-gray-200"
        focusBorderColor="focus:border-green-500"
      />
    </div>
  );

  return (
    <div className="flex h-screen">
      <AdminSidebar onLogout={handleShowLogoutConfirmation} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar user={adminUser}  title="View All Campaigns" onLogout={handleShowLogoutConfirmation} />
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="relative">
            <PageHeader
              title="Campaign Management"
              subheading="View comprehensive campaign insights and remove outdated or unwanted campaigns."
              isSticky
              size="small"
              showBackButton={true}
              onBack={() => navigate("/admin/dashboard")}
              action={searchContainerComponent}
              overlayImage={overlayImage}
            />
          </div>

          {/* Added padding-top to create space between header and content */}
          <div className="container mx-auto px-6 py-12 relative z-20">
            <div className="bg-white rounded-lg shadow">
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium">All Campaigns</h3>
                <div className="space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={fetchCampaigns}
                  >
                    Refresh
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
                </div>
              ) : filteredCampaigns.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Campaign Name
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Audience
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Recipients
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
                          Created
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Metrics
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 border-b border-gray-200">
                      {filteredCampaigns.map((campaign) => (
                        <tr key={campaign._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {campaign.campaignName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {campaign.subject}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {campaign.clusterName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {campaign.recipientCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                campaign.status
                              )}`}
                            >
                              {campaign.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>{formatDate(campaign.createdAt)}</div>
                            {campaign.sentAt && (
                              <div className="text-xs">
                                Sent: {formatDate(campaign.sentAt)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-3 text-xs">
                              <div className="text-yellow">
                                <span className="font-semibold">
                                  {campaign.metrics.opens}
                                </span>{" "}
                                Opens
                              </div>
                              <div className="text-green-600">
                                <span className="font-semibold">
                                  {campaign.metrics.clicks}
                                </span>{" "}
                                Clicks
                              </div>
                              <div className="text-red-600">
                                <span className="font-semibold">
                                  {campaign.metrics.bounces}
                                </span>{" "}
                                Bounces
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <button
                              onClick={() => handleViewCampaign(campaign._id)}
                              className="text-green-600 hover:text-green-900 mr-3 font-medium"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 px-6">
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
                    No campaigns found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm
                      ? "Try adjusting your search terms."
                      : "Get started by creating a new campaign."}
                  </p>
                  {!searchTerm && (
                    <div className="mt-6">
                      <Button
                        onClick={() => navigate("/admin/campaigns/create")}
                        variant="primary"
                        size="md"
                      >
                        Create New Campaign
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
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

export default CampaignsPage;