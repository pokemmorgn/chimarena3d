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
        justify-content: center;
      }

      .deck-slot {
        width: 80px;
        height: 106px; /* ratio 3:4 */
        border: 2px solid #444;
        border-radius: 8px;
        background: #222;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        position: relative;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
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
        object-fit: contain;
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

      /* === Mes cartes === */
      .my-cards-section {
        margin-top: 20px;
      }

      .my-cards-section h2 {
        margin: 0 0 10px 0;
        font-size: 18px;
        color: #2ecc71;
        text-align: center;
      }

      .my-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        gap: 10px;
        max-height: 200px;
        overflow-y: auto;
        padding: 10px;
        background: rgba(46,204,113,0.1);
        border-radius: 8px;
        border: 1px solid rgba(46,204,113,0.3);
        justify-content: center;
      }

      .my-card {
        width: 80px;
        height: 106px;
        background: #222;
        border: 2px solid #2ecc71;
        border-radius: 8px;
        text-align: center;
        padding: 5px;
        cursor: grab;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        position: relative;
      }

      .my-card img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: 4px;
      }

      .my-card-info {
        font-size: 10px;
        color: #ccc;
        display: flex;
        flex-direction: column;
        gap: 1px;
      }

      .my-card-fallback {
        width: 100%;
        height: 100%;
        background: repeating-linear-gradient(45deg, #2ecc71, #2ecc71 10px, #27ae60 10px, #27ae60 20px);
        border-radius: 6px;
        color: #fff;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 10px;
      }

      /* === Collection / Toutes les cartes === */
      .collection-grid,
      .all-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, 80px);
        gap: 10px;
        justify-content: center;
      }

      .collection-card,
      .game-card {
        width: 80px;
        height: 106px;
        background: #222;
        border: 2px solid #444;
        border-radius: 8px;
        text-align: center;
        padding: 5px;
        cursor: pointer;
        position: relative;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .collection-card img,
      .game-card img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: 4px;
      }

      .collection-card.locked,
      .game-card.not-owned {
        filter: grayscale(100%) brightness(0.5);
      }

      .collection-card.locked::after,
      .game-card.not-owned::after {
        content: "🔒";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 20px;
        color: #aaa;
      }

      /* Notifications */
      .deck-notification {
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }

      .deck-notification.success { background: #2ecc71; }
      .deck-notification.error { background: #e74c3c; }
      .deck-notification.warning { background: #f39c12; }
      .deck-notification.info { background: #3498db; }

      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }

      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
  }
}

export default CardsTabStyles;
