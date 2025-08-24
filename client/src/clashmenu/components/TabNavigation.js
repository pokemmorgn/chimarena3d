/**
 * Tab Navigation - Système de navigation par onglets (style Clash Royale)
 * Gère les onglets du bas avec animations et états
 */
class TabNavigation {
  constructor() {
    this.currentTab = 'battle';
    this.isActive = false;
    
    // HTML elements
    this.container = null;
    this.navElement = null;
    this.tabButtons = new Map();
    
    // Event system
    this.eventListeners = new Map();
    
    // Tab configuration
    this.tabs = [
      {
        id: 'battle',
        label: 'Battle',
        icon: '⚔️',
        enabled: true,
        comingSoon: false
      },
      {
        id: 'cards',
        label: 'Cards',
        icon: '🃏',
        enabled: true,  // ✅ Changer de false à true
        comingSoon: false // ✅ Changer de true à false
      },
      {
        id: 'clan',
        label: 'Clan',
        icon: '🏰',
        enabled: false,
        comingSoon: true
      },
      {
        id: 'shop',
        label: 'Shop',
        icon: '🛒',
        enabled: false,
        comingSoon: true
      }
    ];
    
    console.log('📱 TabNavigation created');
  }

  /**
   * Initialize tab navigation
   */
  async initialize(container) {
    if (!container) {
      throw new Error('Container is required for TabNavigation');
    }
    
    this.container = container;
    
    try {
      console.log('📱 Initializing TabNavigation...');
      
      this.createNavigation();
      this.createTabButtons();
      this.setupEventListeners();
      this.setActiveTab('battle');
      
      console.log('✅ TabNavigation initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize TabNavigation:', error);
      throw error;
    }
  }

  /**
   * Create navigation container
   */
  createNavigation() {
    this.navElement = document.createElement('div');
    this.navElement.className = 'tab-navigation';
    this.navElement.id = 'clash-tab-navigation';
    
    this.container.appendChild(this.navElement);
    console.log('📱 Navigation container created');
  }

  /**
   * Create tab buttons
   */
  createTabButtons() {
    this.tabs.forEach(tab => {
      const button = this.createTabButton(tab);
      this.tabButtons.set(tab.id, button);
      this.navElement.appendChild(button);
    });
    
    console.log('📱 Tab buttons created');
  }

  /**
   * Create individual tab button
   */
  createTabButton(tab) {
    const button = document.createElement('button');
    button.className = `tab-button ${tab.enabled ? '' : 'disabled'}`;
    button.id = `tab-${tab.id}`;
    button.dataset.tab = tab.id;
    
    // Button content
    button.innerHTML = `
      <span class="tab-icon">${tab.icon}</span>
      <span class="tab-label">${tab.label}</span>
      ${tab.comingSoon ? '<span class="tab-coming-soon">Soon</span>' : ''}
    `;
    
    // Add click handler
    if (tab.enabled) {
      button.addEventListener('click', () => {
        this.handleTabClick(tab.id);
      });
    } else {
      button.addEventListener('click', () => {
        this.handleDisabledTabClick(tab.id);
      });
    }
    
    return button;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Add ripple effect on click
    this.navElement.addEventListener('click', (event) => {
      if (event.target.closest('.tab-button') && !event.target.closest('.tab-button').classList.contains('disabled')) {
        this.createRippleEffect(event);
      }
    });
    
    console.log('📱 Event listeners setup');
  }

  /**
   * Create ripple effect on button click
   */
  createRippleEffect(event) {
    const button = event.target.closest('.tab-button');
    if (!button) return;
    
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    `;
    
    // Add ripple animation if not exists
    if (!document.querySelector('#ripple-animation')) {
      const style = document.createElement('style');
      style.id = 'ripple-animation';
      style.textContent = `
        @keyframes ripple {
          to {
            transform: scale(2);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  /**
   * Handle tab click
   */
  handleTabClick(tabId) {
    if (this.currentTab === tabId) return;
    
    console.log(`📱 Tab clicked: ${tabId}`);
    
    this.setActiveTab(tabId);
    this.emit('tab:changed', tabId);
  }

  /**
   * Handle disabled tab click
   */
  handleDisabledTabClick(tabId) {
    const tab = this.tabs.find(t => t.id === tabId);
    console.log(`📱 Disabled tab clicked: ${tabId}`);
    
    // Show coming soon message or notification
    this.showTabNotification(tab);
  }

  /**
   * Show notification for disabled tabs
   */
  showTabNotification(tab) {
    // Remove existing notification
    const existingNotification = document.getElementById('tab-notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.id = 'tab-notification';
    notification.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 152, 0, 0.9);
      color: white;
      padding: 15px 25px;
      border-radius: 25px;
      font-weight: bold;
      font-size: 14px;
      z-index: 10001;
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255, 152, 0, 0.3);
      animation: slideUp 0.3s ease-out;
    `;
    
    notification.textContent = `${tab.icon} ${tab.label} coming soon!`;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Auto remove after 2 seconds
    setTimeout(() => {
      notification.style.animation = 'slideUp 0.3s ease-out reverse';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
        style.remove();
      }, 300);
    }, 2000);
  }

  /**
   * Set active tab
   */
  setActiveTab(tabId) {
    // Remove active class from all buttons
    this.tabButtons.forEach((button, id) => {
      button.classList.remove('active');
      
      // Add animation class
      if (id === tabId) {
        button.classList.add('active');
        this.animateTabSelection(button);
      }
    });
    
    this.currentTab = tabId;
    console.log(`📱 Active tab set to: ${tabId}`);
  }

  /**
   * Animate tab selection
   */
  animateTabSelection(button) {
    // Add selection animation
    button.style.transform = 'translateY(-5px) scale(1.1)';
    button.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    
    setTimeout(() => {
      button.style.transform = 'translateY(-3px) scale(1)';
    }, 200);
  }

  /**
   * Enable/disable tab
   */
  setTabEnabled(tabId, enabled) {
    const tab = this.tabs.find(t => t.id === tabId);
    const button = this.tabButtons.get(tabId);
    
    if (tab && button) {
      tab.enabled = enabled;
      
      if (enabled) {
        button.classList.remove('disabled');
        button.addEventListener('click', () => this.handleTabClick(tabId));
      } else {
        button.classList.add('disabled');
        if (this.currentTab === tabId) {
          this.setActiveTab('battle'); // Fallback to battle tab
        }
      }
    }
  }

  /**
   * Update tab badge (for notifications, etc.)
   */
  updateTabBadge(tabId, count) {
    const button = this.tabButtons.get(tabId);
    if (!button) return;
    
    // Remove existing badge
    const existingBadge = button.querySelector('.tab-badge');
    if (existingBadge) {
      existingBadge.remove();
    }
    
    // Add new badge if count > 0
    if (count > 0) {
      const badge = document.createElement('span');
      badge.className = 'tab-badge';
      badge.textContent = count > 99 ? '99+' : count.toString();
      badge.style.cssText = `
        position: absolute;
        top: 5px;
        right: 8px;
        background: #f44336;
        color: white;
        border-radius: 10px;
        min-width: 18px;
        height: 18px;
        font-size: 10px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #fff;
        animation: bounce 0.5s ease-out;
      `;
      
      button.style.position = 'relative';
      button.appendChild(badge);
    }
  }

  /**
   * Activate navigation
   */
  activate() {
    this.isActive = true;
    
    if (this.navElement) {
      this.navElement.style.display = 'flex';
      
      // Animate entrance
      this.navElement.style.transform = 'translateY(100%)';
      setTimeout(() => {
        this.navElement.style.transition = 'transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        this.navElement.style.transform = 'translateY(0)';
      }, 100);
    }
    
    console.log('📱 TabNavigation activated');
  }

  /**
   * Deactivate navigation
   */
  deactivate() {
    this.isActive = false;
    
    if (this.navElement) {
      this.navElement.style.transform = 'translateY(100%)';
      setTimeout(() => {
        this.navElement.style.display = 'none';
        this.navElement.style.transition = '';
        this.navElement.style.transform = '';
      }, 500);
    }
    
    console.log('📱 TabNavigation deactivated');
  }

  /**
   * Get current tab
   */
  getCurrentTab() {
    return this.currentTab;
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
          console.error(`Error in TabNavigation event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Cleanup and dispose
   */
  async cleanup() {
    console.log('🧹 Cleaning up TabNavigation...');
    
    // Remove event listeners
    this.eventListeners.clear();
    
    // Remove DOM elements
    if (this.navElement && this.navElement.parentNode) {
      this.navElement.parentNode.removeChild(this.navElement);
    }
    
    // Clear references
    this.tabButtons.clear();
    this.container = null;
    this.navElement = null;
    
    console.log('✅ TabNavigation cleaned up');
  }
}

export default TabNavigation;
