class CardModal {
  constructor(cardsTab) {
    this.cardsTab = cardsTab; // accès aux méthodes updateDeckSlot, collection...
    this.modal = null;
    this.currentCard = null;
  }

  initialize(container) {
    this.modal = document.createElement("div");
    this.modal.className = "card-modal-overlay";
    this.modal.style.display = "none";
    this.modal.innerHTML = `
      <div class="card-modal">
        <button class="card-modal-close">✖</button>
        <div class="card-modal-header">
          <img class="cm-sprite" alt="sprite" />
          <div class="cm-title">
            <h3 class="cm-name"></h3>
            <div class="cm-meta">
              <span class="cm-rarity"></span> • <span class="cm-elixir"></span>
            </div>
          </div>
        </div>
        <div class="card-modal-body">
          <div class="cm-level">
            Niveau : <strong class="cm-level-value"></strong>
            <span class="cm-max-badge" style="display:none;">MAX</span>
          </div>
          <div class="cm-stats"></div>
          <div class="cm-upgrade" style="display:none;">
            <span class="cm-upgrade-req"></span>
            <button class="cm-upgrade-btn">Améliorer</button>
          </div>
        </div>
        <div class="card-modal-actions">
          <button class="cm-add-btn">Ajouter au deck</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.modal); // attaché directement au body

    // fermeture
    this.modal.querySelector(".card-modal-close")
      .addEventListener("click", () => this.close());
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.close();
    });

    // bouton ajouter
    this.modal.querySelector(".cm-add-btn").addEventListener("click", () => {
      if (this.currentCard) {
        const empty = this.cardsTab.findEmptyDeckSlot();
        const idx = empty !== -1 ? empty : 0;
        this.cardsTab.updateDeckSlot(idx, this.currentCard);
        this.close();
      }
    });
  }

  open(card) {
    if (!this.modal) return;
    this.currentCard = card;

    const info = card.cardInfo || this.cardsTab.allCards.find(c => c.id === card.cardId) || {};
    const lvl = card.level || 1;
    const max = card.maxLevel || info.maxLevel || 13;

    // --- Sprite ---
    const img = this.modal.querySelector(".cm-sprite");
    img.src = info.sprite ? `/cards/${info.sprite}` : "/cards/fallback.png";
    img.style.maxWidth = "80px";
    img.style.maxHeight = "80px";

    // --- Texte ---
    this.modal.querySelector(".cm-name").textContent = info.name || info.nameKey || card.cardId;
    this.modal.querySelector(".cm-rarity").textContent = info.rarity ? info.rarity.toUpperCase() : "COMMON";
    this.modal.querySelector(".cm-elixir").textContent = (info.elixirCost ?? "?") + "⚡";

    // --- Niveau ---
    this.modal.querySelector(".cm-level-value").textContent = lvl;
    this.modal.querySelector(".cm-max-badge").style.display = (lvl >= max) ? "inline-block" : "none";

    // --- Stats ---
    const statsEl = this.modal.querySelector(".cm-stats");
    statsEl.innerHTML = "";
    if (info.stats) {
      const ul = document.createElement("ul");
      ul.style.listStyle = "none";
      ul.style.padding = "0";
      for (const [key, value] of Object.entries(info.stats)) {
        const li = document.createElement("li");
        li.textContent = `${key}: ${value}`;
        ul.appendChild(li);
      }
      statsEl.appendChild(ul);
    } else {
      statsEl.textContent = "Aucune statistique disponible.";
    }

    // --- Upgrade ---
    const upgradeBox = this.modal.querySelector(".cm-upgrade");
    const upgradeReq = this.modal.querySelector(".cm-upgrade-req");
    const upgradeBtn = this.modal.querySelector(".cm-upgrade-btn");

    if (card.canUpgrade) {
      upgradeBox.style.display = "block";
      upgradeReq.textContent = `Amélioration possible (${card.nextLevelCount} cartes, ${card.nextLevelGold} or)`;
      upgradeBtn.disabled = false;
      upgradeBtn.onclick = () => {
        console.log("🔧 Upgrade lancé pour", card.cardId);
        this.close();
      };
    } else {
      upgradeBox.style.display = "none";
    }

    // afficher modal
    this.modal.style.display = "flex";
  }

  close() {
    if (this.modal) this.modal.style.display = "none";
  }
}

export default CardModal;
