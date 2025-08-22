import { Router, Request, Response } from 'express';
import Joi from 'joi';
import rateLimit from 'express-rate-limit';
import UserData from '@models/UserData';
import { TokenService, authenticateToken, validateRefreshToken } from '@middleware/AuthData';

const router = Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Validation schemas
const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(20)
    .required()
    .messages({
      'string.alphanum': 'Username can only contain letters and numbers',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 20 characters',
      'any.required': 'Username is required'
    }),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password cannot exceed 100 characters',
      'any.required': 'Password is required'
    }),
  
  displayName: Joi.string()
    .min(1)
    .max(30)
    .required()
    .messages({
      'string.min': 'Display name cannot be empty',
      'string.max': 'Display name cannot exceed 30 characters',
      'any.required': 'Display name is required'
    })
});

const loginSchema = Joi.object({
  identifier: Joi.string()
    .required()
    .messages({
      'any.required': 'Username or email is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required'
    })
});

/**
 * POST /api/auth/register
 * Register a new user account
 */
router.post('/register', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    const { username, email, password, displayName } = value;

    // Check if user already exists
    const existingUser = await UserData.findOne({
      $or: [{ email: email.toLowerCase() }, { username }]
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'email' : 'username';
      res.status(409).json({
        success: false,
        message: `User with this ${field} already exists`,
        code: 'USER_EXISTS'
      });
      return;
    }

    // Create new user
    const newUser = new UserData({
      username,
      email: email.toLowerCase(),
      password,
      displayName
    });

    await newUser.save();

    // Generate tokens
    const { accessToken, refreshToken } = TokenService.generateTokenPair(newUser);
    
    // Save refresh token
    newUser.addRefreshToken(refreshToken);
    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          displayName: newUser.displayName,
          level: newUser.level,
          experience: newUser.experience,
          stats: newUser.stats
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  }
});

/**
 * POST /api/auth/login
 * Login with username/email and password
 */
router.post('/login', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    const { identifier, password } = value;

    // Find user by email or username
    const user = await UserData.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier }
      ]
    }).select('+password');

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
      return;
    }

    // Generate tokens
    const { accessToken, refreshToken } = TokenService.generateTokenPair(user);
    
    // Save refresh token
    user.addRefreshToken(refreshToken);
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          level: user.level,
          experience: user.experience,
          stats: user.stats,
          walletAddress: user.walletAddress
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', validateRefreshToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const user = req.user!;

    // Generate new access token
    const newAccessToken = TokenService.generateAccessToken(user);
    
    // Optionally rotate refresh token
    const shouldRotateRefreshToken = Math.random() < 0.1; // 10% chance
    let newRefreshToken = refreshToken;
    
    if (shouldRotateRefreshToken) {
      newRefreshToken = TokenService.generateRefreshToken(user);
      user.removeRefreshToken(refreshToken);
      user.addRefreshToken(newRefreshToken);
      await user.save();
    }

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      code: 'TOKEN_REFRESH_ERROR'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout and invalidate refresh token
 */
router.post('/logout', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const user = req.user!;

    if (refreshToken) {
      user.removeRefreshToken(refreshToken);
      await user.save();
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      code: 'LOGOUT_ERROR'
    });
  }
});

/**
 * POST /api/auth/logout-all
 * Logout from all devices (clear all refresh tokens)
 */
router.post('/logout-all', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    
    user.clearRefreshTokens();
    await user.save();

    res.json({
      success: true,
      message: 'Logged out from all devices'
    });

  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout all failed',
      code: 'LOGOUT_ALL_ERROR'
    });
  }
});

/**
 * GET /api/auth/profile
 * Get current user profile
 */
router.get('/profile', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          level: user.level,
          experience: user.experience,
          stats: user.stats,
          walletAddress: user.walletAddress,
          isVerified: user.isVerified,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      code: 'PROFILE_FETCH_ERROR'
    });
  }
});

/**
 * GET /api/auth/verify-token
 * Verify if current access token is valid
 */
router.get('/verify-token', authenticateToken, (req: Request, res: Response): void => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      userId: req.userId,
      username: req.user!.username
    }
  });
});

export default router;
