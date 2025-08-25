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
    const { white, gold, darkBlue, neonBlue, danger, gray500, leader, elder, member } = this.colors;
    const { xs, sm, md } = this.spacing;

    return `
    /* ===== BASE CLAN TAB ===== */
    .clan-tab {
      display: none;
      flex-direction: column;
      height: 100%;
      color: ${white};
      background: transparent;
    }

    .clan-loading {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      color: ${white};
      font-size: 18px;
    }

    /* ===== NO CLAN ===== */
    .clan-no-clan {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: ${md};
      gap: ${md};
      text-align: center;
    }
    .no-clan-header h2 {
      font-size: 20px;
      font-weight: bold;
      color: ${white};
      margin-bottom: ${sm};
    }
    .clan-actions {
      display: flex;
      gap: ${sm};
    }
    .clan-action-btn {
      padding: ${sm} ${md};
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .clan-action-btn.primary {
      background: ${gold};
      color: ${darkBlue};
    }
    .clan-action-btn.secondary {
      background: ${neonBlue};
      color: ${darkBlue};
    }

    /* ===== HEADER ===== */
    .clan-header {
      display: flex;
      align-items: center;
      gap: ${sm};
      padding: ${sm} ${md};
      border-bottom: 2px solid ${gold};
      background: rgba(255,255,255,0.05);
    }
    .clan-info {
      display: flex;
      flex-direction: column;
    }
    .clan-name {
      font-size: 18px;
      font-weight: bold;
      color: ${white};
    }
    .clan-tag {
      font-size: 14px;
      color: ${gray500};
    }
    .clan-members {
      font-size: 12px;
      color: ${gray500};
    }

    /* ===== TABS ===== */
    .clan-tabs {
      display: flex;
      justify-content: space-around;
      padding: ${xs};
      background: rgba(255,255,255,0.05);
      border-bottom: 2px solid ${gold};
    }
    .clan-tab-btn {
      flex: 1;
      padding: ${xs} ${sm};
      margin: 0 2px;
      border: none;
      border-radius: 6px;
      background: rgba(255,255,255,0.1);
      color: ${white};
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .clan-tab-btn.active {
      background: ${gold};
      color: ${darkBlue};
    }

    /* ===== CONTENT ===== */
    .clan-content {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }
    .clan-tab-content {
      display: none;
      flex: 1;
      padding: ${md};
    }
    .clan-tab-content.active {
      display: flex;
      flex-direction: column;
    }

    /* ===== CHAT ===== */
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: ${xs};
      padding: ${sm};
    }
    .chat-message {
      background: rgba(255,255,255,0.05);
      border-radius: 6px;
      padding: ${xs} ${sm};
    }
    .message-header {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: ${gray500};
    }
    .message-author.leader { color: ${leader}; }
    .message-author.elder { color: ${elder}; }
    .message-author.member { color: ${member}; }
    .message-content {
      font-size: 14px;
      color: ${white};
    }
    .chat-input-container {
      display: flex;
      gap: ${sm};
      padding: ${sm};
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    .chat-input {
      flex: 1;
      padding: ${xs} ${sm};
      border: none;
      border-radius: 6px;
      outline: none;
    }
    .chat-send-btn {
      background: ${neonBlue};
      color: ${darkBlue};
      font-weight: bold;
      border: none;
      border-radius: 6px;
      padding: 0 ${md};
      cursor: pointer;
    }
    .chat-send-btn:hover {
      background: ${gold};
    }

    /* ===== MEMBERS ===== */
    .clan-members {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: ${sm};
    }
    .members-header {
      font-weight: bold;
      padding: ${sm};
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .member-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255,255,255,0.05);
      padding: ${xs} ${sm};
      border-radius: 6px;
    }
    .member-info {
      display: flex;
      flex-direction: column;
    }
    .member-name {
      font-size: 14px;
      font-weight: bold;
      color: ${white};
    }
    .member-role {
      font-size: 12px;
      font-weight: bold;
      text-transform: capitalize;
    }
    .member-role.leader { color: ${leader}; }
    .member-role.elder { color: ${elder}; }
    .member-role.member { color: ${member}; }
    .member-actions {
      display: flex;
      gap: ${xs};
    }
    .member-action-btn {
      border: none;
      border-radius: 4px;
      padding: ${xs} ${sm};
      cursor: pointer;
      font-size: 12px;
    }
    .member-action-btn.danger {
      background: ${danger};
      color: ${white};
    }

    /* ===== DONATIONS ===== */
    .clan-donations {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: ${sm};
    }
    .donation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: ${sm};
      background: rgba(255,255,255,0.1);
      border-radius: 6px;
      color: ${white};
      font-weight: bold;
    }
    .donation-list {
      display: flex;
      flex-direction: column;
      gap: ${sm};
    }
    .donation-item {
      background: rgba(255,255,255,0.05);
      border-radius: 6px;
      padding: ${sm};
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .donation-requester {
      font-weight: bold;
      color: ${gold};
    }
    .donation-card {
      font-size: 13px;
      color: ${white};
    }
    .donation-btn {
      padding: ${xs} ${sm};
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
    }
    .donation-btn.give {
      background: ${neonBlue};
      color: ${darkBlue};
    }
    .donation-btn.request {
      background: ${gold};
      color: ${darkBlue};
    }

    /* ===== WARS ===== */
    .clan-wars {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      text-align: center;
      color: ${white};
      gap: ${sm};
    }
    .war-status h3 {
      font-size: 18px;
      font-weight: bold;
      color: ${gold};
    }
    .war-status p {
      font-size: 14px;
      color: ${white};
    }
    `;
  }
}

export default ClanTabStyles;
