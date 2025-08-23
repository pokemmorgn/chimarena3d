import mongoose, { Document, Schema } from 'mongoose';

// Interface for CardData document
export interface ICardData extends Document {
  // === IDENTIFIANTS ===
  id: string;                    // "knight", "fireball", "cannon"
  name: string;                  // "Knight", "Fireball", "Cannon"
  scriptName: string;            // "Knight" (pour les scripts de gameplay)
  
  // === VISUEL ===
  sprite: string;                // "knight.png"
  description: string;           // Description de la carte
  
  // === TYPE ET CATÉGORIE ===
  type: 'troop' | 'spell' | 'building';
  subType?: 'air' | 'ground' | 'both';  // Cible des sorts / type de troupe
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  arena: number;                 // Arena de débloquage (1-15)
  
  // === COÛT ===
  elixirCost: number;           // 1-10 élixir
  
  // === STATS BASE (niveau 1) ===
  stats: {
    // Vie (troupes et bâtiments)
    hitpoints?: number;
    
    // Dégâts
    damage?: number;             // Dégâts par attaque
    damagePerSecond?: number;    // DPS calculé
    crownTowerDamage?: number;   // Dégâts réduits sur tours
    
    // Combat
    range?: number;              // Portée d'attaque (en tuiles)
    attackSpeed?: number;        // Temps entre attaques (secondes)
    hitSpeed?: number;           // Temps d'animation d'attaque
    
    // Mouvement
    speed: 'slow' | 'medium' | 'fast' | 'very-fast';
    
    // Spécialisé bâtiments
    lifetime?: number;           // Durée de vie (bâtiments temporaires)
    buildTime?: number;          // Temps de construction
    
    // Spécialisé sorts
    duration?: number;           // Durée d'effet
    radius?: number;             // Rayon d'effet
    
    // Spécialisé troupes
    count?: number;              // Nombre d'unités invoquées
    mass?: number;               // Poids (pour knockback)
    
    // Capacités spéciales
    targets: 'air' | 'ground' | 'both';
    splashDamage?: boolean;      // Dégâts de zone
    splashRadius?: number;       // Rayon des dégâts de zone
    
    // Stats avancées
    sight?: number;              // Portée de détection
    deployTime?: number;         // Temps avant activation
    walkingSpeed?: number;       // Vitesse de déplacement (tuiles/sec)
    
    // Mécaniques spéciales
    spawns?: string;             // Ce qu'elle invoque à la mort
    spawnCount?: number;         // Nombre d'invocations
    spawnsAreaDamage?: boolean;  // Dégâts de zone à la mort
    
    // Bouclier et armure
    shield?: number;             // Points de bouclier
    
    // Capacités uniques
    abilities?: string[];        // ["charge", "rage", "freeze", etc.]
  };
  
  // === PROGRESSION ===
  maxLevel: number;             // Niveau maximum (dépend de la rarité)
  upgradeStats: [{              // Stats par niveau
    level: number;
    hitpoints?: number;
    damage?: number;
    crownTowerDamage?: number;
    // ... autres stats qui évoluent
  }];
  
  // === COLLECTION ===
  cardsToUpgrade: [{            // Cartes nécessaires pour upgrade
    level: number;              // Vers quel niveau
    cards: number;              // Nombre de cartes requis
    gold: number;               // Or requis
  }];
  
  // === MÉTA-DONNÉES ===
  releaseDate?: Date;           // Date de sortie
  isEnabled: boolean;           // Activée dans le jeu
  
  // === GAMEPLAY ===
  gameplay: {
    priority?: number;          // Priorité de ciblage
    retarget?: boolean;         // Peut changer de cible
    attacksGround?: boolean;
    attacksAir?: boolean;
    kamikaze?: boolean;         // Se détruit en attaquant
    building?: boolean;         // Est un bâtiment
    spell?: boolean;            // Est un sort
    
    // Mécaniques avancées
    multipleTargets?: number;   // Nombre de cibles simultanées
    chainAttack?: boolean;      // Attaque en chaîne
    healing?: boolean;          // Capacité de soin
    pushback?: boolean;         // Repousse les ennemis
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// CardData Schema
const CardDataSchema = new Schema<ICardData>({
  id: {
    type: String,
    required: [true, 'Card ID is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  
  name: {
    type: String,
    required: [true, 'Card name is required'],
    trim: true,
    maxlength: [50, 'Card name cannot exceed 50 characters']
  },
  
  scriptName: {
    type: String,
    required: [true, 'Script name is required'],
    trim: true
  },
  
  sprite: {
    type: String,
    required: [true, 'Sprite is required'],
    trim: true
  },
  
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  
  type: {
    type: String,
    required: [true, 'Card type is required'],
    enum: ['troop', 'spell', 'building']
  },
  
  subType: {
    type: String,
    enum: ['air', 'ground', 'both'],
    default: 'both'
  },
  
  rarity: {
    type: String,
    required: [true, 'Rarity is required'],
    enum: ['common', 'rare', 'epic', 'legendary']
  },
  
  arena: {
    type: Number,
    required: [true, 'Arena is required'],
    min: [1, 'Arena must be at least 1'],
    max: [15, 'Arena cannot exceed 15']
  },
  
  elixirCost: {
    type: Number,
    required: [true, 'Elixir cost is required'],
    min: [1, 'Elixir cost must be at least 1'],
    max: [10, 'Elixir cost cannot exceed 10']
  },
  
  stats: {
    hitpoints: { type: Number, min: 0 },
    damage: { type: Number, min: 0 },
    damagePerSecond: { type: Number, min: 0 },
    crownTowerDamage: { type: Number, min: 0 },
    range: { type: Number, min: 0 },
    attackSpeed: { type: Number, min: 0 },
    hitSpeed: { type: Number, min: 0 },
    speed: {
      type: String,
      enum: ['slow', 'medium', 'fast', 'very-fast'],
      default: 'medium'
    },
    lifetime: { type: Number, min: 0 },
    buildTime: { type: Number, min: 0 },
    duration: { type: Number, min: 0 },
    radius: { type: Number, min: 0 },
    count: { type: Number, min: 1, default: 1 },
    mass: { type: Number, min: 0 },
    targets: {
      type: String,
      enum: ['air', 'ground', 'both'],
      default: 'ground'
    },
    splashDamage: { type: Boolean, default: false },
    splashRadius: { type: Number, min: 0 },
    sight: { type: Number, min: 0 },
    deployTime: { type: Number, min: 0 },
    walkingSpeed: { type: Number, min: 0 },
    spawns: { type: String },
    spawnCount: { type: Number, min: 0 },
    spawnsAreaDamage: { type: Boolean, default: false },
    shield: { type: Number, min: 0 },
    abilities: [{ type: String }]
  },
  
  maxLevel: {
    type: Number,
    required: [true, 'Max level is required'],
    min: [1, 'Max level must be at least 1']
  },
  
  upgradeStats: [{
    level: { type: Number, required: true },
    hitpoints: { type: Number },
    damage: { type: Number },
    crownTowerDamage: { type: Number }
  }],
  
  cardsToUpgrade: [{
    level: { type: Number, required: true },
    cards: { type: Number, required: true },
    gold: { type: Number, required: true }
  }],
  
  releaseDate: { type: Date },
  isEnabled: { type: Boolean, default: true },
  
  gameplay: {
    priority: { type: Number },
    retarget: { type: Boolean, default: true },
    attacksGround: { type: Boolean, default: true },
    attacksAir: { type: Boolean, default: false },
    kamikaze: { type: Boolean, default: false },
    building: { type: Boolean, default: false },
    spell: { type: Boolean, default: false },
    multipleTargets: { type: Number, min: 1 },
    chainAttack: { type: Boolean, default: false },
    healing: { type: Boolean, default: false },
    pushback: { type: Boolean, default: false }
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
CardDataSchema.index({ type: 1, rarity: 1 });
CardDataSchema.index({ arena: 1 });
CardDataSchema.index({ elixirCost: 1 });
CardDataSchema.index({ isEnabled: 1 });

// Méthodes pour calculer les stats par niveau
CardDataSchema.methods.getStatsForLevel = function(level: number) {
  const baseStats = this.stats;
  const upgradeData = this.upgradeStats.find((u: any) => u.level === level);
  
  if (!upgradeData) {
    // Si pas de données spécifiques, retourner les stats de base
    return baseStats;
  }
  
  return {
    ...baseStats,
    hitpoints: upgradeData.hitpoints || baseStats.hitpoints,
    damage: upgradeData.damage || baseStats.damage,
    crownTowerDamage: upgradeData.crownTowerDamage || baseStats.crownTowerDamage
  };
};

// Méthode pour obtenir le coût d'upgrade
CardDataSchema.methods.getUpgradeCost = function(toLevel: number) {
  return this.cardsToUpgrade.find((u: any) => u.level === toLevel) || null;
};

export default mongoose.model<ICardData>('CardData', CardDataSchema);
