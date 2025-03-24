import SignupForm from "../components/SignupForm";
import AuthLayout from "../components/AuthLayout";

const SignupPage: React.FC = () => {
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
};

export default SignupPage;
