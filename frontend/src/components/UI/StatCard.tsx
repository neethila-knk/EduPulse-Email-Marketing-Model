import React from 'react';
import { StatCardProps } from '../../types';

const StatCard: React.FC<StatCardProps> = ({
  title,
  count,
  description,
  icon,
  iconColor,
}) => {
  // Only apply iconColor class if it's provided
  const iconWrapperClass = iconColor || '';

  return (
    <div className="bg-white rounded-lg shadow p-6 transition-transform hover:scale-105">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-4xl font-bold text-gray-800">{count}</h2>
          <h3 className="text-lg font-semibold text-gray-700 mt-1">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <div className={iconWrapperClass}>{icon}</div>
      </div>
    </div>
  );
};

export default StatCard;