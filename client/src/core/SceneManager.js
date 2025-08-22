import * as THREE from 'three';
// Option 1: Import par défaut (le plus courant)
import TWEEN from '@tweenjs/tween.js';

/**
 * Scene Manager - Handles scene transitions and lifecycle
 * Manages different game scenes (login, menu, game, etc.)
 */
class SceneManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    
    // Scene registry
    this.scenes = new Map();
    this.currentScene = null;
    this.previousScene = null;
    this.isTransitioning = false;
    
    // Transition settings
    this.transitionDuration = 1000; // ms
    this.transitionEasing = TWEEN.Easing.Cubic.InOut;
    
    // Event system
    this.eventListeners = new Map();
    
    // Scene history for navigation
    this.sceneHistory = [];
    this.maxHistorySize = 10;
    
    // Preloading
    this.preloadedScenes = new Set();
    this.preloadQueue = [];
    
    console.log('🎬 SceneManager initialized');
  }

      // AJOUTEZ CETTE MÉTHODE :
    async initialize() {
        try {
            console.log('🎬 Initializing SceneManager...');
            
            // Votre logique d'initialisation ici
            this.setupDefaultScene();
            
            console.log('✅ SceneManager initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize SceneManager:', error);
            throw error;
        }
    }

  
  /**
   * Register a scene class
   */
  registerScene(name, SceneClass, options = {}) {
    if (this.scenes.has(name)) {
      console.warn(`Scene "${name}" is already registered`);
      return;
    }

    const sceneConfig = {
      SceneClass,
      instance: null,
      preload: options.preload || false,
      persistent: options.persistent || false,
      transition: options.transition || 'fade',
      ...options
    };

    this.scenes.set(name, sceneConfig);
    
    // Auto-preload if specified
    if (sceneConfig.preload) {
      this.preloadScene(name);
    }

    console.log(`📝 Scene "${name}" registered`);
  }

  /**
   * Preload a scene without switching to it
   */
  async preloadScene(name) {
    if (!this.scenes.has(name)) {
      throw new Error(`Scene "${name}" is not registered`);
    }

    if (this.preloadedScenes.has(name)) {
      return; // Already preloaded
    }

    const sceneConfig = this.scenes.get(name);
    
    try {
      console.log(`⏳ Preloading scene "${name}"...`);
      
      // Create scene instance
      const scene = new sceneConfig.SceneClass(this.gameEngine, this);
      sceneConfig.instance = scene;
      
      // Initialize if method exists
      if (typeof scene.initialize === 'function') {
        await scene.initialize();
      }
      
      // Preload assets if method exists
      if (typeof scene.preload === 'function') {
        await scene.preload();
      }
      
      this.preloadedScenes.add(name);
      this.emit('scene:preloaded', { name, scene });
      
      console.log(`✅ Scene "${name}" preloaded`);
      
    } catch (error) {
      console.error(`❌ Failed to preload scene "${name}":`, error);
      throw error;
    }
  }

  /**
   * Switch to a different scene
   */
  async switchToScene(name, data = {}, transition = null) {
    if (!this.scenes.has(name)) {
      throw new Error(`Scene "${name}" is not registered`);
    }

    if (this.isTransitioning) {
      console.warn('Scene transition already in progress');
      return;
    }

    if (this.currentScene && this.currentScene.name === name) {
      console.warn(`Already in scene "${name}"`);
      return;
    }

    this.isTransitioning = true;
    
    try {
      console.log(`🔄 Switching to scene "${name}"...`);
      
      const sceneConfig = this.scenes.get(name);
      const transitionType = transition || sceneConfig.transition || 'fade';
      
      // Emit transition start
      this.emit('scene:transition_start', { 
        from: this.currentScene?.name, 
        to: name, 
        transition: transitionType 
      });
      
      // Get or create scene instance
      let newScene = sceneConfig.instance;
      if (!newScene) {
        newScene = new sceneConfig.SceneClass(this.gameEngine, this);
        sceneConfig.instance = newScene;
        
        // Initialize scene
        if (typeof newScene.initialize === 'function') {
          await newScene.initialize();
        }
        
        // Preload assets
        if (typeof newScene.preload === 'function') {
          await newScene.preload();
        }
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
      
      // Perform transition
      await this.performTransition(this.currentScene, newScene, transitionType, data);
      
      // Update current scene
      this.currentScene = newScene;
      this.currentScene.name = name;
      
      // Cleanup previous scene if not persistent
      if (this.previousScene && !this.scenes.get(this.previousScene.name)?.persistent) {
        await this.cleanupScene(this.previousScene);
      }
      
      this.emit('scene:switched', { 
        name, 
        scene: newScene, 
        data,
        previous: this.previousScene?.name 
      });
      
      console.log(`✅ Switched to scene "${name}"`);
      
    } catch (error) {
      console.error(`❌ Failed to switch to scene "${name}":`, error);
      throw error;
    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * Perform scene transition animation
   */
  async performTransition(fromScene, toScene, transitionType, data) {
    const duration = this.transitionDuration;
    
    switch (transitionType) {
      case 'fade':
        await this.fadeTransition(fromScene, toScene, duration, data);
        break;
        
      case 'slide':
        await this.slideTransition(fromScene, toScene, duration, data);
        break;
        
      case 'zoom':
        await this.zoomTransition(fromScene, toScene, duration, data);
        break;
        
      case 'instant':
        await this.instantTransition(fromScene, toScene, data);
        break;
        
      default:
        await this.fadeTransition(fromScene, toScene, duration, data);
    }
  }

  /**
   * Fade transition between scenes
   */
  async fadeTransition(fromScene, toScene, duration, data) {
    return new Promise(async (resolve) => {
      // Phase 1: Fade out current scene
      if (fromScene) {
        await this.fadeOutScene(fromScene, duration / 2);
        
        // Deactivate scene
        if (typeof fromScene.deactivate === 'function') {
          fromScene.deactivate();
        }
      }
      
      // Phase 2: Activate and fade in new scene
      if (typeof toScene.activate === 'function') {
        await toScene.activate(data);
      }
      
      await this.fadeInScene(toScene, duration / 2);
      
      resolve();
    });
  }

  /**
   * Slide transition between scenes
   */
  async slideTransition(fromScene, toScene, duration, data) {
    return new Promise(async (resolve) => {
      const camera = this.gameEngine.getCamera();
      const originalPosition = { ...camera.position };
      
      // Slide out current scene
      if (fromScene) {
        new TWEEN.Tween(camera.position)
          .to({ x: -50 }, duration / 2)
          .easing(this.transitionEasing)
          .start();
        
        setTimeout(async () => {
          if (typeof fromScene.deactivate === 'function') {
            fromScene.deactivate();
          }
          
          // Position camera for new scene entry
          camera.position.x = 50;
          
          // Activate new scene
          if (typeof toScene.activate === 'function') {
            await toScene.activate(data);
          }
          
          // Slide in new scene
          new TWEEN.Tween(camera.position)
            .to(originalPosition, duration / 2)
            .easing(this.transitionEasing)
            .onComplete(() => resolve())
            .start();
            
        }, duration / 2);
      } else {
        // No previous scene, just activate new one
        if (typeof toScene.activate === 'function') {
          await toScene.activate(data);
        }
        resolve();
      }
    });
  }

  /**
   * Zoom transition between scenes
   */
  async zoomTransition(fromScene, toScene, duration, data) {
    return new Promise(async (resolve) => {
      const camera = this.gameEngine.getCamera();
      const originalFov = camera.fov;
      
      // Zoom out current scene
      if (fromScene) {
        new TWEEN.Tween(camera)
          .to({ fov: 120 }, duration / 2)
          .easing(this.transitionEasing)
          .onUpdate(() => camera.updateProjectionMatrix())
          .start();
        
        setTimeout(async () => {
          if (typeof fromScene.deactivate === 'function') {
            fromScene.deactivate();
          }
          
          // Activate new scene
          if (typeof toScene.activate === 'function') {
            await toScene.activate(data);
          }
          
          // Zoom in new scene
          camera.fov = 10;
          camera.updateProjectionMatrix();
          
          new TWEEN.Tween(camera)
            .to({ fov: originalFov }, duration / 2)
            .easing(this.transitionEasing)
            .onUpdate(() => camera.updateProjectionMatrix())
            .onComplete(() => resolve())
            .start();
            
        }, duration / 2);
      } else {
        // No previous scene
        if (typeof toScene.activate === 'function') {
          await toScene.activate(data);
        }
        resolve();
      }
    });
  }

  /**
   * Instant transition (no animation)
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
   * Fade out a scene
   */
  async fadeOutScene(scene, duration) {
    return new Promise((resolve) => {
      if (!scene.rootObject) {
        resolve();
        return;
      }
      
      const startOpacity = scene.rootObject.children.length > 0 ? 
        scene.rootObject.children[0].material?.opacity || 1 : 1;
      
      new TWEEN.Tween({ opacity: startOpacity })
        .to({ opacity: 0 }, duration)
        .easing(this.transitionEasing)
        .onUpdate((obj) => {
          scene.rootObject.traverse((child) => {
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  mat.transparent = true;
                  mat.opacity = obj.opacity;
                });
              } else {
                child.material.transparent = true;
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
   * Fade in a scene
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
                child.material.forEach(mat => {
                  mat.opacity = obj.opacity;
                });
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
   * Go back to previous scene
   */
  async goBack(data = {}) {
    if (this.sceneHistory.length === 0) {
      console.warn('No previous scene in history');
      return;
    }
    
    const previousSceneName = this.sceneHistory.pop();
    await this.switchToScene(previousSceneName, data);
  }

  /**
   * Cleanup a scene instance
   */
  async cleanupScene(scene) {
    if (!scene) return;
    
    try {
      // Call scene cleanup method if exists
      if (typeof scene.cleanup === 'function') {
        await scene.cleanup();
      }
      
      // Remove from Three.js scene
      if (scene.rootObject && this.gameEngine.getScene()) {
        this.gameEngine.getScene().remove(scene.rootObject);
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
      
      console.log(`🧹 Scene "${scene.name}" cleaned up`);
      
    } catch (error) {
      console.error(`❌ Error cleaning up scene "${scene.name}":`, error);
    }
  }

  /**
   * Get current scene information
   */
  getCurrentScene() {
    return {
      name: this.currentScene?.name || null,
      instance: this.currentScene || null,
      isTransitioning: this.isTransitioning
    };
  }

  /**
   * Get scene history
   */
  getSceneHistory() {
    return [...this.sceneHistory];
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
          console.error(`Error in scene event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Cleanup and dispose
   */
  dispose() {
    console.log('🧹 Disposing SceneManager...');
    
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
    
    console.log('✅ SceneManager disposed');
  }
}

export default SceneManager;
