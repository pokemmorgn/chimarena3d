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
      white, black, gold, darkBlue, royalBlue, neonBlue, purple,
      success, warning, danger, info,
      gray100, gray300, gray500, gray700, gray900,
      leader, elder, member
    } = this.colors;
    
    const { xs, sm, md, lg, xl, xxl } = this.spacing;

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

    .clan-loading h3 {
      color: ${white};
      margin-bottom: ${sm};
      font-size: 20px;
    }

    .clan-loading p {
      color: ${gray300};
      font-size: 14px;
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

    /* Benefits Section */
    .clan-benefits {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 15px;
      padding: ${lg};
      margin-bottom: ${lg};
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .benefit-item {
      display: flex;
      align-items: center;
      gap: ${md};
      padding: ${sm} 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .benefit-item:last-child {
      border-bottom: none;
    }

    .benefit-icon {
      font-size: 24px;
      width: 40px;
      text-align: center;
    }

    .benefit-text {
      color: ${white};
      font-size: 16px;
      font-weight: 500;
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

    .btn-icon {
      font-size: 20px;
    }

    .btn-text {
      font-size: 16px;
    }

    /* Quick Stats */
    .clan-quick-stats {
      display: flex;
      justify-content: space-around;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 10px;
      padding: ${lg};
      margin-top: auto;
    }

    .quick-stat {
      text-align: center;
    }

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

    /* ===== CLAN INTERFACE ===== */
    .clan-interface {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    /* Clan Header */
    .clan-header {
      display: flex;
      align-items: center;
      gap: ${md};
      padding: ${md};
      background: rgba(255, 255, 255, 0.1);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
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
    }

    .clan-badge-icon {
      font-size: 30px;
    }

    .clan-info {
      flex: 1;
    }

    .clan-name {
      font-size: 20px;
      font-weight: bold;
      color: ${white};
      margin-bottom: ${xs};
    }

    .clan-tag {
      font-size: 14px;
      color: ${gold};
      margin-bottom: ${xs};
    }

    .clan-members {
      font-size: 12px;
      color: ${gray300};
    }

    .clan-actions-header {
      display: flex;
      gap: ${sm};
    }

    .clan-header-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.2);
      color: ${white};
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .clan-header-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }

    .clan-header-btn.danger {
      background: rgba(244, 67, 54, 0.3);
      color: ${danger};
    }

    .clan-header-btn.danger:hover {
      background: rgba(244, 67, 54, 0.5);
    }

    /* Clan Internal Tabs */
    .clan-tabs {
      display: flex;
      background: rgba(0, 0, 0, 0.2);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .clan-tab-btn {
      flex: 1;
      padding: ${md};
      border: none;
      background: transparent;
      color: ${gray300};
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      border-bottom: 3px solid transparent;
    }

    .clan-tab-btn.active {
      color: ${white};
      border-bottom-color: ${gold};
      background: rgba(255, 255, 255, 0.1);
    }

    .clan-tab-btn:hover:not(.active) {
      color: ${white};
      background: rgba(255, 255, 255, 0.05);
    }

    /* Tab Content */
    .clan-content {
      flex: 1;
      position: relative;
      overflow: hidden;
    }

    .clan-tab-content {
      position: absolute;
      inset: 0;
      display: none;
      flex-direction: column;
    }

    .clan-tab-content.active {
      display: flex;
    }

    /* ===== CHAT TAB ===== */
    .clan-chat {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .chat-messages {
      flex: 1;
      padding: ${md};
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: ${sm};
    }

    .chat-message {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      padding: ${sm} ${md};
      border-left: 3px solid ${neonBlue};
    }

    .message-header {
      display: flex;
      align-items: center;
      gap: ${sm};
      margin-bottom: ${xs};
    }

    .message-author {
      font-weight: bold;
      font-size: 14px;
    }

    .message-author.leader {
      color: ${leader};
    }

    .message-author.elder {
      color: ${elder};
    }

    .message-author.member {
      color: ${member};
    }

    .message-role {
      font-size: 12px;
      color: ${gray500};
      text-transform: capitalize;
    }

    .message-time {
      margin-left: auto;
      font-size: 11px;
      color: ${gray500};
    }

    .message-content {
      color: ${white};
      font-size: 14px;
      line-height: 1.4;
    }

    /* Chat Input */
    .chat-input-container {
      display: flex;
      padding: ${md};
      background: rgba(0, 0, 0, 0.2);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      gap: ${sm};
    }

    .chat-input {
      flex: 1;
      padding: ${sm} ${md};
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      color: ${white};
      font-size: 14px;
    }

    .chat-input::placeholder {
      color: ${gray500};
    }

    .chat-input:focus {
      outline: none;
      border-color: ${gold};
      background: rgba(255, 255, 255, 0.15);
    }

    .chat-send-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, ${gold}, #ffb300);
      color: ${darkBlue};
      font-size: 18px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .chat-send-btn:hover {
      transform: scale(1.1);
    }

    /* ===== MEMBERS TAB ===== */
    .clan-members {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .members-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: ${md};
      background: rgba(0, 0, 0, 0.2);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .members-count {
      color: ${white};
      font-weight: bold;
      font-size: 16px;
    }

    .members-controls {
      display: flex;
      gap: ${sm};
    }

    .members-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.2);
      color: ${white};
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .members-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }

    .members-list {
      flex: 1;
      overflow-y: auto;
      padding: ${sm};
    }

    .member-item {
      display: flex;
      align-items: center;
      gap: ${md};
      padding: ${md};
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      margin-bottom: ${sm};
      transition: background 0.2s ease;
    }

    .member-item:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .member-item.online {
      border-left: 3px solid ${success};
    }

    .member-item.offline {
      border-left: 3px solid ${gray500};
      opacity: 0.7;
    }

    .member-avatar {
      position: relative;
      width: 40px;
      height: 40px;
      background: ${gray700};
      border-radius: 50%;
    }

    .member-status {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid ${darkBlue};
    }

    .member-status.online {
      background: ${success};
    }

    .member-status.offline {
      background: ${gray500};
    }

    .member-info {
      flex: 1;
    }

    .member-name {
      color: ${white};
      font-weight: bold;
      font-size: 14px;
      margin-bottom: ${xs};
    }

    .member-stats {
      display: flex;
      gap: ${md};
      font-size: 12px;
    }

    .member-trophies {
      color: ${gold};
    }

    .member-donations {
      color: ${neonBlue};
    }

    .member-role {
      padding: ${xs} ${sm};
      border-radius: 12px;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      text-align: center;
      min-width: 60px;
    }

    .member-role.leader {
      background: ${leader};
      color: ${darkBlue};
    }

    .member-role.elder {
      background: ${elder};
      color: ${white};
    }

    .member-role.member {
      background: ${gray500};
      color: ${white};
    }

    .member-actions {
      display: flex;
      gap: ${xs};
    }

    .member-action-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.2);
      color: ${white};
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .member-action-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }

    .member-action-btn.danger {
      background: rgba(244, 67, 54, 0.3);
      color: ${danger};
    }

    .member-action-btn.danger:hover {
      background: rgba(244, 67, 54, 0.5);
    }

    /* ===== WARS TAB ===== */
    .clan-wars {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: ${xl};
    }

    .war-status {
      text-align: center;
    }

    .war-icon {
      font-size: 80px;
      margin-bottom: ${lg};
      opacity: 0.5;
    }

    .clan-wars h3 {
      color: ${white};
      font-size: 24px;
      margin-bottom: ${sm};
    }

    .clan-wars p {
      color: ${gray300};
      font-size: 16px;
    }

    /* ===== ERROR STATE ===== */
    .clan-error {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: ${xl};
      text-align: center;
    }

    .error-icon {
      font-size: 60px;
      margin-bottom: ${lg};
    }

    .clan-error h3 {
      color: ${white};
      margin-bottom: ${sm};
      font-size: 20px;
    }

    .clan-error p {
      color: ${gray300};
      font-size: 14px;
      margin-bottom: ${lg};
    }

    .retry-btn {
      padding: ${md} ${lg};
      background: linear-gradient(135deg, ${gold}, #ffb300);
      color: ${darkBlue};
      border: none;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .retry-btn:hover {
      transform: translateY(-2px);
    }

    /* ===== RESPONSIVE DESIGN ===== */
    @media (max-width: 360px) {
      .clan-action-btn {
        padding: ${sm} ${md};
        font-size: 16px;
      }
      
      .btn-text {
        font-size: 14px;
      }
      
      .clan-header {
        padding: ${sm};
      }
      
      .clan-name {
        font-size: 18px;
      }
    }

    /* ===== ANIMATIONS ===== */
    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .chat-message {
      animation: slideInUp 0.3s ease-out;
    }

    .member-item {
      animation: slideInUp 0.2s ease-out;
    }

    /* ===== SCROLLBAR STYLES ===== */
    .chat-messages::-webkit-scrollbar,
    .members-list::-webkit-scrollbar,
    .clan-no-clan::-webkit-scrollbar {
      width: 6px;
    }

    .chat-messages::-webkit-scrollbar-track,
    .members-list::-webkit-scrollbar-track,
    .clan-no-clan::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }

    .chat-messages::-webkit-scrollbar-thumb,
    .members-list::-webkit-scrollbar-thumb,
    .clan-no-clan::-webkit-scrollbar-thumb {
      background: ${gold};
      border-radius: 3px;
    }

    .chat-messages::-webkit-scrollbar-thumb:hover,
    .members-list::-webkit-scrollbar-thumb:hover,
    .clan-no-clan::-webkit-scrollbar-thumb:hover {
      background: #ffb300;
    }
    `;
  }
}

export default ClanTabStyles;
