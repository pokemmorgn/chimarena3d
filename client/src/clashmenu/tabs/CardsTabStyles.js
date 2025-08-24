/* ===========================
   Onglet Cartes - Styles
   =========================== */

/* Base */
.cards-tab {
  position: absolute;
  top: 60px; /* en dessous du Header */
  left: 0;
  width: 100%;
  height: calc(100% - 140px); /* Header + navigation */
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
  padding: 20px;
}

/* ===========================
   Deck Actif
   =========================== */
.deck-section {
  margin-bottom: 20px;
  text-align: center;
}

.deck-section h3 {
  font-size: 18px;
  margin-bottom: 10px;
}

.deck-slots {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.deck-slot {
  width: 60px;
  height: 80px;
  border: 2px dashed #444;
  border-radius: 8px;
  background: #1a1f29;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #777;
  font-size: 12px;
}

.deck-slot.filled {
  border: 2px solid #00bcd4;
  background: #111;
}

.deck-slot img {
  max-width: 100%;
  max-height: 100%;
  border-radius: 6px;
}

/* ===========================
   Bouton Voir Collection
   =========================== */
.btn-view-collection {
  margin: 15px auto;
  padding: 10px 20px;
  background: #1a237e;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
  display: block;
}

.btn-view-collection:hover {
  background: #283593;
}

/* ===========================
   Grille Collection
   =========================== */
.collection-grid {
  display: none;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.collection-grid.active {
  display: flex;
}

.collection-card {
  width: 90px;
  text-align: center;
  position: relative;
}

.collection-card .card-frame {
  width: 90px;
  height: 110px;
  border: 2px solid #444;
  border-radius: 10px;
  overflow: hidden;
  background: #222;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.collection-card img.card-img {
  max-width: 100%;
  max-height: 100%;
  border-radius: 6px;
}

/* Locked state */
.collection-card.locked .card-img {
  filter: grayscale(100%) brightness(50%);
}

.card-locked-overlay {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.4);
  font-size: 28px;
  color: #fff;
}

.card-info {
  margin-top: 4px;
  font-size: 12px;
  color: #ddd;
}

.card-info .card-name {
  display: block;
  font-weight: bold;
  margin-bottom: 2px;
}

.card-info .card-level,
.card-info .card-count {
  display: inline-block;
  margin: 0 2px;
  color: #ffd700;
}

.card-info .card-locked-text {
  color: #aaa;
  font-style: italic;
  font-size: 11px;
}

/* ===========================
   Responsive
   =========================== */
@media (max-width: 425px) {
  .cards-tab {
    top: 50px;
    height: calc(100% - 120px);
  }

  .cards-main-content {
    padding: 15px;
  }

  .deck-slot {
    width: 50px;
    height: 70px;
  }

  .collection-card {
    width: 70px;
  }

  .collection-card .card-frame {
    width: 70px;
    height: 90px;
  }
}
