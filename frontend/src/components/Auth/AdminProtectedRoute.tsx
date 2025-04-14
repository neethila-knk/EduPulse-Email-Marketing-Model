import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAdminAuthenticated } from "../../utils/adminAuthUtils";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check if admin is authenticated
    const checkAuth = async () => {
      const authenticated = isAdminAuthenticated();
      setIsAuthenticated(authenticated);
      setChecking(false);
    };

    checkAuth();
  }, []);

  if (checking) {
    // You can replace this with your loading spinner component
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to admin login with location state
    return (
      <Navigate
        to="/admin/login"
        state={{ 
          from: location, 
          message: "Please log in to access the admin dashboard" 
        }}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;