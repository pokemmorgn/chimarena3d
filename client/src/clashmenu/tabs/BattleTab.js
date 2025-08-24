/**
 * Battle Tab - Interface de bataille principale (style Clash Royale)
 * Arène, bouton combat, sélection de mode et coffres
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
   * Create root tab element
   */
  createTabElement() {
    this.tabElement = document.createElement('div');
    this.tabElement.className = 'battle-tab';
    this.tabElement.id = 'battle-tab-content';
    this.container.appendChild(this.tabElement);
  }

  /**
   * Render main layout
   */
  renderLayout() {
    this.tabElement.innerHTML = `
      <!-- Arène -->
      <div class="arena-section">
        <img src="assets/arena_placeholder.png" alt="Arena" class="arena-image" />
      </div>

      <!-- Bouton combat + mode -->
      <div class="battle-action">
        <button class="battle-main-btn" id="battle-main-btn">⚔️ Combat</button>
        <button class="battle-mode-btn" id="battle-mode-btn">⚙️</button>
      </div>

      <!-- Coffres -->
      <div class="battle-chests">
        <div class="chest-slot" data-slot="1"></div>
        <div class="chest-slot" data-slot="2"></div>
        <div class="chest-slot" data-slot="3"></div>
        <div class="chest-slot" data-slot="4"></div>
      </div>
    `;

    // refs
    this.battleBtn = this.tabElement.querySelector('#battle-main-btn');
    this.modeBtn = this.tabElement.querySelector('#battle-mode-btn');
    this.chestSlots = Array.from(this.tabElement.querySelectorAll('.chest-slot'));
  }

  /**
   * Setup events
   */
  setupEventListeners() {
    if (this.battleBtn) {
      this.battleBtn.addEventListener('click', () => {
        this.handleBattle();
      });
    }
    if (this.modeBtn) {
      this.modeBtn.addEventListener('click', () => {
        this.handleModeChange();
      });
    }
  }

  /**
   * Battle button handler
   */
  handleBattle() {
    if (this.isSearching) {
      this.cancelBattleSearch();
    } else {
      this.startBattleSearch();
    }
  }

  /**
   * Mode change handler
   */
  handleModeChange() {
    console.log('⚙️ Mode selection clicked');
    alert('Mode selection UI à implémenter');
  }

  /**
   * Start search
   */
  startBattleSearch() {
    this.isSearching = true;
    if (this.battleBtn) this.battleBtn.textContent = '❌ Annuler';
    this.emit('battle:search');
    console.log('🔍 Searching battle...');
  }

  /**
   * Cancel search
   */
  cancelBattleSearch() {
    this.isSearching = false;
    if (this.battleBtn) this.battleBtn.textContent = '⚔️ Combat';
    this.emit('battle:cancel');
    console.log('❌ Battle search cancelled');
  }

  /**
   * Show/hide
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
        try { cb(data); } catch (e) { console.error(e); }
      });
    }
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  /**
   * Cleanup
   */
  async cleanup() {
    console.log('🧹 Cleaning BattleTab');
    if (this.tabElement && this.tabElement.parentNode) {
      this.tabElement.parentNode.removeChild(this.tabElement);
    }
    this.battleBtn = null;
    this.modeBtn = null;
    this.chestSlots = [];
  }
}

export default BattleTab;
