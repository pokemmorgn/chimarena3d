class CardsTab {
  constructor(api) {
    this.isActive = false;
    this.currentUser = null;

    // API client (wrapper fetch vers ton backend)
    this.api = api;

    this.container = null;
    this.tabElement = null;

    // Data
    this.decks = [];
    this.currentDeckIndex = 0;
    this.collection = [];

    this.eventListeners = new Map();
  }

  async initialize(container) {
    this.container = container;
    this.createTabElement();
    await this.loadData();
    this.renderLayout();
    this.setupEventListeners();
  }

  createTabElement() {
    this.tabElement = document.createElement("div");
    this.tabElement.className = "cards-tab";
    this.tabElement.id = "cards-tab";
    this.container.appendChild(this.tabElement);
  }

  async loadData() {
    try {
      // Récupérer les decks
      const decksRes = await this.api.get("/collection/decks");
      this.decks = decksRes.data.decks;
      this.currentDeckIndex = decksRes.data.currentDeckIndex;

      // Récupérer la collection
      const colRes = await this.api.get("/collection/cards");
      this.collection = colRes.data.cards;
    } catch (err) {
      console.error("❌ Failed to load cards tab data:", err);
    }
  }

  renderLayout() {
    this.tabElement.innerHTML = `
      <div class="cards-header">
        <h2>🃏 My Decks</h2>
      </div>

      <!-- Deck actif -->
      <div class="active-deck">
        ${this.renderDeck(this.decks[this.currentDeckIndex])}
      </div>

      <!-- Boutons deck -->
      <div class="deck-selector">
        ${this.decks.map(
          (d, i) => `
          <button class="deck-btn ${i === this.currentDeckIndex ? "active" : ""}" 
                  data-index="${i}">
            Deck ${i + 1}
          </button>`
        ).join("")}
      </div>

      <!-- Bouton collection -->
      <div class="collection-btn-wrapper">
        <button id="btn-show-collection">📚 View Collection</button>
      </div>

      <!-- Zone collection -->
      <div class="collection-grid" id="collection-grid" style="display:none;">
        ${this.renderCollection()}
      </div>

      <!-- Popup carte -->
      <div class="card-popup" id="card-popup" style="display:none;"></div>
    `;
  }

  renderDeck(deck) {
    if (!deck) return "<div class='deck-empty'>No deck</div>";
    return `
      <div class="deck-cards">
        ${deck.cards.map(slot => `
          <div class="deck-slot">
            <img src="/cards/${slot.cardInfo.sprite}" 
                 alt="${slot.cardInfo.nameKey}" 
                 class="deck-card"
                 data-cardid="${slot.cardId}" />
          </div>
        `).join("")}
      </div>
      <div class="deck-elixir">Avg Elixir: ${(deck.totalElixirCost / 8).toFixed(1)}</div>
    `;
  }

  renderCollection() {
    if (!this.collection) return "";
    return this.collection.map(card => `
      <div class="collection-card ${card.isUnlocked ? "" : "locked"}" 
           data-cardid="${card.cardId}">
        <img src="/cards/${card.cardInfo?.sprite || "unknown.png"}" />
        <div class="card-level">Lvl ${card.level}</div>
        <div class="card-count">${card.count || 0}</div>
      </div>
    `).join("");
  }

  renderCardPopup(card) {
    return `
      <div class="popup-content">
        <h3>${card.cardInfo?.nameKey || card.cardId}</h3>
        <img src="/cards/${card.cardInfo?.sprite}" class="popup-img" />

        <p>Level: ${card.level}</p>
        <p>Count: ${card.count}</p>
        <p>Rarity: ${card.cardInfo?.rarity}</p>
        <p>Elixir: ${card.cardInfo?.elixirCost}</p>

        ${
          card.upgradeAvailable
            ? `<button id="btn-upgrade-card" data-cardid="${card.cardId}">⬆️ Upgrade</button>`
            : "<p>Upgrade not available</p>"
        }

        <button id="btn-close-popup">❌ Close</button>
      </div>
    `;
  }

  setupEventListeners() {
    // Deck switch
    this.tabElement.querySelectorAll(".deck-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const idx = parseInt(btn.dataset.index);
        await this.api.put(`/collection/active-deck/${idx}`);
        this.currentDeckIndex = idx;
        this.renderLayout();
        this.setupEventListeners();
      });
    });

    // Toggle collection
    this.tabElement.querySelector("#btn-show-collection")
      .addEventListener("click", () => {
        const grid = this.tabElement.querySelector("#collection-grid");
        grid.style.display = grid.style.display === "none" ? "grid" : "none";
      });

    // Card click → popup
    this.tabElement.querySelectorAll(".collection-card").forEach(cardEl => {
      cardEl.addEventListener("click", () => {
        const cardId = cardEl.dataset.cardid;
        const card = this.collection.find(c => c.cardId === cardId);
        const popup = this.tabElement.querySelector("#card-popup");
        popup.innerHTML = this.renderCardPopup(card);
        popup.style.display = "block";

        // Close
        popup.querySelector("#btn-close-popup").addEventListener("click", () => {
          popup.style.display = "none";
        });

        // Upgrade
        const upgradeBtn = popup.querySelector("#btn-upgrade-card");
        if (upgradeBtn) {
          upgradeBtn.addEventListener("click", async () => {
            await this.api.post("/collection/upgrade-card", { cardId });
            await this.loadData();
            this.renderLayout();
            this.setupEventListeners();
          });
        }
      });
    });
  }

  show() { this.tabElement.classList.add("active"); this.isActive = true; }
  hide() { this.tabElement.classList.remove("active"); this.isActive = false; }

  on(event, callback) {
    if (!this.eventListeners.has(event)) this.eventListeners.set(event, new Set());
    this.eventListeners.get(event).add(callback);
  }
}

export default CardsTab;
