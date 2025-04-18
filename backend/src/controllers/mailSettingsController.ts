import { Request, Response } from 'express';

export const getEmailSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const verifiedSender = process.env.SENDGRID_VERIFIED_SENDER;
    
    res.json({
      verifiedSender: verifiedSender || null,
      hasSendgridConfig: !!process.env.SENDGRID_API_KEY,
      emailProvider: 'SendGrid',
      dailyLimit: 100 // SendGrid free tier limit
    });
  } catch (error) {
    console.error('Error fetching email settings:', error);
    res.status(500).json({ error: 'Failed to fetch email settings' });
  }
};
