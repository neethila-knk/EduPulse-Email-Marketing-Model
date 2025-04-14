import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login, googleAuthUrl } from "../../utils/authUtils";

const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string; auth?: string }>({});
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isAccountBlocked, setIsAccountBlocked] = useState(false); // New state for tracking blocked accounts
  const navigate = useNavigate();
  const location = useLocation();

  // For debugging
  useEffect(() => {
    console.log("Current errors:", errors);
  }, [errors]);

  // Dynamically update the title when the component mounts
 // Dynamically update the title when the component mounts
useEffect(() => {
  document.title = "Login | EduPulse";

  // Check for messages passed via location state
  if (location.state && (location.state as any).message) {
    setGeneralError((location.state as any).message);
    
    // Use React Router's navigate function to clear the state
    navigate(location.pathname, { replace: true });
  }
  
  // Enhanced error handling for query params
  const params = new URLSearchParams(location.search);
  if (params.get('error')) {
    const errorType = params.get('error');
    const errorMessage = params.get('message');
    
    // Handle specific error types
    switch(errorType) {
      case 'email_exists':
        setGeneralError(errorMessage || 
          'This email is already registered with a different login method. Please use the correct login method.');
        break;
      case 'auth_failed':
        setGeneralError('Authentication failed. Please try again.');
        break;
      case 'expired':
        setGeneralError('Your session has expired. Please log in again.');
        break;
      case 'oauth_failed':
        setGeneralError('Google sign-in failed. Please try again or use email/password login.');
        break;
      case 'no_user':
        setGeneralError('No account found. Please sign up first.');
        break;
      case 'account_deactivated': // Special handling for deactivated accounts
        // Clear any existing tokens for security
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        setIsAccountBlocked(true);
        setGeneralError('Your account has been deactivated. Please contact support for assistance.');
        break;
      default:
        setGeneralError(errorMessage || 'An error occurred. Please try again.');
    }
    
    // Also clear the query parameters using navigate
    navigate(window.location.pathname, { replace: true });
  }
}, [location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    
    // Clear error for the field being changed
    if (errors[e.target.name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [e.target.name]: undefined
      });
    }

    // Reset blocked state when user tries again
    if (isAccountBlocked) {
      setIsAccountBlocked(false);
    }
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    let isValid = true;
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
        isValid = false;
      }
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Critical to prevent page refresh
    
    // Don't proceed if account is blocked
    if (isAccountBlocked) {
      return;
    }
    
    // Clear previous error states
    setGeneralError("");
    
    // Validate form fields
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      // Directly call API rather than using the utility function
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
        credentials: 'include'
      });

      // Handle response
      const data = await response.json();
      
      console.log("Login response:", response.status, data);

      if (response.ok) {
        // Store tokens and user data
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        setSuccessMessage("Login successful! Redirecting to dashboard...");
        
        // Navigate to dashboard after a delay
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        // Check for account deactivated (status code 403)
        if (response.status === 403 && data.error === "ACCOUNT_DEACTIVATED") {
          setIsAccountBlocked(true);
          setGeneralError("Your account has been deactivated. Please contact support for assistance.");
        } 
        // Handle other error responses
        else if (data.errors) {
          console.log("Setting field errors:", data.errors);
          setErrors(data.errors);
        } else if (data.message) {
          setGeneralError(data.message);
        } else {
          setGeneralError("Login failed. Please check your credentials.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setGeneralError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 rounded-2xl shadow-lg w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm">
      <h1 className="text-3xl font-bold text-center mb-2">
        Login to Your Account
      </h1>
      <p className="text-sm text-gray-600 text-center mb-6">
        Access your dashboard and manage your campaigns.
      </p>

      {/* Account Blocked Alert - Special styling */}
      {isAccountBlocked && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Account Deactivated</h3>
              <div className="mt-1 text-sm text-red-700">
                <p>Your account has been deactivated. Please contact support for assistance.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* General error alert (not for blocked accounts) */}
      {generalError && !isAccountBlocked && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative" role="alert">
          <span className="block sm:inline">{generalError}</span>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 relative" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email field with validation */}
        <div>
          <label className="block text-sm font-semibold mb-1.5">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={isAccountBlocked}
            className={`block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 border focus:outline-none focus:ring-0 focus:border-2 focus:border-green-600 ${
              errors.email ? 'border-2 border-red-500' : 'border-gray-300'
            } ${isAccountBlocked ? 'opacity-60 cursor-not-allowed' : ''}`}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        {/* Password field with validation */}
        <div>
          <label className="block text-sm font-semibold mb-1.5">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            disabled={isAccountBlocked}
            className={`block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 border focus:outline-none focus:ring-0 focus:border-2 focus:border-green-600 ${
              errors.password ? 'border-2 border-red-500' : 'border-gray-300'
            } ${isAccountBlocked ? 'opacity-60 cursor-not-allowed' : ''}`}
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <button
              type="button"
              className={`relative flex w-10 h-5 cursor-pointer items-center rounded-full transition duration-300 ${
                isChecked ? "bg-green-600" : "bg-gray-300"
              } ${isAccountBlocked ? 'opacity-60 cursor-not-allowed' : ''}`}
              onClick={() => !isAccountBlocked && setIsChecked(!isChecked)}
              disabled={isAccountBlocked}
            >
              <span className="sr-only">Remember me</span>
              <span
                className={`absolute left-1 h-4 w-4 transform rounded-full bg-white shadow-md transition ${
                  isChecked ? "translate-x-4.5" : "translate-x-0"
                }`}
              ></span>
            </button>

            <label className={`ml-3 text-sm text-gray-600 ${isAccountBlocked ? 'opacity-60' : ''}`}>
              Remember me
            </label>
          </div>

          <a href="/forgot-password" className={`text-sm text-green-600 ${isAccountBlocked ? 'opacity-60 pointer-events-none' : 'hover:underline'}`}>
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          className={`w-full p-2 rounded-md font-semibold ${
            isAccountBlocked 
              ? 'bg-red-600 text-white opacity-70 cursor-not-allowed' 
              : 'bg-green-600 text-white hover:bg-green-700'
          } transition disabled:opacity-70 disabled:cursor-not-allowed`}
          disabled={isLoading || isAccountBlocked}
        >
          {isLoading 
            ? "Logging in..." 
            : isAccountBlocked 
              ? "Login Disabled" 
              : "Login"
          }
        </button>

        {/* Message for blocked accounts */}
        {isAccountBlocked && (
          <div className="text-sm text-center text-red-600">
            Login disabled due to account deactivation.
          </div>
        )}

        {/* Google OAuth login button - disabled for blocked accounts */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <a
          href={isAccountBlocked ? '#' : googleAuthUrl}
          className={`flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 rounded-md ${
            isAccountBlocked 
              ? 'opacity-60 cursor-not-allowed' 
              : 'hover:bg-gray-50'
          } transition w-full`}
          onClick={e => isAccountBlocked && e.preventDefault()}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span>Sign in with Google</span>
        </a>

        <p className="text-sm text-gray-600 text-center">
          Don't have an account?{" "}
          <a href="/signup" className={`text-green-600 ${isAccountBlocked ? 'opacity-60 pointer-events-none' : 'hover:underline'}`}>
            Sign up
          </a>
        </p>
      </form>
    </div>
  );
};

export default LoginForm;