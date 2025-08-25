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

  // ==== Bridge Colyseus → events locaux ====

  setupListeners() {
    if (!this.room) return;

    // Chat
    this.room.onMessage('new_chat_message', (msg) => this.emit('chat:message', msg));

    // Membres
    this.room.onMessage('member_online', (data) => this.emit('member:online', data));
    this.room.onMessage('member_offline', (data) => this.emit('member:offline', data));
    this.room.onMessage('member_kicked', (data) => this.emit('member:kicked', data));

    // Stats / annonces
    this.room.onMessage('stats_updated', (data) => this.emit('clan:stats', data));
    this.room.onMessage('announcement_updated', (data) => this.emit('clan:announcement', data));

    // Donations
    this.room.onMessage('new_donation_request', (data) => this.emit('donation:request', data));
    this.room.onMessage('donation_request_sent', (data) => this.emit('donation:request:sent', data));
    this.room.onMessage('cards_donated', (data) => this.emit('donation:given', data));
    this.room.onMessage('donation_sent', (data) => this.emit('donation:sent', data));
  }
}

export default new ClanRoomClient();
