import React from "react";
import Button from "../UI/Button";
import { AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react";

type Position =
  | "top-center"
  | "top-right"
  | "top-left"
  | "center"
  | "bottom-center"
  | "bottom-right"
  | "bottom-left";

type AlertType = "warning" | "info" | "success" | "error";

interface AlertProps {
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void; // <- make it optional
  confirmText?: string;
  cancelText?: string;
  position?: Position;
  type?: AlertType; // <-- added type
  children?: React.ReactNode;
  showCancelButton?: boolean; // <-- add this
}


const Alert: React.FC<AlertProps> = ({
  title = "Confirm Action",
  message,
  onConfirm,
  onCancel,
  confirmText = "Yes",
  cancelText = "No",
  position = "top-center",
  type = "warning", // default to warning
  children,
  showCancelButton,
}) => {
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

  const getIcon = () => {
    switch (type) {
      case "warning":
        return (
          <AlertTriangle className="text-amber-500 flex-shrink-0" size={18} />
        );
      case "info":
        return <Info className="text-blue-500 flex-shrink-0" size={18} />;
      case "success":
        return (
          <CheckCircle2 className="text-green-600 flex-shrink-0" size={18} />
        );
      case "error":
        return <XCircle className="text-red-600 flex-shrink-0" size={18} />;
      default:
        return (
          <AlertTriangle className="text-amber-500 flex-shrink-0" size={18} />
        );
    }
  };

  return (
    <div className={getPositionClasses()}>
      <div className="font-inter w-full bg-white rounded-lg p-4 shadow-md border border-gray-200 animate-fadeIn">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          {getIcon()}
          <h3 className="font-medium text-gray-900 text-sm sm:text-base">
            {title}
          </h3>
        </div>
        <p className="mb-4 text-sm sm:text-base text-gray-700">{message}</p>

        {children}

        <div className="flex justify-end space-x-2">
          {showCancelButton !== false && ( // default true if not passed
            <Button
              variant="outline"
              size="xsm"
              className="text-xs sm:text-sm px-2 sm:px-3 py-1"
              onClick={onCancel ?? (() => {})} // fallback if undefined
            >
              {cancelText}
            </Button>
          )}
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
