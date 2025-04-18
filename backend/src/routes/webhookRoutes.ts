import express from 'express';
import { handleSendGridWebhook, handleClickTracking, testSendGridWebhook } from '../controllers/webhookController';

const router = express.Router();

/**
 * SendGrid webhook endpoint for processing email events
 * This should be publicly accessible and configured in SendGrid settings
 * 
 * IMPORTANT: We use express.raw() middleware ONLY for this route
 */
router.post('/sendgrid', 
  express.raw({ type: 'application/json' }), // This middleware is crucial!
  handleSendGridWebhook
);

/**
 * GET endpoint for testing webhook URL accessibility
 */
router.get('/sendgrid', testSendGridWebhook);

/**
 * Custom click tracking endpoint
 */
router.get('/click', handleClickTracking);

router.get('/sendgrid', (req, res) => {
    res.status(200).json({
      message: "SendGrid webhook endpoint is available. POST requests will be processed.",
      status: "OK",
      info: "Configure this URL in SendGrid dashboard as your webhook endpoint."
    });
  });
export default router;