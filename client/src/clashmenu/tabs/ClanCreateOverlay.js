/**
 * ClanCreateOverlay.js - Overlay pour créer un nouveau clan
 * Interface complète avec validation et preview
 */
class ClanCreateOverlay {
  constructor() {
    this.isOpen = false;
    this.container = null;
    this.overlay = null;
    
    // Form data
    this.formData = {
      name: '',
      description: '',
      badge: 'crown',
      type: 'open',
      requiredTrophies: 0,
      region: 'global'
    };
    
    // Available badges
    this.availableBadges = [
      { id: 'crown', icon: '👑', name: 'Crown' },
      { id: 'sword', icon: '⚔️', name: 'Sword' },
      { id: 'shield', icon: '🛡️', name: 'Shield' },
      { id: 'star', icon: '⭐', name: 'Star' },
      { id: 'fire', icon: '🔥', name: 'Fire' },
      { id: 'lightning', icon: '⚡', name: 'Lightning' },
      { id: 'dragon', icon: '🐉', name: 'Dragon' },
      { id: 'castle', icon: '🏰', name: 'Castle' }
    ];
    
    // Event listeners
    this.eventListeners = new Map();
    
    console.log('✨ ClanCreateOverlay created');
  }

  /**
   * Initialize overlay
   */
  initialize(parentContainer) {
    if (!parentContainer) {
      throw new Error('Parent container is required for ClanCreateOverlay');
    }
    
    this.container = parentContainer;
    console.log('✨ ClanCreateOverlay initialized');
  }

  /**
   * Open overlay
   */
  open() {
    if (this.isOpen) return;
    
    this.createOverlay();
    this.setupEventListeners();
    this.animateIn();
    
    this.isOpen = true;
    console.log('✨ Create clan overlay opened');
  }

  /**
   * Close overlay
   */
  close() {
    if (!this.isOpen || !this.overlay) return;
    
    this.animateOut(() => {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
      this.overlay = null;
      this.isOpen = false;
      
      this.emit('overlay:closed');
      console.log('✨ Create clan overlay closed');
    });
  }

  /**
   * Create overlay DOM
   */
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'clan-create-overlay';
    this.overlay.innerHTML = `
      <div class="overlay-backdrop" id="overlay-backdrop"></div>
      <div class="overlay-container">
        <div class="overlay-header">
          <h2>✨ Create Your Clan</h2>
          <button class="overlay-close-btn" id="btn-close-overlay">✕</button>
        </div>
        
        <div class="overlay-content">
          <!-- Clan Preview -->
          <div class="clan-preview">
            <div class="preview-badge" id="preview-badge">👑</div>
            <div class="preview-info">
              <div class="preview-name" id="preview-name">My Awesome Clan</div>
              <div class="preview-tag" id="preview-tag">#GENERATING...</div>
              <div class="preview-description" id="preview-description">A great clan for epic battles!</div>
            </div>
          </div>

          <!-- Form -->
          <form class="clan-form" id="clan-form">
            <!-- Clan Name -->
            <div class="form-group">
              <label class="form-label">
                <span class="label-text">Clan Name</span>
                <span class="label-required">*</span>
              </label>
              <input 
                type="text" 
                class="form-input" 
                id="input-name" 
                placeholder="Enter clan name..." 
                maxlength="50"
                value="My Awesome Clan"
              >
              <div class="form-hint">3-50 characters</div>
            </div>

            <!-- Description -->
            <div class="form-group">
              <label class="form-label">
                <span class="label-text">Description</span>
              </label>
              <textarea 
                class="form-textarea" 
                id="input-description" 
                placeholder="Describe your clan..." 
                maxlength="200"
                rows="3"
              >A great clan for epic battles!</textarea>
              <div class="form-hint">0-200 characters</div>
            </div>

            <!-- Badge Selection -->
            <div class="form-group">
              <label class="form-label">
                <span class="label-text">Clan Badge</span>
              </label>
              <div class="badge-selector" id="badge-selector">
                ${this.availableBadges.map(badge => `
                  <button 
                    type="button" 
                    class="badge-option ${badge.id === 'crown' ? 'active' : ''}" 
                    data-badge="${badge.id}"
                  >
                    <span class="badge-icon">${badge.icon}</span>
                    <span class="badge-name">${badge.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Clan Type -->
            <div class="form-group">
              <label class="form-label">
                <span class="label-text">Clan Type</span>
              </label>
              <div class="type-selector">
                <label class="type-option active">
                  <input type="radio" name="clanType" value="open" checked>
                  <div class="type-info">
                    <div class="type-title">🌐 Open</div>
                    <div class="type-desc">Anyone can join</div>
                  </div>
                </label>
                <label class="type-option">
                  <input type="radio" name="clanType" value="invite_only">
                  <div class="type-info">
                    <div class="type-title">🔐 Invite Only</div>
                    <div class="type-desc">Requires approval</div>
                  </div>
                </label>
                <label class="type-option">
                  <input type="radio" name="clanType" value="closed">
                  <div class="type-info">
                    <div class="type-title">🔒 Closed</div>
                    <div class="type-desc">No new members</div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Required Trophies -->
            <div class="form-group">
              <label class="form-label">
                <span class="label-text">Required Trophies</span>
              </label>
              <div class="trophies-selector">
                <input 
                  type="range" 
                  class="trophies-slider" 
                  id="trophies-slider" 
                  min="0" 
                  max="8000" 
                  value="0" 
                  step="100"
                >
                <div class="trophies-display">
                  <span class="trophies-icon">🏆</span>
                  <span class="trophies-value" id="trophies-value">0</span>
                </div>
              </div>
              <div class="form-hint">Minimum trophies to join</div>
            </div>

            <!-- Region -->
            <div class="form-group">
              <label class="form-label">
                <span class="label-text">Region</span>
              </label>
              <select class="form-select" id="input-region">
                <option value="global">🌍 Global</option>
                <option value="europe">🇪🇺 Europe</option>
                <option value="north_america">🇺🇸 North America</option>
                <option value="asia">🌏 Asia</option>
                <option value="south_america">🇧🇷 South America</option>
                <option value="oceania">🇦🇺 Oceania</option>
                <option value="africa">🌍 Africa</option>
              </select>
            </div>
          </form>
        </div>

        <div class="overlay-footer">
          <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
          <button class="btn btn-primary" id="btn-create">
            <span class="btn-icon">✨</span>
            <span class="btn-text">Create Clan</span>
          </button>
        </div>
      </div>
    `;
    
    this.container.appendChild(this.overlay);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (!this.overlay) return;

    // Close buttons
    const closeBtn = this.overlay.querySelector('#btn-close-overlay');
    const cancelBtn = this.overlay.querySelector('#btn-cancel');
    const backdrop = this.overlay.querySelector('#overlay-backdrop');
    
    closeBtn?.addEventListener('click', () => this.close());
    cancelBtn?.addEventListener('click', () => this.close());
    backdrop?.addEventListener('click', () => this.close());

    // Form inputs
    const nameInput = this.overlay.querySelector('#input-name');
    const descInput = this.overlay.querySelector('#input-description');
    const trophiesSlider = this.overlay.querySelector('#trophies-slider');

    nameInput?.addEventListener('input', (e) => this.updatePreview('name', e.target.value));
    descInput?.addEventListener('input', (e) => this.updatePreview('description', e.target.value));
    trophiesSlider?.addEventListener('input', (e) => this.updateTrophiesDisplay(e.target.value));

    // Badge selector
    const badgeSelector = this.overlay.querySelector('#badge-selector');
    badgeSelector?.addEventListener('click', (e) => {
      const badgeOption = e.target.closest('.badge-option');
      if (badgeOption) {
        this.selectBadge(badgeOption.dataset.badge);
      }
    });

    // Type selector
    const typeOptions = this.overlay.querySelectorAll('input[name="clanType"]');
    typeOptions.forEach(option => {
      option.addEventListener('change', (e) => {
        this.selectType(e.target.value);
      });
    });

    // Create button
    const createBtn = this.overlay.querySelector('#btn-create');
    createBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleCreateClan();
    });

    // Prevent form submission
    const form = this.overlay.querySelector('#clan-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateClan();
    });
  }

  /**
   * Update preview display
   */
  updatePreview(field, value) {
    const previewElements = {
      name: this.overlay?.querySelector('#preview-name'),
      description: this.overlay?.querySelector('#preview-description')
    };

    if (previewElements[field]) {
      if (field === 'name') {
        previewElements[field].textContent = value || 'My Awesome Clan';
        this.formData.name = value;
      } else if (field === 'description') {
        previewElements[field].textContent = value || 'A great clan for epic battles!';
        this.formData.description = value;
      }
    }
  }

  /**
   * Update trophies display
   */
  updateTrophiesDisplay(value) {
    const trophiesValue = this.overlay?.querySelector('#trophies-value');
    if (trophiesValue) {
      trophiesValue.textContent = value;
      this.formData.requiredTrophies = parseInt(value);
    }
  }

  /**
   * Select badge
   */
  selectBadge(badgeId) {
    const badge = this.availableBadges.find(b => b.id === badgeId);
    if (!badge) return;

    // Update active state
    const options = this.overlay?.querySelectorAll('.badge-option');
    options?.forEach(option => {
      option.classList.toggle('active', option.dataset.badge === badgeId);
    });

    // Update preview
    const previewBadge = this.overlay?.querySelector('#preview-badge');
    if (previewBadge) {
      previewBadge.textContent = badge.icon;
    }

    this.formData.badge = badgeId;
  }

  /**
   * Select clan type
   */
  selectType(type) {
    // Update active state
    const typeOptions = this.overlay?.querySelectorAll('.type-option');
    typeOptions?.forEach(option => {
      const radio = option.querySelector('input[type="radio"]');
      option.classList.toggle('active', radio?.value === type);
    });

    this.formData.type = type;
  }

  /**
   * Handle create clan
   */
  async handleCreateClan() {
    try {
      // Validate form
      const validation = this.validateForm();
      if (!validation.valid) {
        this.showError(validation.error);
        return;
      }

      // Show loading
      this.setLoading(true);

      // Collect form data
      const formData = this.collectFormData();
      
      console.log('✨ Creating clan with data:', formData);

      // TODO: Send API request to create clan
      // const response = await fetch('/api/clan/create', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${userToken}`
      //   },
      //   body: JSON.stringify(formData)
      // });

      // Simulate API call
      await this.simulateApiCall(2000);

      // Success
      this.showSuccess('Clan created successfully! 🎉');
      
      setTimeout(() => {
        this.emit('clan:created', formData);
        this.close();
      }, 1500);

    } catch (error) {
      console.error('❌ Error creating clan:', error);
      this.showError('Failed to create clan. Please try again.');
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Validate form data
   */
  validateForm() {
    const name = this.formData.name?.trim();
    
    if (!name || name.length < 3) {
      return { valid: false, error: 'Clan name must be at least 3 characters long' };
    }

    if (name.length > 50) {
      return { valid: false, error: 'Clan name cannot exceed 50 characters' };
    }

    if (this.formData.description && this.formData.description.length > 200) {
      return { valid: false, error: 'Description cannot exceed 200 characters' };
    }

    return { valid: true };
  }

  /**
   * Collect all form data
   */
  collectFormData() {
    const regionSelect = this.overlay?.querySelector('#input-region');
    
    return {
      name: this.formData.name?.trim(),
      description: this.formData.description?.trim() || '',
      badge: this.formData.badge,
      type: this.formData.type,
      requiredTrophies: this.formData.requiredTrophies,
      region: regionSelect?.value || 'global'
    };
  }

  /**
   * Show error message
   */
  showError(message) {
    this.showNotification(message, 'error');
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = this.overlay?.querySelector('.overlay-notification');
    if (existing) {
      existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = `overlay-notification ${type}`;
    notification.innerHTML = `
      <span class="notification-icon">${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span>
      <span class="notification-text">${message}</span>
    `;

    const content = this.overlay?.querySelector('.overlay-content');
    if (content) {
      content.insertBefore(notification, content.firstChild);

      // Auto remove after 5 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 5000);
    }
  }

  /**
   * Set loading state
   */
  setLoading(loading) {
    const createBtn = this.overlay?.querySelector('#btn-create');
    const cancelBtn = this.overlay?.querySelector('#btn-cancel');
    
    if (createBtn) {
      createBtn.disabled = loading;
      createBtn.innerHTML = loading ? 
        '<span class="loading-spinner"></span><span>Creating...</span>' :
        '<span class="btn-icon">✨</span><span class="btn-text">Create Clan</span>';
    }
    
    if (cancelBtn) {
      cancelBtn.disabled = loading;
    }
  }

  /**
   * Simulate API call
   */
  async simulateApiCall(delay) {
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Animate in
   */
  animateIn() {
    if (!this.overlay) return;

    this.overlay.style.opacity = '0';
    this.overlay.style.display = 'flex';

    const container = this.overlay.querySelector('.overlay-container');
    if (container) {
      container.style.transform = 'scale(0.8) translateY(50px)';
      container.style.opacity = '0';
    }

    // Animate
    requestAnimationFrame(() => {
      this.overlay.style.transition = 'opacity 0.3s ease';
      this.overlay.style.opacity = '1';

      if (container) {
        container.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        container.style.transform = 'scale(1) translateY(0)';
        container.style.opacity = '1';
      }
    });
  }

  /**
   * Animate out
   */
  animateOut(callback) {
    if (!this.overlay) {
      callback?.();
      return;
    }

    const container = this.overlay.querySelector('.overlay-container');
    
    this.overlay.style.transition = 'opacity 0.25s ease';
    this.overlay.style.opacity = '0';

    if (container) {
      container.style.transition = 'all 0.25s ease';
      container.style.transform = 'scale(0.9) translateY(30px)';
      container.style.opacity = '0';
    }

    setTimeout(() => {
      callback?.();
    }, 250);
  }

  /**
   * Event system
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ClanCreateOverlay event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.close();
    this.eventListeners.clear();
    console.log('🧹 ClanCreateOverlay cleaned up');
  }
}

export default ClanCreateOverlay;
