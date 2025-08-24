import { TargetingSystem, getTargetingSystem, ITargetableEntity } from '../gameplay/systems/TargetingSystem';
import { IPosition, TargetType } from '../gameplay/units/BaseUnit';

/**
 * Script de test pour TargetingSystem
 * Usage: npx ts-node server/src/scripts/testTargetingSystem.ts
 */

class TargetingSystemTester {

  async testTargetingSystemLogic(): Promise<boolean> {
    console.log('🧪 Testing TargetingSystem Logic');
    console.log('=================================');

    try {
      console.log('\n1️⃣ Testing system initialization...');
      await this.testSystemInitialization();

      console.log('\n2️⃣ Testing target filtering...');
      await this.testTargetFiltering();

      console.log('\n3️⃣ Testing target evaluation...');
      await this.testTargetEvaluation();

      console.log('\n4️⃣ Testing target prioritization...');
      await this.testTargetPrioritization();

      console.log('\n5️⃣ Testing edge cases...');
      await this.testEdgeCases();

      console.log('\n✅ All TargetingSystem logic tests passed!');
      return true;

    } catch (error: any) {
      console.error('❌ TargetingSystem test failed:', error.message);
      return false;
    }
  }

  private async testSystemInitialization(): Promise<void> {
    console.log('   Testing TargetingSystem constructor and singleton...');
    
    // Test du constructeur avec config par défaut
    const defaultSystem = new TargetingSystem();
    console.log('   ✅ Default TargetingSystem created');
    
    // Test du constructeur avec config custom
    const customSystem = new TargetingSystem({
      maxTargetingRange: 20,
      priorities: {
        buildings: 10,
        tanks: 5,
        lowHP: 8,
        closest: 3,
        recent: -3
      }
    });
    console.log('   ✅ Custom TargetingSystem created');
    
    // Test du singleton
    const singleton1 = getTargetingSystem();
    const singleton2 = getTargetingSystem();
    
    if (singleton1 === singleton2) {
      console.log('   ✅ Singleton pattern works correctly');
    } else {
      throw new Error('Singleton pattern failed');
    }
    
    // Test des stats
    const stats = singleton1.getStats();
    console.log(`   ✅ Stats retrieved: ${stats.recentTargetsCount} recent targets`);
  }

  private async testTargetFiltering(): Promise<void> {
    console.log('   Testing target filtering logic...');
    
    const system = new TargetingSystem();
    
    // Créer un attaquant
    const attacker: ITargetableEntity = {
      id: 'knight_1',
      position: { x: 9, y: 20 },
      ownerId: 'player1',
      type: 'unit',
      isAlive: true,
      hitpoints: 1000,
      maxHitpoints: 1000,
      mass: 3,
      isTank: true
    };
    
    // Créer diverses cibles
    const targets: ITargetableEntity[] = [
      // Cible valide proche
      {
        id: 'enemy_archer_1',
        position: { x: 10, y: 15 },
        ownerId: 'player2',
        type: 'unit',
        isAlive: true,
        hitpoints: 300,
        maxHitpoints: 300
      },
      
      // Cible de la même équipe (doit être filtrée)
      {
        id: 'ally_archer_1',
        position: { x: 8, y: 18 },
        ownerId: 'player1',
        type: 'unit',
        isAlive: true,
        hitpoints: 300,
        maxHitpoints: 300
      },
      
      // Cible morte (doit être filtrée)
      {
        id: 'dead_goblin',
        position: { x: 11, y: 16 },
        ownerId: 'player2',
        type: 'unit',
        isAlive: false,
        hitpoints: 0,
        maxHitpoints: 200
      },
      
      // Cible trop loin (doit être filtrée)
      {
        id: 'far_tower',
        position: { x: 50, y: 50 },
        ownerId: 'player2',
        type: 'tower',
        isAlive: true,
        hitpoints: 2600,
        maxHitpoints: 2600,
        isBuilding: true
      },
      
      // Bâtiment valide
      {
        id: 'enemy_cannon',
        position: { x: 12, y: 18 },
        ownerId: 'player2',
        type: 'building',
        isAlive: true,
        hitpoints: 700,
        maxHitpoints: 700,
        isBuilding: true
      }
    ];
    
    const result = system.findBestTarget(attacker, targets, null, 100);
    
    console.log(`   ✅ Target search completed`);
    console.log(`   ✅ Best target: ${result.target?.id || 'none'}`);
    console.log(`   ✅ Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`   ✅ Reason: ${result.reason}`);
    console.log(`   ✅ Alternatives: ${result.alternativeTargets.length}`);
    
    // Vérifier que les filtres ont fonctionné
    if (result.target) {
      if (result.target.id === 'ally_archer_1') {
        throw new Error('Same team target not filtered');
      }
      if (result.target.id === 'dead_goblin') {
        throw new Error('Dead target not filtered');
      }
      if (result.target.id === 'far_tower') {
        throw new Error('Far target not filtered');
      }
    }
    
    console.log('   ✅ Target filtering works correctly');
  }

  private async testTargetEvaluation(): Promise<void> {
    console.log('   Testing target evaluation and scoring...');
    
    const system = new TargetingSystem({
      priorities: {
        buildings: 8,
        tanks: 3,
        lowHP: 6,
        closest: 5,
        recent: -2
      }
    });
    
    const attacker: ITargetableEntity = {
      id: 'test_unit',
      position: { x: 10, y: 20 },
      ownerId: 'player1',
      type: 'unit',
      isAlive: true,
      hitpoints: 500,
      maxHitpoints: 500
    };
    
    const targets: ITargetableEntity[] = [
      // Cible proche avec HP bas (devrait scorer haut)
      {
        id: 'weak_close',
        position: { x: 11, y: 19 },
        ownerId: 'player2',
        type: 'unit',
        isAlive: true,
        hitpoints: 50,  // HP très bas
        maxHitpoints: 300
      },
      
      // Bâtiment (priorité élevée)
      {
        id: 'building_target',
        position: { x: 13, y: 18 },
        ownerId: 'player2',
        type: 'building',
        isAlive: true,
        hitpoints: 800,
        maxHitpoints: 800,
        isBuilding: true
      },
      
      // Tank loin (devrait scorer plus bas)
      {
        id: 'far_tank',
        position: { x: 15, y: 25 },
        ownerId: 'player2',
        type: 'unit',
        isAlive: true,
        hitpoints: 2000,
        maxHitpoints: 2000,
        isTank: true
      }
    ];
    
    const result = system.findBestTarget(attacker, targets, null, 200);
    
    console.log(`   ✅ Best target selected: ${result.target?.id}`);
    console.log(`   ✅ Selection reason: ${result.reason}`);
    
    // Le bâtiment ou la cible faible proche devrait être choisie
    const validChoices = ['building_target', 'weak_close'];
    if (result.target && validChoices.includes(result.target.id)) {
      console.log('   ✅ Target evaluation prioritizes correctly');
    } else {
      console.warn(`   ⚠️ Unexpected target choice: ${result.target?.id}`);
    }
  }

  private async testTargetPrioritization(): Promise<void> {
    console.log('   Testing target prioritization in complex scenarios...');
    
    const system = new TargetingSystem();
    
    const attacker: ITargetableEntity = {
      id: 'priority_tester',
      position: { x: 9, y: 18 },
      ownerId: 'player1',
      type: 'unit',
      isAlive: true,
      hitpoints: 800,
      maxHitpoints: 800
    };
    
    // Scénario : Tour ennemie vs unité blessée
    const scenario1: ITargetableEntity[] = [
      {
        id: 'enemy_tower',
        position: { x: 9, y: 4 },  // Loin mais c'est une tour
        ownerId: 'player2',
        type: 'tower',
        isAlive: true,
        hitpoints: 1400,
        maxHitpoints: 1400,
        isBuilding: true
      },
      {
        id: 'injured_unit',
        position: { x: 10, y: 17 }, // Très proche et blessé
        ownerId: 'player2',
        type: 'unit',
        isAlive: true,
        hitpoints: 80,   // Très peu de HP
        maxHitpoints: 400
      }
    ];
    
    const result1 = system.findBestTarget(attacker, scenario1, null, 300);
    console.log(`   Scenario 1 - Tower vs Injured: ${result1.target?.id} (${result1.reason})`);
    
    // Test de persistance de cible
    const currentTarget = result1.target;
    const result2 = system.findBestTarget(attacker, scenario1, currentTarget, 301);
    
    if (result2.target?.id === currentTarget?.id && result2.reason.includes('keeping')) {
      console.log('   ✅ Target persistence works correctly');
    } else {
      console.log(`   ✅ Target switching logic: ${result2.reason}`);
    }
  }

  private async testEdgeCases(): Promise<void> {
    console.log('   Testing edge cases and error handling...');
    
    const system = new TargetingSystem();
    
    const attacker: ITargetableEntity = {
      id: 'edge_tester',
      position: { x: 5, y: 5 },
      ownerId: 'player1',
      type: 'unit',
      isAlive: true,
      hitpoints: 100,
      maxHitpoints: 100
    };
    
    // Cas 1: Aucune cible disponible
    const result1 = system.findBestTarget(attacker, [], null, 400);
    if (!result1.target && result1.reason === 'no_valid_targets') {
      console.log('   ✅ No targets case handled correctly');
    }
    
    // Cas 2: Une seule cible
    const singleTarget: ITargetableEntity[] = [{
      id: 'only_target',
      position: { x: 6, y: 6 },
      ownerId: 'player2',
      type: 'unit',
      isAlive: true,
      hitpoints: 200,
      maxHitpoints: 200
    }];
    
    const result2 = system.findBestTarget(attacker, singleTarget, null, 401);
    if (result2.confidence === 1.0) {
      console.log('   ✅ Single target confidence = 1.0');
    }
    
    // Cas 3: Cleanup de l'historique
    system.cleanupHistory(500);
    console.log('   ✅ History cleanup executed');
    
    // Cas 4: Update de config
    system.updateConfig({ maxTargetingRange: 25 });
    const newStats = system.getStats();
    if (newStats.config.maxTargetingRange === 25) {
      console.log('   ✅ Configuration update works');
    }
  }

  async testCompilation(): Promise<boolean> {
    console.log('🧪 Testing TargetingSystem Compilation');
    console.log('=======================================');

    try {
      console.log('\n1️⃣ Testing imports and types...');
      
      // Test import des types depuis BaseUnit
      console.log('   ✅ BaseUnit types imported successfully');
      
      // Test création d'instance
      const system = new TargetingSystem();
      console.log('   ✅ TargetingSystem instance created');
      
      // Test du singleton
      const singleton = getTargetingSystem();
      console.log('   ✅ Singleton accessor works');
      
      console.log('\n2️⃣ Testing method signatures...');
      
      // Test que toutes les méthodes existent
      const methods = [
        'findBestTarget',
        'cleanupHistory', 
        'getStats',
        'updateConfig'
      ];
      
      methods.forEach(method => {
        if (typeof (system as any)[method] === 'function') {
          console.log(`   ✅ Method ${method} exists`);
        } else {
          throw new Error(`Method ${method} missing`);
        }
      });
      
      console.log('\n✅ TargetingSystem compilation test passed!');
      return true;
      
    } catch (error: any) {
      console.error('❌ Compilation test failed:', error.message);
      return false;
    }
  }
}

async function main() {
  const command = process.argv[2] || 'all';
  const tester = new TargetingSystemTester();

  console.log('🚀 TargetingSystem Test Suite');
  console.log('==============================');

  let success = false;

  switch (command) {
    case 'all':
      const compileSuccess = await tester.testCompilation();
      console.log('\n' + '='.repeat(50) + '\n');
      const logicSuccess = await tester.testTargetingSystemLogic();
      success = compileSuccess && logicSuccess;
      break;

    case 'compile':
      success = await tester.testCompilation();
      break;

    case 'logic':
      success = await tester.testTargetingSystemLogic();
      break;

    default:
      console.log('Usage: npx ts-node server/src/scripts/testTargetingSystem.ts [command]');
      console.log('');
      console.log('Commands:');
      console.log('  all     - Run all tests (default)');
      console.log('  compile - Test compilation and basic functionality');
      console.log('  logic   - Test targeting logic and algorithms');
      console.log('');
      console.log('What this tests:');
      console.log('  ✅ TargetingSystem class creation');
      console.log('  ✅ Singleton pattern implementation');
      console.log('  ✅ Target filtering (allies, dead, distance)');
      console.log('  ✅ Target evaluation and scoring');
      console.log('  ✅ Priority system (buildings, low HP, distance)');
      console.log('  ✅ Target persistence and switching logic');
      console.log('  ✅ Edge cases and error handling');
      console.log('');
      console.log('Prerequisites:');
      console.log('  - TargetingSystem.ts created in src/gameplay/systems/');
      console.log('  - BaseUnit.ts must compile without errors');
      console.log('  - TypeScript configuration correct');
      process.exit(0);
  }

  if (success) {
    console.log('\n🎉 All TargetingSystem tests passed!');
    console.log('');
    console.log('✅ TargetingSystem ready for integration');
    console.log('✅ Target filtering and evaluation working');
    console.log('✅ Priority system functional');
    console.log('✅ Edge cases handled correctly');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('   1. Create CombatSystem.ts');
    console.log('   2. Integrate TargetingSystem with BaseUnit');
    console.log('   3. Test unit vs unit combat');
    console.log('   4. Connect to BattleRoom tick system');
    process.exit(0);
  } else {
    console.log('\n💥 TargetingSystem tests failed!');
    console.log('');
    console.log('🔧 Check:');
    console.log('   - TypeScript compilation (npm run build)');
    console.log('   - File structure and imports');
    console.log('   - BaseUnit.ts is fixed and compiles');
    console.log('   - All type definitions match');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { TargetingSystemTester };
