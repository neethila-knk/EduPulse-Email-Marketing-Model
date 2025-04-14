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

const router = express.Router();

// Create admin - accessible only to super_admin
// Create admin - accessible only to super_admin
router.post(
  "/admins",
  authenticateAdminJWT,
  isSuperAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, email, password } = req.body;

      // Sanitize: Force role to "admin" (prevent frontend override)
      const role = "admin";

      // Check if email or username already exists
      const existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] });
      if (existingAdmin) {
        res.status(409).json({
          message: "An admin with this email or username already exists.",
          errors: {
            email: existingAdmin.email === email ? "Email already exists" : undefined,
            username: existingAdmin.username === username ? "Username already exists" : undefined,
          }
        });
        return;
      }

      // Create and save the admin
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

    // Validate inputs
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

    // Find admin by email
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

    // Check if admin account is active
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

    // Compare passwords
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

    // Generate JWT tokens
    const tokens = generateAdminTokens(admin);

    // Store refresh token and update last login
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
        role: admin.role  // Make sure to include this!
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
      // Use type assertion to access _id safely
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

// Admin refresh token route
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

      // Verify the refresh token
      const payload = verifyAdminRefreshToken(refreshToken);
      if (!payload) {
        res.status(401).json({
          message: "Invalid or expired refresh token",
        });
        return;
      }

      // Find admin and check if refresh token matches
      const admin = await Admin.findById(payload.id);
      if (!admin || admin.refreshToken !== refreshToken) {
        res.status(401).json({
          message: "Invalid refresh token",
        });
        return;
      }

      // Generate new access token
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

// Get current admin (protected route)
router.get(
  "/me",
  authenticateAdminJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      // Use type assertion to access _id safely
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

/**
 * @route   PUT /api/admin/users/:id/block
 * @desc    Block or unblock a user
 * @access  Admin
 */
router.put(
  "/users/:id/block",
  authenticateAdminJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.id;
      const { isActive } = req.body;

      // Ensure isActive is a boolean
      if (typeof isActive !== "boolean") {
        res.status(400).json({
          message: "isActive must be a boolean value",
        });
        return;
      }

      // Find and update the user
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

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Admin
 */
router.get(
  "/users",
  authenticateAdminJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Get only the fields we need for display
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

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user by ID
 * @access  Admin
 */
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

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete a user
 * @access  Admin
 */
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
  authenticateAdminJWT, isSuperAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Get all admins but exclude sensitive fields
      const admins = await Admin.find(
        {},
        {
          username: 1,
          email: 1,
          createdAt: 1,
          lastLogin: 1,
          isActive: 1, // Include active status
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

/**
 * @route   PUT /api/admin/admins/:id/block
 * @desc    Block/Unblock an admin
 * @access  Admin
 */
router.put(
  "/admins/:id/block",
  authenticateAdminJWT,isSuperAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = req.params.id;
      const { isActive } = req.body;

      // Get the current admin (the one making the request)
      const currentAdmin = await Admin.findById((req.user as any)._id);

      // Check if admin exists
      const targetAdmin = await Admin.findById(adminId);
      if (!targetAdmin) {
        res.status(404).json({ message: "Admin not found" });
        return;
      }

      // Prevent admin from blocking themselves
      if (adminId === (req.user as any)._id.toString()) {
        res.status(400).json({ message: "You cannot block yourself" });
        return;
      }

      // Update admin status
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

/**
 * @route   PUT /api/admin/admins/:id/password
 * @desc    Update admin password
 * @access  Admin
 */
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

      // ✅ Always require and validate currentPassword
      if (!currentPassword) {
        res.status(400).json({ message: "Current password is required" });
        return;
      }

      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
        res.status(400).json({ message: "Current password is incorrect" });
        return;
      }

      // ✅ Update password
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


/**
 * @route   DELETE /api/admin/admins/:id
 * @desc    Remove an admin
 * @access  Admin
 */
router.delete(
  "/admins/:id",
  authenticateAdminJWT, isSuperAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = req.params.id;

      // Prevent admin from deleting themselves
      if (adminId === (req.user as any)._id.toString()) {
        res.status(400).json({ message: "You cannot delete your own account" });
        return;
      }

      // Check if admin exists
      const admin = await Admin.findById(adminId);
      if (!admin) {
        res.status(404).json({ message: "Admin not found" });
        return;
      }

      // Delete admin
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

export default router;
