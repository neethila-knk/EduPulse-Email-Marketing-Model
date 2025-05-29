import jwt from 'jsonwebtoken';

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
    { expiresIn: '1h' } 
  );
};

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


export const generateAdminTokens = (admin: any): TokenResponse => {
  return {
    accessToken: generateAdminAccessToken(admin),
    refreshToken: generateAdminRefreshToken(admin)
  };
};


export const verifyAdminAccessToken = (token: string): TokenPayload | null => {
  try {
    const payload = jwt.verify(
      token, 
      process.env.ADMIN_JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET || 'admin_fallback_jwt_secret'
    ) as TokenPayload;
    

    if (!payload.isAdmin) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
};


export const verifyAdminRefreshToken = (token: string): TokenPayload | null => {
  try {
    const payload = jwt.verify(
      token, 
      process.env.ADMIN_JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET || 'admin_fallback_refresh_secret'
    ) as TokenPayload;
    
   
    if (!payload.isAdmin) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
};