class BattleTab {
  constructor() {
    this.isActive = false;
    this.isSearching = false;
    this.currentUser = null;

    this.container = null;
    this.tabElement = null;
    this.battleBtn = null;
    this.modeBtn = null;
    this.dropdownMenu = null;

    this.eventListeners = new Map();
  }

  async initialize(container) {
    this.container = container;
    this.createTabElement();
    this.renderLayout();
    this.setupEventListeners();
  }

  createTabElement() {
    this.tabElement = document.createElement('div');
    this.tabElement.className = 'battle-tab';
    this.container.appendChild(this.tabElement);
  }

  renderLayout() {
    this.tabElement.innerHTML = `
      <!-- Top bar with banner -->
      <div class="battle-topbar">
        <img src="assets/banner_placeholder.jpg" alt="Banner" class="topbar-banner" id="topbar-banner" />
        <div class="topbar-content">
          <div class="topbar-left">
            <img src="assets/avatar_placeholder.png" alt="Avatar" class="player-avatar" id="player-avatar" />
            <div class="player-info">
              <div class="player-name" id="topbar-player-name">Player</div>
              <div class="player-trophies" id="topbar-player-trophies">🏆 0</div>
            </div>
          </div>
          <div class="topbar-right">
            <button class="topbar-btn" id="btn-friends">👥</button>
            <button class="topbar-btn" id="btn-messages">💬</button>
            <button class="topbar-btn" id="btn-menu">☰</button>
          </div>
        </div>
      </div>

      <!-- Dropdown menu -->
      <div class="dropdown-menu" id="dropdown-menu">
        <div class="dropdown-item" data-action="news">📰 News</div>
        <div class="dropdown-item" data-action="leaderboard">🏆 Leaderboard</div>
        <div class="dropdown-item" data-action="history">📜 Battle History</div>
        <div class="dropdown-item" data-action="options">⚙️ Settings</div>
        <div class="dropdown-item" data-action="logout">🚪 Logout</div>
      </div>

      <!-- Arena -->
      <div class="arena-section">
        <img src="assets/arena_placeholder.png" alt="Arena" class="arena-image" />
      </div>

      <!-- Battle button + mode -->
      <div class="battle-action">
        <button class="battle-main-btn" id="battle-main-btn">⚔️ Battle</button>
        <button class="battle-mode-btn" id="battle-mode-btn">⚙️</button>
      </div>
    `;

    this.battleBtn = this.tabElement.querySelector('#battle-main-btn');
    this.modeBtn = this.tabElement.querySelector('#battle-mode-btn');
    this.dropdownMenu = this.tabElement.querySelector('#dropdown-menu');
  }

  setupEventListeners() {
    this.battleBtn.addEventListener('click', () => this.handleMainBattle());
    this.modeBtn.addEventListener('click', () => this.emit('battle:mode'));

    const avatar = this.tabElement.querySelector('#player-avatar');
    avatar.addEventListener('click', () => this.emit('player:change-avatar'));

    const banner = this.tabElement.querySelector('#topbar-banner');
    banner.addEventListener('click', () => this.emit('player:change-banner'));

    const menuBtn = this.tabElement.querySelector('#btn-menu');
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dropdownMenu.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (this.dropdownMenu.classList.contains('active')) {
        if (!this.dropdownMenu.contains(e.target) && e.target.id !== 'btn-menu') {
          this.dropdownMenu.classList.remove('active');
        }
      }
    });

    this.dropdownMenu.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        this.dropdownMenu.classList.remove('active');
        this.emit(`menu:${item.dataset.action}`);
      });
    });
  }

  updatePlayerData(user) {
    if (!user) return;
    this.currentUser = user;
    this.tabElement.querySelector('#topbar-player-name').textContent =
      user.displayName || user.username || 'Player';
    this.tabElement.querySelector('#topbar-player-trophies').textContent =
      `🏆 ${user.trophies || 0}`;

    if (user.avatarUrl) {
      this.tabElement.querySelector('#player-avatar').src = user.avatarUrl;
    }
    if (user.bannerUrl) {
      this.tabElement.querySelector('#topbar-banner').src = user.bannerUrl;
    }
  }

  handleMainBattle() {
    if (this.isSearching) this.cancelBattleSearch();
    else this.startBattleSearch();
  }

  startBattleSearch() {
    this.isSearching = true;
    this.battleBtn.textContent = '❌ Cancel';
    this.emit('battle:search');
  }

  cancelBattleSearch() {
    this.isSearching = false;
    this.battleBtn.textContent = '⚔️ Battle';
    this.emit('battle:cancel');
  }

  show() {
    this.tabElement.classList.add('active');
    this.isActive = true;
  }

  hide() {
    this.tabElement.classList.remove('active');
    this.isActive = false;
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(cb => cb(data));
    }
  }
}

export default BattleTab;
