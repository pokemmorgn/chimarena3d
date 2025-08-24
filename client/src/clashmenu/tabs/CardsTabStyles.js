class CardsTabStyles {
  static get colors() {
    return {
      white: '#ffffff',
      gold: '#ffd700',
      darkBlue: '#0f1419',
      royalBlue: '#1a237e',
      neonBlue: '#00bcd4',
      gray: '#9e9e9e',
      darkGray: '#333'
    };
  }

  static getCSS() {
    return this.getCardsTabStyles();
  }

  static getCardsTabStyles() {
    const { white, gold, darkBlue, royalBlue, neonBlue, gray, darkGray } = this.colors;

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
        color: ${white};
        background: ${darkBlue};
        overflow-y: auto;
      }

      .cards-tab.active { display: flex; }

      /* Header */
      .cards-header {
        text-align: center;
        font-size: 18px;
        font-weight: bold;
        color: ${gold};
        padding: 10px;
        border-bottom: 2px solid ${royalBlue};
      }

      /* Deck actif */
      .active-deck {
        background: rgba(0,0,0,0.3);
        padding: 12px;
        border-radius: 8px;
        margin: 10px;
        text-align: center;
      }

      .deck-cards {
        display: flex;
        justify-content: center;
        gap: 6px;
      }

      .deck-slot {
        width: 60px;
        height: 80px;
        border: 2px solid ${royalBlue};
        border-radius: 6px;
        background: ${darkGray};
        overflow: hidden;
      }

      .deck-card {
        width: 100%;
        height: 100%;
        object-fit: cover;
        cursor: pointer;
      }

      .deck-elixir {
        margin-top: 6px;
        font-size: 14px;
        color: ${neonBlue};
      }

      /* Deck selector */
      .deck-selector {
        margin: 10px;
        display: flex;
        justify-content: center;
        gap: 5px;
      }

      .deck-btn {
        padding: 6px 10px;
        border-radius: 6px;
        border: none;
        background: ${royalBlue};
        color: ${white};
        cursor: pointer;
      }
      .deck-btn.active {
        background: ${neonBlue};
        font-weight: bold;
      }

      /* Collection */
      .collection-btn-wrapper {
        margin: 10px;
        text-align: center;
      }

      #btn-show-collection {
        padding: 8px 12px;
        background: ${neonBlue};
        color: ${white};
        border-radius: 6px;
        border: none;
        cursor: pointer;
      }

      .collection-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
        margin: 10px;
      }

      .collection-card {
        background: ${darkGray};
        border-radius: 6px;
        text-align: center;
        padding: 4px;
        cursor: pointer;
        position: relative;
      }

      .collection-card.locked { opacity: 0.4; }

      .collection-card img {
        width: 100%;
        border-radius: 4px;
      }

      .card-level {
        font-size: 12px;
        font-weight: bold;
        color: ${gold};
      }

      .card-count {
        font-size: 10px;
        color: ${gray};
      }

      /* Popup */
      .card-popup {
        position: fixed;
        top:0;
        left:0;
        width:100%;
        height:100%;
        background: rgba(0,0,0,0.8);
        display:flex;
        justify-content:center;
        align-items:center;
        z-index: 100;
      }

      .popup-content {
        background:${darkGray};
        padding:20px;
        border-radius:10px;
        width:250px;
        text-align:center;
      }

      .popup-img {
        width:120px;
        margin:10px auto;
        display:block;
      }

      #btn-upgrade-card {
        margin-top: 10px;
        padding: 6px 12px;
        background: ${gold};
        color: ${darkBlue};
        border:none;
        border-radius: 6px;
        cursor: pointer;
      }

      #btn-close-popup {
        margin-top: 10px;
        padding: 6px 12px;
        background: ${royalBlue};
        color: ${white};
        border:none;
        border-radius: 6px;
        cursor: pointer;
      }

      /* Responsive */
      @media (max-width: 425px) {
        .deck-slot { width: 50px; height: 70px; }
        .collection-grid { grid-template-columns: repeat(3, 1fr); }
      }
    `;
  }
}

export default CardsTabStyles;
