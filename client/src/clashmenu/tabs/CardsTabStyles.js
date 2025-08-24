class CardsTabStyles {
  static getCSS() {
    return `
      .cards-tab {
        position: absolute;
        top: 60px;
        left: 0;
        width: 100%;
        height: calc(100% - 120px);
        display: none;
        flex-direction: column;
        background: linear-gradient(180deg, #1a1f2b, #0f1419);
        color: #fff;
        font-family: sans-serif;
        overflow-y: auto;
      }

      .cards-tab.active {
        display: flex;
      }

      .cards-tab-content {
        flex: 1;
        padding: 15px;
      }

      /* === Deck === */
      .deck-section h2 {
        margin: 0 0 10px 0;
        font-size: 20px;
        color: #ffd700;
        text-align: center;
      }

      .deck-cards {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        margin-bottom: 15px;
      }

      .deck-slot {
        width: 80px;
        height: 106px;
        border: 2px solid #444;
        border-radius: 8px;
        background: #222;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        position: relative;
      }

      .deck-card {
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: 6px;
      }

      /* === Collection === */
      .collection-section h2 {
        margin: 15px 0;
        font-size: 18px;
        color: #00bcd4;
        text-align: center;
      }

      .collection-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        gap: 10px;
      }

      .collection-card {
        width: 80px;
        height: 106px;
        background: #222;
        border: 2px solid #444;
        border-radius: 8px;
        text-align: center;
        cursor: grab;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 3px;
      }

      .collection-card img {
        width: 100%;
        height: auto;
        border-radius: 4px;
        flex-grow: 1;
      }

      .collection-info {
        font-size: 10px;
        color: #ccc;
        margin-top: 2px;
      }

      .collection-card.locked {
        filter: grayscale(100%) brightness(0.5);
        cursor: default;
      }
    `;
  }
}

export default CardsTabStyles;
