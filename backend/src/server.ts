import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import MongoStore from "connect-mongo";
import path from "path";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import profileRoutes from "./routes/profileRoutes"; 
import "./config/passport";
import clusteringRoutes from "./routes/clusteringRoutes";
import adminAuthRoutes from "./routes/adminAuth";
import userClustersRouter from "./routes/userClustersRouter";
import campaignRoutes from "./routes/campaignRoutes"; 
import webhookRoutes from "./routes/webhookRoutes"; 

import './services/emailQueueService';
console.log('Email queue worker initialized');
import emailSettingsRoutes from './routes/emailSettingsRoutes';
import notificationRoutes from "./routes/notificationRoutes";
import searchRoutes from "./routes/searchRoutes";
import emailExtractionRoutes from "./routes/emailExtractionRoutes";
import jobUpdateEndpoint from "./routes/jobUpdateEndpoint";
import { initEmailExtractionCleanup } from "./services/emailExtractionCleanupService";
import adminCampaignRoutes from "./routes/adminCampaignRoutes";



dotenv.config();
connectDB();

const app = express();


app.use('/api/webhooks', webhookRoutes);


// Standard middleware
app.use(express.json());
app.use(cors({ 
  origin: process.env.FRONTEND_URL || "http://localhost:5173", 
  credentials: true,

  exposedHeaders: ["Set-Cookie"],
}));


app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
      mongoUrl: process.env.MONGO_URI,
      collectionName: 'sessions',
      autoRemove: 'native',
      
      serialize: (session) => {
        if (!session || !session.passport) {
          return {};
        }
        return session;
      }
    }),
    cookie: { 
      secure: process.env.NODE_ENV === 'production', 
      httpOnly: true, 
      maxAge: 24 * 60 * 60 * 1000, 
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Add session debugging middleware in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    //console.log('Session ID:', req.sessionID);
    //console.log('Session data:', req.session);
    next();
  });
}

// Middleware to clear Google cookies on certain paths
app.use('/auth/google', (req, res, next) => {
  // Clear any existing Google session cookies
  res.clearCookie('G_AUTHUSER_H');
  res.clearCookie('G_ENABLED_IDPS');
  next();
});

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routes
app.use("/auth", authRoutes);
app.use("/api", profileRoutes);
app.use('/api', clusteringRoutes);
app.use("/admin", adminAuthRoutes);
// Register admin campaign routes
app.use("/admin", adminCampaignRoutes);

app.use('/api/admin', adminAuthRoutes); 
app.use("/api/search", searchRoutes);
app.use("/api/notifications", notificationRoutes);



app.use("/api/user-clusters", userClustersRouter);


app.use("/api/campaigns", campaignRoutes);

app.use('/api/settings', emailSettingsRoutes);


app.use("/api/email-extraction", emailExtractionRoutes);


app.use("/api/email-extraction", jobUpdateEndpoint);


initEmailExtractionCleanup();



app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error', message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));









//Testing routes


app.get("/api/test/send-email-detailed", async (req, res): Promise<void> => {
  try {
    const sgMail = require("@sendgrid/mail");
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

    // Get parameters from query or use defaults
    const to = req.query.to?.toString() || "neethilakumararatne17@gmail.com"; // CHANGE THIS to your email
    const from =
      req.query.from?.toString() || process.env.SENDGRID_VERIFIED_SENDER;

    // Validate required fields
    if (!from) {
      res.status(400).json({
        success: false,
        message: "Missing verified sender email",
        solution:
          "Add SENDGRID_VERIFIED_SENDER to your .env file with a verified email address",
      });
      return;
    }

    console.log(`Preparing to send test email from ${from} to ${to}`);

    const testEmail = {
      to,
      from,
      subject: "Test Email from API",
      text: "This is a test email sent directly from the API to verify SendGrid is working",
      html: "<p>This is a test email sent directly from the API to verify SendGrid is working</p>",
    };

    console.log("[TEST] Sending test email with data:", testEmail);
    const response = await sgMail.send(testEmail);
    console.log("[TEST] Email sent successfully:", response);

    res.json({
      success: true,
      message: "Test email sent successfully",
      statusCode: response[0].statusCode,
      headers: response[0].headers,
      emailDetails: {
        from,
        to,
        verifiedSender:
          process.env.SENDGRID_VERIFIED_SENDER || "Not configured",
      },
    });
  } catch (error: any) {
    console.error("[TEST] Error sending test email:", error);

    let errorDetails = "Unknown error";
    let possibleSolution = "";

    // Extract detailed error information
    if (error.response && error.response.body) {
      errorDetails = JSON.stringify(error.response.body);

      // Look for common errors and suggest solutions
      if (error.code === 403) {
        possibleSolution =
          "Verify your sender email in SendGrid dashboard: Settings > Sender Authentication > Single Sender Verification";
      } else if (error.code === 401) {
        possibleSolution =
          "Check your SendGrid API key is correct and has Mail Send permissions";
      }
    }

    res.status(500).json({
      success: false,
      message: "Failed to send test email",
      error: error.message,
      errorCode: error.code,
      errorDetails,
      possibleSolution,
      apiKey: process.env.SENDGRID_API_KEY
        ? "API key is configured (starts with: " +
          process.env.SENDGRID_API_KEY.substring(0, 5) +
          "...)"
        : "API key is missing",
      verifiedSender: process.env.SENDGRID_VERIFIED_SENDER || "Not configured",
    });
  }
});

// Queue status endpoint
app.get("/api/test/queue-status", async (req, res) => {
  try {
    // Import the queue
    const emailQueue = require("./services/emailQueueService").default;

    // Get queue counts
    const waitingCount = await emailQueue.getWaitingCount();
    const activeCount = await emailQueue.getActiveCount();
    const completedCount = await emailQueue.getCompletedCount();
    const failedCount = await emailQueue.getFailedCount();
    const delayedCount = await emailQueue.getDelayedCount();

    // Get the most recent failed jobs
    const failedJobs = await emailQueue.getFailed(0, 10);

    // Define Job interface
    interface Job {
      id: string;
      data: {
        to: string;
        from: string;
        campaignId: string;
      };
      attemptsMade: number;
      failedReason: string;
    }

    // Format failed jobs for display
    const formattedFailedJobs = failedJobs.map((job: Job) => ({
      id: job.id,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
      to: job.data.to,
      from: job.data.from,
      campaignId: job.data.campaignId,
    }));

    // Define Campaign interface
    interface Campaign {
      _id: string;
      campaignName: string;
      recipientCount: number;
      createdAt: Date;
    }

    // Get campaigns that are in 'sending' status
    const Campaign = require("./models/Campaign").default;
    const sendingCampaigns = await Campaign.find({ status: "sending" }).lean();

    // Return comprehensive status
    res.json({
      queueCounts: {
        waiting: waitingCount,
        active: activeCount,
        completed: completedCount,
        failed: failedCount,
        delayed: delayedCount,
        total: waitingCount + activeCount + failedCount + delayedCount,
      },
      recentFailedJobs: formattedFailedJobs,
      sendingCampaigns: sendingCampaigns.map((campaign: Campaign) => ({
        id: campaign._id,
        name: campaign.campaignName,
        recipientCount: campaign.recipientCount,
        createdAt: campaign.createdAt,
      })),
      systemInfo: {
        redisHost: process.env.REDIS_HOST,
        redisPort: process.env.REDIS_PORT,
        sendgridVerifiedSender: process.env.SENDGRID_VERIFIED_SENDER,
        hasSendgridKey: !!process.env.SENDGRID_API_KEY,
      },
    });
  } catch (error: unknown) {
    console.error("Error getting queue status:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      error: "Failed to get queue status",
      message: errorMessage,
    });
  }
});

// Test endpoint to verify email configuration
app.get("/api/test/email-config", async (req, res) => {
  try {
    // Create a test email with a fake campaign ID
    const testEmail = {
      to: "kneethila@gmail.com", // This won't actually be sent
      from:
        process.env.SENDGRID_VERIFIED_SENDER || "noreply@edupulsesrilanka.online",
      subject: "Test Email Configuration",
      text: "This is just a test of email configuration",
      html: "<p>This is just a test of email configuration</p>",
      campaignId: "test-campaign-id-123", // Fake campaign ID for testing
    };

    // Just use the prepareEmail function directly
    const { prepareEmail } = require("./services/sendgridService");

    // This will process the email through your configuration logic without sending
    const preparedEmail = prepareEmail(testEmail);

    // Check if campaign ID is included in customArgs
    const hasCustomArgs =
      preparedEmail.customArgs !== undefined &&
      preparedEmail.customArgs !== null;

    const hasCampaignId =
      hasCustomArgs &&
      preparedEmail.customArgs.campaignId === testEmail.campaignId;

    // Check if tracking is enabled
    const hasTracking =
      preparedEmail.trackingSettings !== undefined &&
      preparedEmail.trackingSettings.clickTracking?.enable === true &&
      preparedEmail.trackingSettings.openTracking?.enable === true;

    // Return diagnostic information
    res.json({
      success: true,
      emailConfiguration: {
        from: preparedEmail.from,
        to: preparedEmail.to,
        subject: preparedEmail.subject,
        trackingEnabled: hasTracking,
        customArgs: preparedEmail.customArgs || {},
        campaignIdIncluded: hasCampaignId,
      },
      diagnostics: {
        usesVerifiedSender:
          preparedEmail.from === process.env.SENDGRID_VERIFIED_SENDER,
        verifiedSender:
          process.env.SENDGRID_VERIFIED_SENDER || "Not configured",
      },
      isCorrectlyConfigured: hasCampaignId && hasTracking,
      message:
        hasCampaignId && hasTracking
          ? "Email is correctly configured with campaignId in customArgs and tracking enabled"
          : "Email is NOT correctly configured. Fix your sendgridService.ts file!",
    });
  } catch (error) {
    console.error("Error testing email configuration:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Failed to test email configuration",
    });
  }
});

// Add this endpoint to your server.ts file

// Queue management endpoint
app.get("/api/admin/queue/manage", async (req, res) => {
  try {
    // Import the queue
    const emailQueue = require("./services/emailQueueService").default;

    // Get the action from query parameter
    const action = req.query.action;

    if (action === "clear") {
      // Clear all jobs from the queue
      await emailQueue.empty();

      // Update any stuck campaigns to "failed" status
      const Campaign = require("./models/Campaign").default;
      await Campaign.updateMany(
        { status: "sending" },
        { $set: { status: "failed", updatedAt: new Date() } }
      );

      res.json({
        success: true,
        message:
          "Queue cleared successfully and stuck campaigns marked as failed",
      });
    } else if (action === "status") {
      // Get queue stats
      const counts = await Promise.all([
        emailQueue.getActiveCount(),
        emailQueue.getWaitingCount(),
        emailQueue.getDelayedCount(),
        emailQueue.getFailedCount(),
        emailQueue.getCompletedCount(),
      ]);

      res.json({
        success: true,
        queueStatus: {
          active: counts[0],
          waiting: counts[1],
          delayed: counts[2],
          failed: counts[3],
          completed: counts[4],
          total: counts.reduce((a, b) => a + b, 0),
        },
      });
    } else {
      res
        .status(400)
        .json({ error: 'Invalid action. Use "clear" or "status".' });
    }
  } catch (error) {
    console.error("Error managing queue:", error);
    res.status(500).json({ error: "Failed to manage queue" });
  }
});

export default app;
