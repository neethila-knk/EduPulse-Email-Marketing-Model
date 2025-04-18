import Campaign from '../models/Campaign';

/**
 * Interface for SendGrid event data
 */
export interface SendGridEvent {
  sg_message_id: string;
  event: string;
  email: string;
  timestamp: number;
  ip?: string;
  url?: string;
  useragent?: string;
  'smtp-id'?: string;
  category?: string[];
  campaignId?: string;  // Direct property - adding this!
  customArgs?: {
    campaignId?: string;
    [key: string]: string | undefined;
  };
  [key: string]: any;
}

/**
 * Process SendGrid webhook events
 */
export const processEmailEvent = async (event: SendGridEvent): Promise<void> => {
  try {
    // Get campaign ID from either direct property or custom arguments
    const campaignId = event.campaignId || event.customArgs?.campaignId;
    
    if (!campaignId) {
      // For test events from SendGrid, log but don't treat as error
      if (event.email === 'example@test.com') {
        console.log('Skipping SendGrid test event');
        return;
      }
      
      console.warn('Campaign ID not found in event:', event);
      return;
    }
    
    console.log(`Processing ${event.event} event for campaign ${campaignId}`);
    
    // Update metrics based on event type
    let updateQuery: { [key: string]: any } = {};
    
    switch (event.event) {
      case 'open':
        updateQuery = { $inc: { 'metrics.opens': 1 } };
        break;
      case 'click':
        updateQuery = { $inc: { 'metrics.clicks': 1 } };
        break;
      case 'bounce':
      case 'dropped':
      case 'deferred':
        updateQuery = { $inc: { 'metrics.bounces': 1 } };
        break;
      case 'spamreport':
      case 'unsubscribe':
        updateQuery = { $inc: { 'metrics.unsubscribes': 1 } };
        break;
      case 'delivered':
        // Could track successful deliveries if needed
        console.log(`Delivery confirmed for email to ${event.email}`);
        break;
      default:
        // No action for other event types
        return;
    }
    
    // Apply the update if we have a valid query
    if (Object.keys(updateQuery).length > 0) {
      try {
        const result = await Campaign.findByIdAndUpdate(
          campaignId,
          updateQuery,
          { new: true }
        );
        
        if (result) {
          console.log(`Updated campaign ${campaignId} metrics for ${event.event} event. New metrics:`, result.metrics);
        } else {
          console.warn(`Campaign ${campaignId} not found in database for metric update`);
        }
      } catch (dbError) {
        console.error(`Database error updating campaign ${campaignId}:`, dbError);
      }
    }
  } catch (error) {
    console.error('Error processing email event:', error);
    throw error;
  }
};

/**
 * Calculate derived metrics for campaign analytics
 */
export const calculateCampaignMetrics = (campaign: any) => {
  // Ensure metrics exist with defaults if missing
  const metrics = campaign.metrics || { opens: 0, clicks: 0, bounces: 0, unsubscribes: 0 };
  const recipientCount = campaign.recipientCount || 0;
  
  // Calculate percentages (with null checks to prevent NaN)
  const openRate = recipientCount > 0 
    ? (metrics.opens / recipientCount) * 100 
    : 0;
  
  const clickThroughRate = metrics.opens > 0 
    ? (metrics.clicks / metrics.opens) * 100 
    : 0;
  
  // For conversion rate, we'll say it's 10% of clicks for now
  // In a real app, you'd track actual conversions
  const conversions = Math.round(metrics.clicks * 0.1);
  const conversionRate = metrics.clicks > 0 
    ? (conversions / metrics.clicks) * 100 
    : 0;
  
  return {
    openRate: parseFloat(openRate.toFixed(2)),
    clickThroughRate: parseFloat(clickThroughRate.toFixed(2)),
    conversions,
    conversionRate: parseFloat(conversionRate.toFixed(2))
  };
};