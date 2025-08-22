import NetworkManager from '@/services/NetworkManager';

/**
 * Game State Manager - Centralized state management
 * Handles user data, authentication state, app settings, and session management
 */
class GameState {
  constructor() {
    // Core state
    this.isInitialized = false;
    
    // Authentication state
    this.isAuthenticated = false;
    this.currentUser = null;
    this.authToken = null;
    
    // App state
    this.currentScene = null;
    this.isLoading = false;
    this.connectionStatus = 'disconnected'; // disconnected, connecting, connected
    
    // Settings
    this.settings = {
      audio: {
        masterVolume: 1.0,
        sfxVolume: 1.0,
        musicVolume: 0.7,
        muted: false
      },
      graphics: {
        quality: 'high', // low, medium, high
        shadows: true,
        particles: true,
        antialiasing: true
      },
      controls: {
        mouseSensitivity: 1.0,
        invertY: false
      },
      ui: {
        language: 'en',
        theme: 'dark'
      }
    };
    
    // Session data
    this.sessionData = {
      startTime: null,
      playTime: 0,
      lastActivity: null,
      sessionId: null
    };
    
    // Event system
    this.eventListeners = new Map();
    
    // Local storage keys
    this.STORAGE_KEYS = {
      SETTINGS: 'clash_royale_settings',
      SESSION: 'clash_royale_session',
      USER_CACHE: 'clash_royale_user_cache'
    };
    
    // References
    this.networkManager = NetworkManager;
    
    console.log('🗃️ GameState manager created');
  }

  /**
   * Initialize the game state
   */
  async initialize() {
    try {
      console.log('🗃️ Initializing GameState...');
      
      // Load saved settings
      this.loadSettings();
      
      // Load session data
      this.loadSessionData();
      
      // Check authentication state
      await this.checkAuthenticationState();
      
      // Setup network event listeners
      this.setupNetworkListeners();
      
      // Setup session management
      this.setupSessionManagement();
      
      this.isInitialized = true;
      this.emit('state:initialized');
      
      console.log('✅ GameState initialized');
    } catch (error) {
      console.error('❌ Failed to initialize GameState:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  async checkAuthenticationState() {
    try {
      const isValid = await this.networkManager.verifyToken();
      
      if (isValid) {
        this.isAuthenticated = true;
        this.currentUser = this.networkManager.getUserData();
        this.authToken = this.networkManager.getAccessToken();
        
        this.emit('auth:authenticated', this.currentUser);
        console.log('✅ User is authenticated');
      } else {
        this.clearAuthenticationState();
        console.log('ℹ️ User is not authenticated');
      }
    } catch (error) {
      console.warn('⚠️ Failed to verify authentication:', error);
      this.clearAuthenticationState();
    }
  }

  /**
   * Set user authentication data
   */
  setAuthenticated(user, token) {
    this.isAuthenticated = true;
    this.currentUser = user;
    this.authToken = token;
    
    // Cache user data
    this.saveUserCache(user);
    
    this.emit('auth:login', user);
    console.log('✅ User authenticated:', user.username);
  }

  /**
   * Clear authentication state
   */
  clearAuthenticationState() {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.authToken = null;
    
    // Clear cached data
    localStorage.removeItem(this.STORAGE_KEYS.USER_CACHE);
    
    this.emit('auth:logout');
    console.log('🚪 Authentication cleared');
  }

  /**
   * Update user data
   */
  updateUser(userData) {
    if (!this.isAuthenticated) {
      console.warn('⚠️ Cannot update user data - not authenticated');
      return;
    }
    
    this.currentUser = { ...this.currentUser, ...userData };
    this.saveUserCache(this.currentUser);
    
    this.emit('user:updated', this.currentUser);
    console.log('🔄 User data updated');
  }

  /**
   * Set current scene
   */
  setCurrentScene(sceneName) {
    const previousScene = this.currentScene;
    this.currentScene = sceneName;
    
    this.emit('scene:changed', {
      current: sceneName,
      previous: previousScene
    });
    
    console.log(`🎬 Scene changed: ${previousScene} → ${sceneName}`);
  }

  /**
   * Set loading state
   */
  setLoading(isLoading, message = '') {
    this.isLoading = isLoading;
    
    this.emit('app:loading', {
      isLoading,
      message
    });
    
    if (isLoading) {
      console.log(`⏳ Loading: ${message}`);
    } else {
      console.log('✅ Loading complete');
    }
  }

  /**
   * Set connection status
   */
  setConnectionStatus(status) {
    const previousStatus = this.connectionStatus;
    this.connectionStatus = status;
    
    this.emit('connection:status_changed', {
      current: status,
      previous: previousStatus
    });
    
    console.log(`🌐 Connection: ${previousStatus} → ${status}`);
  }

  /**
   * Update settings
   */
  updateSettings(category, updates) {
    if (!this.settings[category]) {
      console.warn(`⚠️ Unknown settings category: ${category}`);
      return;
    }
    
    const oldSettings = { ...this.settings[category] };
    this.settings[category] = { ...this.settings[category], ...updates };
    
    // Save to localStorage
    this.saveSettings();
    
    this.emit('settings:updated', {
      category,
      oldSettings,
      newSettings: this.settings[category]
    });
    
    console.log(`⚙️ Settings updated - ${category}:`, updates);
  }

  /**
   * Reset settings to defaults
   */
  resetSettings(category = null) {
    const defaultSettings = {
      audio: {
        masterVolume: 1.0,
        sfxVolume: 1.0,
        musicVolume: 0.7,
        muted: false
      },
      graphics: {
        quality: 'high',
        shadows: true,
        particles: true,
        antialiasing: true
      },
      controls: {
        mouseSensitivity: 1.0,
        invertY: false
      },
      ui: {
        language: 'en',
        theme: 'dark'
      }
    };
    
    if (category) {
      this.settings[category] = { ...defaultSettings[category] };
    } else {
      this.settings = { ...defaultSettings };
    }
    
    this.saveSettings();
    this.emit('settings:reset', category);
    
    console.log(`🔄 Settings reset${category ? ` - ${category}` : ''}`);
  }

  /**
   * Start new session
   */
  startSession() {
    this.sessionData = {
      startTime: Date.now(),
      playTime: 0,
      lastActivity: Date.now(),
      sessionId: this.generateSessionId()
    };
    
    this.saveSessionData();
    this.emit('session:started', this.sessionData);
    
    console.log('▶️ New session started:', this.sessionData.sessionId);
  }

  /**
   * Update session activity
   */
  updateActivity() {
    if (!this.sessionData.startTime) return;
    
    const now = Date.now();
    const timeDiff = now - this.sessionData.lastActivity;
    
    // Only count as playtime if last activity was less than 5 minutes ago
    if (timeDiff < 5 * 60 * 1000) {
      this.sessionData.playTime += timeDiff;
    }
    
    this.sessionData.lastActivity = now;
    this.saveSessionData();
  }

  /**
   * End current session
   */
  endSession() {
    if (!this.sessionData.startTime) return;
    
    this.updateActivity();
    
    const sessionInfo = {
      ...this.sessionData,
      endTime: Date.now(),
      totalDuration: Date.now() - this.sessionData.startTime
    };
    
    this.emit('session:ended', sessionInfo);
    
    // Reset session data
    this.sessionData = {
      startTime: null,
      playTime: 0,
      lastActivity: null,
      sessionId: null
    };
    
    this.saveSessionData();
    
    console.log('⏹️ Session ended. Total playtime:', this.formatTime(sessionInfo.playTime));
  }

  /**
   * Setup network event listeners
   */
  setupNetworkListeners() {
    // Authentication events
    this.networkManager.on('auth:login_success', (user) => {
      this.setAuthenticated(user, this.networkManager.getAccessToken());
    });
    
    this.networkManager.on('auth:logout', () => {
      this.clearAuthenticationState();
    });
    
    this.networkManager.on('auth:token_refreshed', () => {
      this.authToken = this.networkManager.getAccessToken();
    });
    
    // Connection events
    this.networkManager.on('connection:established', () => {
      this.setConnectionStatus('connected');
    });
    
    this.networkManager.on('connection:failed', () => {
      this.setConnectionStatus('disconnected');
    });
    
    this.networkManager.on('connection:checking', () => {
      this.setConnectionStatus('connecting');
    });
    
    // Network events
    this.networkManager.on('network:online', () => {
      this.emit('network:online');
    });
    
    this.networkManager.on('network:offline', () => {
      this.emit('network:offline');
    });
  }

  /**
   * Setup session management
   */
  setupSessionManagement() {
    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    
    const activityHandler = () => {
      this.updateActivity();
    };
    
    activityEvents.forEach(event => {
      document.addEventListener(event, activityHandler, { passive: true });
    });
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.updateActivity();
        this.emit('session:paused');
      } else {
        this.sessionData.lastActivity = Date.now();
        this.emit('session:resumed');
      }
    });
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });
    
    // Auto-save session data every minute
    setInterval(() => {
      if (this.sessionData.startTime) {
        this.updateActivity();
        this.saveSessionData();
      }
    }, 60000);
  }

  /**
   * Storage methods
   */
  saveSettings() {
    try {
      localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    } catch (error) {
      console.warn('⚠️ Failed to save settings:', error);
    }
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
      if (saved) {
        const savedSettings = JSON.parse(saved);
        this.settings = { ...this.settings, ...savedSettings };
        console.log('📁 Settings loaded from storage');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load settings:', error);
    }
  }

  saveSessionData() {
    try {
      localStorage.setItem(this.STORAGE_KEYS.SESSION, JSON.stringify(this.sessionData));
    } catch (error) {
      console.warn('⚠️ Failed to save session data:', error);
    }
  }

  loadSessionData() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEYS.SESSION);
      if (saved) {
        const savedSession = JSON.parse(saved);
        
        // Only restore if session is recent (less than 1 hour old)
        if (savedSession.lastActivity && 
            Date.now() - savedSession.lastActivity < 60 * 60 * 1000) {
          this.sessionData = savedSession;
          console.log('📁 Session data restored');
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to load session data:', error);
    }
  }

  saveUserCache(user) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.USER_CACHE, JSON.stringify(user));
    } catch (error) {
      console.warn('⚠️ Failed to cache user data:', error);
    }
  }

  /**
   * Utility methods
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Getters for state access
   */
  getUser() {
    return this.currentUser;
  }

  getSettings(category = null) {
    return category ? this.settings[category] : this.settings;
  }

  getSessionInfo() {
    return {
      ...this.sessionData,
      currentPlayTime: this.sessionData.startTime ? 
        this.sessionData.playTime + (Date.now() - this.sessionData.lastActivity) : 0
    };
  }

  isUserAuthenticated() {
    return this.isAuthenticated;
  }

  getCurrentScene() {
    return this.currentScene;
  }

  getConnectionStatus() {
    return this.connectionStatus;
  }

  isAppLoading() {
    return this.isLoading;
  }

  /**
   * Event system methods
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in GameState event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Debug and development helpers
   */
  getDebugInfo() {
    return {
      isInitialized: this.isInitialized,
      isAuthenticated: this.isAuthenticated,
      currentUser: this.currentUser ? {
        id: this.currentUser.id,
        username: this.currentUser.username,
        displayName: this.currentUser.displayName
      } : null,
      currentScene: this.currentScene,
      connectionStatus: this.connectionStatus,
      isLoading: this.isLoading,
      sessionInfo: this.getSessionInfo(),
      settings: this.settings
    };
  }

  /**
   * Cleanup and dispose
   */
  dispose() {
    console.log('🧹 Disposing GameState...');
    
    // End current session
    this.endSession();
    
    // Clear event listeners
    this.eventListeners.clear();
    
    // Reset state
    this.isInitialized = false;
    this.clearAuthenticationState();
    
    console.log('✅ GameState disposed');
  }

  // Singleton pattern
  static getInstance() {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }
}

// Export singleton instance
export default GameState.getInstance();
