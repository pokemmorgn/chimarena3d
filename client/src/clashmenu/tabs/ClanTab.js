/**
 * ClanTab.js - Onglet Clan (REST + Colyseus via ClanRoomClient)
 * Ajout du Tab Donations
 */

import ClanCreateOverlay from './ClanCreateOverlay.js';
import ClanAPI from '../../services/ClanAPI.js';
import ClanRoomClient from '../services/ClanRoomClient.js';

class ClanTab {
  constructor() {
    this.isActive = false;
    this.currentUser = null;
    this.currentClan = null;
    this.createOverlay = null;

    this.state = 'loading';
    this.container = null;
    this.tabElement = null;

    this.chatMessages = [];
    this.clanMembers = [];
    this.donationRequests = [];
  }

  async initialize(container) {
    this.container = container;
    this.createTabElement();

    this.createOverlay = new ClanCreateOverlay();
    this.createOverlay.initialize(this.container);

    this.createOverlay.on('clan:created', (clanData) => {
      this.handleClanCreated(clanData);
    });

    this.checkClanStatus();
  }

  createTabElement() {
    this.tabElement = document.createElement('div');
    this.tabElement.className = 'clan-tab';
    this.tabElement.id = 'clan-tab';
    this.container.appendChild(this.tabElement);
  }

  async checkClanStatus() {
    this.setState('loading');
    setTimeout(() => {
      const hasClan = Math.random() > 0.5;
      if (hasClan) {
        this.currentClan = {
          clanId: 'test_clan_123',
          name: 'Epic Warriors',
          tag: '#ABC123XY',
          memberCount: 28,
          maxMembers: 50,
          myRole: 'member'
        };
        this.setState('has_clan');
      } else {
        this.setState('no_clan');
      }
    }, 1000);
  }

  handleClanCreated(clanData) {
    this.currentClan = {
      clanId: 'new_' + Date.now(),
      name: clanData.name,
      tag: '#NEWCLAN',
      memberCount: 1,
      maxMembers: 50,
      myRole: 'leader'
    };
    this.setState('has_clan');
  }

  setState(newState) {
    this.state = newState;
    this.render();
  }

  render() {
    if (!this.tabElement) return;
    switch (this.state) {
      case 'loading': this.renderLoading(); break;
      case 'no_clan': this.renderNoClan(); break;
      case 'has_clan': this.renderClanInterface(); break;
    }
  }

  renderLoading() {
    this.tabElement.innerHTML = `<div class="clan-loading"><div class="loading-spinner"></div><h3>Loading...</h3></div>`;
  }

  renderNoClan() {
    this.tabElement.innerHTML = `
      <div class="clan-no-clan">
        <h2>No Clan</h2>
        <button id="btn-create-clan">Create Clan</button>
      </div>`;
    this.tabElement.querySelector('#btn-create-clan').addEventListener('click', () => this.showCreateClanOverlay());
  }

  renderClanInterface() {
    this.tabElement.innerHTML = `
      <div class="clan-interface">
        <div class="clan-header">
          <div class="clan-name">${this.currentClan.name}</div>
          <div class="clan-tag">${this.currentClan.tag}</div>
        </div>
        <div class="clan-tabs">
          <button class="clan-tab-btn active" data-clan-tab="chat">💬 Chat</button>
          <button class="clan-tab-btn" data-clan-tab="members">👥 Members</button>
          <button class="clan-tab-btn" data-clan-tab="donations">🎁 Donations</button>
        </div>
        <div class="clan-content">
          <div class="clan-tab-content active" id="clan-tab-chat"><div id="clan-chat-messages"></div></div>
          <div class="clan-tab-content" id="clan-tab-members"><div id="clan-members-list"></div></div>
          <div class="clan-tab-content" id="clan-tab-donations">
            <div class="clan-donations">
              <div class="donation-header">
                <span>Donations</span>
                <button class="donation-btn request" id="btn-request-card">Request Card</button>
              </div>
              <div class="donation-list" id="donation-list"></div>
            </div>
          </div>
        </div>
      </div>`;

    this.setupClanInterfaceEvents();
    this.populateDonations();
  }

  setupClanInterfaceEvents() {
    this.tabElement.querySelectorAll('.clan-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.clanTab;
        this.switchClanTab(tab);
      });
    });

    const reqBtn = this.tabElement.querySelector('#btn-request-card');
    if (reqBtn) reqBtn.addEventListener('click', () => this.requestCard());
  }

  switchClanTab(tabName) {
    this.tabElement.querySelectorAll('.clan-tab-btn').forEach(btn =>
      btn.classList.toggle('active', btn.dataset.clanTab === tabName));
    this.tabElement.querySelectorAll('.clan-tab-content').forEach(content =>
      content.classList.toggle('active', content.id === `clan-tab-${tabName}`));
  }

  async connectToClanRoom() {
    if (!this.currentClan || !this.currentUser) return;
    const res = await ClanRoomClient.connect(this.currentUser.id, this.currentClan.clanId);
    if (res.success) {
      ClanRoomClient.on('donation:request', (data) => {
        this.donationRequests.push(data);
        this.populateDonations();
      });
    }
  }

  populateDonations() {
    const container = this.tabElement.querySelector('#donation-list');
    if (!container) return;
    if (this.donationRequests.length === 0) {
      container.innerHTML = `<p style="color:white">No requests</p>`;
      return;
    }
    container.innerHTML = this.donationRequests.map(req => `
      <div class="donation-item">
        <div class="donation-info">
          <div class="donation-requester">${req.requester || 'Player'}</div>
          <div class="donation-card">Card: ${req.cardId || 'Unknown'} (${req.amount || 1})</div>
        </div>
        <div class="donation-actions">
          <button class="donation-btn give" data-id="${req.messageId}">Give</button>
        </div>
      </div>`).join('');
    container.querySelectorAll('.donation-btn.give').forEach(btn => {
      btn.addEventListener('click', () => this.giveDonation(btn.dataset.id));
    });
  }

  async requestCard() {
    ClanRoomClient.send('request_cards', { cardId: 'archer', amount: 1 });
  }

  async giveDonation(messageId) {
    ClanRoomClient.send('donate_cards', { messageId, amount: 1 });
  }

  showCreateClanOverlay() {
    if (this.createOverlay) this.createOverlay.open();
  }
}

export default ClanTab;
