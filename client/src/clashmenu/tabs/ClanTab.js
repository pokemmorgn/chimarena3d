import ClanCreateOverlay from './ClanCreateOverlay.js';
import ClanAPI from '../../services/ClanAPI.js';
import ClanContent from './clan/ClanContent.js';

class ClanTab {
  constructor() {
    this.state = 'loading';
    this.currentUser = null;
    this.currentClan = null;
    this.container = null;
    this.tabElement = null;
    this.createOverlay = null;
    this.clanContent = null;
  }

  async initialize(container, currentUser) {
    this.container = container;
    this.currentUser = currentUser;

    // 🔹 conteneur caché par défaut
    this.tabElement = document.createElement('div');
    this.tabElement.className = 'clan-tab';
    this.tabElement.style.display = 'none'; 
    this.container.appendChild(this.tabElement);

    this.createOverlay = new ClanCreateOverlay();
    this.createOverlay.initialize(this.container);
    this.createOverlay.on('clan:created', (clanData) => {
      this.currentClan = clanData;
      this.setState('has_clan');
    });

    await this.checkClanStatus();
  }

  async checkClanStatus() {
    this.setState('loading');
    const res = await ClanAPI.getMyClan();
    if (res.success && res.data) {
      this.currentClan = res.data;
      this.setState('has_clan');
    } else {
      this.setState('no_clan');
    }
  }

  setState(newState) {
    this.state = newState;
    this.render();
  }

  render() {
    if (!this.tabElement) return;

    if (this.state === 'loading') {
      this.tabElement.innerHTML = `
        <div class="clan-loading">
          <div class="loading-spinner"></div>
          <h3>Loading...</h3>
        </div>`;
    } else if (this.state === 'no_clan') {
      this.tabElement.innerHTML = `
        <div class="clan-no-clan">
          <div class="no-clan-header">
            <div class="clan-icon">🏰</div>
            <h2>No Clan</h2>
            <p>Join or create a clan to chat, share cards, and battle together!</p>
          </div>

          <div class="clan-actions">
            <button class="clan-action-btn primary" id="btn-create-clan">
              <span class="btn-icon">➕</span>
              <span class="btn-text">Create Clan</span>
            </button>
            <button class="clan-action-btn secondary" id="btn-join-clan">
              <span class="btn-icon">🔍</span>
              <span class="btn-text">Find Clan</span>
            </button>
          </div>

          <div class="clan-quick-stats">
            <div class="quick-stat">
              <div class="stat-number">0</div>
              <div class="stat-label">Clans</div>
            </div>
            <div class="quick-stat">
              <div class="stat-number">0</div>
              <div class="stat-label">Members</div>
            </div>
            <div class="quick-stat">
              <div class="stat-number">0</div>
              <div class="stat-label">Wars</div>
            </div>
          </div>
        </div>`;

      this.tabElement.querySelector('#btn-create-clan')
        .addEventListener('click', () => this.createOverlay.open());

      // TODO: brancher un vrai overlay pour Find Clan
      this.tabElement.querySelector('#btn-join-clan')
        .addEventListener('click', () => alert('Find Clan coming soon!'));
    } else if (this.state === 'has_clan') {
      // déléguer à ClanContent
      this.clanContent = new ClanContent(this.tabElement, this.currentUser, this.currentClan);
      this.clanContent.render();
    }
  }

  updatePlayerData(player) {
    this.currentUser = {
      id: player._id || player.id,
      username: player.username,
      displayName: player.displayName,
      level: player.level,
      trophies: player.stats?.currentTrophies || 0,
      clanId: player.clanId || null,
      clanRole: player.clanRole || null
    };

    if (this.clanContent) {
      this.clanContent.updatePlayer(this.currentUser);
    }
  }

  // 🔹 Gestion de visibilité pour TabNavigation
  hide() {
    if (this.tabElement) this.tabElement.style.display = 'none';
  }

  show() {
    if (this.tabElement) this.tabElement.style.display = 'flex'; // cohérent avec CSS .clan-tab
  }

  async cleanup() {
    if (this.tabElement && this.tabElement.parentNode) {
      this.tabElement.parentNode.removeChild(this.tabElement);
    }
    this.tabElement = null;
    this.clanContent = null;
  }
}

export default ClanTab;
