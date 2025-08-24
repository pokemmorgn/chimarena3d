
import * as THREE from 'three';
// Option 1: Import par défaut (le plus courant)
import TWEEN from '@tweenjs/tween.js';
import NetworkManager from '@/services/NetworkManager';

/**
 * Welcome Menu Scene - Simple welcome interface after authentication
 * Clean welcome screen with user name, play button, and future wallet connection
 */
class WelcomeMenuScene {
  constructor(gameEngine, sceneManager) {
    this.gameEngine = gameEngine;
    this.sceneManager = sceneManager;
    this.networkManager = NetworkManager;
    
    // Scene objects
    this.rootObject = new THREE.Group();
    this.rootObject.name = 'WelcomeMenuScene';
    
    // User data
    this.currentUser = null;
    
    // 3D elements
    this.backgroundPlane = null;
    this.floatingElements = [];
    
    // HTML overlay
    this.htmlOverlay = null;
    
    // Animation state
    this.animationLoops = [];
    this.isAnimating = false;
    
    // Event listeners
    this.boundHandlers = new Map();
    
    console.log('🏠 WelcomeMenuScene created');
  }

  /**
   * Initialize the welcome menu scene
   */
  async initialize() {
    try {
      console.log('🏠 Initializing WelcomeMenuScene...');
      
      this.createBackground();
      this.createFloatingElements();
      this.createHTMLInterface();
      this.setupEventListeners();
      this.setupAnimations();
      
      console.log('✅ WelcomeMenuScene initialized');
    } catch (error) {
      console.error('❌ Failed to initialize WelcomeMenuScene:', error);
      throw error;
    }
  }

  /**
   * Create animated background
   */
createBackground() {
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color1: { value: new THREE.Color(0x1a1a2e) },
      color2: { value: new THREE.Color(0x16213e) },
      color3: { value: new THREE.Color(0x0f3460) }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0); // full screen quad
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 color1;
      uniform vec3 color2;
      uniform vec3 color3;
      varying vec2 vUv;

      void main() {
        float wave1 = sin(vUv.x * 8.0 + time * 0.5) * 0.1;
        float wave2 = cos(vUv.y * 6.0 + time * 0.3) * 0.1;
        float pattern = wave1 + wave2;

        vec3 color = mix(color1, color2, vUv.y + pattern);
        color = mix(color, color3, vUv.x * 0.2);

        gl_FragColor = vec4(color, 1.0);
      }
    `,
    depthTest: false,
    depthWrite: false,
    transparent: false
  });

  this.backgroundPlane = new THREE.Mesh(geometry, material);
  this.backgroundPlane.frustumCulled = false;

  // Crée une scène de fond spéciale
  this.backgroundScene = new THREE.Scene();
  this.backgroundCamera = new THREE.Camera(); // caméra orthographique

  this.backgroundScene.add(this.backgroundPlane);
}

  /**
   * Create simple floating elements for ambiance
   */
  createFloatingElements() {
    // Simple floating orbs
    for (let i = 0; i < 6; i++) {
      const geometry = new THREE.SphereGeometry(0.3 + Math.random() * 0.2, 16, 16);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.6 + Math.random() * 0.3, 0.7, 0.5),
        transparent: true,
        opacity: 0.4 + Math.random() * 0.3
      });
      
      const orb = new THREE.Mesh(geometry, material);
      orb.position.set(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 15
      );
      
      this.floatingElements.push(orb);
      this.rootObject.add(orb);
    }
  }

  /**
   * Create HTML interface overlay
   */
createHTMLInterface() {
  // Remove any existing overlay first
  const existingOverlay = document.getElementById('welcome-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }
  
  // Create main overlay container
  this.htmlOverlay = document.createElement('div');
  this.htmlOverlay.id = 'welcome-overlay';
const containerRect = this.gameEngine.getRenderer().domElement.getBoundingClientRect();

this.htmlOverlay.style.cssText = `
  position: fixed;
  top: ${containerRect.top}px;
  left: ${containerRect.left}px;
  width: ${containerRect.width}px;
  height: ${containerRect.height}px;
  ...
`;

  
  // Create welcome container avec pointer-events auto
  const welcomeContainer = document.createElement('div');
  welcomeContainer.style.cssText = `
    background: rgba(26, 26, 46, 0.9);
    border: 2px solid rgba(74, 144, 226, 0.5);
    border-radius: 20px;
    padding: 60px 80px;
    backdrop-filter: blur(15px);
    pointer-events: auto;
    text-align: center;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    max-width: 500px;
    width: 90%;
    z-index: 10001;
    position: relative;
  `;
  
  welcomeContainer.innerHTML = `
    <!-- Le même HTML qu'avant mais avec un bouton qui marche -->
    <div style="margin-bottom: 50px;">
      <h1 id="welcome-title" style="color: #ffffff; font-size: 48px; margin: 0 0 20px 0; 
                                   text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">
        Welcome Back!
      </h1>
      <h2 id="user-name" style="color: #4a90e2; font-size: 32px; margin: 0; font-weight: 300;">
        Loading...
      </h2>
    </div>
    
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <button id="play-btn" style="
        padding: 20px 40px;
        background: linear-gradient(45deg, #2ecc71, #27ae60);
        border: none;
        border-radius: 15px;
        color: #ffffff;
        font-size: 24px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        text-transform: uppercase;
        letter-spacing: 2px;
        box-shadow: 0 8px 20px rgba(46, 204, 113, 0.3);
        pointer-events: auto;
        z-index: 10002;
        position: relative;
      ">
        ▶ Play Game
      </button>
      
      <button id="wallet-btn" style="
        padding: 15px 40px;
        background: linear-gradient(45deg, #f6851b, #e2761b);
        border: none;
        border-radius: 15px;
        color: #ffffff;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        opacity: 0.8;
        box-shadow: 0 6px 15px rgba(246, 133, 27, 0.3);
        pointer-events: auto;
        z-index: 10002;
        position: relative;
      ">
        🦊 Connect Wallet (Coming Soon)
      </button>
    </div>
    
    <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid rgba(74, 144, 226, 0.3);">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="text-align: left;">
          <p style="color: #a0a0a0; margin: 0; font-size: 14px;">Logged in as</p>
          <p id="user-email" style="color: #ffffff; margin: 5px 0 0 0; font-size: 16px;">user@example.com</p>
        </div>
        
        <button id="logout-btn" style="
          background: rgba(231, 76, 60, 0.2);
          border: 1px solid #e74c3c;
          border-radius: 8px;
          color: #e74c3c;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
          pointer-events: auto;
          z-index: 10002;
          position: relative;
        ">
          Logout
        </button>
      </div>
    </div>
  `;
  
  this.htmlOverlay.appendChild(welcomeContainer);
  document.body.appendChild(this.htmlOverlay);
}
  
  /**
   * Setup event listeners
   */
 setupEventListeners() {
  // Bind handlers
  this.boundHandlers.set('play', this.handlePlay.bind(this));
  this.boundHandlers.set('wallet', this.handleWallet.bind(this));
  this.boundHandlers.set('logout', this.handleLogout.bind(this));
  
  // SOLUTION FORCÉE : Attacher les listeners avec un délai et forcer les styles
  setTimeout(() => {
    const playBtn = document.getElementById('play-btn');
    const walletBtn = document.getElementById('wallet-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (playBtn) {
      // Forcer les styles pour s'assurer que le bouton est cliquable
      playBtn.style.pointerEvents = 'auto';
      playBtn.style.zIndex = '10001';
      playBtn.style.position = 'relative';
      
      // Utiliser onclick au lieu d'addEventListener
      playBtn.onclick = this.boundHandlers.get('play');
      console.log('✅ Play button listener attached with onclick');
    }
    
    if (walletBtn) {
      walletBtn.style.pointerEvents = 'auto';
      walletBtn.onclick = this.boundHandlers.get('wallet');
    }
    
    if (logoutBtn) {
      logoutBtn.style.pointerEvents = 'auto';
      logoutBtn.onclick = this.boundHandlers.get('logout');
    }
  }, 100);
  
  // Add hover effects
  this.setupHoverEffects();
}

  /**
   * Setup hover effects for buttons
   */
  setupHoverEffects() {
    const playBtn = document.getElementById('play-btn');
    const walletBtn = document.getElementById('wallet-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Play button hover
    playBtn?.addEventListener('mouseenter', () => {
      playBtn.style.transform = 'translateY(-5px) scale(1.05)';
      playBtn.style.boxShadow = '0 12px 30px rgba(46, 204, 113, 0.4)';
    });
    
    playBtn?.addEventListener('mouseleave', () => {
      playBtn.style.transform = 'translateY(0) scale(1)';
      playBtn.style.boxShadow = '0 8px 20px rgba(46, 204, 113, 0.3)';
    });
    
    // Wallet button hover
    walletBtn?.addEventListener('mouseenter', () => {
      if (walletBtn.style.opacity !== '0.5') {
        walletBtn.style.transform = 'translateY(-3px)';
        walletBtn.style.boxShadow = '0 8px 20px rgba(246, 133, 27, 0.4)';
      }
    });
    
    walletBtn?.addEventListener('mouseleave', () => {
      walletBtn.style.transform = 'translateY(0)';
      walletBtn.style.boxShadow = '0 6px 15px rgba(246, 133, 27, 0.3)';
    });
    
    // Logout button hover
    logoutBtn?.addEventListener('mouseenter', () => {
      logoutBtn.style.backgroundColor = 'rgba(231, 76, 60, 0.3)';
    });
    
    logoutBtn?.addEventListener('mouseleave', () => {
      logoutBtn.style.backgroundColor = 'rgba(231, 76, 60, 0.2)';
    });
  }

  /**
   * Setup animations
   */
  setupAnimations() {
    // Background animation
    this.animationLoops.push(() => {
      if (this.backgroundPlane) {
        this.backgroundPlane.material.uniforms.time.value += 0.01;
      }
    });
    
    // Floating elements animation
    this.floatingElements.forEach((element, index) => {
      const originalPosition = { ...element.position };
      const speed = 0.001 + index * 0.0003;
      const amplitude = 1 + Math.random() * 0.5;
      
      this.animationLoops.push(() => {
        element.position.y = originalPosition.y + Math.sin(Date.now() * speed) * amplitude;
        element.rotation.x += 0.005;
        element.rotation.y += 0.003;
      });
    });
  }

  /**
   * Update user interface with current user data
   */
  updateUserInterface(user) {
    if (!user) return;
    
    this.currentUser = user;
    
    // Update welcome message
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) {
      userNameEl.textContent = user.displayName || user.username;
    }
    
    // Update user email
    const userEmailEl = document.getElementById('user-email');
    if (userEmailEl) {
      userEmailEl.textContent = user.email;
    }
  }

  /**
   * Event handlers
   */
handlePlay() {
  console.log('🎮 Play button clicked - navigating to Clash Menu');
  
  // Navigate to clash menu scene
  this.sceneManager.switchToScene('clashMenu', {
    user: this.currentUser
  }, 'slide');
}
  
  handleWallet() {
    console.log('🦊 Connect Wallet clicked');
    alert('MetaMask wallet integration coming in next update!');
  }

  async handleLogout() {
    console.log('🚪 Logout clicked');
    
    const confirmed = confirm('Are you sure you want to logout?');
    if (!confirmed) return;
    
    try {
      await this.networkManager.logout();
      this.sceneManager.switchToScene('login', {}, 'fade');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Logout failed. Please try again.');
    }
  }

  /**
   * Scene lifecycle - activate
   */
  async activate(data = {}) {
    // Add scene to Three.js
    this.gameEngine.getScene().add(this.rootObject);
    
    // Show HTML overlay
    if (this.htmlOverlay) {
      this.htmlOverlay.style.display = 'flex';
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
    this.animateEntrance();
    
    console.log('🏠 WelcomeMenuScene activated');
  }

  /**
   * Scene lifecycle - deactivate
   */
  deactivate() {
    // Hide HTML overlay
    if (this.htmlOverlay) {
      this.htmlOverlay.style.display = 'none';
    }
    
    // Stop animations
    this.stopAnimations();
    
    console.log('🏠 WelcomeMenuScene deactivated');
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
    // Fade in HTML overlay
    if (this.htmlOverlay) {
      this.htmlOverlay.style.opacity = '0';
      new TWEEN.Tween({ opacity: 0 })
        .to({ opacity: 1 }, 1000)
        .easing(TWEEN.Easing.Cubic.Out)
        .onUpdate((obj) => {
          this.htmlOverlay.style.opacity = obj.opacity;
        })
        .start();
    }
    
    // Animate floating elements entrance
    this.floatingElements.forEach((element, index) => {
      const originalScale = { ...element.scale };
      element.scale.set(0, 0, 0);
      
      setTimeout(() => {
        new TWEEN.Tween(element.scale)
          .to(originalScale, 800)
          .easing(TWEEN.Easing.Elastic.Out)
          .start();
      }, index * 200);
    });
  }

  /**
   * Cleanup scene resources
   */
  async cleanup() {
    console.log('🧹 Cleaning up WelcomeMenuScene...');
    
    // Stop animations
    this.stopAnimations();
    
    // Remove HTML overlay
    if (this.htmlOverlay && this.htmlOverlay.parentNode) {
      this.htmlOverlay.parentNode.removeChild(this.htmlOverlay);
    }
    
    // Remove event listeners
    const buttons = ['play-btn', 'wallet-btn', 'logout-btn'];
    const handlers = ['play', 'wallet', 'logout'];
    
    buttons.forEach((id, index) => {
      const element = document.getElementById(id);
      const handler = this.boundHandlers.get(handlers[index]);
      if (element && handler) {
        element.removeEventListener('click', handler);
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
    this.floatingElements = [];
    this.animationLoops = [];
    
    console.log('✅ WelcomeMenuScene cleaned up');
  }
}

export default WelcomeMenuScene;
