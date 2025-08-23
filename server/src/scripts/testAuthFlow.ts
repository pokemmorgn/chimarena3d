import 'dotenv/config';

/**
 * Script de test pour la nouvelle architecture AuthRoom → WorldRoom
 * Usage: npx ts-node src/scripts/testAuthFlow.ts [command]
 * 
 * Commands:
 *   full          - Test complet Auth → World
 *   auth-only     - Test AuthRoom uniquement
 *   world-reject  - Test rejet WorldRoom sans auth
 *   stress        - Test de charge avec plusieurs connexions
 */

// Import dynamique de colyseus.js (à installer avec npm install colyseus.js)
let ColyseusClient: any;

const SERVER_URL = process.env.SERVER_URL || 'ws://localhost:2567';

// Données de test - Modifier selon vos utilisateurs de test
const TEST_USERS = [
  { identifier: 'test', password: 'testtest' },
  { identifier: 'Gregs', password: 'testtest' }, // Si vous avez cet utilisateur
  // Ajoutez d'autres utilisateurs de test si nécessaire
];

interface AuthData {
  userId: string;
  authToken: string;
  username: string;
  displayName: string;
  level: number;
  trophies: number;
}

class AuthFlowTester {
  private authClient: any = null;
  private worldClient: any = null;
  private authData: AuthData | null = null;
  private testResults: { [key: string]: boolean } = {};

  constructor() {
    this.loadColyseusClient();
  }

  private async loadColyseusClient() {
    try {
      const colyseus = await import('colyseus.js');
      ColyseusClient = colyseus.Client;
    } catch (error) {
      console.error('❌ colyseus.js not found. Please install it:');
      console.error('   npm install colyseus.js@^0.15.0');
      process.exit(1);
    }
  }

  /**
   * Test complet du flux Auth → World
   */
  async testCompleteFlow(userIndex: number = 0): Promise<boolean> {
    console.log('🧪 Testing complete Auth → World flow');
    console.log('='.repeat(60));

    const testUser = TEST_USERS[userIndex] || TEST_USERS[0];
    console.log(`👤 Using test user: ${testUser.identifier}`);

    try {
      // Étape 1: Connexion à AuthRoom
      console.log('\n📝 Step 1: Connecting to AuthRoom...');
      const authSuccess = await this.connectToAuthRoom();
      this.testResults['auth_connection'] = authSuccess;
      if (!authSuccess) throw new Error('AuthRoom connection failed');

      // Étape 2: Authentification
      console.log('\n🔐 Step 2: Authenticating...');
      const loginSuccess = await this.authenticate(testUser);
      this.testResults['authentication'] = loginSuccess;
      if (!loginSuccess) throw new Error('Authentication failed');

      // Étape 3: Connexion à WorldRoom
      console.log('\n🌍 Step 3: Connecting to WorldRoom...');
      const worldSuccess = await this.connectToWorldRoom();
      this.testResults['world_connection'] = worldSuccess;
      if (!worldSuccess) throw new Error('WorldRoom connection failed');

      // Étape 4: Tests dans WorldRoom
      console.log('\n🎮 Step 4: Testing WorldRoom features...');
      const featuresSuccess = await this.testWorldRoomFeatures();
      this.testResults['world_features'] = featuresSuccess;

      // Étape 5: Test du matchmaking (optionnel)
      console.log('\n⚔️ Step 5: Testing matchmaking (15s timeout)...');
      const matchmakingSuccess = await this.testMatchmaking();
      this.testResults['matchmaking'] = matchmakingSuccess;

      console.log('\n✅ All tests completed successfully!');
      this.printTestResults();
      return true;

    } catch (error) {
      console.error('❌ Test failed:', error);
      this.printTestResults();
      return false;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Test AuthRoom uniquement
   */
  async testAuthRoomOnly(userIndex: number = 0): Promise<boolean> {
    console.log('🧪 Testing AuthRoom only');
    console.log('='.repeat(40));

    const testUser = TEST_USERS[userIndex] || TEST_USERS[0];

    try {
      await this.connectToAuthRoom();
      await this.authenticate(testUser);
      
      console.log('✅ AuthRoom test successful');
      console.log(`   User: ${this.authData?.username}`);
      console.log(`   Level: ${this.authData?.level}`);
      console.log(`   Trophies: ${this.authData?.trophies}`);
      console.log(`   Token length: ${this.authData?.authToken.length} chars`);
      
      return true;
    } catch (error) {
      console.error('❌ AuthRoom test failed:', error);
      return false;
    } finally {
      if (this.authClient) {
        try {
          this.authClient.send('logout');
          await this.sleep(500);
          await this.authClient.leave();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }

  /**
   * Test rejet WorldRoom sans authentification valide
   */
  async testWorldRoomRejection(): Promise<boolean> {
    console.log('🧪 Testing WorldRoom rejection without valid auth');
    console.log('='.repeat(50));

    let testClient: any = null;

    try {
      testClient = new ColyseusClient(SERVER_URL);
      
      console.log('   Attempting to join WorldRoom with fake credentials...');
      
      // Essayer de rejoindre WorldRoom avec de fausses données
      await testClient.joinOrCreate('world', {}, {
        userId: 'fake-user-id-' + Date.now(),
        authToken: 'fake-token-that-should-not-work'
      });
      
      console.log('❌ ERROR: WorldRoom should have rejected fake auth!');
      return false;
      
    } catch (error: any) {
      console.log('✅ WorldRoom correctly rejected invalid auth');
      console.log(`   Rejection reason: ${error.message}`);
      return true;
    } finally {
      if (testClient) {
        try {
          await testClient.leave();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }

  /**
   * Test de charge avec plusieurs connexions simultanées
   */
  async testStressConnections(connectionCount: number = 3): Promise<boolean> {
    console.log(`🧪 Testing stress with ${connectionCount} simultaneous connections`);
    console.log('='.repeat(60));

    const connections: Promise<boolean>[] = [];

    // Créer plusieurs connexions en parallèle
    for (let i = 0; i < connectionCount && i < TEST_USERS.length; i++) {
      const tester = new AuthFlowTester();
      connections.push(
        tester.testCompleteFlow(i).catch(() => false)
      );
      
      // Délai entre les connexions pour éviter le spam
      await this.sleep(1000);
    }

    // Attendre toutes les connexions
    const results = await Promise.all(connections);
    const successCount = results.filter(r => r).length;

    console.log(`\n📊 Stress test results:`);
    console.log(`   Successful connections: ${successCount}/${connectionCount}`);
    console.log(`   Success rate: ${Math.round((successCount / connectionCount) * 100)}%`);

    return successCount === connectionCount;
  }

  /**
   * Connexion à AuthRoom
   */
  private async connectToAuthRoom(): Promise<boolean> {
    return new Promise((resolve) => {
      this.authClient = new ColyseusClient(SERVER_URL);

      this.authClient.joinOrCreate('auth')
        .then((room: any) => {
          console.log('✅ Connected to AuthRoom');
          
          // Écouter les messages d'auth
          room.onMessage('auth_required', (message: any) => {
            console.log('🔑 Auth required:', message.message);
          });

          room.onMessage('auth_success', (message: any) => {
            console.log('✅ Authentication successful!');
            this.authData = {
              userId: message.user.id,
              authToken: message.tokens.accessToken,
              username: message.user.username,
              displayName: message.user.displayName,
              level: message.user.level,
              trophies: message.user.trophies
            };
            resolve(true);
          });

          room.onMessage('auth_error', (message: any) => {
            console.error('❌ Auth error:', message.message, `(${message.code})`);
            resolve(false);
          });

          room.onError((code: number, message: string) => {
            console.error(`❌ AuthRoom error (${code}):`, message);
            resolve(false);
          });

          // Timeout de sécurité
          setTimeout(() => {
            console.error('⏰ AuthRoom connection timeout');
            resolve(false);
          }, 10000);

        })
        .catch((error: any) => {
          console.error('❌ Failed to connect to AuthRoom:', error.message);
          resolve(false);
        });
    });
  }

  /**
   * Authentification avec credentials
   */
  private async authenticate(testUser: { identifier: string, password: string }): Promise<boolean> {
    if (!this.authClient) {
      console.error('❌ Not connected to AuthRoom');
      return false;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.error('⏰ Authentication timeout');
        resolve(false);
      }, 8000);

      // Le listener auth_success est déjà configuré dans connectToAuthRoom
      const originalAuthSuccess = this.authData;
      
      // Vérifier si l'auth réussit
      const checkAuth = setInterval(() => {
        if (this.authData && this.authData !== originalAuthSuccess) {
          clearInterval(checkAuth);
          clearTimeout(timeout);
          resolve(true);
        }
      }, 100);

      // Envoyer les credentials
      console.log(`   Sending credentials for: ${testUser.identifier}`);
      this.authClient.send('login', {
        identifier: testUser.identifier,
        password: testUser.password
      });
    });
  }

  /**
   * Connexion à WorldRoom avec auth token
   */
  private async connectToWorldRoom(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.authData) {
        console.error('❌ No auth data available');
        resolve(false);
        return;
      }

      this.worldClient = new ColyseusClient(SERVER_URL);

      // Joindre WorldRoom avec les données d'auth
      this.worldClient.joinOrCreate('world', {
        region: 'EU'
      }, {
        userId: this.authData.userId,
        authToken: this.authData.authToken,
        region: 'EU'
      })
        .then((room: any) => {
          console.log('✅ Connected to WorldRoom');
          
          // Écouter les messages de bienvenue
          room.onMessage('world_welcome', (message: any) => {
            console.log('🌍 World welcome:', message.message);
            console.log(`   Online players: ${message.onlinePlayers}`);
            console.log(`   Player rank: ${message.playerInfo?.rank || 'Unknown'}`);
            resolve(true);
          });

          // Écouter les erreurs
          room.onError((code: number, message: string) => {
            console.error(`❌ WorldRoom error (${code}):`, message);
            resolve(false);
          });

          // Autres événements utiles
          room.onMessage('player_joined', (message: any) => {
            if (message.username !== this.authData?.username) {
              console.log(`👤 Other player joined: ${message.username}`);
            }
          });

          room.onMessage('auth_expired', (message: any) => {
            console.warn('⚠️ Auth expired in WorldRoom:', message.message);
          });

          // Timeout
          setTimeout(() => {
            console.error('⏰ WorldRoom connection timeout');
            resolve(false);
          }, 8000);

        })
        .catch((error: any) => {
          console.error('❌ Failed to connect to WorldRoom:', error.message);
          resolve(false);
        });
    });
  }

  /**
   * Tester les fonctionnalités de WorldRoom
   */
  private async testWorldRoomFeatures(): Promise<boolean> {
    if (!this.worldClient) {
      console.error('❌ Not connected to WorldRoom');
      return false;
    }

    try {
      // Test 1: Vérification du statut d'auth
      console.log('   🔍 Testing auth status verification...');
      this.worldClient.send('verify_auth');
      await this.sleep(500);

      // Test 2: Obtenir les statistiques
      console.log('   📊 Testing stats retrieval...');
      this.worldClient.send('get_stats');
      await this.sleep(500);

      // Test 3: Envoyer un message de chat
      console.log('   💬 Testing chat message...');
      this.worldClient.send('chat', {
        message: `Hello from test script! (${this.authData?.username})`,
        channel: 'global'
      });
      await this.sleep(500);

      // Test 4: Changer le statut ready
      console.log('   ✅ Testing ready status...');
      this.worldClient.send('ready_status', { isReady: true });
      await this.sleep(500);

      console.log('✅ WorldRoom features tested successfully');
      return true;

    } catch (error) {
      console.error('❌ WorldRoom features test failed:', error);
      return false;
    }
  }

  /**
   * Tester le matchmaking
   */
  private async testMatchmaking(): Promise<boolean> {
    if (!this.worldClient) {
      console.error('❌ Not connected to WorldRoom');
      return false;
    }

    return new Promise((resolve) => {
      let queueJoined = false;
      let matchFound = false;

      // Écouter les événements de queue
      this.worldClient.onMessage('queue_joined', (message: any) => {
        queueJoined = true;
        console.log('✅ Joined matchmaking queue');
        console.log(`   Position: ${message.position}`);
        console.log(`   Estimated wait: ${Math.round(message.estimatedWaitTime / 1000)}s`);
        console.log(`   Trophy range: ${message.queueInfo?.trophyRange || 'Unknown'}`);
        
        // Attendre 10 secondes puis quitter la queue si pas de match
        setTimeout(() => {
          if (!matchFound) {
            console.log('   🚪 Leaving queue after 10s...');
            this.worldClient.send('leave_queue');
          }
        }, 10000);
      });

      this.worldClient.onMessage('queue_left', (message: any) => {
        console.log(`✅ Left queue: ${message.reason}`);
        resolve(queueJoined); // Succès si on a au moins rejoint la queue
      });

      this.worldClient.onMessage('match_found', (message: any) => {
        matchFound = true;
        console.log('⚔️ MATCH FOUND!');
        console.log(`   Match ID: ${message.matchId}`);
        console.log(`   Opponent: ${message.opponent.username}${message.opponent.isBot ? ' [BOT]' : ''}`);
        console.log(`   Opponent trophies: ${message.opponent.trophies}`);
        console.log(`   Wait time: ${Math.round(message.waitTime / 1000)}s`);
        console.log(`   Average trophies: ${message.averageTrophies}`);
        resolve(true);
      });

      this.worldClient.onMessage('error', (message: any) => {
        if (message.code === 'AUTH_EXPIRED' || message.code === 'AUTH_TOO_OLD') {
          console.error('❌ Auth error during matchmaking:', message.message);
          resolve(false);
        }
      });

      // Envoyer la demande de queue
      console.log('   🎯 Joining matchmaking queue...');
      this.worldClient.send('join_queue', { deckIndex: 0 });

      // Timeout global
      setTimeout(() => {
        if (!queueJoined && !matchFound) {
          console.log('⏰ Matchmaking test timeout - no queue activity');
          resolve(false);
        } else if (queueJoined && !matchFound) {
          console.log('⏰ Matchmaking test completed - no match found (normal)');
          resolve(true);
        }
      }, 15000);
    });
  }

  /**
   * Nettoyage des connexions
   */
  private async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up connections...');
    
    const cleanupPromises = [];

    if (this.worldClient) {
      cleanupPromises.push(
        this.worldClient.leave()
          .then(() => console.log('✅ WorldRoom disconnected'))
          .catch(() => console.log('⚠️ Error disconnecting from WorldRoom'))
      );
    }

    if (this.authClient) {
      cleanupPromises.push(
        Promise.resolve()
          .then(() => this.authClient.send('logout'))
          .then(() => this.sleep(200))
          .then(() => this.authClient.leave())
          .then(() => console.log('✅ AuthRoom disconnected'))
          .catch(() => console.log('⚠️ Error disconnecting from AuthRoom'))
      );
    }

    await Promise.all(cleanupPromises);
  }

  /**
   * Afficher les résultats des tests
   */
  private printTestResults(): void {
    console.log('\n📊 Test Results Summary:');
    console.log('='.repeat(30));
    
    Object.entries(this.testResults).forEach(([test, success]) => {
      const icon = success ? '✅' : '❌';
      const status = success ? 'PASSED' : 'FAILED';
      console.log(`   ${icon} ${test.replace('_', ' ')}: ${status}`);
    });
    
    const totalTests = Object.keys(this.testResults).length;
    const passedTests = Object.values(this.testResults).filter(Boolean).length;
    const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    
    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed (${successRate}%)`);
  }

  /**
   * Utilitaire pour attendre
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Fonction principale
 */
async function main() {
  const command = process.argv[2] || 'full';
  
  console.log('🚀 AuthRoom + WorldRoom Test Suite');
  console.log(`📡 Server: ${SERVER_URL}`);
  console.log(`👥 Available test users: ${TEST_USERS.length}`);
  console.log('='.repeat(80));

  const tester = new AuthFlowTester();

  try {
    let success = false;

    switch (command) {
      case 'full':
        console.log('🧪 Running complete Auth → World flow test');
        success = await tester.testCompleteFlow();
        break;
        
      case 'auth-only':
        console.log('🧪 Testing AuthRoom authentication only');
        success = await tester.testAuthRoomOnly();
        break;
        
      case 'world-reject':
        console.log('🧪 Testing WorldRoom rejection without valid auth');
        success = await tester.testWorldRoomRejection();
        break;
        
      case 'stress':
        const connectionCount = parseInt(process.argv[3]) || 3;
        console.log(`🧪 Running stress test with ${connectionCount} connections`);
        success = await tester.testStressConnections(connectionCount);
        break;
        
      default:
        console.log('📖 Usage: npx ts-node src/scripts/testAuthFlow.ts [command]');
        console.log('');
        console.log('Commands:');
        console.log('  full          - Complete Auth → World flow test (default)');
        console.log('  auth-only     - Test AuthRoom authentication only');  
        console.log('  world-reject  - Test WorldRoom auth rejection');
        console.log('  stress [n]    - Stress test with n connections (default: 3)');
        console.log('');
        console.log('Examples:');
        console.log('  npx ts-node src/scripts/testAuthFlow.ts full');
        console.log('  npx ts-node src/scripts/testAuthFlow.ts auth-only');
        console.log('  npx ts-node src/scripts/testAuthFlow.ts stress 5');
        process.exit(0);
    }

    if (success) {
      console.log('\n🎉 All tests completed successfully!');
      process.exit(0);
    } else {
      console.log('\n💥 Some tests failed. Check the logs above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 Test suite crashed:', error);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

export { AuthFlowTester };
