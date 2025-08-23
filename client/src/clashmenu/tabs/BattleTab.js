/**
 * Battle Tab - Interface de bataille principale (style Clash Royale)
 * Gère les modes de bataille, recherche d'opponent, stats joueur
 */
class BattleTab {
  constructor() {
    this.isActive = false;
    this.isSearching = false;
    this.currentUser = null;
    
    // HTML elements
    this.container = null;
    this.tabElement = null;
    this.connectionStatus = null;
    this.battleButtons = new Map();
    
    // Event system
    this.eventListeners = new Map();
    
    // Battle modes configuration
    this.battleModes = [
      {
        id: 'ladder',
        title: 'Ladder',
        icon: '🏆',
        description: 'Climb the trophy road!',
        enabled: true
      },
      {
        id: 'training',
        title: 'Training',
        icon: '🎯',
        description: 'Practice your skills',
        enabled: true
      },
      {
        id: 'challenge',
        title: 'Challenges',
        icon: '⚡',
        description: 'Special events',
        enabled: false
      }
    ];
    
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
      this.createHeader();
      this.createConnectionStatus();
      this.createBattleButtons();
      this.createBattleModes();
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
    console.log('⚔️ Tab element created');
  }

  /**
   * Create header with player stats
   */
  createHeader() {
    const header = document.createElement('div');
    header.className = 'battle-header';
    header.innerHTML = `
      <div class="player-name" id="battle-player-name">Loading...</div>
      
      <div class="player-stats">
        <div class="stat-item">
          <span class="stat-value" id="battle-trophies">0</span>
          <span class="stat-label">Trophies</span>
        </div>
        
        <div class="stat-item">
          <span class="stat-value" id="battle-level">1</span>
          <span class="stat-label">Level</span>
        </div>
        
        <div class="stat-item">
          <span class="stat-value" id="battle-wins">0</span>
          <span class="stat-label">Wins</span>
        </div>
      </div>
    `;
    
    this.tabElement.appendChild(header);
    console.log('⚔️ Header created');
  }

  /**
   * Create connection status indicator
   */
  createConnectionStatus() {
    this.connectionStatus = document.createElement('div');
    this.connectionStatus.className = 'connection-status connecting';
    this.connectionStatus.id = 'battle-connection-status';
    this.connectionStatus.textContent = 'Connecting to game server...';
    
    this.tabElement.appendChild(this.connectionStatus);
    console.log('⚔️ Connection status created');
  }

  /**
   * Create main battle buttons
   */
  createBattleButtons() {
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'battle-buttons';
    buttonsContainer.innerHTML = `
      <button class="battle-button primary" id="battle-btn-main">
        ⚔️ Battle!
      </button>
      
      <button class="battle-button secondary" id="battle-btn-training">
        🎯 Training Camp
      </button>
      
      <button class="battle-button tertiary" id="battle-btn-challenge" disabled>
        ⚡ Challenges (Soon)
      </button>
    `;
    
    // Store button references
    this.battleButtons.set('main', buttonsContainer.querySelector('#battle-btn-main'));
    this.battleButtons.set('training', buttonsContainer.querySelector('#battle-btn-training'));
    this.battleButtons.set('challenge', buttonsContainer.querySelector('#battle-btn-challenge'));
    
    this.tabElement.appendChild(buttonsContainer);
    console.log('⚔️ Battle buttons created');
  }

  /**
   * Create battle modes section
   */
  createBattleModes() {
    const modesSection = document.createElement('div');
    modesSection.innerHTML = `
      <div class="battle-modes" id="battle-modes-container">
        ${this.battleModes.map(mode => `
          <div class="battle-mode-card ${mode.enabled ? '' : 'disabled'}" 
               data-mode="${mode.id}">
            <span class="battle-mode-icon">${mode.icon}</span>
            <div class="battle-mode-title">${mode.title}</div>
            <div class="battle-mode-desc">${mode.description}</div>
          </div>
        `).join('')}
      </div>
    `;
    
    this.tabElement.appendChild(modesSection);
    console.log('⚔️ Battle modes created');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Main battle button
    const mainButton = this.battleButtons.get('main');
    if (mainButton) {
      mainButton.addEventListener('click', () => {
        this.handleMainBattle();
      });
    }
    
    // Training button
    const trainingButton = this.battleButtons.get('training');
    if (trainingButton) {
      trainingButton.addEventListener('click', () => {
        this.handleTrainingBattle();
      });
    }
    
    // Challenge button
    const challengeButton = this.battleButtons.get('challenge');
    if (challengeButton) {
      challengeButton.addEventListener('click', () => {
        this.handleChallengeBattle();
      });
    }
    
    // Battle mode cards
    const modeCards = this.tabElement.querySelectorAll('.battle-mode-card');
    modeCards.forEach(card => {
      card.addEventListener('click', () => {
        const mode = card.dataset.mode;
        this.handleModeSelection(mode);
      });
    });
    
    console.log('⚔️ Event listeners setup');
  }

  /**
   * Update player data in the header
   */
  updatePlayerData(user) {
    if (!user) return;
    
    this.currentUser = user;
    
    // Update player name
    const nameElement = document.getElementById('battle-player-name');
    if (nameElement) {
      nameElement.textContent = user.displayName || user.username || 'Player';
    }
    
    // Update stats
    const trophiesElement = document.getElementById('battle-trophies');
    if (trophiesElement) {
      trophiesElement.textContent = user.trophies || 0;
    }
    
    const levelElement = document.getElementById('battle-level');
    if (levelElement) {
      levelElement.textContent = user.level || 1;
    }
    
    const winsElement = document.getElementById('battle-wins');
    if (winsElement) {
      winsElement.textContent = user.wins || 0;
    }
    
    console.log('⚔️ Player data updated');
  }

  /**
   * Update connection status
   */
  updateConnectionStatus(message, status) {
    if (!this.connectionStatus) return;
    
    // Remove existing status classes
    this.connectionStatus.classList.remove('connected', 'connecting', 'error', 'searching');
    
    // Add new status class
    this.connectionStatus.classList.add(status);
    this.connectionStatus.textContent = message;
    
    console.log(`⚔️ Connection status updated: ${status} - ${message}`);
  }

  /**
   * Enable/disable battle features
   */
  enableBattleFeatures(enabled) {
    const mainButton = this.battleButtons.get('main');
    const trainingButton = this.battleButtons.get('training');
    
    if (mainButton) {
      mainButton.disabled = !enabled;
      if (enabled) {
        mainButton.textContent = '⚔️ Battle!';
      } else {
        mainButton.textContent = '🔌 Connecting...';
      }
    }
    
    if (trainingButton) {
      trainingButton.disabled = !enabled;
    }
    
    // Update mode cards
    const enabledModeCards = this.tabElement.querySelectorAll('.battle-mode-card:not(.disabled)');
    enabledModeCards.forEach(card => {
      if (enabled) {
        card.style.opacity = '1';
        card.style.cursor = 'pointer';
      } else {
        card.style.opacity = '0.5';
        card.style.cursor = 'not-allowed';
      }
    });
    
    console.log(`⚔️ Battle features ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Handle world state changes
   */
  handleWorldStateChange(state) {
    // Update UI based on world state
    if (state.playersOnline !== undefined) {
      this.updateOnlineCount(state.playersOnline);
    }
    
    if (state.matchmakingQueue !== undefined) {
      this.updateQueueInfo(state.matchmakingQueue);
    }
  }

  /**
   * Update online players count
   */
  updateOnlineCount(count) {
    // Add online count to connection status if connected
    if (this.connectionStatus && this.connectionStatus.classList.contains('connected')) {
      this.connectionStatus.textContent = `Connected • ${count} players online`;
    }
  }

  /**
   * Update matchmaking queue info
   */
  updateQueueInfo(queueData) {
    // Show queue information if searching
    if (this.isSearching && queueData.estimated_wait) {
      this.updateConnectionStatus(
        `Searching... (~${queueData.estimated_wait}s)`, 
        'searching'
      );
    }
  }

  /**
   * Battle event handlers
   */
  handleMainBattle() {
    if (this.isSearching) {
      this.cancelBattleSearch();
    } else {
      this.startBattleSearch('ladder');
    }
  }

  handleTrainingBattle() {
    console.log('⚔️ Training battle requested');
    alert('Training mode coming soon! Practice against AI opponents.');
  }

  handleChallengeBattle() {
    console.log('⚔️ Challenge battle requested');
    alert('Challenges coming soon! Special events and tournaments.');
  }

  handleModeSelection(mode) {
    const modeConfig = this.battleModes.find(m => m.id === mode);
    if (!modeConfig) return;
    
    if (!modeConfig.enabled) {
      alert(`${modeConfig.title} mode coming soon!`);
      return;
    }
    
    console.log(`⚔️ Battle mode selected: ${mode}`);
    this.startBattleSearch(mode);
  }

  /**
   * Start battle search
   */
  startBattleSearch(mode = 'ladder') {
    if (this.isSearching) return;
    
    this.isSearching = true;
    
    // Update UI to searching state
    const mainButton = this.battleButtons.get('main');
    if (mainButton) {
      mainButton.textContent = '❌ Cancel Search';
      mainButton.classList.remove('primary');
      mainButton.classList.add('secondary');
    }
    
    this.updateConnectionStatus('Searching for opponent...', 'searching');
    
    // Emit search event
    this.emit('battle:search', { mode });
    
    console.log(`⚔️ Battle search started for mode: ${mode}`);
  }

  /**
   * Cancel battle search
   */
  cancelBattleSearch() {
    if (!this.isSearching) return;
    
    this.isSearching = false;
    
    // Update UI back to normal state
    const mainButton = this.battleButtons.get('main');
    if (mainButton) {
      mainButton.textContent = '⚔️ Battle!';
      mainButton.classList.remove('secondary');
      mainButton.classList.add('primary');
    }
    
    this.updateConnectionStatus('Connected to game world', 'connected');
    
    // Emit cancel event
    this.emit('battle:cancel');
    
    console.log('⚔️ Battle search cancelled');
  }

  /**
   * Handle battle found from server
   */
  handleBattleFound(battleData) {
    this.isSearching = false;
    
    // Update UI
    this.updateConnectionStatus('Battle found! Loading...', 'connected');
    
    const mainButton = this.battleButtons.get('main');
    if (mainButton) {
      mainButton.textContent = '🔄 Loading Battle...';
      mainButton.disabled = true;
    }
    
    console.log('⚔️ Battle found:', battleData);
    
    // TODO: Transition to battle scene
    setTimeout(() => {
      alert(`Battle found!\nOpponent: ${battleData.opponent?.username || 'Unknown'}\nMode: ${battleData.mode || 'ladder'}`);
      
      // Reset UI
      if (mainButton) {
        mainButton.textContent = '⚔️ Battle!';
        mainButton.disabled = false;
      }
      this.updateConnectionStatus('Connected to game world', 'connected');
    }, 2000);
  }

  /**
   * Handle battle cancelled from server
   */
  handleBattleCancelled(data) {
    this.isSearching = false;
    
    // Reset UI
    const mainButton = this.battleButtons.get('main');
    if (mainButton) {
      mainButton.textContent = '⚔️ Battle!';
      mainButton.classList.remove('secondary');
      mainButton.classList.add('primary');
    }
    
    this.updateConnectionStatus('Connected to game world', 'connected');
    
    console.log('⚔️ Battle cancelled by server:', data);
  }

  /**
   * Show/hide tab
   */
  show() {
    if (this.tabElement) {
      this.tabElement.classList.add('active');
      this.isActive = true;
      
      // Animate entrance
      this.animateEntrance();
    }
    
    console.log('⚔️ BattleTab shown');
  }

  hide() {
    if (this.tabElement) {
      this.tabElement.classList.remove('active');
      this.isActive = false;
    }
    
    console.log('⚔️ BattleTab hidden');
  }

  /**
   * Animate tab entrance
   */
  animateEntrance() {
    if (!this.tabElement) return;
    
    // Fade in animation
    this.tabElement.style.opacity = '0';
    this.tabElement.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      this.tabElement.style.transition = 'all 0.5s ease-out';
      this.tabElement.style.opacity = '1';
      this.tabElement.style.transform = 'translateY(0)';
    }, 100);
    
    // Animate battle buttons with stagger
    const buttons = this.tabElement.querySelectorAll('.battle-button');
    buttons.forEach((button, index) => {
      button.style.opacity = '0';
      button.style.transform = 'translateX(-30px)';
      
      setTimeout(() => {
        button.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        button.style.opacity = '1';
        button.style.transform = 'translateX(0)';
      }, 200 + (index * 100));
    });
    
    // Animate mode cards
    const modeCards = this.tabElement.querySelectorAll('.battle-mode-card');
    modeCards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'scale(0.8) translateY(20px)';
      
      setTimeout(() => {
        card.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        card.style.opacity = '1';
        card.style.transform = 'scale(1) translateY(0)';
      }, 400 + (index * 150));
    });
  }

  /**
   * Deactivate tab
   */
  deactivate() {
    // Cancel any ongoing battle search
    if (this.isSearching) {
      this.cancelBattleSearch();
    }
    
    this.hide();
    console.log('⚔️ BattleTab deactivated');
  }

  /**
   * Event system methods
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in BattleTab event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Cleanup and dispose
   */
  async cleanup() {
    console.log('🧹 Cleaning up BattleTab...');
    
    // Cancel battle search if active
    if (this.isSearching) {
      this.cancelBattleSearch();
    }
    
    // Remove event listeners
    this.eventListeners.clear();
    
    // Remove DOM elements
    if (this.tabElement && this.tabElement.parentNode) {
      this.tabElement.parentNode.removeChild(this.tabElement);
    }
    
    // Clear references
    this.battleButtons.clear();
    this.container = null;
    this.tabElement = null;
    this.connectionStatus = null;
    
    console.log('✅ BattleTab cleaned up');
  }
}

export default BattleTab;
