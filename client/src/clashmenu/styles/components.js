/**
 * Component Styles - Styles pour tous les composants Clash Menu
 * Navigation, onglets, boutons, cartes, etc.
 */

export class ComponentStyles {
  
  /**
   * Obtenir tous les styles des composants
   */
  static getStyles() {
    return `
      ${this.getTabNavigationStyles()}
      ${this.getBattleTabStyles()}
      ${this.getButtonStyles()}
      ${this.getCardStyles()}
      ${this.getModalStyles()}
      ${this.getConnectionStatusStyles()}
      ${this.getBattleModeStyles()}
      ${this.getComingSoonStyles()}
    `;
  }

  /**
   * Navigation par onglets mobile
   */
  static getTabNavigationStyles() {
    return `
      /* =================
         TAB NAVIGATION
         ================= */
      
      .tab-navigation {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 80px;
        background: rgba(26, 26, 46, 0.95);
        backdrop-filter: blur(15px);
        display: flex;
        align-items: center;
        justify-content: space-around;
        padding: 0 var(--spacing-md);
        box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.3);
        border-top: 1px solid var(--color-border-secondary);
        z-index: 1000;
        -webkit-backdrop-filter: blur(15px);
      }
      
      .tab-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 10px 16px;
        background: transparent;
        border: none;
        color: var(--color-text-muted);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        border-radius: 12px;
        min-width: 60px;
        position: relative;
        overflow: hidden;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }
      
      .tab-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--color-interactive-hover);
        opacity: 0;
        transition: opacity 0.2s ease;
        border-radius: inherit;
      }
      
      .tab-button:hover::before,
      .tab-button:focus::before {
        opacity: 1;
      }
      
      .tab-button:active {
        transform: scale(0.95);
      }
      
      .tab-button.active {
        color: var(--color-brand-primary);
        background: rgba(74, 144, 226, 0.1);
        transform: translateY(-3px);
        box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
      }
      
      .tab-button.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
      }
      
      .tab-icon {
        font-size: 24px;
        margin-bottom: 4px;
        transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        position: relative;
        z-index: 1;
      }
      
      .tab-button.active .tab-icon {
        transform: scale(1.1) translateY(-1px);
      }
      
      .tab-label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        position: relative;
        z-index: 1;
        transition: all 0.3s ease;
      }
      
      .tab-coming-soon {
        font-size: 9px;
        color: var(--color-brand-warning);
        margin-top: 2px;
        opacity: 0.8;
      }
      
      .tab-badge {
        position: absolute;
        top: 8px;
        right: 12px;
        background: var(--color-brand-danger);
        color: var(--color-text-primary);
        border-radius: 10px;
        min-width: 18px;
        height: 18px;
        font-size: 10px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid var(--color-background-viewport);
        animation: badgeBounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        z-index: 2;
      }
      
      /* Mobile natif */
      @media (max-width: 425px) {
        .tab-navigation {
          height: 70px;
          padding: 0 var(--spacing-sm);
        }
        
        .tab-button {
          padding: 8px 12px;
          min-width: 50px;
        }
        
        .tab-icon {
          font-size: 20px;
        }
        
        .tab-label {
          font-size: 10px;
        }
      }
    `;
  }

  /**
   * Onglet de bataille principal
   */
  static getBattleTabStyles() {
    return `
      /* =================
         BATTLE TAB
         ================= */
      
      .battle-tab {
        position: fixed;
        top: 44px;
        left: 0;
        right: 0;
        bottom: 80px;
        padding: var(--spacing-lg);
        overflow-y: auto;
        display: none;
        background: transparent;
        -webkit-overflow-scrolling: touch;
      }
      
      .battle-tab.active {
        display: block;
        animation: slideInUp 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      
      .battle-header {
        text-align: center;
        margin-bottom: var(--spacing-xl);
        padding: 24px var(--spacing-lg);
        background: rgba(22, 33, 62, 0.8);
        border-radius: 20px;
        backdrop-filter: blur(15px);
        border: 2px solid var(--color-border-primary);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        position: relative;
        overflow: hidden;
      }
      
      .battle-header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, 
          transparent 0%, 
          rgba(74, 144, 226, 0.05) 50%, 
          transparent 100%);
        animation: shimmer 3s ease-in-out infinite;
      }
      
      .player-name {
        font-size: 28px;
        font-weight: 700;
        color: var(--color-brand-primary);
        margin-bottom: 12px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        position: relative;
        z-index: 1;
      }
      
      .player-subtitle {
        font-size: 16px;
        color: var(--color-text-secondary);
        opacity: 0.8;
        margin-bottom: var(--spacing-lg);
      }
      
      .player-stats {
        display: flex;
        justify-content: center;
        gap: var(--spacing-xl);
        margin-top: var(--spacing-lg);
        position: relative;
        z-index: 1;
      }
      
      .stat-item {
        text-align: center;
        transition: transform 0.3s ease;
      }
      
      .stat-item:hover {
        transform: translateY(-2px);
      }
      
      .stat-value {
        font-size: 24px;
        font-weight: 700;
        color: var(--color-text-primary);
        display: block;
        margin-bottom: 4px;
        transition: color 0.3s ease;
      }
      
      .stat-value.trophies { color: var(--color-rarity-champion); }
      .stat-value.wins { color: var(--color-status-success); }
      .stat-value.losses { color: var(--color-brand-danger); }
      
      .stat-label {
        font-size: 12px;
        color: var(--color-brand-primary);
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 600;
        opacity: 0.8;
      }
      
      /* Mobile adaptatif */
      @media (max-width: 425px) {
        .battle-tab {
          padding: var(--spacing-md);
        }
        
        .battle-header {
          padding: 20px var(--spacing-md);
        }
        
        .player-name {
          font-size: 24px;
        }
        
        .player-stats {
          gap: var(--spacing-md);
        }
        
        .stat-value {
          font-size: 20px;
        }
      }
    `;
  }

  /**
   * Système de boutons optimisé mobile
   */
  static getButtonStyles() {
    return `
      /* =================
         BUTTON SYSTEM
         ================= */
      
      .battle-buttons {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
        max-width: 350px;
        margin: 0 auto var(--spacing-xl);
      }
      
      .battle-button {
        padding: 18px 32px;
        font-size: 18px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        border: none;
        border-radius: 16px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
        min-height: 56px;
      }
      
      .battle-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, 
          transparent, 
          rgba(255, 255, 255, 0.2), 
          transparent);
        transition: left 0.5s ease;
      }
      
      .battle-button:hover::before {
        left: 100%;
      }
      
      .battle-button:active {
        transform: translateY(1px) scale(0.98);
      }
      
      .battle-button.primary {
        background: var(--color-interactive-primary);
        color: var(--color-text-primary);
        box-shadow: 0 8px 24px rgba(46, 204, 113, 0.4);
      }
      
      .battle-button.primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 32px rgba(46, 204, 113, 0.6);
      }
      
      .battle-button.secondary {
        background: var(--color-interactive-secondary);
        color: var(--color-text-primary);
        box-shadow: 0 8px 24px rgba(74, 144, 226, 0.4);
      }
      
      .battle-button.secondary:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 32px rgba(74, 144, 226, 0.6);
      }
      
      .battle-button.tertiary {
        background: var(--color-interactive-tertiary);
        color: var(--color-text-primary);
        box-shadow: 0 8px 24px rgba(243, 156, 18, 0.4);
      }
      
      .battle-button.danger {
        background: var(--color-interactive-danger);
        color: var(--color-text-primary);
        box-shadow: 0 8px 24px rgba(231, 76, 60, 0.4);
      }
      
      .battle-button.gold {
        background: var(--color-interactive-gold);
        color: var(--color-text-primary);
        box-shadow: 0 8px 24px rgba(255, 215, 0, 0.4);
      }
      
      .battle-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none !important;
        pointer-events: none;
      }
      
      .battle-button.loading {
        pointer-events: none;
      }
      
      .battle-button.loading::after {
        content: '';
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-left: var(--spacing-sm);
      }
      
      /* Boutons compacts pour mobile */
      .button-compact {
        padding: 12px 20px;
        font-size: 14px;
        min-height: 44px;
      }
      
      .button-group {
        display: flex;
        gap: var(--spacing-sm);
      }
      
      .button-group .battle-button {
        flex: 1;
      }
      
      /* Mobile adaptatif */
      @media (max-width: 425px) {
        .battle-button {
          padding: 15px 24px;
          font-size: 16px;
          min-height: 50px;
        }
        
        .button-compact {
          padding: 10px 16px;
          font-size: 13px;
          min-height: 40px;
        }
      }
    `;
  }

  /**
   * Système de cartes
   */
  static getCardStyles() {
    return `
      /* =================
         CARD SYSTEM
         ================= */
      
      .user-info-card,
      .battle-mode-card,
      .card {
        background: rgba(22, 33, 62, 0.8);
        border: 2px solid var(--color-border-secondary);
        border-radius: 16px;
        padding: var(--spacing-lg);
        backdrop-filter: blur(10px);
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
      }
      
      .card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--color-interactive-hover);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .card:hover {
        border-color: var(--color-border-primary);
        transform: translateY(-4px);
        box-shadow: 0 12px 40px rgba(74, 144, 226, 0.2);
      }
      
      .card:hover::before {
        opacity: 1;
      }
      
      .card.disabled {
        opacity: 0.6;
        cursor: not-allowed;
        pointer-events: none;
      }
      
      /* Cartes avec rarités */
      .card.common { border-color: var(--color-rarity-common); }
      .card.rare { border-color: var(--color-rarity-rare); }
      .card.epic { border-color: var(--color-rarity-epic); }
      .card.legendary { 
        border-color: var(--color-rarity-legendary);
        box-shadow: 0 0 20px rgba(255, 107, 107, 0.3);
      }
      .card.champion { 
        border-color: var(--color-rarity-champion);
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
      }
      
      /* Éléments de carte */
      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--spacing-md);
      }
      
      .card-title {
        color: var(--color-text-primary);
        font-weight: 700;
        font-size: 18px;
        margin: 0;
      }
      
      .card-subtitle {
        color: var(--color-text-secondary);
        font-size: 14px;
        opacity: 0.8;
      }
      
      .card-content {
        position: relative;
        z-index: 1;
      }
      
      .card-footer {
        margin-top: var(--spacing-md);
        padding-top: var(--spacing-md);
        border-top: 1px solid var(--color-border-secondary);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .card-icon {
        font-size: 36px;
        margin-bottom: var(--spacing-md);
        display: block;
        transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        text-align: center;
      }
      
      .card:hover .card-icon {
        transform: scale(1.1) rotate(5deg);
      }
    `;
  }

  /**
   * Modes de bataille
   */
  static getBattleModeStyles() {
    return `
      /* =================
         BATTLE MODES
         ================= */
      
      .battle-modes {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: var(--spacing-md);
        margin-top: var(--spacing-lg);
      }
      
      .battle-mode-card {
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        min-height: 120px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
      
      .battle-mode-icon {
        font-size: 36px;
        margin-bottom: var(--spacing-md);
        display: block;
        transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      
      .battle-mode-card:hover .battle-mode-icon {
        transform: scale(1.15) rotate(5deg);
      }
      
      .battle-mode-title {
        color: var(--color-text-primary);
        font-weight: 700;
        font-size: 16px;
        margin-bottom: var(--spacing-sm);
        position: relative;
        z-index: 1;
      }
      
      .battle-mode-desc {
        color: var(--color-brand-primary);
        font-size: 12px;
        line-height: 1.6;
        position: relative;
        z-index: 1;
        opacity: 0.9;
      }
      
      .battle-mode-reward {
        margin-top: var(--spacing-sm);
        padding: 4px 8px;
        background: rgba(255, 215, 0, 0.1);
        border: 1px solid rgba(255, 215, 0, 0.3);
        border-radius: 6px;
        color: var(--color-rarity-champion);
        font-size: 11px;
        font-weight: 600;
      }
      
      /* Modes spécifiques */
      .battle-mode-card.ladder {
        background: linear-gradient(135deg, rgba(46, 204, 113, 0.1), rgba(39, 174, 96, 0.1));
        border-color: rgba(46, 204, 113, 0.3);
      }
      
      .battle-mode-card.tournament {
        background: linear-gradient(135deg, rgba(155, 89, 182, 0.1), rgba(142, 68, 173, 0.1));
        border-color: rgba(155, 89, 182, 0.3);
      }
      
      .battle-mode-card.challenge {
        background: linear-gradient(135deg, rgba(243, 156, 18, 0.1), rgba(230, 126, 34, 0.1));
        border-color: rgba(243, 156, 18, 0.3);
      }
      
      .battle-mode-card.coming-soon {
        opacity: 0.6;
        cursor: not-allowed;
        position: relative;
      }
      
      .battle-mode-card.coming-soon::after {
        content: '🚧 Soon';
        position: absolute;
        top: 8px;
        right: 8px;
        background: var(--color-brand-warning);
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: bold;
      }
      
      /* Mobile adaptatif */
      @media (max-width: 425px) {
        .battle-modes {
          grid-template-columns: 1fr;
          gap: var(--spacing-sm);
        }
        
        .battle-mode-card {
          min-height: 100px;
          padding: var(--spacing-md);
        }
        
        .battle-mode-icon {
          font-size: 28px;
        }
      }
      
      /* Tablet */
      @media (min-width: 426px) and (max-width: 768px) {
        .battle-modes {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      
      /* Desktop */
      @media (min-width: 769px) {
        .battle-modes {
          grid-template-columns: repeat(3, 1fr);
        }
      }
    `;
  }

  /**
   * États de connexion
   */
  static getConnectionStatusStyles() {
    return `
      /* =================
         CONNECTION STATUS
         ================= */
      
      .connection-status {
        text-align: center;
        padding: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
        border-radius: 12px;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
        position: relative;
        overflow: hidden;
      }
      
      .connection-status::before {
        content: '';
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
        box-shadow: 0 0 8px currentColor;
        flex-shrink: 0;
      }
      
      .connection-status.connected {
        background: rgba(46, 204, 113, 0.1);
        color: var(--color-status-online);
        border: 2px solid rgba(46, 204, 113, 0.3);
      }
      
      .connection-status.connecting {
        background: rgba(243, 156, 18, 0.1);
        color: var(--color-status-connecting);
        border: 2px solid rgba(243, 156, 18, 0.3);
      }
      
      .connection-status.connecting::before {
        animation: statusPulse 1s ease-in-out infinite;
      }
      
      .connection-status.error,
      .connection-status.offline {
        background: rgba(231, 76, 60, 0.1);
        color: var(--color-status-error);
        border: 2px solid rgba(231, 76, 60, 0.3);
      }
      
      .connection-status.searching {
        background: rgba(0, 229, 255, 0.1);
        color: var(--color-status-searching);
        border: 2px solid rgba(0, 229, 255, 0.3);
        animation: searchingPulse 1.5s ease-in-out infinite;
      }
      
      .connection-status.searching::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, 
          transparent, 
          rgba(0, 229, 255, 0.2), 
          transparent);
        animation: searchingSweep 2s ease-in-out infinite;
      }
      
      /* Indicateur de ping */
      .ping-indicator {
        margin-left: auto;
        font-size: 12px;
        opacity: 0.7;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      .ping-indicator.good { color: var(--color-status-success); }
      .ping-indicator.medium { color: var(--color-brand-warning); }
      .ping-indicator.bad { color: var(--color-brand-danger); }
      
      .ping-bars {
        display: flex;
        gap: 2px;
        align-items: flex-end;
      }
      
      .ping-bar {
        width: 3px;
        background: currentColor;
        border-radius: 1px;
      }
      
      .ping-bar:nth-child(1) { height: 4px; }
      .ping-bar:nth-child(2) { height: 6px; }
      .ping-bar:nth-child(3) { height: 8px; }
    `;
  }

  /**
   * Système de modales
   */
  static getModalStyles() {
    return `
      /* =================
         MODAL SYSTEM
         ================= */
      
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        padding: 20px;
        backdrop-filter: blur(8px);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .modal-overlay.active {
        opacity: 1;
      }
      
      .modal {
        background: linear-gradient(135deg, var(--color-background-viewport), var(--color-background-card));
        border: 2px solid var(--color-border-primary);
        border-radius: 20px;
        width: 100%;
        max-width: 360px;
        max-height: 80vh;
        overflow: hidden;
        box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
        transform: scale(0.8) translateY(20px);
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      
      .modal-overlay.active .modal {
        transform: scale(1) translateY(0);
      }
      
      .modal-header {
        padding: var(--spacing-lg);
        border-bottom: 1px solid var(--color-border-secondary);
        text-align: center;
        background: rgba(30, 39, 70, 0.4);
        backdrop-filter: blur(10px);
        position: relative;
      }
      
      .modal-title {
        color: var(--color-text-primary);
        font-size: 18px;
        font-weight: 700;
        margin: 0;
      }
      
      .modal-close {
        position: absolute;
        top: 50%;
        right: var(--spacing-lg);
        transform: translateY(-50%);
        background: rgba(255, 255, 255, 0.1);
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        color: var(--color-text-secondary);
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .modal-close:hover {
        background: rgba(255, 255, 255, 0.2);
        color: var(--color-text-primary);
      }
      
      .modal-body {
        max-height: 60vh;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }
      
      .modal-content {
        padding: var(--spacing-lg);
        color: var(--color-text-secondary);
        line-height: 1.6;
      }
      
      .modal-footer {
        padding: var(--spacing-lg);
        border-top: 1px solid var(--color-border-secondary);
        display: flex;
        gap: var(--spacing-md);
        justify-content: center;
        background: rgba(30, 39, 70, 0.2);
      }
      
      .modal-button {
        padding: 12px 24px;
        border: none;
        border-radius: 12px;
        font-weight: 600;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 100px;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }
      
      .modal-button.primary {
        background: var(--color-interactive-primary);
        color: var(--color-text-primary);
        box-shadow: 0 6px 20px rgba(46, 204, 113, 0.4);
      }
      
      .modal-button.primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(46, 204, 113, 0.6);
      }
      
      .modal-button.secondary {
        background: var(--color-interactive-hover);
        color: var(--color-text-primary);
        border: 1px solid var(--color-border-secondary);
      }
      
      .modal-button.secondary:hover {
        background: var(--color-interactive-active);
        border-color: var(--color-border-primary);
      }
      
      .modal-button:active {
        transform: translateY(0) scale(0.95);
      }
      
      /* Types de modales spéciaux */
      .modal.alert .modal-content {
        text-align: center;
        padding: var(--spacing-lg) var(--spacing-lg) 0;
      }
      
      .modal.confirm .modal-content {
        text-align: center;
        padding: var(--spacing-lg);
      }
      
      .modal.loading .modal-content {
        text-align: center;
        padding: 40px var(--spacing-lg);
      }
      
      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid var(--color-border-primary);
        border-top: 4px solid var(--color-brand-primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
      }
    `;
  }

  /**
   * Messages "Coming Soon"
   */
  static getComingSoonStyles() {
    return `
      /* =================
         COMING SOON
         ================= */
      
      .coming-soon-message {
        position: fixed;
        top: 44px;
        left: 0;
        right: 0;
        bottom: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(15, 52, 96, 0.9);
        backdrop-filter: blur(15px);
        z-index: 1500;
        padding: var(--spacing-lg);
        opacity: 0;
        animation: fadeIn 0.5s ease-out forwards;
      }
      
      .coming-soon-content {
        text-align: center;
        background: linear-gradient(135deg, var(--color-background-viewport), var(--color-background-card));
        border: 2px solid var(--color-border-primary);
        border-radius: 20px;
        padding: 40px 24px;
        max-width: 320px;
        backdrop-filter: blur(20px);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        position: relative;
        overflow: hidden;
      }
      
      .coming-soon-content::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, 
          transparent 0%, 
          rgba(243, 156, 18, 0.1) 50%, 
          transparent 100%);
        animation: shimmer 2s ease-in-out infinite;
      }
      
      .coming-soon-content h2 {
        color: var(--color-brand-warning);
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 16px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        position: relative;
        z-index: 1;
      }
      
      .coming-soon-content p {
        color: var(--color-text-secondary);
        font-size: 16px;
        line-height: 1.5;
        margin-bottom: 24px;
        opacity: 0.9;
        position: relative;
        z-index: 1;
      }
      
      .back-to-battle-btn {
        padding: 12px 24px;
        background: var(--color-interactive-primary);
        color: var(--color-text-primary);
        border: none;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 6px 20px rgba(46, 204, 113, 0.4);
        position: relative;
        z-index: 1;
      }
      
      .back-to-battle-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(46, 204, 113, 0.6);
      }
      
      .back-to-battle-btn:active {
        transform: translateY(0) scale(0.95);
      }
    `;
  }

  /**
   * Toast notifications
   */
  static getToastStyles() {
    return `
      /* =================
         TOAST NOTIFICATIONS
         ================= */
      
      .toast-container {
        position: fixed;
        top: 70px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 3000;
        pointer-events: none;
      }
      
      .toast {
        background: rgba(30, 39, 70, 0.95);
        backdrop-filter: blur(15px);
        border: 2px solid var(--color-border-primary);
        border-radius: 12px;
        padding: var(--spacing-md) var(--spacing-lg);
        color: var(--color-text-primary);
        font-weight: 600;
        font-size: 14px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        opacity: 0;
        transform: translateY(-10px);
        transition: all 0.3s ease;
        max-width: 90vw;
        text-align: center;
        margin-bottom: var(--spacing-sm);
        pointer-events: auto;
      }
      
      .toast.active {
        opacity: 1;
        transform: translateY(0);
      }
      
      .toast.success {
        border-color: var(--color-status-success);
        color: var(--color-status-success);
      }
      
      .toast.warning {
        border-color: var(--color-brand-warning);
        color: var(--color-brand-warning);
      }
      
      .toast.error {
        border-color: var(--color-brand-danger);
        color: var(--color-brand-danger);
      }
      
      .toast.info {
        border-color: var(--color-brand-primary);
        color: var(--color-brand-primary);
      }
    `;
  }

  /**
   * Animations pour les composants
   */
  static getComponentAnimations() {
    return `
      /* =================
         COMPONENT ANIMATIONS
         ================= */
      
      @keyframes slideInUp {
        0% {
          opacity: 0;
          transform: translateY(30px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes fadeIn {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
      
      @keyframes shimmer {
        0%, 100% {
          transform: translateX(-100%);
          opacity: 0;
        }
        50% {
          opacity: 1;
        }
      }
      
      @keyframes statusPulse {
        0%, 100% {
          opacity: 0.8;
          transform: scale(1);
        }
        50% {
          opacity: 1;
          transform: scale(1.2);
        }
      }
      
      @keyframes searchingPulse {
        0%, 100% {
          opacity: 0.8;
          transform: scale(1);
        }
        50% {
          opacity: 1;
          transform: scale(1.05);
        }
      }
      
      @keyframes searchingSweep {
        0% {
          left: -100%;
        }
        100% {
          left: 100%;
        }
      }
      
      @keyframes badgeBounce {
        0%, 20%, 53%, 80%, 100% {
          transform: translate3d(0, 0, 0);
        }
        40%, 43% {
          transform: translate3d(0, -8px, 0);
        }
        70% {
          transform: translate3d(0, -4px, 0);
        }
        90% {
          transform: translate3d(0, -2px, 0);
        }
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
  }

  /**
   * Obtenir tous les styles avec animations
   */
  static getAllStyles() {
    return this.getStyles() + this.getToastStyles() + this.getComponentAnimations();
  }

  /**
   * Générer les styles pour une qualité spécifique
   */
  static getQualityStyles(quality = 'medium') {
    let styles = this.getStyles();
    
    if (quality === 'low') {
      // Désactiver les animations coûteuses
      styles += `
        .battle-button::before,
        .card::before,
        .modal,
        .connection-status.searching::after,
        .coming-soon-content::before {
          animation: none !important;
        }
        
        .battle-button:hover,
        .card:hover,
        .modal-button:hover {
          transform: none !important;
        }
      `;
    }
    
    return styles;
  }
}

export default ComponentStyles;
