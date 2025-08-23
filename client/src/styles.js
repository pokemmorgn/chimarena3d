/**
 * Clash Menu Styles - CSS compilé en JavaScript
 * Styles inspirés de Clash Royale avec thème sombre et couleurs vives
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
   * Styles du container principal
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
    `;
  }

  /**
   * Styles de la navigation par onglets
   */
  static getTabNavigationStyles() {
    const { darkBlue, gold, orange, white, lightGray } = this.colors;
    
    return `
      .tab-navigation {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 80px;
        background: linear-gradient(to top, ${darkBlue}dd, ${darkBlue}aa);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: space-around;
        padding: 0 20px;
        box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.3);
      }
      
      .tab-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 10px 15px;
        background: none;
        border: none;
        color: ${lightGray};
        cursor: pointer;
        transition: all 0.3s ease;
        border-radius: 10px;
        min-width: 60px;
      }
      
      .tab-button:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
      }
      
      .tab-button.active {
        color: ${gold};
        background: rgba(255, 215, 0, 0.1);
        transform: translateY(-3px);
      }
      
      .tab-button.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .tab-button.disabled:hover {
        background: none;
        transform: none;
      }
      
      .tab-icon {
        font-size: 24px;
        margin-bottom: 4px;
      }
      
      .tab-label {
        font-size: 12px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .tab-coming-soon {
        font-size: 10px;
        color: ${orange};
        margin-top: 2px;
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
      
      /* Responsive design */
      @media (max-width: 768px) {
        .battle-header {
          padding: 20px 15px;
        }
        
        .player-stats {
          gap: 20px;
        }
        
        .stat-value {
          font-size: 20px;
        }
        
        .battle-button {
          padding: 15px 25px;
          font-size: 18px;
        }
        
        .battle-modes {
          grid-template-columns: 1fr;
        }
        
        .coming-soon-content {
          padding: 30px;
          margin: 20px;
        }
      }
      
      @media (max-width: 480px) {
        .tab-navigation {
          height: 70px;
          padding: 0 10px;
        }
        
        .tab-button {
          padding: 8px 12px;
          min-width: 50px;
        }
        
        .tab-icon {
          font-size: 20px;
        }
        
        .tab-label {
          font-size: 10px;
        }
        
        .battle-tab {
          padding: 15px;
          height: calc(100% - 70px);
        }
      }
    `;
  }

  /**
   * Styles de l'onglet Bataille
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
        padding: 20px;
        overflow-y: auto;
        display: none;
      }
      
      .battle-tab.active {
        display: block;
      }
      
      /* Header avec stats joueur */
      .battle-header {
        text-align: center;
        margin-bottom: 40px;
        padding: 30px 20px;
        background: linear-gradient(135deg, ${darkBlue}cc, ${royalBlue}cc);
        border-radius: 20px;
        backdrop-filter: blur(15px);
        border: 2px solid ${neonBlue}44;
      }
      
      .player-name {
        font-size: 32px;
        font-weight: bold;
        color: ${gold};
        margin-bottom: 10px;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      }
      
      .player-stats {
        display: flex;
        justify-content: center;
        gap: 40px;
        margin-top: 20px;
      }
      
      .stat-item {
        text-align: center;
      }
      
      .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: ${white};
        display: block;
      }
      
      .stat-label {
        font-size: 14px;
        color: ${neonBlue};
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-top: 5px;
      }
      
      /* Status de connexion */
      .connection-status {
        text-align: center;
        padding: 15px;
        margin-bottom: 30px;
        border-radius: 15px;
        font-weight: bold;
        transition: all 0.3s ease;
      }
      
      .connection-status.connected {
        background: ${green}22;
        color: ${green};
        border: 2px solid ${green}44;
      }
      
      .connection-status.connecting {
        background: ${orange}22;
        color: ${orange};
        border: 2px solid ${orange}44;
      }
      
      .connection-status.error {
        background: ${red}22;
        color: ${red};
        border: 2px solid ${red}44;
      }
      
      .connection-status.searching {
        background: ${electric}22;
        color: ${electric};
        border: 2px solid ${electric}44;
        animation: pulse 1.5s infinite;
      }
      
      /* Boutons de bataille */
      .battle-buttons {
        display: flex;
        flex-direction: column;
        gap: 20px;
        max-width: 400px;
        margin: 0 auto;
      }
      
      .battle-button {
        padding: 20px 30px;
        font-size: 20px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 2px;
        border: none;
        border-radius: 15px;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }
      
      .battle-button:before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.5s ease;
      }
      
      .battle-button:hover:before {
        left: 100%;
      }
      
      .battle-button:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      }
      
      .battle-button:active {
        transform: translateY(-1px);
      }
      
      .battle-button.primary {
        background: linear-gradient(135deg, ${green}, #45a049);
        color: ${white};
        box-shadow: 0 8px 20px ${green}44;
      }
      
      .battle-button.secondary {
        background: linear-gradient(135deg, ${neonBlue}, #00acc1);
        color: ${white};
        box-shadow: 0 8px 20px ${neonBlue}44;
      }
      
      .battle-button.tertiary {
        background: linear-gradient(135deg, ${orange}, #f57c00);
        color: ${white};
        box-shadow: 0 8px 20px ${orange}44;
      }
      
      .battle-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }
      
      .battle-button:disabled:hover {
        transform: none;
        box-shadow: none;
      }
      
      /* Mode de bataille */
      .battle-modes {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 15px;
        margin-top: 30px;
      }
      
      .battle-mode-card {
        background: linear-gradient(135deg, ${darkBlue}aa, ${royalBlue}aa);
        border: 2px solid ${neonBlue}33;
        border-radius: 15px;
        padding: 20px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
      }
      
      .battle-mode-card:hover {
        border-color: ${neonBlue};
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(0, 188, 212, 0.2);
      }
      
      .battle-mode-icon {
        font-size: 36px;
        margin-bottom: 10px;
        display: block;
      }
      
      .battle-mode-title {
        color: ${white};
        font-weight: bold;
        font-size: 16px;
        margin-bottom: 8px;
      }
      
      .battle-mode-desc {
        color: ${neonBlue};
        font-size: 12px;
        line-height: 1.4;
      }
