class BattleTab {
  constructor() {
    this.isActive = false;
    this.isSearching = false;
    this.currentUser = null;

    this.currentMode = 'PVP';
    this.modes = ['PVE', 'PVP', 'Ranked', '2v2'];

    this.container = null;
    this.tabElement = null;
    this.battleBtn = null;
    this.modeBtn = null;
    this.modeDropdown = null;
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
    <div class="player-name-wrapper">
      <span class="player-name" id="topbar-player-name">Player</span>
      <button class="edit-profile-btn" id="btn-edit-profile">
        <img src="/icons/Icon_Going.png" alt="Edit" />
      </button>
    </div>
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

      <!-- Dropdown menu (topbar) -->
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

      <!-- Bottom: Battle + mode + chests -->
      <div class="battle-bottom">
        <div class="battle-action">
          <button class="battle-main-btn" id="battle-main-btn">⚔️ ${this.currentMode}</button>
          <button class="battle-mode-btn" id="battle-mode-btn">⚙️</button>
        </div>
        <div class="battle-chests">
          <div class="chest-slot" data-slot="1"></div>
          <div class="chest-slot" data-slot="2"></div>
          <div class="chest-slot" data-slot="3"></div>
          <div class="chest-slot" data-slot="4"></div>
        </div>
      </div>

      <!-- Mode dropdown -->
      <div class="mode-dropdown" id="mode-dropdown">
        ${this.modes.map(mode => `<div class="mode-dropdown-item" data-mode="${mode}">${mode}</div>`).join('')}
      </div>
    `;

    this.battleBtn = this.tabElement.querySelector('#battle-main-btn');
    this.modeBtn = this.tabElement.querySelector('#battle-mode-btn');
    this.modeDropdown = this.tabElement.querySelector('#mode-dropdown');
    this.dropdownMenu = this.tabElement.querySelector('#dropdown-menu');
  }

  setupEventListeners() {
    this.battleBtn.addEventListener('click', () => this.handleMainBattle());

    // Open/close mode dropdown
    this.modeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.modeDropdown.classList.toggle('active');
    });

    // Mode selection
    this.modeDropdown.querySelectorAll('.mode-dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        const selectedMode = item.dataset.mode;
        this.setMode(selectedMode);
        this.modeDropdown.classList.remove('active');
        this.emit('battle:mode', { mode: selectedMode });
      });
    });

    const editBtn = this.tabElement.querySelector('#btn-edit-profile');
editBtn.addEventListener('click', () => this.emit('player:open-profile'));
    
    // Close dropdown if clicking outside
    document.addEventListener('click', (e) => {
      if (this.modeDropdown.classList.contains('active') &&
          !this.modeDropdown.contains(e.target) &&
          e.target.id !== 'battle-mode-btn') {
        this.modeDropdown.classList.remove('active');
      }
    });

    // Topbar menu
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

    // Avatar/banner click
    this.tabElement.querySelector('#player-avatar')
      .addEventListener('click', () => this.emit('player:change-avatar'));
    this.tabElement.querySelector('#topbar-banner')
      .addEventListener('click', () => this.emit('player:change-banner'));
  }

  setMode(mode) {
    this.currentMode = mode;
    this.battleBtn.textContent = `⚔️ ${mode}`;
  }

  updatePlayerData(user) {
    if (!user) return;
    this.currentUser = user;
    this.tabElement.querySelector('#topbar-player-name').textContent =
      user.displayName || user.username || 'Player';
    this.tabElement.querySelector('#topbar-player-trophies').textContent =
      `🏆 ${user.trophies || 0}`;
    if (user.avatarUrl) this.tabElement.querySelector('#player-avatar').src = user.avatarUrl;
    if (user.bannerUrl) this.tabElement.querySelector('#topbar-banner').src = user.bannerUrl;
  }

  handleMainBattle() {
    if (this.isSearching) this.cancelBattleSearch();
    else this.startBattleSearch();
  }

  startBattleSearch() {
    this.isSearching = true;
    this.battleBtn.textContent = '❌ Cancel';
    this.emit('battle:search', { mode: this.currentMode });
  }

  cancelBattleSearch() {
    this.isSearching = false;
    this.battleBtn.textContent = `⚔️ ${this.currentMode}`;
    this.emit('battle:cancel');
  }

  show() { this.tabElement.classList.add('active'); this.isActive = true; }
  hide() { this.tabElement.classList.remove('active'); this.isActive = false; }

  on(event, callback) {
    if (!this.eventListeners.has(event)) this.eventListeners.set(event, new Set());
    this.eventListeners.get(event).add(callback);
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(cb => cb(data));
    }
  }
}

export default BattleTab;
