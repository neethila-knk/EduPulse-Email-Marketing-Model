import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "../components/Layout/Layout";
import PageHeader from "../components/Layout/PageHeader";
import Button from "../components/UI/Button";
import TextInput from "../components/UI/TextInput";
import ProfileImage from "../components/UI/ProfileImage";
import PasswordInput from "../components/UI/PasswordInput";
import Toast from "../components/UI/Toast";
import { authApi, isAuthenticated } from "../utils/authUtils";
import overlayImage from "../assets/elements.svg";
import { Lock, X } from "lucide-react";
import Alert from "../components/UI/Alert";
import DeleteAccountModal from "../components/UI/DeleteAccountModal";

interface User {
  id: string;
  username: string;
  email: string;
  provider: string;
  profileImage?: string;
}

interface AuthResponse {
  user: User;
}

interface ProfileUpdateResponse {
  message: string;
  user: User;
}

interface ProfileImageResponse {
  message: string;
  user: User;
}

interface FormErrors {
  username?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

interface ToastInfo {
  visible: boolean;
  message: string;
  type: "success" | "error" | "info";
}

const UserProfile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Account deletion state
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Form state
  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [changePassword, setChangePassword] = useState(false);

  // Toast state
  const [toast, setToast] = useState<ToastInfo>({
    visible: false,
    message: "",
    type: "info",
  });

  // Confirmation state for image removal
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Section visibility
  const [passwordSectionOpen, setPasswordSectionOpen] = useState(false);

  // Show toast message
  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setToast({ visible: true, message, type });
  };

  // Determine the profile image to display
  const getProfileImageUrl = (userData: User): string | null => {
    if (userData.profileImage) {
      return userData.profileImage;
    }
    return null;
  };

  // Preload the image with improved error handling
  const preloadImage = (url: string) => {
    if (!url) {
      setImageLoading(false);
      return;
    }

    setImageLoading(true);
    const img = new Image();
    img.onload = () => {
      setImageLoading(false);
    };
    img.onerror = () => {
      console.error("Failed to load image:", url);
      setImageLoading(false);
      setProfileImageUrl(null); // Clear the invalid image URL
    };
    img.src = url;
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate username
    if (!username.trim()) {
      newErrors.username = "Username is required";
    }

    // Validate password fields if changing password
    if (changePassword) {
      if (!currentPassword) {
        newErrors.currentPassword = "Current password is required";
      }

      if (!newPassword) {
        newErrors.newPassword = "New password is required";
      } else if (newPassword.length < 8) {
        newErrors.newPassword = "Password must be at least 8 characters";
      }

      if (!confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    document.title = "My Profile | EduPulse";

    // Check if user is authenticated
    if (!isAuthenticated()) {
      navigate("/login", {
        state: { message: "Please log in to view your profile" },
      });
      return;
    }

    // Check URL for success/error messages
    const params = new URLSearchParams(location.search);

    // Check for error messages
    const error = params.get("error");

    if (error) {
      let errorMessage = "An error occurred.";

      // Handle specific error types
      if (error === "update_failed") {
        errorMessage = "Failed to update profile. Please try again.";
      }

      showToast(errorMessage, "error");
    }

    // Remove the URL parameters after processing
    if (error) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    const fetchUserData = async () => {
      try {
        const response = await authApi.get<AuthResponse>("/auth/me");
        const userData = response.data.user;
        setUser(userData);
        setUsername(userData.username);

        // Set the profile image URL
        const imageUrl = getProfileImageUrl(userData);
        setProfileImageUrl(imageUrl);

        // Preload the image to prevent slow loading
        if (imageUrl) {
          preloadImage(imageUrl);
        } else {
          setImageLoading(false);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        showToast("Failed to load user profile. Please try again.", "error");
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

  // Function to handle account deletion
  const handleAccountDeletion = async (password?: string) => {
    setIsDeletingAccount(true);
    try {
      // Call deletion endpoint (using axios or your authApi helper)
      await authApi.request({
        url: "/api/profile",
        method: "delete",
        data: { password },
      });

      // Show a success message and clear local storage/session, then navigate to login
      showToast("Account deleted successfully", "success");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      navigate("/login", {
        state: { message: "Your account has been deleted" },
      });
    } catch (error: any) {
      console.error("Error deleting account:", error);
      // Show error message (you could check error.response.data.message)
      showToast(
        error.response?.data?.message || "Failed to delete account",
        "error"
      );
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteAccountModal(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.get("/auth/logout");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      showToast("Failed to log out. Please try again.", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("username", username);

      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      if (changePassword) {
        formData.append("currentPassword", currentPassword);
        formData.append("newPassword", newPassword);
      }

      // Make API call to update profile with proper type annotation
      const response = await authApi.patch<ProfileUpdateResponse>(
        "/api/profile",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Update local user state with the response data
      if (response.data.user) {
        const updatedUser = response.data.user;
        setUser(updatedUser);

        // Update profile image URL
        const imageUrl = getProfileImageUrl(updatedUser);
        setProfileImageUrl(imageUrl);

        if (imageUrl) {
          preloadImage(imageUrl);
        }
      }

      // Reset password fields after successful submission
      if (changePassword) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setChangePassword(false);
        setPasswordSectionOpen(false);
      }

      showToast(
        response.data.message || "Profile updated successfully",
        "success"
      );
    } catch (error: any) {
      console.error("Error updating profile:", error);

      // Handle specific error messages from the API
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        showToast(error.response.data.message, "error");

        // Handle specific field errors
        if (error.response.data.message.includes("Password")) {
          setErrors((prev) => ({
            ...prev,
            currentPassword: error.response.data.message,
          }));
        } else if (error.response.data.message.includes("Username")) {
          setErrors((prev) => ({
            ...prev,
            username: error.response.data.message,
          }));
        }
      } else {
        showToast("An error occurred while updating your profile", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (file: File | null) => {
    setProfileImage(file);

    // If a new file was selected, create a temporary URL for preview
    if (file) {
      try {
        const fileUrl = URL.createObjectURL(file);
        setProfileImageUrl(fileUrl);
      } catch (error) {
        console.error("Error creating URL for profile image:", error);
        showToast(
          "Failed to preview image. Please try a different image.",
          "error"
        );
      }
    }
  };

  // Show confirmation dialog before image removal
  const confirmImageRemove = () => {
    setShowDeleteConfirmation(true);
  };

  // Actual image removal function
  const handleImageRemove = async () => {
    setShowDeleteConfirmation(false);
    setIsSubmitting(true);

    try {
      // Make API call to remove profile image
      const response = await authApi.delete<ProfileImageResponse>(
        "/api/profile/image"
      );

      // Update local state
      setProfileImage(null);
      setProfileImageUrl(null);

      if (response.data.user) {
        setUser(response.data.user);
      }

      showToast("Profile image removed successfully", "success");
    } catch (error) {
      console.error("Error removing profile image:", error);
      showToast("Failed to remove profile image", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel image removal
  const cancelImageRemove = () => {
    setShowDeleteConfirmation(false);
  };

  const togglePasswordSection = () => {
    setPasswordSectionOpen(!passwordSectionOpen);
    if (!passwordSectionOpen) {
      setChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
    }
  };

  // Clear form function
  const handleCancel = () => {
    // Reset form to initial values from user data
    if (user) {
      setUsername(user.username);
      const imageUrl = getProfileImageUrl(user);
      setProfileImageUrl(imageUrl);

      if (imageUrl) {
        preloadImage(imageUrl);
      }
    }
    setProfileImage(null);

    // Reset password fields
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setChangePassword(false);
    setPasswordSectionOpen(false);

    // Clear errors
    setErrors({});

    showToast("Changes discarded", "info");
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
      {/* Toast notification */}
      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
        />
      )}

      {showDeleteConfirmation && (
        <Alert
          title="Delete Profile Image"
          message="Are you sure you want to remove your profile image?"
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleImageRemove}
          onCancel={cancelImageRemove}
          position="top-center" // This is the default, so you can omit it if you want
        />
      )}
      {/* Page Header with back button */}
      <PageHeader
        title="My Profile"
        subheading="View and update your profile information"
        isSticky
        size="small"
        showBackButton={true}
        onBack={() => navigate("/dashboard")}
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

      {/* Left-aligned container similar to NewCampaign page */}
      <div className="container mx-auto px-4 md:px-6 py-10">
        <form
          onSubmit={handleSubmit}
          className="max-w-4xl bg-white rounded-lg shadow-md overflow-hidden"
        >
          {/* Profile Image Section */}
          <div className="bg-gray-300 p-6 flex flex-col items-center justify-center border-b border-gray-200">
            {imageLoading ? (
              <div className="mb-4 w-32 h-32 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <ProfileImage
                initialImage={profileImageUrl}
                onChange={handleImageChange}
                onRemove={confirmImageRemove} // Show confirmation dialog
                className="mb-4"
                disabled={isSubmitting}
              />
            )}
          </div>

          <div className="p-6">
            {/* Profile Information Section */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-700 mb-4">
                Profile Information
              </h2>

              <TextInput
                id="username"
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={errors.username}
                required
                disabled={isSubmitting}
              />

              {user && (
                <TextInput
                  id="email"
                  label="Email"
                  value={user.email}
                  onChange={() => {}}
                  disabled={true}
                />
              )}
            </div>

            {/* Display OAuth provider message if applicable */}
            {user && user.provider !== "local" && (
              <div className="mb-8 p-4 bg-yellow-50 rounded-md">
                <p className="text-sm text-yellow-800">
                  You're signed in with{" "}
                  {user.provider.charAt(0).toUpperCase() +
                    user.provider.slice(1)}
                  . Password management is not available for OAuth accounts.
                </p>
              </div>
            )}

            {/* Password Section - Only show for local accounts */}
            {user && user.provider === "local" && (
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-700">Security</h2>
                  <div className="ml-4">
                    <button
                      type="button"
                      onClick={togglePasswordSection}
                      className="flex items-center gap-2 text-sm text-dark hover:text-green focus:outline-none rounded-md transition-all hover-lift-noShadow"
                      disabled={isSubmitting}
                    >
                      {passwordSectionOpen ? (
                        <>
                          <span>No need to change the password</span>
                          <X size={18} />
                        </>
                      ) : (
                        <>
                          <span>Looking to change your password?</span>
                          <Lock size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Section with Animation */}
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: passwordSectionOpen ? "500px" : "0" }}
                >
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
                    <div className="mb-4">
                      <div className="flex items-center mb-4">
                        <input
                          id="changePassword"
                          type="checkbox"
                          checked={changePassword}
                          onChange={() => setChangePassword(!changePassword)}
                          className="h-4 w-4 green focus:ring-green border-gray-300 rounded"
                          disabled={isSubmitting}
                        />
                        <label
                          htmlFor="changePassword"
                          className="ml-2 block text-sm text-gray-700"
                        >
                          I want to change my password
                        </label>
                      </div>

                      {/* Password Fields with Animation */}
                      <div
                        className="space-y-4 overflow-hidden transition-all duration-300 ease-in-out"
                        style={{ maxHeight: changePassword ? "500px" : "0" }}
                      >
                        <PasswordInput
                          id="currentPassword"
                          label="Current Password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter your current password"
                          error={errors.currentPassword}
                          required={changePassword}
                          disabled={isSubmitting}
                        />

                        <PasswordInput
                          id="newPassword"
                          label="New Password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          error={errors.newPassword}
                          required={changePassword}
                          disabled={isSubmitting}
                        />

                        <PasswordInput
                          id="confirmPassword"
                          label="Confirm Password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          error={errors.confirmPassword}
                          required={changePassword}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Delete Account Section */}
            <div className="container mx-auto px-4 pb-6 md:px-6">
              <div className="bg-white rounded-lg shadow-md p-6 mt-8 border border-red-200">
                <h2 className="text-lg font-bold text-red-700 mb-4">
                  Delete Account
                </h2>
                <p className="mb-4 text-sm text-gray-600">
                  Warning: This action is irreversible. Your account and all
                  associated data will be permanently deleted.
                </p>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeleteAccountModal(true)}
                  disabled={isDeletingAccount}
                >
                  {isDeletingAccount ? "Deleting..." : "Delete Account"}
                </Button>
              </div>
            </div>

            {/* Delete Account Confirmation Modal */}
            {showDeleteAccountModal && user && (
              <DeleteAccountModal
                provider={user.provider}
                isDeleting={isDeletingAccount}
                onConfirm={handleAccountDeletion}
                onCancel={() => setShowDeleteAccountModal(false)}
              />
            )}
            {/* Action Buttons - Right aligned */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                className="mr-3"
                onClick={handleCancel}
                type="button"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="px-6"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default UserProfile;
