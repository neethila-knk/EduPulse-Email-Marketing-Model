import SignupForm from "../components/Auth/SignupForm";
import AuthLayout from "../components/Layout/AuthLayout";

const SignupPage: React.FC = () => {
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
};

export default SignupPage;
