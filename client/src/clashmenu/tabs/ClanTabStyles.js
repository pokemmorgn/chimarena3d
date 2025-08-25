/**
 * ClanTabStyles.js - Styles pour l'onglet Clan
 * Design Clash Royale avec couleurs cohérentes
 */
class ClanTabStyles {
  static get colors() {
    return {
      // Base colors
      white: '#ffffff',
      black: '#000000',

      // Clash Royale palette
      gold: '#ffd700',
      darkBlue: '#0f1419',
      royalBlue: '#1a237e',
      neonBlue: '#00bcd4',
      purple: '#7b1fa2',

      // Status colors
      success: '#4caf50',
      warning: '#ff9800',
      danger: '#f44336',
      info: '#2196f3',

      // Gray scales
      gray100: '#f5f5f5',
      gray300: '#e0e0e0',
      gray500: '#9e9e9e',
      gray700: '#616161',
      gray900: '#212121',

      // Role colors
      leader: '#ffd700',
      elder: '#ff9800',
      member: '#9e9e9e'
    };
  }

  static get spacing() {
    return {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      xxl: '48px'
    };
  }

  static getCSS() {
    const { 
      white, gold, darkBlue, royalBlue, neonBlue, danger,
      gray300, gray500, leader, elder, member
    } = this.colors;
    const { xs, sm, md, lg, xl } = this.spacing;

    return `
    /* ===== CLAN TAB BASE ===== */
    .clan-tab {
      position: absolute;
      top: 60px;
      left: 0;
      width: 100%;
      height: calc(100% - 120px);
      display: none;
      flex-direction: column;
      background: linear-gradient(135deg, ${darkBlue}, ${royalBlue});
      overflow: hidden;
    }

    .clan-tab.active {
      display: flex;
    }

    /* ===== LOADING STATE ===== */
    .clan-loading {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: ${xl};
      text-align: center;
    }

    .loading-spinner {
      width: 60px;
      height: 60px;
      border: 4px solid rgba(255, 255, 255, 0.2);
      border-top: 4px solid ${gold};
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: ${lg};
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* ===== NO CLAN STATE ===== */
    .clan-no-clan {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: ${md};
      overflow-y: auto;
    }

    .no-clan-header {
      text-align: center;
      padding: ${lg} 0;
      margin-bottom: ${lg};
    }

    .clan-icon {
      font-size: 60px;
      margin-bottom: ${md};
    }

    .no-clan-header h2 {
      color: ${white};
      font-size: 28px;
      font-weight: bold;
      margin-bottom: ${sm};
    }

    .no-clan-header p {
      color: ${gray300};
      font-size: 16px;
      line-height: 1.5;
      max-width: 300px;
      margin: 0 auto;
    }

    /* Action Buttons */
    .clan-actions {
      display: flex;
      flex-direction: column;
      gap: ${md};
      margin-bottom: ${lg};
    }

    .clan-action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: ${md};
      padding: ${md} ${lg};
      border: none;
      border-radius: 12px;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .clan-action-btn.primary {
      background: linear-gradient(135deg, ${gold}, #ffb300);
      color: ${darkBlue};
      box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
    }

    .clan-action-btn.primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 215, 0, 0.6);
    }

    .clan-action-btn.secondary {
      background: rgba(255, 255, 255, 0.15);
      color: ${white};
      border: 2px solid rgba(255, 255, 255, 0.3);
    }

    .clan-action-btn.secondary:hover {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.5);
      transform: translateY(-2px);
    }

    .btn-icon { font-size: 20px; }
    .btn-text { font-size: 16px; }

    /* Quick Stats */
    .clan-quick-stats {
      display: flex;
      justify-content: space-around;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 10px;
      padding: ${lg};
      margin-top: auto;
    }

    .quick-stat { text-align: center; }
    .stat-number {
      font-size: 24px;
      font-weight: bold;
      color: ${gold};
      margin-bottom: ${xs};
    }
    .stat-label {
      font-size: 12px;
      color: ${gray300};
      text-transform: uppercase;
    }

    /* ===== CHAT TAB ===== */
    .chat-messages { flex: 1; padding: ${md}; overflow-y: auto; display: flex; flex-direction: column; gap: ${sm}; }
    .chat-message {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      padding: ${sm} ${md};
      border-left: 3px solid ${neonBlue};
    }
    .message-author.leader { color: ${leader}; }
    .message-author.elder { color: ${elder}; }
    .message-author.member { color: ${member}; }

    /* ===== DONATIONS TAB ===== */
    .clan-donations { flex: 1; display: flex; flex-direction: column; padding: ${md}; gap: ${md}; overflow-y: auto; }
    .donation-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: ${sm} ${md}; background: rgba(255,255,255,0.1);
      border-radius: 8px; color: ${white}; font-weight: bold;
    }
    .donation-item {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px; padding: ${sm} ${md};
      display: flex; align-items: center; justify-content: space-between;
      border-left: 3px solid ${neonBlue};
    }
    .donation-btn { padding: ${xs} ${sm}; border: none; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; transition: all 0.2s ease; }
    .donation-btn.give { background: ${neonBlue}; color: ${darkBlue}; }
    .donation-btn.give:hover { background: ${gold}; }
    .donation-btn.request { background: ${gold}; color: ${darkBlue}; }
    .donation-btn.request:hover { background: orange; }

    /* ===== WARS TAB ===== */
    .clan-wars { flex: 1; display: flex; align-items: center; justify-content: center; padding: ${xl}; color: ${gray300}; }
    `;
  }
}

export default ClanTabStyles;
