import { getCombatSystem } from '../gameplay/systems/CombatSystem';
import Tower from '../gameplay/units/buildings/Tower';

console.log('🧪 TEST SIMPLIFIÉ TOWER INTEGRATION');
console.log('===================================');

// 1. Créer le système de combat
const combatSystem = getCombatSystem();
console.log('✅ CombatSystem créé');

// 2. Créer deux tours (une par joueur)
console.log('\n🏰 Création des tours...');

const player1Tower = Tower.create(
  'tower_player1',
  'left',
  'player1',
  { x: 6, y: 28 },
  13
);

const player2Tower = Tower.create(
  'tower_player2', 
  'left',
  'player2',
  { x: 6, y: 4 },
  13
);

console.log('✅ Tours créées');
console.log('Player1 Tower:', player1Tower.getTowerInfo());
console.log('Player2 Tower:', player2Tower.getTowerInfo());

// 3. Enregistrer dans le CombatSystem
console.log('\n📝 Enregistrement dans CombatSystem...');
combatSystem.registerTower(player1Tower.toCombatant());
combatSystem.registerTower(player2Tower.toCombatant());

// 4. Créer des cibles factices pour tester le targeting des tours
console.log('\n🎯 Test du targeting des tours...');

// Simuler des unités ennemies pour la tour player1
const fakeEnemyUnits = [
  {
    id: 'enemy_unit_1',
    position: { x: 7, y: 26 }, // Proche de player1Tower
    ownerId: 'player2',
    type: 'unit' as const,
    isAlive: true,
    hitpoints: 100,
    maxHitpoints: 100,
    isFlying: false,
    isTank: false,
    isBuilding: false,
    mass: 1
  }
];

player1Tower.updateAvailableTargets(fakeEnemyUnits);

// 5. Simuler quelques ticks
console.log('\n⏰ Simulation de 3 ticks...');
for (let tick = 1; tick <= 3; tick++) {
  console.log(`\n--- TICK ${tick} ---`);
  player1Tower.update(tick, 50);
  player2Tower.update(tick, 50);
}

console.log('\n✅ Test terminé !');
console.log('\n📊 État final:');
console.log('CombatSystem stats:', combatSystem.getPerformanceStats());
console.log('Tower1 info:', player1Tower.getTowerInfo());
console.log('Tower2 info:', player2Tower.getTowerInfo());
