import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import NetworkManager from '@/services/NetworkManager';
import ClashMenuManager from '@/clashmenu/index';

/**
 * Clash Menu Scene - Menu principal comme Clash Royale
 * Gère la connexion WorldRoom et l'interface de jeu principale
 */
class ClashMenuScene {
  constructor(gameEngine, sceneManager) {
    this.gameEngine = gameEngine;
    this.sceneManager = sceneManager;
    this.networkManager = NetworkManager;
    
    // Scene objects
    this.rootObject = new THREE.Group();
    this.rootObject.name = 'ClashMenuScene';
    
    // Menu manager
    this.menuManager = null;
    
    // User data
    this.currentUser = null;
    this.worldRoom = null;
    
    // 3D elements
    this.backgroundPlane = null;
    this.ambientElements = [];
    
    // Animation state
    this.animationLoops = [];
    this.isAnimating = false;
    
    // Connection state
    this.isConnectingToWorld = false;
    
    console.log('⚔️ ClashMenuScene created');
  }

  /**
   * Initialize the clash menu scene
   */
  async initialize() {
    try {
      console.log('⚔️ Initializing ClashMenuScene...');
      
      this.createBackground();
      this.createAmbientElements();
      this.setupAnimations();
      
      // Initialize menu manager
      this.menuManager = new ClashMenuManager();
      await this.menuManager.initialize();
      
      console.log('✅ ClashMenuScene initialized');
    } catch (error) {
      console.error('❌ Failed to initialize ClashMenuScene:', error);
      throw error;
    }
  }

  /**
   * Create animated background for clash theme
   */
  createBackground() {
    // Arena-style gradient background
    const geometry = new THREE.PlaneGeometry(120, 80);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color(0x0f1419) }, // Dark blue
        color2: { value: new THREE.Color(0x1a237e) }, // Royal blue
        color3: { value: new THREE.Color(0x3949ab) }, // Lighter blue
        color4: { value: new THREE.Color(0x1565c0) }  // Arena blue
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
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 color3;
        uniform vec3 color4;
        varying vec2 vUv;
        
        void main() {
          // Arena-like pattern
          float wave1 = sin(vUv.x * 12.0 + time * 0.4) * 0.05;
          float wave2 = cos(vUv.y * 8.0 + time * 0.3) * 0.05;
          float radial = distance(vUv, vec2(0.5, 0.5));
          
          vec3 color = mix(color1, color2, vUv.y + wave1);
          color = mix(color, color3, radial * 0.8);
          color = mix(color, color4, wave2 + radial * 0.3);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });
    
    this.backgroundPlane = new THREE.Mesh(geometry, material);
    this.backgroundPlane.position.z = -15;
    this.backgroundPlane.name = 'ArenaBackground';
    this.rootObject.add(this.backgroundPlane);
    
    console.log('🏟️ Arena background created');
  }

  /**
   * Create ambient elements (floating crystals, particles)
   */
  createAmbientElements() {
    // Floating gems/crystals for Clash theme
    for (let i = 0; i < 8; i++) {
      const geometry = new THREE.OctahedronGeometry(0.2 + Math.random() * 0.3, 2);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.7 + Math.random() * 0.2, 0.8, 0.6),
        transparent: true,
        opacity: 0.3 + Math.random() * 0.4
      });
      
      const crystal = new THREE.Mesh(geometry, material);
      crystal.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 10
      );
      
      this.ambientElements.push(crystal);
      this.rootObject.add(crystal);
    }
    
    console.log('💎 Ambient crystals created');
  }

  /**
   * Setup animations
   */
  setupAnimations() {
    // Background animation
    this.animationLoops.push(() => {
      if (this.backgroundPlane) {
        this.backgroundPlane.material.uniforms.time.value += 0.005;
      }
    });
    
    // Crystal animations
    this.ambientElements.forEach((element, index) => {
      const originalPosition = { ...element.position };
      const speed = 0.0008 + index * 0.0002;
      const amplitude = 1.2 + Math.random() * 0.8;
      
      this.animationLoops.push(() => {
        element.position.y = originalPosition.y + Math.sin(Date.now() * speed) * amplitude;
        element.rotation.x += 0.003;
        element.rotation.y += 0.004;
        element.rotation.z += 0.002;
      });
    });
  }

  /**
   * Connect to WorldRoom and disconnect from AuthRoom
   */
  async connectToWorldRoom() {
    if (this.isConnectingToWorld || this.worldRoom) {
      console.log('🌍 Already connected or connecting to WorldRoom...');
      return;
    }
    
    try {
      this.isConnectingToWorld = true;
      console.log('🌍 Connecting to WorldRoom...');
      
      // Show connection status in console for now
      console.log('🌍 Connecting to game world...');
      
      // Join WorldRoom via NetworkManager
      this.worldRoom = await this.networkManager.joinWorldRoom();
      
      // Setup WorldRoom event listeners
      this.setupWorldRoomEvents();
      
      // Update menu with connection success
        console.log('✅ Connected to game world!');
        // Battle features enabled (method doesn't exist yet)
        console.log('✅ Battle features would be enabled here');
      
      console.log('✅ Connected to WorldRoom successfully');
      
    } catch (error) {
      console.error('❌ Failed to connect to WorldRoom:', error);
      
      // Show error in console for now
      console.error('🔌 Failed to connect. Retrying in 3s...');
      
      // Retry after delay
      setTimeout(() => {
        this.connectToWorldRoom();
      }, 3000);
      
    } finally {
      this.isConnectingToWorld = false;
    }
  }

  /**
   * Setup WorldRoom event listeners
   */
setupWorldRoomEvents() {
  if (!this.worldRoom) return;
  
  // World welcome message
  this.networkManager.getColyseusManager().on('world:welcome', (data) => {
    console.log('🌍 World welcome:', data);
    if (this.menuManager && this.menuManager.updatePlayerData) {
      this.menuManager.updatePlayerData(data.playerData);
    }
  });
  
  // World state changes - Skip for now since handleWorldStateChange doesn't exist
  this.networkManager.getColyseusManager().on('world:state_change', (state) => {
    console.log('🌍 World state changed:', state);
    // TODO: Handle world state updates when methods are implemented
  });
  
  // Battle events from WorldRoom
  this.worldRoom.onMessage('match_found', (data) => {
    console.log('⚔️ Match found:', data);
    // TODO: Handle match found
  });
  
  this.worldRoom.onMessage('queue_joined', (data) => {
    console.log('🎯 Queue joined:', data);
    // TODO: Update UI to show searching
  });
  
  this.worldRoom.onMessage('queue_left', (data) => {
    console.log('❌ Queue left:', data);
    // TODO: Update UI to show idle
  });
  
  // Connect to BattleTab events directly
  const battleTab = this.menuManager?.battleTab;
  if (battleTab && this.worldRoom) {
    battleTab.on('battle:search', async (data) => {
      console.log('🎯 Starting battle search:', data);
      try {
        this.worldRoom.send('join_queue', {
          deckIndex: 0,
          mode: data.mode
        });
        console.log('✅ Sent join_queue message');
      } catch (error) {
        console.error('❌ Failed to join matchmaking queue:', error);
      }
    });
    
    battleTab.on('battle:cancel', async () => {
      console.log('❌ Cancelling battle search');
      try {
        this.worldRoom.send('leave_queue', {});
        console.log('✅ Sent leave_queue message');
      } catch (error) {
        console.error('❌ Failed to leave matchmaking queue:', error);
      }
    });
    
    console.log('🎮 BattleTab matchmaking events connected');
  } else {
    console.warn('⚠️ BattleTab not available for matchmaking connection');
  }
  
  console.log('🎮 WorldRoom event listeners setup');
}

  /**
   * Scene lifecycle - activate
   */
  async activate(data = {}) {
    try {
      // Add scene to Three.js
      this.gameEngine.getScene().add(this.rootObject);
      
      // Get user data
      this.currentUser = data.user || this.networkManager.getUserData();
      
      // Activate menu manager
      if (this.menuManager) {
        await this.menuManager.activate(this.currentUser);
      }
      
      // Start animations
      this.startAnimations();
      
      // Connect to WorldRoom
      await this.connectToWorldRoom();
      
      // Animate entrance
      this.animateEntrance();
      
      console.log('⚔️ ClashMenuScene activated');
      
    } catch (error) {
      console.error('❌ Failed to activate ClashMenuScene:', error);
      // Show error but don't crash
      if (this.menuManager) {
        console.error('❌ Failed to load menu. Please refresh.');
      }
    }
  }

  /**
   * Scene lifecycle - deactivate
   */
  deactivate() {
    // Deactivate menu manager
    if (this.menuManager) {
      this.menuManager.deactivate();
    }
    
    // Stop animations
    this.stopAnimations();
    
    // Note: We keep WorldRoom connection active for background updates
    
    console.log('⚔️ ClashMenuScene deactivated');
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
   * Animate scene entrance
   */
  animateEntrance() {
    // Animate crystals entrance
    this.ambientElements.forEach((element, index) => {
      const originalScale = { ...element.scale };
      element.scale.set(0, 0, 0);
      
      setTimeout(() => {
        new TWEEN.Tween(element.scale)
          .to(originalScale, 1200)
          .easing(TWEEN.Easing.Elastic.Out)
          .start();
      }, index * 150);
    });
  }

  /**
   * Handle back navigation
   */
  async handleBackToWelcome() {
    const confirmed = confirm('Return to welcome screen?');
    if (confirmed) {
      await this.sceneManager.switchToScene('welcomeMenu', {}, 'slide');
    }
  }

  /**
   * Cleanup scene resources
   */
  async cleanup() {
    console.log('🧹 Cleaning up ClashMenuScene...');
    
    // Stop animations
    this.stopAnimations();
    
    // Cleanup menu manager
    if (this.menuManager) {
      await this.menuManager.cleanup();
    }
    
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
    this.ambientElements = [];
    this.animationLoops = [];
    
    // Note: WorldRoom connection is managed by NetworkManager
    
    console.log('✅ ClashMenuScene cleaned up');
  }
}

export default ClashMenuScene;
