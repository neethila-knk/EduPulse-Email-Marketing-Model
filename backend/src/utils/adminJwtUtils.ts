import jwt from 'jsonwebtoken';

// Define interfaces for token payload and response
interface TokenPayload {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

// Generate access token for admin
export const generateAdminAccessToken = (admin: any): string => {
  const payload: TokenPayload = {
    id: admin._id.toString(),
    email: admin.email,
    username: admin.username,
    isAdmin: true
  };
  
  return jwt.sign(
    payload, 
    process.env.ADMIN_JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET || 'admin_fallback_jwt_secret', 
    { expiresIn: '1h' } // Longer timeout for admins
  );
};

// Generate refresh token for admin
export const generateAdminRefreshToken = (admin: any): string => {
  const payload: TokenPayload = {
    id: admin._id.toString(),
    email: admin.email,
    username: admin.username,
    isAdmin: true
  };
  
  return jwt.sign(
    payload, 
    process.env.ADMIN_JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET || 'admin_fallback_refresh_secret', 
    { expiresIn: '7d' }
  );
};

// Generate both tokens for admin
export const generateAdminTokens = (admin: any): TokenResponse => {
  return {
    accessToken: generateAdminAccessToken(admin),
    refreshToken: generateAdminRefreshToken(admin)
  };
};

// Verify admin access token
export const verifyAdminAccessToken = (token: string): TokenPayload | null => {
  try {
    const payload = jwt.verify(
      token, 
      process.env.ADMIN_JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET || 'admin_fallback_jwt_secret'
    ) as TokenPayload;
    
    // Ensure the token is for an admin
    if (!payload.isAdmin) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
};

// Verify admin refresh token
export const verifyAdminRefreshToken = (token: string): TokenPayload | null => {
  try {
    const payload = jwt.verify(
      token, 
      process.env.ADMIN_JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET || 'admin_fallback_refresh_secret'
    ) as TokenPayload;
    
    // Ensure the token is for an admin
    if (!payload.isAdmin) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
};