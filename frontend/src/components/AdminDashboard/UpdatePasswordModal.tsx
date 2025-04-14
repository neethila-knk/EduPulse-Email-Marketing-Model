import React, { useEffect } from "react";
import PasswordInput from "../UI/PasswordInput";
import Button from "../UI/Button";

type UpdatePasswordModalProps = {
  adminUsername: string;
  isSelf: boolean;
  onClose: () => void;
  onSubmit: (currentPassword: string, newPassword: string) => void;
  isLoading: boolean;
  // Add this prop to distinguish super admin status
  currentAdminRole?: string;
};

const UpdatePasswordModal: React.FC<UpdatePasswordModalProps> = ({
  adminUsername,
  isSelf,
  onClose,
  onSubmit,
  isLoading,
  currentAdminRole,
  
}) => {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState("");
  
  // Determine if the current user is a super admin
  const isSuperAdmin = currentAdminRole === "super_admin";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Only require current password for own account and non-super admins
    // Super admins can reset others' passwords without knowing current password
    if (isSelf && !currentPassword) {
      setError("Current password is required");
      return;
    }

    if (!newPassword) {
      setError("New password is required");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    onSubmit(currentPassword, newPassword);
  };

  useEffect(() => {
    document.body.style.overflow = "hidden"; // prevent scrolling while open
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20 p-4">
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl p-6 z-50">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {isSelf
              ? "Update Your Password"
              : `Update Password for ${adminUsername}`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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

        {/* Error Message */}
        {error && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Only show current password field if updating own password or if not a super admin */}
          {(isSelf || !isSuperAdmin) && (
            <PasswordInput
              id="currentPassword"
              label="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              required={isSelf}
            />
          )}
          <PasswordInput
            id="newPassword"
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter a new password"
            required
          />
          <PasswordInput
            id="confirmPassword"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
          />

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="cancel" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </div>
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatePasswordModal;