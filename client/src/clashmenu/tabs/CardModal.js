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
          <div class="cm-upgrade">
            <span class="cm-upgrade-req"></span>
            <button class="cm-upgrade-btn" disabled>Améliorer</button>
          </div>
        </div>
        <div class="card-modal-actions">
          <button class="cm-add-btn">Ajouter au deck</button>
        </div>
      </div>
    `;
    container.appendChild(this.modal);

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

    this.modal.querySelector(".cm-sprite").src = info.sprite ? `/cards/${info.sprite}` : "/cards/fallback.png";
    this.modal.querySelector(".cm-name").textContent = info.nameKey || card.cardId;
    this.modal.querySelector(".cm-rarity").textContent = info.rarity || "common";
    this.modal.querySelector(".cm-elixir").textContent = (info.elixirCost ?? "?") + "⚡";
    this.modal.querySelector(".cm-level-value").textContent = lvl;
    this.modal.querySelector(".cm-max-badge").style.display = (lvl >= max) ? "inline" : "none";

    // TODO : stats & upgrade

    this.modal.style.display = "flex";
  }

  close() {
    if (this.modal) this.modal.style.display = "none";
  }
}

export default CardModal;
