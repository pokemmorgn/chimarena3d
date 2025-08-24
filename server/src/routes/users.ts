import { Router, Request, Response } from 'express';
import Joi from 'joi';
import UserData from '../models/UserData';
import CardData from '../models/CardData';
import { authenticate } from '../middleware/AuthData';

const router = Router();

/**
 * =========================
 * SCHEMAS DE VALIDATION
 * =========================
 */
const updateProfileSchema = Joi.object({
  displayName: Joi.string().min(3).max(30),
  avatar: Joi.string(),
  banner: Joi.string()
});

const updateDeckSchema = Joi.object({
  name: Joi.string().min(1).max(20),
  slots: Joi.array().items(Joi.string()).length(8).required() // 8 cartes comme Clash Royale
});

/**
 * =========================
 * ROUTES PROFIL
 * =========================
 */

// GET /api/users/:id
router.get('/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await UserData.findById(req.params.userId)
      .select('-password -refreshTokens')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ success: false, message: 'Failed to get user' });
  }
});

// PATCH /api/users/:id/profile
router.patch('/:userId/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const user = await UserData.findByIdAndUpdate(
      req.params.userId,
      { $set: value },
      { new: true }
    ).select('-password -refreshTokens');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, message: 'Profile updated', data: user });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

/**
 * =========================
 * ROUTES COLLECTION
 * =========================
 */

// GET /api/users/:id/collection
router.get('/:userId/collection', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await UserData.findById(req.params.userId).select('collection').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: user.collection });
  } catch (err) {
    console.error('Get collection error:', err);
    res.status(500).json({ success: false, message: 'Failed to get collection' });
  }
});

// POST /api/users/:id/cards/:cardId/upgrade
router.post('/:userId/cards/:cardId/upgrade', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await UserData.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const cardEntry = user.collection.find(c => c.cardId === req.params.cardId);
    if (!cardEntry) return res.status(400).json({ success: false, message: 'Card not owned' });

    const cardData = await CardData.findOne({ id: req.params.cardId });
    if (!cardData) return res.status(404).json({ success: false, message: 'Card data not found' });

    const nextLevel = cardEntry.level + 1;
    const upgradeCost = cardData.getUpgradeCost(nextLevel);

    if (!upgradeCost) return res.status(400).json({ success: false, message: 'Already max level' });
    if (cardEntry.count < upgradeCost.cards) {
      return res.status(400).json({ success: false, message: 'Not enough cards' });
    }
    // TODO: vérifier l'or du joueur

    cardEntry.level = nextLevel;
    cardEntry.count -= upgradeCost.cards;

    await user.save();

    res.json({ success: true, message: 'Card upgraded', data: cardEntry });
  } catch (err) {
    console.error('Upgrade card error:', err);
    res.status(500).json({ success: false, message: 'Failed to upgrade card' });
  }
});

/**
 * =========================
 * ROUTES DECKS
 * =========================
 */

// GET /api/users/:id/decks
router.get('/:userId/decks', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await UserData.findById(req.params.userId).select('decks').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: user.decks });
  } catch (err) {
    console.error('Get decks error:', err);
    res.status(500).json({ success: false, message: 'Failed to get decks' });
  }
});

// PATCH /api/users/:id/decks/:deckId
router.patch('/:userId/decks/:deckId', authenticate, async (req: Request, res: Response) => {
  try {
    const { error, value } = updateDeckSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const user = await UserData.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const deck = user.decks.id(req.params.deckId);
    if (!deck) return res.status(404).json({ success: false, message: 'Deck not found' });

    deck.name = value.name || deck.name;
    deck.slots = value.slots;

    await user.save();

    res.json({ success: true, message: 'Deck updated', data: deck });
  } catch (err) {
    console.error('Update deck error:', err);
    res.status(500).json({ success: false, message: 'Failed to update deck' });
  }
});

export default router;
