// server/src/scripts/testCombatFixed.ts
// CORRECTIONS PRINCIPALES pour le targeting

/**
 * 🔧 CORRECTION MAJEURE: Mettre à jour le targeting à CHAQUE tick
 */
private updateTargeting(): void {
  const allTargetableEntities = this.getAllTargetableEntities();
  
  console.log(`🎯 Mise à jour targeting: ${allTargetableEntities.length} entités disponibles`);

  // 🔧 Knight cherche les Goblins
  if (this.knight.isAlive) {
    const goblinTargets = allTargetableEntities.filter(entity => 
      entity.ownerId !== this.knight.ownerId && entity.isAlive
    );
    
    console.log(`🔵 Knight: ${goblinTargets.length} cibles Goblin disponibles`);
    this.knight.updateAvailableTargets(goblinTargets);
    
    // Debug périodique
    if (this.currentTick % 40 === 0) {
      console.log(`🔍 Knight targeting debug:`);
      this.knight.debugTargeting();
    }
  }

  // 🔧 Goblins cherchent le Knight
  this.goblins.forEach((goblin, index) => {
    if (goblin.isAlive) {
      const knightTargets = allTargetableEntities.filter(entity => 
        entity.ownerId !== goblin.ownerId && entity.isAlive
      );
      
      if (this.currentTick % 40 === 0) {
        console.log(`🔴 Goblin ${index + 1}: ${knightTargets.length} cibles Knight disponibles`);
      }
      
      goblin.updateAvailableTargets(knightTargets);
    }
  });
}

/**
 * 🔧 CORRECTION: Utiliser des ownerIds différents et cohérents
 */
async initializeTest(): Promise<void> {
  console.log('🏭 Création des unités...');
  
  try {
    // Précharger le cache des cartes communes pour performance
    await BaseUnit.preloadCommonCards();
    
    // 🔧 CORRECTION CRITIQUE: OwnerIds différents et simples
    const player1Id = 'player1'; // Knight
    const player2Id = 'player2'; // Goblins
    
    // 🔧 Créer le Knight - Position optimisée pour combat proche
    this.knight = await BaseUnit.create(
      'knight',
      3,
      player1Id,
      { x: 9, y: 14 },  // Position plus proche !
      this.currentTick
    );
    
    console.log(`✅ Knight créé: ${this.knight.id} (Owner: ${player1Id})`);
    console.log(`   Position: (${this.knight.x}, ${this.knight.y})`);
    console.log(`   HP: ${this.knight.currentHitpoints}/${this.knight.maxHitpoints}`);
    console.log(`   Damage: ${this.knight.currentDamage}`);
    console.log(`   Range: ${this.knight.attackRange}`);

    // 🔧 Créer 3 Goblins - Positions encore plus proches !
    const goblinPositions = [
      { x: 8.5, y: 11 },   // Goblin 1 - gauche  (~3 tiles du Knight)
      { x: 9, y: 11 },     // Goblin 2 - centre  (~3 tiles du Knight)
      { x: 9.5, y: 11 }    // Goblin 3 - droite  (~3 tiles du Knight)
    ];

    for (let i = 0; i < 3; i++) {
      const goblin = await BaseUnit.create(
        'goblins',
        3,
        player2Id,  // Même ownerId pour les 3 Goblins
        goblinPositions[i],
        this.currentTick
      );
      
      this.goblins.push(goblin);
      
      // 🔧 Calculer distance réelle au Knight
      const distanceToKnight = Math.sqrt(
        Math.pow(goblin.x - this.knight.x, 2) + Math.pow(goblin.y - this.knight.y, 2)
      );
      
      console.log(`✅ Goblin ${i + 1} créé: ${goblin.id} (Owner: ${player2Id})`);
      console.log(`   Position: (${goblin.x}, ${goblin.y}) - ${distanceToKnight.toFixed(2)} tiles du Knight`);
      console.log(`   HP: ${goblin.currentHitpoints}/${goblin.maxHitpoints}`);
      console.log(`   Range: ${goblin.attackRange}`);
    }

    console.log('\n📊 Terrain de combat optimisé:');
    console.log('   🔵 Knight:   (9, 14) - Range: 1.2 tiles');
    console.log('   🔴 Goblin 1: (8.5, 11) - Range: 1.2 tiles');
    console.log('   🔴 Goblin 2: (9, 11) - Range: 1.2 tiles');
    console.log('   🔴 Goblin 3: (9.5, 11) - Range: 1.2 tiles');
    console.log(`   📏 Distance initiale: ~3 tiles (combat garanti !)`);

  } catch (error) {
    console.error('❌ Erreur lors de la création des unités:', error);
    throw error;
  }
}

/**
 * 🔧 CORRECTION: Processing tick amélioré avec debug
 */
private processTick(): void {
  this.currentTick++;
  this.testStats.totalTicks++;

  // 🔧 Mettre à jour le targeting à CHAQUE tick (crucial !)
  this.updateTargeting();

  // Mettre à jour le CombatSystem
  const allCombatants = this.getAllCombatants();
  this.combatSystem.update(this.currentTick, allCombatants);

  // Mettre à jour toutes les unités
  this.updateAllUnits();

  // 🔧 Debug détaillé toutes les 1 seconde
  if (this.currentTick % 20 === 0) {
    this.logDetailedGameState();
  }

  // Vérifier fin de combat
  this.checkEndConditions();

  // 🔧 Test de combat forcé après 5 secondes si pas de combat naturel
  if (this.currentTick === 100 && this.combatSystem.getPerformanceStats().attacksProcessed === 0) {
    console.log('\n🧪 PAS DE COMBAT DÉTECTÉ - TEST DE COMBAT FORCÉ:');
    this.testForcedCombat();
  }
}

/**
 * 🔧 NOUVELLE MÉTHODE: Test de combat forcé pour debug
 */
private testForcedCombat(): void {
  const aliveGoblins = this.goblins.filter(g => g.isAlive);
  if (aliveGoblins.length > 0) {
    console.log(`🧪 Test combat forcé: Knight attaque ${aliveGoblins[0].id}`);
    const result = this.knight.forceAttack(aliveGoblins[0].id);
    if (result) {
      console.log(`✅ Combat forcé réussi ! Dégâts: ${result.damageDealt}`);
    } else {
      console.log(`❌ Combat forcé échoué !`);
    }
  }
}

/**
 * 🔧 Log d'état détaillé pour debug
 */
private logDetailedGameState(): void {
  const seconds = Math.round(this.currentTick / 20);
  const aliveGoblins = this.goblins.filter(g => g.isAlive);
  
  console.log(`\n⏰ T+${seconds}s (Tick ${this.currentTick}):`);
  console.log('━'.repeat(50));
  
  // État détaillé du Knight
  if (this.knight.isAlive) {
    const knightInfo = this.knight.getCombatInfo();
    console.log(`🔵 KNIGHT ${this.knight.id}:`);
    console.log(`   HP: ${knightInfo.hitpoints}/${knightInfo.maxHitpoints}`);
    console.log(`   Position: (${knightInfo.position.x.toFixed(1)}, ${knightInfo.position.y.toFixed(1)})`);
    console.log(`   État: ${knightInfo.state}`);
    console.log(`   Cible: ${knightInfo.currentTarget?.id || 'aucune'}`);
    console.log(`   Peut attaquer: ${knightInfo.canAttack}`);
    console.log(`   Dernière attaque: tick ${knightInfo.lastAttackTick}`);
  } else {
    console.log(`🔵 Knight: 💀 MORT`);
  }
  
  // État détaillé des Goblins
  this.goblins.forEach((goblin, i) => {
    if (goblin.isAlive) {
      const goblinInfo = goblin.getCombatInfo();
      const distanceToKnight = this.knight.isAlive 
        ? Math.sqrt(Math.pow(goblin.x - this.knight.x, 2) + Math.pow(goblin.y - this.knight.y, 2))
        : 0;
        
      console.log(`🔴 GOBLIN ${i + 1} ${goblin.id}:`);
      console.log(`   HP: ${goblinInfo.hitpoints}/${goblinInfo.maxHitpoints}`);
      console.log(`   Position: (${goblinInfo.position.x.toFixed(1)}, ${goblinInfo.position.y.toFixed(1)})`);
      console.log(`   État: ${goblinInfo.state}`);
      console.log(`   Distance Knight: ${distanceToKnight.toFixed(2)} tiles`);
      console.log(`   Cible: ${goblinInfo.currentTarget?.id || 'aucune'}`);
    } else {
      console.log(`🔴 Goblin ${i + 1}: 💀 MORT`);
    }
  });

  // Stats de combat
  const combatStats = this.combatSystem.getPerformanceStats();
  console.log(`\n📊 COMBAT STATS:`);
  console.log(`   Attaques: ${combatStats.attacksProcessed}`);
  console.log(`   Projectiles: ${combatStats.activeProjectiles}`);
  console.log(`   Combattants: ${combatStats.activeCombatants}`);
  console.log(`   Temps moyen: ${combatStats.averageProcessingTime.toFixed(2)}ms`);
}
