import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/Layout/AdminSidebar";
import AdminNavbar from "../../components/Layout/AdminNavbar";
import PageHeader from "../../components/Layout/PageHeader";
import ClusterVisualization from "../../components/AdminDashboard/ClusterVisualization";
import Alert from "../../components/UI/Alert";
import Button from "../../components/UI/Button";
import Toast from "../../components/UI/Toast";
import { adminLogout, getAdmin } from "../../utils/adminAuthUtils";
import overlayImage from "../../assets/elements.svg";

const VisualizationsPage: React.FC = () => {
  const [adminUser, setAdminUser] = useState(getAdmin());
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);
  const [currentDatasetId, setCurrentDatasetId] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    setAdminUser(getAdmin());
    document.title = "Audience Visualizations | EduPulse Marketing";

    // Redirect if not logged in
    if (!getAdmin()) {
      navigate("/admin/login");
    }
  }, [navigate]);

  const handleLogout = async () => {
    setShowLogoutAlert(false);
    await adminLogout();
    setToast({ type: "success", message: "Logged out successfully!" });
    setTimeout(() => navigate("/admin/login"), 1500);
  };

  return (
    <div className="flex h-screen">
      <AdminSidebar onLogout={() => setShowLogoutAlert(true)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar
          user={adminUser}
          onLogout={() => setShowLogoutAlert(true)}
          title="Audience Visualizations"
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

          {/* Main content with container */}
          <div className="container mx-auto px-6 relative z-10 mt-6">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl text-dark font-semibold mb-4">
                Audience Clusters Visualization
              </h2>
              <p className="text-gray-600 mb-6">
                Explore your audience segments visually. This interactive
                visualization shows how your email subscribers are grouped into
                different clusters based on their characteristics.
              </p>

              {/* Visualization component */}
              <div className="border border-gray-100 rounded-lg p-2 ">
                <ClusterVisualization
                  datasetId={currentDatasetId || undefined}
                />
              </div>

              <div className="mt-6 bg-green-50 p-4 rounded-md">
                <h3 className="text-lg font-medium text-green mb-2">
                  Visualization Tips
                </h3>
                <ul className="list-disc pl-5 text-green-800 space-y-1">
                  <li>Hover over charts to see details about each segment</li>
                  <li>Select a cluster to focus and see more information</li>
                  <li>
                    Use the visualizations to make decisions
                  </li>
                  <li>
                    Different colors represent different audience categories
                  </li>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium mb-4">Data Insights</h3>
                <p className="text-gray-600 mb-3">
                  The visualizations above highlight patterns in your subscriber
                  data:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  <li>Segment size indicates subscriber volume</li>
                  <li>Proximity between clusters shows similarity</li>
                  <li>Color groupings reveal similar engagement patterns</li>
                  <li>Zero in on high-value segments for custom campaigns
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium mb-4">Next Steps</h3>
                <p className="text-gray-600 mb-3">
                  Use these visualizations to make data-driven marketing
                  decisions:
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => navigate("/admin/clustering")}
                    variant="primary"
                    className="w-full justify-center"
                  >
                    Segment More Emails
                  </Button>
                  <Button
                    onClick={() => navigate("/admin/dashboard")}
                    variant="password"
                    className="w-full justify-center"
                  >
                    Manage Audience Segments
                  </Button>
                  <Button
                    onClick={() => window.print()}
                    variant="password"
                    className="w-full justify-center"
                  >
                    See Performance
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Toast for notifications */}
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </div>
      </div>

      {/* Logout Confirmation */}
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

export default VisualizationsPage;
