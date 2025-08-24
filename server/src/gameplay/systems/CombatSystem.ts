import { IPosition, ITarget, TargetType } from '../units/BaseUnit';
import { getTargetingSystem, ITargetableEntity } from './TargetingSystem';

/**
 * CombatSystem - Système de combat pour Clash Royale
 * Gère tous les aspects du combat : dégâts, splash, projectiles, collision
 * 100% compatible avec le système de ticks de BattleRoom (20 TPS)
 */

// Types de dégâts possibles
export type DamageType = 
  | 'physical'      // Dégâts physiques normaux
  | 'spell'         // Dégâts de sorts (ignore certaines défenses)
  | 'splash'        // Dégâts de zone
  | 'death_damage'  // Dégâts à la mort (Balloon, Giant Skeleton)
  | 'crown_tower'   // Dégâts réduits sur crown towers
  | 'building';     // Dégâts sur bâtiments uniquement

// Configuration d'une attaque
export interface IAttackConfig {
  attackerId: string;
  targetId: string;
  damage: number;
  damageType: DamageType;
  
  // Splash damage
  hasSplash?: boolean;
  splashRadius?: number;
  splashDamagePercent?: number; // 100% = full damage, 50% = half damage
  
  // Projectile (pour ranged units)
  isProjectile?: boolean;
  projectileSpeed?: number;      // tiles per second
  projectileArc?: number;        // 0 = direct, 1 = high arc (Mortar style)
  
  // Special properties
  knockback?: number;            // Push back distance
  stun?: number;                 // Stun duration in ticks
  piercing?: boolean;            // Attack passes through targets
}

// Résultat d'un combat
export interface ICombatResult {
  attackerId: string;
  primaryTargetId: string;
  damageDealt: number;
  
  // Cibles touchées (pour splash)
  targetsHit: {
    targetId: string;
    damageDealt: number;
    wasKilled: boolean;
    position: IPosition;
  }[];
  
  // Effets spéciaux
  knockbackTargets: string[];
  stunnedTargets: string[];
  
  // Métadonnées
  damageType: DamageType;
  wasCriticalHit: boolean;
  timestamp: number;
  tick: number;
}

// Configuration de projectile en vol
interface IProjectile {
  id: string;
  attackerId: string;
  targetId: string;
  startPosition: IPosition;
  targetPosition: IPosition;
  currentPosition: IPosition;
  
  // Propriétés du projectile
  speed: number;            // tiles per second
  damage: number;
  damageType: DamageType;
  splashRadius?: number;
  splashDamagePercent?: number;
  
  // État
  launchTick: number;
  expectedHitTick: number;
  isActive: boolean;
}

// Interface pour entités participant au combat
export interface ICombatant extends ITargetableEntity {
  // Défenses
  armor?: number;           // Réduction de dégâts physiques
  spellResistance?: number; // Réduction de dégâts de sorts
  shield?: number;          // HP temporaires
  
  // Capacités
  canAttack: boolean;
  attackRange: number;
  attackDamage: number;
  attackSpeed: number;      // Ticks entre attaques
  lastAttackTick: number;
  
  // État de combat
  isStunned?: boolean;
  stunEndTick?: number;
  isInvulnerable?: boolean;
  invulnerabilityEndTick?: number;
  
  // Callbacks pour événements
  onTakeDamage?: (damage: number, attacker: ICombatant, damageType: DamageType) => void;
  onDeath?: (killer: ICombatant) => void;
  onAttack?: (target: ICombatant) => void;
}

// Configuration du système de combat
interface ICombatSystemConfig {
  // Ticks et timing
  tickRate: number;                    // 20 TPS standard
  projectileUpdateInterval: number;    // Update projectiles every X ticks
  
  // Damage calculation
  enableCriticalHits: boolean;         // Activer coups critiques
  criticalChance: number;              // 5% par défaut
  criticalMultiplier: number;          // 2x dégâts
  
  // Crown tower damage reduction
  crownTowerDamageReduction: number;   // 65% des dégâts normaux
  kingTowerDamageReduction: number;    // 65% des dégâts normaux
  
  // Splash damage
  maxSplashTargets: number;            // Max 20 cibles pour performance
  splashDamageDropoff: boolean;        // Damage decreases with distance
  
  // Physics
  enableKnockback: boolean;            // Activer push back
  maxKnockbackDistance: number;        // 2 tiles maximum
  enableCollisionDetection: boolean;   // Détection de collision avancée
  
  // Performance
  maxProjectilesPerTick: number;       // Limit pour éviter lag
  combatLoggingEnabled: boolean;       // Log des combats
}

/**
 * Système de combat principal - Production Ready
 */
class CombatSystem {
  private config: ICombatSystemConfig;
  private projectiles = new Map<string, IProjectile>();
  private combatants = new Map<string, ICombatant>();
  private currentTick = 0;
  
  // Performance tracking
  private performance = {
    attacksProcessed: 0,
    projectilesActive: 0,
    splashCalculations: 0,
    averageProcessingTime: 0
  };
  
  constructor(config?: Partial<ICombatSystemConfig>) {
    this.config = {
      tickRate: 20,
      projectileUpdateInterval: 1,
      
      enableCriticalHits: false,       // Désactivé par défaut (pas dans CR)
      criticalChance: 0.05,
      criticalMultiplier: 2.0,
      
      crownTowerDamageReduction: 0.65,  // 65% comme CR
      kingTowerDamageReduction: 0.65,
      
      maxSplashTargets: 20,
      splashDamageDropoff: true,
      
      enableKnockback: true,
      maxKnockbackDistance: 2.0,
      enableCollisionDetection: true,
      
      maxProjectilesPerTick: 50,
      combatLoggingEnabled: process.env.NODE_ENV === 'development',
      
      ...config
    };
  }

  /**
   * Mettre à jour le système de combat (appelé chaque tick)
   */
  update(tick: number, combatants: Map<string, ICombatant>): void {
    const startTime = Date.now();
    this.currentTick = tick;
    this.combatants = combatants;
    
    // 1. Mettre à jour les projectiles
    if (tick % this.config.projectileUpdateInterval === 0) {
      this.updateProjectiles(tick);
    }
    
    // 2. Nettoyer les effets expirés (stun, invulnerability)
    this.updateStatusEffects(tick);
    
    // Performance monitoring
    const processingTime = Date.now() - startTime;
    this.updatePerformanceMetrics(processingTime);
    
    this.performance.projectilesActive = this.projectiles.size;
  }

  /**
   * Effectuer une attaque
   */
  performAttack(config: IAttackConfig): ICombatResult | null {
    const attacker = this.combatants.get(config.attackerId);
    const target = this.combatants.get(config.targetId);
    
    if (!attacker || !target) {
      if (this.config.combatLoggingEnabled) {
        console.warn(`Combat: Invalid attacker or target - ${config.attackerId} → ${config.targetId}`);
      }
      return null;
    }
    
    // Vérifier si l'attaquant peut attaquer
    if (!this.canAttack(attacker, target)) {
      return null;
    }
    
    // Mettre à jour le timestamp d'attaque
    attacker.lastAttackTick = this.currentTick;
    
    // Si c'est un projectile, créer le projectile au lieu d'infliger les dégâts immédiatement
    if (config.isProjectile && config.projectileSpeed) {
      return this.launchProjectile(config);
    }
    
    // Sinon, attaque instantanée (melee)
    return this.executeAttack(config);
  }

  /**
   * Lancer un projectile
   */
  private launchProjectile(config: IAttackConfig): ICombatResult {
    const attacker = this.combatants.get(config.attackerId)!;
    const target = this.combatants.get(config.targetId)!;
    
    const distance = this.calculateDistance(attacker.position, target.position);
    const flightTime = Math.round((distance / (config.projectileSpeed || 5)) * this.config.tickRate);
    
    const projectile: IProjectile = {
      id: `projectile_${this.currentTick}_${Math.random().toString(36).substr(2, 6)}`,
      attackerId: config.attackerId,
      targetId: config.targetId,
      startPosition: { ...attacker.position },
      targetPosition: { ...target.position },
      currentPosition: { ...attacker.position },
      
      speed: config.projectileSpeed || 5,
      damage: config.damage,
      damageType: config.damageType,
      splashRadius: config.splashRadius,
      splashDamagePercent: config.splashDamagePercent,
      
      launchTick: this.currentTick,
      expectedHitTick: this.currentTick + flightTime,
      isActive: true
    };
    
    this.projectiles.set(projectile.id, projectile);
    
    if (this.config.combatLoggingEnabled) {
      console.log(`🏹 Projectile launched: ${attacker.id} → ${target.id} (ETA: ${flightTime} ticks)`);
    }
    
    // Retourner résultat temporaire (le vrai résultat sera à l'impact)
    return {
      attackerId: config.attackerId,
      primaryTargetId: config.targetId,
      damageDealt: 0,
      targetsHit: [],
      knockbackTargets: [],
      stunnedTargets: [],
      damageType: config.damageType,
      wasCriticalHit: false,
      timestamp: Date.now(),
      tick: this.currentTick
    };
  }

  /**
   * Exécuter une attaque instantanée
   */
  private executeAttack(config: IAttackConfig): ICombatResult {
    const attacker = this.combatants.get(config.attackerId)!;
    const target = this.combatants.get(config.targetId)!;
    
    const result: ICombatResult = {
      attackerId: config.attackerId,
      primaryTargetId: config.targetId,
      damageDealt: 0,
      targetsHit: [],
      knockbackTargets: [],
      stunnedTargets: [],
      damageType: config.damageType,
      wasCriticalHit: false,
      timestamp: Date.now(),
      tick: this.currentTick
    };
    
    // Calculer les dégâts sur la cible principale
    const primaryDamage = this.calculateDamage(attacker, target, config.damage, config.damageType);
    const actualDamage = this.dealDamageToTarget(target, primaryDamage, config.damageType, attacker);
    
    result.damageDealt = actualDamage;
    result.targetsHit.push({
      targetId: target.id,
      damageDealt: actualDamage,
      wasKilled: target.hitpoints <= 0,
      position: { ...target.position }
    });
    
    // Gérer le splash damage
    if (config.hasSplash && config.splashRadius) {
      this.applySplashDamage(target.position, config, attacker, result);
    }
    
    // Appliquer les effets spéciaux
    this.applySpecialEffects(config, result);
    
    // Callbacks
    if (attacker.onAttack) {
      attacker.onAttack(target);
    }
    
    this.performance.attacksProcessed++;
    
    if (this.config.combatLoggingEnabled) {
      console.log(`⚔️ Attack: ${attacker.id} → ${target.id} (${actualDamage} damage)`);
    }
    
    return result;
  }

  /**
   * Calculer les dégâts finaux avec résistances
   */
  private calculateDamage(attacker: ICombatant, target: ICombatant, baseDamage: number, damageType: DamageType): number {
    let damage = baseDamage;
    
    // Coup critique (si activé)
    let isCritical = false;
    if (this.config.enableCriticalHits && Math.random() < this.config.criticalChance) {
      damage *= this.config.criticalMultiplier;
      isCritical = true;
    }
    
    // Réduction de dégâts selon le type
    switch (damageType) {
      case 'physical':
        if (target.armor) {
          damage = Math.max(1, damage - target.armor);
        }
        break;
        
      case 'spell':
        if (target.spellResistance) {
          damage *= (1 - target.spellResistance);
        }
        break;
        
      case 'crown_tower':
        // Tours couronne prennent moins de dégâts
        if (target.type === 'building' || target.isBuilding) {
          damage *= this.config.crownTowerDamageReduction;
        }
        break;
    }
    
    // Vérifier invulnérabilité
    if (target.isInvulnerable && this.currentTick < (target.invulnerabilityEndTick || 0)) {
      damage = 0;
    }
    
    return Math.round(Math.max(1, damage));
  }

  /**
   * Infliger des dégâts à une cible
   */
  private dealDamageToTarget(target: ICombatant, damage: number, damageType: DamageType, attacker: ICombatant): number {
    let actualDamage = damage;
    
    // Shield absorbe d'abord
    if (target.shield && target.shield > 0) {
      const shieldAbsorbed = Math.min(target.shield, actualDamage);
      target.shield -= shieldAbsorbed;
      actualDamage -= shieldAbsorbed;
      
      if (actualDamage <= 0) {
        return shieldAbsorbed; // Shield a tout absorbé
      }
    }
    
    // Appliquer les dégâts aux HP
    const oldHp = target.hitpoints;
    target.hitpoints = Math.max(0, target.hitpoints - actualDamage);
    const realDamage = oldHp - target.hitpoints;
    
    // Callback de dégâts
    if (target.onTakeDamage) {
      target.onTakeDamage(realDamage, attacker, damageType);
    }
    
    // Vérifier la mort
    if (target.hitpoints <= 0 && target.isAlive) {
      target.isAlive = false;
      if (target.onDeath) {
        target.onDeath(attacker);
      }
    }
    
    return realDamage;
  }

  /**
   * Appliquer les dégâts de zone (splash)
   */
  private applySplashDamage(centerPosition: IPosition, config: IAttackConfig, attacker: ICombatant, result: ICombatResult): void {
    if (!config.splashRadius || !config.splashDamagePercent) return;
    
    const splashTargets = this.findTargetsInRadius(centerPosition, config.splashRadius, attacker.ownerId, config.targetId);
    let targetsHit = 0;
    
    for (const splashTarget of splashTargets) {
      if (targetsHit >= this.config.maxSplashTargets) break;
      
      const distance = this.calculateDistance(centerPosition, splashTarget.position);
      let damageMultiplier = config.splashDamagePercent / 100;
      
      // Dropoff des dégâts avec la distance (si activé)
      if (this.config.splashDamageDropoff && distance > 0) {
        damageMultiplier *= Math.max(0.3, 1 - (distance / config.splashRadius) * 0.5);
      }
      
      const splashDamage = Math.round(config.damage * damageMultiplier);
      const actualDamage = this.calculateDamage(attacker, splashTarget, splashDamage, 'splash');
      const dealtDamage = this.dealDamageToTarget(splashTarget, actualDamage, 'splash', attacker);
      
      result.targetsHit.push({
        targetId: splashTarget.id,
        damageDealt: dealtDamage,
        wasKilled: splashTarget.hitpoints <= 0,
        position: { ...splashTarget.position }
      });
      
      targetsHit++;
    }
    
    this.performance.splashCalculations++;
  }

  /**
   * Trouver les cibles dans un rayon donné
   */
  private findTargetsInRadius(center: IPosition, radius: number, attackerOwnerId: string, excludeId?: string): ICombatant[] {
    const targets: ICombatant[] = [];
    
    for (const combatant of this.combatants.values()) {
      if (combatant.id === excludeId) continue;  // Exclure la cible principale
      if (combatant.ownerId === attackerOwnerId) continue;  // Pas friendly fire
      if (!combatant.isAlive) continue;  // Pas les morts
      
      const distance = this.calculateDistance(center, combatant.position);
      if (distance <= radius) {
        targets.push(combatant);
      }
    }
    
    return targets.sort((a, b) => {
      // Trier par distance (plus proche en premier)
      const distA = this.calculateDistance(center, a.position);
      const distB = this.calculateDistance(center, b.position);
      return distA - distB;
    });
  }

  /**
   * Appliquer les effets spéciaux (stun, knockback, etc.)
   */
  private applySpecialEffects(config: IAttackConfig, result: ICombatResult): void {
    if (!config.stun && !config.knockback) return;
    
    for (const hitInfo of result.targetsHit) {
      const target = this.combatants.get(hitInfo.targetId);
      if (!target || !target.isAlive) continue;
      
      // Stun
      if (config.stun && config.stun > 0) {
        target.isStunned = true;
        target.stunEndTick = this.currentTick + Math.round(config.stun);
        result.stunnedTargets.push(target.id);
      }
      
      // Knockback
      if (config.knockback && config.knockback > 0 && this.config.enableKnockback) {
        this.applyKnockback(target, config.knockback, result);
      }
    }
  }

  /**
   * Appliquer un knockback à une cible
   */
  private applyKnockback(target: ICombatant, knockbackForce: number, result: ICombatResult): void {
    // TODO: Implémenter le calcul de direction et mouvement forcé
    // Pour l'instant, juste marquer comme knockback
    result.knockbackTargets.push(target.id);
    
    if (this.config.combatLoggingEnabled) {
      console.log(`💨 Knockback applied to ${target.id} (force: ${knockbackForce})`);
    }
  }

  /**
   * Mettre à jour les projectiles en vol
   */
  private updateProjectiles(tick: number): void {
    const projectilesToRemove: string[] = [];
    let projectilesProcessed = 0;
    
    for (const [projectileId, projectile] of this.projectiles) {
      if (!projectile.isActive) {
        projectilesToRemove.push(projectileId);
        continue;
      }
      
      // Limite de performance
      if (projectilesProcessed >= this.config.maxProjectilesPerTick) {
        break;
      }
      
      // Vérifier si le projectile doit toucher
      if (tick >= projectile.expectedHitTick) {
        this.processProjectileHit(projectile);
        projectilesToRemove.push(projectileId);
      } else {
        // Mettre à jour la position du projectile
        this.updateProjectilePosition(projectile, tick);
      }
      
      projectilesProcessed++;
    }
    
    // Nettoyer les projectiles finis
    projectilesToRemove.forEach(id => this.projectiles.delete(id));
  }

  /**
   * Traiter l'impact d'un projectile
   */
  private processProjectileHit(projectile: IProjectile): void {
    const target = this.combatants.get(projectile.targetId);
    
    // Si la cible n'existe plus, explosion à la position cible
    const impactPosition = target?.position || projectile.targetPosition;
    
    // Créer la config d'attaque pour l'impact
    const attackConfig: IAttackConfig = {
      attackerId: projectile.attackerId,
      targetId: projectile.targetId,
      damage: projectile.damage,
      damageType: projectile.damageType,
      hasSplash: !!projectile.splashRadius,
      splashRadius: projectile.splashRadius,
      splashDamagePercent: projectile.splashDamagePercent || 100
    };
    
    if (target && target.isAlive) {
      // Impact direct
      this.executeAttack(attackConfig);
    } else if (projectile.splashRadius) {
      // Explosion à la position même si pas de cible
      const attacker = this.combatants.get(projectile.attackerId);
      if (attacker) {
        const result: ICombatResult = {
          attackerId: projectile.attackerId,
          primaryTargetId: projectile.targetId,
          damageDealt: 0,
          targetsHit: [],
          knockbackTargets: [],
          stunnedTargets: [],
          damageType: projectile.damageType,
          wasCriticalHit: false,
          timestamp: Date.now(),
          tick: this.currentTick
        };
        
        this.applySplashDamage(impactPosition, attackConfig, attacker, result);
      }
    }
    
    if (this.config.combatLoggingEnabled) {
      console.log(`💥 Projectile hit: ${projectile.id} at (${impactPosition.x}, ${impactPosition.y})`);
    }
  }

  /**
   * Mettre à jour la position d'un projectile en vol
   */
  private updateProjectilePosition(projectile: IProjectile, tick: number): void {
    const progress = (tick - projectile.launchTick) / (projectile.expectedHitTick - projectile.launchTick);
    const clampedProgress = Math.max(0, Math.min(1, progress));
    
    // Interpolation linéaire (arc sera ajouté plus tard)
    projectile.currentPosition = {
      x: projectile.startPosition.x + (projectile.targetPosition.x - projectile.startPosition.x) * clampedProgress,
      y: projectile.startPosition.y + (projectile.targetPosition.y - projectile.startPosition.y) * clampedProgress
    };
  }

  /**
   * Mettre à jour les effets de statut (stun, invulnerability, etc.)
   */
  private updateStatusEffects(tick: number): void {
    for (const combatant of this.combatants.values()) {
      // Retirer le stun expiré
      if (combatant.isStunned && tick >= (combatant.stunEndTick || 0)) {
        combatant.isStunned = false;
        combatant.stunEndTick = undefined;
      }
      
      // Retirer l'invulnérabilité expirée
      if (combatant.isInvulnerable && tick >= (combatant.invulnerabilityEndTick || 0)) {
        combatant.isInvulnerable = false;
        combatant.invulnerabilityEndTick = undefined;
      }
    }
  }

  /**
   * Vérifier si un attaquant peut attaquer une cible
   */
  private canAttack(attacker: ICombatant, target: ICombatant): boolean {
    // Vérifier état de l'attaquant
    if (!attacker.canAttack) return false;
    if (!attacker.isAlive) return false;
    if (attacker.isStunned) return false;
    
    // Vérifier état de la cible
    if (!target.isAlive) return false;
    
    // Vérifier cooldown d'attaque
    const ticksSinceLastAttack = this.currentTick - attacker.lastAttackTick;
    if (ticksSinceLastAttack < attacker.attackSpeed) return false;
    
    // Vérifier portée
    const distance = this.calculateDistance(attacker.position, target.position);
    if (distance > attacker.attackRange) return false;
    
    // Pas de friendly fire
    if (attacker.ownerId === target.ownerId) return false;
    
    return true;
  }

  /**
   * Calculer la distance entre deux positions
   */
  private calculateDistance(pos1: IPosition, pos2: IPosition): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Mettre à jour les métriques de performance
   */
  private updatePerformanceMetrics(processingTime: number): void {
    const alpha = 0.1; // Facteur de lissage
    this.performance.averageProcessingTime = 
      this.performance.averageProcessingTime * (1 - alpha) + processingTime * alpha;
  }

  // === MÉTHODES PUBLIQUES ===

  /**
   * Ajouter un combattant au système
   */
  registerCombatant(combatant: ICombatant): void {
    this.combatants.set(combatant.id, combatant);
  }

  /**
   * Retirer un combattant du système
   */
  unregisterCombatant(combatantId: string): void {
    this.combatants.delete(combatantId);
    
    // Nettoyer les projectiles qui visaient cette cible
    for (const [projectileId, projectile] of this.projectiles) {
      if (projectile.targetId === combatantId) {
        projectile.targetId = 'invalid'; // Garder pour explosion
      }
    }
  }

  /**
   * Obtenir les statistiques de performance
   */
  getPerformanceStats() {
    return {
      ...this.performance,
      activeCombatants: this.combatants.size,
      activeProjectiles: this.projectiles.size,
      currentTick: this.currentTick
    };
  }

  /**
   * Obtenir la liste des projectiles actifs (pour le client)
   */
  getActiveProjectiles(): IProjectile[] {
    return Array.from(this.projectiles.values()).filter(p => p.isActive);
  }

  /**
   * Nettoyer le système
   */
  cleanup(): void {
    this.projectiles.clear();
    this.combatants.clear();
    console.log('🧹 CombatSystem cleaned up');
  }

  /**
   * Mettre à jour la configuration
   */
  updateConfig(newConfig: Partial<ICombatSystemConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export d'une instance singleton pour utilisation globale
let combatSystemInstance: CombatSystem | null = null;

export function getCombatSystem(config?: Partial<ICombatSystemConfig>): CombatSystem {
  if (!combatSystemInstance) {
    combatSystemInstance = new CombatSystem(config);
  }
  return combatSystemInstance;
}

export { CombatSystem };
