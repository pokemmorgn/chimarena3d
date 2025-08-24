// CardsTab.js - Version corrigée avec meilleure gestion des tokens
import CardModal from "./CardModal.js";

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
this.cardModal = new CardModal(this);

    this.eventListeners = new Map();
    
    // Accès au NetworkManager pour les tokens
    this.networkManager = window.ClashRoyaleApp?.networkManager || null;
    
    // Variables pour le drag & drop
    this.isDragging = false;
    this.draggedCard = null;
  }

  async initialize(container) {
    this.container = container;
    this.createTabElement();
    this.renderLayout();
this.cardModal.initialize(this.container);

    // Charger données depuis backend avec debug
    await this.loadDecks();
        await this.loadAllCards();

    await this.loadCollection();
    this.renderDeck();
    this.renderMyCards(); // Afficher mes cartes sous le deck
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
            <button id="btn-show-all-cards">COLLECTIONS</button>
          </div>
        </div>
        
        <!-- Nouvelle section: Mes cartes -->
        <div class="my-cards-section">
          <h2>Mes Cartes</h2>
          <div class="my-cards-grid"></div>
        </div>

        <!-- Section pour toutes les cartes du jeu -->
        <div class="all-cards-section" style="display: none;">
          <h2>Toutes les Cartes du Jeu</h2>
          <div class="all-cards-debug" style="margin-bottom: 10px; color: #ffd700; font-size: 12px;">
            <div id="debug-all-cards-count">Cartes du jeu: 0</div>
            <div id="debug-all-cards-status">Status: En attente...</div>
          </div>
          <div class="all-cards-grid"></div>
          <button id="btn-back-deck">Retour</button>
        </div>
      </div>
    `;

    // Boutons
    this.tabElement
      .querySelector("#btn-show-all-cards")
      .addEventListener("click", () => this.showAllCards());
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
  
// Dans loadCollection(), après l'enrichissement, ajoute :
this.collection = this.collection.map(card => {
  const cardData = this.allCards.find(c => c.id === card.cardId);
  console.log(`🔍 Debug carte ${card.cardId}:`, {
    cardData: cardData ? 'trouvé' : 'PAS TROUVÉ',
    cardsToUpgrade: cardData?.cardsToUpgrade,
    currentLevel: card.level,
    nextLevel: card.level + 1
  });
  
  if (cardData) {
    const nextLevelUpgrade = cardData.cardsToUpgrade?.find(u => u.level === (card.level + 1));
    console.log(`🎯 Upgrade pour niveau ${card.level + 1}:`, nextLevelUpgrade);
    
    return {
      ...card,
      cardInfo: cardData,
      nextLevelCount: nextLevelUpgrade?.cards || null,
      nextLevelGold: nextLevelUpgrade?.gold || null,
      maxLevel: cardData.maxLevel,
      canUpgrade: nextLevelUpgrade ? card.count >= nextLevelUpgrade.cards : false
    };
  }
  return card;
});
  
  console.log("✅ Collection enrichie:", this.collection.length, "cartes");
  console.log("🃏 Première carte enrichie:", this.collection[0]);
  
  // Mise à jour de l'affichage
  this.renderMyCards();
  this.updateAuthDebug(`✅ ${this.collection.length} cartes chargées et enrichies`);
} else {
  console.error("❌ Erreur lors du chargement de la collection:", data.message);
  this.updateAuthDebug(`❌ Erreur: ${data.message}`);
  
  // Si erreur d'auth, afficher des infos utiles
  if (data.code === 'TOKEN_MISSING' || data.code === 'TOKEN_EXPIRED') {
    this.showAuthError(data.message);
  }
}
} catch (err) {
console.error("❌ Failed to load collection", err);
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
        
        // Si on est dans la vue "toutes les cartes", mettre à jour l'affichage
        if (this.tabElement.querySelector(".all-cards-section").style.display !== "none") {
          this.renderAllCards();
        }
      } else {
        console.error("❌ Erreur lors du chargement de toutes les cartes:", data.message);
      }
    } catch (err) {
      console.error("❌ Failed to load all cards", err);
    }
  }

  updateAuthDebug(status) {
    // Cette méthode n'est plus nécessaire car pas de debug auth sur la page principale
    console.log("Auth status:", status);
  }

  showAuthError(message) {
    const myCardsContainer = this.tabElement.querySelector(".my-cards-grid");
    if (!myCardsContainer) return;
    
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

    // Debug du deck
    console.log("🎯 Debug deck complet:", {
      currentDeck: this.currentDeck,
      decks: this.decks,
      decksLength: this.decks.length
    });

    // Récupérer le deck actuel depuis les données chargées
    let deck = null;
    
    if (this.currentDeck && this.currentDeck.cards) {
      // Format: { deckIndex: 0, cards: [...], isActive: true }
      deck = this.currentDeck.cards;
    } else if (this.decks && this.decks.length > 0) {
      // Prendre le premier deck actif ou le premier deck disponible
      const activeDeck = this.decks.find(d => d.isActive) || this.decks[0];
      if (activeDeck && activeDeck.cards) {
        deck = activeDeck.cards;
        this.currentDeck = activeDeck;
      }
    }

    // Si pas de deck, créer 8 slots vides
    if (!deck || !Array.isArray(deck)) {
      deck = Array(8).fill(null);
      console.log("⚠️ Aucun deck trouvé, création de 8 slots vides");
    }

    console.log("🎯 Deck à afficher:", deck);

    // Assurer qu'on a exactement 8 slots
    const deckSlots = Array(8).fill(null);
    if (deck && Array.isArray(deck)) {
      deck.forEach((card, index) => {
        if (index < 8) {
          deckSlots[index] = card;
        }
      });
    }

    deckSlots.forEach((slot, index) => {
      const slotEl = document.createElement("div");
      slotEl.className = "deck-slot";
      slotEl.dataset.slotIndex = index;
      if (slot?.cardInfo?.rarity) {
  slotEl.classList.add(`card-${slot.cardInfo.rarity}`);
}

      console.log(`🃏 Slot ${index}:`, slot);

     if (slot && (slot.cardInfo || slot.cardId)) {
  // Cas 1: slot avec cardInfo déjà enrichi
if (slot.cardInfo) {
  const rarityClass = `card-${slot.cardInfo.rarity || 'common'}`;
  slotEl.classList.add(rarityClass);

  slotEl.innerHTML = `
    <img src="/cards/${slot.cardInfo.sprite}" 
         alt="${slot.cardInfo.nameKey || slot.cardId}" 
         class="deck-card"
         onerror="this.onerror=null;this.src='/cards/fallback.png';" />
    <div class="card-level">${slot.level || 1}</div>
  `;
}
  // Cas 2: slot avec seulement cardId (chercher dans allCards)
  else if (slot.cardId && this.allCards.length > 0) {
    const cardInfo = this.allCards.find(c => c.id === slot.cardId);
    if (cardInfo) {
      slotEl.innerHTML = `
        <img src="/cards/${cardInfo.sprite}" 
             alt="${cardInfo.nameKey || slot.cardId}" 
             class="deck-card"
             onerror="this.onerror=null;this.src='/cards/fallback.png';" />
        <div class="card-level">Lvl ${slot.level || 1}</div>
        <div class="card-progress">
          <div class="card-progress-fill" style="width:${Math.min(100, (slot.count / (slot.nextLevelCount || 1)) * 100)}%;"></div>
          <span>${slot.count || 0}/${slot.nextLevelCount || "??"}</span>
        </div>
      `;
    } else {
      // Fallback avec nom de la carte
      slotEl.innerHTML = `
        <div class="deck-card-fallback">
          <span>${slot.cardId}</span>
        </div>
        <div class="card-level">${slot.level || 1}</div>
        <div class="card-progress">
          <div class="card-progress-fill" style="width:${Math.min(100, (slot.count / (slot.nextLevelCount || 1)) * 100)}%;"></div>
          <span>${slot.count || 0}/${slot.nextLevelCount || "??"}</span>
        </div>
      `;
    }
  }
  // Cas 3: slot avec données mais pas de cardInfo
  else {
    slotEl.innerHTML = `
      <div class="deck-card-fallback">
        <span>${slot.cardId || 'Carte'}</span>
      </div>
      <div class="card-level">Lvl ${slot.level || 1}</div>
      <div class="card-progress">
        <div class="card-progress-fill" style="width:${Math.min(100, (slot.count / (slot.nextLevelCount || 1)) * 100)}%;"></div>
        <span>${slot.count || 0}/${slot.nextLevelCount || "??"}</span>
      </div>
    `;
  }
} else {
  // Slot vide
  slotEl.innerHTML = `<div class="deck-empty">+</div>`;
  slotEl.classList.add("empty-slot");
}


      slotEl.addEventListener("click", () => {
        console.log(`🖱️ Clic sur slot ${index}:`, slot);
        this.emit("deck:select-slot", { index, slot });
      });

      // Event listeners pour le drop
      slotEl.addEventListener("dragover", (e) => {
        e.preventDefault();
        slotEl.classList.add("drag-over");
      });

      slotEl.addEventListener("dragleave", (e) => {
        slotEl.classList.remove("drag-over");
      });

      slotEl.addEventListener("drop", (e) => {
        e.preventDefault();
        slotEl.classList.remove("drag-over");
        this.handleCardDrop(e, index);
      });

      deckContainer.appendChild(slotEl);
    });

    // Calculer et afficher la moyenne d'élixir
    const avgElixir = this.calculateAvgElixir(deckSlots);
    const elixirEl = this.tabElement.querySelector("#deck-elixir");
    if (elixirEl) {
      elixirEl.textContent = avgElixir.toFixed(1);
    }

    console.log("✅ Rendu du deck terminé, 8 slots créés");
  }

  /**
   * Afficher mes cartes (collection du joueur) sous le deck
   */
  renderMyCards() {
 const myCardsContainer = this.tabElement.querySelector(".my-cards-grid");
 if (!myCardsContainer) return;
 
 myCardsContainer.innerHTML = "";
 console.log("🎨 Rendu de mes cartes:", this.collection.length, "cartes");
 if (this.collection.length === 0) {
   myCardsContainer.innerHTML = `
     <div style="grid-column: 1 / -1; text-align: center; color: #888; padding: 20px;">
       <p>Aucune carte dans votre collection</p>
       <p style="font-size: 12px;">Commencez à jouer pour débloquer des cartes !</p>
     </div>
   `;
   return;
 }
 
 this.collection.forEach((card, index) => {
   const sprite = card.cardInfo?.sprite 
     ? `/cards/${card.cardInfo.sprite}` 
     : null;
   const cardEl = document.createElement("div");
   cardEl.className = "my-card";
   if (card.cardInfo?.rarity) {
     cardEl.classList.add(`card-${card.cardInfo.rarity}`);
   }
   
   // Rendre la carte draggable
   cardEl.draggable = true;
   cardEl.dataset.cardId = card.cardId;
   cardEl.dataset.cardLevel = card.level;
   cardEl.addEventListener("click", () => {
  if (!this.isDragging) this.cardModal.open(card);
});
   // Ajouter classe si upgradable
   if (card.canUpgrade) {
     cardEl.classList.add("can-upgrade");
   }

   // Calculer progression
   let progressText = "";
   let progressWidth = 0;

   if (card.level >= card.maxLevel) {
     progressText = "MAX";
     progressWidth = 100;
   } else if (card.nextLevelCount) {
     progressText = `${card.count}/${card.nextLevelCount}`;
     progressWidth = Math.min(100, (card.count / card.nextLevelCount) * 100);
   } else {
     progressText = `${card.count}/??`;
     progressWidth = 0;
   }

   if (sprite) {
     cardEl.innerHTML = `
       <img src="${sprite}" alt="${card.cardId}" 
            onerror="this.onerror=null;this.src='/cards/fallback.png';" />
       <div class="card-level">${card.level}</div>
       <div class="card-progress ${card.canUpgrade ? 'ready-upgrade' : ''}">
         <div class="card-progress-fill" style="width:${progressWidth}%;"></div>
         <span>${progressText}</span>
       </div>
       ${card.canUpgrade ? '<div class="upgrade-indicator">⬆️</div>' : ''}
       ${card.level >= card.maxLevel ? '<div class="max-indicator">👑</div>' : ''}
     `;
   } else {
     cardEl.innerHTML = `
       <div class="my-card-fallback">
         <span>${card.cardId}</span>
       </div>
       <div class="card-level">${card.level}</div>
       <div class="card-progress ${card.canUpgrade ? 'ready-upgrade' : ''}">
         <div class="card-progress-fill" style="width:${progressWidth}%;"></div>
         <span>${progressText}</span>
       </div>
       ${card.canUpgrade ? '<div class="upgrade-indicator">⬆️</div>' : ''}
       ${card.level >= card.maxLevel ? '<div class="max-indicator">👑</div>' : ''}
     `;
   }

   // Event listeners pour le drag & drop
   cardEl.addEventListener("dragstart", (e) => {
     this.handleCardDragStart(e, card);
   });
   cardEl.addEventListener("dragend", (e) => {
     this.handleCardDragEnd(e);
   });
   // Clic alternatif pour mobile/touch
   cardEl.addEventListener("click", () => {
     if (!this.isDragging) {
       this.handleCardClick(card);
     }
   });
   myCardsContainer.appendChild(cardEl);
 });
 console.log("✅ Rendu de mes cartes terminé avec drag & drop");
}

  /**
   * Afficher toutes les cartes du jeu (pas seulement celles possédées)
   */
/**
 * Afficher toutes les cartes du jeu (possédées + non possédées)
 */
renderAllCards() {
  const allCardsContainer = this.tabElement.querySelector(".all-cards-grid");
  if (!allCardsContainer) return;
  
  allCardsContainer.innerHTML = "";

  console.log("🎨 Rendu de toutes les cartes (tri par rareté, bloc unique)");

  if (this.allCards.length === 0) {
    allCardsContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: #888; padding: 20px;">
        <p>Chargement des cartes du jeu...</p>
      </div>
    `;
    return;
  }

  // Ordre de rareté
  const rarityOrder = { legendary: 1, epic: 2, rare: 3, common: 4 };

  // Tri global sans arène
  const sorted = [...this.allCards].sort((a, b) => {
    return (rarityOrder[a.rarity] || 99) - (rarityOrder[b.rarity] || 99);
  });

  sorted.forEach(card => {
    const owned = this.collection.find(c => c.cardId === card.id);

    const cardEl = document.createElement("div");
    cardEl.className = "game-card";
    if (card.rarity) {
  cardEl.classList.add(`card-${card.rarity}`);
}

    if (!owned) cardEl.classList.add("not-owned");
    else cardEl.classList.add("owned");

    const sprite = card.sprite ? `/cards/${card.sprite}` : null;

    if (sprite) {
      cardEl.innerHTML = `
        <img src="${sprite}" alt="${card.nameKey || card.id}" 
             onerror="this.onerror=null;this.src='/cards/fallback.png';" />
        <div class="game-card-info">
          <span>${card.nameKey || card.id}</span>
          <span>${card.elixirCost}⚡ - ${card.rarity}</span>
          ${owned 
            ? `<span class="owned-badge">✅ Possédée (x${owned.count})</span>` 
            : '<span class="not-owned-badge">🔒 Non possédée</span>'}
        </div>
      `;
    } else {
      cardEl.innerHTML = `
        <div class="game-card-fallback">
          <span>${card.nameKey || card.id}</span>
        </div>
        <div class="game-card-info">
          <span>${card.nameKey || card.id}</span>
          <span>${card.elixirCost}⚡ - ${card.rarity}</span>
          ${owned 
            ? `<span class="owned-badge">✅ Possédée (x${owned.count})</span>` 
            : '<span class="not-owned-badge">🔒 Non possédée</span>'}
        </div>
      `;
    }

    allCardsContainer.appendChild(cardEl);
  });

  this.updateAllCardsDebug();
  console.log("✅ Rendu terminé:", sorted.length, "cartes affichées (triées par rareté)");
}


  updateAllCardsDebug() {
    const debugCount = this.tabElement.querySelector("#debug-all-cards-count");
    const debugStatus = this.tabElement.querySelector("#debug-all-cards-status");
    
    if (debugCount) {
      debugCount.textContent = `Cartes du jeu: ${this.allCards.length}`;
    }
    
    if (debugStatus) {
      if (this.allCards.length > 0) {
        const owned = this.allCards.filter(card => 
          this.collection.find(c => c.cardId === card.id)
        ).length;
        debugStatus.textContent = `Status: ✅ ${owned}/${this.allCards.length} cartes possédées`;
      } else {
        debugStatus.textContent = `Status: ⚠️ Chargement...`;
      }
    }
  }

  /**
   * Gestion du drag & drop et sauvegarde
   */
  handleCardDragStart(e, card) {
    console.log("🎯 Début du drag:", card.cardId);
    this.isDragging = true;
    
    // Stocker les données de la carte
    this.draggedCard = card;
    e.dataTransfer.setData("text/plain", card.cardId);
    e.dataTransfer.effectAllowed = "copy";
    
    // Ajouter une classe visuelle
    e.target.classList.add("dragging");
  }

  handleCardDragEnd(e) {
    console.log("🎯 Fin du drag");
    
    // Nettoyage direct
    if (this.tabElement) {
      this.tabElement.querySelectorAll(".deck-slot").forEach(el => {
        el.classList.remove("drag-over");
        el.style.transform = "scale(1)";
      });
      
      this.tabElement.querySelectorAll(".my-card, .collection-card").forEach(el => {
        el.classList.remove("dragging");
        el.style.transform = "";
      });
    }
    
    this.isDragging = false;
    this.draggedCard = null;
  }

  async handleCardDrop(e, slotIndex) {
    e.preventDefault();
    
    if (!this.draggedCard) {
      console.warn("❌ Aucune carte en cours de drag");
      return;
    }

    console.log(`🎯 Drop carte ${this.draggedCard.cardId} sur slot ${slotIndex}`);
    
    // Nettoyer immédiatement les effets visuels du slot
    e.target.classList.remove("drag-over");
    e.target.style.transform = "";
    
    // Mettre à jour le deck local
    await this.updateDeckSlot(slotIndex, this.draggedCard);
  }

  handleCardClick(card) {
    console.log("🖱️ Clic sur carte pour sélection:", card.cardId);
    
    // Mode sélection pour mobile - chercher un slot vide
    const emptySlotIndex = this.findEmptyDeckSlot();
    
    if (emptySlotIndex !== -1) {
      console.log(`📱 Ajout de ${card.cardId} au slot ${emptySlotIndex}`);
      this.updateDeckSlot(emptySlotIndex, card);
    } else {
      // Si le deck est plein, remplacer le premier slot
      console.log(`📱 Deck plein, remplacement du slot 0 avec ${card.cardId}`);
      this.updateDeckSlot(0, card);
      this.showMessage("Deck complet ! La première carte a été remplacée.", "warning");
    }
  }

  findEmptyDeckSlot() {
    const currentDeck = this.getCurrentDeckCards();
    for (let i = 0; i < 8; i++) {
      if (!currentDeck[i] || !currentDeck[i].cardId) {
        return i;
      }
    }
    return -1; // Pas de slot vide
  }

  getCurrentDeckCards() {
    if (this.currentDeck && this.currentDeck.cards) {
      return this.currentDeck.cards;
    }
    
    // Si pas de deck, créer un deck par défaut avec les premières cartes disponibles
    const defaultDeck = Array(8).fill(null);
    
    if (this.collection.length > 0) {
      // Remplir avec les premières cartes disponibles
      for (let i = 0; i < Math.min(8, this.collection.length); i++) {
        const card = this.collection[i];
        defaultDeck[i] = {
          cardId: card.cardId,
          position: i,
          level: card.level,
          isActive: true,
          cardInfo: card.cardInfo
        };
      }
      
      console.log("🎯 Création d'un deck par défaut:", defaultDeck);
    }
    
    return defaultDeck;
  }

  async updateDeckSlot(slotIndex, card) {
    try {
      console.log(`🔄 Mise à jour slot ${slotIndex} avec ${card.cardId}`);
      
      // Construire le nouveau deck
      const currentDeckCards = this.getCurrentDeckCards();
      const newDeck = [...currentDeckCards];
      
      // Mettre à jour le slot spécifique
      newDeck[slotIndex] = {
        cardId: card.cardId,
        position: slotIndex,
        level: card.level,
        isActive: true,
        cardInfo: card.cardInfo
      };

      // Créer le tableau des cardIds pour l'API (DOIT contenir exactement 8 éléments)
      const cardIds = Array(8).fill(null);
      
      // Remplir avec les cartes existantes
      newDeck.forEach((slot, index) => {
        if (slot && slot.cardId) {
          cardIds[index] = slot.cardId;
        }
      });

      // Pour l'API, remplacer les null par des cartes par défaut si nécessaire
      const apiCardIds = cardIds.map(cardId => {
        if (!cardId && this.collection.length > 0) {
          // Prendre la première carte disponible comme placeholder
          return this.collection[0].cardId;
        }
        return cardId || this.collection[0]?.cardId || 'knight'; // fallback
      });

      console.log("📤 Envoi du nouveau deck (8 cartes obligatoires):", apiCardIds);

      // Sauvegarder via l'API
      const deckIndex = this.currentDeck?.deckIndex || 0;
      const saved = await this.saveDeck(deckIndex, apiCardIds);
      
      if (saved) {
        // Mettre à jour l'affichage local
        if (this.currentDeck) {
          this.currentDeck.cards = newDeck;
        }
        
        this.renderDeck();
        this.renderMyCards(); // Mettre à jour aussi mes cartes
        this.showMessage(`✅ ${card.cardInfo?.nameKey || card.cardId} ajouté au deck !`, "success");
        
        // Nettoyage direct sans fonction séparée
        if (this.tabElement) {
          this.tabElement.querySelectorAll(".deck-slot").forEach(el => {
            el.classList.remove("drag-over");
            el.style.transform = "scale(1)";
            el.style.transition = "";
          });
          
          this.tabElement.querySelectorAll(".my-card, .collection-card").forEach(el => {
            el.classList.remove("dragging");
            el.style.transform = "";
          });
        }
        
        this.isDragging = false;
        this.draggedCard = null;
        
        console.log("✅ Deck mis à jour avec succès");
      } else {
        this.showMessage("❌ Erreur lors de la sauvegarde du deck", "error");
      }
      
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour du deck:", error);
      this.showMessage("❌ Erreur lors de la mise à jour du deck", "error");
    }
  }

  async saveDeck(deckIndex, cardIds) {
    try {
      // S'assurer qu'on a exactement 8 cartes
      if (cardIds.length !== 8) {
        console.error("❌ Deck doit contenir exactement 8 cartes, reçu:", cardIds.length);
        return false;
      }

      // Vérifier qu'aucune carte n'est null/undefined
      const validCardIds = cardIds.map((cardId, index) => {
        if (!cardId && this.collection.length > 0) {
          console.warn(`⚠️ Carte manquante au slot ${index}, utilisation de la première carte disponible`);
          return this.collection[0].cardId;
        }
        return cardId || 'knight'; // fallback absolu
      });

      console.log(`💾 Sauvegarde deck ${deckIndex} avec 8 cartes:`, validCardIds);

      const data = await this.authenticatedFetch(`${this.apiBase}/deck`, {
        method: 'PUT',
        body: JSON.stringify({
          deckIndex: deckIndex,
          cardIds: validCardIds
        })
      });

      if (data.success) {
        console.log("✅ Deck sauvegardé avec succès");
        return true;
      } else {
        console.error("❌ Erreur de sauvegarde:", data.message);
        this.showMessage(`Erreur: ${data.message}`, "error");
        return false;
      }

    } catch (error) {
      console.error("❌ Erreur lors de la sauvegarde:", error);
      return false;
    }
  }

  showMessage(message, type = "info") {
    // Créer une notification temporaire
    const notification = document.createElement("div");
    notification.className = `deck-notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
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
      ${type === 'success' ? 'background: #2ecc71;' : ''}
      ${type === 'error' ? 'background: #e74c3c;' : ''}
      ${type === 'warning' ? 'background: #f39c12;' : ''}
      ${type === 'info' ? 'background: #3498db;' : ''}
    `;

    document.body.appendChild(notification);

    // Supprimer après 3 secondes
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = "slideOut 0.3s ease-out";
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, 3000);
  }

  renderCollection() {
  const colContainer = this.tabElement.querySelector(".collection-grid");
  if (!colContainer) return;

  colContainer.innerHTML = "";

  console.log("🎨 Rendu collection avec tri par rareté, toutes les cartes visibles");

  // Ordre de rareté
  const rarityOrder = { legendary: 1, epic: 2, rare: 3, common: 4 };

  // On part de toutes les cartes du jeu
  const sorted = [...this.allCards].sort((a, b) => {
    return (rarityOrder[a.rarity] || 99) - (rarityOrder[b.rarity] || 99);
  });

  sorted.forEach(card => {
    // Vérifie si le joueur la possède
    const owned = this.collection.find(c => c.cardId === card.id);

    const cardEl = document.createElement("div");
    cardEl.className = "collection-card";
    if (!owned) cardEl.classList.add("locked"); // grisée si non possédée

    cardEl.draggable = !!owned;
    cardEl.dataset.cardId = card.id;
    cardEl.dataset.cardLevel = owned?.level || 1;

    const sprite = card.sprite ? `/cards/${card.sprite}` : null;

    if (sprite) {
      cardEl.innerHTML = `
        <img src="${sprite}" alt="${card.nameKey || card.id}"
             onerror="this.onerror=null;this.src='/cards/fallback.png';" />
        <div class="collection-info">
          <span>${card.nameKey || card.id}</span>
          ${owned 
            ? `<span>Niveau ${owned.level} - x${owned.count}</span>` 
            : `<span>🔒 Non possédée</span>`}
        </div>
        ${owned ? `<div class="drag-hint">📱 Glisser vers le deck</div>` : ""}
      `;
    } else {
      cardEl.innerHTML = `
        <div class="collection-card-fallback">
          <span>${card.nameKey || card.id}</span>
        </div>
        <div class="collection-info">
          <span>${card.nameKey || card.id}</span>
          ${owned 
            ? `<span>Niveau ${owned.level} - x${owned.count}</span>` 
            : `<span>🔒 Non possédée</span>`}
        </div>
        ${owned ? `<div class="drag-hint">📱 Glisser vers le deck</div>` : ""}
      `;
    }

    if (owned) {
      // Drag & drop seulement pour les cartes possédées
      cardEl.addEventListener("dragstart", (e) => {
        this.handleCardDragStart(e, owned);
      });
      cardEl.addEventListener("dragend", (e) => {
        this.handleCardDragEnd(e);
      });
      cardEl.addEventListener("click", () => {
        if (!this.isDragging) {
          this.handleCardClick(owned);
        }
      });
    }

    colContainer.appendChild(cardEl);
  });

  console.log("✅ Collection rendue:", sorted.length, "cartes affichées (possédées + non possédées)");
}


  calculateAvgElixir(deck) {
    if (!deck || !Array.isArray(deck)) return 0;
    
    const costs = deck
      .filter(slot => {
        // Vérifier différents formats possibles
        if (!slot) return false;
        
        // Format avec cardInfo
        if (slot.cardInfo?.elixirCost) return true;
        
        // Format avec cardId - chercher dans allCards
        if (slot.cardId && this.allCards.length > 0) {
          const cardInfo = this.allCards.find(c => c.id === slot.cardId);
          return cardInfo?.elixirCost;
        }
        
        return false;
      })
      .map(slot => {
        // Récupérer le coût d'élixir
        if (slot.cardInfo?.elixirCost) {
          return slot.cardInfo.elixirCost;
        }
        
        if (slot.cardId && this.allCards.length > 0) {
          const cardInfo = this.allCards.find(c => c.id === slot.cardId);
          return cardInfo?.elixirCost || 0;
        }
        
        return 0;
      });
    
    if (costs.length === 0) return 0;
    const total = costs.reduce((a, b) => a + b, 0);
    console.log("⚡ Calcul élixir:", { costs, total, average: total / costs.length });
    return total / costs.length;
  }

  showAllCards() {
    console.log("👁️ Affichage de toutes les cartes du jeu");
    this.tabElement.querySelector(".deck-section").style.display = "none";
    this.tabElement.querySelector(".my-cards-section").style.display = "none";
    this.tabElement.querySelector(".all-cards-section").style.display = "block";
    this.renderAllCards();
  }

  showDeck() {
    console.log("👁️ Affichage du deck et mes cartes");
    this.tabElement.querySelector(".all-cards-section").style.display = "none";
    this.tabElement.querySelector(".deck-section").style.display = "block";
    this.tabElement.querySelector(".my-cards-section").style.display = "block";
    this.renderDeck();
    this.renderMyCards();
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
   /**
   * Mise à jour des données joueur depuis Colyseus (world:welcome)
   */
  updatePlayerData(playerData) {
    console.log("🔄 updatePlayerData reçu:", playerData);

    // Exemple : si tu veux mettre à jour la collection et decks en live
    if (playerData?.collection) {
      this.collection = playerData.collection.cards || [];
      this.renderMyCards();
    }

    if (playerData?.decks) {
      this.decks = playerData.decks;
      this.currentDeck = this.decks.find(d => d.isActive) || this.decks[0];
      this.renderDeck();
    }
  }

}
 
export default CardsTab;
