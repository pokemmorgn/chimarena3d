import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

/**
 * Scene Manager - Mobile Portrait Optimized
 * Handles scene transitions and lifecycle optimized for mobile touch interface
 */
class SceneManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    
    // Mobile-specific properties
    this.isMobile = this.gameEngine.isMobileDevice();
    this.isTransitioning = false;
    this.transitionQueue = [];
    
    // Scene registry
    this.scenes = new Map();
    this.currentScene = null;
    this.previousScene = null;
    
    // Mobile-optimized transition settings
    this.mobileTransitionDuration = this.isMobile ? 600 : 800; // Faster on mobile
    this.transitionEasing = TWEEN.Easing.Cubic.InOut;
    
    // Touch-friendly transition types
    this.mobileTransitions = {
      'slide-left': this.slideLeftTransition.bind(this),
      'slide-right': this.slideRightTransition.bind(this),
      'slide-up': this.slideUpTransition.bind(this),
      'slide-down': this.slideDownTransition.bind(this),
      'fade': this.fadeTransition.bind(this),
      'zoom': this.zoomTransition.bind(this),
      'card-flip': this.cardFlipTransition.bind(this),
      'push': this.pushTransition.bind(this),
      'modal': this.modalTransition.bind(this),
      'instant': this.instantTransition.bind(this)
    };
    
    // Event system
    this.eventListeners = new Map();
    
    // Scene history for mobile navigation
    this.sceneHistory = [];
    this.maxHistorySize = 10;
    
    // Preloading optimized for mobile
    this.preloadedScenes = new Set();
    this.preloadQueue = [];
    this.maxPreloadedScenes = this.isMobile ? 2 : 4; // Less on mobile
    
    // Touch gesture integration
    this.gestureEnabled = true;
    this.swipeThreshold = 50;
    this.touchStartX = 0;
    this.touchStartY = 0;
    
    // Mobile performance tracking
    this.transitionPerformance = {
      averageTransitionTime: 0,
      transitionCount: 0,
      failedTransitions: 0
    };
    
    console.log(`🎬 SceneManager created for ${this.isMobile ? 'mobile' : 'desktop'}`);
  }

  /**
   * Initialize mobile-optimized scene manager
   */
  async initialize() {
    try {
      console.log('🎬 Initializing Mobile SceneManager...');
      
      // Setup mobile-specific ground plane
      this.createMobileArena();
      
      // Setup gesture handling
      if (this.gestureEnabled && this.isMobile) {
        this.setupGestureHandling();
      }
      
      // Setup performance monitoring
      this.setupTransitionPerformanceMonitoring();
      
      console.log('✅ Mobile SceneManager initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Mobile SceneManager:', error);
      throw error;
    }
  }

  /**
   * Create mobile arena base
   */
  createMobileArena() {
    // Simple ground plane optimized for mobile
    const groundGeometry = new THREE.PlaneGeometry(30, 50); // Portrait ratio
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x4a6741,
      transparent: true,
      opacity: 0.8
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = this.gameEngine.getQualityLevel() !== 'low';
    ground.name = 'MobileArena';
    
    this.gameEngine.scene.add(ground);
    
    // Add mobile-optimized arena boundaries
    this.createArenaBoundaries();
    
    console.log('🏟️ Mobile arena created');
  }

  /**
   * Create arena boundaries for mobile portrait view
   */
  createArenaBoundaries() {
    const boundaryHeight = 2;
    const boundaryGeometry = new THREE.BoxGeometry(1, boundaryHeight, 1);
    const boundaryMaterial = new THREE.MeshLambertMaterial({
      color: 0x2c3e50,
      transparent: true,
      opacity: 0.6
    });
    
    // Portrait arena boundaries
    const positions = [
      [-15, boundaryHeight/2, -25], [15, boundaryHeight/2, -25], // Back
      [-15, boundaryHeight/2, 25], [15, boundaryHeight/2, 25],   // Front
      [-15, boundaryHeight/2, 0], [15, boundaryHeight/2, 0]      // Sides markers
    ];
    
    positions.forEach((pos, index) => {
      const boundary = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
      boundary.position.set(...pos);
      boundary.name = `Boundary${index}`;
      this.gameEngine.scene.add(boundary);
    });
  }

  /**
   * Setup mobile gesture handling for scene transitions
   */
  setupGestureHandling() {
    const canvas = this.gameEngine.getCanvas();
    if (!canvas) return;
    
    let touchStartTime = 0;
    let isDragging = false;
    
    const handleTouchStart = (event) => {
      const touch = event.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      touchStartTime = Date.now();
      isDragging = false;
    };
    
    const handleTouchMove = (event) => {
      if (!isDragging && event.touches.length === 1) {
        const touch = event.touches[0];
        const deltaX = Math.abs(touch.clientX - this.touchStartX);
        const deltaY = Math.abs(touch.clientY - this.touchStartY);
        
        if (deltaX > 10 || deltaY > 10) {
          isDragging = true;
        }
      }
    };
    
    const handleTouchEnd = (event) => {
      if (!isDragging && event.changedTouches.length === 1) {
        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        const deltaTime = Date.now() - touchStartTime;
        
        // Detect swipe gestures for scene navigation
        if (Math.abs(deltaX) > this.swipeThreshold && deltaTime < 300) {
          if (deltaX > 0) {
            this.handleSwipeRight();
          } else {
            this.handleSwipeLeft();
          }
        } else if (Math.abs(deltaY) > this.swipeThreshold && deltaTime < 300) {
          if (deltaY > 0) {
            this.handleSwipeDown();
          } else {
            this.handleSwipeUp();
          }
        }
      }
      
      isDragging = false;
    };
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    console.log('👆 Mobile gesture handling setup');
  }

  /**
   * Gesture handlers for mobile navigation
   */
  handleSwipeLeft() {
    this.emit('gesture:swipe_left');
    console.log('👈 Swipe left detected');
  }

  handleSwipeRight() {
    this.emit('gesture:swipe_right');
    // Back navigation on right swipe
    if (this.sceneHistory.length > 0) {
      this.goBack();
    }
    console.log('👉 Swipe right detected');
  }

  handleSwipeUp() {
    this.emit('gesture:swipe_up');
    console.log('👆 Swipe up detected');
  }

  handleSwipeDown() {
    this.emit('gesture:swipe_down');
    console.log('👇 Swipe down detected');
  }

  /**
   * Setup transition performance monitoring
   */
  setupTransitionPerformanceMonitoring() {
    this.on('scene:transition_start', (data) => {
      data.startTime = performance.now();
    });
    
    this.on('scene:switched', (data) => {
      if (data.startTime) {
        const duration = performance.now() - data.startTime;
        this.updateTransitionPerformance(duration);
      }
    });
  }

  /**
   * Update transition performance metrics
   */
  updateTransitionPerformance(duration) {
    this.transitionPerformance.transitionCount++;
    this.transitionPerformance.averageTransitionTime = 
      (this.transitionPerformance.averageTransitionTime * (this.transitionPerformance.transitionCount - 1) + duration) 
      / this.transitionPerformance.transitionCount;
    
    // Log slow transitions on mobile
    if (this.isMobile && duration > 1000) {
      console.warn(`⚠️ Slow mobile transition: ${Math.round(duration)}ms`);
    }
  }

  /**
   * Register a scene with mobile-specific options
   */
  registerScene(name, SceneClass, options = {}) {
    if (this.scenes.has(name)) {
      console.warn(`Scene "${name}" is already registered`);
      return;
    }

    const mobileOptions = {
      // Mobile-specific defaults
      preload: this.isMobile ? false : (options.preload || false),
      persistent: options.persistent || false,
      transition: options.transition || 'slide-left',
      mobileTransition: options.mobileTransition || options.transition || 'slide-left',
      backgroundUnload: this.isMobile ? true : (options.backgroundUnload || false),
      lowMemoryMode: this.isMobile,
      ...options
    };

    const sceneConfig = {
      SceneClass,
      instance: null,
      ...mobileOptions
    };

    this.scenes.set(name, sceneConfig);
    
    // Auto-preload only essential scenes on mobile
    if (sceneConfig.preload && this.preloadedScenes.size < this.maxPreloadedScenes) {
      this.preloadScene(name);
    }

    console.log(`📝 Mobile scene "${name}" registered`);
  }

  /**
   * Mobile-optimized scene preloading
   */
  async preloadScene(name) {
    if (!this.scenes.has(name) || this.preloadedScenes.has(name)) {
      return;
    }

    // Check memory constraints on mobile
    if (this.isMobile && this.preloadedScenes.size >= this.maxPreloadedScenes) {
      console.warn(`📱 Max preloaded scenes reached (${this.maxPreloadedScenes})`);
      return;
    }

    const sceneConfig = this.scenes.get(name);
    
    try {
      console.log(`⏳ Preloading mobile scene "${name}"...`);
      
      // Create scene instance
      const scene = new sceneConfig.SceneClass(this.gameEngine, this);
      sceneConfig.instance = scene;
      
      // Initialize with mobile context
      if (typeof scene.initialize === 'function') {
        await scene.initialize({ isMobile: this.isMobile });
      }
      
      // Lightweight preload for mobile
      if (typeof scene.preload === 'function') {
        await scene.preload({ 
          isMobile: this.isMobile,
          qualityLevel: this.gameEngine.getQualityLevel()
        });
      }
      
      this.preloadedScenes.add(name);
      this.emit('scene:preloaded', { name, scene, isMobile: this.isMobile });
      
      console.log(`✅ Mobile scene "${name}" preloaded`);
      
    } catch (error) {
      console.error(`❌ Failed to preload mobile scene "${name}":`, error);
      throw error;
    }
  }

  /**
   * Mobile-optimized scene switching with transition queue
   */
  async switchToScene(name, data = {}, transition = null) {
    // Queue transitions if one is in progress
    if (this.isTransitioning) {
      this.transitionQueue.push({ name, data, transition });
      console.log(`🔄 Transition queued: ${name}`);
      return;
    }

    if (!this.scenes.has(name)) {
      throw new Error(`Scene "${name}" is not registered`);
    }

    if (this.currentScene && this.currentScene.name === name) {
      console.warn(`Already in scene "${name}"`);
      return;
    }

    this.isTransitioning = true;
    
    try {
      console.log(`🔄 Mobile scene transition: ${this.currentScene?.name || 'null'} → ${name}`);
      
      const sceneConfig = this.scenes.get(name);
      const transitionType = this.selectMobileTransition(transition, sceneConfig);
      
      // Emit transition start
      this.emit('scene:transition_start', { 
        from: this.currentScene?.name, 
        to: name, 
        transition: transitionType,
        isMobile: this.isMobile
      });
      
      // Get or create scene instance
      let newScene = sceneConfig.instance;
      if (!newScene) {
        newScene = await this.createSceneInstance(name, sceneConfig);
      }
      
      // Memory management for mobile
      if (this.isMobile) {
        await this.manageMobileMemory(name);
      }
      
      // Store previous scene
      this.previousScene = this.currentScene;
      
      // Update scene history
      if (this.currentScene) {
        this.sceneHistory.push(this.currentScene.name);
        if (this.sceneHistory.length > this.maxHistorySize) {
          this.sceneHistory.shift();
        }
      }
      
      // Perform mobile transition
      await this.performMobileTransition(this.currentScene, newScene, transitionType, data);
      
      // Update current scene
      this.currentScene = newScene;
      this.currentScene.name = name;
      
      // Cleanup previous scene if needed
      if (this.previousScene && !this.scenes.get(this.previousScene.name)?.persistent) {
        await this.cleanupScene(this.previousScene);
      }
      
      this.emit('scene:switched', { 
        name, 
        scene: newScene, 
        data,
        previous: this.previousScene?.name,
        isMobile: this.isMobile
      });
      
      console.log(`✅ Mobile scene transition complete: ${name}`);
      
      // Process queued transitions
      this.processTransitionQueue();
      
    } catch (error) {
      this.transitionPerformance.failedTransitions++;
      console.error(`❌ Failed to switch to mobile scene "${name}":`, error);
      throw error;
    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * Select appropriate transition for mobile
   */
  selectMobileTransition(requestedTransition, sceneConfig) {
    const transition = requestedTransition || 
                     (this.isMobile ? sceneConfig.mobileTransition : sceneConfig.transition) || 
                     'slide-left';
    
    // Ensure transition exists
    if (!this.mobileTransitions[transition]) {
      console.warn(`Unknown transition: ${transition}, using slide-left`);
      return 'slide-left';
    }
    
    return transition;
  }

  /**
   * Create scene instance with mobile context
   */
  async createSceneInstance(name, sceneConfig) {
    const scene = new sceneConfig.SceneClass(this.gameEngine, this);
    sceneConfig.instance = scene;
    
    // Initialize with mobile context
    if (typeof scene.initialize === 'function') {
      await scene.initialize({ 
        isMobile: this.isMobile,
        qualityLevel: this.gameEngine.getQualityLevel(),
        batteryLevel: this.gameEngine.getBatteryLevel()
      });
    }
    
    // Preload with mobile optimizations
    if (typeof scene.preload === 'function') {
      await scene.preload({
        isMobile: this.isMobile,
        qualityLevel: this.gameEngine.getQualityLevel()
      });
    }
    
    return scene;
  }

  /**
   * Manage mobile memory during transitions
   */
  async manageMobileMemory(newSceneName) {
    if (!this.isMobile) return;
    
    // Unload non-persistent scenes to free memory
    for (const [name, config] of this.scenes) {
      if (name !== newSceneName && 
          config.instance && 
          !config.persistent &&
          this.currentScene?.name !== name) {
        
        await this.cleanupScene(config.instance);
        config.instance = null;
        this.preloadedScenes.delete(name);
        console.log(`🗑️ Unloaded scene "${name}" for mobile memory management`);
      }
    }
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }

  /**
   * Process queued transitions
   */
  async processTransitionQueue() {
    if (this.transitionQueue.length > 0 && !this.isTransitioning) {
      const { name, data, transition } = this.transitionQueue.shift();
      await this.switchToScene(name, data, transition);
    }
  }

  /**
   * Perform mobile-optimized transition
   */
  async performMobileTransition(fromScene, toScene, transitionType, data) {
    const transitionFunction = this.mobileTransitions[transitionType];
    if (!transitionFunction) {
      throw new Error(`Unknown mobile transition: ${transitionType}`);
    }
    
    const duration = this.mobileTransitionDuration;
    await transitionFunction(fromScene, toScene, duration, data);
  }

  /**
   * Mobile Transition: Slide Left (like iOS navigation)
   */
  async slideLeftTransition(fromScene, toScene, duration, data) {
    return new Promise(async (resolve) => {
      const camera = this.gameEngine.getCamera();
      const originalPosition = { ...camera.position };
      
      // Phase 1: Activate new scene off-screen
      if (typeof toScene.activate === 'function') {
        await toScene.activate(data);
      }
      
      // Position new scene to the right
      if (toScene.rootObject) {
        toScene.rootObject.position.x = 20;
      }
      
      // Phase 2: Slide camera to new scene
      new TWEEN.Tween(camera.position)
        .to({ x: originalPosition.x + 20 }, duration)
        .easing(this.transitionEasing)
        .onComplete(() => {
          // Phase 3: Deactivate old scene
          if (fromScene && typeof fromScene.deactivate === 'function') {
            fromScene.deactivate();
          }
          
          // Reset positions
          camera.position.copy(originalPosition);
          if (toScene.rootObject) {
            toScene.rootObject.position.x = 0;
          }
          
          resolve();
        })
        .start();
    });
  }

  /**
   * Mobile Transition: Slide Right (back navigation)
   */
  async slideRightTransition(fromScene, toScene, duration, data) {
    return new Promise(async (resolve) => {
      const camera = this.gameEngine.getCamera();
      const originalPosition = { ...camera.position };
      
      // Activate new scene
      if (typeof toScene.activate === 'function') {
        await toScene.activate(data);
      }
      
      // Position new scene to the left
      if (toScene.rootObject) {
        toScene.rootObject.position.x = -20;
      }
      
      // Slide camera to new scene
      new TWEEN.Tween(camera.position)
        .to({ x: originalPosition.x - 20 }, duration)
        .easing(this.transitionEasing)
        .onComplete(() => {
          if (fromScene && typeof fromScene.deactivate === 'function') {
            fromScene.deactivate();
          }
          
          camera.position.copy(originalPosition);
          if (toScene.rootObject) {
            toScene.rootObject.position.x = 0;
          }
          
          resolve();
        })
        .start();
    });
  }

  /**
   * Mobile Transition: Slide Up (modal-like)
   */
  async slideUpTransition(fromScene, toScene, duration, data) {
    return new Promise(async (resolve) => {
      if (typeof toScene.activate === 'function') {
        await toScene.activate(data);
      }
      
      if (toScene.rootObject) {
        toScene.rootObject.position.y = -15;
        
        new TWEEN.Tween(toScene.rootObject.position)
          .to({ y: 0 }, duration)
          .easing(TWEEN.Easing.Back.Out)
          .onComplete(() => {
            if (fromScene && typeof fromScene.deactivate === 'function') {
              fromScene.deactivate();
            }
            resolve();
          })
          .start();
      } else {
        resolve();
      }
    });
  }

  /**
   * Mobile Transition: Slide Down (dismiss modal)
   */
  async slideDownTransition(fromScene, toScene, duration, data) {
    return new Promise(async (resolve) => {
      // Slide old scene down first
      if (fromScene && fromScene.rootObject) {
        new TWEEN.Tween(fromScene.rootObject.position)
          .to({ y: -15 }, duration * 0.7)
          .easing(TWEEN.Easing.Back.In)
          .onComplete(async () => {
            if (typeof fromScene.deactivate === 'function') {
              fromScene.deactivate();
            }
            
            // Then activate new scene
            if (typeof toScene.activate === 'function') {
              await toScene.activate(data);
            }
            
            resolve();
          })
          .start();
      } else {
        if (typeof toScene.activate === 'function') {
          await toScene.activate(data);
        }
        resolve();
      }
    });
  }

  /**
   * Mobile Transition: Fade (lightweight)
   */
  async fadeTransition(fromScene, toScene, duration, data) {
    return new Promise(async (resolve) => {
      // Quick fade for mobile
      const halfDuration = duration / 2;
      
      // Fade out current
      if (fromScene) {
        await this.fadeOutScene(fromScene, halfDuration);
        if (typeof fromScene.deactivate === 'function') {
          fromScene.deactivate();
        }
      }
      
      // Activate and fade in new
      if (typeof toScene.activate === 'function') {
        await toScene.activate(data);
      }
      
      await this.fadeInScene(toScene, halfDuration);
      resolve();
    });
  }

  /**
   * Mobile Transition: Zoom (scale effect)
   */
  async zoomTransition(fromScene, toScene, duration, data) {
    return new Promise(async (resolve) => {
      const camera = this.gameEngine.getCamera();
      const originalFov = camera.fov;
      
      // Zoom out
      new TWEEN.Tween(camera)
        .to({ fov: 80 }, duration / 2)
        .easing(this.transitionEasing)
        .onUpdate(() => camera.updateProjectionMatrix())
        .onComplete(async () => {
          // Switch scenes
          if (fromScene && typeof fromScene.deactivate === 'function') {
            fromScene.deactivate();
          }
          
          if (typeof toScene.activate === 'function') {
            await toScene.activate(data);
          }
          
          // Zoom back in
          new TWEEN.Tween(camera)
            .to({ fov: originalFov }, duration / 2)
            .easing(this.transitionEasing)
            .onUpdate(() => camera.updateProjectionMatrix())
            .onComplete(() => resolve())
            .start();
        })
        .start();
    });
  }

  /**
   * Mobile Transition: Card Flip
   */
  async cardFlipTransition(fromScene, toScene, duration, data) {
    return new Promise(async (resolve) => {
      if (fromScene && fromScene.rootObject) {
        // Flip out current scene
        new TWEEN.Tween(fromScene.rootObject.rotation)
          .to({ y: Math.PI }, duration / 2)
          .easing(this.transitionEasing)
          .onComplete(async () => {
            if (typeof fromScene.deactivate === 'function') {
              fromScene.deactivate();
            }
            
            // Activate new scene
            if (typeof toScene.activate === 'function') {
              await toScene.activate(data);
            }
            
            // Flip in new scene
            if (toScene.rootObject) {
              toScene.rootObject.rotation.y = -Math.PI;
              
              new TWEEN.Tween(toScene.rootObject.rotation)
                .to({ y: 0 }, duration / 2)
                .easing(this.transitionEasing)
                .onComplete(() => resolve())
                .start();
            } else {
              resolve();
            }
          })
          .start();
      } else {
        if (typeof toScene.activate === 'function') {
          await toScene.activate(data);
        }
        resolve();
      }
    });
  }

  /**
   * Mobile Transition: Push (like navigation push)
   */
  async pushTransition(fromScene, toScene, duration, data) {
    return new Promise(async (resolve) => {
      // Similar to slide but with scale effect
      if (fromScene && fromScene.rootObject) {
        // Scale down and move current scene
        new TWEEN.Tween(fromScene.rootObject.scale)
          .to({ x: 0.8, y: 0.8, z: 0.8 }, duration)
          .start();
          
        new TWEEN.Tween(fromScene.rootObject.position)
          .to({ x: -10 }, duration)
          .easing(this.transitionEasing)
          .onComplete(async () => {
            if (typeof fromScene.deactivate === 'function') {
              fromScene.deactivate();
            }
            
            // Reset scale
            fromScene.rootObject.scale.set(1, 1, 1);
            fromScene.rootObject.position.x = 0;
          })
          .start();
      }
      
      // Slide in new scene from right
      if (typeof toScene.activate === 'function') {
        await toScene.activate(data);
      }
      
      if (toScene.rootObject) {
        toScene.rootObject.position.x = 20;
        
        new TWEEN.Tween(toScene.rootObject.position)
          .to({ x: 0 }, duration)
          .easing(this.transitionEasing)
          .onComplete(() => resolve())
          .start();
      } else {
        resolve();
      }
    });
  }

  /**
   * Mobile Transition: Modal (overlay style)
   */
  async modalTransition(fromScene, toScene, duration, data) {
    return new Promise(async (resolve) => {
      // Don't deactivate previous scene (stays in background)
      
      if (typeof toScene.activate === 'function') {
        await toScene.activate(data);
      }
      
      if (toScene.rootObject) {
        // Scale up from center
        toScene.rootObject.scale.set(0, 0, 0);
        toScene.rootObject.position.y = 0;
        
        new TWEEN.Tween(toScene.rootObject.scale)
          .to({ x: 1, y: 1, z: 1 }, duration)
          .easing(TWEEN.Easing.Back.Out)
          .onComplete(() => resolve())
          .start();
      } else {
        resolve();
      }
    });
  }

  /**
   * Mobile Transition: Instant (no animation)
   */
  async instantTransition(fromScene, toScene, data) {
    if (fromScene && typeof fromScene.deactivate === 'function') {
      fromScene.deactivate();
    }
    
    if (typeof toScene.activate === 'function') {
      await toScene.activate(data);
    }
  }

  /**
   * Fade out scene (mobile optimized)
   */
  async fadeOutScene(scene, duration) {
    return new Promise((resolve) => {
      if (!scene.rootObject) {
        resolve();
        return;
      }
      
      // Simple opacity fade for mobile
      scene.rootObject.traverse((child) => {
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              mat.transparent = true;
              if (mat.opacity === undefined) mat.opacity = 1;
            });
          } else {
            child.material.transparent = true;
            if (child.material.opacity === undefined) child.material.opacity = 1;
          }
        }
      });
      
      new TWEEN.Tween({ opacity: 1 })
        .to({ opacity: 0 }, duration)
        .easing(this.transitionEasing)
        .onUpdate((obj) => {
          scene.rootObject.traverse((child) => {
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => mat.opacity = obj.opacity);
              } else {
                child.material.opacity = obj.opacity;
              }
            }
          });
        })
        .onComplete(() => resolve())
        .start();
    });
  }

  /**
   * Fade in scene (mobile optimized)
   */
  async fadeInScene(scene, duration) {
    return new Promise((resolve) => {
      if (!scene.rootObject) {
        resolve();
        return;
      }
      
      // Set initial opacity to 0
      scene.rootObject.traverse((child) => {
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              mat.transparent = true;
              mat.opacity = 0;
            });
          } else {
            child.material.transparent = true;
            child.material.opacity = 0;
          }
        }
      });
      
      new TWEEN.Tween({ opacity: 0 })
        .to({ opacity: 1 }, duration)
        .easing(this.transitionEasing)
        .onUpdate((obj) => {
          scene.rootObject.traverse((child) => {
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => mat.opacity = obj.opacity);
              } else {
                child.material.opacity = obj.opacity;
              }
            }
          });
        })
        .onComplete(() => resolve())
        .start();
    });
  }

  /**
   * Go back to previous scene (mobile back navigation)
   */
  async goBack(data = {}) {
    if (this.sceneHistory.length === 0) {
      console.warn('📱 No previous scene in mobile history');
      return;
    }
    
    const previousSceneName = this.sceneHistory.pop();
    
    // Use right slide for back navigation (iOS style)
    await this.switchToScene(previousSceneName, data, 'slide-right');
    console.log(`📱 Mobile back navigation to: ${previousSceneName}`);
  }

  /**
   * Clear scene history (useful for logout, etc.)
   */
  clearHistory() {
    this.sceneHistory = [];
    console.log('📱 Mobile scene history cleared');
  }

  /**
   * Get scene history for mobile navigation
   */
  getSceneHistory() {
    return [...this.sceneHistory];
  }

  /**
   * Check if can go back
   */
  canGoBack() {
    return this.sceneHistory.length > 0;
  }

  /**
   * Mobile-optimized scene cleanup
   */
  async cleanupScene(scene) {
    if (!scene) return;
    
    try {
      console.log(`🧹 Cleaning up mobile scene: ${scene.name}`);
      
      // Call scene cleanup method
      if (typeof scene.cleanup === 'function') {
        await scene.cleanup();
      }
      
      // Remove from Three.js scene
      if (scene.rootObject && this.gameEngine.getScene()) {
        this.gameEngine.getScene().remove(scene.rootObject);
        
        // Dispose materials and geometries for mobile memory management
        scene.rootObject.traverse((object) => {
          if (object.geometry) {
            object.geometry.dispose();
          }
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      }
      
      // Clear from preloaded scenes
      if (scene.name) {
        this.preloadedScenes.delete(scene.name);
        
        // Clear instance reference
        const sceneConfig = this.scenes.get(scene.name);
        if (sceneConfig) {
          sceneConfig.instance = null;
        }
      }
      
      console.log(`✅ Mobile scene "${scene.name}" cleaned up`);
      
    } catch (error) {
      console.error(`❌ Error cleaning up mobile scene "${scene.name}":`, error);
    }
  }

  /**
   * Force garbage collection and memory optimization
   */
  optimizeMemory() {
    if (!this.isMobile) return;
    
    console.log('🗑️ Optimizing mobile memory...');
    
    // Clean up non-persistent scenes
    for (const [name, config] of this.scenes) {
      if (config.instance && 
          !config.persistent && 
          this.currentScene?.name !== name &&
          !this.sceneHistory.includes(name)) {
        
        this.cleanupScene(config.instance);
        config.instance = null;
        this.preloadedScenes.delete(name);
      }
    }
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
      console.log('♻️ Forced garbage collection');
    }
    
    // Clear TWEEN cache
    TWEEN.removeAll();
    
    this.emit('memory:optimized');
  }

  /**
   * Get current scene information
   */
  getCurrentScene() {
    return {
      name: this.currentScene?.name || null,
      instance: this.currentScene || null,
      isTransitioning: this.isTransitioning,
      canGoBack: this.canGoBack(),
      historyLength: this.sceneHistory.length,
      isMobile: this.isMobile
    };
  }

  /**
   * Get mobile performance stats
   */
  getMobilePerformanceStats() {
    return {
      ...this.transitionPerformance,
      preloadedScenes: this.preloadedScenes.size,
      maxPreloadedScenes: this.maxPreloadedScenes,
      queuedTransitions: this.transitionQueue.length,
      memoryOptimized: this.isMobile,
      gesturesEnabled: this.gestureEnabled
    };
  }

  /**
   * Enable/disable gesture navigation
   */
  setGestureEnabled(enabled) {
    this.gestureEnabled = enabled;
    console.log(`👆 Mobile gestures: ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Set swipe threshold for gesture sensitivity
   */
  setSwipeThreshold(threshold) {
    this.swipeThreshold = Math.max(20, Math.min(100, threshold));
    console.log(`👆 Swipe threshold set to: ${this.swipeThreshold}px`);
  }

  /**
   * Preload essential scenes for mobile
   */
  async preloadEssentialScenes(sceneNames) {
    if (!this.isMobile) return;
    
    console.log('📱 Preloading essential mobile scenes...');
    
    const promises = sceneNames
      .slice(0, this.maxPreloadedScenes)
      .map(name => this.preloadScene(name).catch(error => {
        console.warn(`Failed to preload ${name}:`, error);
      }));
    
    await Promise.all(promises);
    console.log('✅ Essential mobile scenes preloaded');
  }

  /**
   * Handle low memory warning (mobile)
   */
  handleLowMemoryWarning() {
    if (!this.isMobile) return;
    
    console.warn('⚠️ Low memory warning - optimizing...');
    
    // Reduce preloaded scenes
    this.maxPreloadedScenes = Math.max(1, this.maxPreloadedScenes - 1);
    
    // Clean up immediately
    this.optimizeMemory();
    
    // Notify game engine to reduce quality
    this.gameEngine.emit('memory:low_warning');
    
    this.emit('mobile:low_memory');
  }

  /**
   * Set mobile transition duration
   */
  setTransitionDuration(duration) {
    this.mobileTransitionDuration = Math.max(200, Math.min(1500, duration));
    console.log(`⏱️ Mobile transition duration: ${this.mobileTransitionDuration}ms`);
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
          console.error(`Error in mobile scene event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Debug method for mobile development
   */
  getDebugInfo() {
    return {
      isMobile: this.isMobile,
      currentScene: this.currentScene?.name,
      previousScene: this.previousScene?.name,
      isTransitioning: this.isTransitioning,
      sceneHistory: this.sceneHistory,
      preloadedScenes: Array.from(this.preloadedScenes),
      queuedTransitions: this.transitionQueue.length,
      registeredScenes: Array.from(this.scenes.keys()),
      performance: this.getMobilePerformanceStats(),
      gestureSettings: {
        enabled: this.gestureEnabled,
        swipeThreshold: this.swipeThreshold
      },
      transitionSettings: {
        duration: this.mobileTransitionDuration,
        availableTransitions: Object.keys(this.mobileTransitions)
      }
    };
  }

  /**
   * Cleanup and dispose
   */
  dispose() {
    console.log('🧹 Disposing Mobile SceneManager...');
    
    // Stop all transitions
    TWEEN.removeAll();
    
    // Clear transition queue
    this.transitionQueue = [];
    
    // Cleanup current scene
    if (this.currentScene) {
      this.cleanupScene(this.currentScene);
    }
    
    // Cleanup all preloaded scenes
    for (const [name, config] of this.scenes) {
      if (config.instance) {
        this.cleanupScene(config.instance);
      }
    }
    
    // Clear collections
    this.scenes.clear();
    this.preloadedScenes.clear();
    this.sceneHistory = [];
    this.eventListeners.clear();
    
    // Remove gesture event listeners
    const canvas = this.gameEngine.getCanvas();
    if (canvas) {
      canvas.removeEventListener('touchstart', this.handleTouchStart);
      canvas.removeEventListener('touchmove', this.handleTouchMove);
      canvas.removeEventListener('touchend', this.handleTouchEnd);
    }
    
    console.log('✅ Mobile SceneManager disposed');
  }
}

export default SceneManager;
