// server/src/scripts/testCombatFixed.ts
// Test de Combat avec connexion MongoDB - VERSION CORRIGÉE
import mongoose from 'mongoose';
import BaseUnit from '../gameplay/units/BaseUnit';
import { getCombatSystem } from '../gameplay/systems/CombatSystem';
import { ITargetableEntity } from '../gameplay/systems/TargetingSystem';

/**
 * Script de test de combat avec toutes les corrections
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
    console.log('🎮 Test de combat avec connexion MongoDB - VERSION CORRIGÉE...');
    console.log('⚔️ Scénario: Knight Level 3 vs 3 Goblins Level 3\n');
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
   * 🔧 CORRIGÉ: Initialiser le test avec positions optimisées
   */
  async initializeTest(): Promise<void> {
    console.log('🏭 Création des unités...');
    
    try {
      await BaseUnit.preloadCommonCards();
      
      // 🔧 CORRECTION CRITIQUE: OwnerIds simples et différents
      const player1Id = 'player1'; // Knight
      const player2Id = 'player2'; // Goblins
      
      // 🔧 Créer le Knight - Position optimisée
      this.knight = await BaseUnit.create(
        'knight',
        3,
        player1Id,
        { x: 9, y: 14 },  // Position rapprochée !
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
        
        // Calculer distance réelle au Knight
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
   * 🔧 CORRIGÉ: Processing tick avec targeting à chaque frame
   */
  private processTick(): void {
    this.currentTick++;
    this.testStats.totalTicks++;

    // 🔧 CORRECTION MAJEURE: Mettre à jour le targeting à CHAQUE tick
    this.updateTargeting();

    // Mettre à jour le CombatSystem
    const allCombatants = this.getAllCombatants();
    this.combatSystem.update(this.currentTick, allCombatants);

    // Mettre à jour toutes les unités
    this.updateAllUnits();

    // Debug détaillé toutes les 1 seconde
    if (this.currentTick % 20 === 0) {
      this.logDetailedGameState();
    }

    // Vérifier fin de combat
    this.checkEndConditions();

    // Test de combat forcé après 5 secondes si pas de combat naturel
    if (this.currentTick === 100 && this.combatSystem.getPerformanceStats().attacksProcessed === 0) {
      console.log('\n🧪 PAS DE COMBAT DÉTECTÉ - TEST DE COMBAT FORCÉ:');
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
   * 🔧 CORRECTION MAJEURE: Targeting mis à jour à chaque tick
   */
  private updateTargeting(): void {
    const allTargetableEntities = this.getAllTargetableEntities();
    
    // Debug périodique
    if (this.currentTick % 60 === 0) { // Toutes les 3 secondes
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
      this.endTest('⏰ TIMEOUT', 'Combat trop long');
      return;
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

    this.cleanup();
    console.log('\n✅ Test terminé avec succès !');
    
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

  /**
   * 🔧 NOUVELLE MÉTHODE: Debug manuel du targeting
   */
  debugAllUnits(): void {
    console.log('\n🔍 DEBUG COMPLET DU TARGETING:');
    console.log('═'.repeat(60));
    
    if (this.knight.isAlive) {
      console.log('\n🔵 KNIGHT DEBUG:');
      this.knight.debugTargeting();
    }
    
    this.goblins.forEach((goblin, i) => {
      if (goblin.isAlive) {
        console.log(`\n🔴 GOBLIN ${i + 1} DEBUG:`);
        goblin.debugTargeting();
      }
    });
    
    console.log('\n═'.repeat(60));
  }

  /**
   * 🔧 NOUVELLE MÉTHODE: Forcer le combat entre toutes les unités
   */
  forceAllCombat(): void {
    console.log('\n🧪 FORCE TOUS LES COMBATS:');
    
    // Knight attaque le premier Goblin vivant
    const aliveGoblins = this.goblins.filter(g => g.isAlive);
    if (this.knight.isAlive && aliveGoblins.length > 0) {
      console.log(`🔵 Knight attaque ${aliveGoblins[0].id}`);
      const result = this.knight.forceAttack(aliveGoblins[0].id);
      if (result) {
        console.log(`   ✅ Succès ! Dégâts: ${result.damageDealt}`);
      } else {
        console.log(`   ❌ Échec !`);
      }
    }
    
    // Chaque Goblin attaque le Knight
    aliveGoblins.forEach((goblin, i) => {
      if (this.knight.isAlive) {
        console.log(`🔴 Goblin ${i + 1} attaque ${this.knight.id}`);
        const result = goblin.forceAttack(this.knight.id);
        if (result) {
          console.log(`   ✅ Succès ! Dégâts: ${result.damageDealt}`);
        } else {
          console.log(`   ❌ Échec !`);
        }
      }
    });
  }
}

/**
 * Fonction principale avec gestion d'erreurs améliorée
 */
async function runFixedCombatTest(): Promise<void> {
  console.log('🎬 TEST DE COMBAT CLASH ROYALE - VERSION COMPLÈTEMENT CORRIGÉE');
  console.log('=' .repeat(70));
  console.log('📅 ' + new Date().toLocaleString());
  console.log('🔧 Corrections appliquées:');
  console.log('   • Targeting mis à jour à chaque tick');
  console.log('   • Positions optimisées pour combat rapide');
  console.log('   • OwnerIds simplifiés (player1/player2)');
  console.log('   • Marge d\'hysteresis pour éviter l\'oscillation');
  console.log('   • Debug détaillé du targeting');
  console.log('   • Test de combat forcé si pas de combat naturel');
  console.log('=' .repeat(70) + '\n');

  const test = new CombatTestFixed();

  try {
    // 1. Connecter MongoDB
    await test.connectDatabase();
    
    // 2. Vérifier les cartes
    await test.verifyCards();
    
    // 3. Initialiser le test
    await test.initializeTest();
    
    // 4. Démarrer le combat
    await test.startCombatTest();
    
    // Le test se termine automatiquement avec des conditions de fin
    
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
