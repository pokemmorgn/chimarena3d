import ClanRoomClient from '../../../services/ClanRoomClient.js';

class ClanChat {
  constructor(parent) {
    this.parent = parent; // instance de ClanContent
    this.messages = [];
    this.container = null;
  }

  render(container) {
    this.container = container;
    this.container.innerHTML = `
      <div class="clan-chat">
        <div class="chat-messages" id="clan-chat-messages"></div>
        <div class="chat-input-container">
          <input id="clan-chat-input" class="chat-input" placeholder="Message..." />
          <button id="btn-send-message" class="chat-send-btn">➤</button>
        </div>
      </div>
    `;

    // Events
    this.container.querySelector('#btn-send-message')
      .addEventListener('click', () => this.sendMessage());
    this.container.querySelector('#clan-chat-input')
      .addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.sendMessage();
      });

    // Listen Colyseus
    ClanRoomClient.on('chat:message', (msg) => {
      this.messages.push(msg);
      this.addMessage(msg);
    });
  }

  addMessage(msg) {
    const list = this.container.querySelector('#clan-chat-messages');
    if (!list) return;
    const el = document.createElement('div');
    el.className = 'chat-message';
    el.innerHTML = `
      <div class="message-header">
        <span class="message-author ${msg.authorRole}">${msg.authorUsername}</span>
        <span class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</span>
      </div>
      <div class="message-content">${msg.content}</div>
    `;
    list.appendChild(el);
    list.scrollTop = list.scrollHeight;
  }

  sendMessage() {
    const input = this.container.querySelector('#clan-chat-input');
    if (!input || !input.value.trim()) return;
    ClanRoomClient.sendChat(input.value.trim());
    input.value = '';
  }
}

export default ClanChat;
