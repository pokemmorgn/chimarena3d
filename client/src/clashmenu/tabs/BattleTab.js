/**
 * Battle Tab - Main Battle Interface (Clash Royale style)
 * Shows arena, battle button, topbar and dropdown menu
 */
class BattleTab {
  constructor() {
    this.isActive = false;
    this.isSearching = false;
    this.currentUser = null;
    this.currentMode = 'Ladder';

    // HTML elements
    this.container = null;
    this.tabElement = null;
    this.battleBtn = null;
    this.modeBtn = null;
    this.dropdownMenu = null;

    // Event system
    this.eventListeners = new Map();
  }

  async initialize(container) {
    if (!container) throw new Error('Container is required for BattleTab');
    this.container = container;
    this.createTabElement();
    this.renderLayout();
    this.setupEventListeners();
  }

  createTabElement() {
    this.tabElement = document.createElement('div');
    this.tabElement.className = 'battle-tab';
    this.tabElement.id = 'battle-tab-content';
    this.container.appendChild(this.tabElement);
  }

  renderLayout() {
    this.tabElement.innerHTML = `
      <!-- Top bar -->
      <div class="battle-topbar">
        <div class="topbar-left">
          <button class="topbar-btn" id="btn-friends" title="Friends">👥</button>
          <button class="topbar-btn" id="btn-messages" title="Messages">💬</button>
        </div>
        <div class="topbar-center">
          <div class="player-info">
            <span class="player-name" id="topbar-player-name">Player</span>
            <span class="player-trophies" id="topbar-player-trophies">🏆 0</span>
          </div>
        </div>
        <div class="topbar-right">
          <button class="topbar-btn" id="btn-menu" title="Menu">☰</button>
          <div class="dropdown-menu" id="dropdown-menu">
            <ul>
              <li id="menu-leaderboard">🏆 Leaderboard</li>
              <li id="menu-history">📜 Battle History</li>
              <li id="menu-options">⚙️ Options</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Arena -->
      <div class="arena-section">
        <img src="assets/arena_placeholder.png" alt="Arena" class="arena-image" />
      </div>

      <!-- Battle button + mode -->
      <div class="battle-action">
        <button class="battle-main-btn" id="battle-main-btn">⚔️ Battle • ${this.currentMode}</button>
        <button class="battle-mode-btn" id="battle-mode-btn" title="Select Mode">🎮</button>
      </div>
    `;

    this.battleBtn = this.tabElement.querySelector('#battle-main-btn');
    this.modeBtn = this.tabElement.querySelector('#battle-mode-btn');
    this.dropdownMenu = this.tabElement.querySelector('#dropdown-menu');
  }

  setupEventListeners() {
    if (this.battleBtn) {
      this.battleBtn.addEventListener('click', () => this.handleMainBattle());
    }
    if (this.modeBtn) {
      this.modeBtn.addEventListener('click', () => this.emit('battle:mode'));
    }

    const friendsBtn = this.tabElement.querySelector('#btn-friends');
    const messagesBtn = this.tabElement.querySelector('#btn-messages');
    const menuBtn = this.tabElement.querySelector('#btn-menu');

    if (friendsBtn) friendsBtn.addEventListener('click', () => this.emit('battle:friends'));
    if (messagesBtn) messagesBtn.addEventListener('click', () => this.emit('battle:messages'));

    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        this.dropdownMenu.classList.toggle('show');
      });
    }

    // Dropdown menu actions
    this.tabElement.querySelector('#menu-leaderboard')
      .addEventListener('click', () => this.emit('battle:leaderboard'));
    this.tabElement.querySelector('#menu-history')
      .addEventListener('click', () => this.emit('battle:history'));
    this.tabElement.querySelector('#menu-options')
      .addEventListener('click', () => this.emit('battle:options'));

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (this.dropdownMenu && !this.dropdownMenu.contains(e.target) && e.target.id !== 'btn-menu') {
        this.dropdownMenu.classList.remove('show');
      }
    });
  }

  updatePlayerData(user) {
    if (!user) return;
    this.currentUser = user;

    const nameEl = this.tabElement.querySelector('#topbar-player-name');
    const trophiesEl = this.tabElement.querySelector('#topbar-player-trophies');

    if (nameEl) nameEl.textContent = user.displayName || user.username || 'Player';
    if (trophiesEl) trophiesEl.textContent = `🏆 ${user.trophies || 0}`;
  }

  handleMainBattle() {
    if (this.isSearching) {
      this.cancelBattleSearch();
    } else {
      this.startBattleSearch();
    }
  }

  startBattleSearch() {
    if (this.isSearching) return;
    this.isSearching = true;
    if (this.battleBtn) {
      this.battleBtn.textContent = '❌ Cancel Search';
      this.battleBtn.classList.add('searching');
    }
    this.emit('battle:search');
  }

  cancelBattleSearch() {
    if (!this.isSearching) return;
    this.isSearching = false;
    if (this.battleBtn) {
      this.battleBtn.textContent = `⚔️ Battle • ${this.currentMode}`;
      this.battleBtn.classList.remove('searching');
    }
    this.emit('battle:cancel');
  }

  show() {
    if (this.tabElement) {
      this.tabElement.classList.add('active');
      this.isActive = true;
    }
  }

  hide() {
    if (this.tabElement) {
      this.tabElement.classList.remove('active');
      this.isActive = false;
    }
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in event listener ${event}`, err);
        }
      });
    }
  }

  async cleanup() {
    if (this.tabElement && this.tabElement.parentNode) {
      this.tabElement.parentNode.removeChild(this.tabElement);
    }
    this.eventListeners.clear();
    this.container = null;
    this.tabElement = null;
    this.battleBtn = null;
    this.modeBtn = null;
    this.dropdownMenu = null;
  }
}

export default BattleTab;
