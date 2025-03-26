import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout/Layout";
import PageHeader from "../components/Layout/PageHeader";
import Button from "../components/UI/Button";
import TextInput from "../components/UI/TextInput";
import ProfileImage from "../components/UI/ProfileImage";
import PasswordInput from "../components/UI/PasswordInput";
import { authApi, isAuthenticated } from "../utils/authUtils";
import overlayImage from "../assets/elements.svg";
import { Lock, X } from "lucide-react";

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

interface FormErrors {
  username?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const UserProfile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  // Section visibility
  const [passwordSectionOpen, setPasswordSectionOpen] = useState(false);

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

    const fetchUserData = async () => {
      try {
        const response = await authApi.get<AuthResponse>("/auth/me");
        setUser(response.data.user);
        setUsername(response.data.user.username);
        setProfileImageUrl(response.data.user.profileImage || null);
      } catch (error) {
        console.error("Error fetching user data:", error);
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
  }, [navigate]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (validateForm()) {
      console.log({
        username,
        profileImage,
        passwordChanged: changePassword,
        ...(changePassword && {
          currentPassword,
          newPassword,
        }),
      });

      // Here you would make your API call
      // For now, simulate a successful submission
      setTimeout(() => {
        setIsSubmitting(false);
        // Reset password fields after submission
        if (changePassword) {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setChangePassword(false);
          setPasswordSectionOpen(false);
        }
        // Show success message or notification here
      }, 1000);
    } else {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (file: File | null) => {
    setProfileImage(file);
  };

  const handleImageRemove = () => {
    setProfileImage(null);
    setProfileImageUrl(null);
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
      setProfileImageUrl(user.profileImage || null);
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
      {/* Page Header with back button */}
      <PageHeader
        title="My Profile"
        subheading="View and update your profile information"
        size="small"
        showBackButton={true}
        onBack={() => navigate("/dashboard")}
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
            <ProfileImage
              initialImage={profileImageUrl}
              onChange={handleImageChange}
              onRemove={handleImageRemove}
              className="mb-4"
            />
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
              />

              {user && (
                <TextInput
                  id="email"
                  label="Email"
                  value={user.email}
                  onChange={(e) => {}}
                  disabled={true}
                />
              )}
            </div>

            {/* Password Section */}
            <div className="mb-8">
              <div className="flex mb-4">
                <div className="w-1/4">
                  <h2 className="text-lg font-bold text-gray-700">Security</h2>
                </div>
                <div className="w-3/4">
                  <button
                    type="button"
                    onClick={togglePasswordSection}
                    className="flex items-center gap-2 text-sm text-dark hover:text-green focus:outline-none rounded-md transition-all hover-lift-noShadow"
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
              <div className="overflow-hidden transition-all duration-300 ease-in-out" 
                   style={{ maxHeight: passwordSectionOpen ? "500px" : "0" }}>
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
                  <div className="mb-4">
                    <div className="flex items-center mb-4">
                      <input
                        id="changePassword"
                        type="checkbox"
                        checked={changePassword}
                        onChange={() => setChangePassword(!changePassword)}
                        className="h-4 w-4 green focus:ring-green border-gray-300 rounded"
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
                      style={{ maxHeight: changePassword ? "500px" : "0" }}>
                      <PasswordInput
                        id="currentPassword"
                        label="Current Password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        error={errors.currentPassword}
                        required={changePassword}
                      />

                      <PasswordInput
                        id="newPassword"
                        label="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        error={errors.newPassword}
                        required={changePassword}
                      />

                      <PasswordInput
                        id="confirmPassword"
                        label="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        error={errors.confirmPassword}
                        required={changePassword}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Right aligned */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                className="mr-3"
                onClick={handleCancel}
                type="button"
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