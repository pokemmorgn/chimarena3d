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

    // elements
    const statsEl = this.modal.querySelector(".cm-stats");
    const upgradeBox = this.modal.querySelector(".cm-upgrade");
    const upgradeReq = this.modal.querySelector(".cm-upgrade-req");
    const upgradeBtn = this.modal.querySelector(".cm-upgrade-btn");

    // reset
    statsEl.innerHTML = "Loading stats...";
    upgradeBox.style.display = "none";
    upgradeBtn.disabled = true;

    // fetch stats from backend
    fetch(`/api/cards/${card.cardId}/stats/${lvl}`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          statsEl.textContent = "Failed to load stats.";
          return;
        }

        const stats = data.data.stats;
        statsEl.innerHTML = "";

        // Only show important stats
        const importantStats = [
          { key: "hitpoints", label: "HP", icon: "❤️" },
          { key: "damage", label: "DMG", icon: "⚔️" },
          { key: "damagePerSecond", label: "DPS", icon: "💥" },
          { key: "range", label: "Range", icon: "🎯" },
          { key: "attackSpeed", label: "Atk Spd", icon: "⚡" },
          { key: "speed", label: "Speed", icon: "🏃" }
        ];

        const grid = document.createElement("div");
        grid.className = "cm-stats-grid";

        importantStats.forEach(s => {
          if (stats[s.key] !== undefined) {
            const item = document.createElement("div");
            item.className = "cm-stat-item";
            item.innerHTML = `
              <span class="cm-stat-icon">${s.icon}</span>
              <span class="cm-stat-label">${s.label}</span>
              <span class="cm-stat-value">${stats[s.key]}</span>
            `;
            grid.appendChild(item);
          }
        });

        statsEl.appendChild(grid);

        // handle upgrade
        const upgrade = data.data.upgradeCost;
        if (upgrade) {
          upgradeBox.style.display = "block";
          upgradeReq.textContent = `Requires ${upgrade.cards} cards and ${upgrade.gold} gold`;
          upgradeBtn.disabled = false;
          upgradeBtn.onclick = async () => {
            console.log("🔧 Upgrade requested for", card.cardId);
            try {
await this.cardsTab.authenticatedFetch(`/api/collection/upgrade-card`, {
                method: "POST",
                body: JSON.stringify({ cardId: card.cardId })
              });

              if (result.success) {
                alert(`${info.name || card.cardId} upgraded to level ${lvl + 1}!`);
                await this.cardsTab.loadCollection();
                this.close();
              } else {
                alert("Upgrade failed: " + result.message);
              }
            } catch (err) {
              alert("Upgrade error: " + err.message);
            }
          };
        }
      })
      .catch(err => {
        console.error("❌ Failed to load card stats:", err);
        statsEl.textContent = "Error loading stats.";
      });

    // show modal
    this.modal.style.display = "flex";
  }

  close() {
    if (this.modal) this.modal.style.display = "none";
  }
}

export default CardModal;
