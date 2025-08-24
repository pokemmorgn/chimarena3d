class CardModal {
  constructor(cardsTab) {
    this.cardsTab = cardsTab;
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
            Level: <strong class="cm-level-value"></strong>
            <span class="cm-max-badge" style="display:none;">MAX</span>
          </div>
          <div class="cm-stats"></div>
          <div class="cm-upgrade" style="display:none;">
            <span class="cm-upgrade-req"></span>
            <button class="cm-upgrade-btn">Upgrade</button>
          </div>
        </div>
        <div class="card-modal-actions">
          <button class="cm-add-btn">Add to deck</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.modal);

    // close
    this.modal.querySelector(".card-modal-close")
      .addEventListener("click", () => this.close());
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.close();
    });

    // add to deck
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

    // sprite
    const img = this.modal.querySelector(".cm-sprite");
    img.src = info.sprite ? `/cards/${info.sprite}` : "/cards/fallback.png";
    img.style.maxWidth = "80px";
    img.style.maxHeight = "80px";

    // text
    this.modal.querySelector(".cm-name").textContent = info.name || info.nameKey || card.cardId;
    this.modal.querySelector(".cm-rarity").textContent = info.rarity ? info.rarity.toUpperCase() : "COMMON";
    this.modal.querySelector(".cm-elixir").textContent = (info.elixirCost ?? "?") + "⚡";

    // level
    this.modal.querySelector(".cm-level-value").textContent = lvl;
    this.modal.querySelector(".cm-max-badge").style.display = (lvl >= max) ? "inline-block" : "none";

    // stats
    const statsEl = this.modal.querySelector(".cm-stats");
    statsEl.innerHTML = "";
    if (info.stats && typeof info.stats === "object") {
      const ul = document.createElement("ul");
      ul.style.listStyle = "none";
      ul.style.padding = "0";
      ul.style.margin = "0";
      for (const [key, value] of Object.entries(info.stats)) {
        const li = document.createElement("li");
        li.textContent = `${key}: ${value}`;
        ul.appendChild(li);
      }
      statsEl.appendChild(ul);
    } else {
      statsEl.textContent = "No stats available.";
    }

    // upgrade
    const upgradeBox = this.modal.querySelector(".cm-upgrade");
    const upgradeReq = this.modal.querySelector(".cm-upgrade-req");
    const upgradeBtn = this.modal.querySelector(".cm-upgrade-btn");

    if (card.canUpgrade) {
      upgradeBox.style.display = "block";
      upgradeReq.textContent = `Requires ${card.nextLevelCount} cards and ${card.nextLevelGold} gold`;
      upgradeBtn.disabled = false;
      upgradeBtn.onclick = async () => {
        console.log("🔧 Upgrade requested for", card.cardId);

        // Example: call API (replace with your real endpoint)
        try {
          const result = await this.cardsTab.authenticatedFetch(`/api/collection/upgrade`, {
            method: "POST",
            body: JSON.stringify({ cardId: card.cardId })
          });

          if (result.success) {
            alert(`${info.name || card.cardId} upgraded to level ${lvl + 1}!`);
            this.cardsTab.loadCollection(); // reload player cards
            this.close();
          } else {
            alert("Upgrade failed: " + result.message);
          }
        } catch (err) {
          alert("Upgrade error: " + err.message);
        }
      };
    } else {
      upgradeBox.style.display = "none";
    }

    this.modal.style.display = "flex";
  }

  close() {
    if (this.modal) this.modal.style.display = "none";
  }
}

export default CardModal;
