import express, { NextFunction, Request, Response } from "express";
import passport from "passport";
import User from "../models/User";
import nodemailer from "nodemailer";
import {
  generateTokens,
  verifyRefreshToken,
  generateAccessToken,
} from "../utils/jwtUtils";
import { authenticateJWT } from "../middleware/authMiddleware";
import { Document } from "mongoose";

const router = express.Router();

// Define a type for the user object with Mongoose document properties
interface UserDocument extends Document {
  username: string;
  email: string;
  password?: string;
  refreshToken?: string;
  [key: string]: any; // Allow other properties
}

// Registration route
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    // Check if the email is already registered
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      res.status(400).json({ message: "Email is already registered" });
      return;
    }

    // Check if the username is already taken
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      res.status(400).json({ message: "Username is already taken" });
      return;
    }

    // Create the user
    const user = new User({
      username,
      email,
      password,
      provider: "local",
    });
    await user.save();

    // Generate JWT tokens
    const tokens = generateTokens(user);

    // Store refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(201).json({
      message: "User registered successfully",
      ...tokens,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        provider: user.provider,
      },
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

// Login route
router.post("/login", (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("local", (err: any, user: any, info: any) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: info.message || "Login failed" });
    }

    // Generate JWT tokens
    const tokens = generateTokens(user);

    // Store refresh token in database
    User.findByIdAndUpdate(user._id, { refreshToken: tokens.refreshToken })
      .then(() => {
        // Log in user (session-based auth, optional)
        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          }

          // Set session expiration if using sessions alongside JWT
          if (req.body.rememberMe) {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
          } else {
            req.session.cookie.expires = undefined; // Session cookie
          }

          // Return user info and tokens
          return res.json({
            message: "Login successful",
            ...tokens,
            user: {
              id: user._id,
              username: user.username,
              email: user.email,
              provider: user.provider,
            },
          });
        });
      })
      .catch((err) => {
        return res
          .status(500)
          .json({ message: "Error saving refresh token", error: err });
      });
  })(req, res, next);
});

// Logout route
router.get(
  "/logout",
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Invalidate refresh token
      if (req.user) {
        // Type assertion to access _id safely
        const userId = (req.user as UserDocument)._id;
        await User.findByIdAndUpdate(userId, { refreshToken: null });
      }

      // For session-based auth (optional)
      req.logout((err) => {
        if (err) return next(err);
        res.json({ message: "Logged out successfully" });
      });
    } catch (error) {
      res.status(500).json({ message: "Error during logout", error });
    }
  }
);

// Refresh token route
router.post(
  "/refresh-token",
  async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ message: "Refresh token is required" });
      return;
    }

    try {
      // Verify the refresh token
      const payload = verifyRefreshToken(refreshToken);
      if (!payload) {
        res.status(401).json({ message: "Invalid or expired refresh token" });
        return;
      }

      // Find user and check if refresh token matches
      const user = await User.findById(payload.id);
      if (!user || user.refreshToken !== refreshToken) {
        res.status(401).json({ message: "Invalid refresh token" });
        return;
      }

      // Generate new access token
      const accessToken = generateAccessToken(user);

      res.json({ accessToken });
    } catch (error) {
      res.status(500).json({ message: "Error refreshing token", error });
    }
  }
);

// Get current user (protected route example)
router.get(
  "/me",
  authenticateJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // New version with type assertion
      const userId = (req.user as UserDocument)._id;
      const user = await User.findById(userId).select(
        "-password -refreshToken"
      );

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Return user data with profile image
      res.json({
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          provider: user.provider,
          profileImage: user.profileImage || user.picture || null,
        },
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Password Reset Route with professional email content
router.post(
  "/forgot-password",
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Generate a secure random token
      const token = require("crypto").randomBytes(32).toString("hex");
      user.resetPasswordToken = token;
      user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
      await user.save();

      // Create a professional transporter with proper configuration
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      // Company/App information
      const appName = process.env.APP_NAME || "EduPulse";
      const senderName = process.env.SENDER_NAME || "EduPulse Security";
      const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const companyAddress =
        process.env.COMPANY_ADDRESS ||
        "123 Education Lane, Suite 100, San Francisco, CA 94107";
      const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;

      // Create a professional HTML email
      const htmlEmail = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light">
      <meta name="supported-color-schemes" content="light">
      <title>Account Security: Password Reset</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333333;
          margin: 0;
          padding: 0;
          background-color: #f7f7f7;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .header {
          background-color: #157F1F;
          padding: 20px 30px;
        }
        .logo {
          color: white;
          font-size: 24px;
          font-weight: bold;
          text-decoration: none;
        }
        .content {
          padding: 30px;
        }
        .title {
          font-size: 21px;
          font-weight: 600;
          color: #2d2d2d;
          margin-top: 0;
          margin-bottom: 15px;
        }
        .message {
          font-size: 16px;
          margin-bottom: 24px;
          color: #4a4a4a;
        }
        .message p {
          margin: 0 0 16px;
        }
        .button {
          display: inline-block;
          background-color: #157F1F;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-weight: 500;
          font-size: 16px;
          margin: 8px 0 24px;
          text-align: center;
        }
        .security-info {
          background-color: #f8f9fa;
          padding: 16px;
          border-radius: 4px;
          margin-bottom: 24px;
          border-left: 4px solid #157F1F;
        }
        .security-info p {
          margin: 0;
          font-size: 14px;
          color: #555555;
        }
        .security-info strong {
          color: #157F1F;
        }
        .divider {
          height: 1px;
          background-color: #eeeeee;
          margin: 20px 0;
        }
        .footer {
          padding: 20px 30px;
          background-color: #f8f9fa;
          font-size: 13px;
          color: #666666;
          text-align: center;
        }
        .footer p {
          margin: 0 0 8px;
        }
        @media only screen and (max-width: 480px) {
          .container {
            border-radius: 0;
          }
          .content {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">${appName}</div>
        </div>
        <div class="content">
          <h1 class="title">Password Reset Request</h1>
          <div class="message">
            <p>Hello ${user.username || user.email.split("@")[0]},</p>
            <p>We received a request to reset the password for your ${appName} account. To proceed with resetting your password, please click the secure link below:</p>
          </div>
          
          <a href="${baseUrl}/reset-password/${token}" class="button" style="color: #ffffff !important; text-decoration: none;">Reset Your Password</a>
          
          <div class="security-info">
            <p><strong>Security Notice:</strong> This password reset link will expire in 1 hour. If you didn't request this password reset, please disregard this email - your account is still secure.</p>
          </div>
          
          <div class="message">
            <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
            <p style="word-break: break-all; font-size: 14px; color: #666666;">${baseUrl}/reset-password/${token}</p>
          </div>
          
          <div class="message">
            <p>Need assistance? Our support team is always here to help.</p>
            <p>Thank you for using ${appName}.</p>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
          <p>${companyAddress}</p>
          <p>
            <a href="mailto:${supportEmail}" style="color: #157F1F; text-decoration: none;">Contact Support</a> 
            | This is an automated message, please do not reply directly to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

      // Plain text alternative for email clients that don't support HTML
      const textEmail = `
Account Security: Password Reset for Your ${appName} Account

Hello ${user.username || user.email.split("@")[0]},

We received a request to reset the password for your ${appName} account. To proceed with resetting your password, please use the secure link below:

${baseUrl}/reset-password/${token}

SECURITY NOTICE: This password reset link will expire in 1 hour. If you didn't request this password reset, please disregard this email - your account is still secure.

Need assistance? Our support team is always here to help.

Thank you for using ${appName}.

© ${new Date().getFullYear()} ${appName}. All rights reserved.
${companyAddress}

This is an automated message, please do not reply directly to this email.
For support inquiries: ${supportEmail}
    `;

      // Professional email configuration
      const mailOptions = {
        to: user.email,
        from: `"${senderName}" <${process.env.EMAIL_USER}>`,
        subject: `Account Security: Password Reset for Your ${appName} Account`,
        text: textEmail,
        html: htmlEmail,
        headers: {
          Precedence: "Bulk",
          "X-Auto-Response-Suppress": "OOF, AutoReply",
          "X-Entity-Ref-ID": `reset-${Date.now()}-${user._id}`,
          "List-Unsubscribe": `<mailto:${process.env.EMAIL_USER}?subject=Unsubscribe>`,
        },
        replyTo: supportEmail,
      };

      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: "Password reset email sent" });
    } catch (error) {
      console.error("Error in forgot-password route:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  }
);
router.post(
  "/reset-password/:token",
  async (req: Request, res: Response): Promise<void> => {
    const { token } = req.params;
    const { password } = req.body;
    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        res
          .status(400)
          .json({ message: "Password reset token is invalid or has expired" });
        return;
      }

      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.status(200).json({ message: "Password has been reset" });
    } catch (error) {
      res.status(500).json({ error });
    }
  }
);

// Google OAuth Routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  (req: Request, res: Response) => {
    // Generate JWT tokens for OAuth user
    const tokens = generateTokens(req.user as UserDocument);

    // Store refresh token
    User.findByIdAndUpdate((req.user as UserDocument)._id, {
      refreshToken: tokens.refreshToken,
    })
      .then(() => {
        // Redirect to frontend with tokens
        const redirectUrl = `${
          process.env.FRONTEND_URL || "http://localhost:5173"
        }/oauth-success?accessToken=${tokens.accessToken}&refreshToken=${
          tokens.refreshToken
        }`;
        res.redirect(redirectUrl);
      })
      .catch((err) => {
        res.redirect("/login?error=internal");
      });
  }
);

export default router;
