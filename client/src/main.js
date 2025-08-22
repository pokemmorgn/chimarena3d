import GameEngine from '@core/GameEngine';
import SceneManager from '@core/SceneManager';
import GameState from '@core/GameState';
import NetworkManager from '@services/NetworkManager';

// Import scenes
import LoginScene from '@scenes/LoginScene';
import WelcomeMenuScene from '@scenes/WelcomeMenuScene';

/**
 * Application Entry Point
 * Initializes the entire game application and manages the startup process
 */
class ClashRoyaleApp {
  constructor() {
    // Core systems
    this.gameEngine = null;
    this.sceneManager = null;
    this.gameState = GameState;
    this.networkManager = NetworkManager;
    
    // Canvas element
    this.canvas = null;
    
    // Initialization state
    this.isInitialized = false;
    this.initializationError = null;
    
    // Performance monitoring
    this.loadStartTime = performance.now();
    this.initSteps = [];
    
    console.log('🚀 ClashRoyale App created');
  }

  /**
   * Main application initialization
   */
  async initialize() {
    try {
      console.log('🚀 Starting ClashRoyale application...');
      this.showLoadingScreen();
      
      // Step 1: Initialize canvas and WebGL context
      await this.initializeCanvas();
      
      // Step 2: Initialize game engine
      await this.initializeGameEngine();
      
      // Step 3: Initialize scene manager
      await this.initializeSceneManager();
      
      // Step 4: Register scenes
      await this.registerScenes();
      
      // Step 5: Initialize game state
      await this.initializeGameState();
      
      // Step 6: Setup global event listeners
      this.setupGlobalEventListeners();
      
      // Step 7: Setup error handling
      this.setupErrorHandling();
      
      // Step 8: Determine initial scene
      await this.determineInitialScene();
      
      // Step 9: Start the application
      this.startApplication();
      
      this.isInitialized = true;
      this.hideLoadingScreen();
      
      const loadTime = performance.now() - this.loadStartTime;
      console.log(`✅ ClashRoyale application initialized in ${Math.round(loadTime)}ms`);
      
    } catch (error) {
      this.initializationError = error;
      console.error('❌ Failed to initialize application:', error);
      this.showErrorScreen(error);
      throw error;
    }
  }

  /**
   * Initialize canvas and check WebGL support
   */
  async initializeCanvas() {
    this.updateLoadingStatus('Initializing Graphics...');
    
    // Create canvas element
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'game-canvas';
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      background: #1a1a2e;
    `;
    
    // Check WebGL support
    const gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
    if (!gl) {
      throw new Error('WebGL is not supported on this device');
    }
    
    // Add canvas to DOM
    document.body.appendChild(this.canvas);
    
    console.log('✅ Canvas initialized with WebGL support');
    this.logInitStep('Canvas', 'WebGL context created');
  }

  /**
   * Initialize the game engine
   */
  async initializeGameEngine() {
    this.updateLoadingStatus('Starting Game Engine...');
    
    this.gameEngine = new GameEngine(this.canvas);
    await this.gameEngine.initialize();
    
    console.log('✅ Game engine initialized');
    this.logInitStep('GameEngine', 'Three.js renderer ready');
  }

  /**
   * Initialize the scene manager
   */
  async initializeSceneManager() {
    this.updateLoadingStatus('Preparing Scene System...');
    
    this.sceneManager = new SceneManager(this.gameEngine);
    await this.sceneManager.initialize();
    
    console.log('✅ Scene manager initialized');
    this.logInitStep('SceneManager', 'Scene transition system ready');
  }

  /**
   * Register all game scenes
   */
  async registerScenes() {
    this.updateLoadingStatus('Loading Game Scenes...');
    
    // Register login scene
    this.sceneManager.registerScene('login', LoginScene, {
      preload: false,
      persistent: false,
      transition: 'fade'
    });
    
    // Register welcome menu scene
    this.sceneManager.registerScene('welcomeMenu', WelcomeMenuScene, {
      preload: true,
      persistent: true,
      transition: 'fade'
    });
    
    // Preload the welcome menu scene for faster transitions
    await this.sceneManager.preloadScene('welcomeMenu');
    
    console.log('✅ Scenes registered and preloaded');
    this.logInitStep('Scenes', 'Login and WelcomeMenu scenes ready');
  }

  /**
   * Initialize game state management
   */
  async initializeGameState() {
    this.updateLoadingStatus('Loading Game State...');
    
    await this.gameState.initialize();
    
    console.log('✅ Game state initialized');
    this.logInitStep('GameState', 'Settings and session management ready');
  }

  /**
   * Setup global event listeners
   */
  setupGlobalEventListeners() {
    // Window resize handling
    window.addEventListener('resize', this.handleWindowResize.bind(this));
    
    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleGlobalKeyDown.bind(this));
    
    // Game state events
    this.gameState.on('auth:login', this.handleUserLogin.bind(this));
    this.gameState.on('auth:logout', this.handleUserLogout.bind(this));
    this.gameState.on('scene:changed', this.handleSceneChange.bind(this));
    
    // Network events
    this.networkManager.on('network:offline', this.handleNetworkOffline.bind(this));
    this.networkManager.on('network:online', this.handleNetworkOnline.bind(this));
    
    // Scene manager events
    this.sceneManager.on('scene:switched', this.handleSceneSwitched.bind(this));
    this.sceneManager.on('scene:transition_start', this.handleTransitionStart.bind(this));
    
    console.log('✅ Global event listeners setup');
    this.logInitStep('Events', 'Global event system active');
  }

  /**
   * Setup global error handling
   */
  setupErrorHandling() {
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.handleApplicationError(event.reason);
    });
    
    // Global JavaScript errors
    window.addEventListener('error', (event) => {
      console.error('Global JavaScript error:', event.error);
      this.handleApplicationError(event.error);
    });
    
    console.log('✅ Error handling setup');
    this.logInitStep('ErrorHandling', 'Global error handlers active');
  }

  /**
   * Determine which scene to show initially
   */
  async determineInitialScene() {
    this.updateLoadingStatus('Checking Authentication...');
    
    if (this.gameState.isUserAuthenticated()) {
      console.log('🔐 User is authenticated, showing welcome menu');
      await this.sceneManager.switchToScene('welcomeMenu', {
        user: this.gameState.getUser()
      }, 'instant');
    } else {
      console.log('🔑 User not authenticated, showing login');
      await this.sceneManager.switchToScene('login', {}, 'instant');
    }
    
    this.logInitStep('InitialScene', 'Starting scene determined');
  }

  /**
   * Start the application
   */
  startApplication() {
    // Start the game engine
    this.gameEngine.start();
    
    // Start session tracking
    this.gameState.startSession();
    
    // Mark app as ready
    document.body.classList.add('app-ready');
    
    console.log('▶️ Application started successfully');
    this.logInitStep('Start', 'Game loop and systems running');
  }

  /**
   * Event Handlers
   */
  handleWindowResize() {
    // The game engine handles its own resize through ResizeObserver
    // This is for any additional app-level resize handling
    console.log('📐 Window resized');
  }

  handleGlobalKeyDown(event) {
    // Global keyboard shortcuts
    switch (event.code) {
      case 'F1':
        event.preventDefault();
        this.showDebugInfo();
        break;
        
      case 'F5':
        if (event.ctrlKey) {
          event.preventDefault();
          this.handleForceRefresh();
        }
        break;
        
      case 'Escape':
        // Handle escape key (could pause game, close modals, etc.)
        this.handleEscapeKey();
        break;
    }
  }

  handleUserLogin(user) {
    console.log('👤 User logged in:', user.username);
    
    // Could trigger analytics, notifications, etc.
    this.gameState.setLoading(false);
  }

  handleUserLogout() {
    console.log('🚪 User logged out');
    
    // Clean up user-specific data
    this.gameState.setLoading(false);
  }

  handleSceneChange(data) {
    console.log(`🎬 Scene changed: ${data.previous} → ${data.current}`);
    
    // Update game state
    this.gameState.setCurrentScene(data.current);
  }

  handleSceneSwitched(data) {
    console.log(`✅ Scene switch complete: ${data.name}`);
    
    // Scene switch completed, hide any loading indicators
    this.gameState.setLoading(false);
  }

  handleTransitionStart(data) {
    console.log(`🔄 Scene transition started: ${data.from} → ${data.to}`);
    
    // Show loading if transition is expected to take time
    this.gameState.setLoading(true, `Loading ${data.to}...`);
  }

  handleNetworkOffline() {
    console.warn('📡 Network connection lost');
    this.showNetworkStatus('You are currently offline', 'warning');
  }

  handleNetworkOnline() {
    console.log('📡 Network connection restored');
    this.showNetworkStatus('Connection restored', 'success');
  }

  handleApplicationError(error) {
    console.error('🚨 Application error:', error);
    
    // Could send to error reporting service
    // For now, just show user-friendly message
    this.showErrorNotification('Something went wrong. Please refresh the page.');
  }

  handleEscapeKey() {
    // Handle escape key based on current scene
    const currentScene = this.gameState.getCurrentScene();
    
    switch (currentScene) {
      case 'login':
        // Could close any modals or reset form
        break;
      case 'welcomeMenu':
        // Could show settings or logout confirmation
        break;
    }
  }

  handleForceRefresh() {
    const confirmed = confirm('Force refresh the application? Any unsaved progress will be lost.');
    if (confirmed) {
      window.location.reload();
    }
  }

  /**
   * UI Helper Methods
   */
  showLoadingScreen() {
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'app-loading-screen';
    loadingScreen.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: Arial, sans-serif;
      color: white;
    `;
    
    loadingScreen.innerHTML = `
      <div style="text-align: center;">
        <h1 style="font-size: 48px; margin-bottom: 20px; color: #4a90e2;">CLASH ROYALE</h1>
        <div style="width: 60px; height: 60px; border: 4px solid #4a90e2; border-top: 4px solid transparent; 
                    border-radius: 50%; animation: spin 1s linear infinite; margin: 20px auto;"></div>
        <p id="loading-status" style="font-size: 18px; margin-top: 20px;">Initializing...</p>
        <div style="margin-top: 40px; font-size: 12px; color: #666;">
          <p>Loading game engine and assets...</p>
        </div>
      </div>
      
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    
    document.body.appendChild(loadingScreen);
  }

  updateLoadingStatus(status) {
    const statusElement = document.getElementById('loading-status');
    if (statusElement) {
      statusElement.textContent = status;
    }
    console.log(`⏳ ${status}`);
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById('app-loading-screen');
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      loadingScreen.style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        if (loadingScreen.parentNode) {
          loadingScreen.parentNode.removeChild(loadingScreen);
        }
      }, 500);
    }
  }

  showErrorScreen(error) {
    this.hideLoadingScreen();
    
    const errorScreen = document.createElement('div');
    errorScreen.id = 'app-error-screen';
    errorScreen.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #2c1810, #3d1a00);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: Arial, sans-serif;
      color: white;
    `;
    
    errorScreen.innerHTML = `
      <div style="text-align: center; max-width: 600px; padding: 40px;">
        <h1 style="font-size: 36px; color: #e74c3c; margin-bottom: 20px;">⚠️ Initialization Failed</h1>
        <p style="font-size: 18px; margin-bottom: 30px; line-height: 1.5;">
          The application failed to start properly. This might be due to:
        </p>
        <ul style="text-align: left; margin-bottom: 30px; font-size: 16px;">
          <li>WebGL not supported on your device</li>
          <li>Network connectivity issues</li>
          <li>Browser compatibility problems</li>
        </ul>
        <div style="margin-bottom: 30px;">
          <button onclick="window.location.reload()" style="
            background: #e74c3c;
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 16px;
            border-radius: 5px;
            cursor: pointer;
            margin-right: 10px;
          ">Retry</button>
          <button onclick="console.log('${error.message}')" style="
            background: #34495e;
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 16px;
            border-radius: 5px;
            cursor: pointer;
          ">Show Details</button>
        </div>
        <p style="font-size: 12px; color: #999;">
          Error: ${error.message}
        </p>
      </div>
    `;
    
    document.body.appendChild(errorScreen);
  }

  showNetworkStatus(message, type = 'info') {
    // Simple notification system
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      background: ${type === 'warning' ? '#f39c12' : type === 'success' ? '#2ecc71' : '#3498db'};
      color: white;
      border-radius: 5px;
      z-index: 10001;
      font-family: Arial, sans-serif;
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  showErrorNotification(message) {
    this.showNetworkStatus(message, 'warning');
  }

  showDebugInfo() {
    const debugInfo = this.gameState.getDebugInfo();
    console.log('🐛 Debug Info:', debugInfo);
    console.log('🎮 Game Engine Performance:', this.gameEngine.getPerformanceStats());
    console.log('📊 Initialization Steps:', this.initSteps);
  }

  /**
   * Utility methods
   */
  logInitStep(step, details) {
    this.initSteps.push({
      step,
      details,
      timestamp: performance.now() - this.loadStartTime
    });
  }

  /**
   * Cleanup and dispose
   */
  dispose() {
    console.log('🧹 Disposing ClashRoyale application...');
    
    // Stop game engine
    if (this.gameEngine) {
      this.gameEngine.dispose();
    }
    
    // Dispose scene manager
    if (this.sceneManager) {
      this.sceneManager.dispose();
    }
    
    // Dispose game state
    this.gameState.dispose();
    
    // Remove canvas
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    
    console.log('✅ Application disposed');
  }
}

/**
 * Application startup
 */
async function startApp() {
  try {
    // Create application instance
    const app = new ClashRoyaleApp();
    
    // Make app globally accessible for debugging
    window.ClashRoyaleApp = app;
    
    // Initialize and start
    await app.initialize();
    
    console.log('🎉 ClashRoyale application started successfully!');
    
  } catch (error) {
    console.error('💥 Failed to start application:', error);
  }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
