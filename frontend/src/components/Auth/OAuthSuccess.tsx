import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const OAuthSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    
    if (accessToken && refreshToken) {
      // Store tokens in localStorage or another storage method
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      
      // Fetch user data or redirect to dashboard with success message
      navigate("/dashboard", { 
        state: { message: "You have successfully logged in with Google!" } 
      });
    } else {
      // Handle error case
      navigate("/login", { 
        state: { message: "Authentication failed. Please try again." } 
      });
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 rounded-2xl shadow-lg w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-center mb-4">
          Authentication Successful
        </h1>
        <p className="text-center text-gray-600">
          Redirecting you to your dashboard...
        </p>
        <div className="flex justify-center mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    </div>
  );
};

export default OAuthSuccess;