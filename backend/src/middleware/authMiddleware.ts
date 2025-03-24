import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { verifyAccessToken } from "../utils/jwtUtils";

// JWT authentication middleware
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }
    
    req.user = user;
    next();
  })(req, res, next);
};

// Session-based authentication (keep for backwards compatibility)
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Manual JWT verification from Authorization header (alternative to passport-jwt)
export const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "No token provided" });
  }
  
  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);
  
  if (!payload) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
  
  // Attach user info to request
  req.user = payload;
  next();
};

// Middleware to check if user has admin role (example)
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Assuming user has a role field
  // If you want to implement role-based access control,
  // add a role field to your User model
  if ((req.user as any).role !== 'admin') {
    return res.status(403).json({ message: "Access denied - Admin rights required" });
  }
  
  next();
};