import { Schema, type } from '@colyseus/schema';
import CardData, { ICardData } from '../../models/CardData';
import { getActionLogger } from '../../services/ActionLoggerService';
import { getCombatSystem, ICombatant, IAttackConfig, ICombatResult } from '../systems/CombatSystem';
import { getTargetingSystem, ITargetableEntity, ITargetingResult } from '../systems/TargetingSystem';

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

// === CLASSE BASEUNIT PRINCIPALE INTÉGRÉE AVEC COMBATSYSTEM ===

export class BaseUnit extends Schema implements ICombatant, ITargetableEntity {
  // === IDENTIFIANTS ===
  @type("string") id: string = "";
  @type("string") cardId: string = "";
  @type("string") ownerId: string = "";
  @type("number") level: number = 1;
  @type("string") unitType: UnitType = 'troop';
  
  // === VISUEL ===
  @type("string") modelFile: string = "";   // <-- ajouté pour le .glb
  
  // === POSITION (pour ICombatant et ITargetableEntity) ===
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  
  // === STATS ACTUELLES (pour ICombatant) ===
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
  
  // Combat System Integration
  private combatSystem = getCombatSystem();
  private targetingSystem = getTargetingSystem();
  
  // Cache des vitesses pour optimisation
  private static readonly SPEED_VALUES: Record<string, number> = {
    'slow': 0.5,        // 0.5 tile/sec
    'medium': 1.0,      // 1.0 tile/sec  
    'fast': 1.5,        // 1.5 tile/sec
    'very-fast': 2.0    // 2.0 tile/sec
  };

  // === ICombatant IMPLEMENTATION ===
  get position(): IPosition { return { x: this.x, y: this.y }; }
  get type(): TargetType { return this.unitType === 'building' ? 'building' : 'unit'; }
  get isAlive(): boolean { return this.currentHitpoints > 0 && this.state !== 'dead'; }
  get hitpoints(): number { return this.currentHitpoints; }
  set hitpoints(value: number) { this.currentHitpoints = Math.max(0, value); }
  
  // Propriétés de combat
  get canAttack(): boolean { return this.isAlive && !this.behavior?.buffs.has('freeze'); }
  get attackRange(): number { return this.baseStats?.range || 1; }
  get attackDamage(): number { return this.currentDamage; }
  get attackSpeed(): number { return Math.round((this.baseStats?.attackSpeed || 1.5) * 20); } // Convert to ticks
  get lastAttackTick(): number { return this.behavior?.lastAttackTick || 0; }
  set lastAttackTick(value: number) { if (this.behavior) this.behavior.lastAttackTick = value; }
  
  // Propriétés ITargetableEntity
  get isFlying(): boolean { return this.baseStats?.targets === 'air' || false; }
  get isTank(): boolean { return (this.baseStats?.mass || 0) > 2 || this.maxHitpoints > 1000; }
  get isBuilding(): boolean { return this.unitType === 'building'; }
  get mass(): number { return this.baseStats?.mass || 1; }
  
  // État de combat (ICombatant optionals)
  isStunned?: boolean = false;
  stunEndTick?: number | undefined;
  isInvulnerable?: boolean = false;
  invulnerabilityEndTick?: number | undefined;
  armor?: number = 0;
  spellResistance?: number = 0;
  shield?: number = 0;

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
      
      // Enregistrer dans le CombatSystem
      this.combatSystem.registerCombatant(this.toCombatant());
      
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
  
  // === MÉTHODES PRINCIPALES AVEC INTEGRATION COMBATSYSTEM ===
  
  /**
   * Mise à jour principale appelée chaque tick - Intégrée avec CombatSystem
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
   * Logique état idle - chercher des cibles avec TargetingSystem
   */
  private updateIdle(currentTick: number): void {
    // Chercher des cibles si cooldown écoulé
    if (currentTick >= this.behavior.lastRetarget + this.behavior.retargetCooldown) {
      const targetingResult = this.findTargetWithSystemInternal(currentTick);
      if (targetingResult.target) {
        this.setTarget(targetingResult.target);
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
   * Logique d'attaque - Intégrée avec CombatSystem
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
    
    // Vérifier si on peut attaquer avec le CombatSystem
    if (currentTick >= this.behavior.nextAttackTick) {
      this.performAttackWithSystem(currentTick);
    }
  }
  
  /**
   * Effectuer une attaque via le CombatSystem
   */
  private performAttackWithSystem(currentTick: number): void {
    if (!this.behavior.currentTarget) return;
    
    const attackConfig: IAttackConfig = {
      attackerId: this.id,
      targetId: this.behavior.currentTarget.id,
      damage: this.getCurrentDamage(),
      damageType: this.getDamageType(),
      
      // Configuration splash si applicable
      hasSplash: this.baseStats.splashDamage,
      ...(this.baseStats.splashRadius !== undefined && { splashRadius: this.baseStats.splashRadius }),
      splashDamagePercent: 100,
      
      // Configuration projectile si ranged
      isProjectile: this.isRangedUnit(),
      ...(this.getProjectileSpeed() !== undefined && { projectileSpeed: this.getProjectileSpeed()! }),
      
      // Effets spéciaux selon les abilities
      ...(this.getStunDuration() !== undefined && { stun: this.getStunDuration()! }),
      ...(this.getKnockbackForce() !== undefined && { knockback: this.getKnockbackForce()! })
    };
    
    // Déléguer au CombatSystem
    const result = this.combatSystem.performAttack(attackConfig);
    
    if (result) {
      // Mettre à jour le cooldown d'attaque
      this.behavior.nextAttackTick = currentTick + this.attackSpeed;
      this.behavior.lastAttackTick = currentTick;
      
      // Callback d'attaque réussie
      this.onAttackPerformed(result);
    }
  }
  
  /**
   * Callback quand une attaque est effectuée
   */
  private onAttackPerformed(result: ICombatResult): void {
    // Log de l'attaque
    this.logger.logBattle('card_played', this.ownerId, {
      unitId: this.id,
      targetId: result.primaryTargetId,
      damage: result.damageDealt,
      targetsHit: result.targetsHit.length,
      damageType: result.damageType,
      tick: result.tick,
      actionType: 'unit_attack'
    });
    
    // Effets visuels, sons, etc. peuvent être ajoutés ici
  }
  
  /**
   * Trouver une cible avec le TargetingSystem
   */
  private findTargetWithSystemInternal(currentTick: number): ITargetingResult {
    // TODO: Obtenir la liste des entités disponibles depuis BattleRoom
    const availableTargets: ITargetableEntity[] = []; // Sera fourni par BattleRoom
    
    return this.targetingSystem.findBestTarget(
      this.toTargetableEntity(),           // Cette unité convertie en ITargetableEntity
      availableTargets,                    // Toutes les cibles possibles
      this.behavior.currentTarget || null, // Cible actuelle (convertir undefined en null)
      currentTick                         // Tick actuel
    );
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
      
      // Désinscrire du CombatSystem
      this.combatSystem.unregisterCombatant(this.id);
      
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
  
  // === MÉTHODES DE COMBAT INTÉGRÉES ===
  
  /**
   * Infliger des dégâts à cette unité - via CombatSystem
   */
  takeDamage(damage: number, attackerId?: string, damageType: string = 'normal'): boolean {
    const oldHp = this.currentHitpoints;
    
    // Le calcul de dégâts est maintenant géré par CombatSystem
    // Cette méthode est principalement pour les callbacks
    this.currentHitpoints = Math.max(0, this.currentHitpoints - damage);
    
    // Logger les dégâts
    this.logger.logBattle('card_played', this.ownerId, {
      unitId: this.id,
      attackerId,
      damage: oldHp - this.currentHitpoints,
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
  
  // === ICombatant CALLBACK IMPLEMENTATIONS ===
  
  onTakeDamage = (damage: number, attacker: ICombatant, damageType: string): void => {
    // Callback quand cette unité prend des dégâts
    console.log(`${this.id} took ${damage} ${damageType} damage from ${attacker.id}`);
    
    // Interruption de certaines actions si nécessaire
    if (this.state === 'special' && damage > this.maxHitpoints * 0.1) {
      this.setState('idle'); // Interrompre les capacités spéciales
    }
  };
  
  onDeath = (killer: ICombatant): void => {
    // Callback quand cette unité meurt
    console.log(`${this.id} killed by ${killer.id}`);
    
    this.logger.logBattle('card_played', this.ownerId, {
      unitId: this.id,
      killerId: killer.id,
      lifespan: this.lastUpdateTick - this.spawnTick,
      actionType: 'unit_killed'
    });
  };
  
  onAttack = (target: ICombatant): void => {
    // Callback quand cette unité attaque
    console.log(`${this.id} attacks ${target.id}`);
  };
  
  // === MÉTHODES UTILITAIRES POUR COMBATSYSTEM ===
  
  private getDamageType(): 'physical' | 'spell' | 'crown_tower' {
    // Déterminer le type de dégâts selon la carte
    if (this.cardData.type === 'spell') {
      return 'spell';
    }
    
    // Les dégâts sur crown towers sont réduits pour certaines unités
    if (this.baseStats.crownTowerDamage !== undefined) {
      return 'crown_tower';
    }
    
    return 'physical';
  }
  
  private isRangedUnit(): boolean {
    // Unité ranged si range > 1.5 tiles (approximation CR)
    return this.baseStats.range > 1.5;
  }
  
  private getProjectileSpeed(): number | undefined {
    if (!this.isRangedUnit()) return undefined;
    
    // Vitesses approximatives des projectiles dans CR
    const projectileSpeeds: Record<string, number> = {
      'archers': 8,
      'musketeer': 10,
      'wizard': 5,
      'fireball': 12,
      'arrows': 15
    };
    
    return projectileSpeeds[this.cardId] || 8; // Default speed
  }
  
  private getStunDuration(): number | undefined {
    // Durée de stun selon les abilities
    if (this.baseStats.abilities?.includes('stun')) {
      return 10; // 0.5 seconde à 20 TPS
    }
    return undefined;
  }
  
  private getKnockbackForce(): number | undefined {
    // Force de knockback selon les abilities
    if (this.baseStats.abilities?.includes('knockback')) {
      return 1.5; // 1.5 tiles
    }
    return undefined;
  }
  
  // === MÉTHODES DE TARGETING ===
  
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
    
    // Mettre à jour les états de combat pour CombatSystem
    this.isStunned = this.behavior.debuffs.has('freeze');
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
    // Désinscrire du CombatSystem
    this.combatSystem.unregisterCombatant(this.id);
    
    // Nettoyer les buffs/debuffs
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
  
  // === MÉTHODES PUBLIQUES POUR BATTLEROOM INTEGRATION ===
  
  /**
   * Fournir la liste des cibles disponibles (appelé par BattleRoom)
   */
  updateAvailableTargets(availableTargets: ITargetableEntity[]): void {
    // Stocker les cibles disponibles pour le targeting
    // Cette méthode sera appelée par BattleRoom à chaque tick
    this.availableTargets = availableTargets;
  }
  
  private availableTargets: ITargetableEntity[] = [];
  
  /**
   * Trouver une cible avec les entités disponibles
   */
  private findTargetWithSystem(currentTick: number): ITargetingResult {
    return this.targetingSystem.findBestTarget(
      this.toTargetableEntity(),           // Cette unité convertie
      this.availableTargets,               // Toutes les cibles possibles
      this.behavior.currentTarget || null, // Cible actuelle (convertir undefined en null)
      currentTick                         // Tick actuel
    );
  }
  
  /**
   * Obtenir les informations de combat pour BattleRoom
   */
  getCombatInfo() {
    return {
      id: this.id,
      position: this.getPosition(),
      ownerId: this.ownerId,
      hitpoints: this.currentHitpoints,
      maxHitpoints: this.maxHitpoints,
      damage: this.currentDamage,
      range: this.baseStats.range,
      isAlive: this.isAlive,
      canAttack: this.canAttack,
      currentTarget: this.behavior.currentTarget,
      state: this.state,
      isStunned: this.isStunned,
      lastAttackTick: this.behavior.lastAttackTick
    };
  }
  
  /**
   * Forcer une attaque sur une cible spécifique (pour debug/test)
   */
  forceAttack(targetId: string): ICombatResult | null {
    const attackConfig: IAttackConfig = {
      attackerId: this.id,
      targetId: targetId,
      damage: this.getCurrentDamage(),
      damageType: this.getDamageType(),
      hasSplash: this.baseStats.splashDamage,
      ...(this.baseStats.splashRadius !== undefined && { splashRadius: this.baseStats.splashRadius }),
      splashDamagePercent: 100,
      isProjectile: this.isRangedUnit(),
      ...(this.getProjectileSpeed() !== undefined && { projectileSpeed: this.getProjectileSpeed()! })
    };
    
    return this.combatSystem.performAttack(attackConfig);
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
  
  // === MÉTHODES DE CONVERSION POUR COMPATIBILITÉ ===
  
  /**
   * Convertir en ITargetableEntity pour TargetingSystem
   */
  toTargetableEntity(): ITargetableEntity {
    return {
      id: this.id,
      position: this.getPosition(),
      ownerId: this.ownerId,
      type: this.type,
      isAlive: this.isAlive,
      hitpoints: this.currentHitpoints,
      maxHitpoints: this.maxHitpoints,
      isFlying: this.isFlying,
      isTank: this.isTank,
      isBuilding: this.isBuilding,
      mass: this.mass
    };
  }
  
  /**
   * Convertir en ICombatant pour CombatSystem (déjà implémenté via interface)
   */
  toCombatant(): ICombatant {
    // Créer un objet qui respecte strictement ICombatant
    return {
      id: this.id,
      position: this.position,
      ownerId: this.ownerId,
      type: this.type,
      isAlive: this.isAlive,
      hitpoints: this.hitpoints,
      maxHitpoints: this.maxHitpoints,
      isFlying: this.isFlying,
      isTank: this.isTank,
      isBuilding: this.isBuilding,
      mass: this.mass,
      
      // Combat properties avec valeurs par défaut
      armor: this.armor || 0,
      spellResistance: this.spellResistance || 0,
      shield: this.shield || 0,
      canAttack: this.canAttack,
      attackRange: this.attackRange,
      attackDamage: this.attackDamage,
      attackSpeed: this.attackSpeed,
      lastAttackTick: this.lastAttackTick,
      
      // État de combat avec valeurs par défaut
      isStunned: this.isStunned || false,
      stunEndTick: this.stunEndTick || undefined,
      isInvulnerable: this.isInvulnerable || false,
      invulnerabilityEndTick: this.invulnerabilityEndTick || undefined,
      
      // Callbacks
      onTakeDamage: this.onTakeDamage,
      onDeath: this.onDeath,
      onAttack: this.onAttack
    };
  }
  
  // === FACTORY METHODS POUR CARTES SPÉCIFIQUES ===
  
  /**
   * Créer un Knight spécifiquement
   */
  static async createKnight(ownerId: string, position: IPosition, level: number, spawnTick: number): Promise<BaseUnit> {
    const knight = await BaseUnit.create('knight', level, ownerId, position, spawnTick);
    
    // Configurations spéciales pour Knight (tank)
    knight.armor = 10; // Armor légère
    
    return knight;
  }
  
  /**
   * Créer des Archers spécifiquement  
   */
  static async createArchers(ownerId: string, position: IPosition, level: number, spawnTick: number): Promise<BaseUnit[]> {
    const archers: BaseUnit[] = [];
    
    // Les Archers viennent par 2 dans CR
    for (let i = 0; i < 2; i++) {
      const offsetPosition = {
        x: position.x + (i === 0 ? -0.5 : 0.5), // Décaler légèrement
        y: position.y
      };
      
      const archer = await BaseUnit.create('archers', level, ownerId, offsetPosition, spawnTick);
      archers.push(archer);
    }
    
    return archers;
  }
  
  /**
   * Créer un Cannon (bâtiment défensif)
   */
  static async createCannon(ownerId: string, position: IPosition, level: number, spawnTick: number): Promise<BaseUnit> {
    const cannon = await BaseUnit.create('cannon', level, ownerId, position, spawnTick);
    
    // Configurations spéciales pour Cannon
    cannon.isInvulnerable = true;
    cannon.invulnerabilityEndTick = spawnTick + 20; // 1 seconde d'invulnérabilité au déploiement
    
    return cannon;
  }
}

export default BaseUnit;
