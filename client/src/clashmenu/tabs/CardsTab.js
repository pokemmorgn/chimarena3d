/**
 * Cards Tab - Onglet des cartes (base simple)
 * Utilise seulement le Header.js, pas de bannière
 */
class CardsTab {
  constructor() {
    this.isActive = false;
    this.currentUser = null;
    
    // DOM elements
    this.container = null;
    this.tabElement = null;
    
    // Event system
    this.eventListeners = new Map();
  }

  /**
   * Initialize cards tab
   */
  async initialize(container) {
    if (!container) {
      throw new Error('Container is required for CardsTab');
    }
    
    this.container = container;
    
    try {
      console.log('🃏 Initializing CardsTab...');
      
      this.createTabElement();
      this.renderLayout();
      
      console.log('✅ CardsTab initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize CardsTab:', error);
      throw error;
    }
  }

  /**
   * Create tab element
   */
  createTabElement() {
    this.tabElement = document.createElement('div');
    this.tabElement.className = 'cards-tab';
    this.tabElement.id = 'cards-tab';
    
    this.container.appendChild(this.tabElement);
    console.log('🃏 Cards tab element created');
  }

  /**
   * Render layout (juste le Header.js sera utilisé)
   */
  renderLayout() {
    this.tabElement.innerHTML = `
      <!-- Contenu principal des cartes -->
      <div class="cards-main-content">
        <div class="cards-placeholder">
          <h2>🃏 Cards Collection</h2>
          <p>Coming soon...</p>
        </div>
      </div>
    `;

    console.log('🃏 Cards layout rendered');
  }

  /**
   * Update player data
   */
  updatePlayerData(user) {
    if (!user) return;
    this.currentUser = user;
    console.log('🃏 CardsTab player data updated:', user);
  }

  /**
   * Show tab
   */
  show() {
    if (this.tabElement) {
      this.tabElement.classList.add('active');
      this.isActive = true;
      console.log('🃏 CardsTab shown');
    }
  }

  /**
   * Hide tab
   */
  hide() {
    if (this.tabElement) {
      this.tabElement.classList.remove('active');
      this.isActive = false;
      console.log('🃏 CardsTab hidden');
    }
  }

  /**
   * Activate tab
   */
  activate() {
    this.show();
  }

  /**
   * Deactivate tab
   */
  deactivate() {
    this.hide();
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
          console.error(`Error in CardsTab event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Cleanup
   */
  async cleanup() {
    console.log('🧹 Cleaning up CardsTab...');
    
    // Clear event listeners
    this.eventListeners.clear();
    
    // Remove DOM elements
    if (this.tabElement && this.tabElement.parentNode) {
      this.tabElement.parentNode.removeChild(this.tabElement);
    }
    
    // Clear references
    this.container = null;
    this.tabElement = null;
    
    console.log('✅ CardsTab cleaned up');
  }
}

export default CardsTab;
