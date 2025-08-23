import 'dotenv/config';

/**
 * Script de test pour les WebSocket Colyseus AuthRoom → WorldRoom
 * Usage: npx ts-node server/src/scripts/testWebSocketFlow.ts [command]
 */

const WebSocket = require('ws');
const SERVER_URL = 'ws://localhost:2567';
const TEST_USER = { identifier: 'test', password: 'testtest' };

interface AuthData {
  userId: string;
  authToken: string;
  username: string;
  displayName: string;
  level: number;
  trophies: number;
}

class WebSocketFlowTester {
  private authWs: any = null;
  private worldWs: any = null;
  private authData: AuthData | null = null;

  async testFullWebSocketFlow(): Promise<boolean> {
    console.log('🧪 Testing WebSocket Auth → World flow');
    console.log('======================================');

    try {
      console.log('\n1️⃣ Connecting to AuthRoom via WebSocket...');
      await this.connectToAuthRoom();

      console.log('\n2️⃣ Authenticating via WebSocket...');
      await this.authenticateWebSocket();

      console.log('\n3️⃣ Connecting to WorldRoom via WebSocket...');
      await this.connectToWorldRoom();

      console.log('\n4️⃣ Testing WorldRoom features...');
      await this.testWorldRoomFeatures();

      console.log('\n✅ WebSocket flow completed successfully!');
      return true;

    } catch (error: any) {
      console.error('❌ WebSocket test failed:', error.message);
      return false;
    } finally {
      await this.cleanup();
    }
  }

  async testAuthRoomOnly(): Promise<boolean> {
    console.log('🧪 Testing AuthRoom WebSocket only');
    console.log('===================================');

    try {
      await this.connectToAuthRoom();
      await this.authenticateWebSocket();
      
      console.log('✅ AuthRoom WebSocket test successful');
      console.log(`   User: ${this.authData?.username}`);
      console.log(`   Level: ${this.authData?.level}`);
      console.log(`   Trophies: ${this.authData?.trophies}`);
      
      return true;
    } catch (error: any) {
      console.error('❌ AuthRoom WebSocket test failed:', error.message);
      return false;
    } finally {
      await this.cleanup();
    }
  }

  private async connectToAuthRoom(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Se connecter à la room auth via Colyseus
      this.authWs = new WebSocket(`${SERVER_URL}/auth`);

      this.authWs.on('open', () => {
        console.log('✅ Connected to AuthRoom WebSocket');
        
        // Envoyer le message de join room
        this.authWs.send(JSON.stringify({
          method: 'joinOrCreate',
          roomName: 'auth',
          options: {}
        }));
      });

      this.authWs.on('message', (data: Buffer) => {
        try {
          const message = this.parseColyseusMessage(data);
          this.handleAuthMessage(message);
          
          if (message.type === 'auth_required') {
            resolve();
          }
        } catch (error) {
          console.error('Failed to parse auth message:', error);
        }
      });

      this.authWs.on('error', (error: Error) => {
        console.error('AuthRoom WebSocket error:', error);
        reject(error);
      });

      setTimeout(() => reject(new Error('AuthRoom connection timeout')), 10000);
    });
  }

  private async authenticateWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.authWs) {
        reject(new Error('No AuthRoom connection'));
        return;
      }

      // Envoyer les credentials
      console.log(`   Sending credentials for: ${TEST_USER.identifier}`);
      this.authWs.send(JSON.stringify({
        type: 'login',
        data: TEST_USER
      }));

      // Attendre la réponse auth_success
      const checkAuth = setInterval(() => {
        if (this.authData) {
          clearInterval(checkAuth);
          console.log('✅ WebSocket authentication successful');
          resolve();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkAuth);
        reject(new Error('WebSocket authentication timeout'));
      }, 8000);
    });
  }

  private async connectToWorldRoom(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.authData) {
        reject(new Error('No auth data'));
        return;
      }

      // Se connecter à WorldRoom avec les données d'auth
      this.worldWs = new WebSocket(`${SERVER_URL}/world`);

      this.worldWs.on('open', () => {
        // Envoyer le message de join avec auth
        this.worldWs.send(JSON.stringify({
          method: 'joinOrCreate',
          roomName: 'world',
          options: { region: 'EU' },
          auth: {
            userId: this.authData!.userId,
            authToken: this.authData!.authToken
          }
        }));
      });

      this.worldWs.on('message', (data: Buffer) => {
        try {
          const message = this.parseColyseusMessage(data);
          
          if (message.type === 'welcome') {
            console.log('✅ Connected to WorldRoom WebSocket');
            console.log(`   Players online: ${message.data?.onlinePlayers || 'Unknown'}`);
            resolve();
          }
          
          if (message.type === 'error') {
            reject(new Error(message.message || 'WorldRoom connection error'));
          }
        } catch (error) {
          console.error('Failed to parse world message:', error);
        }
      });

      this.worldWs.on('error', (error: Error) => {
        console.error('WorldRoom WebSocket error:', error);
        reject(error);
      });

      setTimeout(() => reject(new Error('WorldRoom connection timeout')), 10000);
    });
  }

  private async testWorldRoomFeatures(): Promise<void> {
    if (!this.worldWs) {
      throw new Error('No WorldRoom connection');
    }

    console.log('   Testing chat message...');
    this.worldWs.send(JSON.stringify({
      type: 'chat',
      data: {
        message: 'Hello from WebSocket test!',
        channel: 'global'
      }
    }));

    await this.sleep(500);

    console.log('   Testing ready status...');
    this.worldWs.send(JSON.stringify({
      type: 'ready_status',
      data: { isReady: true }
    }));

    await this.sleep(500);

    console.log('   Testing stats request...');
    this.worldWs.send(JSON.stringify({
      type: 'get_stats'
    }));

    await this.sleep(1000);
    console.log('✅ WorldRoom features tested');
  }

  private handleAuthMessage(message: any): void {
    switch (message.type) {
      case 'auth_required':
        console.log('🔑 Auth required via WebSocket');
        break;
        
      case 'auth_success':
        if (message.data && message.data.user && message.data.tokens) {
          this.authData = {
            userId: message.data.user.id,
            authToken: message.data.tokens.accessToken,
            username: message.data.user.username,
            displayName: message.data.user.displayName,
            level: message.data.user.level,
            trophies: message.data.user.trophies
          };
          console.log(`   Authenticated as: ${this.authData.displayName}`);
        }
        break;
        
      case 'auth_error':
        console.error('❌ Auth error via WebSocket:', message.data?.message || 'Unknown error');
        break;
        
      default:
        // console.log('📩 Auth message:', message.type);
        break;
    }
  }

  private parseColyseusMessage(data: Buffer): any {
    try {
      // Colyseus peut envoyer des messages binaires ou JSON
      const text = data.toString();
      
      // Si ça commence par {, c'est probablement du JSON
      if (text.startsWith('{')) {
        return JSON.parse(text);
      }
      
      // Sinon, c'est peut-être un message Colyseus encodé
      // Pour simplifier, on retourne un objet générique
      return { type: 'binary', data: data };
      
    } catch (error) {
      // Si le parsing échoue, retourner un objet d'erreur
      return { type: 'parse_error', raw: data.toString() };
    }
  }

  private async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up WebSocket connections...');

    if (this.authWs) {
      try {
        // Envoyer logout avant de fermer
        this.authWs.send(JSON.stringify({ type: 'logout' }));
        await this.sleep(200);
        this.authWs.close();
        console.log('✅ AuthRoom WebSocket closed');
      } catch (error) {
        console.log('⚠️ Error closing AuthRoom WebSocket');
      }
    }

    if (this.worldWs) {
      try {
        this.worldWs.close();
        console.log('✅ WorldRoom WebSocket closed');
      } catch (error) {
        console.log('⚠️ Error closing WorldRoom WebSocket');
      }
    }

    await this.sleep(500);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  const command = process.argv[2] || 'full';
  const tester = new WebSocketFlowTester();

  console.log('🚀 WebSocket AuthRoom + WorldRoom Test');
  console.log('======================================');

  let success = false;

  switch (command) {
    case 'full':
      success = await tester.testFullWebSocketFlow();
      break;
      
    case 'auth':
      success = await tester.testAuthRoomOnly();
      break;
      
    default:
      console.log('Usage: npx ts-node server/src/scripts/testWebSocketFlow.ts [command]');
      console.log('');
      console.log('Commands:');
      console.log('  full  - Test complete WebSocket flow (default)');
      console.log('  auth  - Test AuthRoom WebSocket only');
      console.log('');
      console.log('Examples:');
      console.log('  npx ts-node server/src/scripts/testWebSocketFlow.ts full');
      console.log('  npx ts-node server/src/scripts/testWebSocketFlow.ts auth');
      console.log('');
      console.log('Note: This tests the actual Colyseus WebSocket rooms');
      console.log('      Make sure your server is running with both rooms registered');
      process.exit(0);
  }

  if (success) {
    console.log('\n🎉 WebSocket tests completed successfully!');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('   - Your AuthRoom → WorldRoom flow works via WebSocket');
    console.log('   - Ready to build client application');
    console.log('   - Consider adding BattleRoom for gameplay');
    process.exit(0);
  } else {
    console.log('\n💥 WebSocket tests failed!');
    console.log('');
    console.log('🔧 Check:');
    console.log('   - Server running with both AuthRoom and WorldRoom registered');
    console.log('   - index.ts updated with room definitions');
    console.log('   - No compilation errors in rooms');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { WebSocketFlowTester };
