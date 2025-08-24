/**
 * Battle Tab - Interface de bataille principale (style Clash Royale)
 * Affiche l'arène, les coffres, le bouton Combat et la topbar
 */
class BattleTab {
  constructor() {
    this.isActive = false;
    this.isSearching = false;
    this.currentUser = null;

    // HTML elements
    this.container = null;
    this.tabElement = null;
    this.battleBtn = null;
    this.modeBtn = null;
    this.chestSlots = [];

    // Event system
    this.eventListeners = new Map();

    console.log('⚔️ BattleTab created');
  }

  /**
   * Initialize battle tab
   */
  async initialize(container) {
    if (!container) {
      throw new Error('Container is required for BattleTab');
    }

    this.container = container;

    try {
      console.log('⚔️ Initializing BattleTab...');
      this.createTabElement();
      this.renderLayout();
      this.setupEventListeners();
      console.log('✅ BattleTab initialized');
    } catch (error) {
      console.error('❌ Failed to initialize BattleTab:', error);
      throw error;
    }
  }

  /**
   * Create tab element
   */
  createTabElement() {
    this.tabElement = document.createElement('div');
    this.tabElement.className = 'battle-tab';
    this.tabElement.id = 'battle-tab-content';
    this.container.appendChild(this.tabElement);
  }

  /**
   * Render main layout (topbar + arena + battle + chests)
   */
  renderLayout() {
    this.tabElement.innerHTML = `
      <!-- Top bar -->
      <div class="battle-topbar">
        <div class="topbar-left">
          <button class="topbar-btn" id="btn-friends">👥</button>
          <button class="topbar-btn" id="btn-messages">💬</button>
        </div>
        <div class="topbar-center">
          <div class="player-info">
            <span class="player-name" id="topbar-player-name">Player</span>
            <span class="player-trophies" id="topbar-player-trophies">🏆 0</span>
          </div>
        </div>
        <div class="topbar-right">
          <button class="topbar-btn" id="btn-menu">☰</button>
        </div>
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

    // Refs
    this.battleBtn = this.tabElement.querySelector('#battle-main-btn');
    this.modeBtn = this.tabElement.querySelector('#battle-mode-btn');
    this.chestSlots = Array.from(this.tabElement.querySelectorAll('.chest-slot'));
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (this.battleBtn) {
      this.battleBtn.addEventListener('click', () => this.handleMainBattle());
    }
    if (this.modeBtn) {
      this.modeBtn.addEventListener('click', () => this.handleModeSelection());
    }

    const friendsBtn = this.tabElement.querySelector('#btn-friends');
    const messagesBtn = this.tabElement.querySelector('#btn-messages');
    const menuBtn = this.tabElement.querySelector('#btn-menu');

    if (friendsBtn) {
      friendsBtn.addEventListener('click', () => this.emit('battle:friends'));
    }
    if (messagesBtn) {
      messagesBtn.addEventListener('click', () => this.emit('battle:messages'));
    }
    if (menuBtn) {
      menuBtn.addEventListener('click', () => this.emit('battle:menu'));
    }
  }

  /**
   * Update player data in the topbar
   */
  updatePlayerData(user) {
    if (!user) return;
    this.currentUser = user;

    const nameEl = this.tabElement.querySelector('#topbar-player-name');
    const trophiesEl = this.tabElement.querySelector('#topbar-player-trophies');

    if (nameEl) nameEl.textContent = user.displayName || user.username || 'Player';
    if (trophiesEl) trophiesEl.textContent = `🏆 ${user.trophies || 0}`;
  }

  /**
   * Handle main battle button
   */
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
      this.battleBtn.textContent = '❌ Annuler';
    }
    this.emit('battle:search');
  }

  cancelBattleSearch() {
    if (!this.isSearching) return;
    this.isSearching = false;
    if (this.battleBtn) {
      this.battleBtn.textContent = '⚔️ Combat';
    }
    this.emit('battle:cancel');
  }

  handleModeSelection() {
    this.emit('battle:mode');
  }

  /**
   * Show/hide tab
   */
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

  /**
   * Event system
   */
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

  /**
   * Cleanup
   */
  async cleanup() {
    if (this.tabElement && this.tabElement.parentNode) {
      this.tabElement.parentNode.removeChild(this.tabElement);
    }
    this.eventListeners.clear();
    this.container = null;
    this.tabElement = null;
    this.battleBtn = null;
    this.modeBtn = null;
    this.chestSlots = [];
  }
}

export default BattleTab;
