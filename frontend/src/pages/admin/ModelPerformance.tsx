import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/Layout/PageHeader";
import AdminSidebar from "../../components/Layout/AdminSidebar";
import AdminNavbar from "../../components/Layout/AdminNavbar";
import Button from "../../components/UI/Button";
import Alert from "../../components/UI/Alert";
import Toast from "../../components/UI/Toast";
import { getAdmin, adminLogout } from "../../utils/adminAuthUtils";
import overlayImage from "../../assets/elements.svg";

// Updated Type definitions to only include required fields
type MetricData = {
  silhouette_score: number;
  davies_bouldin_index: number;
  calinski_harabasz_index: number;
};

type AlgorithmMetric = {
  _id: string;
  algorithm: string;
  timestamp: string;
  metrics: MetricData;
};

type ToastType = {
  message: string;
  type: "success" | "error" | "warning";
} | null;

// Simplified PipelineMetrics to only include the required fields
type PipelineMetrics = {
  kmodes: MetricData;
  hierarchical: MetricData;
  processing_time_seconds?: number;
  timestamp?: string;
};

// Utility function to format numbers
const formatNumber = (num: number | undefined | null, decimals = 6): string => {
  if (num === null || num === undefined) return "N/A";
  return Number(num).toFixed(decimals);
};

const ModelPerformance: React.FC = () => {
  const [toast, setToast] = useState<ToastType>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [metricsLoading, setMetricsLoading] = useState<boolean>(true);
  const [pipelineLoading, setPipelineLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<AlgorithmMetric[]>([]);
  const [pipelineMetrics, setPipelineMetrics] =
    useState<PipelineMetrics | null>(null);
  const [adminUser, setAdminUser] = useState(getAdmin());
  const [showLogoutAlert, setShowLogoutAlert] = useState<boolean>(false);
  const [isSampleData, setIsSampleData] = useState<boolean>(false);

  const navigate = useNavigate();

  // Centralized logout confirmation handler
  const handleShowLogoutConfirmation = () => {
    setShowLogoutAlert(true);
  };

  const handleLogout = async () => {
    setShowLogoutAlert(false);
    await adminLogout();
    setToast({ type: "success", message: "Logged out successfully!" });
    setTimeout(() => navigate("/admin/login"), 1500);
  };

  useEffect(() => {
    setAdminUser(getAdmin());
    document.title = "Model Performance | EduPulse Marketing";
    fetchMetrics();
    fetchPipelineMetrics();
  }, []);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const fetchMetrics = async () => {
    setMetricsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/performance-metrics`);

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();

      if (data.metrics) {
        setMetrics(data.metrics);
        setIsSampleData(data.isSampleData || false);
      } else {
        console.warn("Response didn't contain metrics data");
      }
    } catch (error) {
      console.error("Failed to fetch metrics", error);
      setToast({ message: "Failed to fetch model metrics", type: "error" });
    } finally {
      setMetricsLoading(false);
      setLoading(false);
    }
  };

  const fetchPipelineMetrics = async () => {
    setPipelineLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/model/pipeline-metrics`);

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      setPipelineMetrics(data);
    } catch (error) {
      console.error("Failed to fetch pipeline metrics", error);
      setPipelineMetrics(null);
      setToast({
        message: "Failed to fetch pipeline metrics",
        type: "warning",
      });
    } finally {
      setPipelineLoading(false);
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchMetrics();
    fetchPipelineMetrics();
    setToast({ message: "Refreshing data...", type: "success" });
  };

  const renderMetricsCard = (algorithm: string, metrics: MetricData) => {
    const getGradeAndColor = (metric: string, value: number) => {
      const gradeScales: {
        [key: string]: {
          thresholds: number[];
          labels: string[];
          colors: string[];
          bgColors: string[]; // Added background colors
        };
      } = {
        silhouette_score: {
          thresholds: [0.25, 0.5, 0.7, 0.8],
          labels: ["Poor", "Fair", "Good", "Very Good", "Excellent"],
          colors: [
            "text-red-500",
            "text-yellow-500",
            "text-green-600",
            "text-green-500",
            "text-green-700",
          ],
          bgColors: [
            "bg-red-500",
            "bg-yellow-500",
            "bg-green-600",
            "bg-green-500",
            "bg-green-700",
          ],
        },
        davies_bouldin_index: {
          // Lower is better
          thresholds: [3, 2, 1.5, 1],
          labels: ["Excellent", "Very Good", "Good", "Fair", "Poor"],
          colors: [
            "text-green-700",
            "text-green-500",
            "text-green-500",
            "text-yellow-500",
            "text-red-500",
          ],
          bgColors: [
            "bg-green-700",
            "bg-green-500",
            "bg-green-500",
            "bg-yellow-500",
            "bg-red-500",
          ],
        },
        calinski_harabasz_index: {
          thresholds: [50, 200, 1000, 1500],
          labels: ["Poor", "Fair", "Good", "Very Good", "Excellent"],
          colors: [
            "text-red-500",
            "text-yellow-500",
            "text-green-500",
            "text-green-500",
            "text-green-700",
          ],
          bgColors: [
            "bg-red-500",
            "bg-yellow-500",
            "bg-green-500",
            "bg-green-500",
            "bg-green-700",
          ],
        },
      };

      const scale = gradeScales[metric];
      if (!scale)
        return {
          grade: "Unknown",
          color: "text-gray-500",
          bgColor: "bg-gray-500",
        };

      // Special handling for Davies-Bouldin (lower is better)
      if (metric === "davies_bouldin_index") {
        for (let i = 0; i < scale.thresholds.length; i++) {
          if (value <= scale.thresholds[i]) {
            return {
              grade: scale.labels[i],
              color: scale.colors[i],
              bgColor: scale.bgColors[i],
            };
          }
        }
        return {
          grade: scale.labels[scale.labels.length - 1],
          color: scale.colors[scale.colors.length - 1],
          bgColor: scale.bgColors[scale.bgColors.length - 1],
        };
      }

      // For other metrics (higher is better)
      for (let i = 0; i < scale.thresholds.length; i++) {
        if (value < scale.thresholds[i]) {
          return {
            grade: scale.labels[i],
            color: scale.colors[i],
            bgColor: scale.bgColors[i],
          };
        }
      }
      return {
        grade: scale.labels[scale.labels.length - 1],
        color: scale.colors[scale.colors.length - 1],
        bgColor: scale.bgColors[scale.bgColors.length - 1],
      };
    };

    // Calculate overall performance score (0-100)
    const calculatePerformanceScore = (metrics: MetricData) => {
      // Normalize each metric to 0-100 range
      const silhouetteNorm = metrics.silhouette_score * 100; // 0-1 to 0-100

      // Davies-Bouldin - lower is better, scale from 0-5 to 100-0
      const daviesNorm = Math.max(
        0,
        Math.min(100, (5 - metrics.davies_bouldin_index) * 20)
      );

      // Calinski-Harabasz - logarithmic scale since values can be very large
      // Scale from 0-2000 to 0-100
      const calinskiNorm = Math.min(
        100,
        (Math.log10(metrics.calinski_harabasz_index) / Math.log10(2000)) * 100
      );

      // Average the three metrics for overall score
      return Math.round((silhouetteNorm + daviesNorm + calinskiNorm) / 3);
    };

    const performanceScore = calculatePerformanceScore(metrics);

    // Determine score color
    let scoreColor = "text-red-600";
    if (performanceScore >= 90) {
      scoreColor = "text-green-600";
    } else if (performanceScore >= 75) {
      scoreColor = "text-green-500";
    } else if (performanceScore >= 60) {
      scoreColor = "text-yellow-500";
    } else if (performanceScore >= 40) {
      scoreColor = "text-orange-500";
    }

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-medium">{algorithm} Algorithm</h3>
          <div className={`text-right ${scoreColor}`}>
            <span className="text-3xl font-bold">{performanceScore}</span>
            <span className="text-sm ml-1">/ 100</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Silhouette Score</span>
              <div className="flex items-center">
                <span className="text-sm font-bold">
                  {formatNumber(metrics.silhouette_score, 3)}
                </span>
                <span
                  className={`ml-2 text-xs ${
                    getGradeAndColor(
                      "silhouette_score",
                      metrics.silhouette_score
                    ).color
                  }`}
                >
                  (
                  {
                    getGradeAndColor(
                      "silhouette_score",
                      metrics.silhouette_score
                    ).grade
                  }
                  )
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  getGradeAndColor("silhouette_score", metrics.silhouette_score)
                    .bgColor
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, metrics.silhouette_score * 100)
                  )}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Measures how well-separated clusters are. Higher is better.
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Davies-Bouldin Index</span>
              <div className="flex items-center">
                <span className="text-sm font-bold">
                  {formatNumber(metrics.davies_bouldin_index, 3)}
                </span>
                <span
                  className={`ml-2 text-xs ${
                    getGradeAndColor(
                      "davies_bouldin_index",
                      metrics.davies_bouldin_index
                    ).color
                  }`}
                >
                  (
                  {
                    getGradeAndColor(
                      "davies_bouldin_index",
                      metrics.davies_bouldin_index
                    ).grade
                  }
                  )
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  getGradeAndColor(
                    "davies_bouldin_index",
                    metrics.davies_bouldin_index
                  ).bgColor
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, ((5 - metrics.davies_bouldin_index) / 5) * 100)
                  )}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Measures average similarity between clusters. Lower is better.
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">
                Calinski-Harabasz Index
              </span>
              <div className="flex items-center">
                <span className="text-sm font-bold">
                  {formatNumber(metrics.calinski_harabasz_index, 1)}
                </span>
                <span
                  className={`ml-2 text-xs ${
                    getGradeAndColor(
                      "calinski_harabasz_index",
                      metrics.calinski_harabasz_index
                    ).color
                  }`}
                >
                  (
                  {
                    getGradeAndColor(
                      "calinski_harabasz_index",
                      metrics.calinski_harabasz_index
                    ).grade
                  }
                  )
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  getGradeAndColor(
                    "calinski_harabasz_index",
                    metrics.calinski_harabasz_index
                  ).bgColor
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    (Math.log10(Math.max(1, metrics.calinski_harabasz_index)) /
                      Math.log10(2000)) *
                      100
                  )}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Measures ratio of between-cluster to within-cluster dispersion.
              Higher is better.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderOverallPerformance = () => {
    if (pipelineLoading) {
      return (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">
            Overall Pipeline Performance
          </h3>
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green"></div>
          </div>
        </div>
      );
    }

    if (!pipelineMetrics) {
      return (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">
            Overall Pipeline Performance
          </h3>
          <div className="py-8 text-center text-gray-500">
            <p>No pipeline metrics data available.</p>
            <p className="text-sm mt-2">
              Run the clustering process to generate metrics.
            </p>
          </div>
        </div>
      );
    }

    // Calculate overall pipeline performance
    const normalizeScore = {
      silhouette: (val: number) => val * 100,
      davies: (val: number) => Math.max(0, Math.min(100, (5 - val) * 20)),
      calinski: (val: number) =>
        Math.min(100, (Math.log10(val) / Math.log10(2000)) * 100),
    };

    const km = pipelineMetrics.kmodes;
    const hc = pipelineMetrics.hierarchical;

    const overall_score = Math.round(
      (normalizeScore.silhouette(km.silhouette_score) +
        normalizeScore.davies(km.davies_bouldin_index) +
        normalizeScore.calinski(km.calinski_harabasz_index) +
        normalizeScore.silhouette(hc.silhouette_score) +
        normalizeScore.davies(hc.davies_bouldin_index) +
        normalizeScore.calinski(hc.calinski_harabasz_index)) /
        6
    );

    let performanceGrade, performanceColor;

    if (overall_score >= 80) {
      performanceGrade = "Excellent";
      performanceColor = "text-green-700";
    } else if (overall_score >= 70) {
      performanceGrade = "Very Good";
      performanceColor = "text-green-600";
    } else if (overall_score >= 60) {
      performanceGrade = "Good";
      performanceColor = "text-green-500";
    } else if (overall_score >= 50) {
      performanceGrade = "Fair";
      performanceColor = "text-yellow-500";
    } else {
      performanceGrade = "Needs Improvement";
      performanceColor = "text-red-500";
    }

    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-medium mb-4">
          Overall Pipeline Performance
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-700">
              {Math.round(overall_score)}%
            </div>
            <div className={`text-sm font-medium ${performanceColor}`}>
              {performanceGrade}
            </div>
            <div className="text-xs text-gray-500 mt-1">Overall Score</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-700">
              {pipelineMetrics.processing_time_seconds !== undefined
                ? `${pipelineMetrics.processing_time_seconds.toFixed(1)}s`
                : "N/A"}
            </div>
            <div className="text-xs text-gray-500 mt-1">Processing Time (Last Time)</div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Pipeline Explanation</h4>
          <p className="text-sm text-gray-600">
            Our email clustering pipeline uses a two-stage approach:
          </p>
          <ol className="list-decimal list-inside text-sm text-gray-600 mt-2 space-y-1">
            <li>
              <strong>K-modes Clustering</strong>: First stage for initial
              grouping of categorical data
            </li>
            <li>
              <strong>Hierarchical Clustering</strong>: Second stage to refine
              groups based on similarity
            </li>
          </ol>
          <p className="text-sm text-gray-600 mt-2">
            The pipeline achieves optimal performance by leveraging the
            strengths of both algorithms, with hierarchical clustering showing
            particularly strong metrics for our email data.
          </p>
        </div>
      </div>
    );
  };

  const renderAlgorithmCards = () => {
    if (pipelineLoading) {
      return (
        <div className="col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green"></div>
          </div>
        </div>
      );
    }

    if (!pipelineMetrics) {
      return (
        <div className="col-span-2 bg-white rounded-lg shadow p-6 text-center text-gray-500">
          <p>No algorithm metrics available.</p>
        </div>
      );
    }

    return (
      <>
        {renderMetricsCard("K-modes", pipelineMetrics.kmodes)}
        {renderMetricsCard("Hierarchical", pipelineMetrics.hierarchical)}
      </>
    );
  };

  const renderHistoricalMetricsTable = () => {
    if (metricsLoading || pipelineLoading) {
      return (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">
            Recent Performance Metrics
          </h3>
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green"></div>
          </div>
        </div>
      );
    }

    if (!pipelineMetrics) {
      return (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">
            Recent Performance Metrics
          </h3>
          <div className="py-8 text-center text-gray-500">
            <p>No metrics data available.</p>
            <p className="text-sm mt-2">
              Run the clustering process to generate metrics.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-medium mb-4">Recent Performance Metrics</h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Algorithm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Silhouette Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Davies-Bouldin Index
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Calinski-Harabasz Index
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {["kmodes", "hierarchical"].map((algo) => {
                const metric = pipelineMetrics[
                  algo as keyof PipelineMetrics
                ] as MetricData;
                return (
                  <tr key={algo}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(
                        pipelineMetrics.timestamp || new Date()
                      ).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                      {algo === "kmodes" ? "K-modes" : "Hierarchical"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatNumber(metric.silhouette_score)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatNumber(metric.davies_bouldin_index)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatNumber(metric.calinski_harabasz_index)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen">
      <AdminSidebar onLogout={handleShowLogoutConfirmation} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar user={adminUser} title="Model Performance" onLogout={handleShowLogoutConfirmation} />
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
        <div className="sticky top-0 z-30">
            <PageHeader
              title="Model Performance"
              subheading="Insights into the effectiveness of K-modes and Hierarchical clustering models."
              size="small"
              isSticky
              showBackButton={true}
              onBack={() => navigate("/admin/dashboard")}
              overlayImage={overlayImage}
              action={
                <div className="flex space-x-3">
                  <Button
                    onClick={handleRefresh}
                    disabled={loading}
                    variant="secondary"
                    size="md"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Loading...</span>
                      </div>
                    ) : (
                      "Refresh Metrics"
                    )}
                  </Button>
                </div>
              }
            />
          </div>

          <div className="container mx-auto px-6 relative mt-6 z-20">
            {isSampleData && (
              <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Sample data is being displayed. Connect to the Python
                      service to show real performance metrics.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Overall Pipeline Performance Card */}
            {renderOverallPerformance()}

            {/* Individual Algorithm Performance Cards */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderAlgorithmCards()}
            </div>

            {/* Historical Metrics Table */}
            {renderHistoricalMetricsTable()}

            {/* Clustering Best Practices Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-medium mb-4">
                Clustering Best Practices
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">K-modes Clustering</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    <li>
                      Works best for categorical data like domain types and
                      keyword categories
                    </li>
                    <li>Computationally efficient for large datasets</li>
                    <li>
                      Consider increasing the number of initializations (n_init)
                      for better results
                    </li>
                    <li>
                      Try different initialization methods (Huang, Cao) to see
                      which performs better
                    </li>
                    <li>
                      Use the elbow method with silhouette scores to determine
                      optimal k
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Hierarchical Clustering</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    <li>Provides a more interpretable cluster structure</li>
                    <li>Works well with Gower distance for mixed data types</li>
                    <li>Can reveal natural hierarchies in the data</li>
                    <li>
                      Try different linkage methods (ward, complete, average)
                      for different results
                    </li>
                    <li>
                      Use dendrograms to visualize and interpret the clustering
                      structure
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-medium mb-2">
                  Current Pipeline Performance Analysis
                </h4>
                <div className="p-4 bg-yellow-50 rounded-md">
                  <p className="text-sm text-gray-800">
                    The current two-stage pipeline combines the strengths of
                    both algorithms. The K-modes algorithm efficiently handles
                    categorical data in the first stage, while the Hierarchical
                    clustering with Gower distance refines the clusters in the
                    second stage. This approach has demonstrated excellent
                    performance with silhouette scores above 0.8 for the final
                    clustering, indicating well-separated and cohesive clusters.
                  </p>
                </div>
              </div>
            </div>

            {toast && (
              <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(null)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Centralized Logout Confirmation */}
      {showLogoutAlert && (
        <Alert
          title="Confirm Logout"
          message="Are you sure you want to log out of your admin session?"
          confirmText="Logout"
          cancelText="Cancel"
          position="top-center"
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutAlert(false)}
        />
      )}
    </div>
  );
};

export default ModelPerformance;
