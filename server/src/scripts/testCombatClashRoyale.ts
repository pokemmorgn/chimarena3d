// server/src/scripts/testCombatClashRoyale.ts
// Test de Combat 100% similaire à Clash Royale
import mongoose from 'mongoose';
import BaseUnit, { ITower } from '../gameplay/units/BaseUnit';
import { getCombatSystem } from '../gameplay/systems/CombatSystem';
import { ITargetableEntity } from '../gameplay/systems/TargetingSystem';

/**
 * Test de Combat authentique Clash Royale avec pathfinding vers tours
 */
class ClashRoyaleCombatTest {
  private combatSystem = getCombatSystem();
  private knight!: BaseUnit;
  private goblins: BaseUnit[] = [];
  private towers: ITower[] = [];
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
    console.log('🏰 TEST DE COMBAT CLASH ROYALE AUTHENTIQUE');
    console.log('⚔️ Scénario: Knight vs 3 Goblins avec pathfinding vers tours');
    console.log('🎯 Comportement: Combat → Pathfinding vers tours ennemies');
    console.log('📍 Map: 18x32 tiles (comme CR)\n');
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
      
      console.log('✅ MongoDB connecté avec succès\n');
      
    } catch (error) {
      console.error('❌ Erreur de connexion MongoDB:', error);
      throw error;
    }
  }

  /**
   * Vérifier les cartes dans MongoDB
   */
  async verifyCards(): Promise<void> {
    console.log('🃏 Vérification des cartes...');
    
    try {
      const CardData = (await import('../models/CardData')).default;
      
      const knight = await CardData.findOne({ id: 'knight', isEnabled: true });
      const goblins = await CardData.findOne({ id: 'goblins', isEnabled: true });
      
      if (!knight) throw new Error('Carte "knight" non trouvée');
      if (!goblins) throw new Error('Carte "goblins" non trouvée');
      
      console.log(`✅ Knight: ${knight.stats.hitpoints} HP, ${knight.stats.damage} DMG, Range: ${knight.stats.range}`);
      console.log(`✅ Goblins: ${goblins.stats.hitpoints} HP, ${goblins.stats.damage} DMG, Range: ${goblins.stats.range}\n`);
      
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des cartes:', error);
      throw error;
    }
  }

  /**
   * Créer le terrain de jeu Clash Royale
   */
  async initializeClashRoyaleArena(): Promise<void> {
    console.log('🏟️ Création de l\'arène Clash Royale...');
    
    try {
      await BaseUnit.preloadCommonCards();
      
      const { ObjectId } = await import('mongodb');
      const bluePlayerId = new ObjectId().toString();  // Joueur BAS (bleu)
      const redPlayerId = new ObjectId().toString();   // Joueur HAUT (rouge)
      
      console.log(`🔵 Joueur Bleu (BAS): ${bluePlayerId.substring(0, 8)}...`);
      console.log(`🔴 Joueur Rouge (HAUT): ${redPlayerId.substring(0, 8)}...\n`);
      
      // === CRÉATION DES TOURS (comme dans Clash Royale) ===
      this.createClashRoyaleTowers(bluePlayerId, redPlayerId);
      
      // === CRÉATION DES UNITÉS ===
      
      // Knight du joueur BLEU (spawn en bas, va vers tours rouges)
      this.knight = await BaseUnit.create(
        'knight',
        3,
        bluePlayerId,
        { x: 9, y: 24 }, // Position de spawn côté bleu
        this.currentTick
      );
      
      console.log(`🔵 Knight créé: ${this.knight.id}`);
      console.log(`   Position: (${this.knight.x}, ${this.knight.y}) - Côté BLEU`);
      console.log(`   HP: ${this.knight.currentHitpoints}/${this.knight.maxHitpoints}`);
      console.log(`   Objectif: Détruire tours ROUGES (y: 2-6)\n`);

      // 3 Goblins du joueur ROUGE (spawn en haut, vont vers tours bleues)
      const goblinPositions = [
        { x: 8, y: 8 },   // Goblin gauche
        { x: 9, y: 8 },   // Goblin centre
        { x: 10, y: 8 }   // Goblin droite
      ];

      for (let i = 0; i < 3; i++) {
        const goblin = await BaseUnit.create(
          'goblins',
          3,
          redPlayerId,
          goblinPositions[i],
          this.currentTick
        );
        
        this.goblins.push(goblin);
        
        console.log(`🔴 Goblin ${i + 1}: ${goblin.id}`);
        console.log(`   Position: (${goblin.x}, ${goblin.y}) - Côté ROUGE`);
        console.log(`   Objectif: Détruire tours BLEUES (y: 26-30)`);
      }

      console.log('\n🗺️ CARTE CLASH ROYALE:');
      console.log('   Y=2  : 🔴 Tours Rouges (King)');
      console.log('   Y=4  : 🔴 Tours Rouges (Left/Right)'); 
      console.log('   Y=8  : 🔴 Spawn Goblins');
      console.log('   Y=16 : ⚔️ Zone de combat centrale');
      console.log('   Y=24 : 🔵 Spawn Knight');
      console.log('   Y=28 : 🔵 Tours Bleues (Left/Right)');
      console.log('   Y=30 : 🔵 Tours Bleues (King)');
      
      // Mettre à jour toutes les unités avec les cibles et tours disponibles
      this.updateAllTargetsAndTowers();
      
      console.log('\n✅ Arène Clash Royale initialisée !');

    } catch (error) {
      console.error('❌ Erreur lors de la création de l\'arène:', error);
      throw error;
    }
  }

  /**
   * Créer les tours selon le layout Clash Royale
   */
  private createClashRoyaleTowers(bluePlayerId: string, redPlayerId: string): void {
    // Tours du joueur BLEU (en bas)
    const blueTowers: ITower[] = [
      {
        id: 'blue_left_tower',
        position: { x: 6, y: 28 },
        ownerId: bluePlayerId,
        isDestroyed: false,
        hitpoints: 1400,
        maxHitpoints: 1400,
        type: 'left'
      },
      {
        id: 'blue_right_tower', 
        position: { x: 12, y: 28 },
        ownerId: bluePlayerId,
        isDestroyed: false,
        hitpoints: 1400,
        maxHitpoints: 1400,
        type: 'right'
      },
      {
        id: 'blue_king_tower',
        position: { x: 9, y: 30 },
        ownerId: bluePlayerId,
        isDestroyed: false,
        hitpoints: 2600,
        maxHitpoints: 2600,
        type: 'king'
      }
    ];

    // Tours du joueur ROUGE (en haut)
    const redTowers: ITower[] = [
      {
        id: 'red_left_tower',
        position: { x: 6, y: 4 },
        ownerId: redPlayerId,
        isDestroyed: false,
        hitpoints: 1400,
        maxHitpoints: 1400,
        type: 'left'
      },
      {
        id: 'red_right_tower',
        position: { x: 12, y: 4 },
        ownerId: redPlayerId,
        isDestroyed: false,
        hitpoints: 1400,
        maxHitpoints: 1400,
        type: 'right'
      },
      {
        id: 'red_king_tower',
        position: { x: 9, y: 2 },
        ownerId: redPlayerId,
        isDestroyed: false,
        hitpoints: 2600,
        maxHitpoints: 2600,
        type: 'king'
      }
    ];

    this.towers = [...blueTowers, ...redTowers];
    
    console.log('🏰 Tours créées:');
    console.log('   🔵 Bleu: 2 Crown Towers (1400 HP) + 1 King Tower (2600 HP)');
    console.log('   🔴 Rouge: 2 Crown Towers (1400 HP) + 1 King Tower (2600 HP)');
  }

  /**
   * Mettre à jour les cibles et tours pour toutes les unités
   */
  private updateAllTargetsAndTowers(): void {
    const allTargetableEntities = this.getAllTargetableEntities();
    
    // Mettre à jour le Knight
    if (this.knight.isAlive) {
      const knightEnemies = allTargetableEntities.filter(entity => 
        entity.ownerId !== this.knight.ownerId && entity.isAlive
      );
      this.knight.updateAvailableTargets(knightEnemies);
      this.knight.updateAvailableTowers(this.towers);
    }

    // Mettre à jour les Goblins
    this.goblins.forEach(goblin => {
      if (goblin.isAlive) {
        const goblinEnemies = allTargetableEntities.filter(entity => 
          entity.ownerId !== goblin.ownerId && entity.isAlive
        );
        goblin.updateAvailableTargets(goblinEnemies);
        goblin.updateAvailableTowers(this.towers);
      }
    });
  }

  /**
   * Démarrer le combat Clash Royale
   */
  async startClashRoyaleBattle(): Promise<void> {
    console.log('\n🚀 DÉBUT DE LA BATAILLE CLASH ROYALE !');
    console.log('═'.repeat(60));
    console.log('🔵 Knight avance vers les tours ROUGES');
    console.log('🔴 Goblins avancent vers les tours BLEUES');
    console.log('⚔️ Combat quand ils se rencontrent !');
    console.log('═'.repeat(60));
    
    this.testStats.testStartTime = Date.now();

    // Démarrer la boucle de jeu à 20 TPS
    this.gameLoop = setInterval(() => {
      this.processClashRoyaleTick();
    }, this.TICK_RATE_MS);
  }

  /**
   * Traitement d'un tick de jeu Clash Royale
   */
  private processClashRoyaleTick(): void {
    this.currentTick++;
    this.testStats.totalTicks++;

    // Mettre à jour les cibles et tours disponibles
    this.updateAllTargetsAndTowers();

    // Mettre à jour le CombatSystem
    const allCombatants = this.getAllCombatants();
    this.combatSystem.update(this.currentTick, allCombatants);

    // Mettre à jour toutes les unités (IA + pathfinding)
    this.updateAllUnits();

    // Log d'état périodique
    if (this.currentTick % 40 === 0) { // Toutes les 2 secondes
      this.logClashRoyaleGameState();
    }

    // Debug détaillé toutes les 5 secondes
    if (this.currentTick % 100 === 0) {
      this.logDetailedUnitStates();
    }

    // Vérifier conditions de victoire
    this.checkVictoryConditions();

    // Timeout 60 secondes (comme une vraie partie CR)
    if (this.currentTick >= 1200) {
      this.endBattle('⏰ TIMEOUT', 'Bataille trop longue - Match nul');
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

  /**
   * Log d'état de la bataille Clash Royale
   */
  private logClashRoyaleGameState(): void {
    const seconds = Math.round(this.currentTick / 20);
    
    console.log(`\n⏰ T+${seconds}s (Tick ${this.currentTick}):`);
    console.log('━'.repeat(50));
    
    // État du Knight
    if (this.knight.isAlive) {
      const knightInfo = this.knight.getCombatInfo();
      const progress = this.calculateProgressToTower(this.knight, 'red');
      
      console.log(`🔵 KNIGHT ${this.knight.id}:`);
      console.log(`   HP: ${knightInfo.hitpoints}/${knightInfo.maxHitpoints}`);
      console.log(`   Position: (${knightInfo.position.x.toFixed(1)}, ${knightInfo.position.y.toFixed(1)})`);
      console.log(`   État: ${knightInfo.state}`);
      console.log(`   Progression vers tours rouges: ${progress.toFixed(1)}%`);
      console.log(`   Cible: ${knightInfo.currentTarget?.id || 'aucune'}`);
      console.log(`   Vers tour: ${knightInfo.isMovingToTower ? knightInfo.targetTower || 'oui' : 'non'}`);
    } else {
      console.log(`🔵 Knight: 💀 ÉLIMINÉ`);
    }
    
    // État des Goblins
    const aliveGoblins = this.goblins.filter(g => g.isAlive);
    console.log(`\n🔴 GOBLINS: ${aliveGoblins.length}/3 vivants`);
    
    aliveGoblins.forEach((goblin, i) => {
      const goblinInfo = goblin.getCombatInfo();
      const progress = this.calculateProgressToTower(goblin, 'blue');
      
      console.log(`   Goblin ${i + 1}: (${goblinInfo.position.x.toFixed(1)}, ${goblinInfo.position.y.toFixed(1)})`);
      console.log(`     État: ${goblinInfo.state}, HP: ${goblinInfo.hitpoints}/${goblinInfo.maxHitpoints}`);
      console.log(`     Progression vers tours bleues: ${progress.toFixed(1)}%`);
    });

    // Stats de combat
    const combatStats = this.combatSystem.getPerformanceStats();
    console.log(`\n📊 BATAILLE:`);
    console.log(`   Attaques: ${combatStats.attacksProcessed}`);
    console.log(`   Combattants actifs: ${combatStats.activeCombatants}`);
    console.log(`   Performance: ${combatStats.averageProcessingTime.toFixed(2)}ms`);
  }

  /**
   * Calculer le progrès vers les tours ennemies (en %)
   */
  private calculateProgressToTower(unit: BaseUnit, enemyColor: 'red' | 'blue'): number {
    const currentY = unit.y;
    const startY = enemyColor === 'red' ? 24 : 8;  // Position de départ
    const targetY = enemyColor === 'red' ? 4 : 28; // Position des tours ennemies
    
    const totalDistance = Math.abs(targetY - startY);
    const progressDistance = Math.abs(currentY - startY);
    
    return Math.min(100, (progressDistance / totalDistance) * 100);
  }

  /**
   * Log détaillé des états des unités
   */
  private logDetailedUnitStates(): void {
    console.log(`\n🔍 ÉTATS DÉTAILLÉS (Tick ${this.currentTick}):`);
    console.log('═'.repeat(60));
    
    if (this.knight.isAlive) {
      console.log('\n🔵 KNIGHT DÉTAIL:');
      this.knight.debugTargeting();
    }
    
    this.goblins.forEach((goblin, i) => {
      if (goblin.isAlive) {
        console.log(`\n🔴 GOBLIN ${i + 1} DÉTAIL:`);
        goblin.debugTargeting();
      }
    });
  }

  /**
   * Vérifier les conditions de victoire Clash Royale
   */
  private checkVictoryConditions(): void {
    const aliveGoblins = this.goblins.filter(g => g.isAlive);
    
    // Victoire par élimination de toutes les unités
    if (aliveGoblins.length === 0) {
      this.endBattle('🏆 VICTOIRE BLEUE !', 'Tous les Goblins rouges éliminés');
      return;
    }

    if (!this.knight.isAlive) {
      this.endBattle('🏆 VICTOIRE ROUGE !', 'Knight bleu éliminé');
      return;
    }

    // TODO: Vérifier destruction des tours (quand le système d'attaque des tours sera implémenté)
    // Pour l'instant, seul le combat entre unités est testé
  }

  private endBattle(result: string, description: string): void {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }

    this.testStats.testEndTime = Date.now();
    const duration = this.testStats.testEndTime - this.testStats.testStartTime;

    console.log('\n' + '═'.repeat(60));
    console.log(result);
    console.log('═'.repeat(60));
    console.log(description);
    
    console.log('\n📊 STATISTIQUES DE BATAILLE:');
    console.log(`   Durée: ${(duration / 1000).toFixed(1)}s`);
    console.log(`   Ticks: ${this.testStats.totalTicks}`);
    console.log(`   TPS moyen: ${Math.round(this.testStats.totalTicks / (duration / 1000))}`);
    
    console.log('\n💀 ÉTAT FINAL DES UNITÉS:');
    console.log(`   🔵 Knight: ${this.knight.isAlive ? 'VIVANT' : 'MORT'} (${this.knight.currentHitpoints}/${this.knight.maxHitpoints} HP)`);
    
    this.goblins.forEach((goblin, i) => {
      console.log(`   🔴 Goblin ${i + 1}: ${goblin.isAlive ? 'VIVANT' : 'MORT'} (${goblin.currentHitpoints}/${goblin.maxHitpoints} HP)`);
    });

    console.log('\n🏰 ÉTAT FINAL DES TOURS:');
    const blueTowers = this.towers.filter(t => t.ownerId === this.knight.ownerId);
    const redTowers = this.towers.filter(t => t.ownerId !== this.knight.ownerId);
    
    console.log('   🔵 Tours Bleues:');
    blueTowers.forEach(tower => {
      console.log(`     ${tower.type}: ${tower.isDestroyed ? 'DÉTRUITE' : 'INTACTE'} (${tower.hitpoints}/${tower.maxHitpoints} HP)`);
    });
    
    console.log('   🔴 Tours Rouges:');
    redTowers.forEach(tower => {
      console.log(`     ${tower.type}: ${tower.isDestroyed ? 'DÉTRUITE' : 'INTACTE'} (${tower.hitpoints}/${tower.maxHitpoints} HP)`);
    });

    const combatStats = this.combatSystem.getPerformanceStats();
    console.log('\n⚔️ STATISTIQUES DE COMBAT:');
    console.log(`   Attaques totales: ${combatStats.attacksProcessed}`);
    console.log(`   Temps de traitement moyen: ${combatStats.averageProcessingTime.toFixed(2)}ms`);
    console.log(`   Projectiles actifs: ${combatStats.activeProjectiles}`);

    this.cleanup();
    console.log('\n✅ Test de bataille Clash Royale terminé !');
    
    // Auto-exit
    setTimeout(() => {
      this.disconnect().then(() => {
        process.exit(0);
      });
    }, 3000);
  }

  private cleanup(): void {
    console.log('🧹 Nettoyage des ressources...');
    
    if (this.knight) {
      this.knight.cleanup();
    }
    
    this.goblins.forEach(goblin => {
      goblin.cleanup();
    });
    
    this.combatSystem.cleanup();
  }

  async disconnect(): Promise<void> {
    console.log('🔌 Fermeture de la connexion MongoDB...');
    await mongoose.disconnect();
    console.log('✅ Connexion fermée');
  }
}

/**
 * Fonction principale
 */
async function runClashRoyaleTest(): Promise<void> {
  console.log('🏰 TEST DE BATAILLE CLASH ROYALE AUTHENTIQUE');
  console.log('═'.repeat(70));
  console.log('📅 ' + new Date().toLocaleString());
  console.log('🎯 Objectif: Tester combat + pathfinding vers tours');
  console.log('🏟️ Terrain: Arène 18x32 avec 6 tours (comme CR)');
  console.log('⚔️ Unités: Knight (bleu) vs 3 Goblins (rouge)');
  console.log('═'.repeat(70) + '\n');

  const test = new ClashRoyaleCombatTest();

  try {
    // 1. Connecter MongoDB
    await test.connectDatabase();
    
    // 2. Vérifier les cartes
    await test.verifyCards();
    
    // 3. Créer l'arène Clash Royale
    await test.initializeClashRoyaleArena();
    
    // 4. Démarrer la bataille
    await test.startClashRoyaleBattle();
    
  } catch (error) {
    console.error('\n❌ ERREUR CRITIQUE:', error);
    await test.disconnect();
    process.exit(1);
  }
  
  // Gestionnaires d'interruption
  process.on('SIGINT', async () => {
    console.log('\n🛑 Interruption détectée...');
    await test.disconnect();
    process.exit(0);
  });

  process.on('uncaughtException', async (error) => {
    console.error('\n💥 Erreur non capturée:', error);
    await test.disconnect();
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason) => {
    console.error('\n💥 Promise rejetée:', reason);
    await test.disconnect();
    process.exit(1);
  });
}

// Lancer le test
if (require.main === module) {
  runClashRoyaleTest();
}

export { ClashRoyaleCombatTest, runClashRoyaleTest };
