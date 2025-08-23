import { Room, Client, ServerError } from 'colyseus';
import { Schema, MapSchema, type } from '@colyseus/schema';
import { getMatchmakingService, MatchmakingService, IMatch, IQueuedPlayer } from '../services/MatchmakingService';
import { getActionLogger, ActionLoggerService } from '../services/ActionLoggerService';
import UserData from '../models/UserData';
import PlayerCollection from '../models/PlayerCollection';

// État d'un joueur dans le lobby
export class PlayerState extends Schema {
  @type("string") userId: string = "";
  @type("string") username: string = "";
  @type("string") displayName: string = "";
  @type("number") level: number = 1;
  @type("number") trophies: number = 0;
  @type("number") averageCardLevel: number = 1;
  @type("string") status: string = "idle"; // idle, searching, in_match
  @type("number") joinTime: number = 0;
  @type("boolean") isReady: boolean = false;
  @type("string") region: string = "";
}

// État global du lobby
export class WorldRoomState extends Schema {
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type("number") totalPlayers: number = 0;
  @type("number") playersInQueue: number = 0;
  @type("number") activeMatches: number = 0;
  @type("number") serverTime: number = Date.now();
  @type("string") announcement: string = "";
  @type("boolean") maintenanceMode: boolean = false;
}

// Messages client -> serveur
interface JoinQueueMessage {
  deckIndex?: number;
}

interface LeaveQueueMessage {}

interface ReadyStatusMessage {
  isReady: boolean;
}

interface ChatMessage {
  message: string;
  channel?: 'global' | 'help';
}

/**
 * WorldRoom - Lobby principal du jeu
 * Gère les connexions, matchmaking, chat global, annonces
 */
export class WorldRoom extends Room<WorldRoomState> {
  private matchmaking!: MatchmakingService;
  private logger!: ActionLoggerService;
  private heartbeatTimer?: NodeJS.Timeout;
  private statsUpdateTimer?: NodeJS.Timeout;
  
  // Cache des données utilisateur
  private userDataCache = new Map<string, { user: any, collection: any }>();
  
  // Configuration
  private config = {
    maxPlayersInLobby: 500,
    heartbeatInterval: 5000, // 5 secondes
    statsUpdateInterval: 10000, // 10 secondes
    chatRateLimit: 3, // 3 messages par minute
    autoKickAfterSeconds: 300, // 5 minutes d'inactivité
  };

  async onCreate(options: any) {
    this.setState(new WorldRoomState());
    
    // Initialiser les services
    this.matchmaking = getMatchmakingService();
    this.logger = getActionLogger();
    
    console.log('🌍 WorldRoom created with options:', options);
    
    // Configuration de la room
    this.maxClients = this.config.maxPlayersInLobby;
    this.setPrivate(false); // Room publique
    
    // Setup des event listeners
    this.setupMatchmakingEvents();
    this.setupMessageHandlers();
    
    // Démarrer les timers
    this.startHeartbeat();
    this.startStatsUpdate();
    
    // Annonce de bienvenue
    this.state.announcement = "Welcome to Clash Royale! Ready to battle?";
    
    await this.logger.log('system', 'session_started', {
      roomType: 'world_room',
      maxClients: this.maxClients,
      roomId: this.roomId
    });
  }

  async onJoin(client: Client, options: any, auth?: any) {
    try {
      console.log(`👤 Player ${client.sessionId} joining WorldRoom`);
      
      // Vérifier l'authentification
      if (!auth || !auth.userId) {
        throw new ServerError(401, 'Authentication required');
      }
      
      // Charger les données utilisateur
      const userData = await this.loadUserData(auth.userId);
      if (!userData.user) {
        throw new ServerError(404, 'User not found');
      }
      
      // Vérifier si pas déjà connecté
      if (this.state.players.has(client.sessionId)) {
        throw new ServerError(409, 'Already connected');
      }
      
      // Créer l'état du joueur
      const playerState = new PlayerState();
      playerState.userId = (userData.user._id as any).toString();
      playerState.username = userData.user.username;
      playerState.displayName = userData.user.displayName;
      playerState.level = userData.user.level;
      playerState.trophies = userData.user.stats.currentTrophies;
      playerState.averageCardLevel = userData.collection?.stats.averageCardLevel || 1;
      playerState.status = "idle";
      playerState.joinTime = Date.now();
      playerState.region = options.region || "unknown";
      
      // Ajouter à l'état
      this.state.players.set(client.sessionId, playerState);
      this.state.totalPlayers = this.state.players.size;
      
      // Cache des données
      this.userDataCache.set(client.sessionId, { user: userData.user, collection: userData.collection });
      
      // Logger l'action
      await this.logger.logNavigation('app_opened', playerState.userId, {
        scene: 'world_lobby',
        trophies: playerState.trophies,
        level: playerState.level
      });
      
      // Envoyer message de bienvenue
      client.send('welcome', {
        message: `Welcome back, ${playerState.displayName}!`,
        serverTime: Date.now(),
        onlinePlayers: this.state.totalPlayers
      });
      
      // Broadcast nouvelle connexion
      this.broadcast('player_joined', {
        username: playerState.username,
        totalPlayers: this.state.totalPlayers
      }, { except: client });
      
      console.log(`✅ ${playerState.username} joined WorldRoom (${this.state.totalPlayers} total)`);
      
    } catch (error) {
      console.error('❌ Error in onJoin:', error);
      throw error;
    }
  }

  async onLeave(client: Client, consented: boolean) {
    const playerState = this.state.players.get(client.sessionId);
    if (!playerState) return;
    
    console.log(`👋 Player ${playerState.username} leaving WorldRoom`);
    
    // Retirer de la queue de matchmaking si nécessaire
    if (playerState.status === "searching") {
      await this.matchmaking.removePlayerFromQueue(client.sessionId);
    }
    
    // Logger la déconnexion
    await this.logger.logNavigation('app_closed', playerState.userId, {
      scene: 'world_lobby',
      sessionDuration: Date.now() - playerState.joinTime,
      consented
    });
    
    // Nettoyer
    this.state.players.delete(client.sessionId);
    this.userDataCache.delete(client.sessionId);
    this.state.totalPlayers = this.state.players.size;
    
    // Broadcast déconnexion
    this.broadcast('player_left', {
      username: playerState.username,
      totalPlayers: this.state.totalPlayers
    });
    
    console.log(`✅ ${playerState.username} left WorldRoom (${this.state.totalPlayers} remaining)`);
  }

  onDispose() {
    console.log('🌍 WorldRoom disposing...');
    
    // Arrêter les timers
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.statsUpdateTimer) clearInterval(this.statsUpdateTimer);
    
    // Nettoyer les caches
    this.userDataCache.clear();
    
    console.log('✅ WorldRoom disposed');
  }

  /**
   * Setup des event listeners pour le matchmaking
   */
  private setupMatchmakingEvents() {
    this.matchmaking.on('matchFound', async (match: IMatch) => {
      console.log(`⚔️ Match found: ${match.matchId}`);
      
      // Notifier les joueurs du match
      const player1Client = this.clients.find(c => c.sessionId === match.player1.sessionId);
      const player2Client = this.clients.find(c => c.sessionId === match.player2.sessionId);
      
      if (player1Client) {
        const playerState1 = this.state.players.get(player1Client.sessionId);
        if (playerState1) {
          playerState1.status = "in_match";
        }
        
        player1Client.send('match_found', {
          matchId: match.matchId,
          opponent: {
            username: match.player2.username,
            trophies: match.player2.trophies,
            level: match.player2.level,
            isBot: match.player2.isBot || false
          },
          waitTime: match.player1.waitTime,
          averageTrophies: match.averageTrophies
        });
      }
      
      if (player2Client && !match.player2.isBot) {
        const playerState2 = this.state.players.get(player2Client.sessionId);
        if (playerState2) {
          playerState2.status = "in_match";
        }
        
        player2Client.send('match_found', {
          matchId: match.matchId,
          opponent: {
            username: match.player1.username,
            trophies: match.player1.trophies,
            level: match.player1.level,
            isBot: false
          },
          waitTime: match.player2.waitTime,
          averageTrophies: match.averageTrophies
        });
      }
      
      this.updateMatchmakingStats();
    });
    
    this.matchmaking.on('playerQueued', (player: IQueuedPlayer) => {
      const playerState = this.state.players.get(player.sessionId);
      if (playerState) {
        playerState.status = "searching";
      }
      this.updateMatchmakingStats();
    });
    
    this.matchmaking.on('playerLeft', (player: IQueuedPlayer) => {
      const playerState = this.state.players.get(player.sessionId);
      if (playerState) {
        playerState.status = "idle";
      }
      this.updateMatchmakingStats();
    });
  }

  /**
   * Setup des handlers de messages
   */
  private setupMessageHandlers() {
    this.onMessage('join_queue', async (client, message: JoinQueueMessage) => {
      await this.handleJoinQueue(client, message);
    });
    
    this.onMessage('leave_queue', async (client, message: LeaveQueueMessage) => {
      await this.handleLeaveQueue(client, message);
    });
    
    this.onMessage('ready_status', async (client, message: ReadyStatusMessage) => {
      await this.handleReadyStatus(client, message);
    });
    
    this.onMessage('chat', async (client, message: ChatMessage) => {
      await this.handleChat(client, message);
    });
    
    this.onMessage('get_stats', async (client) => {
      await this.handleGetStats(client);
    });
  }

  /**
   * Gérer l'entrée en queue
   */
  private async handleJoinQueue(client: Client, message: JoinQueueMessage) {
    const playerState = this.state.players.get(client.sessionId);
    if (!playerState) {
      client.send('error', { message: 'Player state not found' });
      return;
    }
    
    if (playerState.status === "searching") {
      client.send('error', { message: 'Already in queue' });
      return;
    }
    
    const userData = this.userDataCache.get(client.sessionId);
    if (!userData) {
      client.send('error', { message: 'User data not found' });
      return;
    }
    
    // Vérifier que le joueur a un deck valide
    const deckIndex = message.deckIndex || 0;
    const deck = userData.collection?.getDeck(deckIndex);
    if (!deck || deck.length !== 8) {
      client.send('error', { message: 'Invalid deck selected' });
      return;
    }
    
    // Ajouter à la queue de matchmaking
    const queuePlayer: Omit<IQueuedPlayer, 'joinTime' | 'waitTime' | 'trophyRange' | 'maxWaitTime'> = {
      sessionId: client.sessionId,
      userId: playerState.userId,
      username: playerState.username,
      trophies: playerState.trophies,
      level: playerState.level,
      averageCardLevel: playerState.averageCardLevel,
      region: playerState.region
    };
    
    const success = await this.matchmaking.addPlayerToQueue(queuePlayer);
    if (!success) {
      client.send('error', { message: 'Failed to join queue' });
      return;
    }
    
    playerState.status = "searching";
    
    client.send('queue_joined', {
      position: this.matchmaking.getPlayerQueuePosition(client.sessionId),
      estimatedWaitTime: 15000 // 15 secondes estimé
    });
    
    console.log(`🎯 ${playerState.username} joined matchmaking queue`);
  }

  /**
   * Gérer la sortie de queue
   */
  private async handleLeaveQueue(client: Client, _message: LeaveQueueMessage) {
    const playerState = this.state.players.get(client.sessionId);
    if (!playerState) return;
    
    if (playerState.status !== "searching") {
      client.send('error', { message: 'Not in queue' });
      return;
    }
    
    const success = await this.matchmaking.removePlayerFromQueue(client.sessionId);
    if (success) {
      playerState.status = "idle";
      client.send('queue_left', { reason: 'manual' });
      console.log(`🚪 ${playerState.username} left matchmaking queue`);
    }
  }

  /**
   * Gérer le statut ready
   */
  private async handleReadyStatus(client: Client, message: ReadyStatusMessage) {
    const playerState = this.state.players.get(client.sessionId);
    if (!playerState) return;
    
    playerState.isReady = message.isReady;
    
    await this.logger.logNavigation('button_clicked', playerState.userId, {
      button: 'ready_toggle',
      newState: message.isReady
    });
    
    this.broadcast('player_ready_changed', {
      sessionId: client.sessionId,
      username: playerState.username,
      isReady: message.isReady
    });
  }

  /**
   * Gérer le chat
   */
  private async handleChat(client: Client, message: ChatMessage) {
    const playerState = this.state.players.get(client.sessionId);
    if (!playerState) return;
    
    // Validation basique
    if (!message.message || message.message.trim().length === 0) return;
    if (message.message.length > 200) return; // Limite de caractères
    
    const chatData = {
      from: playerState.username,
      message: message.message.trim(),
      channel: message.channel || 'global',
      timestamp: Date.now(),
      level: playerState.level,
      trophies: playerState.trophies
    };
    
    // Logger le message
    await this.logger.logNavigation('message_sent', playerState.userId, {
      channel: chatData.channel,
      messageLength: chatData.message.length
    });
    
    // Broadcast à tous les joueurs
    this.broadcast('chat_message', chatData);
    
    console.log(`💬 [${chatData.channel}] ${playerState.username}: ${message.message}`);
  }

  /**
   * Envoyer les statistiques à un joueur
   */
  private async handleGetStats(client: Client) {
    const matchmakingStats = this.matchmaking.getStats();
    
    client.send('stats_update', {
      lobby: {
        totalPlayers: this.state.totalPlayers,
        playersInQueue: this.state.playersInQueue,
        activeMatches: this.state.activeMatches
      },
      matchmaking: matchmakingStats,
      server: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      }
    });
  }

  /**
   * Charger les données utilisateur
   */
  private async loadUserData(userId: string) {
    try {
      const user = await UserData.findById(userId);
      const collection = await PlayerCollection.findOne({ userId });
      
      return { user, collection };
    } catch (error) {
      console.error('Error loading user data:', error);
      return { user: null, collection: null };
    }
  }

  /**
   * Démarrer le heartbeat
   */
  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.state.serverTime = Date.now();
      
      // Vérifier les joueurs inactifs
      const now = Date.now();
      for (const [sessionId, playerState] of this.state.players) {
        const inactiveTime = now - playerState.joinTime;
        if (inactiveTime > this.config.autoKickAfterSeconds * 1000) {
          const client = this.clients.find(c => c.sessionId === sessionId);
          if (client) {
            client.send('kicked', { reason: 'inactivity' });
            client.leave();
          }
        }
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Mettre à jour les statistiques
   */
  private startStatsUpdate() {
    this.statsUpdateTimer = setInterval(() => {
      this.updateMatchmakingStats();
    }, this.config.statsUpdateInterval);
  }

  /**
   * Mettre à jour les stats de matchmaking
   */
  private updateMatchmakingStats() {
    const stats = this.matchmaking.getStats();
    this.state.playersInQueue = stats.currentQueueSize;
    this.state.activeMatches = stats.activeMatchesCount;
  }
}
