// CardsTab.js - Version corrigée avec meilleure gestion des tokens

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
    
    // Accès au NetworkManager pour les tokens
    this.networkManager = window.ClashRoyaleApp?.networkManager || null;
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
            <div id="debug-auth-status">Auth: Vérification...</div>
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

  /**
   * Créer les headers d'authentification pour les requêtes
   */
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    // Récupérer le token depuis NetworkManager ou localStorage
    let token = null;
    
    if (this.networkManager) {
      token = this.networkManager.getAccessToken();
      console.log('🔑 Token depuis NetworkManager:', token ? 'Présent' : 'Absent');
    }
    
    if (!token) {
      token = localStorage.getItem('clash_royale_access_token');
      console.log('🔑 Token depuis localStorage:', token ? 'Présent' : 'Absent');
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Authorization header ajouté');
    } else {
      console.warn('⚠️ Aucun token disponible pour l\'authentification');
    }

    return headers;
  }

  /**
   * Faire un appel API avec authentification
   */
  async authenticatedFetch(url, options = {}) {
    const headers = this.getAuthHeaders();
    
    const config = {
      credentials: 'include',
      headers,
      ...options
    };

    console.log(`🔄 Appel API: ${url}`);
    console.log('📋 Config requête:', config);

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      console.log(`📦 Réponse de ${url}:`, {
        status: response.status,
        ok: response.ok,
        data: data
      });

      // Si token expiré, essayer de le rafraîchir
      if (response.status === 401 && this.networkManager) {
        console.log('🔄 Token expiré, tentative de rafraîchissement...');
        const refreshed = await this.networkManager.verifyToken();
        
        if (refreshed) {
          console.log('✅ Token rafraîchi, nouvelle tentative...');
          // Refaire l'appel avec le nouveau token
          const newHeaders = this.getAuthHeaders();
          const retryResponse = await fetch(url, {
            ...config,
            headers: newHeaders
          });
          return await retryResponse.json();
        }
      }

      return data;
    } catch (error) {
      console.error(`❌ Erreur lors de l'appel à ${url}:`, error);
      throw error;
    }
  }

  async loadDecks() {
    try {
      console.log("🔄 Chargement des decks...");
      this.updateAuthDebug('Chargement des decks...');
      
      const data = await this.authenticatedFetch(`${this.apiBase}/decks`);
      
      console.log("📦 Réponse decks:", data);
      
      if (data.success) {
        this.decks = data.data.decks;
        const currentIndex = data.data.currentDeckIndex;
        this.currentDeck = this.decks.find(d => d.deckIndex === currentIndex) || null;
        console.log("✅ Decks chargés:", this.decks.length, "deck actuel:", currentIndex);
        this.updateAuthDebug('✅ Decks chargés');
      } else {
        console.error("❌ Erreur lors du chargement des decks:", data.message);
        this.updateAuthDebug(`❌ Erreur decks: ${data.message}`);
      }
    } catch (err) {
      console.error("❌ Failed to load decks", err);
      this.updateAuthDebug(`❌ Échec decks: ${err.message}`);
    }
  }

  async loadCollection() {
    try {
      console.log("🔄 Chargement de la collection...");
      this.updateAuthDebug('Chargement de la collection...');
      
      const data = await this.authenticatedFetch(`${this.apiBase}/cards`);
      
      console.log("📦 Réponse collection complète:", data);
      
      if (data.success) {
        this.collection = data.data.cards || [];
        console.log("✅ Collection chargée:", this.collection.length, "cartes");
        console.log("🃏 Première carte exemple:", this.collection[0]);
        
        // Mise à jour du debug dans l'UI
        this.updateCollectionDebug();
        this.updateAuthDebug(`✅ ${this.collection.length} cartes chargées`);
      } else {
        console.error("❌ Erreur lors du chargement de la collection:", data.message);
        this.updateCollectionDebug("Erreur: " + data.message);
        this.updateAuthDebug(`❌ Erreur: ${data.message}`);
        
        // Si erreur d'auth, afficher des infos utiles
        if (data.code === 'TOKEN_MISSING' || data.code === 'TOKEN_EXPIRED') {
          this.showAuthError(data.message);
        }
      }
    } catch (err) {
      console.error("❌ Failed to load collection", err);
      this.updateCollectionDebug("Erreur réseau: " + err.message);
      this.updateAuthDebug(`❌ Réseau: ${err.message}`);
    }
  }

  async loadAllCards() {
    try {
      console.log("🔄 Chargement de toutes les cartes...");
      
      // Cette API ne nécessite pas d'authentification
      const response = await fetch("/api/cards", { credentials: "include" });
      const data = await response.json();
      
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

  updateAuthDebug(status) {
    const debugAuth = this.tabElement.querySelector("#debug-auth-status");
    if (debugAuth) {
      debugAuth.textContent = `Auth: ${status}`;
    }
  }

  showAuthError(message) {
    const colContainer = this.tabElement.querySelector(".collection-grid");
    if (!colContainer) return;
    
    colContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: #e74c3c; padding: 20px; border: 2px dashed #e74c3c; border-radius: 10px;">
        <h3>🔒 Authentification Requise</h3>
        <p>${message}</p>
        <p style="font-size: 12px; color: #999; margin-top: 10px;">
          Veuillez vous reconnecter ou actualiser la page
        </p>
        <button onclick="window.location.reload()" style="
          background: #e74c3c; 
          color: white; 
          border: none; 
          padding: 10px 20px; 
          border-radius: 5px; 
          cursor: pointer;
          margin-top: 10px;
        ">
          Actualiser la page
        </button>
      </div>
    `;
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
          <button onclick="this.parentElement.parentElement.parentElement.querySelector('#btn-back-deck').click()" style="
            background: #007bff; 
            color: white; 
            border: none; 
            padding: 8px 16px; 
            border-radius: 4px; 
            cursor: pointer;
            margin-top: 10px;
          ">
            Retour au deck
          </button>
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
