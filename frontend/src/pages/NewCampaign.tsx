import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import PageHeader from '../components/Layout/PageHeader';
import Button from '../components/UI/Button';
import TextInput from '../components/UI/TextInput';
import TextArea from '../components/UI/TextArea';
import Select from '../components/UI/Select';
import FileUpload from '../components/UI/FileUpload';
import { authApi, isAuthenticated } from '../utils/authUtils';
import overlayImage from "../assets/elements.svg";

interface User {
  id: string;
  username: string;
  email: string;
  provider: string;
}

interface AuthResponse {
  user: User;
}

interface FormErrors {
  campaignName?: string;
  subject?: string;
  fromEmail?: string;
  recipients?: string;
}

const NewCampaign: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Form state
  const [campaignName, setCampaignName] = useState('');
  const [subject, setSubject] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [recipients, setRecipients] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [htmlContent, setHtmlContent] = useState('<html>\n\n</html>');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recipient options
  const recipientOptions = [
    { value: 'all', label: 'All Subscribers' },
    { value: 'active', label: 'Active Users' },
    { value: 'inactive', label: 'Inactive Users' },
  ];
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Validate campaign name
    if (!campaignName.trim()) {
      newErrors.campaignName = 'Campaign name is required';
    }
    
    // Validate subject
    if (!subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    // Validate email
    if (!fromEmail.trim()) {
      newErrors.fromEmail = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(fromEmail)) {
      newErrors.fromEmail = 'Invalid email address';
    }
    
    // Validate recipients
    if (!recipients) {
      newErrors.recipients = 'Please select recipients';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    document.title = "New Campaign | EduPulse";

    // Check if user is authenticated
    if (!isAuthenticated()) {
      navigate('/login', { state: { message: 'Please log in to create a campaign' } });
      return;
    }
    
    const fetchUserData = async () => {
      try {
        const response = await authApi.get<AuthResponse>('/auth/me');
        setUser(response.data.user);
      } catch (error) {
        console.error('Error fetching user data:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/login', { state: { message: 'Your session has expired. Please log in again.' } });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authApi.get('/auth/logout');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (validateForm()) {
      console.log({
        campaignName,
        subject,
        fromEmail,
        recipients,
        file,
        htmlContent
      });
      
      // Here you would make your API call
      // For now, simulate a successful submission
      setTimeout(() => {
        setIsSubmitting(false);
        navigate('/campaigns');
      }, 1000);
    } else {
      setIsSubmitting(false);
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
  
  return (
    <Layout onLogout={handleLogout} user={user}>
      {/* Use PageHeader with small size and subheading */}
      <PageHeader 
        title="Create new email campaign"
        subheading="Create a new email campaign and compose email"
        size="small"
        showBackButton={true}
        onBack={() => navigate('/campaigns')}
        overlayImage={overlayImage}
      />
      
      {/* Increased padding between header and form */}
      <div className="container mx-auto px-4 md:px-6 py-10">
        <form 
          onSubmit={handleSubmit} 
          className="max-w-4xl"
        >
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
            <h2 className="text-lg font-bold text-gray-700">Compose text email</h2>
            <p className="text-sm text-gray-600">Fill all the information</p>
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
          />
          
          {/* Recipients dropdown */}
          <Select
            id="recipients"
            label="Recipients"
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            options={recipientOptions}
            placeholder="Select Recipients"
            error={errors.recipients}
            required
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
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="primary"
              size="md"
              className="w-full max-w-48"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default NewCampaign;