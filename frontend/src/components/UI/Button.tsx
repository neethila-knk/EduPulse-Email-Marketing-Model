import React, { useState, useEffect } from 'react';
import { ButtonProps } from '../../types';

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const [coords, setCoords] = useState({ x: -1, y: -1 });
  const [isRippling, setIsRippling] = useState(false);

  useEffect(() => {
    if (coords.x !== -1 && coords.y !== -1) {
      setIsRippling(true);
      setTimeout(() => setIsRippling(false), 600); // Match the animation duration
    } else {
      setIsRippling(false);
    }
  }, [coords]);

  useEffect(() => {
    if (!isRippling) setCoords({ x: -1, y: -1 });
  }, [isRippling]);

  // Base classes
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium focus:outline-none relative overflow-hidden hover-lift';
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-green hover:bg-light text-white hover:text-dark button-shadow',
    secondary: 'bg-white hover:bg-gray-50 text-green hover:text-dark border border-green button-shadow',
    pending: 'bg-white hover:bg-gray-50 text-yellow hover:text-dark border border-green button-shadow',
    cancel: 'bg-white hover:bg-gray-50 text-red-500 hover:text-red-600 border border-red-500 button-shadow',
    outline: 'border border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700',
    danger: 'bg-red hover:bg-light text-white hover:text-red button-shadow',
  };
  
  // Size classes
  const sizeClasses = {
    xsm: 'px-2 py-1 text-sm',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    // Call the original onClick if it exists
    if (props.onClick) {
      props.onClick(e);
    }
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={handleClick}
      {...props}
    >
      {isRippling && (
        <span 
          className={`absolute block rounded-full animate-ripple ${
            variant === 'primary' ? 'bg-white' : 'bg-green-600'
          } bg-opacity-30`}
          style={{
            width: '120px',
            height: '120px',
            top: coords.y - 60,
            left: coords.x - 60,
          }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

export default Button;