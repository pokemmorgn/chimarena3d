class BattleTabStyles {
  static get colors() {
    return {
      white: '#ffffff',
      gold: '#ffd700',
      green: '#4caf50',
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
    const { white, gold, darkBlue, royalBlue, neonBlue, gray } = this.colors;

    return `
    .battle-tab {
      position: absolute;
      top: 60px; /* below global header */
      left: 0;
      width: 100%;
      height: calc(100% - 100px);
      padding: 10px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      overflow-y: auto;
    }

    /* --- Top bar --- */
    .battle-topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 8px 16px;
      margin-bottom: 10px;
      background: linear-gradient(135deg, ${royalBlue}, ${darkBlue});
      border-radius: 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }

    .topbar-left, .topbar-right {
      display: flex;
      gap: 10px;
    }

    .topbar-btn {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      border: none;
      background: rgba(255,255,255,0.1);
      color: ${white};
      font-size: 20px;
      cursor: pointer;
      transition: transform 0.2s ease, background 0.2s ease;
    }

    .topbar-btn:hover {
      transform: scale(1.1);
      background: rgba(255,255,255,0.2);
    }

    /* --- Player Banner --- */
    .player-banner {
      position: relative;
      width: 95%;
      max-width: 500px;
      height: 120px;
      border-radius: 15px;
      margin: 10px 0 20px 0;
      overflow: hidden;
      background: linear-gradient(135deg, ${royalBlue}, ${darkBlue});
      box-shadow: 0 6px 20px rgba(0,0,0,0.5);
    }

    .banner-bg {
      position: absolute;
      inset: 0;
      object-fit: cover;
      width: 100%;
      height: 100%;
      filter: brightness(0.7);
    }

    .banner-content {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      height: 100%;
      padding: 0 15px;
      color: ${white};
    }

    .player-avatar {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      border: 3px solid ${gold};
      background: ${gray};
      margin-right: 15px;
      object-fit: cover;
      cursor: pointer;
    }

    .banner-info {
      flex: 1;
    }

    .banner-name {
      font-size: 18px;
      font-weight: bold;
      color: ${white};
      margin-bottom: 5px;
    }

    .banner-trophies {
      font-size: 14px;
      color: ${gold};
    }

    .banner-edit-btn {
      background: rgba(255,255,255,0.2);
      border: none;
      border-radius: 8px;
      color: ${white};
      padding: 6px 10px;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .banner-edit-btn:hover {
      background: rgba(255,255,255,0.35);
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
