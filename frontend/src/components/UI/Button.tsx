import React, { useState, useEffect, ReactNode } from "react";
import { ButtonProps } from "../../types";

interface ExtendedButtonProps extends ButtonProps {
  icon?: ReactNode;
}

const Button: React.FC<ExtendedButtonProps> = ({
  children,
  icon,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false, // ✅ handle disabled here
  ...props
}) => {
  const [coords, setCoords] = useState({ x: -1, y: -1 });
  const [isRippling, setIsRippling] = useState(false);

  useEffect(() => {
    if (coords.x !== -1 && coords.y !== -1) {
      setIsRippling(true);
      setTimeout(() => setIsRippling(false), 600);
    } else {
      setIsRippling(false);
    }
  }, [coords]);

  useEffect(() => {
    if (!isRippling) setCoords({ x: -1, y: -1 });
  }, [isRippling]);

  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium focus:outline-none relative overflow-hidden hover-lift transition";
  const variantClasses = {
    primary: "bg-green hover:bg-light text-white hover:text-dark button-shadow",
    secondary:
      "bg-white hover:bg-gray-50 text-green hover:text-dark border border-green button-shadow",
    pending:
      "bg-white hover:bg-gray-50 text-yellow hover:text-dark border border-green button-shadow",
    cancel:
      "bg-white hover:bg-gray-50 text-red-500 hover:text-red-600 border border-red-500 button-shadow",
    outline:
      "border border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700",
    danger: "bg-red hover:bg-light text-white hover:text-red button-shadow",
    password:
      "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 button-shadow",
    block: "bg-orange-600 hover:bg-orange-700 text-white button-shadow",
  };
  const sizeClasses = {
    xsm: "px-2 py-1 text-sm",
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  const disabledClasses = "opacity-50 cursor-not-allowed pointer-events-none";

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return; // ✅ prevent ripple & onClick
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    if (props.onClick) {
      props.onClick(e);
    }
  };

  return (
    <button
      type="button"
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? disabledClasses : ""}
        ${className}
      `}
      onClick={handleClick}
      disabled={disabled} // ✅ apply native disabled
      {...props}
    >
      {isRippling && !disabled && (
        <span
          className={`absolute block rounded-full animate-ripple ${
            variant === "primary" ? "bg-white" : "bg-green-600"
          } bg-opacity-30`}
          style={{
            width: "120px",
            height: "120px",
            top: coords.y - 60,
            left: coords.x - 60,
          }}
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-2">
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span>{children}</span>
      </span>
    </button>
  );
};

export default Button;
