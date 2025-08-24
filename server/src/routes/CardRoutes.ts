import { Router, Request, Response } from 'express';
import Joi from 'joi';
import CardData from '../models/CardData';
import { authenticateOptional } from '../middleware/AuthData';

const router = Router();

// Validation schemas
const getCardsQuerySchema = Joi.object({
  type: Joi.string().valid('troop', 'spell', 'building'),
  rarity: Joi.string().valid('common', 'rare', 'epic', 'legendary'),
  arena: Joi.number().min(0).max(15),
  elixirCost: Joi.number().min(1).max(10),
  enabled: Joi.boolean(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(50),
  sort: Joi.string().valid('name', 'elixirCost', 'rarity', 'arena', 'type').default('elixirCost')
});

const getCardParamSchema = Joi.object({
  cardId: Joi.string().required()
});

/**
 * GET /api/cards
 * Récupérer toutes les cartes avec filtres optionnels
 */
router.get('/', authenticateOptional, async (req: Request, res: Response): Promise<void> => {
  try {
    // Valider les paramètres de requête
    const { error, value } = getCardsQuerySchema.validate(req.query);
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    const { type, rarity, arena, elixirCost, enabled, page, limit, sort } = value;

    // Construire le filtre
    const filter: any = {};
    
    if (type) filter.type = type;
    if (rarity) filter.rarity = rarity;
    if (arena !== undefined) filter.arena = { $lte: arena }; // Cartes disponibles jusqu'à cette arène
    if (elixirCost) filter.elixirCost = elixirCost;
    if (enabled !== undefined) filter.isEnabled = enabled;

    // Options de pagination
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sort] = 1;

    // Exécuter la requête
    const [cards, totalCount] = await Promise.all([
      CardData.find(filter)
      .select('id nameKey sprite type rarity arena elixirCost maxLevel cardsToUpgrade')

        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      CardData.countDocuments(filter)
    ]);

    // Calculer les méta-données de pagination
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      message: 'Cards retrieved successfully',
      data: {
        cards,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage
        },
        filters: {
          type: type || null,
          rarity: rarity || null,
          arena: arena || null,
          elixirCost: elixirCost || null,
          enabled: enabled !== undefined ? enabled : null
        }
      }
    });

  } catch (error) {
    console.error('Get cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cards',
      code: 'GET_CARDS_ERROR'
    });
  }
});

/**
 * GET /api/cards/:cardId
 * Récupérer une carte spécifique par son ID
 */
router.get('/:cardId', authenticateOptional, async (req: Request, res: Response): Promise<void> => {
  try {
    // Valider les paramètres
    const { error, value } = getCardParamSchema.validate(req.params);
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    const { cardId } = value;

    // Récupérer la carte
    const card = await CardData.findOne({ 
      id: cardId,
      isEnabled: true 
    }).lean();

    if (!card) {
      res.status(404).json({
        success: false,
        message: 'Card not found',
        code: 'CARD_NOT_FOUND'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Card retrieved successfully',
      data: {
        card
      }
    });

  } catch (error) {
    console.error('Get card error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve card',
      code: 'GET_CARD_ERROR'
    });
  }
});

/**
 * GET /api/cards/:cardId/stats/:level
 * Récupérer les stats d'une carte à un niveau spécifique
 */
router.get('/:cardId/stats/:level', authenticateOptional, async (req: Request, res: Response): Promise<void> => {
  try {
    const cardId = req.params.cardId;
    const level = parseInt(req.params.level);

    if (!cardId || isNaN(level) || level < 1) {
      res.status(400).json({
        success: false,
        message: 'Invalid card ID or level',
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    // Récupérer la carte
    const card = await CardData.findOne({ 
      id: cardId,
      isEnabled: true 
    });

    if (!card) {
      res.status(404).json({
        success: false,
        message: 'Card not found',
        code: 'CARD_NOT_FOUND'
      });
      return;
    }

    // Vérifier que le niveau est valide
    if (level > card.maxLevel) {
      res.status(400).json({
        success: false,
        message: `Level ${level} exceeds max level ${card.maxLevel} for this card`,
        code: 'INVALID_LEVEL'
      });
      return;
    }

    // Obtenir les stats pour ce niveau
    const stats = card.getStatsForLevel(level);
    
    // Obtenir le coût d'upgrade vers le niveau suivant
    const upgradeCost = level < card.maxLevel ? card.getUpgradeCost(level + 1) : null;

    res.json({
      success: true,
      message: 'Card stats retrieved successfully',
      data: {
        cardId,
        level,
        stats,
        upgradeCost,
        maxLevel: card.maxLevel
      }
    });

  } catch (error) {
    console.error('Get card stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve card stats',
      code: 'GET_CARD_STATS_ERROR'
    });
  }
});

/**
 * GET /api/cards/arena/:arenaLevel
 * Récupérer toutes les cartes disponibles jusqu'à une arène donnée
 */
router.get('/arena/:arenaLevel', authenticateOptional, async (req: Request, res: Response): Promise<void> => {
  try {
    const arenaLevel = parseInt(req.params.arenaLevel);

    if (isNaN(arenaLevel) || arenaLevel < 0 || arenaLevel > 15) {
      res.status(400).json({
        success: false,
        message: 'Invalid arena level (must be between 0 and 15)',
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    // Récupérer les cartes disponibles
    const cards = await CardData.find({
      arena: { $lte: arenaLevel },
      isEnabled: true
    })
    .select('id nameKey scriptName sprite type rarity arena elixirCost')
    .sort({ arena: 1, elixirCost: 1 })
    .lean();

    // Grouper par arène pour une meilleure organisation
    const cardsByArena: { [key: number]: any[] } = {};
    cards.forEach(card => {
      if (!cardsByArena[card.arena]) {
        cardsByArena[card.arena] = [];
      }
      cardsByArena[card.arena].push(card);
    });

    res.json({
      success: true,
      message: 'Arena cards retrieved successfully',
      data: {
        arenaLevel,
        totalCards: cards.length,
        cards,
        cardsByArena
      }
    });

  } catch (error) {
    console.error('Get arena cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve arena cards',
      code: 'GET_ARENA_CARDS_ERROR'
    });
  }
});

/**
 * GET /api/cards/search/:query
 * Rechercher des cartes par nom ou description (clés de localisation)
 */
router.get('/search/:query', authenticateOptional, async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.params.query?.trim();

    if (!query || query.length < 2) {
      res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long',
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    // Recherche dans les ID et clés de localisation
    const searchRegex = new RegExp(query, 'i');
    const cards = await CardData.find({
      $and: [
        { isEnabled: true },
        {
          $or: [
            { id: searchRegex },
            { nameKey: searchRegex },
            { scriptName: searchRegex }
          ]
        }
      ]
    })
    .select('id nameKey scriptName sprite type rarity arena elixirCost')
    .sort({ elixirCost: 1 })
    .limit(20) // Limiter les résultats de recherche
    .lean();

    res.json({
      success: true,
      message: 'Search completed successfully',
      data: {
        query,
        totalResults: cards.length,
        cards
      }
    });

  } catch (error) {
    console.error('Search cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search cards',
      code: 'SEARCH_CARDS_ERROR'
    });
  }
});

/**
 * GET /api/cards/stats/summary
 * Récupérer les statistiques générales des cartes
 */
router.get('/stats/summary', authenticateOptional, async (_req: Request, res: Response): Promise<void> => {
  try {
    // Statistiques par type
    const cardsByType = await CardData.aggregate([
      { $match: { isEnabled: true } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Statistiques par rareté
    const cardsByRarity = await CardData.aggregate([
      { $match: { isEnabled: true } },
      { $group: { _id: '$rarity', count: { $sum: 1 } } }
    ]);

    // Statistiques par coût d'élixir
    const cardsByElixirCost = await CardData.aggregate([
      { $match: { isEnabled: true } },
      { $group: { _id: '$elixirCost', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Statistiques par arène
    const cardsByArena = await CardData.aggregate([
      { $match: { isEnabled: true } },
      { $group: { _id: '$arena', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Nombre total de cartes
    const totalCards = await CardData.countDocuments({ isEnabled: true });

    res.json({
      success: true,
      message: 'Card statistics retrieved successfully',
      data: {
        totalCards,
        byType: cardsByType.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
        byRarity: cardsByRarity.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
        byElixirCost: cardsByElixirCost.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
        byArena: cardsByArena.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {})
      }
    });

  } catch (error) {
    console.error('Get card stats summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve card statistics',
      code: 'GET_CARD_STATS_SUMMARY_ERROR'
    });
  }
});

export default router;
