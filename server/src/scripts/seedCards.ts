import 'dotenv/config';
import mongoose from 'mongoose';
import CardData from '../models/CardData';

/**
 * Script de seed pour ajouter les cartes de base de Clash Royale
 */

// Cartes de base identiques à CR
const baseCards = [
  // === TROUPES COMMUNES ===
  {
    id: 'knight',
    nameKey: 'card.knight.name',
    scriptName: 'Knight',
    sprite: 'knight.png',
    descriptionKey: 'card.knight.description',
    type: 'troop',
    subType: 'ground',
    rarity: 'common',
    arena: 0,
    elixirCost: 3,
    stats: {
      hitpoints: 1408,
      damage: 167,
      damagePerSecond: 108,
      range: 1,
      attackSpeed: 1.5,
      speed: 'medium',
      count: 1,
      targets: 'ground',
      splashDamage: false,
      sight: 5.5,
      deployTime: 1,
      walkingSpeed: 1
    },
    maxLevel: 14,
    upgradeStats: [
      { level: 1, hitpoints: 1408, damage: 167 },
      { level: 2, hitpoints: 1548, damage: 184 },
      { level: 3, hitpoints: 1702, damage: 202 },
      { level: 4, hitpoints: 1870, damage: 222 },
      { level: 5, hitpoints: 2056, damage: 244 }
    ],
    cardsToUpgrade: [
      { level: 2, cards: 2, gold: 5 },
      { level: 3, cards: 4, gold: 20 },
      { level: 4, cards: 10, gold: 50 },
      { level: 5, cards: 20, gold: 150 }
    ],
    gameplay: {
      priority: 0,
      retarget: true,
      attacksGround: true,
      attacksAir: false,
      building: false,
      spell: false
    }
  },

  {
    id: 'archers',
    nameKey: 'card.archers.name',
    scriptName: 'Archers',
    sprite: 'archers.png',
    descriptionKey: 'card.archers.description',
    type: 'troop',
    subType: 'ground',
    rarity: 'common',
    arena: 0,
    elixirCost: 3,
    stats: {
      hitpoints: 304,
      damage: 118,
      damagePerSecond: 118,
      range: 5,
      attackSpeed: 1.0,
      speed: 'medium',
      count: 2,
      targets: 'both',
      splashDamage: false,
      sight: 5.5,
      deployTime: 1,
      walkingSpeed: 1
    },
    maxLevel: 14,
    upgradeStats: [
      { level: 1, hitpoints: 304, damage: 118 },
      { level: 2, hitpoints: 334, damage: 130 },
      { level: 3, hitpoints: 368, damage: 143 },
      { level: 4, hitpoints: 404, damage: 157 },
      { level: 5, hitpoints: 444, damage: 172 }
    ],
    cardsToUpgrade: [
      { level: 2, cards: 2, gold: 5 },
      { level: 3, cards: 4, gold: 20 },
      { level: 4, cards: 10, gold: 50 },
      { level: 5, cards: 20, gold: 150 }
    ],
    gameplay: {
      priority: 0,
      retarget: true,
      attacksGround: true,
      attacksAir: true,
      building: false,
      spell: false
    }
  },

  {
    id: 'goblins',
    nameKey: 'card.goblins.name',
    scriptName: 'Goblins',
    sprite: 'goblins.png',
    descriptionKey: 'card.goblins.description',
    type: 'troop',
    subType: 'ground',
    rarity: 'common',
    arena: 1,
    elixirCost: 2,
    stats: {
      hitpoints: 214,
      damage: 169,
      damagePerSecond: 184,
      range: 1,
      attackSpeed: 0.9,
      speed: 'very-fast',
      count: 3,
      targets: 'ground',
      splashDamage: false,
      sight: 5.5,
      deployTime: 1,
      walkingSpeed: 1.8
    },
    maxLevel: 14,
    upgradeStats: [
      { level: 1, hitpoints: 214, damage: 169 },
      { level: 2, hitpoints: 235, damage: 186 },
      { level: 3, hitpoints: 258, damage: 204 },
      { level: 4, hitpoints: 284, damage: 224 },
      { level: 5, hitpoints: 312, damage: 246 }
    ],
    cardsToUpgrade: [
      { level: 2, cards: 2, gold: 5 },
      { level: 3, cards: 4, gold: 20 },
      { level: 4, cards: 10, gold: 50 },
      { level: 5, cards: 20, gold: 150 }
    ],
    gameplay: {
      priority: 0,
      retarget: true,
      attacksGround: true,
      attacksAir: false,
      building: false,
      spell: false
    }
  },

  // === SORTS ===
  {
    id: 'fireball',
    nameKey: 'card.fireball.name',
    scriptName: 'Fireball',
    sprite: 'fireball.png',
    descriptionKey: 'card.fireball.description',
    type: 'spell',
    subType: 'both',
    rarity: 'rare',
    arena: 0,
    elixirCost: 4,
    stats: {
      damage: 689,
      crownTowerDamage: 276,
      radius: 2.5,
      targets: 'both',
      splashDamage: true,
      pushback: true
    },
    maxLevel: 12,
    upgradeStats: [
      { level: 1, damage: 689, crownTowerDamage: 276 },
      { level: 2, damage: 758, crownTowerDamage: 303 },
      { level: 3, damage: 832, crownTowerDamage: 333 },
      { level: 4, damage: 915, crownTowerDamage: 366 },
      { level: 5, damage: 1005, crownTowerDamage: 402 }
    ],
    cardsToUpgrade: [
      { level: 2, cards: 2, gold: 50 },
      { level: 3, cards: 4, gold: 150 },
      { level: 4, cards: 10, gold: 400 },
      { level: 5, cards: 20, gold: 1000 }
    ],
    gameplay: {
      priority: 0,
      retarget: false,
      attacksGround: true,
      attacksAir: true,
      building: false,
      spell: true,
      pushback: true
    }
  },

  {
    id: 'arrows',
    nameKey: 'card.arrows.name',
    scriptName: 'Arrows',
    sprite: 'arrows.png',
    descriptionKey: 'card.arrows.description',
    type: 'spell',
    subType: 'both',
    rarity: 'common',
    arena: 0,
    elixirCost: 3,
    stats: {
      damage: 243,
      crownTowerDamage: 97,
      radius: 4,
      targets: 'both',
      splashDamage: true
    },
    maxLevel: 14,
    upgradeStats: [
      { level: 1, damage: 243, crownTowerDamage: 97 },
      { level: 2, damage: 267, crownTowerDamage: 107 },
      { level: 3, damage: 294, crownTowerDamage: 118 },
      { level: 4, damage: 323, crownTowerDamage: 129 },
      { level: 5, damage: 354, crownTowerDamage: 142 }
    ],
    cardsToUpgrade: [
      { level: 2, cards: 2, gold: 5 },
      { level: 3, cards: 4, gold: 20 },
      { level: 4, cards: 10, gold: 50 },
      { level: 5, cards: 20, gold: 150 }
    ],
    gameplay: {
      priority: 0,
      retarget: false,
      attacksGround: true,
      attacksAir: true,
      building: false,
      spell: true
    }
  },

  // === BÂTIMENTS ===
  {
    id: 'cannon',
    nameKey: 'card.cannon.name',
    scriptName: 'Cannon',
    sprite: 'cannon.png',
    descriptionKey: 'card.cannon.description',
    type: 'building',
    subType: 'ground',
    rarity: 'common',
    arena: 0,
    elixirCost: 3,
    stats: {
      hitpoints: 734,
      damage: 320,
      damagePerSecond: 160,
      range: 5.5,
      attackSpeed: 2.0,
      lifetime: 30,
      targets: 'ground',
      splashDamage: false,
      sight: 6,
      deployTime: 1
    },
    maxLevel: 14,
    upgradeStats: [
      { level: 1, hitpoints: 734, damage: 320 },
      { level: 2, hitpoints: 807, damage: 352 },
      { level: 3, hitpoints: 887, damage: 387 },
      { level: 4, hitpoints: 975, damage: 425 },
      { level: 5, hitpoints: 1071, damage: 467 }
    ],
    cardsToUpgrade: [
      { level: 2, cards: 2, gold: 5 },
      { level: 3, cards: 4, gold: 20 },
      { level: 4, cards: 10, gold: 50 },
      { level: 5, cards: 20, gold: 150 }
    ],
    gameplay: {
      priority: 0,
      retarget: true,
      attacksGround: true,
      attacksAir: false,
      building: true,
      spell: false
    }
  }
];

/**
 * Fonction principale de seed
 */
async function seedCards() {
  try {
    console.log('🌱 Starting card seeding process...');
    
    // Connexion à la base de données
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chimarena3d';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Nettoyer les cartes existantes
    await CardData.deleteMany({});
    console.log('🧹 Cleared existing cards');
    
    // Insérer les nouvelles cartes
    const insertedCards = await CardData.insertMany(baseCards);
    console.log(`✅ Inserted ${insertedCards.length} cards successfully`);
    
    // Afficher un résumé
    const cardsByType = await CardData.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    console.log('\n📊 Cards summary:');
    cardsByType.forEach(group => {
      console.log(`   ${group._id}: ${group.count} cards`);
    });
    
    // Tester quelques requêtes
    console.log('\n🔍 Testing queries:');
    
    const knightCard = await CardData.findOne({ id: 'knight' });
    console.log(`   Knight found: ${knightCard?.nameKey} (${knightCard?.elixirCost} elixir)`);
    
    const commonCards = await CardData.countDocuments({ rarity: 'common' });
    console.log(`   Common cards: ${commonCards}`);
    
    const spells = await CardData.find({ type: 'spell' }).select('nameKey elixirCost');
    console.log(`   Spells: ${spells.map(s => `${s.nameKey} (${s.elixirCost})`).join(', ')}`);
    
    console.log('\n🎉 Card seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding cards:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('📦 Disconnected from MongoDB');
  }
}

/**
 * Fonction pour tester une carte spécifique
 */
async function testCardMethods() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chimarena3d');
    
    const knight = await CardData.findOne({ id: 'knight' });
    if (knight) {
      console.log('\n🧪 Testing card methods:');
      
      // Tester getStatsForLevel
      const level3Stats = knight.getStatsForLevel(3);
      console.log(`   Knight level 3 HP: ${level3Stats.hitpoints}`);
      
      // Tester getUpgradeCost
      const upgradeCost = knight.getUpgradeCost(3);
      console.log(`   Upgrade to level 3: ${upgradeCost?.cards} cards, ${upgradeCost?.gold} gold`);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error testing card methods:', error);
  }
}

// Exécution
if (require.main === module) {
  seedCards()
    .then(() => testCardMethods())
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export { seedCards, testCardMethods };
