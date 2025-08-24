import * as THREE from 'three';
// Option 1: Import par défaut (le plus courant)
import TWEEN from '@tweenjs/tween.js';

/**
 * Game Engine - Core Three.js setup and management
 * Handles rendering, scene management, camera controls, and performance optimization
 */
class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.isInitialized = false;
    this.isRunning = false;
    this.isPaused = false;
    
    // Core Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = null;
    
    // Rendering state
    this.lastFrameTime = 0;
    this.deltaTime = 0;
    this.frameCount = 0;
    this.fpsHistory = [];
    this.targetFPS = 60;
    
    // Event system
    this.eventListeners = new Map();
    
    // Performance monitoring
    this.performanceStats = {
      drawCalls: 0,
      triangles: 0,
      memoryUsage: 0,
      fps: 0
    };
    
    // Resize handling
    this.resizeObserver = null;
    this.currentSize = { width: 0, height: 0 };
    
    // Animation frame ID for cleanup
    this.animationFrameId = null;
    
    // Initialize if canvas is provided
    if (canvas) {
      this.initialize();
    }
  }

  /**
   * Initialize the game engine
   */
  initialize() {
    try {
      console.log('🎮 Initializing Game Engine...');
      
      this.setupRenderer();
      this.setupScene();
      this.setupCamera();
      this.setupLighting();
      this.setupClock();
      this.setupResizeHandling();
      this.setupEventListeners();
      
      this.isInitialized = true;
      this.emit('engine:initialized');
      
      console.log('✅ Game Engine initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Game Engine:', error);
      throw error;
    }
  }

  /**
   * Setup WebGL renderer with optimizations
   */
  setupRenderer() {
    const parent = this.canvas.parentElement;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });

    // Renderer settings
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const parent = this.canvas.parentElement;
this.renderer.setSize(parent.clientWidth, parent.clientHeight);
    this.renderer.setClearColor(0x1a1a2e, 1.0); // Dark blue background
    
    // Enable shadows for better visuals
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Color management
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // Performance optimizations
    this.renderer.info.autoReset = false;
    
    console.log('✅ WebGL Renderer configured');
  }

  /**
   * Setup main scene
   */
  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    
    // Add fog for depth perception
    this.scene.fog = new THREE.Fog(0x1a1a2e, 50, 200);
    
    console.log('✅ Scene created');
  }

  /**
   * Setup camera with optimal settings for game view
   */
  setupCamera() {
const parent = this.canvas.parentElement;
const aspect = parent.clientWidth / parent.clientHeight;
    
    this.camera = new THREE.PerspectiveCamera(
      60, // FOV - good for game view
      aspect,
      0.1, // Near plane
      1000 // Far plane
    );
    
    // Position camera for top-down game view (like Clash Royale)
    this.camera.position.set(0, 25, 15);
    this.camera.lookAt(0, 0, 0);
    
    console.log('✅ Camera configured');
  }

  /**
   * Setup lighting for the game scene
   */
  setupLighting() {
    // Ambient light for general illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);
    
    // Directional light (sun) for shadows and main lighting
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    
    // Shadow camera settings
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    
    this.scene.add(directionalLight);
    
    // Optional: Add a hemisphere light for more natural lighting
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x654321, 0.3);
    this.scene.add(hemisphereLight);
    
    console.log('✅ Lighting setup complete');
  }

  /**
   * Setup clock for time-based animations
   */
  setupClock() {
    this.clock = new THREE.Clock();
    console.log('✅ Clock initialized');
  }

  /**
   * Setup responsive resize handling
   */
  setupResizeHandling() {
    // Use ResizeObserver for better performance than window resize
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
const parent = this.canvas.parentElement;
this.handleResize(parent.clientWidth, parent.clientHeight);        }
      });
      
      this.resizeObserver.observe(this.canvas.parentElement || this.canvas);
    } else {
      // Fallback to window resize
      window.addEventListener('resize', () => {
        this.handleResize(window.innerWidth, window.innerHeight);
      });
    }
    
    console.log('✅ Resize handling configured');
  }

  /**
   * Handle window/canvas resize
   */
  handleResize(width, height) {
    if (width === this.currentSize.width && height === this.currentSize.height) {
      return; // No change
    }
    
    this.currentSize = { width, height };
    
    // Update camera aspect ratio
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    // Update renderer size
    this.renderer.setSize(width, height);
    
    this.emit('engine:resize', { width, height });
    
    console.log(`📐 Resized to ${width}x${height}`);
  }

  /**
   * Setup general event listeners
   */
  setupEventListeners() {
    // Visibility change handling (pause when tab not visible)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
    
    console.log('✅ Event listeners configured');
  }

  /**
   * Start the render loop
   */
  start() {
    if (!this.isInitialized) {
      throw new Error('Engine must be initialized before starting');
    }
    
    if (this.isRunning) {
      console.warn('Engine is already running');
      return;
    }
    
    this.isRunning = true;
    this.isPaused = false;
    this.clock.start();
    this.animate();
    
    this.emit('engine:started');
    console.log('▶️ Game Engine started');
  }

  /**
   * Stop the render loop
   */
  stop() {
    this.isRunning = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.emit('engine:stopped');
    console.log('⏹️ Game Engine stopped');
  }

  /**
   * Pause the engine
   */
  pause() {
    if (!this.isRunning || this.isPaused) return;
    
    this.isPaused = true;
    this.clock.stop();
    this.emit('engine:paused');
    console.log('⏸️ Game Engine paused');
  }

  /**
   * Resume the engine
   */
  resume() {
    if (!this.isRunning || !this.isPaused) return;
    
    this.isPaused = false;
    this.clock.start();
    this.emit('engine:resumed');
    console.log('▶️ Game Engine resumed');
  }

  /**
   * Main animation loop
   */
  animate(currentTime = 0) {
    if (!this.isRunning) return;
    
    this.animationFrameId = requestAnimationFrame((time) => this.animate(time));
    
    if (this.isPaused) return;
    
    // Calculate delta time
    this.deltaTime = this.clock.getDelta();
    this.lastFrameTime = currentTime;
    this.frameCount++;
    
    // Update performance stats
    this.updatePerformanceStats();
    
    // Update tweens
    TWEEN.update();
    
    // Emit update event for game objects
    this.emit('engine:update', {
      deltaTime: this.deltaTime,
      totalTime: this.clock.getElapsedTime(),
      frameCount: this.frameCount
    });
    
    // Render the scene
    this.render();
    
    // Emit after render event
    this.emit('engine:render');
  }

  /**
   * Render the current scene
   */
  render() {
    if (!this.scene || !this.camera || !this.renderer) return;
    
    // Reset renderer info for performance tracking
    this.renderer.info.reset();
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Update performance statistics
   */
  updatePerformanceStats() {
    // Calculate FPS
    if (this.frameCount % 60 === 0) { // Update every 60 frames
      const now = performance.now();
      if (this.lastPerformanceUpdate) {
        const fps = 60000 / (now - this.lastPerformanceUpdate);
        this.performanceStats.fps = Math.round(fps);
        this.fpsHistory.push(fps);
        
        // Keep only last 100 FPS readings
        if (this.fpsHistory.length > 100) {
          this.fpsHistory.shift();
        }
      }
      this.lastPerformanceUpdate = now;
    }
    
    // Update render stats
    this.performanceStats.drawCalls = this.renderer.info.render.calls;
    this.performanceStats.triangles = this.renderer.info.render.triangles;
    
    // Memory usage (if available)
    if (this.renderer.info.memory) {
      this.performanceStats.memoryUsage = this.renderer.info.memory.geometries + 
                                         this.renderer.info.memory.textures;
    }
  }

  /**
   * Get current performance statistics
   */
  getPerformanceStats() {
    return {
      ...this.performanceStats,
      averageFPS: this.fpsHistory.length > 0 ? 
        Math.round(this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length) : 0
    };
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
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Cleanup and dispose resources
   */
  dispose() {
    console.log('🧹 Disposing Game Engine...');
    
    this.stop();
    
    // Dispose of Three.js resources
    if (this.scene) {
      this.scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    }
    
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    // Clean up resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    // Clear event listeners
    this.eventListeners.clear();
    
    console.log('✅ Game Engine disposed');
  }

  /**
   * Getters for core components
   */
  getScene() { return this.scene; }
  getCamera() { return this.camera; }
  getRenderer() { return this.renderer; }
  getClock() { return this.clock; }
  
  /**
   * State getters
   */
  isEngineRunning() { return this.isRunning; }
  isEnginePaused() { return this.isPaused; }
  isEngineInitialized() { return this.isInitialized; }
}

export default GameEngine;
