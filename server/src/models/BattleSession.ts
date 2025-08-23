import mongoose, { Document, Schema, Types } from 'mongoose';

// Interface pour un joueur dans la bataille
export interface IBattlePlayer {
  userId: Types.ObjectId;
  username: string;
  displayName: string;
  level: number;
  trophies: number;
  
  // Deck utilisé (8 cartes)
  deck: string[];           // IDs des cartes
  deckLevels: number[];     // Niveau de chaque carte
  
  // État pendant la bataille
  currentElixir: number;    // Élixir actuel (0-10)
  cardsInHand: string[];    // 4 cartes en main
  nextCard: string;         // Prochaine carte
  
  // Tours
  leftTowerHP: number;      // Tour de gauche (HP)
  rightTowerHP: number;     // Tour de droite (HP)
  kingTowerHP: number;      // Tour du roi (HP)
  
  // Stats de la partie
  cardsPlayed: number;
  elixirSpent: number;
  damageDealt: number;
  
  // Résultat
  isWinner?: boolean;
  trophiesChange?: number;
}

// Interface pour l'état global de la bataille
export interface IBattleState {
  currentTick: number;      // Tick actuel (0 = début, 7200 = 6min)
  gamePhase: 'normal' | 'overtime' | 'sudden_death';
  elixirMultiplier: number; // 1x normal, 2x overtime
  
  // Terrain (18x32 grille comme CR)
  battlefield: {
    units: any[];           // Unités sur le terrain
    buildings: any[];       // Bâtiments temporaires
  };
}

// Interface principale pour BattleSession
export interface IBattleSession extends Document {
  // === IDENTIFIANTS ===
  battleId: string;         // ID unique de la bataille
  matchId?: string;         // ID du match (depuis MatchmakingService)
  roomId: string;           // ID de la BattleRoom Colyseus
  
  // === JOUEURS ===
  player1: IBattlePlayer;
  player2: IBattlePlayer;
  
  // === ÉTAT DE LA PARTIE ===
  battleState: IBattleState;
  
  // === MÉTADONNÉES ===
  gameMode: 'ranked' | 'casual' | 'tournament' | 'friendly';
  battleType: '1v1' | 'bot';   // vs joueur ou vs bot
  
  // === TEMPOREL ===
  startTime: Date;          // Début réel de la bataille
  endTime?: Date;           // Fin de la bataille
  duration?: number;        // Durée en secondes
  
  // === RÉSULTAT ===
  status: 'preparing' | 'active' | 'finished' | 'abandoned';
  winner?: '1' | '2' | 'draw';
  winCondition?: 'towers' | 'timeout' | 'surrender';
  
  // === ANALYTICS ===
  totalActions: number;     // Nombre total d'actions loggées
  replaySize?: number;      // Taille du replay en bytes
  
  // === SPECTATEURS ===
  spectatorCount: number;   // Nombre de spectateurs max
  recordingEnabled: boolean; // Replay activé
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  addAction(playerId: string, action: any): Promise<void>;
  updatePlayerState(playerId: string, updates: Partial<IBattlePlayer>): void;
  updateBattleState(updates: Partial<IBattleState>): void;
  finalizeBattle(winnerId?: string): Promise<void>;
}

// Schema pour un joueur
const BattlePlayerSchema = new Schema<IBattlePlayer>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'UserData',
    required: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  trophies: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Deck
  deck: [{
    type: String,
    required: true
  }],
  deckLevels: [{
    type: Number,
    required: true,
    min: 1
  }],
  
  // État battle
  currentElixir: {
    type: Number,
    default: 5,        // On commence avec 5 élixir comme CR
    min: 0,
    max: 10
  },
  cardsInHand: [{
    type: String
  }],
  nextCard: {
    type: String,
    default: null
  },
  
  // Tours (HP par défaut CR)
  leftTowerHP: {
    type: Number,
    default: 1400      // HP tour normale dans CR
  },
  rightTowerHP: {
    type: Number,
    default: 1400
  },
  kingTowerHP: {
    type: Number,
    default: 2600      // HP tour du roi dans CR
  },
  
  // Stats
  cardsPlayed: {
    type: Number,
    default: 0
  },
  elixirSpent: {
    type: Number,
    default: 0
  },
  damageDealt: {
    type: Number,
    default: 0
  },
  
  // Résultat
  isWinner: {
    type: Boolean,
    default: undefined
  },
  trophiesChange: {
    type: Number,
    default: 0
  }
}, { _id: false });

// Schema pour l'état de bataille
const BattleStateSchema = new Schema<IBattleState>({
  currentTick: {
    type: Number,
    default: 0,
    min: 0
  },
  gamePhase: {
    type: String,
    enum: ['normal', 'overtime', 'sudden_death'],
    default: 'normal'
  },
  elixirMultiplier: {
    type: Number,
    default: 1,        // 1x normal, 2x en overtime
    min: 1,
    max: 3
  },
  
  battlefield: {
    units: [{
      type: Schema.Types.Mixed,
      default: []
    }],
    buildings: [{
      type: Schema.Types.Mixed, 
      default: []
    }]
  }
}, { _id: false });

// Schema principal BattleSession
const BattleSessionSchema = new Schema<IBattleSession>({
  battleId: {
    type: String,
    required: true,
    unique: true,
    default: () => `battle_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  },
  matchId: {
    type: String,
    index: true
  },
  roomId: {
    type: String,
    required: true
  },
  
  // Joueurs
  player1: {
    type: BattlePlayerSchema,
    required: true
  },
  player2: {
    type: BattlePlayerSchema,
    required: true
  },
  
  // État
  battleState: {
    type: BattleStateSchema,
    default: () => ({})
  },
  
  // Métadonnées
  gameMode: {
    type: String,
    enum: ['ranked', 'casual', 'tournament', 'friendly'],
    default: 'ranked'
  },
  battleType: {
    type: String,
    enum: ['1v1', 'bot'],
    default: '1v1'
  },
  
  // Temporel
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number,
    min: 0
  },
  
  // Résultat
  status: {
    type: String,
    enum: ['preparing', 'active', 'finished', 'abandoned'],
    default: 'preparing'
  },
  winner: {
    type: String,
    enum: ['1', '2', 'draw'],
    default: null
  },
  winCondition: {
    type: String,
    enum: ['towers', 'timeout', 'surrender'],
    default: null
  },
  
  // Analytics
  totalActions: {
    type: Number,
    default: 0
  },
  replaySize: {
    type: Number,
    default: 0
  },
  
  // Spectateurs
  spectatorCount: {
    type: Number,
    default: 0,
    min: 0
  },
  recordingEnabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(_doc: any, ret: any) {
      delete ret.__v;
      return ret;
    }
  }
});

// Index pour performance
BattleSessionSchema.index({ battleId: 1 });
BattleSessionSchema.index({ matchId: 1 });
BattleSessionSchema.index({ 'player1.userId': 1, 'player2.userId': 1 });
BattleSessionSchema.index({ status: 1, startTime: -1 });
BattleSessionSchema.index({ gameMode: 1, startTime: -1 });

// === MÉTHODES D'INSTANCE ===

/**
 * Ajouter une action à la bataille (via BattleAction)
 */
BattleSessionSchema.methods.addAction = async function(playerId: string, action: any): Promise<void> {
  // Import dynamique pour éviter la dépendance circulaire
  const { getActionLogger } = await import('../services/ActionLoggerService');
  const logger = getActionLogger();
  
  // Logger l'action avec contexte de bataille
  await logger.log(playerId, action.type as any, {
    ...action.data,
    battleId: this.battleId,
    tick: this.battleState.currentTick,
    gamePhase: this.battleState.gamePhase
  }, {
    currentScene: 'battle',
    battleId: this.battleId,
    gameMode: this.gameMode
  });
  
  this.totalActions += 1;
  await this.save();
};

/**
 * Mettre à jour l'état d'un joueur
 */
BattleSessionSchema.methods.updatePlayerState = function(playerId: string, updates: Partial<IBattlePlayer>): void {
  const player = playerId === '1' ? this.player1 : this.player2;
  Object.assign(player, updates);
  this.markModified(`player${playerId}`);
};

/**
 * Mettre à jour l'état de la bataille
 */
BattleSessionSchema.methods.updateBattleState = function(updates: Partial<IBattleState>): void {
  Object.assign(this.battleState, updates);
  this.markModified('battleState');
};

/**
 * Finaliser la bataille
 */
BattleSessionSchema.methods.finalizeBattle = async function(winnerId?: string): Promise<void> {
  this.endTime = new Date();
  this.duration = Math.round((this.endTime.getTime() - this.startTime.getTime()) / 1000);
  this.status = 'finished';
  
  if (winnerId) {
    this.winner = winnerId;
    this.winCondition = 'towers'; // Par défaut, peut être changé
    
    // Mettre à jour les stats des joueurs
    if (winnerId === '1') {
      this.player1.isWinner = true;
      this.player2.isWinner = false;
    } else {
      this.player1.isWinner = false;
      this.player2.isWinner = true;
    }
  } else {
    this.winner = 'draw';
    this.winCondition = 'timeout';
  }
  
  await this.save();
  
  // TODO: Mettre à jour les trophées des joueurs dans UserData
  console.log(`Battle ${this.battleId} finalized: ${this.winner} wins after ${this.duration}s`);
};

// === MÉTHODES STATIQUES ===

/**
 * Créer une nouvelle session de bataille
 */
BattleSessionSchema.statics.createBattle = function(
  player1Data: any,
  player2Data: any,
  roomId: string,
  options: any = {}
) {
  const battleSession = new this({
    roomId,
    player1: {
      userId: player1Data.userId,
      username: player1Data.username,
      displayName: player1Data.displayName,
      level: player1Data.level,
      trophies: player1Data.trophies,
      deck: player1Data.deck || [],
      deckLevels: player1Data.deckLevels || [],
      cardsInHand: player1Data.deck ? player1Data.deck.slice(0, 4) : []
    },
    player2: {
      userId: player2Data.userId,
      username: player2Data.username,
      displayName: player2Data.displayName,
      level: player2Data.level,
      trophies: player2Data.trophies,
      deck: player2Data.deck || [],
      deckLevels: player2Data.deckLevels || [],
      cardsInHand: player2Data.deck ? player2Data.deck.slice(0, 4) : []
    },
    gameMode: options.gameMode || 'ranked',
    battleType: options.battleType || '1v1',
    matchId: options.matchId
  });
  
  return battleSession.save();
};

/**
 * Obtenir les batailles d'un joueur
 */
BattleSessionSchema.statics.getPlayerBattles = function(
  userId: string,
  limit: number = 20,
  status?: string
) {
  const filter: any = {
    $or: [
      { 'player1.userId': userId },
      { 'player2.userId': userId }
    ]
  };
  
  if (status) {
    filter.status = status;
  }
  
  return this.find(filter)
    .sort({ startTime: -1 })
    .limit(limit)
    .lean();
};

/**
 * Obtenir les statistiques de bataille
 */
BattleSessionSchema.statics.getBattleStats = function(timeframe: number = 24) {
  const startTime = new Date();
  startTime.setHours(startTime.getHours() - timeframe);
  
  return this.aggregate([
    { $match: { startTime: { $gte: startTime } } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgDuration: { $avg: '$duration' },
        avgActions: { $avg: '$totalActions' }
      }
    }
  ]);
};

export default mongoose.model<IBattleSession>('BattleSession', BattleSessionSchema);
