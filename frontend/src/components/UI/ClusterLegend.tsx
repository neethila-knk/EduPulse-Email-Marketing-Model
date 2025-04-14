import React from "react";
import EmptyState from "./EmptyState"; // path depends on your structure

interface Cluster {
  name: string;
  count: number;
  id?: string;
}

interface ClusterLegendProps {
  clusters?: Cluster[];
}

const ClusterLegend: React.FC<ClusterLegendProps> = ({ clusters }) => {
  if (!clusters || clusters.length === 0) {
    return (
      <EmptyState
        title="No Cluster Data"
        description="No audience segments have been generated yet. Upload a file to get started."
      />
    );
  }

  const newClusters = clusters.filter(
    (cluster) => cluster.name.includes("New:") || cluster.name.includes("Added")
  );

  if (newClusters.length === 0) {
    return (
      <EmptyState
        title="No New Segments"
        description="There are no newly added audience segments at the moment."
      />
    );
  }

  return (
    <div className="bg-gray-50 border-l-4 border-green-500 rounded-md shadow-sm py-2 px-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <svg
            className="h-4 w-4 text-green-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <h3 className="text-sm font-semibold text-green">
            New Audience Segments
          </h3>
        </div>

        <span className="text-xs text-green bg-green-100 px-2 py-0.5 rounded-full">
          {newClusters.length} new
        </span>
      </div>

      <div className="mt-1">
        <div className="flex flex-wrap gap-2">
          {newClusters.map((cluster) => (
            <div
              key={cluster.id || cluster.name}
              className="flex items-center bg-white bg-opacity-60 rounded-md py-1 px-2 text-xs transition-all hover:bg-opacity-80"
            >
              <div className="h-2 w-2 rounded-full bg-green mr-1.5 flex-shrink-0"></div>
              <span className="font-medium text-gray-600">
                {cluster.name.replace("New: ", "").replace("Added ", "")}
              </span>
              <span className="ml-1 text-green">({cluster.count})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClusterLegend;
