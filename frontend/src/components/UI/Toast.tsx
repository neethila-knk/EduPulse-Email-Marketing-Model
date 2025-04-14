import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = "info",
  duration = 5000, // Updated default duration to 5000ms (5 seconds)
  onClose,
}) => {
  useEffect(() => {
    // Auto-dismiss the toast after the specified duration
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    // Clear timeout on unmount
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Determine background color based on type
  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-100 border-green-500 text-green-800";
      case "error":
        return "bg-red-100 border-red-500 text-red-800";
      case "info":
      default:
        return "bg-yellow-100 border-yellow-500 text-yellow-800"; // Changed from blue to yellow
    }
  };

  // Determine icon based on type
  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <svg
            className="w-5 h-5 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        );
      case "error":
        return (
          <svg
            className="w-5 h-5 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        );
      case "info":
      default:
        return (
          <svg
            className="w-5 h-5 text-yellow-600" // Changed from blue to yellow
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        );
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 toast-animation">
      <div
        className={`flex items-center p-4 mb-4 text-sm rounded-lg border-l-4 shadow-md ${getBgColor()}`}
        role="alert"
      >
        <div className="mr-2">{getIcon()}</div>
        <div className="font-medium">{message}</div>
        <button
          type="button"
          className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 focus:outline-none"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
