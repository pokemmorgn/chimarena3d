class BattleTab {
  constructor() {
    this.isActive = false;
    this.isSearching = false;
    this.currentUser = null;

    this.container = null;
    this.tabElement = null;
    this.battleBtn = null;
    this.modeBtn = null;

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
      <!-- Top bar -->
      <div class="battle-topbar">
        <div class="topbar-left">
          <button class="topbar-btn" id="btn-friends">👥</button>
          <button class="topbar-btn" id="btn-messages">💬</button>
        </div>
        <div class="topbar-center"></div>
        <div class="topbar-right">
          <button class="topbar-btn" id="btn-menu">☰</button>
        </div>
      </div>

      <!-- Player banner -->
      <div class="player-banner">
        <img src="assets/banner_placeholder.jpg" alt="Banner" class="banner-bg" />
        <div class="banner-content">
          <img src="assets/avatar_placeholder.png" alt="Avatar" class="player-avatar" id="player-avatar" />
          <div class="banner-info">
            <div class="banner-name" id="banner-name">Player</div>
            <div class="banner-trophies" id="banner-trophies">🏆 0</div>
          </div>
          <button class="banner-edit-btn" id="btn-edit-banner">✏️</button>
        </div>
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
  }

  setupEventListeners() {
    this.battleBtn.addEventListener('click', () => this.handleMainBattle());
    this.modeBtn.addEventListener('click', () => this.emit('battle:mode'));

    const avatar = this.tabElement.querySelector('#player-avatar');
    avatar.addEventListener('click', () => this.emit('player:change-avatar'));

    const editBanner = this.tabElement.querySelector('#btn-edit-banner');
    editBanner.addEventListener('click', () => this.emit('player:change-banner'));
  }

  updatePlayerData(user) {
    if (!user) return;
    this.currentUser = user;
    this.tabElement.querySelector('#banner-name').textContent =
      user.displayName || user.username || 'Player';
    this.tabElement.querySelector('#banner-trophies').textContent =
      `🏆 ${user.trophies || 0}`;

    if (user.avatarUrl) {
      this.tabElement.querySelector('#player-avatar').src = user.avatarUrl;
    }
    if (user.bannerUrl) {
      this.tabElement.querySelector('.banner-bg').src = user.bannerUrl;
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
