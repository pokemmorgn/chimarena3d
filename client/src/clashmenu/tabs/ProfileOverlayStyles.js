class ProfileOverlayStyles {
  static getCSS() {
    return `
    .profile-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.8);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 500;
    }
    .profile-overlay.active {
      display: flex;
    }
    .profile-content {
      width: 90%;
      max-width: 400px;
      background: #1a237e;
      padding: 20px;
      border-radius: 15px;
      color: white;
      text-align: center;
      position: relative;
    }
    .profile-banner {
      width: 100%;
      height: 100px;
      object-fit: cover;
      border-radius: 10px;
      cursor: pointer;
    }
    .profile-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      margin-top: -40px;
      border: 3px solid gold;
      cursor: pointer;
    }
    .profile-name {
      margin: 10px 0;
      padding: 5px;
      width: 100%;
      font-size: 18px;
      text-align: center;
    }
    .profile-stats {
      margin: 15px 0;
      font-size: 16px;
    }
    #btn-save-profile, #btn-close-profile {
      padding: 8px 15px;
      margin: 5px;
      border: none;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
    }
    #btn-save-profile {
      background: #4caf50;
      color: white;
    }
    #btn-close-profile {
      background: #f44336;
      color: white;
    }

    /* Selection menu */
    .selection-menu {
      position: absolute;
      bottom: -120px;
      left: 50%;
      transform: translateX(-50%);
      display: none;
      flex-wrap: wrap;
      gap: 10px;
      background: rgba(0,0,0,0.9);
      padding: 10px;
      border-radius: 10px;
    }
    .selection-menu.active {
      display: flex;
    }
    .selection-item {
      width: 60px;
      height: 60px;
      border-radius: 10px;
      cursor: pointer;
      border: 2px solid transparent;
      object-fit: cover;
    }
    .selection-item:hover {
      border: 2px solid gold;
    }
    `;
  }
}

export default ProfileOverlayStyles;
