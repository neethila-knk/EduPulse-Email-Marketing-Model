import { Document } from 'mongoose';

// Extend Express namespace to include User interface
declare global {
  namespace Express {
    // Define User interface to match Mongoose document
    interface User extends Document {
      _id: string; // Required MongoDB document ID
      username: string;
      email: string;
      password?: string;
      refreshToken?: string;
      lastLogin?: Date;
      createdAt: string; // Add required createdAt field
      isActive: boolean; // Add required isActive field
      role: string; // Add required role field
      [key: string]: any; // Allow other properties
    }
  }
}

export {};