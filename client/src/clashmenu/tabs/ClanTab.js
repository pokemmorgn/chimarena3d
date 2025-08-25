/**
 * ClanTab.js - Conteneur principal
 * Décide quel état afficher (loading / no clan / clan content)
 */

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

    // Crée le wrapper principal
    this.tabElement = document.createElement('div');
    this.tabElement.className = 'clan-tab';
    this.container.appendChild(this.tabElement);

    // Overlay création de clan
    this.createOverlay = new ClanCreateOverlay();
    this.createOverlay.initialize(this.container);
    this.createOverlay.on('clan:created', (clanData) => {
      this.currentClan = clanData;
      this.setState('has_clan');
    });

    // Vérifie état du clan
    await this.checkClanStatus();
  }

  async checkClanStatus() {
    this.setState('loading');
    try {
      const res = await ClanAPI.getMyClan();
      if (res.success && res.data) {
        this.currentClan = res.data;
        this.setState('has_clan');
      } else {
        this.setState('no_clan');
      }
    } catch (err) {
      console.error('❌ Clan check failed:', err);
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
    }

    else if (this.state === 'no_clan') {
      this.tabElement.innerHTML = `
        <div class="clan-no-clan">
          <h2>No Clan</h2>
          <button id="btn-create-clan">Create Clan</button>
        </div>`;
      this.tabElement.querySelector('#btn-create-clan')
        .addEventListener('click', () => this.createOverlay.open());
    }

    else if (this.state === 'has_clan') {
      this.clanContent = new ClanContent(this.tabElement, this.currentUser, this.currentClan);
      this.clanContent.render();
    }
  }

  show() {
    if (this.tabElement) this.tabElement.classList.add('active');
    if (this.state === 'has_clan' && this.clanContent) {
      // reconnecter au besoin
      this.clanContent.render();
    }
  }

  hide() {
    if (this.tabElement) this.tabElement.classList.remove('active');
    if (this.clanContent) this.clanContent.destroy();
  }
}

export default ClanTab;
