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
import {
  getAdmin,
  adminLogout,
  adminAuthApi,
} from "../../utils/adminAuthUtils";
import overlayImage from "../../assets/elements.svg";
import AdminCard from "../../components/AdminDashboard/AdminCard";
import UpdatePasswordModal from "../../components/AdminDashboard/UpdatePasswordModal";
import AddAdminModal from "../../components/AdminDashboard/AddAdminModal";

type Admin = {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
  role: string; // ✅ Add this line
};

type ToastType = {
  message: string;
  type: "success" | "error" | "warning";
} | null;

const AdminManagement: React.FC = () => {
  const [toast, setToast] = useState<ToastType>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState(getAdmin());
  const [showLogoutAlert, setShowLogoutAlert] = useState<boolean>(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const isSuperAdmin = currentAdmin?.role === "super_admin";
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBlockAlert, setShowBlockAlert] = useState(false);
  const [adminToToggle, setAdminToToggle] = useState<Admin | null>(null);

  useEffect(() => {
    setCurrentAdmin(getAdmin());

    document.title = "Admin Management | EduPulse Marketing";
    const adminData = getAdmin();
    console.log("Admin data:", adminData); // Check this in your browser console
    setCurrentAdmin(adminData);

    // Check if the current admin is a super_admin
    if (adminData?.role === "super_admin") {
      fetchAdmins();
    }
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await adminAuthApi.get<{ admins: Admin[] }>(
        "/admin/admins"
      );
      setAdmins(response.data.admins || []);
    } catch (error) {
      console.error("Failed to fetch admins", error);
      setToast({ message: "Failed to fetch admins", type: "error" });
    } finally {
      setLoading(false);
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

  const handleDeleteAdmin = (admin: Admin) => {
    setSelectedAdmin(admin);
    setShowDeleteAlert(true);
  };

  const confirmDeleteAdmin = async () => {
    if (!selectedAdmin) return;

    setShowDeleteAlert(false);
    setLoading(true);

    try {
      await adminAuthApi.delete(`/admin/admins/${selectedAdmin._id}`);
      setAdmins((prev) =>
        prev.filter((admin) => admin._id !== selectedAdmin._id)
      );
      setToast({
        message: `Admin ${selectedAdmin.username} has been removed successfully`,
        type: "success",
      });
    } catch (error) {
      console.error("Failed to delete admin", error);
      setToast({ message: "Failed to delete admin", type: "error" });
    } finally {
      setLoading(false);
      setSelectedAdmin(null);
    }
  };
  const handleToggleStatusRequest = (admin: Admin) => {
    setAdminToToggle(admin);
    setShowBlockAlert(true);
  };
  

  const confirmToggleStatus = async () => {
    if (!adminToToggle) return;

    try {
      setLoading(true);
      const newStatus = !adminToToggle.isActive;

      await adminAuthApi.put(`/admin/admins/${adminToToggle._id}/block`, {
        isActive: newStatus,
      });

      setAdmins((prev) =>
        prev.map((a) =>
          a._id === adminToToggle._id ? { ...a, isActive: newStatus } : a
        )
      );

      setToast({
        message: `${adminToToggle.username} has been ${
          newStatus ? "activated" : "blocked"
        } successfully`,
        type: "success",
      });
    } catch (error) {
      console.error("Failed to update admin status", error);
      setToast({ message: "Failed to update admin status", type: "error" });
    } finally {
      setLoading(false);
      setShowBlockAlert(false);
      setAdminToToggle(null);
    }
  };

  const handleShowPasswordModal = (admin: Admin) => {
    setSelectedAdmin(admin);
    setShowPasswordModal(true);
  };

  const handlePasswordUpdate = async (
    currentPassword: string,
    newPassword: string
  ) => {
    if (!selectedAdmin) return;

    try {
      setLoading(true);
      await adminAuthApi.put(`/admin/admins/${selectedAdmin._id}/password`, {
        currentPassword,
        newPassword,
      });

      setShowPasswordModal(false);
      setToast({
        message: `Password for ${selectedAdmin.username} updated successfully`,
        type: "success",
      });
    } catch (error: any) {
      console.error("Failed to update password", error);
      setToast({
        message: error.response?.data?.message || "Failed to update password",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddAdmin = async (form: {
    username: string;
    email: string;
    password: string;
  }) => {
    try {
      setLoading(true);

      const response = await adminAuthApi.post<{
        message: string;
        admin: {
          id: string;
          username: string;
          email: string;
          role: string;
        };
      }>("/admin/admins", {
        ...form,
        role: "admin", // forced server-side, just for extra protection
      });

      setAdmins((prev) => [
        ...prev,
        {
          _id: response.data.admin.id,
          username: response.data.admin.username,
          email: response.data.admin.email,
          createdAt: new Date().toISOString(),
          lastLogin: undefined, // ✅ FIXED: must be undefined, not null
          isActive: true,
          role: "admin",
        },
      ]);

      setToast({
        type: "success",
        message: response.data.message || "Admin created successfully",
      });
      setShowAddModal(false);
    } catch (error: any) {
      console.error("Failed to create admin", error);
      setToast({
        type: "error",
        message: error.response?.data?.message || "Failed to create admin",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      <AdminSidebar onLogout={handleShowLogoutConfirmation} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar
          user={currentAdmin}
          onLogout={handleShowLogoutConfirmation}
        />
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 pb-8">
          {currentAdmin && currentAdmin.role !== "super_admin" ? (
            <div className="p-8">
              <Alert
                title="Restricted Access"
                type="warning"
                message="Only Super Admins are authorized to manage other admin accounts."
                confirmText="Back to Dashboard"
                onConfirm={() => navigate("/admin")}
                showCancelButton={false}
                position="top-center"
              />
            </div>
          ) : (
            <>
              <div className="relative">
                <PageHeader
                  title="Admin Management"
                  showBackButton={true}
                  onBack={() => navigate("/admin/dashboard")}
                  subheading="Manage system administrators and their access"
                  size="large"
                  action={
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-1 gap-3 w-full">
                      <SearchInput
                        placeholder="Search admins..."
                        borderColor="border-green"
                        backgroundColor="bg-gray-50"
                        textColor="text-gray-700"
                        focusBorderColor="focus:border-green"
                        iconColor="text-green hover:text-dark"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onSearch={() =>
                          console.log("Search triggered:", searchTerm)
                        }
                        className="w-64"
                      />

                      <Button
                        onClick={() => setShowAddModal(true)}
                        variant="secondary"
                        className="w-40"
                      >
                        Add Admin
                      </Button>
                      <Button
                        onClick={fetchAdmins}
                        disabled={loading}
                        variant="secondary"
                        size="md"
                        className="w-40"
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

              <div className="container mx-auto px-6 relative -mt-20 z-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <StatCard
                    title="Total Admins"
                    count={admins.length}
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
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      </div>
                    }
                  />
                  <StatCard
                    title="Active Admins"
                    count={admins.filter((a) => a.isActive).length}
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
                    title="Blocked Admins"
                    count={admins.filter((a) => !a.isActive).length}
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
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                    }
                  />
                </div>

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
                  ) : filteredAdmins.length > 0 ? (
                    filteredAdmins.map((admin) => (
                      <AdminCard
                        key={admin._id}
                        admin={admin}
                        currentAdminId={currentAdmin?._id}
                        onDelete={() => handleDeleteAdmin(admin)}
                        onToggleStatus={() => handleToggleStatusRequest(admin)}
                        onUpdatePassword={() => handleShowPasswordModal(admin)}
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
                        No admins found
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchTerm
                          ? `No admins matching "${searchTerm}"`
                          : "There are no admins in the system yet."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
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

      {showDeleteAlert && selectedAdmin && (
        <Alert
          title="Confirm Admin Removal"
          message={`Are you sure you want to remove ${selectedAdmin.username} (${selectedAdmin.email}) from the system? This action cannot be undone.`}
          confirmText="Delete Admin"
          cancelText="Cancel"
          position="top-center"
          onConfirm={confirmDeleteAdmin}
          onCancel={() => {
            setShowDeleteAlert(false);
            setSelectedAdmin(null);
          }}
        />
      )}

      {showPasswordModal && selectedAdmin && (
        <UpdatePasswordModal
          adminUsername={selectedAdmin.username}
          isSelf={selectedAdmin._id === currentAdmin?._id}
          onClose={() => {
            setShowPasswordModal(false);
            
            setSelectedAdmin(null);
          }}
          onSubmit={handlePasswordUpdate}
          isLoading={loading}
        />
      )}

      {showAddModal && (
        <AddAdminModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddAdmin}
          isLoading={loading}
        />
      )}

      {showBlockAlert && adminToToggle && (
        <Alert
          title={`${adminToToggle.isActive ? "Block" : "Activate"} Admin`}
          message={`Are you sure you want to ${
            adminToToggle.isActive ? "block" : "activate"
          } ${adminToToggle.username} (${adminToToggle.email})?`}
          confirmText={
            adminToToggle.isActive ? "Block Admin" : "Activate Admin"
          }
          cancelText="Cancel"
          position="top-center"
          onConfirm={confirmToggleStatus}
          onCancel={() => {
            setShowBlockAlert(false);
            setAdminToToggle(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminManagement;
