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
      <!-- Top bar -->
      <div class="battle-topbar">
        <div class="topbar-left">
          <button class="topbar-btn" id="btn-friends">👥</button>
          <button class="topbar-btn" id="btn-messages">💬</button>
        </div>
        <div class="topbar-center">
          <span class="player-name" id="topbar-player-name">Player</span>
          <span class="player-trophies" id="topbar-player-trophies">🏆 0</span>
        </div>
        <div class="topbar-right">
          <button class="topbar-btn" id="btn-menu">☰</button>
        </div>
      </div>

      <!-- Dropdown menu -->
      <div class="dropdown-menu" id="dropdown-menu">
        <div class="dropdown-item" data-action="leaderboard">🏆 Classement</div>
        <div class="dropdown-item" data-action="history">📜 Historique</div>
        <div class="dropdown-item" data-action="options">⚙️ Options</div>
        <div class="dropdown-item" data-action="logout">🚪 Déconnexion</div>
      </div>

      <!-- Arena -->
      <div class="arena-section">
        <img src="assets/arena_placeholder.png" alt="Arena" class="arena-image" />
      </div>

      <!-- Battle button + mode -->
      <div class="battle-action">
        <button class="battle-main-btn" id="battle-main-btn">⚔️ Combat</button>
        <button class="battle-mode-btn" id="battle-mode-btn">⚙️</button>
      </div>

      <!-- Chests -->
      <div class="battle-chests">
        <div class="chest-slot" data-slot="1"></div>
        <div class="chest-slot" data-slot="2"></div>
        <div class="chest-slot" data-slot="3"></div>
        <div class="chest-slot" data-slot="4"></div>
      </div>
    `;

    this.battleBtn = this.tabElement.querySelector('#battle-main-btn');
    this.modeBtn = this.tabElement.querySelector('#battle-mode-btn');
    this.dropdownMenu = this.tabElement.querySelector('#dropdown-menu');
  }

  setupEventListeners() {
    this.battleBtn.addEventListener('click', () => this.handleMainBattle());
    this.modeBtn.addEventListener('click', () => this.emit('battle:mode'));

    const menuBtn = this.tabElement.querySelector('#btn-menu');
    menuBtn.addEventListener('click', () => {
      this.dropdownMenu.classList.toggle('active');
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
    this.tabElement.querySelector('#topbar-player-name').textContent = user.displayName || user.username || 'Player';
    this.tabElement.querySelector('#topbar-player-trophies').textContent = `🏆 ${user.trophies || 0}`;
  }

  handleMainBattle() {
    if (this.isSearching) this.cancelBattleSearch();
    else this.startBattleSearch();
  }

  startBattleSearch() {
    this.isSearching = true;
    this.battleBtn.textContent = '❌ Annuler';
    this.emit('battle:search');
  }

  cancelBattleSearch() {
    this.isSearching = false;
    this.battleBtn.textContent = '⚔️ Combat';
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
