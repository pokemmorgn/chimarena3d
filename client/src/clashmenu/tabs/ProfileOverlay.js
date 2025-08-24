/**
 * Profile Overlay - Fullscreen modal for player profile
 * Allows changing avatar, banner, name (and later stats view)
 */
class ProfileOverlay {
  constructor() {
    this.container = null;
    this.overlay = null;
    this.eventListeners = new Map();

    // Assets prédéfinis
    this.availableAvatars = [
      "assets/avatars/avatar_01.png",
      "assets/avatars/avatar_02.png",
      "assets/avatars/avatar_03.png"
    ];
    this.availableBanners = [
      "assets/banners/banner_01.jpg",
      "assets/banners/banner_02.jpg",
      "assets/banners/banner_03.jpg"
    ];
  }

  initialize(container) {
    this.container = container;
    this.renderOverlay();
    this.setupEventListeners();
  }

  renderOverlay() {
    this.overlay = document.createElement("div");
    this.overlay.className = "profile-overlay";
    this.overlay.id = "profile-overlay";

    this.overlay.innerHTML = `
      <div class="profile-content">
        <!-- Banner -->
        <img id="profile-banner" class="profile-banner" src="assets/banners/banner_01.jpg" />

        <!-- Avatar -->
        <img id="profile-avatar" class="profile-avatar" src="assets/avatars/avatar_01.png" />

        <!-- Player name -->
        <input id="profile-name" class="profile-name" type="text" value="Player" />

        <!-- Stats -->
        <div class="profile-stats">
          <div>🏆 Trophies: <span id="profile-trophies">0</span></div>
          <div>⭐ Level: <span id="profile-level">1</span></div>
          <div>⚔️ Wins: <span id="profile-wins">0</span></div>
        </div>

        <!-- Action buttons -->
        <button id="btn-save-profile">💾 Save</button>
        <button id="btn-close-profile">❌ Close</button>
      </div>

      <!-- Selection Menus -->
      <div class="selection-menu" id="avatar-selection"></div>
      <div class="selection-menu" id="banner-selection"></div>
    `;

    this.container.appendChild(this.overlay);
  }

  setupEventListeners() {
    const closeBtn = this.overlay.querySelector("#btn-close-profile");
    const saveBtn = this.overlay.querySelector("#btn-save-profile");

    const avatarImg = this.overlay.querySelector("#profile-avatar");
    const bannerImg = this.overlay.querySelector("#profile-banner");

    const avatarMenu = this.overlay.querySelector("#avatar-selection");
    const bannerMenu = this.overlay.querySelector("#banner-selection");

    // Close
    closeBtn.addEventListener("click", () => {
      this.overlay.classList.remove("active");
    });

    // Save
    saveBtn.addEventListener("click", () => {
      const data = {
        name: this.overlay.querySelector("#profile-name").value,
        avatar: avatarImg.dataset.selected || "assets/avatars/avatar_01.png",
        banner: bannerImg.dataset.selected || "assets/banners/banner_01.jpg"
      };
      this.emit("profile:update", data);
      this.overlay.classList.remove("active");
    });

    // Avatar change
    avatarImg.addEventListener("click", () => {
      avatarMenu.innerHTML = this.availableAvatars.map(src => `
        <img src="${src}" class="selection-item avatar-option" data-src="${src}" />
      `).join("");
      avatarMenu.classList.add("active");

      avatarMenu.querySelectorAll(".avatar-option").forEach(opt => {
        opt.addEventListener("click", () => {
          avatarImg.src = opt.dataset.src;
          avatarImg.dataset.selected = opt.dataset.src;
          avatarMenu.classList.remove("active");
        });
      });
    });

    // Banner change
    bannerImg.addEventListener("click", () => {
      bannerMenu.innerHTML = this.availableBanners.map(src => `
        <img src="${src}" class="selection-item banner-option" data-src="${src}" />
      `).join("");
      bannerMenu.classList.add("active");

      bannerMenu.querySelectorAll(".banner-option").forEach(opt => {
        opt.addEventListener("click", () => {
          bannerImg.src = opt.dataset.src;
          bannerImg.dataset.selected = opt.dataset.src;
          bannerMenu.classList.remove("active");
        });
      });
    });
  }

  open(profileData) {
    if (profileData) {
      this.overlay.querySelector("#profile-name").value = profileData.name || "Player";
      this.overlay.querySelector("#profile-trophies").textContent = profileData.trophies || 0;
      this.overlay.querySelector("#profile-level").textContent = profileData.level || 1;
      this.overlay.querySelector("#profile-wins").textContent = profileData.wins || 0;

      this.overlay.querySelector("#profile-avatar").src = profileData.avatar || "assets/avatars/avatar_01.png";
      this.overlay.querySelector("#profile-banner").src = profileData.banner || "assets/banners/banner_01.jpg";
    }
    this.overlay.classList.add("active");
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(cb => cb(data));
    }
  }
}

export default ProfileOverlay;
