.items-start { align-items: flex-start; }
      .items-center { align-items: center; }
      .items-end { align-items: flex-end; }
      .items-stretch { align-items: stretch; }
      
      .justify-start { justify-content: flex-start; }
      .justify-center { justify-content: center; }
      .justify-end { justify-content: flex-end; }
      .justify-between { justify-content: space-between; }
      .justify-around { justify-content: space-around; }
      .justify-evenly { justify-content: space-evenly; }
      
      .flex-1 { flex: 1; }
      .flex-auto { flex: auto; }
      .flex-none { flex: none; }
      .flex-shrink-0 { flex-shrink: 0; }
      .flex-grow { flex-grow: 1; }
      
      /* Spacing Utilities */
      .p-0 { padding: 0; }
      .p-xs { padding: ${xs}; }
      .p-sm { padding: ${sm}; }
      .p-md { padding: ${md}; }
      .p-lg { padding: ${lg}; }
      .p-xl { padding: ${xl}; }
      .p-xxl { padding: ${xxl}; }
      
      .px-xs { padding-left: ${xs}; padding-right: ${xs}; }
      .px-sm { padding-left: ${sm}; padding-right: ${sm}; }
      .px-md { padding-left: ${md}; padding-right: ${md}; }
      .px-lg { padding-left: ${lg}; padding-right: ${lg}; }
      
      .py-xs { padding-top: ${xs}; padding-bottom: ${xs}; }
      .py-sm { padding-top: ${sm}; padding-bottom: ${sm}; }
      .py-md { padding-top: ${md}; padding-bottom: ${md}; }
      .py-lg { padding-top: ${lg}; padding-bottom: ${lg}; }
      
      .m-0 { margin: 0; }
      .m-xs { margin: ${xs}; }
      .m-sm { margin: ${sm}; }
      .m-md { margin: ${md}; }
      .m-lg { margin: ${lg}; }
      .m-auto { margin: auto; }
      
      .mx-auto { margin-left: auto; margin-right: auto; }
      .my-auto { margin-top: auto; margin-bottom: auto; }
      
      .gap-xs { gap: ${xs}; }
      .gap-sm { gap: ${sm}; }
      .gap-md { gap: ${md}; }
      .gap-lg { gap: ${lg}; }
      .gap-xl { gap: ${xl}; }
      
      /* Position Utilities */
      .relative { position: relative; }
      .absolute { position: absolute; }
      .fixed { position: fixed; }
      .sticky { position: sticky; }
      
      .top-0 { top: 0; }
      .right-0 { right: 0; }
      .bottom-0 { bottom: 0; }
      .left-0 { left: 0; }
      
      .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
      
      /* Z-index */
      .z-0 { z-index: 0; }
      .z-10 { z-index: 10; }
      .z-20 { z-index: 20; }
      .z-30 { z-index: 30; }
      .z-40 { z-index: 40; }
      .z-50 { z-index: 50; }
      
      /* Width & Height */
      .w-full { width: 100%; }
      .w-auto { width: auto; }
      .h-full { height: 100%; }
      .h-auto { height: auto; }
      .h-screen { height: 100vh; }
      
      .max-w-xs { max-width: 320px; }
      .max-w-sm { max-width: 375px; }
      .max-w-md { max-width: 425px; }
      .max-w-lg { max-width: 512px; }
      
      /* Border Radius */
      .rounded-none { border-radius: 0; }
      .rounded-sm { border-radius: 4px; }
      .rounded { border-radius: 8px; }
      .rounded-md { border-radius: 12px; }
      .rounded-lg { border-radius: 16px; }
      .rounded-xl { border-radius: 20px; }
      .rounded-2xl { border-radius: 24px; }
      .rounded-full { border-radius: 9999px; }
      
      /* Overflow */
      .overflow-hidden { overflow: hidden; }
      .overflow-visible { overflow: visible; }
      .overflow-scroll { overflow: scroll; }
      .overflow-auto { overflow: auto; }
      
      .overflow-x-hidden { overflow-x: hidden; }
      .overflow-y-hidden { overflow-y: hidden; }
      .overflow-x-scroll { overflow-x: scroll; }
      .overflow-y-scroll { overflow-y: scroll; }
    `;
  }

  /**
   * Interactive states and touch optimizations
   */
  static getInteractionStyles() {
    const { duration, easing } = this.animations;
    const { interactive, border } = this.colors;
    
    return `
      /* =================
         INTERACTION STATES
         ================= */
      
      .interactive {
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }
      
      .touch-target {
        min-height: 44px;
        min-width: 44px;
      }
      
      /* Hover States */
      .hover\\:scale-105:hover {
        transform: scale(1.05);
      }
      
      .hover\\:scale-110:hover {
        transform: scale(1.1);
      }
      
      .hover\\:-translate-y-1:hover {
        transform: translateY(-4px);
      }
      
      .hover\\:-translate-y-2:hover {
        transform: translateY(-8px);
      }
      
      .hover\\:shadow-lg:hover {
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
      }
      
      .hover\\:shadow-xl:hover {
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
      }
      
      .hover\\:bg-opacity-80:hover {
        background-opacity: 0.8;
      }
      
      /* Focus States */
      .focus\\:outline-none:focus {
        outline: none;
      }
      
      .focus\\:ring:focus {
        box-shadow: 0 0 0 3px ${border.primary};
      }
      
      /* Active States */
      .active\\:scale-95:active {
        transform: scale(0.95);
      }
      
      .active\\:scale-98:active {
        transform: scale(0.98);
      }
      
      /* Disabled States */
      .disabled\\:opacity-50:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
      }
      
      /* Transition Utilities */
      .transition-none { transition: none; }
      .transition-all { transition: all ${duration.normal} ${easing.easeOut}; }
      .transition-colors { transition: color ${duration.normal} ${easing.easeOut}, background-color ${duration.normal} ${easing.easeOut}, border-color ${duration.normal} ${easing.easeOut}; }
      .transition-opacity { transition: opacity ${duration.normal} ${easing.easeOut}; }
      .transition-shadow { transition: box-shadow ${duration.normal} ${easing.easeOut}; }
      .transition-transform { transition: transform ${duration.normal} ${easing.easeOut}; }
      
      .duration-75 { transition-duration: 75ms; }
      .duration-100 { transition-duration: 100ms; }
      .duration-150 { transition-duration: 150ms; }
      .duration-200 { transition-duration: 200ms; }
      .duration-300 { transition-duration: 300ms; }
      .duration-500 { transition-duration: 500ms; }
      .duration-700 { transition-duration: 700ms; }
      .duration-1000 { transition-duration: 1000ms; }
      
      .ease-linear { transition-timing-function: ${easing.linear}; }
      .ease-in { transition-timing-function: ${easing.easeIn}; }
      .ease-out { transition-timing-function: ${easing.easeOut}; }
      .ease-in-out { transition-timing-function: ${easing.easeInOut}; }
      .ease-elastic { transition-timing-function: ${easing.elastic}; }
      .ease-bounce { transition-timing-function: ${easing.bounce}; }
    `;
  }

  /**
   * Animation keyframes
   */
  static getAnimationKeyframes() {
    return `
      /* =================
         ANIMATION KEYFRAMES
         ================= */
      
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      @keyframes ping {
        75%, 100% {
          transform: scale(2);
          opacity: 0;
        }
      }
      
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }
      
      @keyframes bounce {
        0%, 100% {
          transform: translateY(-25%);
          animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
        }
        50% {
          transform: translateY(0);
          animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
        }
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
        20%, 40%, 60%, 80% { transform: translateX(10px); }
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes fadeInDown {
        from {
          opacity: 0;
          transform: translateY(-30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes fadeInLeft {
        from {
          opacity: 0;
          transform: translateX(-30px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes fadeInRight {
        from {
          opacity: 0;
          transform: translateX(30px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.8);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      @keyframes scaleOut {
        from {
          opacity: 1;
          transform: scale(1);
        }
        to {
          opacity: 0;
          transform: scale(0.8);
        }
      }
      
      @keyframes slideInLeft {
        from {
          transform: translateX(-100%);
        }
        to {
          transform: translateX(0);
        }
      }
      
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(0);
        }
      }
      
      @keyframes slideInUp {
        from {
          transform: translateY(100%);
        }
        to {
          transform: translateY(0);
        }
      }
      
      @keyframes slideInDown {
        from {
          transform: translateY(-100%);
        }
        to {
          transform: translateY(0);
        }
      }
      
      @keyframes zoomIn {
        from {
          opacity: 0;
          transform: scale3d(0.3, 0.3, 0.3);
        }
        50% {
          opacity: 1;
        }
      }
      
      @keyframes zoomOut {
        from {
          opacity: 1;
        }
        50% {
          opacity: 0;
          transform: scale3d(0.3, 0.3, 0.3);
        }
        to {
          opacity: 0;
        }
      }
      
      @keyframes statusPulse {
        0%, 100% {
          opacity: 0.8;
          transform: scale(1);
        }
        50% {
          opacity: 1;
          transform: scale(1.05);
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
      
      @keyframes ripple {
        to {
          transform: scale(2);
          opacity: 0;
        }
      }
      
      /* Animation Classes */
      .animate-spin { animation: spin 1s linear infinite; }
      .animate-ping { animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite; }
      .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      .animate-bounce { animation: bounce 1s infinite; }
      .animate-shake { animation: shake 0.5s ease-in-out; }
      
      .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      .animate-fadeOut { animation: fadeOut 0.3s ease-out; }
      .animate-fadeInUp { animation: fadeInUp 0.6s ease-out; }
      .animate-fadeInDown { animation: fadeInDown 0.6s ease-out; }
      .animate-fadeInLeft { animation: fadeInLeft 0.6s ease-out; }
      .animate-fadeInRight { animation: fadeInRight 0.6s ease-out; }
      
      .animate-scaleIn { animation: scaleIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
      .animate-scaleOut { animation: scaleOut 0.3s ease-out; }
      
      .animate-slideInLeft { animation: slideInLeft 0.5s ease-out; }
      .animate-slideInRight { animation: slideInRight 0.5s ease-out; }
      .animate-slideInUp { animation: slideInUp 0.5s ease-out; }
      .animate-slideInDown { animation: slideInDown 0.5s ease-out; }
      
      .animate-zoomIn { animation: zoomIn 0.6s ease-out; }
      .animate-zoomOut { animation: zoomOut 0.3s ease-out; }
    `;
  }

  /**
   * Utility classes for common patterns
   */
  static getUtilityClasses() {
    const { background, border, text } = this.colors;
    
    return `
      /* =================
         UTILITY CLASSES
         ================= */
      
      /* Background Colors */
      .bg-transparent { background-color: transparent; }
      .bg-current { background-color: currentColor; }
      .bg-viewport { background-color: ${background.viewport}; }
      .bg-card { background-color: ${background.card}; }
      .bg-overlay { background-color: ${background.overlay}; }
      .bg-surface { background-color: ${background.surface}; }
      
      /* Background Opacity */
      .bg-opacity-0 { background-opacity: 0; }
      .bg-opacity-25 { background-opacity: 0.25; }
      .bg-opacity-50 { background-opacity: 0.5; }
      .bg-opacity-75 { background-opacity: 0.75; }
      .bg-opacity-100 { background-opacity: 1; }
      
      /* Border */
      .border-0 { border-width: 0; }
      .border { border-width: 1px; }
      .border-2 { border-width: 2px; }
      .border-4 { border-width: 4px; }
      
      .border-solid { border-style: solid; }
      .border-dashed { border-style: dashed; }
      .border-dotted { border-style: dotted; }
      .border-none { border-style: none; }
      
      .border-primary { border-color: ${border.primary}; }
      .border-secondary { border-color: ${border.secondary}; }
      .border-accent { border-color: ${border.accent}; }
      
      /* Shadow */
      .shadow-none { box-shadow: none; }
      .shadow-sm { box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); }
      .shadow { box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06); }
      .shadow-md { box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06); }
      .shadow-lg { box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05); }
      .shadow-xl { box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04); }
      .shadow-2xl { box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25); }
      .shadow-inner { box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06); }
      
      /* Glow Effects */
      .glow-primary { box-shadow: 0 0 20px ${this.colors.brand.primary}40; }
      .glow-accent { box-shadow: 0 0 20px ${this.colors.brand.accent}40; }
      .glow-gold { box-shadow: 0 0 20px ${this.colors.brand.gold}40; }
      
      /* Opacity */
      .opacity-0 { opacity: 0; }
      .opacity-25 { opacity: 0.25; }
      .opacity-50 { opacity: 0.5; }
      .opacity-75 { opacity: 0.75; }
      .opacity-100 { opacity: 1; }
      
      /* Pointer Events */
      .pointer-events-none { pointer-events: none; }
      .pointer-events-auto { pointer-events: auto; }
      
      /* User Select */
      .select-none { user-select: none; }
      .select-text { user-select: text; }
      .select-all { user-select: all; }
      .select-auto { user-select: auto; }
      
      /* Backdrop Filter */
      .backdrop-blur-none { backdrop-filter: none; }
      .backdrop-blur-sm { backdrop-filter: blur(4px); }
      .backdrop-blur { backdrop-filter: blur(8px); }
      .backdrop-blur-md { backdrop-filter: blur(12px); }
      .backdrop-blur-lg { backdrop-filter: blur(16px); }
      .backdrop-blur-xl { backdrop-filter: blur(24px); }
      
      /* Transform */
      .scale-0 { transform: scale(0); }
      .scale-50 { transform: scale(0.5); }
      .scale-75 { transform: scale(0.75); }
      .scale-90 { transform: scale(0.9); }
      .scale-95 { transform: scale(0.95); }
      .scale-100 { transform: scale(1); }
      .scale-105 { transform: scale(1.05); }
      .scale-110 { transform: scale(1.1); }
      .scale-125 { transform: scale(1.25); }
      .scale-150 { transform: scale(1.5); }
      
      .rotate-0 { transform: rotate(0deg); }
      .rotate-90 { transform: rotate(90deg); }
      .rotate-180 { transform: rotate(180deg); }
      .rotate-270 { transform: rotate(270deg); }
      .-rotate-90 { transform: rotate(-90deg); }
      .-rotate-180 { transform: rotate(-180deg); }
      
      .translate-x-0 { transform: translateX(0); }
      .translate-y-0 { transform: translateY(0); }
      .-translate-x-1 { transform: translateX(-4px); }
      .-translate-y-1 { transform: translateY(-4px); }
      .translate-x-1 { transform: translateX(4px); }
      .translate-y-1 { transform: translateY(4px); }
      
      /* Filters */
      .filter-none { filter: none; }
      .blur-none { filter: blur(0); }
      .blur-sm { filter: blur(4px); }
      .blur { filter: blur(8px); }
      .blur-md { filter: blur(12px); }
      .blur-lg { filter: blur(16px); }
      
      .brightness-0 { filter: brightness(0); }
      .brightness-50 { filter: brightness(0.5); }
      .brightness-75 { filter: brightness(0.75); }
      .brightness-90 { filter: brightness(0.9); }
      .brightness-95 { filter: brightness(0.95); }
      .brightness-100 { filter: brightness(1); }
      .brightness-105 { filter: brightness(1.05); }
      .brightness-110 { filter: brightness(1.1); }
      .brightness-125 { filter: brightness(1.25); }
      .brightness-150 { filter: brightness(1.5); }
      
      /* Aspect Ratio (for future use) */
      .aspect-square { aspect-ratio: 1 / 1; }
      .aspect-video { aspect-ratio: 16 / 9; }
      .aspect-mobile { aspect-ratio: 9 / 16; }
    `;
  }

  /**
   * Responsive styles for different screen sizes
   */
  static getResponsiveStyles() {
    const { mobile, tablet, desktop } = this.breakpoints;
    
    return `
      /* =================
         RESPONSIVE STYLES
         ================= */
      
      /* Mobile Native (< 425px) */
      @media (max-width: ${mobile}) {
        .app-container {
          background: ${this.colors.background.viewport};
        }
        
        .mobile-viewport {
          width: 100vw;
          height: 100vh;
          border-radius: 0;
          border: none;
          box-shadow: none;
        }
        
        .mobile-viewport::before {
          display: none;
        }
        
        .game-canvas {
          border-radius: 0;
        }
        
        .tab-navigation {
          height: 70px;
          padding: 0 ${this.spacing.sm};
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
        
        .battle-tab {
          top: 44px;
          bottom: 70px;
          padding: ${this.spacing.md};
        }
        
        .battle-header {
          padding: 20px ${this.spacing.md};
        }
        
        .player-name {
          font-size: 24px;
        }
        
        .player-stats {
          gap: ${this.spacing.md};
        }
        
        .stat-value {
          font-size: 20px;
        }
        
        .battle-button {
          padding: 15px 24px;
          font-size: 16px;
        }
        
        .battle-modes {
          grid-template-columns: 1fr;
          gap: ${this.spacing.sm};
        }
        
        .battle-mode-card {
          padding: ${this.spacing.md};
        }
        
        .battle-mode-icon {
          font-size: 28px;
        }
      }
      
      /* Tablet Portrait (426px - 768px) */
      @media (min-width: calc(${mobile} + 1px)) and (max-width: ${tablet}) {
        .mobile-viewport {
          width: 400px;
          height: 860px;
        }
        
        .container {
          max-width: 400px;
        }
        
        .battle-modes {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      
      /* Desktop (> 768px) */
      @media (min-width: calc(${tablet} + 1px)) {
        .mobile-viewport {
          width: 425px;
          height: 920px;
        }
        
        .container {
          max-width: 425px;
        }
        
        .battle-modes {
          grid-template-columns: repeat(2, 1fr);
        }
        
        /* Hover effects only on desktop */
        .battle-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(46, 204, 113, 0.4);
        }
        
        .battle-mode-card:hover {
          transform: translateY(-5px);
        }
        
        .tab-button:hover {
          background: ${this.colors.interactive.hover};
        }
      }
      
      /* Large Desktop (> 1024px) */
      @media (min-width: calc(${desktop} + 1px)) {
        .mobile-viewport {
          transform: scale(1.1);
        }
        
        .battle-modes {
          grid-template-columns: repeat(3, 1fr);
        }
      }
      
      /* Accessibility & Motion */
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
        
        .app-container {
          animation: none;
          background: ${this.colors.background.viewport};
        }
        
        .mobile-viewport::before {
          animation: none;
        }
        
        .particle {
          animation: none;
        }
      }
      
      /* High Contrast Mode */
      @media (prefers-contrast: high) {
        .app-container {
          background: #000000;
        }
        
        .mobile-viewport {
          background: #1a1a1a;
          border-color: #ffffff;
        }
        
        .battle-button {
          border: 2px solid currentColor;
        }
        
        .battle-mode-card {
          border: 2px solid #ffffff;
        }
      }
      
      /* Dark Mode Support (if system preference) */
      @media (prefers-color-scheme: dark) {
        /* Already dark by default */
      }
      
      /* Light Mode Override (future feature) */
      @media (prefers-color-scheme: light) {
        .light-mode-override {
          /* Could implement light theme here */
        }
      }
      
      /* Print Styles */
      @media print {
        .app-container,
        .mobile-viewport {
          box-shadow: none !important;
          border: 1px solid #000 !important;
          background: #fff !important;
          color: #000 !important;
        }
        
        .tab-navigation,
        .game-canvas {
          display: none !important;
        }
        
        .battle-button {
          background: transparent !important;
          border: 2px solid #000 !important;
          color: #000 !important;
        }
      }
    `;
  }

  /**
   * Get specific component styles
   */
  static getComponentCSS(componentName) {
    const components = {
      tabNavigation: this.getTabNavigationStyles(),
      battleTab: this.getBattleTabStyles(),
      comingSoon: this.getComingSoonStyles(),
      modal: this.getModalStyles()
    };

    return components[componentName] || '';
  }

  /**
   * Coming Soon styles
   */
  static getComingSoonStyles() {
    const { background, text, border } = this.colors;
    const { lg } = this.spacing;
    
    return `
      .coming-soon-message {
        position: fixed;
        top: 44px;
        left: 0;
        right: 0;
        bottom: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${background.overlay}dd;
        backdrop-filter: blur(10px);
        z-index: 100;
        padding: ${lg};
      }
      
      .coming-soon-content {
        text-align: center;
        background: linear-gradient(135deg, ${background.viewport}, ${background.card});
        border: 2px solid ${border.primary};
        border-radius: 20px;
        padding: 40px 24px;
        max-width: 320px;
        backdrop-filter: blur(20px);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
      }
      
      .coming-soon-content h2 {
        color: ${this.colors.brand.warning};
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 16px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
      }
      
      .coming-soon-content p {
        color: ${text.secondary};
        font-size: 16px;
        line-height: 1.5;
        margin-bottom: 24px;
        opacity: 0.9;
      }
      
      .back-to-battle-btn {
        padding: 12px 24px;
        background: ${this.colors.interactive.primary};
        color: ${text.primary};
        border: none;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 6px 20px ${this.colors.brand.accent}40;
      }
      
      .back-to-battle-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px ${this.colors.brand.accent}60;
      }
    `;
  }

  /**
   * Modal system styles
   */
  static getModalStyles() {
    const { background, text, border, interactive } = this.colors;
    const { md, lg } = this.spacing;
    const { duration, easing } = this.animations;
    
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
        transition: opacity ${duration.normal} ${easing.easeOut};
      }
      
      .modal-overlay.active {
        opacity: 1;
      }
      
      .modal {
        background: linear-gradient(135deg, ${background.viewport}, ${background.card});
        border: 2px solid ${border.primary};
        border-radius: 20px;
        width: 100%;
        max-width: 360px;
        max-height: 80vh;
        overflow: hidden;
        box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
        transform: scale(0.8) translateY(20px);
        transition: all ${duration.normal} ${easing.elastic};
      }
      
      .modal-overlay.active .modal {
        transform: scale(1) translateY(0);
      }
      
      .modal-header {
        padding: ${lg};
        border-bottom: 1px solid ${border.secondary};
        text-align: center;
        background: ${background.surface}40;
        backdrop-filter: blur(10px);
      }
      
      .modal-title {
        color: ${text.primary};
        font-size: 18px;
        font-weight: 700;
        margin: 0;
      }
      
      .modal-body {
        max-height: 60vh;
        overflow-y: auto;
        padding: 0;
      }
      
      .modal-content {
        padding: ${lg};
        color: ${text.secondary};
        line-height: 1.5;
      }
      
      .modal-footer {
        padding: ${lg};
        border-top: 1px solid ${border.secondary};
        display: flex;
        gap: ${md};
        justify-content: center;
        background: ${background.surface}20;
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
        transition: all ${duration.normal} ${easing.easeOut};
        min-width: 100px;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }
      
      .modal-button.primary {
        background: ${interactive.primary};
        color: ${text.primary};
        box-shadow: 0 6px 20px ${this.colors.brand.accent}40;
      }
      
      .modal-button.primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px ${this.colors.brand.accent}60;
      }
      
      .modal-button.secondary {
        background: ${interactive.hover};
        color: ${text.primary};
        border: 1px solid ${border.secondary};
      }
      
      .modal-button.secondary:hover {
        background: ${interactive.hover};
        border-color: ${border.primary};
      }
      
      .modal-button:active {
        transform: translateY(0) scale(0.95);
      }
      
      /* Alert Modal Styles */
      .modal.alert .modal-content {
        text-align: center;
        padding: ${lg} ${lg} 0;
      }
      
      .modal.confirm .modal-content {
        text-align: center;
        padding: ${lg};
      }
      
      /* Loading Modal Styles */
      .modal.loading .modal-content {
        text-align: center;
        padding: 40px ${lg};
      }
      
      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid ${border.primary};
        border-top: 4px solid ${this.colors.brand.primary};
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
      }
      
      /* Toast Notifications */
      .toast {
        position: fixed;
        top: 70px;
        left: 50%;
        transform: translateX(-50%);
        background: ${background.surface}f0;
        backdrop-filter: blur(15px);
        border: 2px solid ${border.primary};
        border-radius: 12px;
        padding: ${md} ${lg};
        color: ${text.primary};
        font-weight: 600;
        font-size: 14px;
        z-index: 3000;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        opacity: 0;
        transform: translateX(-50%) translateY(-10px);
        transition: all ${duration.normal} ${easing.easeOut};
        max-width: 90%;
        text-align: center;
      }
      
      .toast.active {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
      
      .toast.success {
        border-color: ${this.colors.status.online};
        color: ${this.colors.status.online};
      }
      
      .toast.warning {
        border-color: ${this.colors.brand.warning};
        color: ${this.colors.brand.warning};
      }
      
      .toast.error {
        border-color: ${this.colors.brand.danger};
        color: ${this.colors.brand.danger};
      }
    `;
  }

  /**
   * Get CSS for specific quality level (performance optimization)
   */
  static getCSSForQuality(qualityLevel = 'medium') {
    const baseCSS = this.getResetStyles() + this.getMobileViewportStyles() + this.getTypographyStyles() + this.getComponentStyles() + this.getLayoutStyles();
    
    switch (qualityLevel) {
      case 'high':
        return baseCSS + this.getBackgroundAnimationStyles() + this.getInteractionStyles() + this.getAnimationKeyframes() + this.getUtilityClasses() + this.getResponsiveStyles();
      
      case 'medium':
        return baseCSS + this.getInteractionStyles() + this.getUtilityClasses() + this.getResponsiveStyles();
      
      case 'low':
        return baseCSS + this.getUtilityClasses();
      
      default:
        return this.getCSS();
    }
  }

  /**
   * Generate CSS custom properties for dynamic theming
   */
  static getCSSCustomProperties() {
    const { colors, spacing, typography, animations } = this;
    
    let cssVars = ':root {\n';
    
    // Colors
    Object.entries(colors).forEach(([category, values]) => {
      if (typeof values === 'object') {
        Object.entries(values).forEach(([key, value]) => {
          cssVars += `  --color-${category}-${key}: ${value};\n`;
        });
      } else {
        cssVars += `  --color-${category}: ${values};\n`;
      }
    });
    
    // Spacing
    Object.entries(spacing).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          cssVars += `  --spacing-${key}-${subKey}: ${subValue};\n`;
        });
      } else {
        cssVars += `  --spacing-${key}: ${value};\n`;
      }
    });
    
    // Typography
    Object.entries(typography).forEach(([category, values]) => {
      Object.entries(values).forEach(([key, value]) => {
        cssVars += `  --${category}-${key}: ${value};\n`;
      });
    });
    
    // Animations
    Object.entries(animations).forEach(([category, values]) => {
      Object.entries(values).forEach(([key, value]) => {
        cssVars += `  --animation-${category}-${key}: ${value};\n`;
      });
    });
    
    cssVars += '}\n';
    return cssVars;
  }

  /**
   * Validate CSS output (development helper)
   */
  static validateCSS() {
    try {
      const css = this.getCSS();
      
      // Basic validation checks
      const checks = {
        hasResetStyles: css.includes('box-sizing: border-box'),
        hasMobileViewport: css.includes('.mobile-viewport'),
        hasAnimations: css.includes('@keyframes'),
        hasResponsive: css.includes('@media'),
        hasComponents: css.includes('.battle-tab'),
        hasUtilities: css.includes('.flex')
      };
      
      const passed = Object.values(checks).filter(Boolean).length;
      const total = Object.keys(checks).length;
      
      console.log(`🎨 CSS Validation: ${passed}/${total} checks passed`, checks);
      
      return {
        isValid: passed === total,
        checks,
        cssLength: css.length,
        estimatedGzipSize: Math.round(css.length * 0.3) // Rough estimate
      };
    } catch (error) {
      console.error('❌ CSS Validation failed:', error);
      return { isValid: false, error: error.message };
    }
  }

  /**
   * Get CSS stats for performance monitoring
   */
  static getCSSStats() {
    const css = this.getCSS();
    
    return {
      totalSize: css.length,
      estimatedGzipSize: Math.round(css.length * 0.3),
      ruleCount: (css.match(/\{/g) || []).length,
      selectorCount: (css.match(/[^{}]+\{/g) || []).length,
      animationCount: (css.match(/@keyframes/g) || []).length,
      mediaQueryCount: (css.match(/@media/g) || []).length,
      customPropertyCount: (css.match(/--[\w-]+:/g) || []).length,
      colorCount: this.flattenObject(this.colors).length,
      spacingCount: this.flattenObject(this.spacing).length
    };
  }

  /**
   * Helper to flatten nested objects for counting
   */
  static flattenObject(obj, prefix = '') {
    let result = [];
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        result = result.concat(this.flattenObject(obj[key], prefix + key + '.'));
      } else {
        result.push(prefix + key);
      }
    }
    return result;
  }

  /**
   * Generate CSS for specific components only (tree-shaking)
   */
  static getComponentOnlyCSS(components = []) {
    let css = this.getResetStyles();
    
    if (components.includes('viewport')) {
      css += this.getMobileViewportStyles();
    }
    
    if (components.includes('background')) {
      css += this.getBackgroundAnimationStyles();
    }
    
    if (components.includes('typography')) {
      css += this.getTypographyStyles();
    }
    
    if (components.includes('components')) {
      css += this.getComponentStyles();
    }
    
    if (components.includes('layout')) {
      css += this.getLayoutStyles();
    }
    
    if (components.includes('interactions')) {
      css += this.getInteractionStyles();
    }
    
    if (components.includes('animations')) {
      css += this.getAnimationKeyframes();
    }
    
    if (components.includes('utilities')) {
      css += this.getUtilityClasses();
    }
    
    if (components.includes('responsive')) {
      css += this.getResponsiveStyles();
    }
    
    return css;
  }

  /**
   * Generate minified CSS for production
   */
  static getMinifiedCSS() {
    return this.getCSS()
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s{2,}/g, ' ')          // Multiple spaces to single
      .replace(/\n/g, '')               // Remove line breaks
      .replace(/;\s}/g, '}')            // Remove last semicolon before }
      .replace(/\s{/g, '{')             // Remove space before {
      .replace(/}\s/g, '}')             // Remove space after }
      .replace(/:\s/g, ':')             // Remove space after :
      .replace(/,\s/g, ',')             // Remove space after ,
      .trim();
  }

  /**
   * Development mode CSS with helpful comments
   */
  static getDevCSS() {
    const timestamp = new Date().toISOString();
    const stats = this.getCSSStats();
    
    return `
/* ================================
   CLASH ROYALE MOBILE STYLES
   Generated: ${timestamp}
   Total Size: ${(stats.totalSize / 1024).toFixed(1)}KB
   Rules: ${stats.ruleCount}
   ================================ */

${this.getCSS()}

/* ================================
   END CLASH ROYALE MOBILE STYLES
   ================================ */
    `.trim();
  }

  /**
   * Export for different build environments
   */
  static getBuildCSS(environment = 'development') {
    switch (environment) {
      case 'production':
        return this.getMinifiedCSS();
      case 'development':
        return this.getDevCSS();
      case 'testing':
        return this.getCSS();
      default:
        return this.getCSS();
    }
  }

  /**
   * Inject CSS into document head
   */
  static injectCSS(id = 'clash-menu-styles', environment = 'development') {
    // Remove existing styles
    const existingStyle = document.getElementById(id);
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Create and inject new styles
    const styleSheet = document.createElement('style');
    styleSheet.id = id;
    styleSheet.type = 'text/css';
    styleSheet.textContent = this.getBuildCSS(environment);
    
    document.head.appendChild(styleSheet);
    
    console.log(`🎨 Clash Menu styles injected (${environment} mode)`);
    return styleSheet;
  }

  /**
   * Remove CSS from document
   */
  static removeCSS(id = 'clash-menu-styles') {
    const existingStyle = document.getElementById(id);
    if (existingStyle) {
      existingStyle.remove();
      console.log('🗑️ Clash Menu styles removed');
      return true;
    }
    return false;
  }

  /**
   * Update CSS custom properties dynamically
   */
  static updateTheme(newColors = {}) {
    const root = document.documentElement;
    
    Object.entries(newColors).forEach(([category, colors]) => {
      if (typeof colors === 'object') {
        Object.entries(colors).forEach(([key, value]) => {
          root.style.setProperty(`--color-${category}-${key}`, value);
        });
      }
    });
    
    console.log('🎨 Theme colors updated dynamically');
  }

  /**
   * Debug helper - highlight all interactive elements
   */
  static debugInteractiveElements() {
    const debugCSS = `
      .tab-button { outline: 2px dashed red !important; }
      .battle-button { outline: 2px dashed blue !important; }
      .battle-mode-card { outline: 2px dashed green !important; }
      .modal-button { outline: 2px dashed orange !important; }
      [role="button"], button, [onclick] { outline: 2px dashed purple !important; }
    `;
    
    const debugStyle = document.createElement('style');
    debugStyle.id = 'clash-debug-interactions';
    debugStyle.textContent = debugCSS;
    document.head.appendChild(debugStyle);
    
    console.log('🔍 Interactive elements highlighted for debugging');
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      const style = document.getElementById('clash-debug-interactions');
      if (style) style.remove();
    }, 10000);
  }

  /**
   * Performance test - measure CSS injection time
   */
  static measurePerformance() {
    const startTime = performance.now();
    
    this.injectCSS('performance-test');
    
    const endTime = performance.now();
    const injectionTime = endTime - startTime;
    
    // Clean up
    this.removeCSS('performance-test');
    
    const stats = this.getCSSStats();
    
    console.log('📊 CSS Performance Report:', {
      injectionTime: `${injectionTime.toFixed(2)}ms`,
      ...stats
    });
    
    return {
      injectionTime,
      ...stats
    };
  }
}

export default ClashMenuStyles;/**
 * Clash Menu Styles - Mobile-First CSS System
 * Responsive design system optimized for mobile portrait (375x812)
 * with animated background and fixed viewport architecture
 */
class ClashMenuStyles {
  
  /**
   * Mobile-first color system inspired by Clash Royale
   */
  static get colors() {
    return {
      // Primary brand colors
      brand: {
        primary: '#4a90e2',
        secondary: '#357abd', 
        accent: '#2ecc71',
        warning: '#f39c12',
        danger: '#e74c3c',
        gold: '#ffd700'
      },
      
      // Background system for mobile viewport
      background: {
        app: '#0a0e1a',           // Outer app background
        viewport: '#1a1a2e',      // Mobile viewport background
        card: '#16213e',          // Card backgrounds
        overlay: '#0f3460',       // Modal overlays
        surface: '#1e2746'        // Surface elements
      },
      
      // Text hierarchy
      text: {
        primary: '#ffffff',       // Main text
        secondary: '#e0e0e0',     // Secondary text
        muted: '#a0a0a0',        // Muted text
        accent: '#4a90e2',       // Accent text
        gold: '#ffd700',         // Gold text (trophies)
        green: '#2ecc71',        // Success/wins
        red: '#e74c3c'           // Error/losses
      },
      
      // Interactive elements
      interactive: {
        primary: 'linear-gradient(135deg, #2ecc71, #27ae60)',
        secondary: 'linear-gradient(135deg, #4a90e2, #357abd)',
        tertiary: 'linear-gradient(135deg, #f39c12, #e67e22)',
        danger: 'linear-gradient(135deg, #e74c3c, #c0392b)',
        disabled: 'rgba(255, 255, 255, 0.1)',
        hover: 'rgba(255, 255, 255, 0.2)'
      },
      
      // Border and shadow colors
      border: {
        primary: 'rgba(74, 144, 226, 0.3)',
        secondary: 'rgba(255, 255, 255, 0.1)',
        accent: 'rgba(46, 204, 113, 0.3)',
        glow: 'rgba(74, 144, 226, 0.6)'
      },
      
      // Status colors
      status: {
        online: '#2ecc71',
        offline: '#e74c3c',
        connecting: '#f39c12',
        searching: '#00e5ff'
      }
    };
  }

  /**
   * Mobile-responsive spacing system
   */
  static get spacing() {
    return {
      // Base spacing units (mobile-first)
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      xxl: '48px',
      
      // Component-specific spacing
      component: {
        cardPadding: '20px',
        buttonPadding: '16px 24px',
        sectionGap: '24px',
        elementGap: '12px'
      },
      
      // Layout spacing
      layout: {
        statusBarHeight: '44px',
        tabBarHeight: '80px',
        safeAreaTop: '44px',
        safeAreaBottom: '34px'
      }
    };
  }

  /**
   * Typography system optimized for mobile
   */
  static get typography() {
    return {
      // Font stacks
      fonts: {
        primary: "'Rajdhani', 'Arial', sans-serif",
        secondary: "'Orbitron', 'Arial', sans-serif",
        mono: "'Fira Code', 'Monaco', monospace"
      },
      
      // Mobile-optimized font sizes
      sizes: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '28px',
        '4xl': '32px',
        '5xl': '36px',
        '6xl': '48px'
      },
      
      // Font weights
      weights: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        black: '900'
      },
      
      // Line heights
      lineHeights: {
        tight: '1.2',
        snug: '1.4',
        normal: '1.5',
        relaxed: '1.6',
        loose: '1.8'
      }
    };
  }

  /**
   * Animation system for mobile performance
   */
  static get animations() {
    return {
      // Durations (mobile-optimized)
      duration: {
        instant: '0.05s',
        fast: '0.15s',
        normal: '0.3s',
        slow: '0.6s',
        slower: '1s'
      },
      
      // Easing curves
      easing: {
        linear: 'linear',
        ease: 'ease',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        elastic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        bounce: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)'
      },
      
      // Transform origins
      origin: {
        center: 'center',
        top: 'top',
        bottom: 'bottom',
        left: 'left',
        right: 'right'
      }
    };
  }

  /**
   * Mobile breakpoints
   */
  static get breakpoints() {
    return {
      mobile: '425px',
      tablet: '768px',
      desktop: '1024px',
      wide: '1440px'
    };
  }

  /**
   * Generate complete CSS for mobile-first Clash Menu
   */
  static getCSS() {
    return `
      ${this.getResetStyles()}
      ${this.getMobileViewportStyles()}
      ${this.getBackgroundAnimationStyles()}
      ${this.getTypographyStyles()}
      ${this.getComponentStyles()}
      ${this.getLayoutStyles()}
      ${this.getInteractionStyles()}
      ${this.getAnimationKeyframes()}
      ${this.getUtilityClasses()}
      ${this.getResponsiveStyles()}
    `;
  }

  /**
   * Reset and base styles
   */
  static getResetStyles() {
    return `
      /* Mobile-First Reset */
      *, *::before, *::after {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      html {
        font-size: 16px;
        -webkit-text-size-adjust: 100%;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      body {
        font-family: ${this.typography.fonts.primary};
        line-height: ${this.typography.lineHeights.normal};
        color: ${this.colors.text.primary};
        background: ${this.colors.background.app};
        overflow: hidden;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
      }
      
      /* Remove default button styles */
      button {
        background: none;
        border: none;
        padding: 0;
        font: inherit;
        color: inherit;
        cursor: pointer;
        outline: none;
      }
      
      /* Remove default input styles */
      input, select, textarea {
        font: inherit;
        color: inherit;
        background: transparent;
        border: none;
        outline: none;
      }
    `;
  }

  /**
   * Mobile viewport system with animated background
   */
  static getMobileViewportStyles() {
    const { background, border } = this.colors;
    const { layout } = this.spacing;
    
    return `
      /* App Container with Animated Background */
      .app-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, 
          ${background.viewport} 0%, 
          ${background.card} 35%, 
          ${background.overlay} 70%, 
          ${background.viewport} 100%);
        background-size: 400% 400%;
        animation: backgroundFlow 20s ease-in-out infinite;
        overflow: hidden;
      }
      
      /* Background Particles System */
      .background-particles {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: hidden;
        z-index: 1;
      }
      
      .particle {
        position: absolute;
        background: ${border.primary};
        border-radius: 50%;
        pointer-events: none;
        filter: blur(1px);
        animation: particleFloat 6s ease-in-out infinite, 
                   particleDrift 8s ease-in-out infinite alternate;
      }
      
      /* Mobile Viewport (Fixed Container) */
      .mobile-viewport {
        position: relative;
        width: 375px;
        height: 812px;
        max-width: 100vw;
        max-height: 100vh;
        background: linear-gradient(180deg, 
          ${background.viewport} 0%, 
          ${background.card} 50%, 
          ${background.overlay} 100%);
        border-radius: 25px;
        box-shadow: 
          0 0 60px ${border.glow}50,
          0 0 120px ${border.glow}20,
          inset 0 0 40px rgba(0, 0, 0, 0.3);
        overflow: hidden;
        border: 2px solid ${border.primary};
        z-index: 10;
      }
      
      /* Animated Border Glow */
      .mobile-viewport::before {
        content: '';
        position: absolute;
        top: -3px;
        left: -3px;
        right: -3px;
        bottom: -3px;
        background: linear-gradient(45deg, 
          transparent 0%, 
          ${border.glow} 25%, 
          transparent 50%, 
          ${this.colors.status.online}40 75%, 
          transparent 100%);
        border-radius: 28px;
        z-index: -1;
        animation: borderPulse 3s ease-in-out infinite alternate;
      }
      
      /* Canvas Container */
      .game-canvas {
        position: absolute;
        top: ${layout.statusBarHeight};
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 0 0 23px 23px;
        background: ${background.viewport};
        z-index: 5;
      }
    `;
  }

  /**
   * Background animation styles
   */
  static getBackgroundAnimationStyles() {
    return `
      /* Background Flow Animation */
      @keyframes backgroundFlow {
        0%, 100% { 
          background-position: 0% 50%; 
          filter: hue-rotate(0deg);
        }
        25% { 
          background-position: 100% 50%; 
          filter: hue-rotate(15deg);
        }
        50% { 
          background-position: 100% 100%; 
          filter: hue-rotate(30deg);
        }
        75% { 
          background-position: 0% 100%; 
          filter: hue-rotate(15deg);
        }
      }
      
      /* Border Pulse Animation */
      @keyframes borderPulse {
        0% { 
          opacity: 0.4; 
          transform: scale(1); 
        }
        100% { 
          opacity: 0.8; 
          transform: scale(1.02); 
        }
      }
      
      /* Particle Animations */
      @keyframes particleFloat {
        0%, 100% {
          transform: translateY(0px) rotate(0deg);
          opacity: 0.1;
        }
        50% {
          transform: translateY(-30px) rotate(180deg);
          opacity: 0.3;
        }
      }
      
      @keyframes particleDrift {
        0% { transform: translateX(-20px); }
        100% { transform: translateX(20px); }
      }
    `;
  }

  /**
   * Typography styles
   */
  static getTypographyStyles() {
    const { fonts, sizes, weights, lineHeights } = this.typography;
    const { text } = this.colors;
    
    return `
      /* Typography System */
      .text-xs { font-size: ${sizes.xs}; }
      .text-sm { font-size: ${sizes.sm}; }
      .text-base { font-size: ${sizes.base}; }
      .text-lg { font-size: ${sizes.lg}; }
      .text-xl { font-size: ${sizes.xl}; }
      .text-2xl { font-size: ${sizes['2xl']}; }
      .text-3xl { font-size: ${sizes['3xl']}; }
      .text-4xl { font-size: ${sizes['4xl']}; }
      .text-5xl { font-size: ${sizes['5xl']}; }
      .text-6xl { font-size: ${sizes['6xl']}; }
      
      .font-light { font-weight: ${weights.light}; }
      .font-normal { font-weight: ${weights.normal}; }
      .font-medium { font-weight: ${weights.medium}; }
      .font-semibold { font-weight: ${weights.semibold}; }
      .font-bold { font-weight: ${weights.bold}; }
      .font-black { font-weight: ${weights.black}; }
      
      .font-primary { font-family: ${fonts.primary}; }
      .font-secondary { font-family: ${fonts.secondary}; }
      .font-mono { font-family: ${fonts.mono}; }
      
      .text-primary { color: ${text.primary}; }
      .text-secondary { color: ${text.secondary}; }
      .text-muted { color: ${text.muted}; }
      .text-accent { color: ${text.accent}; }
      .text-gold { color: ${text.gold}; }
      .text-green { color: ${text.green}; }
      .text-red { color: ${text.red}; }
      
      .text-center { text-align: center; }
      .text-left { text-align: left; }
      .text-right { text-align: right; }
      
      .uppercase { text-transform: uppercase; }
      .lowercase { text-transform: lowercase; }
      .capitalize { text-transform: capitalize; }
      
      .leading-tight { line-height: ${lineHeights.tight}; }
      .leading-snug { line-height: ${lineHeights.snug}; }
      .leading-normal { line-height: ${lineHeights.normal}; }
      .leading-relaxed { line-height: ${lineHeights.relaxed}; }
      .leading-loose { line-height: ${lineHeights.loose}; }
      
      .tracking-tight { letter-spacing: -0.05em; }
      .tracking-normal { letter-spacing: 0; }
      .tracking-wide { letter-spacing: 0.05em; }
      .tracking-wider { letter-spacing: 0.1em; }
      .tracking-widest { letter-spacing: 0.25em; }
    `;
  }

  /**
   * Component styles for Clash Menu system
   */
  static getComponentStyles() {
    const { background, text, border, interactive, status } = this.colors;
    const { component, md, lg } = this.spacing;
    const { duration, easing } = this.animations;
    
    return `
      /* =================
         CLASH MENU SYSTEM
         ================= */
      
      .clash-menu-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
        display: none;
      }
      
      .clash-menu-container.active {
        display: block;
      }
      
      /* Status Bar Simulation */
      .mobile-status-bar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 44px;
        background: rgba(26, 26, 46, 0.9);
        backdrop-filter: blur(10px);
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 20px;
        z-index: 1001;
        font-size: 14px;
        font-weight: 600;
        color: ${text.primary};
      }
      
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
        padding: 0 ${md};
        box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.3);
        border-top: 1px solid ${border.secondary};
        z-index: 1000;
      }
      
      .tab-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 10px 16px;
        background: transparent;
        border: none;
        color: ${text.muted};
        cursor: pointer;
        transition: all ${duration.normal} ${easing.easeOut};
        border-radius: 12px;
        min-width: 60px;
        position: relative;
        overflow: hidden;
      }
      
      .tab-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: ${interactive.hover};
        opacity: 0;
        transition: opacity ${duration.fast} ${easing.easeOut};
        border-radius: inherit;
      }
      
      .tab-button:hover::before {
        opacity: 1;
      }
      
      .tab-button.active {
        color: ${text.accent};
        background: ${border.primary}20;
        transform: translateY(-3px);
      }
      
      .tab-button.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
      }
      
      .tab-icon {
        font-size: 24px;
        margin-bottom: 4px;
        transition: transform ${duration.normal} ${easing.elastic};
      }
      
      .tab-button.active .tab-icon {
        transform: scale(1.1);
      }
      
      .tab-label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .tab-coming-soon {
        font-size: 9px;
        color: ${this.colors.brand.warning};
        margin-top: 2px;
      }
      
      .tab-badge {
        position: absolute;
        top: 8px;
        right: 12px;
        background: ${this.colors.brand.danger};
        color: ${text.primary};
        border-radius: 10px;
        min-width: 18px;
        height: 18px;
        font-size: 10px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid ${background.viewport};
        animation: badgeBounce 0.5s ${easing.bounce};
      }
      
      /* =================
         BATTLE TAB
         ================= */
      
      .battle-tab {
        position: fixed;
        top: 44px;
        left: 0;
        right: 0;
        bottom: 80px;
        padding: ${lg};
        overflow-y: auto;
        display: none;
        background: transparent;
      }
      
      .battle-tab.active {
        display: block;
      }
      
      /* Battle Header */
      .battle-header {
        text-align: center;
        margin-bottom: ${this.spacing.xl};
        padding: 24px ${lg};
        background: ${background.card}cc;
        border-radius: 20px;
        backdrop-filter: blur(15px);
        border: 2px solid ${border.primary};
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }
      
      .player-name {
        font-size: 28px;
        font-weight: 700;
        color: ${text.accent};
        margin-bottom: 12px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
      }
      
      .player-stats {
        display: flex;
        justify-content: center;
        gap: ${this.spacing.xl};
        margin-top: ${lg};
      }
      
      .stat-item {
        text-align: center;
      }
      
      .stat-value {
        font-size: 24px;
        font-weight: 700;
        color: ${text.primary};
        display: block;
        margin-bottom: 4px;
      }
      
      .stat-label {
        font-size: 12px;
        color: ${text.accent};
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 600;
      }
      
      /* Connection Status */
      .connection-status {
        text-align: center;
        padding: ${md};
        margin-bottom: ${lg};
        border-radius: 12px;
        font-weight: 600;
        font-size: 14px;
        transition: all ${duration.normal} ${easing.easeOut};
        display: flex;
        align-items: center;
        justify-content: center;
        gap: ${this.spacing.sm};
      }
      
      .connection-status.connected {
        background: ${status.online}22;
        color: ${status.online};
        border: 2px solid ${status.online}44;
      }
      
      .connection-status.connecting {
        background: ${status.connecting}22;
        color: ${status.connecting};
        border: 2px solid ${status.connecting}44;
      }
      
      .connection-status.error {
        background: ${this.colors.brand.danger}22;
        color: ${this.colors.brand.danger};
        border: 2px solid ${this.colors.brand.danger}44;
      }
      
      .connection-status.searching {
        background: ${status.searching}22;
        color: ${status.searching};
        border: 2px solid ${status.searching}44;
        animation: statusPulse 1.5s ease-in-out infinite;
      }
      
      .connection-status::before {
        content: '';
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
        box-shadow: 0 0 8px currentColor;
      }
      
      /* Battle Buttons */
      .battle-buttons {
        display: flex;
        flex-direction: column;
        gap: ${md};
        max-width: 350px;
        margin: 0 auto ${this.spacing.xl};
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
        transition: all ${duration.normal} ${easing.elastic};
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: ${this.spacing.sm};
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
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
        transition: left 0.5s ${easing.easeOut};
      }
      
      .battle-button:active {
        transform: translateY(1px) scale(0.98);
      }
      
      .battle-button:not(:disabled):hover::before {
        left: 100%;
      }
      
      .battle-button.primary {
        background: ${interactive.primary};
        color: ${text.primary};
        box-shadow: 0 8px 24px ${this.colors.brand.accent}44;
      }
      
      .battle-button.primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 32px ${this.colors.brand.accent}66;
      }
      
      .battle-button.secondary {
        background: ${interactive.secondary};
        color: ${text.primary};
        box-shadow: 0 8px 24px ${this.colors.brand.primary}44;
      }
      
      .battle-button.secondary:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 32px ${this.colors.brand.primary}66;
      }
      
      .battle-button.tertiary {
        background: ${interactive.tertiary};
        color: ${text.primary};
        box-shadow: 0 8px 24px ${this.colors.brand.warning}44;
      }
      
      .battle-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none !important;
        pointer-events: none;
      }
      
      /* Battle Modes */
      .battle-modes {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: ${md};
        margin-top: ${lg};
      }
      
      .battle-mode-card {
        background: ${background.card}aa;
        border: 2px solid ${border.secondary};
        border-radius: 16px;
        padding: ${lg};
        text-align: center;
        cursor: pointer;
        transition: all ${duration.normal} ${easing.easeOut};
        backdrop-filter: blur(10px);
        position: relative;
        overflow: hidden;
      }
      
      .battle-mode-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: ${interactive.hover};
        opacity: 0;
        transition: opacity ${duration.normal} ${easing.easeOut};
      }
      
      .battle-mode-card:hover {
        border-color: ${border.primary};
        transform: translateY(-4px);
        box-shadow: 0 12px 40px rgba(74, 144, 226, 0.2);
      }
      
      .battle-mode-card:hover::before {
        opacity: 1;
      }
      
      .battle-mode-card.disabled {
        opacity: 0.6;
        cursor: not-allowed;
        pointer-events: none;
      }
      
      .battle-mode-icon {
        font-size: 36px;
        margin-bottom: ${md};
        display: block;
        transition: transform ${duration.normal} ${easing.elastic};
      }
      
      .battle-mode-card:hover .battle-mode-icon {
        transform: scale(1.1) rotate(5deg);
      }
      
      .battle-mode-title {
        color: ${text.primary};
        font-weight: 700;
        font-size: 16px;
        margin-bottom: ${this.spacing.sm};
        position: relative;
        z-index: 1;
      }
      
      .battle-mode-desc {
        color: ${text.accent};
        font-size: 12px;
        line-height: ${this.typography.lineHeights.relaxed};
        position: relative;
        z-index: 1;
      }
    `;
  }

  /**
   * Layout utility styles
   */
  static getLayoutStyles() {
    const { xs, sm, md, lg, xl, xxl } = this.spacing;
    
    return `
      /* =================
         LAYOUT UTILITIES
         ================= */
      
      .container {
        width: 100%;
        max-width: 375px;
        margin: 0 auto;
        padding: 0 ${md};
      }
      
      .flex { display: flex; }
      .inline-flex { display: inline-flex; }
      .grid { display: grid; }
      .block { display: block; }
      .inline-block { display: inline-block; }
      .hidden { display: none !important; }
      
      .flex-row { flex-direction: row; }
      .flex-col { flex-direction: column; }
      .flex-wrap { flex-wrap: wrap; }
      .flex-nowrap { flex-wrap: nowrap; }
      
      .items-start { align-items: flex-start; }
      .items-center { align-items: center; }
      .items-end { align-items: flex-end; }
      .items-stretch { align-items: stretch; }
      
      .justify-start { justify-content: flex-start; }
      .justify-center { justify-content: center; }
      .justify-end { justify-content: flex-end; }
      .justify-between { justify-content: space-between; }
      .justify-around { justify-content: space-around; }
      .justify-evenly { justify-content: space-evenly; }
      
      .flex-1 { flex: 1; }
      .flex-auto { flex: auto; }
      .flex-none { flex: none; }
      .flex-shrink-0 { flex-shrink: 0; }
      .flex-grow { flex-grow: 1; }
      
      /* Spacing Utilities */
      .p-0 { padding: 0; }
      .p-xs { padding: ${xs}; }
      .p-sm { padding: ${sm}; }
      .p-md { padding: ${md}; }
      .p-lg { padding: ${lg}; }
      .p-xl { padding: ${xl}; }
      .p-xxl { padding: ${xxl}; }
      
      .px-xs { padding-left: ${xs}; padding-right: ${xs}; }
      .px-sm { padding-left: ${sm}; padding-right: ${sm}; }
      .px-md { padding-left: ${md}; padding-right: ${md}; }
      .px-lg { padding-left: ${lg}; padding-right: ${lg}; }
      
      .py-xs { padding-top: ${xs}; padding-bottom: ${xs}; }
      .py-sm { padding-top: ${sm}; padding-bottom: ${sm}; }
      .py-md { padding-top: ${md}; padding-bottom: ${md}; }
      .py-lg { padding-top: ${lg}; padding-bottom: ${lg}; }
      
      .m-0 { margin: 0; }
      .m-xs { margin: ${xs}; }
      .m-sm { margin: ${sm}; }
      .m-md { margin: ${md}; }
      .m-lg { margin: ${lg}; }
      .m-auto { margin: auto; }
      
      .mx-auto { margin-left: auto; margin-right: auto; }
      .my-auto { margin-top: auto; margin-bottom: auto; }
      
      .gap-xs { gap: ${xs}; }
      .gap-sm { gap: ${sm}; }
      .gap-md { gap: ${md}; }
      .gap-lg { gap: ${lg}; }
      .gap-xl { gap: ${xl}; }
      
      /* Position Utilities */
      .relative { position: relative; }
      .absolute { position: absolute; }
      .fixed { position: fixed; }
      .sticky { position: sticky; }
      
      .top-0 { top: 0; }
      .right-0 { right: 0; }
      .bottom-0 { bottom: 0; }
      .left-0 { left: 0; }
      
      .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
      
      /* Z-index */
      .z-0 { z-index: 0; }
      .z-10 { z-index: 10; }
      .z-20 { z-index: 20; }
      .z-30 { z-index: 30; }
      .z-40 { z-index: 40; }
      .z-50 { z-index: 50; }
      
      /* Width & Height */
      .w-full { width: 100%; }
      .w-auto { width: auto; }
      .h-full { height: 100%; }
      .h-auto { height: auto; }
      .h-screen { height: 100vh; }
      
      .max-w-xs { max-width: 320px; }
      .max-w-sm { max-width: 375px; }
      .max-w-md { max-width: 425px; }
      .max-w-lg { max-width: 512px; }
      
      /* Border Radius */
      .rounded-none { border-radius: 0; }
      .rounded-sm { border-radius: 4px; }
      .rounded { border-radius: 8px; }
      .rounded-md { border-radius: 12px; }
      .rounded-lg { border-radius: 16px; }
      .rounded-xl { border-radius: 20px; }
      .rounded-2xl { border-radius: 24px; }
      .rounded-full { border-radius: 9999px; }
      
      /* Overflow */
      .overflow-hidden { overflow: hidden; }
      .overflow-visible { overflow: visible; }
      .overflow-scroll { overflow: scroll; }
      .overflow-auto { overflow: auto; }
      
      .overflow-x-hidden { overflow-x: hidden; }
      .overflow-y-hidden { overflow-y: hidden; }
      .overflow-x-scroll { overflow-x: scroll; }
      .overflow-y-scroll { overflow-y: scroll; }
    `;
  }

  /**
   * Get CSS method end - close the getLayoutStyles method
   */
  // Continue with the rest of the methods...

}

export default ClashMenuStyles;
