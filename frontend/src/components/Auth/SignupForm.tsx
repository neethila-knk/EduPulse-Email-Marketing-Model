import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { register, googleAuthUrl } from "../../utils/authUtils";

const SignupForm: React.FC = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [isChecked, setIsChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Dynamically update the title when the component mounts
  useEffect(() => {
    document.title = "Sign Up | EduPulse";
    
    // Check for messages passed via location state
    if (location.state && (location.state as any).message) {
      setError((location.state as any).message);
      
      // Clear the location state after showing the message
      window.history.replaceState({}, document.title);
    }
    
    // Enhanced error handling for query params
    const params = new URLSearchParams(location.search);
    if (params.get('error')) {
      const errorType = params.get('error');
      const errorMessage = params.get('message');
      
      // Handle specific error types
      switch(errorType) {
        case 'email_exists':
          setError(errorMessage || 
            'This email is already registered with a different login method. Please use the correct login method.');
          break;
        case 'auth_failed':
          setError('Authentication failed. Please try again.');
          break;
        case 'oauth_failed':
          setError('Google sign-up failed. Please try again or use email registration.');
          break;
        case 'username_taken':
          setError('Username is already taken. Please choose another one.');
          break;
        default:
          setError(errorMessage || 'An error occurred. Please try again.');
      }
      
      // Remove query parameters after displaying the error
      // This prevents the error from showing again on page refresh
      if (window.history.replaceState) {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [location]);

  // Helper function for basic email validation
  const isValidEmail = (email: string) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  };

  // Helper function for password validation (minimum 8 characters, 1 number, 1 special char)
  const isValidPassword = (password: string) => {
    const regex = /^(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return regex.test(password);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    // Frontend validation
    if (
      !formData.username ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("All fields are required");
      setIsLoading(false);
      return;
    }

    if (!isValidEmail(formData.email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    if (!isValidPassword(formData.password)) {
      setError(
        "Password must be at least 8 characters long and include a number and a special character."
      );
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const result = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      if (result.success) {
        setSuccessMessage("Registration successful! Redirecting to dashboard...");
        setTimeout(() => {
          navigate("/dashboard", { 
            state: { message: "Your account has been created successfully!" } 
          });
        }, 1500);
      } else {
        setError(result.message || "Registration failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 rounded-2xl shadow-lg w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm">
      <h1 className="text-3xl font-bold text-center mb-2">
        Create your account
      </h1>
      <p className="text-sm text-gray-600 text-center mb-6">
        Craft successful campaigns in minutes.
      </p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 relative" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {["username", "email", "password", "confirmPassword"].map((field) => (
          <div key={field}>
            <label className="block text-sm/6 font-semibold mb-1.5">
              {field === "confirmPassword" ? "Confirm Password" : field.charAt(0).toUpperCase() + field.slice(1)}
            </label>
            <input
              type={field === "password" || field === "confirmPassword" ? "password" : "text"}
              name={field}
              value={formData[field as keyof typeof formData]}
              onChange={handleChange}
              className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 outline-gray-300 focus:outline-2 focus:outline-green-600"
              required
            />
          </div>
        ))}

        <div className="flex gap-x-4">
          <button
            type="button"
            className={`relative flex w-10 h-5 cursor-pointer items-center rounded-full transition duration-300 ${
              isChecked ? "bg-green-600" : "bg-gray-300"
            }`}
            onClick={() => setIsChecked(!isChecked)}
          >
            <span className="sr-only">Agree to policies</span>
            <span
              className={`absolute left-1 h-4 w-4 transform rounded-full bg-white shadow-md transition ${
                isChecked ? "translate-x-4.5" : "translate-x-0"
              }`}
            ></span>
          </button>

          <label className="text-sm text-gray-600">
            By selecting this, you agree to our{" "}
            <a href="#" className="font-semibold text-green-600">
              privacy policy
            </a>
            .
          </label>
        </div>

        <button
          type="submit"
          className={`w-full p-2 rounded-md font-semibold transition ${
            isChecked
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-400 text-gray-200 cursor-not-allowed"
          }`}
          disabled={!isChecked || isLoading}
        >
          {isLoading ? "Creating Account..." : "Sign Up"}
        </button>

        {/* Google OAuth signup button */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or sign up with</span>
          </div>
        </div>

        <a
          href={googleAuthUrl}
          className="flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition w-full"
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
          <span>Sign up with Google</span>
        </a>

        <p className="text-sm text-gray-600 text-center">
          Already a member?{" "}
          <a href="/login" className="text-green-600">
            Login
          </a>
        </p>
      </form>
    </div>
  );
};

export default SignupForm;