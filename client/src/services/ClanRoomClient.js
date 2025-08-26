import NetworkManager from './NetworkManager';

class ClanRoomClient {
  constructor() {
    this.client = null;   // => Colyseus.Client réel
    this.room = null;
    this.eventListeners = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
  }

  // ==== Connexion ====
  async connect(userId, clanId) {
    try {
      // Validation des paramètres
      if (!userId) {
        throw new Error('userId is required');
      }
      if (!clanId) {
        throw new Error('clanId is required');
      }

      console.log('🔄 ClanRoomClient connecting with:', { userId, clanId });

      // Récupérer le ColyseusManager
      const colyseusManager = NetworkManager.getColyseusManager();

      // Vérifier que le client Colyseus est bien initialisé
      if (!colyseusManager || !colyseusManager.client) {
        throw new Error("Colyseus client not properly initialized. Call NetworkManager.initialize() first.");
      }

      this.client = colyseusManager.client;

      console.log('🔄 Attempting to join clan room...', { userId, clanId });

      // Essayer de rejoindre ou créer la room
      // IMPORTANT: passer clanId à la racine ET dans auth
      this.room = await this.client.joinOrCreate('clan', {
        clanId: clanId,  // Pour onCreate
        auth: { 
          userId: userId, 
          clanId: clanId 
        }
      });

      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.setupListeners();

      console.log('✅ Successfully joined clan room:', this.room.id);
      return { success: true, room: this.room };

    } catch (err) {
      console.error('❌ Failed to join ClanRoom:', err);
      this.isConnected = false;

      // Analyser l'erreur pour donner des détails
      let errorMessage = this.getErrorMessage(err);
      
      // Messages d'erreur spécifiques
      if (err.message && err.message.includes('not found')) {
        errorMessage = 'Clan not found or user is not a member';
      } else if (err.message && err.message.includes('not properly initialized')) {
        errorMessage = 'Server connection not available. Please try again later.';
      } else if (err.code === 4000 || err.code === 'MATCHMAKE_UNHANDLED') {
        errorMessage = 'Unable to connect to clan room. Please try again.';
      }

      // Tenter une reconnexion auto
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
        await this.delay(2000 * this.reconnectAttempts); // Délai progressif
        return this.connect(userId, clanId);
      }

      return { success: false, error: errorMessage };
    }
  }

  leave() {
    if (this.room) {
      try {
        this.room.leave();
        console.log('👋 Left clan room');
      } catch (error) {
        console.error('Error leaving room:', error);
      }
      this.room = null;
    }
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  // ==== Chat ====
  sendChat(content) {
    if (!this.isConnected || !this.room) {
      console.warn('Cannot send chat: not connected to room');
      return false;
    }

    // Validation du contenu
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      console.warn('Cannot send empty chat message');
      return false;
    }

    if (content.length > 500) {
      console.warn('Chat message too long');
      return false;
    }

    try {
      this.room.send('chat_message', { content: content.trim() });
      return true;
    } catch (error) {
      console.error('Failed to send chat message:', error);
      return false;
    }
  }

  // ==== Donations ====
  requestCards(cardId, amount = 1) {
    if (!this.isConnected || !this.room) {
      console.warn('Cannot request cards: not connected to room');
      return false;
    }

    if (!cardId || typeof cardId !== 'string') {
      console.warn('Invalid cardId for card request');
      return false;
    }

    if (!Number.isInteger(amount) || amount < 1 || amount > 8) {
      console.warn('Invalid amount for card request (must be 1-8)');
      return false;
    }

    try {
      this.room.send('request_cards', { cardId, amount });
      return true;
    } catch (error) {
      console.error('Failed to request cards:', error);
      return false;
    }
  }

  donateCards(messageId, amount) {
    if (!this.isConnected || !this.room) {
      console.warn('Cannot donate cards: not connected to room');
      return false;
    }

    if (!messageId || typeof messageId !== 'string') {
      console.warn('Invalid messageId for donation');
      return false;
    }

    if (!Number.isInteger(amount) || amount < 1) {
      console.warn('Invalid amount for donation');
      return false;
    }

    try {
      this.room.send('donate_cards', { messageId, amount });
      return true;
    } catch (error) {
      console.error('Failed to donate cards:', error);
      return false;
    }
  }

  // ==== Gestion membres ====
  promoteMember(targetUserId) {
    if (!this.isConnected || !this.room) {
      console.warn('Cannot promote member: not connected to room');
      return false;
    }

    if (!targetUserId || typeof targetUserId !== 'string') {
      console.warn('Invalid targetUserId for promotion');
      return false;
    }

    try {
      this.room.send('promote_member', { targetUserId });
      return true;
    } catch (error) {
      console.error('Failed to promote member:', error);
      return false;
    }
  }

  demoteMember(targetUserId) {
    if (!this.isConnected || !this.room) {
      console.warn('Cannot demote member: not connected to room');
      return false;
    }

    if (!targetUserId || typeof targetUserId !== 'string') {
      console.warn('Invalid targetUserId for demotion');
      return false;
    }

    try {
      this.room.send('demote_member', { targetUserId });
      return true;
    } catch (error) {
      console.error('Failed to demote member:', error);
      return false;
    }
  }

  kickMember(targetUserId, reason = '') {
    if (!this.isConnected || !this.room) {
      console.warn('Cannot kick member: not connected to room');
      return false;
    }

    if (!targetUserId || typeof targetUserId !== 'string') {
      console.warn('Invalid targetUserId for kick');
      return false;
    }

    try {
      this.room.send('kick_member', { targetUserId, reason });
      return true;
    } catch (error) {
      console.error('Failed to kick member:', error);
      return false;
    }
  }

  // ==== Utils ====
  refreshData() {
    if (!this.isConnected || !this.room) {
      console.warn('Cannot refresh data: not connected to room');
      return false;
    }

    try {
      this.room.send('refresh_data');
      return true;
    } catch (error) {
      console.error('Failed to refresh data:', error);
      return false;
    }
  }

  requestMemberList() {
    if (!this.isConnected || !this.room) {
      console.warn('Cannot request member list: not connected to room');
      return false;
    }

    try {
      this.room.send('get_member_list');
      return true;
    } catch (error) {
      console.error('Failed to request member list:', error);
      return false;
    }
  }

  // ==== Event system ====
  on(event, callback) {
    if (typeof event !== 'string' || typeof callback !== 'function') {
      console.warn('Invalid event listener parameters');
      return;
    }

    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  off(event, callback) {
    if (!this.eventListeners.has(event)) {
      return;
    }

    if (callback) {
      this.eventListeners.get(event).delete(callback);
      if (this.eventListeners.get(event).size === 0) {
        this.eventListeners.delete(event);
      }
    } else {
      // Si pas de callback spécifique, supprimer tous les listeners pour cet event
      this.eventListeners.delete(event);
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(cb => {
        try { 
          cb(data); 
        } catch (err) {
          console.error(`Error in ClanRoomClient event listener for ${event}:`, err);
        }
      });
    }
  }

  // ==== Bridge Colyseus → events normalisés ====
  setupListeners() {
    if (!this.room) {
      console.warn('Cannot setup listeners: no room available');
      return;
    }
    
    console.log('🔗 Setting up Colyseus event listeners');

    // Room events
    this.room.onStateChange((state) => {
      this.emit('room:state', state);
    });

    this.room.onLeave((code) => {
      console.log('👋 Left room with code:', code);
      this.isConnected = false;
      this.emit('room:leave', { code });
    });

    this.room.onError((code, message) => {
      console.error('🔥 Room error:', code, message);
      this.emit('system:error', { code, message });
    });

    // Welcome message
    this.room.onMessage('welcome', (data) => {
      console.log('🎉 Received welcome message:', data);
      this.emit('room:welcome', data);
    });

    // Chat messages
    this.room.onMessage('new_chat_message', (msg) => {
      this.emit('chat:message', {
        messageId: msg.messageId || `temp_${Date.now()}`,
        authorId: msg.authorId || '',
        authorUsername: msg.authorUsername || 'Unknown',
        authorRole: msg.authorRole || 'member',
        content: msg.content || '',
        timestamp: msg.timestamp || Date.now()
      });
    });

    // Member events
    this.room.onMessage('member_online', (d) => {
      this.emit('member:online', d);
    });

    this.room.onMessage('member_offline', (d) => {
      this.emit('member:offline', d);
    });

    this.room.onMessage('member_promoted', (d) => {
      this.emit('member:promoted', d);
    });

    this.room.onMessage('member_demoted', (d) => {
      this.emit('member:demoted', d);
    });

    this.room.onMessage('member_kicked', (d) => {
      this.emit('member:kicked', d);
    });

    this.room.onMessage('member_list', (d) => {
      this.emit('member:list', d.members || d);
    });

    // Donation events
    this.room.onMessage('new_donation_request', (msg) => {
      this.emit('donation:request', msg);
    });

    this.room.onMessage('donation_request_sent', (msg) => {
      this.emit('donation:request:sent', msg);
    });

    this.room.onMessage('cards_donated', (msg) => {
      this.emit('donation:given', msg);
    });

    this.room.onMessage('donation_sent', (msg) => {
      this.emit('donation:sent', msg);
    });

    // System events
    this.room.onMessage('data_refreshed', (d) => {
      this.emit('system:sync', d);
    });

    this.room.onMessage('room_shutting_down', (d) => {
      this.emit('system:shutdown', d);
    });

    this.room.onMessage('error', (err) => {
      console.error('🔥 Room message error:', err);
      this.emit('system:error', err);
    });

    // Kicked events
    this.room.onMessage('kicked_from_clan', (data) => {
      console.log('🥾 Kicked from clan:', data);
      this.emit('system:kicked', data);
    });

    this.room.onMessage('kicked_inactive', (data) => {
      console.log('😴 Kicked for inactivity:', data);
      this.emit('system:kicked', data);
    });

    // Stats events
    this.room.onMessage('stats_updated', (data) => {
      this.emit('stats:updated', data);
    });

    console.log('✅ Colyseus event listeners setup complete');
  }

  // ==== Utils ====
  delay(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  getErrorMessage(error) {
    if (typeof error === 'string') return error;
    if (error && error.message) return error.message;
    if (error && error.code) return `Error code: ${error.code}`;
    return 'Unknown connection error occurred';
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      hasClient: !!this.client,
      hasRoom: !!this.room,
      roomId: this.room?.id,
      sessionId: this.room?.sessionId,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }

  // ==== Debug et monitoring ====
  getDebugInfo() {
    return {
      connection: this.getConnectionStatus(),
      eventListeners: Array.from(this.eventListeners.keys()),
      listenerCounts: Array.from(this.eventListeners.entries()).map(([event, listeners]) => ({
        event,
        count: listeners.size
      }))
    };
  }

  // ==== Heartbeat et keep-alive ====
  ping() {
    if (this.isConnected && this.room) {
      try {
        this.room.send('ping');
        return true;
      } catch (error) {
        console.error('Failed to ping room:', error);
        return false;
      }
    }
    return false;
  }

  // Listener pour pong response
  setupPingListener() {
    if (this.room) {
      this.room.onMessage('pong', (data) => {
        const latency = Date.now() - (data.timestamp || Date.now());
        this.emit('connection:ping', { latency, timestamp: data.timestamp });
      });
    }
  }

  cleanup() {
    console.log('🧹 Cleaning up ClanRoomClient...');
    
    // Leave room
    this.leave();
    
    // Clear listeners
    this.eventListeners.clear();
    
    // Reset state
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    
    console.log('✅ ClanRoomClient cleanup complete');
  }
}

export default new ClanRoomClient();
