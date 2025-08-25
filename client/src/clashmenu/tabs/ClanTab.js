/**
 * ClanTab.js - Onglet Clan avec gestion complète
 * Gère : Pas de clan, Création/Recherche, Interface clan complète
 */

import ClanCreateOverlay from './ClanCreateOverlay.js';
import ClanAPI from '../network/ClanAPI.js';

class ClanTab {
  constructor() {
    this.isActive = false;
    this.currentUser = null;
    this.currentClan = null;
    this.clanRoom = null;
    this.createOverlay = null;

    // États possibles
    this.state = 'loading'; // 'loading', 'no_clan', 'has_clan'
    
    // Composants
    this.container = null;
    this.tabElement = null;
    
    // Event system
    this.eventListeners = new Map();
    
    // Chat data
    this.chatMessages = [];
    this.chatContainer = null;
    this.chatInput = null;
    
    // Members data
    this.clanMembers = [];
    
    console.log('🏰 ClanTab created');
  }

  /**
   * Initialize clan tab
   */
  async initialize(container) {
    if (!container) {
      throw new Error('Container is required for ClanTab');
    }
  
    this.container = container;
  
    try {
      console.log('🏰 Initializing ClanTab...');
      
      this.createTabElement();
      
      // Initialize overlays
      this.createOverlay = new ClanCreateOverlay();
      this.createOverlay.initialize(this.container);
      
      // Setup overlay events
      this.createOverlay.on('clan:created', (clanData) => {
        this.handleClanCreated(clanData);
      });
      
      this.checkClanStatus();
      
      console.log('✅ ClanTab initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize ClanTab:', error);
      throw error;
    }
  }

  /**
   * Create tab element
   */
  createTabElement() {
    this.tabElement = document.createElement('div');
    this.tabElement.className = 'clan-tab';
    this.tabElement.id = 'clan-tab';
    this.container.appendChild(this.tabElement);
    
    console.log('🏰 Clan tab element created');
  }

  /**
   * Check clan status from API
   */
  async checkClanStatus() {
    this.setState('loading');
    const res = await ClanAPI.getMyClan();

    if (res.success && res.clan) {
      this.currentClan = res.clan;
      this.setState('has_clan');
    } else {
      this.setState('no_clan');
    }
  }

  async handleClanCreated(clanData) {
    const res = await ClanAPI.createClan(clanData);
    if (res.success && res.clan) {
      this.currentClan = res.clan;
      this.setState('has_clan');
    } else {
      console.error('❌ Failed to create clan:', res.error);
      this.setState('no_clan');
    }
  }
  
  /**
   * Set current state and render
   */
  setState(newState) {
    this.state = newState;
    this.render();
    console.log(`🏰 Clan state set to: ${newState}`);
  }

  /**
   * Main render method
   */
  render() {
    if (!this.tabElement) return;
    
    switch (this.state) {
      case 'loading':
        this.renderLoading();
        break;
      case 'no_clan':
        this.renderNoClan();
        break;
      case 'has_clan':
        this.renderClanInterface();
        break;
      default:
        this.renderError();
    }
  }

  /**
   * Render loading state
   */
  renderLoading() {
    this.tabElement.innerHTML = `
      <div class="clan-loading">
        <div class="loading-spinner"></div>
        <h3>🏰 Loading Clan Info...</h3>
        <p>Checking your clan status</p>
      </div>
    `;
  }

  /**
   * Render no clan state (create/join options)
   */
  renderNoClan() {
    this.tabElement.innerHTML = `
      <div class="clan-no-clan">
        <div class="no-clan-header">
          <div class="clan-icon">🏰</div>
          <h2>Join a Clan!</h2>
          <p>Team up with other players, share cards, and participate in Clan Wars!</p>
        </div>

        <div class="clan-actions">
          <button class="clan-action-btn primary" id="btn-create-clan">
            <span class="btn-icon">✨</span>
            <span class="btn-text">Create Clan</span>
          </button>
          
          <button class="clan-action-btn secondary" id="btn-join-by-tag">
            <span class="btn-icon">🔍</span>
            <span class="btn-text">Join by Tag</span>
          </button>
          
          <button class="clan-action-btn secondary" id="btn-search-clans">
            <span class="btn-icon">📋</span>
            <span class="btn-text">Search Clans</span>
          </button>
        </div>
      </div>
    `;
    
    this.setupNoClanEvents();
  }

  /**
   * Render full clan interface
   */
  renderClanInterface() {
    if (!this.currentClan) return;
    
    this.tabElement.innerHTML = `
      <div class="clan-interface">
        <div class="clan-header">
          <div class="clan-info">
            <div class="clan-name">${this.currentClan.name}</div>
            <div class="clan-tag">${this.currentClan.tag}</div>
            <div class="clan-members">${this.currentClan.memberCount}/${this.currentClan.maxMembers} members</div>
          </div>
          <div class="clan-actions-header">
            <button class="clan-header-btn danger" id="btn-leave-clan">🚪</button>
          </div>
        </div>

        <div class="clan-tabs">
          <button class="clan-tab-btn active" data-clan-tab="chat">💬 Chat</button>
          <button class="clan-tab-btn" data-clan-tab="members">👥 Members</button>
        </div>

        <div class="clan-content">
          <div class="clan-tab-content active" id="clan-tab-chat">
            <div class="clan-chat">
              <div class="chat-messages" id="clan-chat-messages"></div>
              <div class="chat-input-container">
                <input type="text" class="chat-input" id="clan-chat-input" placeholder="Type your message..." maxlength="200">
                <button class="chat-send-btn" id="btn-send-message">➤</button>
              </div>
            </div>
          </div>

          <div class="clan-tab-content" id="clan-tab-members">
            <div class="clan-members">
              <div class="members-list" id="clan-members-list"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.setupClanInterfaceEvents();
    this.populateChatMessages();
    this.populateMembers();
  }

  /**
   * Render error state
   */
  renderError() {
    this.tabElement.innerHTML = `
      <div class="clan-error">
        <div class="error-icon">❌</div>
        <h3>Error Loading Clan</h3>
        <p>Unable to load clan information</p>
        <button class="retry-btn" id="btn-retry-clan">🔄 Retry</button>
      </div>
    `;

    const retry = this.tabElement.querySelector('#btn-retry-clan');
    if (retry) retry.addEventListener('click', () => this.checkClanStatus());
  }

  /**
   * Setup events for no clan state
   */
  setupNoClanEvents() {
    const createBtn = this.tabElement.querySelector('#btn-create-clan');
    if (createBtn) createBtn.addEventListener('click', () => this.showCreateClanOverlay());

    const joinBtn = this.tabElement.querySelector('#btn-join-by-tag');
    if (joinBtn) joinBtn.addEventListener('click', () => this.showJoinByTagOverlay());

    const searchBtn = this.tabElement.querySelector('#btn-search-clans');
    if (searchBtn) searchBtn.addEventListener('click', () => this.showSearchClansOverlay());
  }

  /**
   * Setup events for clan interface
   */
  setupClanInterfaceEvents() {
    const tabBtns = this.tabElement.querySelectorAll('.clan-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.dataset.clanTab;
        this.switchClanTab(tabName);
      });
    });

    const leaveBtn = this.tabElement.querySelector('#btn-leave-clan');
    if (leaveBtn) leaveBtn.addEventListener('click', () => this.leaveClan());

    const chatInput = this.tabElement.querySelector('#clan-chat-input');
    const sendBtn = this.tabElement.querySelector('#btn-send-message');
    
    if (chatInput && sendBtn) {
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendChatMessage();
        }
      });
      sendBtn.addEventListener('click', () => this.sendChatMessage());
    }
  }

  /**
   * Switch clan internal tab
   */
  switchClanTab(tabName) {
    const tabBtns = this.tabElement.querySelectorAll('.clan-tab-btn');
    tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.clanTab === tabName));

    const contents = this.tabElement.querySelectorAll('.clan-tab-content');
    contents.forEach(content => content.classList.toggle('active', content.id === `clan-tab-${tabName}`));
  }

  /**
   * Populate chat messages
   */
  populateChatMessages() {
    const messagesContainer = this.tabElement.querySelector('#clan-chat-messages');
    if (!messagesContainer || !this.currentClan?.recentChat) return;

    messagesContainer.innerHTML = this.currentClan.recentChat.map(msg => `
      <div class="chat-message">
        <div class="message-header">
          <span class="message-author ${msg.role}">${msg.author}</span>
          <span class="message-time">${this.formatTime(msg.timestamp)}</span>
        </div>
        <div class="message-content">${msg.content}</div>
      </div>
    `).join('');

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Populate members list
   */
  populateMembers() {
    const membersContainer = this.tabElement.querySelector('#clan-members-list');
    if (!membersContainer || !this.currentClan?.members) return;

    membersContainer.innerHTML = this.currentClan.members.map(member => `
      <div class="member-item ${member.isOnline ? 'online' : 'offline'}">
        <div class="member-info">
          <div class="member-name">${member.displayName}</div>
          <div class="member-stats">
            <span>🏆 ${member.trophies}</span>
            <span>🎁 ${member.donationsGiven}</span>
          </div>
        </div>
        <div class="member-role ${member.role}">${member.role}</div>
      </div>
    `).join('');
  }

  /**
   * Send chat message via API
   */
  async sendChatMessage() {
    const input = this.tabElement.querySelector('#clan-chat-input');
    if (!input || !input.value.trim()) return;

    const res = await ClanAPI.sendChatMessage(this.currentClan.clanId, input.value.trim());
    if (res.success && res.message) {
      this.addChatMessage(res.message);
      input.value = '';
    } else {
      console.error('❌ Chat failed:', res.error);
    }
  }

  /**
   * Add message to chat
   */
  addChatMessage(message) {
    const messagesContainer = this.tabElement.querySelector('#clan-chat-messages');
    if (!messagesContainer) return;

    const el = document.createElement('div');
    el.className = 'chat-message';
    el.innerHTML = `
      <div class="message-header">
        <span class="message-author ${message.role}">${message.author}</span>
        <span class="message-time">${this.formatTime(message.timestamp)}</span>
      </div>
      <div class="message-content">${message.content}</div>
    `;
    messagesContainer.appendChild(el);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Leave clan
   */
  async leaveClan() {
    const res = await ClanAPI.leaveClan();
    if (res.success) {
      this.currentClan = null;
      this.setState('no_clan');
    } else {
      console.error('❌ Failed to leave clan:', res.error);
    }
  }

  /**
   * Format timestamp
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return date.toLocaleDateString();
  }

  // Placeholders for overlays
  showCreateClanOverlay() { if (this.createOverlay) this.createOverlay.open(); }
  showJoinByTagOverlay() { console.log('🏰 Show join by tag overlay'); }
  showSearchClansOverlay() { console.log('🏰 Show search clans overlay'); }

  // Lifecycle
  activate() { this.show(); }
  deactivate() { this.hide(); }

  show() {
    if (this.tabElement) this.tabElement.classList.add('active');
    this.isActive = true;
  }

  hide() {
    if (this.tabElement) this.tabElement.classList.remove('active');
    this.isActive = false;
  }

  async cleanup() {
    console.log('🧹 Cleaning up ClanTab...');
    if (this.createOverlay) this.createOverlay.cleanup();
    this.eventListeners.clear();
    if (this.tabElement?.parentNode) this.tabElement.parentNode.removeChild(this.tabElement);
    this.tabElement = null;
    this.container = null;
    this.currentUser = null;
    this.currentClan = null;
    console.log('✅ ClanTab cleaned up');
  }
}

export default ClanTab;
