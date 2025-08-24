/**
 * Header Styles - Clash Royale style
 * Niveau + XP à gauche, Gold & Gems à droite
 */
class HeaderStyles {
  static getCSS() {
    return `
      .clash-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 15px;
        background: linear-gradient(135deg, #0f1419, #1a237e);
        border-bottom: 3px solid #ffd700;
        color: #ffffff;
        font-family: 'Arial', sans-serif;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .player-level-circle {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #ffd700;
        color: #0f1419;
        font-weight: bold;
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 10px rgba(0,0,0,0.4);
      }

      .xp-bar {
        width: 120px;
        height: 12px;
        background: rgba(255,255,255,0.2);
        border-radius: 6px;
        overflow: hidden;
        position: relative;
      }

      .xp-fill {
        height: 100%;
        background: linear-gradient(90deg, #00e676, #1de9b6);
        transition: width 0.4s ease;
      }

      .header-right {
        display: flex;
        gap: 15px;
      }

      .header-resource {
        display: flex;
        align-items: center;
        font-size: 16px;
        font-weight: bold;
      }

      .resource-icon {
        margin-right: 5px;
      }
    `;
  }
}

export default HeaderStyles;
