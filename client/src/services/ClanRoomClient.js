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
      // Récupérer le ColyseusManager
      const colyseusManager = NetworkManager.getColyseusManager();

      // Vérifier que le client Colyseus est bien initialisé
      if (!colyseusManager.client) {
        throw new Error("Colyseus client not initialized. Call NetworkManager.initialize() first.");
      }

      this.client = colyseusManager.client;

      console.log('🔄 Attempting to join clan room...', { userId, clanId });

      // Joindre la room clan
      this.room = await this.client.joinOrCreate('clan', {
        auth: { userId, clanId }
      });

      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.setupListeners();

      console.log('✅ Successfully joined clan room:', this.room.id);
      return { success: true, room: this.room };

    } catch (err) {
      console.error('❌ Failed to join ClanRoom:', err);
      this.isConnected = false;

      // Tenter une reconnexion auto
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
        await this.delay(2000);
        return this.connect(userId, clanId);
      }

      return { success: false, error: this.getErrorMessage(err) };
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

    try {
      this.room.send('chat_message', { content });
      return true;
    } catch (error) {
      console.error('Failed to send chat message:', error);
      return false;
    }
  }

  // ==== Donations ====
  requestCards(cardId, amount = 1) {
    if (!this.isConnected || !this.room) return false;
    try {
      this.room.send('request_cards', { cardId, amount });
      return true;
    } catch (error) {
      console.error('Failed to request cards:', error);
      return false;
    }
  }

  donateCards(messageId, amount) {
    if (!this.isConnected || !this.room) return false;
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
    if (!this.isConnected || !this.room) return false;
    try {
      this.room.send('promote_member', { targetUserId });
      return true;
    } catch (error) {
      console.error('Failed to promote member:', error);
      return false;
    }
  }

  demoteMember(targetUserId) {
    if (!this.isConnected || !this.room) return false;
    try {
      this.room.send('demote_member', { targetUserId });
      return true;
    } catch (error) {
      console.error('Failed to demote member:', error);
      return false;
    }
  }

  kickMember(targetUserId, reason = '') {
    if (!this.isConnected || !this.room) return false;
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
    if (!this.isConnected || !this.room) return false;
    try {
      this.room.send('refresh_data');
      return true;
    } catch (error) {
      console.error('Failed to refresh data:', error);
      return false;
    }
  }

  requestMemberList() {
    if (!this.isConnected || !this.room) return false;
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
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
      if (this.eventListeners.get(event).size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(cb => {
        try { cb(data); } catch (err) {
          console.error(`Error in ClanRoomClient event listener for ${event}:`, err);
        }
      });
    }
  }

  // ==== Bridge Colyseus → events normalisés ====
  setupListeners() {
    if (!this.room) return;
    console.log('🔗 Setting up Colyseus event listeners');

    this.room.onStateChange((state) => this.emit('room:state', state));
    this.room.onLeave((code) => {
      console.log('👋 Left room with code:', code);
      this.isConnected = false;
      this.emit('room:leave', { code });
    });
    this.room.onError((code, message) => this.emit('system:error', { code, message }));

    // Chat
    this.room.onMessage('new_chat_message', (msg) => {
      this.emit('chat:message', {
        messageId: msg.messageId,
        authorId: msg.authorId,
        authorUsername: msg.authorUsername || 'Unknown',
        authorRole: msg.authorRole || 'member',
        content: msg.content || '',
        timestamp: msg.timestamp || Date.now()
      });
    });

    // Membres
    this.room.onMessage('member_online', (d) => this.emit('member:online', d));
    this.room.onMessage('member_offline', (d) => this.emit('member:offline', d));
    this.room.onMessage('member_promoted', (d) => this.emit('member:promoted', d));
    this.room.onMessage('member_demoted', (d) => this.emit('member:demoted', d));
    this.room.onMessage('member_kicked', (d) => this.emit('member:kicked', d));
    this.room.onMessage('member_list', (d) => this.emit('member:list', d));

    // Donations
    this.room.onMessage('new_donation_request', (msg) => this.emit('donation:request', msg));
    this.room.onMessage('donation_request_sent', (msg) => this.emit('donation:request:sent', msg));
    this.room.onMessage('cards_donated', (msg) => this.emit('donation:given', msg));
    this.room.onMessage('donation_sent', (msg) => this.emit('donation:sent', msg));

    // Système
    this.room.onMessage('force_sync_completed', (d) => this.emit('system:sync', d));
    this.room.onMessage('room_shutting_down', (d) => this.emit('system:shutdown', d));
    this.room.onMessage('error', (err) => this.emit('system:error', err));

    console.log('✅ Colyseus event listeners setup complete');
  }

  // ==== Utils ====
  delay(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  getErrorMessage(error) {
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.code) return `Error code: ${error.code}`;
    return 'Unknown error occurred';
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      hasClient: !!this.client,
      hasRoom: !!this.room,
      roomId: this.room?.id,
      sessionId: this.room?.sessionId,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  cleanup() {
    console.log('🧹 Cleaning up ClanRoomClient...');
    this.leave();
    this.eventListeners.clear();
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    console.log('✅ ClanRoomClient cleanup complete');
  }
}

export default new ClanRoomClient();
