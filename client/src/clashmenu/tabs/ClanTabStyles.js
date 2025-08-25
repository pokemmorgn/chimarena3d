/**
 * ClanTabStyles.js - Styles complets pour l'onglet Clan
 * Design Clash Royale avec couleurs cohérentes et tous les composants
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
      gray200: '#eeeeee',
      gray300: '#e0e0e0',
      gray400: '#bdbdbd',
      gray500: '#9e9e9e',
      gray600: '#757575',
      gray700: '#616161',
      gray800: '#424242',
      gray900: '#212121',

      // Roles
      leader: '#ffd700',
      elder: '#ff9800',
      coLeader: '#e91e63',
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
      white, black, gold, darkBlue, royalBlue, neonBlue, purple,
      success, warning, danger, info,
      gray100, gray200, gray300, gray400, gray500, gray600, gray700, gray800, gray900,
      leader, elder, coLeader, member
    } = this.colors;
    
    const { xs, sm, md, lg, xl, xxl } = this.spacing;

    return `
    /* ===== BASE CLAN TAB ===== */
    .clan-tab {
      display: none;
      flex-direction: column;
      height: 100%;
      color: ${white};
      background: transparent;
      position: relative;
    }

    .clan-tab.active {
      display: flex;
    }

    /* ===== LOADING STATE ===== */
    .clan-loading {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: ${md};
      color: ${white};
      text-align: center;
      padding: ${xl};
    }

    .clan-loading .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.2);
      border-top: 4px solid ${gold};
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .clan-loading h3 {
      font-size: 24px;
      font-weight: bold;
      margin: 0;
      color: ${gold};
    }

    .clan-loading p {
      font-size: 16px;
      color: ${gray500};
      margin: 0;
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
      align-items: center;
      justify-content: center;
      padding: ${xl};
      gap: ${xl};
      text-align: center;
    }

    .no-clan-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: ${md};
    }

    .no-clan-header .clan-icon {
      font-size: 80px;
      margin-bottom: ${md};
      opacity: 0.8;
    }

    .no-clan-header h2 {
      font-size: 32px;
      font-weight: bold;
      color: ${white};
      margin: 0;
    }

    .no-clan-header p {
      font-size: 18px;
      color: ${gray500};
      margin: 0;
      max-width: 400px;
      line-height: 1.5;
    }

    .clan-actions {
      display: flex;
      gap: ${md};
      flex-wrap: wrap;
      justify-content: center;
    }

    .clan-action-btn {
      padding: ${md} ${lg};
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: ${sm};
      min-width: 140px;
      justify-content: center;
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
      background: linear-gradient(135deg, ${neonBlue}, #0097a7);
      color: ${white};
      box-shadow: 0 4px 15px rgba(0, 188, 212, 0.4);
    }

    .clan-action-btn.secondary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 188, 212, 0.6);
    }

    .clan-quick-stats {
      display: flex;
      gap: ${lg};
      justify-content: center;
      flex-wrap: wrap;
    }

    .quick-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: ${xs};
      padding: ${md};
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      min-width: 80px;
    }

    .stat-number {
      font-size: 24px;
      font-weight: bold;
      color: ${gold};
    }

    .stat-label {
      font-size: 14px;
      color: ${gray500};
    }

    /* ===== CLAN INTERFACE ===== */
    .clan-interface {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    /* ===== CLAN HEADER ===== */
    .clan-header {
      display: flex;
      align-items: center;
      gap: ${md};
      padding: ${md} ${lg};
      border-bottom: 2px solid ${gold};
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(26, 35, 126, 0.1));
      position: relative;
    }

    .clan-badge {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, ${gold}, #ffb300);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid ${white};
      box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
    }

    .clan-badge-icon {
      font-size: 28px;
    }

    .clan-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: ${xs};
    }

    .clan-name {
      font-size: 24px;
      font-weight: bold;
      color: ${white};
      margin: 0;
    }

    .clan-tag {
      font-size: 16px;
      color: ${gold};
      font-weight: 500;
    }

    .clan-members {
      font-size: 14px;
      color: ${gray400};
    }

    /* ===== CLAN TABS ===== */
    .clan-tabs {
      display: flex;
      justify-content: space-around;
      padding: ${sm};
      background: rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      gap: ${xs};
    }

    .clan-tab-btn {
      flex: 1;
      padding: ${sm} ${md};
      border: none;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.1);
      color: ${white};
      font-weight: bold;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    }

    .clan-tab-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-1px);
    }

    .clan-tab-btn.active {
      background: linear-gradient(135deg, ${gold}, #ffb300);
      color: ${darkBlue};
      box-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
    }

    /* ===== CONTENT AREAS ===== */
    .clan-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .clan-tab-content {
      display: none;
      flex: 1;
      flex-direction: column;
      overflow: hidden;
    }

    .clan-tab-content.active {
      display: flex;
    }

    /* ===== CHAT ===== */
    .clan-chat {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: ${sm};
      padding: ${md};
      background: rgba(0, 0, 0, 0.1);
    }

    .chat-message {
      background: rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: ${md};
      border-left: 4px solid transparent;
      transition: all 0.2s ease;
    }

    .chat-message:hover {
      background: rgba(255, 255, 255, 0.12);
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: ${xs};
      font-size: 12px;
    }

    .message-author {
      font-weight: bold;
      font-size: 14px;
    }

    .message-author.leader { 
      color: ${leader}; 
      text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
    }

    .message-author.elder { 
      color: ${elder}; 
    }

    .message-author.co-leader { 
      color: ${coLeader}; 
    }

    .message-author.member { 
      color: ${member}; 
    }

    .message-time {
      color: ${gray500};
      font-size: 11px;
    }

    .message-content {
      font-size: 15px;
      color: ${white};
      line-height: 1.4;
      word-wrap: break-word;
    }

    .chat-input-container {
      display: flex;
      gap: ${sm};
      padding: ${md};
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(0, 0, 0, 0.2);
    }

    .chat-input {
      flex: 1;
      padding: ${md};
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.1);
      color: ${white};
      font-size: 15px;
      outline: none;
      transition: all 0.2s ease;
    }

    .chat-input:focus {
      border-color: ${gold};
      background: rgba(255, 255, 255, 0.15);
      box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.1);
    }

    .chat-input::placeholder {
      color: ${gray400};
    }

    .chat-send-btn {
      background: linear-gradient(135deg, ${neonBlue}, #0097a7);
      color: ${white};
      font-weight: bold;
      border: none;
      border-radius: 8px;
      padding: ${md} ${lg};
      cursor: pointer;
      font-size: 18px;
      transition: all 0.2s ease;
      min-width: 50px;
    }

    .chat-send-btn:hover {
      background: linear-gradient(135deg, ${gold}, #ffb300);
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
    }

    /* ===== MEMBERS ===== */
    .clan-members {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .members-header {
      padding: ${md} ${lg};
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.05);
      font-weight: bold;
      color: ${white};
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .members-count {
      font-size: 16px;
      color: ${gold};
    }

    .members-list {
      flex: 1;
      overflow-y: auto;
      padding: ${md};
      display: flex;
      flex-direction: column;
      gap: ${sm};
    }

    .member-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.05);
      padding: ${md};
      border-radius: 12px;
      transition: all 0.2s ease;
      border-left: 4px solid transparent;
    }

    .member-item:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateX(4px);
    }

    .member-item.online {
      border-left-color: ${success};
    }

    .member-item.offline {
      border-left-color: ${gray600};
      opacity: 0.7;
    }

    .member-avatar {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, ${gold}, #ffb300);
      border-radius: 50%;
      margin-right: ${md};
      border: 2px solid ${white};
    }

    .member-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: ${xs};
    }

    .member-name {
      font-size: 16px;
      font-weight: bold;
      color: ${white};
      margin: 0;
    }

    .member-stats {
      display: flex;
      gap: ${md};
      font-size: 13px;
    }

    .member-trophies {
      color: ${gold};
      font-weight: 500;
    }

    .member-donations {
      color: ${neonBlue};
      font-weight: 500;
    }

    .member-role {
      font-size: 14px;
      font-weight: bold;
      text-transform: capitalize;
      padding: ${xs} ${sm};
      border-radius: 6px;
      margin-right: ${sm};
    }

    .member-role.leader {
      color: ${leader};
      background: rgba(255, 215, 0, 0.2);
      border: 1px solid ${leader};
    }

    .member-role.elder {
      color: ${elder};
      background: rgba(255, 152, 0, 0.2);
      border: 1px solid ${elder};
    }

    .member-role.co-leader {
      color: ${coLeader};
      background: rgba(233, 30, 99, 0.2);
      border: 1px solid ${coLeader};
    }

    .member-role.member {
      color: ${member};
      background: rgba(158, 158, 158, 0.2);
      border: 1px solid ${member};
    }

    .member-actions {
      display: flex;
      gap: ${xs};
      align-items: center;
    }

    .member-action-btn {
      border: none;
      border-radius: 6px;
      padding: ${xs} ${sm};
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      transition: all 0.2s ease;
      min-width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .member-action-btn:hover {
      transform: scale(1.1);
    }

    .member-action-btn.btn-promote {
      background: ${success};
      color: ${white};
    }

    .member-action-btn.btn-demote {
      background: ${warning};
      color: ${white};
    }

    .member-action-btn.btn-kick {
      background: ${danger};
      color: ${white};
    }

    /* ===== DONATIONS ===== */
    .clan-donations {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .donation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: ${md} ${lg};
      background: rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      color: ${white};
      font-weight: bold;
      font-size: 16px;
    }

    .donation-list {
      flex: 1;
      overflow-y: auto;
      padding: ${md};
      display: flex;
      flex-direction: column;
      gap: ${sm};
    }

    .donation-item {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: ${md};
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.2s ease;
      border-left: 4px solid ${neonBlue};
    }

    .donation-item:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateX(4px);
    }

    .donation-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: ${xs};
    }

    .donation-requester {
      font-weight: bold;
      color: ${gold};
      font-size: 15px;
    }

    .donation-card {
      font-size: 14px;
      color: ${white};
    }

    .donation-actions {
      display: flex;
      gap: ${sm};
    }

    .donation-btn {
      padding: ${sm} ${md};
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 80px;
    }

    .donation-btn:hover {
      transform: translateY(-1px);
    }

    .donation-btn.give {
      background: linear-gradient(135deg, ${success}, #388e3c);
      color: ${white};
      box-shadow: 0 2px 10px rgba(76, 175, 80, 0.3);
    }

    .donation-btn.request {
      background: linear-gradient(135deg, ${gold}, #ffb300);
      color: ${darkBlue};
      box-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
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
      gap: ${lg};
      padding: ${xl};
    }

    .war-status {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: ${md};
    }

    .war-icon {
      font-size: 80px;
      opacity: 0.8;
    }

    .war-status h3 {
      font-size: 28px;
      font-weight: bold;
      color: ${gold};
      margin: 0;
    }

    .war-status p {
      font-size: 18px;
      color: ${gray400};
      margin: 0;
      max-width: 300px;
      line-height: 1.5;
    }

    /* ===== SCROLLBAR STYLES ===== */
    .chat-messages::-webkit-scrollbar,
    .members-list::-webkit-scrollbar,
    .donation-list::-webkit-scrollbar {
      width: 8px;
    }

    .chat-messages::-webkit-scrollbar-track,
    .members-list::-webkit-scrollbar-track,
    .donation-list::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }

    .chat-messages::-webkit-scrollbar-thumb,
    .members-list::-webkit-scrollbar-thumb,
    .donation-list::-webkit-scrollbar-thumb {
      background: ${gold};
      border-radius: 4px;
    }

    .chat-messages::-webkit-scrollbar-thumb:hover,
    .members-list::-webkit-scrollbar-thumb:hover,
    .donation-list::-webkit-scrollbar-thumb:hover {
      background: #ffb300;
    }

    /* ===== RESPONSIVE DESIGN ===== */
    @media (max-width: 768px) {
      .clan-header {
        padding: ${md};
      }

      .clan-name {
        font-size: 20px;
      }

      .clan-tabs {
        padding: ${xs};
        gap: 2px;
      }

      .clan-tab-btn {
        padding: ${sm};
        font-size: 12px;
      }

      .chat-messages,
      .members-list,
      .donation-list {
        padding: ${sm};
      }

      .member-item,
      .donation-item {
        padding: ${sm};
      }

      .member-stats {
        flex-direction: column;
        gap: ${xs};
      }

      .donation-actions {
        flex-direction: column;
        gap: ${xs};
      }
    }

    @media (max-width: 480px) {
      .no-clan-header h2 {
        font-size: 24px;
      }

      .no-clan-header p {
        font-size: 16px;
      }

      .clan-actions {
        flex-direction: column;
        width: 100%;
      }

      .clan-action-btn {
        width: 100%;
        max-width: 250px;
      }

      .clan-header {
        flex-direction: column;
        text-align: center;
        gap: ${sm};
      }

      .clan-badge {
        width: 50px;
        height: 50px;
      }

      .clan-badge-icon {
        font-size: 24px;
      }

      .member-item {
        flex-direction: column;
        gap: ${sm};
        text-align: center;
      }

      .member-actions {
        justify-content: center;
      }

      .donation-item {
        flex-direction: column;
        gap: ${sm};
        text-align: center;
      }

      .donation-actions {
        width: 100%;
        justify-content: center;
      }
    }

    /* ===== ANIMATIONS ===== */
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .clan-tab-content.active {
      animation: fadeIn 0.3s ease-out;
    }

    .chat-message,
    .member-item,
    .donation-item {
      animation: fadeIn 0.2s ease-out;
    }

    /* ===== ACCESSIBILITY ===== */
    .clan-tab-btn:focus,
    .chat-input:focus,
    .chat-send-btn:focus,
    .member-action-btn:focus,
    .donation-btn:focus {
      outline: 2px solid ${gold};
      outline-offset: 2px;
    }

    /* ===== HIGH CONTRAST MODE ===== */
    @media (prefers-contrast: high) {
      .clan-header,
      .clan-tabs,
      .chat-messages,
      .members-list,
      .donation-list {
        border: 2px solid ${white};
      }

      .member-item,
      .donation-item,
      .chat-message {
        border: 1px solid ${gray400};
      }
    }

    /* ===== REDUCED MOTION ===== */
    @media (prefers-reduced-motion: reduce) {
      .clan-tab-btn,
      .chat-send-btn,
      .member-item,
      .donation-item,
      .member-action-btn,
      .donation-btn {
        transition: none;
        animation: none;
      }

      .loading-spinner {
        animation: none;
      }
    }
    `;
  }
}

export default ClanTabStyles;
