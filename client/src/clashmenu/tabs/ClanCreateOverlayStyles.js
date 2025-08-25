/**
 * ClanCreateOverlayStyles.js - Styles pour l'overlay de création de clan
 * Design moderne avec animations et effets visuels
 */
class ClanCreateOverlayStyles {
  static get colors() {
    return {
      // Base
      white: '#ffffff',
      black: '#000000',
      
      // Clash Royale
      gold: '#ffd700',
      darkBlue: '#0f1419',
      royalBlue: '#1a237e',
      neonBlue: '#00bcd4',
      
      // Status
      success: '#4caf50',
      error: '#f44336',
      warning: '#ff9800',
      
      // Grays
      gray100: '#f5f5f5',
      gray200: '#eeeeee',
      gray300: '#e0e0e0',
      gray400: '#bdbdbd',
      gray500: '#9e9e9e',
      gray600: '#757575',
      gray700: '#616161',
      gray800: '#424242',
      gray900: '#212121'
    };
  }

  static getCSS() {
    const { 
      white, black, gold, darkBlue, royalBlue, neonBlue,
      success, error, warning,
      gray100, gray200, gray300, gray400, gray500, gray600, gray700, gray800, gray900
    } = this.colors;

    return `
    /* ===== CLAN CREATE OVERLAY ===== */
    .clan-create-overlay {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .overlay-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(15, 20, 25, 0.85);
      backdrop-filter: blur(8px);
    }

    .overlay-container {
      position: relative;
      width: 100%;
      max-width: 480px;
      max-height: 90vh;
      background: linear-gradient(135deg, ${darkBlue}, ${royalBlue});
      border-radius: 20px;
      border: 2px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* ===== OVERLAY HEADER ===== */
    .overlay-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      background: rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .overlay-header h2 {
      color: ${white};
      font-size: 24px;
      font-weight: bold;
      margin: 0;
    }

    .overlay-close-btn {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      color: ${white};
      font-size: 18px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .overlay-close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.1);
    }

    /* ===== OVERLAY CONTENT ===== */
    .overlay-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }

    /* ===== CLAN PREVIEW ===== */
    .clan-preview {
      display: flex;
      align-items: center;
      gap: 16px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 15px;
      padding: 20px;
      margin-bottom: 24px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .preview-badge {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, ${gold}, #ffb300);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      border: 3px solid ${white};
      box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
    }

    .preview-info {
      flex: 1;
    }

    .preview-name {
      color: ${white};
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .preview-tag {
      color: ${gold};
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .preview-description {
      color: ${gray300};
      font-size: 14px;
      line-height: 1.4;
    }

    /* ===== FORM STYLES ===== */
    .clan-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-label {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 8px;
    }

    .label-text {
      color: ${white};
      font-size: 16px;
      font-weight: 500;
    }

    .label-required {
      color: ${error};
      font-size: 14px;
    }

    .form-input,
    .form-textarea,
    .form-select {
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      padding: 12px 16px;
      color: ${white};
      font-size: 16px;
      transition: all 0.2s ease;
    }

    .form-input:focus,
    .form-textarea:focus,
    .form-select:focus {
      outline: none;
      border-color: ${gold};
      background: rgba(255, 255, 255, 0.15);
      box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.1);
    }

    .form-input::placeholder,
    .form-textarea::placeholder {
      color: ${gray400};
    }

    .form-textarea {
      resize: vertical;
      min-height: 80px;
      font-family: inherit;
    }

    .form-hint {
      color: ${gray400};
      font-size: 12px;
      margin-top: 4px;
    }

    /* ===== BADGE SELECTOR ===== */
    .badge-selector {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 12px;
    }

    .badge-option {
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .badge-option:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }

    .badge-option.active {
      background: rgba(255, 215, 0, 0.2);
      border-color: ${gold};
      box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.1);
    }

    .badge-icon {
      font-size: 24px;
      margin-bottom: 4px;
    }

    .badge-name {
      color: ${white};
      font-size: 12px;
      font-weight: 500;
      text-align: center;
    }

    /* ===== TYPE SELECTOR ===== */
    .type-selector {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .type-option {
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .type-option:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .type-option.active {
      background: rgba(255, 215, 0, 0.1);
      border-color: ${gold};
    }

    .type-option input[type="radio"] {
      width: 20px;
      height: 20px;
      accent-color: ${gold};
    }

    .type-info {
      flex: 1;
    }

    .type-title {
      color: ${white};
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .type-desc {
      color: ${gray400};
      font-size: 14px;
    }

    /* ===== TROPHIES SELECTOR ===== */
    .trophies-selector {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .trophies-slider {
      flex: 1;
      height: 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      outline: none;
      cursor: pointer;
      -webkit-appearance: none;
    }

    .trophies-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 20px;
      height: 20px;
      background: ${gold};
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
      transition: all 0.2s ease;
    }

    .trophies-slider::-webkit-slider-thumb:hover {
      transform: scale(1.2);
    }

    .trophies-slider::-moz-range-thumb {
      width: 20px;
      height: 20px;
      background: ${gold};
      border-radius: 50%;
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
    }

    .trophies-display {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 8px 12px;
      min-width: 80px;
    }

    .trophies-icon {
      font-size: 16px;
    }

    .trophies-value {
      color: ${white};
      font-weight: bold;
      font-size: 16px;
    }

    /* ===== NOTIFICATIONS ===== */
    .overlay-notification {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-left: 4px solid ${neonBlue};
      animation: slideInDown 0.3s ease-out;
    }

    .overlay-notification.error {
      border-left-color: ${error};
      background: rgba(244, 67, 54, 0.1);
    }

    .overlay-notification.success {
      border-left-color: ${success};
      background: rgba(76, 175, 80, 0.1);
    }

    .notification-icon {
      font-size: 18px;
    }

    .notification-text {
      color: ${white};
      font-size: 14px;
      flex: 1;
    }

    @keyframes slideInDown {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* ===== OVERLAY FOOTER ===== */
    .overlay-footer {
      display: flex;
      gap: 12px;
      padding: 20px 24px;
      background: rgba(0, 0, 0, 0.2);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .btn {
      flex: 1;
      padding: 14px 24px;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: ${white};
      border: 2px solid rgba(255, 255, 255, 0.2);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }

    .btn-secondary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, ${gold}, #ffb300);
      color: ${darkBlue};
      box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 215, 0, 0.6);
    }

    .btn-primary:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }

    .btn-icon {
      font-size: 18px;
    }

    .btn-text {
      font-size: 16px;
    }

    /* ===== LOADING SPINNER ===== */
    .loading-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(15, 20, 25, 0.3);
      border-top: 2px solid ${darkBlue};
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* ===== SCROLLBAR STYLES ===== */
    .overlay-content::-webkit-scrollbar {
      width: 8px;
    }

    .overlay-content::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }

    .overlay-content::-webkit-scrollbar-thumb {
      background: ${gold};
      border-radius: 4px;
    }

    .overlay-content::-webkit-scrollbar-thumb:hover {
      background: #ffb300;
    }

    /* ===== RESPONSIVE DESIGN ===== */
    @media (max-width: 480px) {
      .clan-create-overlay {
        padding: 10px;
      }

      .overlay-container {
        max-height: 95vh;
        border-radius: 15px;
      }

      .overlay-header {
        padding: 16px 20px;
      }

      .overlay-header h2 {
        font-size: 20px;
      }

      .overlay-content {
        padding: 20px;
      }

      .clan-preview {
        padding: 16px;
        flex-direction: column;
        text-align: center;
        gap: 12px;
      }

      .preview-badge {
        width: 50px;
        height: 50px;
        font-size: 24px;
      }

      .badge-selector {
        grid-template-columns: repeat(2, 1fr);
      }

      .badge-option {
        padding: 12px;
      }

      .badge-icon {
        font-size: 20px;
      }

      .overlay-footer {
        padding: 16px 20px;
        flex-direction: column;
      }

      .btn {
        padding: 12px 20px;
      }
    }

    @media (max-width: 360px) {
      .overlay-header h2 {
        font-size: 18px;
      }

      .overlay-content {
        padding: 16px;
      }

      .form-input,
      .form-textarea,
      .form-select {
        padding: 10px 14px;
        font-size: 14px;
      }

      .badge-selector {
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .badge-option {
        padding: 10px;
      }

      .trophies-selector {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }

      .trophies-display {
        align-self: center;
      }
    }

    /* ===== ANIMATIONS ===== */
    @keyframes bounceIn {
      0% {
        opacity: 0;
        transform: scale(0.3);
      }
      50% {
        opacity: 1;
        transform: scale(1.05);
      }
      70% {
        transform: scale(0.9);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }

    .overlay-container {
      animation: bounceIn 0.5s ease-out;
    }

    /* ===== ACCESSIBILITY ===== */
    .btn:focus,
    .form-input:focus,
    .form-textarea:focus,
    .form-select:focus,
    .badge-option:focus,
    .type-option:focus {
      outline: 2px solid ${gold};
      outline-offset: 2px;
    }

    /* ===== HIGH CONTRAST MODE ===== */
    @media (prefers-contrast: high) {
      .overlay-container {
        border: 3px solid ${white};
      }

      .form-input,
      .form-textarea,
      .form-select {
        border-width: 3px;
      }

      .badge-option,
      .type-option {
        border-width: 3px;
      }
    }

    /* ===== REDUCED MOTION ===== */
    @media (prefers-reduced-motion: reduce) {
      .overlay-container,
      .badge-option,
      .type-option,
      .btn,
      .overlay-close-btn {
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

export default ClanCreateOverlayStyles;
