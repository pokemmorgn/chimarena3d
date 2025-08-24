class CardsTab {
  constructor(apiBase = "/api/collection") {
    this.apiBase = apiBase;
    this.isActive = false;
    this.container = null;
    this.tabElement = null;

    this.decks = [];
    this.currentDeck = null;
    this.collection = [];

    this.eventListeners = new Map();
  }

  async initialize(container) {
    this.container = container;
    this.createTabElement();
    this.renderLayout();

    // Charger données depuis backend
    await this.loadDecks();
    await this.loadCollection();
    this.renderDeck();
  }

  createTabElement() {
    this.tabElement = document.createElement("div");
    this.tabElement.className = "cards-tab";
    this.container.appendChild(this.tabElement);
  }

  renderLayout() {
    this.tabElement.innerHTML = `
      <div class="cards-tab-content">
        <div class="deck-section">
          <h2>Mon Deck</h2>
          <div class="deck-cards"></div>
          <div class="deck-footer">
            <span>Moyenne élixir: <span id="deck-elixir">0.0</span></span>
            <button id="btn-show-collection">Voir la collection</button>
          </div>
        </div>
        <div class="collection-section" style="display: none;">
          <h2>Collection</h2>
          <div class="collection-grid"></div>
          <button id="btn-back-deck">Retour au deck</button>
        </div>
      </div>
    `;

    // Boutons
    this.tabElement
      .querySelector("#btn-show-collection")
      .addEventListener("click", () => this.showCollection());
    this.tabElement
      .querySelector("#btn-back-deck")
      .addEventListener("click", () => this.showDeck());
  }

  async loadDecks() {
    try {
      const res = await fetch(`${this.apiBase}/decks`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        this.decks = data.data.decks;
        const currentIndex = data.data.currentDeckIndex;
        this.currentDeck = this.decks.find(d => d.deckIndex === currentIndex) || null;
      }
    } catch (err) {
      console.error("❌ Failed to load decks", err);
    }
  }

  async loadCollection() {
    try {
      const res = await fetch(`${this.apiBase}/cards`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        this.collection = data.data.cards;
      }
    } catch (err) {
      console.error("❌ Failed to load collection", err);
    }
  }

  renderDeck() {
    const deckContainer = this.tabElement.querySelector(".deck-cards");
    deckContainer.innerHTML = "";

    const deck = this.currentDeck?.cards || Array(8).fill(null);

    deck.forEach((slot, index) => {
      const slotEl = document.createElement("div");
      slotEl.className = "deck-slot";

      if (slot && slot.cardInfo) {
        slotEl.innerHTML = `
          <img src="/cards/${slot.cardInfo.sprite}" alt="${slot.cardInfo.nameKey}" class="deck-card"/>
          <div class="deck-level">Lvl ${slot.level || 1}</div>
        `;
      } else {
        slotEl.innerHTML = `<div class="deck-empty">+</div>`;
        slotEl.classList.add("empty-slot");
      }

      slotEl.addEventListener("click", () => {
        this.emit("deck:select-slot", { index, slot });
      });

      deckContainer.appendChild(slotEl);
    });

    const avgElixir = this.calculateAvgElixir(deck);
    this.tabElement.querySelector("#deck-elixir").textContent = avgElixir.toFixed(1);
  }

  renderCollection() {
    const colContainer = this.tabElement.querySelector(".collection-grid");
    colContainer.innerHTML = "";

    this.collection.forEach(card => {
      const cardEl = document.createElement("div");
      cardEl.className = "collection-card";
      cardEl.innerHTML = `
        <img src="/cards/${card.cardInfo?.sprite}" alt="${card.cardId}" />
        <div class="collection-info">
          <span>${card.cardInfo?.nameKey || card.cardId}</span>
          <span>Niveau ${card.level}</span>
          <span>x${card.count}</span>
        </div>
      `;
      cardEl.addEventListener("click", () => {
        this.emit("collection:select-card", card);
      });
      colContainer.appendChild(cardEl);
    });
  }

  calculateAvgElixir(deck) {
    const costs = deck
      .filter(c => c && c.cardInfo)
      .map(c => c.cardInfo.elixirCost || 0);
    if (costs.length === 0) return 0;
    return costs.reduce((a, b) => a + b, 0) / costs.length;
  }

  showCollection() {
    this.tabElement.querySelector(".deck-section").style.display = "none";
    this.tabElement.querySelector(".collection-section").style.display = "block";
    this.renderCollection();
  }

  showDeck() {
    this.tabElement.querySelector(".collection-section").style.display = "none";
    this.tabElement.querySelector(".deck-section").style.display = "block";
    this.renderDeck();
  }

  // --- Onglet API ---
  show() { this.tabElement.classList.add("active"); this.isActive = true; }
  hide() { this.tabElement.classList.remove("active"); this.isActive = false; }

  on(event, cb) {
    if (!this.eventListeners.has(event)) this.eventListeners.set(event, new Set());
    this.eventListeners.get(event).add(cb);
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(cb => cb(data));
    }
  }
}

export default CardsTab;
