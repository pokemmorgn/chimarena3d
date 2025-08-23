import mongoose, { Document, Schema, Types } from 'mongoose';

// Types d'actions possibles
export type ActionType = 
  // Matchmaking
  | 'queue_joined' | 'queue_left' | 'match_found' | 'match_accepted' | 'match_declined' 
  | 'bot_matched' | 'queue_timeout'
  
  // Bataille
  | 'battle_started' | 'battle_ended' | 'card_played' | 'spell_cast' | 'unit_deployed'
  | 'tower_destroyed' | 'elixir_leaked' | 'battle_abandoned' | 'emote_used'
  
  // Collection
  | 'card_upgraded' | 'card_obtained' | 'deck_changed' | 'deck_created' 
  | 'active_deck_switched'
  
  // Économie
  | 'gold_earned' | 'gold_spent' | 'gems_earned' | 'gems_spent' | 'chest_opened'
  | 'shop_purchase' | 'shop_refresh' | 'quest_completed' | 'reward_claimed'
  
  // Social
  | 'friend_added' | 'clan_joined' | 'clan_left' | 'message_sent' | 'replay_shared'
  
  // Navigation/UI
  | 'screen_viewed' | 'button_clicked' | 'tutorial_step' | 'settings_changed'
  | 'app_opened' | 'app_closed' | 'session_started' | 'session_ended'
  
  // Progression
  | 'level_up' | 'achievement_unlocked' | 'trophy_gained' | 'trophy_lost'
  | 'arena_promoted' | 'arena_demoted';

// Catégories d'actions pour organisation
export type ActionCategory = 
  | 'matchmaking' | 'battle' | 'collection' | 'economy' | 'social' 
  | 'navigation' | 'progression' | 'system';

// Interface pour les métadonnées contextuelles
export interface IActionMetadata {
  // Session info
  sessionId?: string;
  deviceInfo?: {
    platform?: string;         // 'web', 'mobile', 'desktop'
    userAgent?: string;
    screenResolution?: string;
    language?: string;
  };
  
  // Localisation
  ip?: string;
  country?: string;
  timezone?: string;
  
  // Contexte de jeu
  currentScene?: string;       // 'login', 'menu', 'battle', etc.
  gameMode?: string;           // 'ranked', 'casual', 'tournament'
  
  // Données de performance
  fps?: number;
  ping?: number;
  loadTime?: number;
  
  // Données économiques au moment de l'action
  goldAtTime?: number;
  gemsAtTime?: number;
  trophiesAtTime?: number;
  levelAtTime?: number;
}

// Interface pour les données spécifiques à l'action
export interface IActionData {
  // Données génériques (toujours présentes)
  [key: string]: any;
  
  // Données communes
  success?: boolean;           // Action réussie ou échouée
  duration?: number;           // Durée de l'action (ms)
  value?: number;              // Valeur numérique associée
  
  // IDs de référence
  matchId?: string;
  cardId?: string;
  deckIndex?: number;
  opponentId?: string;
  
  // Données spécifiques par type d'action
  // (sera étendu selon les besoins)
}

// Interface principale pour PlayerAction document
export interface IPlayerAction extends Document {
  // === RÉFÉRENCES ===
  userId: Types.ObjectId;      // Référence vers UserData
  
  // === ACTION ===
  action: ActionType;          // Type d'action effectuée
  category: ActionCategory;    // Catégorie pour regroupement
  
  // === DONNÉES ===
  data: IActionData;           // Données spécifiques à l'action
  metadata: IActionMetadata;   // Contexte et métadonnées
  
  // === TEMPOREL ===
  timestamp: Date;             // Moment exact de l'action
  serverTimestamp: Date;       // Timestamp serveur (pour sync)
  
  // === TRAÇABILITÉ ===
  source: string;              // Origine de l'action ('client', 'server', 'system')
  version: string;             // Version de l'application
  
  // === ANALYTICS ===
  processed: boolean;          // Action traitée par le système d'analytics
  batchId?: string;            // ID du batch pour traitement groupé
}

// Schema pour les métadonnées
const ActionMetadataSchema = new Schema<IActionMetadata>({
  sessionId: { type: String },
  
  deviceInfo: {
    platform: { type: String, enum: ['web', 'mobile', 'desktop'] },
    userAgent: { type: String },
    screenResolution: { type: String },
    language: { type: String, default: 'en' }
  },
  
  ip: { type: String },
  country: { type: String },
  timezone: { type: String },
  
  currentScene: { type: String },
  gameMode: { type: String },
  
  fps: { type: Number, min: 0, max: 240 },
  ping: { type: Number, min: 0 },
  loadTime: { type: Number, min: 0 },
  
  goldAtTime: { type: Number, min: 0 },
  gemsAtTime: { type: Number, min: 0 },
  trophiesAtTime: { type: Number, min: 0 },
  levelAtTime: { type: Number, min: 1, max: 100 }
}, { _id: false });

// Schema principal PlayerAction
const PlayerActionSchema = new Schema<IPlayerAction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'UserData',
    required: [true, 'User ID is required'],
    index: true
  },
  
  action: {
    type: String,
    required: [true, 'Action type is required'],
    enum: [
      // Matchmaking
      'queue_joined', 'queue_left', 'match_found', 'match_accepted', 'match_declined',
      'bot_matched', 'queue_timeout',
      
      // Bataille
      'battle_started', 'battle_ended', 'card_played', 'spell_cast', 'unit_deployed',
      'tower_destroyed', 'elixir_leaked', 'battle_abandoned', 'emote_used',
      
      // Collection
      'card_upgraded', 'card_obtained', 'deck_changed', 'deck_created', 'active_deck_switched',
      
      // Économie
      'gold_earned', 'gold_spent', 'gems_earned', 'gems_spent', 'chest_opened',
      'shop_purchase', 'shop_refresh', 'quest_completed', 'reward_claimed',
      
      // Social
      'friend_added', 'clan_joined', 'clan_left', 'message_sent', 'replay_shared',
      
      // Navigation/UI
      'screen_viewed', 'button_clicked', 'tutorial_step', 'settings_changed',
      'app_opened', 'app_closed', 'session_started', 'session_ended',
      
      // Progression
      'level_up', 'achievement_unlocked', 'trophy_gained', 'trophy_lost',
      'arena_promoted', 'arena_demoted'
    ]
  },
  
  category: {
    type: String,
    required: [true, 'Action category is required'],
    enum: ['matchmaking', 'battle', 'collection', 'economy', 'social', 'navigation', 'progression', 'system'],
    index: true
  },
  
  data: {
    type: Schema.Types.Mixed,
    required: [true, 'Action data is required'],
    default: {}
  },
  
  metadata: {
    type: ActionMetadataSchema,
    default: {}
  },
  
  timestamp: {
    type: Date,
    required: [true, 'Timestamp is required'],
    default: Date.now,
    index: true
  },
  
  serverTimestamp: {
    type: Date,
    required: [true, 'Server timestamp is required'],
    default: Date.now
  },
  
  source: {
    type: String,
    required: [true, 'Source is required'],
    enum: ['client', 'server', 'system'],
    default: 'server'
  },
  
  version: {
    type: String,
    required: [true, 'Version is required'],
    default: '1.0.0'
  },
  
  processed: {
    type: Boolean,
    default: false,
    index: true
  },
  
  batchId: {
    type: String,
    index: true
  }
}, {
  // Options du schema
  timestamps: false, // On gère manuellement timestamp et serverTimestamp
  
  toJSON: {
    transform: function(_doc: any, ret: any) {
      delete ret.__v;
      return ret;
    }
  }
});

// Configuration d'index composés pour performance
PlayerActionSchema.index({ userId: 1, timestamp: -1 });           // Actions d'un user par date
PlayerActionSchema.index({ category: 1, timestamp: -1 });         // Actions par catégorie
PlayerActionSchema.index({ action: 1, timestamp: -1 });           // Actions spécifiques par date
PlayerActionSchema.index({ processed: 1, timestamp: 1 });         // Actions non traitées
PlayerActionSchema.index({ userId: 1, category: 1, timestamp: -1 }); // User + catégorie + date

// Index TTL pour auto-suppression des anciennes actions (optionnel)
// Garder les logs 90 jours pour l'IA, puis supprimer automatiquement
PlayerActionSchema.index(
  { timestamp: 1 }, 
  { 
    expireAfterSeconds: 90 * 24 * 60 * 60, // 90 jours en secondes
    background: true 
  }
);

// === MÉTHODES STATIQUES ===

/**
 * Créer une action avec auto-catégorisation
 */
PlayerActionSchema.statics.createAction = function(
  userId: string | Types.ObjectId,
  action: ActionType,
  data: IActionData = {},
  metadata: IActionMetadata = {}
) {
  
  // Auto-déterminer la catégorie selon l'action
  const categoryMapping: Record<string, ActionCategory> = {
    queue_joined: 'matchmaking', queue_left: 'matchmaking', match_found: 'matchmaking',
    battle_started: 'battle', battle_ended: 'battle', card_played: 'battle',
    card_upgraded: 'collection', deck_changed: 'collection',
    gold_earned: 'economy', chest_opened: 'economy',
    friend_added: 'social', clan_joined: 'social',
    screen_viewed: 'navigation', app_opened: 'navigation',
    level_up: 'progression', trophy_gained: 'progression'
  };
  
  const category = categoryMapping[action] || 'system';
  
  return this.create({
    userId,
    action,
    category,
    data,
    metadata,
    timestamp: new Date(),
    serverTimestamp: new Date()
  });
};

/**
 * Obtenir les actions d'un utilisateur par catégorie
 */
PlayerActionSchema.statics.getUserActions = function(
  userId: string | Types.ObjectId,
  category?: ActionCategory,
  limit: number = 100,
  startDate?: Date,
  endDate?: Date
) {
  const filter: any = { userId };
  
  if (category) {
    filter.category = category;
  }
  
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) filter.timestamp.$gte = startDate;
    if (endDate) filter.timestamp.$lte = endDate;
  }
  
  return this.find(filter)
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

/**
 * Obtenir les statistiques d'actions par utilisateur
 */
PlayerActionSchema.statics.getUserActionStats = function(
  userId: string | Types.ObjectId,
  days: number = 7
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId as string),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          category: '$category',
          action: '$action'
        },
        count: { $sum: 1 },
        lastAction: { $max: '$timestamp' }
      }
    },
    {
      $group: {
        _id: '$_id.category',
        actions: {
          $push: {
            action: '$_id.action',
            count: '$count',
            lastAction: '$lastAction'
          }
        },
        totalActions: { $sum: '$count' }
      }
    },
    {
      $sort: { totalActions: -1 }
    }
  ]);
};

/**
 * Obtenir les patterns temporels d'un utilisateur
 */
PlayerActionSchema.statics.getUserTimePatterns = function(
  userId: string | Types.ObjectId,
  days: number = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId as string),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          hour: { $hour: '$timestamp' },
          dayOfWeek: { $dayOfWeek: '$timestamp' }
        },
        count: { $sum: 1 },
        categories: { $addToSet: '$category' }
      }
    },
    {
      $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 }
    }
  ]);
};

// === MÉTHODES D'INSTANCE ===

/**
 * Marquer l'action comme traitée
 */
PlayerActionSchema.methods.markProcessed = function(batchId?: string) {
  this.processed = true;
  if (batchId) {
    this.batchId = batchId;
  }
  return this.save();
};

/**
 * Obtenir un résumé lisible de l'action
 */
PlayerActionSchema.methods.getSummary = function(): string {
  const actionDescriptions: Partial<Record<ActionType, string>> = {
    queue_joined: 'Joined matchmaking queue',
    match_found: 'Match found',
    card_upgraded: 'Upgraded a card',
    battle_started: 'Started a battle',
    battle_ended: 'Battle finished',
    card_played: 'Played a card',
    gold_spent: 'Spent gold',
    chest_opened: 'Opened chest'
    // ... autres descriptions seront ajoutées au besoin
  };
  
  const description = actionDescriptions[this.action as ActionType] || String(this.action);
  const timestamp = this.timestamp.toISOString();
  
  return `[${timestamp}] ${description}`;
};

export default mongoose.model<IPlayerAction>('PlayerAction', PlayerActionSchema);
