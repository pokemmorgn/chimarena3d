/**
 * ClanTab.js - Onglet Clan (REST + Colyseus via ClanRoomClient)
 * Gère Chat, Membres, Donations
 */

import ClanCreateOverlay from './ClanCreateOverlay.js';
import ClanAPI from '../../services/ClanAPI.js';
import ClanRoomClient from '../../services/ClanRoomClient.js';

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

  async initialize(container, currentUser) {
    this.container = container;
    this.currentUser = currentUser;
    this.createTabElement();

    this.createOverlay = new ClanCreateOverlay();
    this.createOverlay.initialize(this.container);

    this.createOverlay.on('clan:created', (clanData) => {
      this.handleClanCreated(clanData);
    });

    await this.checkClanStatus();
  }

  createTabElement() {
    this.tabElement = document.createElement('div');
    this.tabElement.className = 'clan-tab';
    this.tabElement.id = 'clan-tab';
    this.container.appendChild(this.tabElement);
  }

  async checkClanStatus() {
    this.setState('loading');
    try {
      const response = await ClanAPI.getMyClan();
      if (response.success && response.data) {
        this.currentClan = response.data;
        this.setState('has_clan');
        this.connectToClanRoom();
      } else {
        this.setState('no_clan');
      }
    } catch (err) {
      console.error('Clan check failed:', err);
      this.setState('no_clan');
    }
  }

  handleClanCreated(clanData) {
    this.currentClan = clanData;
    this.setState('has_clan');
    this.connectToClanRoom();
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
    this.tabElement.innerHTML = `
      <div class="clan-loading">
        <div class="loading-spinner"></div>
        <h3>Loading...</h3>
      </div>`;
  }

  renderNoClan() {
    this.tabElement.innerHTML = `
      <div class="clan-no-clan">
        <h2>No Clan</h2>
        <button id="btn-create-clan">Create Clan</button>
      </div>`;
    this.tabElement.querySelector('#btn-create-clan')
      .addEventListener('click', () => this.showCreateClanOverlay());
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
          <div class="clan-tab-content active" id="clan-tab-chat">
            <div class="chat-messages" id="clan-chat-messages"></div>
            <div class="chat-input-container">
              <input id="clan-chat-input" class="chat-input" placeholder="Message..." />
              <button id="btn-send-message" class="chat-send-btn">➤</button>
            </div>
          </div>
          <div class="clan-tab-content" id="clan-tab-members">
            <div id="clan-members-list"></div>
          </div>
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
    this.populateChatMessages();
    this.populateDonations();
  }

  setupClanInterfaceEvents() {
    this.tabElement.querySelectorAll('.clan-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.clanTab;
        this.switchClanTab(tab);
      });
    });

    // Chat
    const sendBtn = this.tabElement.querySelector('#btn-send-message');
    const input = this.tabElement.querySelector('#clan-chat-input');
    sendBtn?.addEventListener('click', () => this.sendChatMessage());
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendChatMessage();
    });

    // Donations
    const reqBtn = this.tabElement.querySelector('#btn-request-card');
    if (reqBtn) reqBtn.addEventListener('click', () => this.requestCard());
  }

  switchClanTab(tabName) {
    this.tabElement.querySelectorAll('.clan-tab-btn').forEach(btn =>
      btn.classList.toggle('active', btn.dataset.clanTab === tabName));
    this.tabElement.querySelectorAll('.clan-tab-content').forEach(content =>
      content.classList.toggle('active', content.id === `clan-tab-${tabName}`));
  }

  // ==== Colyseus binding ====
  async connectToClanRoom() {
    if (!this.currentClan || !this.currentUser) return;
    const res = await ClanRoomClient.connect(this.currentUser.id, this.currentClan.clanId);
    if (res.success) {
      this.setupRoomEvents();
    }
  }

  setupRoomEvents() {
    // Chat
    ClanRoomClient.on('chat:message', (msg) => {
      this.chatMessages.push(msg);
      this.addChatMessage(msg);
    });

    // Members
    ClanRoomClient.on('member:online', (data) => this.updateMemberStatus(data.userId, true));
    ClanRoomClient.on('member:offline', (data) => this.updateMemberStatus(data.userId, false));

    // Donations
    ClanRoomClient.on('donation:request', (data) => {
      this.donationRequests.push(data);
      this.populateDonations();
    });
    ClanRoomClient.on('donation:request:sent', (data) => {
      this.donationRequests.push(data);
      this.populateDonations();
    });
    ClanRoomClient.on('donation:given', () => this.populateDonations());
  }

  // ==== CHAT ====
  populateChatMessages() {
    const container = this.tabElement.querySelector('#clan-chat-messages');
    if (!container) return;
    container.innerHTML = this.chatMessages.map(m =>
      `<div class="chat-message">
        <div class="message-header">
          <span class="message-author ${m.authorRole}">${m.authorUsername}</span>
          <span class="message-time">${new Date(m.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="message-content">${m.content}</div>
      </div>`
    ).join('');
  }

  addChatMessage(message) {
    const container = this.tabElement.querySelector('#clan-chat-messages');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'chat-message';
    el.innerHTML = `
      <div class="message-header">
        <span class="message-author ${message.authorRole}">${message.authorUsername}</span>
        <span class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</span>
      </div>
      <div class="message-content">${message.content}</div>
    `;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
  }

  sendChatMessage() {
    const input = this.tabElement.querySelector('#clan-chat-input');
    if (!input || !input.value.trim()) return;
    ClanRoomClient.sendChat(input.value.trim());
    input.value = '';
  }

  // ==== DONATIONS ====
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
          <div class="donation-requester">${req.requesterUsername}</div>
          <div class="donation-card">Card: ${req.cardId} (${req.amount})</div>
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
    ClanRoomClient.requestCards('archer', 1);
  }

  async giveDonation(messageId) {
    ClanRoomClient.donateCards(messageId, 1);
  }

  // ==== MEMBERS ====
  updateMemberStatus(userId, isOnline) {
    const list = this.tabElement.querySelector('#clan-members-list');
    if (!list) return;
    // TODO: implémenter affichage/màj membres
    console.log(`Member ${userId} is now ${isOnline ? 'online' : 'offline'}`);
  }

  // ==== Utils ====
  showCreateClanOverlay() {
    if (this.createOverlay) this.createOverlay.open();
  }

  hide() {
    if (this.tabElement) this.tabElement.classList.remove('active');
    this.isActive = false;
    ClanRoomClient.leave();
  }

  show() {
    if (this.tabElement) this.tabElement.classList.add('active');
    this.isActive = true;
    if (this.state === 'has_clan' && this.currentClan) {
      this.connectToClanRoom();
    }
  }
}

export default ClanTab;
