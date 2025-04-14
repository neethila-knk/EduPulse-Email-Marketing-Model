import React from 'react';

interface ProgressOverlayProps {
  progress: number; // progress in percentage
  details: string;  // realtime status message
}

const ProgressOverlay: React.FC<ProgressOverlayProps> = ({ progress, details }) => {
  return (
    <>
      <style>
        {`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .shimmer {
            background: linear-gradient(
              90deg,
              #157f1f,
              #1cae1c,
              #157f1f
            );
            background-size: 400% 100%;
            animation: shimmer 3s ease-in-out infinite;
          }
        `}
      </style>
      <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md">
        <div className="bg-white p-6 sm:p-10 rounded-xl shadow-2xl text-center w-full max-w-2xl mx-4">
          <div className="relative w-full bg-gray-200 rounded-full h-6 overflow-hidden mb-6">
            <div
              className="h-full transition-all duration-700 ease-out shimmer"
              style={{ width: `${progress}%` }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
              {progress.toFixed(0)}%
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            {progress < 100 ? "Processing..." : "Completed"}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-2">{details}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            This may take a moment. Please don’t close this tab.
          </p>
        </div>
      </div>
    </>
  );
};

export default ProgressOverlay;
