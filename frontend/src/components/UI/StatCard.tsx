import React from 'react';
import { StatCardProps } from '../../types';

const StatCard: React.FC<StatCardProps> = ({
  title,
  count,
  label,
  value,
  description,
  icon,
  iconColor,
  loading = false,
  content, // Add content prop without changing existing functionality
}) => {
  const iconWrapperClass = iconColor || '';

  return (
    <div className="bg-white rounded-lg shadow p-6 transition-transform hover:scale-105">
      <div className="flex justify-between items-start">
        <div>
          {loading ? (
            <>
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-36 bg-gray-200 rounded animate-pulse mt-1"></div>
              {description && <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mt-1"></div>}
            </>
          ) : (
            <>
              <h2 className="text-4xl font-bold text-gray-800">{count || value}</h2>
              <h3 className="text-lg font-semibold text-gray-700 mt-1">{title || label}</h3>
              {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
              {/* Render content if provided */}
              {content && <div className="mt-2">{content}</div>}
            </>
          )}
        </div>
        {icon && <div className={iconWrapperClass}>{icon}</div>}
      </div>
    </div>
  );
};

export default StatCard;