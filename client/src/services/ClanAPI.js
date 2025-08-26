/**
 * FIX pour ClanAPI.js - Utiliser l'instance NetworkManager avec interceptors
 */
import NetworkManager from './NetworkManager';

class ClanAPI {
  constructor() {
    // 🔥 CORRECTION : Utiliser l'instance clanAPI avec interceptors configurés
    this.api = NetworkManager.getClanAPIInstance();
    
    // ✅ Alternative si getClanAPIInstance() n'existe pas encore :
    // this.api = NetworkManager.clanAPI;
  }

  async getMyClan() {
    try {
      console.log('🔍 [ClanAPI] getMyClan - calling with interceptors');
      const res = await this.api.get('/my');
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to fetch my clan');
    }
  }

  async createClan(data) {
    try {
      console.log('🔍 [ClanAPI] createClan - calling with interceptors:', data);
      const res = await this.api.post('/create', data);
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to create clan');
    }
  }

  async joinClan(tag, inviteCode) {
    try {
      console.log('🔍 [ClanAPI] joinClan - calling with interceptors');
      const res = await this.api.post('/join', { tag, inviteCode });
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to join clan');
    }
  }

  async leaveClan() {
    try {
      console.log('🔍 [ClanAPI] leaveClan - calling with interceptors');
      const res = await this.api.post('/leave');
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to leave clan');
    }
  }

  async searchClans(query) {
    try {
      console.log('🔍 [ClanAPI] searchClans - calling with interceptors');
      const res = await this.api.get('/search', { params: query });
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to search clans');
    }
  }

  async getTopClans(region, limit = 100) {
    try {
      console.log('🔍 [ClanAPI] getTopClans - calling with interceptors');
      const res = await this.api.get('/leaderboard', { params: { region, limit } });
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to fetch top clans');
    }
  }

  async sendChatMessage(clanId, content) {
    try {
      console.log('🔍 [ClanAPI] sendChatMessage - calling with interceptors');
      const res = await this.api.post('/chat', { clanId, content });
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to send message');
    }
  }

  async requestCards(cardId, amount) {
    try {
      console.log('🔍 [ClanAPI] requestCards - calling with interceptors');
      const res = await this.api.post('/donations/request', { cardId, amount });
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to request cards');
    }
  }

  async donateCards(messageId, amount) {
    try {
      console.log('🔍 [ClanAPI] donateCards - calling with interceptors');
      const res = await this.api.post('/donations/donate', { messageId, amount });
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to donate cards');
    }
  }

  async promoteMember(targetId) {
    try {
      console.log('🔍 [ClanAPI] promoteMember - calling with interceptors');
      const res = await this.api.post('/members/promote', { targetUserId: targetId });
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to promote member');
    }
  }

  async demoteMember(targetId) {
    try {
      console.log('🔍 [ClanAPI] demoteMember - calling with interceptors');
      const res = await this.api.post('/members/demote', { targetUserId: targetId });
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to demote member');
    }
  }

  async kickMember(targetId, reason) {
    try {
      console.log('🔍 [ClanAPI] kickMember - calling with interceptors');
      const res = await this.api.post('/members/kick', { targetUserId: targetId, reason });
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to kick member');
    }
  }

  async transferLeadership(newLeaderId) {
    try {
      console.log('🔍 [ClanAPI] transferLeadership - calling with interceptors');
      const res = await this.api.post('/members/transfer-leadership', { targetUserId: newLeaderId });
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to transfer leadership');
    }
  }

  async getClanInfo(tag) {
    try {
      console.log('🔍 [ClanAPI] getClanInfo - calling with interceptors');
      const res = await this.api.get(`/${tag}`); // Corrigé l'endpoint
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to fetch clan info');
    }
  }

  handleError(err, fallback) {
    console.error('🔥 [ClanAPI] Error:', err);
    console.error('🔥 [ClanAPI] Request config:', err.config);
    console.error('🔥 [ClanAPI] Response data:', err.response?.data);
    console.error('🔥 [ClanAPI] Response status:', err.response?.status);
    
    if (err.response?.data) return err.response.data;
    return { success: false, error: fallback };
  }
}

// Singleton
export default new ClanAPI();
