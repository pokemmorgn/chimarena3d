import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import UserData, { IUserData } from '@models/UserData';
import { Types } from 'mongoose';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: IUserData;
      userId?: string;
    }
  }
}

// JWT Payload interface
export interface IJWTPayload {
  userId: string;
  username: string;
  email: string;
  iat: number;
  exp: number;
}

// Refresh token payload interface
export interface IRefreshTokenPayload {
  userId: string;
  tokenVersion: number;
  iat: number;
  exp: number;
}

// Token generation utilities
export class TokenService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET!;
  private static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
  private static readonly JWT_EXPIRE_TIME = process.env.JWT_EXPIRE_TIME || '15m';
  private static readonly JWT_REFRESH_EXPIRE_TIME = process.env.JWT_REFRESH_EXPIRE_TIME || '7d';

  /**
   * Generate access token
   */
  static generateAccessToken(user: IUserData): string {
    const payload: Omit<IJWTPayload, 'iat' | 'exp'> = {
      userId: (user._id as Types.ObjectId).toString(),
      username: user.username,
      email: user.email
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRE_TIME,
      issuer: 'clash-royale-server',
      audience: 'clash-royale-client'
    });
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(user: IUserData): string {
    const payload: Omit<IRefreshTokenPayload, 'iat' | 'exp'> = {
      userId: (user._id as Types.ObjectId).toString(),
      tokenVersion: Date.now() // Simple version system
    };

    return jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.JWT_REFRESH_EXPIRE_TIME,
      issuer: 'clash-royale-server',
      audience: 'clash-royale-client'
    });
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): IJWTPayload {
    return jwt.verify(token, this.JWT_SECRET, {
      issuer: 'clash-royale-server',
      audience: 'clash-royale-client'
    }) as IJWTPayload;
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): IRefreshTokenPayload {
    return jwt.verify(token, this.JWT_REFRESH_SECRET, {
      issuer: 'clash-royale-server',
      audience: 'clash-royale-client'
    }) as IRefreshTokenPayload;
  }

  /**
   * Generate token pair
   */
  static generateTokenPair(user: IUserData): { accessToken: string; refreshToken: string } {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    
    return { accessToken, refreshToken };
  }
}

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
        code: 'TOKEN_MISSING'
      });
      return;
    }

    // Verify token
    const decoded = TokenService.verifyAccessToken(token);
    
    // Get user from database
    const user = await UserData.findById(decoded.userId);
    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'User not found or inactive',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Attach user to request
    req.user = user;
    req.userId = (user._id as Types.ObjectId).toString();
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Access token expired',
        code: 'TOKEN_EXPIRED'
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid access token',
        code: 'TOKEN_INVALID'
      });
      return;
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware to authenticate optional requests (doesn't fail if no token)
 */
export const authenticateOptional = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      // No token provided, continue without authentication
      next();
      return;
    }

    // Verify token
    const decoded = TokenService.verifyAccessToken(token);
    
    // Get user from database
    const user = await UserData.findById(decoded.userId);
    if (user && user.isActive) {
      req.user = user;
      req.userId = (user._id as Types.ObjectId).toString();
    }
    
    next();
  } catch (error) {
    // Token invalid but we don't fail, just continue without authentication
    next();
  }
};

/**
 * Middleware to check if user is admin (for future admin features)
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
    return;
  }

  // For now, check if user ID matches admin ID (set in env)
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',');
  if (!adminIds.includes(req.userId!)) {
    res.status(403).json({
      success: false,
      message: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
    return;
  }

  next();
};

/**
 * Middleware to validate refresh token
 */
export const validateRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: 'Refresh token required',
        code: 'REFRESH_TOKEN_MISSING'
      });
      return;
    }

    // Verify refresh token
    const decoded = TokenService.verifyRefreshToken(refreshToken);
    
    // Get user and check if refresh token exists
    const user = await UserData.findById(decoded.userId);
    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'User not found or inactive',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    if (!user.refreshTokens.includes(refreshToken)) {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        code: 'REFRESH_TOKEN_INVALID'
      });
      return;
    }

    req.user = user;
    req.userId = (user._id as Types.ObjectId).toString();
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Refresh token expired',
        code: 'REFRESH_TOKEN_EXPIRED'
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        code: 'REFRESH_TOKEN_INVALID'
      });
      return;
    }

    console.error('Refresh token validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Token validation failed',
      code: 'TOKEN_VALIDATION_ERROR'
    });
  }
};
