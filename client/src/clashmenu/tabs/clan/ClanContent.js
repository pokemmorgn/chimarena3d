import ClanRoomClient from '../../../services/ClanRoomClient.js';
import ClanChat from './ClanChat.js';
import ClanMembers from './ClanMembers.js';
import ClanDonations from './ClanDonations.js';

class ClanContent {
  constructor(container, currentUser, currentClan) {
    this.container = container;
    this.currentUser = currentUser;
    this.currentClan = currentClan;

    this.chat = new ClanChat(this);
    this.members = new ClanMembers(this);
    this.donations = new ClanDonations(this);
  }

  render() {
    this.container.innerHTML = `
      <div class="clan-interface">
        <div class="clan-header">
          <div class="clan-name">${this.currentClan.name}</div>
          <div class="clan-tag">${this.currentClan.tag}</div>
        </div>
        <div class="clan-tabs">
          <button class="clan-tab-btn active" data-tab="chat">💬 Chat</button>
          <button class="clan-tab-btn" data-tab="members">👥 Members</button>
          <button class="clan-tab-btn" data-tab="donations">🎁 Donations</button>
        </div>
        <div class="clan-content">
          <div id="clan-chat" class="clan-tab-content active"></div>
          <div id="clan-members" class="clan-tab-content"></div>
          <div id="clan-donations" class="clan-tab-content"></div>
        </div>
      </div>
    `;

    this.setupTabs();

    // Render sous-composants
    this.chat.render(document.getElementById('clan-chat'));
    this.members.render(document.getElementById('clan-members'));
    this.donations.render(document.getElementById('clan-donations'));

    ClanRoomClient.connect(this.currentUser.id, this.currentClan.clanId);
  }

  setupTabs() {
    this.container.querySelectorAll('.clan-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.container.querySelectorAll('.clan-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.container.querySelectorAll('.clan-tab-content').forEach(c => c.classList.remove('active'));
        this.container.querySelector(`#clan-${tab}`).classList.add('active');
      });
    });
  }
}

export default ClanContent;
