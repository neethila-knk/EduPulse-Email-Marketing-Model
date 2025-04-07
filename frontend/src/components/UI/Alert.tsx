import React from "react";
import Button from "../UI/Button";
import { AlertTriangle } from "lucide-react";

type Position =
  | "top-center"
  | "top-right"
  | "top-left"
  | "center"
  | "bottom-center"
  | "bottom-right"
  | "bottom-left";

interface AlertProps {
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  position?: Position;
  children?: React.ReactNode; // Add children prop
}

const Alert: React.FC<AlertProps> = ({
  title = "Confirm Action",
  message,
  onConfirm,
  onCancel,
  confirmText = "Yes",
  cancelText = "No",
  position = "top-center",
  children, // destructure children
}) => {
  // Get position classes based on position prop with responsive adjustments
  const getPositionClasses = (): string => {
    const baseClasses = "fixed z-50";
    switch (position) {
      case "top-center":
        return `${baseClasses} top-4 left-1/2 transform -translate-x-1/2 w-full px-4 sm:w-auto sm:max-w-md`;
      case "top-right":
        return `${baseClasses} top-4 right-4 w-full max-w-full sm:max-w-md px-4 sm:px-0`;
      case "top-left":
        return `${baseClasses} top-4 left-4 w-full max-w-full sm:max-w-md px-4 sm:px-0`;
      case "center":
        return `${baseClasses} top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full px-4 sm:w-auto sm:max-w-md`;
      case "bottom-center":
        return `${baseClasses} bottom-4 left-1/2 transform -translate-x-1/2 w-full px-4 sm:w-auto sm:max-w-md`;
      case "bottom-right":
        return `${baseClasses} bottom-4 right-4 w-full max-w-full sm:max-w-md px-4 sm:px-0`;
      case "bottom-left":
        return `${baseClasses} bottom-4 left-4 w-full max-w-full sm:max-w-md px-4 sm:px-0`;
      default:
        return `${baseClasses} top-4 left-1/2 transform -translate-x-1/2 w-full px-4 sm:w-auto sm:max-w-md`;
    }
  };

  return (
    <div className={getPositionClasses()}>
      <div className="font-inter w-full bg-white rounded-lg p-4 shadow-md border border-gray-200 animate-fadeIn">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <AlertTriangle className="text-amber-500 flex-shrink-0" size={18} />
          <h3 className="font-medium text-gray-900 text-sm sm:text-base">
            {title}
          </h3>
        </div>
        <p className="mb-4 text-sm sm:text-base text-gray-700">{message}</p>

        {/* Render children (such as the password input) */}
        {children}

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            size="xsm"
            onClick={onCancel}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1"
          >
            {cancelText}
          </Button>
          <Button
            variant="primary"
            size="xsm"
            onClick={onConfirm}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Alert;
