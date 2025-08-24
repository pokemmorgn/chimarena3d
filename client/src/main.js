import GameEngine from '@core/GameEngine';
import SceneManager from '@core/SceneManager';
import GameState from '@core/GameState';
import NetworkManager from '@services/NetworkManager';
import ColyseusManager from '@services/ColyseusManager';

// Import scenes
import LoginScene from '@scenes/LoginScene';
import WelcomeMenuScene from '@scenes/WelcomeMenuScene';
import ClashMenuScene from '@scenes/ClashMenuScene';

/**
 * Application Entry Point - Version avec Colyseus
 * Initialise l'application complète avec support WebSocket via Colyseus
 */
class ClashRoyaleApp {
  constructor() {
    // Core systems
    this.gameEngine = null;
    this.sceneManager = null;
    this.gameState = GameState;
    this.networkManager = NetworkManager;
    this.colyseusManager = ColyseusManager;
    
    // Canvas element
    this.canvas = null;
    
    // Initialization state
    this.isInitialized = false;
    this.initializationError = null;
    
    // Performance monitoring
    this.loadStartTime = performance.now();
    this.initSteps = [];
    
    console.log('🚀 ClashRoyale App created with Colyseus support');
  }

  /**
   * Main application initialization
   */
  async initialize() {
    try {
      console.log('🚀 Starting ClashRoyale application with Colyseus...');
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
      
      // Step 6: Initialize network connections (REST + Colyseus)
      await this.initializeNetworkConnections();
      
      // Step 7: Setup global event listeners
      this.setupGlobalEventListeners();
      
      // Step 8: Setup error handling
      this.setupErrorHandling();
      
      // Step 9: Determine initial scene
      await this.determineInitialScene();
      
      // Step 10: Start the application
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

// Register clash menu scene (main game menu)
this.sceneManager.registerScene('clashMenu', ClashMenuScene, {
  preload: false,
  persistent: true,
  transition: 'slide'
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
   * Initialize network connections (NEW STEP)
   */
  async initializeNetworkConnections() {
    this.updateLoadingStatus('Connecting to Game Server...');
    
    try {
      // Initialize NetworkManager (which will initialize ColyseusManager)
      await this.networkManager.initialize();
      
      console.log('✅ Network connections initialized');
      this.logInitStep('NetworkConnections', 'REST API + Colyseus WebSocket ready');
      
    } catch (error) {
      console.error('⚠️ Network initialization failed, continuing in offline mode:', error);
      this.logInitStep('NetworkConnections', 'Failed - continuing offline');
      
      // Don't throw error, allow offline mode
      this.showNetworkStatus('Failed to connect to game server. Some features may be limited.', 'warning');
    }
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
    
    // Network events (REST)
    this.networkManager.on('network:offline', this.handleNetworkOffline.bind(this));
    this.networkManager.on('network:online', this.handleNetworkOnline.bind(this));
    
    // Colyseus events
    this.colyseusManager.on('connection:connected', this.handleColyseusConnected.bind(this));
    this.colyseusManager.on('connection:error', this.handleColyseusError.bind(this));
    this.colyseusManager.on('auth:login_success', this.handleColyseusLoginSuccess.bind(this));
    this.colyseusManager.on('world:joined', this.handleWorldJoined.bind(this));
    
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
    
    try {
      // Try to verify existing token via Colyseus
      const isAuthenticated = await this.networkManager.verifyToken();
      
      if (isAuthenticated) {
        const user = this.networkManager.getUserData();
        console.log('🔐 User is authenticated via Colyseus, showing welcome menu');
        
        // Update game state
        this.gameState.setAuthenticated(user, this.networkManager.getAccessToken());
        
        await this.sceneManager.switchToScene('welcomeMenu', {
          user: user
        }, 'instant');
      } else {
        console.log('🔑 User not authenticated, showing login');
        await this.sceneManager.switchToScene('login', {}, 'instant');
      }
      
    } catch (error) {
      console.warn('Authentication check failed, showing login:', error);
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
    
    // Start connection heartbeat
    this.startConnectionHeartbeat();
    
    // Mark app as ready
    document.body.classList.add('app-ready');
    
    console.log('▶️ Application started successfully with Colyseus');
    this.logInitStep('Start', 'Game loop and WebSocket systems running');
  }

  /**
   * Start connection heartbeat to maintain WebSocket
   */
  startConnectionHeartbeat() {
    // Ping every 30 seconds to maintain connection
    setInterval(() => {
      if (this.networkManager.isAuthenticated()) {
        this.networkManager.ping();
      }
    }, 30000);
  }

  /**
   * NEW Event Handlers for Colyseus
   */
  handleColyseusConnected(data) {
    console.log('🔌 Colyseus connected:', data);
    this.showNetworkStatus('Connected to game server', 'success');
  }

  handleColyseusError(data) {
    console.warn('⚠️ Colyseus connection error:', data);
    this.showNetworkStatus('Game server connection lost. Reconnecting...', 'warning');
  }

  handleColyseusLoginSuccess(user) {
    console.log('✅ Colyseus authentication successful:', user.username);
    this.gameState.setAuthenticated(user, this.networkManager.getAccessToken());
  }

  handleWorldJoined(worldRoom) {
    console.log('🌍 Joined world room:', worldRoom.id);
    this.showNetworkStatus('Joined game world!', 'success');
    
    // Could transition to world scene here
    // this.sceneManager.switchToScene('world', { room: worldRoom });
  }

  /**
   * Existing Event Handlers (updated)
   */
  handleWindowResize() {
    console.log('📐 Window resized');
  }

  handleGlobalKeyDown(event) {
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
        
      case 'F2':
        // Debug: Show Colyseus status
        event.preventDefault();
        console.log('🔧 Colyseus Status:', this.colyseusManager.getConnectionStatus());
        break;
        
      case 'Escape':
        this.handleEscapeKey();
        break;
    }
  }

  handleUserLogin(user) {
    console.log('👤 User logged in:', user.username);
    this.gameState.setLoading(false);
  }

  handleUserLogout() {
    console.log('🚪 User logged out');
    this.gameState.setLoading(false);
  }

  handleSceneChange(data) {
    console.log(`🎬 Scene changed: ${data.previous} → ${data.current}`);
    this.gameState.setCurrentScene(data.current);
  }

  handleSceneSwitched(data) {
    console.log(`✅ Scene switch complete: ${data.name}`);
    this.gameState.setLoading(false);
  }

  handleTransitionStart(data) {
    console.log(`🔄 Scene transition started: ${data.from} → ${data.to}`);
    this.gameState.setLoading(true, `Loading ${data.to}...`);
  }

  handleNetworkOffline() {
    console.warn('📡 Network connection lost');
    this.showNetworkStatus('You are currently offline', 'warning');
  }

  handleNetworkOnline() {
    console.log('📡 Network connection restored');
    this.showNetworkStatus('Connection restored', 'success');
    
    // Try to reconnect Colyseus
    if (!this.colyseusManager.isConnectedToAuth()) {
      this.colyseusManager.connectToAuthRoom().catch(console.error);
    }
  }

  handleApplicationError(error) {
    console.error('🚨 Application error:', error);
    this.showErrorNotification('Something went wrong. Please refresh the page.');
  }

  handleEscapeKey() {
    const currentScene = this.gameState.getCurrentScene();
    
    switch (currentScene) {
      case 'login':
        break;
      case 'welcomeMenu':
        break;
       case 'clashMenu':
        // Return to welcome menu from clash menu
        this.sceneManager.switchToScene('welcomeMenu', {}, 'slide');
        break;
    }
  }

  handleForceRefresh() {
    const confirmed = confirm('Force refresh the application? Any unsaved progress will be lost.');
    if (confirmed) {
      // Cleanup Colyseus connections before refresh
      this.networkManager.dispose();
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
          <p>🎮 Loading game engine and 3D graphics</p>
          <p>🔌 Connecting to game server via WebSocket</p>
          <p>⚡ Preparing real-time multiplayer features</p>
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
          <li>Game server connectivity issues</li>
          <li>Browser compatibility problems</li>
          <li>WebSocket connection blocked by firewall</li>
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
      max-width: 300px;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, type === 'warning' ? 5000 : 3000);
  }

  showErrorNotification(message) {
    this.showNetworkStatus(message, 'warning');
  }

  showDebugInfo() {
    const debugInfo = this.gameState.getDebugInfo();
    const colyseusStatus = this.colyseusManager.getConnectionStatus();
    const networkStatus = this.networkManager.getConnectionStatus();
    
    console.log('🐛 Debug Info:', debugInfo);
    console.log('🎮 Game Engine Performance:', this.gameEngine.getPerformanceStats());
    console.log('🔌 Colyseus Status:', colyseusStatus);
    console.log('🌐 Network Status:', networkStatus);
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
    
    // Dispose network connections
    this.networkManager.dispose();
    
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
    
    console.log('🎉 ClashRoyale application with Colyseus started successfully!');
    
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
