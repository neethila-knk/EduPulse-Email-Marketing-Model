import express from 'express';
import { handleSendGridWebhook, handleClickTracking, testSendGridWebhook } from '../controllers/webhookController';

const router = express.Router();

router.post('/sendgrid', 
  express.raw({ type: 'application/json' }), 
  handleSendGridWebhook
);


router.get('/sendgrid', testSendGridWebhook);


router.get('/click', handleClickTracking);

router.get('/sendgrid', (req, res) => {
    res.status(200).json({
      message: "SendGrid webhook endpoint is available. POST requests will be processed.",
      status: "OK",
      info: "Configure this URL in SendGrid dashboard as your webhook endpoint."
    });
  });
export default router;