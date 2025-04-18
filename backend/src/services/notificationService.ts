// src/services/notificationService.ts
import mongoose from 'mongoose';
import Notification from '../models/Notification';
import Campaign from '../models/Campaign';

/**
 * Service for creating system notifications
 */
export const createSystemNotification = async (
  userId: mongoose.Types.ObjectId,
  title: string,
  message: string,
  link?: string
) => {
  try {
    const notification = new Notification({
      userId,
      title,
      message,
      type: 'system',
      link,
      read: false,
      createdAt: new Date(),
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating system notification:', error);
    throw error;
  }
};

/**
 * Create campaign-related notifications
 */
export const createCampaignNotification = async (
  userId: mongoose.Types.ObjectId,
  campaignId: mongoose.Types.ObjectId,
  status: string,
  emailsSent?: number
) => {
  try {
    // Get campaign details
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }
    
    let title = '';
    let message = '';
    
    // Generate notification content based on status
    switch (status) {
      case 'completed':
        title = 'Campaign Completed';
        message = `Your campaign "${campaign.campaignName}" has been successfully completed. ${emailsSent || 'All'} emails were sent.`;
        break;
      case 'failed':
        title = 'Campaign Failed';
        message = `There was an issue with your campaign "${campaign.campaignName}". Please check the campaign details.`;
        break;
      case 'canceled':
        title = 'Campaign Canceled';
        message = `Your campaign "${campaign.campaignName}" has been canceled.`;
        break;
      case 'sent':
        title = 'Campaign Sent';
        message = `Your campaign "${campaign.campaignName}" has been sent and is now being delivered.`;
        break;
      default:
        title = 'Campaign Update';
        message = `Your campaign "${campaign.campaignName}" status has been updated to ${status}.`;
    }
    
    // Create the notification
    const notification = new Notification({
      userId,
      title,
      message,
      type: 'campaign',
      link: `/campaigns/${campaignId}`,
      read: false,
      createdAt: new Date(),
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating campaign notification:', error);
    throw error;
  }
};

/**
 * Send alert notification to user
 */
export const createAlertNotification = async (
  userId: mongoose.Types.ObjectId,
  title: string,
  message: string,
  link?: string
) => {
  try {
    const notification = new Notification({
      userId,
      title,
      message,
      type: 'alert',
      link,
      read: false,
      createdAt: new Date(),
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating alert notification:', error);
    throw error;
  }
};

/**
 * Clean up old notifications
 * This could be run as a scheduled task
 */
export const cleanupOldNotifications = async (daysToKeep = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate }
    });
    
    console.log(`Cleaned up ${result.deletedCount} old notifications`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
    throw error;
  }
};

/**
 * Use this in the campaign controller to generate notifications when campaigns change status
 */
export const handleCampaignStatusChange = async (
  campaign: any,
  oldStatus: string,
  newStatus: string
) => {
  if (oldStatus !== newStatus) {
    await createCampaignNotification(
      campaign.userId,
      campaign._id,
      newStatus,
      campaign.recipientCount
    );
  }
};