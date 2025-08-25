import ClanRoomClient from '../../../services/ClanRoomClient.js';

class ClanMembers {
  constructor(parent) {
    this.parent = parent; // instance de ClanContent
    this.members = [];
    this.container = null;
    this.myRole = parent.currentClan.myRole || 'member';
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

    // Écoute les updates en temps réel
    ClanRoomClient.on('member:online', (data) => this.setMemberOnline(data.userId, true));
    ClanRoomClient.on('member:offline', (data) => this.setMemberOnline(data.userId, false));

    // Promotions / demotions / kicks broadcastés
    ClanRoomClient.on('member_promoted', (data) => this.updateMemberRole(data.targetUserId, data.newRole));
    ClanRoomClient.on('member_demoted', (data) => this.updateMemberRole(data.targetUserId, data.newRole));
    ClanRoomClient.on('member_kicked', (data) => this.removeMember(data.targetUserId));
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

    list.innerHTML = this.members.map(m => {
      const canManage = this.canManage(m);
      return `
        <div class="member-item ${m.isOnline ? 'online' : 'offline'}">
          <div class="member-info">
            <div class="member-name">${m.displayName || m.username}</div>
            <div class="member-stats">
              <span class="member-trophies">🏆 ${m.trophies}</span>
              <span class="member-donations">🎁 ${m.donationsGiven}</span>
            </div>
          </div>
          <div class="member-role ${m.role}">${m.role}</div>
          ${canManage ? this.renderActions(m) : ''}
        </div>
      `;
    }).join('');

    // Binder les actions
    list.querySelectorAll('.btn-promote').forEach(btn =>
      btn.addEventListener('click', () => this.promote(btn.dataset.id)));
    list.querySelectorAll('.btn-demote').forEach(btn =>
      btn.addEventListener('click', () => this.demote(btn.dataset.id)));
    list.querySelectorAll('.btn-kick').forEach(btn =>
      btn.addEventListener('click', () => this.kick(btn.dataset.id)));
  }

  renderActions(member) {
    return `
      <div class="member-actions">
        <button class="member-action-btn btn-promote" data-id="${member.userId}" title="Promote">⬆</button>
        <button class="member-action-btn btn-demote" data-id="${member.userId}" title="Demote">⬇</button>
        <button class="member-action-btn btn-kick danger" data-id="${member.userId}" title="Kick">✖</button>
      </div>
    `;
  }

  canManage(member) {
    // Ne peut pas s’auto-gérer
    if (member.userId === this.parent.currentUser.id) return false;

    const hierarchy = ['member', 'elder', 'co-leader', 'leader'];
    const myIndex = hierarchy.indexOf(this.myRole);
    const targetIndex = hierarchy.indexOf(member.role);

    // Ex : leader peut gérer tout le monde, co-leader peut gérer en dessous
    return myIndex > targetIndex;
  }

  setMemberOnline(userId, online) {
    const member = this.members.find(m => m.userId === userId);
    if (member) {
      member.isOnline = online;
      this.refresh();
    }
  }

  updateMemberRole(userId, newRole) {
    const member = this.members.find(m => m.userId === userId);
    if (member) {
      member.role = newRole;
      this.refresh();
    }
  }

  removeMember(userId) {
    this.members = this.members.filter(m => m.userId !== userId);
    this.refresh();
  }

  // ==== Actions Colyseus ====
  promote(userId) {
    ClanRoomClient.promoteMember(userId);
  }

  demote(userId) {
    ClanRoomClient.demoteMember(userId);
  }

  kick(userId) {
    ClanRoomClient.kickMember(userId);
  }
}

export default ClanMembers;
