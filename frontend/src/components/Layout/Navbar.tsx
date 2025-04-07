// src/components/Layout/Navbar.tsx
import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import SearchInput from "../UI/SearchInput"; // Adjust import path as needed
import Alert from "../UI/Alert";

interface NavbarProps {
  user?: {
    id: string;
    username: string;
    email: string;
    provider: string;
    profileImage?: string; // Add profileImage property
  } | null;
  onLogout?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  // Updated state management for animations
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  // Toggle dropdown on click (alternative to hover)
  const toggleDropdown = () => {
    if (isClosing || !dropdownVisible) {
      // Opening
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsClosing(false);
      setDropdownVisible(true);
    } else {
      // Closing
      handleClose();
    }
  };

  // Updated handlers for smooth animations with improved reliability
  const handleMouseEnter = () => {
    // Always clear any pending close timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isClosing) {
      // Cancel closing animation
      setIsClosing(false);
    } else if (!dropdownVisible) {
      // Only set visible if not already visible
      setDropdownVisible(true);
    }
  };

  const handleMouseLeave = () => {
    // Use a longer delay before starting the closing animation
    // This helps prevent accidental closures during normal mouse movement
    timeoutRef.current = setTimeout(() => {
      // Start closing animation
      setIsClosing(true);

      // After animation completes, hide the dropdown
      setTimeout(() => {
        setDropdownVisible(false);
        setIsClosing(false);
      }, 300); // Match this to animation duration
    }, 500); // Use a longer delay (500ms) for better hover stability
  };

  // Close button handler
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setDropdownVisible(false);
      setIsClosing(false);
    }, 300);
  };

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowLogoutAlert(true);
    // Close the dropdown
    handleClose();
  };

  const handleConfirmLogout = () => {
    setShowLogoutAlert(false);
    if (onLogout) onLogout();
  };

  const handleCancelLogout = () => {
    setShowLogoutAlert(false);
  };

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    }

    if (dropdownVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [dropdownVisible]);

  // Function to render user avatar (profile image or default icon)
  const renderUserAvatar = (size: "small" | "large") => {
    const hasProfileImage = user && user.profileImage;
    const sizeClasses = size === "small" ? "w-10 h-10" : "w-12 h-12";
    const iconSize = size === "small" ? "w-6 h-6" : "w-7 h-7";

    if (hasProfileImage) {
      return (
        <div className={`${sizeClasses} rounded-full overflow-hidden`}>
          <img
            src={user.profileImage}
            alt={`${user.username}'s profile`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to default icon if image fails to load
              (e.target as HTMLImageElement).style.display = "none";
              (e.currentTarget.parentNode as HTMLElement).classList.add(
                "bg-gray-200"
              );
              (e.currentTarget.parentNode as HTMLElement).innerHTML = `
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="${iconSize} text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              `;
            }}
          />
        </div>
      );
    }

    // Default icon if no profile image
    return (
      <div
        className={`${sizeClasses} rounded-full bg-gray-200 flex items-center justify-center`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`${iconSize} text-gray-600`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 w-full px-4 py-3 flex items-center justify-between">
      <div className="w-64">
        <SearchInput placeholder="Search" />
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <button className="relative p-1 text-gray-400 hover:text-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute top-0 right-0 w-4 h-4 text-xs text-white bg-red-500 rounded-full flex items-center justify-center">
              2
            </span>
          </button>
        </div>

        <div
          className="dropdown-trigger-area relative"
          ref={dropdownRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            className="flex items-center focus:outline-none"
            onClick={toggleDropdown}
          >
            {/* Using the renderUserAvatar function for the small avatar */}
            <div className="mr-2">{renderUserAvatar("small")}</div>
          </button>

          {dropdownVisible && (
            <div
              className={`absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50 ${
                isClosing ? "dropdown-animate-close" : "dropdown-animate-open"
              }`}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {user && (
                <div className="px-4 py-3 border-b border-gray-100 flex items-start relative">
                  {/* Close button */}
                  <button
                    onClick={handleClose}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>

                  {/* Using the renderUserAvatar function for the large avatar */}
                  <div className="mr-3 mt-2 flex-shrink-0">
                    {renderUserAvatar("large")}
                  </div>

                  <div className="flex-1 min-w-0 pt-4">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {user.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              )}

              <div className="py-1">
                <Link
                  to="/profile"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-3 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  User Profile
                </Link>
              </div>

              <div className="py-1 border-t border-gray-100">
                <Link
                  to="/new-campaign"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-3 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create New Campaign
                </Link>
              </div>

              {onLogout && (
                <div className="py-1 border-t border-gray-100">
                  <button
                    onClick={handleLogoutClick}
                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 text-left"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-3 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {showLogoutAlert && (
        <Alert
          title="Logout"
          message="Are you sure you want to logout?"
          confirmText="Logout"
          cancelText="Cancel"
          onConfirm={handleConfirmLogout}
          onCancel={handleCancelLogout}
          position="top-center"
        />
      )}
    </div>
  );
};

export default Navbar;
