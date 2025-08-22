import axios from 'axios';

/**
 * Network Manager for Client
 * Centralized network communication, token management, and API calls
 */
class NetworkManager {
  constructor() {
this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:2567/api';
this.serverUrl = import.meta.env.VITE_SERVER_URL || 'ws://localhost:2567';
    
    // Storage keys
    this.ACCESS_TOKEN_KEY = 'clash_royale_access_token';
    this.REFRESH_TOKEN_KEY = 'clash_royale_refresh_token';
    this.USER_DATA_KEY = 'clash_royale_user_data';
    
    // Create axios instances for different endpoints
    this.authAPI = this.createAPIInstance('/auth');
    this.gameAPI = this.createAPIInstance('/game');
    this.userAPI = this.createAPIInstance('/user');
    
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
   * Setup request/response interceptors for all API instances
   */
  setupRequestInterceptors() {
    const apis = [this.authAPI, this.gameAPI, this.userAPI];
    
    apis.forEach(api => {
      // Request interceptor
      api.interceptors.request.use(
        (config) => {
          // Add auth token if available
          const token = this.getAccessToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          
          // Add request timestamp
          config.metadata = { startTime: Date.now() };
          
          return config;
        },
        (error) => {
          this.emit('request:error', error);
          return Promise.reject(error);
        }
      );

      // Response interceptor
      api.interceptors.response.use(
        (response) => {
          // Calculate request duration
          const duration = Date.now() - response.config.metadata.startTime;
          this.emit('request:success', { duration, url: response.config.url });
          
          return response;
        },
        async (error) => {
          const originalRequest = error.config;
          
          // Handle token refresh
          if (error.response?.status === 401 && 
              error.response?.data?.code === 'TOKEN_EXPIRED' && 
              !originalRequest._retry) {
            
            originalRequest._retry = true;
            
            try {
              await this.refreshToken();
              const newToken = this.getAccessToken();
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return api(originalRequest);
            } catch (refreshError) {
              this.clearTokens();
              this.emit('auth:token_expired');
              return Promise.reject(refreshError);
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
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
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
    const data = localStorage.getItem(this.USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Authentication API calls
   */
  async register(userData) {
    try {
      const response = await this.authAPI.post('/register', userData);
      
      if (response.data.success) {
        const { user, tokens } = response.data.data;
        this.setTokens(tokens.accessToken, tokens.refreshToken);
        this.setUserData(user);
        this.emit('auth:register_success', user);
      }
      
      return this.formatResponse(response.data);
    } catch (error) {
      return this.handleError(error, 'REGISTER_ERROR');
    }
  }

  async login(identifier, password) {
    try {
      const response = await this.authAPI.post('/login', {
        identifier,
        password
      });
      
      if (response.data.success) {
        const { user, tokens } = response.data.data;
        this.setTokens(tokens.accessToken, tokens.refreshToken);
        this.setUserData(user);
        this.emit('auth:login_success', user);
      }
      
      return this.formatResponse(response.data);
    } catch (error) {
      return this.handleError(error, 'LOGIN_ERROR');
    }
  }

  async logout() {
    try {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        await this.authAPI.post('/logout', { refreshToken });
      }
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.clearTokens();
      this.emit('auth:logout');
    }
  }

  async refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.authAPI.post('/refresh', { refreshToken });
      
      if (response.data.success) {
        const { tokens } = response.data.data;
        this.setTokens(tokens.accessToken, tokens.refreshToken);
        this.emit('auth:token_refreshed');
        return tokens;
      }
      
      throw new Error('Token refresh failed');
    } catch (error) {
      this.clearTokens();
      this.emit('auth:refresh_failed');
      throw error;
    }
  }

  async getProfile() {
    try {
      const response = await this.authAPI.get('/profile');
      
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

  async verifyToken() {
    try {
      const response = await this.authAPI.get('/verify-token');
      return response.data.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Connection utilities
   */
  async checkConnection() {
    try {
      this.connectionStatus = 'connecting';
      this.emit('connection:checking');
      
      const response = await axios.get(`${this.apiUrl}/health`, { timeout: 5000 });
      
      if (response.status === 200) {
        this.connectionStatus = 'connected';
        this.retryAttempts = 0;
        this.emit('connection:established');
        return true;
      }
      
      throw new Error('Health check failed');
    } catch (error) {
      this.connectionStatus = 'disconnected';
      this.emit('connection:failed', error);
      return false;
    }
  }

  async retryConnection() {
    if (this.retryAttempts >= this.maxRetryAttempts) {
      this.emit('connection:max_retries_reached');
      return false;
    }

    this.retryAttempts++;
    this.emit('connection:retrying', this.retryAttempts);
    
    // Exponential backoff
    const delay = Math.pow(2, this.retryAttempts) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return this.checkConnection();
  }

  /**
   * Response formatting and error handling
   */
  formatResponse(data) {
    return {
      success: data.success,
      message: data.message,
      data: data.data || null,
      code: data.code || null
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
   * Utility methods
   */
  isAuthenticated() {
    return !!this.getAccessToken();
  }

  getConnectionStatus() {
    return {
      isOnline: this.isOnline,
      connectionStatus: this.connectionStatus,
      retryAttempts: this.retryAttempts
    };
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
