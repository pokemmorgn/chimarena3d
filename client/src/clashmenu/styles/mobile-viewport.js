/**
 * Mobile Viewport Styles - Système de viewport mobile optimisé
 * Gère l'affichage mobile portrait (375x812) avec background animé
 */

export class MobileViewport {
  
  /**
   * Obtenir tous les styles pour le viewport mobile
   */
  static getStyles() {
    return `
      ${this.getContainerStyles()}
      ${this.getBackgroundStyles()}
      ${this.getViewportStyles()}
      ${this.getStatusBarStyles()}
      ${this.getCanvasStyles()}
      ${this.getParticlesStyles()}
      ${this.getAnimations()}
    `;
  }

  /**
   * Container principal avec background animé
   */
  static getContainerStyles() {
    return `
      /* =================
         APP CONTAINER
         ================= */
      
      .app-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-background-gradient-primary);
        background-size: 400% 400%;
        animation: backgroundFlow 20s ease-in-out infinite;
        overflow: hidden;
        z-index: 0;
      }
      
      /* État de chargement */
      body:not(.app-ready) .app-container {
        cursor: wait;
      }
      
      body:not(.app-ready) .mobile-viewport {
        animation: viewportPulse 2s ease-in-out infinite alternate;
      }
    `;
  }

  /**
   * Système de background avec particules
   */
  static getBackgroundStyles() {
    return `
      /* =================
         BACKGROUND SYSTEM
         ================= */
      
      .background-particles {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: hidden;
        z-index: 1;
      }
      
      .particle {
        position: absolute;
        background: var(--color-border-primary);
        border-radius: 50%;
        pointer-events: none;
        filter: blur(1px);
        animation: particleFloat 6s ease-in-out infinite, 
                   particleDrift 8s ease-in-out infinite alternate;
      }
    `;
  }

  /**
   * Viewport mobile principal
   */
  static getViewportStyles() {
    return `
      /* =================
         MOBILE VIEWPORT
         ================= */
      
      .mobile-viewport {
        --mobile-width: 375px;
        --mobile-height: 812px;
        --mobile-max-width: 425px;
        --mobile-max-height: 920px;
        
        position: relative;
        width: var(--mobile-width);
        height: var(--mobile-height);
        max-width: 100vw;
        max-height: 100vh;
        background: var(--color-background-gradient-battle);
        border-radius: 25px;
        box-shadow: 
          0 0 60px var(--color-border-glow),
          0 0 120px rgba(74, 144, 226, 0.15),
          inset 0 0 40px rgba(0, 0, 0, 0.3);
        overflow: hidden;
        border: 2px solid var(--color-border-primary);
        z-index: 10;
        transition: transform 0.3s ease;
      }
      
      /* Effet de lueur animée autour du viewport */
      .mobile-viewport::before {
        content: '';
        position: absolute;
        top: -3px;
        left: -3px;
        right: -3px;
        bottom: -3px;
        background: linear-gradient(45deg, 
          transparent 0%, 
          var(--color-border-glow) 25%, 
          transparent 50%, 
          var(--color-status-online) 75%, 
          transparent 100%);
        border-radius: 28px;
        z-index: -1;
        animation: borderPulse 3s ease-in-out infinite alternate;
        opacity: 0.4;
      }
      
      /* Adaptations pour vrais appareils mobiles */
      @media (max-width: 425px) {
        .app-container {
          background: var(--color-background-viewport);
        }
        
        .mobile-viewport {
          width: 100vw;
          height: 100vh;
          border-radius: 0;
          border: none;
          box-shadow: none;
          --mobile-width: 100vw;
          --mobile-height: 100vh;
        }
        
        .mobile-viewport::before {
          display: none;
        }
      }
      
      /* Scaling pour desktop */
      @media (min-width: 1200px) {
        .mobile-viewport {
          --mobile-width: var(--mobile-max-width);
          --mobile-height: var(--mobile-max-height);
          transform: scale(1.1);
        }
      }
    `;
  }

  /**
   * Barre de statut mobile simulée
   */
  static getStatusBarStyles() {
    return `
      /* =================
         STATUS BAR MOBILE
         ================= */
      
      .mobile-status-bar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 44px;
        background: rgba(26, 26, 46, 0.8);
        backdrop-filter: blur(10px);
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 20px;
        z-index: 1000;
        font-size: 14px;
        font-weight: 600;
        color: var(--color-text-primary);
        border-radius: 25px 25px 0 0;
      }
      
      /* Éléments de la barre de statut */
      .status-left,
      .status-right {
        display: flex;
        align-items: center;
        gap: 5px;
      }
      
      /* Indicateurs de signal */
      .signal-bars {
        display: flex;
        gap: 2px;
      }
      
      .signal-bars .bar {
        width: 3px;
        background: var(--color-text-primary);
        border-radius: 1px;
      }
      
      .signal-bars .bar:nth-child(1) { height: 4px; }
      .signal-bars .bar:nth-child(2) { height: 6px; }
      .signal-bars .bar:nth-child(3) { height: 8px; }
      .signal-bars .bar:nth-child(4) { height: 10px; }
      
      /* Indicateur de batterie */
      .battery {
        width: 24px;
        height: 12px;
        border: 1px solid var(--color-text-primary);
        border-radius: 2px;
        position: relative;
      }
      
      .battery::after {
        content: '';
        position: absolute;
        right: -3px;
        top: 3px;
        width: 2px;
        height: 6px;
        background: var(--color-text-primary);
        border-radius: 0 1px 1px 0;
      }
      
      .battery-level {
        position: absolute;
        top: 1px;
        left: 1px;
        bottom: 1px;
        width: 70%;
        background: var(--color-brand-accent);
        border-radius: 1px;
        transition: width 0.3s ease;
      }
      
      /* États de batterie */
      .battery.low .battery-level {
        background: var(--color-brand-danger);
        width: 20%;
      }
      
      .battery.charging .battery-level {
        background: var(--color-brand-accent);
        animation: batteryCharging 1.5s ease-in-out infinite alternate;
      }
      
      /* Mobile natif - cacher la barre de statut simulée */
      @media (max-width: 425px) {
        .mobile-status-bar {
          background: rgba(26, 26, 46, 0.9);
          border-radius: 0;
        }
      }
    `;
  }

  /**
   * Canvas de jeu Three.js
   */
  static getCanvasStyles() {
    return `
      /* =================
         CANVAS STYLES
         ================= */
      
      #game-canvas,
      .game-canvas {
        display: block;
        position: absolute;
        top: 44px;
        left: 0;
        width: 100%;
        height: calc(100% - 44px);
        z-index: 5;
        border-radius: 0 0 23px 23px;
        background: var(--color-background-viewport);
        touch-action: none;
        -webkit-touch-callout: none;
        user-select: none;
      }
      
      /* Mobile natif */
      @media (max-width: 425px) {
        #game-canvas,
        .game-canvas {
          border-radius: 0;
          top: 0;
          height: 100%;
        }
      }
      
      /* État de chargement du canvas */
      .game-canvas.loading {
        background: var(--color-background-viewport);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .game-canvas.loading::before {
        content: '';
        width: 40px;
        height: 40px;
        border: 4px solid var(--color-border-primary);
        border-top: 4px solid var(--color-brand-primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
    `;
  }

  /**
   * Système de particules
   */
  static getParticlesStyles() {
    return `
      /* =================
         PARTICLE SYSTEM
         ================= */
      
      .particle {
        opacity: 0.1;
        transition: opacity 0.3s ease;
      }
      
      /* Tailles de particules */
      .particle.small { width: 2px; height: 2px; }
      .particle.medium { width: 4px; height: 4px; }
      .particle.large { width: 6px; height: 6px; }
      
      /* Types de particules */
      .particle.glow {
        box-shadow: 0 0 10px currentColor;
        filter: blur(0.5px);
      }
      
      .particle.sparkle {
        background: linear-gradient(45deg, 
          var(--color-brand-gold), 
          var(--color-brand-accent));
        animation: sparkle 3s ease-in-out infinite;
      }
      
      .particle.energy {
        background: var(--color-brand-primary);
        box-shadow: 0 0 8px var(--color-brand-primary);
      }
      
      /* Particules interactives au toucher */
      .touch-particle {
        position: fixed;
        pointer-events: none;
        border-radius: 50%;
        background: radial-gradient(circle, 
          rgba(74, 144, 226, 0.6), 
          transparent);
        animation: touchRipple 0.6s ease-out forwards;
        z-index: 9999;
      }
    `;
  }

  /**
   * Animations du viewport mobile
   */
  static getAnimations() {
    return `
      /* =================
         MOBILE ANIMATIONS
         ================= */
      
      @keyframes backgroundFlow {
        0%, 100% { 
          background-position: 0% 50%; 
          filter: hue-rotate(0deg);
        }
        25% { 
          background-position: 100% 50%; 
          filter: hue-rotate(15deg);
        }
        50% { 
          background-position: 100% 100%; 
          filter: hue-rotate(30deg);
        }
        75% { 
          background-position: 0% 100%; 
          filter: hue-rotate(15deg);
        }
      }
      
      @keyframes borderPulse {
        0% { 
          opacity: 0.4; 
          transform: scale(1); 
        }
        100% { 
          opacity: 0.8; 
          transform: scale(1.02); 
        }
      }
      
      @keyframes particleFloat {
        0%, 100% {
          transform: translateY(0px) rotate(0deg);
          opacity: 0.1;
        }
        50% {
          transform: translateY(-30px) rotate(180deg);
          opacity: 0.3;
        }
      }
      
      @keyframes particleDrift {
        0% { transform: translateX(-20px); }
        100% { transform: translateX(20px); }
      }
      
      @keyframes viewportPulse {
        0% { transform: scale(0.98); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
      }
      
      @keyframes batteryCharging {
        0% { width: 30%; }
        100% { width: 80%; }
      }
      
      @keyframes sparkle {
        0%, 100% { 
          opacity: 0.2; 
          transform: scale(1) rotate(0deg);
        }
        50% { 
          opacity: 0.8; 
          transform: scale(1.2) rotate(180deg);
        }
      }
      
      @keyframes touchRipple {
        0% {
          width: 0;
          height: 0;
          opacity: 0.6;
        }
        100% {
          width: 100px;
          height: 100px;
          opacity: 0;
        }
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
  }

  /**
   * Styles pour les différentes qualités de performance
   */
  static getQualityStyles(quality = 'medium') {
    const baseStyles = this.getStyles();
    
    if (quality === 'low') {
      return baseStyles + `
        /* Performance réduite pour mobiles bas de gamme */
        .app-container {
          animation: none;
          background: var(--color-background-viewport);
        }
        
        .mobile-viewport::before {
          animation: none;
        }
        
        .particle {
          animation: none;
          opacity: 0.05;
        }
        
        .background-particles {
          display: none;
        }
      `;
    }
    
    if (quality === 'high') {
      return baseStyles + `
        /* Qualité maximale pour appareils performants */
        .mobile-viewport::before {
          filter: blur(2px);
          animation: borderPulse 2s ease-in-out infinite alternate;
        }
        
        .particle.glow {
          box-shadow: 0 0 15px currentColor;
          filter: blur(1px);
        }
        
        .background-particles {
          backdrop-filter: blur(1px);
        }
        
        /* Effets supplémentaires pour haute qualité */
        .mobile-viewport {
          box-shadow: 
            0 0 60px var(--color-border-glow),
            0 0 120px rgba(74, 144, 226, 0.15),
            0 0 200px rgba(74, 144, 226, 0.05),
            inset 0 0 40px rgba(0, 0, 0, 0.3);
        }
      `;
    }
    
    return baseStyles;
  }

  /**
   * Responsive styles pour différentes tailles d'écran
   */
  static getResponsiveStyles() {
    return `
      /* =================
         RESPONSIVE MOBILE
         ================= */
      
      /* iPhone SE et petits écrans */
      @media (max-width: 375px) and (max-height: 667px) {
        .mobile-viewport {
          --mobile-width: 320px;
          --mobile-height: 568px;
        }
        
        .mobile-status-bar {
          height: 40px;
          font-size: 12px;
          padding: 0 16px;
        }
        
        #game-canvas,
        .game-canvas {
          top: 40px;
          height: calc(100% - 40px);
        }
      }
      
      /* iPhone 12/13/14 et équivalents */
      @media (min-width: 390px) and (max-width: 428px) {
        .mobile-viewport {
          --mobile-width: 390px;
          --mobile-height: 844px;
        }
      }
      
      /* iPad mini en portrait */
      @media (min-width: 744px) and (max-height: 1133px) and (orientation: portrait) {
        .mobile-viewport {
          --mobile-width: 500px;
          --mobile-height: 900px;
          transform: scale(0.9);
        }
      }
      
      /* Très grands écrans desktop */
      @media (min-width: 1600px) {
        .mobile-viewport {
          transform: scale(1.3);
        }
      }
      
      /* Mode paysage mobile (déconseillé) */
      @media (max-width: 926px) and (orientation: landscape) {
        .app-container {
          background: var(--color-feedback-warning);
        }
        
        .mobile-viewport::after {
          content: '📱 Veuillez passer en mode portrait';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          z-index: 10000;
          font-weight: bold;
        }
      }
    `;
  }

  /**
   * Utilitaires pour gérer le viewport dynamiquement
   */
  static createViewport(container = document.body) {
    const viewport = document.createElement('div');
    viewport.className = 'mobile-viewport';
    viewport.id = 'mobile-viewport';
    
    // Créer la barre de statut
    const statusBar = this.createStatusBar();
    viewport.appendChild(statusBar);
    
    // Créer le canvas container
    const canvasContainer = document.createElement('div');
    canvasContainer.id = 'game-canvas-container';
    canvasContainer.style.cssText = `
      position: absolute;
      top: 44px;
      left: 0;
      right: 0;
      bottom: 0;
    `;
    viewport.appendChild(canvasContainer);
    
    container.appendChild(viewport);
    return viewport;
  }

  /**
   * Créer la barre de statut mobile
   */
  static createStatusBar() {
    const statusBar = document.createElement('div');
    statusBar.className = 'mobile-status-bar';
    
    statusBar.innerHTML = `
      <div class="status-left">
        <span id="current-time">${this.getCurrentTime()}</span>
      </div>
      <div class="status-right">
        <div class="signal-bars">
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
        </div>
        <span>WiFi</span>
        <div class="battery">
          <div class="battery-level"></div>
        </div>
      </div>
    `;
    
    // Mettre à jour l'heure toutes les minutes
    setInterval(() => {
      const timeElement = statusBar.querySelector('#current-time');
      if (timeElement) {
        timeElement.textContent = this.getCurrentTime();
      }
    }, 60000);
    
    return statusBar;
  }

  /**
   * Obtenir l'heure actuelle formatée
   */
  static getCurrentTime() {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' + 
           now.getMinutes().toString().padStart(2, '0');
  }

  /**
   * Créer des particules de fond
   */
  static createBackgroundParticles(container, count = null) {
    if (!container) return;
    
    // Adapter le nombre selon l'appareil
    const isMobile = window.innerWidth <= 425;
    const particleCount = count || (isMobile ? 12 : 20);
    
    // Supprimer les particules existantes
    const existing = container.querySelector('.background-particles');
    if (existing) existing.remove();
    
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'background-particles';
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      
      // Taille aléatoire
      const size = Math.random() * 4 + 2;
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      
      // Position aléatoire
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      
      // Animation aléatoire
      const floatDuration = (Math.random() * 4 + 3) + 's';
      const driftDuration = (Math.random() * 6 + 4) + 's';
      const delay = Math.random() * 3 + 's';
      
      particle.style.animation = `
        particleFloat ${floatDuration} ease-in-out infinite alternate ${delay},
        particleDrift ${driftDuration} ease-in-out infinite alternate
      `;
      
      // Type de particule occasionnel
      if (Math.random() > 0.7) {
        particle.classList.add('glow');
      }
      if (Math.random() > 0.9) {
        particle.classList.add('sparkle');
      }
      
      particlesContainer.appendChild(particle);
    }
    
    container.appendChild(particlesContainer);
    return particlesContainer;
  }

  /**
   * Adapter le viewport à la performance
   */
  static adaptToPerformance(quality) {
    const viewport = document.querySelector('.mobile-viewport');
    const particles = document.querySelector('.background-particles');
    
    if (!viewport) return;
    
    switch (quality) {
      case 'low':
        viewport.style.animation = 'none';
        if (particles) particles.style.display = 'none';
        break;
        
      case 'medium':
        viewport.style.animation = '';
        if (particles) {
          particles.style.display = '';
          // Réduire les particules
          const particleElements = particles.querySelectorAll('.particle');
          particleElements.forEach((particle, index) => {
            if (index > 10) particle.style.display = 'none';
          });
        }
        break;
        
      case 'high':
        viewport.style.animation = '';
        if (particles) {
          particles.style.display = '';
          particles.querySelectorAll('.particle').forEach(p => {
            p.style.display = '';
          });
        }
        break;
    }
    
    console.log(`📱 Viewport adapté à la qualité: ${quality}`);
  }

  /**
   * Créer un effet de ripple au toucher
   */
  static createTouchRipple(x, y) {
    const ripple = document.createElement('div');
    ripple.className = 'touch-particle';
    
    ripple.style.left = (x - 25) + 'px';
    ripple.style.top = (y - 25) + 'px';
    
    document.body.appendChild(ripple);
    
    // Supprimer après animation
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 600);
  }

  /**
   * Mettre à jour l'état de la batterie
   */
  static updateBatteryStatus(level, isCharging = false) {
    const battery = document.querySelector('.battery');
    const batteryLevel = document.querySelector('.battery-level');
    
    if (!battery || !batteryLevel) return;
    
    // Mettre à jour le niveau
    batteryLevel.style.width = (level * 100) + '%';
    
    // États visuels
    battery.classList.toggle('low', level < 0.2);
    battery.classList.toggle('charging', isCharging);
    
    // Couleur selon le niveau
    if (level < 0.2) {
      batteryLevel.style.background = 'var(--color-brand-danger)';
    } else if (level < 0.5) {
      batteryLevel.style.background = 'var(--color-brand-warning)';
    } else {
      batteryLevel.style.background = 'var(--color-brand-accent)';
    }
  }

  /**
   * Gérer l'orientation de l'écran
   */
  static handleOrientationChange() {
    const viewport = document.querySelector('.mobile-viewport');
    if (!viewport) return;
    
    setTimeout(() => {
      if (window.innerHeight < window.innerWidth && window.innerWidth < 1024) {
        // Mode paysage sur mobile - afficher avertissement
        viewport.classList.add('landscape-warning');
      } else {
        viewport.classList.remove('landscape-warning');
      }
    }, 100);
  }

  /**
   * Initialiser le système viewport mobile
   */
  static initialize(options = {}) {
    const {
      container = document.body,
      particles = true,
      particleCount = null,
      quality = 'medium'
    } = options;
    
    // Créer le viewport
    const viewport = this.createViewport(container);
    
    // Ajouter les particules si demandées
    if (particles) {
      this.createBackgroundParticles(viewport, particleCount);
    }
    
    // Adapter à la performance
    this.adaptToPerformance(quality);
    
    // Gérer l'orientation
    window.addEventListener('orientationchange', () => {
      this.handleOrientationChange();
    });
    
    window.addEventListener('resize', () => {
      this.handleOrientationChange();
    });
    
    // Effets de touch si supporté
    if ('ontouchstart' in window) {
      viewport.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        this.createTouchRipple(touch.clientX, touch.clientY);
      });
    }
    
    console.log('📱 Mobile viewport system initialized');
    return viewport;
  }

  /**
   * Obtenir les métriques du viewport
   */
  static getViewportMetrics() {
    const viewport = document.querySelector('.mobile-viewport');
    if (!viewport) return null;
    
    const rect = viewport.getBoundingClientRect();
    const computedStyle = getComputedStyle(viewport);
    
    return {
      width: rect.width,
      height: rect.height,
      aspectRatio: rect.width / rect.height,
      scale: computedStyle.transform,
      isNativeMobile: window.innerWidth <= 425,
      devicePixelRatio: window.devicePixelRatio || 1,
      orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
    };
  }
}

export default MobileViewport;
