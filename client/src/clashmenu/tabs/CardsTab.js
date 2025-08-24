class CardsTab {
  constructor(apiBase = "/api/collection") {
    this.apiBase = apiBase;
    this.isActive = false;
    this.container = null;
    this.tabElement = null;

    this.decks = [];
    this.currentDeck = null;
    this.collection = [];   // cartes possédées
    this.allCards = [];     // toutes les cartes du jeu

    this.eventListeners = new Map();
  }

  async initialize(container) {
    this.container = container;
    this.createTabElement();
    this.renderLayout();

    // Charger données depuis backend avec debug
    await this.loadDecks();
    await this.loadCollection();
    await this.loadAllCards();
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
          <div class="collection-debug" style="margin-bottom: 10px; color: #ffd700; font-size: 12px;">
            <div id="debug-collection-count">Cartes chargées: 0</div>
            <div id="debug-collection-status">Status: En attente...</div>
          </div>
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
      console.log("🔄 Chargement des decks...");
      const res = await fetch(`${this.apiBase}/decks`, { credentials: "include" });
      const data = await res.json();
      
      console.log("📦 Réponse decks:", data);
      
      if (data.success) {
        this.decks = data.data.decks;
        const currentIndex = data.data.currentDeckIndex;
        this.currentDeck = this.decks.find(d => d.deckIndex === currentIndex) || null;
        console.log("✅ Decks chargés:", this.decks.length, "deck actuel:", currentIndex);
      } else {
        console.error("❌ Erreur lors du chargement des decks:", data.message);
      }
    } catch (err) {
      console.error("❌ Failed to load decks", err);
    }
  }

  async loadCollection() {
    try {
      console.log("🔄 Chargement de la collection...");
      const res = await fetch(`${this.apiBase}/cards`, { credentials: "include" });
      const data = await res.json();
      
      console.log("📦 Réponse collection complète:", data);
      
      if (data.success) {
        this.collection = data.data.cards || [];
        console.log("✅ Collection chargée:", this.collection.length, "cartes");
        console.log("🃏 Première carte exemple:", this.collection[0]);
        
        // Mise à jour du debug dans l'UI
        this.updateCollectionDebug();
      } else {
        console.error("❌ Erreur lors du chargement de la collection:", data.message);
        this.updateCollectionDebug("Erreur: " + data.message);
      }
    } catch (err) {
      console.error("❌ Failed to load collection", err);
      this.updateCollectionDebug("Erreur réseau: " + err.message);
    }
  }

  async loadAllCards() {
    try {
      console.log("🔄 Chargement de toutes les cartes...");
      const res = await fetch("/api/cards", { credentials: "include" });
      const data = await res.json();
      
      console.log("📦 Réponse toutes les cartes:", data);
      
      if (data.success) {
        this.allCards = data.data.cards || [];
        console.log("✅ Toutes les cartes chargées:", this.allCards.length);
      } else {
        console.error("❌ Erreur lors du chargement de toutes les cartes:", data.message);
      }
    } catch (err) {
      console.error("❌ Failed to load all cards", err);
    }
  }

  updateCollectionDebug(status = null) {
    const debugCount = this.tabElement.querySelector("#debug-collection-count");
    const debugStatus = this.tabElement.querySelector("#debug-collection-status");
    
    if (debugCount) {
      debugCount.textContent = `Cartes chargées: ${this.collection.length}`;
    }
    
    if (debugStatus) {
      if (status) {
        debugStatus.textContent = `Status: ${status}`;
      } else if (this.collection.length > 0) {
        debugStatus.textContent = `Status: ✅ ${this.collection.length} cartes trouvées`;
      } else {
        debugStatus.textContent = `Status: ⚠️ Aucune carte dans la collection`;
      }
    }
  }

  renderDeck() {
    const deckContainer = this.tabElement.querySelector(".deck-cards");
    if (!deckContainer) return;
    
    deckContainer.innerHTML = "";

    const deck = this.currentDeck?.cards || Array(8).fill(null);
    console.log("🎯 Rendu du deck:", deck);

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
    const elixirEl = this.tabElement.querySelector("#deck-elixir");
    if (elixirEl) {
      elixirEl.textContent = avgElixir.toFixed(1);
    }
  }

  renderCollection() {
    const colContainer = this.tabElement.querySelector(".collection-grid");
    if (!colContainer) return;
    
    colContainer.innerHTML = "";

    console.log("🎨 Rendu de la collection:", this.collection.length, "cartes");

    if (this.collection.length === 0) {
      colContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: #888; padding: 20px;">
          <p>Aucune carte dans votre collection</p>
          <p style="font-size: 12px;">Vérifiez la console pour plus de détails</p>
        </div>
      `;
      return;
    }

    this.collection.forEach((card, index) => {
      console.log(`🃏 Rendu carte ${index}:`, card);
      
      const sprite = card.cardInfo?.sprite 
        ? `/cards/${card.cardInfo.sprite}` 
        : null;

      const cardEl = document.createElement("div");
      cardEl.className = "collection-card";

      if (sprite) {
        cardEl.innerHTML = `
          <img src="${sprite}" alt="${card.cardId}" 
               onerror="this.onerror=null;this.src='/cards/fallback.png';" />
          <div class="collection-info">
            <span>${card.cardInfo?.nameKey || card.cardId}</span>
            <span>Niveau ${card.level}</span>
            <span>x${card.count}</span>
          </div>
        `;
      } else {
        // Génère un visuel CSS si pas d'image
        cardEl.innerHTML = `
          <div class="collection-card-fallback">
            <span>${card.cardId}</span>
          </div>
          <div class="collection-info">
            <span>${card.cardInfo?.nameKey || card.cardId}</span>
            <span>Niveau ${card.level}</span>
            <span>x${card.count}</span>
          </div>
        `;
      }

      cardEl.addEventListener("click", () => {
        console.log("🖱️ Clic sur carte:", card);
        this.emit("collection:select-card", card);
      });

      colContainer.appendChild(cardEl);
    });

    console.log("✅ Rendu de la collection terminé");
  }

  calculateAvgElixir(deck) {
    const costs = deck
      .filter(c => c && c.cardInfo)
      .map(c => c.cardInfo.elixirCost || 0);
    if (costs.length === 0) return 0;
    return costs.reduce((a, b) => a + b, 0) / costs.length;
  }

  showCollection() {
    console.log("👁️ Affichage de la collection");
    this.tabElement.querySelector(".deck-section").style.display = "none";
    this.tabElement.querySelector(".collection-section").style.display = "block";
    this.renderCollection();
  }

  showDeck() {
    console.log("👁️ Affichage du deck");
    this.tabElement.querySelector(".collection-section").style.display = "none";
    this.tabElement.querySelector(".deck-section").style.display = "block";
    this.renderDeck();
  }

  // --- Onglet API ---
  show() { 
    this.tabElement.classList.add("active"); 
    this.isActive = true; 
    console.log("👁️ Tab CardsTab activé");
  }
  
  hide() { 
    this.tabElement.classList.remove("active"); 
    this.isActive = false; 
    console.log("🙈 Tab CardsTab masqué");
  }

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
