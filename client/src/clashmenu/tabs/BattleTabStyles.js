/**
 * Battle Tab Styles - CSS en JavaScript
 * Styles spécifiques à l’onglet Bataille façon Clash Royale
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
      neonBlue: '#00bcd4'
    };
  }

  static getCSS() {
    return this.getBattleTabStyles();
  }

  static getBattleTabStyles() {
    const { white, gold, green, darkBlue, royalBlue } = this.colors;

    return `
    .battle-tab {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: calc(100% - 80px);
      padding: 10px 15px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
    }

    /* --- Top bar --- */
    .battle-topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 8px 12px;
      margin-bottom: 10px;
      background: linear-gradient(135deg, ${royalBlue}, ${darkBlue});
      border-radius: 12px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.4);
    }

    .topbar-left, .topbar-right {
      display: flex;
      gap: 8px;
    }

    .topbar-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: rgba(255,255,255,0.1);
      color: ${white};
      font-size: 18px;
      cursor: pointer;
      transition: transform 0.2s ease, background 0.2s ease;
    }

    .topbar-btn:hover {
      transform: scale(1.1);
      background: rgba(255,255,255,0.2);
    }

    .topbar-center {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .player-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: ${white};
      font-weight: bold;
    }

    .player-name {
      font-size: 16px;
      margin-bottom: 2px;
    }

    .player-trophies {
      font-size: 14px;
      color: ${gold};
    }

    /* --- Arena --- */
    .arena-section {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 10px 0;
    }

    .arena-image {
      max-width: 100%;
      max-height: 240px;
      object-fit: contain;
      border-radius: 15px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.5);
    }

    /* --- Battle action --- */
    .battle-action {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
      margin: 20px 0;
    }

    .battle-main-btn {
      padding: 20px 50px;
      font-size: 22px;
      font-weight: bold;
      text-transform: uppercase;
      background: linear-gradient(135deg, ${gold}, #ffb300);
      color: ${darkBlue};
      border: none;
      border-radius: 20px;
      cursor: pointer;
      box-shadow: 0 8px 20px rgba(0,0,0,0.3);
      transition: transform 0.2s ease;
    }

    .battle-main-btn:hover {
      transform: translateY(-3px);
    }

    .battle-main-btn:active {
      transform: translateY(-1px);
    }

    .battle-mode-btn {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, ${royalBlue}, ${darkBlue});
      color: ${white};
      border: 2px solid ${gold};
      font-size: 20px;
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .battle-mode-btn:hover {
      transform: scale(1.1);
    }

    /* --- Chests --- */
    .battle-chests {
      display: flex;
      justify-content: space-around;
      align-items: center;
      width: 100%;
      max-width: 400px;
      margin-bottom: 10px;
    }

    .chest-slot {
      width: 70px;
      height: 70px;
      background: linear-gradient(135deg, ${royalBlue}, ${darkBlue});
      border: 2px solid rgba(255,255,255,0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${white};
      font-size: 14px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    }
    `;
  }
}

export default BattleTabStyles;
