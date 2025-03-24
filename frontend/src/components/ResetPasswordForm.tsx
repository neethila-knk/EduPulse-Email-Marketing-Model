import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ResetPasswordForm: React.FC = () => {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:5000/auth/reset-password/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to reset password");

      setMessage("Password has been reset successfully. You are redirecting to the login!");
      setTimeout(() => navigate("/login"), 3000);
    } catch (error: any) {
      setError(error.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url(/logpagebg.jpg)" }}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/100 to-transparent backdrop-blur-[3px]"></div>

      <div className="p-8 rounded-2xl shadow-lg w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-center mb-2">Reset Password</h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Enter your new password.
        </p>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {message && (
          <div
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 relative"
            role="alert"
          >
            <span className="block sm:inline">{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              New Password
            </label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 outline-gray-300 focus:outline-2 focus:outline-green-600"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full p-2 rounded-md font-semibold bg-green-600 text-white hover:bg-green-700 transition"
            disabled={isLoading}
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
