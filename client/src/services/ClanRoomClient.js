import NetworkManager from './NetworkManager';

class ClanRoomClient {
  constructor() {
    this.colyseus = NetworkManager.getColyseusManager();
    this.room = null;
    this.eventListeners = new Map();
  }

  // ==== Connexion ====

  async connect(userId, clanId) {
    try {
      this.room = await this.colyseus.joinOrCreate('clan', {
        auth: { userId, clanId }
      });
      this.setupListeners();
      return { success: true, room: this.room };
    } catch (err) {
      console.error('❌ Failed to join ClanRoom:', err);
      return { success: false, error: err.message };
    }
  }

  leave() {
    if (this.room) {
      this.room.leave();
      this.room = null;
    }
  }

  // ==== Chat ====

  sendChat(content) {
    this.room?.send('chat_message', { content });
  }

  // ==== Donations ====

  requestCards(cardId, amount = 1) {
    this.room?.send('request_cards', { cardId, amount });
  }

  donateCards(messageId, amount) {
    this.room?.send('donate_cards', { messageId, amount });
  }

  // ==== Gestion membres ====

  promoteMember(targetUserId) {
    this.room?.send('promote_member', { targetUserId });
  }

  demoteMember(targetUserId) {
    this.room?.send('demote_member', { targetUserId });
  }

  kickMember(targetUserId, reason) {
    this.room?.send('kick_member', { targetUserId, reason });
  }

  // ==== Event system (wrapper) ====

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
      this.eventListeners.get(event).forEach(cb => {
        try { cb(data); } catch (err) { console.error(err); }
      });
    }
  }

  // ==== Bridge Colyseus → events normalisés ====

  setupListeners() {
    if (!this.room) return;

    // === Chat ===
    this.room.onMessage('new_chat_message', (msg) => {
      const normalized = {
        messageId: msg.messageId,
        authorId: msg.authorId,
        authorUsername: msg.authorUsername || 'Unknown',
        authorRole: msg.authorRole || 'member',
        content: msg.content || '',
        timestamp: msg.timestamp || Date.now()
      };
      this.emit('chat:message', normalized);
    });

    // === Membres ===
    this.room.onMessage('member_online', (data) => this.emit('member:online', data));
    this.room.onMessage('member_offline', (data) => this.emit('member:offline', data));
    this.room.onMessage('member_kicked', (data) => this.emit('member:kicked', data));

    // === Stats & annonces ===
    this.room.onMessage('stats_updated', (data) => this.emit('clan:stats', data));
    this.room.onMessage('announcement_updated', (data) => this.emit('clan:announcement', data));

    // === Donations ===
    this.room.onMessage('new_donation_request', (msg) => {
      const normalized = {
        messageId: msg.messageId,
        requesterUsername: msg.requesterUsername || 'Unknown',
        cardId: msg.cardId || 'unknown',
        amount: msg.amount || 1,
        timestamp: msg.timestamp || Date.now()
      };
      this.emit('donation:request', normalized);
    });

    this.room.onMessage('donation_request_sent', (msg) => {
      const normalized = {
        messageId: msg.messageId,
        requesterUsername: this.room.sessionId || 'You',
        cardId: msg.cardId || 'unknown',
        amount: msg.amount || 1,
        timestamp: msg.timestamp || Date.now()
      };
      this.emit('donation:request:sent', normalized);
    });

    this.room.onMessage('cards_donated', (msg) => {
      const normalized = {
        messageId: msg.messageId,
        donorUsername: msg.donorUsername || 'Unknown',
        amount: msg.amount || 0,
        xpGained: msg.xpGained || 0,
        timestamp: msg.timestamp || Date.now()
      };
      this.emit('donation:given', normalized);
    });

    this.room.onMessage('donation_sent', (msg) => {
      const normalized = {
        messageId: msg.messageId,
        amount: msg.amount || 0,
        xpGained: msg.xpGained || 0,
        timestamp: msg.timestamp || Date.now()
      };
      this.emit('donation:sent', normalized);
    });
  }
}

export default new ClanRoomClient();
