import http from 'http';

/**
 * Script de test pour l'API Collection
 * Teste toutes les routes avec authentification
 */

const API_BASE_URL = 'http://localhost:2567/api';

// Variables globales pour les tests
let accessToken = '';
let testUserId = '';

/**
 * Fonction helper pour faire des requêtes HTTP avec auth
 */
function makeAuthenticatedRequest(method: string, path: string, data?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE_URL}${path}`);
    
    const options: any = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Fonction pour faire du POST sans auth (login)
 */
function makeRequest(method: string, path: string, data?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE_URL}${path}`);
    
    const options: any = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Étape 1: Login pour obtenir un token
 */
async function authenticateUser() {
  try {
    console.log('🔐 Authenticating user...');
    
    const response = await makeRequest('POST', '/auth/login', {
      identifier: 'test', // Utilise un utilisateur existant
      password: 'test123'
    });
    
    if (response.data.success) {
      accessToken = response.data.data.tokens.accessToken;
      testUserId = response.data.data.user.id;
      console.log(`✅ Authenticated as user: ${response.data.data.user.username}`);
      console.log(`✅ User ID: ${testUserId}`);
      return true;
    }
    
    console.log('❌ Authentication failed:', response.data.message);
    return false;
  } catch (error: any) {
    console.error('❌ Authentication error:', error.message);
    return false;
  }
}

/**
 * Test 1: GET /api/collection (collection complète)
 */
async function testGetCollection() {
  try {
    console.log('\n🎒 Testing GET /api/collection...');
    
    const response = await makeAuthenticatedRequest('GET', '/collection');
    const data = response.data;
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Success: ${data.success}`);
    console.log(`✅ Cards types: ${data.data.collection.cards.length}`);
    console.log(`✅ Gold: ${data.data.collection.gold}`);
    console.log(`✅ Gems: ${data.data.collection.gems}`);
    console.log(`✅ Active deck: ${data.data.collection.currentDeckIndex}`);
    console.log(`✅ Chests: ${data.data.collection.chests.length}`);
    
    return true;
  } catch (error: any) {
    console.error('❌ GET /api/collection failed:', error.message);
    return false;
  }
}

/**
 * Test 2: GET /api/collection/cards (cartes enrichies)
 */
async function testGetCollectionCards() {
  try {
    console.log('\n🃏 Testing GET /api/collection/cards...');
    
    const response = await makeAuthenticatedRequest('GET', '/collection/cards');
    const data = response.data;
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Success: ${data.success}`);
    console.log(`✅ Cards: ${data.data.cards.length}`);
    
    // Afficher quelques cartes
    data.data.cards.slice(0, 3).forEach((card: any) => {
      console.log(`   - ${card.cardId}: ${card.count} cards, level ${card.level} (${card.cardInfo?.rarity})`);
    });
    
    console.log(`✅ Total collected: ${data.data.stats.totalCardsCollected}`);
    
    return true;
  } catch (error: any) {
    console.error('❌ GET /api/collection/cards failed:', error.message);
    return false;
  }
}

/**
 * Test 3: GET /api/collection/decks (tous les decks)
 */
async function testGetDecks() {
  try {
    console.log('\n🎴 Testing GET /api/collection/decks...');
    
    const response = await makeAuthenticatedRequest('GET', '/collection/decks');
    const data = response.data;
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Success: ${data.success}`);
    console.log(`✅ Decks: ${data.data.decks.length}`);
    console.log(`✅ Current deck: ${data.data.currentDeckIndex}`);
    
    // Afficher le deck actif
    const activeDeck = data.data.decks.find((deck: any) => deck.isActive);
    if (activeDeck) {
      console.log(`✅ Active deck (${activeDeck.deckIndex}): ${activeDeck.totalElixirCost} total elixir`);
      activeDeck.cards.forEach((slot: any, i: number) => {
        console.log(`     ${i + 1}. ${slot.cardId} (${slot.cardInfo?.elixirCost} elixir)`);
      });
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ GET /api/collection/decks failed:', error.message);
    return false;
  }
}

/**
 * Test 4: GET /api/collection/deck/0 (deck spécifique)
 */
async function testGetSpecificDeck() {
  try {
    console.log('\n🎯 Testing GET /api/collection/deck/0...');
    
    const response = await makeAuthenticatedRequest('GET', '/collection/deck/0');
    const data = response.data;
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Success: ${data.success}`);
    console.log(`✅ Deck index: ${data.data.deckIndex}`);
    console.log(`✅ Is active: ${data.data.isActive}`);
    console.log(`✅ Total elixir: ${data.data.totalElixirCost}`);
    console.log(`✅ Cards: ${data.data.cards.length}`);
    
    return true;
  } catch (error: any) {
    console.error('❌ GET /api/collection/deck/0 failed:', error.message);
    return false;
  }
}

/**
 * Test 5: PUT /api/collection/deck (modifier un deck)
 */
async function testUpdateDeck() {
  try {
    console.log('\n✏️ Testing PUT /api/collection/deck...');
    
    // Essayer de modifier le deck 1 avec les mêmes cartes que le deck 0
    const response = await makeAuthenticatedRequest('PUT', '/collection/deck', {
      deckIndex: 1,
      cardIds: ['knight', 'archers', 'goblins', 'arrows', 'fireball', 'cannon', 'knight', 'archers']
    });
    const data = response.data;
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Success: ${data.success}`);
    console.log(`✅ Updated deck: ${data.data.deckIndex}`);
    console.log(`✅ Cards in deck: ${data.data.cards.length}`);
    
    return true;
  } catch (error: any) {
    console.error('❌ PUT /api/collection/deck failed:', error.message);
    return false;
  }
}

/**
 * Test 6: PUT /api/collection/active-deck/1 (changer deck actif)
 */
async function testSetActiveDeck() {
  try {
    console.log('\n🎯 Testing PUT /api/collection/active-deck/1...');
    
    const response = await makeAuthenticatedRequest('PUT', '/collection/active-deck/1');
    const data = response.data;
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Success: ${data.success}`);
    console.log(`✅ New active deck: ${data.data.currentDeckIndex}`);
    console.log(`✅ Deck cards: ${data.data.deck.length}`);
    
    return true;
  } catch (error: any) {
    console.error('❌ PUT /api/collection/active-deck/1 failed:', error.message);
    return false;
  }
}

/**
 * Test 7: POST /api/collection/add-cards (ajouter des cartes)
 */
async function testAddCards() {
  try {
    console.log('\n➕ Testing POST /api/collection/add-cards...');
    
    const response = await makeAuthenticatedRequest('POST', '/collection/add-cards', {
      cardId: 'knight',
      count: 5
    });
    const data = response.data;
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Success: ${data.success}`);
    console.log(`✅ Updated card: ${data.data.card.cardId}`);
    console.log(`✅ New count: ${data.data.card.count}`);
    console.log(`✅ Total collected: ${data.data.newStats.totalCardsCollected}`);
    
    return true;
  } catch (error: any) {
    console.error('❌ POST /api/collection/add-cards failed:', error.message);
    return false;
  }
}

/**
 * Test 8: POST /api/collection/upgrade-card (améliorer une carte)
 */
async function testUpgradeCard() {
  try {
    console.log('\n⬆️ Testing POST /api/collection/upgrade-card...');
    
    const response = await makeAuthenticatedRequest('POST', '/collection/upgrade-card', {
      cardId: 'knight'
    });
    const data = response.data;
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Success: ${data.success}`);
    console.log(`✅ Upgraded card: ${data.data.card.cardId}`);
    console.log(`✅ New level: ${data.data.card.level}`);
    console.log(`✅ Remaining cards: ${data.data.card.count}`);
    console.log(`✅ Gold remaining: ${data.data.newGold}`);
    console.log(`✅ Total upgrades: ${data.data.newStats.totalCardsUpgraded}`);
    
    return true;
  } catch (error: any) {
    console.error('❌ POST /api/collection/upgrade-card failed:', error.message);
    return false;
  }
}

/**
 * Test 9: GET /api/collection/stats (statistiques)
 */
async function testGetStats() {
  try {
    console.log('\n📊 Testing GET /api/collection/stats...');
    
    const response = await makeAuthenticatedRequest('GET', '/collection/stats');
    const data = response.data;
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Success: ${data.success}`);
    console.log(`✅ Total collected: ${data.data.stats.totalCardsCollected}`);
    console.log(`✅ Upgrades made: ${data.data.stats.totalCardsUpgraded}`);
    console.log(`✅ Gold spent: ${data.data.stats.totalGoldSpent}`);
    console.log(`✅ Average level: ${data.data.stats.averageCardLevel}`);
    console.log(`✅ Current gold: ${data.data.resources.gold}`);
    console.log(`✅ Current gems: ${data.data.resources.gems}`);
    
    return true;
  } catch (error: any) {
    console.error('❌ GET /api/collection/stats failed:', error.message);
    return false;
  }
}

/**
 * Fonction principale de test
 */
async function runAllTests() {
  console.log('🚀 Starting Collection API Tests...');
  console.log('=====================================');
  
  // D'abord s'authentifier
  const authSuccess = await authenticateUser();
  if (!authSuccess) {
    console.log('❌ Authentication failed, stopping tests');
    return;
  }
  
  const tests = [
    { name: 'Get Collection', fn: testGetCollection },
    { name: 'Get Collection Cards', fn: testGetCollectionCards },
    { name: 'Get All Decks', fn: testGetDecks },
    { name: 'Get Specific Deck', fn: testGetSpecificDeck },
    { name: 'Update Deck', fn: testUpdateDeck },
    { name: 'Set Active Deck', fn: testSetActiveDeck },
    { name: 'Add Cards', fn: testAddCards },
    { name: 'Upgrade Card', fn: testUpgradeCard },
    { name: 'Get Stats', fn: testGetStats }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const success = await test.fn();
      if (success) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`💥 Test "${test.name}" crashed:`, error);
      failed++;
    }
    
    // Petite pause entre les tests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n=====================================');
  console.log('🎯 TEST RESULTS:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Collection API is working perfectly!');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above.');
  }
}

// Exécuter les tests si ce script est lancé directement
if (require.main === module) {
  runAllTests()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Test suite crashed:', error);
      process.exit(1);
    });
}

export { runAllTests };
