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

    this.tabElement = document.createElement('div');
    this.tabElement.className = 'clan-tab';
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
    if (this.state === 'loading') {
      this.tabElement.innerHTML = `
        <div class="clan-loading">
          <div class="loading-spinner"></div>
          <h3>Loading...</h3>
        </div>`;
    } else if (this.state === 'no_clan') {
      this.tabElement.innerHTML = `
        <div class="clan-no-clan">
          <h2>No Clan</h2>
          <button id="btn-create-clan">Create Clan</button>
        </div>`;
      this.tabElement.querySelector('#btn-create-clan')
        .addEventListener('click', () => this.createOverlay.open());
    } else if (this.state === 'has_clan') {
      // déléguer à ClanContent
      this.clanContent = new ClanContent(this.tabElement, this.currentUser, this.currentClan);
      this.clanContent.render();
    }
  }

  /**
   * Met à jour les données du joueur côté ClanTab
   */
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

    // Si ClanContent est déjà actif, propager la mise à jour
    if (this.clanContent && typeof this.clanContent.updatePlayer === 'function') {
      this.clanContent.updatePlayer(this.currentUser);
    }
  }
}

export default ClanTab;
