import 'dotenv/config';
import mongoose from 'mongoose';
import PlayerCollection from '../models/PlayerCollection';
import UserData from '../models/UserData';

/**
 * Script pour initialiser une collection de base pour un nouveau joueur
 * Identique au starter deck de Clash Royale
 */

/**
 * Cartes de départ dans Clash Royale (Training Camp)
 * Chaque nouveau joueur commence avec ces cartes
 */
const STARTER_CARDS = [
  // Deck de base (8 cartes)
  { cardId: 'knight', count: 8 },           // Knight x8
  { cardId: 'archers', count: 8 },          // Archers x8
  { cardId: 'goblins', count: 8 },          // Goblins x8
  { cardId: 'arrows', count: 8 },           // Arrows x8
  { cardId: 'fireball', count: 2 },         // Fireball x2 (rare)
  { cardId: 'cannon', count: 8 }            // Cannon x8
];

/**
 * Deck de départ par défaut
 */
const DEFAULT_DECK = [
  'knight',
  'archers', 
  'goblins',
  'arrows',
  'fireball',
  'cannon',
  'knight',    // Duplicate pour avoir 8 cartes
  'archers'    // Duplicate pour avoir 8 cartes
];

/**
 * Créer une collection initiale pour un utilisateur
 */
async function createInitialCollection(userId: string | mongoose.Types.ObjectId): Promise<any> {
  try {
    console.log(`🎒 Creating initial collection for user: ${userId}`);
    
    // Vérifier si la collection existe déjà
    const existingCollection = await PlayerCollection.findOne({ userId });
    if (existingCollection) {
      console.log('⚠️ Collection already exists for this user');
      return existingCollection;
    }
    
    // Créer la nouvelle collection avec les cartes de départ
    const newCollection = new PlayerCollection({
      userId,
      gold: 300,        // Or de départ dans CR
      gems: 100,        // Gemmes de départ
      
      // Ajouter les cartes de départ
      cards: STARTER_CARDS.map(starter => ({
        cardId: starter.cardId,
        count: starter.count,
        level: 1,
        isMaxed: false,
        totalUsed: 0,
        wins: 0,
        losses: 0,
        firstObtained: new Date(),
        lastLevelUp: new Date()
      })),
      
      // Premier coffre gratuit (Silver)
      chests: [{
        type: 'silver',
        unlockTime: new Date(),
        isUnlocked: true,
        slot: 0
      }],
      
      // Cycle de coffres à la position 0
      chestCycle: {
        position: 0,
        nextSpecialChest: 'giant'
      },
      
      // Shop vide au début
      shopOffers: [],
      
      // Statistiques initiales
      stats: {
        totalCardsCollected: STARTER_CARDS.reduce((sum, card) => sum + card.count, 0),
        totalCardsUpgraded: 0,
        totalGoldSpent: 0,
        totalGemsSpent: 0,
        commonCards: STARTER_CARDS.length - 1, // Tout sauf Fireball (rare)
        rareCards: 1,                          // Fireball
        epicCards: 0,
        legendaryCards: 0,
        maxLevelCards: 0,
        averageCardLevel: 1
      },
      
      // Season Pass niveau 1
      seasonPass: {
        tier: 1,
        freeRewardsClaimed: [],
        premiumRewardsClaimed: [],
        isPremium: false,
        seasonId: 'season1'
      },
      
      lastActivity: new Date()
    });
    
    // Définir le deck de départ
    const success = newCollection.setDeck(0, DEFAULT_DECK);
    if (!success) {
      console.warn('⚠️ Failed to set default deck');
    }
    
    // Sauvegarder
    await newCollection.save();
    
    console.log('✅ Initial collection created successfully');
    console.log(`   - Cards: ${newCollection.cards.length} types`);
    console.log(`   - Total cards: ${newCollection.stats.totalCardsCollected}`);
    console.log(`   - Gold: ${newCollection.gold}`);
    console.log(`   - Gems: ${newCollection.gems}`);
    
    return newCollection;
    
  } catch (error) {
    console.error('❌ Failed to create initial collection:', error);
    throw error;
  }
}

/**
 * Tester la création d'une collection pour un utilisateur existant
 */
async function testCreateCollection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chimarena3d');
    console.log('✅ Connected to MongoDB');
    
    // Trouver un utilisateur existant
    const user = await UserData.findOne({}).select('_id username');
    if (!user) {
      console.error('❌ No users found. Please create a user first.');
      return;
    }
    
    console.log(`👤 Found user: ${user.username} (${user._id})`);
    
    // Créer la collection
    const collection = await createInitialCollection(user._id as mongoose.Types.ObjectId);
    
    // Tester les méthodes
    console.log('\n🧪 Testing collection methods:');
    
    // Test getCard
    const knightCard = collection.getCard('knight');
    console.log(`   - Knight card: ${knightCard?.count} cards, level ${knightCard?.level}`);
    
    // Test hasCard
    const hasFireball = collection.hasCard('fireball');
    console.log(`   - Has Fireball: ${hasFireball}`);
    
    // Test canUpgradeCard
    const canUpgradeKnight = collection.canUpgradeCard('knight');
    console.log(`   - Can upgrade Knight: ${canUpgradeKnight}`);
    
    // Test getUpgradeCost
    const upgradeCost = collection.getUpgradeCost('knight');
    console.log(`   - Knight upgrade cost: ${upgradeCost?.cards} cards, ${upgradeCost?.gold} gold`);
    
    // Test getDeck
    const deck = collection.getDeck(0);
    console.log(`   - Deck 0: ${deck.length} cards`);
    deck.forEach((slot: any, i: number) => {
      console.log(`     ${i + 1}. ${slot.cardId}`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await mongoose.disconnect();
  }
}

/**
 * Créer des collections pour tous les utilisateurs sans collection
 */
async function initializeAllUsersCollections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chimarena3d');
    console.log('✅ Connected to MongoDB');
    
    // Trouver tous les utilisateurs
    const users = await UserData.find({}).select('_id username');
    console.log(`👥 Found ${users.length} users`);
    
    let created = 0;
    let existing = 0;
    
    for (const user of users) {
      try {
        const collection = await createInitialCollection(user._id as mongoose.Types.ObjectId);
        if (collection.createdAt.getTime() === collection.updatedAt.getTime()) {
          created++;
          console.log(`✅ Created collection for ${user.username}`);
        } else {
          existing++;
          console.log(`⚠️ Collection already exists for ${user.username}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create collection for ${user.username}:`, error);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   - Collections created: ${created}`);
    console.log(`   - Already existing: ${existing}`);
    console.log(`   - Total users: ${users.length}`);
    
    await mongoose.disconnect();
    console.log('✅ Initialization completed');
    
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    await mongoose.disconnect();
  }
}

/**
 * Fonction principale
 */
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'test':
      console.log('🧪 Testing collection creation...');
      await testCreateCollection();
      break;
      
    case 'init-all':
      console.log('🚀 Initializing collections for all users...');
      await initializeAllUsersCollections();
      break;
      
    default:
      console.log('📖 Usage:');
      console.log('  npm run collection:test     - Test collection creation');
      console.log('  npm run collection:init-all - Initialize all users');
      console.log('');
      console.log('Or directly:');
      console.log('  npx ts-node src/scripts/initPlayerCollection.ts test');
      console.log('  npx ts-node src/scripts/initPlayerCollection.ts init-all');
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export { createInitialCollection, testCreateCollection, initializeAllUsersCollections };
