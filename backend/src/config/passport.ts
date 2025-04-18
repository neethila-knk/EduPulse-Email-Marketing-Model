import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User";
import Admin from "../models/Admin";

// Helper to ensure ID compatibility with Passport
const ensureId = (doc: any) => {
  if (doc && !doc.id && doc._id) {
    doc.id = doc._id.toString();
  }
  return doc;
};

// Local Strategy
passport.use(
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const user = await User.findOne({ email, provider: "local" });
      if (!user) return done(null, false, { message: "Invalid email" });

      // Check if password exists on the user object
      if (!user.password) {
        return done(null, false, { message: "User has no password set (OAuth user)" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return done(null, false, { message: "Incorrect password" });

      return done(null, ensureId(user));
    } catch (err) {
      return done(err);
    }
  })
);

// Admin-local Strategy - UPDATED to check isActive status
passport.use("admin-local", new LocalStrategy(
  { usernameField: "email" },
  async (email, password, done) => {
    try {
      const admin = await Admin.findOne({ email });
      if (!admin) return done(null, false, { message: "Invalid email" });

      // Check if admin account is active
      if (admin.isActive === false) {
        return done(null, false, { 
          message: "Your admin account has been deactivated. Please contact another administrator." 
        });
      }

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) return done(null, false, { message: "Incorrect password" });

      return done(null, ensureId(admin));
    } catch (err) {
      return done(err);
    }
  }
));

// Add an admin-jwt strategy for verifying admin tokens
passport.use("admin-jwt", new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_ACCESS_SECRET || 'fallback_jwt_secret',
  },
  async (payload, done) => {
    try {
      const admin = await Admin.findById(payload.id);
      if (!admin) return done(null, false);
      
      // Check if admin account is active
      if (admin.isActive === false) {
        return done(null, false);
      }
      
      return done(null, ensureId(admin));
    } catch (error) {
      return done(error, false);
    }
  }
));

// JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'fallback_jwt_secret',
    },
    async (payload, done) => {
      try {
        const user = await User.findById(payload.id);
        if (!user) return done(null, false);
        return done(null, ensureId(user));
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// Google OAuth Strategy - With account blocking check
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: "/auth/google/callback",
      // Note: prompt and accessType will be passed in the auth route
      scope: ["profile", "email"]
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        // Store Google tokens for potential revocation during logout
        const googleTokens = { accessToken, refreshToken };

        // Check if user already exists with this OAuth provider ID
        let user = await User.findOne({ 
          providerId: profile.id,
          provider: "google" 
        });

        if (user) {
          // Check if the user account is blocked
          if (user.isActive === false) {
            return done(new Error("ACCOUNT_DEACTIVATED"), false);
          }

          // Update tokens on login
          user.googleTokens = googleTokens;
          await user.save();
          return done(null, ensureId(user));
        }

        // Check if user exists with same email
        const email = profile.emails && profile.emails[0].value;
        if (!email) {
          return done(new Error("No email found from Google account"), false);
        }
        
        user = await User.findOne({ email });
        
        if (user) {
          // Check if the user account is blocked - even if found by email
          if (user.isActive === false) {
            return done(new Error("ACCOUNT_DEACTIVATED"), false);
          }

          // User exists with this email - check the provider
          if (user.provider === 'local') {
            // This email is already registered with local auth
            return done(new Error(`This email (${email}) is already registered. Please sign in with your password instead.`), false);
          } else {
            // Email exists but with a different OAuth provider
            return done(new Error(`This email is already registered with ${user.provider}. Please use that login method.`), false);
          }
        }

        // Create a new user if email doesn't exist
        const newUser = await User.create({
          provider: "google",
          providerId: profile.id,
          email: email,
          username: `${profile.displayName.replace(/\s/g, "")}_${Math.floor(Math.random() * 1000)}`,
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName,
          picture: profile.photos?.[0].value,
          googleTokens: googleTokens, // Store tokens
          providerData: profile,
          isVerified: true, // Auto-verify OAuth users
          isActive: true // Ensure new users are active by default
        });

        return done(null, ensureId(newUser));
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// For existing session-based auth
passport.serializeUser((user: any, done) => {
  done(null, user.id || user._id.toString());
});

passport.deserializeUser(async (id: string, done) => {
  try {
    // Try to find user first
    let user = await User.findById(id);
    
    // If not a user, try to find admin
    if (!user) {
      const admin = await Admin.findById(id);
      if (admin) {
        return done(null, ensureId(admin));
      }
      return done(null, false);
    }
    
    return done(null, ensureId(user));
  } catch (err) {
    return done(err, false);
  }
});