import ClanCreateOverlay from './ClanCreateOverlay.js';
import ClanAPI from '../../services/ClanAPI.js';
import ClanContent from './clan/ClanContent.js';

class ClanTab {
  constructor() {
    this.state = 'loading';
    this.currentUser = null;
    this.currentClan = null;
    this.container = null;
    this.tabElement = null;
    this.createOverlay = null;
    this.clanContent = null;
    
    // 🔥 AJOUT : Flag pour éviter les initialisations multiples
    this.isInitialized = false;
  }

  async initialize(container, currentUser) {
    if (this.isInitialized) {
      console.log('⚠️ ClanTab already initialized');
      return;
    }
    
    this.container = container;
    this.currentUser = currentUser;

    // 🔹 conteneur caché par défaut
    this.tabElement = document.createElement('div');
    this.tabElement.className = 'clan-tab';
    this.tabElement.style.display = 'none'; 
    this.container.appendChild(this.tabElement);

    this.createOverlay = new ClanCreateOverlay();
    this.createOverlay.initialize(this.container);
    this.createOverlay.on('clan:created', (clanData) => {
      console.log('🎉 ClanTab received clan:created event:', clanData);
      
      // Debug: vérifier les données reçues
      console.log('🔍 ClanData structure:', JSON.stringify(clanData, null, 2));
      
      this.currentClan = clanData;
      this.setState('has_clan');
    });

    // 🔥 CORRECTION : Attendre que les données utilisateur soient disponibles
    await this.waitForUserData();
    await this.checkClanStatus();
    
    this.isInitialized = true;
  }

  /**
   * 🔥 NOUVELLE MÉTHODE : Attendre que les données utilisateur soient disponibles
   */
  async waitForUserData() {
    console.log('⏳ Waiting for user data...');
    
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      // Essayer de récupérer les données utilisateur depuis plusieurs sources
      let user = this.currentUser;
      
      if (!user?.id) {
        // Source 1: GameState
        user = window.ClashRoyaleApp?.gameState?.getUser();
      }
      
      if (!user?.id) {
        // Source 2: NetworkManager
        user = window.ClashRoyaleApp?.networkManager?.getUserData();
      }
      
      if (!user?.id) {
        // Source 3: Colyseus
        user = window.ClashRoyaleApp?.networkManager?.getColyseusManager()?.getCurrentUser();
      }
      
      if (user?.id) {
        this.currentUser = {
          id: user._id || user.id,
          username: user.username,
          displayName: user.displayName,
          level: user.level,
          trophies: user.stats?.currentTrophies || user.trophies || 0,
          clanId: user.clanId || null,
          clanRole: user.clanRole || null
        };
        
        console.log('✅ User data loaded:', this.currentUser);
        return;
      }
      
      attempts++;
      console.log(`⏳ Attempt ${attempts}/${maxAttempts} - User data not ready yet...`);
      
      // Attendre 500ms avant le prochain essai
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.warn('⚠️ Could not load user data after max attempts');
  }

  async checkClanStatus() {
    console.log('🔄 ClanTab.checkClanStatus() called');
    this.setState('loading');
    
    try {
      // 🔥 VALIDATION : S'assurer qu'on a les données utilisateur
      if (!this.currentUser?.id) {
        console.warn('⚠️ No user data available, retrying...');
        await this.waitForUserData();
        
        if (!this.currentUser?.id) {
          throw new Error('User data not available after retry');
        }
      }
      
      const res = await ClanAPI.getMyClan();
      
      // Debug complet de la réponse API
      console.log('🔍 ClanAPI.getMyClan() full response:', res);
      console.log('🔍 Response success:', res.success);
      console.log('🔍 Response data:', res.data);
      
      if (res.success && res.data) {
        console.log('🔍 Clan data structure:', JSON.stringify(res.data, null, 2));
        console.log('🔍 Clan data keys:', Object.keys(res.data));
        
        // Vérifier les différents champs ID possibles
        console.log('🔍 ID fields check:', {
          clanId: res.data.clanId,
          _id: res.data._id,
          id: res.data.id,
          name: res.data.name,
          tag: res.data.tag
        });
        
        this.currentClan = res.data;
        this.setState('has_clan');
      } else {
        console.log('🔍 No clan found or API error:', res.error);
        this.setState('no_clan');
      }
    } catch (error) {
      console.error('❌ Error in checkClanStatus:', error);
      
      // Si l'erreur est liée à l'authentification, proposer une solution
      if (error.message?.includes('Authentication') || error.message?.includes('token')) {
        console.log('🔄 Authentication issue detected, checking auth status...');
        
        try {
          const isAuth = await window.ClashRoyaleApp?.networkManager?.verifyToken();
          if (!isAuth) {
            console.warn('⚠️ User not authenticated, redirecting to login...');
            // Rediriger vers le login ou afficher un message
            this.showAuthError();
            return;
          }
        } catch (authError) {
          console.error('❌ Error checking auth status:', authError);
        }
      }
      
      this.setState('no_clan');
    }
  }

  /**
   * 🔥 CORRECTION : updatePlayerData plus robuste
   */
  updatePlayerData(player) {
    console.log('👤 ClanTab.updatePlayerData called:', player);
    
    if (player) {
      this.currentUser = {
        id: player._id || player.id,
        username: player.username,
        displayName: player.displayName,
        level: player.level,
        trophies: player.stats?.currentTrophies || player.trophies || 0,
        clanId: player.clanId || null,
        clanRole: player.clanRole || null
      };

      console.log('✅ ClanTab currentUser updated:', this.currentUser);

      // Mettre à jour ClanContent s'il existe
      if (this.clanContent) {
        this.clanContent.updatePlayer(this.currentUser);
      }
      
      // Si on était en état de chargement et qu'on n'a pas encore vérifié le clan,
      // relancer la vérification
      if (this.state === 'loading' || (!this.currentClan && this.currentUser.clanId)) {
        console.log('🔄 User data updated, rechecking clan status...');
        setTimeout(() => {
          this.checkClanStatus();
        }, 500);
      }
    } else {
      console.warn('⚠️ ClanTab.updatePlayerData called with null/undefined player');
    }
  }

  /**
   * 🔥 NOUVELLE MÉTHODE : Gérer les erreurs d'authentification
   */
  showAuthError() {
    this.tabElement.innerHTML = `
      <div class="clan-auth-error">
        <div class="auth-error-header">
          <div class="error-icon">🔐</div>
          <h2>Authentication Required</h2>
          <p>Please log in to access clan features.</p>
        </div>
        <div class="clan-actions">
          <button class="clan-action-btn primary" id="btn-login">
            <span class="btn-icon">🔑</span>
            <span class="btn-text">Go to Login</span>
          </button>
          <button class="clan-action-btn secondary" id="btn-retry-auth">
            <span class="btn-icon">🔄</span>
            <span class="btn-text">Retry</span>
          </button>
        </div>
      </div>`;

    // Events pour les boutons
    this.tabElement.querySelector('#btn-login')?.addEventListener('click', () => {
      // Rediriger vers le login
      window.ClashRoyaleApp?.sceneManager?.switchToScene('login');
    });

    this.tabElement.querySelector('#btn-retry-auth')?.addEventListener('click', () => {
      this.checkClanStatus();
    });
  }

  setState(newState) {
    console.log(`🔄 ClanTab setState: ${this.state} -> ${newState}`);
    this.state = newState;
    this.render();
  }

  render() {
    if (!this.tabElement) return;

    if (this.state === 'loading') {
      this.tabElement.innerHTML = `
        <div class="clan-loading">
          <div class="loading-spinner"></div>
          <h3>Loading...</h3>
          <p>Please wait while we check your clan status...</p>
        </div>`;
    } else if (this.state === 'no_clan') {
      this.tabElement.innerHTML = `
        <div class="clan-no-clan">
          <div class="no-clan-header">
            <div class="clan-icon">🏰</div>
            <h2>No Clan</h2>
            <p>Join or create a clan to chat, share cards, and battle together!</p>
          </div>

          <div class="clan-actions">
            <button class="clan-action-btn primary" id="btn-create-clan">
              <span class="btn-icon">➕</span>
              <span class="btn-text">Create Clan</span>
            </button>
            <button class="clan-action-btn secondary" id="btn-join-clan">
              <span class="btn-icon">🔍</span>
              <span class="btn-text">Find Clan</span>
            </button>
          </div>

          <div class="clan-quick-stats">
            <div class="quick-stat">
              <div class="stat-number">0</div>
              <div class="stat-label">Clans</div>
            </div>
            <div class="quick-stat">
              <div class="stat-number">0</div>
              <div class="stat-label">Members</div>
            </div>
            <div class="quick-stat">
              <div class="stat-number">0</div>
              <div class="stat-label">Wars</div>
            </div>
          </div>
        </div>`;

      this.tabElement.querySelector('#btn-create-clan')
        .addEventListener('click', () => this.createOverlay.open());

      this.tabElement.querySelector('#btn-join-clan')
        .addEventListener('click', () => alert('Find Clan coming soon!'));
        
    } else if (this.state === 'has_clan') {
      console.log('🏰 Rendering ClanContent with clan:', this.currentClan);
      
      // Vérifier que nous avons bien les données du clan
      if (!this.currentClan) {
        console.error('❌ No clan data available for ClanContent');
        this.setState('no_clan');
        return;
      }
      
      // Debug: vérifier les IDs avant de passer à ClanContent
      console.log('🔍 About to pass clan to ClanContent:', {
        clanId: this.currentClan.clanId,
        _id: this.currentClan._id,
        id: this.currentClan.id,
        name: this.currentClan.name
      });
      
      // déléguer à ClanContent avec validation
      if (!this.clanContent) {
        this.clanContent = new ClanContent(this.tabElement, this.currentUser, this.currentClan);
      }
      
      this.clanContent.render();
    }
  }

  // 🔹 Gestion de visibilité pour TabNavigation
  hide() {
    if (this.tabElement) this.tabElement.style.display = 'none';
  }

  show() {
    if (this.tabElement) this.tabElement.style.display = 'flex'; // cohérent avec CSS .clan-tab
  }

  async cleanup() {
    if (this.tabElement && this.tabElement.parentNode) {
      this.tabElement.parentNode.removeChild(this.tabElement);
    }
    this.tabElement = null;
    this.clanContent = null;
  }
}

export default ClanTab;
