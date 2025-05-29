import Campaign from "../models/Campaign";

export interface SendGridEvent {
  sg_message_id: string;
  event: string;
  email: string;
  timestamp: number;
  ip?: string;
  url?: string;
  useragent?: string;
  "smtp-id"?: string;
  category?: string[];
  campaignId?: string;
  customArgs?: {
    campaignId?: string;
    [key: string]: string | undefined;
  };
  [key: string]: any;
}

export const processEmailEvent = async (
  event: SendGridEvent
): Promise<void> => {
  try {
    const campaignId = event.campaignId || event.customArgs?.campaignId;

    if (!campaignId) {
      if (event.email === "example@test.com") {
        console.log("Skipping SendGrid test event");
        return;
      }

      console.warn("Campaign ID not found in event:", event);
      return;
    }

    console.log(`Processing ${event.event} event for campaign ${campaignId}`);

    let updateQuery: { [key: string]: any } = {};

    switch (event.event) {
      case "open":
        updateQuery = { $inc: { "metrics.opens": 1 } };
        break;
      case "click":
        updateQuery = { $inc: { "metrics.clicks": 1 } };
        break;
      case "bounce":
      case "dropped":
      case "deferred":
        updateQuery = { $inc: { "metrics.bounces": 1 } };
        break;
      case "spamreport":
      case "unsubscribe":
        updateQuery = { $inc: { "metrics.unsubscribes": 1 } };
        break;
      case "delivered":
        console.log(`Delivery confirmed for email to ${event.email}`);
        break;
      default:
        return;
    }

    if (Object.keys(updateQuery).length > 0) {
      try {
        const result = await Campaign.findByIdAndUpdate(
          campaignId,
          updateQuery,
          { new: true }
        );

        if (result) {
          console.log(
            `Updated campaign ${campaignId} metrics for ${event.event} event. New metrics:`,
            result.metrics
          );
        } else {
          console.warn(
            `Campaign ${campaignId} not found in database for metric update`
          );
        }
      } catch (dbError) {
        console.error(
          `Database error updating campaign ${campaignId}:`,
          dbError
        );
      }
    }
  } catch (error) {
    console.error("Error processing email event:", error);
    throw error;
  }
};

export const calculateCampaignMetrics = (campaign: any) => {
  const metrics = campaign.metrics || {
    opens: 0,
    clicks: 0,
    bounces: 0,
    unsubscribes: 0,
  };
  const recipientCount = campaign.recipientCount || 0;

  const openRate =
    recipientCount > 0 ? (metrics.opens / recipientCount) * 100 : 0;

  const clickThroughRate =
    metrics.opens > 0 ? (metrics.clicks / metrics.opens) * 100 : 0;

  const conversions = Math.round(metrics.clicks * 0.1);
  const conversionRate =
    metrics.clicks > 0 ? (conversions / metrics.clicks) * 100 : 0;

  return {
    openRate: parseFloat(openRate.toFixed(2)),
    clickThroughRate: parseFloat(clickThroughRate.toFixed(2)),
    conversions,
    conversionRate: parseFloat(conversionRate.toFixed(2)),
  };
};
