import logoWhite from "../assets/logowhite.png";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url(/logpagebg.jpg)" }}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/100 to-transparent backdrop-blur-[3px]"></div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 w-full max-w-full lg:max-w-screen-xl gap-8 p-6">
        {/* Left Side - Shared Branding */}
        <div className="text-white flex flex-col justify-center text-center md:text-left px-4 md:px-8 space-y-2">
          <img
            src={logoWhite}
            alt="Logo"
            className="w-72 mb-3 mx-auto md:mx-0"
          />
          <hr className="opacity-20 mb-3" />

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-wide">
              Smart <span className="text-yellow-500">Email Marketing</span> for
              Education in Sri Lanka
            </h1>
            <p className="text-sm max-w-md opacity-90 mx-auto md:mx-0 ">
              Connect with students, teachers, and institutions using
              data-driven email campaigns. Start reaching your audience
              effectively today!
            </p>
          </div>

          <div className="w-full flex justify-center md:justify-start mt-3">
            <button className="px-4 py-2 border-2 border-white text-white font-semibold text-lg rounded-full w-48 sm:w-56 md:w-64">
              Get Started →
            </button>
          </div>
        </div>

        {/* Right Side - Forms */}
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
