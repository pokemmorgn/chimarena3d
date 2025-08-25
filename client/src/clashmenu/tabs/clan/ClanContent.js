/**
 * ClanContent.js - Interface principale quand le joueur est dans un clan
 */
import ClanRoomClient from '../../../services/ClanRoomClient.js';

class ClanContent {
  constructor(container, currentUser, clan) {
    this.container = container;
    this.currentUser = currentUser;
    this.clan = clan;

    this.chatMessages = [];
    this.members = [];
    this.donations = [];
  }

  render() {
    this.container.innerHTML = `
      <div class="clan-interface">

        <!-- Header -->
        <div class="clan-header">
          <div class="clan-badge">
            <span class="clan-badge-icon">🏰</span>
          </div>
          <div class="clan-info">
            <div class="clan-name">${this.clan.name}</div>
            <div class="clan-tag">${this.clan.tag}</div>
            <div class="clan-members">${this.clan.memberCount || 1}/${this.clan.maxMembers || 50} members</div>
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

          <!-- Chat -->
          <div class="clan-tab-content active" id="clan-tab-chat">
            <div class="chat-messages" id="clan-chat-messages"></div>
            <div class="chat-input-container">
              <input id="clan-chat-input" class="chat-input" placeholder="Message..." />
              <button id="btn-send-message" class="chat-send-btn">➤</button>
            </div>
          </div>

          <!-- Members -->
          <div class="clan-tab-content" id="clan-tab-members">
            <div class="members-list" id="clan-members-list"></div>
          </div>

          <!-- Donations -->
          <div class="clan-tab-content" id="clan-tab-donations">
            <div class="clan-donations">
              <div class="donation-header">
                <span>Donations</span>
                <button class="donation-btn request" id="btn-request-card">Request Card</button>
              </div>
              <div class="donation-list" id="donation-list"></div>
            </div>
          </div>

          <!-- Wars -->
          <div class="clan-tab-content" id="clan-tab-wars">
            <div class="clan-wars">
              <div class="war-status">
                <div class="war-icon">⚔️</div>
                <h3>Clan Wars Coming Soon</h3>
                <p>Prepare your clan for epic battles!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupEvents();
  }

  setupEvents() {
    // Tabs switching
    this.container.querySelectorAll('.clan-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Chat
    const input = this.container.querySelector('#clan-chat-input');
    const sendBtn = this.container.querySelector('#btn-send-message');
    sendBtn.addEventListener('click', () => this.sendChatMessage());
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendChatMessage();
    });

    // Donations
    const reqBtn = this.container.querySelector('#btn-request-card');
    reqBtn.addEventListener('click', () => this.requestCard());
  }

  switchTab(tabName) {
    this.container.querySelectorAll('.clan-tab-btn').forEach(btn =>
      btn.classList.toggle('active', btn.dataset.tab === tabName)
    );
    this.container.querySelectorAll('.clan-tab-content').forEach(content =>
      content.classList.toggle('active', content.id === `clan-tab-${tabName}`)
    );
  }

  // ==== CHAT ====
  sendChatMessage() {
    const input = this.container.querySelector('#clan-chat-input');
    if (!input.value.trim()) return;
    ClanRoomClient.sendChat(input.value.trim());
    input.value = '';
  }

  addChatMessage(msg) {
    const container = this.container.querySelector('#clan-chat-messages');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'chat-message';
    el.innerHTML = `
      <div class="message-header">
        <span class="message-author ${msg.authorRole || 'member'}">${msg.authorUsername}</span>
        <span class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</span>
      </div>
      <div class="message-content">${msg.content}</div>
    `;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
  }

  // ==== DONATIONS ====
  requestCard() {
    ClanRoomClient.requestCards('archer', 1);
  }

  addDonationRequest(req) {
    const container = this.container.querySelector('#donation-list');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'donation-item';
    el.innerHTML = `
      <div class="donation-info">
        <div class="donation-requester">${req.requesterUsername}</div>
        <div class="donation-card">${req.cardId} (${req.amount})</div>
      </div>
      <div class="donation-actions">
        <button class="donation-btn give">Give</button>
      </div>
    `;
    container.appendChild(el);
  }

  // ==== MEMBERS ====
  addMember(member) {
    const container = this.container.querySelector('#clan-members-list');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `member-item ${member.online ? 'online' : 'offline'}`;
    el.innerHTML = `
      <div class="member-avatar"></div>
      <div class="member-info">
        <div class="member-name">${member.username}</div>
        <div class="member-stats">
          <span class="member-trophies">🏆 ${member.trophies}</span>
          <span class="member-donations">🎁 ${member.donations}</span>
        </div>
      </div>
      <div class="member-role ${member.role}">${member.role}</div>
    `;
    container.appendChild(el);
  }

  updatePlayer(user) {
    this.currentUser = user;
  }
}

export default ClanContent;
