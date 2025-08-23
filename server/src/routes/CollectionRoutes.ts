import { Router, Request, Response } from 'express';
import Joi from 'joi';
import PlayerCollection from '../models/PlayerCollection';
import CardData from '../models/CardData';
import { authenticateToken } from '../middleware/AuthData';

const router = Router();

// Toutes les routes collection nécessitent une authentification
router.use(authenticateToken);

// Validation schemas
const deckUpdateSchema = Joi.object({
  deckIndex: Joi.number().min(0).max(4).required(),
  cardIds: Joi.array().items(Joi.string().required()).length(8).required()
});

const upgradeCardSchema = Joi.object({
  cardId: Joi.string().required()
});

const addCardsSchema = Joi.object({
  cardId: Joi.string().required(),
  count: Joi.number().min(1).max(1000).required()
});

/**
 * GET /api/collection
 * Récupérer la collection complète du joueur
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    
    // Récupérer la collection
    let collection = await PlayerCollection.findOne({ userId });
    
    // Si pas de collection, en créer une
    if (!collection) {
      const { createInitialCollection } = await import('../scripts/initPlayerCollection');
      collection = await createInitialCollection(userId);
    }
    
    res.json({
      success: true,
      message: 'Collection retrieved successfully',
      data: {
        collection: {
          userId: collection.userId,
          cards: collection.cards,
          activeDecks: collection.activeDecks,
          currentDeckIndex: collection.currentDeckIndex,
          gold: collection.gold,
          gems: collection.gems,
          chests: collection.chests,
          chestCycle: collection.chestCycle,
          shopOffers: collection.shopOffers,
          stats: collection.stats,
          seasonPass: collection.seasonPass,
          lastActivity: collection.lastActivity
        }
      }
    });

  } catch (error) {
    console.error('Get collection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve collection',
      code: 'GET_COLLECTION_ERROR'
    });
  }
});

/**
 * GET /api/collection/cards
 * Récupérer uniquement les cartes de la collection
 */
router.get('/cards', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    
    const collection = await PlayerCollection.findOne({ userId }).select('cards stats');
    
    if (!collection) {
      res.status(404).json({
        success: false,
        message: 'Collection not found',
        code: 'COLLECTION_NOT_FOUND'
      });
      return;
    }
    
    // Enrichir les données des cartes avec les infos de CardData
    const enrichedCards = await Promise.all(
      collection.cards.map(async (playerCard) => {
        const cardData = await CardData.findOne({ id: playerCard.cardId }).lean();
        
        return {
          ...playerCard.toObject(),
          cardInfo: cardData ? {
            nameKey: cardData.nameKey,
            descriptionKey: cardData.descriptionKey,
            type: cardData.type,
            rarity: cardData.rarity,
            elixirCost: cardData.elixirCost,
            sprite: cardData.sprite,
            maxLevel: cardData.maxLevel
          } : null
        };
      })
    );

    res.json({
      success: true,
      message: 'Cards retrieved successfully',
      data: {
        cards: enrichedCards,
        stats: collection.stats
      }
    });

  } catch (error) {
    console.error('Get collection cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve collection cards',
      code: 'GET_COLLECTION_CARDS_ERROR'
    });
  }
});

/**
 * GET /api/collection/decks
 * Récupérer tous les decks du joueur
 */
router.get('/decks', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    
    const collection = await PlayerCollection.findOne({ userId }).select('activeDecks currentDeckIndex');
    
    if (!collection) {
      res.status(404).json({
        success: false,
        message: 'Collection not found',
        code: 'COLLECTION_NOT_FOUND'
      });
      return;
    }

    // Enrichir chaque deck avec les données des cartes
    const enrichedDecks = await Promise.all(
      collection.activeDecks.map(async (deck, deckIndex) => {
        const enrichedDeck = await Promise.all(
          deck.map(async (slot) => {
            const cardData = await CardData.findOne({ id: slot.cardId }).lean();
            
            return {
              ...slot,
              cardInfo: cardData ? {
                nameKey: cardData.nameKey,
                type: cardData.type,
                rarity: cardData.rarity,
                elixirCost: cardData.elixirCost,
                sprite: cardData.sprite
              } : null
            };
          })
        );
        
        return {
          deckIndex,
          cards: enrichedDeck,
          isActive: deckIndex === collection.currentDeckIndex,
          totalElixirCost: enrichedDeck.reduce((sum, slot) => 
            sum + (slot.cardInfo?.elixirCost || 0), 0
          )
        };
      })
    );

    res.json({
      success: true,
      message: 'Decks retrieved successfully',
      data: {
        decks: enrichedDecks,
        currentDeckIndex: collection.currentDeckIndex
      }
    });

  } catch (error) {
    console.error('Get decks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve decks',
      code: 'GET_DECKS_ERROR'
    });
  }
});

/**
 * GET /api/collection/deck/:deckIndex
 * Récupérer un deck spécifique
 */
router.get('/deck/:deckIndex', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const deckIndex = parseInt(req.params.deckIndex);
    
    if (isNaN(deckIndex) || deckIndex < 0 || deckIndex > 4) {
      res.status(400).json({
        success: false,
        message: 'Invalid deck index (must be 0-4)',
        code: 'INVALID_DECK_INDEX'
      });
      return;
    }
    
    const collection = await PlayerCollection.findOne({ userId });
    
    if (!collection) {
      res.status(404).json({
        success: false,
        message: 'Collection not found',
        code: 'COLLECTION_NOT_FOUND'
      });
      return;
    }
    
    const deck = collection.getDeck(deckIndex);
    
    // Enrichir avec les données des cartes
    const enrichedDeck = await Promise.all(
      deck.map(async (slot) => {
        const cardData = await CardData.findOne({ id: slot.cardId }).lean();
        
        return {
          ...slot,
          cardInfo: cardData ? {
            nameKey: cardData.nameKey,
            type: cardData.type,
            rarity: cardData.rarity,
            elixirCost: cardData.elixirCost,
            sprite: cardData.sprite
          } : null
        };
      })
    );

    res.json({
      success: true,
      message: 'Deck retrieved successfully',
      data: {
        deckIndex,
        cards: enrichedDeck,
        isActive: deckIndex === collection.currentDeckIndex,
        totalElixirCost: enrichedDeck.reduce((sum, slot) => 
          sum + (slot.cardInfo?.elixirCost || 0), 0
        )
      }
    });

  } catch (error) {
    console.error('Get deck error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve deck',
      code: 'GET_DECK_ERROR'
    });
  }
});

/**
 * PUT /api/collection/deck
 * Mettre à jour un deck
 */
router.put('/deck', async (req: Request, res: Response): Promise<void> => {
  try {
    // Valider les données
    const { error, value } = deckUpdateSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    const userId = req.userId!;
    const { deckIndex, cardIds } = value;

    const collection = await PlayerCollection.findOne({ userId });
    
    if (!collection) {
      res.status(404).json({
        success: false,
        message: 'Collection not found',
        code: 'COLLECTION_NOT_FOUND'
      });
      return;
    }

    // Vérifier que toutes les cartes existent dans CardData
    const cardChecks = await Promise.all(
      cardIds.map(async (cardId: string) => {
        const cardExists = await CardData.exists({ id: cardId, isEnabled: true });
        return { cardId, exists: !!cardExists };
      })
    );

    const invalidCards = cardChecks.filter(check => !check.exists);
    if (invalidCards.length > 0) {
      res.status(400).json({
        success: false,
        message: `Invalid cards: ${invalidCards.map(c => c.cardId).join(', ')}`,
        code: 'INVALID_CARDS'
      });
      return;
    }

    // Tenter de définir le deck
    const success = collection.setDeck(deckIndex, cardIds);
    
    if (!success) {
      res.status(400).json({
        success: false,
        message: 'Failed to set deck. Make sure you own all the cards.',
        code: 'SET_DECK_FAILED'
      });
      return;
    }

    await collection.save();

    res.json({
      success: true,
      message: 'Deck updated successfully',
      data: {
        deckIndex,
        cards: collection.getDeck(deckIndex)
      }
    });

  } catch (error) {
    console.error('Update deck error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update deck',
      code: 'UPDATE_DECK_ERROR'
    });
  }
});

/**
 * PUT /api/collection/active-deck/:deckIndex
 * Changer le deck actif
 */
router.put('/active-deck/:deckIndex', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const deckIndex = parseInt(req.params.deckIndex);
    
    if (isNaN(deckIndex) || deckIndex < 0 || deckIndex > 4) {
      res.status(400).json({
        success: false,
        message: 'Invalid deck index (must be 0-4)',
        code: 'INVALID_DECK_INDEX'
      });
      return;
    }
    
    const collection = await PlayerCollection.findOne({ userId });
    
    if (!collection) {
      res.status(404).json({
        success: false,
        message: 'Collection not found',
        code: 'COLLECTION_NOT_FOUND'
      });
      return;
    }

    // Vérifier que le deck a bien 8 cartes
    const deck = collection.getDeck(deckIndex);
    if (deck.length !== 8) {
      res.status(400).json({
        success: false,
        message: 'Cannot set incomplete deck as active',
        code: 'INCOMPLETE_DECK'
      });
      return;
    }

    collection.currentDeckIndex = deckIndex;
    await collection.save();

    res.json({
      success: true,
      message: 'Active deck changed successfully',
      data: {
        currentDeckIndex: deckIndex,
        deck: collection.getDeck(deckIndex)
      }
    });

  } catch (error) {
    console.error('Set active deck error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set active deck',
      code: 'SET_ACTIVE_DECK_ERROR'
    });
  }
});

/**
 * POST /api/collection/upgrade-card
 * Améliorer une carte
 */
router.post('/upgrade-card', async (req: Request, res: Response): Promise<void> => {
  try {
    // Valider les données
    const { error, value } = upgradeCardSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    const userId = req.userId!;
    const { cardId } = value;

    const collection = await PlayerCollection.findOne({ userId });
    
    if (!collection) {
      res.status(404).json({
        success: false,
        message: 'Collection not found',
        code: 'COLLECTION_NOT_FOUND'
      });
      return;
    }

    // Vérifier si l'amélioration est possible
    if (!collection.canUpgradeCard(cardId)) {
      const card = collection.getCard(cardId);
      const upgradeCost = collection.getUpgradeCost(cardId);
      
      let reason = 'Unknown error';
      if (!card) {
        reason = 'Card not found in collection';
      } else if (card.isMaxed) {
        reason = 'Card is already at maximum level';
      } else if (!upgradeCost) {
        reason = 'Upgrade cost unavailable';
      } else if (collection.gold < upgradeCost.gold) {
        reason = `Insufficient gold (need ${upgradeCost.gold}, have ${collection.gold})`;
      } else if (card.count < upgradeCost.cards) {
        reason = `Insufficient cards (need ${upgradeCost.cards}, have ${card.count})`;
      }
      
      res.status(400).json({
        success: false,
        message: `Cannot upgrade card: ${reason}`,
        code: 'UPGRADE_NOT_POSSIBLE'
      });
      return;
    }

    // Effectuer l'amélioration
    const success = collection.upgradeCard(cardId);
    
    if (!success) {
      res.status(500).json({
        success: false,
        message: 'Upgrade failed unexpectedly',
        code: 'UPGRADE_FAILED'
      });
      return;
    }

    await collection.save();

    const upgradedCard = collection.getCard(cardId);

    res.json({
      success: true,
      message: 'Card upgraded successfully',
      data: {
        card: upgradedCard,
        newGold: collection.gold,
        newStats: collection.stats
      }
    });

  } catch (error) {
    console.error('Upgrade card error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upgrade card',
      code: 'UPGRADE_CARD_ERROR'
    });
  }
});

/**
 * POST /api/collection/add-cards
 * Ajouter des cartes à la collection (pour tests/rewards)
 */
router.post('/add-cards', async (req: Request, res: Response): Promise<void> => {
  try {
    // Valider les données
    const { error, value } = addCardsSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    const userId = req.userId!;
    const { cardId, count } = value;

    // Vérifier que la carte existe
    const cardExists = await CardData.exists({ id: cardId, isEnabled: true });
    if (!cardExists) {
      res.status(400).json({
        success: false,
        message: 'Card does not exist',
        code: 'CARD_NOT_FOUND'
      });
      return;
    }

    const collection = await PlayerCollection.findOne({ userId });
    
    if (!collection) {
      res.status(404).json({
        success: false,
        message: 'Collection not found',
        code: 'COLLECTION_NOT_FOUND'
      });
      return;
    }

    // Ajouter les cartes
    collection.addCards(cardId, count);
    await collection.save();

    const updatedCard = collection.getCard(cardId);

    res.json({
      success: true,
      message: `Added ${count} ${cardId} cards to collection`,
      data: {
        card: updatedCard,
        newStats: collection.stats
      }
    });

  } catch (error) {
    console.error('Add cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add cards',
      code: 'ADD_CARDS_ERROR'
    });
  }
});

/**
 * GET /api/collection/stats
 * Récupérer les statistiques de collection
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    
    const collection = await PlayerCollection.findOne({ userId }).select('stats gold gems');
    
    if (!collection) {
      res.status(404).json({
        success: false,
        message: 'Collection not found',
        code: 'COLLECTION_NOT_FOUND'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Collection stats retrieved successfully',
      data: {
        stats: collection.stats,
        resources: {
          gold: collection.gold,
          gems: collection.gems
        }
      }
    });

  } catch (error) {
    console.error('Get collection stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve collection stats',
      code: 'GET_COLLECTION_STATS_ERROR'
    });
  }
});

export default router;
