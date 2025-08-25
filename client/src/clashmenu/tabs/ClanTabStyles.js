/**
 * ClanTabStyles.js - Styles pour l'onglet Clan
 * Design Clash Royale avec couleurs cohérentes
 */
class ClanTabStyles {
  static get colors() {
    return {
      // Base
      white: '#ffffff',
      black: '#000000',

      // Clash Royale palette
      gold: '#ffd700',
      darkBlue: '#0f1419',
      royalBlue: '#1a237e',
      neonBlue: '#00bcd4',
      purple: '#7b1fa2',

      // Status
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

      // Roles
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
    const { white, gold, darkBlue, neonBlue, danger, gray300, gray500, leader, elder, member } = this.colors;
    const { xs, sm, md, lg, xl } = this.spacing;

    return `
    /* (=== styles précédents inchangés, raccourcis ici pour lisibilité ===) */

    /* ===== DONATIONS TAB ===== */
    .clan-donations {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: ${md};
      gap: ${md};
      overflow-y: auto;
    }

    .donation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: ${sm} ${md};
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
      color: ${white};
      font-weight: bold;
    }

    .donation-list {
      display: flex;
      flex-direction: column;
      gap: ${sm};
    }

    .donation-item {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      padding: ${sm} ${md};
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-left: 3px solid ${neonBlue};
    }

    .donation-info {
      flex: 1;
    }

    .donation-requester {
      font-weight: bold;
      color: ${gold};
      font-size: 14px;
    }

    .donation-card {
      font-size: 13px;
      color: ${white};
    }

    .donation-actions {
      display: flex;
      gap: ${sm};
    }

    .donation-btn {
      padding: ${xs} ${sm};
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .donation-btn.give {
      background: ${neonBlue};
      color: ${darkBlue};
    }

    .donation-btn.give:hover {
      background: ${gold};
    }

    .donation-btn.request {
      background: ${gold};
      color: ${darkBlue};
    }

    .donation-btn.request:hover {
      background: orange;
    }
    `;
  }
}

export default ClanTabStyles;
