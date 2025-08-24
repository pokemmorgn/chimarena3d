import { Schema, type } from '@colyseus/schema';
import CardData, { ICardData } from '../../models/CardData';
import { getActionLogger } from '../../services/ActionLoggerService';

// === INTERFACES ET TYPES ===

export interface IPosition {
  x: number;
  y: number;
}

export interface IUnitStats {
  // Stats de combat
  hitpoints: number;
  damage: number;
  damagePerSecond: number;
  crownTowerDamage?: number;
  
  // Stats de mouvement
  speed: 'slow' | 'medium' | 'fast' | 'very-fast';
  walkingSpeed: number;
  range: number;
  attackSpeed: number;
  
  // Stats spéciales
  targets: 'air' | 'ground' | 'both';
  splashDamage: boolean;
  splashRadius?: number;
  count: number; // Nombre d'unités spawned
  mass: number;
  sight: number;
  deployTime: number;
  
  // Capacités spéciales (toutes optionnelles)
  abilities?: string[];
  spawns?: string; // Ce qu'elle spawn à la mort
  spawnCount?: number;
}

export type UnitState = 'spawning' | 'idle' | 'moving' | 'attacking' | 'special' | 'dying' | 'dead';
export type UnitType = 'troop' | 'building' | 'spell_effect';
export type TargetType = 'unit' | 'building' | 'tower' | 'ground_position';

export interface ITarget {
  type: TargetType;
  id: string;
  position: IPosition;
  priority: number;
}

export interface IUnitBehavior {
  // État actuel
  state: UnitState;
  lastStateChange: number;
  
  // Targeting
  currentTarget?: ITarget;
  targetAcquisitionRange: number;
  retargetCooldown: number;
  lastRetarget: number;
  
  // Combat
  lastAttackTick: number;
  nextAttackTick: number;
  isAttacking: boolean;
  attackWindup: number; // Temps avant que l'attaque parte
  
  // Mouvement
  destination?: IPosition;
  pathNodes: IPosition[];
  currentPathIndex: number;
  lastMoveTick: number;
  moveSpeed: number; // Calculé depuis speed enum
  
  // Buffs/Debuffs
  buffs: Map<string, IUnitBuff>;
  debuffs: Map<string, IUnitDebuff>;
}

export interface IUnitBuff {
  id: string;
  type: 'damage' | 'speed' | 'healing' | 'shield' | 'rage' | 'freeze';
  value: number;
  startTick: number;
  duration: number; // En ticks
  source: string; // ID de l'unité qui a appliqué le buff
}

export interface IUnitDebuff extends IUnitBuff {
  // Même interface que buff pour simplifier
}

// === CACHE CARDDATA GLOBAL ===
class CardDataCache {
  private static instance: CardDataCache;
  private cache = new Map<string, ICardData>();
  private loading = new Map<string, Promise<ICardData>>();
  
  static getInstance(): CardDataCache {
    if (!CardDataCache.instance) {
      CardDataCache.instance = new CardDataCache();
    }
    return CardDataCache.instance;
  }
  
  async getCardData(cardId: string): Promise<ICardData> {
    // Vérifier le cache
    if (this.cache.has(cardId)) {
      return this.cache.get(cardId)!;
    }
    
    // Vérifier si on est en train de charger
    if (this.loading.has(cardId)) {
      return await this.loading.get(cardId)!;
    }
    
    // Charger depuis la base
    const loadPromise = this.loadFromDatabase(cardId);
    this.loading.set(cardId, loadPromise);
    
    try {
      const cardData = await loadPromise;
      this.cache.set(cardId, cardData);
      this.loading.delete(cardId);
      return cardData;
    } catch (error) {
      this.loading.delete(cardId);
      throw error;
    }
  }
  
  private async loadFromDatabase(cardId: string): Promise<ICardData> {
    const cardData = await CardData.findOne({ 
      id: cardId, 
      isEnabled: true 
    });
    
    if (!cardData) {
      throw new Error(`Card not found or disabled: ${cardId}`);
    }
    
    return cardData;
  }
  
  // Méthode pour précharger les cartes communes
  async preloadCards(cardIds: string[]): Promise<void> {
    const promises = cardIds.map(id => this.getCardData(id));
    await Promise.all(promises);
  }
  
  // Clear cache (pour tests ou reload)
  clearCache(): void {
    this.cache.clear();
    this.loading.clear();
  }
}

// === CLASSE BASEUNIT PRINCIPALE ===

export class BaseUnit extends Schema {
  // === IDENTIFIANTS ===
  @type("string") id: string = "";
  @type("string") cardId: string = "";
  @type("string") ownerId: string = "";
  @type("number") level: number = 1;
  @type("string") unitType: UnitType = 'troop';
  
  // === VISUEL ===
  @type("string") modelFile: string = "";   // <-- ajouté pour le .glb
  
  // === POSITION ===
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  
  // === STATS ACTUELLES ===
  @type("number") currentHitpoints: number = 100;
  @type("number") maxHitpoints: number = 100;
  @type("number") currentDamage: number = 50;
  
  // === ÉTAT ===
  @type("string") state: UnitState = 'spawning';
  @type("number") spawnTick: number = 0;
  @type("number") lastUpdateTick: number = 0;
  
  // === DONNÉES NON-SYNCHRONISÉES ===
  // Ces données ne sont pas envoyées aux clients (calculs serveur)
  
  private cardData!: ICardData;
  private baseStats!: IUnitStats;
  private behavior!: IUnitBehavior;
  private logger = getActionLogger();
  
  // Cache des vitesses pour optimisation
  private static readonly SPEED_VALUES: Record<string, number> = {
    'slow': 0.5,        // 0.5 tile/sec
    'medium': 1.0,      // 1.0 tile/sec  
    'fast': 1.5,        // 1.5 tile/sec
    'very-fast': 2.0    // 2.0 tile/sec
  };

  // === FACTORY METHOD (Recommandé pour async loading) ===
  
  /**
   * Créer une unité avec chargement des données depuis CardData
   */
  static async create(
    cardId: string, 
    level: number, 
    ownerId: string, 
    position: IPosition,
    spawnTick: number
  ): Promise<BaseUnit> {
    const unit = new BaseUnit();
    await unit.initialize(cardId, level, ownerId, position, spawnTick);
    return unit;
  }
  
  /**
   * Initialisation avec chargement async des données
   */
 private async initialize(
  cardId: string,
  level: number,
  ownerId: string,
  position: IPosition,
  spawnTick: number
): Promise<void> {
  try {
    // Générer ID unique
    this.id = `unit_${spawnTick}_${Math.random().toString(36).substr(2, 6)}`;
    this.cardId = cardId;
    this.ownerId = ownerId;
    this.level = level;
    this.x = position.x;
    this.y = position.y;
    this.spawnTick = spawnTick;
    this.lastUpdateTick = spawnTick;
    
    // Charger les données de carte depuis le cache
    const cache = CardDataCache.getInstance();
    this.cardData = await cache.getCardData(cardId);
    
    // Définir le type d'unité
    this.unitType = this.cardData.type as UnitType;
    
    // Définir le modèle 3D (.glb)
    this.modelFile = this.cardData.modelFile || "";
    
    // Charger les stats pour le niveau spécifique
    this.loadStatsForLevel(level);
    
    // Initialiser le comportement
    this.initializeBehavior();
    
    // Logger la création (sync pour éviter les problèmes)
    this.logger.logBattle('unit_deployed', ownerId, {
      unitId: this.id,
      cardId: this.cardId,
      level: this.level,
      position: { x: this.x, y: this.y },
      hitpoints: this.currentHitpoints,
      damage: this.currentDamage,
      spawnTick
    });
    
  } catch (error) {
    console.error(`Failed to initialize unit ${cardId}:`, error);
    throw error;
  }
}

  /**
   * Charger les stats pour le niveau spécifique
   */
  private loadStatsForLevel(level: number): void {
    // Utiliser la méthode du model CardData
    const levelStats = this.cardData.getStatsForLevel(level);
    
    // Créer les stats avec valeurs par défaut correctes
    // D'abord construire un objet complet avec toutes les propriétés requises
    this.baseStats = {
      hitpoints: levelStats.hitpoints ?? this.cardData.stats.hitpoints ?? 100,
      damage: levelStats.damage ?? this.cardData.stats.damage ?? 50,
      damagePerSecond: this.cardData.stats.damagePerSecond ?? 0,
      
      speed: this.cardData.stats.speed ?? 'medium',
      walkingSpeed: BaseUnit.SPEED_VALUES[this.cardData.stats.speed as string] ?? BaseUnit.SPEED_VALUES['medium'],
      range: this.cardData.stats.range ?? 1,
      attackSpeed: this.cardData.stats.attackSpeed ?? 1.5,
      
      targets: this.cardData.stats.targets ?? 'ground',
      splashDamage: this.cardData.stats.splashDamage ?? false,
      count: this.cardData.stats.count ?? 1,
      mass: this.cardData.stats.mass ?? 1,
      sight: this.cardData.stats.sight ?? 5.5,
      deployTime: this.cardData.stats.deployTime ?? 1,
    };

    // Ajouter les propriétés optionnelles seulement si elles existent
    if (levelStats.crownTowerDamage !== undefined) {
      this.baseStats.crownTowerDamage = levelStats.crownTowerDamage;
    } else if (this.cardData.stats.crownTowerDamage !== undefined) {
      this.baseStats.crownTowerDamage = this.cardData.stats.crownTowerDamage;
    }

    if (this.cardData.stats.splashRadius !== undefined) {
      this.baseStats.splashRadius = this.cardData.stats.splashRadius;
    }

    if (this.cardData.stats.abilities !== undefined) {
      this.baseStats.abilities = this.cardData.stats.abilities;
    }

    if (this.cardData.stats.spawns !== undefined) {
      this.baseStats.spawns = this.cardData.stats.spawns;
    }

    if (this.cardData.stats.spawnCount !== undefined) {
      this.baseStats.spawnCount = this.cardData.stats.spawnCount;
    }
    
    // Initialiser les stats actuelles
    this.maxHitpoints = this.baseStats.hitpoints;
    this.currentHitpoints = this.baseStats.hitpoints;
    this.currentDamage = this.baseStats.damage;
  }
  
  /**
   * Initialiser le comportement de base
   */
  private initializeBehavior(): void {
    this.behavior = {
      state: 'spawning',
      lastStateChange: this.spawnTick,
      
      targetAcquisitionRange: this.baseStats.sight,
      retargetCooldown: 20, // 1 seconde à 20 TPS
      lastRetarget: 0,
      
      lastAttackTick: 0,
      nextAttackTick: 0,
      isAttacking: false,
      attackWindup: Math.round(this.baseStats.attackSpeed * 0.3 * 20), // 30% du attack speed
      
      pathNodes: [],
      currentPathIndex: 0,
      lastMoveTick: this.spawnTick,
      moveSpeed: this.baseStats.walkingSpeed,
      
      buffs: new Map(),
      debuffs: new Map()
    };
    
    // Programmer la fin du spawn
    const deployTimeTicks = Math.round(this.baseStats.deployTime * 20); // Convertir en ticks
    setTimeout(() => {
      if (this.state === 'spawning') {
        this.setState('idle');
      }
    }, deployTimeTicks * 50); // 50ms par tick
  }
  
  // === MÉTHODES PRINCIPALES ===
  
  /**
   * Mise à jour principale appelée chaque tick
   */
  update(currentTick: number, deltaTime: number): void {
    this.lastUpdateTick = currentTick;
    
    // Mettre à jour les buffs/debuffs
    this.updateEffects(currentTick);
    
    // Logique selon l'état
    switch (this.state) {
      case 'spawning':
        // Attendre la fin du deploy time
        break;
        
      case 'idle':
        this.updateIdle(currentTick);
        break;
        
      case 'moving':
        this.updateMovement(currentTick, deltaTime);
        break;
        
      case 'attacking':
        this.updateAttacking(currentTick);
        break;
        
      case 'special':
        this.updateSpecial(currentTick);
        break;
        
      case 'dying':
        this.updateDying(currentTick);
        break;
        
      case 'dead':
        // Unité morte, ne rien faire
        break;
    }
  }
  
  /**
   * Logique état idle - chercher des cibles
   */
  private updateIdle(currentTick: number): void {
    // Chercher des cibles si cooldown écoulé
    if (currentTick >= this.behavior.lastRetarget + this.behavior.retargetCooldown) {
      const target = this.findTarget();
      if (target) {
        this.setTarget(target);
        this.setState('moving');
      }
      this.behavior.lastRetarget = currentTick;
    }
  }
  
  /**
   * Logique mouvement vers la cible
   */
  private updateMovement(currentTick: number, deltaTime: number): void {
    if (!this.behavior.destination) {
      this.setState('idle');
      return;
    }
    
    // Calculer la distance vers destination
    const dx = this.behavior.destination.x - this.x;
    const dy = this.behavior.destination.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Vérifier si en range d'attaque de la cible
    if (this.behavior.currentTarget && distance <= this.baseStats.range) {
      this.setState('attacking');
      return;
    }
    
    // Se déplacer vers la destination
    if (distance > 0.1) { // Seuil minimum pour éviter les micro-mouvements
      const moveDistance = this.behavior.moveSpeed * (deltaTime / 1000); // Distance par frame
      const ratio = Math.min(moveDistance / distance, 1);
      
      this.x += dx * ratio;
      this.y += dy * ratio;
      
      this.behavior.lastMoveTick = currentTick;
    } else {
      // Arrivé à destination
      this.setState('idle');
    }
  }
  
  /**
   * Logique d'attaque
   */
  private updateAttacking(currentTick: number): void {
    if (!this.behavior.currentTarget) {
      this.setState('idle');
      return;
    }
    
    // Vérifier si la cible est encore en range
    const targetDistance = this.getDistanceToTarget(this.behavior.currentTarget);
    if (targetDistance > this.baseStats.range) {
      this.setState('moving');
      return;
    }
    
    // Vérifier si on peut attaquer
    if (currentTick >= this.behavior.nextAttackTick) {
      this.performAttack(currentTick);
    }
  }
  
  /**
   * Logique spéciale (pour capacités uniques)
   */
  private updateSpecial(_currentTick: number): void {
    // À implémenter selon les capacités spéciales
    // Ex: Charge du Prince, Rage de Lumberjack, etc.
  }
  
  /**
   * Logique de mort
   */
  private updateDying(currentTick: number): void {
    // Animation de mort, spawn d'unités, etc.
    const deathDuration = 10; // 0.5 seconde
    
    if (currentTick >= this.behavior.lastStateChange + deathDuration) {
      this.setState('dead');
      
      // Spawn des unités si nécessaire (ex: Skeleton Army)
      if (this.baseStats.spawns) {
        this.spawnDeathUnits();
      }
    }
  }
  
  /**
   * Mettre à jour les effets (buffs/debuffs)
   */
  private updateEffects(currentTick: number): void {
    // Nettoyer les buffs expirés
    for (const [id, buff] of this.behavior.buffs) {
      if (currentTick >= buff.startTick + buff.duration) {
        this.removeBuff(id);
      }
    }
    
    // Nettoyer les debuffs expirés
    for (const [id, debuff] of this.behavior.debuffs) {
      if (currentTick >= debuff.startTick + debuff.duration) {
        this.removeDebuff(id);
      }
    }
  }
  
  // === MÉTHODES DE COMBAT ===
  
  /**
   * Infliger des dégâts à cette unité
   */
  takeDamage(damage: number, attackerId?: string, damageType: string = 'normal'): boolean {
    const actualDamage = this.calculateActualDamage(damage, damageType);
    
    this.currentHitpoints = Math.max(0, this.currentHitpoints - actualDamage);
    
    // Logger les dégâts (sync pour éviter les problèmes dans le tick)
    this.logger.logBattle('card_played', this.ownerId, {
      unitId: this.id,
      attackerId,
      damage: actualDamage,
      remainingHP: this.currentHitpoints,
      damageType,
      actionType: 'unit_damaged'
    });
    
    // Vérifier si mort
    if (this.currentHitpoints <= 0) {
      this.setState('dying');
      return true; // Unité tuée
    }
    
    return false; // Unité survivante
  }
  
  /**
   * Calculer les dégâts réels (après armor, shields, etc.)
   */
  private calculateActualDamage(baseDamage: number, damageType: string): number {
    let actualDamage = baseDamage;
    
    // Appliquer les modificateurs de dégâts
    for (const buff of this.behavior.buffs.values()) {
      if (buff.type === 'shield' && damageType === 'normal') {
        actualDamage = Math.max(0, actualDamage - buff.value);
      }
    }
    
    return Math.round(actualDamage);
  }
  
  /**
   * Effectuer une attaque
   */
  private performAttack(currentTick: number): void {
    if (!this.behavior.currentTarget) return;
    
    const attackSpeedTicks = Math.round(this.baseStats.attackSpeed * 20); // Convertir en ticks
    this.behavior.nextAttackTick = currentTick + attackSpeedTicks;
    this.behavior.lastAttackTick = currentTick;
    this.behavior.isAttacking = true;
    
    // Programmer l'impact après le windup
    setTimeout(() => {
      this.dealDamage();
      this.behavior.isAttacking = false;
    }, this.behavior.attackWindup * 50); // 50ms par tick
  }
  
  /**
   * Infliger des dégâts à la cible
   */
  private dealDamage(): void {
    if (!this.behavior.currentTarget) return;
    
    const damage = this.getCurrentDamage();
    
    // Logger l'attaque (sync)
    this.logger.logBattle('card_played', this.ownerId, {
      attackerId: this.id,
      targetId: this.behavior.currentTarget.id,
      damage,
      attackType: this.baseStats.splashDamage ? 'splash' : 'single',
      actionType: 'unit_attack'
    });
    
    // TODO: Intégrer avec CombatSystem pour appliquer les dégâts
    // CombatSystem.dealDamage(this, this.behavior.currentTarget, damage);
  }
  
  // === MÉTHODES DE TARGETING ===
  
  /**
   * Trouver la meilleure cible
   */
  private findTarget(): ITarget | null {
    // TODO: Intégrer avec un système de targeting global
    // Pour l'instant, retourner null (pas de cible)
    return null;
  }
  
  /**
   * Définir une nouvelle cible
   */
  setTarget(target: ITarget): void {
    this.behavior.currentTarget = target;
    this.behavior.destination = target.position;
  }
  
  /**
   * Calculer distance à la cible
   */
  private getDistanceToTarget(target: ITarget): number {
    const dx = target.position.x - this.x;
    const dy = target.position.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  // === MÉTHODES DE BUFF/DEBUFF ===
  
  /**
   * Appliquer un buff
   */
  applyBuff(buff: IUnitBuff): void {
    this.behavior.buffs.set(buff.id, buff);
    this.recalculateStats();
  }
  
  /**
   * Supprimer un buff
   */
  removeBuff(buffId: string): void {
    this.behavior.buffs.delete(buffId);
    this.recalculateStats();
  }
  
  /**
   * Appliquer un debuff
   */
  applyDebuff(debuff: IUnitDebuff): void {
    this.behavior.debuffs.set(debuff.id, debuff);
    this.recalculateStats();
  }
  
  /**
   * Supprimer un debuff
   */
  removeDebuff(debuffId: string): void {
    this.behavior.debuffs.delete(debuffId);
    this.recalculateStats();
  }
  
  /**
   * Recalculer les stats avec buffs/debuffs
   */
  private recalculateStats(): void {
    let damageMultiplier = 1;
    let speedMultiplier = 1;
    
    // Appliquer les buffs
    for (const buff of this.behavior.buffs.values()) {
      switch (buff.type) {
        case 'damage':
          damageMultiplier += buff.value;
          break;
        case 'speed':
          speedMultiplier += buff.value;
          break;
        case 'rage':
          damageMultiplier += buff.value;
          speedMultiplier += buff.value;
          break;
      }
    }
    
    // Appliquer les debuffs
    for (const debuff of this.behavior.debuffs.values()) {
      switch (debuff.type) {
        case 'freeze':
          speedMultiplier = 0; // Freeze = vitesse 0
          break;
      }
    }
    
    // Mettre à jour les stats actuelles
    this.currentDamage = Math.round(this.baseStats.damage * damageMultiplier);
    this.behavior.moveSpeed = this.baseStats.walkingSpeed * speedMultiplier;
  }
  
  // === MÉTHODES UTILITAIRES ===
  
  /**
   * Changer l'état de l'unité
   */
  private setState(newState: UnitState): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      this.behavior.state = newState;
      this.behavior.lastStateChange = this.lastUpdateTick;
      
      console.log(`Unit ${this.id} (${this.cardId}): ${oldState} → ${newState}`);
    }
  }
  
  /**
   * Obtenir les dégâts actuels (avec buffs)
   */
  getCurrentDamage(): number {
    return this.currentDamage;
  }
  
  /**
   * Obtenir la position actuelle
   */
  getPosition(): IPosition {
    return { x: this.x, y: this.y };
  }
  
  /**
   * Vérifier si l'unité peut attaquer un type de cible
   */
  canTarget(targetType: 'air' | 'ground'): boolean {
    return this.baseStats.targets === 'both' || this.baseStats.targets === targetType;
  }
  
  /**
   * Spawn des unités à la mort
   */
  private spawnDeathUnits(): void {
    if (!this.baseStats.spawns || !this.baseStats.spawnCount) return;
    
    // TODO: Intégrer avec UnitManager pour spawner les unités
    console.log(`${this.cardId} spawns ${this.baseStats.spawnCount}x ${this.baseStats.spawns} on death`);
  }
  
  /**
   * Nettoyer l'unité (appelé avant suppression)
   */
  cleanup(): void {
    this.behavior.buffs.clear();
    this.behavior.debuffs.clear();
    
    // Logger la destruction (sync)
    this.logger.logBattle('card_played', this.ownerId, {
      unitId: this.id,
      cardId: this.cardId,
      finalState: this.state,
      lifespan: this.lastUpdateTick - this.spawnTick,
      actionType: 'unit_destroyed'
    });
  }
  
  // === MÉTHODES STATIQUES UTILITAIRES ===
  
  /**
   * Précharger les cartes communes dans le cache
   */
  static async preloadCommonCards(): Promise<void> {
    const commonCards = [
      'knight', 'archers', 'goblins', 'arrows', 'fireball', 'cannon',
      'giant', 'wizard', 'minions', 'barbarians', 'skeleton_army'
    ];
    
    const cache = CardDataCache.getInstance();
    await cache.preloadCards(commonCards);
    
    console.log(`✅ Preloaded ${commonCards.length} common cards in BaseUnit cache`);
  }
  
  /**
   * Clear cache (pour tests)
   */
  static clearCache(): void {
    const cache = CardDataCache.getInstance();
    cache.clearCache();
  }
  
  /**
   * Obtenir les stats d'une carte sans créer d'unité (méthode utilitaire)
   */
  static async getCardStats(cardId: string, level: number): Promise<IUnitStats | null> {
    try {
      const cache = CardDataCache.getInstance();
      const cardData = await cache.getCardData(cardId);
      const levelStats = cardData.getStatsForLevel(level);
      
      // Créer l'objet stats complet avec toutes les propriétés requises
      const stats: IUnitStats = {
        hitpoints: levelStats.hitpoints ?? cardData.stats.hitpoints ?? 100,
        damage: levelStats.damage ?? cardData.stats.damage ?? 50,
        damagePerSecond: cardData.stats.damagePerSecond ?? 0,
        
        speed: cardData.stats.speed ?? 'medium',
        walkingSpeed: BaseUnit.SPEED_VALUES[cardData.stats.speed as string] ?? BaseUnit.SPEED_VALUES['medium'],
        range: cardData.stats.range ?? 1,
        attackSpeed: cardData.stats.attackSpeed ?? 1.5,
        
        targets: cardData.stats.targets ?? 'ground',
        splashDamage: cardData.stats.splashDamage ?? false,
        count: cardData.stats.count ?? 1,
        mass: cardData.stats.mass ?? 1,
        sight: cardData.stats.sight ?? 5.5,
        deployTime: cardData.stats.deployTime ?? 1,
      };

      // Ajouter les propriétés optionnelles seulement si elles existent
      if (levelStats.crownTowerDamage !== undefined) {
        stats.crownTowerDamage = levelStats.crownTowerDamage;
      }

      if (cardData.stats.splashRadius !== undefined) {
        stats.splashRadius = cardData.stats.splashRadius;
      }

      if (cardData.stats.abilities !== undefined) {
        stats.abilities = cardData.stats.abilities;
      }

      if (cardData.stats.spawns !== undefined) {
        stats.spawns = cardData.stats.spawns;
      }

      if (cardData.stats.spawnCount !== undefined) {
        stats.spawnCount = cardData.stats.spawnCount;
      }

      return stats;
    } catch (error) {
      console.error(`Failed to get stats for ${cardId}:`, error);
      return null;
    }
  }
}

export default BaseUnit;
