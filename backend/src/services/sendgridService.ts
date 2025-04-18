import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Configure SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

// Get the verified sender email from env vars
const VERIFIED_SENDER = process.env.SENDGRID_VERIFIED_SENDER;

/**
 * Interface for email data structure
 */
export interface EmailData {
  to: string;
  from: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: any[];
  campaignId?: string;
  trackingSettings?: {
    clickTracking?: { enable: boolean };
    openTracking?: { enable: boolean };
  };
  customArgs?: {
    [key: string]: string;
  };
}

/**
 * Send a single email using SendGrid
 */
export const sendEmail = async (emailData: EmailData): Promise<any> => {
  try {
    // ALWAYS enable tracking - this is crucial for getting events
    emailData.trackingSettings = {
      clickTracking: { enable: true },
      openTracking: { enable: true }
    };

    // Initialize customArgs if it doesn't exist
    if (!emailData.customArgs) {
      emailData.customArgs = {};
    }
    
    // CRITICAL: Always add campaignId to customArgs
    if (emailData.campaignId) {
      emailData.customArgs.campaignId = emailData.campaignId;
      console.log(`Adding campaignId ${emailData.campaignId} to email customArgs`);
    } else {
      console.warn(`No campaignId provided for email to ${emailData.to} - tracking won't work!`);
    }

    // IMPORTANT: Override the from email with the verified sender if available
    const fromEmail = VERIFIED_SENDER || emailData.from;
    
    console.log(`Sending email to ${emailData.to} from ${fromEmail} (original: ${emailData.from})`);

    const msg = {
      to: emailData.to,
      from: fromEmail, // Use verified sender
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
      attachments: emailData.attachments,
      trackingSettings: emailData.trackingSettings,
      customArgs: emailData.customArgs  // Now contains campaignId
    };

    // Log the custom args for verification
    console.log(`Email customArgs:`, JSON.stringify(msg.customArgs));

    const response = await sgMail.send(msg);
    return response;
  } catch (error) {
    console.error('Error sending email via SendGrid:', error);
    throw error;
  }
};

/**
 * Prepare file attachments for SendGrid
 * Converts file paths to base64 encoded content
 */
export const prepareAttachments = (filePaths: string[]): any[] => {
  return filePaths.map(path => {
    try {
      const content = fs.readFileSync(path, { encoding: 'base64' });
      const filename = path.split('/').pop() || 'attachment';
      
      return {
        content,
        filename,
        type: 'application/octet-stream',
        disposition: 'attachment'
      };
    } catch (err) {
      console.error(`Error preparing attachment ${path}:`, err);
      return null;
    }
  }).filter(attachment => attachment !== null);
};

/**
 * Send emails in batches to avoid rate limits
 */
export const sendBulkEmails = async (emails: EmailData[], batchSize = 100): Promise<any[]> => {
  try {
    const results = [];
    
    // Ensure all emails in batch have campaignId in customArgs
    emails = emails.map(email => {
      // Initialize customArgs if needed
      if (!email.customArgs) {
        email.customArgs = {};
      }
      
      // Always set campaignId in customArgs if available
      if (email.campaignId) {
        email.customArgs.campaignId = email.campaignId;
      }
      
      // Always enable tracking
      email.trackingSettings = {
        clickTracking: { enable: true },
        openTracking: { enable: true }
      };
      
      // Use verified sender
      email.from = VERIFIED_SENDER || email.from;
      
      return email;
    });
    
    // Process emails in batches
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const response = await sgMail.send(batch);
      results.push(response);
      
      // Sleep briefly between batches to avoid rate limits
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error sending bulk emails via SendGrid:', error);
    throw error;
  }
};




/**
 * Prepare an email configuration without sending it
 * Useful for testing the configuration
 */
export const prepareEmail = (emailData: EmailData): any => {
  // Configure tracking settings to always be enabled
  const trackingSettings = {
    clickTracking: { enable: true },
    openTracking: { enable: true }
  };

  // Initialize customArgs if needed
  let customArgs = emailData.customArgs || {};
  
  // Always add campaignId to customArgs
  if (emailData.campaignId) {
    customArgs.campaignId = emailData.campaignId;
  }

  // Use verified sender if available
  const fromEmail = VERIFIED_SENDER || emailData.from;
  
  // Return the prepared email configuration
  return {
    to: emailData.to,
    from: fromEmail,
    subject: emailData.subject,
    text: emailData.text,
    html: emailData.html,
    attachments: emailData.attachments,
    trackingSettings,
    customArgs
  };
};