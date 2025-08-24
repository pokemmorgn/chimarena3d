/**
 * Battle Tab Styles - Clash Royale style
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
      electric: '#00e5ff',
      gray: '#9e9e9e'
    };
  }

  static getCSS() {
    return `
      ${this.getBattleTabStyles()}
      ${this.getAnimations()}
    `;
  }

  static getBattleTabStyles() {
    const { white, gold, green, red, orange, darkBlue, royalBlue, neonBlue, electric, gray } = this.colors;

    return `
    .battle-tab {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: calc(100% - 80px);
      display: none;
      overflow-y: auto;
      padding: 10px;
    }

    .battle-tab.active {
      display: block;
    }

    /* --- Topbar --- */
    .battle-topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, ${darkBlue}, ${royalBlue});
      border-bottom: 2px solid ${neonBlue}55;
      padding: 10px 15px;
      border-radius: 10px;
      margin-bottom: 10px;
    }

    .topbar-left,
    .topbar-right {
      display: flex;
      gap: 10px;
    }

    .topbar-btn {
      background: ${darkBlue};
      color: ${white};
      border: 2px solid ${neonBlue}55;
      border-radius: 8px;
      font-size: 18px;
      padding: 6px 10px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .topbar-btn:hover {
      background: ${royalBlue};
      transform: translateY(-2px);
    }

    .player-info {
      text-align: center;
    }

    .player-name {
      display: block;
      font-size: 16px;
      font-weight: bold;
      color: ${gold};
    }

    .player-trophies {
      display: block;
      font-size: 14px;
      color: ${white};
    }

    /* --- Connection status --- */
    .connection-status {
      text-align: center;
      margin: 10px auto 20px auto;
      padding: 10px 15px;
      border-radius: 10px;
      font-weight: bold;
      width: fit-content;
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

    /* --- Arena --- */
    .arena-section {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 20px 0;
    }

    .arena-image {
      max-width: 90%;
      border-radius: 15px;
      border: 3px solid ${neonBlue}55;
      box-shadow: 0 8px 20px rgba(0,0,0,0.4);
    }

    /* --- Battle action --- */
    .battle-action {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 15px;
      margin: 20px 0;
    }

    .battle-main-btn {
      background: linear-gradient(135deg, ${green}, #45a049);
      color: ${white};
      font-size: 22px;
      font-weight: bold;
      text-transform: uppercase;
      padding: 15px 40px;
      border: none;
      border-radius: 15px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 8px 20px ${green}55;
    }

    .battle-main-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 25px rgba(0,0,0,0.3);
    }

    .battle-mode-btn {
      background: ${royalBlue};
      color: ${white};
      font-size: 18px;
      border: 2px solid ${neonBlue}55;
      border-radius: 50%;
      width: 48px;
      height: 48px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .battle-mode-btn:hover {
      background: ${darkBlue};
      transform: rotate(20deg);
    }

    /* --- Chest slots --- */
    .battle-chests {
      display: flex;
      justify-content: center;
      gap: 15px;
      margin-top: 30px;
    }

    .chest-slot {
      width: 70px;
      height: 70px;
      border: 2px dashed ${gray};
      border-radius: 12px;
      background: rgba(255,255,255,0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: ${gray};
    }
    `;
  }

  static getAnimations() {
    return `
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.05); }
      }
    `;
  }
}

export default BattleTabStyles;
