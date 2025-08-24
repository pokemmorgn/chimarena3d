import { IPosition, ITarget, TargetType } from '../units/BaseUnit';

/**
 * TargetingSystem - Système de ciblage pour les unités
 * Inspiré du système de Clash Royale avec priorités et règles spécifiques
 */

// Types d'entités pouvant être ciblées
export interface ITargetableEntity {
  id: string;
  position: IPosition;
  ownerId: string;
  type: TargetType;
  isAlive: boolean;
  
  // Stats pour le targeting
  hitpoints: number;
  maxHitpoints: number;
  
  // Propriétés spéciales
  isFlying?: boolean;        // Pour air units
  isTank?: boolean;          // Pour priorité tank
  isBuilding?: boolean;      // Pour bâtiments
  mass?: number;             // Pour calculs de priorité
}

// Configuration du targeting
export interface ITargetingConfig {
  // Distances
  maxTargetingRange: number;     // Range max pour chercher (en tiles)
  retargetCooldown: number;      // Cooldown entre retargets (en ticks)
  
  // Priorités (plus haut = plus prioritaire)
  priorities: {
    buildings: number;           // Tours, cannons, etc.
    tanks: number;              // Unités avec beaucoup de HP
    lowHP: number;              // Unités blessées
    closest: number;            // Distance (inversé)
    recent: number;             // Cibles récemment acquises (malus)
  };
  
  // Règles spéciales
  preferSameTargetBonus: number; // Bonus pour garder la même cible
  switchTargetThreshold: number; // Seuil pour changer de cible
  ignoreDeadTargetTicks: number; // Ignore les cibles mortes pendant X ticks
}

// Résultat d'une recherche de cible
export interface ITargetingResult {
  target: ITarget | null;
  confidence: number;        // 0-1, confiance dans le choix
  reason: string;           // Pourquoi cette cible
  alternativeTargets: ITarget[]; // Autres cibles possibles
}

/**
 * Système de targeting principal
 */
export class TargetingSystem {
  private config: ITargetingConfig;
  private recentTargets: Map<string, number> = new Map(); // targetId -> tick
  private targetHistory: Map<string, string[]> = new Map(); // attackerId -> [targetIds]
  
  constructor(config?: Partial<ITargetingConfig>) {
    this.config = {
      maxTargetingRange: 15,
      retargetCooldown: 20, // 1 seconde à 20 TPS
      
      priorities: {
        buildings: 8,
        tanks: 3,
        lowHP: 6,
        closest: 5,
        recent: -2  // Malus pour éviter de retargeter trop souvent
      },
      
      preferSameTargetBonus: 4,
      switchTargetThreshold: 0.3,
      ignoreDeadTargetTicks: 40, // 2 secondes
      
      ...config
    };
  }

  /**
   * Trouver la meilleure cible pour une unité
   */
  findBestTarget(
    attacker: ITargetableEntity,
    availableTargets: ITargetableEntity[],
    currentTarget: ITarget | null,
    currentTick: number
  ): ITargetingResult {
    
    // Filtrer les cibles valides
    const validTargets = this.filterValidTargets(attacker, availableTargets);
    
    if (validTargets.length === 0) {
      return {
        target: null,
        confidence: 0,
        reason: 'no_valid_targets',
        alternativeTargets: []
      };
    }
    
    // Évaluer chaque cible
    const evaluatedTargets = validTargets.map(target => ({
      target: this.entityToTarget(target),
      score: this.evaluateTarget(attacker, target, currentTarget, currentTick),
      entity: target
    })).sort((a, b) => b.score - a.score);
    
    const bestTarget = evaluatedTargets[0];
    const confidence = this.calculateConfidence(bestTarget.score, evaluatedTargets);
    
    // Vérifier si on doit changer de cible
    if (currentTarget && !this.shouldSwitchTarget(currentTarget, bestTarget.target, confidence)) {
      return {
        target: currentTarget,
        confidence: 0.8, // Confidence moyenne pour garder la cible actuelle
        reason: 'keeping_current_target',
        alternativeTargets: evaluatedTargets.slice(0, 3).map(t => t.target)
      };
    }
    
    // Enregistrer la nouvelle cible
    this.recordTargetSelection(attacker.id, bestTarget.target.id, currentTick);
    
    return {
      target: bestTarget.target,
      confidence,
      reason: this.getTargetingReason(bestTarget.entity, bestTarget.score),
      alternativeTargets: evaluatedTargets.slice(1, 4).map(t => t.target)
    };
  }

  /**
   * Filtrer les cibles valides selon les règles de Clash Royale
   */
  private filterValidTargets(
    attacker: ITargetableEntity,
    targets: ITargetableEntity[]
  ): ITargetableEntity[] {
    return targets.filter(target => {
      // Pas la même équipe
      if (target.ownerId === attacker.ownerId) return false;
      
      // Doit être vivante
      if (!target.isAlive || target.hitpoints <= 0) return false;
      
      // Distance maximale
      const distance = this.calculateDistance(attacker.position, target.position);
      if (distance > this.config.maxTargetingRange) return false;
      
      // Règles air/ground (à implémenter selon le type d'attaquant)
      if (attacker.type === 'unit') {
        // Les unités ground ne peuvent pas attaquer air par défaut
        // (sauf si elles ont la capacité "targets: both" dans BaseUnit)
        if (target.isFlying && !this.canTargetAir(attacker)) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Évaluer une cible avec le système de priorités
   */
  private evaluateTarget(
    attacker: ITargetableEntity,
    target: ITargetableEntity,
    currentTarget: ITarget | null,
    currentTick: number
  ): number {
    let score = 0;
    
    // 1. Distance (plus proche = meilleur)
    const distance = this.calculateDistance(attacker.position, target.position);
    const distanceScore = Math.max(0, 10 - distance) * this.config.priorities.closest;
    score += distanceScore;
    
    // 2. Type de cible (bâtiments prioritaires)
    if (target.isBuilding) {
      score += this.config.priorities.buildings;
    }
    
    // 3. HP bas (finir les unités blessées)
    const hpPercent = target.hitpoints / target.maxHitpoints;
    if (hpPercent < 0.5) {
      score += this.config.priorities.lowHP * (1 - hpPercent);
    }
    
    // 4. Tanks (unités avec beaucoup de HP)
    if (target.isTank || target.maxHitpoints > 1000) {
      score += this.config.priorities.tanks;
    }
    
    // 5. Bonus pour garder la même cible
    if (currentTarget && currentTarget.id === target.id) {
      score += this.config.preferSameTargetBonus;
    }
    
    // 6. Malus pour cibles récemment ciblées
    const recentTargetTick = this.recentTargets.get(target.id);
    if (recentTargetTick && currentTick - recentTargetTick < this.config.ignoreDeadTargetTicks) {
      score += this.config.priorities.recent;
    }
    
    // 7. Facteurs spéciaux selon le contexte
    score += this.evaluateSpecialFactors(attacker, target);
    
    return Math.max(0, score);
  }

  /**
   * Évaluer des facteurs spéciaux selon le type d'unité
   */
  private evaluateSpecialFactors(attacker: ITargetableEntity, target: ITargetableEntity): number {
    let bonus = 0;
    
    // Les unités rapides préfèrent les cibles isolées
    if (attacker.mass && attacker.mass < 2) {
      // TODO: Calculer l'isolation de la cible
      // bonus += isolationBonus;
    }
    
    // Les unités splash préfèrent les groupes
    if (this.hasSplashDamage(attacker)) {
      // TODO: Calculer la densité d'ennemis autour de la cible
      // bonus += splashPotentialBonus;
    }
    
    // Les unités de support préfèrent protéger les tanks
    if (this.isSupportUnit(attacker)) {
      // TODO: Évaluer si la cible menace nos tanks
      // bonus += supportPriorityBonus;
    }
    
    return bonus;
  }

  /**
   * Calculer la confiance dans le choix de cible
   */
  private calculateConfidence(bestScore: number, allScores: any[]): number {
    if (allScores.length === 1) return 1.0;
    
    const secondBest = allScores[1]?.score || 0;
    const gap = bestScore - secondBest;
    
    // Plus l'écart est grand, plus on est confiant
    return Math.min(1.0, Math.max(0.1, gap / 10));
  }

  /**
   * Déterminer si on doit changer de cible
   */
  private shouldSwitchTarget(
    currentTarget: ITarget,
    newTarget: ITarget,
    newConfidence: number
  ): boolean {
    // Toujours changer si la cible actuelle est la même
    if (currentTarget.id === newTarget.id) return false;
    
    // Changer si on a une très haute confiance dans la nouvelle cible
    if (newConfidence > 0.8) return true;
    
    // Changer si on dépasse le seuil
    return newConfidence > this.config.switchTargetThreshold;
  }

  /**
   * Enregistrer une sélection de cible pour l'historique
   */
  private recordTargetSelection(attackerId: string, targetId: string, tick: number): void {
    this.recentTargets.set(targetId, tick);
    
    if (!this.targetHistory.has(attackerId)) {
      this.targetHistory.set(attackerId, []);
    }
    
    const history = this.targetHistory.get(attackerId)!;
    history.push(targetId);
    
    // Garder seulement les 5 dernières cibles
    if (history.length > 5) {
      history.shift();
    }
  }

  /**
   * Obtenir la raison du choix de cible (pour debug)
   */
  private getTargetingReason(target: ITargetableEntity, score: number): string {
    if (target.isBuilding) return `building_priority_${score.toFixed(1)}`;
    if (target.hitpoints < target.maxHitpoints * 0.3) return `low_hp_${score.toFixed(1)}`;
    if (target.isTank) return `tank_target_${score.toFixed(1)}`;
    return `closest_available_${score.toFixed(1)}`;
  }

  // === MÉTHODES UTILITAIRES ===

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
      priority: entity.isBuilding ? 10 : (entity.isTank ? 5 : 1)
    };
  }

  private canTargetAir(attacker: ITargetableEntity): boolean {
    // TODO: Intégrer avec BaseUnit pour vérifier targets: 'air' | 'both'
    // Pour l'instant, supposer que seules certaines unités peuvent cibler l'air
    return false; // Par défaut, les unités ne ciblent que le sol
  }

  private hasSplashDamage(attacker: ITargetableEntity): boolean {
    // TODO: Intégrer avec BaseUnit splashDamage property
    return false; // Par défaut
  }

  private isSupportUnit(attacker: ITargetableEntity): boolean {
    // TODO: Définir les unités de support (Healer, etc.)
    return false; // Par défaut
  }

  // === MÉTHODES PUBLIQUES POUR GESTION ===

  /**
   * Nettoyer l'historique ancien (à appeler périodiquement)
   */
  cleanupHistory(currentTick: number): void {
    const cutoffTick = currentTick - (this.config.ignoreDeadTargetTicks * 10);
    
    for (const [targetId, tick] of this.recentTargets) {
      if (tick < cutoffTick) {
        this.recentTargets.delete(targetId);
      }
    }
  }

  /**
   * Obtenir les statistiques du targeting
   */
  getStats(): any {
    return {
      recentTargetsCount: this.recentTargets.size,
      trackingHistory: this.targetHistory.size,
      config: this.config
    };
  }

  /**
   * Mettre à jour la configuration
   */
  updateConfig(newConfig: Partial<ITargetingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export d'une instance singleton pour utilisation globale
let targetingSystemInstance: TargetingSystem | null = null;

export function getTargetingSystem(config?: Partial<ITargetingConfig>): TargetingSystem {
  if (!targetingSystemInstance) {
    targetingSystemInstance = new TargetingSystem(config);
  }
  return targetingSystemInstance;
}

export { TargetingSystem };
