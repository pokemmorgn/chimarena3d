import 'dotenv/config';
import http from 'http';

const API_BASE_URL = 'http://localhost:2567/api';
const TEST_USER = { identifier: 'test', password: 'testtest' };

class AuthFlowTester {
  private accessToken: string = '';
  private refreshToken: string = '';
  private userData: any = null;

  async testFullFlow(): Promise<boolean> {
    console.log('🧪 Testing Auth Flow');
    console.log('====================');

    try {
      console.log('\n1️⃣ Testing server health...');
      const health = await this.checkHealth();
      if (!health) throw new Error('Server unhealthy');

      console.log('\n2️⃣ Testing authentication...');
      const authSuccess = await this.testAuthentication();
      if (!authSuccess) throw new Error('Authentication failed');

      console.log('\n3️⃣ Testing token verification...');
      const verifySuccess = await this.testTokenVerification();
      if (!verifySuccess) throw new Error('Token verification failed');

      console.log('\n4️⃣ Testing authenticated endpoints...');
      const endpointsSuccess = await this.testAuthenticatedEndpoints();
      if (!endpointsSuccess) throw new Error('Authenticated endpoints failed');

      console.log('\n5️⃣ Testing token refresh...');
      const refreshSuccess = await this.testTokenRefresh();
      if (!refreshSuccess) throw new Error('Token refresh failed');

      console.log('\n6️⃣ Testing logout...');
      const logoutSuccess = await this.testLogout();
      if (!logoutSuccess) throw new Error('Logout failed');

      console.log('\n✅ All authentication tests passed!');
      return true;

    } catch (error: any) {
      console.error('❌ Test failed:', error.message);
      return false;
    }
  }

  async testAuthOnly(): Promise<boolean> {
    console.log('🧪 Testing Auth API only');
    console.log('=========================');

    try {
      await this.testAuthentication();
      
      console.log('✅ Auth successful');
      console.log(`   User: ${this.userData?.username}`);
      console.log(`   Level: ${this.userData?.level}`);
      console.log(`   Trophies: ${this.userData?.trophies}`);
      console.log(`   Token length: ${this.accessToken.length} chars`);
      
      return true;
    } catch (error: any) {
      console.error('❌ Auth failed:', error.message);
      return false;
    }
  }

  async testCollection(): Promise<boolean> {
    console.log('🧪 Testing Collection API');
    console.log('==========================');

    try {
      // D'abord s'authentifier
      await this.testAuthentication();
      
      console.log('\n📦 Testing collection endpoints...');
      
      // Test collection
      const collection = await this.makeAuthenticatedRequest('collection');
      if (collection.success) {
        console.log('✅ Collection retrieved');
        console.log(`   Gold: ${collection.data.collection.gold}`);
        console.log(`   Gems: ${collection.data.collection.gems}`);
        console.log(`   Cards: ${collection.data.collection.cards.length} types`);
      }
      
      // Test cards
      const cards = await this.makeAuthenticatedRequest('collection/cards');
      if (cards.success) {
        console.log('✅ Cards retrieved');
        console.log(`   Total collected: ${cards.data.stats.totalCardsCollected}`);
      }
      
      // Test decks
      const decks = await this.makeAuthenticatedRequest('collection/decks');
      if (decks.success) {
        console.log('✅ Decks retrieved');
        console.log(`   Active deck: ${decks.data.currentDeckIndex}`);
      }
      
      return true;
    } catch (error: any) {
      console.error('❌ Collection test failed:', error.message);
      return false;
    }
  }

  private async checkHealth(): Promise<boolean> {
    return new Promise((resolve) => {
      const req = http.get(`${API_BASE_URL}/health`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.success) {
              console.log('✅ Server healthy');
              console.log(`   Uptime: ${Math.round(response.data.uptime)}s`);
              resolve(true);
            } else {
              console.log('❌ Server unhealthy');
              resolve(false);
            }
          } catch {
            console.log('❌ Invalid health response');
            resolve(false);
          }
        });
      });
      
      req.on('error', () => {
        console.log('❌ Server unreachable');
        resolve(false);
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        console.log('❌ Health check timeout');
        resolve(false);
      });
    });
  }

  private async testAuthentication(): Promise<boolean> {
    console.log(`   Authenticating user: ${TEST_USER.identifier}`);
    
    try {
      const response = await this.makeRequest('auth/login', 'POST', TEST_USER);
      
      if (response.success && response.data) {
        this.accessToken = response.data.tokens.accessToken;
        this.refreshToken = response.data.tokens.refreshToken;
        this.userData = response.data.user;
        
        console.log('✅ Authentication successful');
        console.log(`   Welcome ${response.data.user.displayName}!`);
        console.log(`   Level: ${response.data.user.level}`);
        console.log(`   Trophies: ${response.data.user.trophies}`);
        
        return true;
      } else {
        console.log('❌ Authentication failed:', response.message);
        return false;
      }
    } catch (error: any) {
      console.log('❌ Authentication request failed:', error.message);
      return false;
    }
  }

  private async testTokenVerification(): Promise<boolean> {
    if (!this.accessToken) {
      console.log('❌ No access token available');
      return false;
    }

    const response = await this.makeAuthenticatedRequest('auth/verify-token');
    
    if (response.success) {
      console.log('✅ Token verification successful');
      console.log(`   User ID: ${response.data.userId}`);
      return true;
    } else {
      console.log('❌ Token verification failed:', response.message);
      return false;
    }
  }

  private async testAuthenticatedEndpoints(): Promise<boolean> {
    // Test profile
    const profile = await this.makeAuthenticatedRequest('auth/profile');
    if (profile.success) {
      console.log('✅ Profile endpoint working');
    } else {
      console.log('❌ Profile endpoint failed');
      return false;
    }

    // Test game endpoint
    const game = await this.makeAuthenticatedRequest('game', 'GET');
    if (game.success) {
      console.log('✅ Game endpoint working');
    } else {
      console.log('❌ Game endpoint failed');
      return false;
    }

    return true;
  }

  private async testTokenRefresh(): Promise<boolean> {
    if (!this.refreshToken) {
      console.log('❌ No refresh token available');
      return false;
    }

    const response = await this.makeRequest('auth/refresh', 'POST', {
      refreshToken: this.refreshToken
    });

    if (response.success && response.data) {
      const oldToken = this.accessToken;
      this.accessToken = response.data.tokens.accessToken;
      this.refreshToken = response.data.tokens.refreshToken;
      
      console.log('✅ Token refresh successful');
      console.log(`   Token changed: ${oldToken !== this.accessToken}`);
      
      return true;
    } else {
      console.log('❌ Token refresh failed:', response.message);
      return false;
    }
  }

  private async testLogout(): Promise<boolean> {
    const response = await this.makeAuthenticatedRequest('auth/logout', 'POST', {
      refreshToken: this.refreshToken
    });

    if (response.success) {
      console.log('✅ Logout successful');
      this.accessToken = '';
      this.refreshToken = '';
      this.userData = null;
      return true;
    } else {
      console.log('❌ Logout failed:', response.message);
      return false;
    }
  }

  private async makeRequest(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, API_BASE_URL);
      const postData = data ? JSON.stringify(data) : null;
      
      const options: any = {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (postData) {
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          console.log(`   Response status: ${res.statusCode}`);
          console.log(`   Response headers:`, res.headers['content-type']);
          console.log(`   Response body: ${responseData.substring(0, 200)}...`);
          
          try {
            const jsonData = JSON.parse(responseData);
            resolve(jsonData);
          } catch (error) {
            console.log(`   Failed to parse JSON. Raw response:`);
            console.log(`   ${responseData}`);
            reject(new Error(`Invalid JSON response. Status: ${res.statusCode}`));
          }
        });
      });

      req.on('error', (error) => reject(error));
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (postData) {
        console.log(`   Sending POST data: ${postData}`);
        req.write(postData);
      }
      
      req.end();
    });
  }

  private async makeAuthenticatedRequest(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, API_BASE_URL);
      const postData = data ? JSON.stringify(data) : null;
      
      const options: any = {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        }
      };

      if (postData) {
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(responseData);
            resolve(jsonData);
          } catch (error) {
            reject(new Error('Invalid JSON response'));
          }
        });
      });

      req.on('error', (error) => reject(error));
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (postData) {
        req.write(postData);
      }
      
      req.end();
    });
  }
}

async function main() {
  const command = process.argv[2] || 'full';
  const tester = new AuthFlowTester();

  console.log('🚀 Authentication Test Suite');
  console.log('=============================');

  let success = false;

  switch (command) {
    case 'full':
      success = await tester.testFullFlow();
      break;
    case 'auth':
      success = await tester.testAuthOnly();
      break;
    case 'collection':
      success = await tester.testCollection();
      break;
    default:
      console.log('Usage: npx ts-node src/scripts/testAuthFlow.ts [command]');
      console.log('');
      console.log('Commands:');
      console.log('  full       - Test complete auth flow (default)');
      console.log('  auth       - Test authentication only');
      console.log('  collection - Test collection API with auth');
      console.log('');
      console.log('Examples:');
      console.log('  npx ts-node src/scripts/testAuthFlow.ts full');
      console.log('  npx ts-node src/scripts/testAuthFlow.ts auth');
      console.log('  npx ts-node src/scripts/testAuthFlow.ts collection');
      process.exit(0);
  }

  if (success) {
    console.log('\n🎉 All tests passed!');
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
