import { Client } from 'colyseus.js';

async function testCompleteBattle() {
  console.log('🧪 TESTING Complete Battle Flow...');
  console.log('=====================================');

  try {
    // Se connecter au serveur local
    const client = new Client('ws://localhost:2567');
    
    console.log('🔌 Connecting to server...');
    
    // Rejoindre une room de bataille
    const room = await client.joinOrCreate('battle', {
      gameMode: 'ranked',
      battleType: '1v1'
    });
    
    console.log('✅ Joined BattleRoom:', room.id);
    
    // Écouter les événements
    room.onStateChange((state) => {
      console.log('📊 Battle State Update:');
      console.log(`   Phase: ${state.phase}`);
      console.log(`   Tick: ${state.currentTick}`);
      console.log(`   Towers: ${state.towers.size}`);
    });
    
    room.onMessage('*', (type, message) => {
      console.log(`📨 Message received: ${type}`, message);
    });
    
    // Attendre un peu pour voir l'initialisation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🚪 Leaving room...');
    await room.leave();
    
    console.log('✅ Battle test completed!');
    
  } catch (error) {
    console.error('❌ Battle test failed:', error);
  }
}

testCompleteBattle();
