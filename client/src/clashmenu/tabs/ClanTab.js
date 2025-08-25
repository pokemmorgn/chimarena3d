/**
 * ClanTab.js - Onglet Clan (REST + Colyseus via ClanRoomClient)
 */

import ClanCreateOverlay from './ClanCreateOverlay.js';
import ClanAPI from '../network/ClanAPI.js';
import ClanRoomClient from '../network/ClanRoomClient.js';

class ClanTab {
  constructor() {
    this.isActive = false;
    this.currentUser = null;
    this.currentClan = null;
    this.createOverlay = null;

    this.state = 'loading'; // 'loading', 'no_clan', 'has_clan'
    this.container = null;
    this.tabElement = null;

    this.chatMessages = [];
    this.clanMembers = [];
  }

  async initialize(container) {
    if (!container) throw new Error('Container is required for ClanTab');
    this.container = container;

    this.createTabElement();

    this.createOverlay = new ClanCreateOverlay();
    this.createOverlay.initialize(this.container);
    this.createOverlay.on('clan:created', (clanData) => this.handleClanCreated(clanData));

    await this.checkClanStatus();
  }

  createTabElement() {
    this.tabElement = document.createElement('div');
    this.tabElement.className = 'clan-tab';
    this.container.appendChild(this.tabElement);
  }

  // ==== REST API ====

  async checkClanStatus() {
    this.setState('loading');
    const res = await ClanAPI.getMyClan();

    if (res.success && res.clan) {
      this.currentClan = res.clan;
      this.setState('has_clan');
      await this.connectToClanRoom();
    } else {
      this.setState('no_clan');
    }
  }

  async handleClanCreated(clanData) {
    const res = await ClanAPI.createClan(clanData);
    if (res.success && res.clan) {
      this.currentClan = res.clan;
      this.setState('has_clan');
      await this.connectToClanRoom();
    } else {
      this.setState('no_clan');
    }
  }

  async leaveClan() {
    const res = await ClanAPI.leaveClan();
    if (res.success) {
      ClanRoomClient.leave();
      this.currentClan = null;
      this.setState('no_clan');
    }
  }

  // ==== COLOSEUS (via ClanRoomClient) ====

  async connectToClanRoom() {
    if (!this.currentClan || !this.currentUser) return;
    const res = await ClanRoomClient.connect(this.currentUser.id, this.currentClan.clanId);
    if (res.success) {
      // Abonnements
      ClanRoomClient.on('chat:message', (msg) => this.addChatMessage(msg));
      ClanRoomClient.on('member:online', () => this.populateMembers());
      ClanRoomClient.on('member:offline', () => this.populateMembers());
      ClanRoomClient.on('member:kicked', (data) => {
        if (data.targetUserId === this.currentUser.id) {
          this.currentClan = null;
          this.setState('no_clan');
        }
      });
      ClanRoomClient.on('clan:stats', (data) => console.log('📊 Stats updated:', data));
      ClanRoomClient.on('clan:announcement', (data) => console.log('📢 Announcement:', data.announcement));
    }
  }

  disconnectFromClanRoom() {
    ClanRoomClient.leave();
  }

  // ==== RENDER ====

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
      default: this.renderError();
    }
  }

  renderLoading() {
    this.tabElement.innerHTML = `<div>Loading clan...</div>`;
  }

  renderNoClan() {
    this.tabElement.innerHTML = `
      <div class="clan-no-clan">
        <button id="btn-create-clan">Create Clan</button>
        <button id="btn-join-by-tag">Join by Tag</button>
        <button id="btn-search-clans">Search Clans</button>
      </div>
    `;
    this.tabElement.querySelector('#btn-create-clan')
      ?.addEventListener('click', () => this.showCreateClanOverlay());
  }

  renderClanInterface() {
    this.tabElement.innerHTML = `
      <div class="clan-interface">
        <div class="clan-header">
          <div>${this.currentClan.name} (${this.currentClan.tag})</div>
          <button id="btn-leave-clan">Leave</button>
        </div>
        <div class="clan-tabs">
          <button data-tab="chat" class="active">Chat</button>
          <button data-tab="members">Members</button>
        </div>
        <div class="clan-content">
          <div id="clan-tab-chat" class="active">
            <div id="clan-chat-messages"></div>
            <input id="clan-chat-input" placeholder="Message..." />
            <button id="btn-send-message">Send</button>
          </div>
          <div id="clan-tab-members">
            <div id="clan-members-list"></div>
          </div>
        </div>
      </div>
    `;

    this.setupClanInterfaceEvents();
    this.populateChatMessages();
    this.populateMembers();
  }

  renderError() {
    this.tabElement.innerHTML = `<div>❌ Error loading clan</div>`;
  }

  setupClanInterfaceEvents() {
    this.tabElement.querySelector('#btn-leave-clan')
      ?.addEventListener('click', () => this.leaveClan());

    const input = this.tabElement.querySelector('#clan-chat-input');
    const sendBtn = this.tabElement.querySelector('#btn-send-message');
    sendBtn?.addEventListener('click', () => this.sendChatMessage());
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendChatMessage();
    });
  }

  // ==== CHAT ====

  populateChatMessages() {
    const container = this.tabElement.querySelector('#clan-chat-messages');
    if (!container) return;
    container.innerHTML = (this.currentClan.recentChat || [])
      .map(m => `<div><b>${m.author}</b>: ${m.content}</div>`).join('');
  }

  addChatMessage(message) {
    const container = this.tabElement.querySelector('#clan-chat-messages');
    if (!container) return;
    const el = document.createElement('div');
    el.innerHTML = `<b>${message.authorUsername || message.author}</b>: ${message.content}`;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
  }

  sendChatMessage() {
    const input = this.tabElement.querySelector('#clan-chat-input');
    if (!input || !input.value.trim()) return;

    ClanRoomClient.sendChat(input.value.trim()); // temps réel
    input.value = '';
  }

  // ==== MEMBERS ====

  populateMembers() {
    const container = this.tabElement.querySelector('#clan-members-list');
    if (!container || !this.currentClan.members) return;

    container.innerHTML = this.currentClan.members
      .map(m => `<div>${m.displayName} (${m.role}) - ${m.trophies}🏆</div>`)
      .join('');
  }

  // ==== Overlays / utils ====
  showCreateClanOverlay() { if (this.createOverlay) this.createOverlay.open(); }
  updatePlayerData(user) { this.currentUser = user; }
}

export default ClanTab;
