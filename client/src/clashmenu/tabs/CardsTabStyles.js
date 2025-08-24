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

      .collection-card-fallback {
        width: 100%;
        aspect-ratio: 3/4;
        background: repeating-linear-gradient(45deg, #333, #333 10px, #444 10px, #444 20px);
        border-radius: 6px;
        color: #bbb;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 12px;
        padding: 4px;
      }

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
        transition: transform 0.15s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        transform: scale(1) !important;
      }

      .deck-slot:hover:not(.drag-over) {
        transform: scale(1.02) !important;
      }

      .deck-slot.empty-slot {
        background: rgba(255,255,255,0.05);
        border: 2px dashed #555;
        font-size: 32px;
        color: #888;
        transform: scale(1) !important;
      }

      .deck-slot.empty-slot:hover:not(.drag-over) {
        transform: scale(1.02) !important;
      }

      .deck-slot.empty-slot:hover::after {
        content: "Add Card";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #888;
        font-size: 10px;
        font-weight: bold;
        white-space: nowrap;
      }

      .deck-slot.drag-over {
        border-color: #00bcd4 !important;
        background-color: rgba(0,188,212,0.1) !important;
        transform: scale(1.02) !important;
        box-shadow: 0 0 15px rgba(0,188,212,0.5);
        transition: all 0.2s ease;
      }

      .deck-slot.drag-over::after {
        content: "Drop Here";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #00bcd4;
        font-size: 12px;
        font-weight: bold;
        text-shadow: 0 1px 2px rgba(0,0,0,0.7);
        pointer-events: none;
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
      }

      .my-card {
        background: #222;
        border: 2px solid #2ecc71;
        border-radius: 8px;
        text-align: center;
        padding: 5px;
        cursor: grab;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        position: relative;
        transform: scale(1);
      }

      .my-card:hover:not(.dragging) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(46,204,113,0.3);
        border-color: #27ae60;
      }

      .my-card.dragging {
        opacity: 0.7;
        transform: rotate(5deg) scale(1.05);
        cursor: grabbing;
        z-index: 1000;
        transition: none;
      }

      .my-card img {
        width: 100%;
        border-radius: 4px;
        margin-bottom: 5px;
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
        aspect-ratio: 3/4;
        background: repeating-linear-gradient(45deg, #2ecc71, #2ecc71 10px, #27ae60 10px, #27ae60 20px);
        border-radius: 6px;
        color: #fff;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 10px;
        padding: 4px;
      }

      .all-cards-section h2 {
        margin: 0 0 10px 0;
        font-size: 20px;
        color: #e67e22;
        text-align: center;
      }

      .all-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
        gap: 10px;
      }

      .arena-title {
        grid-column: 1 / -1;
        margin: 20px 0 10px 0;
        padding: 10px;
        background: linear-gradient(90deg, #e67e22, #d35400);
        border-radius: 8px;
        text-align: center;
      }

      .arena-title h3 {
        margin: 0;
        color: #fff;
        font-size: 16px;
        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
      }

      .game-card {
        background: #222;
        border: 2px solid #444;
        border-radius: 8px;
        text-align: center;
        padding: 5px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        position: relative;
      }

      .game-card.owned {
        border-color: #2ecc71;
        background: rgba(46,204,113,0.1);
      }

      .game-card.not-owned {
        border-color: #95a5a6;
        opacity: 0.7;
        filter: grayscale(50%);
      }

      .game-card:hover {
        transform: scale(1.05);
      }

      .game-card.owned:hover {
        box-shadow: 0 4px 12px rgba(46,204,113,0.4);
      }

      .game-card.not-owned:hover {
        box-shadow: 0 4px 12px rgba(149,165,166,0.4);
      }

      .game-card img {
        width: 100%;
        border-radius: 4px;
        margin-bottom: 5px;
      }

      .game-card-info {
        font-size: 10px;
        color: #ccc;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .game-card-fallback {
        width: 100%;
        aspect-ratio: 3/4;
        background: repeating-linear-gradient(45deg, #444, #444 10px, #555 10px, #555 20px);
        border-radius: 6px;
        color: #bbb;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 10px;
        padding: 4px;
      }

      .owned-badge {
        background: rgba(46,204,113,0.2);
        color: #2ecc71 !important;
        padding: 2px 4px;
        border-radius: 3px;
        font-weight: bold;
      }

      .not-owned-badge {
        background: rgba(149,165,166,0.2);
        color: #95a5a6 !important;
        padding: 2px 4px;
        border-radius: 3px;
        font-weight: bold;
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
        cursor: grab;
        transition: transform 0.2s, box-shadow 0.2s;
        position: relative;
      }

      .collection-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,188,212,0.3);
        border-color: #00bcd4;
      }

      .collection-card.dragging {
        opacity: 0.7;
        transform: rotate(5deg) scale(1.05);
        cursor: grabbing;
        z-index: 1000;
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

      .drag-hint {
        position: absolute;
        bottom: -2px;
        left: 0;
        right: 0;
        background: rgba(0,188,212,0.9);
        color: white;
        font-size: 10px;
        text-align: center;
        padding: 2px;
        border-radius: 0 0 6px 6px;
        opacity: 0;
        transition: opacity 0.2s;
      }

      .collection-card:hover .drag-hint,
      .my-card:hover .drag-hint {
        opacity: 1;
      }

      .collection-debug,
      .all-cards-debug {
        background: rgba(255,215,0,0.1);
        border: 1px solid rgba(255,215,0,0.3);
        border-radius: 4px;
        padding: 8px;
        margin-bottom: 10px;
      }

      .collection-debug div,
      .all-cards-debug div {
        margin: 2px 0;
        font-size: 11px;
      }

      .collection-card.locked {
        filter: grayscale(100%) brightness(0.5);
        cursor: default;
      }

      .collection-section button,
      .all-cards-section button {
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

      .collection-section button:hover,
      .all-cards-section button:hover {
        background: #1e7e34;
      }

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

      .deck-notification.success {
        background: #2ecc71;
      }

      .deck-notification.error {
        background: #e74c3c;
      }

      .deck-notification.warning {
        background: #f39c12;
      }

      .deck-notification.info {
        background: #3498db;
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }

      @media (max-width: 768px) {
        .deck-cards {
          grid-template-columns: repeat(2, 1fr);
        }

        .my-cards-grid {
          grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
          max-height: 150px;
        }

        .all-cards-grid {
          grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
        }

        .arena-title h3 {
          font-size: 14px;
        }
      }

      @media (max-width: 600px) {
        .collection-grid {
          grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
          gap: 8px;
        }

        .my-cards-grid {
          grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
          gap: 6px;
          max-height: 120px;
        }

        .all-cards-grid {
          grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
          gap: 6px;
        }

        .collection-info,
        .my-card-info,
        .game-card-info {
          font-size: 9px;
        }

        .my-cards-section {
          margin-top: 15px;
        }

        .my-cards-section h2 {
          font-size: 16px;
        }

        .all-cards-section h2 {
          font-size: 18px;
        }
      }
    `;
  }
}

export default CardsTabStyles;
