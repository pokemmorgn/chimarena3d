
import TabNavigation from './components/TabNavigation';
import BattleTab from './tabs/BattleTab';
import styles from './styles';
import Header from './components/Header.js';
import ProfileOverlay from './components/ProfileOverlay.js';
import ProfileOverlayStyles from './components/ProfileOverlayStyles.js';

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
    this.header = null; // ✅ nouveau
this.profileOverlay = null;

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
      this.header = new Header();
const headerEl = this.header.create();
this.mainContainer.appendChild(headerEl);
      // Initialize components
      this.tabNavigation = new TabNavigation();
      this.battleTab = new BattleTab();
      
      await this.tabNavigation.initialize(this.mainContainer);
      await this.battleTab.initialize(this.mainContainer);

      this.profileOverlay = new ProfileOverlay();
this.profileOverlay.initialize(this.mainContainer);

// quand l’overlay émet un update → on peut mettre à jour les données du joueur
this.profileOverlay.on("profile:update", (data) => {
  console.log("✅ Profile updated:", data);
  // ici tu envoies au serveur pour save en DB
  this.updatePlayerData(data);
});
      
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
  const host = document.getElementById('mobile-viewport');
  if (!host) {
    throw new Error('#mobile-viewport introuvable');
  }

  this.mainContainer = document.createElement('div');
  this.mainContainer.id = 'clash-menu-container';
  this.mainContainer.className = 'clash-menu-container';

  // Couche UI par-dessus le canvas (z-index: 5 sur le canvas), mais sous la status bar (z-index: 1000)
  Object.assign(this.mainContainer.style, {
    position: 'absolute',
    inset: '44px 0 0 0', // 44px = hauteur de la status bar simulée
    zIndex: '20',
    pointerEvents: 'auto',
  });

  host.appendChild(this.mainContainer);
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
  styleSheet.textContent = 
    styles.getCSS() + "\n" + ProfileOverlayStyles.getCSS(); // ✅ merge
  document.head.appendChild(styleSheet);

  console.log('🎨 Styles injected (with ProfileOverlay)');
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
       // ✅ Ouvrir l'overlay profil quand on clique sur edit
  this.battleTab.on('player:open-profile', () => {
    if (this.profileOverlay) {
      this.profileOverlay.open(this.currentUser);
    }
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
if (this.header && user) {
  this.header.updatePlayerData(user);
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
    if (this.header) {
  this.header.cleanup();
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
