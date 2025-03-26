// src/components/ui/Logo.tsx
import React from "react";
import logo from "../../assets/logowhite.png"; // Update this with your actual logo filename
import iconLogo from "../../assets/edupulse_icon.png";

interface LogoProps {
  collapsed?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ collapsed = false, className = "" }) => {
  return (
    <div className={`${className}`}>
      {!collapsed ? (
        <img src={logo} alt="Edupulse" className="h-10 object-contain" />
      ) : (
        <img
          src={iconLogo}
          alt="Edupulse Icon"
          className="h-9 w-9 object-contain"
        />
      )}
    </div>
  );
};

export default Logo;
