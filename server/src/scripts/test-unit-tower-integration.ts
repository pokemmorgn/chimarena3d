import { getCombatSystem } from '../gameplay/systems/CombatSystem';
import Tower from '../gameplay/units/buildings/Tower';
import BaseUnit from '../gameplay/units/BaseUnit';

console.log('🧪 TEST D\'INTÉGRATION UNIT + TOWER');
console.log('===================================');

async function runTest() {
  // 1. Créer le système de combat
  const combatSystem = getCombatSystem();
  console.log('✅ CombatSystem créé');

  // 2. Créer une tour ennemie
  console.log('\n🏰 Création d\'une tour ennemie...');
  const enemyTower = Tower.create(
    'enemy_tower_1',
    'left',
    'player2', // Ennemi
    { x: 6, y: 4 },
    13
  );

  // 3. Créer une unité
  console.log('\n🤖 Création d\'une unité...');
  const knight = await BaseUnit.create(
    'knight',
    1,
    'player1', // Allié
    { x: 9, y: 16 }, // Milieu du terrain
    0 // tick 0
  );

  // 4. Enregistrer dans le système de combat
  console.log('\n📝 Enregistrement dans CombatSystem...');
  combatSystem.registerTower(enemyTower.toCombatant());
  combatSystem.registerCombatant(knight.toCombatant());

  // 5. Donner la tour à l'unité
  console.log('\n🎯 Attribution de la tour à l\'unité...');
  knight.updateAvailableTowers([{
    id: enemyTower.id,
    position: enemyTower.position,
    ownerId: enemyTower.ownerId,
    isDestroyed: enemyTower.isDestroyed,
    hitpoints: enemyTower.hitpoints,
    maxHitpoints: enemyTower.maxHitpoints,
    type: enemyTower.towerType
  }]);

  // 6. Simuler quelques ticks
  console.log('\n⏰ Simulation de 5 ticks...');
  for (let tick = 1; tick <= 5; tick++) {
    console.log(`\n--- TICK ${tick} ---`);
    knight.update(tick, 50); // 50ms par tick
  }

  console.log('\n✅ Test terminé !');
  console.log('Info finale unité:', knight.getCombatInfo());
  console.log('Info finale tour:', enemyTower.getTowerInfo());
}

runTest().catch(console.error);
