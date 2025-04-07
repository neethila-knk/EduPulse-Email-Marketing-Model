import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "../../utils/authUtils";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  if (!isAuthenticated()) {
    return (
      <Navigate
        to="/login"
        state={{ from: location, message: "Please log in to access this page" }}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;