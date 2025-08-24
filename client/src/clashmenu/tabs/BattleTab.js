/**
 * Battle Tab - Clash Royale style
 * Arena view, topbar, connection status, battle button, chest slots
 */
class BattleTab {
  constructor() {
    this.isActive = false;
    this.isSearching = false;
    this.currentUser = null;
    this.currentMode = 'ladder';

    // HTML elements
    this.container = null;
    this.tabElement = null;
    this.battleBtn = null;
    this.modeBtn = null;
    this.connectionStatus = null;

    // Event system
    this.eventListeners = new Map();

    console.log('⚔️ BattleTab created');
  }

  /**
   * Initialize battle tab
   */
  async initialize(container) {
    if (!container) throw new Error('Container is required for BattleTab');
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
   * Create main tab wrapper
   */
  createTabElement() {
    this.tabElement = document.createElement('div');
    this.tabElement.className = 'battle-tab';
    this.tabElement.id = 'battle-tab-content';
    this.container.appendChild(this.tabElement);
  }

  /**
   * Render full layout
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

      <!-- Connection status -->
      <div class="connection-status connecting" id="battle-connection-status">
        Connecting to server...
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
    this.connectionStatus = this.tabElement.querySelector('#battle-connection-status');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (this.battleBtn) {
      this.battleBtn.addEventListener('click', () => this.handleMainBattle());
    }
    if (this.modeBtn) {
      this.modeBtn.addEventListener('click', () => this.handleModeChange());
    }
  }

  /**
   * Update player data (topbar)
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
   * Update connection status (compatible with ClashMenuManager)
   */
  updateConnectionStatus(message, status) {
    if (!this.connectionStatus) return;
    this.connectionStatus.className = `connection-status ${status}`;
    this.connectionStatus.textContent = message;
  }

  /**
   * Enable/disable features
   */
  enableBattleFeatures(enabled) {
    if (this.battleBtn) {
      this.battleBtn.disabled = !enabled;
    }
  }

  /**
   * Handle main battle button
   */
  handleMainBattle() {
    if (this.isSearching) {
      this.cancelBattleSearch();
    } else {
      this.startBattleSearch(this.currentMode);
    }
  }

  handleModeChange() {
    // Cycle through modes (simplified)
    const modes = ['ladder', 'training', 'challenge'];
    let idx = modes.indexOf(this.currentMode);
    this.currentMode = modes[(idx + 1) % modes.length];
    console.log(`⚔️ Mode changed to: ${this.currentMode}`);
  }

  startBattleSearch(mode = 'ladder') {
    this.isSearching = true;
    this.updateConnectionStatus('Searching for opponent...', 'searching');
    this.emit('battle:search', { mode });
  }

  cancelBattleSearch() {
    this.isSearching = false;
    this.updateConnectionStatus('Connected to game world', 'connected');
    this.emit('battle:cancel');
  }

  handleBattleFound(battleData) {
    this.isSearching = false;
    this.updateConnectionStatus('Battle found! Loading...', 'connected');
    console.log('⚔️ Battle found:', battleData);
  }

  handleBattleCancelled(data) {
    this.isSearching = false;
    this.updateConnectionStatus('Connected to game world', 'connected');
    console.log('⚔️ Battle cancelled:', data);
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

  deactivate() {
    if (this.isSearching) this.cancelBattleSearch();
    this.hide();
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
          console.error(`Error in BattleTab listener for ${event}:`, err);
        }
      });
    }
  }

  async cleanup() {
    if (this.isSearching) this.cancelBattleSearch();
    this.eventListeners.clear();
    if (this.tabElement && this.tabElement.parentNode) {
      this.tabElement.parentNode.removeChild(this.tabElement);
    }
    this.tabElement = null;
    this.battleBtn = null;
    this.modeBtn = null;
    this.connectionStatus = null;
  }
}

export default BattleTab;
