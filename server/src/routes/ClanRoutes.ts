import { Router, Request, Response } from 'express';
import Joi from 'joi';
import rateLimit from 'express-rate-limit';
import { getClanService } from '../services/ClanService';
import { authenticateToken } from '../middleware/AuthData';

const router = Router();
const clanService = getClanService();

// Toutes les routes clan nécessitent une authentification
router.use(authenticateToken);

// Rate limiting pour certaines actions sensibles
const clanActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 actions par fenêtre
  message: {
    success: false,
    message: 'Too many clan actions, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 messages par minute
  message: {
    success: false,
    message: 'Too many messages, please slow down',
    code: 'CHAT_RATE_LIMIT_EXCEEDED'
  }
});

// Validation schemas
const createClanSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.min': 'Clan name must be at least 1 character',
      'string.max': 'Clan name cannot exceed 50 characters',
      'any.required': 'Clan name is required'
    }),
  
  description: Joi.string()
    .max(500)
    .allow('')
    .default('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  
  badge: Joi.string()
    .default('default_badge'),
  
  type: Joi.string()
    .valid('open', 'invite_only', 'closed')
    .default('open'),
  
  requiredTrophies: Joi.number()
    .min(0)
    .max(10000)
    .default(0)
    .messages({
      'number.min': 'Required trophies cannot be negative',
      'number.max': 'Required trophies cannot exceed 10000'
    }),
  
  region: Joi.string()
    .default('global')
});

const joinClanSchema = Joi.object({
  clanTag: Joi.string()
    .pattern(/^#[A-Z0-9]{6,8}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid clan tag format (must be #ABC123XY)',
      'any.required': 'Clan tag is required'
    }),
  
  inviteCode: Joi.string()
    .optional()
});

const requestCardsSchema = Joi.object({
  cardId: Joi.string()
    .required()
    .messages({
      'any.required': 'Card ID is required'
    }),
  
  amount: Joi.number()
    .min(1)
    .max(8)
    .optional()
    .messages({
      'number.min': 'Amount must be at least 1',
      'number.max': 'Amount cannot exceed 8'
    })
});

const donateCardsSchema = Joi.object({
  messageId: Joi.string()
    .required()
    .messages({
      'any.required': 'Message ID is required'
    }),
  
  amount: Joi.number()
    .min(1)
    .max(8)
    .required()
    .messages({
      'number.min': 'Amount must be at least 1',
      'number.max': 'Amount cannot exceed 8',
      'any.required': 'Amount is required'
    })
});

const chatMessageSchema = Joi.object({
  content: Joi.string()
    .min(1)
    .max(500)
    .required()
    .messages({
      'string.min': 'Message cannot be empty',
      'string.max': 'Message cannot exceed 500 characters',
      'any.required': 'Message content is required'
    })
});

const searchClansSchema = Joi.object({
  name: Joi.string().optional(),
  tag: Joi.string().pattern(/^#?[A-Z0-9]{6,8}$/).optional(),
  minTrophies: Joi.number().min(0).optional(),
  maxTrophies: Joi.number().min(0).optional(),
  type: Joi.string().valid('open', 'invite_only', 'closed').optional(),
  region: Joi.string().optional(),
  hasSpace: Joi.boolean().optional(),
  minMembers: Joi.number().min(1).max(50).optional(),
  maxMembers: Joi.number().min(1).max(50).optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(50).default(20)
});

const memberActionSchema = Joi.object({
  targetUserId: Joi.string()
    .required()
    .messages({
      'any.required': 'Target user ID is required'
    }),
  
  reason: Joi.string()
    .max(200)
    .optional()
});

// === GESTION DES CLANS ===

/**
 * POST /api/clan/create
 * Créer un nouveau clan
 */
router.post('/create', clanActionLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = createClanSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    const result = await clanService.createClan(req.userId!, value);
    
    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error,
        code: 'CLAN_CREATION_FAILED'
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Clan created successfully',
      data: {
        clan: {
          clanId: result.clan!.clanId,
          name: result.clan!.name,
          tag: result.clan!.tag,
          description: result.clan!.settings.description,
          badge: result.clan!.settings.badge,
          type: result.clan!.settings.type,
          requiredTrophies: result.clan!.settings.requiredTrophies,
          memberCount: result.clan!.memberCount,
          maxMembers: result.clan!.maxMembers,
          region: result.clan!.region,
          createdAt: result.clan!.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Create clan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create clan',
      code: 'CREATE_CLAN_ERROR'
    });
  }
});

/**
 * POST /api/clan/join
 * Rejoindre un clan
 */
router.post('/join', clanActionLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = joinClanSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    const result = await clanService.joinClan(req.userId!, value.clanTag, value.inviteCode);
    
    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error,
        code: 'JOIN_CLAN_FAILED'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Successfully joined clan',
      data: {
        clan: {
          clanId: result.clan!.clanId,
          name: result.clan!.name,
          tag: result.clan!.tag,
          memberCount: result.clan!.memberCount,
          role: 'member'
        }
      }
    });

  } catch (error) {
    console.error('Join clan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join clan',
      code: 'JOIN_CLAN_ERROR'
    });
  }
});

/**
 * POST /api/clan/leave
 * Quitter un clan
 */
router.post('/leave', clanActionLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await clanService.leaveClan(req.userId!);
    
    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error,
        code: 'LEAVE_CLAN_FAILED'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Successfully left clan'
    });

  } catch (error) {
    console.error('Leave clan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave clan',
      code: 'LEAVE_CLAN_ERROR'
    });
  }
});

/**
 * GET /api/clan/my
 * Obtenir les informations de son clan
 */
router.get('/my', async (req: Request, res: Response): Promise<void> => {
  try {
    // Import Clan here to avoid circular dependency
    const { default: Clan } = await import('../models/Clan');
    const { default: UserData } = await import('../models/UserData');
    const { Types } = await import('mongoose');
    
    console.log('🔍 Getting clan for user:', req.userId);
    
    // D'abord récupérer l'utilisateur pour voir ses infos de clan
    const user = await UserData.findById(req.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }
    
    console.log('🔍 User clan info:', {
      clanId: user.clanId,
      clanRole: user.clanRole,
      joinedClanAt: user.joinedClanAt
    });
    
    // Chercher le clan selon les infos utilisateur
    let clan = null;
    
    if (user.clanId) {
      // Si l'utilisateur a un clanId dans son profil, l'utiliser
      clan = await Clan.findById(user.clanId).where({ isActive: true });
      console.log('🔍 Found clan by clanId:', clan ? clan.name : 'not found');
    }
    
    if (!clan) {
      // Fallback : chercher par member list
      clan = await Clan.getUserClan(new Types.ObjectId(req.userId!));
      console.log('🔍 Found clan by member search:', clan ? clan.name : 'not found');
      
      // Si trouvé par fallback, mettre à jour le profil utilisateur
      if (clan && !user.clanId) {
        const member = clan.getMember(new Types.ObjectId(req.userId!));
        if (member) {
          user.clanId = clan._id;
          user.clanRole = member.role;
          user.joinedClanAt = member.joinedAt;
          await user.save();
          console.log('✅ Updated user profile with clan info from fallback');
        }
      }
    }
    
    if (!clan) {
      res.status(404).json({
        success: false,
        message: 'User is not in a clan',
        code: 'NO_CLAN'
      });
      return;
    }

    const member = clan.getMember(new Types.ObjectId(req.userId!));
    
    if (!member) {
      // Cas de données incohérentes - nettoyer le profil utilisateur
      user.clanId = null;
      user.clanRole = null;
      user.joinedClanAt = null;
      await user.save();
      
      res.status(404).json({
        success: false,
        message: 'User is not a member of any clan',
        code: 'NO_CLAN'
      });
      return;
    }
    
    console.log('✅ Found clan and member, returning data');
    
    res.json({
      success: true,
      message: 'Clan information retrieved successfully',
      data: {
        // Informations principales du clan
        clanId: clan.clanId,
        name: clan.name,
        tag: clan.tag,
        description: clan.settings.description,
        badge: clan.settings.badge,
        type: clan.settings.type,
        requiredTrophies: clan.settings.requiredTrophies,
        location: clan.settings.location,
        language: clan.settings.language,
        
        memberCount: clan.memberCount,
        maxMembers: clan.maxMembers,
        
        stats: clan.stats,
        
        // Infos spécifiques au membre
        myRole: member.role,
        myJoinDate: member.joinedAt,
        myDonationsGiven: member.donationsGiven || 0,
        myDonationsReceived: member.donationsReceived || 0,
        
        region: clan.region,
        createdAt: clan.createdAt,
        
        // Données additionnelles pour le client
        _id: clan._id.toString(), // Pour compatibilité avec le client
        id: clan._id.toString()   // Alternative ID
      }
    });

  } catch (error) {
    console.error('Get my clan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get clan information',
      code: 'GET_CLAN_ERROR'
    });
  }
});

/**
 * GET /api/clan/:clanTag
 * Obtenir les informations détaillées d'un clan
 */
router.get('/:clanTag', async (req: Request, res: Response): Promise<void> => {
  try {
    const clanTag = req.params.clanTag;
    
    if (!/^#?[A-Z0-9]{6,8}$/.test(clanTag)) {
      res.status(400).json({
        success: false,
        message: 'Invalid clan tag format',
        code: 'INVALID_CLAN_TAG'
      });
      return;
    }

    const formattedTag = clanTag.startsWith('#') ? clanTag : `#${clanTag}`;
    const result = await clanService.getClanInfo(formattedTag);
    
    if (!result.success) {
      res.status(404).json({
        success: false,
        message: result.error,
        code: 'CLAN_NOT_FOUND'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Clan information retrieved successfully',
      data: {
        clan: result.clan
      }
    });

  } catch (error) {
    console.error('Get clan info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get clan information',
      code: 'GET_CLAN_INFO_ERROR'
    });
  }
});

// === RECHERCHE ET CLASSEMENTS ===

/**
 * GET /api/clan/search
 * Rechercher des clans
 */
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = searchClansSchema.validate(req.query);
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    // Formatter le tag si fourni
    if (value.tag && !value.tag.startsWith('#')) {
      value.tag = `#${value.tag}`;
    }

    const result = await clanService.searchClans(value);
    
    if (!result.success) {
      res.status(500).json({
        success: false,
        message: result.error,
        code: 'SEARCH_FAILED'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Clans search completed successfully',
      data: {
        clans: result.clans,
        pagination: {
          page: value.page,
          limit: value.limit,
          total: result.clans?.length || 0
        },
        filters: {
          name: value.name || null,
          tag: value.tag || null,
          minTrophies: value.minTrophies || null,
          maxTrophies: value.maxTrophies || null,
          type: value.type || null,
          region: value.region || null,
          hasSpace: value.hasSpace || null
        }
      }
    });

  } catch (error) {
    console.error('Search clans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search clans',
      code: 'SEARCH_CLANS_ERROR'
    });
  }
});

/**
 * GET /api/clan/leaderboard
 * Obtenir le classement des clans
 */
router.get('/leaderboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const region = req.query.region as string;
    const limit = parseInt(req.query.limit as string) || 100;
    
    if (limit > 200) {
      res.status(400).json({
        success: false,
        message: 'Limit cannot exceed 200',
        code: 'INVALID_LIMIT'
      });
      return;
    }

    const result = await clanService.getTopClans(region, limit);
    
    if (!result.success) {
      res.status(500).json({
        success: false,
        message: result.error,
        code: 'LEADERBOARD_FAILED'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Clan leaderboard retrieved successfully',
      data: {
        clans: result.clans,
        region: region || 'global',
        limit,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get clan leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get clan leaderboard',
      code: 'GET_LEADERBOARD_ERROR'
    });
  }
});

// === SYSTÈME DE DONATIONS ===

/**
 * POST /api/clan/donations/request
 * Demander des cartes
 */
router.post('/donations/request', async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = requestCardsSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    const result = await clanService.requestCards(req.userId!, value.cardId, value.amount);
    
    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error,
        code: 'REQUEST_CARDS_FAILED'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Card request sent successfully',
      data: {
        messageId: result.messageId,
        cardId: value.cardId,
        amount: value.amount || 'default'
      }
    });

  } catch (error) {
    console.error('Request cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request cards',
      code: 'REQUEST_CARDS_ERROR'
    });
  }
});

/**
 * POST /api/clan/donations/donate
 * Donner des cartes
 */
router.post('/donations/donate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = donateCardsSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    const result = await clanService.donateCards(req.userId!, value.messageId, value.amount);
    
    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error,
        code: 'DONATE_CARDS_FAILED'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Cards donated successfully',
      data: {
        xpGained: result.xpGained,
        amount: value.amount,
        messageId: value.messageId
      }
    });

  } catch (error) {
    console.error('Donate cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to donate cards',
      code: 'DONATE_CARDS_ERROR'
    });
  }
});

// === CHAT DE CLAN ===

/**
 * POST /api/clan/chat
 * Envoyer un message dans le chat du clan
 */
router.post('/chat', chatLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = chatMessageSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    const result = await clanService.sendChatMessage(req.userId!, value.content);
    
    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error,
        code: 'SEND_MESSAGE_FAILED'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        messageId: result.messageId,
        content: value.content,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Send chat message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      code: 'SEND_MESSAGE_ERROR'
    });
  }
});

/**
 * GET /api/clan/chat
 * Obtenir l'historique du chat
 */
router.get('/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before as string; // messageId pour pagination
    
    if (limit > 100) {
      res.status(400).json({
        success: false,
        message: 'Limit cannot exceed 100',
        code: 'INVALID_LIMIT'
      });
      return;
    }

    // Import Clan here to avoid circular dependency
    const { default: Clan } = await import('../models/Clan');
    const { Types } = await import('mongoose');
    
    const clan = await Clan.getUserClan(new Types.ObjectId(req.userId!));
    
    if (!clan) {
      res.status(404).json({
        success: false,
        message: 'User is not in a clan',
        code: 'NO_CLAN'
      });
      return;
    }

    let messages = clan.chatMessages
      .filter(msg => msg.isVisible)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Pagination
    if (before) {
      const beforeIndex = messages.findIndex(msg => msg.messageId === before);
      if (beforeIndex > -1) {
        messages = messages.slice(beforeIndex + 1);
      }
    }

    messages = messages.slice(0, limit);

    const formattedMessages = messages.map(msg => ({
      messageId: msg.messageId,
      author: {
        username: msg.authorUsername,
        role: msg.authorRole
      },
      content: msg.content,
      type: msg.type,
      timestamp: msg.timestamp,
      donationData: msg.donationData ? {
        cardId: msg.donationData.cardId,
        requestedAmount: msg.donationData.requestedAmount,
        fulfilledAmount: msg.donationData.fulfilledAmount,
        contributors: msg.donationData.contributors,
        expiresAt: msg.donationData.expiresAt
      } : undefined
    }));

    res.json({
      success: true,
      message: 'Chat history retrieved successfully',
      data: {
        messages: formattedMessages,
        hasMore: messages.length === limit,
        clanId: clan.clanId,
        clanName: clan.name
      }
    });

  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat history',
      code: 'GET_CHAT_ERROR'
    });
  }
});

// === GESTION DES MEMBRES ===

/**
 * POST /api/clan/members/promote
 * Promouvoir un membre
 */
router.post('/members/promote', clanActionLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = memberActionSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    const result = await clanService.promoteMember(req.userId!, value.targetUserId);
    
    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error,
        code: 'PROMOTE_MEMBER_FAILED'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Member promoted successfully',
      data: {
        targetUserId: value.targetUserId,
        newRole: result.newRole
      }
    });

  } catch (error) {
    console.error('Promote member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to promote member',
      code: 'PROMOTE_MEMBER_ERROR'
    });
  }
});

/**
 * POST /api/clan/members/demote
 * Rétrograder un membre
 */
router.post('/members/demote', clanActionLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = memberActionSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    const result = await clanService.demoteMember(req.userId!, value.targetUserId);
    
    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error,
        code: 'DEMOTE_MEMBER_FAILED'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Member demoted successfully',
      data: {
        targetUserId: value.targetUserId,
        newRole: result.newRole
      }
    });

  } catch (error) {
    console.error('Demote member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to demote member',
      code: 'DEMOTE_MEMBER_ERROR'
    });
  }
});

/**
 * POST /api/clan/members/kick
 * Expulser un membre
 */
router.post('/members/kick', clanActionLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = memberActionSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    const result = await clanService.kickMember(req.userId!, value.targetUserId, value.reason);
    
    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error,
        code: 'KICK_MEMBER_FAILED'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Member kicked successfully',
      data: {
        targetUserId: value.targetUserId,
        reason: value.reason || 'No reason provided'
      }
    });

  } catch (error) {
    console.error('Kick member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to kick member',
      code: 'KICK_MEMBER_ERROR'
    });
  }
});

/**
 * POST /api/clan/members/transfer-leadership
 * Transférer le leadership
 */
router.post('/members/transfer-leadership', clanActionLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = memberActionSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    const result = await clanService.transferLeadership(req.userId!, value.targetUserId);
    
    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error,
        code: 'TRANSFER_LEADERSHIP_FAILED'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Leadership transferred successfully',
      data: {
        newLeaderId: value.targetUserId,
        oldLeaderId: req.userId
      }
    });

  } catch (error) {
    console.error('Transfer leadership error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to transfer leadership',
      code: 'TRANSFER_LEADERSHIP_ERROR'
    });
  }
});

// === STATISTIQUES ET ADMINISTRATION ===

/**
 * GET /api/clan/service/stats
 * Obtenir les statistiques du service (pour les admins)
 */
router.get('/service/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    // TODO: Ajouter une vérification admin
    const stats = clanService.getServiceStats();
    
    res.json({
      success: true,
      message: 'Service stats retrieved successfully',
      data: {
        stats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get service stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get service stats',
      code: 'GET_SERVICE_STATS_ERROR'
    });
  }
});

export default router;
