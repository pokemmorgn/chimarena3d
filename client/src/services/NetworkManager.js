import axios from 'axios';
import ColyseusManager from './ColyseusManager';

/**
 * Network Manager - Version hybride REST + Colyseus
 * Gère l'authentification via Colyseus et les autres API via REST
 */
class NetworkManager {
  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:2567/api';
    this.serverUrl = import.meta.env.VITE_SERVER_URL || 'ws://localhost:2567';
    
    // Storage keys
    this.ACCESS_TOKEN_KEY = 'clash_royale_access_token';
    this.REFRESH_TOKEN_KEY = 'clash_royale_refresh_token';
    this.USER_DATA_KEY = 'clash_royale_user_data';
    
    // Colyseus Manager
    this.colyseusManager = ColyseusManager;
    
    // Create axios instances for non-auth endpoints
    this.gameAPI = this.createAPIInstance('/game');
    this.userAPI = this.createAPIInstance('/user');
    this.cardAPI = this.createAPIInstance('/cards');
    this.collectionAPI = this.createAPIInstance('/collection');
    this.clanAPI = this.createAPIInstance('/clan');  // ✅ AJOUTER CETTE LIGNE

    // Network state
    this.isOnline = navigator.onLine;
    this.connectionStatus = 'disconnected'; // disconnected, connecting, connected
    this.retryAttempts = 0;
    this.maxRetryAttempts = 3;
    
    // Event system
    this.eventListeners = new Map();
    
    // Initialize
    this.setupNetworkMonitoring();
    this.setupRequestInterceptors();
    this.setupColyseusEventListeners();
  }

  /**
   * Initialiser les connexions
   */
  async initialize() {
    try {
      console.log('🌐 Initializing NetworkManager...');
      
      // Initialiser Colyseus
      await this.colyseusManager.initialize();
      
      // Se connecter à l'AuthRoom
      await this.colyseusManager.connectToAuthRoom();
      
      console.log('✅ NetworkManager initialized with Colyseus');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize NetworkManager:', error);
      throw error;
    }
  }

  /**
   * Create configured axios instance
   */
  createAPIInstance(basePath) {
    return axios.create({
      baseURL: `${this.apiUrl}${basePath}`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': '1.0.0',
        'X-Platform': 'web'
      }
    });
  }

  /**
   * Setup network monitoring
   */
  setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('network:online');
      this.checkConnection();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('network:offline');
    });
  }

  /**
   * Setup request/response interceptors for REST API instances
   */
setupRequestInterceptors() {
    // ✅ CORRIGER : Inclure clanAPI dans la liste
    const apis = [this.gameAPI, this.userAPI, this.cardAPI, this.collectionAPI, this.clanAPI];
    
    apis.forEach(api => {
      // Request interceptor
      api.interceptors.request.use(
        (config) => {
          // Add auth token if available
          const token = this.getAccessToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('🔍 [NetworkManager] Token added to request:', config.url);
          } else {
            console.warn('⚠️ [NetworkManager] No token available for:', config.url);
          }
          
          // Add request timestamp
          config.metadata = { startTime: Date.now() };
          
          return config;
        },
        (error) => {
          console.error('🔥 [NetworkManager] Request interceptor error:', error);
          this.emit('request:error', error);
          return Promise.reject(error);
        }
      );

      // Response interceptor (reste identique)
      api.interceptors.response.use(
        (response) => {
          const duration = Date.now() - response.config.metadata.startTime;
          this.emit('request:success', { duration, url: response.config.url });
          return response;
        },
        async (error) => {
          // Handle token refresh via Colyseus
          if (error.response?.status === 401 && 
              error.response?.data?.code === 'TOKEN_EXPIRED') {
            
            try {
              const refreshToken = this.getRefreshToken();
              if (refreshToken) {
                const result = await this.colyseusManager.refreshToken(refreshToken);
                if (result.success) {
                  this.setTokens(result.tokens.accessToken, result.tokens.refreshToken);
                  this.setUserData(result.user);
                  
                  // Retry original request
                  const originalRequest = error.config;
                  originalRequest.headers.Authorization = `Bearer ${result.tokens.accessToken}`;
                  return api(originalRequest);
                }
              }
            } catch (refreshError) {
              this.clearTokens();
              this.emit('auth:token_expired');
            }
          }
          
          // Handle network errors
          if (!error.response) {
            this.emit('network:error', error);
          }
          
          this.emit('request:error', error);
          return Promise.reject(error);
        }
      );
    });

    console.log('✅ Request interceptors configured for ALL APIs including Clan');
  }

  /**
   * 🔥 NOUVELLE MÉTHODE : Exposer l'instance clanAPI pour ClanAPI.js
   */
  getClanAPIInstance() {
    return this.clanAPI;
  }

  /**
   * Setup Colyseus event listeners
   */
  setupColyseusEventListeners() {
    // Auth events from ColyseusManager
    this.colyseusManager.on('auth:login_success', (user) => {
      this.emit('auth:login_success', user);
    });
    
    this.colyseusManager.on('auth:login_error', (error) => {
      this.emit('auth:login_error', error);
    });
    
    this.colyseusManager.on('auth:logout', () => {
      this.clearTokens();
      this.emit('auth:logout');
    });
    
    this.colyseusManager.on('auth:token_refreshed', (user) => {
      this.emit('auth:token_refreshed', user);
    });
    
    // Connection events
    this.colyseusManager.on('connection:connected', (data) => {
      this.setConnectionStatus('connected');
    });
    
    this.colyseusManager.on('connection:error', (data) => {
      this.setConnectionStatus('disconnected');
    });
    
    this.colyseusManager.on('connection:connecting', (data) => {
      this.setConnectionStatus('connecting');
    });
    
    // User events
    this.colyseusManager.on('user:connected', (data) => {
      this.emit('user:connected', data);
    });
    
    this.colyseusManager.on('user:disconnected', (data) => {
      this.emit('user:disconnected', data);
    });
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
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Token management
   */
  getAccessToken() {
    // Priorité : ColyseusManager > localStorage
    return this.colyseusManager.getAccessToken() || localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken() {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setTokens(accessToken, refreshToken) {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    this.emit('auth:tokens_updated');
  }

  clearTokens() {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_DATA_KEY);
    this.emit('auth:tokens_cleared');
  }

  /**
   * User data management
   */
  setUserData(userData) {
    localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
    this.emit('user:data_updated', userData);
  }

  getUserData() {
    // Priorité : ColyseusManager > localStorage
    return this.colyseusManager.getCurrentUser() || 
           (localStorage.getItem(this.USER_DATA_KEY) ? 
            JSON.parse(localStorage.getItem(this.USER_DATA_KEY)) : null);
  }

  /**
   * Authentication via Colyseus AuthRoom
   */
  async login(identifier, password) {
    try {
      console.log('🔑 Logging in via Colyseus...');
      
      // Ensure connected to AuthRoom
      if (!this.colyseusManager.isConnectedToAuth()) {
        await this.colyseusManager.connectToAuthRoom();
      }
      
      // Login via Colyseus
      const result = await this.colyseusManager.login(identifier, password);
      
      if (result.success) {
        // Store tokens locally
        this.setTokens(result.tokens.accessToken, result.tokens.refreshToken);
        this.setUserData(result.user);
        
        console.log('✅ Login successful via Colyseus');
      }
      
      return this.formatResponse(result);
      
    } catch (error) {
      console.error('❌ Login error:', error);
      return this.handleError(error, 'LOGIN_ERROR');
    }
  }

  /**
   * Register - Still via REST API for now
   */
  async register(userData) {
    try {
      // Create a temporary auth API instance for registration
      const authAPI = this.createAPIInstance('/auth');
      const response = await authAPI.post('/register', userData);
      
      if (response.data.success) {
        // After successful registration, login via Colyseus
        const loginResult = await this.login(userData.username, userData.password);
        if (loginResult.success) {
          this.emit('auth:register_success', loginResult.user);
        }
        return loginResult;
      }
      
      return this.formatResponse(response.data);
    } catch (error) {
      return this.handleError(error, 'REGISTER_ERROR');
    }
  }

  /**
   * Logout via Colyseus
   */
  async logout() {
    try {
      await this.colyseusManager.logout();
      console.log('✅ Logged out via Colyseus');
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Join World Room
   */
  async joinWorldRoom() {
    try {
      const worldRoom = await this.colyseusManager.joinWorldRoom();
      this.emit('world:joined', worldRoom);
      return worldRoom;
    } catch (error) {
      console.error('❌ Failed to join world room:', error);
      throw error;
    }
  }

  /**
   * Verify token via Colyseus
   */
  async verifyToken() {
    try {
      // If we have an active Colyseus connection, consider token valid
      if (this.colyseusManager.isConnectedToAuth() && this.colyseusManager.getCurrentUser()) {
        return true;
      }
      
      // Try to refresh with stored refresh token
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        const result = await this.colyseusManager.refreshToken(refreshToken);
        if (result.success) {
          this.setTokens(result.tokens.accessToken, result.tokens.refreshToken);
          this.setUserData(result.user);
          return true;
        }
      }
      
      return false;
      
    } catch (error) {
      console.warn('Token verification failed:', error);
      return false;
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
  }

  /**
   * Connection utilities
   */
  async checkConnection() {
    try {
      this.connectionStatus = 'connecting';
      this.emit('connection:checking');
      
      // Check both REST API and Colyseus
      const [restCheck, colyseusCheck] = await Promise.allSettled([
        axios.get(`${this.apiUrl}/health`, { timeout: 5000 }),
        this.colyseusManager.isConnectedToAuth() ? Promise.resolve(true) : this.colyseusManager.connectToAuthRoom()
      ]);
      
      const restOK = restCheck.status === 'fulfilled' && restCheck.value.status === 200;
      const colyseusOK = colyseusCheck.status === 'fulfilled';
      
      if (restOK && colyseusOK) {
        this.connectionStatus = 'connected';
        this.retryAttempts = 0;
        this.emit('connection:established');
        return true;
      }
      
      throw new Error('Connection check failed');
    } catch (error) {
      this.connectionStatus = 'disconnected';
      this.emit('connection:failed', error);
      return false;
    }
  }

  /**
   * Response formatting and error handling
   */
  formatResponse(data) {
    return {
      success: data.success,
      message: data.message,
      data: data.data || null,
      code: data.code || null,
      user: data.user || null,
      tokens: data.tokens || null,
      collection: data.collection || null
    };
  }

  handleError(error, defaultMessage) {
    console.error('Network error:', error);
    
    if (error.response?.data) {
      return this.formatResponse(error.response.data);
    }
    
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      return {
        success: false,
        message: 'NETWORK_CONNECTION_ERROR',
        code: 'NETWORK_ERROR'
      };
    }
    
    return {
      success: false,
      message: defaultMessage,
      code: 'UNKNOWN_ERROR'
    };
  }

  /**
   * REST API methods (for non-auth endpoints)
   */
  async getProfile() {
    try {
      const response = await this.userAPI.get('/profile');
      
      if (response.data.success) {
        const user = response.data.data.user;
        this.setUserData(user);
        return this.formatResponse(response.data);
      }
      
      return this.formatResponse(response.data);
    } catch (error) {
      return this.handleError(error, 'PROFILE_ERROR');
    }
  }

  async getCards() {
    try {
      const response = await this.cardAPI.get('/');
      return this.formatResponse(response.data);
    } catch (error) {
      return this.handleError(error, 'CARDS_ERROR');
    }
  }

  async getCollection() {
    try {
      const response = await this.collectionAPI.get('/');
      return this.formatResponse(response.data);
    } catch (error) {
      return this.handleError(error, 'COLLECTION_ERROR');
    }
  }

  /**
   * Utility methods
   */
  isAuthenticated() {
    return this.colyseusManager.getCurrentUser() !== null && !!this.getAccessToken();
  }

  getConnectionStatus() {
    return {
      isOnline: this.isOnline,
      connectionStatus: this.connectionStatus,
      retryAttempts: this.retryAttempts,
      colyseus: this.colyseusManager.getConnectionStatus()
    };
  }

  /**
   * Get Colyseus manager for direct access
   */
  getColyseusManager() {
    return this.colyseusManager;
  }

  /**
   * Ping to maintain connection
   */
  ping() {
    this.colyseusManager.ping();
  }

  /**
   * Cleanup and dispose
   */
  dispose() {
    console.log('🧹 Disposing NetworkManager...');
    
    // Dispose Colyseus manager
    this.colyseusManager.dispose();
    
    // Clear event listeners
    this.eventListeners.clear();
    
    console.log('✅ NetworkManager disposed');
  }

  // Singleton pattern
  static getInstance() {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }
}

// Export singleton instance
export default NetworkManager.getInstance();
