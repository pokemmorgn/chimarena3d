import ProfileOverlayStyles from './ProfileOverlayStyles.js';

/**
 * Profile Overlay - Fullscreen modal for player profile
 * Allows editing avatar, banner, name, and shows stats
 */
class ProfileOverlay {
  constructor() {
    this.container = null;
    this.overlay = null;
    this.eventListeners = new Map();

    this.availableAvatars = [
      "/avatars/avatar_01.png",
      "/avatars/avatar_02.png",
      "/avatars/avatar_03.png"
    ];
    this.availableBanners = [
      "/banners/banner_01.jpg",
      "/banners/banner_02.jpg",
      "/banners/banner_03.jpg"
    ];
  }

  initialize(container) {
    this.container = container;
    this.injectStyles();
    this.renderOverlay();
    this.setupEventListeners();
  }

  injectStyles() {
    const existing = document.getElementById('profile-overlay-styles');
    if (existing) existing.remove();

    const styleSheet = document.createElement('style');
    styleSheet.id = 'profile-overlay-styles';
    styleSheet.textContent = ProfileOverlayStyles.getCSS();
    document.head.appendChild(styleSheet);
  }

  renderOverlay() {
    this.overlay = document.createElement("div");
    this.overlay.className = "profile-overlay";
    this.overlay.id = "profile-overlay";

    this.overlay.innerHTML = `
      <div class="profile-window">
        <button class="close-btn" id="btn-close-profile">✖</button>

        <img id="profile-banner" class="profile-banner" src="/banners/banner_01.jpg" />

        <div class="profile-header">
          <img id="profile-avatar" class="profile-avatar" src="/avatars/avatar_01.png" />
          <input id="profile-name" class="profile-name" type="text" value="Player" />
        </div>

        <div class="profile-stats">
          <div>🏆 Trophies: <span id="profile-trophies">0</span></div>
          <div>⭐ Level: <span id="profile-level">1</span></div>
          <div>⚔️ Wins: <span id="profile-wins">0</span></div>
        </div>

        <div class="profile-actions">
          <button id="btn-save-profile">💾 Save</button>
        </div>

        <div class="selection-menu" id="avatar-selection"></div>
        <div class="selection-menu" id="banner-selection"></div>
      </div>
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

    closeBtn.addEventListener("click", () => {
      this.overlay.classList.remove("active");
    });

    saveBtn.addEventListener("click", () => {
      const data = {
        name: this.overlay.querySelector("#profile-name").value,
        avatar: avatarImg.dataset.selected || "/avatars/avatar_01.png",
        banner: bannerImg.dataset.selected || "/banners/banner_01.jpg"
      };
      this.emit("profile:update", data);
      this.overlay.classList.remove("active");
    });

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

      this.overlay.querySelector("#profile-avatar").src = profileData.avatar || "/avatars/avatar_01.png";
      this.overlay.querySelector("#profile-banner").src = profileData.banner || "/banners/banner_01.jpg";
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
