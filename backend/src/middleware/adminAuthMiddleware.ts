import { Request, Response, NextFunction, RequestHandler } from "express";
import passport from "passport";
import { verifyAdminAccessToken } from "../utils/adminJwtUtils";
import Admin from "../models/Admin";


export const authenticateAdminJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      message: "Access denied. Admin authentication required.",
    });
    return;
  }

  const token = authHeader.split(" ")[1];
  const payload = verifyAdminAccessToken(token);

  if (!payload) {
    res.status(401).json({
      message: "Invalid or expired admin token.",
    });
    return;
  }

  try {
 
    const admin = await Admin.findById(payload.id);
    if (!admin) {
      res.status(401).json({
        message: "Admin account not found.",
      });
      return;
    }

    
    if (admin.isActive === false) {
      res.status(403).json({
        message:
          "Your admin account has been deactivated. Please contact another administrator.",
        error: "ACCOUNT_DEACTIVATED",
      });
      return;
    }


    (req as any).user = admin;
    next();
  } catch (error) {
    console.error("Admin authentication error:", error);
    res.status(500).json({
      message: "Authentication error. Please try again.",
    });
  }
};

// Passport admin-local strategy middleware
export const authenticateAdminLocal = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  passport.authenticate(
    "admin-local",
    { session: false },
    (err: any, admin: any, info: any) => {
      if (err) {
        console.error("Admin authentication error:", err);
        res.status(500).json({
          message: "Authentication error occurred",
        });
        return;
      }

      if (!admin) {
        let errorMessage = "Invalid admin credentials";
        let errorField = "email";
        let errorType = "AUTH_FAILED";

        if (info) {
          if (info.message.includes("deactivated")) {
            errorMessage =
              "Your admin account has been deactivated. Please contact another administrator.";
            errorField = "auth";
            errorType = "ACCOUNT_DEACTIVATED";
          } else if (info.message.includes("email")) {
            errorMessage = "Admin account not found";
          } else if (info.message.includes("password")) {
            errorMessage = "Incorrect password";
            errorField = "password";
          }
        }

        res.status(401).json({
          message: errorMessage,
          error: errorType,
          errors: { [errorField]: errorMessage },
        });
        return;
      }

      
      if (admin.isActive === false) {
        res.status(403).json({
          message:
            "Your admin account has been deactivated. Please contact another administrator.",
          error: "ACCOUNT_DEACTIVATED",
          errors: { auth: "Account deactivated" },
        });
        return;
      }

      (req as any).user = admin;
      next();
    }
  )(req, res, next);
};


export const isSuperAdmin: RequestHandler = async (req, res, next) => {
  try {
    const admin = req.user as any;
    if (!admin || admin.role !== "super_admin") {
      res.status(403).json({
        message: "Access denied. Super admin privileges required.",
      });
      return;
    }
    next();
  } catch (error) {
    console.error("Super admin check error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
};

export default { authenticateAdminJWT, authenticateAdminLocal };
