// Dans client/src/clashmenu/index.js

import TabNavigation from './components/TabNavigation';
import BattleTab from './tabs/BattleTab';
import CardsTab from './tabs/CardsTab'; // ✅ Ajouter l'import
import CardsTabStyles from './tabs/CardsTabStyles'; // ✅ Ajouter les styles
import styles from './styles';
import Header from './components/Header.js';
import ProfileOverlay from './components/ProfileOverlay.js';
import ProfileOverlayStyles from './components/ProfileOverlayStyles.js';

class ClashMenuManager {
  constructor() {
    // Current state
    this.currentTab = 'battle';
    this.isInitialized = false;
    this.currentUser = null;
    
    // Components
    this.tabNavigation = null;
    this.battleTab = null;
    this.cardsTab = null; // ✅ Ajouter la référence
    this.header = null;
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
      
      // Create header
      this.header = new Header();
      const headerEl = this.header.create();
      this.mainContainer.appendChild(headerEl);
      
      // Initialize components
      this.tabNavigation = new TabNavigation();
      this.battleTab = new BattleTab();
      this.cardsTab = new CardsTab(); // ✅ Initialiser CardsTab
      
      await this.tabNavigation.initialize(this.mainContainer);
      await this.battleTab.initialize(this.mainContainer);
      await this.cardsTab.initialize(this.mainContainer); // ✅ Initialiser CardsTab

      this.profileOverlay = new ProfileOverlay();
      this.profileOverlay.initialize(this.mainContainer);

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
      styles.getCSS() + 
      "\n" + ProfileOverlayStyles.getCSS() + 
      "\n" + CardsTabStyles.getCSS(); // ✅ Ajouter les styles Cards
    document.head.appendChild(styleSheet);

    console.log('🎨 Styles injected (with ProfileOverlay and Cards)');
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
      
      this.battleTab.on('player:open-profile', () => {
        if (this.profileOverlay) {
          this.profileOverlay.open(this.currentUser);
        }
      });
    }

    // ✅ Cards tab events (pour le futur)
    if (this.cardsTab) {
      this.cardsTab.on('cards:action', (data) => {
        console.log('Cards action:', data);
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
      // ✅ Activer l'onglet Cards dans la navigation
      this.tabNavigation.setTabEnabled('cards', true);
    }
    
    // Show battle tab by default
    this.showBattleTab();
    
    // Update with user data
    if (this.battleTab && user) {
      this.battleTab.updatePlayerData(user);
    }
    if (this.cardsTab && user) { // ✅ Mettre à jour CardsTab
      this.cardsTab.updatePlayerData(user);
    }
    if (this.header && user) {
      this.header.updatePlayerData(user);
    }
    
    console.log('⚔️ ClashMenuManager activated');
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
      case 'cards': // ✅ Ajouter le case pour Cards
        this.showCardsTab();
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
   * Show cards tab
   */
  showCardsTab() {
    if (this.cardsTab) {
      this.cardsTab.show();
    }
    
    // Update navigation
    if (this.tabNavigation) {
      this.tabNavigation.setActiveTab('cards');
    }
    
    console.log('🃏 Cards tab shown');
  }

  /**
   * Hide all tabs
   */
  hideAllTabs() {
    if (this.battleTab) {
      this.battleTab.hide();
    }
    if (this.cardsTab) { // ✅ Cacher CardsTab
      this.cardsTab.hide();
    }
    
    // Hide coming soon message
    this.hideComingSoon();
  }

  /**
   * Update player data
   */
  updatePlayerData(playerData) {
    this.currentUser = { ...this.currentUser, ...playerData };
    
    if (this.battleTab) {
      this.battleTab.updatePlayerData(this.currentUser);
    }
    if (this.cardsTab) { // ✅ Mettre à jour CardsTab
      this.cardsTab.updatePlayerData(this.currentUser);
    }
    if (this.header) {
      this.header.updatePlayerData(this.currentUser);
    }
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
    if (this.cardsTab) { // ✅ Cleanup CardsTab
      await this.cardsTab.cleanup();
    }
    if (this.tabNavigation) {
      await this.tabNavigation.cleanup();
    }
    if (this.header) {
      this.header.cleanup();
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
