import Bull from 'bull';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { sendEmail, EmailData, prepareAttachments } from './sendgridService';
import Campaign from '../models/Campaign';

dotenv.config();

// Configure Redis connection for Bull queue
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
};

// Create a queue with rate limiting
const emailQueue = new Bull('email-queue', {
  redis: redisConfig,
  limiter: {
    max: 50, // Maximum jobs per interval
    duration: 1000 // Interval in milliseconds (1 second)
  }
});

/**
 * Email job structure with recipient information
 */
export interface EmailJob extends EmailData {
  campaignId: string;
  userId: string;
}

/**
 * Add emails to the processing queue
 */
export const queueEmails = async (emails: EmailJob[]): Promise<void> => {
  try {
    if (!emails.length) {
      throw new Error('No emails to queue');
    }

    // Group emails by campaign for tracking
    const campaignIds = [...new Set(emails.map(email => email.campaignId))];
    
    // Update campaign status to 'sending'
    for (const campaignId of campaignIds) {
      await Campaign.findByIdAndUpdate(
        campaignId,
        { 
          status: 'sending', 
          updatedAt: new Date() 
        }
      );
    }

    // Add each email as a job to the queue
    const jobs = emails.map(email => ({
      data: email,
      opts: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000 // 5 seconds
        },
        removeOnComplete: true
      }
    }));

    await emailQueue.addBulk(jobs);
    
    console.log(`Queued ${emails.length} emails for ${campaignIds.length} campaigns`);
  } catch (error) {
    console.error('Error adding emails to queue:', error);
    throw error;
  }
};

// Process jobs (emails) in the queue
emailQueue.process(async (job) => {
  const emailData: EmailJob = job.data;
  
  try {
    // Send the individual email
    await sendEmail(emailData);
    
    return { success: true, to: emailData.to };
  } catch (error) {
    console.error(`Error processing email to ${emailData.to}:`, error);
    throw error;
  }
});

// When a job is completed successfully
emailQueue.on('completed', async (job) => {
  // Could be used for additional tracking if needed
});

// When a job fails
emailQueue.on('failed', async (job, err) => {
  const emailData: EmailJob = job.data;
  console.error(`Failed to send email to ${emailData.to} for campaign ${emailData.campaignId}:`, err.message);
  
  // After max retries, update campaign metrics
  // Check if job.opts and job.opts.attempts exist before accessing
  const maxAttempts = job.opts?.attempts || 3; // Default to 3 if undefined
  
  if (job.attemptsMade >= maxAttempts) {
    try {
      await Campaign.findByIdAndUpdate(
        emailData.campaignId,
        { $inc: { 'metrics.bounces': 1 } }
      );
    } catch (updateErr) {
      console.error(`Error updating bounce metrics for campaign ${emailData.campaignId}:`, updateErr);
    }
  }
});

// When all jobs in the queue are finished
emailQueue.on('drained', async () => {
  try {
    // Find campaigns with status 'sending'
    const pendingCampaigns = await Campaign.find({ status: 'sending' });
    
    for (const campaign of pendingCampaigns) {
      // Check if there are any active jobs for this campaign
      const activeJobs = await emailQueue.getJobs(['active', 'waiting', 'delayed']);
      
      // Access campaign._id safely with type assertion
      const campaignId = campaign._id as mongoose.Types.ObjectId;
      
      const campaignJobs = activeJobs.filter(
        job => job.data.campaignId === campaignId.toString()
      );
      
      // If no active jobs, campaign is complete
      if (campaignJobs.length === 0) {
        await Campaign.findByIdAndUpdate(
          campaignId,
          { 
            status: 'sent', 
            sentAt: new Date(),
            updatedAt: new Date() 
          }
        );
      }
    }
  } catch (error) {
    console.error('Error updating campaign statuses after queue drain:', error);
  }
});

// Export everything needed by other modules
export { emailQueue };
export default emailQueue;