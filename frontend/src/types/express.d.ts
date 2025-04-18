// express.d.ts
import { Document, Types } from "mongoose";

// Extend Express namespace to include User interface
declare global {
  namespace Express {
    interface User extends Document {
      id?: string; // Add id property for Passport compatibility
      _id: string | Types.ObjectId; // Allow ObjectId type to prevent errors
      username: string;
      email: string;
      password?: string;
      refreshToken?: string;
      lastLogin?: Date;
      createdAt: string;
      isActive: boolean;
      role: string;
      [key: string]: any;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};