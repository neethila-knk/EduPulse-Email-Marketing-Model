import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "../UI/Logo";

interface SidebarProps {
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // Determine which menu item is active based on current path
  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const menuItems = [
    {
      label: "Dashboard",
      icon: (
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
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
      href: "/dashboard",
    },
    {
      label: "Campaigns",
      icon: (
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
      href: "/campaigns",
    },
    {
      label: "New Campaign",
      icon: (
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
            d="M12 4v16m8-8H4"
          />
        </svg>
      ),
      href: "/new-campaign",
    },
    {
      label: "User Profile",
      icon: (
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
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
      href: "/profile",
    },
    {
      label: "Logout",
      icon: (
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
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      ),
      href: "#",
    },
  ];

  // Handle logout click
  const handleLogoutClick = (e: React.MouseEvent, href: string) => {
    if (href === "#" && onLogout) {
      e.preventDefault();
      onLogout();
    }
  };

  return (
    <div
      className={`h-screen bg-dark text-white flex flex-col transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo area with more padding */}
      <div className="py-6 px-4 flex items-center justify-between border-b border-gray-700">
        <Logo collapsed={collapsed} />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-300 hover:text-white p-1"
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
              d={
                collapsed
                  ? "M13 5l7 7-7 7M5 5l7 7-7 7"
                  : "M11 19l-7-7 7-7m8 14l-7-7 7-7"
              }
            />
          </svg>
        </button>
      </div>

      {/* Menu items with increased spacing */}
      <div className="flex-1 overflow-y-auto pt-8 px-3">
        {menuItems.map((item, index) => (
          <div
            key={index}
            onClick={(e) => handleLogoutClick(e, item.href)}
            className="mb-6" // Increased spacing between items
          >
            <Link
              to={item.href}
              className={`flex items-center px-5 py-4 text-base transition-all duration-300 ease-in-out ${
                /* Smooth transition */
                isActive(item.href)
                  ? "text-white bg-gray-700"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              } rounded-lg ${collapsed ? "justify-center" : ""}`}
            >
              {item.icon && (
                <span className={`${collapsed ? "" : "mr-4"}`}>
                  {item.icon}
                </span>
              )}
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
