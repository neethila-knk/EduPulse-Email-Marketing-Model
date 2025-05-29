import mongoose from "mongoose";
import bcrypt from "bcryptjs";


const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, 
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  refreshToken: String,
  profileImage: String,
  

  provider: { 
    type: String, 
    enum: ['local', 'google', 'facebook', 'twitter'],
    default: 'local' 
  },
  providerId: String,
  providerData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  
  googleTokens: {
    accessToken: String,
    refreshToken: String
  },
  
  picture: String,
  firstName: String,
  lastName: String,
  isVerified: { type: Boolean, default: false },
  
  
  isActive: { type: Boolean, default: true },

  lastLogin: { type: Date }
}, {
  timestamps: true
});


UserSchema.pre("save", async function(next) {
  
  if (!this.isModified("password") || this.provider !== 'local') {
    return next();
  }
  
  try {
    
    if (typeof this.password === 'string') {
      const salt = await bcrypt.genSalt(10);
     
      this.password = await bcrypt.hash(this.password, salt);
    }
    return next();
  } catch (error: any) {
    return next(error);
  }
});


interface UserDocument extends mongoose.Document {
  username: string;
  email: string;
  password?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  refreshToken?: string;
  profileImage?: string;
  provider: 'local' | 'google' | 'facebook' | 'twitter'; 
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
  isActive: boolean;
  lastLogin?: Date;
}


const User = mongoose.model<UserDocument>("User", UserSchema);
export default User;