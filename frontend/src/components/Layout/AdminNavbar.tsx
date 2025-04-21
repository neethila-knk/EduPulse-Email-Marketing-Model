import React from "react";
import { Link } from "react-router-dom";
import Button from "../UI/Button"; // Adjust the path as needed

interface AdminNavbarProps {
  user?: {
    id?: string;
    username?: string;
    email?: string;
    role?: string;
  } | null;
  onLogout?: () => void;
  title?: string;
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({
  user,
  onLogout,
  title = "Admin Dashboard",
}) => {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 w-full px-4 py-3 sticky top-0 z-10">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-3 py-1">
        {/* Left: Dashboard Title */}
        <div className="text-center md:text-left">
          <Link
            to="/admin/dashboard"
            className="text-dark font-bold text-xl hover:text-dark-500 transition-colors duration-200 flex items-center justify-center md:justify-start"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 mr-2 text-green"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            {title}
          </Link>
        </div>

        {/* Right: Welcome + Logout */}
        <div className="w-full md:w-auto flex flex-col md:flex-row items-center gap-2 md:gap-4 sm:flex-row sm:justify-between">
          {/* Row container for small screens */}
          <div className="w-full flex flex-row justify-between items-center sm:gap-4 pt-1">
            {/* Left side: User Info */}
            <div className="flex items-center">
              <div className="bg-green-100 rounded-full p-1 mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green"
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
              <span className="text-gray-700 text-sm font-medium">
                {user?.username || "Admin"}
                {user?.role && (
                  <span className="ml-1 text-xs text-gray-500">
                    ({user.role})
                  </span>
                )}
              </span>
            </div>

            {/* Right side: Logout - Icon only on small screens, Icon + text on larger screens */}
            <button
              onClick={onLogout}
              className="border border-red-600 text-red-600 hover:bg-red-50 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 flex items-center hover-lift-noShadow whitespace-nowrap flex-shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 flex-shrink-0"
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
              <span className="flex-shrink-0 ml-1 hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;