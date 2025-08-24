class CardsTab {
  constructor() {
    this.isActive = false;
    this.currentUser = null;

    this.container = null;
    this.tabElement = null;

    this.collectionCards = []; // toutes les cartes enrichies (débloquées + verrouillées)

    this.eventListeners = new Map();
  }

  async initialize(container) {
    this.container = container;
    this.createTabElement();
    this.renderLayout();
    await this.loadCollection();
  }

  createTabElement() {
    this.tabElement = document.createElement('div');
    this.tabElement.className = 'cards-tab';
    this.tabElement.id = 'cards-tab';
    this.container.appendChild(this.tabElement);
  }

  renderLayout() {
    this.tabElement.innerHTML = `
      <div class="cards-main-content">
        <!-- Deck actif -->
        <div class="deck-section">
          <h3>Mon Deck Actif</h3>
          <div class="deck-slots" id="deck-slots"></div>
        </div>

        <!-- Bouton pour afficher la collection -->
        <button class="btn-view-collection" id="btn-view-collection">Voir la Collection</button>

        <!-- Grille de collection -->
        <div class="collection-grid" id="collection-grid"></div>
      </div>
    `;

    this.tabElement.querySelector('#btn-view-collection')
      .addEventListener('click', () => {
        const grid = this.tabElement.querySelector('#collection-grid');
        grid.classList.toggle('active');
      });
  }

  async loadCollection() {
    try {
      const token = localStorage.getItem('authToken');

      // Récupère toutes les cartes existantes
      const allCardsRes = await fetch('/api/cards', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const allCardsJson = await allCardsRes.json();
      const allCards = allCardsJson.data.cards;

      // Récupère les cartes du joueur
      const collectionRes = await fetch('/api/collection/cards', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const collectionJson = await collectionRes.json();
      const playerCards = collectionJson.data.cards;

      // Fusionner : mapper toutes les cartes → si pas dans playerCards = locked
      this.collectionCards = allCards.map(card => {
        const owned = playerCards.find(pc => pc.cardId === card.id);
        if (owned) {
          return {
            ...card,
            owned: true,
            level: owned.level,
            count: owned.count
          };
        } else {
          return {
            ...card,
            owned: false,
            level: 0,
            count: 0
          };
        }
      });

      this.renderCollection();
    } catch (err) {
      console.error('Erreur chargement collection:', err);
    }
  }

  renderCollection() {
    const grid = this.tabElement.querySelector('#collection-grid');
    grid.innerHTML = '';

    this.collectionCards.forEach(card => {
      const el = document.createElement('div');
      el.className = 'collection-card';
      if (!card.owned) el.classList.add('locked');

      el.innerHTML = `
        <div class="card-frame">
          <img src="/cards/${card.sprite}" alt="${card.id}" class="card-img" />
          ${!card.owned ? `<div class="card-locked-overlay">🔒</div>` : ''}
        </div>
        <div class="card-info">
          <span class="card-name">${card.nameKey}</span>
          ${card.owned ? `<span class="card-level">Lvl ${card.level}</span><span class="card-count">x${card.count}</span>` : `<span class="card-locked-text">Non débloquée</span>`}
        </div>
      `;

      grid.appendChild(el);
    });
  }

  // ========== Lifecycle ==========
  updatePlayerData(user) {
    this.currentUser = user;
  }

  show() {
    this.tabElement.classList.add('active');
    this.isActive = true;
  }

  hide() {
    this.tabElement.classList.remove('active');
    this.isActive = false;
  }

  activate() { this.show(); }
  deactivate() { this.hide(); }

  async cleanup() {
    this.eventListeners.clear();
    if (this.tabElement?.parentNode) this.tabElement.parentNode.removeChild(this.tabElement);
    this.container = null;
    this.tabElement = null;
  }
}

export default CardsTab;
