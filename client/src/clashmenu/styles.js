/**
 * Clash Menu Styles - CSS en JavaScript (version corrigée finale)
 * Tous les styles sont dans des strings JavaScript pour éviter les erreurs de parsing
 */
class ClashMenuStyles {
  
  /**
   * Couleurs principales du thème Clash Royale
   */
  static get colors() {
    return {
      // Background colors
      darkBlue: '#0f1419',
      royalBlue: '#1a237e',
      lightBlue: '#3949ab',
      arenaBlue: '#1565c0',
      
      // UI colors
      gold: '#ffd700',
      orange: '#ff9800',
      green: '#4caf50',
      red: '#f44336',
      purple: '#9c27b0',
      
      // Text colors
      white: '#ffffff',
      lightGray: '#e0e0e0',
      darkGray: '#424242',
      
      // Accent colors
      neonBlue: '#00bcd4',
      electric: '#00e5ff',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336'
    };
  }
  
  /**
   * Générer le CSS complet
   */
  static getCSS() {
    return `
      ${this.getContainerStyles()}
      ${this.getTabNavigationStyles()}
      ${this.getBattleTabStyles()}
      ${this.getComingSoonStyles()}
      ${this.getAnimationStyles()}
      ${this.getUtilityStyles()}
    `;
  }

  /**
   * Styles du container principal (responsive)
   */
  static getContainerStyles() {
    const { darkBlue, royalBlue } = this.colors;
    
    return `
      .clash-menu-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, ${darkBlue}, ${royalBlue});
        z-index: 1000;
        font-family: 'Arial', sans-serif;
        overflow: hidden;
        display: none;
      }
      
      .clash-menu-container.active {
        display: block;
      }
      
      /* Responsive container adjustments */
      @media (max-width: 768px) {
        .clash-menu-container {
          background: linear-gradient(135deg, ${darkBlue}f0, ${royalBlue}f0);
        }
      }
    `;
  }

  /**
   * Styles de la navigation par onglets (responsive mobile-first)
   */
  static getTabNavigationStyles() {
    const { darkBlue, gold, orange, white, lightGray, neonBlue } = this.colors;
    
    return `
      .tab-navigation {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 80px;
        background: linear-gradient(to top, ${darkBlue}dd, ${darkBlue}aa);
        backdrop-filter: blur(15px);
        border-top: 1px solid rgba(74, 144, 226, 0.2);
        display: flex;
        align-items: center;
        justify-content: space-around;
        padding: 0 10px;
        box-shadow: 0 -8px 25px rgba(0, 0, 0, 0.4);
        z-index: 10001;
      }
      
      .tab-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 8px 12px;
        background: none;
        border: none;
        color: ${lightGray};
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        border-radius: 12px;
        min-width: 65px;
        min-height: 60px;
        position: relative;
        overflow: hidden;
      }
      
      .tab-button:before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        background: radial-gradient(circle, ${neonBlue}30, transparent);
        border-radius: 50%;
        transition: all 0.4s ease;
        transform: translate(-50%, -50%);
      }
      
      .tab-button:hover:before {
        width: 100px;
        height: 100px;
      }
      
      .tab-button:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-3px) scale(1.05);
        color: ${neonBlue};
      }
      
      .tab-button.active {
        color: ${gold};
        background: linear-gradient(145deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.05));
        transform: translateY(-4px) scale(1.1);
        box-shadow: 0 8px 20px rgba(255, 215, 0, 0.2);
        border: 1px solid rgba(255, 215, 0, 0.3);
      }
      
      .tab-button.active:before {
        width: 80px;
        height: 80px;
        background: radial-gradient(circle, ${gold}20, transparent);
      }
      
      .tab-button.disabled {
        opacity: 0.4;
        cursor: not-allowed;
        color: ${lightGray};
      }
      
      .tab-button.disabled:hover {
        background: none;
        transform: none;
        color: ${lightGray};
      }
      
      .tab-button.disabled:before {
        display: none;
      }
      
      .tab-icon {
        font-size: 22px;
        margin-bottom: 4px;
        transition: all 0.3s ease;
        z-index: 1;
        position: relative;
      }
      
      .tab-button:hover .tab-icon {
        transform: scale(1.1);
      }
      
      .tab-button.active .tab-icon {
        transform: scale(1.2);
        filter: drop-shadow(0 0 8px ${gold}80);
      }
      
      .tab-label {
        font-size: 11px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        line-height: 1;
        z-index: 1;
        position: relative;
      }
      
      .tab-coming-soon {
        font-size: 9px;
        color: ${orange};
        margin-top: 1px;
        z-index: 1;
        position: relative;
        font-weight: normal;
        opacity: 0.8;
      }
      
      /* Badge notifications */
      .tab-badge {
        position: absolute;
        top: 4px;
        right: 4px;
        background: ${orange};
        color: white;
        border-radius: 10px;
        min-width: 16px;
        height: 16px;
        font-size: 10px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid ${darkBlue};
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        z-index: 2;
      }
      
      /* Mobile optimizations */
      @media (max-width: 480px) {
        .tab-navigation {
          height: 70px;
          padding: 0 5px;
        }
        
        .tab-button {
          padding: 6px 8px;
          min-width: 55px;
          min-height: 50px;
          border-radius: 10px;
        }
        
        .tab-icon {
          font-size: 20px;
          margin-bottom: 3px;
        }
        
        .tab-label {
          font-size: 10px;
        }
        
        .tab-coming-soon {
          font-size: 8px;
        }
        
        .tab-badge {
          min-width: 14px;
          height: 14px;
          font-size: 9px;
          top: 2px;
          right: 2px;
        }
      }
      
      /* Ultra small screens */
      @media (max-width: 360px) {
        .tab-navigation {
          height: 65px;
          padding: 0 2px;
        }
        
        .tab-button {
          min-width: 50px;
          min-height: 45px;
          padding: 4px 6px;
        }
        
        .tab-icon {
          font-size: 18px;
        }
        
        .tab-label {
          font-size: 9px;
        }
      }
    `;
  }

  /**
   * Styles de l'onglet Bataille (responsive et mobile-friendly)
   */
  static getBattleTabStyles() {
    const { white, gold, green, red, orange, darkBlue, royalBlue, neonBlue, electric } = this.colors;
    
    return `
      .battle-tab {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: calc(100% - 80px);
        padding: 15px;
        overflow-y: auto;
        overflow-x: hidden;
        display: none;
        background: transparent;
      }
      
      .battle-tab.active {
        display: block;
      }
      
      /* Scrollbar styling for better UX */
      .battle-tab::-webkit-scrollbar {
        width: 6px;
      }
      
      .battle-tab::-webkit-scrollbar-track {
        background: rgba(26, 26, 46, 0.3);
        border-radius: 3px;
      }
      
      .battle-tab::-webkit-scrollbar-thumb {
        background: ${neonBlue}60;
        border-radius: 3px;
      }
      
      .battle-tab::-webkit-scrollbar-thumb:hover {
        background: ${neonBlue}80;
      }
      
      /* Header avec stats joueur (responsive) */
      .battle-header {
        text-align: center;
        margin-bottom: 25px;
        padding: 25px 20px;
        background: linear-gradient(135deg, ${darkBlue}cc, ${royalBlue}cc);
        border-radius: 20px;
        backdrop-filter: blur(20px);
        border: 2px solid ${neonBlue}40;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        position: relative;
        overflow: hidden;
      }
      
      .battle-header:before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(45deg, transparent, ${neonBlue}10, transparent);
        animation: shimmer 3s ease-in-out infinite;
      }
      
      .player-name {
        font-size: 28px;
        font-weight: bold;
        color: ${gold};
        margin-bottom: 15px;
        text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.6);
        position: relative;
        z-index: 1;
      }
      
      .player-stats {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 30px;
        margin-top: 20px;
        flex-wrap: wrap;
        position: relative;
        z-index: 1;
      }
      
      .stat-item {
        text-align: center;
        background: rgba(0, 0, 0, 0.2);
        padding: 12px 16px;
        border-radius: 12px;
        backdrop-filter: blur(5px);
        border: 1px solid ${neonBlue}30;
        min-width: 80px;
        transition: all 0.3s ease;
      }
      
      .stat-item:hover {
        transform: translateY(-2px);
        border-color: ${neonBlue}60;
        box-shadow: 0 5px 15px rgba(0, 188, 212, 0.2);
      }
      
      .stat-value {
        font-size: 22px;
        font-weight: bold;
        color: ${white};
        display: block;
        margin-bottom: 4px;
      }
      
      .stat-label {
        font-size: 12px;
        color: ${neonBlue};
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 500;
      }
      
      /* Status de connexion (amélioré) */
      .connection-status {
        text-align: center;
        padding: 12px 20px;
        margin-bottom: 25px;
        border-radius: 15px;
        font-weight: bold;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        position: relative;
        overflow: hidden;
      }
      
      .connection-status:before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        transition: left 0.8s ease;
      }
      
      .connection-status.connected:before {
        left: 100%;
      }
      
      .connection-status.connected {
        background: linear-gradient(135deg, ${green}25, ${green}15);
        color: ${green};
        border: 2px solid ${green}50;
        box-shadow: 0 0 20px ${green}30;
      }
      
      .connection-status.connecting {
        background: linear-gradient(135deg, ${orange}25, ${orange}15);
        color: ${orange};
        border: 2px solid ${orange}50;
        box-shadow: 0 0 20px ${orange}30;
      }
      
      .connection-status.error {
        background: linear-gradient(135deg, ${red}25, ${red}15);
        color: ${red};
        border: 2px solid ${red}50;
        box-shadow: 0 0 20px ${red}30;
      }
      
      .connection-status.searching {
        background: linear-gradient(135deg, ${electric}25, ${electric}15);
        color: ${electric};
        border: 2px solid ${electric}50;
        animation: pulse 1.5s infinite, glow 2s ease-in-out infinite alternate;
        box-shadow: 0 0 30px ${electric}40;
      }
      
      /* Boutons de bataille (responsive) */
      .battle-buttons {
        display: flex;
        flex-direction: column;
        gap: 15px;
        max-width: 420px;
        margin: 0 auto 25px auto;
      }
      
      .battle-button {
        padding: 18px 25px;
        font-size: 18px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        border: none;
        border-radius: 15px;
        cursor: pointer;
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        position: relative;
        overflow: hidden;
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
      }
      
      .battle-button:before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.6s ease;
      }
      
      .battle-button:hover:before {
        left: 100%;
      }
      
      .battle-button:hover {
        transform: translateY(-4px) scale(1.02);
        box-shadow: 0 12px 35px rgba(0, 0, 0, 0.3);
      }
      
      .battle-button:active {
        transform: translateY(-2px) scale(0.98);
        transition: all 0.1s ease;
      }
      
      .battle-button.primary {
        background: linear-gradient(135deg, ${green}, #45a049, ${green});
        color: ${white};
        box-shadow: 0 8px 25px ${green}40;
      }
      
      .battle-button.primary:hover {
        background: linear-gradient(135deg, #45a049, ${green}, #45a049);
        box-shadow: 0 12px 35px ${green}50;
      }
      
      .battle-button.secondary {
        background: linear-gradient(135deg, ${neonBlue}, #00acc1, ${neonBlue});
        color: ${white};
        box-shadow: 0 8px 25px ${neonBlue}40;
      }
      
      .battle-button.secondary:hover {
        background: linear-gradient(135deg, #00acc1, ${neonBlue}, #00acc1);
        box-shadow: 0 12px 35px ${neonBlue}50;
      }
      
      .battle-button.tertiary {
        background: linear-gradient(135deg, ${orange}, #f57c00, ${orange});
        color: ${white};
        box-shadow: 0 8px 25px ${orange}40;
      }
      
      .battle-button.tertiary:hover {
        background: linear-gradient(135deg, #f57c00, ${orange}, #f57c00);
        box-shadow: 0 12px 35px ${orange}50;
      }
      
      .battle-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
        background: linear-gradient(135deg, #666, #777);
      }
      
      .battle-button:disabled:hover {
        transform: none;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        background: linear-gradient(135deg, #666, #777);
      }
      
      /* Mode de bataille (responsive grid) */
      .battle-modes {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
        margin-top: 20px;
        max-width: 420px;
        margin-left: auto;
        margin-right: auto;
      }
      
      .battle-mode-card {
        background: linear-gradient(135deg, ${darkBlue}aa, ${royalBlue}aa);
        border: 2px solid ${neonBlue}30;
        border-radius: 15px;
        padding: 18px 12px;
        text-align: center;
        cursor: pointer;
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        backdrop-filter: blur(15px);
        position: relative;
        overflow: hidden;
      }
      
      .battle-mode-card:before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        background: radial-gradient(circle, ${neonBlue}20, transparent);
        border-radius: 50%;
        transition: all 0.5s ease;
        transform: translate(-50%, -50%);
      }
      
      .battle-mode-card:hover:before {
        width: 200px;
        height: 200px;
      }
      
      .battle-mode-card:hover {
        border-color: ${neonBlue};
        transform: translateY(-6px) scale(1.05);
        box-shadow: 0 15px 40px rgba(0, 188, 212, 0.25);
      }
      
      .battle-mode-icon {
        font-size: 32px;
        margin-bottom: 8px;
        display: block;
        position: relative;
        z-index: 1;
        transition: all 0.3s ease;
      }
      
      .battle-mode-card:hover .battle-mode-icon {
        transform: scale(1.2);
        filter: drop-shadow(0 0 10px currentColor);
      }
      
      .battle-mode-title {
        color: ${white};
        font-weight: bold;
        font-size: 15px;
        margin-bottom: 6px;
        position: relative;
        z-index: 1;
      }
      
      .battle-mode-desc {
        color: ${neonBlue};
        font-size: 11px;
        line-height: 1.3;
        position: relative;
        z-index: 1;
        opacity: 0.9;
      }
      
      /* Responsive adjustments */
      @media (max-width: 768px) {
        .battle-tab {
          height: calc(100% - 70px);
          padding: 12px;
        }
        
        .battle-header {
          padding: 20px 15px;
          margin-bottom: 20px;
          border-radius: 15px;
        }
        
        .player-name {
          font-size: 24px;
          margin-bottom: 12px;
        }
        
        .player-stats {
          gap: 15px;
        }
        
        .stat-item {
          padding: 10px 12px;
          min-width: 70px;
        }
        
        .stat-value {
          font-size: 18px;
        }
        
        .stat-label {
          font-size: 11px;
        }
        
        .battle-buttons {
          max-width: 100%;
          gap: 12px;
        }
        
        .battle-button {
          padding: 15px 20px;
          font-size: 16px;
          letter-spacing: 1px;
        }
        
        .battle-modes {
          grid-template-columns: 1fr;
          max-width: 100%;
        }
        
        .battle-mode-card {
          padding: 15px;
        }
      }
      
      /* Ultra small screens */
      @media (max-width: 360px) {
        .battle-tab {
          height: calc(100% - 65px);
          padding: 10px;
        }
        
        .battle-header {
          padding: 15px 10px;
        }
        
        .player-name {
          font-size: 22px;
        }
        
        .player-stats {
          gap: 10px;
        }
        
        .stat-item {
          padding: 8px 10px;
          min-width: 65px;
        }
        
        .stat-value {
          font-size: 16px;
        }
        
        .battle-button {
          padding: 12px 16px;
          font-size: 15px;
        }
      }
    `;
  }

  /**
   * Styles pour les messages "Coming Soon"
   */
  static getComingSoonStyles() {
    const { white, orange, darkBlue, royalBlue, neonBlue } = this.colors;
    
    return `
      .coming-soon-message {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: calc(100% - 80px);
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, ${darkBlue}dd, ${royalBlue}dd);
        backdrop-filter: blur(10px);
        z-index: 100;
      }
      
      .coming-soon-content {
        text-align: center;
        background: linear-gradient(135deg, ${darkBlue}, ${royalBlue});
        border: 2px solid ${neonBlue}44;
        border-radius: 20px;
        padding: 50px;
        max-width: 400px;
        backdrop-filter: blur(20px);
      }
      
      .coming-soon-content h2 {
        color: ${orange};
        font-size: 36px;
        margin-bottom: 20px;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      }
      
      .coming-soon-content p {
        color: ${white};
        font-size: 18px;
        margin-bottom: 30px;
        opacity: 0.9;
      }
      
      .back-to-battle-btn {
        padding: 15px 30px;
        background: linear-gradient(135deg, ${neonBlue}, #00acc1);
        color: ${white};
        border: none;
        border-radius: 10px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .back-to-battle-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px ${neonBlue}44;
      }
    `;
  }

  /**
   * Animations CSS
   */
  static getAnimationStyles() {
    return `
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.05); }
      }
      
      @keyframes shimmer {
        0% { background-position: -200px 0; }
        100% { background-position: calc(200px + 100%) 0; }
      }
      
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      
      @keyframes glow {
        0%, 100% { box-shadow: 0 0 5px currentColor; }
        50% { box-shadow: 0 0 20px currentColor, 0 0 30px currentColor; }
      }
      
      .animate-float {
        animation: float 3s ease-in-out infinite;
      }
      
      .animate-glow {
        animation: glow 2s ease-in-out infinite;
      }
      
      .animate-shimmer {
        background: linear-gradient(90deg, 
          transparent, 
          rgba(255, 255, 255, 0.2), 
          transparent);
        background-size: 200px 100%;
        animation: shimmer 2s infinite;
      }
    `;
  }

  /**
   * Classes utilitaires
   */
  static getUtilityStyles() {
    const { white, gold, green, red, orange, neonBlue } = this.colors;
    
    return `
      .text-center { text-align: center; }
      .text-left { text-align: left; }
      .text-right { text-align: right; }
      
      .text-white { color: ${white}; }
      .text-gold { color: ${gold}; }
      .text-green { color: ${green}; }
      .text-red { color: ${red}; }
      .text-orange { color: ${orange}; }
      .text-blue { color: ${neonBlue}; }
      
      .font-bold { font-weight: bold; }
      .font-normal { font-weight: normal; }
      
      .uppercase { text-transform: uppercase; }
      .lowercase { text-transform: lowercase; }
      .capitalize { text-transform: capitalize; }
      
      .hidden { display: none !important; }
      .visible { display: block !important; }
      
      .fade-in {
        opacity: 0;
        animation: fadeIn 0.5s ease-in-out forwards;
      }
      
      .fade-out {
        opacity: 1;
        animation: fadeOut 0.5s ease-in-out forwards;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-20px); }
      }
    `;
  }
}

export default ClashMenuStyles;
