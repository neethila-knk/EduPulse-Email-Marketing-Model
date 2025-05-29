import { Request, Response } from "express";
import { processEmailEvent, SendGridEvent } from "../services/trackingService";
import Campaign from "../models/Campaign";


export const handleSendGridWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("Received SendGrid webhook event");

    let events;

    try {
      const rawBody = req.body.toString("utf8");

      if (rawBody.length > 0) {
        const previewLength = Math.min(rawBody.length, 500);
        console.log(
          `Raw webhook body (first ${previewLength} chars): ${rawBody.substring(
            0,
            previewLength
          )}...`
        );
      } else {
        console.warn("Empty webhook payload received");
      }

      events = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("Error parsing webhook payload:", parseError);
      res.status(400).json({ error: "Invalid JSON in webhook payload" });
      return;
    }

    if (!Array.isArray(events)) {
      console.error(
        "Invalid webhook payload format, expected array but got:",
        typeof events
      );
      res.status(400).json({ error: "Invalid webhook payload format" });
      return;
    }

    console.log(`Processing ${events.length} SendGrid events`);

    const seenMessageIds = new Set<string>();

    for (const event of events) {
      const campaignId =
        event.campaignId || event.customArgs?.campaignId || null;
      const messageId = event.sg_message_id;

      console.log(
        `Event: ${event.event}, Email: ${event.email}, CampaignId: ${
          campaignId || "none"
        }`
      );

      
      if (!campaignId) {
        console.log("Skipping event with missing campaignId");
        continue;
      }

      if (messageId && seenMessageIds.has(messageId)) {
        console.log(`Skipping duplicate message ID: ${messageId}`);
        continue;
      }
      if (messageId) seenMessageIds.add(messageId);

      try {
        const campaign = await Campaign.findById(campaignId);

        if (!campaign) {
          console.log(`Skipping: Campaign ${campaignId} not found`);
          continue;
        }

        const skipStatuses = ["draft", "cancelled", "failed", "completed"];
        if (skipStatuses.includes(campaign.status)) {
          console.log(
            "Skipping metrics update: Campaign is in status",
            campaign.status
          );
          return;
        }

        await processEmailEvent(event as SendGridEvent);
      } catch (eventError) {
        console.error(
          `Error processing event for campaign ${campaignId}:`,
          eventError
        );
      }
    }

    res.status(200).json({ success: true, processed: events.length });
    console.log(`Processed ${events.length} SendGrid events`);
  } catch (error) {
    console.error("Error handling SendGrid webhook:", error);

    res.status(200).json({
      success: false,
      message: "Received but failed to process all events",
    });
  }
};


export const testSendGridWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    res.status(200).json({
      message:
        "SendGrid webhook endpoint is available. POST requests will be processed.",
      status: "OK",
      info: "Configure this URL in SendGrid dashboard as your webhook endpoint.",
    });
  } catch (error) {
    console.error("Error in test endpoint:", error);
    res.status(500).json({ error: "Server error" });
  }
};


export const handleClickTracking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { campaignId, redirectUrl } = req.query;

    if (typeof campaignId === "string") {
      await processEmailEvent({
        event: "click",
        sg_message_id: "custom",
        email: "unknown@example.com",
        timestamp: Math.floor(Date.now() / 1000),
        campaignId,
      } as SendGridEvent);
    }

    if (typeof redirectUrl === "string") {
      res.redirect(redirectUrl);
    } else {
      res.status(400).json({ error: "Missing redirect URL" });
    }
  } catch (error) {
    console.error("Error handling click tracking:", error);
    res.status(500).json({ error: "Failed to process click" });
  }
};
