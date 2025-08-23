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
        enabled: false,
        comingSoon: true
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
   * Create navigation container (responsive)
   */
  createNavigation() {
    this.navElement = document.createElement('div');
    this.navElement.className = 'tab-navigation';
    this.navElement.id = 'clash-tab-navigation';
    
    // Add responsive attributes
    if (this.isMobile) {
      this.navElement.style.touchAction = 'manipulation';
      this.navElement.style.userSelect = 'none';
    }
    
    this.container.appendChild(this.navElement);
    console.log('📱 Responsive navigation container created');
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
   * Create individual tab button (mobile-optimized)
   */
  createTabButton(tab) {
    const button = document.createElement('button');
    button.className = `tab-button ${tab.enabled ? '' : 'disabled'}`;
    button.id = `tab-${tab.id}`;
    button.dataset.tab = tab.id;
    
    // Mobile optimization
    if (this.isMobile || this.hasTouch) {
      button.style.touchAction = 'manipulation';
      button.style.webkitTapHighlightColor = 'transparent';
      button.style.webkitUserSelect = 'none';
    }
    
    // Responsive button content
    const iconSize = window.innerWidth <= 480 ? '20px' : '22px';
    const labelSize = window.innerWidth <= 480 ? '10px' : '11px';
    const comingSoonSize = window.innerWidth <= 480 ? '8px' : '9px';
    
    // Button content
    button.innerHTML = `
      <span class="tab-icon" style="font-size: ${iconSize};">${tab.icon}</span>
      <span class="tab-label" style="font-size: ${labelSize};">${tab.label}</span>
      ${tab.comingSoon ? `<span class="tab-coming-soon" style="font-size: ${comingSoonSize};">Soon</span>` : ''}
    `;
    
    // Add click/touch handlers
    if (tab.enabled) {
      // Use both touch and click for better mobile support
      if (this.hasTouch) {
        button.addEventListener('touchstart', (e) => {
          this.handleTouchStart(e, tab.id);
        }, { passive: true });
        
        button.addEventListener('touchend', (e) => {
          this.handleTouchEnd(e, tab.id);
        }, { passive: true });
        
        button.addEventListener('touchcancel', (e) => {
          this.handleTouchCancel(e, tab.id);
        }, { passive: true });
      }
      
      // Click handler for mouse/keyboard
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleTabClick(tab.id);
      });
      
      // Keyboard support
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleTabClick(tab.id);
        }
      });
      
    } else {
      // Disabled tab handlers
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleDisabledTabClick(tab.id);
      });
      
      if (this.hasTouch) {
        button.addEventListener('touchend', (e) => {
          e.preventDefault();
          this.handleDisabledTabClick(tab.id);
        }, { passive: false });
      }
    }
    
    return button;
  }

  /**
   * Setup event listeners (mobile-optimized)
   */
  setupEventListeners() {
    // Responsive resize handler
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Orientation change handler for mobile
    if (this.isMobile) {
      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          this.handleOrientationChange();
        }, 100);
      });
    }
    
    // Enhanced ripple effect (mobile-friendly)
    this.navElement.addEventListener('click', (event) => {
      const tabButton = event.target.closest('.tab-button');
      if (tabButton && !tabButton.classList.contains('disabled')) {
        this.createEnhancedRippleEffect(event, tabButton);
      }
    });
    
    // Touch feedback for mobile
    if (this.hasTouch) {
      this.navElement.addEventListener('touchstart', (event) => {
        const tabButton = event.target.closest('.tab-button');
        if (tabButton && !tabButton.classList.contains('disabled')) {
          this.addTouchFeedback(tabButton);
        }
      }, { passive: true });
    }
    
    console.log('📱 Enhanced mobile event listeners setup');
  }

  /**
   * Enhanced mobile touch handlers
   */
  handleTouchStart(event, tabId) {
    const button = this.tabButtons.get(tabId);
    if (button) {
      button.dataset.touchStartTime = Date.now();
      button.style.transform = button.style.transform.replace('scale(1)', 'scale(0.95)');
    }
  }

  handleTouchEnd(event, tabId) {
    const button = this.tabButtons.get(tabId);
    if (button) {
      const touchStartTime = parseInt(button.dataset.touchStartTime) || 0;
      const touchDuration = Date.now() - touchStartTime;
      
      // Only trigger if it was a short touch (not a scroll)
      if (touchDuration < 500) {
        setTimeout(() => {
          this.handleTabClick(tabId);
        }, 50);
      }
      
      // Reset scale
      button.style.transform = button.style.transform.replace('scale(0.95)', 'scale(1)');
      delete button.dataset.touchStartTime;
    }
  }

  handleTouchCancel(event, tabId) {
    const button = this.tabButtons.get(tabId);
    if (button) {
      button.style.transform = button.style.transform.replace('scale(0.95)', 'scale(1)');
      delete button.dataset.touchStartTime;
    }
  }

  /**
   * Handle window resize for responsive behavior
   */
  handleResize() {
    // Update button sizes based on screen width
    this.tabButtons.forEach((button, tabId) => {
      const icon = button.querySelector('.tab-icon');
      const label = button.querySelector('.tab-label');
      const comingSoon = button.querySelector('.tab-coming-soon');
      
      if (window.innerWidth <= 360) {
        if (icon) icon.style.fontSize = '18px';
        if (label) label.style.fontSize = '9px';
        if (comingSoon) comingSoon.style.fontSize = '7px';
      } else if (window.innerWidth <= 480) {
        if (icon) icon.style.fontSize = '20px';
        if (label) label.style.fontSize = '10px';
        if (comingSoon) comingSoon.style.fontSize = '8px';
      } else {
        if (icon) icon.style.fontSize = '22px';
        if (label) label.style.fontSize = '11px';
        if (comingSoon) comingSoon.style.fontSize = '9px';
      }
    });
  }

  /**
   * Handle orientation change (mobile)
   */
  handleOrientationChange() {
    // Slight delay for orientation change to complete
    setTimeout(() => {
      this.handleResize();
      
      // Adjust navigation height for landscape on mobile
      if (window.innerHeight < 500 && window.innerWidth > window.innerHeight) {
        this.navElement.style.height = '60px';
      } else {
        this.navElement.style.height = this.isMobile ? '70px' : '80px';
      }
    }, 200);
  }

  /**
   * Add touch feedback for mobile
   */
  addTouchFeedback(button) {
    button.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    
    setTimeout(() => {
      button.style.backgroundColor = '';
    }, 150);
  }
  /**
   * Create enhanced ripple effect (mobile-optimized)
   */
  createEnhancedRippleEffect(event, button) {
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
      background: radial-gradient(circle, rgba(0, 188, 212, 0.6) 0%, rgba(0, 188, 212, 0.1) 70%, transparent 100%);
      border-radius: 50%;
      transform: scale(0);
      animation: rippleEffect 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      pointer-events: none;
      z-index: 1;
    `;
    
    // Enhanced animation for mobile
    const style = document.createElement('style');
    style.textContent = `
      @keyframes rippleEffect {
        0% {
          transform: scale(0);
          opacity: 1;
        }
        50% {
          transform: scale(0.8);
          opacity: 0.8;
        }
        100% {
          transform: scale(2);
          opacity: 0;
        }
      }
    `;
    
    if (!document.querySelector('#ripple-effect-animation')) {
      style.id = 'ripple-effect-animation';
      document.head.appendChild(style);
    }
    
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);
    
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.remove();
      }
    }, 800);
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
   * Show notification for disabled tabs (mobile-optimized)
   */
  showTabNotification(tab) {
    // Remove existing notification
    const existingNotification = document.getElementById('tab-notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // Create responsive notification
    const notification = document.createElement('div');
    notification.id = 'tab-notification';
    
    // Responsive positioning and sizing
    const isMobileView = window.innerWidth <= 768;
    const bottomOffset = isMobileView ? '85px' : '95px';
    const fontSize = isMobileView ? '12px' : '14px';
    const padding = isMobileView ? '12px 20px' : '15px 25px';
    
    notification.style.cssText = `
      position: fixed;
      bottom: ${bottomOffset};
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, rgba(255, 152, 0, 0.95), rgba(255, 152, 0, 0.85));
      color: white;
      padding: ${padding};
      border-radius: 25px;
      font-weight: bold;
      font-size: ${fontSize};
      z-index: 10002;
      backdrop-filter: blur(15px);
      border: 2px solid rgba(255, 152, 0, 0.4);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
      max-width: ${isMobileView ? '280px' : '320px'};
      text-align: center;
      animation: slideUpNotification 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      user-select: none;
    `;
    
    notification.textContent = `${tab.icon} ${tab.label} coming soon!`;
    
    // Enhanced animation for mobile
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideUpNotification {
        0% {
          opacity: 0;
          transform: translateX(-50%) translateY(30px) scale(0.8);
        }
        60% {
          opacity: 1;
          transform: translateX(-50%) translateY(-5px) scale(1.05);
        }
        100% {
          opacity: 1;
          transform: translateX(-50%) translateY(0) scale(1);
        }
      }
      
      @keyframes slideDownNotification {
        0% {
          opacity: 1;
          transform: translateX(-50%) translateY(0) scale(1);
        }
        100% {
          opacity: 0;
          transform: translateX(-50%) translateY(20px) scale(0.9);
        }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Add touch interaction for mobile
    if (this.hasTouch) {
      notification.addEventListener('touchstart', () => {
        notification.style.transform = 'translateX(-50%) translateY(0) scale(0.95)';
      }, { passive: true });
      
      notification.addEventListener('touchend', () => {
        notification.style.transform = 'translateX(-50%) translateY(0) scale(1)';
        // Hide on touch for mobile
        this.hideNotification(notification);
      }, { passive: true });
    }
    
    // Auto remove with enhanced animation
    const hideTimeout = isMobileView ? 3000 : 2500;
    setTimeout(() => {
      this.hideNotification(notification);
    }, hideTimeout);
  }

  /**
   * Hide notification with animation
   */
  hideNotification(notification) {
    if (!notification || !notification.parentNode) return;
    
    notification.style.animation = 'slideDownNotification 0.3s ease-out forwards';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
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
   * Activate navigation (responsive entrance)
   */
  activate() {
    this.isActive = true;
    
    if (this.navElement) {
      this.navElement.style.display = 'flex';
      
      // Responsive entrance animation
      const animationDuration = this.isMobile ? '0.4s' : '0.5s';
      const easing = 'cubic-bezier(0.68, -0.55, 0.265, 1.55)';
      
      this.navElement.style.transform = 'translateY(100%)';
      this.navElement.style.opacity = '0';
      
      setTimeout(() => {
        this.navElement.style.transition = `transform ${animationDuration} ${easing}, opacity 0.3s ease`;
        this.navElement.style.transform = 'translateY(0)';
        this.navElement.style.opacity = '1';
      }, 50);
      
      // Staggered button animation for better mobile experience
      setTimeout(() => {
        this.tabButtons.forEach((button, index) => {
          button.style.opacity = '0';
          button.style.transform = 'translateY(20px)';
          
          setTimeout(() => {
            button.style.transition = 'opacity 0.3s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            button.style.opacity = '1';
            button.style.transform = 'translateY(0)';
          }, index * 80);
        });
      }, 200);
    }
    
    console.log('📱 Responsive TabNavigation activated');
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
