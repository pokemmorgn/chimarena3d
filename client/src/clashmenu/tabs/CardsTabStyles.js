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
        padding: 20px;
        /* Onglet vide, prêt pour le contenu */
      }

      /* Responsive */
      @media (max-width: 425px) {
        .cards-tab {
          top: 50px;
          height: calc(100% - 120px);
        }

        .cards-main-content {
          padding: 15px;
        }
      }
    `;
  }
}

export default CardsTabStyles;
