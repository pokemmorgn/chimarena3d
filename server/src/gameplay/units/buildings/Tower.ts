import { Schema, type } from '@colyseus/schema';
import { getActionLogger } from '../../../services/ActionLoggerService';
import { getCombatSystem, ICombatant, IAttackConfig, ICombatResult } from '../../systems/CombatSystem';
import { getTargetingSystem, ITargetableEntity, ITargetingResult } from '../../systems/TargetingSystem';
import { IPosition, TargetType, ITarget } from '../BaseUnit';

// === INTERFACES TOWER ===

export type TowerType = 'left' | 'right' | 'king';

export interface ITowerStats {
  // Stats de combat
  hitpoints: number;
  damage: number;
  range: number;
  attackSpeed: number;
  
  // Stats spécifiques aux tours
  targets: 'air' | 'ground' | 'both';
  damageReduction: number; // Réduction dégâts reçus (spells, etc.)
  
  // Propriétés spéciales
  hasBlastRadius?: boolean;
  blastRadius?: number;
  crownTowerBonus?: number; // Bonus dégâts sur Crown Towers
}

export interface ITowerBehavior {
  // État actuel
  isActive: boolean;
  lastStateChange: number;
  
  // Targeting automatique
  currentTarget?: ITarget | undefined;
  autoTargetRange: number;
  retargetCooldown: number;
  lastRetarget: number;
  lastTargetCheck: number;
  
  // Combat
  lastAttackTick: number;
  nextAttackTick: number;
  isAttacking: boolean;
  attackCooldownTicks: number;
  
  // Priorités de ciblage
  targetPriorities: {
    units: number;
    tanks: number;
    lowHP: number;
    closest: number;
  };
}

// === CLASSE TOWER PRINCIPALE ===

export class Tower extends Schema implements ICombatant, ITargetableEntity {
  // === IDENTIFIANTS ===
  @type("string") id: string = "";
  @type("string") ownerId: string = "";
  @type("string") towerType: TowerType = 'left';
  
  // === POSITION ===
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  
  // === STATS ACTUELLES ===
  @type("number") currentHitpoints: number = 1400;
  @type("number") maxHitpoints: number = 1400;
  @type("number") currentDamage: number = 90;
  
  // === ÉTAT ===
  @type("boolean") isDestroyed: boolean = false;
  @type("boolean") isActive: boolean = true;
  @type("number") lastUpdateTick: number = 0;
  @type("number") level: number = 13; // Niveau tour standard
  
  // === DONNÉES NON-SYNCHRONISÉES ===
  private baseStats!: ITowerStats;
  private behavior!: ITowerBehavior;
  private logger = getActionLogger();
  
  // Combat System Integration
  private combatSystem = getCombatSystem();
  private targetingSystem = getTargetingSystem();
  
  // Stockage des cibles disponibles
  private availableTargets: ITargetableEntity[] = [];
  
  // === ICombatant IMPLEMENTATION ===
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
  
  // Propriétés de combat
  get canAttack(): boolean { 
    return this.isAlive && this.isActive && this.behavior?.isActive !== false;
  }
  get attackRange(): number { return this.baseStats?.range || 7; }
  get attackDamage(): number { return this.currentDamage; }
  get attackSpeed(): number { return Math.round((this.baseStats?.attackSpeed || 0.8) * 20); }
  get lastAttackTick(): number { return this.behavior?.lastAttackTick || 0; }
  set lastAttackTick(value: number) { 
    if (this.behavior) this.behavior.lastAttackTick = value; 
  }
  
  // Propriétés ITargetableEntity
  get isFlying(): boolean { return false; }
  get isTank(): boolean { return false; }
  get isBuilding(): boolean { return true; }
  get mass(): number { return 10; } // Les tours sont très lourdes
  
  // État de combat (tours ne peuvent pas être stun normalement)
  isStunned?: boolean = false;
  stunEndTick?: number | undefined;
  isInvulnerable?: boolean = false;
  invulnerabilityEndTick?: number | undefined;
  armor?: number = 0;
  spellResistance?: number = 0;
  shield?: number = 0;

  // === FACTORY METHOD ===
  
  static create(
    id: string,
    towerType: TowerType,
    ownerId: string,
    position: IPosition,
    level: number = 13
  ): Tower {
    const tower = new Tower();
    tower.initialize(id, towerType, ownerId, position, level);
    return tower;
  }
  
  private initialize(
    id: string,
    towerType: TowerType,
    ownerId: string,
    position: IPosition,
    level: number
  ): void {
    this.id = id;
    this.towerType = towerType;
    this.ownerId = ownerId;
    this.x = position.x;
    this.y = position.y;
    this.level = level;
    this.lastUpdateTick = 0;
    
    // Charger les stats selon le type de tour
    this.loadStatsForType(towerType, level);
    this.initializeBehavior();
    
    // Enregistrer dans le système de combat
    this.combatSystem.registerCombatant(this.toCombatant());
    
    console.log(`🏰 Tour ${towerType} créée: ${id} à (${this.x}, ${this.y}) - ${this.currentHitpoints} HP`);
    
    this.logger.logBattle('tower_created', ownerId, {
      towerId: this.id,
      towerType: this.towerType,
      position: { x: this.x, y: this.y },
      hitpoints: this.currentHitpoints,
      damage: this.currentDamage,
      level: this.level
    });
  }

  private loadStatsForType(towerType: TowerType, level: number): void {
    // Stats de base selon le type de tour (comme dans CR)
    const baseStats: Record<TowerType, ITowerStats> = {
      'left': {
        hitpoints: 1400,
        damage: 90,
        range: 7.0,
        attackSpeed: 0.8, // 0.8s entre attaques
        targets: 'both',
        damageReduction: 0.35, // 65% des dégâts normaux
        crownTowerBonus: 1.0
      },
      'right': {
        hitpoints: 1400,
        damage: 90,
        range: 7.0,
        attackSpeed: 0.8,
        targets: 'both',
        damageReduction: 0.35,
        crownTowerBonus: 1.0
      },
      'king': {
        hitpoints: 2600,
        damage: 109,
        range: 7.0,
        attackSpeed: 1.0, // Plus lent mais plus de dégâts
        targets: 'both',
        damageReduction: 0.35,
        hasBlastRadius: true,
        blastRadius: 1.0
      }
    };
    
    const base = baseStats[towerType];
    
    // Scaling avec le niveau (comme dans CR)
    const levelMultiplier = 1 + (level - 13) * 0.10; // 10% par niveau au-dessus de 13
    
    this.baseStats = {
      ...base,
      hitpoints: Math.round(base.hitpoints * levelMultiplier),
      damage: Math.round(base.damage * levelMultiplier)
    };
    
    // Appliquer les stats
    this.maxHitpoints = this.baseStats.hitpoints;
    this.currentHitpoints = this.baseStats.hitpoints;
    this.currentDamage = this.baseStats.damage;
    
    console.log(`🏰 Stats ${towerType} L${level}: ${this.currentHitpoints} HP, ${this.currentDamage} DMG, ${this.baseStats.range} range`);
  }
  
  private initializeBehavior(): void {
    this.behavior = {
      isActive: true,
      lastStateChange: 0,
      
      // Auto-targeting plus agressif que les unités
      autoTargetRange: this.baseStats.range,
      retargetCooldown: 10, // Retarget plus rapide (0.5s)
      lastRetarget: 0,
      lastTargetCheck: 0,
      
      lastAttackTick: -100,
      nextAttackTick: 0,
      isAttacking: false,
      attackCooldownTicks: this.attackSpeed,
      
      // Priorités spéciales tours
      targetPriorities: {
        units: 10,    // Priorité maximale sur unités
        tanks: 8,     // Tanks un peu moins prioritaires
        lowHP: 12,    // Finir les unités blessées
        closest: 15   // Priorité maximale sur proximité
      }
    };
  }

  // === MÉTHODE PRINCIPALE UPDATE ===
  
  update(currentTick: number, deltaTime: number): void {
    this.lastUpdateTick = currentTick;
    
    if (!this.isAlive || !this.isActive) {
      return;
    }
    
    // 🔧 AUTO-TARGETING AGRESSIF (toutes les 0.5 secondes)
    const shouldRetarget = !this.behavior.currentTarget || 
                          currentTick >= this.behavior.lastRetarget + this.behavior.retargetCooldown;
    
    if (shouldRetarget) {
      this.updateTargeting(currentTick);
    }
    
    // 🔧 ATTAQUE AUTOMATIQUE
    if (this.behavior.currentTarget) {
      this.updateAttacking(currentTick);
    }
    
    // Debug périodique
    if (currentTick % 200 === 0 && this.behavior.currentTarget) { // Toutes les 10 secondes
      console.log(`🏰 ${this.id} cible: ${this.behavior.currentTarget.id} (${this.availableTargets.length} disponibles)`);
    }
  }
  
  /**
   * 🔧 SYSTÈME DE TARGETING AUTOMATIQUE POUR TOURS
   */
  private updateTargeting(currentTick: number): void {
    // Filtrer uniquement les unités ennemies vivantes dans la range
    const enemyUnitsInRange = this.availableTargets.filter(target => {
      if (target.ownerId === this.ownerId) return false; // Pas ally
      if (!target.isAlive) return false; // Pas mortes
      if (target.isBuilding) return false; // Tours n'attaquent pas autres tours
      
      const distance = this.calculateDistance(this.position, target.position);
      return distance <= this.behavior.autoTargetRange;
    });
    
    if (enemyUnitsInRange.length === 0) {
      // Aucune cible en range
      if (this.behavior.currentTarget) {
        console.log(`🏰 ${this.id} plus de cibles en range, stop targeting`);
        this.behavior.currentTarget = undefined;
      }
      this.behavior.lastRetarget = currentTick;
      return;
    }
    
    // Utiliser le système de targeting avec priorités tour
    const targetingResult = this.findBestTargetForTower(enemyUnitsInRange, currentTick);
    
    if (targetingResult.target) {
      const oldTarget = this.behavior.currentTarget?.id;
      const newTarget = targetingResult.target.id;
      
      if (oldTarget !== newTarget) {
        console.log(`🎯 ${this.id} nouvelle cible: ${newTarget} (raison: ${targetingResult.reason})`);
      }
      
      this.behavior.currentTarget = targetingResult.target;
    }
    
    this.behavior.lastRetarget = currentTick;
  }
  
  /**
   * 🔧 SYSTÈME DE TARGETING SPÉCIFIQUE AUX TOURS
   */
  private findBestTargetForTower(availableTargets: ITargetableEntity[], currentTick: number): ITargetingResult {
    if (availableTargets.length === 0) {
      return {
        target: null,
        confidence: 0,
        reason: 'no_targets_in_range',
        alternativeTargets: []
      };
    }
    
    // Évaluer chaque cible avec les priorités tour
    const evaluatedTargets = availableTargets.map(target => {
      const score = this.evaluateTargetForTower(target);
      return {
        target: this.entityToTarget(target),
        score: score,
        entity: target
      };
    }).sort((a, b) => b.score - a.score);
    
    const bestTarget = evaluatedTargets[0];
    const confidence = evaluatedTargets.length > 1 ? 
      Math.min(1.0, (bestTarget.score - evaluatedTargets[1].score) / 10) : 1.0;
    
    return {
      target: bestTarget.target,
      confidence,
      reason: this.getTargetingReason(bestTarget.entity, bestTarget.score),
      alternativeTargets: evaluatedTargets.slice(1, 4).map(t => t.target)
    };
  }
  
  /**
   * 🔧 ÉVALUATION SPÉCIALE POUR TOURS
   */
  private evaluateTargetForTower(target: ITargetableEntity): number {
    let score = 0;
    
    // 1. Distance (le plus important pour les tours)
    const distance = this.calculateDistance(this.position, target.position);
    const distanceScore = Math.max(0, 15 - distance) * this.behavior.targetPriorities.closest;
    score += distanceScore;
    
    // 2. HP bas (finir les unités blessées)
    const hpPercent = target.hitpoints / target.maxHitpoints;
    if (hpPercent < 0.5) {
      score += this.behavior.targetPriorities.lowHP * (1 - hpPercent);
    }
    
    // 3. Type d'unité
    if (target.isTank) {
      score += this.behavior.targetPriorities.tanks;
    } else {
      score += this.behavior.targetPriorities.units;
    }
    
    // 4. Bonus pour cibles aériennes si tour peut les cibler
    if (target.isFlying && this.baseStats.targets === 'both') {
      score += 5; // Bonus pour air units
    }
    
    // 5. Malus pour cibles très éloignées de la range max
    if (distance > this.behavior.autoTargetRange * 0.8) {
      score -= 3; // Légère pénalité pour cibles en bordure
    }
    
    return Math.max(0, score);
  }
  
  /**
   * 🔧 LOGIQUE D'ATTAQUE AUTOMATIQUE
   */
  private updateAttacking(currentTick: number): void {
    if (!this.behavior.currentTarget) return;
    
    // Vérifier que la cible existe encore et est en range
    const target = this.availableTargets.find(t => t.id === this.behavior.currentTarget!.id);
    
    if (!target || !target.isAlive) {
      console.log(`💀 ${this.id} cible disparue: ${this.behavior.currentTarget.id}`);
      this.behavior.currentTarget = undefined;
      return;
    }
    
    // Vérifier range
    const distance = this.calculateDistance(this.position, target.position);
    if (distance > this.behavior.autoTargetRange + 0.2) { // Petite tolérance
      console.log(`🏃 ${this.id} cible trop loin: ${distance.toFixed(2)} > ${this.behavior.autoTargetRange}`);
      this.behavior.currentTarget = undefined;
      return;
    }
    
    // Mettre à jour position cible
    this.behavior.currentTarget.position = target.position;
    
    // Vérifier si on peut attaquer (cooldown)
    if (currentTick >= this.behavior.nextAttackTick) {
      console.log(`🏰⚔️ ${this.id} ATTAQUE ${this.behavior.currentTarget.id}!`);
      this.performTowerAttack(currentTick);
    }
  }
  
  /**
   * 🔧 ATTAQUE DE TOUR AUTOMATIQUE
   */
  private performTowerAttack(currentTick: number): void {
    if (!this.behavior.currentTarget) return;
    
    const attackConfig: IAttackConfig = {
      attackerId: this.id,
      targetId: this.behavior.currentTarget.id,
      damage: this.getCurrentDamage(),
      damageType: this.getDamageType(),
      
      // Tours King ont explosion
      hasSplash: this.baseStats.hasBlastRadius || false,
      ...(this.baseStats.blastRadius && { splashRadius: this.baseStats.blastRadius }),
      splashDamagePercent: 100,
      
      // Tours attaquent instantanément (pas de projectile)
      isProjectile: false
    };
    
    // Mettre à jour les timestamps d'attaque
    this.behavior.lastAttackTick = currentTick;
    this.behavior.nextAttackTick = currentTick + this.behavior.attackCooldownTicks;
    
    // Déléguer au CombatSystem
    const result = this.combatSystem.performAttack(attackConfig);
    
    if (result) {
      console.log(`✅ ${this.id} attaque réussie: ${result.damageDealt} dégâts`);
      this.onAttackPerformed(result);
    } else {
      console.log(`❌ ${this.id} échec attaque sur ${this.behavior.currentTarget.id}`);
      // Problème avec la cible - la supprimer
      this.behavior.currentTarget = undefined;
    }
  }
  
  private onAttackPerformed(result: ICombatResult): void {
    this.logger.logBattle('tower_attack', this.ownerId, {
      towerId: this.id,
      towerType: this.towerType,
      targetId: result.primaryTargetId,
      damage: result.damageDealt,
      targetsHit: result.targetsHit.length,
      tick: result.tick
    });
  }

  // === MÉTHODES DE DÉGÂTS ===
  
  takeDamage(damage: number, attackerId?: string, damageType: string = 'normal'): boolean {
    if (!this.isAlive) return false;
    
    // Appliquer réduction de dégâts des tours
    let actualDamage = damage;
    
    if (damageType === 'spell' || damageType === 'crown_tower') {
      actualDamage = Math.round(damage * this.baseStats.damageReduction);
      console.log(`🏰 ${this.id} réduction dégâts: ${damage} → ${actualDamage} (${this.baseStats.damageReduction * 100}%)`);
    }
    
    const oldHp = this.currentHitpoints;
    this.currentHitpoints = Math.max(0, this.currentHitpoints - actualDamage);
    
    console.log(`🏰💥 ${this.id} prend ${actualDamage} dégâts: ${oldHp} → ${this.currentHitpoints} HP`);
    
    this.logger.logBattle('tower_damaged', this.ownerId, {
      towerId: this.id,
      towerType: this.towerType,
      attackerId,
      damage: actualDamage,
      originalDamage: damage,
      remainingHP: this.currentHitpoints,
      damageType
    });
    
    // Vérifier destruction
    if (this.currentHitpoints <= 0) {
      this.markAsDestroyed();
      return true; // Tour détruite
    }
    
    return false;
  }
  
  private markAsDestroyed(): void {
    if (this.isDestroyed) return;
    
    console.log(`💥 TOUR DÉTRUITE: ${this.id} (${this.towerType})`);
    
    this.isDestroyed = true;
    this.isActive = false;
    this.behavior.isActive = false;
    this.behavior.currentTarget = undefined;
    
    // Désinscrire du système de combat
    this.combatSystem.unregisterCombatant(this.id);
    
    this.logger.logBattle('tower_destroyed', this.ownerId, {
      towerId: this.id,
      towerType: this.towerType,
      position: this.position,
      finalDamage: this.currentHitpoints
    });
  }

  // === ICombatant CALLBACKS ===
  
  onTakeDamage = (damage: number, attacker: ICombatant, damageType: string): void => {
    console.log(`🏰 ${this.id} prend ${damage} dégâts ${damageType} de ${attacker.id}`);
    
    // Tours ne contre-attaquent pas automatiquement - elles attaquent selon leur logique
    // Mais on peut prioriser l'attaquant s'il entre en range
    if (!this.behavior.currentTarget && this.canTargetAttacker(attacker)) {
      const attackerTarget = this.availableTargets.find(t => t.id === attacker.id);
      if (attackerTarget && this.isInRange(attackerTarget)) {
        console.log(`🏰🎯 ${this.id} priorise l'attaquant ${attacker.id}!`);
        this.behavior.currentTarget = this.entityToTarget(attackerTarget);
      }
    }
  };
  
  onDeath = (killer: ICombatant): void => {
    console.log(`🏰💀 ${this.id} détruite par ${killer.id}`);
    this.markAsDestroyed();
  };
  
  onAttack = (target: ICombatant): void => {
    console.log(`🏰⚔️ ${this.id} attaque ${target.id}`);
  };

  // === MÉTHODES UTILITAIRES ===
  
  private getDamageType(): 'physical' | 'spell' | 'crown_tower' {
    // Tours font des dégâts crown_tower sur les autres tours (réduits)
    return 'crown_tower';
  }
  
  private getCurrentDamage(): number {
    return this.currentDamage;
  }
  
  private canTargetAttacker(attacker: ICombatant): boolean {
    // Tours attaquent toutes les unités ennemies
    return attacker.ownerId !== this.ownerId && attacker.type !== 'building';
  }
  
  private isInRange(target: ITargetableEntity): boolean {
    const distance = this.calculateDistance(this.position, target.position);
    return distance <= this.behavior.autoTargetRange;
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
  
  private getTargetingReason(target: ITargetableEntity, score: number): string {
    const distance = this.calculateDistance(this.position, target.position);
    if (target.hitpoints < target.maxHitpoints * 0.3) return `low_hp_${score.toFixed(1)}`;
    if (distance <= 3) return `very_close_${score.toFixed(1)}`;
    if (target.isTank) return `tank_threat_${score.toFixed(1)}`;
    return `closest_unit_${score.toFixed(1)}`;
  }

  // === MÉTHODES PUBLIQUES POUR BATTLEROOM ===
  
  /**
   * Mise à jour des cibles disponibles (appelée par BattleRoom)
   */
  updateAvailableTargets(availableTargets: ITargetableEntity[]): void {
    this.availableTargets = availableTargets;
    
    // Debug occasionnel
    if (this.lastUpdateTick % 100 === 0) {
      const enemyUnits = availableTargets.filter(t => 
        t.ownerId !== this.ownerId && t.isAlive && !t.isBuilding
      );
      console.log(`🏰🎯 ${this.id} voit ${enemyUnits.length} unités ennemies`);
    }
  }
  
  /**
   * Synchronisation HP depuis le système de combat
   */
  updateHitpoints(newHitpoints: number): void {
    const oldHp = this.currentHitpoints;
    this.currentHitpoints = Math.max(0, newHitpoints);
    
    console.log(`🔄 ${this.id} sync HP: ${oldHp} → ${this.currentHitpoints}`);
    
    if (this.currentHitpoints <= 0 && !this.isDestroyed) {
      this.markAsDestroyed();
    }
  }
  
  /**
   * Marquer comme détruite (appelé par CombatSystem)
   */
  markAsDead(): void {
    this.markAsDestroyed();
  }
  
  /**
   * Forcer une attaque sur une cible spécifique
   */
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
  
  /**
   * Debug de l'état de combat
   */
  debugCombatState(): void {
    console.log(`🔍 DEBUG Tower Combat ${this.id}:`);
    console.log(`   Type: ${this.towerType}`);
    console.log(`   IsAlive: ${this.isAlive}`);
    console.log(`   IsDestroyed: ${this.isDestroyed}`);
    console.log(`   CanAttack: ${this.canAttack}`);
    console.log(`   HP: ${this.currentHitpoints}/${this.maxHitpoints}`);
    console.log(`   Damage: ${this.currentDamage}`);
    console.log(`   Range: ${this.attackRange}`);
    console.log(`   Owner: ${this.ownerId}`);
    console.log(`   Position: (${this.x.toFixed(1)}, ${this.y.toFixed(1)})`);
    console.log(`   LastAttack: ${this.behavior?.lastAttackTick || 0}`);
    console.log(`   NextAttack: ${this.behavior?.nextAttackTick || 0}`);
    console.log(`   AttackSpeed: ${this.attackSpeed} ticks`);
    
    if (this.behavior?.currentTarget) {
      const distance = this.calculateDistance(this.position, this.behavior.currentTarget.position);
      console.log(`   Target: ${this.behavior.currentTarget.id}`);
      console.log(`   Distance to target: ${distance.toFixed(2)}`);
    } else {
      console.log(`   Target: none`);
    }
    
    const enemies = this.availableTargets?.filter(t => 
      t.ownerId !== this.ownerId && t.isAlive && !t.isBuilding
    ) || [];
    console.log(`   Available enemies: ${enemies.length}`);
    
    if (enemies.length > 0) {
      console.log(`   Enemies in range:`);
      enemies.forEach((enemy, i) => {
        const distance = this.calculateDistance(this.position, enemy.position);
        const inRange = distance <= this.behavior.autoTargetRange;
        console.log(`     ${i}: ${enemy.id} - ${distance.toFixed(2)} tiles ${inRange ? '✅' : '❌'}`);
      });
    }
  }
  
  // === MÉTHODES DE CONVERSION ===
  
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
      
      // Méthodes de synchronisation
      updateHitpoints: this.updateHitpoints.bind(this),
      markAsDead: this.markAsDead.bind(this),
      
      onTakeDamage: this.onTakeDamage,
      onDeath: this.onDeath,
      onAttack: this.onAttack
    };
  }

  // === MÉTHODES STATIQUES ===
  
  /**
   * Créer une tour Crown (gauche ou droite)
   */
  static createCrownTower(
    id: string,
    side: 'left' | 'right',
    ownerId: string,
    position: IPosition,
    level: number = 13
  ): Tower {
    return Tower.create(id, side, ownerId, position, level);
  }
  
  /**
   * Créer une tour King
   */
  static createKingTower(
    id: string,
    ownerId: string,
    position: IPosition,
    level: number = 13
  ): Tower {
    return Tower.create(id, 'king', ownerId, position, level);
  }
  
  /**
   * Obtenir les stats par défaut d'une tour
   */
  static getDefaultStats(towerType: TowerType, level: number = 13): ITowerStats {
    const baseStats: Record<TowerType, ITowerStats> = {
      'left': {
        hitpoints: 1400,
        damage: 90,
        range: 7.0,
        attackSpeed: 0.8,
        targets: 'both',
        damageReduction: 0.35,
        crownTowerBonus: 1.0
      },
      'right': {
        hitpoints: 1400,
        damage: 90,
        range: 7.0,
        attackSpeed: 0.8,
        targets: 'both',
        damageReduction: 0.35,
        crownTowerBonus: 1.0
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
    
    return {
      ...base,
      hitpoints: Math.round(base.hitpoints * levelMultiplier),
      damage: Math.round(base.damage * levelMultiplier)
    };
  }
  
  /**
   * Vérifier si une position est valide pour placer une tour
   */
  static isValidTowerPosition(position: IPosition, towerType: TowerType, side: 'player1' | 'player2'): boolean {
    const { x, y } = position;
    
    // Vérifications de base
    if (x < 0 || x >= 18 || y < 0 || y >= 32) return false;
    
    // Positions spécifiques selon le côté
    if (side === 'player1') {
      // Côté bas (joueur 1)
      switch (towerType) {
        case 'left':
          return x >= 4 && x <= 8 && y >= 26 && y <= 30;
        case 'right':
          return x >= 10 && x <= 14 && y >= 26 && y <= 30;
        case 'king':
          return x >= 7 && x <= 11 && y >= 28 && y <= 32;
        default:
          return false;
      }
    } else {
      // Côté haut (joueur 2)
      switch (towerType) {
        case 'left':
          return x >= 4 && x <= 8 && y >= 2 && y <= 6;
        case 'right':
          return x >= 10 && x <= 14 && y >= 2 && y <= 6;
        case 'king':
          return x >= 7 && x <= 11 && y >= 0 && y <= 4;
        default:
          return false;
      }
    }
  }

  // === MÉTHODES DE NETTOYAGE ===
  
  /**
   * Nettoyer la tour (appelé à la destruction)
   */
  cleanup(): void {
    console.log(`🧹 Nettoyage tour ${this.id}`);
    
    this.combatSystem.unregisterCombatant(this.id);
    this.behavior.currentTarget = undefined;
    this.availableTargets = [];
    
    this.logger.logBattle('tower_cleanup', this.ownerId, {
      towerId: this.id,
      towerType: this.towerType,
      wasDestroyed: this.isDestroyed,
      finalHP: this.currentHitpoints
    });
  }
  
  /**
   * Réinitialiser la tour (pour tests ou redémarrage)
   */
  reset(): void {
    console.log(`🔄 Reset tour ${this.id}`);
    
    this.currentHitpoints = this.maxHitpoints;
    this.isDestroyed = false;
    this.isActive = true;
    
    this.behavior.isActive = true;
    this.behavior.currentTarget = undefined;
    this.behavior.lastAttackTick = -100;
    this.behavior.nextAttackTick = 0;
    this.behavior.lastRetarget = 0;
    
    // Ré-enregistrer dans le système de combat
    this.combatSystem.registerCombatant(this.toCombatant());
  }

  // === GETTERS PUBLICS ===
  
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
  
  getStats(): ITowerStats {
    return { ...this.baseStats };
  }
  
  getBehavior(): ITowerBehavior {
    return { ...this.behavior };
  }
  
  // === MÉTHODES DE CONFIGURATION ===
  
  /**
   * Modifier les priorités de ciblage
   */
  updateTargetPriorities(priorities: Partial<ITowerBehavior['targetPriorities']>): void {
    this.behavior.targetPriorities = {
      ...this.behavior.targetPriorities,
      ...priorities
    };
    
    console.log(`🏰⚙️ ${this.id} priorités mises à jour:`, this.behavior.targetPriorities);
  }
  
  /**
   * Modifier la range de ciblage automatique
   */
  updateAutoTargetRange(newRange: number): void {
    this.behavior.autoTargetRange = Math.max(0, Math.min(15, newRange));
    console.log(`🏰⚙️ ${this.id} range mise à jour: ${this.behavior.autoTargetRange}`);
  }
  
  /**
   * Activer/désactiver la tour
   */
  setActive(active: boolean): void {
    this.isActive = active;
    this.behavior.isActive = active;
    
    if (!active) {
      this.behavior.currentTarget = undefined;
    }
    
    console.log(`🏰⚙️ ${this.id} ${active ? 'activée' : 'désactivée'}`);
  }
}

// === EXPORT ===
export default Tower;
