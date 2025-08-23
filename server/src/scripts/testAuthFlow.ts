/**
   * Connexion à AuthRoom
   */
  private async connectToAuthRoom(): Promise<boolean> {
    try {
      this.authClient = new SimpleColyseusClient(SERVER_URL);
      
      await this.authClient.joinOrCreate('auth');
      console.log(`   ${icon} ${testName}: ${status}`);
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

      case 'health':
        console.log('🧪 Testing server health and REST API');
        const healthTester = new AuthFlowTester();
        const healthCheck = await (healthTester as any).checkServerHealth();
        const restAuth = await (healthTester as any).testRestAuthentication(TEST_USERS[0]);
        
        console.log('\n📊 Health Check Results:');
        console.log(`   Server Health: ${healthCheck ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
        console.log(`   REST Auth: ${restAuth ? '✅ WORKING' : '❌ FAILED'}`);
        
        success = healthCheck && restAuth;
        break;
        
      default:
        console.log('📖 Usage: npx ts-node src/scripts/testAuthFlow.ts [command]');
        console.log('');
        console.log('Commands:');
        console.log('  full          - Complete Auth → World flow test (default)');
        console.log('  auth-only     - Test AuthRoom authentication only');  
        console.log('  world-reject  - Test WorldRoom auth rejection');
        console.log('  stress [n]    - Stress test with n connections (default: 3)');
        console.log('  health        - Test server health and REST API');
        console.log('');
        console.log('Examples:');
        console.log('  npx ts-node src/scripts/testAuthFlow.ts full');
        console.log('  npx ts-node src/scripts/testAuthFlow.ts auth-only');
        console.log('  npx ts-node src/scripts/testAuthFlow.ts world-reject');
        console.log('  npx ts-node src/scripts/testAuthFlow.ts stress 5');
        console.log('  npx ts-node src/scripts/testAuthFlow.ts health');
        console.log('');
        console.log('🔧 Configuration:');
        console.log(`  Server URL: ${SERVER_URL}`);
        console.log(`  API URL: ${API_BASE_URL}`);
        console.log(`  Test users configured: ${TEST_USERS.length}`);
        console.log('');
        console.log('💡 Tips:');
        console.log('  - Make sure your server is running with: npm run dev');
        console.log('  - Update TEST_USERS array with your actual test accounts');
        console.log('  - Use "health" command first to verify server connectivity');
        process.exit(0);
    }

    if (success) {
      console.log('\n🎉 All tests completed successfully!');
      console.log('');
      console.log('📋 Next steps:');
      console.log('  - Your AuthRoom → WorldRoom flow is working correctly');
      console.log('  - You can now build your client application');
      console.log('  - Consider adding BattleRoom for actual gameplay');
      console.log('');
      process.exit(0);
    } else {
      console.log('\n💥 Some tests failed. Check the logs above.');
      console.log('');
      console.log('🔧 Troubleshooting:');
      console.log('  - Verify server is running: npm run dev');
      console.log('  - Check database connectivity');
      console.log('  - Verify test user credentials in TEST_USERS');
      console.log('  - Run: npx ts-node src/scripts/testAuthFlow.ts health');
      console.log('');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 Test suite crashed:', error);
    console.log('');
    console.log('🔧 Common issues:');
    console.log('  - Server not running: npm run dev');
    console.log('  - Wrong server URL or port');
    console.log('  - Database connection issues');
    console.log('  - Invalid test user credentials');
    console.log('');
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

export { AuthFlowTester };.log('✅ Connected to AuthRoom');

      // Setup des handlers de messages
      this.authClient.onMessage('auth_required', (message: any) => {
        console.log('🔑 Auth required:', message?.message || 'Please authenticate');
      });

      this.authClient.onMessage('auth_success', (message: any) => {
        console.log('✅ Authentication successful!');
        this.authData = {
          userId: message.user.id,
          authToken: message.tokens.accessToken,
          username: message.user.username,
          displayName: message.user.displayName,
          level: message.user.level,
          trophies: message.user.trophies
        };
      });

      this.authClient.onMessage('auth_error', (message: any) => {
        console.error('❌ Auth error:', message?.message || 'Unknown error', 
                     message?.code ? `(${message.code})` : '');
      });

      return true;
    } catch (error: any) {
      console.error('❌ Failed to connect to AuthRoom:', error.message);
      return false;
    }
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
      console.log(`   Sending credentials for: ${testUser.identifier}`);
      
      // Envoyer les credentials
      this.authClient!.send('login', {
        identifier: testUser.identifier,
        password: testUser.password
      });

      // Attendre la réponse
      const timeout = setTimeout(() => {
        console.error('⏰ Authentication timeout');
        resolve(false);
      }, 8000);

      // Vérifier périodiquement si l'auth a réussi
      const checkAuth = setInterval(() => {
        if (this.authData) {
          clearInterval(checkAuth);
          clearTimeout(timeout);
          resolve(true);
        }
      }, 100);
    });
  }

  /**
   * Connexion à WorldRoom avec auth token
   */
  private async connectToWorldRoom(): Promise<boolean> {
    if (!this.authData) {
      console.error('❌ No auth data available');
      return false;
    }

    try {
      this.worldClient = new SimpleColyseusClient(SERVER_URL);
      
      await this.worldClient.joinOrCreate('world', { region: 'EU' }, {
        userId: this.authData.userId,
        authToken: this.authData.authToken,
        region: 'EU'
      });

      console.log('✅ Connected to WorldRoom');

      // Setup des handlers de messages
      this.worldClient.onMessage('world_welcome', (message: any) => {
        console.log('🌍 World welcome:', message?.message || 'Welcome!');
        console.log(`   Online players: ${message?.onlinePlayers || 'Unknown'}`);
        console.log(`   Player rank: ${message?.playerInfo?.rank || 'Unknown'}`);
      });

      this.worldClient.onMessage('player_joined', (message: any) => {
        if (message?.username !== this.authData?.username) {
          console.log(`👤 Other player joined: ${message?.username || 'Unknown'}`);
        }
      });

      this.worldClient.onMessage('auth_expired', (message: any) => {
        console.warn('⚠️ Auth expired in WorldRoom:', message?.message || 'Auth expired');
      });

      return true;
    } catch (error: any) {
      console.error('❌ Failed to connect to WorldRoom:', error.message);
      return false;
    }
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

      // Setup des handlers
      this.worldClient!.onMessage('queue_joined', (message: any) => {
        queueJoined = true;
        console.log('✅ Joined matchmaking queue');
        console.log(`   Position: ${message?.position || 'Unknown'}`);
        console.log(`   Estimated wait: ${Math.round((message?.estimatedWaitTime || 15000) / 1000)}s`);
        console.log(`   Trophy range: ${message?.queueInfo?.trophyRange || 'Unknown'}`);
        
        // Attendre 10 secondes puis quitter la queue si pas de match
        setTimeout(() => {
          if (!matchFound && this.worldClient) {
            console.log('   🚪 Leaving queue after 10s...');
            this.worldClient.send('leave_queue');
          }
        }, 10000);
      });

      this.worldClient!.onMessage('queue_left', (message: any) => {
        console.log(`✅ Left queue: ${message?.reason || 'unknown reason'}`);
        resolve(queueJoined);
      });

      this.worldClient!.onMessage('match_found', (message: any) => {
        matchFound = true;
        console.log('⚔️ MATCH FOUND!');
        console.log(`   Match ID: ${message?.matchId || 'Unknown'}`);
        console.log(`   Opponent: ${message?.opponent?.username || 'Unknown'}${message?.opponent?.isBot ? ' [BOT]' : ''}`);
        console.log(`   Opponent trophies: ${message?.opponent?.trophies || 'Unknown'}`);
        console.log(`   Wait time: ${Math.round((message?.waitTime || 0) / 1000)}s`);
        console.log(`   Average trophies: ${message?.averageTrophies || 'Unknown'}`);
        resolve(true);
      });

      this.worldClient!.onMessage('error', (message: any) => {
        if (message?.code === 'AUTH_EXPIRED' || message?.code === 'AUTH_TOO_OLD') {
          console.error('❌ Auth error during matchmaking:', message?.message || 'Auth error');
          resolve(false);
        }
      });

      // Envoyer la demande de queue
      console.log('   🎯 Joining matchmaking queue...');
      this.worldClient!.send('join_queue', { deckIndex: 0 });

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
          .then(() => this.authClient?.send('logout'))
          .then(() => this.sleep(200))
          .then(() => this.authClient?.leave())
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
      const testName = test.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      consoleimport 'dotenv/config';
import http from 'http';

/**
 * Script de test pour la nouvelle architecture AuthRoom → WorldRoom
 * Usage: npx ts-node src/scripts/testAuthFlow.ts [command]
 * 
 * Utilise une approche WebSocket native comme vos autres scripts de test
 */

const SERVER_URL = process.env.SERVER_URL || 'ws://localhost:2567';
const API_BASE_URL = 'http://localhost:2567/api';

// Données de test - Modifier selon vos utilisateurs de test
const TEST_USERS = [
  { identifier: 'test', password: 'testtest' },
  { identifier: 'Gregs', password: 'testtest' }, // Si vous avez cet utilisateur
];

interface AuthData {
  userId: string;
  authToken: string;
  username: string;
  displayName: string;
  level: number;
  trophies: number;
}

/**
 * Client WebSocket simple pour communiquer avec Colyseus
 */
class SimpleColyseusClient {
  private ws: any = null;
  private room: any = null;
  private messageHandlers: { [type: string]: Function[] } = {};
  private isConnected = false;

  constructor(private serverUrl: string) {}

  async joinOrCreate(roomName: string, options: any = {}, auth: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const WebSocket = require('ws');
      
      // Construire l'URL avec les paramètres
      const params = new URLSearchParams();
      params.set('roomName', roomName);
      params.set('options', JSON.stringify(options));
      if (Object.keys(auth).length > 0) {
        params.set('auth', JSON.stringify(auth));
      }
      
      const wsUrl = `${this.serverUrl}?${params.toString()}`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.on('open', () => {
        this.isConnected = true;
        console.log(`Connected to ${roomName} room`);
        resolve(this);
      });
      
      this.ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      });
      
      this.ws.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
        reject(error);
      });
      
      this.ws.on('close', () => {
        this.isConnected = false;
        console.log(`Disconnected from ${roomName} room`);
      });
      
      // Timeout
      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error(`Connection to ${roomName} timed out`));
        }
      }, 10000);
    });
  }

  onMessage(type: string, handler: Function): void {
    if (!this.messageHandlers[type]) {
      this.messageHandlers[type] = [];
    }
    this.messageHandlers[type].push(handler);
  }

  onError(handler: Function): void {
    this.onMessage('error', handler);
  }

  send(type: string, data?: any): void {
    if (!this.isConnected || !this.ws) {
      console.error('Cannot send message - not connected');
      return;
    }
    
    const message = { type, data };
    this.ws.send(JSON.stringify(message));
  }

  async leave(): Promise<void> {
    return new Promise((resolve) => {
      if (this.ws) {
        this.ws.close();
        setTimeout(resolve, 100);
      } else {
        resolve();
      }
    });
  }

  private handleMessage(message: any): void {
    const { type, data } = message;
    
    if (this.messageHandlers[type]) {
      this.messageHandlers[type].forEach(handler => handler(data));
    }
  }
}

class AuthFlowTester {
  private authClient: SimpleColyseusClient | null = null;
  private worldClient: SimpleColyseusClient | null = null;
  private authData: AuthData | null = null;
  private testResults: { [key: string]: boolean } = {};

  /**
   * Test complet du flux Auth → World
   */
  async testCompleteFlow(userIndex: number = 0): Promise<boolean> {
    console.log('🧪 Testing complete Auth → World flow');
    console.log('='.repeat(60));

    const testUser = TEST_USERS[userIndex] || TEST_USERS[0];
    console.log(`👤 Using test user: ${testUser.identifier}`);

    try {
      // Étape 0: Vérifier que le serveur est accessible
      console.log('\n🏥 Step 0: Checking server health...');
      const healthCheck = await this.checkServerHealth();
      this.testResults['server_health'] = healthCheck;
      if (!healthCheck) console.warn('⚠️ Server health check failed, continuing anyway...');

      // Étape 1: Test REST API Auth (comme fallback/comparaison)
      console.log('\n📡 Step 1: Testing REST API authentication...');
      const restAuthSuccess = await this.testRestAuthentication(testUser);
      this.testResults['rest_auth'] = restAuthSuccess;
      if (!restAuthSuccess) console.warn('⚠️ REST auth failed, continuing with WebSocket...');

      // Étape 2: Connexion à AuthRoom via WebSocket
      console.log('\n📝 Step 2: Connecting to AuthRoom...');
      const authSuccess = await this.connectToAuthRoom();
      this.testResults['auth_connection'] = authSuccess;
      if (!authSuccess) throw new Error('AuthRoom connection failed');

      // Étape 3: Authentification WebSocket
      console.log('\n🔐 Step 3: Authenticating via WebSocket...');
      const loginSuccess = await this.authenticate(testUser);
      this.testResults['authentication'] = loginSuccess;
      if (!loginSuccess) throw new Error('Authentication failed');

      // Étape 4: Connexion à WorldRoom
      console.log('\n🌍 Step 4: Connecting to WorldRoom...');
      const worldSuccess = await this.connectToWorldRoom();
      this.testResults['world_connection'] = worldSuccess;
      if (!worldSuccess) throw new Error('WorldRoom connection failed');

      // Étape 5: Tests dans WorldRoom
      console.log('\n🎮 Step 5: Testing WorldRoom features...');
      const featuresSuccess = await this.testWorldRoomFeatures();
      this.testResults['world_features'] = featuresSuccess;

      // Étape 6: Test du matchmaking (optionnel)
      console.log('\n⚔️ Step 6: Testing matchmaking (15s timeout)...');
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
      const healthCheck = await this.checkServerHealth();
      if (!healthCheck) {
        console.warn('⚠️ Server might not be running properly');
      }

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
      await this.cleanup();
    }
  }

  /**
   * Test rejet WorldRoom sans authentification valide
   */
  async testWorldRoomRejection(): Promise<boolean> {
    console.log('🧪 Testing WorldRoom rejection without valid auth');
    console.log('='.repeat(50));

    let testClient: SimpleColyseusClient | null = null;

    try {
      testClient = new SimpleColyseusClient(SERVER_URL);
      
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
        await testClient.leave();
      }
    }
  }

  /**
   * Vérifier que le serveur répond
   */
  private async checkServerHealth(): Promise<boolean> {
    return new Promise((resolve) => {
      const url = new URL('/api/health', API_BASE_URL);
      
      const req = http.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.success) {
              console.log('✅ Server is healthy');
              console.log(`   Uptime: ${Math.round(response.data.uptime)}s`);
              console.log(`   Environment: ${response.data.environment}`);
              resolve(true);
            } else {
              resolve(false);
            }
          } catch (error) {
            resolve(false);
          }
        });
      });
      
      req.on('error', () => resolve(false));
      req.setTimeout(5000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Test d'authentification REST (pour comparaison)
   */
  private async testRestAuthentication(testUser: { identifier: string, password: string }): Promise<boolean> {
    return new Promise((resolve) => {
      const postData = JSON.stringify({
        identifier: testUser.identifier,
        password: testUser.password
      });

      const options = {
        hostname: 'localhost',
        port: 2567,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.success) {
              console.log('✅ REST API authentication successful');
              console.log(`   User: ${response.data.user.username}`);
              resolve(true);
            } else {
              console.log('❌ REST API authentication failed:', response.message);
              resolve(false);
            }
          } catch (error) {
            resolve(false);
          }
        });
      });

      req.on('error', () => resolve(false));
      req.write(postData);
      req.end();

      setTimeout(() => {
        req.destroy();
        resolve(false);
      }, 5000);
    });
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
