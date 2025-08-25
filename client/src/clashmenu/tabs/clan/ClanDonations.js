import ClanRoomClient from '../../../services/ClanRoomClient.js';

class ClanDonations {
  constructor(parent) {
    this.parent = parent;
    this.requests = [];
    this.container = null;
  }

  render(container) {
    this.container = container;
    this.container.innerHTML = `
      <div class="clan-donations">
        <div class="donation-header">
          <span>Donations</span>
          <button class="donation-btn request" id="btn-request-card">Request Card</button>
        </div>
        <div class="donation-list" id="donation-list"></div>
      </div>
    `;

    this.container.querySelector('#btn-request-card')
      .addEventListener('click', () => this.requestCard());

    ClanRoomClient.on('donation:request', (req) => {
      this.requests.push(req);
      this.refresh();
    });
    ClanRoomClient.on('donation:request:sent', (req) => {
      this.requests.push(req);
      this.refresh();
    });
    ClanRoomClient.on('donation:given', () => this.refresh());
  }

  refresh() {
    const list = this.container.querySelector('#donation-list');
    if (!list) return;
    if (this.requests.length === 0) {
      list.innerHTML = `<p style="color:white">No requests</p>`;
      return;
    }
    list.innerHTML = this.requests.map(r => `
      <div class="donation-item">
        <div class="donation-info">
          <div class="donation-requester">${r.requesterUsername}</div>
          <div class="donation-card">Card: ${r.cardId} (${r.amount})</div>
        </div>
        <div class="donation-actions">
          <button class="donation-btn give" data-id="${r.messageId}">Give</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.donation-btn.give').forEach(btn => {
      btn.addEventListener('click', () => this.giveDonation(btn.dataset.id));
    });
  }

  requestCard() {
    // test: hardcoded
    ClanRoomClient.requestCards('archer', 1);
  }

  giveDonation(messageId) {
    ClanRoomClient.donateCards(messageId, 1);
  }
}

export default ClanDonations;
