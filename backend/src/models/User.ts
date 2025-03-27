import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Define a schema that includes TypeScript type safety
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Not required for OAuth users
  profileImage: { type: String }, // URL to profile image
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  refreshToken: String,
  
  // OAuth fields
  provider: { 
    type: String, 
    enum: ['local', 'google'], 
    default: 'local' 
  },
  providerId: String,
  providerData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  picture: String, // From OAuth provider (will be used as profileImage if no custom image)
  firstName: String,
  lastName: String,
  isVerified: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Virtual property to get profile image (custom or from provider)
UserSchema.virtual('displayImage').get(function() {
  return this.profileImage || this.picture || null;
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
  profileImage?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  refreshToken?: string;
  provider: 'local' | 'google';
  providerId?: string;
  providerData?: any;
  picture?: string;
  firstName?: string;
  lastName?: string;
  isVerified: boolean;
  displayImage?: string;
}

// Create and export the model with type information
const User = mongoose.model<UserDocument>("User", UserSchema);
export default User;