import React, { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subheading?: string; // Added subheading prop
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  greeting?: ReactNode;
  overlayImage?: string;
  size?: 'small' | 'medium' | 'large';
  showBackButton?: boolean;
  onBack?: () => void;
}

/**
 * A reusable page header component with green background
 * 
 * @param title - The title to display in the header
 * @param subheading - Optional subheading to display below the title
 * @param action - Optional action button/component to display on the right
 * @param children - Optional content to render inside the green area
 * @param className - Additional classes to apply to the container
 * @param greeting - Optional greeting to display above the title
 * @param overlayImage - Optional image URL to display as overlay at the top right
 * @param size - Size of the header: 'small', 'medium', or 'large'
 * @param showBackButton - Whether to show a back button
 * @param onBack - Function to call when back button is clicked
 */
const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subheading,
  action, 
  children,
  className = '',
  greeting,
  overlayImage,
  size = 'medium',
  showBackButton = false,
  onBack
}) => {
  return (
    <div className="bg-green w-full relative overflow-hidden">
      {/* Overlay image - moved more towards center */}
      {overlayImage && (
        <div className="absolute top-0 right-1/4 transform translate-x-1/3 pointer-events-none">
          <img 
            src={overlayImage} 
            alt="Background decoration" 
            className="h-full max-h-54 object-contain opacity-15"
          />
        </div>
      )}
      
      <div className={`container mx-auto px-6 relative z-10 ${
        size === 'small' ? 'py-3' : 
        size === 'large' ? 'pt-8 pb-28' : 
        'pt-4 pb-10'
      } ${className}`}>
        {greeting && (
          <div className="mb-2 text-white opacity-90">
            {greeting}
          </div>
        )}
        <div className={`flex justify-between items-center ${size === 'large' ? 'pt-4' : ''}`}>
          <div>
            <div className="flex items-center">
              {showBackButton && (
                <button 
                  onClick={onBack}
                  className="mr-3 text-white hover:text-gray-100 hover-lift-noShadow"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              )}
              <h1 className="text-xl font-bold text-white">{title}</h1>
            </div>
            {/* Display subheading if provided */}
            {subheading && (
              <p className="text-white text-sm opacity-80 mt-1 ml-8">
                {subheading}
              </p>
            )}
          </div>
          {action && (
            <div>
              {action}
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

export default PageHeader;