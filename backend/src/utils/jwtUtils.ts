import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

// Define interfaces for token payload and response
interface TokenPayload {
  id: string;
  email: string;
  username: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

// Generate access token
export const generateAccessToken = (user: any): string => {
  const payload: TokenPayload = {
    id: user._id.toString(),
    email: user.email,
    username: user.username
  };
  
  return jwt.sign(
    payload, 
    process.env.JWT_ACCESS_SECRET as string, 
    { expiresIn: '15m' }
  );
};

// Generate refresh token
export const generateRefreshToken = (user: any): string => {
  const payload: TokenPayload = {
    id: user._id.toString(),
    email: user.email,
    username: user.username
  };
  
  return jwt.sign(
    payload, 
    process.env.JWT_REFRESH_SECRET as string, 
    { expiresIn: '7d' }
  );
};

// Generate both tokens
export const generateTokens = (user: any): TokenResponse => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user)
  };
};

// Verify access token
export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as TokenPayload;
  } catch (error) {
    return null;
  }
};

// Verify refresh token
export const verifyRefreshToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as TokenPayload;
  } catch (error) {
    return null;
  }
};