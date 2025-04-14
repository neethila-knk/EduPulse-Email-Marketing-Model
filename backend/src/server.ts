import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import MongoStore from "connect-mongo";
import path from "path";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import profileRoutes from "./routes/profileRoutes"; // Import the new profile routes
import "./config/passport";
import clusteringRoutes from "./routes/clusteringRoutes";
import adminAuthRoutes from "./routes/adminAuth";

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(cors({ 
  origin: process.env.FRONTEND_URL || "http://localhost:5173", 
  credentials: true,
  // Add exposing headers for OAuth token cookies
  exposedHeaders: ["Set-Cookie"],
}));

// Improved session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
      mongoUrl: process.env.MONGO_URI,
      collectionName: 'sessions',
      autoRemove: 'native',
      // Improved serialization
      serialize: (session) => {
        if (!session || !session.passport) {
          return {};
        }
        return session;
      }
    }),
    cookie: { 
      secure: process.env.NODE_ENV === 'production', // Secure in production
      httpOnly: true, 
      maxAge: 24 * 60 * 60 * 1000, // 1 day 
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Add session debugging middleware in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log('Session ID:', req.sessionID);
    console.log('Session data:', req.session);
    next();
  });
}

// Middleware to clear Google cookies on certain paths
app.use('/auth/google', (req, res, next) => {
  // Clear any existing Google session cookies
  res.clearCookie('G_AUTHUSER_H');
  res.clearCookie('G_ENABLED_IDPS');
  next();
});

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Mount routes
app.use("/auth", authRoutes);
app.use("/api", profileRoutes);
app.use('/api', clusteringRoutes);
app.use("/admin", adminAuthRoutes);
app.use('/api/admin', adminAuthRoutes); // User management routes



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));