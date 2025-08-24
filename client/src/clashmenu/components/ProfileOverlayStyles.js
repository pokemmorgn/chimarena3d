class ProfileOverlayStyles {
  static getCSS() {
    return `
    .profile-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .profile-overlay.active {
      display: flex;
    }

    .profile-window {
      background: #1a237e;
      padding: 20px;
      border-radius: 15px;
      width: 420px;
      max-width: 90%;
      color: white;
      text-align: center;
      position: relative;
    }

    .close-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      background: transparent;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: white;
    }

    .profile-banner {
      width: 100%;
      height: 120px;
      object-fit: cover;
      border-radius: 10px;
      cursor: pointer;
      margin-bottom: 10px;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 15px;
    }

    .profile-avatar {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      border: 3px solid gold;
      object-fit: cover;
      cursor: pointer;
    }

    .profile-name {
      flex: 1;
      padding: 8px;
      font-size: 18px;
      border-radius: 6px;
      border: none;
    }

    .profile-stats {
      margin: 15px 0;
      font-size: 16px;
      text-align: left;
    }

    .profile-actions {
      margin-top: 15px;
    }

    .profile-actions button {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      background: gold;
      color: #1a237e;
      font-weight: bold;
      cursor: pointer;
    }

    .selection-menu {
      margin-top: 10px;
      display: none;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .selection-menu.active {
      display: flex;
    }

    .selection-item {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      cursor: pointer;
      object-fit: cover;
      border: 2px solid white;
    }
    `;
  }
}

export default ProfileOverlayStyles;
