import { Types } from 'mongoose';
import { EventEmitter } from 'events';
import PlayerAction, { ActionType, ActionCategory, IActionData, IActionMetadata } from '../models/PlayerAction';

/**
 * ActionLogger Service - Interface centralisée pour le logging des actions
 * Optimisé pour performance avec batch writing et cache en mémoire
 */

// Interface pour une action en attente
interface IPendingAction {
  userId: string | Types.ObjectId;
  action: ActionType;
  category?: ActionCategory;
  data: IActionData;
  metadata: IActionMetadata;
  timestamp: Date;
}

// Configuration du service
interface IActionLoggerConfig {
  // Batch processing
  batchSize: number;              // Nombre d'actions par batch
  flushInterval: number;          // Intervalle de flush automatique (ms)
  maxPendingActions: number;      // Max actions en mémoire avant flush forcé
  
  // Performance
  enableRealTimeLogging: boolean; // Log temps réel ou batch seulement
  enableAnalytics: boolean;       // Calculer analytics en temps réel
  
  // Debug
  debugMode: boolean;             // Mode debug avec logs détaillés
  logToConsole: boolean;          // Afficher logs dans console
  
  // Filtres
  ignoredActions: ActionType[];   // Actions à ignorer
  enabledCategories: ActionCategory[]; // Catégories à logger
}

/**
 * Service principal de logging d'actions
 */
class ActionLoggerService extends EventEmitter {
  private config: IActionLoggerConfig;
  private pendingActions: IPendingAction[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isFlushingBatch = false;
  
  // Statistiques en temps réel
  private stats = {
    totalLogged: 0,
    totalBatches: 0,
    pendingCount: 0,
    lastFlushTime: 0,
    averageBatchSize: 0,
    errorCount: 0,
    categoryCounts: {} as Record<ActionCategory, number>
  };
  
  // Cache pour optimisations
  private userContextCache = new Map<string, IActionMetadata>();
  private recentActions = new Map<string, ActionType[]>(); // Dernières actions par user

  constructor(config?: Partial<IActionLoggerConfig>) {
    super();
    
    // Configuration par défaut
    this.config = {
      batchSize: 50,                    // Flush tous les 50 actions
      flushInterval: 10000,             // Flush toutes les 10 secondes
      maxPendingActions: 200,           // Max 200 actions en mémoire
      
      enableRealTimeLogging: false,     // Batch par défaut pour performance
      enableAnalytics: true,            // Analytics activées
      
      debugMode: process.env.NODE_ENV === 'development',
      logToConsole: process.env.NODE_ENV === 'development',
      
      ignoredActions: [],               // Aucune action ignorée par défaut
      enabledCategories: ['matchmaking', 'battle', 'collection', 'economy', 'progression'], // Principales catégories
      
      ...config
    };
    
    this.startFlushTimer();
    this.setupEventListeners();
    
    if (this.config.debugMode) {
      console.log('📊 ActionLoggerService initialized with config:', this.config);
    }
  }

  /**
   * Logger une action (méthode principale)
   */
  async log(
    userId: string | Types.ObjectId, 
    action: ActionType, 
    data: IActionData = {}, 
    metadata: IActionMetadata = {}
  ): Promise<boolean> {
    try {
      // Vérifier si l'action doit être ignorée
      if (this.shouldIgnoreAction(action)) {
        return false;
      }
      
      // Enrichir les métadonnées avec le contexte utilisateur
      const enrichedMetadata = await this.enrichMetadata(userId.toString(), metadata);
      
      // Créer l'action en attente
      const pendingAction: IPendingAction = {
        userId,
        action,
        data,
        metadata: enrichedMetadata,
        timestamp: new Date()
      };
      
      // Log en temps réel ou batch
      if (this.config.enableRealTimeLogging) {
        return this.logImmediately(pendingAction);
      } else {
        return this.addToBatch(pendingAction);
      }
      
    } catch (error) {
      this.stats.errorCount++;
      console.error('ActionLogger error:', error);
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Méthodes de logging par catégorie (pour facilité d'usage)
   */
  
  // Matchmaking
  async logMatchmaking(action: ActionType, userId: string | Types.ObjectId, data: IActionData = {}): Promise<boolean> {
    return this.log(userId, action, data, { currentScene: 'matchmaking' });
  }
  
  // Bataille
  async logBattle(action: ActionType, userId: string | Types.ObjectId, data: IActionData = {}): Promise<boolean> {
    return this.log(userId, action, data, { currentScene: 'battle' });
  }
  
  // Collection
  async logCollection(action: ActionType, userId: string | Types.ObjectId, data: IActionData = {}): Promise<boolean> {
    return this.log(userId, action, data, { currentScene: 'collection' });
  }
  
  // Économie
  async logEconomy(action: ActionType, userId: string | Types.ObjectId, data: IActionData = {}): Promise<boolean> {
    return this.log(userId, action, data, { currentScene: 'shop' });
  }
  
  // Navigation
  async logNavigation(action: ActionType, userId: string | Types.ObjectId, data: IActionData = {}): Promise<boolean> {
    return this.log(userId, action, data, { currentScene: data.scene || 'unknown' });
  }

  /**
   * Méthodes de logging spécialisées avec données pré-configurées
   */
  
  async logQueueJoined(userId: string | Types.ObjectId, trophies: number, waitTime = 0): Promise<boolean> {
    return this.logMatchmaking('queue_joined', userId, {
      trophies,
      waitTime,
      timestamp: Date.now()
    });
  }
  
  async logMatchFound(userId: string | Types.ObjectId, matchId: string, opponentTrophies: number, waitTime: number): Promise<boolean> {
    return this.logMatchmaking('match_found', userId, {
      matchId,
      opponentTrophies,
      trophyDifference: Math.abs(opponentTrophies - (await this._getUserTrophies(userId))),
      waitTime,
      success: true
    });
  }
  
  async logCardPlayed(userId: string | Types.ObjectId, cardId: string, elixirCost: number, position: { x: number, y: number }): Promise<boolean> {
    return this.logBattle('card_played', userId, {
      cardId,
      elixirCost,
      position,
      timestamp: Date.now()
    });
  }
  
  async logCardUpgraded(userId: string | Types.ObjectId, cardId: string, newLevel: number, goldSpent: number): Promise<boolean> {
    return this.logCollection('card_upgraded', userId, {
      cardId,
      newLevel,
      goldSpent,
      success: true
    });
  }
  
  async logChestOpened(userId: string | Types.ObjectId, chestType: string, rewards: any): Promise<boolean> {
    return this.logEconomy('chest_opened', userId, {
      chestType,
      rewards,
      rewardCount: Array.isArray(rewards) ? rewards.length : Object.keys(rewards).length
    });
  }

  /**
   * Log en temps réel
   */
  private async logImmediately(pendingAction: IPendingAction): Promise<boolean> {
    try {
      await PlayerAction.create({
        userId: pendingAction.userId,
        action: pendingAction.action,
        category: this.getCategoryForAction(pendingAction.action),
        data: pendingAction.data,
        metadata: pendingAction.metadata,
        timestamp: pendingAction.timestamp,
        serverTimestamp: new Date(),
        source: 'server',
        version: '1.0.0'
      });
      
      this.updateStats(pendingAction.action);
      this.emit('actionLogged', pendingAction);
      
      if (this.config.logToConsole) {
        console.log(`📊 Action logged: ${pendingAction.action} for user ${pendingAction.userId}`);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to log action immediately:', error);
      return false;
    }
  }

  /**
   * Ajouter à un batch
   */
  private addToBatch(pendingAction: IPendingAction): boolean {
    this.pendingActions.push(pendingAction);
    this.stats.pendingCount = this.pendingActions.length;
    
    // Flush forcé si trop d'actions en attente
    if (this.pendingActions.length >= this.config.maxPendingActions) {
      this.flushBatch();
    }
    // Flush automatique si batch size atteint
    else if (this.pendingActions.length >= this.config.batchSize) {
      this.flushBatch();
    }
    
    return true;
  }

  /**
   * Flush le batch vers la base de données
   */
  async flushBatch(): Promise<boolean> {
    if (this.isFlushingBatch || this.pendingActions.length === 0) {
      return true;
    }
    
    this.isFlushingBatch = true;
    const actionsToFlush = [...this.pendingActions];
    this.pendingActions = [];
    this.stats.pendingCount = 0;
    
    try {
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      // Préparer les documents pour insertion
      const documents = actionsToFlush.map(action => ({
        userId: action.userId,
        action: action.action,
        category: this.getCategoryForAction(action.action),
        data: action.data,
        metadata: action.metadata,
        timestamp: action.timestamp,
        serverTimestamp: new Date(),
        source: 'server' as const,
        version: '1.0.0',
        batchId
      }));
      
      // Insertion en batch
      await PlayerAction.insertMany(documents);
      
      // Mettre à jour les statistiques
      actionsToFlush.forEach(action => this.updateStats(action.action));
      this.stats.totalBatches++;
      this.stats.lastFlushTime = Date.now();
      this.stats.averageBatchSize = Math.round(
        (this.stats.averageBatchSize * (this.stats.totalBatches - 1) + actionsToFlush.length) / this.stats.totalBatches
      );
      
      if (this.config.logToConsole) {
        console.log(`📊 Flushed batch of ${actionsToFlush.length} actions (${batchId})`);
      }
      
      this.emit('batchFlushed', { batchId, count: actionsToFlush.length });
      return true;
      
    } catch (error) {
      console.error('Failed to flush batch:', error);
      this.stats.errorCount++;
      
      // Remettre les actions en attente
      this.pendingActions = [...actionsToFlush, ...this.pendingActions];
      this.stats.pendingCount = this.pendingActions.length;
      
      this.emit('batchError', error);
      return false;
    } finally {
      this.isFlushingBatch = false;
    }
  }

  /**
   * Enrichir les métadonnées avec le contexte utilisateur
   */
  private async enrichMetadata(userId: string, metadata: IActionMetadata): Promise<IActionMetadata> {
    // Utiliser le cache si disponible
    const cachedContext = this.userContextCache.get(userId);
    
    // TODO: Récupérer les données utilisateur actuelles (trophées, or, etc.)
    const enriched: IActionMetadata = {
      ...metadata,
      sessionId: metadata.sessionId || `session_${userId}_${Date.now()}`,
      // goldAtTime: await this._getUserGold(userId),
      // trophiesAtTime: await this._getUserTrophies(userId),
      ...cachedContext
    };
    
    // Mettre en cache pour optimiser les prochaines actions
    this.userContextCache.set(userId, enriched);
    
    return enriched;
  }

  /**
   * Démarrer le timer de flush automatique
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      if (this.pendingActions.length > 0) {
        this.flushBatch();
      }
    }, this.config.flushInterval);
  }

  /**
   * Setup des event listeners
   */
  private setupEventListeners(): void {
    // Flush à l'arrêt du process
    process.on('SIGINT', () => {
      console.log('📊 Flushing pending actions before shutdown...');
      this.flushBatch().then(() => process.exit(0));
    });
    
    process.on('SIGTERM', () => {
      console.log('📊 Flushing pending actions before shutdown...');
      this.flushBatch().then(() => process.exit(0));
    });
  }

  /**
   * Vérifier si une action doit être ignorée
   */
  private shouldIgnoreAction(action: ActionType): boolean {
    if (this.config.ignoredActions.includes(action)) {
      return true;
    }
    
    const category = this.getCategoryForAction(action);
    if (!this.config.enabledCategories.includes(category)) {
      return true;
    }
    
    return false;
  }

  /**
   * Obtenir la catégorie d'une action
   */
  private getCategoryForAction(action: ActionType): ActionCategory {
    const categoryMapping: Record<string, ActionCategory> = {
      queue_joined: 'matchmaking', queue_left: 'matchmaking', match_found: 'matchmaking',
      battle_started: 'battle', battle_ended: 'battle', card_played: 'battle',
      card_upgraded: 'collection', deck_changed: 'collection',
      gold_earned: 'economy', chest_opened: 'economy',
      friend_added: 'social', clan_joined: 'social',
      screen_viewed: 'navigation', app_opened: 'navigation',
      level_up: 'progression', trophy_gained: 'progression'
    };
    
    return categoryMapping[action] || 'system';
  }

  /**
   * Mettre à jour les statistiques
   */
  private updateStats(action: ActionType): void {
    this.stats.totalLogged++;
    
    const category = this.getCategoryForAction(action);
    this.stats.categoryCounts[category] = (this.stats.categoryCounts[category] || 0) + 1;
  }

  /**
   * Méthodes utilitaires pour récupérer les données utilisateur
   * TODO: Implémenter en se basant sur UserData et PlayerCollection
   */
  private async _getUserTrophies(_userId: string | Types.ObjectId): Promise<number> {
    // TODO: Récupérer depuis UserData
    return 1000; // Placeholder
  }
  
  private async _getUserGold(_userId: string | Types.ObjectId): Promise<number> {
    // TODO: Récupérer depuis PlayerCollection
    return 500; // Placeholder
  }

  /**
   * Méthodes publiques pour gestion du service
   */
  
  // Obtenir les statistiques actuelles
  getStats() {
    return {
      ...this.stats,
      uptime: Date.now() - this.stats.lastFlushTime,
      cacheSize: this.userContextCache.size,
      config: this.config
    };
  }
  
  // Mettre à jour la configuration
  updateConfig(newConfig: Partial<IActionLoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
    
    if (this.config.debugMode) {
      console.log('📊 ActionLogger config updated:', newConfig);
    }
  }
  
  // Vider le cache
  clearCache(): void {
    this.userContextCache.clear();
    this.recentActions.clear();
    console.log('📊 ActionLogger cache cleared');
  }
  
  // Flush manuel
  async flush(): Promise<boolean> {
    return this.flushBatch();
  }
  
  // Arrêter le service
  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    // Flush final
    this.flushBatch();
    
    console.log('📊 ActionLoggerService stopped');
  }
}

// Export singleton
let actionLoggerInstance: ActionLoggerService | null = null;

export function getActionLogger(config?: Partial<IActionLoggerConfig>): ActionLoggerService {
  if (!actionLoggerInstance) {
    actionLoggerInstance = new ActionLoggerService(config);
  }
  return actionLoggerInstance;
}

export { ActionLoggerService };
