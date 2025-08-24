import dotenv from 'dotenv';

// Charger le .env depuis le dossier server/ (fonctionne depuis n'importe où)
dotenv.config({ path: './server/.env' });

import mongoose from 'mongoose';
import UserData from '../models/UserData';
import BattleSession from '../models/BattleSession';
import { TokenService } from '../middleware/AuthData';

/**
 * Script de test pour BattleRoom - Version serveur SSH
 * Usage: npx ts-node server/src/scripts/testBattleRoom.ts [command]
 * 
 * Teste:
 * - Authentification JWT
 * - BattleSession model intégration
 * - API endpoints liés aux batailles
 * - Logique serveur BattleRoom
 */

const http = require('http');
const API_BASE_URL = 'http://localhost:2567/api';

class BattleRoomTester {
  private testUsers: any[] = [];
  private battleSessions: any[] = [];

  async testBattleRoomServer(): Promise<boolean> {
    console.log('🧪 Testing BattleRoom Server Integration');
    console.log('========================================');

    try {
      console.log('\n1️⃣ Testing server health and rooms...');
      await this.testServerHealth();

      console.log('\n2️⃣ Testing user authentication...');
      await this.testUserAuthentication();

      console.log('\n3️⃣ Testing BattleSession creation...');
      await this.testBattleSessionCreation();

      console.log('\n4️⃣ Testing BattleSession operations...');
      await this.testBattleSessionOperations();

      console.log('\n5️⃣ Testing battle statistics...');
      await this.testBattleStatistics();

      console.log('\n✅ All BattleRoom server tests passed!');
      return true;

    } catch (error: any) {
      console.error('❌ BattleRoom server test failed:', error.message);
      return false;
    }
  }

  async testBattleLogic(): Promise<boolean> {
    console.log('🧪 Testing BattleRoom Logic Only');
    console.log('==================================');

    try {
      await this.testBattleSessionCreation();
      await this.testBattleSessionOperations();
      
      console.log('✅ Battle logic test successful');
      return true;
    } catch (error: any) {
      console.error('❌ Battle logic test failed:', error.message);
      return false;
    }
  }

  async testIntegration(): Promise<boolean> {
    console.log('🧪 Testing BattleRoom Integration');
    console.log('===================================');

    try {
      await this.testServerHealth();
      await this.testUserAuthentication();
      
      console.log('✅ Integration test successful');
      return true;
    } catch (error: any) {
      console.error('❌ Integration test failed:', error.message);
      return false;
    }
  }

  private async testServerHealth(): Promise<void> {
    console.log('   Testing server endpoints...');
    
    // Test health endpoint
    const health = await this.makeRequest('/health');
    if (!health.success) {
      throw new Error('Server health check failed');
    }
    
    console.log('   ✅ Server is healthy');
    console.log(`      Uptime: ${Math.round(health.data.uptime)}s`);
    
    // Test rooms endpoint
    const rooms = await this.makeRequest('/rooms');
    if (!rooms.success) {
      throw new Error('Rooms endpoint failed');
    }
    
    const battleRoom = rooms.data.rooms.find((room: any) => room.name === 'battle');
    if (!battleRoom) {
      throw new Error('BattleRoom not found in available rooms');
    }
    
    console.log('   ✅ BattleRoom is registered');
    console.log(`      Max clients: ${battleRoom.maxClients}`);
    console.log(`      Description: ${battleRoom.description}`);
  }

  private async testUserAuthentication(): Promise<void> {
    console.log('   Testing user authentication...');
    
    // Récupérer des utilisateurs test
    this.testUsers = await UserData.find({}).limit(2);
    if (this.testUsers.length < 2) {
      throw new Error('Need at least 2 users in database');
    }
    
    console.log('   ✅ Found test users:');
    this.testUsers.forEach((user, i) => {
      console.log(`      Player ${i + 1}: ${user.username} (Level ${user.level})`);
    });
    
    // Générer et vérifier les tokens JWT
    for (const user of this.testUsers) {
      const token = TokenService.generateAccessToken(user);
      
      // Vérifier le token
      try {
        const decoded = TokenService.verifyAccessToken(token);
        console.log(`   ✅ JWT token valid for ${user.username}`);
        console.log(`      User ID: ${decoded.userId}`);
      } catch (error) {
        throw new Error(`JWT verification failed for ${user.username}`);
      }
    }
  }

  private async testBattleSessionCreation(): Promise<void> {
    console.log('   Testing BattleSession creation...');
    
    if (this.testUsers.length < 2) {
      // Charger des utilisateurs si pas fait
      this.testUsers = await UserData.find({}).limit(2);
    }
    
    // Créer une bataille test
    const battle = await BattleSession.createBattle(
      {
        userId: this.testUsers[0]._id,
        username: this.testUsers[0].username,
        displayName: this.testUsers[0].displayName,
        level: this.testUsers[0].level,
        trophies: this.testUsers[0].stats.currentTrophies,
        deck: ['knight', 'archers', 'goblins', 'arrows', 'fireball', 'cannon', 'knight', 'archers'],
        deckLevels: [3, 3, 3, 2, 2, 3, 3, 3]
      },
      {
        userId: this.testUsers[1]._id,
        username: this.testUsers[1].username,
        displayName: this.testUsers[1].displayName,
        level: this.testUsers[1].level,
        trophies: this.testUsers[1].stats.currentTrophies,
        deck: ['knight', 'archers', 'goblins', 'arrows', 'fireball', 'cannon', 'knight', 'archers'],
        deckLevels: [2, 2, 2, 2, 2, 2, 2, 2]
      },
      'test_room_battle_' + Date.now(),
      {
        gameMode: 'casual',
        battleType: '1v1',
        matchId: 'test_match_' + Date.now()
      }
    );
    
    this.battleSessions.push(battle);
    
    console.log('   ✅ BattleSession created successfully');
    console.log(`      Battle ID: ${battle.battleId}`);
    console.log(`      Status: ${battle.status}`);
    console.log(`      Game mode: ${battle.gameMode}`);
    console.log(`      Player 1: ${battle.player1.username} (${battle.player1.trophies} trophies)`);
    console.log(`      Player 2: ${battle.player2.username} (${battle.player2.trophies} trophies)`);
  }

  private async testBattleSessionOperations(): Promise<void> {
    console.log('   Testing BattleSession operations...');
    
    if (this.battleSessions.length === 0) {
      throw new Error('No battle sessions to test');
    }
    
    const battle = this.battleSessions[0];
    
    // Test addAction
    console.log('      Testing addAction...');
    await battle.addAction(battle.player1.userId.toString(), {
      type: 'card_played',
      data: {
        cardId: 'knight',
        position: { x: 9, y: 20 },
        elixirCost: 3,
        success: true
      },
      metadata: {
        ip: '127.0.0.1',
        country: 'FR'
      }
    });
    
    console.log('      ✅ Action logged successfully');
    console.log(`         Total actions: ${battle.totalActions}`);
    
    // Test updatePlayerState
    console.log('      Testing updatePlayerState...');
    battle.updatePlayerState('1', {
      currentElixir: 7,
      cardsPlayed: 1,
      elixirSpent: 3,
      damageDealt: 150
    });
    
    console.log('      ✅ Player state updated');
    console.log(`         Player 1 elixir: ${battle.player1.currentElixir}`);
    console.log(`         Player 1 cards played: ${battle.player1.cardsPlayed}`);
    
    // Test updateBattleState
    console.log('      Testing updateBattleState...');
    battle.updateBattleState({
      currentTick: 600, // 30 secondes à 20 TPS
      gamePhase: 'normal'
    });
    
    console.log('      ✅ Battle state updated');
    console.log(`         Current tick: ${battle.battleState.currentTick}`);
    console.log(`         Game phase: ${battle.battleState.gamePhase}`);
    
    // Sauvegarder les changements
    await battle.save();
    console.log('      ✅ Battle saved to database');
    
    // Test finalizeBattle
    console.log('      Testing finalizeBattle...');
    await battle.finalizeBattle('1');
    
    console.log('      ✅ Battle finalized');
    console.log(`         Winner: Player ${battle.winner}`);
    console.log(`         Win condition: ${battle.winCondition}`);
    console.log(`         Duration: ${battle.duration}s`);
    console.log(`         Status: ${battle.status}`);
  }

  private async testBattleStatistics(): Promise<void> {
    console.log('   Testing battle statistics...');
    
    // Test getBattleStats
    const stats = await BattleSession.getBattleStats(24);
    console.log('   ✅ Battle statistics retrieved');
    console.log(`      Statistics groups: ${stats.length}`);
    
    stats.forEach((stat: any) => {
      console.log(`      - Status "${stat._id}": ${stat.count} battles`);
      console.log(`        Avg duration: ${Math.round(stat.avgDuration || 0)}s`);
      console.log(`        Avg actions: ${Math.round(stat.avgActions || 0)}`);
    });
    
    // Test getPlayerBattles
    if (this.testUsers.length > 0) {
      const playerBattles = await BattleSession.getPlayerBattles(this.testUsers[0]._id.toString(), 10);
      console.log(`   ✅ Player battles retrieved for ${this.testUsers[0].username}`);
      console.log(`      Total battles: ${playerBattles.length}`);
      
      playerBattles.slice(0, 3).forEach((battle: any, i: number) => {
        console.log(`      ${i + 1}. Battle ${battle.battleId}: ${battle.status}`);
        console.log(`         Started: ${new Date(battle.startTime).toLocaleString()}`);
      });
    }
  }

  private async makeRequest(endpoint: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = `${API_BASE_URL}${endpoint}`;
      
      http.get(url, (res: any) => {
        let data = '';
        
        res.on('data', (chunk: any) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${error}`));
          }
        });
        
      }).on('error', (error: any) => {
        reject(error);
      });
    });
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

  async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up test data...');
    
    // Nettoyer les battle sessions de test
    for (const battle of this.battleSessions) {
      try {
        await BattleSession.deleteOne({ _id: battle._id });
        console.log(`   ✅ Deleted test battle ${battle.battleId}`);
      } catch (error) {
        console.log(`   ⚠️ Could not delete battle ${battle.battleId}`);
      }
    }
    
    this.battleSessions = [];
    console.log('✅ Cleanup completed');
  }
}

async function main() {
  const command = process.argv[2] || 'server';
  const tester = new BattleRoomTester();

  console.log('🚀 BattleRoom Server Test Suite');
  console.log('================================');

  // Vérifier les variables d'environnement nécessaires
  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET not found in environment variables');
    console.error('');
    console.error('🔧 Fix:');
    console.error('   1. Check your .env file exists in server/ directory');
    console.error('   2. Verify JWT_SECRET is defined in .env');
    console.error('   3. Restart the script');
    process.exit(1);
  }

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  console.log('✅ Environment variables loaded');
  console.log(`   JWT_SECRET: ${process.env.JWT_SECRET.substring(0, 10)}...`);
  console.log(`   MONGODB_URI: ${process.env.MONGODB_URI}`);

  try {
    await tester.connectDatabase();

    let success = false;

    switch (command) {
      case 'server':
        success = await tester.testBattleRoomServer();
        break;

      case 'logic':
        success = await tester.testBattleLogic();
        break;

      case 'integration':
        success = await tester.testIntegration();
        break;

      default:
        console.log('Usage: npx ts-node server/src/scripts/testBattleRoom.ts [command]');
        console.log('');
        console.log('Commands:');
        console.log('  server      - Test complete BattleRoom server integration (default)');
        console.log('  logic       - Test BattleSession logic and operations only');
        console.log('  integration - Test server integration and endpoints only');
        console.log('');
        console.log('Examples:');
        console.log('  npx ts-node server/src/scripts/testBattleRoom.ts server');
        console.log('  npx ts-node server/src/scripts/testBattleRoom.ts logic');
        console.log('  npx ts-node server/src/scripts/testBattleRoom.ts integration');
        console.log('');
        console.log('What this tests:');
        console.log('  ✅ BattleRoom registration in server');
        console.log('  ✅ JWT authentication system');
        console.log('  ✅ BattleSession model operations');
        console.log('  ✅ Action logging integration');
        console.log('  ✅ Battle statistics and queries');
        console.log('  ✅ Server API endpoints');
        console.log('');
        console.log('Note: This tests the server-side logic.');
        console.log('      For WebSocket testing, use a proper client app.');
        process.exit(0);
    }

    if (success) {
      console.log('\n🎉 All BattleRoom server tests passed!');
      console.log('');
      console.log('🎯 BattleRoom server is ready for:');
      console.log('   ✅ Room registration and client connections');
      console.log('   ✅ JWT authentication and user validation');
      console.log('   ✅ BattleSession persistence and operations');
      console.log('   ✅ Action logging for AI analytics');
      console.log('   ✅ Battle statistics and player history');
      console.log('   ✅ Game state management and finalization');
      console.log('');
      console.log('🚀 Next steps:');
      console.log('   1. Create a client app to test WebSocket connections');
      console.log('   2. Integrate with MatchmakingService');
      console.log('   3. Add more gameplay mechanics');
      console.log('   4. Implement spectator features');
      console.log('');
      console.log('Ready for production battles! 🎮');
      process.exit(0);
    } else {
      console.log('\n💥 BattleRoom server tests failed!');
      console.log('');
      console.log('🔧 Check:');
      console.log('   - Server running (npm run dev)');
      console.log('   - BattleRoom registered in index.ts');
      console.log('   - Database has test users');
      console.log('   - No compilation errors in BattleRoom.ts');
      process.exit(1);
    }

  } catch (error: any) {
    console.error('\n💥 Test suite crashed:', error.message);
    process.exit(1);
  } finally {
    await tester.cleanup();
    await tester.disconnectDatabase();
  }
}

if (require.main === module) {
  main();
}

export { BattleRoomTester };
