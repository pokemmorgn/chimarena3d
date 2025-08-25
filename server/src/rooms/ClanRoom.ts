import { Room, Client, ServerError } from 'colyseus';
import { Schema, MapSchema, ArraySchema, type } from '@colyseus/schema';
import { Types } from 'mongoose';
import * as http from 'http';

// Import des services et models
import { getClanService, ClanService } from '../services/ClanService';
import { getActionLogger, ActionLoggerService } from '../services/ActionLoggerService';
import Clan, { IClan, IClanMember, IClanChatMessage } from '../models/Clan';
import UserData from '../models/UserData';

// ===== SCHEMA STATES =====

export class ClanMemberState extends Schema {
  @type("string") userId: string = "";
  @type("string") username: string = "";
  @type("string") displayName: string = "";
  @type("number") level: number = 1;
  @type("number") trophies: number = 0;
  @type("string") role: string = "member"; // leader, co-leader, elder, member
  @type("number") donationsGiven: number = 0;
  @type("number") donationsReceived: number = 0;
  @type("boolean") isOnline: boolean = false;
  @type("number") lastSeen: number = 0;
  @type("number") joinedAt: number = 0;
}

export class ClanChatMessageState extends Schema {
  @type("string") messageId: string = "";
  @type("string") authorId: string = "";
  @type("string") authorUsername: string = "";
  @type("string") authorRole: string = "member";
  @type("string") content: string = "";
  @type("string") type: string = "text"; // text, donation_request, donation_fulfilled, system
  @type("number") timestamp: number = 0;
  
  // Données de donation (sérialisées en JSON string)
  @type("string") donationData: string = ""; // JSON stringifié
  @type("boolean") isVisible: boolean = true;
}

export class ClanStatsState extends Schema {
  @type("number") totalMembers: number = 0;
  @type("number") onlineMembers: number = 0;
  @type("number") totalTrophies: number = 0;
  @type("number") averageTrophies: number = 0;
  @type("number") totalDonations: number = 0;
  @type("number") messagesLast24h: number = 0;
  @type("number") donationsLast24h: number = 0;
  @type("number") activeMembers: number = 0;
  @type("number") warWins: number = 0;
  @type("number") warLosses: number = 0;
  @type("number") warWinRate: number = 0;
}

export class ClanRoomState extends Schema {
  // Informations de base du clan
  @type("string") clanId: string = "";
  @type("string") name: string = "";
  @type("string") tag: string = "";
  @type("string") description: string = "";
  @type("string") badge: string = "default_badge";
  @type("string") type: string = "open"; // open, invite_only, closed
  @type("number") requiredTrophies: number = 0;
  @type("string") region: string = "global";
  
  // Membres du clan
  @type({ map: ClanMemberState }) members = new MapSchema<ClanMemberState>();
  @type("number") memberCount: number = 0;
  @type("number") maxMembers: number = 50;
  
  // Chat du clan (derniers messages)
  @type([ClanChatMessageState]) chatMessages = new ArraySchema<ClanChatMessageState>();
  
  // Statistiques du clan
  @type(ClanStatsState) stats = new ClanStatsState();
  
  // État de la room
  @type("number") serverTime: number = Date.now();
  @type("boolean") isActive: boolean = true;
  @type("string") announcement: string = "";
}

// ===== INTERFACES =====

interface JoinRoomAuth {
  userId: string;
  clanId: string;
}

interface ChatMessageData {
  content: string;
}

interface DonationRequestData {
  cardId: string;
  amount?: number;
}

interface DonationGiveData {
  messageId: string;
  amount: number;
}

interface MemberActionData {
  targetUserId: string;
  reason?: string;
}

// ===== CLAN ROOM =====

export class ClanRoom extends Room<ClanRoomState> {
  private clanService!: ClanService;
  private logger!: ActionLoggerService;
  private clanData!: IClan;
  
  // Timers et intervals
  private heartbeatTimer?: NodeJS.Timeout;
  private statsUpdateTimer?: NodeJS.Timeout;
  private syncTimer?: NodeJS.Timeout;
  
  // Configuration
  private config = {
    maxClients: 50,
    heartbeatInterval: 30000, // 30 secondes
    statsUpdateInterval: 60000, // 1 minute
    syncInterval: 120000, // 2 minutes (sync avec DB)
    chatHistoryLimit: 50, // Nombre de messages à garder en mémoire
    autoKickInactiveMinutes: 60,
  };

  // Cache des données utilisateurs
  private userDataCache = new Map<string, any>();

  async onAuth(client: Client, options: any, _request?: http.IncomingMessage) {
    const { userId, clanId } = options?.auth as JoinRoomAuth;
    
    if (!userId || !clanId) {
      throw new ServerError(401, 'Authentication required');
    }

    // Vérifier que l'utilisateur existe et est dans ce clan
    const user = await UserData.findById(userId);
    if (!user) {
      throw new ServerError(404, 'User not found');
    }

    const clan = await Clan.findOne({ clanId, isActive: true });
    if (!clan) {
      throw new ServerError(404, 'Clan not found');
    }

    const member = clan.getMember(new Types.ObjectId(userId));
    if (!member) {
      throw new ServerError(403, 'User is not a member of this clan');
    }

    return { userId, clanId, user, member };
  }

  async onCreate(options: any) {
    console.log(`🏰 ClanRoom created for clan: ${options.clanId}`);
    
    this.setState(new ClanRoomState());
    this.maxClients = this.config.maxClients;
    this.setPrivate(false);

    // Initialiser les services
    this.clanService = getClanService();
    this.logger = getActionLogger();

    // Charger les données du clan
    await this.loadClanData(options.clanId);

    // Setup des handlers
    this.setupMessageHandlers();
    this.setupServiceEvents();
    
    // Démarrer les timers
    this.startHeartbeat();
    this.startStatsUpdate();
    this.startSyncTimer();

    await this.logger.log(this.clanData.leaderId, 'clan_room_created', {
      clanId: this.state.clanId,
      clanName: this.state.name,
      roomId: this.roomId
    });
  }

  async onJoin(client: Client, options: any) {
    try {
      const auth = client.auth;
      console.log(`👤 ${auth.user.username} joining ClanRoom for clan ${this.state.name}`);

      // Vérifier que le clan n'a pas changé
      if (auth.clanId !== this.state.clanId) {
        throw new ServerError(403, 'Clan mismatch');
      }

      // Mettre en cache les données utilisateur
      this.userDataCache.set(client.sessionId, {
        userId: auth.userId,
        user: auth.user,
        member: auth.member
      });

      // Mettre à jour l'état du membre
      await this.updateMemberOnlineStatus(auth.userId, true);
      
      // Envoyer message de bienvenue
      client.send('welcome', {
        clanInfo: {
          name: this.state.name,
          tag: this.state.tag,
          memberCount: this.state.memberCount,
          onlineMembers: this.state.stats.onlineMembers
        },
        memberRole: auth.member.role,
        serverTime: Date.now()
      });

      // Notifier les autres membres
      this.broadcast('member_online', {
        userId: auth.userId,
        username: auth.user.username,
        displayName: auth.user.displayName
      }, { except: client });

      await this.logger.logNavigation('clan_room_joined', auth.userId, {
        clanId: this.state.clanId,
        clanName: this.state.name,
        memberRole: auth.member.role
      });

      console.log(`✅ ${auth.user.username} joined clan room "${this.state.name}" (${this.clients.length} online)`);

    } catch (error) {
      console.error('❌ Error in ClanRoom onJoin:', error);
      throw error;
    }
  }

  async onLeave(client: Client, consented: boolean) {
    const userData = this.userDataCache.get(client.sessionId);
    if (!userData) return;

    console.log(`👋 ${userData.user.username} leaving ClanRoom for clan ${this.state.name}`);

    // Mettre à jour le statut offline
    await this.updateMemberOnlineStatus(userData.userId, false);

    // Notifier les autres membres
    this.broadcast('member_offline', {
      userId: userData.userId,
      username: userData.user.username
    });

    // Nettoyer le cache
    this.userDataCache.delete(client.sessionId);

    await this.logger.logNavigation('clan_room_left', userData.userId, {
      clanId: this.state.clanId,
      sessionDuration: Date.now() - userData.joinTime || 0,
      consented
    });

    console.log(`✅ ${userData.user.username} left clan room "${this.state.name}" (${this.clients.length} remaining)`);
  }

  onDispose() {
    console.log(`🏰 ClanRoom disposing for clan ${this.state.name}`);
    
    // Nettoyer les timers
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.statsUpdateTimer) clearInterval(this.statsUpdateTimer);
    if (this.syncTimer) clearInterval(this.syncTimer);
    
    // Nettoyer les caches
    this.userDataCache.clear();
    
    console.log(`✅ ClanRoom disposed for clan ${this.state.name}`);
  }

  // ===== CHARGEMENT DES DONNÉES =====

  private async loadClanData(clanId: string): Promise<void> {
    try {
      this.clanData = await Clan.findOne({ clanId, isActive: true }).exec();
      if (!this.clanData) {
        throw new Error(`Clan ${clanId} not found`);
      }

      await this.syncStateWithDatabase();
      console.log(`📊 Loaded data for clan "${this.clanData.name}" (${this.clanData.memberCount} members)`);

    } catch (error) {
      console.error('Error loading clan data:', error);
      throw error;
    }
  }

  private async syncStateWithDatabase(): Promise<void> {
    try {
      // Recharger les données depuis la DB
      this.clanData = await Clan.findOne({ clanId: this.clanData.clanId }).exec();
      if (!this.clanData) return;

      // Mettre à jour les infos de base
      this.state.clanId = this.clanData.clanId;
      this.state.name = this.clanData.name;
      this.state.tag = this.clanData.tag;
      this.state.description = this.clanData.settings.description;
      this.state.badge = this.clanData.settings.badge;
      this.state.type = this.clanData.settings.type;
      this.state.requiredTrophies = this.clanData.settings.requiredTrophies;
      this.state.region = this.clanData.region;
      this.state.memberCount = this.clanData.memberCount;
      this.state.maxMembers = this.clanData.maxMembers;

      // Synchroniser les membres
      this.syncMembers();
      
      // Synchroniser le chat
      this.syncChatMessages();
      
      // Synchroniser les stats
      this.syncStats();

      this.state.serverTime = Date.now();

    } catch (error) {
      console.error('Error syncing state with database:', error);
    }
  }

  private syncMembers(): void {
    // Nettoyer les membres supprimés
    const currentMemberIds = new Set(this.clanData.members.map(m => m.userId.toString()));
    
    for (const [sessionId, memberState] of this.state.members) {
      if (!currentMemberIds.has(memberState.userId)) {
        this.state.members.delete(sessionId);
      }
    }

    // Ajouter/mettre à jour les membres
    this.clanData.members.forEach((member: IClanMember) => {
      const memberState = new ClanMemberState();
      memberState.userId = member.userId.toString();
      memberState.username = member.username;
      memberState.displayName = member.displayName;
      memberState.level = member.level;
      memberState.trophies = member.trophies;
      memberState.role = member.role;
      memberState.donationsGiven = member.donationsGiven;
      memberState.donationsReceived = member.donationsReceived;
      memberState.isOnline = member.isOnline;
      memberState.lastSeen = member.lastSeen.getTime();
      memberState.joinedAt = member.joinedAt.getTime();

      // Utiliser l'userId comme clé pour éviter les doublons
      this.state.members.set(member.userId.toString(), memberState);
    });
  }

  private syncChatMessages(): void {
    this.state.chatMessages.clear();

    // Prendre les derniers messages visibles
    const recentMessages = this.clanData.chatMessages
      .filter((msg: IClanChatMessage) => msg.isVisible)
      .slice(-this.config.chatHistoryLimit)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    recentMessages.forEach((msg: IClanChatMessage) => {
      const msgState = new ClanChatMessageState();
      msgState.messageId = msg.messageId;
      msgState.authorId = msg.authorId.toString();
      msgState.authorUsername = msg.authorUsername;
      msgState.authorRole = msg.authorRole;
      msgState.content = msg.content;
      msgState.type = msg.type;
      msgState.timestamp = msg.timestamp.getTime();
      msgState.donationData = msg.donationData ? JSON.stringify(msg.donationData) : "";
      msgState.isVisible = msg.isVisible;

      this.state.chatMessages.push(msgState);
    });
  }

  private syncStats(): void {
    this.state.stats.totalMembers = this.clanData.stats.totalMembers;
    this.state.stats.onlineMembers = this.clanData.stats.onlineMembers;
    this.state.stats.totalTrophies = this.clanData.stats.totalTrophies;
    this.state.stats.averageTrophies = this.clanData.stats.averageTrophies;
    this.state.stats.totalDonations = this.clanData.stats.totalDonations;
    this.state.stats.messagesLast24h = this.clanData.stats.messagesLast24h;
    this.state.stats.donationsLast24h = this.clanData.stats.donationsLast24h;
    this.state.stats.activeMembers = this.clanData.stats.activeMembers;
    this.state.stats.warWins = this.clanData.stats.warWins;
    this.state.stats.warLosses = this.clanData.stats.warLosses;
    this.state.stats.warWinRate = this.clanData.stats.warWinRate;
  }

  // ===== GESTION DES MESSAGES =====

  private setupMessageHandlers(): void {
    // Chat
    this.onMessage('chat_message', async (client, message: ChatMessageData) => {
      await this.handleChatMessage(client, message);
    });

    // Donations
    this.onMessage('request_cards', async (client, message: DonationRequestData) => {
      await this.handleRequestCards(client, message);
    });

    this.onMessage('donate_cards', async (client, message: DonationGiveData) => {
      await this.handleDonateCards(client, message);
    });

    // Gestion des membres
    this.onMessage('promote_member', async (client, message: MemberActionData) => {
      await this.handlePromoteMember(client, message);
    });

    this.onMessage('demote_member', async (client, message: MemberActionData) => {
      await this.handleDemoteMember(client, message);
    });

    this.onMessage('kick_member', async (client, message: MemberActionData) => {
      await this.handleKickMember(client, message);
    });

    // Utilitaires
    this.onMessage('refresh_data', async (client) => {
      await this.handleRefreshData(client);
    });

    this.onMessage('get_member_list', async (client) => {
      await this.handleGetMemberList(client);
    });
  }

  private async handleChatMessage(client: Client, message: ChatMessageData): Promise<void> {
    const userData = this.userDataCache.get(client.sessionId);
    if (!userData) return;

    try {
      const result = await this.clanService.sendChatMessage(userData.userId, message.content);
      
      if (!result.success) {
        client.send('error', { message: result.error, code: 'CHAT_ERROR' });
        return;
      }

      // Le message sera synchronisé lors du prochain sync
      // Mais on peut l'ajouter immédiatement pour la réactivité
      await this.addChatMessageToState(userData, message.content, 'text');

      // Broadcast aux autres clients
      this.broadcast('new_chat_message', {
        messageId: result.messageId,
        authorUsername: userData.user.username,
        authorRole: userData.member.role,
        content: message.content,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Error handling chat message:', error);
      client.send('error', { message: 'Failed to send message', code: 'CHAT_ERROR' });
    }
  }

  private async handleRequestCards(client: Client, message: DonationRequestData): Promise<void> {
    const userData = this.userDataCache.get(client.sessionId);
    if (!userData) return;

    try {
      const result = await this.clanService.requestCards(userData.userId, message.cardId, message.amount);
      
      if (!result.success) {
        client.send('error', { message: result.error, code: 'DONATION_ERROR' });
        return;
      }

      // Broadcast la nouvelle demande
      this.broadcast('new_donation_request', {
        messageId: result.messageId,
        requesterUsername: userData.user.username,
        cardId: message.cardId,
        amount: message.amount,
        timestamp: Date.now()
      });

      client.send('donation_request_sent', {
        messageId: result.messageId,
        cardId: message.cardId,
        amount: message.amount
      });

    } catch (error) {
      console.error('Error handling card request:', error);
      client.send('error', { message: 'Failed to request cards', code: 'DONATION_ERROR' });
    }
  }

  private async handleDonateCards(client: Client, message: DonationGiveData): Promise<void> {
    const userData = this.userDataCache.get(client.sessionId);
    if (!userData) return;

    try {
      const result = await this.clanService.donateCards(userData.userId, message.messageId, message.amount);
      
      if (!result.success) {
        client.send('error', { message: result.error, code: 'DONATION_ERROR' });
        return;
      }

      // Broadcast la donation
      this.broadcast('cards_donated', {
        messageId: message.messageId,
        donorUsername: userData.user.username,
        amount: message.amount,
        xpGained: result.xpGained,
        timestamp: Date.now()
      });

      client.send('donation_sent', {
        messageId: message.messageId,
        amount: message.amount,
        xpGained: result.xpGained
      });

    } catch (error) {
      console.error('Error handling card donation:', error);
      client.send('error', { message: 'Failed to donate cards', code: 'DONATION_ERROR' });
    }
  }

  private async handlePromoteMember(client: Client, message: MemberActionData): Promise<void> {
    const userData = this.userDataCache.get(client.sessionId);
    if (!userData) return;

    try {
      const result = await this.clanService.promoteMember(userData.userId, message.targetUserId);
      
      if (!result.success) {
        client.send('error', { message: result.error, code: 'PROMOTION_ERROR' });
        return;
      }

      // Broadcast la promotion
      this.broadcast('member_promoted', {
        targetUserId: message.targetUserId,
        newRole: result.newRole,
        promoterUsername: userData.user.username,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Error handling member promotion:', error);
      client.send('error', { message: 'Failed to promote member', code: 'PROMOTION_ERROR' });
    }
  }

  private async handleDemoteMember(client: Client, message: MemberActionData): Promise<void> {
    const userData = this.userDataCache.get(client.sessionId);
    if (!userData) return;

    try {
      const result = await this.clanService.demoteMember(userData.userId, message.targetUserId);
      
      if (!result.success) {
        client.send('error', { message: result.error, code: 'DEMOTION_ERROR' });
        return;
      }

      // Broadcast la rétrogradation
      this.broadcast('member_demoted', {
        targetUserId: message.targetUserId,
        newRole: result.newRole,
        demoterUsername: userData.user.username,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Error handling member demotion:', error);
      client.send('error', { message: 'Failed to demote member', code: 'DEMOTION_ERROR' });
    }
  }

  private async handleKickMember(client: Client, message: MemberActionData): Promise<void> {
    const userData = this.userDataCache.get(client.sessionId);
    if (!userData) return;

    try {
      const result = await this.clanService.kickMember(userData.userId, message.targetUserId, message.reason);
      
      if (!result.success) {
        client.send('error', { message: result.error, code: 'KICK_ERROR' });
        return;
      }

      // Broadcast l'expulsion
      this.broadcast('member_kicked', {
        targetUserId: message.targetUserId,
        kickerUsername: userData.user.username,
        reason: message.reason,
        timestamp: Date.now()
      });

      // Déconnecter le membre expulsé s'il est en ligne
      const kickedClient = this.clients.find(c => {
        const kickedUserData = this.userDataCache.get(c.sessionId);
        return kickedUserData?.userId === message.targetUserId;
      });

      if (kickedClient) {
        kickedClient.send('kicked_from_clan', {
          reason: message.reason || 'No reason provided',
          kickedBy: userData.user.username
        });
        kickedClient.leave();
      }

    } catch (error) {
      console.error('Error handling member kick:', error);
      client.send('error', { message: 'Failed to kick member', code: 'KICK_ERROR' });
    }
  }

  private async handleRefreshData(client: Client): Promise<void> {
    try {
      await this.syncStateWithDatabase();
      client.send('data_refreshed', {
        clanInfo: {
          name: this.state.name,
          memberCount: this.state.memberCount,
          totalTrophies: this.state.stats.totalTrophies
        },
        timestamp: Date.now()
      });
    } catch (error) {
      client.send('error', { message: 'Failed to refresh data', code: 'REFRESH_ERROR' });
    }
  }

  private async handleGetMemberList(client: Client): Promise<void> {
    const members = Array.from(this.state.members.values()).map(member => ({
      userId: member.userId,
      username: member.username,
      displayName: member.displayName,
      level: member.level,
      trophies: member.trophies,
      role: member.role,
      donationsGiven: member.donationsGiven,
      donationsReceived: member.donationsReceived,
      isOnline: member.isOnline,
      lastSeen: member.lastSeen
    }));

    client.send('member_list', { members, timestamp: Date.now() });
  }

  // ===== UTILITAIRES =====

  private async updateMemberOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    const memberState = this.state.members.get(userId);
    if (memberState) {
      memberState.isOnline = isOnline;
      if (!isOnline) {
        memberState.lastSeen = Date.now();
      }
    }

    // Mettre à jour aussi en base (optionnel, peut être fait par batch)
    try {
      const member = this.clanData.getMember(new Types.ObjectId(userId));
      if (member) {
        member.isOnline = isOnline;
        member.lastActivity = new Date();
        if (!isOnline) {
          member.lastSeen = new Date();
        }
      }
    } catch (error) {
      console.error('Error updating member online status in DB:', error);
    }
  }

  private async addChatMessageToState(userData: any, content: string, type: string): Promise<void> {
    const msgState = new ClanChatMessageState();
    msgState.messageId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    msgState.authorId = userData.userId;
    msgState.authorUsername = userData.user.username;
    msgState.authorRole = userData.member.role;
    msgState.content = content;
    msgState.type = type;
    msgState.timestamp = Date.now();
    msgState.isVisible = true;

    this.state.chatMessages.push(msgState);

    // Limiter le nombre de messages en mémoire
    if (this.state.chatMessages.length > this.config.chatHistoryLimit) {
      this.state.chatMessages.splice(0, this.state.chatMessages.length - this.config.chatHistoryLimit);
    }
  }

  // ===== ÉVÉNEMENTS DU SERVICE =====

  private setupServiceEvents(): void {
    // Écouter les événements du ClanService
    this.clanService.on('memberJoined', (data) => {
      if (data.clan.clanId === this.state.clanId) {
        this.handleServiceMemberJoined(data);
      }
    });

    this.clanService.on('memberLeft', (data) => {
      if (data.clan.clanId === this.state.clanId) {
        this.handleServiceMemberLeft(data);
      }
    });

    this.clanService.on('cardsdonated', (data) => {
      if (data.clan.clanId === this.state.clanId) {
        this.handleServiceCardsDonated(data);
      }
    });

    this.clanService.on('donationRequested', (data) => {
      if (data.clan.clanId === this.state.clanId) {
        this.handleServiceDonationRequested(data);
      }
    });
  }

  private handleServiceMemberJoined(data: any): void {
    this.broadcast('service_member_joined', {
      username: data.user.username,
      displayName: data.user.displayName,
      trophies: data.user.stats?.currentTrophies || 0,
      timestamp: Date.now()
    });
  }

  private handleServiceMemberLeft(data: any): void {
    this.broadcast('service_member_left', {
      userId: data.userId,
      reason: data.reason,
      timestamp: Date.now()
    });
  }

  private handleServiceCardsDonated(data: any): void {
    this.broadcast('service_cards_donated', {
      donorUsername: data.donor.username,
      recipientUsername: data.recipient,
      cardId: data.cardId,
      amount: data.amount,
      xpGained: data.xpGained,
      requestFulfilled: data.requestFulfilled,
      timestamp: Date.now()
    });
  }

  private handleServiceDonationRequested(data: any): void {
    this.broadcast('service_donation_requested', {
      requesterUsername: data.requester.username,
      cardId: data.cardId,
      amount: data.amount,
      rarity: data.rarity,
      messageId: data.messageId,
      expiresAt: data.expiresAt.getTime(),
      timestamp: Date.now()
    });
  }

  // ===== TIMERS =====

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.state.serverTime = Date.now();
      
      // Vérifier les clients inactifs
      const now = Date.now();
      for (const client of this.clients) {
        const userData = this.userDataCache.get(client.sessionId);
        if (userData && userData.lastActivity) {
          const inactiveMinutes = (now - userData.lastActivity) / (1000 * 60);
          
          if (inactiveMinutes > this.config.autoKickInactiveMinutes) {
            console.log(`⏰ Kicking inactive client ${userData.user.username} (${inactiveMinutes.toFixed(1)} min inactive)`);
            client.send('kicked_inactive', { inactiveMinutes: Math.floor(inactiveMinutes) });
            client.leave();
          }
        }
      }
      
      // Mettre à jour le nombre de membres en ligne
      this.updateOnlineMembersCount();
      
    }, this.config.heartbeatInterval);
  }

  private startStatsUpdate(): void {
    this.statsUpdateTimer = setInterval(async () => {
      try {
        // Mettre à jour les stats du clan
        await this.clanData.updateStats();
        await this.clanData.save();
        
        // Synchroniser les stats dans l'état
        this.syncStats();
        
        // Broadcast les nouvelles stats aux clients
        this.broadcast('stats_updated', {
          stats: {
            totalTrophies: this.state.stats.totalTrophies,
            averageTrophies: this.state.stats.averageTrophies,
            totalDonations: this.state.stats.totalDonations,
            onlineMembers: this.state.stats.onlineMembers,
            activeMembers: this.state.stats.activeMembers
          },
          timestamp: Date.now()
        });
        
      } catch (error) {
        console.error('Error updating clan stats:', error);
      }
    }, this.config.statsUpdateInterval);
  }

  private startSyncTimer(): void {
    this.syncTimer = setInterval(async () => {
      try {
        await this.syncStateWithDatabase();
        console.log(`🔄 Synced clan room "${this.state.name}" with database`);
      } catch (error) {
        console.error('Error syncing with database:', error);
      }
    }, this.config.syncInterval);
  }

  // ===== UTILITAIRES AVANCÉS =====

  private updateOnlineMembersCount(): void {
    const onlineCount = Array.from(this.state.members.values())
      .filter(member => member.isOnline).length;
    
    if (this.state.stats.onlineMembers !== onlineCount) {
      this.state.stats.onlineMembers = onlineCount;
    }
  }

  /**
   * Vérifier les permissions d'un membre pour une action donnée
   */
  private hasPermission(memberRole: string, action: 'promote' | 'demote' | 'kick' | 'chat' | 'donate'): boolean {
    const permissions = {
      leader: ['promote', 'demote', 'kick', 'chat', 'donate'],
      'co-leader': ['promote', 'demote', 'kick', 'chat', 'donate'],
      elder: ['kick', 'chat', 'donate'], // Peut kicker que les members
      member: ['chat', 'donate']
    };

    const rolePermissions = permissions[memberRole as keyof typeof permissions] || [];
    return rolePermissions.includes(action);
  }

  /**
   * Obtenir les informations d'un client connecté
   */
  private getClientData(client: Client): any {
    return this.userDataCache.get(client.sessionId);
  }

  /**
   * Envoyer un message à tous les membres ayant un certain rôle
   */
  private broadcastToRole(role: string, type: string, data: any): void {
    this.clients.forEach(client => {
      const userData = this.getClientData(client);
      if (userData && userData.member.role === role) {
        client.send(type, data);
      }
    });
  }

  /**
   * Envoyer un message à un utilisateur spécifique s'il est connecté
   */
  private sendToUser(userId: string, type: string, data: any): boolean {
    const client = this.clients.find(c => {
      const userData = this.getClientData(c);
      return userData?.userId === userId;
    });

    if (client) {
      client.send(type, data);
      return true;
    }
    return false;
  }

  /**
   * Obtenir les statistiques de la room en temps réel
   */
  private getRoomStats() {
    return {
      roomId: this.roomId,
      clanId: this.state.clanId,
      clanName: this.state.name,
      connectedClients: this.clients.length,
      totalMembers: this.state.memberCount,
      onlineMembers: this.state.stats.onlineMembers,
      chatMessages: this.state.chatMessages.length,
      uptime: Date.now() - (this.clock.currentTime || Date.now()),
      lastSync: this.state.serverTime
    };
  }

  // ===== HANDLERS SPÉCIALISÉS =====

  /**
   * Gérer les demandes d'informations détaillées
   */
  private setupAdvancedHandlers(): void {
    this.onMessage('get_room_stats', (client) => {
      const userData = this.getClientData(client);
      if (userData && (userData.member.role === 'leader' || userData.member.role === 'co-leader')) {
        client.send('room_stats', this.getRoomStats());
      } else {
        client.send('error', { message: 'Insufficient permissions', code: 'PERMISSION_ERROR' });
      }
    });

    this.onMessage('get_donation_history', async (client) => {
      try {
        // Récupérer l'historique des donations des 24 dernières heures
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const donationMessages = this.state.chatMessages
          .filter(msg => 
            (msg.type === 'donation_request' || msg.type === 'donation_fulfilled') &&
            msg.timestamp >= yesterday.getTime()
          )
          .map(msg => ({
            messageId: msg.messageId,
            authorUsername: msg.authorUsername,
            type: msg.type,
            timestamp: msg.timestamp,
            donationData: msg.donationData ? JSON.parse(msg.donationData) : null
          }))
          .sort((a, b) => b.timestamp - a.timestamp);

        client.send('donation_history', { 
          donations: donationMessages,
          period: '24h',
          timestamp: Date.now()
        });

      } catch (error) {
        client.send('error', { message: 'Failed to get donation history', code: 'HISTORY_ERROR' });
      }
    });

    this.onMessage('set_announcement', async (client, data: { announcement: string }) => {
      const userData = this.getClientData(client);
      if (!userData || !this.hasPermission(userData.member.role, 'promote')) {
        client.send('error', { message: 'Insufficient permissions', code: 'PERMISSION_ERROR' });
        return;
      }

      if (!data.announcement || data.announcement.length > 200) {
        client.send('error', { message: 'Invalid announcement length', code: 'VALIDATION_ERROR' });
        return;
      }

      try {
        this.state.announcement = data.announcement.trim();
        
        // Broadcast la nouvelle annonce
        this.broadcast('announcement_updated', {
          announcement: this.state.announcement,
          updatedBy: userData.user.username,
          timestamp: Date.now()
        });

        // Logger l'action
        await this.logger.logNavigation('button_clicked', userData.userId, {
          action: 'announcement_updated',
          clanId: this.state.clanId,
          announcementLength: this.state.announcement.length
        });

      } catch (error) {
        client.send('error', { message: 'Failed to update announcement', code: 'ANNOUNCEMENT_ERROR' });
      }
    });

    this.onMessage('ping', (client) => {
      client.send('pong', { timestamp: Date.now() });
    });
  }

  // ===== GESTION DES ERREURS =====

  private handleClientError(client: Client, error: any): void {
    const userData = this.getClientData(client);
    const username = userData?.user?.username || 'Unknown';
    
    console.error(`❌ Client error for ${username}:`, error);
    
    client.send('error', {
      message: 'An unexpected error occurred',
      code: 'CLIENT_ERROR',
      timestamp: Date.now()
    });
  }

  // ===== CLEANUP ET MAINTENANCE =====

  /**
   * Nettoyer les données expirées
   */
  private async cleanupExpiredData(): Promise<void> {
    const now = Date.now();
    
    // Nettoyer les messages de chat trop anciens (plus de 24h)
    const dayAgo = now - (24 * 60 * 60 * 1000);
    
    const initialLength = this.state.chatMessages.length;
    
    // Filtrer les messages récents ou les messages de donation encore actifs
    for (let i = this.state.chatMessages.length - 1; i >= 0; i--) {
      const msg = this.state.chatMessages[i];
      
      if (msg.timestamp < dayAgo && msg.type === 'text') {
        this.state.chatMessages.splice(i, 1);
      } else if (msg.type === 'donation_request' && msg.donationData) {
        try {
          const donationData = JSON.parse(msg.donationData);
          if (donationData.expiresAt && donationData.expiresAt < now) {
            this.state.chatMessages.splice(i, 1);
          }
        } catch (e) {
          // Données corrompues, supprimer
          this.state.chatMessages.splice(i, 1);
        }
      }
    }
    
    const cleanedCount = initialLength - this.state.chatMessages.length;
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} expired messages from clan room "${this.state.name}"`);
    }
  }

  /**
   * Forcer une synchronisation complète
   */
  async forceSyncWithDatabase(): Promise<void> {
    try {
      console.log(`🔄 Force syncing clan room "${this.state.name}" with database...`);
      
      await this.syncStateWithDatabase();
      await this.cleanupExpiredData();
      
      // Notifier tous les clients
      this.broadcast('force_sync_completed', {
        timestamp: Date.now(),
        message: 'Data synchronized with server'
      });
      
      console.log(`✅ Force sync completed for clan room "${this.state.name}"`);
      
    } catch (error) {
      console.error('Error in force sync:', error);
      
      this.broadcast('sync_error', {
        message: 'Failed to synchronize data',
        timestamp: Date.now()
      });
    }
  }

  // ===== MÉTHODES PUBLIQUES POUR ADMINISTRATION =====

  /**
   * Obtenir les informations de debug de la room
   */
  getDebugInfo() {
    return {
      roomId: this.roomId,
      state: {
        clanId: this.state.clanId,
        name: this.state.name,
        memberCount: this.state.memberCount,
        onlineMembers: this.state.stats.onlineMembers
      },
      clients: {
        connected: this.clients.length,
        userIds: Array.from(this.userDataCache.values()).map(d => d.user.username)
      },
      timers: {
        heartbeat: !!this.heartbeatTimer,
        statsUpdate: !!this.statsUpdateTimer,
        sync: !!this.syncTimer
      },
      memory: {
        chatMessages: this.state.chatMessages.length,
        cachedUsers: this.userDataCache.size
      },
      lastUpdate: this.state.serverTime
    };
  }

  /**
   * Arrêter proprement la room
   */
  async shutdown(): Promise<void> {
    console.log(`🏰 Shutting down clan room "${this.state.name}"...`);
    
    // Notifier tous les clients
    this.broadcast('room_shutting_down', {
      message: 'Server maintenance in progress',
      timestamp: Date.now()
    });
    
    // Attendre un peu pour que les clients reçoivent le message
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Déconnecter tous les clients
    this.clients.forEach(client => client.leave());
    
    // Nettoyer les ressources
    this.onDispose();
    
    console.log(`✅ Clan room "${this.state.name}" shutdown complete`);
  }
}
