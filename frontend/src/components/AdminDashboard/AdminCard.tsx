import React, { useState } from "react";
import { format, formatDistance } from "date-fns";
import Button from "../UI/Button";

type Admin = {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
  role: string;
};

type AdminCardProps = {
  admin: Admin;
  currentAdminId?: string;
  onDelete: () => void;
  onToggleStatus: () => void;
  onUpdatePassword: () => void;
};

const AdminCard: React.FC<AdminCardProps> = ({
  admin,
  currentAdminId,
  onDelete,
  onToggleStatus,
  onUpdatePassword,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const isSelf = admin._id === currentAdminId;
  const isSuperAdmin = admin.role === "super_admin";
  const disableBlockOrRemove = isSuperAdmin;

  const fallbackImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    admin.username
  )}&background=0D8ABC&color=fff`;

  return (
    <div
      className={`bg-white rounded-lg shadow overflow-hidden transition-all duration-300 ${
        isHovered ? "shadow-lg transform translate-y-[-4px]" : "shadow"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4 sm:p-5">
        {/* Top Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <img
            className="h-14 w-14 rounded-full object-cover border-2 border-gray-200"
            src={fallbackImage}
            alt={`${admin.username}'s profile`}
          />
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 flex-wrap">
              <p className="text-sm md:text-base font-medium text-gray-900 truncate flex items-center">
                {admin.username}
                {isSelf && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                    You
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    isSuperAdmin
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {isSuperAdmin ? "Super Admin" : "Admin"}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    admin.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {admin.isActive ? "Active" : "Blocked"}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500 truncate">{admin.email}</p>
            <div className="mt-1 flex items-center">
              <div
                className={`h-2 w-2 rounded-full ${
                  admin.lastLogin ? "bg-green-500" : "bg-gray-400"
                } mr-2`}
              />
              <p className="text-xs text-gray-500">
                {admin.lastLogin
                  ? `Last login: ${formatDistance(
                      new Date(admin.lastLogin),
                      new Date(),
                      { addSuffix: true }
                    )}`
                  : "Never logged in"}
              </p>
            </div>
          </div>
        </div>

        {/* Creation Date */}
        <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm sm:text-xs">
          <div className="flex justify-between flex-wrap gap-2">
            <span className="font-medium text-gray-500">Created:</span>
            <span title={admin.createdAt}>
              {formatDistance(new Date(admin.createdAt), new Date(), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-4 sm:mt-5 flex flex-wrap justify-end gap-2">
          <Button
            onClick={onUpdatePassword}
            variant="password"
            size="xsm"
            icon={
              <svg
                className="h-4 w-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            }
          >
            Password
          </Button>

          <Button
            onClick={onToggleStatus}
            variant={admin.isActive ? "block" : "primary"}
            size="xsm"
            disabled={disableBlockOrRemove}
            icon={
              admin.isActive ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              )
            }
          >
            {admin.isActive ? "Block" : "Activate"}
          </Button>

          <Button
            onClick={onDelete}
            variant="danger"
            size="xsm"
            disabled={disableBlockOrRemove}
            icon={
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            }
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminCard;
