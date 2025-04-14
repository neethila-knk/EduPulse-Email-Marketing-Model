import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/Layout/PageHeader";
import AdminSidebar from "../../components/Layout/AdminSidebar";
import AdminNavbar from "../../components/Layout/AdminNavbar";
import StatCard from "../../components/UI/StatCard";
import FileUpload from "../../components/UI/FileUpload";
import Toast from "../../components/UI/Toast";
import Select from "../../components/UI/Select";
import Button from "../../components/UI/Button";
import Alert from "../../components/UI/Alert";
import ProgressModal from "../../components/UI/ClusteringProgressBar";
import ClusterVisualization from "../../components/AdminDashboard/ClusterVisualization";
import {
  adminLogout,
  getAdmin,
  adminAuthApi,
} from "../../utils/adminAuthUtils";
import overlayImage from "../../assets/elements.svg";
import ClusterLegend from "../../components/UI/ClusterLegend";
import CustomSelect from "../../components/UI/Select";

// Interfaces
interface Cluster {
  name: string;
  count: number;
  sample?: string;
  id?: string;
}

interface EmailData {
  Email: string;
  domain_type?: string;
  Keyword_Category?: string;
  university_name?: string;
}

interface ClusterStats {
  totalEmails: number;
  originalCount?: number;
  domainTypes: { _id: string; count: number }[];
  keywordCategories: { _id: string; count: number }[];
}

interface UniversityCluster {
  university: string;
  count: number;
  sample: string;
}

const clusteringFacts = [
  "Clustering helps identify niche audiences from your email lists.",
  "Academic email clusters often have higher open rates before exam seasons.",
  "Targeted campaigns to university domains can increase conversions by 300%.",
  "Segmented emails have 14.3% higher open rates and 101% higher click rates.",
  "Cluster-based personalization reduces unsubscribes by 22%.",
  "Marketing to well-defined clusters increases ROI by up to 38%.",
  "Behavior-based clusters outperform demographic segments in 82% of campaigns.",
];

const EmailClustering: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState("");
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [universityClusters, setUniversityClusters] = useState<
    UniversityCluster[]
  >([]);
  const [fact, setFact] = useState<string>("");
  const [stats, setStats] = useState<ClusterStats | null>(null);
  const [adminUser, setAdminUser] = useState(getAdmin());
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [currentDatasetId, setCurrentDatasetId] = useState<string | null>(null);
  const selectedClusterObj = clusters.find((c) => c.name === selectedCluster);

  // New states for progress modal and realtime details
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressDetails, setProgressDetails] = useState("Initializing...");

  // New state for visualization section
  const [showVisualization, setShowVisualization] = useState(false);

  const navigate = useNavigate();

  const handleLogout = async () => {
    setShowLogoutAlert(false);
    await adminLogout();
    setToast({ type: "success", message: "Logged out successfully!" });
    setTimeout(() => navigate("/admin/login"), 1500);
  };

  useEffect(() => {
    setAdminUser(getAdmin());
  }, []);

  useEffect(() => {
    document.title = "Audience Clustering | EduPulse Marketing";
    setFact(
      clusteringFacts[Math.floor(Math.random() * clusteringFacts.length)]
    );
    fetchClusters();
    fetchStats();
    fetchUniversityClusters();
  }, []);

  useEffect(() => {
    if (selectedCluster) fetchEmailsForCluster(selectedCluster);
  }, [selectedCluster]);

  const fetchClusters = async () => {
    try {
      const res = await adminAuthApi.get<Cluster[]>("/api/available-clusters");
      setClusters(res.data);

      // Always update the selectedCluster when clusters change
      if (res.data.length > 0) {
        // Check if current selectedCluster still exists in the new clusters
        const clusterStillExists = res.data.some(
          (c) => c.name === selectedCluster
        );
        if (!clusterStillExists || !selectedCluster) {
          // If not, select the first cluster from the new list
          setSelectedCluster(res.data[0].name);
        }
      } else {
        // Clear selection if no clusters
        setSelectedCluster("");
      }
    } catch (error) {
      setToast({ message: "Failed to fetch clusters", type: "error" });
    }
  };

  const fetchUniversityClusters = async () => {
    try {
      const res = await adminAuthApi.get<UniversityCluster[]>(
        "/api/available-university-clusters"
      );
      setUniversityClusters(res.data);
    } catch (error) {
      console.error("Failed to fetch university clusters", error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await adminAuthApi.get<ClusterStats>("/api/cluster-stats");
      setStats(res.data);
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const fetchEmailsForCluster = async (cluster: string) => {
    try {
      setLoading(true);
      const res = await adminAuthApi.get<EmailData[]>(
        `/api/cluster-emails/${encodeURIComponent(cluster)}`
      );

      console.log(`Received ${res.data.length} emails for cluster ${cluster}`);
      setEmails(res.data);
    } catch (error) {
      console.error("Error fetching emails for cluster:", error);
      setToast({
        message: "Failed to fetch emails for this cluster",
        type: "error",
      });
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setToast({ message: "Please select a file first", type: "warning" });
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setToast({
        message: "Invalid file type. Please upload a CSV file.",
        type: "error",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const preventUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    try {
      setLoading(true);
      setShowProgressModal(true);
      window.addEventListener("beforeunload", preventUnload);

      const progressMessages = [
        "Uploading file...",
        "Checking for existing emails...",
        "Identifying new subscribers...",
        "Clustering new emails...",
        "Finalizing results...",
      ];
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const increment = Math.random() * 10;
          const newProgress = prev + increment;
          if (newProgress < 20) {
            setProgressDetails(progressMessages[0]);
          } else if (newProgress < 40) {
            setProgressDetails(progressMessages[1]);
          } else if (newProgress < 60) {
            setProgressDetails(progressMessages[2]);
          } else if (newProgress < 80) {
            setProgressDetails(progressMessages[3]);
          } else {
            setProgressDetails(progressMessages[4]);
          }
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 1000);

      const res = await adminAuthApi.post("/api/cluster-emails", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      clearInterval(progressInterval);
      setProgress(100);
      setProgressDetails("Processing complete!");

      const data = res.data as {
        status: string;
        inserted?: number;
        existing?: number;
        clusters?: number;
        datasetId?: string;
        message?: string;
        details?: string;
      };

      if (data.status === "success") {
        setToast({
          message:
            data.message ||
            `Clustering complete! Added ${data.inserted} new emails (${data.existing} were already in the database).`,
          type: "success",
        });

        if (data.datasetId) {
          setCurrentDatasetId(data.datasetId);
          setShowVisualization(true);
        }

        setSelectedCluster("");
        fetchClusters();
        fetchStats();
        fetchUniversityClusters();
      } else if (data.status === "warning") {
        setToast({
          message: data.message || "No new emails to process",
          type: "warning",
        });
      } else {
        setToast({
          message: "Clustering failed: " + (data.details || "Unknown error"),
          type: "error",
        });
      }
    } catch (err) {
      setToast({
        message: "Server error. Please check your connection and try again.",
        type: "error",
      });
    } finally {
      window.removeEventListener("beforeunload", preventUnload);
      setLoading(false);
      setTimeout(() => {
        setShowProgressModal(false);
        setProgress(0);
        setProgressDetails("Initializing...");
      }, 1000);
    }
  };

  const greetingComponent = (
    <div>
      <div className="text-lg font-medium mb-1">
        Welcome to Audience Segmentation
      </div>
      <div className="flex items-start text-sm">
        <div className="mr-2 mt-0.5">
          <svg
            className="h-5 w-5 text-yellow"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <span className="font-medium">Marketing Insight:</span> {fact}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen">
      <AdminSidebar onLogout={() => setShowLogoutAlert(true)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar
          user={adminUser}
          onLogout={() => setShowLogoutAlert(true)}
          title="Audience Clustering"
        />
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 pb-8">
          <div className="relative">
            <PageHeader
              title="Smart Email Audience Clustering"
              greeting={greetingComponent}
              size="large"
              action={
                <div className="flex space-x-3">
                  <Button
                    onClick={handleUpload}
                    disabled={loading}
                    variant="secondary"
                    size="md"
                  >
                    {loading ? "Processing..." : "Generate Audience Segments"}
                  </Button>
                </div>
              }
              overlayImage={overlayImage}
            />
          </div>

          {/* Stats Section */}
          <div className="container mx-auto px-6 relative -mt-20 z-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <StatCard
                title="Audience Segments"
                count={clusters.length}
                description="Targeted mailing groups"
                iconColor="text-blue-600"
                loading={loading}
              />
              <StatCard
                title="Selected Audience"
                count={selectedClusterObj ? selectedClusterObj.count : 0}
                description="Emails in current segment"
                iconColor="text-indigo-500"
                loading={loading}
              />
              <StatCard
                title="Total Subscribers"
                count={stats?.totalEmails || 0}
                description="Across all segments"
                iconColor="text-purple-600"
                loading={loading}
              />
            </div>

            {/* Upload + Legend Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload File */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium mb-4">
                  Upload Your Email List
                </h3>

                <FileUpload
                  id="csv-upload"
                  label="Select CSV File"
                  onChange={setFile}
                  accept=".csv"
                  helpText="Upload a CSV with 'Email' and 'Keyword Category'"
                />

                {file ? (
                  <>
                    {/* File info */}
                    <div className="mt-4 text-sm text-gray-700">
                      <p>
                        Selected file:{" "}
                        <span className="font-medium">{file.name}</span> (
                        {(file.size / 1024).toFixed(2)} KB)
                      </p>
                    </div>

                    {/* Upload Button */}
                    {/* Upload Button Section */}
                    <div className="mt-6 space-y-3">
                      <p className="text-sm text-gray-700">
                        ✅ You're ready! Start the clustering process now.
                      </p>

                      <Button
                        onClick={handleUpload}
                        disabled={loading}
                        variant="primary"
                        size="md"
                      >
                        {loading
                          ? "Processing..."
                          : "Generate Audience Segments"}
                      </Button>
                    </div>
                  </>
                ) : (
                  // Upload tips shown only before a file is selected
                  <div className="mt-6 p-4 border border-yellow-200 bg-yellow-50 rounded-md text-sm text-gray-800">
                    <p className="font-medium mb-2">📋 File Upload Tips:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        Ensure your CSV file includes <strong>Email</strong> and{" "}
                        <strong>Keyword Category</strong> columns.
                      </li>
                      <li>Emails must be valid (e.g. name@example.com).</li>
                      <li>
                        Duplicate or empty entries will be ignored
                        automatically.
                      </li>
                      <li>
                        Max file size: <strong>5MB</strong>.
                      </li>
                      <li>
                        Only <strong>.csv</strong> format is accepted.
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Cluster Legend */}
              <div className="bg-white rounded-lg shadow p-6 h-full">
              <ClusterLegend clusters={clusters} />

              </div>
            </div>

            {/* Combined Cluster Selection and Email Preview Section */}
            <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold mb-4">
                  Audience Segment Preview
                </h2>

                {/* Cluster Selection */}
                {clusters.length > 0 ? (
                  <div className="mb-6">
                    <CustomSelect
                      value={selectedCluster}
                      onChange={(val) => setSelectedCluster(val)}
                      options={clusters.map((c) => ({
                        value: c.name,
                        label: `${c.name} (${c.count})`,
                      }))}
                      placeholder="Select a segment to preview"
                      size="md"
                      length="full"
                    />
                  </div>
                ) : (
                  <div className="mb-6">
                    <p className="text-gray-500 italic">
                      No audience segments available. Upload a file to generate
                      segments.
                    </p>
                  </div>
                )}

                {/* Email Preview Status Line */}
                <p className="text-sm text-gray-600 mt-1">
                  {loading
                    ? "Loading emails..."
                    : selectedCluster
                    ? emails.length > 0
                      ? `Showing ${emails.length} contacts in "${selectedCluster}"`
                      : `No emails found in "${selectedCluster}"`
                    : "Please select a segment to view emails"}
                </p>
              </div>

              {/* Email Content Section */}
              {loading ? (
                <div className="p-6 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                </div>
              ) : (
                <>
                  {emails.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto p-6">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Domain Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              University
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {emails.map((email, index) => (
                            <tr
                              key={index}
                              className={
                                index % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {email.Email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {email.domain_type || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {email.university_name || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : selectedCluster ? (
                    <div className="p-8 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No emails found
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        There are currently no emails in this audience segment.
                      </p>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-sm text-gray-500">
                        Please select an audience segment to view emails
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Copy Button Section */}
              {emails.length > 0 && (
                <div className="bg-gray-50 px-6 py-4 flex justify-end">
                  <Button
                    onClick={() =>
                      navigator.clipboard.writeText(
                        emails.map((e) => e.Email).join(",")
                      )
                    }
                  >
                    Copy All Emails
                  </Button>
                </div>
              )}
            </div>

            {/* Visualization Section */}
            {showVisualization && (
              <div className="mt-8">
                <ClusterVisualization
                  datasetId={currentDatasetId || undefined}
                />
              </div>
            )}

            {/* University Clusters Section */}
            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">University Clusters</h3>
              {universityClusters.length > 0 ? (
                <div className="max-h-60 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          University
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Emails
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sample Domain
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {universityClusters.map((uc) => (
                        <tr key={uc.university}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {uc.university}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {uc.count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {uc.sample}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  No university clusters available yet.
                </p>
              )}
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

      {/* Logout Confirmation */}
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

      {/* Progress Modal */}
      {showProgressModal && (
        <ProgressModal progress={progress} details={progressDetails} />
      )}
    </div>
  );
};

export default EmailClustering;
