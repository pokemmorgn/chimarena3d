class BattleTabStyles {
  static get colors() {
    return {
      white: '#ffffff',
      gold: '#ffd700',
      darkBlue: '#0f1419',
      royalBlue: '#1a237e',
      neonBlue: '#00bcd4',
      gray: '#9e9e9e'
    };
  }

  static getCSS() {
    return this.getBattleTabStyles();
  }

  static getBattleTabStyles() {
    const { white, gold, darkBlue, royalBlue, gray } = this.colors;

    return `
    .battle-tab {
      position: absolute;
      top: 60px;
      left: 0;
      width: 100%;
      height: calc(100% - 100px);
      display: flex;
      flex-direction: column;
      align-items: center;
      overflow-y: auto;
    }

    /* --- Top bar with banner --- */
    .battle-topbar {
      position: relative;
      width: 100%;
      height: 100px;
      border-radius: 0;
      margin-bottom: 15px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 15px;
    }

    .topbar-banner {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      cursor: pointer;
      filter: brightness(0.7);
    }

    .topbar-content {
      position: relative;
      z-index: 2;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* Left side (avatar + name + trophies) */
    .topbar-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .player-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: 3px solid ${gold};
      background: ${gray};
      object-fit: cover;
      cursor: pointer;
    }

    .player-info {
      display: flex;
      flex-direction: column;
    }

    .player-name {
      font-size: 16px;
      font-weight: bold;
      color: ${white};
    }

    .player-trophies {
      font-size: 14px;
      color: ${gold};
    }

    /* Right side (icons) */
    .topbar-right {
      display: flex;
      gap: 10px;
    }

    .topbar-btn {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      border: none;
      background: rgba(255,255,255,0.15);
      color: ${white};
      font-size: 20px;
      cursor: pointer;
      transition: transform 0.2s ease, background 0.2s ease;
    }

    .topbar-btn:hover {
      transform: scale(1.1);
      background: rgba(255,255,255,0.25);
    }

    /* --- Arena --- */
    .arena-section {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .arena-image {
      max-width: 100%;
      max-height: 220px;
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
      margin: 15px 0;
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
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: linear-gradient(135deg, ${royalBlue}, ${darkBlue});
      color: ${white};
      border: 2px solid ${gold};
      font-size: 22px;
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .battle-mode-btn:hover {
      transform: scale(1.1);
    }
    `;
  }
}

export default BattleTabStyles;
