import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout/Layout";
import PageHeader from "../components/Layout/PageHeader";
import Button from "../components/UI/Button";
import TextInput from "../components/UI/TextInput";
import TextArea from "../components/UI/TextArea";
import FileUpload from "../components/UI/FileUpload";
import { authApi, isAuthenticated } from "../utils/authUtils";
import overlayImage from "../assets/elements.svg";
import CustomSelect from "../components/UI/Select";
import MsgArea from "../components/UI/MsgArea";
import ProgressOverlay from "../components/UI/ClusteringProgressBar";

interface User {
  id: string;
  username: string;
  email: string;
  provider: string;
}

interface AuthResponse {
  user: User;
}

interface Cluster {
  id: string;
  value: string;
  label: string;
  count: number;
  description: string;
  primaryInterest: string;
  primaryDomainType: string;
}

interface ClusterDetailsResponse {
  id: string;
  name: string;
  description: string;
  size: number;
  primaryInterest: string;
  primaryDomainType: string;
  domainDistribution: Record<string, number>;
  keywordDistribution: Record<string, number>;
  emailCount: number;
}

interface CampaignResponse {
  message: string;
  campaignId: string;
  recipientCount: number;
}

interface EmailSettingsResponse {
  verifiedSender: string | null;
  hasSendgridConfig: boolean;
  emailProvider: string;
  dailyLimit: number;
}

interface FormErrors {
  campaignName?: string;
  subject?: string;
  fromEmail?: string;
  clusterId?: string;
  plainBody?: string; // Added validation for email body
}

const NewCampaign: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [fetchingClusters, setFetchingClusters] = useState(false);
  const navigate = useNavigate();

  // Form state
  const [campaignName, setCampaignName] = useState("");
  const [subject, setSubject] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [clusterId, setClusterId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [htmlContent, setHtmlContent] = useState("<html>\n\n</html>");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [plainBody, setPlainBody] = useState("");
  const [selectedRecipientCount, setSelectedRecipientCount] = useState(0);
  const [selectedClusterDetails, setSelectedClusterDetails] =
    useState<Partial<ClusterDetailsResponse> | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressDetails, setProgressDetails] = useState(
    "Preparing to send emails..."
  );

  // Fetch active clusters for the user
  const fetchClusters = async () => {
    try {
      setFetchingClusters(true);
      const response = await authApi.get<Cluster[]>("/api/user-clusters");
      setClusters(response.data);
      setFetchingClusters(false);
    } catch (error) {
      console.error("Error fetching clusters:", error);
      setFetchingClusters(false);
    }
  };

  // Fetch details for a specific cluster
  const fetchClusterDetails = async (id: string) => {
    if (!id) return;

    try {
      const response = await authApi.get<ClusterDetailsResponse>(
        `/api/user-clusters/${id}`
      );
      setSelectedClusterDetails(response.data);
    } catch (error) {
      console.error("Error fetching cluster details:", error);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate campaign name
    if (!campaignName.trim()) {
      newErrors.campaignName = "Campaign name is required";
    }

    // Validate subject
    if (!subject.trim()) {
      newErrors.subject = "Subject is required";
    }

    // Validate email
    if (!fromEmail.trim()) {
      newErrors.fromEmail = "Email is required";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(fromEmail)) {
      newErrors.fromEmail = "Invalid email address";
    }

    // Validate recipients (cluster)
    if (!clusterId) {
      newErrors.clusterId = "Please select a recipient audience";
    }

    // Validate email body
    if (!plainBody.trim()) {
      newErrors.plainBody = "Email body is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  
  useEffect(() => {
    document.title = "New Campaign | EduPulse";

    // Fetch verified sender email from backend
    // Fetch verified sender email from backend
    const fetchVerifiedSender = async () => {
      try {
        // Use the proper type to tell TypeScript what to expect
        const response = await authApi.get<EmailSettingsResponse>(
          "/api/settings/email-sender"
        );

        if (response.data && response.data.verifiedSender) {
          setFromEmail(response.data.verifiedSender);
          console.log("Using verified sender:", response.data.verifiedSender);
        }
      } catch (error) {
        console.error("Error fetching verified sender:", error);
        // Fall back to user's email
      }
    };

    // Check if user is authenticated
    if (!isAuthenticated()) {
      navigate("/login", {
        state: { message: "Please log in to create a campaign" },
      });
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await authApi.get<AuthResponse>("/auth/me");
        setUser(response.data.user);

        // Set default from email to user's email
        if (response.data.user.email) {
          setFromEmail(response.data.user.email);
        }

        // Try to get verified sender email from backend
        await fetchVerifiedSender();

        // Then fetch user clusters
        fetchClusters();
      } catch (error) {
        console.error("Error fetching user data:", error);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        navigate("/login", {
          state: { message: "Your session has expired. Please log in again." },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  // Update recipient count and fetch additional details when cluster is selected
  useEffect(() => {
    if (clusterId) {
      const selectedCluster = clusters.find(
        (cluster) => cluster.value === clusterId
      );
      if (selectedCluster) {
        setSelectedRecipientCount(selectedCluster.count || 0);
        fetchClusterDetails(clusterId);
      } else {
        setSelectedRecipientCount(0);
        setSelectedClusterDetails(null);
      }
    } else {
      setSelectedRecipientCount(0);
      setSelectedClusterDetails(null);
    }
  }, [clusterId, clusters]);

  const handleLogout = async () => {
    try {
      await authApi.get("/auth/logout");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionStatus("submitting");

    setShowProgress(true);
    setProgress(10);
    setProgressDetails("Validating campaign data...");

    setSubmissionError(null);

    if (validateForm()) {
      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append("campaignName", campaignName);
        formData.append("subject", subject);
        formData.append("fromEmail", fromEmail);
        formData.append("clusterId", clusterId);
        formData.append("htmlContent", htmlContent);
        formData.append("plainBody", plainBody);

        if (file) {
          formData.append("attachments", file);
        }

        // Log what we're sending for debugging
        console.log("Submitting campaign with data:", {
          campaignName,
          subject,
          fromEmail,
          clusterId,
          plainBody,
          hasHtmlContent: !!htmlContent,
          hasAttachment: !!file,
        });

        setProgress(30);
        setProgressDetails("Uploading email content...");

        // Submit to backend
        const response = await authApi.post<CampaignResponse>(
          "/api/campaigns",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        console.log("Campaign created:", response.data);
        setSubmissionStatus("success");

        setProgress(100);
        setProgressDetails("Campaign created successfully!");

        setTimeout(() => {
          setShowProgress(false);
          navigate("/campaigns", {
            state: {
              message: `Email campaign "${campaignName}" created successfully with ${response.data.recipientCount} recipients.`,
            },
          });
        }, 1000); // delay for 1 second after completion

        // Redirect to campaigns list with success message
        navigate("/campaigns", {
          state: {
            message: `Email campaign "${campaignName}" created successfully with ${response.data.recipientCount} recipients.`,
          },
        });
      } catch (error: any) {
        console.error("Error creating campaign:", error);
        setShowProgress(false);

        setIsSubmitting(false);
        setSubmissionStatus("error");

        // Extract more detailed error message if available
        let errorMessage = "Failed to create campaign. Please try again.";
        if (
          error.response &&
          error.response.data &&
          error.response.data.error
        ) {
          errorMessage = error.response.data.error;
        } else if (error.message) {
          errorMessage = error.message;
        }

        setSubmissionError(errorMessage);
      }
    } else {
      setIsSubmitting(false);
      setSubmissionStatus("idle");
    }
  };

  const handleFileChange = (newFile: File | null) => {
    setFile(newFile);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Transform clusters for the dropdown
  const clusterOptions = clusters.map((cluster) => ({
    value: cluster.value,
    label: `${cluster.label} (${cluster.count} recipients)`,
  }));

  return (
    <Layout onLogout={handleLogout} user={user}>
      {/* Use PageHeader with small size and subheading */}
      <PageHeader
        title="Create new email campaign"
        subheading="Create a new email campaign and compose email"
        size="small"
        showBackButton={true}
        onBack={() => navigate("/dashboard")}
        overlayImage={overlayImage}
        action={
          <div className="flex justify-end">
            <Button
              onClick={() => navigate("/campaigns")}
              variant="secondary"
              size="md"
            >
              View Existing Campaigns
            </Button>
          </div>
        }
      />

      {/* Increased padding between header and form */}
      <div className="container mx-auto px-4 md:px-6 py-10">
        {/* Error display */}
        {submissionError && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{submissionError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-4xl">
          {/* Campaign name field */}
          <TextInput
            id="campaignName"
            label="Campaign name"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="Insert email campaign name"
            error={errors.campaignName}
            required
            className="mb-6"
            labelClassName="text-lg font-bold"
          />

          {/* Compose email section header */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-700">
              Compose text email
            </h2>
            <p className="text-sm text-gray-600">Fill all the information</p>
          </div>

          {/* From Email field */}
          <TextInput
            id="fromEmail"
            label="Email"
            type="email"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            placeholder="From email"
            error={errors.fromEmail}
            required
            disabled
          />

          {/* Recipients (clusters) dropdown */}
          <div className="mb-6 flex items-center">
            <label
              htmlFor="recipients"
              className="w-1/4 text-sm font-medium text-gray-700"
            >
              Recipients <span className="text-red-500">*</span>
            </label>
            <div className="w-3/4">
              <CustomSelect
                value={clusterId}
                onChange={(val) => setClusterId(val)}
                options={clusterOptions}
                placeholder={
                  fetchingClusters
                    ? "Loading audience segments..."
                    : "Select recipient audience"
                }
                size="md"
                length="full"
                disabled={fetchingClusters || clusters.length === 0}
              />
              {errors.clusterId && (
                <p className="text-sm text-red-500 mt-1">{errors.clusterId}</p>
              )}
              {selectedRecipientCount > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  This audience contains {selectedRecipientCount} email
                  recipients
                </p>
              )}
              {selectedClusterDetails && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                  <p>
                    <span className="font-medium">Description:</span>{" "}
                    {selectedClusterDetails.description}
                  </p>
                  {selectedClusterDetails.primaryInterest && (
                    <p>
                      <span className="font-medium">Primary Interest:</span>{" "}
                      {selectedClusterDetails.primaryInterest}
                    </p>
                  )}
                  {selectedClusterDetails.primaryDomainType && (
                    <p>
                      <span className="font-medium">Domain Type:</span>{" "}
                      {selectedClusterDetails.primaryDomainType}
                    </p>
                  )}
                </div>
              )}
              {clusters.length === 0 && !fetchingClusters && (
                <p className="text-sm text-amber-600 mt-1">
                  No audience segments available. Please contact an
                  administrator.
                </p>
              )}
            </div>
          </div>

          {/* Subject field */}
          <TextInput
            id="subject"
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject"
            error={errors.subject}
            required
          />

          {/* Email Body */}
          <MsgArea
            id="emailBody"
            label="Email Body"
            value={plainBody}
            onChange={(e) => setPlainBody(e.target.value)}
            placeholder="Enter your plain-text message"
            className="mb-6"
            labelClassName="text-base text-sm font-medium text-gray-700"
            required
            error={errors.plainBody}
          />

          {/* File upload */}
          <FileUpload
            id="dropzone-file"
            label="Insert attachments"
            onChange={handleFileChange}
          />

          {/* HTML Editor */}
          <TextArea
            id="htmlContent"
            label="HTML (optional)"
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            placeholder="<html>"
            className="mb-8"
          />

          {/* Form buttons */}
          <div className="flex justify-end w-full">
            <Button
              variant="outline"
              className="mr-3"
              onClick={() => navigate("/campaigns")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full max-w-48"
              disabled={
                isSubmitting || fetchingClusters || clusters.length === 0
              }
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                "Send Email"
              )}
            </Button>
          </div>
        </form>
      </div>
      {showProgress && (
        <ProgressOverlay progress={progress} details={progressDetails} />
      )}
    </Layout>
  );
};

export default NewCampaign;
