/**
 * ClanTab.js - Onglet Clan avec gestion complète
 * Gère : Pas de clan, Création/Recherche, Interface clan complète
 */

import ClanCreateOverlay from './ClanCreateOverlay.js';


class ClanTab {
  constructor() {
    this.isActive = false;
    this.currentUser = null;
    this.currentClan = null;
    this.clanRoom = null;
      this.createOverlay = null;  // ✅ Ajouter cette ligne

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
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/clan/my', {
      //   headers: { Authorization: `Bearer ${userToken}` }
      // });
      
      // Simulate API call
      setTimeout(() => {
        const hasClan = Math.random() > 0.7; // 30% chance of having clan
        
        if (hasClan) {
          // Simulate clan data
          this.currentClan = {
            clanId: 'test_clan_123',
            name: 'Epic Warriors',
            tag: '#ABC123XY',
            description: 'Best clan ever! Join us for epic battles!',
            badge: 'crown',
            memberCount: 28,
            maxMembers: 50,
            trophies: 45000,
            myRole: 'member',
            stats: {
              totalDonations: 15000,
              warWins: 45,
              warLosses: 12
            }
          };
          
          this.setState('has_clan');
        } else {
          this.setState('no_clan');
        }
      }, 1500);
      
    } catch (error) {
      console.error('❌ Failed to check clan status:', error);
      this.setState('no_clan');
    }
  }

  handleClanCreated(clanData) {
  console.log('🏰 Clan created:', clanData);
  
  // Simulate joining the newly created clan
  this.currentClan = {
    clanId: 'new_clan_' + Date.now(),
    name: clanData.name,
    tag: '#NEWCLAN',
    description: clanData.description,
    badge: clanData.badge,
    memberCount: 1,
    maxMembers: 50,
    trophies: 0,
    myRole: 'leader',
    stats: {
      totalDonations: 0,
      warWins: 0,
      warLosses: 0
    }
  };
  
  this.setState('has_clan');
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
        <!-- Header -->
        <div class="no-clan-header">
          <div class="clan-icon">🏰</div>
          <h2>Join a Clan!</h2>
          <p>Team up with other players, share cards, and participate in Clan Wars!</p>
        </div>

        <!-- Benefits -->
        <div class="clan-benefits">
          <div class="benefit-item">
            <span class="benefit-icon">🃏</span>
            <span class="benefit-text">Request & donate cards</span>
          </div>
          <div class="benefit-item">
            <span class="benefit-icon">⚔️</span>
            <span class="benefit-text">Participate in Clan Wars</span>
          </div>
          <div class="benefit-item">
            <span class="benefit-icon">💬</span>
            <span class="benefit-text">Chat with clan members</span>
          </div>
          <div class="benefit-item">
            <span class="benefit-icon">🏆</span>
            <span class="benefit-text">Climb the leaderboards</span>
          </div>
        </div>

        <!-- Actions -->
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

        <!-- Quick stats -->
        <div class="clan-quick-stats">
          <div class="quick-stat">
            <div class="stat-number">10,000+</div>
            <div class="stat-label">Active Clans</div>
          </div>
          <div class="quick-stat">
            <div class="stat-number">500K+</div>
            <div class="stat-label">Members</div>
          </div>
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
        <!-- Clan Header -->
        <div class="clan-header">
          <div class="clan-badge">
            <div class="clan-badge-icon">👑</div>
          </div>
          <div class="clan-info">
            <div class="clan-name">${this.currentClan.name}</div>
            <div class="clan-tag">${this.currentClan.tag}</div>
            <div class="clan-members">${this.currentClan.memberCount}/${this.currentClan.maxMembers} members</div>
          </div>
          <div class="clan-actions-header">
            <button class="clan-header-btn" id="btn-clan-info">ℹ️</button>
            <button class="clan-header-btn" id="btn-clan-settings">⚙️</button>
            <button class="clan-header-btn danger" id="btn-leave-clan">🚪</button>
          </div>
        </div>

        <!-- Tab Navigation (Clan internal) -->
        <div class="clan-tabs">
          <button class="clan-tab-btn active" data-clan-tab="chat">💬 Chat</button>
          <button class="clan-tab-btn" data-clan-tab="members">👥 Members</button>
          <button class="clan-tab-btn" data-clan-tab="wars">⚔️ Wars</button>
        </div>

        <!-- Tab Content -->
        <div class="clan-content">
          <!-- Chat Tab -->
          <div class="clan-tab-content active" id="clan-tab-chat">
            <div class="clan-chat">
              <div class="chat-messages" id="clan-chat-messages">
                <!-- Messages will be populated here -->
              </div>
              <div class="chat-input-container">
                <input type="text" class="chat-input" id="clan-chat-input" placeholder="Type your message..." maxlength="200">
                <button class="chat-send-btn" id="btn-send-message">➤</button>
              </div>
            </div>
          </div>

          <!-- Members Tab -->
          <div class="clan-tab-content" id="clan-tab-members">
            <div class="clan-members">
              <div class="members-header">
                <div class="members-count">${this.currentClan.memberCount} Members</div>
                <div class="members-controls">
                  <button class="members-btn" id="btn-invite-member">➕</button>
                  <button class="members-btn" id="btn-member-search">🔍</button>
                </div>
              </div>
              <div class="members-list" id="clan-members-list">
                <!-- Members will be populated here -->
              </div>
            </div>
          </div>

          <!-- Wars Tab -->
          <div class="clan-tab-content" id="clan-tab-wars">
            <div class="clan-wars">
              <div class="war-status">
                <div class="war-icon">⚔️</div>
                <h3>Clan Wars</h3>
                <p>Coming Soon!</p>
              </div>
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
        <button class="retry-btn" onclick="this.checkClanStatus()">🔄 Retry</button>
      </div>
    `;
  }

  /**
   * Setup events for no clan state
   */
  setupNoClanEvents() {
    // Create clan
    const createBtn = this.tabElement.querySelector('#btn-create-clan');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        this.showCreateClanOverlay();
      });
    }

    // Join by tag
    const joinBtn = this.tabElement.querySelector('#btn-join-by-tag');
    if (joinBtn) {
      joinBtn.addEventListener('click', () => {
        this.showJoinByTagOverlay();
      });
    }

    // Search clans
    const searchBtn = this.tabElement.querySelector('#btn-search-clans');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.showSearchClansOverlay();
      });
    }
  }

  /**
   * Setup events for clan interface
   */
  setupClanInterfaceEvents() {
    // Clan tab navigation
    const tabBtns = this.tabElement.querySelectorAll('.clan-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.dataset.clanTab;
        this.switchClanTab(tabName);
      });
    });

    // Header actions
    const infoBtn = this.tabElement.querySelector('#btn-clan-info');
    if (infoBtn) {
      infoBtn.addEventListener('click', () => this.showClanInfo());
    }

    const settingsBtn = this.tabElement.querySelector('#btn-clan-settings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.showClanSettings());
    }

    const leaveBtn = this.tabElement.querySelector('#btn-leave-clan');
    if (leaveBtn) {
      leaveBtn.addEventListener('click', () => this.showLeaveClanConfirm());
    }

    // Chat input
    const chatInput = this.tabElement.querySelector('#clan-chat-input');
    const sendBtn = this.tabElement.querySelector('#btn-send-message');
    
    if (chatInput && sendBtn) {
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendChatMessage();
        }
      });
      
      sendBtn.addEventListener('click', () => {
        this.sendChatMessage();
      });
    }

    // Members actions
    const inviteBtn = this.tabElement.querySelector('#btn-invite-member');
    if (inviteBtn) {
      inviteBtn.addEventListener('click', () => this.showInviteMember());
    }
  }

  /**
   * Switch clan internal tab
   */
  switchClanTab(tabName) {
    // Update tab buttons
    const tabBtns = this.tabElement.querySelectorAll('.clan-tab-btn');
    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.clanTab === tabName);
    });

    // Update content
    const contents = this.tabElement.querySelectorAll('.clan-tab-content');
    contents.forEach(content => {
      content.classList.toggle('active', content.id === `clan-tab-${tabName}`);
    });

    console.log(`🏰 Switched to clan tab: ${tabName}`);
  }

  /**
   * Populate chat messages
   */
  populateChatMessages() {
    const messagesContainer = this.tabElement.querySelector('#clan-chat-messages');
    if (!messagesContainer) return;

    // Simulate some messages
    const sampleMessages = [
      {
        id: '1',
        author: 'KingPlayer',
        role: 'leader',
        content: 'Welcome to the clan everyone! 🎉',
        timestamp: Date.now() - 3600000,
        type: 'text'
      },
      {
        id: '2',
        author: 'CardMaster',
        role: 'elder',
        content: 'Anyone have spare Wizards?',
        timestamp: Date.now() - 1800000,
        type: 'text'
      },
      {
        id: '3',
        author: 'BattleHero',
        role: 'member',
        content: 'Great war yesterday! 💪',
        timestamp: Date.now() - 900000,
        type: 'text'
      }
    ];

    messagesContainer.innerHTML = sampleMessages.map(msg => `
      <div class="chat-message">
        <div class="message-header">
          <span class="message-author ${msg.role}">${msg.author}</span>
          <span class="message-role">(${msg.role})</span>
          <span class="message-time">${this.formatTime(msg.timestamp)}</span>
        </div>
        <div class="message-content">${msg.content}</div>
      </div>
    `).join('');

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Populate members list
   */
  populateMembers() {
    const membersContainer = this.tabElement.querySelector('#clan-members-list');
    if (!membersContainer) return;

    // Simulate members
    const sampleMembers = [
      { username: 'KingPlayer', role: 'leader', trophies: 5000, donationsGiven: 500, isOnline: true },
      { username: 'CardMaster', role: 'elder', trophies: 4500, donationsGiven: 300, isOnline: true },
      { username: 'BattleHero', role: 'elder', trophies: 4200, donationsGiven: 250, isOnline: false },
      { username: 'WarriorX', role: 'member', trophies: 3800, donationsGiven: 150, isOnline: true },
      { username: 'CardSlayer', role: 'member', trophies: 3500, donationsGiven: 200, isOnline: false }
    ];

    membersContainer.innerHTML = sampleMembers.map(member => `
      <div class="member-item ${member.isOnline ? 'online' : 'offline'}">
        <div class="member-avatar">
          <div class="member-status ${member.isOnline ? 'online' : 'offline'}"></div>
        </div>
        <div class="member-info">
          <div class="member-name">${member.username}</div>
          <div class="member-stats">
            <span class="member-trophies">🏆 ${member.trophies}</span>
            <span class="member-donations">🎁 ${member.donationsGiven}</span>
          </div>
        </div>
        <div class="member-role ${member.role}">${member.role}</div>
        <div class="member-actions">
          <button class="member-action-btn" data-action="profile" data-member="${member.username}">👤</button>
          ${this.canManageMember(member.role) ? `
            <button class="member-action-btn" data-action="promote" data-member="${member.username}">⬆️</button>
            <button class="member-action-btn danger" data-action="kick" data-member="${member.username}">❌</button>
          ` : ''}
        </div>
      </div>
    `).join('');

    // Setup member action events
    const actionBtns = membersContainer.querySelectorAll('.member-action-btn');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const member = btn.dataset.member;
        this.handleMemberAction(action, member);
      });
    });
  }

  /**
   * Check if current user can manage a member
   */
  canManageMember(targetRole) {
    if (!this.currentClan || !this.currentClan.myRole) return false;
    
    const roleHierarchy = { leader: 3, elder: 2, member: 1 };
    const myLevel = roleHierarchy[this.currentClan.myRole] || 0;
    const targetLevel = roleHierarchy[targetRole] || 0;
    
    return myLevel > targetLevel;
  }

  /**
   * Handle member actions
   */
  handleMemberAction(action, memberName) {
    switch (action) {
      case 'profile':
        this.showMemberProfile(memberName);
        break;
      case 'promote':
        this.promoteMember(memberName);
        break;
      case 'kick':
        this.kickMember(memberName);
        break;
    }
  }

  /**
   * Send chat message
   */
  sendChatMessage() {
    const input = this.tabElement.querySelector('#clan-chat-input');
    if (!input || !input.value.trim()) return;

    const message = input.value.trim();
    
    // TODO: Send to ClanRoom via Colyseus
    console.log('🏰 Sending message:', message);
    
    // For now, add to local chat
    this.addChatMessage({
      author: this.currentUser?.displayName || 'You',
      role: this.currentClan?.myRole || 'member',
      content: message,
      timestamp: Date.now(),
      type: 'text'
    });
    
    input.value = '';
  }

  /**
   * Add message to chat
   */
  addChatMessage(message) {
    const messagesContainer = this.tabElement.querySelector('#clan-chat-messages');
    if (!messagesContainer) return;

    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message';
    messageEl.innerHTML = `
      <div class="message-header">
        <span class="message-author ${message.role}">${message.author}</span>
        <span class="message-role">(${message.role})</span>
        <span class="message-time">${this.formatTime(message.timestamp)}</span>
      </div>
      <div class="message-content">${message.content}</div>
    `;

    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
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

  /**
   * Show overlay methods (placeholder)
   */
showCreateClanOverlay() {
  if (this.createOverlay) {
    this.createOverlay.open();
  }
}

  showJoinByTagOverlay() {
    console.log('🏰 Show join by tag overlay');
    // TODO: Implement overlay
  }

  showSearchClansOverlay() {
    console.log('🏰 Show search clans overlay');
    // TODO: Implement overlay
  }

  showClanInfo() {
    console.log('🏰 Show clan info');
    // TODO: Implement clan info modal
  }

  showClanSettings() {
    console.log('🏰 Show clan settings');
    // TODO: Implement settings (if user has permissions)
  }

  showLeaveClanConfirm() {
    console.log('🏰 Show leave clan confirmation');
    // TODO: Implement confirmation modal
  }

  showInviteMember() {
    console.log('🏰 Show invite member');
    // TODO: Implement invite system
  }

  showMemberProfile(memberName) {
    console.log('🏰 Show member profile:', memberName);
    // TODO: Implement member profile
  }

  promoteMember(memberName) {
    console.log('🏰 Promote member:', memberName);
    // TODO: Implement promotion
  }

  kickMember(memberName) {
    console.log('🏰 Kick member:', memberName);
    // TODO: Implement kick with confirmation
  }

  /**
   * Update player data
   */
  updatePlayerData(userData) {
    if (!userData) return;
    this.currentUser = userData;
    
    // Re-render if needed
    if (this.isActive) {
      // Update any user-specific content
    }
  }

  /**
   * Show/hide tab
   */
  show() {
    if (this.tabElement) {
      this.tabElement.classList.add('active');
    }
    this.isActive = true;
    
    // Connect to clan room if has clan
    if (this.state === 'has_clan' && this.currentClan) {
      this.connectToClanRoom();
    }
    
    console.log('🏰 Clan tab shown');
  }

  hide() {
    if (this.tabElement) {
      this.tabElement.classList.remove('active');
    }
    this.isActive = false;
    
    // Disconnect from clan room
    this.disconnectFromClanRoom();
    
    console.log('🏰 Clan tab hidden');
  }

  /**
   * Connect to Colyseus ClanRoom
   */
  async connectToClanRoom() {
    if (!this.currentClan) return;

    try {
      console.log('🏰 Connecting to ClanRoom...');
      
      // TODO: Connect to Colyseus ClanRoom
      // this.clanRoom = await colyseusClient.joinById(this.currentClan.roomId, {
      //   auth: { userId: this.currentUser.id, clanId: this.currentClan.clanId }
      // });
      
      // Setup room event listeners
      // this.setupClanRoomEvents();
      
    } catch (error) {
      console.error('❌ Failed to connect to ClanRoom:', error);
    }
  }

  /**
   * Disconnect from ClanRoom
   */
  disconnectFromClanRoom() {
    if (this.clanRoom) {
      this.clanRoom.leave();
      this.clanRoom = null;
      console.log('🏰 Disconnected from ClanRoom');
    }
  }

  /**
   * Event system
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ClanTab event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Activate/deactivate methods
   */
  activate() {
    this.show();
  }

  deactivate() {
    this.hide();
  }

  /**
   * Cleanup
   */
  async cleanup() {
    console.log('🧹 Cleaning up ClanTab...');
    
    this.disconnectFromClanRoom();
    this.eventListeners.clear();
    
    if (this.tabElement && this.tabElement.parentNode) {
      this.tabElement.parentNode.removeChild(this.tabElement);
    }
      if (this.createOverlay) {  // ✅ Ajouter
    this.createOverlay.cleanup();
  }
    this.tabElement = null;
    this.container = null;
    this.currentUser = null;
    this.currentClan = null;
    
    console.log('✅ ClanTab cleaned up');
  }
}

export default ClanTab;
