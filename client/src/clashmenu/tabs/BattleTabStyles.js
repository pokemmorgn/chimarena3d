/**
 * Battle Tab Styles - CSS en JavaScript
 * Styles spécifiques à l’onglet Bataille
 */
class BattleTabStyles {
  static get colors() {
    return {
      white: '#ffffff',
      gold: '#ffd700',
      green: '#4caf50',
      red: '#f44336',
      orange: '#ff9800',
      darkBlue: '#0f1419',
      royalBlue: '#1a237e',
      neonBlue: '#00bcd4',
      electric: '#00e5ff'
    };
  }

  static getCSS() {
    return this.getBattleTabStyles();
  }

  static getBattleTabStyles() {
    const { white, gold, green, red, orange, darkBlue, royalBlue, neonBlue, electric } = this.colors;

    return `
    .battle-tab {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: calc(100% - 80px);
      padding: 20px;
      overflow-y: auto;
      display: none;

      /* Masquer la scrollbar */
      scrollbar-width: none;     /* Firefox */
      -ms-overflow-style: none;  /* IE et Edge */
    }
    .battle-tab::-webkit-scrollbar { 
      display: none;             /* Chrome, Safari, Edge */
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
    `;
  }
}

export default BattleTabStyles;
