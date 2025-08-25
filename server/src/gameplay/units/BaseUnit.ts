// server/src/gameplay/units/BaseUnit.ts
// CORRECTIONS PRINCIPALES pour le combat

// Dans la classe BaseUnit, remplacer ces méthodes :

/**
 * Logique état idle - chercher des cibles avec TargetingSystem
 * 🔧 CORRIGÉ: Appel direct au targeting system
 */
private updateIdle(currentTick: number): void {
  // Chercher des cibles si cooldown écoulé
  if (currentTick >= this.behavior.lastRetarget + this.behavior.retargetCooldown) {
    // 🔧 CORRECTION MAJEURE: Utiliser la méthode qui fonctionne
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
 * Logique mouvement vers la cible - CORRECTIONS CRITIQUES
 */
private updateMovement(currentTick: number, deltaTime: number): void {
  if (!this.behavior.destination || !this.behavior.currentTarget) {
    console.log(`❌ ${this.id} en mouvement mais pas de destination/cible`);
    this.setState('idle');
    return;
  }

  // 🔧 CORRECTION 1: Vérifier si la cible existe toujours
  const targetExists = this.availableTargets.find(t => t.id === this.behavior.currentTarget!.id);
  if (!targetExists || !targetExists.isAlive) {
    console.log(`💀 ${this.id} cible morte ou disparue, retour idle`);
    this.behavior.currentTarget = undefined;
    this.setState('idle');
    return;
  }

  // 🔧 CORRECTION 2: Mettre à jour la position cible en temps réel
  this.behavior.currentTarget.position = targetExists.position;

  // Calculer la distance vers la CIBLE
  const targetDistance = this.getDistanceToTarget(this.behavior.currentTarget);
  
  // 🔧 CORRECTION 3: Margin pour éviter l'oscillation
  const attackRange = this.baseStats.range;
  const rangeMargin = 0.1; // Petite marge pour stabilité
  
  // Vérifier si en range d'attaque
  if (targetDistance <= attackRange + rangeMargin) {
    console.log(`⚔️ ${this.id} EN RANGE ! Distance: ${targetDistance.toFixed(2)} <= Range: ${attackRange}`);
    this.setState('attacking');
    return;
  }

  // 🔧 CORRECTION 4: Mouvement corrigé avec deltaTime propre
  const targetPos = this.behavior.currentTarget.position;
  const dx = targetPos.x - this.x;
  const dy = targetPos.y - this.y;
  const distanceToTarget = Math.sqrt(dx * dx + dy * dy);
  
  if (distanceToTarget > 0.05) { // Éviter division par 0
    // 🔧 CORRECTION 5: Vitesse en tiles/seconde convertie correctement
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
      
      // Debug de mouvement amélioré
      if (currentTick % 10 === 0) { // Log toutes les 0.5s
        console.log(`🏃 ${this.id}: (${this.x.toFixed(1)}, ${this.y.toFixed(1)}) → (${targetPos.x.toFixed(1)}, ${targetPos.y.toFixed(1)}) Dist: ${distanceToTarget.toFixed(2)}`);
      }
    } else {
      // Très proche, passer en attaque
      console.log(`🎯 ${this.id} arrivé à destination ! Distance: ${distanceToTarget.toFixed(2)}`);
      this.setState('attacking');
    }
  } else {
    console.log(`⚔️ ${this.id} déjà sur la cible !`);
    this.setState('attacking');
  }
}

/**
 * Logique d'attaque - CORRECTIONS DE STABILITÉ
 */
private updateAttacking(currentTick: number): void {
  if (!this.behavior.currentTarget) {
    console.log(`❌ ${this.id} en mode attaque mais pas de cible !`);
    this.setState('idle');
    return;
  }

  // 🔧 CORRECTION: Vérifier que la cible existe toujours
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

  // 🔧 CORRECTION: Cooldown d'attaque plus clair
  const canAttackNow = currentTick >= this.behavior.nextAttackTick;
  
  if (canAttackNow) {
    console.log(`⚔️ ${this.id} ATTAQUE ${this.behavior.currentTarget.id} ! (Distance: ${targetDistance.toFixed(2)})`);
    this.performAttackWithSystem(currentTick);
  } else {
    // Debug du cooldown moins verbeux
    const ticksRemaining = this.behavior.nextAttackTick - currentTick;
    if (ticksRemaining > 0 && currentTick % 20 === 0) { // Log toutes les 1s seulement
      console.log(`⏱️ ${this.id} cooldown: ${(ticksRemaining / 20).toFixed(1)}s`);
    }
  }
}

/**
 * Trouver une cible avec les entités disponibles - CORRECTION CRITIQUE
 */
private findTargetWithSystem(currentTick: number): ITargetingResult {
  // 🔧 PROBLÈME MAJEUR: Les availableTargets ne sont pas mis à jour !
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
    this.toTargetableEntity(),           // Cette unité convertie
    this.availableTargets,               // Toutes les cibles possibles
    this.behavior.currentTarget || null, // Cible actuelle
    currentTick                         // Tick actuel
  );
}

/**
 * 🔧 NOUVELLE MÉTHODE: Forcer la mise à jour du targeting (pour debug)
 */
public debugTargeting(): void {
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

// 🔧 MÉTHODE UTILITAIRE MANQUANTE
private calculateDistance(pos1: IPosition, pos2: IPosition): number {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
}
