import { getCombatSystem } from '../gameplay/systems/CombatSystem';
import Tower from '../gameplay/units/buildings/Tower';

console.log('COMBAT COMPLET TEST');
console.log('==================');

// Créer tour et unité fictive
const combatSystem = getCombatSystem();
const tower = Tower.create('tower1', 'left', 'player1', { x: 6, y: 28 }, 13);

// Unité factice qui peut être endommagée
const mockUnit = {
  id: 'enemy_unit',
  position: { x: 7, y: 26 }, // Dans range de la tour (distance = 2.2 < 7)
  ownerId: 'player2',
  type: 'unit' as const,
  isAlive: true,
  hitpoints: 100,
  maxHitpoints: 100,
  isFlying: false,
  isTank: false,
  isBuilding: false,
  mass: 1
};

// Simuler combat complet
combatSystem.registerTower(tower.toCombatant());
combatSystem.registerCombatant({
  ...mockUnit,
  canAttack: false,
  attackRange: 1,
  attackDamage: 50,
  attackSpeed: 20,
  lastAttackTick: 0,
  armor: 0,
  spellResistance: 0,
  shield: 0,
  isStunned: false,
  isInvulnerable: false,
  onTakeDamage: (damage) => {
    mockUnit.hitpoints -= damage;
    console.log(`UNIT HIT: ${damage} damage, ${mockUnit.hitpoints} HP remaining`);
    if (mockUnit.hitpoints <= 0) {
      mockUnit.isAlive = false;
      console.log('UNIT DESTROYED!');
    }
  },
  onDeath: () => console.log('Unit death callback'),
  onAttack: () => {}
});

tower.updateAvailableTargets([mockUnit]);

// Simuler 10 ticks pour voir le combat complet
console.log('\n=== SIMULATION COMBAT ===');
for (let tick = 1; tick <= 20; tick++) {
  console.log(`\n-- TICK ${tick} --`);
  tower.update(tick, 50);
  
  if (!mockUnit.isAlive) {
    console.log('Combat terminé - unité détruite');
    break;
  }
}

console.log('\n=== RÉSULTATS ===');
console.log('Tour finale:', tower.getTowerInfo());
console.log('Unité finale:', mockUnit);
