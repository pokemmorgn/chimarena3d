class ProfileOverlayStyles {
  static get colors() {
    return {
      white: "#ffffff",
      dark: "#0f1419",
      royal: "#1a237e",
      gold: "#ffd700",
      gray: "#9e9e9e",
      overlayBg: "rgba(0,0,0,0.7)"
    };
  }

  static getCSS() {
    const { white, dark, royal, gold, gray, overlayBg } = this.colors;

    return `
    /* --- Overlay --- */
    .profile-overlay {
      position: fixed;
      inset: 0;
      background: ${overlayBg};
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 999;
    }
    .profile-overlay.active { display: flex; }

    /* --- Content Box --- */
    .profile-content {
      background: linear-gradient(135deg, ${royal}, ${dark});
      border: 2px solid rgba(255,255,255,0.2);
      border-radius: 16px;
      width: 90%;
      max-width: 480px;
      padding: 20px;
      color: ${white};
      box-shadow: 0 10px 40px rgba(0,0,0,0.6);
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }

    /* --- Banner --- */
    .profile-banner {
      width: 100%;
      height: 120px;
      object-fit: cover;
      border-radius: 12px;
      cursor: pointer;
      margin-bottom: -40px;
    }

    /* --- Avatar --- */
    .profile-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 3px solid ${gold};
      object-fit: cover;
      cursor: pointer;
      background: ${gray};
      margin-bottom: 10px;
      z-index: 2;
    }

    /* --- Player name --- */
    .profile-name {
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      border: none;
      background: transparent;
      color: ${white};
      outline: none;
      margin: 10px 0;
    }

    /* --- Stats --- */
    .profile-stats {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin: 15px 0;
      font-size: 14px;
      text-align: left;
    }
    .profile-stats div {
      padding: 6px 10px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    /* --- Buttons --- */
    #btn-save-profile, #btn-close-profile {
      padding: 10px 20px;
      margin: 6px;
      font-size: 14px;
      font-weight: bold;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.2s ease;
    }
    #btn-save-profile {
      background: linear-gradient(135deg, ${gold}, #ffb300);
      color: ${dark};
    }
    #btn-close-profile {
      background: rgba(255,255,255,0.2);
      color: ${white};
    }
    #btn-save-profile:hover, #btn-close-profile:hover {
      transform: scale(1.05);
    }

    /* --- Selection menus --- */
    .selection-menu {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, ${royal}, ${dark});
      border: 2px solid rgba(255,255,255,0.2);
      border-radius: 12px;
      padding: 12px;
      display: none;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
      max-width: 300px;
      max-height: 250px;
      overflow-y: auto;
      z-index: 1000;
    }
    .selection-menu.active { display: flex; }

    .selection-item {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      object-fit: cover;
      cursor: pointer;
      border: 2px solid transparent;
      transition: transform 0.2s ease, border 0.2s ease;
    }
    .selection-item:hover {
      transform: scale(1.1);
      border: 2px solid ${gold};
    }
    `;
  }
}

export default ProfileOverlayStyles;
