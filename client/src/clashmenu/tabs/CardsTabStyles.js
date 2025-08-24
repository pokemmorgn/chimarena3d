/**
 * Cards Tab Styles - CSS pour l'onglet des cartes
 * Style minimaliste, le Header.js gère déjà son propre style
 */
class CardsTabStyles {
  static get colors() {
    return {
      white: '#ffffff',
      gold: '#ffd700',
      darkBlue: '#0f1419',
      royalBlue: '#1a237e',
      neonBlue: '#00bcd4',
      gray: '#9e9e9e'
    };
  }

  static getCSS() {
    return this.getCardsTabStyles();
  }

  static getCardsTabStyles() {
    const { white, gold, darkBlue, royalBlue } = this.colors;

    return `
      /* Cards Tab Base */
      .cards-tab {
        position: absolute;
        top: 60px; /* sous le Header.js */
        left: 0;
        width: 100%;
        height: calc(100% - 140px); /* Header + Tab navigation */
        display: none;
        flex-direction: column;
      }

      .cards-tab.active {
        display: flex;
      }

      /* Contenu principal */
      .cards-main-content {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }

      /* Placeholder temporaire */
      .cards-placeholder {
        text-align: center;
        background: linear-gradient(135deg, ${royalBlue}, ${darkBlue});
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 20px;
        padding: 40px 30px;
        color: ${white};
        max-width: 300px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      }

      .cards-placeholder h2 {
        margin: 0 0 15px 0;
        font-size: 24px;
        color: ${gold};
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
      }

      .cards-placeholder p {
        margin: 0;
        font-size: 16px;
        opacity: 0.8;
        color: ${white};
      }

      /* Responsive */
      @media (max-width: 425px) {
        .cards-tab {
          top: 50px;
          height: calc(100% - 120px);
        }

        .cards-placeholder {
          padding: 30px 20px;
          margin: 10px;
        }

        .cards-placeholder h2 {
          font-size: 20px;
        }

        .cards-placeholder p {
          font-size: 14px;
        }
      }
    `;
  }
}

export default CardsTabStyles;
