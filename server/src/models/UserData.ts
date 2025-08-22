import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interface for UserData document
export interface IUserData extends Document {
  // Basic authentication
  username: string;
  email: string;
  password: string;
  
  // Profile information
  displayName: string;
  avatar?: string;
  level: number;
  experience: number;
  
  // Game statistics
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    gamesLost: number;
    winRate: number;
    highestTrophies: number;
    currentTrophies: number;
  };
  
  // Account management
  isActive: boolean;
  isVerified: boolean;
  lastLogin: Date;
  
  // Future MetaMask integration
  walletAddress?: string;
  nftAssets?: string[];
  
  // Token management
  refreshTokens: string[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateStats(won: boolean, trophiesChange: number): void;
  calculateWinRate(): number;
  addRefreshToken(token: string): void;
  removeRefreshToken(token: string): void;
  clearRefreshTokens(): void;
}

// Define interface for transform function return type
interface TransformReturnType {
  [key: string]: any;
  password?: string;
  refreshTokens?: string[];
  __v?: number;
}

// UserData Schema
const UserDataSchema = new Schema<IUserData>({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include in queries by default
  },
  
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
    maxlength: [30, 'Display name cannot exceed 30 characters']
  },
  
  avatar: {
    type: String,
    default: null
  },
  
  level: {
    type: Number,
    default: 1,
    min: [1, 'Level cannot be less than 1'],
    max: [100, 'Level cannot exceed 100']
  },
  
  experience: {
    type: Number,
    default: 0,
    min: [0, 'Experience cannot be negative']
  },
  
  stats: {
    gamesPlayed: { type: Number, default: 0, min: 0 },
    gamesWon: { type: Number, default: 0, min: 0 },
    gamesLost: { type: Number, default: 0, min: 0 },
    winRate: { type: Number, default: 0, min: 0, max: 100 },
    highestTrophies: { type: Number, default: 0, min: 0 },
    currentTrophies: { type: Number, default: 0, min: 0 }
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  lastLogin: {
    type: Date,
    default: Date.now
  },
  
  // Future MetaMask integration
  walletAddress: {
    type: String,
    default: null,
    match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum wallet address']
  },
  
  nftAssets: [{
    type: String,
    default: []
  }],
  
  refreshTokens: [{
    type: String,
    default: []
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(_doc: any, ret: TransformReturnType) {
      delete ret.password;
      delete ret.refreshTokens;
      delete ret.__v;
      return ret;
    }
  }
});

// Index for performance
UserDataSchema.index({ email: 1 });
UserDataSchema.index({ username: 1 });
UserDataSchema.index({ 'stats.currentTrophies': -1 });
UserDataSchema.index({ walletAddress: 1 });

// Pre-save middleware to hash password
UserDataSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
UserDataSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to update game statistics
UserDataSchema.methods.updateStats = function(won: boolean, trophiesChange: number): void {
  this.stats.gamesPlayed += 1;
  
  if (won) {
    this.stats.gamesWon += 1;
  } else {
    this.stats.gamesLost += 1;
  }
  
  this.stats.currentTrophies = Math.max(0, this.stats.currentTrophies + trophiesChange);
  
  if (this.stats.currentTrophies > this.stats.highestTrophies) {
    this.stats.highestTrophies = this.stats.currentTrophies;
  }
  
  this.stats.winRate = this.calculateWinRate();
};

// Instance method to calculate win rate
UserDataSchema.methods.calculateWinRate = function(): number {
  if (this.stats.gamesPlayed === 0) return 0;
  return Math.round((this.stats.gamesWon / this.stats.gamesPlayed) * 100);
};

// Instance method to add refresh token
UserDataSchema.methods.addRefreshToken = function(token: string): void {
  this.refreshTokens.push(token);
  // Keep only last 5 refresh tokens
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
};

// Instance method to remove refresh token
UserDataSchema.methods.removeRefreshToken = function(token: string): void {
  this.refreshTokens = this.refreshTokens.filter((t: string) => t !== token);
};

// Instance method to clear all refresh tokens
UserDataSchema.methods.clearRefreshTokens = function(): void {
  this.refreshTokens = [];
};

export default mongoose.model<IUserData>('UserData', UserDataSchema);
