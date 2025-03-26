// src/components/dashboard/CampaignTable.tsx
import React from 'react';
import { Campaign } from '../../types';
import StatusBadge from '../UI/StatusBadge';

interface CampaignTableProps {
  campaigns: Campaign[];
  onViewAll?: () => void;
}

const CampaignTable: React.FC<CampaignTableProps> = ({
  campaigns,
  onViewAll,
}) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 pb-3">
        <h2 className="text-xl font-semibold text-gray-800">Active Campaigns</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Project name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Amount of emails
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {campaign.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {campaign.emailCount.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={campaign.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {onViewAll && (
        <div className="p-4 bg-white border-t border-gray-200 text-right">
          <button
            onClick={onViewAll}
            className="text-green-600 hover:text-green-800 text-sm font-medium"
          >
            View All Projects
          </button>
        </div>
      )}
    </div>
  );
};

export default CampaignTable;