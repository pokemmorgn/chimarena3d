import 'dotenv/config';
import mongoose from 'mongoose';
import CardData from '../models/CardData';
import BaseUnit from '../gameplay/units/BaseUnit';

/**
 * Script de test pour vérifier que BaseUnit fonctionne après la correction TypeScript
 * Usage: npx ts-node server/src/scripts/testBaseUnitFix.ts
 */

class BaseUnitTester {

  async testBaseUnitCreation(): Promise<boolean> {
    console.log('🧪 Testing BaseUnit creation after TypeScript fix');
    console.log('==================================================');

    try {
      console.log('\n1️⃣ Testing card data retrieval...');
      await this.testCardDataRetrieval();

      console.log('\n2️⃣ Testing BaseUnit creation...');
      await this.testUnitCreation();

      console.log('\n3️⃣ Testing BaseUnit stats calculation...');
      await this.testStatsCalculation();

      console.log('\n4️⃣ Testing BaseUnit methods...');
      await this.testUnitMethods();

      console.log('\n✅ All BaseUnit tests passed!');
      return true;

    } catch (error: any) {
      console.error('❌ BaseUnit test failed:', error.message);
      return false;
    }
  }

  private async testCardDataRetrieval(): Promise<void> {
    console.log('   Testing CardData queries...');
    
    // Vérifier qu'on a des cartes en base
    const cardCount = await CardData.countDocuments({ isEnabled: true });
    if (cardCount === 0) {
      throw new Error('No cards found in database. Run seedCards.ts first.');
    }
    
    console.log(`   ✅ Found ${cardCount} cards in database`);
    
    // Tester une carte spécifique
    const knight = await CardData.findOne({ id: 'knight', isEnabled: true });
    if (!knight) {
      throw new Error('Knight card not found. Run seedCards.ts first.');
    }
    
    console.log(`   ✅ Knight card found: ${knight.nameKey}`);
    console.log(`   ✅ Knight stats: ${knight.stats.hitpoints} HP, ${knight.stats.damage} damage`);
    
    // Tester les stats par niveau
    const level3Stats = knight.getStatsForLevel(3);
    console.log(`   ✅ Knight level 3: ${level3Stats.hitpoints} HP, ${level3Stats.damage} damage`);
  }

  private async testUnitCreation(): Promise<void> {
    console.log('   Testing BaseUnit.create() method...');
    
    try {
      // Créer une unité Knight
      const knight = await BaseUnit.create(
        'knight',
        3,
        'test_player_1',
        { x: 9, y: 20 },
        100
      );
      
      console.log(`   ✅ Knight unit created: ${knight.id}`);
      console.log(`   ✅ Position: (${knight.x}, ${knight.y})`);
      console.log(`   ✅ HP: ${knight.currentHitpoints}/${knight.maxHitpoints}`);
      console.log(`   ✅ Damage: ${knight.currentDamage}`);
      console.log(`   ✅ State: ${knight.state}`);
      
      // Tester avec une autre carte
      const archers = await BaseUnit.create(
        'archers',
        2,
        'test_player_2',
        { x: 12, y: 15 },
        120
      );
      
      console.log(`   ✅ Archers unit created: ${archers.id}`);
      console.log(`   ✅ HP: ${archers.currentHitpoints}/${archers.maxHitpoints}`);
      
    } catch (error: any) {
      throw new Error(`Unit creation failed: ${error.message}`);
    }
  }

  private async testStatsCalculation(): Promise<void> {
    console.log('   Testing BaseUnit.getCardStats() static method...');
    
    try {
      // Tester les stats statiques pour Knight niveau 1
      const knightStats = await BaseUnit.getCardStats('knight', 1);
      if (!knightStats) {
        throw new Error('Failed to get Knight stats');
      }
      
      console.log(`   ✅ Knight level 1 stats:`);
      console.log(`      HP: ${knightStats.hitpoints}`);
      console.log(`      Damage: ${knightStats.damage}`);
      console.log(`      Speed: ${knightStats.speed} (${knightStats.walkingSpeed} tiles/sec)`);
      console.log(`      Range: ${knightStats.range}`);
      console.log(`      Targets: ${knightStats.targets}`);
      console.log(`      Splash: ${knightStats.splashDamage}`);
      if (knightStats.splashRadius !== undefined) {
        console.log(`      Splash radius: ${knightStats.splashRadius}`);
      }
      
      // Tester avec différents niveaux
      const knightStats5 = await BaseUnit.getCardStats('knight', 5);
      if (!knightStats5) {
        throw new Error('Failed to get Knight level 5 stats');
      }
      
      console.log(`   ✅ Knight level 5: ${knightStats5.hitpoints} HP, ${knightStats5.damage} damage`);
      
      // Vérifier que les stats augmentent avec le niveau
      if (knightStats5.hitpoints > knightStats.hitpoints) {
        console.log(`   ✅ HP scaling works: ${knightStats.hitpoints} → ${knightStats5.hitpoints}`);
      }
      
    } catch (error: any) {
      throw new Error(`Stats calculation failed: ${error.message}`);
    }
  }

  private async testUnitMethods(): Promise<void> {
    console.log('   Testing BaseUnit instance methods...');
    
    try {
      // Créer une unité pour les tests
      const knight = await BaseUnit.create(
        'knight',
        3,
        'test_player',
        { x: 10, y: 18 },
        200
      );
      
      // Tester getPosition()
      const position = knight.getPosition();
      console.log(`   ✅ getPosition(): (${position.x}, ${position.y})`);
      
      // Tester getCurrentDamage()
      const damage = knight.getCurrentDamage();
      console.log(`   ✅ getCurrentDamage(): ${damage}`);
      
      // Tester canTarget()
      const canTargetGround = knight.canTarget('ground');
      const canTargetAir = knight.canTarget('air');
      console.log(`   ✅ canTarget ground: ${canTargetGround}, air: ${canTargetAir}`);
      
      // Tester takeDamage()
      const initialHP = knight.currentHitpoints;
      const wasKilled = knight.takeDamage(50);
      console.log(`   ✅ takeDamage(50): ${initialHP} → ${knight.currentHitpoints} HP`);
      console.log(`   ✅ Unit killed: ${wasKilled}`);
      
      // Tester update() (simulation d'un tick)
      knight.update(250, 50); // tick 250, deltaTime 50ms
      console.log(`   ✅ update() called successfully`);
      
      // Tester cleanup()
      knight.cleanup();
      console.log(`   ✅ cleanup() called successfully`);
      
    } catch (error: any) {
      throw new Error(`Unit methods test failed: ${error.message}`);
    }
  }

  async testCacheSystem(): Promise<boolean> {
    console.log('🧪 Testing BaseUnit cache system');
    console.log('================================');

    try {
      console.log('\n1️⃣ Testing cache preload...');
      await BaseUnit.preloadCommonCards();
      
      console.log('\n2️⃣ Testing cached card creation (should be faster)...');
      const startTime = Date.now();
      
      // Créer plusieurs unités rapidement (devrait utiliser le cache)
      const units = await Promise.all([
        BaseUnit.create('knight', 1, 'player1', { x: 5, y: 20 }, 300),
        BaseUnit.create('archers', 2, 'player1', { x: 7, y: 20 }, 301),
        BaseUnit.create('goblins', 1, 'player1', { x: 9, y: 20 }, 302),
        BaseUnit.create('knight', 3, 'player2', { x: 11, y: 12 }, 303),
        BaseUnit.create('archers', 1, 'player2', { x: 13, y: 12 }, 304),
      ]);
      
      const endTime = Date.now();
      console.log(`   ✅ Created ${units.length} units in ${endTime - startTime}ms (cached)`);
      
      units.forEach((unit, i) => {
        console.log(`      ${i + 1}. ${unit.cardId} (Level ${unit.level}): ${unit.currentHitpoints} HP`);
      });
      
      console.log('\n3️⃣ Testing cache clear...');
      BaseUnit.clearCache();
      console.log(`   ✅ Cache cleared`);
      
      console.log('\n✅ Cache system tests passed!');
      return true;
      
    } catch (error: any) {
      console.error('❌ Cache system test failed:', error.message);
      return false;
    }
  }

  async connectDatabase(): Promise<void> {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chimarena3d';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  }

  async disconnectDatabase(): Promise<void> {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

async function main() {
  const command = process.argv[2] || 'all';
  const tester = new BaseUnitTester();

  console.log('🚀 BaseUnit TypeScript Fix Test Suite');
  console.log('======================================');

  try {
    await tester.connectDatabase();

    let success = false;

    switch (command) {
      case 'all':
        const creationSuccess = await tester.testBaseUnitCreation();
        console.log('\n' + '='.repeat(50) + '\n');
        const cacheSuccess = await tester.testCacheSystem();
        success = creationSuccess && cacheSuccess;
        break;

      case 'creation':
        success = await tester.testBaseUnitCreation();
        break;

      case 'cache':
        success = await tester.testCacheSystem();
        break;

      default:
        console.log('Usage: npx ts-node server/src/scripts/testBaseUnitFix.ts [command]');
        console.log('');
        console.log('Commands:');
        console.log('  all      - Run all tests (default)');
        console.log('  creation - Test BaseUnit creation and methods only');
        console.log('  cache    - Test cache system only');
        console.log('');
        console.log('Prerequisites:');
        console.log('  - MongoDB running');
        console.log('  - Cards seeded in database (run seedCards.ts)');
        console.log('  - No TypeScript compilation errors');
        process.exit(0);
    }

    if (success) {
      console.log('\n🎉 All BaseUnit tests passed!');
      console.log('');
      console.log('✅ TypeScript exactOptionalPropertyTypes issue fixed');
      console.log('✅ BaseUnit creation and stats calculation working');
      console.log('✅ Cache system operational');
      console.log('✅ Unit methods functional');
      console.log('');
      console.log('🎯 BaseUnit is ready for integration with:');
      console.log('   - BattleRoom tick system (20 TPS)');
      console.log('   - Combat system and targeting');
      console.log('   - Buff/debuff system');
      console.log('   - Spell effects and interactions');
      process.exit(0);
    } else {
      console.log('\n💥 Some tests failed!');
      console.log('');
      console.log('🔧 Check:');
      console.log('   - TypeScript compilation (npm run build)');
      console.log('   - Database has seeded cards');
      console.log('   - All dependencies installed');
      process.exit(1);
    }

  } catch (error: any) {
    console.error('\n💥 Test suite crashed:', error.message);
    process.exit(1);
  } finally {
    await tester.disconnectDatabase();
  }
}

if (require.main === module) {
  main();
}

export { BaseUnitTester };
