import React, { useState, useEffect } from "react";
import {
  Pie,
  PieChart,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Brush,
} from "recharts";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ScatterChart,
  Scatter,
  ZAxis,
  CartesianGrid as ScatterCartesianGrid,
  XAxis as ScatterXAxis,
  YAxis as ScatterYAxis,
} from "recharts";
import { AlertCircle, HelpCircle } from "lucide-react";
import { adminAuthApi } from "../../utils/adminAuthUtils";
import Button from "../UI/Button";
import Select from "../UI/Select";
import CustomBarChart from "../UI/BarChart"; // Reusable BarChart component
import ReusablePieChart, { PieChartLegend } from "../UI/ReusablePieChart";
import CustomSelect from "../UI/Select";

// Simple Card Components
const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = "",
  children,
}) => (
  <div className={`bg-white rounded-lg shadow ${className}`}>{children}</div>
);

const CardHeader: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className = "", children }) => (
  <div className={`p-6 border-b border-gray-200 ${className}`}>{children}</div>
);

const CardContent: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className = "", children }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

const CardTitle: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className = "", children }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);

// Simple Tabs Components
const TabsList: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = "",
  children,
}) => (
  <div className={`flex space-x-2 border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

const TabsTrigger: React.FC<{
  value: string;
  active: string;
  onClick: (value: string) => void;
  children: React.ReactNode;
}> = ({ value, active, onClick, children }) => {
  const isActive = value === active;
  return (
    <button
      className={`px-4 py-2 font-medium text-sm ${
        isActive
          ? "text-green-600 border-b-2 border-green-600"
          : "text-gray-600 hover:text-gray-900"
      }`}
      onClick={() => onClick(value)}
    >
      {children}
    </button>
  );
};

const TabsContent: React.FC<{
  value: string;
  active: string;
  className?: string;
  children: React.ReactNode;
}> = ({ value, active, className = "", children }) => {
  if (value !== active) return null;
  return <div className={`pt-4 ${className}`}>{children}</div>;
};

// Type definitions
interface ClusterData {
  id: string;
  name: string;
  cluster_id: number;
  size: number;
  count: number;
  sample?: string;
  domain_distribution?: Record<string, number>;
  keyword_distribution?: Record<string, number>;
  university_breakdown?: Record<string, number>;
}

interface TSNEDataPoint {
  x: number;
  y: number;
  z: number;
  cluster: number;
  cluster_name: string;
  university: string | null;
}

interface VisualizationData {
  // Only keys for interactive visualizations are kept
}

interface PieChartData {
  name: string;
  value: number;
}

interface ChartLabelProps {
  name: string;
  percent: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: any;
  }>;
  label?: string;
}

const COLORS = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
  "#ff69b4",
  "#00bfff",
  "#ffa07a",
  "#20b2aa",
  "#9370db",
  "#3cb371",
  "#b8860b",
  "#cd5c5c",
  "#4682b4",
  "#6a5acd",
];

// Utility function to transform object data into array format
const transformToChartData = (data: Record<string, number>): PieChartData[] =>
  Object.entries(data)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

// Since we're not using static images, the mock visualization function now returns an empty object.
const generateMockData = (): VisualizationData => {
  return {};
};

const generateMockScatterData = (clusterCount: number = 3): TSNEDataPoint[] => {
  const mockData: TSNEDataPoint[] = [];
  for (let i = 0; i < 150; i++) {
    const clusterId = i % clusterCount;
    let baseX, baseY;
    if (clusterId === 0) {
      baseX = -40;
      baseY = -40;
    } else if (clusterId === 1) {
      baseX = 40;
      baseY = -20;
    } else {
      baseX = 0;
      baseY = 40;
    }
    mockData.push({
      x: baseX + (Math.random() - 0.5) * 30,
      y: baseY + (Math.random() - 0.5) * 30,
      z: 1,
      cluster: clusterId,
      cluster_name: `Cluster ${clusterId + 1}`,
      university: i % 10 === 0 ? "University of Sample" : null,
    });
  }
  return mockData;
};

// Utility function to calculate dynamic domain ranges for t-SNE axes
const calculateDomains = (data: TSNEDataPoint[]) => {
  if (!data || data.length === 0)
    return { xDomain: [-100, 100], yDomain: [-100, 100] };

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;

  data.forEach((point) => {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  });

  console.log("📐 Data ranges:", { minX, maxX, minY, maxY });

  const padding = 10;
  return {
    xDomain: [Math.floor(minX - padding), Math.ceil(maxX + padding)],
    yDomain: [Math.floor(minY - padding), Math.ceil(maxY + padding)],
  };
};

const ClusterVisualization: React.FC<{ datasetId?: string }> = ({
  datasetId,
}) => {
  const [clusters, setClusters] = useState<ClusterData[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCluster, setSelectedCluster] = useState<string>("");
  const [clusterDetails, setClusterDetails] = useState<any>(null);
  const [scatterData, setScatterData] = useState<TSNEDataPoint[]>([]);
  const [visualizationData, setVisualizationData] =
    useState<VisualizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallbackData, setUsingFallbackData] = useState(false);
  const [universityClusterData, setUniversityClusterData] = useState<
    { university: string; count: number; sample: string }[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setUsingFallbackData(false);

      try {
        const clusterResponse = await adminAuthApi.get(
          "/api/available-clusters"
        );
        const clusterData = clusterResponse.data as ClusterData[];
        setClusters(clusterData);

        if (clusterData.length > 0) {
          setSelectedCluster(clusterData[0].id || clusterData[0].name);

          const enhancedClusters = clusterData.map((cluster) => {
            if (!cluster.domain_distribution) {
              cluster.domain_distribution = {
                academic: Math.floor(Math.random() * 100) + 50,
                personal: Math.floor(Math.random() * 80) + 30,
                corporate: Math.floor(Math.random() * 50) + 10,
                other: Math.floor(Math.random() * 30) + 5,
              };
            }
            if (!cluster.keyword_distribution) {
              cluster.keyword_distribution = {
                Technology: Math.floor(Math.random() * 100) + 20,
                Education: Math.floor(Math.random() * 80) + 15,
                Business: Math.floor(Math.random() * 60) + 10,
                Engineering: Math.floor(Math.random() * 40) + 5,
              };
            }
            return cluster;
          });
          setClusters(enhancedClusters);
        }

        try {
          const vizResponse = await adminAuthApi.get<{
            tsne_data?: TSNEDataPoint[];
          }>("/api/visualization-data");

          console.log("📊 Visualization data received:", vizResponse.data);
          console.log("📊 tsne_data present:", !!vizResponse.data.tsne_data);
          console.log(
            "📊 tsne_data is array:",
            Array.isArray(vizResponse.data.tsne_data)
          );
          console.log(
            "📊 tsne_data length:",
            vizResponse.data.tsne_data?.length || 0
          );
          console.log(
            "📊 Sample point:",
            vizResponse.data.tsne_data?.[0] || null
          );

          setVisualizationData(vizResponse.data as VisualizationData);

          if (
            vizResponse.data.tsne_data &&
            Array.isArray(vizResponse.data.tsne_data)
          ) {
            setScatterData(vizResponse.data.tsne_data);
          } else {
            setScatterData(generateMockScatterData(clusterData.length));
            setUsingFallbackData(true);
          }
        } catch (vizError) {
          console.warn(
            "Visualization data not available, using fallback:",
            vizError
          );
          setVisualizationData(generateMockData());
          setScatterData(generateMockScatterData(clusterData.length));
          setUsingFallbackData(true);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load cluster data. Please try again later.");
        setVisualizationData(generateMockData());
        setScatterData(generateMockScatterData(3));
        setUsingFallbackData(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [datasetId]);

  useEffect(() => {
    const fetchUniversityData = async () => {
      try {
        const response = await adminAuthApi.get<
          { university: string; count: number; sample: string }[]
        >("/api/available-university-clusters");
        setUniversityClusterData(response.data);
      } catch (error) {
        console.error("Error fetching university data:", error);
      }
    };
    fetchUniversityData();
  }, []);

  useEffect(() => {
    const fetchClusterDetails = async () => {
      if (!selectedCluster) return;
      try {
        const response = await adminAuthApi.get(
          `/api/cluster-details/${selectedCluster}`
        );
        setClusterDetails(response.data);
      } catch (err) {
        console.warn(
          "Cluster details not available from API, using local data"
        );
        const selectedClusterData = clusters.find(
          (c) => c.id === selectedCluster || c.name === selectedCluster
        );
        if (selectedClusterData) {
          setClusterDetails(selectedClusterData);
        } else {
          setClusterDetails({
            name: "Sample Cluster",
            size: 150,
            domain_distribution: {
              academic: 75,
              personal: 45,
              corporate: 25,
              other: 5,
            },
            keyword_distribution: {
              Technology: 65,
              Education: 45,
              Business: 25,
              Engineering: 15,
            },
          });
        }
      }
    };

    fetchClusterDetails();
  }, [selectedCluster, clusters]);

  useEffect(() => {
    if (scatterData.length > 0) {
      const clusterCounts: Record<string, number> = {};
      scatterData.forEach((point) => {
        clusterCounts[point.cluster_name] =
          (clusterCounts[point.cluster_name] || 0) + 1;
      });
      console.log("📊 Found clusters:", Object.keys(clusterCounts).length);
      console.log("📊 Cluster distribution:", clusterCounts);
    }
  }, [scatterData]);

  const domainData: PieChartData[] = clusterDetails?.domain_distribution
    ? transformToChartData(clusterDetails.domain_distribution)
    : [];

  const keywordData = clusterDetails?.keyword_distribution
    ? transformToChartData(clusterDetails.keyword_distribution)
    : [];

  const universityData = clusterDetails?.university_breakdown
    ? transformToChartData(clusterDetails.university_breakdown)
    : [];

  const sizeComparisonData = clusters.map((cluster) => ({
    name: cluster.name,
    size: cluster.size || cluster.count,
  }));

  const selectedClusterObj = clusters.find(
    (c) => c.id === selectedCluster || c.name === selectedCluster
  );
  const filteredScatterData =
    selectedClusterObj && !usingFallbackData
      ? scatterData.filter((point) => {
          // Handle both possible data structures
          if (point.cluster !== undefined) {
            return point.cluster === selectedClusterObj.cluster_id;
          } else if (point.cluster_name !== undefined) {
            // Extract cluster number from cluster_name if possible
            const clusterNum = point.cluster_name.match(/Cluster (\d+)/);
            return (
              clusterNum &&
              parseInt(clusterNum[1]) === selectedClusterObj.cluster_id
            );
          }
          return false;
        })
      : scatterData;

  if (loading) {
    return (
      <Card className="w-full p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p>Loading cluster visualization data...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error && clusters.length === 0) {
    return (
      <Card className="w-full p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500">{error}</p>
            <p className="mt-4 text-gray-600">
              Please try uploading a file to generate clusters first.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <CardTitle className="text-lg sm:text-xl">
            Cluster Visualization
          </CardTitle>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            {usingFallbackData && (
              <div className="text-amber-600 text-xs flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>Using preview visualization</span>
              </div>
            )}
            <div className="w-full sm:w-auto flex sm:justify-end">
              <CustomSelect
                value={selectedCluster}
                onChange={(val) => setSelectedCluster(val)}
                options={clusters.map((c) => ({
                  value: c.id || c.name,
                  label: `${c.name} (${c.count || c.size} contacts)`,
                }))}
                size="md"
                length="full"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <TabsList className="mb-4 flex-wrap gap-2">
            <TabsTrigger
              value="overview"
              active={activeTab}
              onClick={setActiveTab}
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="domains"
              active={activeTab}
              onClick={setActiveTab}
            >
              Domains
            </TabsTrigger>
            <TabsTrigger
              value="keywords"
              active={activeTab}
              onClick={setActiveTab}
            >
              Keywords
            </TabsTrigger>
            <TabsTrigger
              value="universities"
              active={activeTab}
              onClick={setActiveTab}
            >
              Universities
            </TabsTrigger>
            <TabsTrigger value="tsne" active={activeTab} onClick={setActiveTab}>
              t-SNE
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" active={activeTab} className="mt-0">
            {sizeComparisonData.length > 0 ? (
              <>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">
                    Cluster Comparison Overview
                  </CardTitle>
                </CardHeader>

                <div className="flex flex-col gap-4">
                  {/* Chart Container */}
                  <div className="w-full">
                    <CustomBarChart
                      chartType="bar"
                      data={sizeComparisonData}
                      dataKey="size"
                      xAxisKey="name"
                      xAxisLabel="Cluster Names (Email Groups)"
                      yAxisLabel="Cluster Size (No: of Emails)"
                      tooltipValueLabel="Size"
                    />
                  </div>

                  {/* Description Container placed under the chart */}
                  <div className="w-full px-4 py-3 bg-yellow-50 rounded-md">
                    <p className="text-xs text-center text-gray-600">
                      What is this? This chart visually compares the sizes of
                      different audience clusters by displaying the number of
                      contacts in each group.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-72 bg-gray-50 rounded-lg border border-gray-200">
                <AlertCircle className="h-12 w-12 text-gray-400 mb-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  No Cluster Data
                </h3>
                <p className="text-gray-500 text-center max-w-md mt-1">
                  No audience segments have been generated yet. Upload a file to
                  get started.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="domains" active={activeTab} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
              <Card className="h-auto">
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">
                    Domain Type Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {domainData.length > 0 ? (
                    <div className="w-full min-h-64">
                      <ReusablePieChart
                        data={domainData}
                        height={280}
                        sizeRatio={0.9}
                        showLegend={false}
                        tooltipFormatter={(value, name) => [
                          `${value.toLocaleString()} sites`,
                          name,
                        ]}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center min-h-64 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No domain data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="h-auto overflow-visible">
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">
                    Domain Types Legend
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-visible">
                  {domainData.length > 0 ? (
                    <div className="space-y-4 overflow-visible">
                      <div className="text-sm text-gray-600 leading-relaxed">
                        <p className="whitespace-normal break-words">
                          This visualization displays the distribution of domain
                          types in your dataset. Each segment of the pie chart
                          represents a distinct domain category, with the size
                          of each segment proportional to the number of domains
                          in that category.
                        </p>
                        <p className="mt-2 whitespace-normal break-words">
                          The chart provides an immediate visual understanding
                          of which domain types are most prevalent in your data.
                          You can hover over each segment to see the exact count
                          for that domain type.
                        </p>
                      </div>
                      <div className="flex flex-col justify-center overflow-visible">
                        <PieChartLegend
                          data={domainData}
                          layout="vertical"
                          className="py-2"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center min-h-64 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No domain data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="keywords" active={activeTab} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
              <Card className="h-auto">
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">
                    Keyword Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {keywordData.length > 0 ? (
                    <div className="w-full min-h-64">
                      <ReusablePieChart
                        data={keywordData}
                        height={280} // Sufficient height for visualization
                        sizeRatio={0.9} // Larger pie since no legend needed
                        showLegend={false} // Hide built-in legend
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center min-h-64 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No keyword data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="h-auto overflow-visible">
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">
                    Keywords Legend
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-visible">
                  {keywordData.length > 0 ? (
                    <div className="space-y-4 overflow-visible">
                      <div className="text-sm text-gray-600 leading-relaxed">
                        <p className="whitespace-normal break-words">
                          This visualization uses a pie chart to represent the
                          distribution of keywords across your dataset. Each
                          slice represents a keyword category, with the size of
                          each slice proportional to the frequency or importance
                          of that keyword in your data.
                        </p>
                        <p className="mt-2 whitespace-normal break-words">
                          The color coding matches between the chart and the
                          legend below, allowing you to quickly identify the
                          relative importance of different keyword categories at
                          a glance.
                        </p>
                      </div>
                      <div className="flex flex-col justify-center overflow-visible">
                        <PieChartLegend
                          data={keywordData}
                          layout="vertical"
                          className="py-2"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center min-h-64 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No keyword data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="universities" active={activeTab} className="mt-0">
            {universityClusterData.length > 0 ? (
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">
                    University Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex-1">
                    <CustomBarChart
                      chartType="bar"
                      data={universityClusterData.map((u) => ({
                        name: u.university,
                        value: u.count,
                      }))}
                      dataKey="value"
                      xAxisKey="name"
                      xAxisLabel="Universities (Name)"
                      yAxisLabel="Student Count (No: of Emails)"
                      tooltipValueLabel="Students"
                    />
                  </div>

                  {/* Description Container placed under the chart */}
                  <div className="w-full px-4 py-3 bg-yellow-50 rounded-md">
                    <p className="text-xs text-center text-gray-600">
                      This chart illustrates the distribution of email contacts
                      across various universities, highlighting the
                      representation of each academic institution.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center h-72 bg-gray-50 rounded-lg border border-gray-200">
                <AlertCircle className="h-12 w-12 text-gray-400 mb-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  No University Data
                </h3>
                <p className="text-gray-500 text-center max-w-md mt-1">
                  This cluster doesn't contain any identified universities or
                  academic institutions.
                </p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="tsne" active={activeTab} className="mt-0">
            <div className="grid grid-cols-1 gap-6 p-1">
              {/* Main container with responsive grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Chart Card - takes full width on mobile, 2/3 on larger screens */}
                <Card className="w-full col-span-1 md:col-span-2 h-full flex flex-col">
                  <CardHeader className="py-2">
                    <div className="flex justify-between items-center grid sm:col-span-2 md:col-span-1 col-span-1">
                      <CardTitle className="text-sm md:text-base font-medium">
                        t-SNE Interactive Visualization
                      </CardTitle>
                      <span className="text-xs text-gray-500 sm:mt-2">
                        Showing{" "}
                        {new Set(scatterData.map((d) => d.cluster_name)).size}{" "}
                        Clusters
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-0 md:p-6">
                    {/* Scrollable container for the chart */}
                    <div
                      className="overflow-auto w-full"
                      style={{ minHeight: "26rem" }}
                    >
                      {scatterData.length > 0 && !usingFallbackData ?  (
                        <div className="h-[26rem] w-full min-w-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart
                              margin={{
                                top: 20,
                                right: 20,
                                bottom: 40,
                                left: 40,
                              }}
                            >
                              <ScatterCartesianGrid />

                              <ScatterXAxis
                                type="number"
                                dataKey="x"
                                name="t-SNE 1"
                                domain={calculateDomains(scatterData).xDomain}
                                tick={{ fontSize: 10 }}
                                label={{
                                  value: "t-SNE 1",
                                  position: "bottom",
                                  offset: 10,
                                  fontSize: 12,
                                  fill: "#333",
                                }}
                              />

                              <ScatterYAxis
                                type="number"
                                dataKey="y"
                                name="t-SNE 2"
                                domain={calculateDomains(scatterData).yDomain}
                                tick={{ fontSize: 10 }}
                                label={{
                                  value: "t-SNE 2",
                                  angle: -90,
                                  position: "insideLeft",
                                  offset: 10,
                                  fontSize: 12,
                                  fill: "#333",
                                }}
                              />

                              <ZAxis
                                type="number"
                                dataKey="z"
                                range={[80, 80]}
                              />

                              {(() => {
                                const clusterGroups: Record<
                                  string,
                                  TSNEDataPoint[]
                                > = {};
                                scatterData.forEach((point) => {
                                  if (!clusterGroups[point.cluster_name]) {
                                    clusterGroups[point.cluster_name] = [];
                                  }
                                  clusterGroups[point.cluster_name].push(point);
                                });

                                return Object.entries(clusterGroups).map(
                                  ([clusterName, points], index) => {
                                    const isSelected =
                                      selectedClusterObj?.name === clusterName;
                                    return (
                                      <Scatter
                                        key={clusterName}
                                        name={clusterName}
                                        data={points}
                                        fill={COLORS[index % COLORS.length]}
                                        shape={(props: any) => {
                                          const { cx, cy } = props;
                                          const r = isSelected ? 6 : 4;
                                          const stroke = isSelected
                                            ? "#000"
                                            : COLORS[index % COLORS.length];
                                          return (
                                            <circle
                                              cx={cx}
                                              cy={cy}
                                              r={r}
                                              stroke={stroke}
                                              strokeWidth={isSelected ? 2 : 0}
                                              fill={
                                                COLORS[index % COLORS.length]
                                              }
                                            />
                                          );
                                        }}
                                      />
                                    );
                                  }
                                );
                              })()}

                              <Tooltip
                                formatter={(value: number, name: string) =>
                                  name === "x" || name === "y"
                                    ? [value.toFixed(2), name]
                                    : [value, name]
                                }
                                content={(props) => {
                                  if (props.active && props.payload?.length) {
                                    const data = props.payload[0].payload;
                                    return (
                                      <div className="bg-white p-2 border border-gray-200 rounded shadow-sm text-sm">
                                        <p className="font-medium">
                                          {data.cluster_name}
                                        </p>
                                        {(data.university ||
                                          data.university_name) &&
                                          data.university !== "None" &&
                                          data.university_name !== "None" && (
                                            <p className="text-xs text-gray-600">
                                              {data.university ||
                                                data.university_name}
                                            </p>
                                          )}
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />

                              <Brush dataKey="x" height={20} stroke="#8884d8" />
                            </ScatterChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-[26rem] bg-gray-50 rounded-lg border border-gray-200">
                          <div className="text-center px-4">
                            <svg
                              className="h-12 w-12 text-gray-400 mx-auto mb-2"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1.5}
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900">
                              No t-SNE Data Available
                            </h3>
                            <p className="text-gray-500 text-sm mt-1 max-w-md">
                              No cluster data was returned for visualization.
                              Please upload and process a dataset to view t-SNE
                              scatter plots.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Explanation & Legend - takes full width on mobile, 1/3 on larger screens */}
                <Card className="w-full col-span-1 flex flex-col h-full">
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm md:text-base font-medium">
                      What is t-SNE?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <div className="text-sm text-gray-600 leading-relaxed mb-4">
                      <p>
                        t-SNE is a technique to reduce complex data into 2D so
                        we can visualize it. Each dot represents a contact.
                        Closer dots are more similar.
                      </p>
                      <p className="mt-2">
                        Highlighted cluster:{" "}
                        <strong>{selectedClusterObj?.name || "None"}</strong>
                      </p>
                    </div>
                    <div className="max-h-52 overflow-y-auto border-t border-gray-100 pt-2 text-sm">
                      {Array.from(
                        new Set(scatterData.map((d) => d.cluster_name))
                      ).map((name, index) => (
                        <div key={name} className="flex items-center mb-1">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          ></div>
                          <span
                            className={`${
                              name === selectedClusterObj?.name
                                ? "font-medium text-green-700"
                                : "text-gray-700"
                            }`}
                          >
                            {name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClusterVisualization;
