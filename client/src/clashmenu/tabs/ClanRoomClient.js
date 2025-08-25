import NetworkManager from './NetworkManager';

class ClanRoomClient {
  constructor() {
    this.colyseus = NetworkManager.getColyseusManager();
    this.room = null;
    this.eventListeners = new Map();
  }

  /**
   * Connecter l’utilisateur à la room d’un clan
   */
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

  /**
   * Quitter la room
   */
  leave() {
    if (this.room) {
      this.room.leave();
      this.room = null;
    }
  }

  /**
   * Envoyer un message de chat
   */
  sendChat(content) {
    if (!this.room) return;
    this.room.send('chat_message', { content });
  }

  /**
   * Demander des cartes
   */
  requestCards(cardId, amount) {
    if (!this.room) return;
    this.room.send('request_cards', { cardId, amount });
  }

  /**
   * Donner des cartes
   */
  donateCards(messageId, amount) {
    if (!this.room) return;
    this.room.send('donate_cards', { messageId, amount });
  }

  /**
   * Actions sur les membres
   */
  promoteMember(targetUserId) {
    this.room?.send('promote_member', { targetUserId });
  }

  demoteMember(targetUserId) {
    this.room?.send('demote_member', { targetUserId });
  }

  kickMember(targetUserId, reason) {
    this.room?.send('kick_member', { targetUserId, reason });
  }

  /**
   * Gestion des events
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
      this.eventListeners.get(event).forEach(cb => {
        try { cb(data); } catch (err) { console.error(err); }
      });
    }
  }

  /**
   * Setup des listeners Colyseus (bridge vers events locaux)
   */
  setupListeners() {
    if (!this.room) return;

    this.room.onMessage('new_chat_message', (msg) => this.emit('chat:message', msg));
    this.room.onMessage('member_online', (data) => this.emit('member:online', data));
    this.room.onMessage('member_offline', (data) => this.emit('member:offline', data));
    this.room.onMessage('member_kicked', (data) => this.emit('member:kicked', data));
    this.room.onMessage('stats_updated', (data) => this.emit('clan:stats', data));
    this.room.onMessage('announcement_updated', (data) => this.emit('clan:announcement', data));
  }
}

export default new ClanRoomClient();
