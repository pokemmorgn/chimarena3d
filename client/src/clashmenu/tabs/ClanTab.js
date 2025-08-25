/**
 * ClanTab.js - Onglet Clan avec gestion complète (REST + Colyseus)
 */

import ClanCreateOverlay from './ClanCreateOverlay.js';
import ClanAPI from '../network/ClanAPI.js';
import NetworkManager from '../network/NetworkManager.js';

class ClanTab {
  constructor() {
    this.isActive = false;
    this.currentUser = null;
    this.currentClan = null;
    this.clanRoom = null;
    this.createOverlay = null;

    this.state = 'loading'; // 'loading', 'no_clan', 'has_clan'
    this.container = null;
    this.tabElement = null;

    this.eventListeners = new Map();
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
      await this.connectToClanRoom(); // Colyseus ici
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
      this.disconnectFromClanRoom();
      this.currentClan = null;
      this.setState('no_clan');
    }
  }

  // ==== COLOSEUS ====

  async connectToClanRoom() {
    if (!this.currentClan || !this.currentUser) return;
    try {
      const colyseus = NetworkManager.getColyseusManager();
      this.clanRoom = await colyseus.joinOrCreate('clan', {
        auth: {
          userId: this.currentUser.id,
          clanId: this.currentClan.clanId
        }
      });
      this.setupClanRoomEvents();
    } catch (err) {
      console.error('❌ Failed to connect to ClanRoom:', err);
    }
  }

  disconnectFromClanRoom() {
    if (this.clanRoom) {
      this.clanRoom.leave();
      this.clanRoom = null;
    }
  }

  setupClanRoomEvents() {
    if (!this.clanRoom) return;

    this.clanRoom.onMessage('new_chat_message', (msg) => this.addChatMessage(msg));
    this.clanRoom.onMessage('member_online', () => this.populateMembers());
    this.clanRoom.onMessage('member_offline', () => this.populateMembers());

    this.clanRoom.onMessage('member_kicked', (data) => {
      if (data.targetUserId === this.currentUser.id) {
        this.currentClan = null;
        this.setState('no_clan');
      }
    });

    this.clanRoom.onMessage('stats_updated', (data) => {
      console.log('📊 Stats updated:', data.stats);
    });

    this.clanRoom.onMessage('announcement_updated', (data) => {
      console.log('📢 Announcement:', data.announcement);
    });
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

    if (this.clanRoom) {
      this.clanRoom.send('chat_message', { content: input.value.trim() });
    } else {
      ClanAPI.sendChatMessage(this.currentClan.clanId, input.value.trim());
    }

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
