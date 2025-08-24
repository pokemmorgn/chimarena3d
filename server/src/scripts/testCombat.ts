// server/src/scripts/testCombatFixed.ts
// Test de Combat avec connexion MongoDB
import mongoose from 'mongoose';
import BaseUnit from '../gameplay/units/BaseUnit';
import { getCombatSystem } from '../gameplay/systems/CombatSystem';
import { ITargetableEntity } from '../gameplay/systems/TargetingSystem';

/**
 * Script de test de combat avec connexion MongoDB
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
    console.log('🎮 Test de combat avec connexion MongoDB...');
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
      // Import dynamique pour éviter les problèmes de circular dependency
      const CardData = (await import('../models/CardData')).default;
      
      const knight = await CardData.findOne({ id: 'knight', isEnabled: true });
      const goblins = await CardData.findOne({ id: 'goblins', isEnabled: true });
      
      if (!knight) throw new Error('Carte "knight" non trouvée dans MongoDB');
      if (!goblins) throw new Error('Carte "goblins" non trouvée dans MongoDB');
      
      console.log(`✅ Knight trouvé: ${knight.nameKey} (${knight.type})`);
      console.log(`   Stats: ${knight.stats.hitpoints} HP, ${knight.stats.damage} DMG`);
      
      console.log(`✅ Goblins trouvé: ${goblins.nameKey} (${goblins.type})`);
      console.log(`   Stats: ${goblins.stats.hitpoints} HP, ${goblins.stats.damage} DMG\n`);
      
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des cartes:', error);
      throw error;
    }
  }

  /**
   * Initialiser le test avec les unités
   */
  async initializeTest(): Promise<void> {
    console.log('🏭 Création des unités...');
    
    try {
      // Précharger le cache des cartes communes pour performance
      await BaseUnit.preloadCommonCards();
      
      // Créer le Knight (niveau 3)
      this.knight = await BaseUnit.create(
        'knight',
        3,
        'player1',
        { x: 9, y: 20 },
        this.currentTick
      );
      
      console.log(`✅ Knight créé: ${this.knight.id}`);
      console.log(`   Position: (${this.knight.x}, ${this.knight.y})`);
      console.log(`   HP: ${this.knight.currentHitpoints}/${this.knight.maxHitpoints}`);
      console.log(`   Damage: ${this.knight.currentDamage}`);
      console.log(`   Range: ${this.knight.attackRange}`);

      // Créer 3 Goblins
      const goblinPositions = [
        { x: 8, y: 12 },
        { x: 9, y: 10 },
        { x: 10, y: 12 }
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
        console.log(`✅ Goblin ${i + 1} créé: ${goblin.id} (${goblin.x}, ${goblin.y}) - ${goblin.currentHitpoints} HP`);
      }

      console.log('\n📊 Terrain de combat:');
      console.log('   🔵 Knight:   (9, 20)');
      console.log('   🔴 Goblin 1: (8, 12)');
      console.log('   🔴 Goblin 2: (9, 10)');
      console.log('   🔴 Goblin 3: (10,12)');

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

    // Mettre à jour le targeting
    this.updateTargeting();

    // Vérifier fin de combat
    this.checkEndConditions();

    // Log périodique (toutes les 2 secondes)
    if (this.currentTick % 40 === 0) {
      this.logGameState();
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

  private logGameState(): void {
    const seconds = Math.round(this.currentTick / 20);
    const aliveGoblins = this.goblins.filter(g => g.isAlive);
    
    console.log(`\n⏰ T+${seconds}s (Tick ${this.currentTick}):`);
    
    const knightStatus = this.knight.isAlive 
      ? `${this.knight.currentHitpoints}/${this.knight.maxHitpoints} HP [${this.knight.state}]`
      : '💀 MORT';
    console.log(`🔵 Knight: ${knightStatus} (${this.knight.x.toFixed(1)}, ${this.knight.y.toFixed(1)})`);
    
    this.goblins.forEach((goblin, i) => {
      const goblinStatus = goblin.isAlive
        ? `${goblin.currentHitpoints}/${goblin.maxHitpoints} HP [${goblin.state}]`
        : '💀 MORT';
      console.log(`🔴 Goblin ${i + 1}: ${goblinStatus} (${goblin.x.toFixed(1)}, ${goblin.y.toFixed(1)})`);
    });

    console.log(`📊 Goblins restants: ${aliveGoblins.length}/3`);
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
    
    console.log('\n📊 STATISTIQUES:');
    console.log(`   Durée: ${(duration / 1000).toFixed(1)}s`);
    console.log(`   Ticks: ${this.testStats.totalTicks}`);
    console.log(`   TPS moyen: ${Math.round(this.testStats.totalTicks / (duration / 1000))}`);
    
    console.log('\n💀 ÉTAT FINAL:');
    console.log(`   Knight: ${this.knight.isAlive ? 'VIVANT' : 'MORT'} (${this.knight.currentHitpoints}/${this.knight.maxHitpoints} HP)`);
    
    this.goblins.forEach((goblin, i) => {
      console.log(`   Goblin ${i + 1}: ${goblin.isAlive ? 'VIVANT' : 'MORT'} (${goblin.currentHitpoints}/${goblin.maxHitpoints} HP)`);
    });

    const combatStats = this.combatSystem.getPerformanceStats();
    console.log('\n⚔️ COMBAT STATS:');
    console.log(`   Attaques: ${combatStats.attacksProcessed}`);
    console.log(`   Projectiles: ${combatStats.activeProjectiles}`);
    console.log(`   Temps moyen: ${combatStats.averageProcessingTime.toFixed(2)}ms`);

    this.cleanup();
    console.log('\n✅ Test terminé avec succès !');
  }

  private cleanup(): void {
    console.log('🧹 Nettoyage...');
    this.knight.cleanup();
    this.goblins.forEach(goblin => goblin.cleanup());
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
 * Fonction principale
 */
async function runFixedCombatTest(): Promise<void> {
  console.log('🎬 TEST DE COMBAT CLASH ROYALE - VERSION FIXE');
  console.log('=' .repeat(60));
  console.log('📅 ' + new Date().toLocaleString());
  console.log('=' .repeat(60) + '\n');

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
    
    // Attendre la fin (ou Ctrl+C)
    
  } catch (error) {
    console.error('❌ ERREUR:', error);
  }
  
  // Nettoyage en cas d'interruption
  process.on('SIGINT', async () => {
    console.log('\n🛑 Interruption détectée...');
    await test.disconnect();
    process.exit(0);
  });
}

// Lancer le test si appelé directement
if (require.main === module) {
  runFixedCombatTest();
}

export { CombatTestFixed, runFixedCombatTest };
