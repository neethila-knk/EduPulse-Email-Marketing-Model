import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/Layout/PageHeader";
import AdminSidebar from "../../components/Layout/AdminSidebar";
import AdminNavbar from "../../components/Layout/AdminNavbar";
import StatCard from "../../components/UI/StatCard";
import Button from "../../components/UI/Button";
import Alert from "../../components/UI/Alert";
import Toast from "../../components/UI/Toast";
import {
  adminLogout,
  getAdmin,
  adminAuthApi,
} from "../../utils/adminAuthUtils";
import overlayImage from "../../assets/elements.svg";

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  emailsSent: number;
  campaigns: number;
}

const adminFacts = [
  "Welcome to the admin dashboard where you can manage all aspects of your marketing platform.",
  "Regular system backups ensure your data is always protected.",
  "You can manage user permissions and access from the settings panel.",
  "Monitor system performance and get insights from the analytics section.",
  "Need help? Access the admin documentation from the help menu.",
  "Custom reports can be generated and exported from the reports section.",
  "Security audits are performed regularly to ensure platform integrity.",
];

const AdminPanel: React.FC = () => {
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);
  const [fact, setFact] = useState<string>("");
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    emailsSent: 0,
    campaigns: 0,
  });
  const [loading, setLoading] = useState(false);
  const [recentActivity, setRecentActivity] = useState<
    { action: string; timestamp: string; user: string }[]
  >([]);
  const [systemStatus, setSystemStatus] = useState({
    node: false,
    fastapi: false,
    redis: false,
  });

  const [adminUser, setAdminUser] = useState(getAdmin());
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const navigate = useNavigate();

  const handleShowLogoutConfirmation = () => {
    setShowLogoutAlert(true);
  };

  const handleLogout = async () => {
    setShowLogoutAlert(false);
    await adminLogout();
    setToast({ type: "success", message: "Logged out successfully!" });
    setTimeout(() => navigate("/admin/login"), 1500);
  };

  useEffect(() => {
    setAdminUser(getAdmin());
    document.title = "Admin Dashboard | EduPulse Marketing";
    setFact(adminFacts[Math.floor(Math.random() * adminFacts.length)]);
    fetchStats();
    fetchRecentActivity();
    fetchSystemStatus();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await adminAuthApi.get("/admin/dashboard/stats");
      setStats(response.data as SystemStats);
    } catch (error) {
      console.error("Failed to fetch stats", error);
      setToast({ message: "Failed to fetch dashboard stats", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await adminAuthApi.get("/admin/dashboard/activity");
      setRecentActivity(response.data as { action: string; timestamp: string; user: string }[]);
    } catch (error) {
      console.error("Failed to fetch recent activity", error);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const res = await adminAuthApi.get("/admin/status");
      setSystemStatus(res.data as { node: boolean; fastapi: boolean; redis: boolean });
    } catch (err) {
      console.error("Error fetching system status", err);
    }
  };

  const greetingComponent = (
    <div>
      <div className="text-lg font-medium mb-1">
        Welcome back, {adminUser?.username || "Admin"}
      </div>
      <div className="flex items-start text-sm">
        <div className="mr-2 mt-0.5">
          <svg
            className="h-5 w-5 text-yellow"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
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
          <span className="font-medium">Admin Tip:</span> {fact}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen">
      <AdminSidebar onLogout={handleShowLogoutConfirmation} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar user={adminUser} onLogout={handleShowLogoutConfirmation} />
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="relative">
            <PageHeader
              title="Admin Dashboard"
              greeting={greetingComponent}
              size="large"
              action={
                <div className="flex space-x-3">
                  <Button
                    onClick={() => navigate("/admin/clustering")}
                    disabled={loading}
                    variant="secondary"
                    size="md"
                  >
                    Create New Audience Segments
                  </Button>
                </div>
              }
              overlayImage={overlayImage}
            />
          </div>

          <div className="container mx-auto px-6 relative -mt-20 z-20">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <StatCard
                title="Total Users"
                count={stats.totalUsers}
                description="Registered accounts"
                iconColor="text-blue-600"
                loading={loading}
              />
              <StatCard
                title="Active Users"
                count={stats.activeUsers}
                description="In the last 30 days"
                iconColor="text-green-500"
                loading={loading}
              />
              <StatCard
                title="Emails Sent"
                count={stats.emailsSent}
                description="Total campaign emails"
                iconColor="text-purple-600"
                loading={loading}
              />
              <StatCard
                title="Active Campaigns"
                count={stats.campaigns}
                description="Running campaigns"
                iconColor="text-yellow-500"
                loading={loading}
              />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
                {recentActivity.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {recentActivity.map((activity, index) => (
                      <li key={index} className="py-4 flex">
                        <div className="mr-4 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <svg
                              className="h-6 w-6 text-gray-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {activity.action}
                          </p>
                          <p className="text-sm text-gray-500">
                            {activity.user} • {activity.timestamp}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">
                    No recent activity to display.
                  </p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onClick={() => navigate("/admin/managecluster")}
                    className="cursor-pointer bg-green hover:bg-green/90 text-white rounded-lg p-5 transition duration-200 shadow-sm hover:shadow-md"
                  >
                    <h4 className="text-sm font-semibold">
                      Manage Email Clusters
                    </h4>
                    <p className="text-xs mt-1 opacity-80">
                      Segment and organize your email contacts.
                    </p>
                  </div>
                  <div
                    onClick={() => navigate("/admin/manageusers")}
                    className="cursor-pointer bg-yellow hover:bg-yellow/90 text-white rounded-lg p-5 transition duration-200 shadow-sm hover:shadow-md"
                  >
                    <h4 className="text-sm font-semibold">User Management</h4>
                    <p className="text-xs mt-1 opacity-80">
                      See user info and manage them easily.
                    </p>
                  </div>
                  <div
                    onClick={() => navigate("/admin/manageadmins")}
                    className="cursor-pointer bg-red hover:bg-red/90 text-white rounded-lg p-5 transition duration-200 shadow-sm hover:shadow-md"
                  >
                    <h4 className="text-sm font-semibold">Admin Management</h4>
                    <p className="text-xs mt-1 opacity-80">
                      Manage admin accounts and control them.
                    </p>
                  </div>
                  <div
                    onClick={() => navigate("/admin/performance")}
                    className="cursor-pointer bg-dark hover:bg-dark/90 text-white rounded-lg p-5 transition duration-200 shadow-sm hover:shadow-md"
                  >
                    <h4 className="text-sm font-semibold">
                      Model Performance
                    </h4>
                    <p className="text-xs mt-1 opacity-80">
                      View the performance of the clustering pipeline.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="my-8 bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">System Status</h3>
              </div>
              <div className="space-y-4">
                {["node", "fastapi", "redis"].map((key) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm capitalize text-gray-700">
                      {key} Server
                    </span>
                    <div className="flex items-center">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          systemStatus[key as keyof typeof systemStatus]
                            ? "bg-green-500"
                            : "bg-red-500"
                        } mr-2`}
                      ></div>
                      <span className="text-sm text-gray-500">
                        {systemStatus[key as keyof typeof systemStatus]
                          ? "Running"
                          : "Down"}
                      </span>
                    </div>
                  </div>
                ))}
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

export default AdminPanel;
