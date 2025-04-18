// src/components/dashboard/StatusBadge.tsx
import React from 'react';
import { StatusBadgeProps } from '../../types';

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ongoing: 'bg-orange-100 text-orange-800 border-orange-200',
    completed: 'bg-green-600 text-white border-green-500',
    canceled: 'bg-gray-100 text-gray-800 border-gray-200',
    sent: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };

  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-md border ${statusStyles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default StatusBadge;