// server/src/scripts/testCombatFixed.ts
// Test de Combat avec debug CombatSystem - VERSION COMPLÈTE
import mongoose from 'mongoose';
import BaseUnit from '../gameplay/units/BaseUnit';
import { getCombatSystem } from '../gameplay/systems/CombatSystem';
import { ITargetableEntity } from '../gameplay/systems/TargetingSystem';

/**
 * Script de test de combat avec debug complet du CombatSystem
 */
class CombatTestFixed {
  private combatSystem = getCombatSystem();
  private knight!: BaseUnit;
  private goblins: BaseUnit[] = [];
  private currentTick = 0;
  private readonly TICK_RATE_MS = 50; // 20 TPS
  private gameLoop: NodeJS.Timeout | null = null;
  
  private testStats = {
    totalTicks: 0,
    attacksPerformed: 0,
    damageDealt: 0,
    unitsKilled: 0,
    testStartTime: 0,
    testEndTime: 0
  };

  constructor() {
    console.log('🎮 Test de Combat avec Debug CombatSystem - VERSION COMPLÈTE');
    console.log('⚔️ Scénario: Knight Level 3 vs 3 Goblins Level 3');
    console.log('🔧 Debug activé pour identifier le problème d\'attaque\n');
  }

  /**
   * Connecter à MongoDB
   */
  async connectDatabase(): Promise<void> {
    console.log('🔗 Connexion à MongoDB...');
    
    try {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chimarena3d';
      
      await mongoose.connect(MONGODB_URI, {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      
      console.log('✅ MongoDB connecté avec succès');
      console.log(`📍 URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}\n`);
      
    } catch (error) {
      console.error('❌ Erreur de connexion MongoDB:', error);
      throw error;
    }
  }

  /**
   * Vérifier que les cartes existent
   */
  async verifyCards(): Promise<void> {
    console.log('🃏 Vérification des cartes dans MongoDB...');
    
    try {
      const CardData = (await import('../models/CardData')).default;
      
      const knight = await CardData.findOne({ id: 'knight', isEnabled: true });
      const goblins = await CardData.findOne({ id: 'goblins', isEnabled: true });
      
      if (!knight) throw new Error('Carte "knight" non trouvée dans MongoDB');
      if (!goblins) throw new Error('Carte "goblins" non trouvée dans MongoDB');
      
      console.log(`✅ Knight trouvé: ${knight.nameKey} (${knight.type})`);
      console.log(`   Stats: ${knight.stats.hitpoints} HP, ${knight.stats.damage} DMG, Range: ${knight.stats.range}`);
      
      console.log(`✅ Goblins trouvé: ${goblins.nameKey} (${goblins.type})`);
      console.log(`   Stats: ${goblins.stats.hitpoints} HP, ${goblins.stats.damage} DMG, Range: ${goblins.stats.range}\n`);
      
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des cartes:', error);
      throw error;
    }
  }

  /**
   * Initialiser le test avec positions optimisées
   */
  async initializeTest(): Promise<void> {
    console.log('🏭 Création des unités...');
    
    try {
      await BaseUnit.preloadCommonCards();
      
      // OwnerIds simples et différents
      const player1Id = 'player1'; // Knight
      const player2Id = 'player2'; // Goblins
      
      // Créer le Knight - Position optimisée
      this.knight = await BaseUnit.create(
        'knight',
        3,
        player1Id,
        { x: 9, y: 14 },
        this.currentTick
      );
      
      console.log(`✅ Knight créé: ${this.knight.id} (Owner: ${player1Id})`);
      console.log(`   Position: (${this.knight.x}, ${this.knight.y})`);
      console.log(`   HP: ${this.knight.currentHitpoints}/${this.knight.maxHitpoints}`);
      console.log(`   Damage: ${this.knight.currentDamage}`);
      console.log(`   Range: ${this.knight.attackRange}`);

      // Créer 3 Goblins - Positions proches pour combat garanti
      const goblinPositions = [
        { x: 8.5, y: 11 },   // Goblin 1 - gauche  (~3 tiles du Knight)
        { x: 9, y: 11 },     // Goblin 2 - centre  (~3 tiles du Knight)
        { x: 9.5, y: 11 }    // Goblin 3 - droite  (~3 tiles du Knight)
      ];

      for (let i = 0; i < 3; i++) {
        const goblin = await BaseUnit.create(
          'goblins',
          3,
          player2Id,
          goblinPositions[i],
          this.currentTick
        );
        
        this.goblins.push(goblin);
        
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
   * Démarrer le test de combat
   */
  async startCombatTest(): Promise<void> {
    console.log('\n🚀 DÉBUT DU COMBAT !');
    console.log('═'.repeat(50));
    
    this.testStats.testStartTime = Date.now();

    // Démarrer la boucle de jeu
    this.gameLoop = setInterval(() => {
      this.processTick();
    }, this.TICK_RATE_MS);

    console.log('⏰ Combat en cours à 20 TPS...\n');
  }

  /**
   * Traiter un tick de jeu avec debug CombatSystem
   */
  private processTick(): void {
    this.currentTick++;
    this.testStats.totalTicks++;

    // Mettre à jour le targeting à chaque tick
    this.updateTargeting();

    // Mettre à jour le CombatSystem avec debug
    const allCombatants = this.getAllCombatants();
    
    // Debug du CombatSystem toutes les 5 secondes
    if (this.currentTick % 100 === 0) {
      console.log(`\n🔍 DEBUG COMBAT SYSTEM (Tick ${this.currentTick}):`);
      this.combatSystem.debugCombatants();
    }
    
    this.combatSystem.update(this.currentTick, allCombatants);

    // Mettre à jour toutes les unités
    this.updateAllUnits();

    // Debug détaillé toutes les 1 seconde
    if (this.currentTick % 20 === 0) {
      this.logDetailedGameState();
    }

    // Vérifier fin de combat
    this.checkEndConditions();

    // Test de debug après 3 secondes si 0 attaques
    if (this.currentTick === 60 && this.combatSystem.getPerformanceStats().attacksProcessed === 0) {
      console.log('\n🧪 PAS DE COMBAT DÉTECTÉ - DEBUG COMPLET:');
      this.debugAllCombatStates();
      this.testForcedCombat();
    }
  }

  private updateAllUnits(): void {
    if (this.knight.isAlive) {
      this.knight.update(this.currentTick, this.TICK_RATE_MS);
    }

    this.goblins.forEach(goblin => {
      if (goblin.isAlive) {
        goblin.update(this.currentTick, this.TICK_RATE_MS);
      }
    });
  }

  /**
   * Mettre à jour le targeting à chaque tick
   */
  private updateTargeting(): void {
    const allTargetableEntities = this.getAllTargetableEntities();
    
    // Debug périodique
    if (this.currentTick % 60 === 0) {
      console.log(`🎯 Mise à jour targeting: ${allTargetableEntities.length} entités disponibles`);
    }

    // Knight cherche les Goblins
    if (this.knight.isAlive) {
      const goblinTargets = allTargetableEntities.filter(entity => 
        entity.ownerId !== this.knight.ownerId && entity.isAlive
      );
      
      if (this.currentTick % 60 === 0) {
        console.log(`🔵 Knight: ${goblinTargets.length} cibles Goblin disponibles`);
      }
      
      this.knight.updateAvailableTargets(goblinTargets);
      
      // Debug détaillé du Knight toutes les 2 secondes
      if (this.currentTick % 40 === 0) {
        this.knight.debugTargeting();
      }
    }

    // Goblins cherchent le Knight
    this.goblins.forEach((goblin, index) => {
      if (goblin.isAlive) {
        const knightTargets = allTargetableEntities.filter(entity => 
          entity.ownerId !== goblin.ownerId && entity.isAlive
        );
        
        if (this.currentTick % 60 === 0) {
          console.log(`🔴 Goblin ${index + 1}: ${knightTargets.length} cibles Knight disponibles`);
        }
        
        goblin.updateAvailableTargets(knightTargets);
      }
    });
  }

  private getAllCombatants(): Map<string, any> {
    const combatants = new Map();

    if (this.knight.isAlive) {
      combatants.set(this.knight.id, this.knight.toCombatant());
    }

    this.goblins.forEach(goblin => {
      if (goblin.isAlive) {
        combatants.set(goblin.id, goblin.toCombatant());
      }
    });

    return combatants;
  }

  private getAllTargetableEntities(): ITargetableEntity[] {
    const entities: ITargetableEntity[] = [];

    if (this.knight.isAlive) {
      entities.push(this.knight.toTargetableEntity());
    }

    this.goblins.forEach(goblin => {
      if (goblin.isAlive) {
        entities.push(goblin.toTargetableEntity());
      }
    });

    return entities;
  }

  private checkEndConditions(): void {
    const aliveGoblins = this.goblins.filter(g => g.isAlive);
    
    if (aliveGoblins.length === 0) {
      this.endTest('🏆 KNIGHT WINS!', 'Tous les Goblins éliminés');
      return;
    }

    if (!this.knight.isAlive) {
      this.endTest('🔴 GOBLINS WIN!', 'Le Knight a été éliminé');
      return;
    }

    // Timeout 30 secondes
    if (this.currentTick >= 600) {
      this.endTest('⏰ TIMEOUT', 'Combat trop long - Problème détecté');
      return;
    }
  }

  /**
   * Debug complet de l'état de combat
   */
  private debugAllCombatStates(): void {
    console.log('\n🔍 DEBUG COMPLET DES ÉTATS DE COMBAT:');
    console.log('═'.repeat(70));
    
    // Debug du Knight
    if (this.knight.isAlive) {
      console.log('\n🔵 KNIGHT DEBUG:');
      this.knight.debugCombatState();
    }
    
    // Debug des Goblins
    this.goblins.forEach((goblin, i) => {
      if (goblin.isAlive) {
        console.log(`\n🔴 GOBLIN ${i + 1} DEBUG:`);
        goblin.debugCombatState();
      }
    });
    
    console.log('\n═'.repeat(70));
  }

  /**
   * Test de combat forcé avec debug CombatSystem
   */
  private testForcedCombat(): void {
    const aliveGoblins = this.goblins.filter(g => g.isAlive);
    if (aliveGoblins.length > 0 && this.knight.isAlive) {
      console.log(`\n🧪 TEST DE COMBAT FORCÉ:`);
      console.log('─'.repeat(50));
      
      // Debug du CombatSystem avant le test
      console.log(`🔍 État du CombatSystem avant test forcé:`);
      this.combatSystem.debugCombatants();
      
      // Test: Knight attaque le premier Goblin
      console.log(`\n🔵 Test: Knight attaque ${aliveGoblins[0].id}`);
      const knightResult = this.knight.forceAttack(aliveGoblins[0].id);
      
      if (knightResult) {
        console.log(`   ✅ Knight → Goblin: ${knightResult.damageDealt} dégâts !`);
      } else {
        console.log(`   ❌ Knight → Goblin: ÉCHEC`);
      }
      
      // Test: Goblin attaque le Knight  
      console.log(`\n🔴 Test: ${aliveGoblins[0].id} attaque Knight`);
      const goblinResult = aliveGoblins[0].forceAttack(this.knight.id);
      
      if (goblinResult) {
        console.log(`   ✅ Goblin → Knight: ${goblinResult.damageDealt} dégâts !`);
      } else {
        console.log(`   ❌ Goblin → Knight: ÉCHEC`);
      }
      
      console.log('─'.repeat(50));
    }
  }

  /**
   * Log d'état détaillé avec alertes
   */
  private logDetailedGameState(): void {
    const seconds = Math.round(this.currentTick / 20);
    
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

    // Stats de combat avec alertes
    const combatStats = this.combatSystem.getPerformanceStats();
    console.log(`\n📊 COMBAT STATS:`);
    console.log(`   Attaques: ${combatStats.attacksProcessed} ${combatStats.attacksProcessed === 0 ? '❌ PROBLÈME !' : '✅'}`);
    console.log(`   Projectiles: ${combatStats.activeProjectiles}`);
    console.log(`   Combattants: ${combatStats.activeCombatants}`);
    console.log(`   Temps moyen: ${combatStats.averageProcessingTime.toFixed(2)}ms`);
    
    // Warning si combat ne fonctionne pas
    if (seconds >= 5 && combatStats.attacksProcessed === 0) {
      console.log(`\n⚠️  WARNING: Aucune attaque après ${seconds}s - Problème dans le CombatSystem !`);
      console.log(`    → Les unités sont en contact mais les attaques échouent`);
      console.log(`    → Vérifier canAttack() et performAttack() dans CombatSystem`);
    }
  }

  private endTest(result: string, description: string): void {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }

    this.testStats.testEndTime = Date.now();
    const duration = this.testStats.testEndTime - this.testStats.testStartTime;

    console.log('\n' + '═'.repeat(50));
    console.log(result);
    console.log('═'.repeat(50));
    console.log(description);
    
    console.log('\n📊 STATISTIQUES FINALES:');
    console.log(`   Durée: ${(duration / 1000).toFixed(1)}s`);
    console.log(`   Ticks: ${this.testStats.totalTicks}`);
    console.log(`   TPS moyen: ${Math.round(this.testStats.totalTicks / (duration / 1000))}`);
    
    console.log('\n💀 ÉTAT FINAL:');
    console.log(`   Knight: ${this.knight.isAlive ? 'VIVANT' : 'MORT'} (${this.knight.currentHitpoints}/${this.knight.maxHitpoints} HP)`);
    
    this.goblins.forEach((goblin, i) => {
      console.log(`   Goblin ${i + 1}: ${goblin.isAlive ? 'VIVANT' : 'MORT'} (${goblin.currentHitpoints}/${goblin.maxHitpoints} HP)`);
    });

    const combatStats = this.combatSystem.getPerformanceStats();
    console.log('\n⚔️ COMBAT STATS FINALES:');
    console.log(`   Attaques totales: ${combatStats.attacksProcessed}`);
    console.log(`   Projectiles max: ${combatStats.activeProjectiles}`);
    console.log(`   Temps processing: ${combatStats.averageProcessingTime.toFixed(2)}ms`);

    // Diagnostic final
    if (combatStats.attacksProcessed === 0) {
      console.log('\n🔧 DIAGNOSTIC:');
      console.log('   ❌ Aucune attaque effectuée - Problème dans CombatSystem');
      console.log('   📝 Les unités arrivent bien en contact (état attacking)');
      console.log('   📝 Mais performAttack() échoue systématiquement');
      console.log('   🎯 Vérifier: canAttack(), range, cooldown, ownerId');
    }

    this.cleanup();
    console.log('\n✅ Test terminé avec debug complet !');
    
    // Auto-exit après affichage des résultats
    setTimeout(() => {
      this.disconnect().then(() => {
        process.exit(0);
      });
    }, 2000);
  }

  private cleanup(): void {
    console.log('🧹 Nettoyage...');
    
    if (this.knight) {
      this.knight.cleanup();
    }
    
    this.goblins.forEach(goblin => {
      goblin.cleanup();
    });
    
    this.combatSystem.cleanup();
  }

  /**
   * Fermer la connexion MongoDB
   */
  async disconnect(): Promise<void> {
    console.log('🔌 Fermeture de la connexion MongoDB...');
    await mongoose.disconnect();
    console.log('✅ Connexion fermée');
  }
}

/**
 * Fonction principale avec gestion d'erreurs
 */
async function runFixedCombatTest(): Promise<void> {
  console.log('🎬 TEST DE COMBAT CLASH ROYALE - DEBUG COMBATSYSTEM');
  console.log('=' .repeat(70));
  console.log('📅 ' + new Date().toLocaleString());
  console.log('🔧 Objectif: Identifier pourquoi performAttack() échoue');
  console.log('🔍 Debug activé: CombatSystem, BaseUnit, Targeting');
  console.log('=' .repeat(70) + '\n');

  const test = new CombatTestFixed();

  try {
    // 1. Connecter MongoDB
    await test.connectDatabase();
    
    // 2. Vérifier les cartes
    await test.verifyCards();
    
    // 3. Initialiser le test
    await test.initializeTest();
    
    // 4. Démarrer le combat avec debug
    await test.startCombatTest();
    
  } catch (error) {
    console.error('\n❌ ERREUR CRITIQUE:', error);
    console.log('\n🔧 SUGGESTIONS DE DEBUG:');
    console.log('1. Vérifiez que MongoDB est démarré');
    console.log('2. Vérifiez que les cartes "knight" et "goblins" existent');
    console.log('3. Vérifiez les variables d\'environnement');
    console.log('4. Relancez avec NODE_ENV=development pour plus de logs');
    
    await test.disconnect();
    process.exit(1);
  }
  
  // Nettoyage en cas d'interruption manuelle
  process.on('SIGINT', async () => {
    console.log('\n🛑 Interruption manuelle détectée...');
    await test.disconnect();
    process.exit(0);
  });

  // Gestion des erreurs non capturées
  process.on('uncaughtException', async (error) => {
    console.error('\n💥 Erreur non capturée:', error);
    await test.disconnect();
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason) => {
    console.error('\n💥 Promise rejetée non gérée:', reason);
    await test.disconnect();
    process.exit(1);
  });
}

// Lancer le test si appelé directement
if (require.main === module) {
  runFixedCombatTest();
}

export { CombatTestFixed, runFixedCombatTest };
