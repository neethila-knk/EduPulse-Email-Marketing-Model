import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/Layout/PageHeader";
import AdminSidebar from "../../components/Layout/AdminSidebar";
import AdminNavbar from "../../components/Layout/AdminNavbar";
import Button from "../../components/UI/Button";
import Alert from "../../components/UI/Alert";
import Toast from "../../components/UI/Toast";
import {
  getAdmin,
  adminAuthApi,
  adminLogout,
} from "../../utils/adminAuthUtils";
import {
  Upload,
  Mail,
  Search,
  Loader2,
  Check,
  X,
  RefreshCw,
  Download,
} from "lucide-react";
import TextInput from "../../components/UI/TextInput";
import CustomSelect from "../../components/UI/Select";
import overlayImage from "../../assets/elements.svg";


// Define interfaces for API responses
interface ExtractionResponse {
  job_id: string;
  message: string;
  status: string;
}

interface ExtractionJob {
  job_id: string;
  status: string;
  progress: number;
  total_emails: number;
  keywords_processed: number;
  total_keywords: number;
  completed: boolean;
  error?: string;
}

interface EmailResult {
  Email: string;
  "Keyword Category": string;
}

interface ExtractionResults {
  job_id: string;
  total_emails: number;
  results: EmailResult[];
  download_url: string;
}

const EmailExtraction: React.FC = () => {
  const [keywords, setKeywords] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [maxPages, setMaxPages] = useState<number>(5);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<ExtractionJob | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionResults, setExtractionResults] =
    useState<ExtractionResults | null>(null);
  const [showStatusPanel, setShowStatusPanel] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState(getAdmin());
  const [statusCheckInterval, setStatusCheckInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const navigate = useNavigate();
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousProgressRef = useRef<number>(0);
  const extractionCompleteShownRef = useRef<boolean>(false);

  // Function to handle logout confirmation
  const handleShowLogoutConfirmation = () => {
    setShowLogoutAlert(true);
  };

  // Function to handle actual logout
  const handleLogout = async () => {
    setShowLogoutAlert(false);
    await adminLogout();
    setToast({
      message: "Logged out successfully!",
      type: "success",
    });
    setTimeout(() => navigate("/admin/login"), 1500);
  };

  // Function to check job status
  const checkJobStatus = useCallback(
    async (jobId: string) => {
      try {
        const response = await adminAuthApi.get<ExtractionJob>(
          `/api/email-extraction/extraction-status/${jobId}`
        );

        // Only show status updates when there's meaningful progress
        const currentProgress = response.data.progress;
        const previousProgress = previousProgressRef.current;

        // Update the status
        setJobStatus(response.data);

        // Update previous progress for next comparison
        previousProgressRef.current = currentProgress;

        // If job is completed, clear interval and get results
        if (response.data.completed) {
          if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
            setStatusCheckInterval(null);
          }

          if (
            response.data.status === "completed" &&
            !extractionCompleteShownRef.current
          ) {
            try {
              const resultsResponse = await adminAuthApi.get<ExtractionResults>(
                `/api/email-extraction/extraction-results/${jobId}`
              );
              setExtractionResults(resultsResponse.data);

              // Show completion toast only once
              extractionCompleteShownRef.current = true;

              setToast({
                message: `Email extraction completed successfully! Found ${resultsResponse.data.total_emails} emails.`,
                type: "success",
              });
            } catch (error) {
              console.error("Error getting extraction results:", error);
            }
          } else if (response.data.status === "failed") {
            setToast({
              message: `Email extraction failed: ${
                response.data.error || "Unknown error"
              }`,
              type: "error",
            });
          }

          setIsExtracting(false);
        }
      } catch (error) {
        console.error("Error checking job status:", error);
        if (statusCheckInterval) {
          clearInterval(statusCheckInterval);
          setStatusCheckInterval(null);
        }
        setIsExtracting(false);
      }
    },
    [statusCheckInterval]
  );

  // Effect to start status checking when activeJobId changes
  useEffect(() => {
    if (activeJobId) {
      // Reset states for new job
      previousProgressRef.current = 0;
      extractionCompleteShownRef.current = false;

      // Clear any existing interval
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }

      // Check status immediately
      checkJobStatus(activeJobId);

      // Set up interval to check status every 3 seconds (increased from 2 seconds to reduce UI updates)
      const interval = setInterval(() => {
        checkJobStatus(activeJobId);
      }, 3000);

      setStatusCheckInterval(interval);

      // Set up beforeunload handler to warn user before leaving
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (isExtracting) {
          const message =
            "Email extraction is in progress. Leaving this page will cancel the extraction. Are you sure?";
          e.preventDefault();
          e.returnValue = message;
          return message;
        }
      };
      
      if (isExtracting) {
        window.addEventListener("beforeunload", handleBeforeUnload);
      }
    
      // Clean up on unmount or when activeJobId changes
      return () => {
        clearInterval(interval);
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }
  }, [activeJobId, checkJobStatus, isExtracting]);

  // Clean up interval and toast timeout on component unmount
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [statusCheckInterval]);

  // Function to handle extraction
  const handleExtract = async () => {
    if (!keywords.trim()) {
      setToast({
        message: "Please enter at least one keyword",
        type: "error",
      });
      return;
    }

    setIsExtracting(true);
    setShowStatusPanel(true);
    setExtractionResults(null); // Clear any previous results

    try {
      const response = await adminAuthApi.post<ExtractionResponse>(
        "/api/email-extraction/extract-emails",
        {
          keywords,
          category,
          max_pages: maxPages,
        }
      );

      setActiveJobId(response.data.job_id);
      setToast({
        message:
          "Email extraction started successfully. Please don't close this tab until completion.",
        type: "info",
      });
    } catch (error: any) {
      console.error("Extraction error:", error);
      setToast({
        message:
          error.response?.data?.message ||
          "An error occurred during email extraction",
        type: "error",
      });
      setIsExtracting(false);
    }
  };

  // Function to handle confirmation
  const handleShowExtractionConfirmation = () => {
    setShowAlert(true);
  };

  // Function to handle download
  const handleDownload = async () => {
    if (!activeJobId) return;

    setIsDownloading(true);
    try {
      // Use your existing authenticated API utility
      const response = await adminAuthApi.get<Blob>(
        `/api/email-extraction/download-emails/${activeJobId}`,
        { responseType: "blob" }
      );

      // Create a blob URL and trigger download
      const blob = new Blob([response.data as BlobPart], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `extracted_emails_${activeJobId}.csv`);
      document.body.appendChild(link);
      link.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      setToast({
        message: "Download successful",
        type: "success",
      });
    } catch (error) {
      console.error("Download error:", error);
      setToast({
        message: "Failed to download emails. Please check console for details.",
        type: "error",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Custom toast message handler to control timing and prevent multiple toasts
  const showToastMessage = useCallback(
    (message: string, type: "success" | "error" | "warning" | "info") => {
      // Clear any existing toast timeout
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }

      // Set the new toast
      setToast({ message, type });

      // Set timeout to clear toast
      toastTimeoutRef.current = setTimeout(() => {
        setToast(null);
      }, 5000);
    },
    []
  );

  // Function to get status color
  const getStatusColor = (status: string): string => {
    if (status.includes("completed")) return "text-green-500";
    if (status.includes("failed")) return "text-red-500";
    if (status.includes("queued")) return "text-blue-500";
    return "text-yellow-500"; // processing
  };

  // Function to get status icon
  const getStatusIcon = (status: string) => {
    if (status.includes("completed"))
      return <Check className="text-green-500" size={18} />;
    if (status.includes("failed"))
      return <X className="text-red-500" size={18} />;
    if (status.includes("queued"))
      return <Upload className="text-blue-500" size={18} />;
    return <Loader2 className="text-yellow-500 animate-spin" size={18} />;
  };

  // Format status text for better display
  const formatStatusText = (status: string): string => {
    if (status.startsWith("processing_keyword_")) {
      return "Processing keywords...";
    } else if (status.startsWith("completed_keyword_")) {
      return "Keyword processing in progress...";
    } else if (status === "completed") {
      return "Extraction completed";
    } else if (status === "failed") {
      return "Extraction failed";
    } else if (status === "queued") {
      return "Queued for extraction";
    } else if (status === "starting") {
      return "Starting extraction...";
    }
    return status;
  };

  return (
    <div className="flex h-screen">
      <AdminSidebar onLogout={handleShowLogoutConfirmation} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar user={adminUser}   title="Email Extractor" onLogout={handleShowLogoutConfirmation} />
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <PageHeader
            title="Extract Emails for Clustering"
            subheading="Perform automated web searches to extract email addresses using your custom keywords."
            isSticky
            size="small"
            showBackButton={true}
            onBack={() => navigate("/admin/dashboard")}
            overlayImage={overlayImage}
            action={
              <div className="flex justify-end">
                <Button
                  onClick={() => navigate("/admin/clustering")}
                  variant="secondary"
                  size="md"
                >
                  Upload CSV for Clustering
                </Button>
              </div>
            }
          />

          <div className="container mx-auto px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <div className="flex items-center mb-4">
                    <Mail className="mr-2 text-green" size={20} />
                    <h3 className="text-lg font-medium">Extract Emails</h3>
                  </div>

                  <TextInput
                    id="keywords"
                    label="Keywords (comma-separated)"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="Enter keywords (e.g. nsbm software enginnering, sliit degree programs)"
                    disabled={isExtracting}
                    required
                    className="!flex-col mb-4"
                  />

                  <div className="mb-4">
                    <TextInput
                      id="category"
                      label="Category (optional)"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Enter a category (e.g. Educators)"
                      disabled={isExtracting}
                      className="!flex-col"
                    />

                    <p className="mt-1 text-sm text-gray-500">
                      Add a category to help organize the extracted emails. If
                      left blank, keywords will be used as categories.
                    </p>
                  </div>

                  <CustomSelect
                    label="Max Pages to Search (per keyword)"
                    value={String(maxPages)}
                    onChange={(val) => setMaxPages(Number(val))}
                    options={[
                      { label: "3 pages", value: "3" },
                      { label: "5 pages", value: "5" },
                      { label: "8 pages", value: "8" },
                      { label: "10 pages", value: "10" },
                    ]}
                    placeholder="Select page count"
                    length="full"
                    size="md"
                    disabled={isExtracting}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    More pages will find more emails but take longer to process.
                  </p>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleShowExtractionConfirmation}
                      disabled={isExtracting || !keywords.trim()}
                      variant="primary"
                      size="md"
                      icon={
                        isExtracting ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <Search size={16} />
                        )
                      }
                    >
                      {isExtracting ? "Extracting..." : "Start Extraction"}
                    </Button>
                  </div>
                </div>

                {showStatusPanel && jobStatus && (
                  <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center mb-4">
                      <RefreshCw
                        className={`mr-2 ${
                          isExtracting ? "animate-spin" : ""
                        } text-yellow-500`}
                        size={20}
                      />
                      <h3 className="text-lg font-medium">Extraction Status</h3>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Status:</span>
                        <span
                          className={`text-sm flex items-center ${getStatusColor(
                            jobStatus.status
                          )}`}
                        >
                          {getStatusIcon(jobStatus.status)}
                          <span className="ml-1">
                            {formatStatusText(jobStatus.status)}
                          </span>
                        </span>
                      </div>

                      <div className="mb-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-500">
                            Progress:
                          </span>
                          <span className="text-sm text-gray-500">
                            {Math.round(jobStatus.progress)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-green h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${jobStatus.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex justify-between text-sm text-gray-500 mb-1">
                        <span>Keywords Processed:</span>
                        <span>
                          {jobStatus.keywords_processed} /{" "}
                          {jobStatus.total_keywords}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Emails Found:</span>
                        <span>{jobStatus.total_emails}</span>
                      </div>
                    </div>

                    {isExtracting && (
                      <div className="p-3 mb-4 text-sm text-yellow-700 bg-yellow-100 rounded-lg">
                        <div className="font-medium">Important:</div>
                        <div>
                          Please do not close this tab until extraction is
                          complete.
                        </div>
                      </div>
                    )}

                    {jobStatus.error && (
                      <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                        <div className="font-medium">Error:</div>
                        <div>{jobStatus.error}</div>
                      </div>
                    )}
                  </div>
                )}

                {extractionResults && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center mb-4">
                      <Check className="mr-2 text-green-500" size={20} />
                      <h3 className="text-lg font-medium">
                        Extraction Results
                      </h3>
                    </div>

                    <div className="mb-6">
                      <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                        <p className="text-green-800">
                          <span className="font-medium">Success!</span> Found{" "}
                          {extractionResults.total_emails} email addresses.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                      <Button
                        onClick={handleDownload}
                        variant="primary"
                        size="md"
                        icon={
                          isDownloading ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <Download size={16} />
                          )
                        }
                        disabled={isDownloading}
                      >
                        {isDownloading ? "Downloading..." : "Download CSV"}
                      </Button>

                      <Button
                        onClick={() => {
                          setKeywords("");
                          setCategory("");
                          setActiveJobId(null);
                          setJobStatus(null);
                          setExtractionResults(null);
                          setShowStatusPanel(false);
                          extractionCompleteShownRef.current = false;
                        }}
                        variant="outline"
                        size="md"
                      >
                        New Extraction
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h3 className="text-lg font-medium mb-4">Extraction Tips</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex">
                      <span className="mr-2">•</span>
                      <span>
                        Use specific, targeted keywords for better results
                      </span>
                    </li>
                    <li className="flex">
                      <span className="mr-2">•</span>
                      <span>Separate multiple keywords with commas</span>
                    </li>
                    <li className="flex">
                      <span className="mr-2">•</span>
                      <span>
                        Categories help organize emails for marketing campaigns
                      </span>
                    </li>
                    <li className="flex">
                      <span className="mr-2">•</span>
                      <span>
                        More search pages will find more emails but take longer
                      </span>
                    </li>
                    <li className="flex">
                      <span className="mr-2">•</span>
                      <span>
                        Wait for extraction to complete before closing the tab
                      </span>
                    </li>
                    <li className="flex">
                      <span className="mr-2">•</span>
                      <span>
                        After downloading, you can upload the CSV to the
                        clustering tool
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg text-dark font-medium mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button
                      onClick={() => navigate("/admin/clustering")}
                      variant="primary"
                      size="md"
                      className="w-full justify-start"
                      icon={<Upload size={16} />}
                    >
                      Upload CSV to Clustering
                    </Button>
                
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAlert && (
        <Alert
          title="Confirm Email Extraction"
          message={`Are you sure you want to start extracting emails for "${keywords}"? This process may take several minutes and you should not close this tab until it's complete.`}
          confirmText="Start Extraction"
          cancelText="Cancel"
          position="top-center"
          onConfirm={() => {
            setShowAlert(false);
            handleExtract();
          }}
          onCancel={() => setShowAlert(false)}
        />
      )}

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

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default EmailExtraction;
