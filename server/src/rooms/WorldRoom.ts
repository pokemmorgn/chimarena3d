import { Room, Client, ServerError } from 'colyseus';
import { Schema, MapSchema, type } from '@colyseus/schema';
import { getMatchmakingService, MatchmakingService, IMatch, IQueuedPlayer } from '../services/MatchmakingService';
import { getActionLogger, ActionLoggerService } from '../services/ActionLoggerService';
import UserData from '../models/UserData';
import PlayerCollection from '../models/PlayerCollection';
import * as http from 'http';

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

interface JoinQueueMessage { deckIndex?: number; }
interface LeaveQueueMessage {}
interface ReadyStatusMessage { isReady: boolean; }
interface ChatMessage { message: string; channel?: 'global' | 'help'; }

export class WorldRoom extends Room<WorldRoomState> {
  private matchmaking!: MatchmakingService;
  private logger!: ActionLoggerService;
  private heartbeatTimer?: NodeJS.Timeout;
  private statsUpdateTimer?: NodeJS.Timeout;
  private userDataCache = new Map<string, { user: any, collection: any }>();

  private config = {
    maxPlayersInLobby: 500,
    heartbeatInterval: 5000,
    statsUpdateInterval: 10000,
    chatRateLimit: 3,
    autoKickAfterSeconds: 300,
  };

async onAuth(_client: Client, options: any, _request?: http.IncomingMessage) {
    const userId = options?.auth?.userId;
    if (!userId) throw new ServerError(401, 'Authentication required');
    return { userId }; // 🔧 Injecte userId dans client.auth
  }

  async onCreate(options: any) {
    this.setState(new WorldRoomState());
    this.matchmaking = getMatchmakingService();
    this.logger = getActionLogger();

    console.log('🌍 WorldRoom created with options:', options);

    this.maxClients = this.config.maxPlayersInLobby;
    this.setPrivate(false);

    this.setupMatchmakingEvents();
    this.setupMessageHandlers();
    this.startHeartbeat();
    this.startStatsUpdate();

    this.state.announcement = "Welcome to Clash Royale! Ready to battle?";

    await this.logger.log('system', 'session_started', {
      roomType: 'world_room',
      maxClients: this.maxClients,
      roomId: this.roomId
    });
  }

  async onJoin(client: Client, options: any) {
    try {
      console.log(`👤 Player ${client.sessionId} joining WorldRoom`);

      const auth = client.auth; // 🔧 Récupère auth injecté par onAuth
      if (!auth || !auth.userId) throw new ServerError(401, 'Authentication required');

      const userData = await this.loadUserData(auth.userId);
      if (!userData.user) throw new ServerError(404, 'User not found');
      if (this.state.players.has(client.sessionId)) throw new ServerError(409, 'Already connected');

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

      this.state.players.set(client.sessionId, playerState);
      this.state.totalPlayers = this.state.players.size;
      this.userDataCache.set(client.sessionId, { user: userData.user, collection: userData.collection });

      await this.logger.logNavigation('app_opened', playerState.userId, {
        scene: 'world_lobby',
        trophies: playerState.trophies,
        level: playerState.level
      });

      client.send('welcome', {
        message: `Welcome back, ${playerState.displayName}!`,
        serverTime: Date.now(),
        onlinePlayers: this.state.totalPlayers
      });

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

    if (playerState.status === "searching") {
      await this.matchmaking.removePlayerFromQueue(client.sessionId);
    }

    await this.logger.logNavigation('app_closed', playerState.userId, {
      scene: 'world_lobby',
      sessionDuration: Date.now() - playerState.joinTime,
      consented
    });

    this.state.players.delete(client.sessionId);
    this.userDataCache.delete(client.sessionId);
    this.state.totalPlayers = this.state.players.size;

    this.broadcast('player_left', {
      username: playerState.username,
      totalPlayers: this.state.totalPlayers
    });

    console.log(`✅ ${playerState.username} left WorldRoom (${this.state.totalPlayers} remaining)`);
  }

  onDispose() {
    console.log('🌍 WorldRoom disposing...');
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.statsUpdateTimer) clearInterval(this.statsUpdateTimer);
    this.userDataCache.clear();
    console.log('✅ WorldRoom disposed');
  }

  private setupMatchmakingEvents() {
    this.matchmaking.on('matchFound', async (match: IMatch) => {
      console.log(`⚔️ Match found: ${match.matchId}`);

      const player1Client = this.clients.find(c => c.sessionId === match.player1.sessionId);
      const player2Client = this.clients.find(c => c.sessionId === match.player2.sessionId);

      if (player1Client) {
        const playerState1 = this.state.players.get(player1Client.sessionId);
        if (playerState1) playerState1.status = "in_match";
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
        if (playerState2) playerState2.status = "in_match";
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
      if (playerState) playerState.status = "searching";
      this.updateMatchmakingStats();
    });

    this.matchmaking.on('playerLeft', (player: IQueuedPlayer) => {
      const playerState = this.state.players.get(player.sessionId);
      if (playerState) playerState.status = "idle";
      this.updateMatchmakingStats();
    });
  }

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

  // 🔧 AJOUT : Handler pour les pings de maintien de connexion
  this.onMessage('ping', (client) => {
    this.handlePing(client);
  });

  // 🔧 NOUVELLE MÉTHODE : Gérer les pings
  private handlePing(client: Client) {
    const playerState = this.state.players.get(client.sessionId);
    
    // Optionnel : mettre à jour le timestamp de dernière activité
    if (playerState) {
      playerState.joinTime = Date.now(); // Ou ajouter un champ lastActivity si vous préférez
    }
    
    // Répondre avec un pong
    client.send('pong', { 
      serverTime: Date.now(),
      sessionId: client.sessionId,
      status: 'ok'
    });
    
    // Log optionnel pour debug (à supprimer en production)
    console.log(`🏓 Ping received from ${playerState?.username || client.sessionId}`);
  }
}

  private async handleJoinQueue(client: Client, message: JoinQueueMessage) {
    const playerState = this.state.players.get(client.sessionId);
    if (!playerState) return client.send('error', { message: 'Player state not found' });
    if (playerState.status === "searching") return client.send('error', { message: 'Already in queue' });

    const userData = this.userDataCache.get(client.sessionId);
    if (!userData) return client.send('error', { message: 'User data not found' });

    const deckIndex = message.deckIndex || 0;
    const deck = userData.collection?.getDeck(deckIndex);
    if (!deck || deck.length !== 8) return client.send('error', { message: 'Invalid deck selected' });

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
    if (!success) return client.send('error', { message: 'Failed to join queue' });

    playerState.status = "searching";

    client.send('queue_joined', {
      position: this.matchmaking.getPlayerQueuePosition(client.sessionId),
      estimatedWaitTime: 15000
    });

    console.log(`🎯 ${playerState.username} joined matchmaking queue`);
  }

  private async handleLeaveQueue(client: Client, _message: LeaveQueueMessage) {
    const playerState = this.state.players.get(client.sessionId);
    if (!playerState) return;
    if (playerState.status !== "searching") return client.send('error', { message: 'Not in queue' });

    const success = await this.matchmaking.removePlayerFromQueue(client.sessionId);
    if (success) {
      playerState.status = "idle";
      client.send('queue_left', { reason: 'manual' });
      console.log(`🚪 ${playerState.username} left matchmaking queue`);
    }
  }

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

  private async handleChat(client: Client, message: ChatMessage) {
    const playerState = this.state.players.get(client.sessionId);
    if (!playerState) return;
    if (!message.message || message.message.trim().length === 0) return;
    if (message.message.length > 200) return;

    const chatData = {
      from: playerState.username,
      message: message.message.trim(),
      channel: message.channel || 'global',
      timestamp: Date.now(),
      level: playerState.level,
      trophies: playerState.trophies
    };

    await this.logger.logNavigation('message_sent', playerState.userId, {
      channel: chatData.channel,
      messageLength: chatData.message.length
    });

    this.broadcast('chat_message', chatData);

    console.log(`💬 [${chatData.channel}] ${playerState.username}: ${message.message}`);
  }

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

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.state.serverTime = Date.now();
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

  private startStatsUpdate() {
    this.statsUpdateTimer = setInterval(() => {
      this.updateMatchmakingStats();
    }, this.config.statsUpdateInterval);
  }

  private updateMatchmakingStats() {
    const stats = this.matchmaking.getStats();
    this.state.playersInQueue = stats.currentQueueSize;
    this.state.activeMatches = stats.activeMatchesCount;
  }
}
