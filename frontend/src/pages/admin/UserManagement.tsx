import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/Layout/PageHeader";
import AdminSidebar from "../../components/Layout/AdminSidebar";
import AdminNavbar from "../../components/Layout/AdminNavbar";
import Button from "../../components/UI/Button";
import Alert from "../../components/UI/Alert";
import Toast from "../../components/UI/Toast";
import SearchInput from "../../components/UI/SearchInput";
import StatCard from "../../components/UI/StatCard";
import UserCard from "../../components/UI/UserCard";
import {
  getAdmin,
  adminLogout,
  adminAuthApi,
} from "../../utils/adminAuthUtils";
import overlayImage from "../../assets/elements.svg";

// Type definitions
type User = {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
  lastLogin: string;
  profileImage: string;
  provider?: string;
  isActive: boolean; // Added isActive field
};

type ToastType = {
  message: string;
  type: "success" | "error" | "warning";
} | null;

const UserManagement: React.FC = () => {
  const [toast, setToast] = useState<ToastType>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<User[]>([]);
  const [adminUser, setAdminUser] = useState(getAdmin());
  const [showLogoutAlert, setShowLogoutAlert] = useState<boolean>(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState<boolean>(false);
  const [showBlockAlert, setShowBlockAlert] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [blockAction, setBlockAction] = useState<boolean>(false); // true = block, false = unblock

  const navigate = useNavigate();

  // Logout confirmation handler
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
    document.title = "User Management | EduPulse Marketing";
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminAuthApi.get<{ users: User[] }>(
        "/api/admin/users"
      );
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Failed to fetch users", error);
      setToast({ message: "Failed to fetch users", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteAlert(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    setShowDeleteAlert(false);
    setLoading(true);

    try {
      await adminAuthApi.delete(`/api/admin/users/${selectedUser._id}`);

      // Remove user from the list
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user._id !== selectedUser._id)
      );
      setToast({
        message: `User ${selectedUser.username} has been removed successfully`,
        type: "success",
      });
    } catch (error) {
      console.error("Failed to delete user", error);
      setToast({ message: "Failed to delete user", type: "error" });
    } finally {
      setLoading(false);
      setSelectedUser(null);
    }
  };

  // Handle showing block/unblock confirmation
  const handleToggleBlock = (user: User) => {
    setSelectedUser(user);
    setBlockAction(!user.isActive); // If user is blocked, we'll unblock them and vice versa
    setShowBlockAlert(true);
  };

  // Confirm block/unblock action
  const confirmToggleBlock = async () => {
    if (!selectedUser) return;

    setShowBlockAlert(false);
    setLoading(true);

    try {
      const response = await adminAuthApi.put(`/api/admin/users/${selectedUser._id}/block`, {
        isActive: blockAction
      });

      // Update user in the list
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === selectedUser._id ? { ...user, isActive: blockAction } : user
        )
      );

      setToast({
        message: blockAction 
          ? `User ${selectedUser.username} has been unblocked successfully` 
          : `User ${selectedUser.username} has been blocked successfully`,
        type: "success",
      });
    } catch (error) {
      console.error("Failed to update user status", error);
      setToast({ message: "Failed to update user status", type: "error" });
    } finally {
      setLoading(false);
      setSelectedUser(null);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate user statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.isActive).length;
  const blockedUsers = users.filter(user => !user.isActive).length;
  const newThisMonth = users.filter(user => {
    const createdDate = new Date(user.createdAt);
    const now = new Date();
    return createdDate.getMonth() === now.getMonth() && 
           createdDate.getFullYear() === now.getFullYear();
  }).length;
  
  return (
    <div className="flex h-screen">
      <AdminSidebar onLogout={handleShowLogoutConfirmation} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar user={adminUser} onLogout={handleShowLogoutConfirmation} />
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 pb-8">
          <div className="relative">
            <PageHeader
              title="User Management"
              showBackButton={true}
              onBack={() => navigate("/admin/dashboard")}
              subheading="Manage system users and their access"
              size="large"
              action={
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 gap-3 w-full">
                  <SearchInput
                    placeholder="Search users..."
                    borderColor="border-green"
                    backgroundColor="bg-gray-50"
                    textColor="text-gray-700"
                    focusBorderColor="focus:border-green"
                    iconColor="text-green hover:text-dark"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onSearch={() => {
                      console.log("Search triggered:", searchTerm);
                    }}
                    className="w-64"
                  />

                  <Button
                    onClick={fetchUsers}
                    disabled={loading}
                    variant="secondary"
                    size="md"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Loading...</span>
                      </div>
                    ) : (
                      "Refresh"
                    )}
                  </Button>
                </div>
              }
              overlayImage={overlayImage}
            />
          </div>

          {/* Stats Cards */}
          <div className="container mx-auto px-6 relative -mt-20 z-20">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <StatCard
                title="Total Users"
                count={totalUsers}
                iconColor="text-blue-600"
                loading={loading}
                icon={
                  <div className="bg-blue-100 p-3 rounded-md">
                    <svg
                      className="h-6 w-6 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                }
              />
              
              <StatCard
                title="Active Users"
                count={activeUsers}
                iconColor="text-green-600"
                loading={loading}
                icon={
                  <div className="bg-green-100 p-3 rounded-md">
                    <svg
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                }
              />
              
              <StatCard
                title="Blocked Users"
                count={blockedUsers}
                iconColor="text-red-600"
                loading={loading}
                icon={
                  <div className="bg-red-100 p-3 rounded-md">
                    <svg
                      className="h-6 w-6 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                      />
                    </svg>
                  </div>
                }
              />
              
              <StatCard
                title="New This Month"
                count={newThisMonth}
                iconColor="text-purple-600"
                loading={loading}
                icon={
                  <div className="bg-purple-100 p-3 rounded-md">
                    <svg
                      className="h-6 w-6 text-purple-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                }
              />
            </div>

            {/* User Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                [...Array(6)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow p-6 animate-pulse"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="rounded-full bg-gray-300 h-12 w-12"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-5/6"></div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="h-3 bg-gray-300 rounded w-full"></div>
                      <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <div className="h-8 bg-gray-300 rounded w-24"></div>
                    </div>
                  </div>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <UserCard
                    key={user._id}
                    user={user}
                    onDelete={() => handleDeleteUser(user)}
                    onToggleBlock={() => handleToggleBlock(user)}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    No users found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm
                      ? `No users matching "${searchTerm}"`
                      : "There are no users in the system yet."}
                  </p>
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

      {/* Delete User Confirmation */}
      {showDeleteAlert && selectedUser && (
        <Alert
          title="Confirm User Deletion"
          message={`Are you sure you want to permanently remove ${selectedUser.username} (${selectedUser.email}) from the system? This action cannot be undone.`}
          confirmText="Delete User"
          cancelText="Cancel"
          position="top-center"
   
          onConfirm={confirmDeleteUser}
          onCancel={() => {
            setShowDeleteAlert(false);
            setSelectedUser(null);
          }}
        />
      )}

      {/* Block/Unblock User Confirmation */}
      {showBlockAlert && selectedUser && (
        <Alert
          title={blockAction ? "Confirm User Activation" : "Confirm User Block"}
          message={blockAction 
            ? `Are you sure you want to activate ${selectedUser.username}'s account? They will regain access to the system.` 
            : `Are you sure you want to block ${selectedUser.username}'s account? They will no longer be able to access the system.`
          }
          confirmText={blockAction ? "Activate User" : "Block User"}
          cancelText="Cancel"
          position="top-center"
        
          onConfirm={confirmToggleBlock}
          onCancel={() => {
            setShowBlockAlert(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

export default UserManagement;
