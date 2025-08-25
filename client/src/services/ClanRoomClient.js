import NetworkManager from './NetworkManager';

class ClanRoomClient {
  constructor() {
    this.client = null;
    this.room = null;
    this.eventListeners = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
  }

  // ==== Connexion ====
  async connect(userId, clanId) {
    try {
      // Obtenir le client Colyseus depuis NetworkManager
      this.client = NetworkManager.getColyseusManager();
      
      // Vérifier que le client est valide
      if (!this.client || typeof this.client.joinOrCreate !== 'function') {
        throw new Error('Colyseus client is not properly initialized. Make sure NetworkManager.getColyseusManager() returns a valid Colyseus client.');
      }

      console.log('🔄 Attempting to join clan room...', { userId, clanId });

      // Tenter de rejoindre/créer la room
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
      
      // Tenter une reconnexion automatique
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
        
        // Attendre 2 secondes avant de réessayer
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
    if (!this.isConnected || !this.room) {
      console.warn('Cannot request cards: not connected to room');
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
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
      
      // Nettoyer si plus de listeners
      if (this.eventListeners.get(event).size === 0) {
        this.eventListeners.delete(event);
      }
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
    if (!this.room) return;

    console.log('🔗 Setting up Colyseus event listeners');

    // === Events de connexion ===
    this.room.onStateChange((state) => {
      console.log('📊 Room state changed:', state);
      this.emit('room:state', state);
    });

    this.room.onLeave((code) => {
      console.log('👋 Left room with code:', code);
      this.isConnected = false;
      this.emit('room:leave', { code });
    });

    this.room.onError((code, message) => {
      console.error('❌ Room error:', { code, message });
      this.emit('system:error', { code, message });
    });

    // === Chat ===
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

    // === Membres ===
    this.room.onMessage('member_online', (data) => this.emit('member:online', data));
    this.room.onMessage('member_offline', (data) => this.emit('member:offline', data));
    this.room.onMessage('member_promoted', (data) => this.emit('member:promoted', data));
    this.room.onMessage('member_demoted', (data) => this.emit('member:demoted', data));
    this.room.onMessage('member_kicked', (data) => this.emit('member:kicked', data));
    this.room.onMessage('member_list', (data) => this.emit('member:list', data));

    // === Stats & annonces ===
    this.room.onMessage('stats_updated', (data) => this.emit('clan:stats', data));
    this.room.onMessage('announcement_updated', (data) => this.emit('clan:announcement', data));

    // === Donations ===
    this.room.onMessage('new_donation_request', (msg) => {
      this.emit('donation:request', {
        messageId: msg.messageId,
        requesterUsername: msg.requesterUsername || 'Unknown',
        cardId: msg.cardId || 'unknown',
        amount: msg.amount || 1,
        timestamp: msg.timestamp || Date.now()
      });
    });

    this.room.onMessage('donation_request_sent', (msg) => {
      this.emit('donation:request:sent', {
        messageId: msg.messageId,
        requesterUsername: 'You',
        cardId: msg.cardId || 'unknown',
        amount: msg.amount || 1,
        timestamp: msg.timestamp || Date.now()
      });
    });

    this.room.onMessage('cards_donated', (msg) => {
      this.emit('donation:given', {
        messageId: msg.messageId,
        donorUsername: msg.donorUsername || 'Unknown',
        amount: msg.amount || 0,
        xpGained: msg.xpGained || 0,
        timestamp: msg.timestamp || Date.now()
      });
    });

    this.room.onMessage('donation_sent', (msg) => {
      this.emit('donation:sent', {
        messageId: msg.messageId,
        amount: msg.amount || 0,
        xpGained: msg.xpGained || 0,
        timestamp: msg.timestamp || Date.now()
      });
    });

    // === Events système ===
    this.room.onMessage('force_sync_completed', (data) => this.emit('system:sync', data));
    this.room.onMessage('room_shutting_down', (data) => this.emit('system:shutdown', data));
    this.room.onMessage('error', (err) => this.emit('system:error', err));

    console.log('✅ Colyseus event listeners setup complete');
  }

  // ==== Méthodes utilitaires ====
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getErrorMessage(error) {
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.code) return `Error code: ${error.code}`;
    return 'Unknown error occurred';
  }

  // ==== Getters pour debugging ====
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

  // ==== Nettoyage ====
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

// Singleton pour usage global
export default new ClanRoomClient();
