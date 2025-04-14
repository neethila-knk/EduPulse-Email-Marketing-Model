import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Define the User schema with isActive field
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Not required for OAuth users
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  refreshToken: String,
  profileImage: String,
  
  // OAuth fields
  provider: { 
    type: String, 
    enum: ['local', 'google', 'facebook', 'twitter'], // Add more providers as needed
    default: 'local' 
  },
  providerId: String,
  providerData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Store Google tokens for revocation during logout
  googleTokens: {
    accessToken: String,
    refreshToken: String
  },
  
  picture: String,
  firstName: String,
  lastName: String,
  isVerified: { type: Boolean, default: false },
  
  // Account status field - NEW
  isActive: { type: Boolean, default: true },
  
  // Track last login time
  lastLogin: { type: Date }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre("save", async function(next) {
  // Only hash the password if it's modified and provider is local
  if (!this.isModified("password") || this.provider !== 'local') {
    return next();
  }
  
  try {
    // Make sure password exists and is a string
    if (typeof this.password === 'string') {
      const salt = await bcrypt.genSalt(10);
      // Store the result back to this.password
      this.password = await bcrypt.hash(this.password, salt);
    }
    return next();
  } catch (error: any) {
    return next(error);
  }
});

// Ensure TypeScript infers the right types
interface UserDocument extends mongoose.Document {
  username: string;
  email: string;
  password?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  refreshToken?: string;
  profileImage?: string;
  provider: 'local' | 'google' | 'facebook' | 'twitter'; // Add more as needed
  providerId?: string;
  providerData?: any;
  googleTokens?: {
    accessToken?: string;
    refreshToken?: string;
  };
  picture?: string;
  firstName?: string;
  lastName?: string;
  isVerified: boolean;
  isActive: boolean; // NEW field
  lastLogin?: Date;
}

// Create and export the model with type information
const User = mongoose.model<UserDocument>("User", UserSchema);
export default User;