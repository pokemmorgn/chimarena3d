
import TabNavigation from './components/TabNavigation';
import BattleTab from './tabs/BattleTab';
import styles from './styles';

/**
 * Clash Menu Manager - Gestionnaire principal du menu
 * Gère l'affichage/masquage des onglets et les fonctions globales
 */
class ClashMenuManager {
  constructor() {
    // Current state
    this.currentTab = 'battle';
    this.isInitialized = false;
    this.currentUser = null;
    
    // Components
    this.tabNavigation = null;
    this.battleTab = null;
    
    // HTML container
    this.mainContainer = null;
    
    // Connection status
    this.connectionStatus = 'disconnected';
    
    console.log('🎮 ClashMenuManager created');
  }

  /**
   * Initialize the menu manager
   */
  async initialize() {
    try {
      console.log('🎮 Initializing ClashMenuManager...');
      
      this.createMainContainer();
      this.injectStyles();
      
      // Initialize components
      this.tabNavigation = new TabNavigation();
      this.battleTab = new BattleTab();
      
      await this.tabNavigation.initialize(this.mainContainer);
      await this.battleTab.initialize(this.mainContainer);
      
      // Setup event listeners
      this.setupEventListeners();
      
      this.isInitialized = true;
      console.log('✅ ClashMenuManager initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize ClashMenuManager:', error);
      throw error;
    }
  }

  /**
   * Create main container
   */
createMainContainer() {
  const mobileViewport = document.getElementById('mobile-viewport');
  if (!mobileViewport) {
    console.warn('❌ mobile-viewport not found');
    return;
  }

  this.mainContainer = document.createElement('div');
  this.mainContainer.id = 'clash-menu-container';
  this.mainContainer.className = 'clash-menu-container';

  mobileViewport.appendChild(this.mainContainer);
}



  /**
   * Inject CSS styles
   */
  injectStyles() {
    // Remove existing styles
    const existingStyle = document.getElementById('clash-menu-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Create and inject new styles
    const styleSheet = document.createElement('style');
    styleSheet.id = 'clash-menu-styles';
    styleSheet.textContent = styles.getCSS();
    document.head.appendChild(styleSheet);
    
    console.log('🎨 Styles injected');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Tab navigation events
    if (this.tabNavigation) {
      this.tabNavigation.on('tab:changed', (tabName) => {
        this.switchTab(tabName);
      });
    }
    
    // Battle tab events
    if (this.battleTab) {
      this.battleTab.on('battle:search', () => {
        this.handleBattleSearch();
      });
      
      this.battleTab.on('battle:cancel', () => {
        this.handleBattleCancel();
      });
    }
  }

  /**
   * Activate the menu
   */
  async activate(user) {
    if (!this.isInitialized) {
      console.warn('ClashMenuManager not initialized');
      return;
    }
    
    this.currentUser = user;
    
    // Show main container
    if (this.mainContainer) {
      this.mainContainer.style.display = 'block';
    }
    
    // Activate components
    if (this.tabNavigation) {
      this.tabNavigation.activate();
    }
    
    // Show battle tab by default
    this.showBattleTab();
    
    // Update with user data
    if (this.battleTab && user) {
      this.battleTab.updatePlayerData(user);
    }
    
    console.log('⚔️ ClashMenuManager activated');
  }

  /**
   * Deactivate the menu
   */
  deactivate() {
    // Hide main container
    if (this.mainContainer) {
      this.mainContainer.style.display = 'none';
    }
    
    // Deactivate components
    if (this.tabNavigation) {
      this.tabNavigation.deactivate();
    }
    
    if (this.battleTab) {
      this.battleTab.deactivate();
    }
    
    console.log('⚔️ ClashMenuManager deactivated');
  }

  /**
   * Switch to a specific tab
   */
  switchTab(tabName) {
    console.log(`🔄 Switching to tab: ${tabName}`);
    
    // Hide all tabs
    this.hideAllTabs();
    
    // Show requested tab
    switch (tabName) {
      case 'battle':
        this.showBattleTab();
        break;
      case 'cards':
        this.showComingSoon('Cards');
        break;
      case 'clan':
        this.showComingSoon('Clan');
        break;
      case 'shop':
        this.showComingSoon('Shop');
        break;
      default:
        console.warn(`Unknown tab: ${tabName}`);
        this.showBattleTab(); // Fallback to battle
    }
    
    this.currentTab = tabName;
  }

  /**
   * Show battle tab
   */
  showBattleTab() {
    if (this.battleTab) {
      this.battleTab.show();
    }
    
    // Update navigation
    if (this.tabNavigation) {
      this.tabNavigation.setActiveTab('battle');
    }
  }

  /**
   * Hide all tabs
   */
  hideAllTabs() {
    if (this.battleTab) {
      this.battleTab.hide();
    }
    
    // Hide coming soon message
    this.hideComingSoon();
  }

  /**
   * Show coming soon message
   */
  showComingSoon(tabName) {
    this.hideComingSoon();
    
    const comingSoonDiv = document.createElement('div');
    comingSoonDiv.id = 'coming-soon-message';
    comingSoonDiv.className = 'coming-soon-message';
    comingSoonDiv.innerHTML = `
      <div class="coming-soon-content">
        <h2>🚧 ${tabName} Coming Soon!</h2>
        <p>This feature is under development.</p>
        <button onclick="document.getElementById('clash-menu-manager').switchTab('battle')" class="back-to-battle-btn">
          Back to Battle
        </button>
      </div>
    `;
    
    this.mainContainer.appendChild(comingSoonDiv);
  }

  /**
   * Hide coming soon message
   */
  hideComingSoon() {
    const existing = document.getElementById('coming-soon-message');
    if (existing) {
      existing.remove();
    }
  }

  /**
   * Show connection status
   */
  showConnectionStatus(message, status) {
    this.connectionStatus = status;
    
    // Update battle tab if available
    if (this.battleTab) {
      this.battleTab.updateConnectionStatus(message, status);
    }
    
    console.log(`🔌 Connection status: ${status} - ${message}`);
  }

  /**
   * Enable/disable battle features based on connection
   */
  enableBattleFeatures(enabled) {
    if (this.battleTab) {
      this.battleTab.enableBattleFeatures(enabled);
    }
  }

  /**
   * Update player data
   */
  updatePlayerData(playerData) {
    this.currentUser = { ...this.currentUser, ...playerData };
    
    if (this.battleTab) {
      this.battleTab.updatePlayerData(this.currentUser);
    }
  }

  /**
   * Handle world state changes
   */
  handleWorldStateChange(state) {
    // Update battle tab with world state
    if (this.battleTab) {
      this.battleTab.handleWorldStateChange(state);
    }
  }

  /**
   * Handle battle found
   */
  handleBattleFound(battleData) {
    console.log('⚔️ Battle found in manager:', battleData);
    
    if (this.battleTab) {
      this.battleTab.handleBattleFound(battleData);
    }
  }

  /**
   * Handle battle cancelled
   */
  handleBattleCancelled(data) {
    console.log('❌ Battle cancelled in manager:', data);
    
    if (this.battleTab) {
      this.battleTab.handleBattleCancelled(data);
    }
  }

  /**
   * Event handlers for battle actions
   */
  handleBattleSearch() {
    console.log('🔍 Battle search initiated');
    
    // TODO: Send battle search request to WorldRoom
    // this.worldRoom.send('search_battle', { mode: 'ladder' });
    
    // For now, show searching state
    this.showConnectionStatus('Searching for opponent...', 'searching');
  }

  handleBattleCancel() {
    console.log('❌ Battle search cancelled');
    
    // TODO: Send cancel request to WorldRoom
    // this.worldRoom.send('cancel_battle_search', {});
    
    this.showConnectionStatus('Connected to game world', 'connected');
  }

  /**
   * Get current tab
   */
  getCurrentTab() {
    return this.currentTab;
  }

  /**
   * Check if manager is ready
   */
  isReady() {
    return this.isInitialized && this.mainContainer;
  }

  /**
   * Cleanup and dispose
   */
  async cleanup() {
    console.log('🧹 Cleaning up ClashMenuManager...');
    
    // Cleanup components
    if (this.battleTab) {
      await this.battleTab.cleanup();
    }
    
    if (this.tabNavigation) {
      await this.tabNavigation.cleanup();
    }
    
    // Remove main container
    if (this.mainContainer && this.mainContainer.parentNode) {
      this.mainContainer.parentNode.removeChild(this.mainContainer);
    }
    
    // Remove styles
    const styleSheet = document.getElementById('clash-menu-styles');
    if (styleSheet) {
      styleSheet.remove();
    }
    
    this.isInitialized = false;
    
    console.log('✅ ClashMenuManager cleaned up');
  }
}

export default ClashMenuManager;
