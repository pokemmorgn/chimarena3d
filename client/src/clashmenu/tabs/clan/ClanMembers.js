import ClanRoomClient from '../../../services/ClanRoomClient.js';

class ClanMembers {
  constructor(parent) {
    this.parent = parent;
    this.members = [];
    this.container = null;
  }

  render(container) {
    this.container = container;
    this.container.innerHTML = `
      <div class="clan-members">
        <div class="members-header">
          <span class="members-count">0 Members</span>
        </div>
        <div class="members-list" id="members-list"></div>
      </div>
    `;

    ClanRoomClient.on('member:online', (data) => this.setMemberOnline(data.userId, true));
    ClanRoomClient.on('member:offline', (data) => this.setMemberOnline(data.userId, false));
  }

  setMembers(members) {
    this.members = members;
    this.refresh();
  }

  refresh() {
    const list = this.container.querySelector('#members-list');
    const count = this.container.querySelector('.members-count');
    if (!list) return;
    count.textContent = `${this.members.length} Members`;
    list.innerHTML = this.members.map(m => `
      <div class="member-item ${m.isOnline ? 'online' : 'offline'}">
        <div class="member-info">
          <div class="member-name">${m.displayName || m.username}</div>
          <div class="member-stats">
            <span class="member-trophies">🏆 ${m.trophies}</span>
            <span class="member-donations">🎁 ${m.donationsGiven}</span>
          </div>
        </div>
        <div class="member-role ${m.role}">${m.role}</div>
      </div>
    `).join('');
  }

  setMemberOnline(userId, online) {
    const member = this.members.find(m => m.userId === userId);
    if (member) {
      member.isOnline = online;
      this.refresh();
    }
  }
}

export default ClanMembers;
