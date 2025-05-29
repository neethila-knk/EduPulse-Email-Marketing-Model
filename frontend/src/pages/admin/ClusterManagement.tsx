import React, { useState, useEffect } from "react";
import Button from "../../components/UI/Button";
import {
  adminAuthApi,
  getAdmin,
  adminLogout,
} from "../../utils/adminAuthUtils";
import Toast from "../../components/UI/Toast";
import Alert from "../../components/UI/Alert";
import SearchInput from "../../components/UI/SearchInput";
import CustomSelect from "../../components/UI/Select";
import AdminSidebar from "../../components/Layout/AdminSidebar";
import AdminNavbar from "../../components/Layout/AdminNavbar";
import PageHeader from "../../components/Layout/PageHeader";
import overlayImage from "../../assets/elements.svg";
import { useNavigate } from "react-router-dom";

interface ClusterData {
  _id: string;
  name: string;
  cluster_id: number;
  size: number;
  description: string;
  engagement_potential: string;
  size_classification: string;
  primary_domain_type: string;
  primary_interest: string;
  top_universities: Record<string, number>;
  status: "active" | "archived" | "draft";
  createdAt: string;
}
const ClusterManagement: React.FC = () => {
  const [clusters, setClusters] = useState<ClusterData[]>([]);
  const [filteredClusters, setFilteredClusters] = useState<ClusterData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);
  const [editCluster, setEditCluster] = useState<ClusterData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [adminUser, setAdminUser] = useState(getAdmin());
  const [showAlert, setShowAlert] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [alertAction, setAlertAction] = useState<{
    type: "archive" | "activate";
    clusterId: string;
    clusterName: string;
  } | null>(null);
  const navigate = useNavigate();

  // Centralized logout confirmation handler
  const handleShowLogoutConfirmation = () => {
    setShowLogoutAlert(true);
  };

  const handleLogout = async () => {
    setShowLogoutAlert(false);
    await adminLogout();
    setToast({ type: "success", message: "Logged out successfully!" });
    setTimeout(() => navigate("/admin/login"), 1500); // give toast time to show
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  useEffect(() => {
    setAdminUser(getAdmin());
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredClusters(clusters);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = clusters.filter(
        (cluster) =>
          cluster.name.toLowerCase().includes(lowercasedSearch) ||
          cluster.description.toLowerCase().includes(lowercasedSearch) ||
          cluster.primary_interest.toLowerCase().includes(lowercasedSearch) ||
          cluster.engagement_potential
            .toLowerCase()
            .includes(lowercasedSearch) ||
          cluster.primary_domain_type
            .toLowerCase()
            .includes(lowercasedSearch) ||
          cluster.size_classification.toLowerCase().includes(lowercasedSearch)
      );
      setFilteredClusters(filtered);
    }
  }, [searchTerm, clusters]);

  const fetchClusters = async () => {
    try {
      setLoading(true);
      const response = await adminAuthApi.get("/api/clusters");
      setClusters(response.data as ClusterData[]);
    } catch (error) {
      setToast({ message: "Failed to load clusters", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAlertConfirm = async () => {
    if (!alertAction) return;

    try {
      const status = alertAction.type === "archive" ? "archived" : "active";
      await adminAuthApi.patch(`/api/clusters/${alertAction.clusterId}`, {
        status,
      });
      setToast({
        message: `Cluster "${alertAction.clusterName}" ${
          alertAction.type === "archive" ? "archived" : "activated"
        } successfully`,
        type: "success",
      });
      fetchClusters();
    } catch {
      setToast({ message: "Failed to update cluster status", type: "error" });
    } finally {
      setShowAlert(false);
      setAlertAction(null);
    }
  };

  const updateClusterStatus = (
    clusterId: string,
    status: "active" | "archived" | "draft",
    clusterName: string
  ) => {
    setAlertAction({
      type: status === "archived" ? "archive" : "activate",
      clusterId,
      clusterName,
    });
    setShowAlert(true);
  };

  const saveClusterEdit = async () => {
    if (!editCluster) return;
    try {
      await adminAuthApi.put(`/api/clusters/${editCluster._id}`, {
        name: editCluster.name,
        description: editCluster.description,
        engagement_potential: editCluster.engagement_potential,
      });
      setToast({
        message: `Cluster "${editCluster.name}" updated successfully`,
        type: "success",
      });
      setIsEditing(false);
      setEditCluster(null);
      fetchClusters();
    } catch {
      setToast({ message: "Failed to update cluster", type: "error" });
    }
  };

  const openEditModal = (cluster: ClusterData) => {
    setEditCluster({ ...cluster });
    setIsEditing(true);
  };

  // Define engagement options for select dropdown
  const engagementOptions = [
    { label: "High Engagement", value: "High Engagement Potential" },
    { label: "Moderate Engagement", value: "Moderate Engagement Potential" },
    { label: "Low Engagement", value: "Low Engagement Potential" },
    { label: "Unknown", value: "Unknown" },
  ];

  const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      archived: "bg-gray-100 text-gray-800",
      draft: "bg-yellow-100 text-yellow-800",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          colors[status as keyof typeof colors]
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const greeting = (
    <p className="text-sm">
      Manage all generated clusters: update descriptions, archive unused
      segments, and more.
    </p>
  );

  return (
    <div className="flex h-screen">
      <AdminSidebar onLogout={handleShowLogoutConfirmation} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar
          user={adminUser}
          title="Cluster Management"
          onLogout={handleShowLogoutConfirmation}
        />
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 pb-8">
          <div className="sticky top-0 z-30">
            <PageHeader
              title="Audience Visualization Dashboard"
              subheading="Interactive visualizations of your audience segments"
              isSticky
              size="small"
              showBackButton={true}
              onBack={() => navigate("/admin/dashboard")}
              overlayImage={overlayImage}
              action={
                <div className="flex justify-end">
                  <Button
                    onClick={() => navigate("/admin/clustering")}
                    variant="secondary"
                    size="md"
                  >
                    Create New Audience Segments
                  </Button>
                </div>
              }
            />
          </div>

          {/* Added proper spacing between PageHeader and content */}
          <div className="container mx-auto px-6 relative mt-8 md:mt-10 z-20">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-200 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h2 className="text-lg font-semibold">Cluster Management</h2>
                  <Button onClick={fetchClusters} variant="outline">
                    Refresh
                  </Button>
                </div>

                <div className="w-full md:max-w-md">
                  <SearchInput
                    placeholder="Search clusters by name, interest, domain..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onSearch={() => {
                      // The search is already reactive, but this could be used
                      // for additional search-related actions if needed
                      console.log("Search button clicked", searchTerm);
                    }}
                  />
                </div>
              </div>

              {loading ? (
                <div className="p-6 animate-pulse space-y-3">
                  {Array(4)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="h-20 bg-gray-200 rounded" />
                    ))}
                </div>
              ) : clusters.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No clusters available. Upload a dataset to generate segments.
                </div>
              ) : filteredClusters.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No clusters match your search criteria.
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredClusters.map((cluster) => (
                    <div key={cluster._id} className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="w-full md:w-3/4">
                          <div className="flex items-center flex-wrap gap-2">
                            <h3 className="text-lg font-medium">
                              {cluster.name}
                            </h3>
                            <StatusBadge status={cluster.status} />
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {cluster.description}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm mt-2">
                            <div>
                              Size: <strong>{cluster.size}</strong>
                            </div>
                            <div>
                              Classification:{" "}
                              <strong>{cluster.size_classification}</strong>
                            </div>
                            <div>
                              Domain Type:{" "}
                              <strong>{cluster.primary_domain_type}</strong>
                            </div>
                            <div>
                              Interest:{" "}
                              <strong>{cluster.primary_interest}</strong>
                            </div>
                            <div>
                              Engagement:{" "}
                              <strong>{cluster.engagement_potential}</strong>
                            </div>
                          </div>
                          {Object.keys(cluster.top_universities).length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-600">
                                Top Universities:
                              </p>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {Object.entries(cluster.top_universities).map(
                                  ([univ, count]) => (
                                    <span
                                      key={univ}
                                      className="px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                                    >
                                      {univ} ({count})
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-2 self-start md:self-center mt-2 md:mt-0">
                          <Button
                            onClick={() => openEditModal(cluster)}
                            variant="outline"
                            size="sm"
                          >
                            Edit
                          </Button>
                          {cluster.status === "active" ? (
                            <Button
                              onClick={() =>
                                updateClusterStatus(
                                  cluster._id,
                                  "archived",
                                  cluster.name
                                )
                              }
                              variant="cancel"
                              size="sm"
                            >
                              Archive
                            </Button>
                          ) : (
                            <Button
                              onClick={() =>
                                updateClusterStatus(
                                  cluster._id,
                                  "active",
                                  cluster.name
                                )
                              }
                              variant="primary"
                              size="sm"
                            >
                              Activate
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal with Blurred Background */}
      {isEditing && editCluster && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div
            className="bg-white rounded-lg w-full max-w-lg p-6 shadow-xl relative"
            style={{ zIndex: 60 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Cluster</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
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
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editCluster.name}
                  onChange={(e) =>
                    setEditCluster({ ...editCluster, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editCluster.description}
                  onChange={(e) =>
                    setEditCluster({
                      ...editCluster,
                      description: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md p-2"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Engagement Potential
                </label>
                <CustomSelect
                  value={editCluster.engagement_potential}
                  onChange={(value) =>
                    setEditCluster({
                      ...editCluster,
                      engagement_potential: value,
                    })
                  }
                  options={engagementOptions}
                  placeholder="Select engagement potential"
                  size="md"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button onClick={() => setIsEditing(false)} variant="cancel">
                Cancel
              </Button>
              <Button onClick={saveClusterEdit} variant="primary">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Centralized Logout Confirmation */}
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

      {/* Confirmation Alert for Cluster Actions */}
      {showAlert && alertAction && (
        <Alert
          title={
            alertAction.type === "archive"
              ? "Archive Cluster"
              : "Activate Cluster"
          }
          message={
            alertAction.type === "archive"
              ? `Are you sure you want to archive "${alertAction.clusterName}"? This will hide it from active segments.`
              : `Are you sure you want to activate "${alertAction.clusterName}"? This will make it visible in active segments.`
          }
          confirmText={alertAction.type === "archive" ? "Archive" : "Activate"}
          cancelText="Cancel"
          onConfirm={handleAlertConfirm}
          onCancel={() => {
            setShowAlert(false);
            setAlertAction(null);
          }}
          position="top-center"
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ClusterManagement;
