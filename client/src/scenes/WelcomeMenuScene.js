import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import NetworkManager from '@/services/NetworkManager';

/**
 * Welcome Menu Scene - Mobile Portrait Optimized
 * Clean welcome interface designed for mobile portrait format (375x812)
 */
class WelcomeMenuScene {
  constructor(gameEngine, sceneManager) {
    this.gameEngine = gameEngine;
    this.sceneManager = sceneManager;
    this.networkManager = NetworkManager;
    
    // Mobile detection and viewport
    this.isMobile = this.gameEngine.isMobileDevice();
    this.viewportSize = this.gameEngine.getViewportSize();
    
    // Scene objects
    this.rootObject = new THREE.Group();
    this.rootObject.name = 'WelcomeMenuScene';
    
    // User data
    this.currentUser = null;
    
    // 3D elements optimized for mobile
    this.backgroundElements = [];
    this.floatingElements = [];
    this.particleSystem = null;
    
    // Mobile UI system
    this.mobileUI = {
      container: null,
      header: null,
      content: null,
      buttons: new Map(),
      statusIndicator: null
    };
    
    // Animation state
    this.animationLoops = [];
    this.isAnimating = false;
    this.animationQuality = this.gameEngine.getQualityLevel();
    
    // Touch interaction
    this.touchTargets = new Map();
    this.isInteracting = false;
    
    // Event listeners
    this.boundHandlers = new Map();
    
    console.log(`🏠 WelcomeMenuScene created for ${this.isMobile ? 'mobile' : 'desktop'}`);
  }

  /**
   * Initialize mobile-optimized welcome scene
   */
  async initialize(context = {}) {
    try {
      console.log('🏠 Initializing Mobile WelcomeMenuScene...');
      
      // Create mobile-optimized 3D background
      this.createMobileBackground();
      this.createMobileFloatingElements();
      
      // Create mobile UI system
      this.createMobileUI();
      
      // Setup animations based on device capabilities
      this.setupMobileAnimations();
      
      // Setup touch interactions
      this.setupTouchInteractions();
      
      // Setup event listeners
      this.setupEventListeners();
      
      console.log('✅ Mobile WelcomeMenuScene initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Mobile WelcomeMenuScene:', error);
      throw error;
    }
  }

  /**
   * Create mobile-optimized 3D background
   */
  createMobileBackground() {
    // Simplified gradient background for mobile performance
    const geometry = new THREE.PlaneGeometry(40, 60); // Portrait ratio
    
    let material;
    if (this.animationQuality === 'high') {
      // Animated shader for high-end devices
      material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          resolution: { value: new THREE.Vector2(this.viewportSize.width, this.viewportSize.height) },
          color1: { value: new THREE.Color(0x1a1a2e) },
          color2: { value: new THREE.Color(0x16213e) },
          color3: { value: new THREE.Color(0x0f3460) }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform vec2 resolution;
          uniform vec3 color1;
          uniform vec3 color2;
          uniform vec3 color3;
          varying vec2 vUv;
          
          void main() {
            vec2 uv = vUv;
            
            // Mobile-optimized wave pattern
            float wave1 = sin(uv.y * 8.0 + time * 0.5) * 0.1;
            float wave2 = cos(uv.x * 6.0 + time * 0.3) * 0.1;
            float pattern = wave1 + wave2;
            
            // Portrait-oriented gradient
            vec3 color = mix(color1, color2, uv.y + pattern);
            color = mix(color, color3, uv.x * 0.2 + pattern * 0.5);
            
            gl_FragColor = vec4(color, 1.0);
          }
        `
      });
    } else {
      // Simple material for low-end devices
      material = new THREE.MeshBasicMaterial({
        color: 0x1a1a2e,
        transparent: true,
        opacity: 0.9
      });
    }
    
    const backgroundPlane = new THREE.Mesh(geometry, material);
    backgroundPlane.position.z = -20;
    backgroundPlane.name = 'MobileBackground';
    this.backgroundElements.push(backgroundPlane);
    this.rootObject.add(backgroundPlane);
    
    console.log(`📱 Mobile background created (Quality: ${this.animationQuality})`);
  }

  /**
   * Create floating elements optimized for mobile
   */
  createMobileFloatingElements() {
    // Reduce element count on mobile for performance
    const elementCount = this.isMobile ? 4 : 6;
    
    for (let i = 0; i < elementCount; i++) {
      // Simple geometry for mobile performance
      const geometry = this.animationQuality === 'low' ? 
        new THREE.BoxGeometry(0.8, 0.8, 0.8) :
        new THREE.SphereGeometry(0.4, 12, 8); // Lower resolution sphere
      
      const material = new THREE.MeshLambertMaterial({
        color: new THREE.Color().setHSL(0.6 + Math.random() * 0.3, 0.7, 0.5 + Math.random() * 0.3),
        transparent: true,
        opacity: 0.6 + Math.random() * 0.3
      });
      
      const element = new THREE.Mesh(geometry, material);
      
      // Portrait-oriented positioning
      element.position.set(
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 35, // Taller range for portrait
        (Math.random() - 0.5) * 10
      );
      
      element.name = `FloatingElement_${i}`;
      this.floatingElements.push(element);
      this.rootObject.add(element);
    }
    
    console.log(`💫 ${elementCount} mobile floating elements created`);
  }

  /**
   * Create mobile UI system
   */
  createMobileUI() {
    // Remove any existing UI
    const existingUI = document.getElementById('mobile-welcome-ui');
    if (existingUI) {
      existingUI.remove();
    }
    
    // Create main UI container
    this.mobileUI.container = document.createElement('div');
    this.mobileUI.container.id = 'mobile-welcome-ui';
    this.mobileUI.container.className = 'mobile-welcome-ui';
    
    // Mobile-optimized styling
    this.mobileUI.container.style.cssText = `
      position: absolute;
      top: 44px;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      z-index: 1000;
      pointer-events: none;
      font-family: 'Rajdhani', 'Arial', sans-serif;
      color: #ffffff;
      overflow: hidden;
    `;
    
    // Create header section
    this.createMobileHeader();
    
    // Create content section
    this.createMobileContent();
    
    // Create bottom section
    this.createMobileBottom();
    
    // Inject into mobile viewport
    const mobileViewport = this.gameEngine.getMobileViewport();
    if (mobileViewport) {
      mobileViewport.appendChild(this.mobileUI.container);
    }
    
    console.log('📱 Mobile UI system created');
  }

  /**
   * Create mobile header section
   */
  createMobileHeader() {
    this.mobileUI.header = document.createElement('div');
    this.mobileUI.header.className = 'mobile-header';
    this.mobileUI.header.style.cssText = `
      padding: 20px;
      text-align: center;
      pointer-events: none;
      flex-shrink: 0;
    `;
    
    this.mobileUI.header.innerHTML = `
      <div class="welcome-title" style="
        font-size: 28px;
        font-weight: bold;
        color: #4a90e2;
        margin-bottom: 8px;
        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        opacity: 0;
        transform: translateY(-20px);
      ">
        CLASH ROYALE
      </div>
      <div class="welcome-subtitle" style="
        font-size: 16px;
        color: #e0e0e0;
        opacity: 0.8;
        opacity: 0;
        transform: translateY(-10px);
      " id="welcome-subtitle">
        Welcome Back, Champion!
      </div>
    `;
    
    this.mobileUI.container.appendChild(this.mobileUI.header);
  }

  /**
   * Create mobile content section
   */
  createMobileContent() {
    this.mobileUI.content = document.createElement('div');
    this.mobileUI.content.className = 'mobile-content';
    this.mobileUI.content.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 20px;
      pointer-events: auto;
      gap: 20px;
    `;
    
    // User info card
    this.createUserInfoCard();
    
    // Action buttons
    this.createActionButtons();
    
    this.mobileUI.container.appendChild(this.mobileUI.content);
  }

  /**
   * Create user info card
   */
  createUserInfoCard() {
    const userCard = document.createElement('div');
    userCard.className = 'user-info-card';
    userCard.style.cssText = `
      background: rgba(26, 26, 46, 0.8);
      border: 2px solid rgba(74, 144, 226, 0.3);
      border-radius: 16px;
      padding: 24px;
      width: 100%;
      max-width: 320px;
      text-align: center;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      opacity: 0;
      transform: translateY(30px) scale(0.9);
      transition: all 0.3s ease;
    `;
    
    userCard.innerHTML = `
      <div class="user-avatar" style="
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: linear-gradient(135deg, #4a90e2, #357abd);
        margin: 0 auto 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 36px;
        box-shadow: 0 4px 16px rgba(74, 144, 226, 0.3);
      ">
        👑
      </div>
      <div class="user-name" id="mobile-user-name" style="
        font-size: 24px;
        font-weight: bold;
        color: #ffffff;
        margin-bottom: 8px;
      ">
        Loading...
      </div>
      <div class="user-level" id="mobile-user-level" style="
        font-size: 16px;
        color: #4a90e2;
        margin-bottom: 16px;
      ">
        Level 1
      </div>
      <div class="user-stats" style="
        display: flex;
        justify-content: space-around;
        gap: 16px;
      ">
        <div class="stat-item" style="text-align: center;">
          <div class="stat-value" id="mobile-user-trophies" style="
            font-size: 20px;
            font-weight: bold;
            color: #ffd700;
          ">0</div>
          <div class="stat-label" style="
            font-size: 12px;
            color: #a0a0a0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">Trophies</div>
        </div>
        <div class="stat-item" style="text-align: center;">
          <div class="stat-value" id="mobile-user-wins" style="
            font-size: 20px;
            font-weight: bold;
            color: #2ecc71;
          ">0</div>
          <div class="stat-label" style="
            font-size: 12px;
            color: #a0a0a0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">Wins</div>
        </div>
        <div class="stat-item" style="text-align: center;">
          <div class="stat-value" style="
            font-size: 20px;
            font-weight: bold;
            color: #e74c3c;
          ">0</div>
          <div class="stat-label" style="
            font-size: 12px;
            color: #a0a0a0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">Losses</div>
        </div>
      </div>
    `;
    
    this.mobileUI.content.appendChild(userCard);
    this.mobileUI.userCard = userCard;
  }

  /**
   * Create action buttons optimized for touch
   */
  createActionButtons() {
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'action-buttons';
    buttonsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 16px;
      width: 100%;
      max-width: 320px;
    `;
    
    // Main play button
    const playButton = this.createMobileButton({
      id: 'mobile-play-btn',
      text: '⚔️ Start Battle',
      style: 'primary',
      icon: '⚔️',
      handler: this.handlePlay.bind(this)
    });
    
    // Secondary buttons container
    const secondaryContainer = document.createElement('div');
    secondaryContainer.style.cssText = `
      display: flex;
      gap: 12px;
    `;
    
    const settingsButton = this.createMobileButton({
      id: 'mobile-settings-btn',
      text: '⚙️ Settings',
      style: 'secondary',
      icon: '⚙️',
      handler: this.handleSettings.bind(this),
      compact: true
    });
    
    const walletButton = this.createMobileButton({
      id: 'mobile-wallet-btn',
      text: '🦊 Wallet',
      style: 'secondary',
      icon: '🦊',
      handler: this.handleWallet.bind(this),
      compact: true,
      disabled: true
    });
    
    secondaryContainer.appendChild(settingsButton);
    secondaryContainer.appendChild(walletButton);
    
    buttonsContainer.appendChild(playButton);
    buttonsContainer.appendChild(secondaryContainer);
    
    this.mobileUI.content.appendChild(buttonsContainer);
  }

  /**
   * Create mobile-optimized button
   */
  createMobileButton(config) {
    const {
      id,
      text,
      style = 'primary',
      icon = '',
      handler = null,
      compact = false,
      disabled = false
    } = config;
    
    const button = document.createElement('button');
    button.id = id;
    button.className = `mobile-button ${style} ${compact ? 'compact' : ''}`;
    
    // Base styles
    const baseStyles = `
      border: none;
      border-radius: ${compact ? '12px' : '16px'};
      font-family: inherit;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      position: relative;
      overflow: hidden;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      opacity: 0;
      transform: translateY(20px);
    `;
    
    // Style-specific properties
    const styleConfigs = {
      primary: {
        padding: compact ? '12px 20px' : '18px 32px',
        fontSize: compact ? '14px' : '18px',
        background: 'linear-gradient(135deg, #2ecc71, #27ae60)',
        color: '#ffffff',
        boxShadow: '0 6px 20px rgba(46, 204, 113, 0.4)',
        flex: compact ? '1' : 'none'
      },
      secondary: {
        padding: compact ? '12px 20px' : '16px 24px',
        fontSize: compact ? '14px' : '16px',
        background: 'linear-gradient(135deg, #4a90e2, #357abd)',
        color: '#ffffff',
        boxShadow: '0 4px 15px rgba(74, 144, 226, 0.4)',
        flex: compact ? '1' : 'none'
      },
      tertiary: {
        padding: compact ? '12px 20px' : '16px 24px',
        fontSize: compact ? '14px' : '16px',
        background: 'rgba(255, 255, 255, 0.1)',
        color: '#ffffff',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
        flex: compact ? '1' : 'none'
      }
    };
    
    const styleConfig = styleConfigs[style];
    button.style.cssText = baseStyles + Object.entries(styleConfig)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`)
      .join('');
    
    // Button content
    button.innerHTML = `
      ${icon ? `<span class="button-icon">${icon}</span>` : ''}
      <span class="button-text">${text.replace(icon, '').trim()}</span>
    `;
    
    // Disabled state
    if (disabled) {
      button.disabled = true;
      button.style.opacity = '0.5';
      button.style.cursor = 'not-allowed';
      button.style.pointerEvents = 'none';
    }
    
    // Touch interactions
    if (handler && !disabled) {
      this.setupButtonTouchInteraction(button, handler);
    }
    
    // Store button reference
    this.mobileUI.buttons.set(id, button);
    
    return button;
  }

  /**
   * Setup touch interaction for button
   */
  setupButtonTouchInteraction(button, handler) {
    let touchStartTime = 0;
    let isPressed = false;
    
    const handleTouchStart = (event) => {
      event.stopPropagation();
      isPressed = true;
      touchStartTime = Date.now();
      
      // Press animation
      button.style.transform = 'translateY(2px) scale(0.95)';
      button.style.filter = 'brightness(1.1)';
      
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    };
    
    const handleTouchEnd = (event) => {
      event.stopPropagation();
      
      if (isPressed) {
        isPressed = false;
        
        // Release animation
        button.style.transform = 'translateY(0) scale(1)';
        button.style.filter = 'brightness(1)';
        
        // Execute handler if touch was quick enough
        const touchDuration = Date.now() - touchStartTime;
        if (touchDuration < 500) {
          setTimeout(() => handler(), 50); // Small delay for animation
        }
      }
    };
    
    const handleTouchCancel = () => {
      isPressed = false;
      button.style.transform = 'translateY(0) scale(1)';
      button.style.filter = 'brightness(1)';
    };
    
    // Touch events
    button.addEventListener('touchstart', handleTouchStart, { passive: false });
    button.addEventListener('touchend', handleTouchEnd, { passive: false });
    button.addEventListener('touchcancel', handleTouchCancel);
    
    // Mouse events for desktop testing
    button.addEventListener('mousedown', handleTouchStart);
    button.addEventListener('mouseup', handleTouchEnd);
    button.addEventListener('mouseleave', handleTouchCancel);
    
    // Store handlers for cleanup
    this.boundHandlers.set(button.id + '_touch', {
      touchstart: handleTouchStart,
      touchend: handleTouchEnd,
      touchcancel: handleTouchCancel,
      mousedown: handleTouchStart,
      mouseup: handleTouchEnd,
      mouseleave: handleTouchCancel
    });
  }

  /**
   * Create bottom section
   */
  createMobileBottom() {
    const bottomSection = document.createElement('div');
    bottomSection.className = 'mobile-bottom';
    bottomSection.style.cssText = `
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      pointer-events: auto;
    `;
    
    // Connection status
    const connectionStatus = document.createElement('div');
    connectionStatus.className = 'connection-status';
    connectionStatus.id = 'mobile-connection-status';
    connectionStatus.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #a0a0a0;
    `;
    
    connectionStatus.innerHTML = `
      <div class="status-dot" style="
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #2ecc71;
        box-shadow: 0 0 8px #2ecc71;
        animation: statusPulse 2s ease-in-out infinite alternate;
      "></div>
      <span>Connected</span>
    `;
    
    // Logout button
    const logoutButton = document.createElement('button');
    logoutButton.className = 'logout-button';
    logoutButton.style.cssText = `
      background: rgba(231, 76, 60, 0.2);
      border: 1px solid rgba(231, 76, 60, 0.4);
      border-radius: 8px;
      color: #e74c3c;
      padding: 8px 16px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: bold;
    `;
    logoutButton.textContent = 'Logout';
    
    // Logout button interaction
    this.setupButtonTouchInteraction(logoutButton, this.handleLogout.bind(this));
    
    bottomSection.appendChild(connectionStatus);
    bottomSection.appendChild(logoutButton);
    
    this.mobileUI.container.appendChild(bottomSection);
    
    // Add pulse animation
    this.addStatusPulseAnimation();
  }

  /**
   * Add status pulse animation
   */
  addStatusPulseAnimation() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes statusPulse {
        0% { opacity: 0.6; transform: scale(1); }
        100% { opacity: 1; transform: scale(1.2); }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Setup mobile animations
   */
  setupMobileAnimations() {
    // Background animation (quality dependent)
    if (this.animationQuality === 'high') {
      this.animationLoops.push(() => {
        this.backgroundElements.forEach(element => {
          if (element.material.uniforms && element.material.uniforms.time) {
            element.material.uniforms.time.value += 0.01;
          }
        });
      });
    }
    
    // Floating elements animation (reduced on mobile)
    this.floatingElements.forEach((element, index) => {
      const originalPosition = { ...element.position };
      const speed = 0.0008 + index * 0.0002;
      const amplitude = this.isMobile ? 0.8 : 1.2; // Reduced on mobile
      
      this.animationLoops.push(() => {
        element.position.y = originalPosition.y + Math.sin(Date.now() * speed) * amplitude;
        
        if (this.animationQuality !== 'low') {
          element.rotation.x += 0.004;
          element.rotation.y += 0.006;
          element.rotation.z += 0.002;
        }
      });
    });
    
    console.log(`🎬 Mobile animations setup (${this.animationLoops.length} loops)`);
  }

  /**
   * Setup touch interactions
   */
  setupTouchInteractions() {
    // Global touch handling for the scene
    const canvas = this.gameEngine.getCanvas();
    if (canvas) {
      canvas.addEventListener('touchstart', this.handleSceneTouchStart.bind(this), { passive: true });
    }
  }

  /**
   * Handle scene touch start
   */
  handleSceneTouchStart(event) {
    // Add touch ripple effect or other global touch feedback
    console.log('👆 Scene touch detected');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Network events
    this.networkManager.on('network:online', () => {
      this.updateConnectionStatus('Connected', 'online');
    });
    
    this.networkManager.on('network:offline', () => {
      this.updateConnectionStatus('Offline', 'offline');
    });
    
    // Game engine events
    this.gameEngine.on('engine:quality_changed', (quality) => {
      this.adaptToQualityChange(quality);
    });
    
    console.log('👂 Mobile event listeners setup');
  }

  /**
   * Update connection status indicator
   */
  updateConnectionStatus(message, status) {
    const statusElement = document.getElementById('mobile-connection-status');
    if (!statusElement) return;
    
    const dot = statusElement.querySelector('.status-dot');
    const text = statusElement.querySelector('span');
    
    const statusColors = {
      online: '#2ecc71',
      offline: '#e74c3c',
      connecting: '#f39c12'
    };
    
    if (dot && text) {
      dot.style.background = statusColors[status] || '#a0a0a0';
      dot.style.boxShadow = `0 0 8px ${statusColors[status] || '#a0a0a0'}`;
      text.textContent = message;
    }
  }

  /**
   * Adapt to quality changes
   */
  adaptToQualityChange(newQuality) {
    this.animationQuality = newQuality;
    
    // Adjust floating elements based on quality
    this.floatingElements.forEach((element, index) => {
      if (newQuality === 'low') {
        // Simplify geometry
        if (element.geometry.type === 'SphereGeometry') {
          element.geometry.dispose();
          element.geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        }
      }
    });
    
    console.log(`⚙️ Mobile scene adapted to ${newQuality} quality`);
  }

  /**
   * Update user interface with current user data
   */
  updateUserInterface(user) {
    if (!user) return;
    
    this.currentUser = user;
    
    // Update user name
    const nameElement = document.getElementById('mobile-user-name');
    if (nameElement) {
      nameElement.textContent = user.displayName || user.username;
    }
    
    // Update user level
    const levelElement = document.getElementById('mobile-user-level');
    if (levelElement) {
      levelElement.textContent = `Level ${user.level || 1}`;
    }
    
    // Update trophies
    const trophiesElement = document.getElementById('mobile-user-trophies');
    if (trophiesElement) {
      trophiesElement.textContent = (user.trophies || 0).toLocaleString();
    }
    
    // Update wins
    const winsElement = document.getElementById('mobile-user-wins');
    if (winsElement) {
      winsElement.textContent = (user.wins || 0).toLocaleString();
    }
    
    // Update subtitle
    const subtitleElement = document.getElementById('welcome-subtitle');
    if (subtitleElement) {
      const hour = new Date().getHours();
      let greeting = 'Welcome Back';
      
      if (hour < 12) greeting = 'Good Morning';
      else if (hour < 18) greeting = 'Good Afternoon';
      else greeting = 'Good Evening';
      
      subtitleElement.textContent = `${greeting}, ${user.displayName || user.username}!`;
    }
    
    console.log('👤 Mobile user interface updated');
  }

  /**
   * Event handlers for mobile buttons
   */
  handlePlay() {
    console.log('🎮 Play button pressed - navigating to Clash Menu');
    
    // Add loading state to button
    const playButton = this.mobileUI.buttons.get('mobile-play-btn');
    if (playButton) {
      const originalText = playButton.innerHTML;
      playButton.innerHTML = `
        <div style="
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
        <span>Loading...</span>
      `;
      playButton.disabled = true;
      
      // Add spin animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
      
      // Navigate after brief delay
      setTimeout(() => {
        this.sceneManager.switchToScene('clashMenu', {
          user: this.currentUser
        }, 'slide-left');
      }, 800);
    }
  }
  
  handleSettings() {
    console.log('⚙️ Settings button pressed');
    
    // Show mobile settings modal
    this.showMobileModal({
      title: '⚙️ Settings',
      content: `
        <div style="padding: 20px; text-align: center;">
          <p style="margin-bottom: 20px; color: #a0a0a0;">Settings panel coming soon!</p>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(255,255,255,0.1); border-radius: 8px;">
              <span>Sound Effects</span>
              <div style="width: 40px; height: 20px; background: #2ecc71; border-radius: 10px; position: relative;">
                <div style="width: 18px; height: 18px; background: white; border-radius: 50%; position: absolute; top: 1px; right: 1px;"></div>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(255,255,255,0.1); border-radius: 8px;">
              <span>Music</span>
              <div style="width: 40px; height: 20px; background: #2ecc71; border-radius: 10px; position: relative;">
                <div style="width: 18px; height: 18px; background: white; border-radius: 50%; position: absolute; top: 1px; right: 1px;"></div>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(255,255,255,0.1); border-radius: 8px;">
              <span>Graphics Quality</span>
              <span style="color: #4a90e2;">Auto</span>
            </div>
          </div>
        </div>
      `,
      buttons: [
        {
          text: 'Close',
          style: 'primary',
          handler: () => this.hideMobileModal()
        }
      ]
    });
  }
  
  handleWallet() {
    console.log('🦊 Wallet button pressed');
    
    this.showMobileModal({
      title: '🦊 Connect Wallet',
      content: `
        <div style="padding: 20px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 16px;">🚧</div>
          <h3 style="color: #4a90e2; margin-bottom: 16px;">Coming Soon!</h3>
          <p style="color: #a0a0a0; margin-bottom: 20px;">
            MetaMask wallet integration will be available in the next update.
          </p>
          <div style="background: rgba(246, 133, 27, 0.1); border: 1px solid rgba(246, 133, 27, 0.3); border-radius: 8px; padding: 16px;">
            <p style="color: #f6851b; font-size: 14px;">
              🔜 Soon you'll be able to:<br>
              • Connect your MetaMask wallet<br>
              • Trade NFT cards<br>
              • Earn tokens from battles
            </p>
          </div>
        </div>
      `,
      buttons: [
        {
          text: 'Got it!',
          style: 'primary',
          handler: () => this.hideMobileModal()
        }
      ]
    });
  }

  async handleLogout() {
    console.log('🚪 Logout button pressed');
    
    const confirmed = await this.showMobileConfirm({
      title: '🚪 Logout',
      message: 'Are you sure you want to logout?',
      confirmText: 'Logout',
      cancelText: 'Cancel'
    });
    
    if (confirmed) {
      try {
        // Show logging out state
        this.showMobileModal({
          title: '🚪 Logging Out',
          content: `
            <div style="padding: 40px 20px; text-align: center;">
              <div style="
                width: 40px;
                height: 40px;
                border: 4px solid rgba(231,76,60,0.3);
                border-top: 4px solid #e74c3c;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
              "></div>
              <p>Logging out...</p>
            </div>
          `,
          buttons: []
        });
        
        await this.networkManager.logout();
        
        // Navigate to login scene
        setTimeout(() => {
          this.sceneManager.switchToScene('login', {}, 'fade');
        }, 1000);
        
      } catch (error) {
        console.error('Logout error:', error);
        this.hideMobileModal();
        this.showMobileAlert('Logout failed. Please try again.');
      }
    }
  }

  /**
   * Show mobile modal dialog
   */
  showMobileModal(config) {
    // Remove existing modal
    this.hideMobileModal();
    
    const { title, content, buttons = [] } = config;
    
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'mobile-modal-overlay';
    modalOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      padding: 20px;
      backdrop-filter: blur(5px);
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border: 2px solid rgba(74, 144, 226, 0.3);
      border-radius: 16px;
      width: 100%;
      max-width: 320px;
      max-height: 80vh;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      transform: scale(0.8) translateY(20px);
      transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    `;
    
    modal.innerHTML = `
      <div style="
        padding: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        text-align: center;
      ">
        <h3 style="color: #ffffff; font-size: 18px; margin: 0;">${title}</h3>
      </div>
      <div style="max-height: 60vh; overflow-y: auto;">
        ${content}
      </div>
      ${buttons.length > 0 ? `
        <div style="
          padding: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          gap: 12px;
          justify-content: center;
        ">
          ${buttons.map(btn => `
            <button class="modal-btn-${btn.style || 'primary'}" style="
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              font-weight: bold;
              cursor: pointer;
              transition: all 0.3s ease;
              ${btn.style === 'primary' ? `
                background: linear-gradient(135deg, #4a90e2, #357abd);
                color: white;
              ` : `
                background: rgba(255, 255, 255, 0.1);
                color: #ffffff;
                border: 1px solid rgba(255, 255, 255, 0.2);
              `}
            ">${btn.text}</button>
          `).join('')}
        </div>
      ` : ''}
    `;
    
    modalOverlay.appendChild(modal);
    
    // Setup button handlers
    buttons.forEach((btn, index) => {
      const buttonElement = modal.querySelector(`.modal-btn-${btn.style || 'primary'}`);
      if (buttonElement && btn.handler) {
        this.setupButtonTouchInteraction(buttonElement, btn.handler);
      }
    });
    
    // Add to viewport
    const mobileViewport = this.gameEngine.getMobileViewport();
    if (mobileViewport) {
      mobileViewport.appendChild(modalOverlay);
      
      // Animate in
      requestAnimationFrame(() => {
        modalOverlay.style.opacity = '1';
        modal.style.transform = 'scale(1) translateY(0)';
      });
    }
  }

  /**
   * Hide mobile modal
   */
  hideMobileModal() {
    const modalOverlay = document.getElementById('mobile-modal-overlay');
    if (modalOverlay) {
      modalOverlay.style.opacity = '0';
      const modal = modalOverlay.querySelector('div');
      if (modal) {
        modal.style.transform = 'scale(0.8) translateY(20px)';
      }
      
      setTimeout(() => {
        if (modalOverlay.parentNode) {
          modalOverlay.parentNode.removeChild(modalOverlay);
        }
      }, 300);
    }
  }

  /**
   * Show mobile confirmation dialog
   */
  showMobileConfirm(config) {
    return new Promise((resolve) => {
      const { title, message, confirmText = 'Confirm', cancelText = 'Cancel' } = config;
      
      this.showMobileModal({
        title,
        content: `
          <div style="padding: 20px; text-align: center;">
            <p style="color: #ffffff; line-height: 1.5;">${message}</p>
          </div>
        `,
        buttons: [
          {
            text: cancelText,
            style: 'secondary',
            handler: () => {
              this.hideMobileModal();
              resolve(false);
            }
          },
          {
            text: confirmText,
            style: 'primary',
            handler: () => {
              this.hideMobileModal();
              resolve(true);
            }
          }
        ]
      });
    });
  }

  /**
   * Show mobile alert
   */
  showMobileAlert(message) {
    this.showMobileModal({
      title: '⚠️ Alert',
      content: `
        <div style="padding: 20px; text-align: center;">
          <p style="color: #ffffff; line-height: 1.5;">${message}</p>
        </div>
      `,
      buttons: [
        {
          text: 'OK',
          style: 'primary',
          handler: () => this.hideMobileModal()
        }
      ]
    });
  }

  /**
   * Scene lifecycle - activate
   */
  async activate(data = {}) {
    try {
      // Add scene to Three.js
      this.gameEngine.getScene().add(this.rootObject);
      
      // Show mobile UI
      if (this.mobileUI.container) {
        this.mobileUI.container.style.display = 'flex';
      }
      
      // Update UI with user data
      if (data.user) {
        this.updateUserInterface(data.user);
      } else {
        // Try to get user data from network manager
        const userData = this.networkManager.getUserData();
        if (userData) {
          this.updateUserInterface(userData);
        }
      }
      
      // Start animations
      this.startAnimations();
      
      // Animate entrance
      await this.animateMobileEntrance();
      
      console.log('🏠 Mobile WelcomeMenuScene activated');
      
    } catch (error) {
      console.error('❌ Failed to activate Mobile WelcomeMenuScene:', error);
    }
  }

  /**
   * Scene lifecycle - deactivate
   */
  deactivate() {
    // Hide mobile UI
    if (this.mobileUI.container) {
      this.mobileUI.container.style.display = 'none';
    }
    
    // Stop animations
    this.stopAnimations();
    
    // Hide any open modals
    this.hideMobileModal();
    
    console.log('🏠 Mobile WelcomeMenuScene deactivated');
  }

  /**
   * Start animations
   */
  startAnimations() {
    this.isAnimating = true;
    
    const animate = () => {
      if (!this.isAnimating) return;
      
      this.animationLoops.forEach(loop => loop());
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  /**
   * Stop animations
   */
  stopAnimations() {
    this.isAnimating = false;
  }

  /**
   * Animate mobile entrance with staggered effects
   */
  async animateMobileEntrance() {
    return new Promise((resolve) => {
      // Animate 3D elements entrance
      this.floatingElements.forEach((element, index) => {
        const originalScale = { ...element.scale };
        element.scale.set(0, 0, 0);
        
        setTimeout(() => {
          new TWEEN.Tween(element.scale)
            .to(originalScale, 800)
            .easing(TWEEN.Easing.Elastic.Out)
            .start();
        }, index * 150);
      });
      
      // Animate UI elements entrance
      const animateElement = (selector, delay, animation = 'fadeInUp') => {
        const element = document.querySelector(selector);
        if (element) {
          setTimeout(() => {
            if (animation === 'fadeInUp') {
              element.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
              element.style.opacity = '1';
              element.style.transform = 'translateY(0) scale(1)';
            }
          }, delay);
        }
      };
      
      // Staggered UI animation
      animateElement('.welcome-title', 300);
      animateElement('.welcome-subtitle', 500);
      animateElement('.user-info-card', 700);
      
      // Animate buttons
      this.mobileUI.buttons.forEach((button, id) => {
        const delay = id.includes('play') ? 900 : 1100;
        setTimeout(() => {
          button.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
          button.style.opacity = '1';
          button.style.transform = 'translateY(0)';
        }, delay);
      });
      
      // Complete after all animations
      setTimeout(resolve, 1500);
    });
  }

  /**
   * Preload method for mobile optimization
   */
  async preload(context = {}) {
    // Minimal preloading for mobile performance
    if (context.isMobile) {
      console.log('📱 Mobile welcome scene - minimal preload');
      return;
    }
    
    console.log('💻 Desktop welcome scene - full preload');
    // Could preload additional assets for desktop
  }

  /**
   * Cleanup scene resources
   */
  async cleanup() {
    console.log('🧹 Cleaning up Mobile WelcomeMenuScene...');
    
    // Stop animations
    this.stopAnimations();
    
    // Remove mobile UI
    if (this.mobileUI.container && this.mobileUI.container.parentNode) {
      this.mobileUI.container.parentNode.removeChild(this.mobileUI.container);
    }
    
    // Remove event listeners
    this.boundHandlers.forEach((handlers, buttonId) => {
      const button = document.getElementById(buttonId.replace('_touch', ''));
      if (button && handlers) {
        Object.entries(handlers).forEach(([event, handler]) => {
          button.removeEventListener(event, handler);
        });
      }
    });
    
    // Clear bound handlers
    this.boundHandlers.clear();
    
    // Dispose Three.js objects
    this.rootObject.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    
    // Clear arrays
    this.backgroundElements = [];
    this.floatingElements = [];
    this.animationLoops = [];
    
    // Clear UI references
    this.mobileUI = {
      container: null,
      header: null,
      content: null,
      buttons: new Map(),
      statusIndicator: null
    };
    
    console.log('✅ Mobile WelcomeMenuScene cleaned up');
  }
}

export default WelcomeMenuScene;
