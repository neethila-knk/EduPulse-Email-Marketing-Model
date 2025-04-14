import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/Layout/AuthLayout";
import TextInput from "../../components/UI/TextInput";
import PasswordInput from "../../components/UI/PasswordInput";
import Button from "../../components/UI/Button";
import Toast from "../../components/UI/Toast";
import { adminLogin } from "../../utils/adminAuthUtils";

const AdminLogin = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string; auth?: string }>({});
  const [toast, setToast] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user came from a protected admin route
  const redirectMessage = location.state?.message;
  const fromPath = location.state?.from?.pathname;

  useEffect(() => {
    if (
      redirectMessage &&
      fromPath &&
      fromPath.startsWith("/admin") &&
      fromPath !== "/admin/login"
    ) {
      setToast({ type: "error", message: redirectMessage });

      // Clear the redirect state to prevent it from showing again on refresh
      navigate(location.pathname, { replace: true });
    }
    
    // Check for expired session parameter
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('expired') === 'true') {
      setToast({ 
        type: "error", 
        message: "Your session has expired. Please log in again." 
      });
      navigate('/admin/login', { replace: true });
    }
  }, [redirectMessage, fromPath, navigate, location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear error for this field when user types
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: undefined
      });
    }

    // Reset blocked state when user tries again
    if (isBlocked) {
      setIsBlocked(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);
    setErrors({});
    setIsBlocked(false);

    try {
      const result = await adminLogin(form.email, form.password);

      if (result.success) {
        setToast({ type: "success", message: "Login successful!" });
        
        // Redirect after a short delay to show the success message
        setTimeout(() => {
          // Redirect to the page they tried to visit or dashboard
          const redirectTo = location.state?.from?.pathname || "/admin/dashboard";
          navigate(redirectTo);
        }, 1500);
      } else {
        // Check for account deactivation messages
        if (result.message && result.message.toLowerCase().includes("deactivated")) {
          setIsBlocked(true);
        } else {
          setToast({ type: "error", message: result.message });
        }
        
        // Set field-specific errors if they exist
        if (result.errors) {
          setErrors(result.errors);
        }
      }
    } catch (err) {
      setToast({ type: "error", message: "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto">
        <form
          onSubmit={handleSubmit}
          className="p-8 rounded-2xl shadow-lg w-full bg-white/90 backdrop-blur-sm space-y-6"
        >
          <h1 className="text-3xl font-bold text-center">Admin Login</h1>
          
          {/* Account deactivated message - inside the form */}
          {isBlocked && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Account Deactivated</h3>
                  <div className="mt-1 text-sm text-red-700">
                    <p>Your admin account has been deactivated. Please contact another administrator for assistance.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <TextInput
            id="adminEmail"
            name="email"
            label="Email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className="!flex-col"
            labelClassName="!mb-1"
            error={errors.email}
            disabled={isBlocked}
          />

          <PasswordInput
            id="adminPassword"
            name="password"
            label="Password"
            value={form.password}
            onChange={handleChange}
            required
            error={errors.password}
            disabled={isBlocked}
          />

          {/* Show auth error if it exists and not showing blocked account alert */}
          {errors.auth && !isBlocked && (
            <div className="text-sm text-red-600">{errors.auth}</div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || isBlocked}
            variant={isBlocked ? "danger" : "primary"}
          >
            {loading ? "Logging in..." : isBlocked ? "Login Disabled" : "Login"}
          </Button>

          {isBlocked && (
            <div className="text-sm text-center text-red-600">
              Login disabled due to account deactivation.
            </div>
          )}

          
        </form>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AuthLayout>
  );
};

export default AdminLogin;