// campaignService.ts
import { authApi } from './authUtils';
import { Campaign } from '../types';

// Define possible response types
interface ApiResponse {
  campaigns?: Campaign[];
  [key: string]: any; // Allow for other properties
}

// Sample fallback data in case API fails
const fallbackCampaigns: Campaign[] = [
  {
    id: "1",
    name: "Software engineering diploma",
    campaignName: "Software engineering diploma",
    emailCount: 1000,
    status: "sent"
  },
  {
    id: "2",
    name: "Mixing and mastering course",
    campaignName: "Mixing and mastering course",
    emailCount: 500,
    status: "canceled"
  },
  {
    id: "3",
    name: "Music producing free course",
    campaignName: "Music producing free course",
    emailCount: 5000,
    status: "completed"
  },
  {
    id: "4",
    name: "Computer hardware workshop",
    campaignName: "Computer hardware workshop",
    emailCount: 2500,
    status: "ongoing"
  }
];

// Function to fetch campaigns with correct API endpoint
export const fetchCampaigns = async (): Promise<{ campaigns: Campaign[], isError: boolean }> => {
  try {
    console.log('Fetching campaigns from correct endpoint: /api/campaigns');
    const response = await authApi.get<ApiResponse | Campaign[]>('/api/campaigns');
    
    if (response.status === 200) {
      // Check if we have an array
      if (Array.isArray(response.data)) {
        console.log(`Successfully fetched ${response.data.length} campaigns`);
        return { campaigns: response.data, isError: false };
      }
      
      // Check if data is nested in a property (common API pattern)
      // Use type assertion to tell TypeScript this is the ApiResponse type
      const responseData = response.data as ApiResponse;
      if (responseData && responseData.campaigns && Array.isArray(responseData.campaigns)) {
        console.log(`Successfully fetched ${responseData.campaigns.length} campaigns (nested)`);
        return { campaigns: responseData.campaigns, isError: false };
      }
      
      // If data exists but in wrong format, log the structure to help debugging
      if (response.data) {
        console.log('Received data but not in expected format:', 
          JSON.stringify(response.data).substring(0, 200) + '...');
      }
    }
    
    // If we get here, something went wrong with the response format
    console.log('Using fallback data due to unexpected response format');
    return { campaigns: fallbackCampaigns, isError: true };
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return { campaigns: fallbackCampaigns, isError: true };
  }
};

// Function to format campaign data in case it has different property names
export const normalizeCampaignData = (data: any[]): Campaign[] => {
    return data.map(item => {
      // Map MongoDB _id to id if needed
      const id = item.id || item._id || item.campaignId || String(Date.now());
      
      // Create a base campaign object with a default status
      const campaign: Campaign = {
        id: typeof id === 'object' ? id.toString() : id,
        name: item.name || item.campaignName || item.title || 'Unnamed Campaign',
        campaignName: item.name || item.campaignName || item.title || 'Unnamed Campaign',
        emailCount: item.emailCount || item.recipientCount || item.recipients || 0,
        status: "sent" // Changed default from "sent" to "sent"
      };
      
      // Get the incoming status
      const incomingStatus = item.status || 'sent';
      
      // Normalize status values with updated mapping
      if (['active', 'running', 'in_progress', 'ongoing'].includes(incomingStatus)) {
        campaign.status = "ongoing";
      } else if (['draft', 'scheduled', 'queued', 'sent'].includes(incomingStatus)) {
        campaign.status = "sent"; // Changed from "sent" to "sent"
      } else if (['sent', 'done', 'finished', 'completed'].includes(incomingStatus)) {
        campaign.status = "completed";
      } else if (['aborted', 'failed', 'stopped', 'cancelled', 'canceled'].includes(incomingStatus)) {
        campaign.status = "canceled";
      }
      
      return campaign;
    });
  };