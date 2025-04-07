import React, { useState } from "react";
import TextInput from "../UI/TextInput";
import Alert from "../UI/Alert";

interface DeleteAccountModalProps {
  onConfirm: (password?: string) => void;
  onCancel: () => void;
  isDeleting: boolean;
  provider: string;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  onConfirm,
  onCancel,
  isDeleting,
  provider,
}) => {
  const [password, setPassword] = useState("");

  const handleConfirm = () => {
    // For local accounts, pass the password; for OAuth, no password is needed
    onConfirm(provider === "local" ? password : undefined);
  };

  return (
    <Alert
      title="Delete Account"
      message={
        provider === "local"
          ? "Please enter your password to confirm account deletion. This action cannot be undone."
          : "Are you sure you want to delete your account? This action cannot be undone."
      }
      confirmText="Delete Account"
      cancelText="Cancel"
      onConfirm={handleConfirm}
      onCancel={onCancel}
      position="top-center"
    >
      {provider === "local" && (
        <TextInput
          id="deletePassword"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      )}
    </Alert>
  );
};

export default DeleteAccountModal;
