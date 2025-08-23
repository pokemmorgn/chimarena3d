import http from 'http';

/**
 * Script de test pour l'API des cartes
 * Teste toutes les routes depuis le serveur local (sans axios)
 */

const API_BASE_URL = 'http://localhost:2567/api';

/**
 * Fonction helper pour faire des requêtes HTTP
 */
function makeRequest(path: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE_URL}${path}`;
    
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error}`));
        }
      });
      
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Test de santé du serveur
 */
async function testServerHealth() {
  try {
    console.log('🏥 Testing server health...');
    const response = await makeRequest('/health');
    
    if (response.data.success) {
      console.log('✅ Server is healthy');
      return true;
    }
    
    console.log('❌ Server health check failed');
    return false;
  } catch (error: any) {
    console.error('❌ Server is not reachable:', error.message);
    return false;
  }
}

/**
 * Test 1: GET /api/cards (toutes les cartes)
 */
async function testGetAllCards() {
  try {
    console.log('\n🃏 Testing GET /api/cards...');
    
    const response = await makeRequest('/cards');
    const data = response.data;
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Success: ${data.success}`);
    console.log(`✅ Cards found: ${data.data.cards.length}`);
    console.log(`✅ Total count: ${data.data.pagination.totalCount}`);
    
    // Afficher quelques cartes
    data.data.cards.slice(0, 3).forEach((card: any) => {
      console.log(`   - ${card.nameKey} (${card.elixirCost} elixir, ${card.type})`);
    });
    
    return true;
  } catch (error: any) {
    console.error('❌ GET /api/cards failed:', error.message);
    return false;
  }
}

/**
 * Test 2: GET /api/cards/:cardId (carte spécifique)
 */
async function testGetSpecificCard() {
  try {
    console.log('\n🏰 Testing GET /api/cards/knight...');
    
    const response = await makeRequest('/cards/knight');
    const data = response.data;
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Success: ${data.success}`);
    console.log(`✅ Card: ${data.data.card.nameKey}`);
    console.log(`✅ Type: ${data.data.card.type}`);
    console.log(`✅ Elixir: ${data.data.card.elixirCost}`);
    console.log(`✅ Rarity: ${data.data.card.rarity}`);
    
    return true;
  } catch (error: any) {
    console.error('❌ GET /api/cards/knight failed:', error.message);
    return false;
  }
}

/**
 * Test 3: GET /api/cards/knight/stats/3 (stats par niveau)
 */
async function testGetCardStats() {
  try {
    console.log('\n📊 Testing GET /api/cards/knight/stats/3...');
    
    const response = await makeRequest('/cards/knight/stats/3');
    const data = response.data;
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Success: ${data.success}`);
    console.log(`✅ Card: ${data.data.cardId} level ${data.data.level}`);
    console.log(`✅ HP: ${data.data.stats.hitpoints}`);
    console.log(`✅ Damage: ${data.data.stats.damage}`);
    
    if (data.data.upgradeCost) {
      console.log(`✅ Upgrade cost: ${data.data.upgradeCost.cards} cards, ${data.data.upgradeCost.gold} gold`);
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ GET /api/cards/knight/stats/3 failed:', error.message);
    return false;
  }
}

/**
 * Test 4: GET /api/cards/arena/1 (cartes par arène)
 */
async function testGetArenaCards() {
  try {
    console.log('\n🏟️ Testing GET /api/cards/arena/1...');
    
    const response = await makeRequest('/cards/arena/1');
    const data = response.data;
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Success: ${data.success}`);
    console.log(`✅ Arena level: ${data.data.arenaLevel}`);
    console.log(`✅ Total cards: ${data.data.totalCards}`);
    
    // Afficher les cartes par arène
    Object.entries(data.data.cardsByArena).forEach(([arena, cards]: [string, any]) => {
      console.log(`   Arena ${arena}: ${cards.length} cards`);
    });
    
    return true;
  } catch (error: any) {
    console.error('❌ GET /api/cards/arena/1 failed:', error.message);
    return false;
  }
}

/**
 * Test 5: GET /api/cards/search/knight (recherche)
 */
async function testSearchCards() {
  try {
    console.log('\n🔍 Testing GET /api/cards/search/knight...');
    
    const response = await makeRequest('/cards/search/knight');
    const data = response.data;
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Success: ${data.success}`);
    console.log(`✅ Query: "${data.data.query}"`);
    console.log(`✅ Results: ${data.data.totalResults}`);
    
    data.data.cards.forEach((card: any) => {
      console.log(`   - ${card.nameKey} (${card.id})`);
    });
    
    return true;
  } catch (error: any) {
    console.error('❌ GET /api/cards/search/knight failed:', error.message);
    return false;
  }
}

/**
 * Test 6: GET /api/cards/stats/summary (statistiques)
 */
async function testGetCardStatsSummary() {
  try {
    console.log('\n📈 Testing GET /api/cards/stats/summary...');
    
    const response = await makeRequest('/cards/stats/summary');
    const data = response.data;
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Success: ${data.success}`);
    console.log(`✅ Total cards: ${data.data.totalCards}`);
    console.log(`✅ By type:`, data.data.byType);
    console.log(`✅ By rarity:`, data.data.byRarity);
    console.log(`✅ By elixir cost:`, data.data.byElixirCost);
    
    return true;
  } catch (error: any) {
    console.error('❌ GET /api/cards/stats/summary failed:', error.message);
    return false;
  }
}

/**
 * Test avec filtres
 */
async function testCardFilters() {
  try {
    console.log('\n🎛️ Testing GET /api/cards with filters...');
    
    // Test filtrage par type
    const response = await makeRequest('/cards?type=spell&limit=10');
    const data = response.data;
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Success: ${data.success}`);
    console.log(`✅ Spell cards: ${data.data.cards.length}`);
    
    data.data.cards.forEach((card: any) => {
      console.log(`   - ${card.nameKey} (${card.elixirCost} elixir)`);
    });
    
    return true;
  } catch (error: any) {
    console.error('❌ Card filters test failed:', error.message);
    return false;
  }
}

/**
 * Fonction principale de test
 */
async function runAllTests() {
  console.log('🚀 Starting Card API Tests...');
  console.log('=====================================');
  
  const tests = [
    { name: 'Server Health', fn: testServerHealth },
    { name: 'Get All Cards', fn: testGetAllCards },
    { name: 'Get Specific Card', fn: testGetSpecificCard },
    { name: 'Get Card Stats', fn: testGetCardStats },
    { name: 'Get Arena Cards', fn: testGetArenaCards },
    { name: 'Search Cards', fn: testSearchCards },
    { name: 'Get Statistics', fn: testGetCardStatsSummary },
    { name: 'Test Filters', fn: testCardFilters }
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
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n=====================================');
  console.log('🎯 TEST RESULTS:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! API is working perfectly!');
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
