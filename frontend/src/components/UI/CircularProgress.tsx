import React from 'react';

interface CircularProgressChartProps {
  percentage: number;
  title: string;
  subtitle?: string;
  color: string;
}

/**
 * A reusable circular progress chart component
 * 
 * @param percentage - The percentage value to display (0-100)
 * @param title - The title of the chart
 * @param subtitle - Optional subtitle to display beneath the title
 * @param color - The color of the progress arc (hex code)
 */
const CircularProgressChart: React.FC<CircularProgressChartProps> = ({ 
  percentage, 
  title, 
  subtitle, 
  color 
}) => {
  // Calculate the circumference of the circle
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      {/* SVG for the circular progress */}
      <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 flex items-center justify-center">
        {/* Background circle */}
        <svg className="w-full h-full" viewBox="0 0 180 180">
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={`${color}30`} // Lighter version of the color
            strokeWidth="20"
          />
          {/* Progress circle */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="20"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 90 90)"
          />
        </svg>
        {/* Percentage text in the center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl sm:text-2xl md:text-3xl font-bold">{percentage}%</span>
        </div>
      </div>
      {/* Title and subtitle below the chart */}
      <h3 className="text-gray-800 font-semibold mt-4 text-center text-sm sm:text-base">{title}</h3>
      {subtitle && (
        <p className="text-gray-600 text-xs sm:text-sm text-center mt-1">{subtitle}</p>
      )}
    </div>
  );
};

export default CircularProgressChart;