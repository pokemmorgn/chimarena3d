import * as THREE from 'three';
import { TWEEN } from '@tweenjs/tween.js';
import NetworkManager from '@/services/NetworkManager';

/**
 * Login Scene - Authentication interface
 * Handles user login, registration, and future MetaMask integration
 */
class LoginScene {
  constructor(gameEngine, sceneManager) {
    this.gameEngine = gameEngine;
    this.sceneManager = sceneManager;
    this.networkManager = NetworkManager;
    
    // Scene objects
    this.rootObject = new THREE.Group();
    this.rootObject.name = 'LoginScene';
    
    // UI state
    this.currentMode = 'login'; // 'login' or 'register'
    this.isLoading = false;
    this.errorMessage = '';
    
    // 3D UI elements
    this.backgroundPlane = null;
    this.titleText = null;
    this.loginPanel = null;
    this.registerPanel = null;
    this.loadingSpinner = null;
    this.errorPanel = null;
    
    // HTML overlay elements
    this.htmlOverlay = null;
    this.loginForm = null;
    this.registerForm = null;
    
    // Animation objects
    this.floatingElements = [];
    this.particleSystem = null;
    
    // Event listeners
    this.boundHandlers = new Map();
    
    // Form data
    this.formData = {
      login: { identifier: '', password: '' },
      register: { username: '', email: '', password: '', displayName: '' }
    };
    
    console.log('🔐 LoginScene created');
  }

  /**
   * Initialize the login scene
   */
  async initialize() {
    try {
      console.log('🔐 Initializing LoginScene...');
      
      this.createBackground();
      this.create3DElements();
      this.createHTMLOverlay();
      this.setupAnimations();
      this.setupEventListeners();
      
      console.log('✅ LoginScene initialized');
    } catch (error) {
      console.error('❌ Failed to initialize LoginScene:', error);
      throw error;
    }
  }

  /**
   * Create animated background
   */
  createBackground() {
    // Gradient background plane
    const geometry = new THREE.PlaneGeometry(100, 100);
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
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 color3;
        varying vec2 vUv;
        
        void main() {
          float wave1 = sin(vUv.x * 10.0 + time * 0.5) * 0.1;
          float wave2 = cos(vUv.y * 8.0 + time * 0.3) * 0.1;
          float pattern = wave1 + wave2;
          
          vec3 color = mix(color1, color2, vUv.y + pattern);
          color = mix(color, color3, vUv.x * 0.3);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });
    
    this.backgroundPlane = new THREE.Mesh(geometry, material);
    this.backgroundPlane.position.z = -10;
    this.backgroundPlane.name = 'Background';
    this.rootObject.add(this.backgroundPlane);
    
    // Floating particles
    this.createParticleSystem();
  }

  /**
   * Create particle system for background ambiance
   */
  createParticleSystem() {
    const particleCount = 50;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Random positions
      positions[i3] = (Math.random() - 0.5) * 50;
      positions[i3 + 1] = (Math.random() - 0.5) * 30;
      positions[i3 + 2] = (Math.random() - 0.5) * 20;
      
      // Blue-ish colors
      const color = new THREE.Color();
      color.setHSL(0.6 + Math.random() * 0.2, 0.5, 0.3 + Math.random() * 0.3);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      
      // Random sizes
      sizes[i] = Math.random() * 2 + 1;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    this.particleSystem = new THREE.Points(geometry, material);
    this.rootObject.add(this.particleSystem);
  }

  /**
   * Create 3D UI elements
   */
  create3DElements() {
    // Title text plane (we'll use a texture for text)
    this.createTitleText();
    
    // Decorative elements
    this.createFloatingElements();
  }

  /**
   * Create title text
   */
  createTitleText() {
    // Create canvas for text texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    // Draw text
    context.fillStyle = '#ffffff';
    context.font = 'bold 72px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('CLASH ROYALE', canvas.width / 2, canvas.height / 2);
    
    // Create texture and material
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9
    });
    
    const geometry = new THREE.PlaneGeometry(8, 2);
    this.titleText = new THREE.Mesh(geometry, material);
    this.titleText.position.set(0, 8, 0);
    this.titleText.name = 'Title';
    this.rootObject.add(this.titleText);
  }

  /**
   * Create floating decorative elements
   */
  createFloatingElements() {
    const elements = [
      { type: 'cube', position: [-15, 5, -5], color: 0x4a90e2 },
      { type: 'sphere', position: [15, 3, -3], color: 0xe74c3c },
      { type: 'cube', position: [-12, -2, -4], color: 0x2ecc71 },
      { type: 'sphere', position: [12, -4, -6], color: 0xf39c12 }
    ];
    
    elements.forEach((config, index) => {
      let geometry;
      if (config.type === 'cube') {
        geometry = new THREE.BoxGeometry(1, 1, 1);
      } else {
        geometry = new THREE.SphereGeometry(0.5, 16, 16);
      }
      
      const material = new THREE.MeshLambertMaterial({
        color: config.color,
        transparent: true,
        opacity: 0.7
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...config.position);
      mesh.castShadow = true;
      mesh.name = `FloatingElement${index}`;
      
      this.floatingElements.push(mesh);
      this.rootObject.add(mesh);
    });
  }

  /**
   * Create HTML overlay for forms
   */
  createHTMLOverlay() {
    // Create overlay container
    this.htmlOverlay = document.createElement('div');
    this.htmlOverlay.id = 'login-overlay';
    this.htmlOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
      font-family: 'Arial', sans-serif;
    `;
    
    // Create form container
    const formContainer = document.createElement('div');
    formContainer.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(26, 26, 46, 0.9);
      border: 2px solid rgba(74, 144, 226, 0.5);
      border-radius: 10px;
      padding: 30px;
      backdrop-filter: blur(10px);
      pointer-events: auto;
      min-width: 350px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    `;
    
    // Create login form
    this.createLoginForm(formContainer);
    
    // Create register form
    this.createRegisterForm(formContainer);
    
    // Create loading overlay
    this.createLoadingOverlay(formContainer);
    
    // Create error display
    this.createErrorDisplay(formContainer);
    
    // Create mode switcher
    this.createModeSwitcher(formContainer);
    
    this.htmlOverlay.appendChild(formContainer);
    document.body.appendChild(this.htmlOverlay);
  }

  /**
   * Create login form
   */
  createLoginForm(container) {
    this.loginForm = document.createElement('div');
    this.loginForm.id = 'login-form';
    this.loginForm.innerHTML = `
      <h2 style="color: #ffffff; text-align: center; margin-bottom: 30px;">Welcome Back</h2>
      
      <div style="margin-bottom: 20px;">
        <label style="color: #ffffff; display: block; margin-bottom: 5px;">Username or Email</label>
        <input type="text" id="login-identifier" 
               style="width: 100%; padding: 12px; border: 1px solid #4a90e2; border-radius: 5px; 
                      background: rgba(255, 255, 255, 0.1); color: #ffffff; font-size: 16px;"
               placeholder="Enter username or email">
      </div>
      
      <div style="margin-bottom: 30px;">
        <label style="color: #ffffff; display: block; margin-bottom: 5px;">Password</label>
        <input type="password" id="login-password"
               style="width: 100%; padding: 12px; border: 1px solid #4a90e2; border-radius: 5px; 
                      background: rgba(255, 255, 255, 0.1); color: #ffffff; font-size: 16px;"
               placeholder="Enter password">
      </div>
      
      <button id="login-submit" 
              style="width: 100%; padding: 15px; background: linear-gradient(45deg, #4a90e2, #357abd); 
                     border: none; border-radius: 5px; color: #ffffff; font-size: 16px; font-weight: bold; 
                     cursor: pointer; transition: all 0.3s ease;">
        Sign In
      </button>
      
      <div style="margin-top: 20px; text-align: center;">
        <button id="future-metamask-login" 
                style="width: 100%; padding: 12px; background: linear-gradient(45deg, #f6851b, #e2761b); 
                       border: none; border-radius: 5px; color: #ffffff; font-size: 14px; 
                       cursor: pointer; transition: all 0.3s ease; opacity: 0.7;">
          🦊 Connect with MetaMask (Coming Soon)
        </button>
      </div>
    `;
    
    container.appendChild(this.loginForm);
  }

  /**
   * Create register form
   */
  createRegisterForm(container) {
    this.registerForm = document.createElement('div');
    this.registerForm.id = 'register-form';
    this.registerForm.style.display = 'none';
    this.registerForm.innerHTML = `
      <h2 style="color: #ffffff; text-align: center; margin-bottom: 30px;">Create Account</h2>
      
      <div style="margin-bottom: 15px;">
        <label style="color: #ffffff; display: block; margin-bottom: 5px;">Username</label>
        <input type="text" id="register-username" 
               style="width: 100%; padding: 12px; border: 1px solid #4a90e2; border-radius: 5px; 
                      background: rgba(255, 255, 255, 0.1); color: #ffffff; font-size: 16px;"
               placeholder="Choose username">
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="color: #ffffff; display: block; margin-bottom: 5px;">Display Name</label>
        <input type="text" id="register-displayname" 
               style="width: 100%; padding: 12px; border: 1px solid #4a90e2; border-radius: 5px; 
                      background: rgba(255, 255, 255, 0.1); color: #ffffff; font-size: 16px;"
               placeholder="Your display name">
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="color: #ffffff; display: block; margin-bottom: 5px;">Email</label>
        <input type="email" id="register-email" 
               style="width: 100%; padding: 12px; border: 1px solid #4a90e2; border-radius: 5px; 
                      background: rgba(255, 255, 255, 0.1); color: #ffffff; font-size: 16px;"
               placeholder="Enter email address">
      </div>
      
      <div style="margin-bottom: 30px;">
        <label style="color: #ffffff; display: block; margin-bottom: 5px;">Password</label>
        <input type="password" id="register-password"
               style="width: 100%; padding: 12px; border: 1px solid #4a90e2; border-radius: 5px; 
                      background: rgba(255, 255, 255, 0.1); color: #ffffff; font-size: 16px;"
               placeholder="Create password">
      </div>
      
      <button id="register-submit" 
              style="width: 100%; padding: 15px; background: linear-gradient(45deg, #2ecc71, #27ae60); 
                     border: none; border-radius: 5px; color: #ffffff; font-size: 16px; font-weight: bold; 
                     cursor: pointer; transition: all 0.3s ease;">
        Create Account
      </button>
    `;
    
    container.appendChild(this.registerForm);
  }

  /**
   * Create loading overlay
   */
  createLoadingOverlay(container) {
    this.loadingOverlay = document.createElement('div');
    this.loadingOverlay.id = 'loading-overlay';
    this.loadingOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(26, 26, 46, 0.9);
      display: none;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
    `;
    
    this.loadingOverlay.innerHTML = `
      <div style="text-align: center; color: #ffffff;">
        <div style="width: 40px; height: 40px; border: 4px solid #4a90e2; border-top: 4px solid transparent; 
                    border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
        <p>Connecting...</p>
      </div>
      
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    
    container.appendChild(this.loadingOverlay);
  }

  /**
   * Create error display
   */
  createErrorDisplay(container) {
    this.errorDisplay = document.createElement('div');
    this.errorDisplay.id = 'error-display';
    this.errorDisplay.style.cssText = `
      background: rgba(231, 76, 60, 0.2);
      border: 1px solid #e74c3c;
      border-radius: 5px;
      padding: 15px;
      margin-bottom: 20px;
      color: #ffffff;
      display: none;
    `;
    
    container.insertBefore(this.errorDisplay, container.firstChild);
  }

  /**
   * Create mode switcher
   */
  createModeSwitcher(container) {
    const modeSwitcher = document.createElement('div');
    modeSwitcher.style.cssText = `
      text-align: center;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid rgba(74, 144, 226, 0.3);
    `;
    
    modeSwitcher.innerHTML = `
      <p style="color: #ffffff; margin-bottom: 10px;">
        <span id="mode-text">Don't have an account?</span>
      </p>
      <button id="mode-switch" 
              style="background: none; border: 1px solid #4a90e2; color: #4a90e2; 
                     padding: 10px 20px; border-radius: 5px; cursor: pointer; 
                     transition: all 0.3s ease;">
        Sign Up
      </button>
    `;
    
    container.appendChild(modeSwitcher);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Form submissions
    const loginSubmit = document.getElementById('login-submit');
    const registerSubmit = document.getElementById('register-submit');
    const modeSwitch = document.getElementById('mode-switch');
    const metaMaskBtn = document.getElementById('future-metamask-login');
    
    // Bind handlers to maintain context
    this.boundHandlers.set('login', this.handleLogin.bind(this));
    this.boundHandlers.set('register', this.handleRegister.bind(this));
    this.boundHandlers.set('modeSwitch', this.handleModeSwitch.bind(this));
    this.boundHandlers.set('metaMask', this.handleMetaMaskLogin.bind(this));
    
    loginSubmit?.addEventListener('click', this.boundHandlers.get('login'));
    registerSubmit?.addEventListener('click', this.boundHandlers.get('register'));
    modeSwitch?.addEventListener('click', this.boundHandlers.get('modeSwitch'));
    metaMaskBtn?.addEventListener('click', this.boundHandlers.get('metaMask'));
    
    // Enter key submissions
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    loginForm?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleLogin(e);
    });
    
    registerForm?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleRegister(e);
    });
    
    // Network events
    this.networkManager.on('auth:login_success', this.handleLoginSuccess.bind(this));
    this.networkManager.on('auth:register_success', this.handleRegisterSuccess.bind(this));
  }

  /**
   * Setup animations
   */
  setupAnimations() {
    // Title animation
    if (this.titleText) {
      this.titleText.position.y = 12;
      new TWEEN.Tween(this.titleText.position)
        .to({ y: 8 }, 2000)
        .easing(TWEEN.Easing.Elastic.Out)
        .start();
    }
    
    // Floating elements animation
    this.floatingElements.forEach((element, index) => {
      const originalY = element.position.y;
      const delay = index * 500;
      
      setTimeout(() => {
        const animate = () => {
          new TWEEN.Tween(element.position)
            .to({ y: originalY + 2 }, 3000 + Math.random() * 2000)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .yoyo(true)
            .repeat(Infinity)
            .start();
          
          new TWEEN.Tween(element.rotation)
            .to({ 
              x: element.rotation.x + Math.PI * 2,
              y: element.rotation.y + Math.PI * 2 
            }, 10000 + Math.random() * 5000)
            .repeat(Infinity)
            .start();
        };
        
        animate();
      }, delay);
    });
  }

  /**
   * Handle login form submission
   */
  async handleLogin(event) {
    event.preventDefault();
    
    if (this.isLoading) return;
    
    const identifier = document.getElementById('login-identifier')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    
    if (!identifier || !password) {
      this.showError('Please fill in all fields');
      return;
    }
    
    this.showLoading(true);
    this.hideError();
    
    try {
      const result = await this.networkManager.login(identifier, password);
      
      if (result.success) {
        this.handleLoginSuccess(result.user);
      } else {
        this.showError(result.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showError('Connection error. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Handle register form submission
   */
  async handleRegister(event) {
    event.preventDefault();
    
    if (this.isLoading) return;
    
    const username = document.getElementById('register-username')?.value.trim();
    const displayName = document.getElementById('register-displayname')?.value.trim();
    const email = document.getElementById('register-email')?.value.trim();
    const password = document.getElementById('register-password')?.value;
    
    if (!username || !displayName || !email || !password) {
      this.showError('Please fill in all fields');
      return;
    }
    
    this.showLoading(true);
    this.hideError();
    
    try {
      const result = await this.networkManager.register({
        username,
        displayName,
        email,
        password
      });
      
      if (result.success) {
        this.handleRegisterSuccess(result.user);
      } else {
        this.showError(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.showError('Connection error. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Handle mode switch between login and register
   */
  handleModeSwitch() {
    this.currentMode = this.currentMode === 'login' ? 'register' : 'login';
    
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const modeText = document.getElementById('mode-text');
    const modeButton = document.getElementById('mode-switch');
    
    if (this.currentMode === 'register') {
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
      modeText.textContent = 'Already have an account?';
      modeButton.textContent = 'Sign In';
    } else {
      registerForm.style.display = 'none';
      loginForm.style.display = 'block';
      modeText.textContent = "Don't have an account?";
      modeButton.textContent = 'Sign Up';
    }
    
    this.hideError();
  }

  /**
   * Handle MetaMask login (placeholder for future)
   */
  handleMetaMaskLogin() {
    this.showError('MetaMask integration coming soon!');
  }

  /**
   * Handle successful login
   */
  handleLoginSuccess(user) {
    console.log('✅ Login successful:', user);
    
    // Transition to welcome menu
    setTimeout(() => {
      this.sceneManager.switchToScene('welcomeMenu', { user }, 'fade');
    }, 1000);
  }

  /**
   * Handle successful registration
   */
  handleRegisterSuccess(user) {
    console.log('✅ Registration successful:', user);
    
    // Transition to welcome menu
    setTimeout(() => {
      this.sceneManager.switchToScene('welcomeMenu', { user }, 'fade');
    }, 1000);
  }

  /**
   * Show loading state
   */
  showLoading(show) {
    this.isLoading = show;
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.style.display = show ? 'flex' : 'none';
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const errorDisplay = document.getElementById('error-display');
    if (errorDisplay) {
      errorDisplay.textContent = message;
      errorDisplay.style.display = 'block';
    }
  }

  /**
   * Hide error message
   */
  hideError() {
    const errorDisplay = document.getElementById('error-display');
    if (errorDisplay) {
      errorDisplay.style.display = 'none';
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
      this.htmlOverlay.style.display = 'block';
    }
    
    // Start background animations
    this.startBackgroundAnimations();
    
    console.log('🔐 LoginScene activated');
  }

  /**
   * Scene lifecycle - deactivate
   */
  deactivate() {
    // Hide HTML overlay
    if (this.htmlOverlay) {
      this.htmlOverlay.style.display = 'none';
    }
    
    console.log('🔐 LoginScene deactivated');
  }

  /**
   * Start background animations
   */
  startBackgroundAnimations() {
    // Animate background shader
    if (this.backgroundPlane) {
      const material = this.backgroundPlane.material;
      const animateBackground = () => {
        if (material.uniforms && material.uniforms.time) {
          material.uniforms.time.value += 0.01;
        }
        requestAnimationFrame(animateBackground);
      };
      animateBackground();
    }
    
    // Animate particles
    if (this.particleSystem) {
      const animateParticles = () => {
        this.particleSystem.rotation.y += 0.001;
        requestAnimationFrame(animateParticles);
      };
      animateParticles();
    }
  }

  /**
   * Cleanup scene
   */
  async cleanup() {
    console.log('🧹 Cleaning up LoginScene...');
    
    // Remove HTML overlay
    if (this.htmlOverlay && this.htmlOverlay.parentNode) {
      this.htmlOverlay.parentNode.removeChild(this.htmlOverlay);
    }
    
    // Remove event listeners
    this.boundHandlers.forEach((handler, type) => {
      const element = document.getElementById(
        type === 'login' ? 'login-submit' :
        type === 'register' ? 'register-submit' :
        type === 'modeSwitch' ? 'mode-switch' :
        'future-metamask-login'
      );
      element?.removeEventListener('click', handler);
    });
    
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
    
    console.log('✅ LoginScene cleaned up');
  }
}

export default LoginScene;
