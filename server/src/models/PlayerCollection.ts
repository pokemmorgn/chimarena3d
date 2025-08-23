import mongoose, { Document, Schema, Types } from 'mongoose';

// Interface for individual card in collection
export interface IPlayerCard {
  cardId: string;              // ID de la carte (knight, fireball, etc.)
  count: number;               // Nombre de cartes possédées
  level: number;               // Niveau actuel de la carte
  isMaxed: boolean;            // Carte au niveau maximum
  
  // Statistiques d'utilisation
  totalUsed: number;           // Nombre de fois utilisée en bataille
  wins: number;                // Victoires avec cette carte
  losses: number;              // Défaites avec cette carte
  
  // Dates importantes
  firstObtained: Date;         // Date d'obtention de la première carte
  lastLevelUp: Date;           // Dernière amélioration
}

// Interface for player deck slot
export interface IDeckSlot {
  cardId: string;              // ID de la carte
  position: number;            // Position dans le deck (0-7)
  isActive: boolean;           // Deck actuellement actif
}

// Interface for PlayerCollection document
export interface IPlayerCollection extends Document {
  // === RÉFÉRENCES ===
  userId: Types.ObjectId;      // Référence vers UserData
  
  // === COLLECTION DE CARTES ===
  cards: IPlayerCard[];        // Toutes les cartes possédées
  
  // === DECKS ===
  activeDecks: IDeckSlot[][];  // Jusqu'à 5 decks (chaque deck = 8 cartes)
  currentDeckIndex: number;    // Index du deck actuellement sélectionné (0-4)
  
  // === RESSOURCES ===
  gold: number;                // Or pour améliorer les cartes
  gems: number;                // Gemmes (monnaie premium)
  
  // === COFFRES ET RÉCOMPENSES ===
  chests: [{
    type: string;              // 'silver', 'gold', 'magical', 'super_magical', etc.
    unlockTime?: Date;         // Quand le coffre sera débloqué
    isUnlocked: boolean;       // Coffre prêt à être ouvert
    slot: number;              // Position dans l'inventaire (0-3)
  }];
  
  chestCycle: {
    position: number;          // Position actuelle dans le cycle de coffres (0-239)
    nextSpecialChest: string;  // Prochain coffre spécial à recevoir
  };
  
  // === SHOP ET ACHATS ===
  shopOffers: [{
    cardId: string;            // Carte en vente
    count: number;             // Nombre de cartes
    cost: number;              // Coût en or
    refreshTime: Date;         // Quand l'offre sera rafraîchie
    purchased: boolean;        // Déjà acheté aujourd'hui
  }];
  
  dailyShopRefreshTime: Date;  // Prochaine actualisation du shop
  
  // === STATISTIQUES ===
  stats: {
    totalCardsCollected: number;     // Nombre total de cartes obtenues
    totalCardsUpgraded: number;      // Nombre d'améliorations effectuées
    totalGoldSpent: number;          // Or total dépensé
    totalGemsSpent: number;          // Gemmes totales dépensées
    
    // Par rareté
    commonCards: number;             // Cartes communes possédées
    rareCards: number;               // Cartes rares possédées
    epicCards: number;               // Cartes épiques possédées
    legendaryCards: number;          // Cartes légendaires possédées
    
    // Niveaux
    maxLevelCards: number;           // Nombre de cartes au niveau max
    averageCardLevel: number;        // Niveau moyen des cartes
  };
  
  // === QUÊTES ET DÉFIS ===
  questProgress: [{
    questId: string;           // ID de la quête
    progress: number;          // Progression actuelle
    isCompleted: boolean;      // Quête terminée
    rewardClaimed: boolean;    // Récompense récupérée
    expiresAt: Date;           // Date d'expiration
  }];
  
  // === ÉVÉNEMENTS SPÉCIAUX ===
  seasonPass: {
    tier: number;              // Niveau actuel (1-35)
    freeRewardsClaimed: number[];   // Récompenses gratuites récupérées
    premiumRewardsClaimed: number[]; // Récompenses premium récupérées
    isPremium: boolean;        // Pass premium acheté
    seasonId: string;          // ID de la saison actuelle
  };
  
  // === MÉTADONNÉES ===
  lastChestReceived: Date;     // Dernière réception de coffre
  lastDailyReward: Date;       // Dernière récompense quotidienne
  lastActivity: Date;          // Dernière activité du joueur
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // === MÉTHODES ===
  getCard(cardId: string): IPlayerCard | null;
  hasCard(cardId: string): boolean;
  addCards(cardId: string, count: number): void;
  upgradeCard(cardId: string): boolean;
  canUpgradeCard(cardId: string): boolean;
  getUpgradeCost(cardId: string): { gold: number; cards: number } | null;
  setDeck(deckIndex: number, cardIds: string[]): boolean;
  getDeck(deckIndex?: number): IDeckSlot[];
  calculateCollectionStats(): void;
}

// Schema for individual cards
const PlayerCardSchema = new Schema<IPlayerCard>({
  cardId: {
    type: String,
    required: [true, 'Card ID is required'],
    trim: true
  },
  count: {
    type: Number,
    required: [true, 'Card count is required'],
    min: [0, 'Card count cannot be negative'],
    default: 0
  },
  level: {
    type: Number,
    required: [true, 'Card level is required'],
    min: [1, 'Card level must be at least 1'],
    default: 1
  },
  isMaxed: {
    type: Boolean,
    default: false
  },
  totalUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  wins: {
    type: Number,
    default: 0,
    min: 0
  },
  losses: {
    type: Number,
    default: 0,
    min: 0
  },
  firstObtained: {
    type: Date,
    default: Date.now
  },
  lastLevelUp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Schema for deck slots
const DeckSlotSchema = new Schema<IDeckSlot>({
  cardId: {
    type: String,
    required: [true, 'Card ID is required']
  },
  position: {
    type: Number,
    required: [true, 'Position is required'],
    min: [0, 'Position must be at least 0'],
    max: [7, 'Position cannot exceed 7']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// Main PlayerCollection Schema
const PlayerCollectionSchema = new Schema<IPlayerCollection>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'UserData',
    required: [true, 'User ID is required'],
    unique: true,
    index: true
  },
  
  cards: {
    type: [PlayerCardSchema],
    default: []
  },
  
  activeDecks: {
    type: [[DeckSlotSchema]],
    default: [[], [], [], [], []], // 5 decks vides par défaut
    validate: {
      validator: function(decks: IDeckSlot[][]) {
        return decks.length <= 5; // Maximum 5 decks
      },
      message: 'Cannot have more than 5 decks'
    }
  },
  
  currentDeckIndex: {
    type: Number,
    default: 0,
    min: [0, 'Deck index must be at least 0'],
    max: [4, 'Deck index cannot exceed 4']
  },
  
  gold: {
    type: Number,
    default: 300, // Or de départ dans CR
    min: [0, 'Gold cannot be negative']
  },
  
  gems: {
    type: Number,
    default: 100, // Gemmes de départ dans CR
    min: [0, 'Gems cannot be negative']
  },
  
  chests: [{
    type: {
      type: String,
      required: true,
      enum: ['silver', 'gold', 'crown', 'magical', 'giant', 'super_magical', 'epic', 'legendary']
    },
    unlockTime: { type: Date },
    isUnlocked: { type: Boolean, default: false },
    slot: {
      type: Number,
      required: true,
      min: 0,
      max: 3
    }
  }],
  
  chestCycle: {
    position: {
      type: Number,
      default: 0,
      min: 0,
      max: 239 // Cycle de 240 coffres dans CR
    },
    nextSpecialChest: {
      type: String,
      default: 'giant'
    }
  },
  
  shopOffers: [{
    cardId: { type: String, required: true },
    count: { type: Number, required: true, min: 1 },
    cost: { type: Number, required: true, min: 1 },
    refreshTime: { type: Date, required: true },
    purchased: { type: Boolean, default: false }
  }],
  
  dailyShopRefreshTime: {
    type: Date,
    default: () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    }
  },
  
  stats: {
    totalCardsCollected: { type: Number, default: 0 },
    totalCardsUpgraded: { type: Number, default: 0 },
    totalGoldSpent: { type: Number, default: 0 },
    totalGemsSpent: { type: Number, default: 0 },
    commonCards: { type: Number, default: 0 },
    rareCards: { type: Number, default: 0 },
    epicCards: { type: Number, default: 0 },
    legendaryCards: { type: Number, default: 0 },
    maxLevelCards: { type: Number, default: 0 },
    averageCardLevel: { type: Number, default: 1 }
  },
  
  questProgress: [{
    questId: { type: String, required: true },
    progress: { type: Number, default: 0, min: 0 },
    isCompleted: { type: Boolean, default: false },
    rewardClaimed: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true }
  }],
  
  seasonPass: {
    tier: { type: Number, default: 1, min: 1, max: 35 },
    freeRewardsClaimed: [{ type: Number }],
    premiumRewardsClaimed: [{ type: Number }],
    isPremium: { type: Boolean, default: false },
    seasonId: { type: String, default: 'season1' }
  },
  
  lastChestReceived: {
    type: Date,
    default: Date.now
  },
  
  lastDailyReward: {
    type: Date,
    default: null
  },
  
  lastActivity: {
    type: Date,
    default: Date.now
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

// Indexes pour performance
PlayerCollectionSchema.index({ userId: 1 });
PlayerCollectionSchema.index({ 'cards.cardId': 1 });
PlayerCollectionSchema.index({ lastActivity: -1 });

// === MÉTHODES D'INSTANCE ===

/**
 * Obtenir une carte spécifique de la collection
 */
PlayerCollectionSchema.methods.getCard = function(cardId: string): IPlayerCard | null {
  return this.cards.find((card: IPlayerCard) => card.cardId === cardId) || null;
};

/**
 * Vérifier si le joueur possède une carte
 */
PlayerCollectionSchema.methods.hasCard = function(cardId: string): boolean {
  return this.cards.some((card: IPlayerCard) => card.cardId === cardId && card.count > 0);
};

/**
 * Ajouter des cartes à la collection
 */
PlayerCollectionSchema.methods.addCards = function(cardId: string, count: number): void {
  let card = this.getCard(cardId);
  
  if (!card) {
    // Première carte de ce type
    card = {
      cardId,
      count: count,
      level: 1,
      isMaxed: false,
      totalUsed: 0,
      wins: 0,
      losses: 0,
      firstObtained: new Date(),
      lastLevelUp: new Date()
    };
    this.cards.push(card);
  } else {
    // Ajouter à la collection existante
    card.count += count;
  }
  
  this.stats.totalCardsCollected += count;
  this.calculateCollectionStats();
  this.markModified('cards');
  this.markModified('stats');
};

/**
 * Améliorer une carte (si possible)
 */
PlayerCollectionSchema.methods.upgradeCard = function(cardId: string): boolean {
  if (!this.canUpgradeCard(cardId)) {
    return false;
  }
  
  const card = this.getCard(cardId);
  if (!card) return false;
  
  const upgradeCost = this.getUpgradeCost(cardId);
  if (!upgradeCost) return false;
  
  // Déduire les ressources
  this.gold -= upgradeCost.gold;
  card.count -= upgradeCost.cards;
  
  // Améliorer la carte
  card.level += 1;
  card.lastLevelUp = new Date();
  
  // Vérifier si carte au niveau max (à implémenter selon les données de cartes)
  // card.isMaxed = card.level >= maxLevelForCard;
  
  // Mettre à jour les stats
  this.stats.totalCardsUpgraded += 1;
  this.stats.totalGoldSpent += upgradeCost.gold;
  
  this.calculateCollectionStats();
  this.markModified('cards');
  this.markModified('stats');
  
  return true;
};

/**
 * Vérifier si une carte peut être améliorée
 */
PlayerCollectionSchema.methods.canUpgradeCard = function(cardId: string): boolean {
  const card = this.getCard(cardId);
  if (!card || card.isMaxed) return false;
  
  const upgradeCost = this.getUpgradeCost(cardId);
  if (!upgradeCost) return false;
  
  return this.gold >= upgradeCost.gold && card.count >= upgradeCost.cards;
};

/**
 * Obtenir le coût d'amélioration d'une carte
 * TODO: Récupérer les vraies données depuis CardData
 */
PlayerCollectionSchema.methods.getUpgradeCost = function(cardId: string): { gold: number; cards: number } | null {
  const card = this.getCard(cardId);
  if (!card || card.isMaxed) return null;
  
  // Coûts approximatifs de CR (à remplacer par vraies données)
  const baseCosts = {
    common: { gold: [5, 20, 50, 150, 300], cards: [2, 4, 10, 20, 50] },
    rare: { gold: [50, 150, 400, 1000, 2000], cards: [2, 4, 10, 20, 50] },
    epic: { gold: [2000, 4000, 8000, 20000, 50000], cards: [2, 4, 10, 20, 50] },
    legendary: { gold: [5000, 20000, 50000, 100000, 200000], cards: [2, 4, 10, 20, 50] }
  };
  
  // Pour l'instant, utiliser les coûts des cartes communes
  const levelIndex = card.level - 1;
  if (levelIndex >= baseCosts.common.gold.length) return null;
  
  return {
    gold: baseCosts.common.gold[levelIndex],
    cards: baseCosts.common.cards[levelIndex]
  };
};

/**
 * Définir un deck
 */
PlayerCollectionSchema.methods.setDeck = function(deckIndex: number, cardIds: string[]): boolean {
  if (deckIndex < 0 || deckIndex >= 5) return false;
  if (cardIds.length !== 8) return false;
  
  // Vérifier que toutes les cartes sont possédées
  for (const cardId of cardIds) {
    if (!this.hasCard(cardId)) return false;
  }
  
  // Créer le nouveau deck
  const newDeck: IDeckSlot[] = cardIds.map((cardId, position) => ({
    cardId,
    position,
    isActive: true
  }));
  
  this.activeDecks[deckIndex] = newDeck;
  this.markModified('activeDecks');
  
  return true;
};

/**
 * Obtenir un deck
 */
PlayerCollectionSchema.methods.getDeck = function(deckIndex?: number): IDeckSlot[] {
  const index = deckIndex !== undefined ? deckIndex : this.currentDeckIndex;
  if (index < 0 || index >= 5) return [];
  
  return this.activeDecks[index] || [];
};

/**
 * Recalculer les statistiques de collection
 */
PlayerCollectionSchema.methods.calculateCollectionStats = function(): void {
  const stats = {
    totalCardsCollected: this.stats.totalCardsCollected,
    totalCardsUpgraded: this.stats.totalCardsUpgraded,
    totalGoldSpent: this.stats.totalGoldSpent,
    totalGemsSpent: this.stats.totalGemsSpent,
    commonCards: 0,
    rareCards: 0,
    epicCards: 0,
    legendaryCards: 0,
    maxLevelCards: 0,
    averageCardLevel: 0
  };
  
  let totalLevels = 0;
  let cardCount = 0;
  
  this.cards.forEach((card: IPlayerCard) => {
    if (card.count > 0) {
      cardCount++;
      totalLevels += card.level;
      
      if (card.isMaxed) {
        stats.maxLevelCards++;
      }
      
      // TODO: Déterminer la rareté depuis CardData
      stats.commonCards++; // Temporaire
    }
  });
  
  stats.averageCardLevel = cardCount > 0 ? Math.round((totalLevels / cardCount) * 100) / 100 : 1;
  
  this.stats = stats;
  this.markModified('stats');
};

export default mongoose.model<IPlayerCollection>('PlayerCollection', PlayerCollectionSchema);
