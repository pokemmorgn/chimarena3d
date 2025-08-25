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
  count: number;
  mass: number;
  sight: number;
  deployTime: number;
  
  // Capacités spéciales (toutes optionnelles)
  abilities?: string[];
  spawns?: string;
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
  currentTarget?: ITarget | undefined;
  targetAcquisitionRange: number;
  retargetCooldown: number;
  lastRetarget: number;
  
  // Combat
  lastAttackTick: number;
  nextAttackTick: number;
  isAttacking: boolean;
  attackWindup: number;
  
  // Mouvement
  destination?: IPosition;
  pathNodes: IPosition[];
  currentPathIndex: number;
  lastMoveTick: number;
  moveSpeed: number;
  
  // Buffs/Debuffs
  buffs: Map<string, IUnitBuff>;
  debuffs: Map<string, IUnitDebuff>;
}

export interface IUnitBuff {
  id: string;
  type: 'damage' | 'speed' | 'healing' | 'shield' | 'rage' | 'freeze';
  value: number;
  startTick: number;
  duration: number;
  source: string;
}

export interface IUnitDebuff extends IUnitBuff {}

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
    if (this.cache.has(cardId)) {
      return this.cache.get(cardId)!;
    }
    
    if (this.loading.has(cardId)) {
      return await this.loading.get(cardId)!;
    }
    
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
  
  async preloadCards(cardIds: string[]): Promise<void> {
    const promises = cardIds.map(id => this.getCardData(id));
    await Promise.all(promises);
  }
  
  clearCache(): void {
    this.cache.clear();
    this.loading.clear();
  }
}

// === CLASSE BASEUNIT PRINCIPALE ===

export class BaseUnit extends Schema implements ICombatant, ITargetableEntity {
  // === IDENTIFIANTS ===
  @type("string") id: string = "";
  @type("string") cardId: string = "";
  @type("string") ownerId: string = "";
  @type("number") level: number = 1;
  @type("string") unitType: UnitType = 'troop';
  
  // === VISUEL ===
  @type("string") modelFile: string = "";
  
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
  private cardData!: ICardData;
  private baseStats!: IUnitStats;
  private behavior!: IUnitBehavior;
  private logger = getActionLogger();
  
  // Combat System Integration
  private combatSystem = getCombatSystem();
  private targetingSystem = getTargetingSystem();
  
  // 🔧 CORRECTION CRITIQUE: Stockage des cibles disponibles
  private availableTargets: ITargetableEntity[] = [];
  
  // Cache des vitesses
  private static readonly SPEED_VALUES: Record<string, number> = {
    'slow': 0.5,
    'medium': 1.0,  
    'fast': 1.5,
    'very-fast': 2.0
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
  get attackSpeed(): number { return Math.round((this.baseStats?.attackSpeed || 1.5) * 20); }
  get lastAttackTick(): number { return this.behavior?.lastAttackTick || 0; }
  set lastAttackTick(value: number) { if (this.behavior) this.behavior.lastAttackTick = value; }
  
  // Propriétés ITargetableEntity
  get isFlying(): boolean { return this.baseStats?.targets === 'air' || false; }
  get isTank(): boolean { return (this.baseStats?.mass || 0) > 2 || this.maxHitpoints > 1000; }
  get isBuilding(): boolean { return this.unitType === 'building'; }
  get mass(): number { return this.baseStats?.mass || 1; }
  
  // État de combat
  isStunned?: boolean = false;
  stunEndTick?: number | undefined;
  isInvulnerable?: boolean = false;
  invulnerabilityEndTick?: number | undefined;
  armor?: number = 0;
  spellResistance?: number = 0;
  shield?: number = 0;

  // === FACTORY METHOD ===
  
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
  
  private async initialize(
    cardId: string,
    level: number,
    ownerId: string,
    position: IPosition,
    spawnTick: number
  ): Promise<void> {
    try {
      this.id = `unit_${spawnTick}_${Math.random().toString(36).substr(2, 6)}`;
      this.cardId = cardId;
      this.ownerId = ownerId;
      this.level = level;
      this.x = position.x;
      this.y = position.y;
      this.spawnTick = spawnTick;
      this.lastUpdateTick = spawnTick;
      
      const cache = CardDataCache.getInstance();
      this.cardData = await cache.getCardData(cardId);
      
      this.unitType = this.cardData.type as UnitType;
      this.modelFile = this.cardData.modelFile || "";
      
      this.loadStatsForLevel(level);
      this.initializeBehavior();
      
      this.combatSystem.registerCombatant(this.toCombatant());
      
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

  private loadStatsForLevel(level: number): void {
    const levelStats = this.cardData.getStatsForLevel(level);
    
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
    
    this.maxHitpoints = this.baseStats.hitpoints;
    this.currentHitpoints = this.baseStats.hitpoints;
    this.currentDamage = this.baseStats.damage;
  }
  
  private initializeBehavior(): void {
    this.behavior = {
      state: 'spawning',
      lastStateChange: this.spawnTick,
      
      targetAcquisitionRange: this.baseStats.sight,
      retargetCooldown: 20,
      lastRetarget: 0,
      
      lastAttackTick: 0,
      nextAttackTick: 0,
      isAttacking: false,
      attackWindup: Math.round(this.baseStats.attackSpeed * 0.3 * 20),
      
      pathNodes: [],
      currentPathIndex: 0,
      lastMoveTick: this.spawnTick,
      moveSpeed: this.baseStats.walkingSpeed,
      
      buffs: new Map(),
      debuffs: new Map()
    };
    
    const deployTimeTicks = Math.round(this.baseStats.deployTime * 20);
    setTimeout(() => {
      if (this.state === 'spawning') {
        this.setState('idle');
      }
    }, deployTimeTicks * 50);
  }
  
  // === MÉTHODES PRINCIPALES CORRIGÉES ===
  
  update(currentTick: number, deltaTime: number): void {
    this.lastUpdateTick = currentTick;
    
    this.updateEffects(currentTick);
    
    switch (this.state) {
      case 'spawning':
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
        break;
    }
  }
  
  /**
   * 🔧 CORRIGÉ: Logique état idle avec targeting fonctionnel
   */
  private updateIdle(currentTick: number): void {
    // Chercher des cibles si cooldown écoulé
    if (currentTick >= this.behavior.lastRetarget + this.behavior.retargetCooldown) {
      const targetingResult = this.findTargetWithSystem(currentTick);
      
      if (targetingResult.target) {
        console.log(`🎯 ${this.id} trouve une cible: ${targetingResult.target.id} - ${targetingResult.reason}`);
        this.setTarget(targetingResult.target);
        this.setState('moving');
      } else {
        console.log(`❌ ${this.id} ne trouve pas de cible (${this.availableTargets.length} disponibles)`);
      }
      
      this.behavior.lastRetarget = currentTick;
    }
  }
  
  /**
   * 🔧 CORRIGÉ: Logique mouvement avec marge d'hysteresis
   */
  private updateMovement(currentTick: number, deltaTime: number): void {
    if (!this.behavior.destination || !this.behavior.currentTarget) {
      console.log(`❌ ${this.id} en mouvement mais pas de destination/cible`);
      this.setState('idle');
      return;
    }

    // Vérifier si la cible existe toujours
    const targetExists = this.availableTargets.find(t => t.id === this.behavior.currentTarget!.id);
    if (!targetExists || !targetExists.isAlive) {
      console.log(`💀 ${this.id} cible morte ou disparue, retour idle`);
      this.behavior.currentTarget = undefined;
      this.setState('idle');
      return;
    }

    // Mettre à jour la position cible en temps réel
    this.behavior.currentTarget.position = targetExists.position;

    // Calculer la distance vers la CIBLE
    const targetDistance = this.getDistanceToTarget(this.behavior.currentTarget);
    
    // Marge pour éviter l'oscillation
    const attackRange = this.baseStats.range;
    const rangeMargin = 0.1;
    
    // Vérifier si en range d'attaque
    if (targetDistance <= attackRange + rangeMargin) {
      console.log(`⚔️ ${this.id} EN RANGE ! Distance: ${targetDistance.toFixed(2)} <= Range: ${attackRange}`);
      this.setState('attacking');
      return;
    }

    // Mouvement corrigé avec deltaTime propre
    const targetPos = this.behavior.currentTarget.position;
    const dx = targetPos.x - this.x;
    const dy = targetPos.y - this.y;
    const distanceToTarget = Math.sqrt(dx * dx + dy * dy);
    
    if (distanceToTarget > 0.05) { // Éviter division par 0
      const moveSpeedTilesPerSec = this.behavior.moveSpeed;
      const moveDistanceThisFrame = moveSpeedTilesPerSec * (deltaTime / 1000);
      
      // Normaliser la direction
      const dirX = dx / distanceToTarget;
      const dirY = dy / distanceToTarget;
      
      // Se déplacer vers la cible (mais pas au-delà)
      const actualMoveDistance = Math.min(moveDistanceThisFrame, distanceToTarget - attackRange);
      
      if (actualMoveDistance > 0) {
        this.x += dirX * actualMoveDistance;
        this.y += dirY * actualMoveDistance;
        
        this.behavior.lastMoveTick = currentTick;
        
        // Debug de mouvement
        if (currentTick % 10 === 0) {
          console.log(`🏃 ${this.id}: (${this.x.toFixed(1)}, ${this.y.toFixed(1)}) → (${targetPos.x.toFixed(1)}, ${targetPos.y.toFixed(1)}) Dist: ${distanceToTarget.toFixed(2)}`);
        }
      } else {
        console.log(`🎯 ${this.id} arrivé à destination ! Distance: ${distanceToTarget.toFixed(2)}`);
        this.setState('attacking');
      }
    } else {
      console.log(`⚔️ ${this.id} déjà sur la cible !`);
      this.setState('attacking');
    }
  }
  
  /**
   * 🔧 CORRIGÉ: Logique d'attaque avec marge d'hysteresis
   */
  private updateAttacking(currentTick: number): void {
    if (!this.behavior.currentTarget) {
      console.log(`❌ ${this.id} en mode attaque mais pas de cible !`);
      this.setState('idle');
      return;
    }

    // Vérifier que la cible existe toujours
    const targetExists = this.availableTargets.find(t => t.id === this.behavior.currentTarget!.id);
    if (!targetExists || !targetExists.isAlive) {
      console.log(`💀 ${this.id} cible disparue pendant l'attaque !`);
      this.behavior.currentTarget = undefined;
      this.setState('idle');
      return;
    }

    // Mettre à jour la position cible
    this.behavior.currentTarget.position = targetExists.position;

    // Vérifier si la cible est encore en range avec marge d'hysteresis
    const targetDistance = this.getDistanceToTarget(this.behavior.currentTarget);
    const attackRange = this.baseStats.range;
    const hysteresisMargin = 0.3; // Plus grande marge pour éviter ping-pong
    
    if (targetDistance > attackRange + hysteresisMargin) {
      console.log(`🏃 ${this.id} cible trop loin (${targetDistance.toFixed(2)} > ${attackRange + hysteresisMargin}), retour mouvement`);
      this.setState('moving');
      return;
    }

    // Cooldown d'attaque plus clair
    const canAttackNow = currentTick >= this.behavior.nextAttackTick;
    
    if (canAttackNow) {
      console.log(`⚔️ ${this.id} ATTAQUE ${this.behavior.currentTarget.id} ! (Distance: ${targetDistance.toFixed(2)})`);
      this.performAttackWithSystem(currentTick);
    } else {
      // Debug du cooldown moins verbeux
      const ticksRemaining = this.behavior.nextAttackTick - currentTick;
      if (ticksRemaining > 0 && currentTick % 20 === 0) {
        console.log(`⏱️ ${this.id} cooldown: ${(ticksRemaining / 20).toFixed(1)}s`);
      }
    }
  }
  
  /**
   * 🔧 CORRIGÉ: Trouver une cible avec validation
   */
  private findTargetWithSystem(currentTick: number): ITargetingResult {
    if (!this.availableTargets || this.availableTargets.length === 0) {
      console.warn(`⚠️ ${this.id} pas de cibles disponibles pour le targeting !`);
      return {
        target: null,
        confidence: 0,
        reason: 'no_available_targets',
        alternativeTargets: []
      };
    }

    console.log(`🎯 ${this.id} cherche parmi ${this.availableTargets.length} cibles disponibles`);

    return this.targetingSystem.findBestTarget(
      this.toTargetableEntity(),
      this.availableTargets,
      this.behavior.currentTarget || null,
      currentTick
    );
  }
  
  private performAttackWithSystem(currentTick: number): void {
    if (!this.behavior.currentTarget) return;
    
    console.log(`🗡️ ${this.id} prépare l'attaque sur ${this.behavior.currentTarget.id}`);
    
    const attackConfig: IAttackConfig = {
      attackerId: this.id,
      targetId: this.behavior.currentTarget.id,
      damage: this.getCurrentDamage(),
      damageType: this.getDamageType(),
      
      hasSplash: this.baseStats.splashDamage,
      ...(this.baseStats.splashRadius !== undefined && { splashRadius: this.baseStats.splashRadius }),
      splashDamagePercent: 100,
      
      isProjectile: this.isRangedUnit(),
      ...(this.getProjectileSpeed() !== undefined && { projectileSpeed: this.getProjectileSpeed()! }),
      
      ...(this.getStunDuration() !== undefined && { stun: this.getStunDuration()! }),
      ...(this.getKnockbackForce() !== undefined && { knockback: this.getKnockbackForce()! })
    };
    
    console.log(`⚔️ Configuration attaque: ${attackConfig.damage} dégâts ${attackConfig.damageType}${attackConfig.isProjectile ? ' (projectile)' : ' (mêlée)'}`);
    
    const result = this.combatSystem.performAttack(attackConfig);
    
    if (result) {
      this.behavior.nextAttackTick = currentTick + this.attackSpeed;
      this.behavior.lastAttackTick = currentTick;
      
      console.log(`✅ Attaque effectuée ! Prochaine attaque dans ${this.attackSpeed} ticks`);
      
      this.onAttackPerformed(result);
    } else {
      console.log(`❌ Échec de l'attaque sur ${this.behavior.currentTarget.id}`);
    }
  }
  
  private onAttackPerformed(result: ICombatResult): void {
    this.logger.logBattle('card_played', this.ownerId, {
      unitId: this.id,
      targetId: result.primaryTargetId,
      damage: result.damageDealt,
      targetsHit: result.targetsHit.length,
      damageType: result.damageType,
      tick: result.tick,
      actionType: 'unit_attack'
    });
  }
  
  private updateSpecial(_currentTick: number): void {
    // À implémenter selon les capacités spéciales
  }
  
  private updateDying(currentTick: number): void {
    const deathDuration = 10;
    
    if (currentTick >= this.behavior.lastStateChange + deathDuration) {
      this.setState('dead');
      
      this.combatSystem.unregisterCombatant(this.id);
      
      if (this.baseStats.spawns) {
        this.spawnDeathUnits();
      }
    }
  }
  
  private updateEffects(currentTick: number): void {
    for (const [id, buff] of this.behavior.buffs) {
      if (currentTick >= buff.startTick + buff.duration) {
        this.removeBuff(id);
      }
    }
    
    for (const [id, debuff] of this.behavior.debuffs) {
      if (currentTick >= debuff.startTick + debuff.duration) {
        this.removeDebuff(id);
      }
    }
  }
  
  // === MÉTHODES DE COMBAT ===
  
  takeDamage(damage: number, attackerId?: string, damageType: string = 'normal'): boolean {
    const oldHp = this.currentHitpoints;
    
    this.currentHitpoints = Math.max(0, this.currentHitpoints - damage);
    
    this.logger.logBattle('card_played', this.ownerId, {
      unitId: this.id,
      attackerId,
      damage: oldHp - this.currentHitpoints,
      remainingHP: this.currentHitpoints,
      damageType,
      actionType: 'unit_damaged'
    });
    
    if (this.currentHitpoints <= 0) {
      this.setState('dying');
      return true;
    }
    
    return false;
  }
  
  // === ICombatant CALLBACKS ===
  
  onTakeDamage = (damage: number, attacker: ICombatant, damageType: string): void => {
    console.log(`${this.id} took ${damage} ${damageType} damage from ${attacker.id}`);
    
    if (this.state === 'special' && damage > this.maxHitpoints * 0.1) {
      this.setState('idle');
    }
  };
  
  onDeath = (killer: ICombatant): void => {
    console.log(`${this.id} killed by ${killer.id}`);
    
    this.logger.logBattle('card_played', this.ownerId, {
      unitId: this.id,
      killerId: killer.id,
      lifespan: this.lastUpdateTick - this.spawnTick,
      actionType: 'unit_killed'
    });
  };
  
  onAttack = (target: ICombatant): void => {
    console.log(`${this.id} attacks ${target.id}`);
  };
  
  // === MÉTHODES UTILITAIRES ===
  
  private getDamageType(): 'physical' | 'spell' | 'crown_tower' {
    if (this.cardData.type === 'spell') {
      return 'spell';
    }
    
    if (this.baseStats.crownTowerDamage !== undefined) {
      return 'crown_tower';
    }
    
    return 'physical';
  }
  
  private isRangedUnit(): boolean {
    return this.baseStats.range > 1.5;
  }
  
  private getProjectileSpeed(): number | undefined {
    if (!this.isRangedUnit()) return undefined;
    
    const projectileSpeeds: Record<string, number> = {
      'archers': 8,
      'musketeer': 10,
      'wizard': 5,
      'fireball': 12,
      'arrows': 15
    };
    
    return projectileSpeeds[this.cardId] || 8;
  }
  
  private getStunDuration(): number | undefined {
    if (this.baseStats.abilities?.includes('stun')) {
      return 10;
    }
    return undefined;
  }
  
  private getKnockbackForce(): number | undefined {
    if (this.baseStats.abilities?.includes('knockback')) {
      return 1.5;
    }
    return undefined;
  }
  
  setTarget(target: ITarget): void {
    this.behavior.currentTarget = target;
    this.behavior.destination = target.position;
  }
  
  private getDistanceToTarget(target: ITarget): number {
    const dx = target.position.x - this.x;
    const dy = target.position.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  private calculateDistance(pos1: IPosition, pos2: IPosition): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  // === MÉTHODES DE BUFF/DEBUFF ===
  
  applyBuff(buff: IUnitBuff): void {
    this.behavior.buffs.set(buff.id, buff);
    this.recalculateStats();
  }
  
  removeBuff(buffId: string): void {
    this.behavior.buffs.delete(buffId);
    this.recalculateStats();
  }
  
  applyDebuff(debuff: IUnitDebuff): void {
    this.behavior.debuffs.set(debuff.id, debuff);
    this.recalculateStats();
  }
  
  removeDebuff(debuffId: string): void {
    this.behavior.debuffs.delete(debuffId);
    this.recalculateStats();
  }
  
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
          speedMultiplier = 0;
          break;
      }
    }
    
    // Mettre à jour les stats actuelles
    this.currentDamage = Math.round(this.baseStats.damage * damageMultiplier);
    this.behavior.moveSpeed = this.baseStats.walkingSpeed * speedMultiplier;
    
    // Mettre à jour les états de combat
    this.isStunned = this.behavior.debuffs.has('freeze');
  }
  
  // === MÉTHODES UTILITAIRES ===
  
  private setState(newState: UnitState): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      this.behavior.state = newState;
      this.behavior.lastStateChange = this.lastUpdateTick;
      
      console.log(`Unit ${this.id} (${this.cardId}): ${oldState} → ${newState}`);
    }
  }
  
  getCurrentDamage(): number {
    return this.currentDamage;
  }
  
  getPosition(): IPosition {
    return { x: this.x, y: this.y };
  }
  
  canTarget(targetType: 'air' | 'ground'): boolean {
    return this.baseStats.targets === 'both' || this.baseStats.targets === targetType;
  }
  
  private spawnDeathUnits(): void {
    if (!this.baseStats.spawns || !this.baseStats.spawnCount) return;
    
    console.log(`${this.cardId} spawns ${this.baseStats.spawnCount}x ${this.baseStats.spawns} on death`);
  }
  
  cleanup(): void {
    this.combatSystem.unregisterCombatant(this.id);
    
    this.behavior.buffs.clear();
    this.behavior.debuffs.clear();
    
    this.logger.logBattle('card_played', this.ownerId, {
      unitId: this.id,
      cardId: this.cardId,
      finalState: this.state,
      lifespan: this.lastUpdateTick - this.spawnTick,
      actionType: 'unit_destroyed'
    });
  }
  
  // === MÉTHODES PUBLIQUES POUR BATTLEROOM ===
  
  /**
   * 🔧 CORRECTION MAJEURE: Mise à jour des cibles disponibles
   */
  updateAvailableTargets(availableTargets: ITargetableEntity[]): void {
    this.availableTargets = availableTargets;
    
    // Debug périodique
    if (this.lastUpdateTick % 60 === 0) { // Toutes les 3 secondes
      console.log(`🎯 ${this.id} reçoit ${availableTargets.length} cibles disponibles`);
    }
  }
  
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
  
  /**
   * 🔧 NOUVELLE MÉTHODE: Debug du targeting
   */
  debugTargeting(): void {
    console.log(`🔍 Debug ${this.id}:`);
    console.log(`  Position: (${this.x.toFixed(1)}, ${this.y.toFixed(1)})`);
    console.log(`  État: ${this.state}`);
    console.log(`  Cibles disponibles: ${this.availableTargets?.length || 0}`);
    console.log(`  Cible actuelle: ${this.behavior.currentTarget?.id || 'aucune'}`);
    console.log(`  Range d'attaque: ${this.baseStats.range}`);
    console.log(`  Prochaine attaque: tick ${this.behavior.nextAttackTick} (actuel: ${this.lastUpdateTick})`);
    
    if (this.availableTargets) {
      this.availableTargets.forEach((target, i) => {
        const distance = this.calculateDistance(this.getPosition(), target.position);
        console.log(`    Cible ${i}: ${target.id} (${target.position.x.toFixed(1)}, ${target.position.y.toFixed(1)}) - ${distance.toFixed(2)} tiles`);
      });
    }
  }
  
  // === MÉTHODES STATIQUES ===
  
  static async preloadCommonCards(): Promise<void> {
    const commonCards = [
      'knight', 'archers', 'goblins', 'arrows', 'fireball', 'cannon',
      'cyclops', 'skeleton'
    ];
    
    const cache = CardDataCache.getInstance();
    await cache.preloadCards(commonCards);
    
    console.log(`✅ Preloaded ${commonCards.length} common cards in BaseUnit cache`);
  }
  
  static clearCache(): void {
    const cache = CardDataCache.getInstance();
    cache.clearCache();
  }
  
  static async getCardStats(cardId: string, level: number): Promise<IUnitStats | null> {
    try {
      const cache = CardDataCache.getInstance();
      const cardData = await cache.getCardData(cardId);
      const levelStats = cardData.getStatsForLevel(level);
      
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
  
  // === MÉTHODES DE CONVERSION ===
  
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
  
  toCombatant(): ICombatant {
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
      
      armor: this.armor || 0,
      spellResistance: this.spellResistance || 0,
      shield: this.shield || 0,
      canAttack: this.canAttack,
      attackRange: this.attackRange,
      attackDamage: this.attackDamage,
      attackSpeed: this.attackSpeed,
      lastAttackTick: this.lastAttackTick,
      
      isStunned: this.isStunned || false,
      stunEndTick: this.stunEndTick || undefined,
      isInvulnerable: this.isInvulnerable || false,
      invulnerabilityEndTick: this.invulnerabilityEndTick || undefined,
      
      onTakeDamage: this.onTakeDamage,
      onDeath: this.onDeath,
      onAttack: this.onAttack
    };
  }
  
  // === FACTORY METHODS POUR CARTES SPÉCIFIQUES ===
  
  static async createKnight(ownerId: string, position: IPosition, level: number, spawnTick: number): Promise<BaseUnit> {
    const knight = await BaseUnit.create('knight', level, ownerId, position, spawnTick);
    knight.armor = 10;
    return knight;
  }
  
  static async createArchers(ownerId: string, position: IPosition, level: number, spawnTick: number): Promise<BaseUnit[]> {
    const archers: BaseUnit[] = [];
    
    for (let i = 0; i < 2; i++) {
      const offsetPosition = {
        x: position.x + (i === 0 ? -0.5 : 0.5),
        y: position.y
      };
      
      const archer = await BaseUnit.create('archers', level, ownerId, offsetPosition, spawnTick);
      archers.push(archer);
    }
    
    return archers;
  }
  
  static async createCannon(ownerId: string, position: IPosition, level: number, spawnTick: number): Promise<BaseUnit> {
    const cannon = await BaseUnit.create('cannon', level, ownerId, position, spawnTick);
    
    cannon.isInvulnerable = true;
    cannon.invulnerabilityEndTick = spawnTick + 20;
    
    return cannon;
  }
}

export default BaseUnit;
