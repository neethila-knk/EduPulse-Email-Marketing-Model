import React, { useState } from "react";
import { format, formatDistance } from "date-fns";
import Button from "../UI/Button"; // Make sure this path is correct

type User = {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
  lastLogin: string;
  profileImage: string;
  provider?: string;
  isActive: boolean;
};

type UserCardProps = {
  user: User;
  onDelete: () => void;
  onToggleBlock: () => void;
};

const UserCard: React.FC<UserCardProps> = ({ user, onDelete, onToggleBlock }) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy");
    } catch {
      return "N/A";
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistance(date, new Date(), { addSuffix: true });
    } catch {
      return "N/A";
    }
  };

  const fallbackImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user.username
  )}&background=0D8ABC&color=fff`;

  return (
    <div
      className={`bg-white rounded-lg shadow overflow-hidden transition-all duration-300 ${
        isHovered ? "shadow-lg transform translate-y-[-4px]" : "shadow"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-5">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <img
              className="text-dark h-14 w-14 rounded-full object-cover border-2 border-gray-200"
              src={user.profileImage || fallbackImage}
              alt={`${user.username}'s profile`}
              onError={(e) => {
                e.currentTarget.src = fallbackImage;
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 truncate">{user.username}</p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {user.isActive ? "Active" : "Blocked"}
              </span>
            </div>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
            <div className="mt-1 flex items-center">
              <div
                className={`h-2 w-2 rounded-full ${
                  user.lastLogin ? "bg-green-500" : "bg-gray-400"
                } mr-2`}
              ></div>
              <p className="text-xs text-gray-500">
                {user.lastLogin ? `Active ${getTimeAgo(user.lastLogin)}` : "Never logged in"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <div className="flex justify-between">
            <span className="text-xs font-medium text-gray-500">Joined:</span>
            <span className="text-xs text-dark" title={formatDate(user.createdAt)}>
              {getTimeAgo(user.createdAt)}
            </span>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs font-medium text-gray-500">Last Login:</span>
            <span className="text-xs text-dark" title={user.lastLogin ? formatDate(user.lastLogin) : "Never"}>
              {user.lastLogin ? getTimeAgo(user.lastLogin) : "Never"}
            </span>
          </div>
        </div>

        <div className="mt-5 flex justify-end space-x-2">
          <Button
            onClick={onToggleBlock}
            variant={user.isActive ? "block" : "primary"}
            size="xsm"
            icon={
              user.isActive ? (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )
            }
          >
            {user.isActive ? "Block" : "Unblock"}
          </Button>

          <Button
            onClick={onDelete}
            variant="danger"
            size="xsm"
            icon={
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
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

export default UserCard;
