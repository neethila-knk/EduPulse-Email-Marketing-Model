import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { verifyAccessToken } from "../utils/jwtUtils";
import User from "../models/User";


export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, async (err: any, user: any) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }
    
   
    if (user.isActive === false) {
      return res.status(403).json({ 
        message: "Your account has been deactivated. Please contact support for assistance.",
        error: "ACCOUNT_DEACTIVATED"
      });
    }
    
    req.user = user;
    next();
  })(req, res, next);
};


export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {

    const user = req.user as any;
    if (user && user.isActive === false) {
      return res.status(403).json({ 
        message: "Your account has been deactivated. Please contact support for assistance.",
        error: "ACCOUNT_DEACTIVATED"
      });
    }
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};


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
  

  User.findById(payload.id)
    .then(user => {
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      if (user.isActive === false) {
        return res.status(403).json({ 
          message: "Your account has been deactivated. Please contact support for assistance.",
          error: "ACCOUNT_DEACTIVATED"
        });
      }
      
    
      req.user = user as Express.User;

      next();
    })
    .catch(err => {
      console.error("Token verification error:", err);
      return res.status(500).json({ message: "Internal server error" });
    });
};

export default { authenticateJWT, isAuthenticated, verifyJWT };