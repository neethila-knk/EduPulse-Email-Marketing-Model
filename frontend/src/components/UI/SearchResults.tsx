import React from 'react';
import { Link } from 'react-router-dom';

interface SearchResultsProps {
  results: any;
  isLoading: boolean;
  onClose: () => void;
  emptyStateMessage?: string;
  loadingMessage?: string;
  backgroundColor?: string;
  textColor?: string;
  hoverColor?: string;
  headingColor?: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({ 
  results, 
  isLoading, 
  onClose,
  emptyStateMessage = "No results found",
  loadingMessage = "Searching...",
  backgroundColor = "bg-white",
  textColor = "text-gray-700",
  hoverColor = "hover:bg-gray-100",
  headingColor = "text-gray-500",
}) => {
  // Check if we have any results
  const hasResults = results && Object.values(results).some(
    array => Array.isArray(array) && array.length > 0
  );

  if (isLoading) {
    return (
      <div className={`absolute top-full left-0 w-full md:w-96 ${backgroundColor} rounded-md shadow-lg py-1 z-50 mt-1`}>
        <div className="p-4 text-gray-500 flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500 mr-2"></div>
          {loadingMessage}
        </div>
      </div>
    );
  }

  if (!hasResults) {
    return (
      <div className={`absolute top-full left-0 w-full md:w-96 ${backgroundColor} rounded-md shadow-lg py-1 z-50 mt-1`}>
        <div className="p-4 text-gray-500 text-center">
          {emptyStateMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={`absolute top-full left-0 w-full md:w-96 ${backgroundColor} rounded-md shadow-lg py-1 z-50 mt-1`}>
      <div className="max-h-96 overflow-y-auto">
        {/* Campaign Results */}
        {results.campaigns && results.campaigns.length > 0 && (
          <div className="px-3 py-2">
            <h3 className={`text-xs font-semibold ${headingColor} uppercase tracking-wider px-2 py-1`}>
              Campaigns
            </h3>
            <div className="mt-1">
              {results.campaigns.map((campaign: any) => (
                <Link
                  key={campaign._id || campaign.id}
                  to={`/campaigns/${campaign._id || campaign.id}`}
                  className={`block px-4 py-2 text-sm ${textColor} ${hoverColor} rounded-md`}
                  onClick={onClose}
                >
                  <div className="font-medium">{campaign.campaignName || campaign.name}</div>
                  <div className="text-xs text-gray-500">
                    {campaign.status && <span className="capitalize">{campaign.status}</span>}
                    {campaign.createdAt && <span> • {new Date(campaign.createdAt).toLocaleDateString()}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Clusters/Lists Results */}
        {results.clusters && results.clusters.length > 0 && (
          <div className="px-3 py-2 border-t border-gray-100">
            <h3 className={`text-xs font-semibold ${headingColor} uppercase tracking-wider px-2 py-1`}>
              Contact Lists
            </h3>
            <div className="mt-1">
              {results.clusters.map((cluster: any) => (
                <Link
                  key={cluster._id || cluster.id}
                  to={`/clusters/${cluster._id || cluster.id}`}
                  className={`block px-4 py-2 text-sm ${textColor} ${hoverColor} rounded-md`}
                  onClick={onClose}
                >
                  <div className="font-medium">{cluster.name}</div>
                  <div className="text-xs text-gray-500">
                    {(cluster.emailCount || cluster.count) ? 
                      `${cluster.emailCount || cluster.count} contacts` : 
                      'Contact list'}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Additional result types can be added here */}
      </div>
    </div>
  );
};

export default SearchResults;