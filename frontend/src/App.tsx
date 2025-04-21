import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ForgotPasswordForm from "./components/Auth/ForgotPasswordForm";
import ResetPasswordForm from "./components/Auth/ResetPasswordForm";
import OAuthSuccess from "./components/Auth/OAuthSuccess";
import Dashboard from "./pages/Dashboard";
import NewCampaign from "./pages/NewCampaign";
import CampaignsPage from "./pages/Campaigns";
import UserProfile from "./pages/UserProfile";
import PageNotFound from "./pages/404";
import CampaignAnalytics from "./pages/CampaignAnalytics";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import AdminProtectedRoute from "./components/Auth/AdminProtectedRoute";
import AdminPanel from "./pages/admin/AdminPanel";
import AdminDashboard from "./pages/admin/EmailClustering";
import AdminLogin from "./pages/admin/AdminLogin";
import ClusterManagement from "./pages/admin/ClusterManagement";
import VisualizationsPage from "./pages/admin/VisualizationsPage";
import AdminModelPerformance from "./pages/admin/ModelPerformance";
import UserManagement from "./pages/admin/UserManagement";
import AdminManagement from "./pages/admin/AdminManagement";
import CampaignsList from "./pages/CampaignList";
import CampaignDetails from "./pages/CampaignAnalytics";
import EmailExtraction from "./pages/admin/EmailExtraction";
import NotificationsPage from "./pages/NotificationsPage";
import AdminCampaignsPage from "./pages/admin/AdminCampaigns";
import AdminCampaignDetailPage from "./pages/admin/AdminCampaignDetails";

const App = () => {
  return (
    <>
      <ToastContainer />
      <Router>
        <Routes>
          {/* User Auth Routes */}
          <Route path="/" element={<Navigate replace to="/login" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordForm />} />
          <Route
            path="/reset-password/:token"
            element={<ResetPasswordForm />}
          />
          <Route path="/oauth-success" element={<OAuthSuccess />} />

          <Route
            path="/campaigns/:id"
            element={
              <ProtectedRoute>
                <CampaignDetails />{" "}
              </ProtectedRoute>
            }
          />

          {/* User Protected Routes */}
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
                <CampaignsList />
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

          <Route
            path="/allnotifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminPanel />
              </AdminProtectedRoute>
            }
          />
          {/* Add the AdminDashboard route for email clustering */}
          <Route
            path="/admin/clustering"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/viewcampaigns"
            element={
              <AdminProtectedRoute>
                <AdminCampaignsPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/campaigns/:id"
            element={
              <AdminProtectedRoute>
                <AdminCampaignDetailPage />
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/managecluster"
            element={
              <AdminProtectedRoute>
                <ClusterManagement />
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/emailextractor"
            element={
              <AdminProtectedRoute>
                <EmailExtraction />
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/visualizations"
            element={
              <AdminProtectedRoute>
                <VisualizationsPage />
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/performance"
            element={
              <AdminProtectedRoute>
                <AdminModelPerformance />
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/manageusers"
            element={
              <AdminProtectedRoute>
                <UserManagement />
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/manageadmins"
            element={
              <AdminProtectedRoute>
                <AdminManagement />
              </AdminProtectedRoute>
            }
          />

          {/* Redirect /admin to /admin/dashboard */}
          <Route
            path="/admin"
            element={<Navigate replace to="/admin/dashboard" />}
          />

          {/* 404 Page */}
          <Route path="/404" element={<PageNotFound />} />
          <Route path="*" element={<Navigate replace to="/404" />} />
        </Routes>
      </Router>
    </>
  );
};

export default App;
