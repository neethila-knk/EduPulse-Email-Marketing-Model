import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string | React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
  maxWidth?: string;
  children: React.ReactNode;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  delay = 300,
  maxWidth = '200px',
  children,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Check if on mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const showTooltip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsVisible(false);
  };

  // Handle clicks on mobile
  const handleClick = () => {
    if (isMobile) {
      setIsVisible(!isVisible);
    }
  };

  // Close tooltip when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobile &&
        isVisible &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile, isVisible]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  // Arrow position classes
  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent';
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent';
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent';
    }
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      ref={triggerRef}
      onMouseEnter={isMobile ? undefined : showTooltip}
      onMouseLeave={isMobile ? undefined : hideTooltip}
      onClick={handleClick}
    >
      {children}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 ${getPositionClasses()}`}
          style={{ maxWidth }}
        >
          <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg whitespace-normal">
            {content}
          </div>
          <div 
            className={`absolute w-0 h-0 border-4 border-gray-800 ${getArrowClasses()}`}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;