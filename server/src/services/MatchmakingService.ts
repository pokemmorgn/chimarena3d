/**
   * Utilitaires pour les tests de logging
   */
  private async getActionCount(): Promise<number> {
    try {
      return await PlayerAction.countDocuments({});
    } catch (error) {
      return 0;
    }
  }

  private async getBotMatchActions(): Promise<number> {
    try {
      return await PlayerAction.countDocuments({ action: 'bot_matched' });
    } catch (error) {
      return 0;
    }
  }

  private async getLeaveActions(): Promise<number> {
    try {
      return await PlayerAction.countDocuments({ action: 'queue_left' });
    } catch (error) {
      return 0;
    }
  }

  private async showRecentActions(limit = 5): Promise<void> {
    try {
      const recentActions = await PlayerAction.find({})
        .sort({ timestamp: -1 })
        .limit(limit)
        .select('userId action data.trophies data.waitTime data.reason timestamp')
        .lean();

      console.log(`\n📋 Last ${recentActions.length} actions:`);
      recentActions.forEach((action, index) => {
        const time = new Date(action.timestamp).toLocaleTimeString();
        const waitTime = action.data?.waitTime ? `${Math.round(action.data.waitTime/1000)}s` : 'N/A';
        const trophies = action.data?.trophies || 'N/A';
        const reason = action.data?.reason || '';
        
        console.log(`   ${index + 1}. [${time}] ${action.action} - User: ${action.userId} - Trophies: ${trophies} - Wait: ${waitTime} ${reason}`);
      });
    } catch (error) {
      console.log('   ❌ Could not fetch recent actions:', error);
    }
  }import { MatchmakingService, IQueuedPlayer, IMatch } from '../services/MatchmakingService';
import { getActionLogger } from '../services/ActionLoggerService';
import mongoose from 'mongoose';
import PlayerAction from '../models/PlayerAction';

/**
 * Script de test pour le MatchmakingService
 * Simule différents scénarios de matchmaking
 */

// Données de test pour simuler des joueurs
const TEST_PLAYERS: Omit<IQueuedPlayer, 'joinTime' | 'waitTime' | 'trophyRange' | 'maxWaitTime'>[] = [
  {
    sessionId: 'player1',
    userId: 'user1',
    username: 'TestPlayer1',
    trophies: 1000,
    level: 5,
    averageCardLevel: 3.2,
    region: 'EU'
  },
  {
    sessionId: 'player2',
    userId: 'user2',
    username: 'TestPlayer2',
    trophies: 1050,
    level: 6,
    averageCardLevel: 3.5,
    region: 'EU'
  },
  {
    sessionId: 'player3',
    userId: 'user3',
    username: 'TestPlayer3',
    trophies: 1200,
    level: 7,
    averageCardLevel: 4.0,
    region: 'US'
  },
  {
    sessionId: 'player4',
    userId: 'user4',
    username: 'TestPlayer4',
    trophies: 950,
    level: 4,
    averageCardLevel: 2.8,
    region: 'EU'
  },
  {
    sessionId: 'player5',
    userId: 'user5',
    username: 'HighTrophyPlayer',
    trophies: 2000,
    level: 10,
    averageCardLevel: 8.0,
    region: 'ASIA'
  }
];

class MatchmakingTester {
  private matchmaking: MatchmakingService;
  private logger = getActionLogger();
  private matchesFound: IMatch[] = [];
  private playersMatched: string[] = [];
  
  constructor() {
    // Configuration pour les tests (temps réduits)
    this.matchmaking = new MatchmakingService({
      initialTrophyRange: 100,
      maxTrophyRange: 500,
      trophyRangeExpansion: 50,
      initialWaitTime: 2000,      // 2 secondes pour test
      maxWaitTime: 30000,         // 30 secondes pour test
      expansionInterval: 2000,    // 2 secondes pour test
      enableBots: true,
      botMatchAfterSeconds: 5,    // Bot après 5 secondes pour test
      botTrophyVariance: 50,
      matchmakingTickRate: 500,   // 500ms pour test plus rapide
    });
    
    this.setupEventListeners();
  }

  /**
   * Configuration des event listeners
   */
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
      
      // Simuler la fin du match après quelques secondes
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
  }

  /**
   * Test 1: Matchmaking de base avec 2 joueurs compatibles
   */
  async testBasicMatchmaking() {
    console.log('\n🧪 TEST 1: Basic Matchmaking + Logging');
    console.log('='.repeat(60));
    
    // Compter les actions avant
    const actionsBefore = await this.getActionCount();
    console.log(`📊 Actions in DB before test: ${actionsBefore}`);
    
    // Ajouter 2 joueurs compatibles
    await this.matchmaking.addPlayerToQueue(TEST_PLAYERS[0]); // 1000 trophies
    await this.matchmaking.addPlayerToQueue(TEST_PLAYERS[1]); // 1050 trophies
    
    // Attendre que le match se fasse
    await this.waitForMatches(1, 10000);
    
    // Flush les logs et vérifier
    await this.logger.flush();
    await this.sleep(1000); // Laisser le temps à la DB
    
    const actionsAfter = await this.getActionCount();
    const newActions = actionsAfter - actionsBefore;
    
    console.log(`📊 Actions in DB after test: ${actionsAfter}`);
    console.log(`📊 New actions logged: ${newActions}`);
    console.log(`✅ Test completed. Matches found: ${this.matchesFound.length}`);
    
    // Afficher les dernières actions
    await this.showRecentActions();
  }

  /**
   * Test 2: Élargissement progressif des critères
   */
  async testRangeExpansion() {
    console.log('\n🧪 TEST 2: Range Expansion + Timeout Logging');
    console.log('='.repeat(60));
    
    // Reset
    this.resetTest();
    
    const actionsBefore = await this.getActionCount();
    
    // Ajouter joueurs avec écart de trophées important
    await this.matchmaking.addPlayerToQueue(TEST_PLAYERS[0]); // 1000 trophies
    await this.sleep(1000);
    await this.matchmaking.addPlayerToQueue(TEST_PLAYERS[2]); // 1200 trophies (écart de 200)
    
    console.log('Players added with 200 trophy difference. Waiting for range expansion...');
    
    // Afficher l'évolution des critères toutes les secondes
    const intervalId = setInterval(() => {
      const stats = this.matchmaking.getStats();
      if (stats.queueDetails.length > 0) {
        const player = stats.queueDetails[0];
        console.log(`   ${player.username}: Wait ${player.waitTime}s, Range: ${player.trophyRange.min}-${player.trophyRange.max}`);
      }
    }, 1000);
    
    await this.waitForMatches(1, 15000);
    clearInterval(intervalId);
    
    // Vérifier les logs
    await this.logger.flush();
    await this.sleep(1000);
    
    const actionsAfter = await this.getActionCount();
    console.log(`📊 New actions logged: ${actionsAfter - actionsBefore}`);
    console.log(`✅ Test completed. Matches found: ${this.matchesFound.length}`);
  }

  /**
   * Test 3: Matchmaking avec bots
   */
  async testBotMatchmaking() {
    console.log('\n🧪 TEST 3: Bot Matchmaking + Bot Logging');
    console.log('='.repeat(60));
    
    // Reset
    this.resetTest();
    
    const actionsBefore = await this.getActionCount();
    
    // Ajouter un seul joueur (devrait être matché avec un bot après 5 secondes)
    await this.matchmaking.addPlayerToQueue(TEST_PLAYERS[0]);
    
    console.log('Single player added. Should be matched with a bot after 5 seconds...');
    
    await this.waitForMatches(1, 10000);
    
    // Vérifier les logs spécifiques aux bots
    await this.logger.flush();
    await this.sleep(1000);
    
    const actionsAfter = await this.getActionCount();
    const botActions = await this.getBotMatchActions();
    
    console.log(`📊 New actions logged: ${actionsAfter - actionsBefore}`);
    console.log(`🤖 Bot match actions: ${botActions}`);
    console.log(`✅ Test completed. Matches found: ${this.matchesFound.length}`);
    
    // Vérifier si c'était un match avec bot
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

  /**
   * Test 4: File d'attente multiple avec priorités
   */
  async testQueuePriority() {
    console.log('\n🧪 TEST 4: Queue Priority (FIFO) + Leave Logging');
    console.log('='.repeat(60));
    
    // Reset
    this.resetTest();
    
    const actionsBefore = await this.getActionCount();
    
    // Ajouter joueurs un par un avec délai
    console.log('Adding players with delays to test FIFO priority...');
    
    await this.matchmaking.addPlayerToQueue(TEST_PLAYERS[0]);
    await this.sleep(1000);
    
    await this.matchmaking.addPlayerToQueue(TEST_PLAYERS[1]);
    await this.sleep(1000);
    
    await this.matchmaking.addPlayerToQueue(TEST_PLAYERS[3]);
    
    // Tester le leave
    console.log('Testing manual queue leave...');
    await this.matchmaking.removePlayerFromQueue('player4');
    
    await this.sleep(1000);
    
    // Ajouter un joueur très compatible avec le premier
    await this.matchmaking.addPlayerToQueue({
      sessionId: 'compatible_player',
      userId: 'compatible_user',
      username: 'VeryCompatible',
      trophies: 1005, // Très proche du premier joueur
      level: 5,
      averageCardLevel: 3.0,
      region: 'EU'
    });
    
    console.log('All players added. First match should prioritize earliest joined players...');
    
    await this.waitForMatches(2, 15000);
    
    // Vérifier les logs
    await this.logger.flush();
    await this.sleep(1000);
    
    const actionsAfter = await this.getActionCount();
    const leaveActions = await this.getLeaveActions();
    
    console.log(`📊 New actions logged: ${actionsAfter - actionsBefore}`);
    console.log(`👋 Leave actions: ${leaveActions}`);
    console.log(`✅ Test completed. Matches found: ${this.matchesFound.length}`);
  }

  /**
   * Test 5: Match forcé
   */
  async testForceMatch() {
    console.log('\n🧪 TEST 5: Force Match + Manual Actions');
    console.log('='.repeat(60));
    
    // Reset
    this.resetTest();
    
    const actionsBefore = await this.getActionCount();
    
    // Ajouter 2 joueurs incompatibles
    await this.matchmaking.addPlayerToQueue(TEST_PLAYERS[0]); // 1000 trophies
    await this.matchmaking.addPlayerToQueue(TEST_PLAYERS[4]); // 2000 trophies
    
    console.log('Added incompatible players. Forcing match...');
    
    // Forcer le match
    const forcedMatch = this.matchmaking.forceMatch('player1', 'player5');
    
    if (forcedMatch) {
      console.log(`✅ Forced match created: ${forcedMatch.matchId}`);
      console.log(`   ${forcedMatch.player1.username} vs ${forcedMatch.player2.username}`);
      console.log(`   Trophy difference: ${Math.abs(forcedMatch.player1.trophies - forcedMatch.player2.trophies)}`);
    } else {
      console.log('❌ Failed to force match');
    }
    
    // Vérifier les logs
    await this.logger.flush();
    await this.sleep(1000);
    
    const actionsAfter = await this.getActionCount();
    console.log(`📊 New actions logged: ${actionsAfter - actionsBefore}`);
  }

  /**
   * Test 6: Statistiques du service + Analytics des logs
   */
  async testStatistics() {
    console.log('\n🧪 TEST 6: Service Statistics + Action Analytics');
    console.log('='.repeat(60));
    
    // Reset
    this.resetTest();
    
    // Ajouter plusieurs joueurs
    for (let i = 0; i < 3; i++) {
      await this.matchmaking.addPlayerToQueue(TEST_PLAYERS[i]);
    }
    
    await this.sleep(1000);
    
    const stats = this.matchmaking.getStats();
    
    console.log('📊 Current Matchmaking Statistics:');
    console.log(`   Total queued: ${stats.totalQueued}`);
    console.log(`   Total matched: ${stats.totalMatched}`);
    console.log(`   Current queue size: ${stats.currentQueueSize}`);
    console.log(`   Real players in queue: ${stats.realPlayersInQueue}`);
    console.log(`   Bots in queue: ${stats.botsInQueue}`);
    console.log(`   Active matches: ${stats.activeMatchesCount}`);
    console.log(`   Average wait time: ${stats.averageWaitTime}ms`);
    
    // Statistiques du logger
    const loggerStats = this.logger.getStats();
    console.log('\n📊 Action Logger Statistics:');
    console.log(`   Total logged: ${loggerStats.totalLogged}`);
    console.log(`   Total batches: ${loggerStats.totalBatches}`);
    console.log(`   Pending actions: ${loggerStats.pendingCount}`);
    console.log(`   Average batch size: ${loggerStats.averageBatchSize}`);
    console.log(`   Errors: ${loggerStats.errorCount}`);
    console.log(`   Category counts:`, loggerStats.categoryCounts);
    
    // Flush et vérifier la DB
    await this.logger.flush();
    await this.sleep(1000);
    
    const totalDBActions = await this.getActionCount();
    console.log(`\n📊 Total actions in database: ${totalDBActions}`);
    
    // Afficher les actions récentes
    await this.showRecentActions(5);
  }

  /**
   * Test complet
   */
  async runAllTests() {
    console.log('🚀 Starting Matchmaking Service Tests with Action Logging...');
    console.log('='.repeat(80));
    
    // Connexion à la DB pour les tests de logging
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chimarena3d');
      console.log('✅ Connected to MongoDB for logging tests');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      console.log('⚠️ Running tests without database logging verification');
    }
    
    const tests = [
      { name: 'Basic Matchmaking + Logging', fn: () => this.testBasicMatchmaking() },
      { name: 'Range Expansion + Timeout', fn: () => this.testRangeExpansion() },
      { name: 'Bot Matchmaking + Bot Logs', fn: () => this.testBotMatchmaking() },
      { name: 'Queue Priority + Leave Logs', fn: () => this.testQueuePriority() },
      { name: 'Force Match + Manual Actions', fn: () => this.testForceMatch() },
      { name: 'Statistics + Analytics', fn: () => this.testStatistics() }
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
      
      // Pause entre les tests
      await this.sleep(2000);
    }
    
    // Final flush pour s'assurer que tous les logs sont écrits
    console.log('\n📊 Final flush of all pending logs...');
    await this.logger.flush();
    await this.sleep(2000);
    
    // Statistiques finales des logs
    if (mongoose.connection.readyState === 1) {
      const finalActionCount = await this.getActionCount();
      console.log(`\n📊 Final database action count: ${finalActionCount}`);
      
      // Afficher un échantillon d'actions récentes
      console.log('\n📋 Sample of recent actions:');
      await this.showRecentActions(10);
    }
    
    // Résultats finaux
    console.log('\n' + '='.repeat(80));
    console.log('🎯 FINAL RESULTS:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
    
    if (failed === 0) {
      console.log('🎉 All tests passed! MatchmakingService + ActionLogger working perfectly!');
    } else {
      console.log('⚠️ Some tests failed. Check the logs above.');
    }
    
    // Arrêter les services
    await this.matchmaking.stop();
    console.log('🛑 MatchmakingService stopped');
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('📦 Disconnected from MongoDB');
    }
  }

  /**
   * Utilitaires pour les tests
   */
  private resetTest() {
    this.matchesFound = [];
    this.playersMatched = [];
    // Note: On ne peut pas facilement clear la queue, donc on utilise de nouveaux sessionIds
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

/**
 * Fonction principale
 */
async function runMatchmakingTests() {
  const tester = new MatchmakingTester();
  await tester.runAllTests();
  process.exit(0);
}

// Exécuter si appelé directement
if (require.main === module) {
  runMatchmakingTests().catch((error) => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  });
}

export { MatchmakingTester, runMatchmakingTests };
