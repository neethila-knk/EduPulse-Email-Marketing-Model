import React from "react";

// Tips component for user profile page
const ProfileTips: React.FC<{ activeField?: string }> = ({ activeField }) => {
  const tipsByField: Record<string, { title: string; tips: string[] }> = {
    default: {
      title: "Profile Tips",
      tips: [
        "Keep your profile information up to date",
        "Use a professional username for academic communications",
        "Add a profile picture to make your account more personalized",
        "Change your password regularly for better security",
        "Review your profile before campaigns to ensure accuracy"
      ]
    },
    username: {
      title: "Username Tips",
      tips: [
        "Choose a professional username that represents you",
        "Avoid special characters that may cause confusion",
        "Consider using your real name or a variation for easier recognition",
        "Keep it simple and memorable",
        "Use a name that works well in formal communications"
      ]
    },
    profileImage: {
      title: "Profile Image Tips",
      tips: [
        "Use a professional headshot or appropriate avatar",
        "Ensure your face is clearly visible if using a photo",
        "Use a square image for best results (it will be cropped to a circle)",
        "Keep the file size under 5MB for optimal loading",
        "Choose an image with good lighting and clear background"
      ]
    },
    currentPassword: {
      title: "Password Security Tips",
      tips: [
        "Create a strong password with at least 8 characters",
        "Include a mix of letters, numbers, and special characters",
        "Don't reuse passwords from other sites",
        "Consider using a password manager",
        "Change your password periodically for better security",
        "Never share your password with others"
      ]
    },
    newPassword: {
      title: "Password Security Tips",
      tips: [
        "Create a strong password with at least 8 characters",
        "Include a mix of letters, numbers, and special characters",
        "Don't reuse passwords from other sites",
        "Consider using a password manager",
        "Choose a password you can remember but others can't guess",
        "Avoid common words, patterns, or personal information"
      ]
    },
    security: {
      title: "Account Security Tips",
      tips: [
        "Change your password regularly (every 3-6 months)",
        "Use a unique password that you don't use elsewhere",
        "Consider enabling two-factor authentication if available",
        "Be cautious when accessing your account on public computers",
        "Log out when you're done using the platform",
        "Keep your email account secure as it's used for recovery"
      ]
    },
    deleteAccount: {
      title: "Before Deleting Your Account",
      tips: [
        "Back up any important data or campaign information",
        "Consider contacting support if you're having issues with the platform",
        "Remember that account deletion is permanent and cannot be undone",
        "Ensure you've completed any active campaigns before deletion",
        "Consider temporarily deactivating instead if you may return later"
      ]
    }
  };

  const currentTips = tipsByField[activeField || 'default'] || tipsByField.default;

  return (
    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
      <h3 className="text-lg font-medium text-yellow-800 mb-3">{currentTips.title}</h3>
      <ul className="space-y-2">
        {currentTips.tips.map((tip, index) => (
          <li key={index} className="flex items-start">
            <span className="text-yellow-500 mr-2">•</span>
            <span className="text-sm text-gray-700">{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProfileTips;