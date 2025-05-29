import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();


sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');


const VERIFIED_SENDER = process.env.SENDGRID_VERIFIED_SENDER;


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


export const sendEmail = async (emailData: EmailData): Promise<any> => {
  try {

    emailData.trackingSettings = {
      clickTracking: { enable: true },
      openTracking: { enable: true }
    };

    
    if (!emailData.customArgs) {
      emailData.customArgs = {};
    }
    

    if (emailData.campaignId) {
      emailData.customArgs.campaignId = emailData.campaignId;
      console.log(`Adding campaignId ${emailData.campaignId} to email customArgs`);
    } else {
      console.warn(`No campaignId provided for email to ${emailData.to} - tracking won't work!`);
    }

    
    const fromEmail = VERIFIED_SENDER || emailData.from;
    
    console.log(`Sending email to ${emailData.to} from ${fromEmail} (original: ${emailData.from})`);

    const msg = {
      to: emailData.to,
      from: fromEmail, 
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
      attachments: emailData.attachments,
      trackingSettings: emailData.trackingSettings,
      customArgs: emailData.customArgs  
    };

   
    console.log(`Email customArgs:`, JSON.stringify(msg.customArgs));

    const response = await sgMail.send(msg);
    return response;
  } catch (error) {
    console.error('Error sending email via SendGrid:', error);
    throw error;
  }
};


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


export const sendBulkEmails = async (emails: EmailData[], batchSize = 100): Promise<any[]> => {
  try {
    const results = [];
    

    emails = emails.map(email => {

      if (!email.customArgs) {
        email.customArgs = {};
      }
      
      
      if (email.campaignId) {
        email.customArgs.campaignId = email.campaignId;
      }
      
     
      email.trackingSettings = {
        clickTracking: { enable: true },
        openTracking: { enable: true }
      };
      
      
      email.from = VERIFIED_SENDER || email.from;
      
      return email;
    });
    
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const response = await sgMail.send(batch);
      results.push(response);
      
      
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


export const prepareEmail = (emailData: EmailData): any => {
  
  const trackingSettings = {
    clickTracking: { enable: true },
    openTracking: { enable: true }
  };

  
  let customArgs = emailData.customArgs || {};
  
 
  if (emailData.campaignId) {
    customArgs.campaignId = emailData.campaignId;
  }

 
  const fromEmail = VERIFIED_SENDER || emailData.from;
  

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