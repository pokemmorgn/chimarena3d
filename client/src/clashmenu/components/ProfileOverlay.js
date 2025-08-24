/**
 * Profile Overlay - Fullscreen modal for player profile
 * Allows changing avatar, banner, name + shows all player stats
 */
class ProfileOverlay {
  constructor() {
    this.container = null;
    this.overlay = null;
    this.eventListeners = new Map();

    // Assets prédéfinis
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
        <img id="profile-banner" class="profile-banner" src="/banners/banner_01.jpg" />

        <!-- Avatar -->
        <img id="profile-avatar" class="profile-avatar" src="/avatars/avatar_01.png" />

        <!-- Player name -->
        <input id="profile-name" class="profile-name" type="text" value="Player" />

        <!-- Stats -->
        <div class="profile-stats">
          <div>🏆 Current Trophies: <span id="profile-currentTrophies">0</span></div>
          <div>🌟 Highest Trophies: <span id="profile-highestTrophies">0</span></div>
          <div>🎮 Games Played: <span id="profile-gamesPlayed">0</span></div>
          <div>✅ Wins: <span id="profile-gamesWon">0</span></div>
          <div>❌ Losses: <span id="profile-gamesLost">0</span></div>
          <div>📈 Win Rate: <span id="profile-winRate">0%</span></div>
          <div>⭐ Level: <span id="profile-level">1</span> (XP: <span id="profile-xp">0</span>)</div>
          <div>📅 Joined: <span id="profile-createdAt">-</span></div>
          <div>🕹️ Last Login: <span id="profile-lastLogin">-</span></div>
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
        avatar: avatarImg.dataset.selected || "/avatars/avatar_01.png",
        banner: bannerImg.dataset.selected || "/banners/banner_01.jpg"
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
      // Basic info
      this.overlay.querySelector("#profile-name").value = profileData.displayName || profileData.username || "Player";

      // Stats
      this.overlay.querySelector("#profile-currentTrophies").textContent = profileData.stats?.currentTrophies || 0;
      this.overlay.querySelector("#profile-highestTrophies").textContent = profileData.stats?.highestTrophies || 0;
      this.overlay.querySelector("#profile-gamesPlayed").textContent = profileData.stats?.gamesPlayed || 0;
      this.overlay.querySelector("#profile-gamesWon").textContent = profileData.stats?.gamesWon || 0;
      this.overlay.querySelector("#profile-gamesLost").textContent = profileData.stats?.gamesLost || 0;
      this.overlay.querySelector("#profile-winRate").textContent = `${profileData.stats?.winRate || 0}%`;

      this.overlay.querySelector("#profile-level").textContent = profileData.level || 1;
      this.overlay.querySelector("#profile-xp").textContent = profileData.experience || 0;

      // Dates
      this.overlay.querySelector("#profile-createdAt").textContent =
        profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : "-";
      this.overlay.querySelector("#profile-lastLogin").textContent =
        profileData.lastLogin ? new Date(profileData.lastLogin).toLocaleString() : "-";

      // Avatar & banner
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
