import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordForm from "./components/Auth/ForgotPasswordForm";
import ResetPasswordForm from "./components/Auth/ResetPasswordForm";
import OAuthSuccess from "./components/Auth/OAuthSuccess";
import Dashboard from "./pages/Dashboard";
import NewCampaign from "./pages/NewCampaign";
import CampaignsPage from "./pages/Campaigns";
import { isAuthenticated } from "./utils/authUtils";
import UserProfile from "./pages/UserProfile";
import PageNotFound from "./pages/404";
import CampaignAnalytics from "./pages/CampaignAnalytics";

// Protected route wrapper component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) {
    // Redirect to login if not authenticated
    return (
      <Navigate
        to="/login"
        state={{ message: "Please log in to access this page" }}
      />
    );
  }
  return <>{children}</>;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Authentication Routes */}
        <Route path="/" element={<Navigate replace to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/reset-password/:token" element={<ResetPasswordForm />} />
        <Route path="/oauth-success" element={<OAuthSuccess />} />

        {/* Dashboard Routes - Protected */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/campaigns"
          element={
            <ProtectedRoute>
              <CampaignsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/new-campaign"
          element={
            <ProtectedRoute>
              <NewCampaign />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/campaignanalytics"
          element={
            <ProtectedRoute>
              <CampaignAnalytics />
            </ProtectedRoute>
          }
        />

        {/* 404 Page - Note this needs to be after all other routes */}
        <Route path="/404" element={<PageNotFound />} />

        {/* Catch all undefined routes - redirect to 404 */}
        <Route path="*" element={<Navigate replace to="/404" />} />
      </Routes>
    </Router>
  );
};

export default App;
