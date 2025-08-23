import 'dotenv/config';
import http from 'http';
import WebSocket from 'ws';

const SERVER_URL = 'ws://localhost:2567';
const API_BASE_URL = 'http://localhost:2567';
const TEST_USER = { identifier: 'test', password: 'testtest' };

interface AuthData {
  userId: string;
  authToken: string;
  username: string;
  level: number;
  trophies: number;
}

class AuthFlowTester {
  private authWs: WebSocket | null = null;
  private worldWs: WebSocket | null = null;
  private authData: AuthData | null = null;

  async testFullFlow(): Promise<boolean> {
    console.log('🧪 Testing Auth → World flow');
    console.log('================================');

    try {
      console.log('\n1️⃣ Testing server health...');
      const health = await this.checkHealth();
      if (!health) throw new Error('Server unhealthy');

      console.log('\n2️⃣ Connecting to AuthRoom...');
      await this.connectAuth();

      console.log('\n3️⃣ Authenticating...');
      await this.authenticate();

      console.log('\n4️⃣ Connecting to WorldRoom...');
      await this.connectWorld();

      console.log('\n5️⃣ Testing features...');
      await this.testFeatures();

      console.log('\n✅ All tests passed!');
      return true;

    } catch (error: any) {
      console.error('❌ Test failed:', error.message);
      return false;
    } finally {
      await this.cleanup();
    }
  }

  async testAuthOnly(): Promise<boolean> {
    console.log('🧪 Testing AuthRoom only');
    console.log('=========================');

    try {
      await this.connectAuth();
      await this.authenticate();
      
      console.log('✅ Auth successful');
      console.log(`   User: ${this.authData?.username}`);
      console.log(`   Level: ${this.authData?.level}`);
      console.log(`   Trophies: ${this.authData?.trophies}`);
      
      return true;
    } catch (error: any) {
      console.error('❌ Auth failed:', error.message);
      return false;
    } finally {
      await this.cleanup();
    }
  }

  async testWorldReject(): Promise<boolean> {
    console.log('🧪 Testing WorldRoom rejection');
    console.log('===============================');

    try {
      const ws = new WebSocket(`${SERVER_URL}?room=world`);
      
      await new Promise((resolve, reject) => {
        ws.on('open', () => {
          ws.send(JSON.stringify({
            type: 'join',
            auth: { userId: 'fake', authToken: 'fake' }
          }));
        });

        ws.on('message', (data) => {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'error') {
            console.log('✅ WorldRoom rejected fake auth');
            ws.close();
            resolve(true);
          }
        });

        ws.on('error', () => {
          console.log('✅ Connection rejected');
          resolve(true);
        });

        setTimeout(() => reject(new Error('No rejection received')), 5000);
      });

      return true;
    } catch (error: any) {
      console.error('❌ Should have been rejected:', error.message);
      return false;
    }
  }

  private async checkHealth(): Promise<boolean> {
    return new Promise((resolve) => {
      const req = http.get(`${API_BASE_URL}/api/health`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.success) {
              console.log('✅ Server healthy');
              resolve(true);
            } else {
              resolve(false);
            }
          } catch {
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

  private async connectAuth(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.authWs = new WebSocket(`${SERVER_URL}?room=auth`);

      this.authWs.on('open', () => {
        console.log('✅ Connected to AuthRoom');
        resolve();
      });

      this.authWs.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        this.handleAuthMessage(msg);
      });

      this.authWs.on('error', (error) => reject(error));
      
      setTimeout(() => reject(new Error('Auth connection timeout')), 8000);
    });
  }

  private async authenticate(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.authWs) return reject(new Error('No auth connection'));

      const checkAuth = setInterval(() => {
        if (this.authData) {
          clearInterval(checkAuth);
          console.log('✅ Authentication successful');
          resolve();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkAuth);
        reject(new Error('Authentication timeout'));
      }, 8000);

      this.authWs.send(JSON.stringify({
        type: 'login',
        data: TEST_USER
      }));
    });
  }

  private async connectWorld(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.authData) return reject(new Error('No auth data'));

      this.worldWs = new WebSocket(`${SERVER_URL}?room=world`);

      this.worldWs.on('open', () => {
        this.worldWs!.send(JSON.stringify({
          type: 'join',
          auth: {
            userId: this.authData!.userId,
            authToken: this.authData!.authToken
          }
        }));
      });

      this.worldWs.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'world_welcome') {
          console.log('✅ Connected to WorldRoom');
          console.log(`   Players online: ${msg.data?.onlinePlayers || 'Unknown'}`);
          resolve();
        }
        if (msg.type === 'error') {
          reject(new Error(msg.message || 'WorldRoom error'));
        }
      });

      this.worldWs.on('error', (error) => reject(error));
      
      setTimeout(() => reject(new Error('World connection timeout')), 8000);
    });
  }

  private async testFeatures(): Promise<void> {
    if (!this.worldWs) throw new Error('No world connection');

    console.log('   Testing chat...');
    this.worldWs.send(JSON.stringify({
      type: 'chat',
      data: { message: 'Hello from test!', channel: 'global' }
    }));

    await this.sleep(500);

    console.log('   Testing ready status...');
    this.worldWs.send(JSON.stringify({
      type: 'ready_status',
      data: { isReady: true }
    }));

    await this.sleep(500);

    console.log('   Testing stats...');
    this.worldWs.send(JSON.stringify({ type: 'get_stats' }));

    await this.sleep(1000);
    console.log('✅ Features tested');
  }

  private handleAuthMessage(msg: any): void {
    switch (msg.type) {
      case 'auth_required':
        console.log('🔑 Auth required');
        break;
      case 'auth_success':
        this.authData = {
          userId: msg.data.user.id,
          authToken: msg.data.tokens.accessToken,
          username: msg.data.user.username,
          level: msg.data.user.level,
          trophies: msg.data.user.trophies
        };
        break;
      case 'auth_error':
        console.error('❌ Auth error:', msg.data?.message || 'Unknown error');
        break;
    }
  }

  private async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up...');
    
    if (this.authWs) {
      this.authWs.send(JSON.stringify({ type: 'logout' }));
      this.authWs.close();
    }
    
    if (this.worldWs) {
      this.worldWs.close();
    }

    await this.sleep(500);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  const command = process.argv[2] || 'full';
  const tester = new AuthFlowTester();

  console.log('🚀 AuthRoom + WorldRoom Test');
  console.log('=============================');

  let success = false;

  switch (command) {
    case 'full':
      success = await tester.testFullFlow();
      break;
    case 'auth':
      success = await tester.testAuthOnly();
      break;
    case 'reject':
      success = await tester.testWorldReject();
      break;
    default:
      console.log('Usage: npx ts-node src/scripts/testAuthFlow.ts [command]');
      console.log('');
      console.log('Commands:');
      console.log('  full    - Test complete flow (default)');
      console.log('  auth    - Test AuthRoom only');
      console.log('  reject  - Test WorldRoom rejection');
      process.exit(0);
  }

  if (success) {
    console.log('\n🎉 Tests completed successfully!');
    process.exit(0);
  } else {
    console.log('\n💥 Tests failed!');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { AuthFlowTester };
