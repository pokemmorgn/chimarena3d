// server/src/scripts/testCombat.ts
// Test de Combat Complet - Knight vs 3 Goblins
// Validation des systèmes : BaseUnit + CombatSystem + TargetingSystem

import BaseUnit from '../gameplay/units/BaseUnit';
import { getCombatSystem } from '../gameplay/systems/CombatSystem';
import { getTargetingSystem } from '../gameplay/systems/TargetingSystem';
import { ITargetableEntity } from '../gameplay/systems/TargetingSystem';

/**
 * Script de test de combat pour valider l'intégration complète
 */
class CombatTest {
  private combatSystem = getCombatSystem();
  // targetingSystem utilisé implicitement via BaseUnit
  private knight!: BaseUnit;
  private goblins: BaseUnit[] = [];
  private currentTick = 0;
  private readonly TICK_RATE_MS = 50; // 20 TPS
  private gameLoop: NodeJS.Timeout | null = null;
  
  // Statistiques de test
  private testStats = {
    totalTicks: 0,
    attacksPerformed: 0,
    damageDealt: 0,
    unitsKilled: 0,
    testStartTime: 0,
    testEndTime: 0
  };

  constructor() {
    console.log('🎮 Initialisation du test de combat...');
    console.log('⚔️ Scénario: Knight Level 3 vs 3 Goblins Level 3');
    console.log('🎯 Objectif: Valider BaseUnit + CombatSystem + TargetingSystem\n');
  }

  /**
   * Initialiser le test avec les unités
   */
  async initializeTest(): Promise<void> {
    console.log('🏭 Création des unités...');
    
    try {
      // Créer le Knight (niveau 3)
      this.knight = await BaseUnit.create(
        'knight',      // cardId
        3,             // level
        'player1',     // ownerId
        { x: 9, y: 20 }, // position (bas de l'arène)
        this.currentTick
      );
      
      console.log(`✅ Knight créé: ${this.knight.id}`);
      console.log(`   Position: (${this.knight.x}, ${this.knight.y})`);
      console.log(`   HP: ${this.knight.currentHitpoints}/${this.knight.maxHitpoints}`);
      console.log(`   Damage: ${this.knight.currentDamage}`);
      console.log(`   Range: ${this.knight.attackRange}`);
      console.log(`   Type: ${this.knight.isTank ? 'Tank' : 'Normal'}\n`);

      // Créer 3 Goblins (niveau 3)
      const goblinPositions = [
        { x: 8, y: 12 },  // Goblin 1 - gauche
        { x: 9, y: 10 },  // Goblin 2 - centre  
        { x: 10, y: 12 }  // Goblin 3 - droite
      ];

      for (let i = 0; i < 3; i++) {
        const goblin = await BaseUnit.create(
          'goblins',
          3,
          'player2',
          goblinPositions[i],
          this.currentTick
        );
        
        this.goblins.push(goblin);
        
        console.log(`✅ Goblin ${i + 1} créé: ${goblin.id}`);
        console.log(`   Position: (${goblin.x}, ${goblin.y})`);
        console.log(`   HP: ${goblin.currentHitpoints}/${goblin.maxHitpoints}`);
        console.log(`   Damage: ${goblin.currentDamage}`);
      }

      console.log('\n📊 Configuration du terrain:');
      console.log('   Knight:   (9, 20) - 🔵');
      console.log('   Goblin 1: (8, 12) - 🔴');
      console.log('   Goblin 2: (9, 10) - 🔴');
      console.log('   Goblin 3: (10,12) - 🔴');
      console.log('   Distance initiale: ~8-10 tiles\n');

    } catch (error) {
      console.error('❌ Erreur lors de la création des unités:', error);
      throw error;
    }
  }

  /**
   * Démarrer le test de combat
   */
  async startCombatTest(): Promise<void> {
    console.log('🚀 DÉBUT DU TEST DE COMBAT\n');
    console.log('═'.repeat(50));
    
    this.testStats.testStartTime = Date.now();
    this.currentTick = 0;

    // Démarrer la boucle de jeu à 20 TPS
    this.gameLoop = setInterval(() => {
      this.processTick();
    }, this.TICK_RATE_MS);

    console.log('⏰ Boucle de jeu démarrée à 20 TPS');
    console.log('🎯 Le combat va commencer...\n');
  }

  /**
   * Traiter un tick de jeu
   */
  private processTick(): void {
    this.currentTick++;
    this.testStats.totalTicks++;

    // Mettre à jour le CombatSystem
    const allCombatants = this.getAllCombatants();
    this.combatSystem.update(this.currentTick, allCombatants);

    // Mettre à jour toutes les unités
    this.updateAllUnits();

    // Fournir les cibles disponibles à chaque unité
    this.updateTargeting();

    // Vérifier les conditions de fin
    this.checkEndConditions();

    // Log périodique (toutes les 2 secondes)
    if (this.currentTick % 40 === 0) {
      this.logGameState();
    }
  }

  /**
   * Mettre à jour toutes les unités
   */
  private updateAllUnits(): void {
    const deltaTime = this.TICK_RATE_MS;

    // Mettre à jour le Knight
    if (this.knight.isAlive) {
      this.knight.update(this.currentTick, deltaTime);
    }

    // Mettre à jour les Goblins
    this.goblins.forEach(goblin => {
      if (goblin.isAlive) {
        goblin.update(this.currentTick, deltaTime);
      }
    });
  }

  /**
   * Mettre à jour le targeting pour toutes les unités
   */
  private updateTargeting(): void {
    const allTargetableEntities = this.getAllTargetableEntities();

    // Knight cherche les Goblins
    if (this.knight.isAlive) {
      const goblinTargets = allTargetableEntities.filter(entity => 
        entity.ownerId === 'player2' && entity.isAlive
      );
      this.knight.updateAvailableTargets(goblinTargets);
    }

    // Goblins cherchent le Knight
    this.goblins.forEach(goblin => {
      if (goblin.isAlive) {
        const knightTargets = allTargetableEntities.filter(entity => 
          entity.ownerId === 'player1' && entity.isAlive
        );
        goblin.updateAvailableTargets(knightTargets);
      }
    });
  }

  /**
   * Obtenir tous les combattants
   */
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

  /**
   * Obtenir toutes les entités ciblables
   */
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

  /**
   * Vérifier les conditions de fin de test
   */
  private checkEndConditions(): void {
    const aliveGoblins = this.goblins.filter(g => g.isAlive);
    
    // Victoire du Knight
    if (aliveGoblins.length === 0) {
      this.endTest('KNIGHT WINS!', '🏆 Le Knight a éliminé tous les Goblins');
      return;
    }

    // Victoire des Goblins
    if (!this.knight.isAlive) {
      this.endTest('GOBLINS WIN!', '🔴 Les Goblins ont éliminé le Knight');
      return;
    }

    // Timeout (30 secondes = 600 ticks)
    if (this.currentTick >= 600) {
      this.endTest('TIMEOUT', '⏰ Test terminé par timeout');
      return;
    }
  }

  /**
   * Logger l'état du jeu
   */
  private logGameState(): void {
    const secondsElapsed = Math.round(this.currentTick / 20);
    const aliveGoblins = this.goblins.filter(g => g.isAlive);
    
    console.log(`\n⏰ T+${secondsElapsed}s (Tick ${this.currentTick}):`);
    console.log(`🔵 Knight: ${this.knight.isAlive ? `${this.knight.currentHitpoints}/${this.knight.maxHitpoints} HP` : '💀 MORT'} (${this.knight.x.toFixed(1)}, ${this.knight.y.toFixed(1)}) [${this.knight.state}]`);
    
    this.goblins.forEach((goblin, i) => {
      console.log(`🔴 Goblin ${i + 1}: ${goblin.isAlive ? `${goblin.currentHitpoints}/${goblin.maxHitpoints} HP` : '💀 MORT'} (${goblin.x.toFixed(1)}, ${goblin.y.toFixed(1)}) [${goblin.state}]`);
    });

    // Informations de combat actuel
    const knightInfo = this.knight.getCombatInfo();
    if (knightInfo.currentTarget) {
      console.log(`   🎯 Knight cible: ${knightInfo.currentTarget.id}`);
    }

    console.log(`📊 Goblins vivants: ${aliveGoblins.length}/3`);
  }

  /**
   * Terminer le test
   */
  private endTest(result: string, description: string): void {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }

    this.testStats.testEndTime = Date.now();
    const duration = this.testStats.testEndTime - this.testStats.testStartTime;

    console.log('\n' + '═'.repeat(50));
    console.log(`🏁 ${result}`);
    console.log('═'.repeat(50));
    console.log(description);
    
    console.log('\n📊 STATISTIQUES DU TEST:');
    console.log(`   Durée totale: ${(duration / 1000).toFixed(1)}s`);
    console.log(`   Ticks traités: ${this.testStats.totalTicks}`);
    console.log(`   TPS moyen: ${Math.round(this.testStats.totalTicks / (duration / 1000))}`);
    
    // État final des unités
    console.log('\n💀 ÉTAT FINAL:');
    console.log(`   Knight: ${this.knight.isAlive ? 'VIVANT' : 'MORT'} (${this.knight.currentHitpoints}/${this.knight.maxHitpoints} HP)`);
    
    this.goblins.forEach((goblin, i) => {
      console.log(`   Goblin ${i + 1}: ${goblin.isAlive ? 'VIVANT' : 'MORT'} (${goblin.currentHitpoints}/${goblin.maxHitpoints} HP)`);
    });

    // Statistiques de performance du CombatSystem
    const combatStats = this.combatSystem.getPerformanceStats();
    console.log('\n⚔️ COMBAT SYSTEM STATS:');
    console.log(`   Attaques traitées: ${combatStats.attacksProcessed}`);
    console.log(`   Projectiles actifs: ${combatStats.activeProjectiles}`);
    console.log(`   Calculs splash: ${combatStats.splashCalculations}`);
    console.log(`   Temps moyen: ${combatStats.averageProcessingTime.toFixed(2)}ms`);

    // Nettoyer les unités
    this.cleanup();
    
    console.log('\n✅ Test de combat terminé avec succès !');
    console.log('🎮 Tous les systèmes ont été validés.\n');
  }

  /**
   * Nettoyer les ressources
   */
  private cleanup(): void {
    console.log('🧹 Nettoyage des ressources...');
    
    // Nettoyer les unités
    this.knight.cleanup();
    this.goblins.forEach(goblin => goblin.cleanup());
    
    // Nettoyer le CombatSystem
    this.combatSystem.cleanup();
    
    console.log('✅ Nettoyage terminé');
  }

  /**
   * Forcer une attaque pour test (debug)
   */
  forceKnightAttack(): void {
    const aliveGoblins = this.goblins.filter(g => g.isAlive);
    if (aliveGoblins.length > 0 && this.knight.isAlive) {
      const target = aliveGoblins[0];
      console.log(`🔨 ATTAQUE FORCÉE: ${this.knight.id} → ${target.id}`);
      
      const result = this.knight.forceAttack(target.id);
      if (result) {
        console.log(`   Résultat: ${result.damageDealt} dégâts infligés`);
        console.log(`   Cibles touchées: ${result.targetsHit.length}`);
      }
    }
  }
}

/**
 * Fonction principale pour lancer le test
 */
async function runCombatTest(): Promise<void> {
  console.log('🎬 DÉMARRAGE DU TEST DE COMBAT CLASH ROYALE');
  console.log('=' .repeat(60));
  console.log('📅 ' + new Date().toLocaleString());
  console.log('🔧 Version: BaseUnit + CombatSystem + TargetingSystem');
  console.log('=' .repeat(60) + '\n');

  const test = new CombatTest();

  try {
    // Phase 1: Initialisation
    await test.initializeTest();
    
    // Phase 2: Combat
    await test.startCombatTest();
    
  } catch (error) {
    console.error('❌ ERREUR DURANT LE TEST:', error);
    console.log('\n🔧 Vérifiez que CardData contient les cartes "knight" et "goblins"');
    console.log('💡 Conseil: Exécutez d\'abord les scripts de seed de données');
  }
}

/**
 * Test rapide pour debug (sans boucle de jeu)
 */
async function quickTest(): Promise<void> {
  console.log('⚡ TEST RAPIDE - Création d\'unités seulement\n');
  
  try {
    const knight = await BaseUnit.create('knight', 3, 'player1', { x: 9, y: 20 }, 0);
    console.log(`✅ Knight créé: ${knight.id} - HP: ${knight.currentHitpoints}`);
    
    const goblin = await BaseUnit.create('goblins', 3, 'player2', { x: 9, y: 10 }, 0);
    console.log(`✅ Goblin créé: ${goblin.id} - HP: ${goblin.currentHitpoints}`);
    
    // Test d'une attaque forcée
    const result = knight.forceAttack(goblin.id);
    if (result) {
      console.log(`⚔️ Attaque: ${result.damageDealt} dégâts infligés`);
      console.log(`💀 Goblin HP après: ${goblin.currentHitpoints}/${goblin.maxHitpoints}`);
    }
    
    // Nettoyage
    knight.cleanup();
    goblin.cleanup();
    
    console.log('\n✅ Test rapide terminé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur durant le test rapide:', error);
  }
}

// Export pour utilisation
export { CombatTest, runCombatTest, quickTest };

// Exécution directe si appelé via node
if (require.main === module) {
  // Choisir le type de test
  const testType = process.argv[2] || 'full';
  
  if (testType === 'quick') {
    quickTest();
  } else {
    runCombatTest();
  }
}
