import { BattleRoom } from '../rooms/BattleRoom';

console.log('🧪 TESTING BattleRoom initialization...');
console.log('==========================================');

// Test simple d'initialisation
try {
  const room = new BattleRoom();
  
  // Test d'options factices
  const options = {
    gameMode: 'ranked',
    battleType: '1v1',
    matchId: 'test_match_123'
  };
  
  // Tester onCreate
  console.log('📝 Testing onCreate...');
  room.onCreate(options).then(() => {
    console.log('✅ BattleRoom.onCreate() SUCCESS!');
    console.log('🏰 Tours should be initialized with CombatSystem');
    
    // Test getBattleStats
    console.log('\n📊 Battle Stats:');
    const stats = room.getBattleStats();
    console.log(JSON.stringify(stats, null, 2));
    
    // Cleanup
    room.onDispose();
    console.log('✅ BattleRoom test completed!');
    
  }).catch((error) => {
    console.error('❌ BattleRoom.onCreate() FAILED:', error);
  });
  
} catch (error) {
  console.error('❌ BattleRoom instantiation FAILED:', error);
}
