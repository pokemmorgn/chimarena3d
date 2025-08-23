import { Client } from 'colyseus.js';

/**
 * Colyseus Manager - Gestion des connexions WebSocket et rooms
 * Interface entre le client et les rooms Colyseus (AuthRoom, WorldRoom, etc.)
 */
class ColyseusManager {
  constructor() {
    this.serverUrl = import.meta.env.VITE_SERVER_URL || 'ws://localhost:2567';
    
    // Client Colyseus
    this.client = null;
    
    // Rooms
    this.authRoom = null;
    this.worldRoom = null;
    this.currentRoom = null;
    
    // État de connexion
    this.isConnected = false;
    this.isConnecting = false;
    this.connectionAttempts = 0;
    this.maxRetryAttempts = 3;
    
    // Données utilisateur
    this.currentUser = null;
    this.accessToken = null;
    
    // Event system
    this.eventListeners = new Map();
    
    console.log('🎮 ColyseusManager created');
  }

  /**
   * Initialiser le client Colyseus
   */
  async initialize() {
    try {
      console.log(`🔌 Initializing Colyseus client: ${this.serverUrl}`);
      
      this.client = new Client(this.serverUrl);
      
      // Setup des événements globaux du client
      this.setupClientEvents();
      
      console.log('✅ Colyseus client initialized');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize Colyseus client:', error);
      throw error;
    }
  }

  /**
   * Se connecter à l'AuthRoom pour l'authentification
   */
  async connectToAuthRoom() {
    if (this.isConnecting) {
      console.warn('Already connecting to AuthRoom');
      return;
    }

    this.isConnecting = true;
    this.emit('connection:connecting', { room: 'auth' });

    try {
      console.log('🔐 Connecting to AuthRoom...');
      
      // Se connecter à l'AuthRoom
      this.authRoom = await this.client.joinOrCreate('auth', {
        clientVersion: '1.0.0',
        platform: 'web'
      });
      
      this.currentRoom = this.authRoom;
      this.isConnected = true;
      this.isConnecting = false;
      this.connectionAttempts = 0;
      
      // Setup des événements de l'AuthRoom
      this.setupAuthRoomEvents();
      
      this.emit('connection:connected', { room: 'auth' });
      console.log('✅ Connected to AuthRoom:', this.authRoom.id);
      
      return this.authRoom;
      
    } catch (error) {
      this.isConnecting = false;
      this.handleConnectionError(error, 'auth');
      throw error;
    }
  }

  /**
   * Authentification via l'AuthRoom
   */
  async login(identifier, password) {
    if (!this.authRoom) {
      throw new Error('Not connected to AuthRoom. Call connectToAuthRoom() first.');
    }

    return new Promise((resolve, reject) => {
      // Timeout pour la réponse
      const timeout = setTimeout(() => {
        reject(new Error('Authentication timeout'));
      }, 10000);

      // Handler pour le succès
      const handleAuthSuccess = (data) => {
        clearTimeout(timeout);
        this.authRoom.off('auth_success', handleAuthSuccess);
        this.authRoom.off('auth_error', handleAuthError);
        
        // Stocker les données utilisateur
        this.currentUser = data.user;
        this.accessToken = data.tokens.accessToken;
        
        this.emit('auth:login_success', data.user);
        resolve({
          success: true,
          user: data.user,
          tokens: data.tokens,
          collection: data.collection
        });
      };

      // Handler pour l'erreur
      const handleAuthError = (error) => {
        clearTimeout(timeout);
        this.authRoom.off('auth_success', handleAuthSuccess);
        this.authRoom.off('auth_error', handleAuthError);
        
        this.emit('auth:login_error', error);
        resolve({
          success: false,
          message: error.message,
          code: error.code
        });
      };

      // Écouter les réponses
      this.authRoom.onMessage('auth_success', handleAuthSuccess);
      this.authRoom.onMessage('auth_error', handleAuthError);

      // Envoyer la demande de login
      this.authRoom.send('login', { identifier, password });
      
      console.log('🔑 Sending login request...');
    });
  }

  /**
   * Authentification avec refresh token
   */
  async refreshToken(refreshToken) {
    if (!this.authRoom) {
      throw new Error('Not connected to AuthRoom');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Token refresh timeout'));
      }, 10000);

      const handleSuccess = (data) => {
        clearTimeout(timeout);
        this.authRoom.off('auth_success', handleSuccess);
        this.authRoom.off('auth_error', handleError);
        
        this.currentUser = data.user;
        this.accessToken = data.tokens.accessToken;
        
        this.emit('auth:token_refreshed', data.user);
        resolve({
          success: true,
          user: data.user,
          tokens: data.tokens
        });
      };

      const handleError = (error) => {
        clearTimeout(timeout);
        this.authRoom.off('auth_success', handleSuccess);
        this.authRoom.off('auth_error', handleError);
        
        this.emit('auth:token_error', error);
        resolve({
          success: false,
          message: error.message,
          code: error.code
        });
      };

      this.authRoom.onMessage('auth_success', handleSuccess);
      this.authRoom.onMessage('auth_error', handleError);
      this.authRoom.send('refresh_token', { refreshToken });
    });
  }

  /**
   * Déconnexion
   */
  async logout() {
    if (this.authRoom) {
      this.authRoom.send('logout', {});
      
      // Attendre la confirmation puis se déconnecter
      setTimeout(() => {
        this.disconnectFromAll();
      }, 1000);
    } else {
      this.disconnectFromAll();
    }
    
    this.emit('auth:logout');
  }

  /**
   * Rejoindre la WorldRoom après authentification
   */
  async joinWorldRoom() {
    if (!this.currentUser || !this.accessToken) {
      throw new Error('Must be authenticated before joining world');
    }

    try {
      console.log('🌍 Connecting to WorldRoom...');
      
      // D'abord demander les infos pour rejoindre le monde
      this.authRoom.send('join_world', {});
      
      // Attendre la réponse avec les infos de connexion
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('World join timeout'));
        }, 10000);

        this.authRoom.onMessage('world_join_info', async (data) => {
          clearTimeout(timeout);
          
          try {
            // Se connecter à la WorldRoom avec le token
            this.worldRoom = await this.client.joinOrCreate('world', {
              authToken: data.authToken,
              userData: data.userData
            });
            
            this.currentRoom = this.worldRoom;
            this.setupWorldRoomEvents();
            
            this.emit('world:joined', this.worldRoom);
            console.log('✅ Joined WorldRoom:', this.worldRoom.id);
            
            resolve(this.worldRoom);
            
          } catch (error) {
            reject(error);
          }
        });

        this.authRoom.onMessage('error', (error) => {
          clearTimeout(timeout);
          reject(new Error(error.message));
        });
      });
      
    } catch (error) {
      console.error('❌ Failed to join WorldRoom:', error);
      throw error;
    }
  }

  /**
   * Setup des événements du client Colyseus
   */
  setupClientEvents() {
    // Pas d'événements globaux spécifiques pour le moment
  }

  /**
   * Setup des événements de l'AuthRoom
   */
  setupAuthRoomEvents() {
    if (!this.authRoom) return;

    // Authentification requise
    this.authRoom.onMessage('auth_required', (data) => {
      console.log('🔑 Authentication required:', data.message);
      this.emit('auth:required', data);
    });

    // Timeout d'authentification
    this.authRoom.onMessage('auth_timeout', (data) => {
      console.warn('⏰ Authentication timeout:', data.message);
      this.emit('auth:timeout', data);
    });

    // Session remplacée (connexion depuis un autre appareil)
    this.authRoom.onMessage('session_replaced', (data) => {
      console.log('🔄 Session replaced:', data.message);
      this.emit('auth:session_replaced', data);
    });

    // Utilisateur connecté
    this.authRoom.onMessage('user_connected', (data) => {
      console.log(`👤 User connected: ${data.username}`);
      this.emit('user:connected', data);
    });

    // Utilisateur déconnecté
    this.authRoom.onMessage('user_disconnected', (data) => {
      console.log(`🚪 User disconnected: ${data.username}`);
      this.emit('user:disconnected', data);
    });

    // Ping/Pong
    this.authRoom.onMessage('pong', (data) => {
      this.emit('connection:pong', data);
    });

    // Gestion des erreurs de room
    this.authRoom.onError((code, message) => {
      console.error(`❌ AuthRoom error ${code}:`, message);
      this.emit('room:error', { code, message, room: 'auth' });
    });

    // Déconnexion de la room
    this.authRoom.onLeave((code) => {
      console.log(`🚪 Left AuthRoom with code:`, code);
      this.authRoom = null;
      this.isConnected = false;
      this.emit('room:left', { code, room: 'auth' });
    });

    // Changements d'état
    this.authRoom.onStateChange((state) => {
      this.emit('auth:state_change', state);
    });
  }

  /**
   * Setup des événements de la WorldRoom
   */
  setupWorldRoomEvents() {
    if (!this.worldRoom) return;

    // Événements spécifiques à la WorldRoom
    this.worldRoom.onMessage('welcome', (data) => {
      console.log('🌍 Welcome to world:', data);
      this.emit('world:welcome', data);
    });

    this.worldRoom.onError((code, message) => {
      console.error(`❌ WorldRoom error ${code}:`, message);
      this.emit('room:error', { code, message, room: 'world' });
    });

    this.worldRoom.onLeave((code) => {
      console.log(`🚪 Left WorldRoom with code:`, code);
      this.worldRoom = null;
      this.emit('room:left', { code, room: 'world' });
    });

    this.worldRoom.onStateChange((state) => {
      this.emit('world:state_change', state);
    });
  }

  /**
   * Gérer les erreurs de connexion
   */
  handleConnectionError(error, roomType) {
    console.error(`❌ Connection error to ${roomType}:`, error);
    
    this.connectionAttempts++;
    this.emit('connection:error', { error, roomType, attempts: this.connectionAttempts });
    
    // Retry avec backoff exponentiel
    if (this.connectionAttempts < this.maxRetryAttempts) {
      const delay = Math.pow(2, this.connectionAttempts) * 1000;
      console.log(`🔄 Retrying connection in ${delay}ms...`);
      
      setTimeout(() => {
        if (roomType === 'auth') {
          this.connectToAuthRoom();
        }
      }, delay);
    } else {
      this.emit('connection:failed', { roomType, maxAttemptsReached: true });
    }
  }

  /**
   * Ping pour maintenir la connexion
   */
  ping() {
    if (this.authRoom) {
      this.authRoom.send('ping', {});
    }
    if (this.worldRoom) {
      this.worldRoom.send('ping', {});
    }
  }

  /**
   * Déconnexion de toutes les rooms
   */
  disconnectFromAll() {
    console.log('🔌 Disconnecting from all rooms...');
    
    if (this.worldRoom) {
      this.worldRoom.leave();
      this.worldRoom = null;
    }
    
    if (this.authRoom) {
      this.authRoom.leave();
      this.authRoom = null;
    }
    
    this.currentRoom = null;
    this.isConnected = false;
    this.currentUser = null;
    this.accessToken = null;
    
    this.emit('connection:disconnected');
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
          console.error(`Error in ColyseusManager event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Getters
   */
  isConnectedToAuth() {
    return !!this.authRoom;
  }

  isConnectedToWorld() {
    return !!this.worldRoom;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getAccessToken() {
    return this.accessToken;
  }

  getCurrentRoom() {
    return this.currentRoom;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      currentRoom: this.currentRoom?.id || null,
      hasAuthRoom: !!this.authRoom,
      hasWorldRoom: !!this.worldRoom,
      connectionAttempts: this.connectionAttempts
    };
  }

  /**
   * Cleanup et dispose
   */
  dispose() {
    console.log('🧹 Disposing ColyseusManager...');
    
    this.disconnectFromAll();
    this.eventListeners.clear();
    
    if (this.client) {
      // Colyseus client n'a pas de méthode dispose explicite
      this.client = null;
    }
    
    console.log('✅ ColyseusManager disposed');
  }

  // Singleton pattern
  static getInstance() {
    if (!ColyseusManager.instance) {
      ColyseusManager.instance = new ColyseusManager();
    }
    return ColyseusManager.instance;
  }
}

// Export singleton instance
export default ColyseusManager.getInstance();
