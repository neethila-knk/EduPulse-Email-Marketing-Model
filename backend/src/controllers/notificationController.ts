// controllers/notificationController.ts
import { Request, Response } from 'express';
import Notification from '../models/Notification';
import { ObjectId } from 'mongodb';

// Get user notifications with pagination
export const getUserNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userId = new ObjectId(req.user._id);
    const { limit = 10, skip = 0, read } = req.query;
    
    console.log(`Fetching notifications for user ${userId}, limit: ${limit}, skip: ${skip}`);
    
    const filter: any = { userId };
    if (read !== undefined) {
      filter.read = read === 'true';
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .lean();

    const unreadCount = await Notification.countDocuments({ 
      userId, 
      read: false 
    });

    console.log(`Found ${notifications.length} notifications, ${unreadCount} unread`);

    res.json({
      notifications,
      unreadCount,
      hasMore: notifications.length === Number(limit)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Mark notifications as read
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userId = new ObjectId(req.user._id);
    const { ids } = req.body;
    
    if (ids && Array.isArray(ids)) {
      // Mark specific notifications as read
      console.log(`Marking ${ids.length} notifications as read for user ${userId}`);
      await Notification.updateMany(
        { 
          userId,
          _id: { $in: ids.map(id => new ObjectId(id)) }
        },
        { $set: { read: true } }
      );
    } else {
      // Mark all as read
      console.log(`Marking all notifications as read for user ${userId}`);
      await Notification.updateMany(
        { userId, read: false },
        { $set: { read: true } }
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
};

// Create a test notification (for debugging)
export const createTestNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userId = new ObjectId(req.user._id);
    const { title, message, type = 'system' } = req.body;
    
    console.log(`Creating test notification for user ${userId}`);
    
    const notification = new Notification({
      userId,
      title: title || "Test Notification",
      message: message || "This is a test notification",
      type,
      read: false,
      createdAt: new Date()
    });
    
    await notification.save();
    console.log('Test notification created:', notification._id);
    
    res.status(201).json({ 
      success: true, 
      message: "Test notification created", 
      notification 
    });
  } catch (error) {
    console.error("Error creating test notification:", error);
    res.status(500).json({ error: "Failed to create test notification" });
  }
};


// Clear all notifications for a user
export const clearAllNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
  
      const userId = new ObjectId(req.user._id);
      
      console.log(`Clearing all notifications for user ${userId}`);
      
      // Delete all notifications for this user
      const result = await Notification.deleteMany({ userId });
      
      console.log(`Deleted ${result.deletedCount} notifications`);
      
      res.json({ 
        success: true, 
        message: `Cleared ${result.deletedCount} notifications` 
      });
    } catch (error) {
      console.error("Error clearing notifications:", error);
      res.status(500).json({ error: "Failed to clear notifications" });
    }
  };