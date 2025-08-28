import { Schema, type } from '@colyseus/schema';
import { getActionLogger } from '../../../services/ActionLoggerService';
import { getCombatSystem, ICombatant, IAttackConfig, ICombatResult } from '../../systems/CombatSystem';
import { ITargetableEntity } from '../../systems/TargetingSystem';
import { IPosition, TargetType, ITarget } from '../BaseUnit';

export type TowerType = 'left' | 'right' | 'king';

export interface ITowerStats {
  hitpoints: number;
  damage: number;
  range: number;
  attackSpeed: number;
  targets: 'air' | 'ground' | 'both';
  damageReduction: number;
  hasBlastRadius?: boolean;
  blastRadius?: number;
}

export interface ITowerBehavior {
  isActive: boolean;
  currentTarget?: ITarget | undefined;
  autoTargetRange: number;
  blindSpotRadius: number;
  retargetCooldown: number;
  lastRetarget: number;
  targetLockDuration: number;
  
  lastAttackTick: number;
  nextAttackTick: number;
  attackWindupTicks: number;
  attackCooldownTicks: number;
  pendingAttack?: {
    targetId: string;
    startTick: number;
    willHitTick: number;
  } | undefined;
  
  targetEntryHistory: Map<string, number>;
}

export class Tower extends Schema implements ICombatant, ITargetableEntity {
  @type("string") id: string = "";
  @type("string") ownerId: string = "";
  @type("string") towerType: TowerType = 'left';
  
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  
  @type("number") currentHitpoints: number = 1400;
  @type("number") maxHitpoints: number = 1400;
  @type("number") currentDamage: number = 90;
  
  @type("boolean") isDestroyed: boolean = false;
  @type("boolean") isActive: boolean = true;
  @type("number") lastUpdateTick: number = 0;
  @type("number") level: number = 13;
  
  private baseStats!: ITowerStats;
  private behavior!: ITowerBehavior;
  private logger = getActionLogger();
  private combatSystem = getCombatSystem();
  private availableTargets: ITargetableEntity[] = [];
  
  get position(): IPosition { return { x: this.x, y: this.y }; }
  get type(): TargetType { return 'building'; }
  get isAlive(): boolean { return !this.isDestroyed && this.currentHitpoints > 0; }
  get hitpoints(): number { return this.currentHitpoints; }
  set hitpoints(value: number) { 
    this.currentHitpoints = Math.max(0, value);
    if (this.currentHitpoints <= 0 && !this.isDestroyed) {
      this.markAsDestroyed();
    }
  }
  
  get canAttack(): boolean { 
    return this.isAlive && this.isActive;
  }
  get attackRange(): number { return this.baseStats?.range || 7; }
  get attackDamage(): number { return this.currentDamage; }
  get attackSpeed(): number { return Math.round((this.baseStats?.attackSpeed || 0.8) * 20); }
  get lastAttackTick(): number { return this.behavior?.lastAttackTick || 0; }
  set lastAttackTick(value: number) { 
    if (this.behavior) this.behavior.lastAttackTick = value; 
  }
  
  get isFlying(): boolean { return false; }
  get isTank(): boolean { return false; }
  get isBuilding(): boolean { return true; }
  get mass(): number { return 10; }
  
  isStunned?: boolean = false;
  stunEndTick?: number | undefined;
  isInvulnerable?: boolean = false;
  invulnerabilityEndTick?: number | undefined;
  armor?: number = 0;
  spellResistance?: number = 0;
  shield?: number = 0;

  static create(id: string, towerType: TowerType, ownerId: string, position: IPosition, level: number = 13): Tower {
    const tower = new Tower();
    tower.initialize(id, towerType, ownerId, position, level);
    return tower;
  }
  
  private initialize(id: string, towerType: TowerType, ownerId: string, position: IPosition, level: number): void {
    this.id = id;
    this.towerType = towerType;
    this.ownerId = ownerId;
    this.x = position.x;
    this.y = position.y;
    this.level = level;
    this.lastUpdateTick = 0;
    
    this.loadStatsForType(towerType, level);
    this.initializeBehavior();
    this.combatSystem.registerCombatant(this.toCombatant());
    
    this.logger.logBattle('card_played', ownerId, {
      towerId: this.id,
      towerType: this.towerType,
      position: { x: this.x, y: this.y },
      hitpoints: this.currentHitpoints,
      damage: this.currentDamage,
      level: this.level,
      actionType: 'tower_created'
    });
  }

  private loadStatsForType(towerType: TowerType, level: number): void {
    const baseStats: Record<TowerType, ITowerStats> = {
      'left': {
        hitpoints: 1400,
        damage: 90,
        range: 7.0,
        attackSpeed: 0.8,
        targets: 'both',
        damageReduction: 0.35
      },
      'right': {
        hitpoints: 1400,
        damage: 90,
        range: 7.0,
        attackSpeed: 0.8,
        targets: 'both',
        damageReduction: 0.35
      },
      'king': {
        hitpoints: 2600,
        damage: 109,
        range: 7.0,
        attackSpeed: 1.0,
        targets: 'both',
        damageReduction: 0.35,
        hasBlastRadius: true,
        blastRadius: 1.0
      }
    };
    
    const base = baseStats[towerType];
    const levelMultiplier = 1 + (level - 13) * 0.10;
    
    this.baseStats = {
      ...base,
      hitpoints: Math.round(base.hitpoints * levelMultiplier),
      damage: Math.round(base.damage * levelMultiplier)
    };
    
    this.maxHitpoints = this.baseStats.hitpoints;
    this.currentHitpoints = this.baseStats.hitpoints;
    this.currentDamage = this.baseStats.damage;
  }
  
  private initializeBehavior(): void {
    this.behavior = {
      isActive: true,
      autoTargetRange: this.baseStats.range,
      blindSpotRadius: 1.5,
      retargetCooldown: 5,
      lastRetarget: 0,
      targetLockDuration: 60,
      
      lastAttackTick: -100,
      nextAttackTick: 0,
      attackWindupTicks: 3,
      attackCooldownTicks: this.attackSpeed,
      
      targetEntryHistory: new Map()
    };
  }

  update(currentTick: number, _deltaTime: number): void {
    this.lastUpdateTick = currentTick;
    
    if (!this.isAlive || !this.isActive) {
      return;
    }
    
    this.processAttackWindup(currentTick);
    
    if (this.shouldRetarget(currentTick)) {
      this.updateTargeting(currentTick);
    }
    
    if (this.behavior.currentTarget && !this.behavior.pendingAttack) {
      this.initiateAttackSequence(currentTick);
    }
  }
  
  private processAttackWindup(currentTick: number): void {
    if (!this.behavior.pendingAttack) return;
    
    const attack = this.behavior.pendingAttack;
    const target = this.availableTargets.find(t => t.id === attack.targetId);
    
    if (!target || !target.isAlive || !this.isValidTarget(target)) {
      this.behavior.pendingAttack = undefined;
      this.behavior.currentTarget = undefined;
      return;
    }
    
    if (currentTick >= attack.willHitTick) {
      console.log(`💥 EXECUTING ATTACK at tick ${currentTick}, scheduling next for tick ${currentTick + this.behavior.attackCooldownTicks}`);
      this.executeTowerAttack(attack.targetId, currentTick);
      this.behavior.pendingAttack = undefined;
      this.behavior.nextAttackTick = currentTick + this.behavior.attackCooldownTicks;
    }
  }
  
  private shouldRetarget(currentTick: number): boolean {
    if (!this.behavior.currentTarget) return true;
    
    if (currentTick < this.behavior.lastRetarget + this.behavior.retargetCooldown) {
      return false;
    }
    
    const targetAge = currentTick - (this.behavior.targetEntryHistory.get(this.behavior.currentTarget.id) || 0);
    if (targetAge < this.behavior.targetLockDuration) {
      const target = this.availableTargets.find(t => t.id === this.behavior.currentTarget!.id);
      if (target && target.isAlive && this.isValidTarget(target)) {
        return false;
      }
    }
    
    return true;
  }
  
  private updateTargeting(currentTick: number): void {
    this.cleanupTargetHistory(currentTick);
    
    const validEnemies = this.findValidEnemiesInRange();
    
    if (validEnemies.length === 0) {
      if (this.behavior.currentTarget) {
        this.behavior.currentTarget = undefined;
        this.behavior.pendingAttack = undefined;
      }
      this.behavior.lastRetarget = currentTick;
      return;
    }
    
    const newTarget = this.selectFirstInRange(validEnemies, currentTick);
    
    if (!this.behavior.currentTarget || this.behavior.currentTarget.id !== newTarget.id) {
      this.behavior.currentTarget = this.entityToTarget(newTarget);
      this.behavior.pendingAttack = undefined;
      
      if (!this.behavior.targetEntryHistory.has(newTarget.id)) {
        this.behavior.targetEntryHistory.set(newTarget.id, currentTick);
      }
    }
    
    this.behavior.lastRetarget = currentTick;
  }
  
  private isValidTarget(target: ITargetableEntity): boolean {
    const distance = this.calculateDistance(this.position, target.position);
    return distance >= this.behavior.blindSpotRadius && distance <= this.behavior.autoTargetRange;
  }
  
  private findValidEnemiesInRange(): ITargetableEntity[] {
    return this.availableTargets.filter(target => {
      if (target.ownerId === this.ownerId) return false;
      if (!target.isAlive) return false;
      if (target.isBuilding) return false;
      return this.isValidTarget(target);
    });
  }
  
  private selectFirstInRange(validEnemies: ITargetableEntity[], currentTick: number): ITargetableEntity {
    let firstInRange: ITargetableEntity | null = null;
    let earliestEntryTick = Infinity;
    
    for (const enemy of validEnemies) {
      if (!this.behavior.targetEntryHistory.has(enemy.id)) {
        this.behavior.targetEntryHistory.set(enemy.id, currentTick);
      }
      
      const entryTick = this.behavior.targetEntryHistory.get(enemy.id)!;
      
      if (entryTick < earliestEntryTick) {
        earliestEntryTick = entryTick;
        firstInRange = enemy;
      } else if (entryTick === earliestEntryTick && firstInRange) {
        const distanceToFirst = this.calculateDistance(this.position, firstInRange.position);
        const distanceToThis = this.calculateDistance(this.position, enemy.position);
        
        if (distanceToThis < distanceToFirst) {
          firstInRange = enemy;
        }
      }
    }
    
    return firstInRange || validEnemies[0];
  }
  
  private cleanupTargetHistory(currentTick: number): void {
    const validEnemyIds = new Set(this.findValidEnemiesInRange().map(enemy => enemy.id));
    
    for (const [targetId, entryTick] of this.behavior.targetEntryHistory) {
      if (!validEnemyIds.has(targetId) && currentTick - entryTick > 100) {
        this.behavior.targetEntryHistory.delete(targetId);
      }
    }
  }
  
  private initiateAttackSequence(currentTick: number): void {
    if (!this.behavior.currentTarget || currentTick < this.behavior.nextAttackTick) {
      console.log(`🔍 Attack blocked: target=${!!this.behavior.currentTarget}, tick=${currentTick}, next=${this.behavior.nextAttackTick}`);
      return;
    }
    
    console.log(`🔥 INITIATING ATTACK at tick ${currentTick}`);
      
    const target = this.availableTargets.find(t => t.id === this.behavior.currentTarget!.id);
    if (!target || !target.isAlive || !this.isValidTarget(target)) {
      this.behavior.currentTarget = undefined;
      return;
    }
    
    this.behavior.pendingAttack = {
      targetId: this.behavior.currentTarget.id,
      startTick: currentTick,
      willHitTick: currentTick + this.behavior.attackWindupTicks
    };
    
    this.behavior.lastAttackTick = currentTick;
  }
  
  private executeTowerAttack(targetId: string, _currentTick: number): void {
    const attackConfig: IAttackConfig = {
      attackerId: this.id,
      targetId: targetId,
      damage: this.getCurrentDamage(),
      damageType: this.getDamageType(),
      
      hasSplash: this.baseStats.hasBlastRadius || false,
      ...(this.baseStats.blastRadius && { splashRadius: this.baseStats.blastRadius }),
      splashDamagePercent: 100,
      
      isProjectile: false
    };
    
    const result = this.combatSystem.performAttack(attackConfig);
    
    if (result) {
      this.onAttackPerformed(result);
    } else {
      this.behavior.currentTarget = undefined;
    }
  }
  
  private onAttackPerformed(result: ICombatResult): void {
    this.logger.logBattle('card_played', this.ownerId, {
      towerId: this.id,
      towerType: this.towerType,
      targetId: result.primaryTargetId,
      damage: result.damageDealt,
      targetsHit: result.targetsHit.length,
      tick: result.tick,
      actionType: 'tower_attack'
    });
  }

  takeDamage(damage: number, attackerId?: string, damageType: string = 'normal'): boolean {
    if (!this.isAlive) return false;
    
    let actualDamage = damage;
    
    if (damageType === 'spell' || damageType === 'crown_tower') {
      actualDamage = Math.round(damage * this.baseStats.damageReduction);
    }
    
    this.currentHitpoints = Math.max(0, this.currentHitpoints - actualDamage);
    
    this.logger.logBattle('card_played', this.ownerId, {
      towerId: this.id,
      towerType: this.towerType,
      attackerId,
      damage: actualDamage,
      originalDamage: damage,
      remainingHP: this.currentHitpoints,
      damageType,
      actionType: 'tower_damaged'
    });
    
    if (this.currentHitpoints <= 0) {
      this.markAsDestroyed();
      return true;
    }
    
    return false;
  }
  
  private markAsDestroyed(): void {
    if (this.isDestroyed) return;
    
    this.isDestroyed = true;
    this.isActive = false;
    this.behavior.isActive = false;
    this.behavior.currentTarget = undefined;
    
    this.combatSystem.unregisterCombatant(this.id);
    
    this.logger.logBattle('card_played', this.ownerId, {
      towerId: this.id,
      towerType: this.towerType,
      position: this.position,
      finalDamage: this.currentHitpoints,
      actionType: 'tower_destroyed'
    });
  }

  onTakeDamage = (_damage: number, attacker: ICombatant, _damageType: string): void => {
    if (!this.behavior.currentTarget && this.canTargetAttacker(attacker)) {
      const attackerTarget = this.availableTargets.find(t => t.id === attacker.id);
      if (attackerTarget && this.isValidTarget(attackerTarget)) {
        this.behavior.currentTarget = this.entityToTarget(attackerTarget);
      }
    }
  };
  
  onDeath = (_killer: ICombatant): void => {
    this.markAsDestroyed();
  };
  
  onAttack = (_target: ICombatant): void => {
    // Empty implementation
  };

  private getDamageType(): 'physical' | 'spell' | 'crown_tower' {
    return 'crown_tower';
  }
  
  private getCurrentDamage(): number {
    return this.currentDamage;
  }
  
  private canTargetAttacker(attacker: ICombatant): boolean {
    return attacker.ownerId !== this.ownerId && attacker.type !== 'building';
  }
  
  private calculateDistance(pos1: IPosition, pos2: IPosition): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  private entityToTarget(entity: ITargetableEntity): ITarget {
    return {
      type: entity.type,
      id: entity.id,
      position: { ...entity.position },
      priority: entity.isBuilding ? 1 : (entity.isTank ? 5 : 10)
    };
  }

  updateAvailableTargets(availableTargets: ITargetableEntity[]): void {
    this.availableTargets = availableTargets;
  }
  
  updateHitpoints(newHitpoints: number): void {
    this.currentHitpoints = Math.max(0, newHitpoints);
    
    if (this.currentHitpoints <= 0 && !this.isDestroyed) {
      this.markAsDestroyed();
    }
  }
  
  markAsDead(): void {
    this.markAsDestroyed();
  }
  
  forceAttack(targetId: string): ICombatResult | null {
    const attackConfig: IAttackConfig = {
      attackerId: this.id,
      targetId: targetId,
      damage: this.getCurrentDamage(),
      damageType: this.getDamageType(),
      hasSplash: this.baseStats.hasBlastRadius || false,
      ...(this.baseStats.blastRadius && { splashRadius: this.baseStats.blastRadius }),
      splashDamagePercent: 100,
      isProjectile: false
    };
    
    return this.combatSystem.performAttack(attackConfig);
  }
  
  cleanup(): void {
    this.combatSystem.unregisterCombatant(this.id);
    this.behavior.currentTarget = undefined;
    this.availableTargets = [];
    
    this.logger.logBattle('card_played', this.ownerId, {
      towerId: this.id,
      towerType: this.towerType,
      wasDestroyed: this.isDestroyed,
      finalHP: this.currentHitpoints,
      actionType: 'tower_cleanup'
    });
  }
  
  reset(): void {
    this.currentHitpoints = this.maxHitpoints;
    this.isDestroyed = false;
    this.isActive = true;
    
    this.behavior.isActive = true;
    this.behavior.currentTarget = undefined;
    this.behavior.lastAttackTick = -100;
    this.behavior.nextAttackTick = 0;
    this.behavior.lastRetarget = 0;
    this.behavior.pendingAttack = undefined;
    this.behavior.targetEntryHistory.clear();
    
    this.combatSystem.registerCombatant(this.toCombatant());
  }

  getTowerInfo() {
    return {
      id: this.id,
      type: this.towerType,
      position: this.position,
      ownerId: this.ownerId,
      hitpoints: this.currentHitpoints,
      maxHitpoints: this.maxHitpoints,
      damage: this.currentDamage,
      range: this.attackRange,
      attackSpeed: this.attackSpeed,
      isAlive: this.isAlive,
      isDestroyed: this.isDestroyed,
      canAttack: this.canAttack,
      currentTarget: this.behavior?.currentTarget?.id,
      availableEnemies: this.availableTargets?.filter(t => 
        t.ownerId !== this.ownerId && t.isAlive && !t.isBuilding
      ).length || 0,
      level: this.level
    };
  }
  
  toTargetableEntity(): ITargetableEntity {
    return {
      id: this.id,
      position: this.position,
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
      hitpoints: this.currentHitpoints,
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
      attackDamage: this.currentDamage,
      attackSpeed: this.attackSpeed,
      lastAttackTick: this.behavior?.lastAttackTick || 0,
      
      isStunned: this.isStunned || false,
      stunEndTick: this.stunEndTick || undefined,
      isInvulnerable: this.isInvulnerable || false,
      invulnerabilityEndTick: this.invulnerabilityEndTick || undefined,
      
      onTakeDamage: this.onTakeDamage,
      onDeath: this.onDeath,
      onAttack: this.onAttack
    };
  }

  static createCrownTower(id: string, side: 'left' | 'right', ownerId: string, position: IPosition, level: number = 13): Tower {
    return Tower.create(id, side, ownerId, position, level);
  }
  
  static createKingTower(id: string, ownerId: string, position: IPosition, level: number = 13): Tower {
    return Tower.create(id, 'king', ownerId, position, level);
  }
}

export default Tower;
