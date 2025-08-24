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
      height: calc(100% - 120px);
      display: flex;
      flex-direction: column;
      align-items: center;
    }

.player-name-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.arena-background {
  flex: 1;
  width: 100%;
  background: url('/arena/Arena1.png') center/cover no-repeat;
}



.edit-profile-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-profile-btn img {
  width: 18px;
  height: 18px;
  filter: brightness(0) invert(1); /* icône en blanc */
  transition: transform 0.2s ease, filter 0.2s ease;
}

.edit-profile-btn:hover img {
  transform: scale(1.1);
  filter: brightness(1) invert(0); /* devient sombre au hover */
}

    /* --- Top bar with banner --- */
    .battle-topbar {
      position: relative;
      width: 100%;
      height: 100px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 15px;
      margin-bottom: 10px;
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

    .topbar-left { display: flex; align-items: center; gap: 10px; }
    .player-avatar {
      width: 60px; height: 60px; border-radius: 50%;
      border: 3px solid ${gold}; background: ${gray}; object-fit: cover; cursor: pointer;
    }
    .player-info { display: flex; flex-direction: column; }
    .player-name { font-size: 16px; font-weight: bold; color: ${white}; }
    .player-trophies { font-size: 14px; color: ${gold}; }

    .topbar-right { display: flex; gap: 10px; }
    .topbar-btn {
      width: 42px; height: 42px; border-radius: 50%; border: none;
      background: rgba(255,255,255,0.15); color: ${white}; font-size: 20px; cursor: pointer;
      transition: transform 0.2s ease, background 0.2s ease;
    }
    .topbar-btn:hover { transform: scale(1.1); background: rgba(255,255,255,0.25); }

    /* Dropdown menu topbar */
    .dropdown-menu {
      position: absolute; top: 110px; right: 15px;
      background: linear-gradient(135deg, ${royalBlue}, ${darkBlue});
      border: 2px solid rgba(255,255,255,0.2); border-radius: 10px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.5); width: 200px;
      display: none; flex-direction: column; z-index: 100;
    }
    .dropdown-menu.active { display: flex; }
    .dropdown-item {
      padding: 12px 15px; color: ${white}; cursor: pointer;
      border-bottom: 1px solid rgba(255,255,255,0.1); transition: background 0.2s ease;
    }
    .dropdown-item:last-child { border-bottom: none; }
    .dropdown-item:hover { background: rgba(255,255,255,0.1); }

    /* --- Arena --- */
    .arena-section {
      flex: 1; display: flex; align-items: center; justify-content: center;
    }
    .arena-image {
      max-width: 100%; max-height: 240px; object-fit: contain;
      border-radius: 15px; box-shadow: 0 8px 20px rgba(0,0,0,0.5);
    }

    /* --- Bottom zone (battle button + mode + chests) --- */
    .battle-bottom {
      width: 100%; display: flex; flex-direction: column; align-items: center;
      padding-bottom: 8px; gap: 6px; margin-top: -15px;
    }

    .battle-action { display: flex; align-items: center; justify-content: center; gap: 12px; }

    .battle-main-btn {
      padding: 16px 50px; font-size: 22px; font-weight: bold; text-transform: uppercase;
      background: linear-gradient(135deg, ${gold}, #ffb300); color: ${darkBlue};
      border: none; border-radius: 20px; cursor: pointer;
      box-shadow: 0 8px 20px rgba(0,0,0,0.3); transition: transform 0.2s ease;
    }
    .battle-main-btn:hover { transform: translateY(-3px); }
    .battle-main-btn:active { transform: translateY(-1px); }

    .battle-mode-btn {
      width: 52px; height: 52px; border-radius: 50%;
      background: linear-gradient(135deg, ${royalBlue}, ${darkBlue});
      color: ${white}; border: 2px solid ${gold}; font-size: 22px; cursor: pointer;
      transition: transform 0.2s ease;
    }
    .battle-mode-btn:hover { transform: scale(1.1); }

    /* Mode dropdown (battle modes) */
    .mode-dropdown {
      position: absolute;
      bottom: 130px;
      right: calc(50% - 100px);
      width: 200px;
      background: linear-gradient(135deg, ${royalBlue}, ${darkBlue});
      border: 2px solid rgba(255,255,255,0.2);
      border-radius: 10px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.5);
      display: none;
      flex-direction: column;
      z-index: 200;
    }
    .mode-dropdown.active { display: flex; }
    .mode-dropdown-item {
      padding: 12px 15px;
      color: ${white};
      cursor: pointer;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      transition: background 0.2s ease;
    }
    .mode-dropdown-item:last-child { border-bottom: none; }
    .mode-dropdown-item:hover { background: rgba(255,255,255,0.1); }

    .battle-chests {
      display: flex; justify-content: space-around; align-items: center;
      width: 100%; max-width: 400px; margin-top: 2px;
    }
    .chest-slot {
      width: 70px; height: 70px;
      background: linear-gradient(135deg, ${royalBlue}, ${darkBlue});
      border: 2px solid rgba(255,255,255,0.2); border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      color: ${white}; font-size: 14px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    }
    `;
  }
}

export default BattleTabStyles;
