import { EventEmitter } from 'events';

/**
 * MatchmakingService - Service centralisé pour le matchmaking
 * Gère les files d'attente, critères de matching et création des matchs
 */

// Interface pour un joueur en file d'attente
export interface IQueuedPlayer {
  sessionId: string;
  userId: string;
  username: string;
  isBot?: boolean;          // Indique si c'est un bot
  
  // Données de matchmaking
  trophies: number;
  level: number;
  averageCardLevel: number;
  
  // Métadonnées
  joinTime: number;          // Timestamp d'entrée en file
  waitTime: number;          // Temps d'attente actuel
  region?: string;           // Région géographique (optionnelle)
  
  // Critères de recherche (s'élargissent avec le temps)
  trophyRange: {
    min: number;
    max: number;
  };
  maxWaitTime: number;       // Temps max d'attente avant élargissement
}

// Interface pour un match trouvé
export interface IMatch {
  matchId: string;
  player1: IQueuedPlayer;
  player2: IQueuedPlayer;
  averageTrophies: number;
  createdAt: number;
}

// Configuration du matchmaking
export interface IMatchmakingConfig {
  // Critères de base
  initialTrophyRange: number;      // ±100 trophées initialement
  maxTrophyRange: number;          // ±500 trophées maximum
  trophyRangeExpansion: number;    // +50 trophées toutes les 5 secondes
  
  // Temps d'attente
  initialWaitTime: number;         // 5 secondes avant premier élargissement
  maxWaitTime: number;             // 60 secondes maximum
  expansionInterval: number;       // Élargir toutes les 5 secondes
  
  // Système de bots
  enableBots: boolean;             // Activer les bots
  botMatchAfterSeconds: number;    // Matcher avec bot après X secondes
  botTrophyVariance: number;       // Variance de trophées des bots (±50)
  
  // Critères avancés
  levelDifferenceMax: number;      // Différence de niveau max
  cardLevelDifferenceMax: number;  // Différence niveau cartes max
  
  // Performance
  matchmakingTickRate: number;     // Fréquence de vérification (ms)
  queueCleanupInterval: number;    // Nettoyage file (ms)
}

// Noms de bots réalistes (style Clash Royale)
const BOT_NAMES = [
  'Knight_Slayer', 'Dragon_Hunter', 'Spell_Master', 'Tower_Crusher',
  'Lightning_Lord', 'Fire_Spirit', 'Ice_Wizard', 'Battle_Healer',
  'Royal_Guard', 'Mega_Minion', 'Dark_Prince', 'Magic_Archer',
  'Elite_Barbarian', 'Royal_Hogs', 'Goblin_Giant', 'Electro_Dragon',
  'Skeleton_Army', 'Valkyrie_Queen', 'Lava_Hound', 'Inferno_Tower',
  'X-Bow_Master', 'Mortar_King', 'Balloon_Rider', 'Giant_Skeleton'
];

/**
 * Service de matchmaking principal
 */
class MatchmakingService extends EventEmitter {
  private queue: Map<string, IQueuedPlayer> = new Map();
  private activeMatches: Map<string, IMatch> = new Map();
  private config: IMatchmakingConfig;
  
  // Timers
  private matchmakingTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  
  // Statistiques
  private stats = {
    totalQueued: 0,
    totalMatched: 0,
    averageWaitTime: 0,
    currentQueueSize: 0,
    activeMatchesCount: 0
  };

  constructor(config?: Partial<IMatchmakingConfig>) {
    super();
    
    // Configuration par défaut (similaire à Clash Royale)
    this.config = {
      initialTrophyRange: 100,
      maxTrophyRange: 500,
      trophyRangeExpansion: 50,
      
      initialWaitTime: 5000,        // 5 secondes
      maxWaitTime: 60000,           // 1 minute
      expansionInterval: 5000,      // 5 secondes
      
      enableBots: true,             // Bots activés par défaut
      botMatchAfterSeconds: 15,     // Bot après 15 secondes
      botTrophyVariance: 50,        // ±50 trophées pour les bots
      
      levelDifferenceMax: 3,        // Max 3 niveaux d'écart
      cardLevelDifferenceMax: 2,    // Max 2 niveaux de cartes d'écart
      
      matchmakingTickRate: 1000,    // Vérifier chaque seconde
      queueCleanupInterval: 30000,  // Nettoyer toutes les 30s
      
      ...config
    };
    
    this.startMatchmakingLoop();
    this.startCleanupLoop();
    
    console.log('🎯 MatchmakingService initialized');
  }

  /**
   * Ajouter un joueur en file d'attente
   */
  addPlayerToQueue(player: Omit<IQueuedPlayer, 'joinTime' | 'waitTime' | 'trophyRange' | 'maxWaitTime'>): boolean {
    if (this.queue.has(player.sessionId)) {
      console.warn(`Player ${player.sessionId} is already in queue`);
      return false;
    }

    const queuedPlayer: IQueuedPlayer = {
      ...player,
      joinTime: Date.now(),
      waitTime: 0,
      trophyRange: {
        min: player.trophies - this.config.initialTrophyRange,
        max: player.trophies + this.config.initialTrophyRange
      },
      maxWaitTime: this.config.maxWaitTime
    };

    this.queue.set(player.sessionId, queuedPlayer);
    this.stats.totalQueued++;
    this.stats.currentQueueSize = this.queue.size;

    console.log(`👤 Player ${player.username} joined matchmaking queue (${player.trophies} trophies)`);
    
    this.emit('playerQueued', queuedPlayer);
    return true;
  }

  /**
   * Retirer un joueur de la file d'attente
   */
  removePlayerFromQueue(sessionId: string): boolean {
    const player = this.queue.get(sessionId);
    if (!player) {
      return false;
    }

    this.queue.delete(sessionId);
    this.stats.currentQueueSize = this.queue.size;

    console.log(`👋 Player ${player.username} left matchmaking queue`);
    
    this.emit('playerLeft', player);
    return true;
  }

  /**
   * Obtenir la position d'un joueur dans la file
   */
  getPlayerQueuePosition(sessionId: string): number {
    const player = this.queue.get(sessionId);
    if (!player) return -1;

    // Trier par temps d'attente (plus ancien = priorité)
    const sortedQueue = Array.from(this.queue.values()).sort((a, b) => a.joinTime - b.joinTime);
    return sortedQueue.findIndex(p => p.sessionId === sessionId) + 1;
  }

  /**
   * Obtenir les informations d'un joueur en file
   */
  getQueuedPlayer(sessionId: string): IQueuedPlayer | null {
    return this.queue.get(sessionId) || null;
  }

  /**
   * Démarrer la boucle de matchmaking
   */
  private startMatchmakingLoop(): void {
    this.matchmakingTimer = setInterval(() => {
      this.processMatchmaking();
    }, this.config.matchmakingTickRate);
  }

  /**
   * Processus principal de matchmaking
   */
  private processMatchmaking(): void {
    if (this.queue.size === 0) return;

    // Mettre à jour les temps d'attente et critères
    this.updateQueuedPlayers();

    // Vérifier les matches avec bots si activés
    if (this.config.enableBots) {
      this.checkForBotMatches();
    }

    // Trouver des matchs entre joueurs réels (si au moins 2)
    if (this.queue.size >= 2) {
      const matches = this.findMatches();
      
      // Créer les matchs
      matches.forEach(match => {
        this.createMatch(match);
      });
    }
  }

  /**
   * Mettre à jour les joueurs en file d'attente
   */
  private updateQueuedPlayers(): void {
    const now = Date.now();
    
    for (const player of this.queue.values()) {
      player.waitTime = now - player.joinTime;
      
      // Élargir les critères de recherche avec le temps
      if (player.waitTime > this.config.initialWaitTime) {
        const expansions = Math.floor((player.waitTime - this.config.initialWaitTime) / this.config.expansionInterval);
        const additionalRange = expansions * this.config.trophyRangeExpansion;
        
        const totalRange = this.config.initialTrophyRange + additionalRange;
        const maxRange = Math.min(totalRange, this.config.maxTrophyRange);
        
        player.trophyRange = {
          min: player.trophies - maxRange,
          max: player.trophies + maxRange
        };
      }
    }
  }

  /**
   * Vérifier et créer des matches avec des bots
   */
  private checkForBotMatches(): void {
    const now = Date.now();
    const playersReadyForBot = Array.from(this.queue.values()).filter(player => 
      !player.isBot && // Seulement les vrais joueurs
      now - player.joinTime >= this.config.botMatchAfterSeconds * 1000
    );

    for (const player of playersReadyForBot) {
      const bot = this.createBot(player);
      const match: IMatch = {
        matchId: this.generateMatchId(),
        player1: player,
        player2: bot,
        averageTrophies: Math.round((player.trophies + bot.trophies) / 2),
        createdAt: now
      };

      // Retirer le joueur de la queue et créer le match
      this.queue.delete(player.sessionId);
      this.createMatch(match);
      
      console.log(`🤖 Bot match created for ${player.username} vs ${bot.username}`);
    }
  }

  /**
   * Créer un bot adapté au niveau du joueur
   */
  private createBot(player: IQueuedPlayer): IQueuedPlayer {
    // Variance aléatoire pour les trophées du bot
    const trophyVariance = (Math.random() - 0.5) * 2 * this.config.botTrophyVariance;
    const botTrophies = Math.max(0, Math.round(player.trophies + trophyVariance));
    
    // Niveau similaire avec petite variation
    const levelVariance = Math.floor((Math.random() - 0.5) * 2 * 2); // ±2 niveaux
    const botLevel = Math.max(1, Math.min(13, player.level + levelVariance)); // Niveau 1-13
    
    // Niveau de cartes similaire
    const cardLevelVariance = (Math.random() - 0.5) * 2 * 1; // ±1 niveau
    const botCardLevel = Math.max(1, player.averageCardLevel + cardLevelVariance);
    
    // Nom aléatoire
    const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    
    const bot: IQueuedPlayer = {
      sessionId: `bot_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: `bot_user_${Date.now()}`,
      username: botName,
      isBot: true,
      
      trophies: botTrophies,
      level: botLevel,
      averageCardLevel: botCardLevel,
      
      joinTime: Date.now(),
      waitTime: 0,
      trophyRange: {
        min: botTrophies - 50,
        max: botTrophies + 50
      },
      maxWaitTime: 0 // Les bots n'attendent pas
    };
    
    // Ajouter la région seulement si le joueur en a une
    if (player.region) {
      bot.region = player.region;
    }
    
    return bot;
  }

  /**
   * Créer un deck aléatoire pour un bot basé sur son niveau
   */
  createBotDeck(_bot: IQueuedPlayer): string[] {
    // Deck de base similaire aux cartes starter
    // TODO: Ajouter plus de cartes selon le niveau du bot et utiliser le paramètre bot
    
    // Pour l'instant, deck fixe (à améliorer plus tard)
    return ['knight', 'archers', 'goblins', 'arrows', 'fireball', 'cannon', 'knight', 'archers'];
  }

  /**
   * Vérifier si un joueur est un bot
   */
  isBot(sessionId: string): boolean {
    const player = this.queue.get(sessionId);
    return player?.isBot || false;
  }
  private findMatches(): IMatch[] {
    const matches: IMatch[] = [];
    const availablePlayers = Array.from(this.queue.values());
    const matchedPlayers = new Set<string>();

    // Trier par temps d'attente (priorité aux plus anciens)
    availablePlayers.sort((a, b) => a.joinTime - b.joinTime);

    for (let i = 0; i < availablePlayers.length - 1; i++) {
      const player1 = availablePlayers[i];
      
      if (matchedPlayers.has(player1.sessionId)) continue;

      for (let j = i + 1; j < availablePlayers.length; j++) {
        const player2 = availablePlayers[j];
        
        if (matchedPlayers.has(player2.sessionId)) continue;

        if (this.arePlayersCompatible(player1, player2)) {
          const match: IMatch = {
            matchId: this.generateMatchId(),
            player1,
            player2,
            averageTrophies: Math.round((player1.trophies + player2.trophies) / 2),
            createdAt: Date.now()
          };

          matches.push(match);
          matchedPlayers.add(player1.sessionId);
          matchedPlayers.add(player2.sessionId);
          break;
        }
      }
    }

    return matches;
  }

  /**
   * Vérifier la compatibilité entre deux joueurs
   */
  private arePlayersCompatible(player1: IQueuedPlayer, player2: IQueuedPlayer): boolean {
    // Vérifier les trophées (bidirectionnel)
    const trophiesMatch = (
      player2.trophies >= player1.trophyRange.min &&
      player2.trophies <= player1.trophyRange.max &&
      player1.trophies >= player2.trophyRange.min &&
      player1.trophies <= player2.trophyRange.max
    );
    
    if (!trophiesMatch) return false;

    // Vérifier la différence de niveau
    const levelDifference = Math.abs(player1.level - player2.level);
    if (levelDifference > this.config.levelDifferenceMax) return false;

    // Vérifier la différence de niveau des cartes
    const cardLevelDifference = Math.abs(player1.averageCardLevel - player2.averageCardLevel);
    if (cardLevelDifference > this.config.cardLevelDifferenceMax) return false;

    // Vérifier la région si spécifiée
    if (player1.region && player2.region && player1.region !== player2.region) {
      // Permettre cross-région après 30 secondes d'attente
      if (player1.waitTime < 30000 && player2.waitTime < 30000) {
        return false;
      }
    }

    return true;
  }

  /**
   * Créer un match et notifier
   */
  private createMatch(match: IMatch): void {
    this.activeMatches.set(match.matchId, match);
    
    // Retirer les joueurs de la file d'attente
    this.queue.delete(match.player1.sessionId);
    this.queue.delete(match.player2.sessionId);
    
    // Mettre à jour les statistiques
    this.stats.totalMatched += 2;
    this.stats.currentQueueSize = this.queue.size;
    this.stats.activeMatchesCount = this.activeMatches.size;
    
    // Calculer le temps d'attente moyen
    const totalWaitTime = match.player1.waitTime + match.player2.waitTime;
    this.stats.averageWaitTime = Math.round(totalWaitTime / 2);

    console.log(`⚔️ Match created: ${match.player1.username} (${match.player1.trophies}) vs ${match.player2.username} (${match.player2.trophies})`);
    console.log(`   Match ID: ${match.matchId}`);
    console.log(`   Wait times: ${Math.round(match.player1.waitTime/1000)}s / ${Math.round(match.player2.waitTime/1000)}s`);

    this.emit('matchFound', match);
  }

  /**
   * Finaliser un match (appelé à la fin du combat)
   */
  finializeMatch(matchId: string): boolean {
    const match = this.activeMatches.get(matchId);
    if (!match) return false;

    this.activeMatches.delete(matchId);
    this.stats.activeMatchesCount = this.activeMatches.size;

    console.log(`🏁 Match finalized: ${matchId}`);
    this.emit('matchFinished', match);
    
    return true;
  }

  /**
   * Boucle de nettoyage
   */
  private startCleanupLoop(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupQueue();
    }, this.config.queueCleanupInterval);
  }

  /**
   * Nettoyer la file d'attente (joueurs qui attendent trop longtemps)
   */
  private cleanupQueue(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [sessionId, player] of this.queue) {
      if (now - player.joinTime > player.maxWaitTime) {
        this.queue.delete(sessionId);
        removedCount++;
        
        console.log(`🧹 Removed player ${player.username} from queue (timeout)`);
        this.emit('playerTimeout', player);
      }
    }

    if (removedCount > 0) {
      this.stats.currentQueueSize = this.queue.size;
      console.log(`🧹 Cleaned ${removedCount} players from queue`);
    }
  }

  /**
   * Générer un ID de match unique
   */
  private generateMatchId(): string {
    return `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtenir les statistiques du matchmaking
   */
  getStats() {
    const realPlayers = Array.from(this.queue.values()).filter(p => !p.isBot);
    const bots = Array.from(this.queue.values()).filter(p => p.isBot);
    
    return {
      ...this.stats,
      realPlayersInQueue: realPlayers.length,
      botsInQueue: bots.length,
      queueDetails: Array.from(this.queue.values()).map(player => ({
        username: player.username,
        trophies: player.trophies,
        waitTime: Math.round(player.waitTime / 1000),
        trophyRange: player.trophyRange,
        isBot: player.isBot || false
      }))
    };
  }

  /**
   * Obtenir la configuration actuelle
   */
  getConfig(): IMatchmakingConfig {
    return { ...this.config };
  }

  /**
   * Mettre à jour la configuration
   */
  updateConfig(newConfig: Partial<IMatchmakingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Matchmaking configuration updated');
    this.emit('configUpdated', this.config);
  }

  /**
   * Arrêter le service de matchmaking
   */
  stop(): void {
    if (this.matchmakingTimer) {
      clearInterval(this.matchmakingTimer);
      this.matchmakingTimer = null;
    }
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // Notifier tous les joueurs en attente
    for (const player of this.queue.values()) {
      this.emit('serviceStopped', player);
    }

    this.queue.clear();
    this.activeMatches.clear();
    
    console.log('🛑 MatchmakingService stopped');
  }

  /**
   * Forcer un match (pour les tests)
   */
  forceMatch(sessionId1: string, sessionId2: string): IMatch | null {
    const player1 = this.queue.get(sessionId1);
    const player2 = this.queue.get(sessionId2);
    
    if (!player1 || !player2) return null;

    const match: IMatch = {
      matchId: this.generateMatchId(),
      player1,
      player2,
      averageTrophies: Math.round((player1.trophies + player2.trophies) / 2),
      createdAt: Date.now()
    };

    this.createMatch(match);
    return match;
  }
}

// Export singleton
let matchmakingServiceInstance: MatchmakingService | null = null;

export function getMatchmakingService(config?: Partial<IMatchmakingConfig>): MatchmakingService {
  if (!matchmakingServiceInstance) {
    matchmakingServiceInstance = new MatchmakingService(config);
  }
  return matchmakingServiceInstance;
}

export { MatchmakingService };
