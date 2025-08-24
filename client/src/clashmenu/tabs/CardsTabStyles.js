/**
 * Cards Tab Styles - CSS pour l'onglet des cartes
 */
class CardsTabStyles {
  static getCSS() {
    return `
      /* === Base === */
      .cards-tab {
        position: absolute;
        top: 60px; /* sous le Header */
        left: 0;
        width: 100%;
        height: calc(100% - 140px); /* Header + Tab navigation */
        display: none;
        flex-direction: column;
        background: #0f1419;
        color: #fff;
        overflow-y: auto;
      }

      .cards-tab.active {
        display: flex;
      }

      .cards-main-content {
        flex: 1;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      /* === Section Deck === */
      .deck-section {
        background: #1c2331;
        padding: 12px;
        border-radius: 12px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.4);
      }

      .deck-title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 8px;
      }

      .deck-slots {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
      }

      .deck-slot {
        width: 100%;
        aspect-ratio: 3/4;
        border: 2px dashed #555;
        border-radius: 8px;
        background: #2a2f3a;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #777;
        font-size: 12px;
        position: relative;
      }

      .deck-slot img {
        width: 100%;
        height: 100%;
        border-radius: 6px;
        object-fit: cover;
      }

      /* === Bouton Voir Collection === */
      .collection-button {
        background: #00bcd4;
        border: none;
        border-radius: 8px;
        padding: 10px 16px;
        color: #fff;
        font-weight: bold;
        cursor: pointer;
        transition: background 0.2s;
        text-align: center;
      }

      .collection-button:hover {
        background: #0097a7;
      }

      /* === Section Collection === */
      .collection-section {
        background: #1c2331;
        padding: 12px;
        border-radius: 12px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.4);
      }

      .collection-title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 8px;
      }

      .collection-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        gap: 8px;
      }

      /* === Carte === */
      .card {
        position: relative;
        width: 100%;
        aspect-ratio: 3/4;
        border-radius: 8px;
        overflow: hidden;
        background: #2a2f3a;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.2s;
      }

      .card:hover {
        transform: scale(1.05);
      }

      .card img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .card-info {
        position: absolute;
        bottom: 0;
        width: 100%;
        padding: 4px;
        background: rgba(0,0,0,0.6);
        font-size: 12px;
        text-align: center;
      }

      /* === Carte verrouillée === */
      .card.locked {
        filter: grayscale(100%) brightness(0.5);
        cursor: default;
      }

      .card.locked::after {
        content: "🔒";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 20px;
        color: #fff;
        text-shadow: 0 0 4px #000;
      }

      /* === Responsive === */
      @media (max-width: 425px) {
        .cards-tab {
          top: 50px;
          height: calc(100% - 120px);
        }
        .cards-main-content {
          padding: 12px;
          gap: 12px;
        }
      }
    `;
  }
}

export default CardsTabStyles;
