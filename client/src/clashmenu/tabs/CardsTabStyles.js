class CardsTabStyles {
  static getCSS() {
    return `
      /* === Cards Tab === */
      .cards-tab {
        position: absolute;
        top: 60px; /* sous le Header */
        left: 0;
        width: 100%;
        height: calc(100% - 120px); /* header + onglets bas */
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

      /* === Deck Section === */
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
        width: 100%;
        aspect-ratio: 3/4;
        border: 2px solid #444;
        border-radius: 8px;
        background: #222;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        position: relative;
        transition: transform 0.15s ease-in-out;
      }

      .deck-slot:hover {
        transform: scale(1.05);
      }

      .deck-slot.empty-slot {
        background: rgba(255,255,255,0.05);
        border: 2px dashed #555;
        font-size: 32px;
        color: #888;
      }

      .deck-card {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 6px;
      }

      .deck-level {
        position: absolute;
        bottom: 2px;
        right: 4px;
        background: rgba(0,0,0,0.6);
        color: #fff;
        font-size: 12px;
        padding: 2px 4px;
        border-radius: 4px;
      }

      .deck-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 10px;
      }

      .deck-footer span {
        font-size: 14px;
        color: #ddd;
      }

      .deck-footer button {
        background: #007bff;
        color: #fff;
        border: none;
        border-radius: 6px;
        padding: 6px 12px;
        cursor: pointer;
        font-weight: bold;
        transition: background 0.2s;
      }

      .deck-footer button:hover {
        background: #0056b3;
      }

      /* === Collection Section === */
      .collection-section h2 {
        margin: 0 0 10px 0;
        font-size: 20px;
        color: #00bcd4;
        text-align: center;
      }

      .collection-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        gap: 10px;
      }

      .collection-card {
        background: #222;
        border: 2px solid #444;
        border-radius: 8px;
        text-align: center;
        padding: 5px;
        cursor: pointer;
        transition: transform 0.15s;
        position: relative;
      }

      .collection-card:hover {
        transform: scale(1.05);
        border-color: #00bcd4;
      }

      .collection-card img {
        width: 100%;
        border-radius: 4px;
        margin-bottom: 5px;
      }

      .collection-info {
        font-size: 12px;
        color: #ccc;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      /* === Cartes verrouillées === */
      .collection-card.locked {
        filter: grayscale(100%) brightness(0.5);
        cursor: default;
      }

      .collection-card.locked::after {
        content: "🔒";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 22px;
        color: #fff;
        text-shadow: 0 0 4px #000;
      }

      .collection-section button {
        margin-top: 15px;
        width: 100%;
        background: #28a745;
        color: #fff;
        border: none;
        border-radius: 6px;
        padding: 8px 12px;
        cursor: pointer;
        font-weight: bold;
      }

      .collection-section button:hover {
        background: #1e7e34;
      }

      /* === Responsive === */
      @media (max-width: 600px) {
        .deck-cards {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `;
  }
}

export default CardsTabStyles;
