import NetworkManager from './NetworkManager';

class ClanAPI {
  constructor() {
    // On crée une instance axios pour /api/clan
    this.api = NetworkManager.createAPIInstance('/clan');
  }

  async getMyClan() {
    try {
      const res = await this.api.get('/my');
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to fetch my clan');
    }
  }

  async createClan(data) {
    try {
      const res = await this.api.post('/create', data);
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to create clan');
    }
  }

  async joinClan(tag, inviteCode) {
    try {
      const res = await this.api.post('/join', { tag, inviteCode });
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to join clan');
    }
  }

  async leaveClan() {
    try {
      const res = await this.api.post('/leave');
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to leave clan');
    }
  }

  async searchClans(query) {
    try {
      const res = await this.api.get('/search', { params: query });
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to search clans');
    }
  }

  async getTopClans(region, limit = 100) {
    try {
      const res = await this.api.get('/leaderboard', { params: { region, limit } });
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to fetch top clans');
    }
  }

  async sendChatMessage(clanId, content) {
    try {
      const res = await this.api.post('/chat', { clanId, content });
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to send message');
    }
  }

  async requestCards(cardId, amount) {
    try {
      const res = await this.api.post('/donations/request', { cardId, amount });
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to request cards');
    }
  }

  async donateCards(messageId, amount) {
    try {
      const res = await this.api.post('/donations/donate', { messageId, amount });
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to donate cards');
    }
  }

  async promoteMember(targetId) {
    try {
      const res = await this.api.post('/promote', { targetId });
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to promote member');
    }
  }

  async demoteMember(targetId) {
    try {
      const res = await this.api.post('/demote', { targetId });
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to demote member');
    }
  }

  async kickMember(targetId) {
    try {
      const res = await this.api.post('/kick', { targetId });
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to kick member');
    }
  }

  async transferLeadership(newLeaderId) {
    try {
      const res = await this.api.post('/transfer-leadership', { newLeaderId });
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to transfer leadership');
    }
  }

  async getClanInfo(tag) {
    try {
      const res = await this.api.get(`/info/${tag}`);
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to fetch clan info');
    }
  }

  handleError(err, fallback) {
    console.error(err);
    if (err.response?.data) return err.response.data;
    return { success: false, error: fallback };
  }
}

// Singleton
export default new ClanAPI();
