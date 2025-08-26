import { getCombatSystem } from '../gameplay/systems/CombatSystem';
import Tower from '../gameplay/units/buildings/Tower';

console.log('🧪 TEST D\'INTÉGRATION TOWER + COMBATSYSTEM');
console.log('===========================================');

// 1. Créer le système de combat
const combatSystem = getCombatSystem();
console.log('✅ CombatSystem créé');

// 2. Créer une tour de test
console.log('\n🏰 Création d\'une tour de test...');
const testTower = Tower.create(
  'test_tower_1',
  'left',
  'player1',
  { x: 6, y: 28 },
  13
);

console.log('✅ Tour créée:', testTower.getTowerInfo());

// 3. Enregistrer la tour dans le système de combat
console.log('\n📝 Enregistrement dans CombatSystem...');
combatSystem.registerTower(testTower.toCombatant());

// 4. Vérifier l'état final
console.log('\n📊 État final:');
console.log('Stats CombatSystem:', combatSystem.getPerformanceStats());

console.log('\n✅ Test terminé !');
