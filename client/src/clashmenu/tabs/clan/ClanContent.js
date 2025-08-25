/**
 * ClanContent.js - Interface principale complète quand le joueur est dans un clan
 * Gestion complète du chat, membres, donations et wars
 */
import ClanRoomClient from '../../../services/ClanRoomClient.js';

class ClanContent {
  constructor(container, currentUser, clan) {
    this.container = container;
    this.currentUser = currentUser;
    this.clan = clan;
    
    // States
    this.currentTab = 'chat';
    this.chatMessages = [];
    this.members = [];
    this.donations = [];
    this.wars = [];
    
    // Flags
    this.isConnected = false;
    this.lastMessageTime = 0;
    
    console.log('✨ ClanContent initialized with clan:', clan);
  }

  async render() {
    this.container.innerHTML = `
      <div class="clan-interface">
        <!-- Header -->
        <div class="clan-header">
          <div class="clan-badge">
            <span class="clan-badge-icon">${this.getClanBadgeIcon()}</span>
          </div>
          <div class="clan-info">
            <div class="clan-name">${this.clan.name || 'Unknown Clan'}</div>
            <div class="clan-tag">${this.clan.tag || '#UNKNOWN'}</div>
            <div class="clan-members">${this.clan.memberCount || 1}/${this.clan.maxMembers || 50} members</div>
          </div>
          <div class="clan-actions">
            <button class="clan-action-btn secondary" id="btn-clan-settings" title="Clan Settings">⚙️</button>
            <button class="clan-action-btn danger" id="btn-leave-clan" title="Leave Clan">🚪</button>
          </div>
        </div>

        <!-- Tabs -->
        <div class="clan-tabs">
          <button class="clan-tab-btn active" data-tab="chat">💬 Chat</button>
          <button class="clan-tab-btn" data-tab="members">👥 Members</button>
          <button class="clan-tab-btn" data-tab="donations">🎁 Donations</button>
          <button class="clan-tab-btn" data-tab="wars">⚔️ Wars</button>
        </div>

        <!-- Content -->
        <div class="clan-content">
          <!-- Chat Tab -->
          <div class="clan-tab-content active" id="clan-tab-chat">
            <div class="clan-chat">
              <div class="chat-messages" id="clan-chat-messages">
                <div class="chat-welcome">
                  <div class="welcome-message">
                    <h3>🏰 Welcome to ${this.clan.name}!</h3>
                    <p>Chat with your clan mates and coordinate your strategies.</p>
                  </div>
                </div>
              </div>
              <div class="chat-input-container">
                <input id="clan-chat-input" class="chat-input" placeholder="Type a message..." maxlength="200" />
                <button id="btn-send-message" class="chat-send-btn" title="Send message">➤</button>
              </div>
            </div>
          </div>

          <!-- Members Tab -->
          <div class="clan-tab-content" id="clan-tab-members">
            <div class="clan-members">
              <div class="members-header">
                <span class="members-count">Loading members...</span>
                <div class="members-actions">
                  <button class="clan-action-btn secondary small" id="btn-invite-member" title="Invite Member">➕</button>
                  <button class="clan-action-btn secondary small" id="btn-refresh-members" title="Refresh">🔄</button>
                </div>
              </div>
              <div class="members-list" id="clan-members-list">
                <div class="loading-members">
                  <div class="loading-spinner"></div>
                  <p>Loading clan members...</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Donations Tab -->
          <div class="clan-tab-content" id="clan-tab-donations">
            <div class="clan-donations">
              <div class="donation-header">
                <span>Card Donations</span>
                <div class="donation-actions">
                  <button class="donation-btn request" id="btn-request-card">Request Cards</button>
                  <button class="clan-action-btn secondary small" id="btn-donation-history">📊 History</button>
                </div>
              </div>
              <div class="donation-stats" id="donation-stats">
                <div class="donation-stat">
                  <span class="stat-value">0</span>
                  <span class="stat-label">Given Today</span>
                </div>
                <div class="donation-stat">
                  <span class="stat-value">0</span>
                  <span class="stat-label">Received Today</span>
                </div>
                <div class="donation-stat">
                  <span class="stat-value">0</span>
                  <span class="stat-label">Total XP</span>
                </div>
              </div>
              <div class="donation-list" id="donation-list">
                <div class="no-donations">
                  <div class="no-donations-icon">🎁</div>
                  <h3>No Active Requests</h3>
                  <p>Be the first to request cards from your clan mates!</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Wars Tab -->
          <div class="clan-tab-content" id="clan-tab-wars">
            <div class="clan-wars">
              <div class="war-status" id="war-status">
                <div class="war-icon">⚔️</div>
                <h3>Clan Wars</h3>
                <p>Prepare for epic battles with other clans!</p>
                <div class="war-actions">
                  <button class="clan-action-btn primary" id="btn-start-war" disabled>Coming Soon</button>
                  <button class="clan-action-btn secondary" id="btn-war-history">📜 History</button>
                </div>
              </div>
              <div class="war-info">
                <div class="war-stat">
                  <span class="stat-value">0</span>
                  <span class="stat-label">Wars Won</span>
                </div>
                <div class="war-stat">
                  <span class="stat-value">0</span>
                  <span class="stat-label">Wars Lost</span>
                </div>
                <div class="war-stat">
                  <span class="stat-value">0%</span>
                  <span class="stat-label">Win Rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Request Card Modal -->
      <div class="modal-overlay" id="request-card-modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Request Cards</h3>
            <button class="modal-close" id="close-request-modal">✕</button>
          </div>
          <div class="modal-body">
            <div class="card-selector">
              <div class="selected-card" id="selected-card">
                <div class="card-placeholder">Select a card</div>
              </div>
              <div class="card-grid" id="card-grid">
                <!-- Cards will be populated here -->
              </div>
            </div>
            <div class="amount-selector">
              <label>Amount to request:</label>
              <input type="number" id="request-amount" min="1" max="10" value="1" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="clan-action-btn secondary" id="cancel-request">Cancel</button>
            <button class="clan-action-btn primary" id="confirm-request">Request Cards</button>
          </div>
        </div>
      </div>
    `;

    this.setupEvents();
    await this.connectToClan();
    this.loadInitialData();
  }

  setupEvents() {
    // Tab switching
    this.container.querySelectorAll('.clan-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Header actions
    const settingsBtn = this.container.querySelector('#btn-clan-settings');
    const leaveBtn = this.container.querySelector('#btn-leave-clan');
    
    settingsBtn?.addEventListener('click', () => this.openClanSettings());
    leaveBtn?.addEventListener('click', () => this.confirmLeaveClan());

    // Chat events
    const chatInput = this.container.querySelector('#clan-chat-input');
    const sendBtn = this.container.querySelector('#btn-send-message');
    
    sendBtn?.addEventListener('click', () => this.sendChatMessage());
    chatInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendChatMessage();
      }
    });

    // Member events
    const inviteBtn = this.container.querySelector('#btn-invite-member');
    const refreshBtn = this.container.querySelector('#btn-refresh-members');
    
    inviteBtn?.addEventListener('click', () => this.inviteMember());
    refreshBtn?.addEventListener('click', () => this.refreshMembers());

    // Donation events
    const requestBtn = this.container.querySelector('#btn-request-card');
    const historyBtn = this.container.querySelector('#btn-donation-history');
    
    requestBtn?.addEventListener('click', () => this.openRequestModal());
    historyBtn?.addEventListener('click', () => this.showDonationHistory());

    // War events
    const startWarBtn = this.container.querySelector('#btn-start-war');
    const warHistoryBtn = this.container.querySelector('#btn-war-history');
    
    startWarBtn?.addEventListener('click', () => this.startWar());
    warHistoryBtn?.addEventListener('click', () => this.showWarHistory());

    // Modal events
    this.setupModalEvents();

    // Colyseus events
    this.setupColyseusEvents();
  }

  setupModalEvents() {
    const modal = this.container.querySelector('#request-card-modal');
    const closeBtn = this.container.querySelector('#close-request-modal');
    const cancelBtn = this.container.querySelector('#cancel-request');
    const confirmBtn = this.container.querySelector('#confirm-request');

    closeBtn?.addEventListener('click', () => this.closeRequestModal());
    cancelBtn?.addEventListener('click', () => this.closeRequestModal());
    confirmBtn?.addEventListener('click', () => this.confirmCardRequest());

    // Close modal on backdrop click
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) this.closeRequestModal();
    });
  }

  setupColyseusEvents() {
    // Chat messages
    ClanRoomClient.on('chat:message', (msg) => {
      this.chatMessages.push(msg);
      this.addChatMessage(msg);
      this.playNotificationSound();
    });

    // Member updates
    ClanRoomClient.on('member:online', (data) => this.updateMemberStatus(data.userId, true));
    ClanRoomClient.on('member:offline', (data) => this.updateMemberStatus(data.userId, false));
    ClanRoomClient.on('member:list', (members) => this.updateMembersList(members));
    ClanRoomClient.on('member:promoted', (data) => this.handleMemberPromotion(data));
    ClanRoomClient.on('member:demoted', (data) => this.handleMemberDemotion(data));
    ClanRoomClient.on('member:kicked', (data) => this.handleMemberKick(data));

    // Donations
    ClanRoomClient.on('donation:request', (req) => this.addDonationRequest(req));
    ClanRoomClient.on('donation:request:sent', (req) => this.handleDonationRequestSent(req));
    ClanRoomClient.on('donation:given', (data) => this.handleDonationGiven(data));
    ClanRoomClient.on('donation:sent', (data) => this.handleDonationSent(data));

    // System events
    ClanRoomClient.on('system:error', (error) => this.handleSystemError(error));
    ClanRoomClient.on('system:sync', (data) => this.handleSystemSync(data));
  }

  async connectToClan() {
    try {
      console.log('🔄 Connecting to clan room...');
const result = await ClanRoomClient.connect(
  this.currentUser.id,
  this.clan.clanId || this.clan._id || this.clan.id
);
      
      if (result.success) {
        this.isConnected = true;
        console.log('✅ Connected to clan room successfully');
        this.showConnectionStatus(true);
        
        // Demander les données initiales après connexion
        setTimeout(() => {
          this.loadInitialData();
        }, 1000);
        
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Failed to connect to clan:', error);
      this.isConnected = false;
      this.showConnectionStatus(false);
      
      // Afficher une erreur plus détaillée selon le type d'erreur
      let errorMessage = 'Failed to connect to clan.';
      
      if (error.message?.includes('not properly initialized')) {
        errorMessage = 'Server connection not available. Please try again later.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Connection timeout. Please check your internet connection.';
      } else if (error.message?.includes('unauthorized')) {
        errorMessage = 'Not authorized to join this clan.';
      }
      
      this.showError(errorMessage);
      
      // Proposer une reconnexion après 5 secondes
      setTimeout(() => {
        if (!this.isConnected) {
          this.showReconnectOption();
        }
      }, 5000);
    }
  }

  showReconnectOption() {
    const header = this.container.querySelector('.clan-header');
    if (header && !header.querySelector('.reconnect-banner')) {
      const banner = document.createElement('div');
      banner.className = 'reconnect-banner';
      banner.innerHTML = `
        <div class="reconnect-content">
          <span>🔌 Connection lost</span>
          <button class="reconnect-btn">Reconnect</button>
        </div>
      `;
      
      header.appendChild(banner);
      
      // Bind reconnect button
      banner.querySelector('.reconnect-btn').addEventListener('click', () => {
        banner.remove();
        this.connectToClan();
      });
    }
  }

  loadInitialData() {
    // Request initial data from server
    if (this.isConnected) {
      ClanRoomClient.requestMemberList();
      ClanRoomClient.refreshData();
    }
    
    // Load cached data if available
    this.loadChatHistory();
    this.loadDonationStats();
  }

  // === TAB SWITCHING ===
  switchTab(tabName) {
    // Update active states
    this.container.querySelectorAll('.clan-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    this.container.querySelectorAll('.clan-tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `clan-tab-${tabName}`);
    });

    this.currentTab = tabName;

    // Load tab-specific data
    switch (tabName) {
      case 'members':
        this.refreshMembers();
        break;
      case 'donations':
        this.refreshDonations();
        break;
      case 'wars':
        this.refreshWars();
        break;
    }

    console.log(`📋 Switched to ${tabName} tab`);
  }

  // === CHAT FUNCTIONS ===
  sendChatMessage() {
    const input = this.container.querySelector('#clan-chat-input');
    if (!input || !input.value.trim()) return;

    const content = input.value.trim();
    if (content.length > 200) {
      this.showError('Message is too long (max 200 characters)');
      return;
    }

    // Rate limiting
    const now = Date.now();
    if (now - this.lastMessageTime < 1000) {
      this.showError('Please wait before sending another message');
      return;
    }

    if (this.isConnected) {
      ClanRoomClient.sendChat(content);
      input.value = '';
      this.lastMessageTime = now;
    } else {
      this.showError('Not connected to clan chat');
    }
  }

  addChatMessage(msg) {
    const container = this.container.querySelector('#clan-chat-messages');
    if (!container) return;

    // Remove welcome message if present
    const welcome = container.querySelector('.chat-welcome');
    if (welcome) welcome.remove();

    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message';
    messageEl.innerHTML = `
      <div class="message-header">
        <span class="message-author ${msg.authorRole || 'member'}">${this.escapeHtml(msg.authorUsername)}</span>
        <span class="message-time">${this.formatTime(msg.timestamp)}</span>
      </div>
      <div class="message-content">${this.escapeHtml(msg.content)}</div>
    `;

    container.appendChild(messageEl);
    this.scrollToBottom(container);

    // Keep only last 100 messages
    const messages = container.querySelectorAll('.chat-message');
    if (messages.length > 100) {
      messages[0].remove();
    }
  }

  loadChatHistory() {
    // Load from localStorage or request from server
    const history = localStorage.getItem(`clan_chat_${this.clan.id}`);
    if (history) {
      try {
        const messages = JSON.parse(history);
        messages.forEach(msg => this.addChatMessage(msg));
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    }
  }

  // === MEMBER FUNCTIONS ===
  refreshMembers() {
    if (this.isConnected) {
      ClanRoomClient.requestMemberList();
    }
  }

  updateMembersList(members) {
    this.members = members;
    const container = this.container.querySelector('#clan-members-list');
    const countEl = this.container.querySelector('.members-count');
    
    if (!container) return;

    // Update count
    if (countEl) {
      countEl.textContent = `${members.length} Members`;
    }

    // Sort members by role and status
    const sortedMembers = [...members].sort((a, b) => {
      const roleOrder = { leader: 4, 'co-leader': 3, elder: 2, member: 1 };
      const roleA = roleOrder[a.role] || 1;
      const roleB = roleOrder[b.role] || 1;
      
      if (roleA !== roleB) return roleB - roleA;
      if (a.isOnline !== b.isOnline) return b.isOnline - a.isOnline;
      return b.trophies - a.trophies;
    });

    container.innerHTML = sortedMembers.map(member => `
      <div class="member-item ${member.isOnline ? 'online' : 'offline'}">
        <div class="member-avatar"></div>
        <div class="member-info">
          <div class="member-name">${this.escapeHtml(member.displayName || member.username)}</div>
          <div class="member-stats">
            <span class="member-trophies">🏆 ${this.formatNumber(member.trophies || 0)}</span>
            <span class="member-donations">🎁 ${member.donationsGiven || 0}</span>
            <span class="member-status ${member.isOnline ? 'online' : 'offline'}">
              ${member.isOnline ? '🟢 Online' : '🔴 Offline'}
            </span>
          </div>
        </div>
        <div class="member-role ${member.role}">${this.formatRole(member.role)}</div>
        ${this.canManageMember(member) ? this.renderMemberActions(member) : ''}
      </div>
    `).join('');

    // Bind action buttons
    this.bindMemberActions();
  }

  renderMemberActions(member) {
    const canPromote = this.canPromoteMember(member);
    const canDemote = this.canDemoteMember(member);
    const canKick = this.canKickMember(member);

    return `
      <div class="member-actions">
        ${canPromote ? `<button class="member-action-btn btn-promote" data-id="${member.userId}" title="Promote">⬆️</button>` : ''}
        ${canDemote ? `<button class="member-action-btn btn-demote" data-id="${member.userId}" title="Demote">⬇️</button>` : ''}
        ${canKick ? `<button class="member-action-btn btn-kick" data-id="${member.userId}" title="Kick">❌</button>` : ''}
      </div>
    `;
  }

  bindMemberActions() {
    // Promote buttons
    this.container.querySelectorAll('.btn-promote').forEach(btn => {
      btn.addEventListener('click', () => this.promoteMember(btn.dataset.id));
    });

    // Demote buttons
    this.container.querySelectorAll('.btn-demote').forEach(btn => {
      btn.addEventListener('click', () => this.demoteMember(btn.dataset.id));
    });

    // Kick buttons
    this.container.querySelectorAll('.btn-kick').forEach(btn => {
      btn.addEventListener('click', () => this.kickMember(btn.dataset.id));
    });
  }

  canManageMember(member) {
    if (member.userId === this.currentUser.id) return false;
    
    const myRole = this.currentUser.clanRole || 'member';
    const hierarchy = ['member', 'elder', 'co-leader', 'leader'];
    const myLevel = hierarchy.indexOf(myRole);
    const memberLevel = hierarchy.indexOf(member.role);
    
    return myLevel > memberLevel;
  }

  canPromoteMember(member) {
    const myRole = this.currentUser.clanRole || 'member';
    return this.canManageMember(member) && myRole !== 'elder' && member.role !== 'co-leader';
  }

  canDemoteMember(member) {
    return this.canManageMember(member) && member.role !== 'member';
  }

  canKickMember(member) {
    return this.canManageMember(member);
  }

  // === DONATION FUNCTIONS ===
  refreshDonations() {
    // Request donation data
    this.loadDonationStats();
  }

  openRequestModal() {
    const modal = this.container.querySelector('#request-card-modal');
    if (modal) {
      modal.style.display = 'flex';
      this.populateCardGrid();
    }
  }

  closeRequestModal() {
    const modal = this.container.querySelector('#request-card-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  populateCardGrid() {
    const grid = this.container.querySelector('#card-grid');
    if (!grid) return;

    // Sample cards - in a real app, this would come from the user's collection
    const availableCards = [
      { id: 'archer', name: 'Archers', rarity: 'common' },
      { id: 'knight', name: 'Knight', rarity: 'common' },
      { id: 'giant', name: 'Giant', rarity: 'rare' },
      { id: 'wizard', name: 'Wizard', rarity: 'rare' },
      { id: 'dragon', name: 'Baby Dragon', rarity: 'epic' },
      { id: 'prince', name: 'Prince', rarity: 'epic' }
    ];

    grid.innerHTML = availableCards.map(card => `
      <div class="card-option ${card.rarity}" data-card="${card.id}">
        <div class="card-icon">${this.getCardIcon(card.id)}</div>
        <div class="card-name">${card.name}</div>
      </div>
    `).join('');

    // Bind card selection
    grid.querySelectorAll('.card-option').forEach(option => {
      option.addEventListener('click', () => this.selectCard(option.dataset.card));
    });
  }

  selectCard(cardId) {
    const selectedEl = this.container.querySelector('#selected-card');
    const grid = this.container.querySelector('#card-grid');
    
    if (selectedEl && grid) {
      // Update selected card display
      const cardOption = grid.querySelector(`[data-card="${cardId}"]`);
      if (cardOption) {
        selectedEl.innerHTML = cardOption.innerHTML;
        selectedEl.dataset.selected = cardId;
      }

      // Update active states
      grid.querySelectorAll('.card-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.card === cardId);
      });
    }
  }

  confirmCardRequest() {
    const selectedEl = this.container.querySelector('#selected-card');
    const amountInput = this.container.querySelector('#request-amount');
    
    const cardId = selectedEl?.dataset.selected;
    const amount = parseInt(amountInput?.value) || 1;

    if (!cardId) {
      this.showError('Please select a card first');
      return;
    }

    if (amount < 1 || amount > 10) {
      this.showError('Amount must be between 1 and 10');
      return;
    }

    if (this.isConnected) {
      ClanRoomClient.requestCards(cardId, amount);
      this.closeRequestModal();
      this.showSuccess(`Requested ${amount} ${cardId} card(s)`);
    } else {
      this.showError('Not connected to clan');
    }
  }

  addDonationRequest(req) {
    const container = this.container.querySelector('#donation-list');
    if (!container) return;

    // Remove "no donations" message
    const noDonatiosEl = container.querySelector('.no-donations');
    if (noDonatiosEl) noDonatiosEl.remove();

    const requestEl = document.createElement('div');
    requestEl.className = 'donation-item';
    requestEl.id = `donation-${req.messageId}`;
    requestEl.innerHTML = `
      <div class="donation-info">
        <div class="donation-requester">${this.escapeHtml(req.requesterUsername)}</div>
        <div class="donation-card">
          ${this.getCardIcon(req.cardId)} ${req.cardId} (${req.amount})
        </div>
        <div class="donation-time">${this.formatTime(req.timestamp)}</div>
      </div>
      <div class="donation-actions">
        <button class="donation-btn give" data-id="${req.messageId}">
          Donate ${req.amount}
        </button>
      </div>
    `;

    container.appendChild(requestEl);

    // Bind donate button
    const donateBtn = requestEl.querySelector('.donation-btn.give');
    donateBtn?.addEventListener('click', () => this.donateCards(req.messageId, req.amount));
  }

  donateCards(messageId, amount) {
    if (this.isConnected) {
      ClanRoomClient.donateCards(messageId, amount);
    } else {
      this.showError('Not connected to clan');
    }
  }

  loadDonationStats() {
    const statsEl = this.container.querySelector('#donation-stats');
    if (statsEl) {
      // In a real app, this would come from the server
      const stats = {
        givenToday: 5,
        receivedToday: 3,
        totalXP: 1250
      };

      statsEl.querySelector('.stat-value').textContent = stats.givenToday;
      statsEl.querySelectorAll('.stat-value')[1].textContent = stats.receivedToday;
      statsEl.querySelectorAll('.stat-value')[2].textContent = stats.totalXP;
    }
  }

  // === EVENT HANDLERS ===
  handleMemberPromotion(data) {
    const member = this.members.find(m => m.userId === data.targetUserId);
    if (member) {
      member.role = data.newRole;
      this.updateMembersList(this.members);
    }
    this.showInfo(`${data.targetUsername} was promoted to ${data.newRole}`);
  }

  handleMemberDemotion(data) {
    const member = this.members.find(m => m.userId === data.targetUserId);
    if (member) {
      member.role = data.newRole;
      this.updateMembersList(this.members);
    }
    this.showInfo(`${data.targetUsername} was demoted to ${data.newRole}`);
  }

  handleMemberKick(data) {
    this.members = this.members.filter(m => m.userId !== data.targetUserId);
    this.updateMembersList(this.members);
    this.showInfo(`${data.targetUsername} was kicked from the clan`);
  }

  handleDonationGiven(data) {
    const donationEl = this.container.querySelector(`#donation-${data.messageId}`);
    if (donationEl) {
      donationEl.remove();
    }
    this.showSuccess(`Cards donated! +${data.xpGained} XP`);
    this.loadDonationStats();
  }

  handleSystemError(error) {
    console.error('Clan system error:', error);
    this.showError(error.message || 'A system error occurred');
  }

  // === UTILITY FUNCTIONS ===
  getClanBadgeIcon() {
    const badges = {
      crown: '👑',
      sword: '⚔️',
      shield: '🛡️',
      star: '⭐',
      fire: '🔥',
      lightning: '⚡',
      dragon: '🐉',
      castle: '🏰'
    };
    return badges[this.clan.badge] || '🏰';
  }

  getCardIcon(cardId) {
    const icons = {
      archer: '🏹',
      knight: '🛡️',
      giant: '👹',
      wizard: '🧙‍♂️',
      dragon: '🐲',
      prince: '🤴'
    };
    return icons[cardId] || '🃏';
  }

  formatRole(role) {
    const roleNames = {
      leader: 'Leader',
      'co-leader': 'Co-Leader',
      elder: 'Elder',
      member: 'Member'
    };
    return roleNames[role] || 'Member';
  }

  formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  scrollToBottom(element) {
    element.scrollTop = element.scrollHeight;
  }

  playNotificationSound() {
    // Play a subtle notification sound
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2O/GdiMFLIHO8tiJOQcYZrjp55xKEAxQqOPvt2AeATiG0fPPdCUAK4Cz');
      audio.volume = 0.1;
      audio.play().catch(() => {});
    } catch (error) {
      // Ignore audio errors
    }
  }

  showConnectionStatus(connected) {
    // Could show a connection indicator in the UI
    console.log(connected ? '🟢 Connected to clan' : '🔴 Disconnected from clan');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showInfo(message) {
    this.showNotification(message, 'info');
  }

  showNotification(message, type = 'info') {
    // Create temporary notification
    const notification = document.createElement('div');
    notification.className = `clan-notification ${type}`;
    notification.innerHTML = `
      <span class="notification-icon">${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span>
      <span class="notification-text">${this.escapeHtml(message)}</span>
    `;

    // Add to header
    const header = this.container.querySelector('.clan-header');
    if (header) {
      header.appendChild(notification);
      
      // Remove after 3 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 3000);
    }
  }

  // === PLACEHOLDER FUNCTIONS ===
  openClanSettings() {
    this.showInfo('Clan settings coming soon!');
  }

  confirmLeaveClan() {
    const confirmed = confirm('Are you sure you want to leave this clan?');
    if (confirmed) {
      this.showInfo('Leave clan functionality coming soon!');
    }
  }

  inviteMember() {
    this.showInfo('Invite member functionality coming soon!');
  }

  promoteMember(userId) {
    if (this.isConnected) {
      ClanRoomClient.promoteMember(userId);
    }
  }

  demoteMember(userId) {
    if (this.isConnected) {
      ClanRoomClient.demoteMember(userId);
    }
  }

  kickMember(userId) {
    const member = this.members.find(m => m.userId === userId);
    const confirmed = confirm(`Are you sure you want to kick ${member?.username || 'this member'}?`);
    if (confirmed && this.isConnected) {
      ClanRoomClient.kickMember(userId);
    }
  }

  showDonationHistory() {
    this.showInfo('Donation history coming soon!');
  }

  refreshWars() {
    // Load war data
    this.showInfo('War system coming soon!');
  }

  startWar() {
    this.showInfo('War functionality coming soon!');
  }

  showWarHistory() {
    this.showInfo('War history coming soon!');
  }

  updateMemberStatus(userId, isOnline) {
    const member = this.members.find(m => m.userId === userId);
    if (member) {
      member.isOnline = isOnline;
      this.updateMembersList(this.members);
    }
  }

  handleDonationRequestSent(req) {
    this.showSuccess(`Card request sent for ${req.cardId}!`);
    this.addDonationRequest(req);
  }

  handleDonationSent(data) {
    this.showSuccess(`You donated cards! +${data.xpGained} XP`);
    this.loadDonationStats();
  }

  handleSystemSync(data) {
    console.log('🔄 System sync completed:', data);
    if (data.members) {
      this.updateMembersList(data.members);
    }
  }

  // === PUBLIC METHODS ===
  updatePlayer(user) {
    this.currentUser = user;
    console.log('👤 Player data updated:', user);
  }

  updateClan(clan) {
    this.clan = clan;
    
    // Update header info
    const nameEl = this.container.querySelector('.clan-name');
    const tagEl = this.container.querySelector('.clan-tag');
    const membersEl = this.container.querySelector('.clan-members');
    const badgeEl = this.container.querySelector('.clan-badge-icon');
    
    if (nameEl) nameEl.textContent = clan.name || 'Unknown Clan';
    if (tagEl) tagEl.textContent = clan.tag || '#UNKNOWN';
    if (membersEl) membersEl.textContent = `${clan.memberCount || 1}/${clan.maxMembers || 50} members`;
    if (badgeEl) badgeEl.textContent = this.getClanBadgeIcon();
    
    console.log('🏰 Clan data updated:', clan);
  }

  getCurrentTab() {
    return this.currentTab;
  }

  isConnectedToClan() {
    return this.isConnected;
  }

  // === CLEANUP ===
  cleanup() {
    // Disconnect from Colyseus
    if (this.isConnected) {
      ClanRoomClient.leave();
      this.isConnected = false;
    }

    // Clear event listeners
    ClanRoomClient.off('chat:message');
    ClanRoomClient.off('member:online');
    ClanRoomClient.off('member:offline');
    ClanRoomClient.off('member:list');
    ClanRoomClient.off('member:promoted');
    ClanRoomClient.off('member:demoted');
    ClanRoomClient.off('member:kicked');
    ClanRoomClient.off('donation:request');
    ClanRoomClient.off('donation:request:sent');
    ClanRoomClient.off('donation:given');
    ClanRoomClient.off('donation:sent');
    ClanRoomClient.off('system:error');
    ClanRoomClient.off('system:sync');

    // Save chat history
    if (this.chatMessages.length > 0) {
      try {
        localStorage.setItem(
          `clan_chat_${this.clan.id}`, 
          JSON.stringify(this.chatMessages.slice(-50)) // Keep last 50 messages
        );
      } catch (error) {
        console.error('Failed to save chat history:', error);
      }
    }

    console.log('🧹 ClanContent cleaned up');
  }
}

export default ClanContent;
