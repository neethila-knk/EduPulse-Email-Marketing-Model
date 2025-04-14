// src/components/Layout/Layout.tsx
import React from 'react';
import Sidebar from './SideBar';
import Navbar from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
  user?: {
    id: string;
    username: string;
    email: string;
    provider: string;
  } | null;
  navItems?: { name: string; path: string; icon: string }[]; // Add navItems property
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout, user }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar user={user} onLogout={onLogout} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;