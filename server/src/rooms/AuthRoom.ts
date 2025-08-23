import { Room, Client, ServerError } from 'colyseus';
import { Schema, MapSchema, type } from '@colyseus/schema';
import { getActionLogger, ActionLoggerService } from '../services/ActionLoggerService';
import UserData from '../models/UserData';
import PlayerCollection from '../models/PlayerCollection';
import { TokenService } from '../middleware/AuthData';

// État d'un utilisateur connecté
export class AuthenticatedUser extends Schema {
  @type("string") userId: string = "";
  @type("string") username: string = "";
  @type("string") displayName: string = "";
  @type("number") level: number = 1;
  @type("number") trophies: number = 0;
  @type("string") status: string = "online"; // online, away, busy
  @type("number") loginTime: number = 0;
  @type("boolean") isVerified: boolean = false;
}

// État global de la room d'auth
export class AuthRoomState extends Schema {
  @type({ map: AuthenticatedUser }) users = new MapSchema<AuthenticatedUser>();
  @type("number") totalOnlineUsers: number = 0;
  @type("number") serverTime: number = Date.now();
  @type("boolean") maintenanceMode: boolean = false;
  @type("string") serverMessage: string = "";
}

// Messages client -> serveur
interface LoginMessage {
  identifier: string;
  password: string;
}

interface RefreshTokenMessage {
  refreshToken: string;
}

interface LogoutMessage {}

interface JoinWorldMessage {}

/**
 * AuthRoom - Room dédiée à l'authentification
 * Les clients se connectent ici en premier pour s'authentifier
 * Une fois auth OK, ils peuvent rejoindre WorldRoom
 */
export class AuthRoom extends Room<AuthRoomState> {
  private logger!: ActionLoggerService;
  private heartbeatTimer?: NodeJS.Timeout;
  
  // Cache pour éviter de reload les users trop souvent
  private userDataCache = new Map<string, { user: any, collection: any }>();
  
  private config = {
    maxClients: 1000,
    heartbeatInterval: 30000, // 30 secondes
    sessionTimeout: 1800000,  // 30 minutes
    allowAnonymous: false,    // Forcer l'authentification
  };

  async onCreate(options: any) {
    this.setState(new AuthRoomState());
    
    // Initialiser le logger
    this.logger = getActionLogger();
    
    console.log('🔐 AuthRoom created with options:', options);
    
    // Configuration
    this.maxClients = this.config.maxClients;
    this.setPrivate(false); // Public pour que les clients puissent s'y connecter
    
    // Setup des message handlers
    this.setupMessageHandlers();
    
    // Démarrer le heartbeat
    this.startHeartbeat();
    
    // Message de bienvenue
    this.state.serverMessage = "Welcome! Please authenticate to continue.";
    
    await this.logger.log('system', 'session_started', {
      roomType: 'auth_room',
      maxClients: this.maxClients,
      roomId: this.roomId
    });
  }

  async onJoin(client: Client, options: any, auth?: any) {
    console.log(`🔑 Client ${client.sessionId} connecting to AuthRoom`);
    
    // Pas d'authentification automatique ici
    // Le client doit envoyer un message 'login' ou 'refresh_token'
    
    // Envoyer le message d'accueil
    client.send('auth_required', {
      message: 'Please provide your credentials or refresh token',
      methods: ['login', 'refresh_token'],
      serverTime: Date.now()
    });
    
    // Timeout pour forcer la déconnexion si pas d'auth
    setTimeout(() => {
      if (!this.state.users.has(client.sessionId)) {
        console.log(`⏰ Client ${client.sessionId} timeout - no authentication`);
        client.send('auth_timeout', { message: 'Authentication timeout' });
        client.leave();
      }
    }, 30000); // 30 secondes pour s'authentifier
  }

  async onLeave(client: Client, consented: boolean) {
    const user = this.state.users.get(client.sessionId);
    if (user) {
      console.log(`🚪 User ${user.username} disconnected from AuthRoom`);
      
      // Logger la déconnexion
      await this.logger.logNavigation('session_ended', user.userId, {
        scene: 'auth_room',
        sessionDuration: Date.now() - user.loginTime,
        consented
      });
      
      // Nettoyer
      this.state.users.delete(client.sessionId);
      this.userDataCache.delete(client.sessionId);
      this.state.totalOnlineUsers = this.state.users.size;
      
      // Broadcast déconnexion
      this.broadcast('user_disconnected', {
        username: user.username,
        totalUsers: this.state.totalOnlineUsers
      }, { except: client });
    }
  }

  onDispose() {
    console.log('🔐 AuthRoom disposing...');
    
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.userDataCache.clear();
    
    console.log('✅ AuthRoom disposed');
  }

  /**
   * Setup des handlers de messages
   */
  private setupMessageHandlers() {
    // Login avec username/email + password
    this.onMessage('login', async (client, message: LoginMessage) => {
      await this.handleLogin(client, message);
    });
    
    // Refresh token
    this.onMessage('refresh_token', async (client, message: RefreshTokenMessage) => {
      await this.handleRefreshToken(client, message);
    });
    
    // Logout
    this.onMessage('logout', async (client, message: LogoutMessage) => {
      await this.handleLogout(client, message);
    });
    
    // Rejoindre le monde (après auth)
    this.onMessage('join_world', async (client, message: JoinWorldMessage) => {
      await this.handleJoinWorld(client, message);
    });
    
    // Ping pour maintenir la connexion
    this.onMessage('ping', (client) => {
      client.send('pong', { serverTime: Date.now() });
    });
  }

  /**
   * Gérer le login
   */
  private async handleLogin(client: Client, message: LoginMessage) {
    try {
      const { identifier, password } = message;
      
      if (!identifier || !password) {
        client.send('auth_error', { 
          message: 'Username/email and password required',
          code: 'MISSING_CREDENTIALS'
        });
        return;
      }
      
      // Trouver l'utilisateur
      const user = await UserData.findOne({
        $or: [
          { email: identifier.toLowerCase() },
          { username: identifier }
        ]
      }).select('+password');
      
      if (!user || !user.isActive) {
        client.send('auth_error', {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
        
        await this.logger.logNavigation('login_failed', 'unknown', {
          identifier: identifier.substring(0, 3) + '***', // Partiel pour sécurité
          reason: 'invalid_credentials'
        });
        return;
      }
      
      // Vérifier le mot de passe
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        client.send('auth_error', {
          message: 'Invalid credentials', 
          code: 'INVALID_CREDENTIALS'
        });
        
        await this.logger.logNavigation('login_failed', user._id.toString(), {
          reason: 'wrong_password'
        });
        return;
      }
      
      // Authentification réussie
      await this.authenticateUser(client, user);
      
    } catch (error) {
      console.error('Login error:', error);
      client.send('auth_error', {
        message: 'Authentication failed',
        code: 'AUTH_ERROR'
      });
    }
  }

  /**
   * Gérer le refresh token
   */
  private async handleRefreshToken(client: Client, message: RefreshTokenMessage) {
    try {
      const { refreshToken } = message;
      
      if (!refreshToken) {
        client.send('auth_error', {
          message: 'Refresh token required',
          code: 'MISSING_REFRESH_TOKEN'
        });
        return;
      }
      
      // Vérifier le refresh token
      const decoded = TokenService.verifyRefreshToken(refreshToken);
      
      // Trouver l'utilisateur
      const user = await UserData.findById(decoded.userId);
      if (!user || !user.isActive) {
        client.send('auth_error', {
          message: 'User not found or inactive',
          code: 'USER_NOT_FOUND'
        });
        return;
      }
      
      // Vérifier que le refresh token existe
      if (!user.refreshTokens.includes(refreshToken)) {
        client.send('auth_error', {
          message: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
        return;
      }
      
      // Authentification réussie avec refresh token
      await this.authenticateUser(client, user);
      
    } catch (error) {
      console.error('Refresh token error:', error);
      client.send('auth_error', {
        message: 'Token refresh failed',
        code: 'REFRESH_ERROR'
      });
    }
  }

  /**
   * Authentifier un utilisateur (commun à login et refresh)
   */
  private async authenticateUser(client: Client, user: any) {
    // Vérifier si déjà connecté ailleurs
    const existingSession = Array.from(this.state.users.entries())
      .find(([_, u]) => u.userId === user._id.toString());
      
    if (existingSession) {
      // Déconnecter l'ancienne session
      const [oldSessionId] = existingSession;
      const oldClient = this.clients.find(c => c.sessionId === oldSessionId);
      if (oldClient) {
        oldClient.send('session_replaced', { message: 'Logged in from another device' });
        oldClient.leave();
      }
    }
    
    // Charger la collection
    const collection = await this.loadUserCollection(user._id);
    
    // Créer l'état utilisateur
    const authenticatedUser = new AuthenticatedUser();
    authenticatedUser.userId = user._id.toString();
    authenticatedUser.username = user.username;
    authenticatedUser.displayName = user.displayName;
    authenticatedUser.level = user.level;
    authenticatedUser.trophies = user.stats.currentTrophies;
    authenticatedUser.loginTime = Date.now();
    authenticatedUser.isVerified = user.isVerified;
    
    // Ajouter à l'état
    this.state.users.set(client.sessionId, authenticatedUser);
    this.state.totalOnlineUsers = this.state.users.size;
    
    // Cache
    this.userDataCache.set(client.sessionId, { user, collection });
    
    // Générer les tokens
    const { accessToken, refreshToken } = TokenService.generateTokenPair(user);
    
    // Sauvegarder le refresh token
    user.addRefreshToken(refreshToken);
    user.lastLogin = new Date();
    await user.save();
    
    // Logger l'authentification réussie
    await this.logger.logNavigation('login_success', user._id.toString(), {
      scene: 'auth_room',
      username: user.username,
      level: user.level,
      trophies: user.stats.currentTrophies
    });
    
    // Envoyer la réponse d'authentification
    client.send('auth_success', {
      message: 'Authentication successful',
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        level: user.level,
        trophies: user.stats.currentTrophies,
        isVerified: user.isVerified
      },
      tokens: {
        accessToken,
        refreshToken
      },
      collection: collection ? {
        gold: collection.gold,
        gems: collection.gems,
        totalCards: collection.cards.length
      } : null,
      nextStep: 'join_world'
    });
    
    // Broadcast nouvelle connexion
    this.broadcast('user_connected', {
      username: user.username,
      level: user.level,
      totalUsers: this.state.totalOnlineUsers
    }, { except: client });
    
    console.log(`✅ User ${user.username} authenticated successfully`);
  }

  /**
   * Gérer la déconnexion
   */
  private async handleLogout(client: Client, _message: LogoutMessage) {
    const user = this.state.users.get(client.sessionId);
    if (!user) return;
    
    // Logger la déconnexion volontaire
    await this.logger.logNavigation('logout', user.userId, {
      scene: 'auth_room',
      sessionDuration: Date.now() - user.loginTime
    });
    
    // Répondre puis déconnecter
    client.send('logout_success', { message: 'Logged out successfully' });
    client.leave();
  }

  /**
   * Gérer la demande de rejoindre le monde
   */
  private async handleJoinWorld(client: Client, _message: JoinWorldMessage) {
    const user = this.state.users.get(client.sessionId);
    if (!user) {
      client.send('error', { message: 'Not authenticated' });
      return;
    }
    
    const userData = this.userDataCache.get(client.sessionId);
    if (!userData) {
      client.send('error', { message: 'User data not found' });
      return;
    }
    
    // Logger la transition vers le monde
    await this.logger.logNavigation('world_join_requested', user.userId, {
      scene: 'auth_room',
      targetScene: 'world_room'
    });
    
    // Donner les informations pour rejoindre WorldRoom
    client.send('world_join_info', {
      message: 'Ready to join world',
      worldRoomName: 'world',
      authToken: TokenService.generateAccessToken(userData.user),
      userData: {
        userId: user.userId,
        username: user.username,
        displayName: user.displayName,
        level: user.level,
        trophies: user.trophies
      }
    });
  }

  /**
   * Charger la collection d'un utilisateur
   */
  private async loadUserCollection(userId: string) {
    try {
      const PlayerCollection = (await import('../models/PlayerCollection')).default;
      let collection = await PlayerCollection.findOne({ userId });
      
      // Créer collection si nécessaire
      if (!collection) {
        const { createInitialCollection } = await import('../scripts/initPlayerCollection');
        collection = await createInitialCollection(userId);
      }
      
      return collection;
    } catch (error) {
      console.error('Error loading user collection:', error);
      return null;
    }
  }

  /**
   * Démarrer le heartbeat
   */
  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.state.serverTime = Date.now();
      
      // Vérifier les sessions expirées
      const now = Date.now();
      for (const [sessionId, user] of this.state.users) {
        if (now - user.loginTime > this.config.sessionTimeout) {
          const client = this.clients.find(c => c.sessionId === sessionId);
          if (client) {
            client.send('session_expired', { message: 'Session expired' });
            client.leave();
          }
        }
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Obtenir les statistiques
   */
  getStats() {
    return {
      totalOnlineUsers: this.state.totalOnlineUsers,
      averageSessionDuration: this.calculateAverageSessionDuration(),
      recentLogins: this.getRecentLogins()
    };
  }

  private calculateAverageSessionDuration(): number {
    const now = Date.now();
    const durations = Array.from(this.state.users.values())
      .map(user => now - user.loginTime);
    
    return durations.length > 0 
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;
  }

  private getRecentLogins() {
    const now = Date.now();
    return Array.from(this.state.users.values())
      .filter(user => now - user.loginTime < 300000) // 5 minutes
      .map(user => ({
        username: user.username,
        level: user.level,
        loginTime: user.loginTime
      }));
  }
}
