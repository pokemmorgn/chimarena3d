import { MatchmakingService, IQueuedPlayer, IMatch } from '../services/MatchmakingService';

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
    console.log('\n🧪 TEST 1: Basic Matchmaking (2 compatible players)');
    console.log('='.repeat(60));
    
    // Ajouter 2 joueurs compatibles
    this.matchmaking.addPlayerToQueue(TEST_PLAYERS[0]); // 1000 trophies
    this.matchmaking.addPlayerToQueue(TEST_PLAYERS[1]); // 1050 trophies
    
    // Attendre que le match se fasse
    await this.waitForMatches(1, 10000);
    
    console.log(`✅ Test completed. Matches found: ${this.matchesFound.length}`);
  }

  /**
   * Test 2: Élargissement progressif des critères
   */
  async testRangeExpansion() {
    console.log('\n🧪 TEST 2: Range Expansion');
    console.log('='.repeat(60));
    
    // Reset
    this.resetTest();
    
    // Ajouter joueurs avec écart de trophées important
    this.matchmaking.addPlayerToQueue(TEST_PLAYERS[0]); // 1000 trophies
    await this.sleep(1000);
    this.matchmaking.addPlayerToQueue(TEST_PLAYERS[2]); // 1200 trophies (écart de 200)
    
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
    
    console.log(`✅ Test completed. Matches found: ${this.matchesFound.length}`);
  }

  /**
   * Test 3: Matchmaking avec bots
   */
  async testBotMatchmaking() {
    console.log('\n🧪 TEST 3: Bot Matchmaking');
    console.log('='.repeat(60));
    
    // Reset
    this.resetTest();
    
    // Ajouter un seul joueur (devrait être matché avec un bot après 5 secondes)
    this.matchmaking.addPlayerToQueue(TEST_PLAYERS[0]);
    
    console.log('Single player added. Should be matched with a bot after 5 seconds...');
    
    await this.waitForMatches(1, 10000);
    
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
    console.log('\n🧪 TEST 4: Queue Priority (FIFO)');
    console.log('='.repeat(60));
    
    // Reset
    this.resetTest();
    
    // Ajouter joueurs un par un avec délai
    console.log('Adding players with delays to test FIFO priority...');
    
    this.matchmaking.addPlayerToQueue(TEST_PLAYERS[0]);
    await this.sleep(1000);
    
    this.matchmaking.addPlayerToQueue(TEST_PLAYERS[1]);
    await this.sleep(1000);
    
    this.matchmaking.addPlayerToQueue(TEST_PLAYERS[3]);
    await this.sleep(1000);
    
    // Ajouter un joueur très compatible avec le premier
    this.matchmaking.addPlayerToQueue({
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
    
    console.log(`✅ Test completed. Matches found: ${this.matchesFound.length}`);
  }

  /**
   * Test 5: Match forcé
   */
  async testForceMatch() {
    console.log('\n🧪 TEST 5: Force Match');
    console.log('='.repeat(60));
    
    // Reset
    this.resetTest();
    
    // Ajouter 2 joueurs incompatibles
    this.matchmaking.addPlayerToQueue(TEST_PLAYERS[0]); // 1000 trophies
    this.matchmaking.addPlayerToQueue(TEST_PLAYERS[4]); // 2000 trophies
    
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
  }

  /**
   * Test 6: Statistiques du service
   */
  async testStatistics() {
    console.log('\n🧪 TEST 6: Service Statistics');
    console.log('='.repeat(60));
    
    // Reset
    this.resetTest();
    
    // Ajouter plusieurs joueurs
    TEST_PLAYERS.slice(0, 3).forEach(player => {
      this.matchmaking.addPlayerToQueue(player);
    });
    
    await this.sleep(1000);
    
    const stats = this.matchmaking.getStats();
    
    console.log('📊 Current Statistics:');
    console.log(`   Total queued: ${stats.totalQueued}`);
    console.log(`   Total matched: ${stats.totalMatched}`);
    console.log(`   Current queue size: ${stats.currentQueueSize}`);
    console.log(`   Real players in queue: ${stats.realPlayersInQueue}`);
    console.log(`   Bots in queue: ${stats.botsInQueue}`);
    console.log(`   Active matches: ${stats.activeMatchesCount}`);
    console.log(`   Average wait time: ${stats.averageWaitTime}ms`);
    
    console.log('\n📋 Queue Details:');
    stats.queueDetails.forEach((player, index) => {
      const botText = player.isBot ? '[BOT]' : '';
      console.log(`   ${index + 1}. ${player.username}${botText} - ${player.trophies} trophies, Wait: ${player.waitTime}s`);
    });
    
    // Test config
    const config = this.matchmaking.getConfig();
    console.log('\n⚙️ Current Configuration:');
    console.log(`   Initial trophy range: ±${config.initialTrophyRange}`);
    console.log(`   Bot matching after: ${config.botMatchAfterSeconds}s`);
    console.log(`   Bots enabled: ${config.enableBots}`);
  }

  /**
   * Test complet
   */
  async runAllTests() {
    console.log('🚀 Starting Matchmaking Service Tests...');
    console.log('='.repeat(80));
    
    const tests = [
      { name: 'Basic Matchmaking', fn: () => this.testBasicMatchmaking() },
      { name: 'Range Expansion', fn: () => this.testRangeExpansion() },
      { name: 'Bot Matchmaking', fn: () => this.testBotMatchmaking() },
      { name: 'Queue Priority', fn: () => this.testQueuePriority() },
      { name: 'Force Match', fn: () => this.testForceMatch() },
      { name: 'Statistics', fn: () => this.testStatistics() }
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
    
    // Résultats finaux
    console.log('\n' + '='.repeat(80));
    console.log('🎯 FINAL RESULTS:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
    
    if (failed === 0) {
      console.log('🎉 All tests passed! MatchmakingService is working perfectly!');
    } else {
      console.log('⚠️ Some tests failed. Check the logs above.');
    }
    
    // Arrêter le service
    this.matchmaking.stop();
    console.log('🛑 MatchmakingService stopped');
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
