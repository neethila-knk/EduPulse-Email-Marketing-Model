import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/Layout/AuthLayout";
import TextInput from "../../components/UI/TextInput";
import PasswordInput from "../../components/UI/PasswordInput";
import Button from "../../components/UI/Button";
import Toast from "../../components/UI/Toast";
import { adminRegister } from "../../utils/adminAuthUtils";

const AdminSignup = () => {
  const [form, setForm] = useState({ 
    username: "", 
    email: "", 
    password: "", 
    confirmPassword: "" 
  });
  const [errors, setErrors] = useState<{ 
    username?: string; 
    email?: string; 
    password?: string; 
    confirmPassword?: string 
  }>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);
    setErrors({});

    // Client-side validation
    const newErrors: typeof errors = {};
    
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    // If there are validation errors, show them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setToast({ type: "error", message: "Please fix the errors in the form" });
      return;
    }

    setLoading(true);
    try {
      const result = await adminRegister({
        username: form.username,
        email: form.email,
        password: form.password,
      });

      if (result.success) {
        setToast({ type: "success", message: "Registration successful!" });
        
        // Redirect after a short delay to show the success message
        setTimeout(() => navigate("/admin/dashboard"), 1500);
      } else {
        setToast({ type: "error", message: result.message });
        
        // Set field-specific errors if they exist
        if (result.errors) {
          setErrors(result.errors);
        }
      }
    } catch (err) {
      setToast({ type: "error", message: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form
        onSubmit={handleSubmit}
        className="p-8 rounded-2xl shadow-lg w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm space-y-6"
      >
        <h1 className="text-3xl font-bold text-center">Admin Sign Up</h1>

        <TextInput
          id="adminUsername"
          name="username"
          label="Username"
          value={form.username}
          onChange={handleChange}
          required
          className="!flex-col"
          labelClassName="!mb-1"
          error={errors.username}
        />

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
        />

        <PasswordInput
          id="adminPassword"
          name="password"
          label="Password"
          value={form.password}
          onChange={handleChange}
          required
          error={errors.password}
        />

        <PasswordInput
          id="adminConfirmPassword"
          name="confirmPassword"
          label="Confirm Password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
          error={errors.confirmPassword}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </Button>

        <p className="text-sm text-center text-gray-600">
          Already have an account?{" "}
          <a href="/admin/login" className="text-green-600 hover:underline">
            Login as Admin
          </a>
        </p>
      </form>

      {toast && 
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      }
    </AuthLayout>
  );
};

export default AdminSignup;