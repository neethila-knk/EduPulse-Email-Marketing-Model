import React from "react";

interface CircularProgressChartProps {
  percentage: number;
  title: string;
  subtitle?: string;
  color?: string;
}

const CircularProgressChart: React.FC<CircularProgressChartProps> = ({
  percentage,
  title,
  subtitle,
  color,
}) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  // Cap at 100% for full circle visualization
  const displayPercentage = percentage > 999 ? 999 : percentage;
  const strokeDashoffset =
    circumference - Math.min(displayPercentage, 100) / 100 * circumference;

  const getDynamicColor = () => {
    if (title.includes("Open")) {
      return percentage >= 25 ? "#16a34a" : percentage >= 15 ? "#facc15" : "#dc2626";
    } else if (title.includes("Click")) {
      return percentage >= 4 ? "#16a34a" : percentage >= 2 ? "#facc15" : "#dc2626";
    } else if (title.includes("Conversion")) {
      return percentage >= 5 ? "#16a34a" : percentage >= 1 ? "#facc15" : "#dc2626";
    }
    return color;
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] md:w-[180px] md:h-[180px]">
        <svg className="w-full h-full" viewBox="0 0 180 180">
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="20"
          />
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={getDynamicColor()}
            strokeWidth="20"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 90 90)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-bold text-[clamp(1rem,2vw,1.75rem)] leading-tight">
            {percentage > 999 ? "999+" : `${percentage}%`}
          </span>
        </div>
      </div>
      <h3 className="text-gray-800 font-semibold mt-4 text-center text-sm sm:text-base">
        {title}
      </h3>
      {subtitle && (
        <p className="text-gray-600 text-xs sm:text-sm text-center mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default CircularProgressChart;
