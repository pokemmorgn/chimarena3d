import 'dotenv/config';
import mongoose from 'mongoose';
import BattleSession from '../models/BattleSession';
import UserData from '../models/UserData';

/**
 * Script de test pour le model BattleSession
 * Usage: npx ts-node server/src/scripts/testBattleModel.ts [command]
 */

class BattleModelTester {

  async testCreateBattle(): Promise<boolean> {
    console.log('🧪 Testing BattleSession creation');
    console.log('==================================');

    try {
      console.log('\n1️⃣ Getting test users...');
      const testUsers = await this.getTestUsers();
      if (testUsers.length < 2) {
        throw new Error('Need at least 2 users in database for testing');
      }

      console.log(`✅ Found ${testUsers.length} test users`);
      console.log(`   Player 1: ${testUsers[0].username} (${testUsers[0].stats.currentTrophies} trophies)`);
      console.log(`   Player 2: ${testUsers[1].username} (${testUsers[1].stats.currentTrophies} trophies)`);

      console.log('\n2️⃣ Creating battle session...');
      const battle = await BattleSession.createBattle(
        {
          userId: testUsers[0]._id,
          username: testUsers[0].username,
          displayName: testUsers[0].displayName,
          level: testUsers[0].level,
          trophies: testUsers[0].stats.currentTrophies,
          deck: ['knight', 'archers', 'goblins', 'arrows', 'fireball', 'cannon', 'knight', 'archers'],
          deckLevels: [3, 3, 3, 2, 2, 3, 3, 3]
        },
        {
          userId: testUsers[1]._id,
          username: testUsers[1].username,
          displayName: testUsers[1].displayName,
          level: testUsers[1].level,
          trophies: testUsers[1].stats.currentTrophies,
          deck: ['knight', 'archers', 'goblins', 'arrows', 'fireball', 'cannon', 'knight', 'archers'],
          deckLevels: [2, 2, 2, 2, 2, 2, 2, 2]
        },
        'test_room_123',
        {
          gameMode: 'casual',
          battleType: '1v1',
          matchId: 'test_match_456'
        }
      );

      console.log('✅ Battle session created successfully');
      console.log(`   Battle ID: ${battle.battleId}`);
      console.log(`   Status: ${battle.status}`);
      console.log(`   Game mode: ${battle.gameMode}`);
      console.log(`   Player 1 elixir: ${battle.player1.currentElixir}`);
      console.log(`   Player 2 elixir: ${battle.player2.currentElixir}`);

      console.log('\n3️⃣ Testing battle actions...');
      await this.testBattleActions(battle);

      console.log('\n4️⃣ Testing battle state updates...');
      await this.testBattleStateUpdates(battle);

      console.log('\n5️⃣ Testing battle finalization...');
      await this.testBattleFinalization(battle);

      console.log('\n✅ All battle model tests passed!');
      return true;

    } catch (error: any) {
      console.error('❌ Battle model test failed:', error.message);
      return false;
    }
  }

  async testBattleStats(): Promise<boolean> {
    console.log('🧪 Testing BattleSession statistics');
    console.log('====================================');

    try {
      console.log('\n1️⃣ Getting battle statistics...');
      const stats = await BattleSession.getBattleStats(24);
      
      console.log('✅ Battle statistics retrieved');
      console.log(`   Statistics for last 24h: ${stats.length} status groups`);
      
      stats.forEach((stat: any) => {
        console.log(`   - Status "${stat._id}": ${stat.count} battles`);
        console.log(`     Avg duration: ${Math.round(stat.avgDuration || 0)}s`);
        console.log(`     Avg actions: ${Math.round(stat.avgActions || 0)}`);
      });

      console.log('\n2️⃣ Getting player battles...');
      const testUsers = await this.getTestUsers();
      if (testUsers.length > 0) {
        const playerBattles = await BattleSession.getPlayerBattles(testUsers[0]._id.toString());
        
        console.log(`✅ Player battles retrieved for ${testUsers[0].username}`);
        console.log(`   Total battles: ${playerBattles.length}`);
        
        playerBattles.slice(0, 3).forEach((battle: any, i: number) => {
          console.log(`   ${i + 1}. Battle ${battle.battleId}: ${battle.status}`);
          console.log(`      Started: ${new Date(battle.startTime).toLocaleString()}`);
          console.log(`      Duration: ${battle.duration || 'ongoing'}s`);
        });
      }

      console.log('\n✅ All statistics tests passed!');
      return true;

    } catch (error: any) {
      console.error('❌ Battle statistics test failed:', error.message);
      return false;
    }
  }

  private async testBattleActions(battle: any): Promise<void> {
    // Simuler quelques actions de bataille
    console.log('   Testing card placement action...');
    await battle.addAction(battle.player1.userId.toString(), {
      type: 'card_played',
      data: {
        cardId: 'knight',
        position: { x: 9, y: 16 }, // Centre du terrain côté joueur 1
        elixirCost: 3,
        success: true
      },
      metadata: {
        ip: '127.0.0.1',
        country: 'FR'
      }
    });

    console.log('   Testing damage action...');
    await battle.addAction(battle.player2.userId.toString(), {
      type: 'tower_destroyed', // On simule car pas dans enum ActionType actuel
      data: {
        towerId: 'left_tower',
        damage: 100,
        remainingHP: battle.player1.leftTowerHP - 100
      }
    });

    console.log('✅ Battle actions logged successfully');
    console.log(`   Total actions: ${battle.totalActions}`);
  }

  private async testBattleStateUpdates(battle: any): Promise<void> {
    // Mettre à jour l'état d'un joueur
    console.log('   Updating player 1 state...');
    battle.updatePlayerState('1', {
      currentElixir: 7,
      cardsPlayed: 1,
      elixirSpent: 3,
      leftTowerHP: battle.player1.leftTowerHP - 100
    });

    // Mettre à jour l'état de la bataille
    console.log('   Updating battle state...');
    battle.updateBattleState({
      currentTick: 500, // ~25 secondes de jeu (500/20)
      gamePhase: 'normal'
    });

    await battle.save();

    console.log('✅ Battle state updated successfully');
    console.log(`   Current tick: ${battle.battleState.currentTick}`);
    console.log(`   Game phase: ${battle.battleState.gamePhase}`);
    console.log(`   Player 1 elixir: ${battle.player1.currentElixir}`);
    console.log(`   Player 1 left tower HP: ${battle.player1.leftTowerHP}`);
  }

  private async testBattleFinalization(battle: any): Promise<void> {
    // Finaliser la bataille avec joueur 1 gagnant
    console.log('   Finalizing battle with player 1 as winner...');
    await battle.finalizeBattle('1');

    console.log('✅ Battle finalized successfully');
    console.log(`   Winner: Player ${battle.winner}`);
    console.log(`   Win condition: ${battle.winCondition}`);
    console.log(`   Duration: ${battle.duration}s`);
    console.log(`   Status: ${battle.status}`);
    console.log(`   Player 1 won: ${battle.player1.isWinner}`);
    console.log(`   Player 2 won: ${battle.player2.isWinner}`);
  }

  private async getTestUsers(): Promise<any[]> {
    return await UserData.find({}).limit(2);
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
  const command = process.argv[2] || 'create';
  const tester = new BattleModelTester();

  console.log('🚀 BattleSession Model Test Suite');
  console.log('==================================');

  try {
    await tester.connectDatabase();

    let success = false;

    switch (command) {
      case 'create':
        success = await tester.testCreateBattle();
        break;

      case 'stats':
        success = await tester.testBattleStats();
        break;

      case 'all':
        console.log('Running all tests...\n');
        const createSuccess = await tester.testCreateBattle();
        console.log('\n' + '='.repeat(50) + '\n');
        const statsSuccess = await tester.testBattleStats();
        success = createSuccess && statsSuccess;
        break;

      default:
        console.log('Usage: npx ts-node server/src/scripts/testBattleModel.ts [command]');
        console.log('');
        console.log('Commands:');
        console.log('  create  - Test battle creation and actions (default)');
        console.log('  stats   - Test battle statistics queries');
        console.log('  all     - Run all tests');
        console.log('');
        console.log('Examples:');
        console.log('  npx ts-node server/src/scripts/testBattleModel.ts create');
        console.log('  npx ts-node server/src/scripts/testBattleModel.ts stats');
        console.log('  npx ts-node server/src/scripts/testBattleModel.ts all');
        process.exit(0);
    }

    if (success) {
      console.log('\n🎉 All BattleSession model tests passed!');
      console.log('');
      console.log('🎯 Model ready for:');
      console.log('   ✅ Battle creation and management');
      console.log('   ✅ Action logging with analytics');
      console.log('   ✅ Player state tracking');
      console.log('   ✅ Battle statistics and queries');
      console.log('   ✅ Replay data foundation');
      console.log('');
      console.log('Next: Create BattleRoom with this model!');
      process.exit(0);
    } else {
      console.log('\n💥 Some tests failed!');
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

export { BattleModelTester };
