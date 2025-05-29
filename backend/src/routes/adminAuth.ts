import express, { Request, Response } from "express";
import Admin from "../models/Admin";
import {
  generateAdminTokens,
  verifyAdminRefreshToken,
  generateAdminAccessToken,
} from "../utils/adminJwtUtils";
import {
  authenticateAdminJWT,
  authenticateAdminLocal,
  isSuperAdmin,
} from "../middleware/adminAuthMiddleware";
import bcrypt from "bcryptjs";
import User from "../models/User";
import {
  getDashboardStats,
  getNodeHealth,
  getRecentActivity,
  getSystemStatus,
} from "../controllers/adminController";
import adminCampaignRoutes from "./adminCampaignRoutes";

const router = express.Router();


router.post(
  "/admins",
  authenticateAdminJWT,
  isSuperAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, email, password } = req.body;

      
      const role = "admin";

      
      const existingAdmin = await Admin.findOne({
        $or: [{ email }, { username }],
      });
      if (existingAdmin) {
        res.status(409).json({
          message: "An admin with this email or username already exists.",
          errors: {
            email:
              existingAdmin.email === email
                ? "Email already exists"
                : undefined,
            username:
              existingAdmin.username === username
                ? "Username already exists"
                : undefined,
          },
        });
        return;
      }

    
      const newAdmin = new Admin({ username, email, password, role });
      await newAdmin.save();

      res.status(201).json({
        message: "Admin created successfully",
        admin: {
          id: newAdmin._id,
          username: newAdmin.username,
          email: newAdmin.email,
          role: newAdmin.role,
        },
      });
    } catch (error) {
      console.error("Error creating admin:", error);
      res.status(500).json({
        message: "An error occurred while creating the admin",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Admin login route

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;


    if (!email || !password) {
      res.status(400).json({
        message: "Email and password are required",
        errors: {
          email: !email ? "Email is required" : undefined,
          password: !password ? "Password is required" : undefined,
        },
      });
      return;
    }


    const admin = await Admin.findOne({ email });
    if (!admin) {
      res.status(401).json({
        message: "Invalid email",
        errors: {
          email: "No admin account found with this email",
        },
      });
      return;
    }

    
    if (admin.isActive === false) {
      res.status(403).json({
        message:
          "Your admin account has been deactivated. Please contact another administrator.",
        error: "ACCOUNT_DEACTIVATED",
        errors: {
          auth: "Account deactivated",
        },
      });
      return;
    }

  
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      res.status(401).json({
        message: "Incorrect password",
        errors: {
          password: "The password you entered is incorrect",
        },
      });
      return;
    }

    
    const tokens = generateAdminTokens(admin);

  
    admin.refreshToken = tokens.refreshToken;
    admin.lastLogin = new Date();
    await admin.save();

    res.status(200).json({
      message: "Login successful",
      ...tokens,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role, 
      },
    });
    return;
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      message: "An error occurred during login",
    });
    return;
  }
});

// Admin logout route
router.get(
  "/logout",
  authenticateAdminJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
    
      if (req.user) {
        await Admin.findByIdAndUpdate((req.user as any)._id, {
          refreshToken: null,
        });
      } else {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      res.status(200).json({
        message: "Logged out successfully",
      });
    } catch (error) {
      console.error("Admin logout error:", error);
      res.status(500).json({
        message: "An error occurred during logout",
      });
    }
  }
);


router.post(
  "/refresh-token",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          message: "Refresh token is required",
        });
        return;
      }

      
      const payload = verifyAdminRefreshToken(refreshToken);
      if (!payload) {
        res.status(401).json({
          message: "Invalid or expired refresh token",
        });
        return;
      }

      
      const admin = await Admin.findById(payload.id);
      if (!admin || admin.refreshToken !== refreshToken) {
        res.status(401).json({
          message: "Invalid refresh token",
        });
        return;
      }

     
      const accessToken = generateAdminAccessToken(admin);

      res.status(200).json({ accessToken });
      return;
    } catch (error) {
      console.error("Admin token refresh error:", error);
      res.status(500).json({
        message: "An error occurred during token refresh",
      });
      return;
    }
  }
);


router.get(
  "/me",
  authenticateAdminJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

     
      const admin = await Admin.findById((req.user as any)._id).select(
        "-password -refreshToken"
      );

      if (!admin) {
        res.status(404).json({
          message: "Admin not found",
        });
        return;
      }

      res.status(200).json({
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
        },
      });
    } catch (error) {
      console.error("Error fetching admin data:", error);
      res.status(500).json({
        message: "An error occurred while fetching admin data",
      });
    }
  }
);


router.put(
  "/users/:id/block",
  authenticateAdminJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.id;
      const { isActive } = req.body;

     
      if (typeof isActive !== "boolean") {
        res.status(400).json({
          message: "isActive must be a boolean value",
        });
        return;
      }

     
      const user = await User.findByIdAndUpdate(
        userId,
        { isActive: isActive },
        { new: true }
      ).select("-password -refreshToken");

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.status(200).json({
        message: isActive
          ? "User activated successfully"
          : "User blocked successfully",
        user: user,
      });
      return;
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({
        message: "Error updating user status",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return;
    }
  }
);


router.get(
  "/users",
  authenticateAdminJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      
      const users = await User.find(
        {},
        {
          username: 1,
          email: 1,
          createdAt: 1,
          lastLogin: 1,
          profileImage: 1,
          provider: 1,
          isActive: 1,
        }
      ).sort({ createdAt: -1 });

      res.status(200).json({ users });
      return;
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({
        message: "Error fetching users",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return;
    }
  }
);



router.get(
  "/users/:id",
  authenticateAdminJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.id;

      const user = await User.findById(userId).select(
        "-password -refreshToken"
      );
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.status(200).json({ user });
      return;
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({
        message: "Error fetching user",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return;
    }
  }
);


router.delete(
  "/users/:id",
  authenticateAdminJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.id;

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Delete user
      await User.findByIdAndDelete(userId);

      res.status(200).json({ message: "User deleted successfully" });
      return;
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({
        message: "Error deleting user",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return;
    }
  }
);

/**
 * @route   GET /api/admin/admins
 * @desc    Get all admins
 * @access  Admin
 */
router.get(
  "/admins",
  authenticateAdminJWT,
  isSuperAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
    
      const admins = await Admin.find(
        {},
        {
          username: 1,
          email: 1,
          createdAt: 1,
          lastLogin: 1,
          isActive: 1, 
        }
      ).sort({ createdAt: -1 });

      res.status(200).json({ admins });
      return;
    } catch (error) {
      console.error("Error fetching admins:", error);
      res.status(500).json({
        message: "Error fetching admins",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return;
    }
  }
);


router.put(
  "/admins/:id/block",
  authenticateAdminJWT,
  isSuperAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = req.params.id;
      const { isActive } = req.body;

      
      const currentAdmin = await Admin.findById((req.user as any)._id);

      
      const targetAdmin = await Admin.findById(adminId);
      if (!targetAdmin) {
        res.status(404).json({ message: "Admin not found" });
        return;
      }

     
      if (adminId === (req.user as any)._id.toString()) {
        res.status(400).json({ message: "You cannot block yourself" });
        return;
      }

      
      const updatedAdmin = await Admin.findByIdAndUpdate(
        adminId,
        { isActive: isActive },
        { new: true }
      ).select("-password -refreshToken");

      res.status(200).json({
        message: isActive
          ? "Admin activated successfully"
          : "Admin blocked successfully",
        admin: updatedAdmin,
      });
      return;
    } catch (error) {
      console.error("Error updating admin status:", error);
      res.status(500).json({
        message: "Error updating admin status",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return;
    }
  }
);


router.put(
  "/admins/:id/password",
  authenticateAdminJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = req.params.id;
      const { currentPassword, newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        res.status(400).json({
          message: "New password must be at least 6 characters long",
        });
        return;
      }

      const admin = await Admin.findById(adminId);
      if (!admin) {
        res.status(404).json({ message: "Admin not found" });
        return;
      }

      
      if (!currentPassword) {
        res.status(400).json({ message: "Current password is required" });
        return;
      }

      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
        res.status(400).json({ message: "Current password is incorrect" });
        return;
      }

      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      await Admin.findByIdAndUpdate(adminId, { password: hashedPassword });

      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Password update error:", error);
      res.status(500).json({
        message: "Error updating password",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);


router.delete(
  "/admins/:id",
  authenticateAdminJWT,
  isSuperAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = req.params.id;

      
      if (adminId === (req.user as any)._id.toString()) {
        res.status(400).json({ message: "You cannot delete your own account" });
        return;
      }

     
      const admin = await Admin.findById(adminId);
      if (!admin) {
        res.status(404).json({ message: "Admin not found" });
        return;
      }

      
      await Admin.findByIdAndDelete(adminId);

      res.status(200).json({ message: "Admin removed successfully" });
      return;
    } catch (error) {
      console.error("Error removing admin:", error);
      res.status(500).json({
        message: "Error removing admin",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return;
    }
  }
);

router.get("/dashboard/stats", authenticateAdminJWT, getDashboardStats);
router.get("/dashboard/stats", authenticateAdminJWT, getDashboardStats);
router.get("/dashboard/activity", authenticateAdminJWT, getRecentActivity);
router.get("/status", authenticateAdminJWT, getSystemStatus);
router.get("/health", getNodeHealth);

export default router;
