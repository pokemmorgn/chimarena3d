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

// 🔧 NOUVEAU: Interface pour les tours
export interface ITower {
  id: string;
  position: IPosition;
  ownerId: string;
  isDestroyed: boolean;
  hitpoints: number;
  maxHitpoints: number;
  type: 'left' | 'right' | 'king';
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
  
  // 🔧 NOUVEAU: Pathfinding vers tours
  targetTower?: ITower;
  isMovingToTower: boolean;
  lastTowerCheck: number;
  
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
  
  // 🔧 NOUVEAU: Stockage des cibles et tours disponibles
  private availableTargets: ITargetableEntity[] = [];
  private availableTowers: ITower[] = [];
  
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
  get canAttack(): boolean { 
    if (!this.isAlive) return false;
    if (this.state === 'spawning' || this.state === 'dying' || this.state === 'dead') return false;
    if (this.behavior?.buffs.has('freeze')) return false;
    if (this.isStunned) return false;
    return true;
  }
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
  
  /**
   * 🔧 CORRECTION: Initialize behavior avec pathfinding
   */
  private initializeBehavior(): void {
    this.behavior = {
      state: 'spawning',
      lastStateChange: this.spawnTick,
      
      targetAcquisitionRange: this.baseStats.sight,
      retargetCooldown: 20,
      lastRetarget: 0,
      
      lastAttackTick: this.spawnTick - 100,
      nextAttackTick: this.spawnTick,
      isAttacking: false,
      attackWindup: Math.round(this.baseStats.attackSpeed * 0.3 * 20),
      
      pathNodes: [],
      currentPathIndex: 0,
      lastMoveTick: this.spawnTick,
      moveSpeed: this.baseStats.walkingSpeed,
      
      // 🔧 NOUVEAU: Pathfinding vers tours
      isMovingToTower: false,
      lastTowerCheck: this.spawnTick,
      
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
  
  // === MÉTHODES PRINCIPALES AVEC PATHFINDING ===
  
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
   * 🔧 CORRIGÉ: Logique idle avec pathfinding vers tours (VRAI CLASH ROYALE)
   */
  private updateIdle(currentTick: number): void {
    // 1. PRIORITÉ: Chercher des unités ennemies d'abord
    const shouldRetarget = !this.behavior.currentTarget || 
                          currentTick >= this.behavior.lastRetarget + Math.min(this.behavior.retargetCooldown, 20);
    
    if (shouldRetarget) {
      // Chercher des ennemis en priorité
      const availableEnemies = this.availableTargets.filter(t => 
        t.ownerId !== this.ownerId && t.isAlive === true
      );
      
      if (availableEnemies.length > 0) {
        // ✅ Des ennemis trouvés - logique de combat
        const targetingResult = this.findTargetWithSystem(currentTick);
        
        if (targetingResult.target) {
          console.log(`🎯 ${this.id} trouve un ennemi: ${targetingResult.target.id}`);
          this.setTarget(targetingResult.target);
          this.behavior.isMovingToTower = false; // Arrêter le pathfinding vers tour
          this.setState('moving');
          this.behavior.lastRetarget = currentTick;
          return;
        }
      }
      
      // 2. AUCUN ENNEMI → PATHFINDING VERS TOUR (logique Clash Royale)
      const shouldCheckTowers = currentTick >= this.behavior.lastTowerCheck + 40; // Vérifier toutes les 2 secondes
      
      if (shouldCheckTowers) {
        console.log(`🏰 ${this.id} updateIdle: Recherche de tour cible (${availableEnemies.length} ennemis, ${this.availableTowers?.length || 0} tours)`);
        const targetTower = this.findBestTargetTower();
        
        if (targetTower) {
          console.log(`🏰 ${this.id} aucun ennemi - avance vers tour ${targetTower.type} (${targetTower.position.x}, ${targetTower.position.y})`);
          this.behavior.targetTower = targetTower;
          this.behavior.isMovingToTower = true;
          this.behavior.destination = { ...targetTower.position };
          this.setState('moving');
        } else {
          // Debug moins fréquent si pas de tours
          if (currentTick % 100 === 0) {
            console.log(`😴 ${this.id} aucune cible disponible (${this.availableTargets.length} targets, ${this.availableTowers.length} towers)`);
          }
        }
        
        this.behavior.lastTowerCheck = currentTick;
      }
      
      this.behavior.lastRetarget = currentTick;
    }
  }
  
  /**
   * 🔧 CORRIGÉ: Mouvement avec pathfinding vers tours
   */
  private updateMovement(currentTick: number, deltaTime: number): void {
    // Toujours chercher des ennemis en priorité même en mouvement
    const availableEnemies = this.availableTargets.filter(t => 
      t.ownerId !== this.ownerId && t.isAlive === true
    );
    
    // Si des ennemis apparaissent, les cibler en priorité
    if (availableEnemies.length > 0 && !this.behavior.currentTarget) {
      const targetingResult = this.findTargetWithSystem(currentTick);
      if (targetingResult.target) {
        console.log(`🎯 ${this.id} ennemi détecté pendant le mouvement: ${targetingResult.target.id}`);
        this.setTarget(targetingResult.target);
        this.behavior.isMovingToTower = false;
        // Continuer en mode moving vers la nouvelle cible
      }
    }
    
    if (!this.behavior.destination) {
      console.log(`❌ ${this.id} en mouvement mais pas de destination`);
      this.setState('idle');
      return;
    }

    // MOUVEMENT VERS UNITÉ ENNEMIE
    if (this.behavior.currentTarget && !this.behavior.isMovingToTower) {
      // Vérifier si la cible existe toujours
      const targetExists = this.availableTargets.find(t => t.id === this.behavior.currentTarget!.id);
      if (!targetExists || !targetExists.isAlive) {
        console.log(`💀 ${this.id} cible disparue pendant mouvement, retour idle`);
        this.behavior.currentTarget = undefined;
        this.setState('idle');
        return;
      }

      // Mettre à jour la position cible en temps réel
      this.behavior.currentTarget.position = targetExists.position;
      this.behavior.destination = { ...targetExists.position };

      const targetDistance = this.getDistanceToTarget(this.behavior.currentTarget);
      const attackRange = this.baseStats.range;
      const rangeMargin = 0.1;
      
      if (targetDistance <= attackRange + rangeMargin) {
        console.log(`⚔️ ${this.id} EN RANGE ENNEMI ! Distance: ${targetDistance.toFixed(2)} <= Range: ${attackRange}`);
        this.setState('attacking');
        return;
      }
    }
    
    // MOUVEMENT VERS TOUR
    else if (this.behavior.isMovingToTower && this.behavior.targetTower) {
      const towerDistance = this.calculateDistance(this.getPosition(), this.behavior.targetTower.position);
      const attackRange = this.baseStats.range;
      
      if (towerDistance <= attackRange + 0.1) {
        console.log(`🏰 ${this.id} EN RANGE TOUR ! Distance: ${towerDistance.toFixed(2)}`);
        // Créer une cible pour la tour
        this.setTargetTower(this.behavior.targetTower);
        this.behavior.isMovingToTower = false;
        this.setState('attacking');
        return;
      }
    }

    // MOUVEMENT PHYSIQUE
    const targetPos = this.behavior.destination;
    const dx = targetPos.x - this.x;
    const dy = targetPos.y - this.y;
    const distanceToDestination = Math.sqrt(dx * dx + dy * dy);
    
    if (distanceToDestination > 0.05) {
      const moveSpeedTilesPerSec = this.behavior.moveSpeed;
      const moveDistanceThisFrame = moveSpeedTilesPerSec * (deltaTime / 1000);
      
      const dirX = dx / distanceToDestination;
      const dirY = dy / distanceToDestination;
      
      const actualMoveDistance = Math.min(moveDistanceThisFrame, distanceToDestination);
      
      if (actualMoveDistance > 0) {
        this.x += dirX * actualMoveDistance;
        this.y += dirY * actualMoveDistance;
        this.behavior.lastMoveTick = currentTick;
        
        // Debug de mouvement moins verbeux
        if (currentTick % 20 === 0) {
          const moveType = this.behavior.isMovingToTower ? '🏰 vers tour' : '⚔️ vers ennemi';
          console.log(`🏃 ${this.id} ${moveType}: (${this.x.toFixed(1)}, ${this.y.toFixed(1)}) Dist: ${distanceToDestination.toFixed(2)}`);
        }
      }
    } else {
      console.log(`🎯 ${this.id} arrivé à destination !`);
      if (this.behavior.isMovingToTower) {
        this.setState('attacking'); // Attaquer la tour
      } else {
        this.setState('attacking'); // Attaquer l'ennemi
      }
    }
  }
  
  /**
   * 🔧 CORRIGÉ: Logique d'attaque avec retargeting intelligent
   */
  private updateAttacking(currentTick: number): void {
    if (!this.behavior.currentTarget) {
      console.log(`❌ ${this.id} en mode attaque mais pas de cible !`);
      this.setState('idle');
      return;
    }

    // Vérifier que la cible existe toujours (unité ou tour)
    let targetExists: any = null;
    
    if (this.behavior.currentTarget.type === 'tower') {
      // Vérifier si la tour existe encore
      targetExists = this.availableTowers.find(t => 
        t.id === this.behavior.currentTarget!.id && !t.isDestroyed
      );
    } else {
      // Vérifier si l'unité existe encore
      targetExists = this.availableTargets.find(t => 
        t.id === this.behavior.currentTarget!.id && t.isAlive
      );
    }
    
    if (!targetExists) {
      console.log(`💀 ${this.id} cible disparue, recherche nouvelle cible...`);
      
      // Prioriser les unités ennemies
      const availableEnemies = this.availableTargets.filter(t => 
        t.ownerId !== this.ownerId && t.isAlive === true
      );
      
      if (availableEnemies.length > 0) {
        const targetingResult = this.findTargetWithSystem(currentTick);
        if (targetingResult.target) {
          console.log(`🎯 ${this.id} nouvelle cible ennemi: ${targetingResult.target.id}`);
          this.setTarget(targetingResult.target);
          this.setState('moving');
          return;
        }
      }
      
      // Sinon, retour vers une tour
      const targetTower = this.findBestTargetTower();
      if (targetTower) {
        console.log(`🏰 ${this.id} retour vers tour ${targetTower.type}`);
        this.behavior.targetTower = targetTower;
        this.behavior.isMovingToTower = true;
        this.behavior.destination = { ...targetTower.position };
        this.behavior.currentTarget = undefined;
        this.setState('moving');
        return;
      }
      
      console.log(`❌ ${this.id} plus de cibles disponibles, retour idle`);
      this.behavior.currentTarget = undefined;
      this.setState('idle');
      return;
    }

    // Mettre à jour la position cible
    this.behavior.currentTarget.position = targetExists.position;

    // Vérifier range d'attaque
    const targetDistance = this.getDistanceToTarget(this.behavior.currentTarget);
    const attackRange = this.baseStats.range;
    const hysteresisMargin = 0.3;
    
    if (targetDistance > attackRange + hysteresisMargin) {
      console.log(`🏃 ${this.id} cible trop loin, retour mouvement`);
      this.setState('moving');
      return;
    }

    // Attaquer si cooldown fini
    const canAttackNow = currentTick >= this.behavior.nextAttackTick;
    
    if (canAttackNow) {
      console.log(`⚔️ ${this.id} ATTAQUE ${this.behavior.currentTarget.id} !`);
      this.performAttackWithSystem(currentTick);
    } else {
      const ticksRemaining = this.behavior.nextAttackTick - currentTick;
      if (ticksRemaining > 0 && currentTick % 40 === 0) {
        console.log(`⏱️ ${this.id} cooldown: ${(ticksRemaining / 20).toFixed(1)}s`);
      }
    }
  }
  
/**
 * 🔧 NOUVEAU: Trouver la meilleure tour à attaquer
 */
private findBestTargetTower(): ITower | null {
  if (!this.availableTowers || this.availableTowers.length === 0) {
    console.log(`🏰 ${this.id} findBestTargetTower: Aucune tour disponible`);
    return null;
  }
  
  // Filtrer les tours ennemies non détruites
  const enemyTowers = this.availableTowers.filter(tower => 
    tower.ownerId !== this.ownerId && !tower.isDestroyed
  );
  
  console.log(`🏰 ${this.id} findBestTargetTower: ${this.availableTowers.length} tours total, ${enemyTowers.length} ennemies`);
  
  if (enemyTowers.length === 0) {
    console.log(`🏰 ${this.id} findBestTargetTower: Aucune tour ennemie disponible`);
    return null;
  }
    
    // Logique Clash Royale: Prioriser les tours principales, puis la tour du roi
    const leftTower = enemyTowers.find(t => t.type === 'left');
    const rightTower = enemyTowers.find(t => t.type === 'right');
    const kingTower = enemyTowers.find(t => t.type === 'king');
    
    // Si les deux tours principales existent, prendre la plus proche
    if (leftTower && rightTower) {
      const distanceLeft = this.calculateDistance(this.getPosition(), leftTower.position);
      const distanceRight = this.calculateDistance(this.getPosition(), rightTower.position);
      return distanceLeft <= distanceRight ? leftTower : rightTower;
    }
    
    // Sinon prendre celle qui existe
    if (leftTower) return leftTower;
    if (rightTower) return rightTower;
    
    // En dernier recours, la tour du roi
    return kingTower || null;
  }
  
  /**
   * 🔧 NOUVEAU: Définir une tour comme cible
   */
  private setTargetTower(tower: ITower): void {
    this.behavior.currentTarget = {
      type: 'tower',
      id: tower.id,
      position: { ...tower.position },
      priority: tower.type === 'king' ? 20 : 15 // Haute priorité pour les tours
    };
    this.behavior.destination = { ...tower.position };
  }
  
  /**
   * 🔧 CORRIGÉ: Attaque avec gestion des échecs
   */
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
    
    // Mettre à jour lastAttackTick AVANT l'attaque
    this.behavior.lastAttackTick = currentTick;
    
    // Déléguer au CombatSystem
    const result = this.combatSystem.performAttack(attackConfig);
    
    if (result) {
      // ✅ Attaque réussie
      this.behavior.nextAttackTick = currentTick + this.attackSpeed;
      console.log(`✅ Attaque réussie ! Dégâts: ${result.damageDealt}. Prochaine attaque dans ${this.attackSpeed} ticks`);
      this.onAttackPerformed(result);
      
    } else {
      // ❌ Attaque échouée - Gestion intelligente
      console.log(`❌ Échec de l'attaque sur ${this.behavior.currentTarget.id}`);
      
      // Vérifier si la cible est encore vivante
      let targetStillAlive = false;
      
      if (this.behavior.currentTarget.type === 'tower') {
        targetStillAlive = this.availableTowers.some(t => 
          t.id === this.behavior.currentTarget!.id && !t.isDestroyed
        );
      } else {
        targetStillAlive = this.availableTargets.some(t => 
          t.id === this.behavior.currentTarget!.id && t.isAlive === true
        );
      }
      
      if (!targetStillAlive) {
        console.log(`💀 ${this.id} cible morte/détruite, recherche nouvelle cible...`);
        
        // Chercher des ennemis d'abord
        const availableEnemies = this.availableTargets.filter(t => 
          t.ownerId !== this.ownerId && t.isAlive === true
        );
        
        if (availableEnemies.length > 0) {
          console.log(`🔍 ${this.id} cherche parmi ${availableEnemies.length} ennemis vivants`);
          const targetingResult = this.findTargetWithSystem(currentTick);
          
          if (targetingResult.target) {
            console.log(`🎯 ${this.id} nouvelle cible trouvée: ${targetingResult.target.id}`);
            this.setTarget(targetingResult.target);
            this.setState('moving');
            return;
          }
        }
        
        // Sinon chercher une tour
        const targetTower = this.findBestTargetTower();
        if (targetTower) {
          console.log(`🏰 ${this.id} retour vers tour ${targetTower.type}`);
          this.behavior.targetTower = targetTower;
          this.behavior.isMovingToTower = true;
          this.behavior.destination = { ...targetTower.position };
          this.behavior.currentTarget = undefined;
          this.setState('moving');
          return;
        }
        
        console.log(`🏁 ${this.id} plus de cibles - idle`);
        this.behavior.currentTarget = undefined;
        this.setState('idle');
        return;
        
      } else {
        // La cible existe encore - problème de range/cooldown
        console.log(`🔄 ${this.id} cible encore vivante - vérification range/cooldown`);
        
        const distance = this.getDistanceToTarget(this.behavior.currentTarget);
        const attackRange = this.baseStats.range;
        
        if (distance > attackRange + 0.2) {
          console.log(`🏃 ${this.id} trop loin (${distance.toFixed(2)} > ${attackRange + 0.2}) - retour mouvement`);
          this.setState('moving');
        } else {
          console.log(`⏱️ ${this.id} problème de cooldown - réinitialisation`);
          this.behavior.lastAttackTick = currentTick - Math.floor(this.attackSpeed / 2);
        }
      }
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
    
    // 🔧 Contre-attaque si pas de cible actuelle
    if (!this.behavior.currentTarget && this.isAlive && this.canAttack) {
      const attackerTarget = this.availableTargets.find(t => t.id === attacker.id);
      if (attackerTarget && attackerTarget.isAlive) {
        console.log(`🎯 ${this.id} contre-attaque ${attacker.id} !`);
        this.setTarget({
          type: attackerTarget.type,
          id: attackerTarget.id,
          position: attackerTarget.position,
          priority: 10
        });
        this.behavior.isMovingToTower = false;
        this.setState('moving');
      }
    }
    
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
  
  /**
   * 🔧 CORRIGÉ: Trouver une cible avec validation des ennemis vivants
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

    // Filtrer explicitement les ennemis vivants avant le targeting
    const aliveEnemies = this.availableTargets.filter(t => 
      t.ownerId !== this.ownerId && t.isAlive === true
    );

    console.log(`🎯 ${this.id} targeting: ${this.availableTargets.length} total, ${aliveEnemies.length} ennemis vivants`);

    if (aliveEnemies.length === 0) {
      return {
        target: null,
        confidence: 0,
        reason: 'no_alive_enemies',
        alternativeTargets: []
      };
    }

    return this.targetingSystem.findBestTarget(
      this.toTargetableEntity(),
      aliveEnemies,
      this.behavior.currentTarget || null,
      currentTick
    );
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
  
  // === MÉTHODES DE SYNCHRONISATION HP ===
  
  /**
   * Mettre à jour les HP directement depuis le CombatSystem
   */
  updateHitpoints(newHitpoints: number): void {
    const oldHp = this.currentHitpoints;
    this.currentHitpoints = Math.max(0, newHitpoints);
    
    console.log(`🔄 BaseUnit.updateHitpoints: ${this.id} ${oldHp} → ${this.currentHitpoints}`);
    
    if (this.currentHitpoints <= 0 && this.state !== 'dying' && this.state !== 'dead') {
      this.setState('dying');
      console.log(`💀 BaseUnit ${this.id} passe en état 'dying'`);
    }
  }

  /**
   * Marquer comme mort (appelé par CombatSystem)
   */
  markAsDead(): void {
    console.log(`💀 BaseUnit.markAsDead: ${this.id}`);
    this.currentHitpoints = 0;
    this.setState('dying');
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
   * 🔧 NOUVEAU: Mise à jour des cibles ET tours disponibles
   */
  updateAvailableTargets(availableTargets: ITargetableEntity[]): void {
    this.availableTargets = availableTargets;
    
    if (this.lastUpdateTick % 60 === 0) {
      console.log(`🎯 ${this.id} reçoit ${availableTargets.length} cibles disponibles`);
    }
  }
  
  /**
   * 🔧 NOUVEAU: Mise à jour des tours disponibles
   */
  updateAvailableTowers(availableTowers: ITower[]): void {
    this.availableTowers = availableTowers;
    
    if (this.lastUpdateTick % 60 === 0) {
      console.log(`🏰 ${this.id} reçoit ${availableTowers.length} tours disponibles`);
      
      // 🔧 DEBUG: Détails des tours reçues
      availableTowers.forEach((tower, i) => {
        const distance = this.calculateDistance(this.getPosition(), tower.position);
        console.log(`   Tour ${i}: ${tower.type} (${tower.ownerId}) - ${distance.toFixed(1)} tiles - ${tower.isDestroyed ? '💀' : '✅'}`);
      });
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
      lastAttackTick: this.behavior.lastAttackTick,
      isMovingToTower: this.behavior.isMovingToTower,
      targetTower: this.behavior.targetTower?.type
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
   * 🔧 DEBUG: État de combat détaillé
   */
  debugCombatState(): void {
    console.log(`🔍 DEBUG Combat State ${this.id}:`);
    console.log(`   State: ${this.state}`);
    console.log(`   IsAlive: ${this.isAlive}`);
    console.log(`   CanAttack: ${this.canAttack}`);
    console.log(`   CurrentTick: ${this.lastUpdateTick}`);
    console.log(`   LastAttackTick: ${this.behavior?.lastAttackTick || 0}`);
    console.log(`   NextAttackTick: ${this.behavior?.nextAttackTick || 0}`);
    console.log(`   AttackSpeed: ${this.attackSpeed}`);
    console.log(`   AttackRange: ${this.attackRange}`);
    console.log(`   Owner: ${this.ownerId}`);
    console.log(`   Position: (${this.x.toFixed(2)}, ${this.y.toFixed(2)})`);
    console.log(`   HP: ${this.currentHitpoints}/${this.maxHitpoints}`);
    console.log(`   IsMovingToTower: ${this.behavior?.isMovingToTower || false}`);
    console.log(`   TargetTower: ${this.behavior?.targetTower?.type || 'none'}`);
    
    if (this.behavior?.currentTarget) {
      const distance = this.getDistanceToTarget(this.behavior.currentTarget);
      console.log(`   Target: ${this.behavior.currentTarget.id} (${this.behavior.currentTarget.type})`);
      console.log(`   Distance to target: ${distance.toFixed(2)}`);
    } else {
      console.log(`   Target: none`);
    }
    
    const enemies = this.availableTargets?.filter(t => t.ownerId !== this.ownerId && t.isAlive) || [];
    const towers = this.availableTowers?.filter(t => t.ownerId !== this.ownerId && !t.isDestroyed) || [];
    console.log(`   Available enemies: ${enemies.length}`);
    console.log(`   Available towers: ${towers.length}`);
  }

  /**
   * 🔧 NOUVEAU: Debug avec pathfinding
   */
  debugTargeting(): void {
    console.log(`🔍 Debug ${this.id}:`);
    console.log(`  Position: (${this.x.toFixed(1)}, ${this.y.toFixed(1)})`);
    console.log(`  État: ${this.state}`);
    console.log(`  Cibles disponibles: ${this.availableTargets?.length || 0}`);
    console.log(`  Tours disponibles: ${this.availableTowers?.length || 0}`);
    console.log(`  Cible actuelle: ${this.behavior.currentTarget?.id || 'aucune'}`);
    console.log(`  Mouvement vers tour: ${this.behavior.isMovingToTower}`);
    console.log(`  Tour cible: ${this.behavior.targetTower?.type || 'aucune'}`);
    console.log(`  Range d'attaque: ${this.baseStats.range}`);
    console.log(`  Prochaine attaque: tick ${this.behavior.nextAttackTick} (actuel: ${this.lastUpdateTick})`);
    
    if (this.availableTargets) {
      const enemies = this.availableTargets.filter(t => t.ownerId !== this.ownerId && t.isAlive);
      console.log(`  Ennemis vivants: ${enemies.length}`);
      enemies.forEach((target, i) => {
        const distance = this.calculateDistance(this.getPosition(), target.position);
        console.log(`    Ennemi ${i}: ${target.id} (${target.position.x.toFixed(1)}, ${target.position.y.toFixed(1)}) - ${distance.toFixed(2)} tiles`);
      });
    }
    
    if (this.availableTowers) {
      const enemyTowers = this.availableTowers.filter(t => t.ownerId !== this.ownerId && !t.isDestroyed);
      console.log(`  Tours ennemies: ${enemyTowers.length}`);
      enemyTowers.forEach(tower => {
        const distance = this.calculateDistance(this.getPosition(), tower.position);
        console.log(`    Tour ${tower.type}: (${tower.position.x.toFixed(1)}, ${tower.position.y.toFixed(1)}) - ${distance.toFixed(2)} tiles`);
      });
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
    const combatant = {
      id: this.id,
      position: { x: this.x, y: this.y },
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

    return combatant;
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
