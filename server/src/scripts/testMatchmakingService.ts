import { MatchmakingService, IQueuedPlayer, IMatch } from '../services/MatchmakingService';
import { getActionLogger } from '../services/ActionLoggerService';
import mongoose from 'mongoose';

const TEST_PLAYERS: Omit<IQueuedPlayer, 'joinTime' | 'waitTime' | 'trophyRange' | 'maxWaitTime'>[] = [
  {
    sessionId: 'player1', userId: 'user1', username: 'TestPlayer1',
    trophies: 1000, level: 5, averageCardLevel: 3.2, region: 'EU'
  },
  {
    sessionId: 'player2', userId: 'user2', username: 'TestPlayer2',
    trophies: 1050, level: 6, averageCardLevel: 3.5, region: 'EU'
  },
  {
    sessionId: 'player3', userId: 'user3', username: 'TestPlayer3',
    trophies: 1200, level: 7, averageCardLevel: 4.0, region: 'US'
  },
  {
    sessionId: 'player4', userId: 'user4', username: 'TestPlayer4',
    trophies: 950, level: 4, averageCardLevel: 2.8, region: 'EU'
  },
  {
    sessionId: 'player5', userId: 'user5', username: 'HighTrophyPlayer',
    trophies: 2000, level: 10, averageCardLevel: 8.0, region: 'ASIA'
  }
];

class MatchmakingTester {
  private matchmaking: MatchmakingService;
  private logger = getActionLogger();
  private matchesFound: IMatch[] = [];
  private playersMatched: string[] = [];
  
  constructor() {
    this.matchmaking = new MatchmakingService({
      initialTrophyRange: 100,
      maxTrophyRange: 500,
      trophyRangeExpansion: 50,
      initialWaitTime: 2000,
      maxWaitTime: 30000,
      expansionInterval: 2000,
      enableBots: true,
      botMatchAfterSeconds: 5,
      botTrophyVariance: 50,
      matchmakingTickRate: 500,
    });
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.matchmaking.on('playerQueued', (player: IQueuedPlayer) => {
      console.log(`✅ Player queued: ${player.username} (${player.trophies} trophies)`);
    });

    this.matchmaking.on('matchFound', (match: IMatch) => {
      this.matchesFound.push(match);
      this.playersMatched.push(match.player1.sessionId, match.player2.sessionId);
      
      const p1Bot = match.player1.isBot ? ' [BOT]' : '';
      const p2Bot = match.player2.isBot ? ' [BOT]' : '';
      
      console.log(`🎯 MATCH FOUND!`);
      console.log(`   Match ID: ${match.matchId}`);
      console.log(`   Player 1: ${match.player1.username}${p1Bot} (${match.player1.trophies} trophies)`);
      console.log(`   Player 2: ${match.player2.username}${p2Bot} (${match.player2.trophies} trophies)`);
      console.log(`   Average trophies: ${match.averageTrophies}`);
      console.log(`   Trophy difference: ${Math.abs(match.player1.trophies - match.player2.trophies)}`);
      
      setTimeout(() => {
        this.matchmaking.finializeMatch(match.matchId);
        console.log(`🏁 Match ${match.matchId} finalized`);
      }, 3000);
    });

    this.matchmaking.on('playerLeft', (player: IQueuedPlayer) => {
      console.log(`👋 Player left: ${player.username}`);
    });

    this.matchmaking.on('playerTimeout', (player: IQueuedPlayer) => {
      console.log(`⏰ Player timeout: ${player.username}`);
    });

    this.logger.on('batchFlushed', (data: any) => {
      console.log(`📊 LOG BATCH FLUSHED: ${data.count} actions (${data.batchId})`);
    });

    this.logger.on('actionLogged', (action: any) => {
      console.log(`📝 ACTION LOGGED: ${action.action} for user ${action.userId}`);
    });
  }

  async connectDatabase() {
    try {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chimarena3d';
      await mongoose.connect(MONGODB_URI);
      console.log('✅ Connected to MongoDB for logging');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async testBasicMatchmaking() {
    console.log('\n🧪 TEST 1: Basic Matchmaking with Logging');
    console.log('='.repeat(60));
    
    await this.matchmaking.addPlayerToQueue(TEST_PLAYERS[0]);
    await this.matchmaking.addPlayerToQueue(TEST_PLAYERS[1]);
    
    await this.waitForMatches(1, 10000);
    console.log(`✅ Test completed. Matches found: ${this.matchesFound.length}`);
  }

  async testBotMatchmaking() {
    console.log('\n🧪 TEST 2: Bot Matchmaking with Logging');
    console.log('='.repeat(60));
    
    this.resetTest();
    await this.matchmaking.addPlayerToQueue(TEST_PLAYERS[0]);
    
    console.log('Single player added. Should be matched with a bot after 5 seconds...');
    await this.waitForMatches(1, 10000);
    
    console.log(`✅ Test completed. Matches found: ${this.matchesFound.length}`);
    
    if (this.matchesFound.length > 0) {
      const match = this.matchesFound[0];
      const hasBotPlayer = match.player1.isBot || match.player2.isBot;
      console.log(`   Bot match: ${hasBotPlayer ? 'YES' : 'NO'}`);
      
      if (hasBotPlayer) {
        const bot = match.player1.isBot ? match.player1 : match.player2;
        const human = match.player1.isBot ? match.player2 : match.player1;
        console.log(`   Bot: ${bot.username} (${bot.trophies} trophies, Level ${bot.level})`);
        console.log(`   Human: ${human.username} (${human.trophies} trophies, Level ${human.level})`);
        console.log(`   Trophy difference: ${Math.abs(bot.trophies - human.trophies)}`);
      }
    }
  }

  async testQueueTimeout() {
    console.log('\n🧪 TEST 3: Queue Timeout Logging');
    console.log('='.repeat(60));
    
    this.resetTest();
    
    const tempPlayer = {
      ...TEST_PLAYERS[0],
      sessionId: 'timeout_test',
      userId: 'timeout_user'
    };
    
    await this.matchmaking.addPlayerToQueue(tempPlayer);
    console.log('Player added. Will timeout after configured time...');
    
    await this.sleep(8000);
    
    console.log('✅ Timeout test completed');
  }

  async testManualLeave() {
    console.log('\n🧪 TEST 4: Manual Queue Leave Logging');
    console.log('='.repeat(60));
    
    this.resetTest();
    
    await this.matchmaking.addPlayerToQueue(TEST_PLAYERS[0]);
    await this.sleep(2000);
    
    console.log('Manually removing player from queue...');
    await this.matchmaking.removePlayerFromQueue(TEST_PLAYERS[0].sessionId);
    
    await this.sleep(1000);
    console.log('✅ Manual leave test completed');
  }

  async testLoggerStatistics() {
    console.log('\n🧪 TEST 5: Logger Statistics');
    console.log('='.repeat(60));
    
    await this.logger.flush();
    await this.sleep(2000);
    
    const stats = this.logger.getStats();
    console.log('📊 Logger Statistics:');
    console.log(`   Total logged: ${stats.totalLogged}`);
    console.log(`   Total batches: ${stats.totalBatches}`);
    console.log(`   Pending count: ${stats.pendingCount}`);
    console.log(`   Average batch size: ${stats.averageBatchSize}`);
    console.log(`   Cache size: ${stats.cacheSize}`);
    console.log(`   Category counts:`, stats.categoryCounts);
    
    console.log('\n📋 Recent Actions in Database:');
    try {
      const PlayerAction = (await import('../models/PlayerAction')).default;
      const recentActions = await PlayerAction.find({})
        .sort({ timestamp: -1 })
        .limit(10)
        .select('action userId data.trophies data.waitTime timestamp');
      
      recentActions.forEach((action, i) => {
        const trophies = action.data?.trophies || 'N/A';
        const waitTime = action.data?.waitTime ? Math.round(action.data.waitTime / 1000) + 's' : 'N/A';
        console.log(`   ${i + 1}. ${action.action} - User: ${action.userId} - Trophies: ${trophies} - Wait: ${waitTime}`);
      });
    } catch (error) {
      console.error('   Failed to fetch recent actions:', error);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Matchmaking + Logging Tests...');
    console.log('='.repeat(80));
    
    try {
      await this.connectDatabase();
    } catch (error) {
      console.error('Database connection failed, continuing without DB logging...');
    }
    
    const tests = [
      { name: 'Basic Matchmaking', fn: () => this.testBasicMatchmaking() },
      { name: 'Bot Matchmaking', fn: () => this.testBotMatchmaking() },
      { name: 'Queue Timeout', fn: () => this.testQueueTimeout() },
      { name: 'Manual Leave', fn: () => this.testManualLeave() },
      { name: 'Logger Statistics', fn: () => this.testLoggerStatistics() }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
      try {
        console.log(`\n🧪 Running: ${test.name}`);
        await test.fn();
        passed++;
        console.log(`✅ ${test.name} - PASSED`);
      } catch (error) {
        failed++;
        console.error(`❌ ${test.name} - FAILED:`, error);
      }
      
      await this.sleep(2000);
    }
    
    await this.logger.flush();
    await this.sleep(1000);
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 FINAL RESULTS:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
    
    if (failed === 0) {
      console.log('🎉 All tests passed! Matchmaking + Logging working perfectly!');
    } else {
      console.log('⚠️ Some tests failed. Check the logs above.');
    }
    
    await this.matchmaking.stop();
    this.logger.stop();
    console.log('🛑 Services stopped');
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('📦 Disconnected from MongoDB');
    }
  }

  private resetTest() {
    this.matchesFound = [];
    this.playersMatched = [];
  }

  private async waitForMatches(expectedMatches: number, timeout: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkInterval = setInterval(() => {
        if (this.matchesFound.length >= expectedMatches) {
          clearInterval(checkInterval);
          resolve();
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          console.log(`⏰ Timeout waiting for matches. Found: ${this.matchesFound.length}/${expectedMatches}`);
          resolve();
        }
      }, 100);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function runMatchmakingWithLoggingTests() {
  const tester = new MatchmakingTester();
  await tester.runAllTests();
  process.exit(0);
}

if (require.main === module) {
  runMatchmakingWithLoggingTests().catch((error) => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  });
}

export { MatchmakingTester, runMatchmakingWithLoggingTests };
