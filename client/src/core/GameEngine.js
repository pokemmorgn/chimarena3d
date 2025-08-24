import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

/**
 * Game Engine - Mobile Portrait Optimized
 * Handles Three.js rendering optimized for mobile portrait format (375x812)
 */
class GameEngine {
  constructor(canvasContainer) {
    // Mobile viewport dimensions
    this.MOBILE_WIDTH = 375;
    this.MOBILE_HEIGHT = 812;
    this.TARGET_FPS = 60;
    this.PIXEL_RATIO = Math.min(window.devicePixelRatio, 2);
    
    // Canvas container (mobile viewport)
    this.canvasContainer = canvasContainer || document.getElementById('mobile-viewport');
    this.canvas = null;
    
    // State
    this.isInitialized = false;
    this.isRunning = false;
    this.isPaused = false;
    this.isMobile = window.innerWidth <= 425;
    
    // Core Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = null;
    
    // Mobile-optimized rendering
    this.currentSize = { width: 0, height: 0 };
    this.lastFrameTime = 0;
    this.deltaTime = 0;
    this.frameCount = 0;
    this.fpsHistory = [];
    this.adaptiveQuality = true;
    
    // Performance monitoring for mobile
    this.performanceStats = {
      drawCalls: 0,
      triangles: 0,
      memoryUsage: 0,
      fps: 0,
      batteryLevel: 1.0,
      thermalState: 'nominal' // nominal, fair, serious, critical
    };
    
    // Event system
    this.eventListeners = new Map();
    
    // Mobile-specific observers
    this.resizeObserver = null;
    this.visibilityObserver = null;
    this.animationFrameId = null;
    
    // Performance scaling
    this.qualityLevel = this.detectInitialQuality();
    this.shadowsEnabled = this.qualityLevel !== 'low';
    this.particlesEnabled = this.qualityLevel === 'high';
    
    console.log(`🎮 GameEngine created for ${this.isMobile ? 'mobile' : 'desktop'} - Quality: ${this.qualityLevel}`);
  }

  /**
   * Detect initial quality based on device capabilities
   */
  detectInitialQuality() {
    const gpu = this.getGPUInfo();
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Mobile device detection and scoring
    if (isMobileDevice) {
      if (memory >= 6 && cores >= 6) return 'high';
      if (memory >= 4 && cores >= 4) return 'medium';
      return 'low';
    }
    
    // Desktop scoring
    if (memory >= 8 && cores >= 8 && gpu.tier > 1) return 'high';
    if (memory >= 4 && cores >= 4) return 'medium';
    return 'low';
  }

  /**
   * Get GPU information for quality detection
   */
  getGPUInfo() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      
      if (!gl) return { tier: 0, vendor: 'unknown', renderer: 'unknown' };
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown';
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
      
      // Simple GPU tier detection
      let tier = 1;
      if (renderer.includes('Apple') || renderer.includes('Mali-G') || renderer.includes('RTX')) {
        tier = 2;
      }
      
      return { tier, vendor, renderer };
    } catch (error) {
      return { tier: 0, vendor: 'unknown', renderer: 'unknown' };
    }
  }

  /**
   * Initialize the mobile-optimized game engine
   */
  async initialize() {
    try {
      console.log('🎮 Initializing Mobile Game Engine...');
      
      // Create canvas and inject into mobile viewport
      this.createMobileCanvas();
      
      // Setup Three.js components
      this.setupRenderer();
      this.setupScene();
      this.setupMobileCamera();
      this.setupMobileLighting();
      this.setupClock();
      
      // Mobile-specific setup
      this.setupMobileResizeHandling();
      this.setupMobileEventListeners();
      this.setupPerformanceMonitoring();
      this.setupBatteryAPI();
      
      // Apply quality settings
      this.applyQualitySettings();
      
      this.isInitialized = true;
      this.emit('engine:initialized', { 
        isMobile: this.isMobile, 
        quality: this.qualityLevel 
      });
      
      console.log('✅ Mobile Game Engine initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Mobile Game Engine:', error);
      throw error;
    }
  }

  /**
   * Create canvas optimized for mobile viewport
   */
  createMobileCanvas() {
    // Remove any existing canvas
    const existingCanvas = this.canvasContainer.querySelector('canvas');
    if (existingCanvas && existingCanvas.id !== 'game-canvas') {
      existingCanvas.remove();
    }
    
    // Create or get canvas
    this.canvas = document.getElementById('game-canvas');
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'game-canvas';
    }
    
    // Mobile-specific canvas styling
    this.canvas.style.cssText = `
      display: block;
      position: absolute;
      top: 44px;
      left: 0;
      width: 100%;
      height: calc(100% - 44px);
      z-index: 5;
      border-radius: ${this.isMobile ? '0' : '0 0 23px 23px'};
      background: #1a1a2e;
      touch-action: none;
      -webkit-touch-callout: none;
    `;
    
    // Inject canvas into mobile viewport
    if (!this.canvas.parentElement) {
      this.canvasContainer.appendChild(this.canvas);
    }
    
    console.log('📱 Mobile canvas created and injected');
  }

  /**
   * Setup WebGL renderer optimized for mobile
   */
  setupRenderer() {
    const rendererOptions = {
      canvas: this.canvas,
      alpha: false,
      antialias: this.qualityLevel === 'high',
      powerPreference: this.isMobile ? 'default' : 'high-performance',
      stencil: false,
      depth: true,
      preserveDrawingBuffer: false,
      failIfMajorPerformanceCaveat: false
    };
    
    this.renderer = new THREE.WebGLRenderer(rendererOptions);
    
    // Mobile-optimized renderer settings
    this.renderer.setPixelRatio(this.PIXEL_RATIO);
    this.renderer.setClearColor(0x1a1a2e, 1.0);
    
    // Conditional features based on quality
    if (this.shadowsEnabled) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = this.qualityLevel === 'high' ? 
        THREE.PCFSoftShadowMap : THREE.BasicShadowMap;
    }
    
    // Mobile-friendly tone mapping
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // Performance optimizations
    this.renderer.info.autoReset = false;
    this.renderer.sortObjects = true;
    
    // Set initial size
    this.updateRendererSize();
    
    console.log(`✅ Mobile WebGL renderer configured (Quality: ${this.qualityLevel})`);
  }

  /**
   * Setup scene optimized for mobile portrait
   */
  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    
    // Mobile-optimized fog (less intensive)
    if (this.qualityLevel !== 'low') {
      this.scene.fog = new THREE.Fog(0x1a1a2e, 30, 100);
    }
    
    console.log('✅ Mobile scene created');
  }

  /**
   * Setup camera optimized for mobile portrait gameplay
   */
  setupMobileCamera() {
    const aspectRatio = this.getCurrentAspectRatio();
    
    // Portrait-optimized camera settings
    this.camera = new THREE.PerspectiveCamera(
      55, // Slightly narrower FOV for mobile
      aspectRatio,
      0.1,
      500 // Reduced far plane for mobile
    );
    
    // Mobile portrait positioning (like Clash Royale)
    this.camera.position.set(0, 20, 12);
    this.camera.lookAt(0, 0, 0);
    
    // Optimize for portrait gameplay
    this.camera.rotation.order = 'YXZ';
    
    console.log('📱 Mobile camera configured for portrait gameplay');
  }

  /**
   * Setup lighting optimized for mobile performance
   */
  setupMobileLighting() {
    // Ambient light (always enabled)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);
    
    // Directional light with conditional shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(8, 15, 8);
    directionalLight.castShadow = this.shadowsEnabled;
    
    if (this.shadowsEnabled) {
      // Mobile-optimized shadow settings
      const shadowMapSize = this.qualityLevel === 'high' ? 1024 : 512;
      directionalLight.shadow.mapSize.width = shadowMapSize;
      directionalLight.shadow.mapSize.height = shadowMapSize;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 30;
      directionalLight.shadow.camera.left = -15;
      directionalLight.shadow.camera.right = 15;
      directionalLight.shadow.camera.top = 15;
      directionalLight.shadow.camera.bottom = -15;
      directionalLight.shadow.bias = -0.0001;
    }
    
    this.scene.add(directionalLight);
    
    // Optional hemisphere light for higher quality
    if (this.qualityLevel === 'high') {
      const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x543422, 0.3);
      this.scene.add(hemisphereLight);
    }
    
    console.log(`✅ Mobile lighting setup (Shadows: ${this.shadowsEnabled})`);
  }

  /**
   * Setup clock for mobile-optimized timing
   */
  setupClock() {
    this.clock = new THREE.Clock();
    console.log('✅ Mobile clock initialized');
  }

  /**
   * Setup mobile-specific resize handling
   */
  setupMobileResizeHandling() {
    // Use ResizeObserver for mobile viewport container
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          this.handleMobileResize();
        }
      });
      
      this.resizeObserver.observe(this.canvasContainer);
    }
    
    // Fallback for orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.handleMobileResize(), 100);
    });
    
    // Window resize for desktop scaling
    window.addEventListener('resize', () => this.handleMobileResize());
    
    console.log('✅ Mobile resize handling configured');
  }

  /**
   * Handle mobile viewport resize
   */
  handleMobileResize() {
    const newSize = this.getCurrentViewportSize();
    
    if (newSize.width === this.currentSize.width && 
        newSize.height === this.currentSize.height) {
      return; // No change
    }
    
    this.currentSize = newSize;
    this.updateRendererSize();
    this.updateCameraAspect();
    
    this.emit('engine:resize', this.currentSize);
    console.log(`📐 Mobile resize: ${newSize.width}x${newSize.height}`);
  }

  /**
   * Get current viewport size
   */
  getCurrentViewportSize() {
    if (this.isMobile) {
      return {
        width: window.innerWidth,
        height: window.innerHeight - 44 // Account for status bar
      };
    } else {
      // Desktop: use mobile viewport dimensions
      const rect = this.canvasContainer.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height - 44
      };
    }
  }

  /**
   * Get current aspect ratio
   */
  getCurrentAspectRatio() {
    const size = this.getCurrentViewportSize();
    return size.width / size.height;
  }

  /**
   * Update renderer size
   */
  updateRendererSize() {
    if (!this.renderer) return;
    
    const size = this.getCurrentViewportSize();
    this.renderer.setSize(size.width, size.height);
    
    // Adjust pixel ratio based on performance
    if (this.adaptiveQuality) {
      const avgFPS = this.getAverageFPS();
      if (avgFPS < 30 && this.PIXEL_RATIO > 1) {
        this.renderer.setPixelRatio(1);
      } else if (avgFPS > 50) {
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      }
    }
  }

  /**
   * Update camera aspect ratio
   */
  updateCameraAspect() {
    if (!this.camera) return;
    
    this.camera.aspect = this.getCurrentAspectRatio();
    this.camera.updateProjectionMatrix();
  }

  /**
   * Setup mobile-specific event listeners
   */
  setupMobileEventListeners() {
    // Touch events for mobile
    if ('ontouchstart' in window) {
      this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
      this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
      this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    }
    
    // Mouse events for desktop testing
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // Visibility change (mobile-critical for battery)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
    
    // Battery API integration
    this.setupBatteryAPI();
    
    console.log('✅ Mobile event listeners configured');
  }

  /**
   * Setup performance monitoring for mobile
   */
  setupPerformanceMonitoring() {
    // Performance observer for frame timing
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'measure') {
              this.handlePerformanceMeasure(entry);
            }
          }
        });
        observer.observe({ entryTypes: ['measure'] });
      } catch (error) {
        console.warn('Performance Observer not supported');
      }
    }
    
    // Memory pressure detection (mobile)
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
        if (memoryUsage > 0.9 && this.qualityLevel !== 'low') {
          console.warn('📱 High memory usage detected, reducing quality');
          this.reduceQuality();
        }
      }, 5000);
    }
    
    console.log('✅ Mobile performance monitoring setup');
  }

  /**
   * Setup Battery API for mobile optimization
   */
  async setupBatteryAPI() {
    try {
      if ('getBattery' in navigator) {
        const battery = await navigator.getBattery();
        
        this.performanceStats.batteryLevel = battery.level;
        
        const handleBatteryChange = () => {
          this.performanceStats.batteryLevel = battery.level;
          
          // Reduce quality on low battery
          if (battery.level < 0.2 && !battery.charging && this.qualityLevel !== 'low') {
            console.warn('🔋 Low battery detected, optimizing performance');
            this.adaptToLowBattery();
          }
        };
        
        battery.addEventListener('levelchange', handleBatteryChange);
        battery.addEventListener('chargingchange', handleBatteryChange);
      }
    } catch (error) {
      console.log('Battery API not available');
    }
  }

  /**
   * Touch event handlers
   */
  handleTouchStart(event) {
    event.preventDefault();
    this.emit('input:touch_start', {
      touches: Array.from(event.touches),
      timestamp: performance.now()
    });
  }

  handleTouchMove(event) {
    event.preventDefault();
    this.emit('input:touch_move', {
      touches: Array.from(event.touches),
      timestamp: performance.now()
    });
  }

  handleTouchEnd(event) {
    this.emit('input:touch_end', {
      touches: Array.from(event.touches),
      changedTouches: Array.from(event.changedTouches),
      timestamp: performance.now()
    });
  }

  /**
   * Mouse event handlers (desktop testing)
   */
  handleMouseDown(event) {
    this.emit('input:mouse_down', {
      x: event.clientX,
      y: event.clientY,
      button: event.button,
      timestamp: performance.now()
    });
  }

  handleMouseMove(event) {
    this.emit('input:mouse_move', {
      x: event.clientX,
      y: event.clientY,
      timestamp: performance.now()
    });
  }

  handleMouseUp(event) {
    this.emit('input:mouse_up', {
      x: event.clientX,
      y: event.clientY,
      button: event.button,
      timestamp: performance.now()
    });
  }

  /**
   * Apply quality settings based on device capabilities
   */
  applyQualitySettings() {
    const settings = {
      low: {
        pixelRatio: 1,
        shadowMapSize: 256,
        maxLights: 2,
        particleCount: 0,
        postProcessing: false
      },
      medium: {
        pixelRatio: Math.min(window.devicePixelRatio, 1.5),
        shadowMapSize: 512,
        maxLights: 3,
        particleCount: 50,
        postProcessing: false
      },
      high: {
        pixelRatio: Math.min(window.devicePixelRatio, 2),
        shadowMapSize: 1024,
        maxLights: 4,
        particleCount: 100,
        postProcessing: true
      }
    };
    
    const config = settings[this.qualityLevel];
    this.PIXEL_RATIO = config.pixelRatio;
    this.shadowsEnabled = this.qualityLevel !== 'low';
    this.particlesEnabled = config.particleCount > 0;
    
    if (this.renderer) {
      this.renderer.setPixelRatio(this.PIXEL_RATIO);
    }
    
    console.log(`⚡ Applied ${this.qualityLevel} quality settings`);
  }

  /**
   * Start the mobile-optimized render loop
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
    this.animateMobile();
    
    this.emit('engine:started');
    console.log('▶️ Mobile Game Engine started');
  }

  /**
   * Mobile-optimized animation loop
   */
  animateMobile(currentTime = 0) {
    if (!this.isRunning) return;
    
    this.animationFrameId = requestAnimationFrame((time) => this.animateMobile(time));
    
    if (this.isPaused) return;
    
    // Frame timing
    this.deltaTime = this.clock.getDelta();
    this.lastFrameTime = currentTime;
    this.frameCount++;
    
    // Adaptive quality based on performance
    if (this.adaptiveQuality && this.frameCount % 60 === 0) {
      this.adjustQualityBasedOnPerformance();
    }
    
    // Update performance stats
    this.updatePerformanceStats();
    
    // Update tweens
    TWEEN.update();
    
    // Emit update event
    this.emit('engine:update', {
      deltaTime: this.deltaTime,
      totalTime: this.clock.getElapsedTime(),
      frameCount: this.frameCount,
      isMobile: this.isMobile
    });
    
    // Render the scene
    this.renderMobile();
    
    // Emit after render
    this.emit('engine:render');
  }

  /**
   * Mobile-optimized render method
   */
  renderMobile() {
    if (!this.scene || !this.camera || !this.renderer) return;
    
    // Reset renderer info for performance tracking
    this.renderer.info.reset();
    
    // Mobile-specific optimizations
    if (this.isMobile && this.qualityLevel === 'low') {
      // Reduce render calls for low-end mobile
      this.renderer.setScissorTest(false);
      this.renderer.clear();
    }
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Adaptive quality adjustment based on performance
   */
  adjustQualityBasedOnPerformance() {
    const avgFPS = this.getAverageFPS();
    const batteryLevel = this.performanceStats.batteryLevel;
    
    // Downgrade quality if performance is poor
    if (avgFPS < 25 && this.qualityLevel === 'high') {
      this.qualityLevel = 'medium';
      this.applyQualitySettings();
      console.log('📉 Quality reduced to medium due to low FPS');
    } else if (avgFPS < 20 && this.qualityLevel === 'medium') {
      this.qualityLevel = 'low';
      this.applyQualitySettings();
      console.log('📉 Quality reduced to low due to very low FPS');
    }
    
    // Upgrade quality if performance is good and battery is okay
    else if (avgFPS > 55 && batteryLevel > 0.5 && this.qualityLevel === 'low') {
      this.qualityLevel = 'medium';
      this.applyQualitySettings();
      console.log('📈 Quality upgraded to medium due to good performance');
    }
  }

  /**
   * Get average FPS from recent history
   */
  getAverageFPS() {
    if (this.fpsHistory.length === 0) return 60;
    
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    return sum / this.fpsHistory.length;
  }

  /**
   * Update performance statistics
   */
  updatePerformanceStats() {
    // Calculate FPS every 60 frames
    if (this.frameCount % 60 === 0) {
      const now = performance.now();
      if (this.lastPerformanceUpdate) {
        const fps = 60000 / (now - this.lastPerformanceUpdate);
        this.performanceStats.fps = Math.round(fps);
        this.fpsHistory.push(fps);
        
        // Keep only last 30 readings (30 seconds)
        if (this.fpsHistory.length > 30) {
          this.fpsHistory.shift();
        }
      }
      this.lastPerformanceUpdate = now;
    }
    
    // Update render stats
    if (this.renderer && this.renderer.info) {
      this.performanceStats.drawCalls = this.renderer.info.render.calls;
      this.performanceStats.triangles = this.renderer.info.render.triangles;
    }
    
    // Memory usage (if available)
    if (performance.memory) {
      this.performanceStats.memoryUsage = performance.memory.usedJSHeapSize / 1048576; // MB
    }
  }

  /**
   * Adapt to low battery conditions
   */
  adaptToLowBattery() {
    this.qualityLevel = 'low';
    this.TARGET_FPS = 30;
    this.shadowsEnabled = false;
    this.particlesEnabled = false;
    this.applyQualitySettings();
    
    // Reduce renderer pixel ratio
    if (this.renderer) {
      this.renderer.setPixelRatio(1);
    }
    
    this.emit('engine:battery_optimization');
  }

  /**
   * Reduce quality for performance
   */
  reduceQuality() {
    if (this.qualityLevel === 'high') {
      this.qualityLevel = 'medium';
    } else if (this.qualityLevel === 'medium') {
      this.qualityLevel = 'low';
    }
    
    this.applyQualitySettings();
    this.emit('engine:quality_reduced', this.qualityLevel);
  }

  /**
   * Pause engine (mobile-optimized)
   */
  pause() {
    if (!this.isRunning || this.isPaused) return;
    
    this.isPaused = true;
    this.clock.stop();
    
    // Mobile-specific pause optimizations
    if (this.isMobile) {
      // Reduce background processing
      this.renderer.setAnimationLoop(null);
    }
    
    this.emit('engine:paused');
    console.log('⏸️ Mobile Game Engine paused');
  }

  /**
   * Resume engine
   */
  resume() {
    if (!this.isRunning || !this.isPaused) return;
    
    this.isPaused = false;
    this.clock.start();
    
    this.emit('engine:resumed');
    console.log('▶️ Mobile Game Engine resumed');
  }

  /**
   * Stop engine
   */
  stop() {
    this.isRunning = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.emit('engine:stopped');
    console.log('⏹️ Mobile Game Engine stopped');
  }

  /**
   * Get mobile-specific performance stats
   */
  getPerformanceStats() {
    return {
      ...this.performanceStats,
      averageFPS: this.getAverageFPS(),
      qualityLevel: this.qualityLevel,
      isMobile: this.isMobile,
      viewportSize: this.currentSize,
      memoryPressure: this.performanceStats.memoryUsage > 100 ? 'high' : 'normal'
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
    console.log('🧹 Disposing Mobile Game Engine...');
    
    this.stop();
    
    // Dispose Three.js resources
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
    
    // Clean up observers
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    // Clear event listeners
    this.eventListeners.clear();
    
    console.log('✅ Mobile Game Engine disposed');
  }

  /**
   * Getters for core components
   */
  getScene() { return this.scene; }
  getCamera() { return this.camera; }
  getRenderer() { return this.renderer; }
  getClock() { return this.clock; }
  
  /**
   * Mobile-specific getters
   */
  isMobileDevice() { return this.isMobile; }
  getQualityLevel() { return this.qualityLevel; }
  getViewportSize() { return this.currentSize; }
  getBatteryLevel() { return this.performanceStats.batteryLevel; }
  
  /**
   * State getters
   */
  isEngineRunning() { return this.isRunning; }
  isEnginePaused() { return this.isPaused; }
  isEngineInitialized() { return this.isInitialized; }
  
  /**
   * Force quality level (for testing/debugging)
   */
  setQualityLevel(level) {
    if (['low', 'medium', 'high'].includes(level)) {
      this.qualityLevel = level;
      this.applyQualitySettings();
      this.emit('engine:quality_changed', level);
      console.log(`🎛️ Quality manually set to: ${level}`);
    }
  }
  
  /**
   * Enable/disable adaptive quality
   */
  setAdaptiveQuality(enabled) {
    this.adaptiveQuality = enabled;
    console.log(`🔄 Adaptive quality: ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Get canvas element for external use
   */
  getCanvas() {
    return this.canvas;
  }
  
  /**
   * Get mobile viewport container
   */
  getMobileViewport() {
    return this.canvasContainer;
  }
  
  /**
   * Debug method to log current state
   */
  getDebugInfo() {
    return {
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      isMobile: this.isMobile,
      qualityLevel: this.qualityLevel,
      adaptiveQuality: this.adaptiveQuality,
      shadowsEnabled: this.shadowsEnabled,
      particlesEnabled: this.particlesEnabled,
      currentSize: this.currentSize,
      pixelRatio: this.PIXEL_RATIO,
      targetFPS: this.TARGET_FPS,
      performance: this.getPerformanceStats(),
      camera: {
        position: this.camera?.position,
        rotation: this.camera?.rotation,
        fov: this.camera?.fov,
        aspect: this.camera?.aspect
      },
      renderer: {
        capabilities: this.renderer?.capabilities,
        extensions: this.renderer?.extensions,
        info: this.renderer?.info
      }
    };
  }
  
  /**
   * Screenshot functionality for mobile sharing
   */
  takeScreenshot(format = 'image/png', quality = 0.9) {
    if (!this.renderer) {
      console.warn('Renderer not available for screenshot');
      return null;
    }
    
    try {
      // Render current frame
      this.renderer.render(this.scene, this.camera);
      
      // Get image data
      const canvas = this.renderer.domElement;
      const dataURL = canvas.toDataURL(format, quality);
      
      this.emit('engine:screenshot', { dataURL, format, quality });
      console.log('📸 Screenshot captured');
      
      return dataURL;
    } catch (error) {
      console.error('Failed to take screenshot:', error);
      return null;
    }
  }
  
  /**
   * Performance profiling for development
   */
  startProfiling() {
    if (!this.profilingData) {
      this.profilingData = {
        startTime: performance.now(),
        frames: [],
        events: []
      };
      
      console.log('📊 Performance profiling started');
    }
  }
  
  stopProfiling() {
    if (this.profilingData) {
      const duration = performance.now() - this.profilingData.startTime;
      const report = {
        duration,
        totalFrames: this.profilingData.frames.length,
        averageFPS: this.getAverageFPS(),
        qualityChanges: this.profilingData.events.filter(e => e.type === 'quality_change').length,
        memoryPeaks: this.profilingData.events.filter(e => e.type === 'memory_peak').length
      };
      
      console.log('📊 Performance profiling report:', report);
      this.profilingData = null;
      
      return report;
    }
    
    return null;
  }
}
