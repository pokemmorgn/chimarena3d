/**
 * Clash Royale Style Header
 * Niveau + XP à gauche, ressources à droite
 */
class Header {
  constructor() {
    this.container = null;
    this.currentUser = null;
  }

  /**
   * Crée l'élément header
   */
  create() {
    this.container = document.createElement('div');
    this.container.className = 'clash-header';
    this.container.innerHTML = `
      <div class="header-left">
        <div class="player-level-circle" id="header-level">1</div>
        <div class="xp-bar">
          <div class="xp-fill" id="header-xp-fill" style="width:0%"></div>
        </div>
      </div>

      <div class="header-right">
        <div class="header-resource">
          <span class="resource-icon">💰</span>
          <span id="header-gold">0</span>
        </div>
        <div class="header-resource">
          <span class="resource-icon">💎</span>
          <span id="header-gems">0</span>
        </div>
      </div>
    `;
    return this.container;
  }

  /**
   * Met à jour les données joueur
   */
  updatePlayerData(user) {
    if (!user) return;
    this.currentUser = user;

    // Niveau
    const levelEl = this.container.querySelector('#header-level');
    if (levelEl) levelEl.textContent = user.level || 1;

    // XP (en %)
    const xpFill = this.container.querySelector('#header-xp-fill');
    if (xpFill) {
      const current = user.xp || 0;
      const required = user.xpRequired || 100;
      const percent = Math.min(100, Math.floor((current / required) * 100));
      xpFill.style.width = percent + '%';
    }

    // Gold
    const goldEl = this.container.querySelector('#header-gold');
    if (goldEl) goldEl.textContent = user.gold || 0;

    // Gems
    const gemsEl = this.container.querySelector('#header-gems');
    if (gemsEl) gemsEl.textContent = user.gems || 0;
  }

  cleanup() {
    if (this.container?.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.currentUser = null;
  }
}

export default Header;
