import express, { Request, Response } from "express";
import { authenticateJWT } from "../middleware/authMiddleware";
import User from "../models/User";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/profile-images");
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Filter for image files only
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Get user profile route
router.get("/profile", authenticateJWT, async (req: Request, res: Response) => {
  try {
    // We know req.user exists because of authenticateJWT middleware
    const userId = (req.user as any)._id;
    const user = await User.findById(userId).select("-password -refreshToken");
    
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    
    res.json({ user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user profile route
router.patch(
  "/profile", 
  authenticateJWT,
  upload.single("profileImage"),
  async (req: Request, res: Response) => {
    try {
      const { username, currentPassword, newPassword } = req.body;
      const userId = (req.user as any)._id;
      const user = await User.findById(userId);
      
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      
      const updateFields: Record<string, any> = {};
      
      // Validate and update username
      if (username && username !== user.username) {
        // Check if username is already taken
        const existingUser = await User.findOne({ username, _id: { $ne: user._id } });
        
        if (existingUser) {
          res.status(400).json({ message: "Username is already taken" });
          return;
        }
        
        updateFields.username = username;
      }
      
      // Handle profile image upload
      if (req.file) {
        // Remove old profile image if exists
        if (user.profileImage) {
          const oldImagePath = path.join(__dirname, "../uploads/profile-images", path.basename(user.profileImage));
          
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        
        // Set new profile image path
        const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        updateFields.profileImage = `${baseUrl}/uploads/profile-images/${req.file.filename}`;
      }
      
      // Handle password update
      if (currentPassword && newPassword) {
        // Verify current password if user is local auth
        if (user.provider === "local" && user.password) {
          const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
          
          if (!isPasswordValid) {
            res.status(400).json({ message: "Current password is incorrect" });
            return;
          }
          
          // Validate new password
          if (newPassword.length < 8) {
            res.status(400).json({ message: "New password must be at least 8 characters long" });
            return;
          }
          
          // Hash new password
          const salt = await bcrypt.genSalt(10);
          updateFields.password = await bcrypt.hash(newPassword, salt);
        } else {
          res.status(400).json({ message: "Password cannot be changed for OAuth accounts" });
          return;
        }
      }
      
      // Apply updates if there are any
      if (Object.keys(updateFields).length > 0) {
        const updatedUser = await User.findByIdAndUpdate(
          user._id,
          { $set: updateFields },
          { new: true }
        ).select("-password -refreshToken");
        
        res.json({
          message: "Profile updated successfully",
          user: updatedUser
        });
        return;
      }
      
      // No changes were made
      res.json({
        message: "No changes were made",
        user: await User.findById(user._id).select("-password -refreshToken")
      });
      
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Delete profile (account) route
router.delete(
  "/profile",
  authenticateJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { password } = req.body;
      const userId = (req.user as any)._id;
      const user = await User.findById(userId);
      
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      
      // For local accounts, verify the password
      if (user.provider === "local" && user.password) {
        if (!password) {
          res.status(400).json({ message: "Password is required to delete your account" });
          return;
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          res.status(400).json({ message: "Password is incorrect" });
          return;
        }
      }
      
      // Clean up profile image file if it exists
      if (user.profileImage) {
        const filename = path.basename(user.profileImage);
        const imagePath = path.join(__dirname, "../uploads/profile-images", filename);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      
      // Delete the user from the database
      await User.findByIdAndDelete(userId);
      
      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);


// Delete profile image route
router.delete(
  "/profile/image",
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)._id;
      const user = await User.findById(userId);
      
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      
      if (user.profileImage) {
        // Extract filename from path
        const filename = path.basename(user.profileImage);
        const imagePath = path.join(__dirname, "../uploads/profile-images", filename);
        
        // Remove file if it exists
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
        
        // Update user record
        user.profileImage = undefined;
        await user.save();
      }
      
      res.json({
        message: "Profile image removed successfully",
        user: await User.findById(user._id).select("-password -refreshToken")
      });
    } catch (error) {
      console.error("Error removing profile image:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;