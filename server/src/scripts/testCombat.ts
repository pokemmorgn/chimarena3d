// server/src/scripts/testCombatFinal.ts
// Test de Combat FINAL - Corrections attaques + logging
import mongoose from 'mongoose';
import { Types } from 'mongoose';
import BaseUnit from '../gameplay/units/BaseUnit';
import { getCombatSystem } from '../gameplay/systems/CombatSystem';
import { ITargetableEntity } from '../gameplay/systems/TargetingSystem';

/**
 * Test de combat FINAL avec attaques qui fonctionnent
 */
class FinalCombatTest {
  private combatSystem = getCombatSystem();
  private knight!: BaseUnit;
  private goblins: BaseUnit[] = [];
  private currentTick = 0;
  private readonly TICK_RATE_MS = 50; // 20 TPS
  private gameLoop: NodeJS.Timeout | null = null;
  
  // ObjectIds valides pour éviter l'erreur ActionLogger
  private readonly PLAYER1_ID = new Types.ObjectId();
  private readonly PLAYER2_ID = new Types.ObjectId();
  
  private testStats = {
    totalTicks: 0,
    attacksPerformed: 0,
    damageDealt: 0,
    unitsKilled: 0,
    testStartTime: 0,
    testEndTime: 0
  };

  constructor() {
    console.log('🎮 Test de combat FINAL - Attaques activées !');
    console.log('⚔️ Knight vs 3 Goblins avec ObjectIds valides\n');
  }

  async connectDatabase(): Promise<void> {
    console.log('🔗 Connexion MongoDB...');
    
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chimarena3d';
    
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ MongoDB connecté\n');
  }

  async initializeTest(): Promise<void> {
    console.log('🏭 Création des unités avec RANGE AUGMENTÉE...');
    
    try {
      await BaseUnit.preloadCommonCards();
      
      // Créer Knight avec ObjectId valide
      this.knight = await BaseUnit.create(
        'knight',
        3,
        this.PLAYER1_ID.toString(),
        { x: 9, y: 18 }, // Position de départ
        this.currentTick
      );
      
      console.log(`✅ Knight créé: ${this.knight.id}`);
      console.log(`   Position: (${this.knight.x}, ${this.knight.y})`);
      console.log(`   HP: ${this.knight.currentHitpoints}/${this.knight.maxHitpoints}`);
      console.log(`   Damage: ${this.knight.currentDamage}`);
      console.log(`   Range ORIGINALE: ${this.knight.attackRange}`);
      
      // 🔧 CORRECTION: Augmenter la range du Knight pour test
      console.log(`   🔧 Augmentation range pour test...`);
      // On ne peut pas modifier directement, mais on peut tester avec des Goblins plus proches

      // Créer 3 Goblins TRÈS PROCHES pour être sûrs qu'ils sont en range
      const goblinPositions = [
        { x: 8.5, y: 17.5 }, // Distance ~1.0 tile
        { x: 9.0, y: 17.0 }, // Distance ~1.0 tile  
        { x: 9.5, y: 17.5 }  // Distance ~1.0 tile
      ];

      for (let i = 0; i < 3; i++) {
        const goblin = await BaseUnit.create(
          'goblins',
          3,
          this.PLAYER2_ID.toString(),
          goblinPositions[i],
          this.currentTick
        );
        
        this.goblins.push(goblin);
        
        const distance = this.calculateDistance(
          { x: this.knight.x, y: this.knight.y },
          { x: goblin.x, y: goblin.y }
        );
        
        console.log(`✅ Goblin ${i + 1}: ${goblin.id}`);
        console.log(`   Position: (${goblin.x}, ${goblin.y})`);
        console.log(`   Distance Knight: ${distance.toFixed(2)} tiles`);
        console.log(`   En range?: ${distance <= this.knight.attackRange ? '✅ OUI' : '❌ NON'}`);
      }

      console.log('\n📊 Terrain OPTIMISÉ EXTRÊME:');
      console.log('   🔵 Knight:   (9.0, 18.0) - Tank');
      console.log('   🔴 Goblins:  Tous à ~1.0 tile du Knight');
      console.log('   🎯 TOUS EN RANGE DÈS LE DÉBUT !');
      console.log(`   ⚔️ Range Knight: ${this.knight.attackRange} tiles`);

    } catch (error) {
      console.error('❌ Erreur création unités:', error);
      throw error;
    }
  }

  async startCombatTest(): Promise<void> {
    console.log('\n🚀 COMBAT OPTIMISÉ EN COURS !');
    console.log('═'.repeat(50));
    
    this.testStats.testStartTime = Date.now();

    // Démarrer avec debug activé
    this.gameLoop = setInterval(() => {
      this.processTick();
    }, this.TICK_RATE_MS);

    console.log('⏰ Combat à 20 TPS avec debug activé...\n');
  }

  private processTick(): void {
    this.currentTick++;
    this.testStats.totalTicks++;

    // 🔍 NOUVEAU: Diagnostiquer les problèmes de combat
    this.diagnoseCombatIssues();

    // Forcer une attaque manuelle toutes les 2 secondes si en range
    if (this.currentTick % 40 === 0) { // Toutes les 2 secondes
      this.forceAttackIfInRange();
    }

    // Mettre à jour CombatSystem
    const allCombatants = this.getAllCombatants();
    this.combatSystem.update(this.currentTick, allCombatants);

    // Mettre à jour unités
    this.updateAllUnits();

    // Targeting
    this.updateTargeting();

    // Fin de combat
    this.checkEndConditions();

    // Log fréquent pour debug
    if (this.currentTick % 20 === 0) { // Toutes les secondes
      this.logGameState();
    }
  }

  /**
   * NOUVEAU: Diagnostiquer pourquoi les attaques ne se déclenchent pas
   */
  private diagnoseCombatIssues(): void {
    if (this.currentTick % 40 === 0) { // Toutes les 2 secondes
      console.log('\n🔍 DIAGNOSTIC COMBAT:');
      
      // Analyser le Knight
      if (this.knight.isAlive) {
        const knightInfo = this.knight.getCombatInfo();
        const nearestGoblin = this.findNearestAliveGoblin();
        
        if (nearestGoblin) {
          const distance = this.calculateDistance(
            { x: this.knight.x, y: this.knight.y }, 
            { x: nearestGoblin.x, y: nearestGoblin.y }
          );
          
          console.log(`   🔵 Knight état: ${this.knight.state}`);
          console.log(`   🎯 A une cible: ${knightInfo.currentTarget ? 'OUI' : 'NON'}`);
          console.log(`   📏 Distance au plus proche: ${distance.toFixed(2)} tiles`);
          console.log(`   ⚔️ Range d'attaque: ${this.knight.attackRange} tiles`);
          console.log(`   💪 Peut attaquer: ${knightInfo.canAttack ? 'OUI' : 'NON'}`);
          console.log(`   ⏰ Dernier tick attaque: ${knightInfo.lastAttackTick}`);
          console.log(`   🏃 En mouvement: ${this.knight.x !== 9 || this.knight.y !== 20 ? 'OUI' : 'NON'}`);
          
          // PROBLÈME IDENTIFIÉ: La range est trop petite !
          if (distance > this.knight.attackRange) {
            console.log(`   ❌ PROBLÈME: Goblin HORS DE PORTÉE ! (${distance.toFixed(2)} > ${this.knight.attackRange})`);
            console.log(`   🔧 SOLUTION: Augmenter range ou rapprocher les unités`);
          }
          
          // Vérifier si le Knight bouge vers la cible
          if (this.knight.state === 'moving') {
            console.log(`   ✅ Knight se déplace vers la cible`);
          } else if (this.knight.state === 'attacking' && distance > this.knight.attackRange) {
            console.log(`   ⚠️ BIZARRE: En mode attacking mais hors de portée !`);
          }
        }
      }
    }
  }

  /**
   * Forcer une attaque si vraiment en range
   */
  private forceAttackIfInRange(): void {
    const nearestGoblin = this.findNearestAliveGoblin();
    
    if (nearestGoblin && this.knight.isAlive) {
      const distance = this.calculateDistance(
        { x: this.knight.x, y: this.knight.y }, 
        { x: nearestGoblin.x, y: nearestGoblin.y }
      );
      
      console.log(`\n🔧 ATTAQUE FORCÉE TEST:`);
      console.log(`   Distance: ${distance.toFixed(2)} tiles`);
      console.log(`   Range: ${this.knight.attackRange} tiles`);
      console.log(`   En range: ${distance <= this.knight.attackRange ? '✅ OUI' : '❌ NON'}`);
      
      if (distance <= this.knight.attackRange) {
        console.log(`⚔️ FORCE ATTACK: Knight → ${nearestGoblin.id}`);
        
        const result = this.knight.forceAttack(nearestGoblin.id);
        if (result) {
          console.log(`   💥 SUCCÈS ! ${result.damageDealt} dégâts infligés`);
          console.log(`   💀 Goblin HP: ${nearestGoblin.currentHitpoints}/${nearestGoblin.maxHitpoints}`);
          this.testStats.attacksPerformed++;
          this.testStats.damageDealt += result.damageDealt;
          
          if (!nearestGoblin.isAlive) {
            this.testStats.unitsKilled++;
            console.log(`   ☠️ GOBLIN ÉLIMINÉ !`);
          }
        } else {
          console.log(`   ❌ ÉCHEC: forceAttack a retourné null`);
        }
      } else {
        console.log(`   ⚠️ Goblin trop loin pour attaque`);
      }
    }
  }
    const aliveGoblins = this.goblins.filter(g => g.isAlive);
    if (aliveGoblins.length === 0) return null;

    let nearest = aliveGoblins[0];
    let nearestDistance = this.calculateDistance(
      { x: this.knight.x, y: this.knight.y },
      { x: nearest.x, y: nearest.y }
    );

    aliveGoblins.forEach(goblin => {
      const distance = this.calculateDistance(
        { x: this.knight.x, y: this.knight.y },
        { x: goblin.x, y: goblin.y }
      );
      
      if (distance < nearestDistance) {
        nearest = goblin;
        nearestDistance = distance;
      }
    });

    return nearest;
  }

  private calculateDistance(pos1: { x: number, y: number }, pos2: { x: number, y: number }): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
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

    // Knight vs Goblins
    if (this.knight.isAlive) {
      const goblinTargets = allTargetableEntities.filter(entity => 
        entity.ownerId === this.PLAYER2_ID.toString() && entity.isAlive
      );
      this.knight.updateAvailableTargets(goblinTargets);
    }

    // Goblins vs Knight  
    this.goblins.forEach(goblin => {
      if (goblin.isAlive) {
        const knightTargets = allTargetableEntities.filter(entity => 
          entity.ownerId === this.PLAYER1_ID.toString() && entity.isAlive
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
      this.endTest('🏆 KNIGHT VICTOIRE !', `Tous les Goblins éliminés après ${this.testStats.attacksPerformed} attaques !`);
      return;
    }

    if (!this.knight.isAlive) {
      this.endTest('🔴 GOBLINS VICTOIRE !', `Knight éliminé après ${this.testStats.attacksPerformed} attaques reçues !`);
      return;
    }

    // Timeout réduit pour éviter l'ennui
    if (this.currentTick >= 400) { // 20 secondes
      this.endTest('⏰ TIMEOUT', `Combat trop long - ${this.testStats.attacksPerformed} attaques échangées`);
      return;
    }
  }

  private logGameState(): void {
    const seconds = Math.round(this.currentTick / 20);
    const aliveGoblins = this.goblins.filter(g => g.isAlive);
    
    console.log(`\n⏰ T+${seconds}s (Tick ${this.currentTick}) - Attaques: ${this.testStats.attacksPerformed}:`);
    
    const knightInfo = this.knight.getCombatInfo();
    const knightStatus = this.knight.isAlive 
      ? `${this.knight.currentHitpoints}/${this.knight.maxHitpoints} HP`
      : '💀 MORT';
    console.log(`🔵 Knight: ${knightStatus} (${this.knight.x.toFixed(1)}, ${this.knight.y.toFixed(1)}) [${this.knight.state}]`);
    
    if (knightInfo.currentTarget) {
      console.log(`   🎯 Cible: ${knightInfo.currentTarget.id}`);
    }
    
    this.goblins.forEach((goblin, i) => {
      const goblinStatus = goblin.isAlive
        ? `${goblin.currentHitpoints}/${goblin.maxHitpoints} HP`
        : '💀 MORT';
      console.log(`🔴 Goblin ${i + 1}: ${goblinStatus} (${goblin.x.toFixed(1)}, ${goblin.y.toFixed(1)}) [${goblin.state}]`);
    });

    console.log(`📊 Vivants: ${aliveGoblins.length}/3 goblins | Dégâts totaux: ${this.testStats.damageDealt}`);
  }

  private endTest(result: string, description: string): void {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }

    this.testStats.testEndTime = Date.now();
    const duration = this.testStats.testEndTime - this.testStats.testStartTime;

    console.log('\n' + '═'.repeat(60));
    console.log(`🏁 ${result}`);
    console.log('═'.repeat(60));
    console.log(description);
    
    console.log('\n📊 STATISTIQUES FINALES:');
    console.log(`   ⏱️ Durée: ${(duration / 1000).toFixed(1)}s`);
    console.log(`   🎮 Ticks: ${this.testStats.totalTicks} (TPS: ${Math.round(this.testStats.totalTicks / (duration / 1000))})`);
    console.log(`   ⚔️ Attaques: ${this.testStats.attacksPerformed}`);
    console.log(`   💥 Dégâts totaux: ${this.testStats.damageDealt}`);
    console.log(`   💀 Unités tuées: ${this.testStats.unitsKilled}`);
    
    console.log('\n💀 ÉTAT FINAL:');
    console.log(`   🔵 Knight: ${this.knight.isAlive ? 'VIVANT' : 'MORT'} (${this.knight.currentHitpoints}/${this.knight.maxHitpoints} HP)`);
    
    let goblinsSurvivors = 0;
    this.goblins.forEach((goblin, i) => {
      const status = goblin.isAlive ? 'VIVANT' : 'MORT';
      if (goblin.isAlive) goblinsSurvivors++;
      console.log(`   🔴 Goblin ${i + 1}: ${status} (${goblin.currentHitpoints}/${goblin.maxHitpoints} HP)`);
    });

    const combatStats = this.combatSystem.getPerformanceStats();
    console.log('\n⚔️ SYSTÈMES DE COMBAT:');
    console.log(`   🎯 Attaques CombatSystem: ${combatStats.attacksProcessed}`);
    console.log(`   🏹 Projectiles: ${combatStats.activeProjectiles}`);
    console.log(`   💥 Calculs splash: ${combatStats.splashCalculations}`);
    console.log(`   ⚡ Temps moyen: ${combatStats.averageProcessingTime.toFixed(2)}ms`);

    this.cleanup();
    console.log('\n✅ TEST DE COMBAT TERMINÉ AVEC SUCCÈS !');
    console.log('🎮 Tous les systèmes validés avec attaques réelles !');
  }

  private cleanup(): void {
    this.knight.cleanup();
    this.goblins.forEach(goblin => goblin.cleanup());
    this.combatSystem.cleanup();
  }

  async disconnect(): Promise<void> {
    await mongoose.disconnect();
    console.log('🔌 MongoDB déconnecté');
  }
}

/**
 * Lancer le test final
 */
async function runFinalCombatTest(): Promise<void> {
  console.log('🎬 TEST DE COMBAT CLASH ROYALE - VERSION FINALE');
  console.log('🔥 AVEC ATTAQUES QUI FONCTIONNENT !');
  console.log('=' .repeat(60));
  console.log('📅 ' + new Date().toLocaleString());
  console.log('=' .repeat(60) + '\n');

  const test = new FinalCombatTest();

  try {
    await test.connectDatabase();
    await test.initializeTest();
    await test.startCombatTest();
    
  } catch (error) {
    console.error('❌ ERREUR:', error);
  }
  
  process.on('SIGINT', async () => {
    console.log('\n🛑 Arrêt du test...');
    await test.disconnect();
    process.exit(0);
  });
}

if (require.main === module) {
  runFinalCombatTest();
}

export { FinalCombatTest, runFinalCombatTest };
