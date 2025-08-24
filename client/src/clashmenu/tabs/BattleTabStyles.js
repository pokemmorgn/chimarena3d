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
    return `
      ${this.getBattleTabStyles()}
    `;
  }

  static getBattleTabStyles() {
    const { white, gold, green, red, orange, darkBlue, royalBlue, neonBlue } = this.colors;

    return `
    .battle-tab {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: calc(100% - 80px);
      overflow-y: auto;
      display: none;
    }
    .battle-tab.active { display: block; }

    /* Topbar */
    .battle-topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 10px 15px;
      background: linear-gradient(to bottom, ${royalBlue}cc, ${darkBlue}cc);
      border-bottom: 2px solid ${neonBlue}55;
    }
    .topbar-left, .topbar-right { display: flex; gap: 10px; }
    .topbar-btn {
      background: ${darkBlue};
      border: 2px solid ${neonBlue}55;
      border-radius: 10px;
      padding: 8px 12px;
      cursor: pointer;
      color: ${white};
      font-size: 18px;
      transition: all 0.2s ease;
    }
    .topbar-btn:hover { transform: scale(1.1); background: ${royalBlue}; }

    .player-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: ${gold};
      font-weight: bold;
      font-size: 16px;
    }
    .player-trophies { font-size: 14px; color: ${white}; }

    /* Dropdown */
    .dropdown-menu {
      position: absolute;
      top: 45px;
      right: 10px;
      background: ${darkBlue}ee;
      border: 2px solid ${neonBlue}55;
      border-radius: 10px;
      padding: 10px;
      min-width: 180px;
      display: none;
      transform-origin: top right;
      transform: scaleY(0);
      opacity: 0;
      transition: all 0.2s ease;
    }
    .dropdown-menu.show {
      display: block;
      transform: scaleY(1);
      opacity: 1;
    }
    .dropdown-menu ul { list-style: none; margin: 0; padding: 0; }
    .dropdown-menu li {
      padding: 8px 12px;
      cursor: pointer;
      color: ${white};
      transition: background 0.2s;
    }
    .dropdown-menu li:hover { background: ${royalBlue}; }

    /* Arena */
    .arena-section {
      text-align: center;
      margin: 20px 0;
    }
    .arena-image {
      width: 100%;
      max-width: 500px;
      border-radius: 15px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.4);
    }

    /* Battle Action */
    .battle-action {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 15px;
      margin-top: 20px;
    }
    .battle-main-btn {
      background: linear-gradient(135deg, ${green}, #45a049);
      color: ${white};
      border: none;
      border-radius: 15px;
      padding: 18px 40px;
      font-size: 20px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 6px 15px ${green}44;
    }
    .battle-main-btn:hover { transform: scale(1.05); box-shadow: 0 10px 25px ${green}66; }
    .battle-main-btn.searching {
      background: linear-gradient(135deg, ${orange}, #e65100);
      box-shadow: 0 6px 15px ${orange}66;
    }
    .battle-mode-btn {
      background: ${royalBlue};
      border: 2px solid ${neonBlue};
      border-radius: 12px;
      padding: 12px 16px;
      cursor: pointer;
      font-size: 20px;
      color: ${white};
      transition: transform 0.2s;
    }
    .battle-mode-btn:hover { transform: rotate(10deg) scale(1.1); }
    `;
  }
}

export default BattleTabStyles;
