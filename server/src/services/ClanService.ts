import { EventEmitter } from 'events';
import { Types } from 'mongoose';
import Clan, { IClan, IClanMember } from '../models/Clan';
import UserData from '../models/UserData';
import PlayerCollection from '../models/PlayerCollection';
import CardData from '../models/CardData';
import { getActionLogger, ActionLoggerService } from './ActionLoggerService';

/**
 * ClanService - Service centralisé pour la gestion des clans
 * Gère toutes les opérations liées aux clans : création, membres, donations, chat, etc.
 */

// Configuration des donations selon la rareté (comme Clash Royale)
interface IDonationLimits {
  common: {
    maxRequest: number;    // Max demandable par requête
    maxDaily: number;      // Max donnables par jour
    xpReward: number;      // XP gagné en donnant
  };
  rare: {
    maxRequest: number;
    maxDaily: number;
    xpReward: number;
  };
  epic: {
    maxRequest: number;
    maxDaily: number;
    xpReward: number;
  };
  legendary: {
    maxRequest: number;
    maxDaily: number;
    xpReward: number;
  };
}

// Interface pour une demande de donation
export interface IDonationRequest {
  requesterId: Types.ObjectId;
  requesterName: string;
  cardId: string;
  cardRarity: string;
  requestedAmount: number;
  expiresAt: Date;
  messageId: string;
}

// Interface pour une contribution à une donation
export interface IDonationContribution {
  donorId: Types.ObjectId;
  donorName: string;
  cardId: string;
  amount: number;
  xpGained: number;
}

// Configuration du service
interface IClanServiceConfig {
  // Donations
  donationRequestDuration: number;    // Durée de vie d'une demande (8h comme CR)
  maxActiveRequests: number;          // Max demandes actives par membre
  donationCooldown: number;           // Cooldown entre demandes du même membre
  
  // Chat
  maxChatMessages: number;            // Max messages stockés
  chatMessageCooldown: number;        // Cooldown entre messages
  
  // Membres
  maxMembersDefault: number;          // Limite par défaut
  inactivityKickDays: number;         // Jours avant kick pour inactivité
  
  // Mise à jour stats
  statsUpdateInterval: number;        // Intervalle de mise à jour auto des stats
}

/**
 * Service principal de gestion des clans
 */
class ClanService extends EventEmitter {
  private config: IClanServiceConfig;
  private logger: ActionLoggerService;
  private statsUpdateTimer: NodeJS.Timeout | null = null;
  
  // Limites de donations selon Clash Royale
  private readonly DONATION_LIMITS: IDonationLimits = {
    common: {
      maxRequest: 8,      // Max 8 communes par demande
      maxDaily: 240,      // Max 240 communes données par jour
      xpReward: 5         // 5 XP par carte commune donnée
    },
    rare: {
      maxRequest: 4,      // Max 4 rares par demande
      maxDaily: 24,       // Max 24 rares données par jour  
      xpReward: 50        // 50 XP par carte rare donnée
    },
    epic: {
      maxRequest: 1,      // Max 1 épique par demande
      maxDaily: 4,        // Max 4 épiques données par jour
      xpReward: 500       // 500 XP par carte épique donnée
    },
    legendary: {
      maxRequest: 1,      // Max 1 légendaire par demande
      maxDaily: 1,        // Max 1 légendaire donnée par jour
      xpReward: 2000      // 2000 XP par carte légendaire donnée
    }
  };
  
  // Cache des donations quotidiennes (userId -> { cardRarity -> count })
  private dailyDonationCache = new Map<string, Map<string, number>>();
  
  constructor(config?: Partial<IClanServiceConfig>) {
    super();
    
    this.config = {
      donationRequestDuration: 8 * 60 * 60 * 1000,  // 8 heures comme CR
      maxActiveRequests: 1,                          // 1 demande active par membre
      donationCooldown: 10 * 60 * 1000,              // 10 minutes entre demandes
      
      maxChatMessages: 200,
      chatMessageCooldown: 1000,                     // 1 seconde entre messages
      
      maxMembersDefault: 50,
      inactivityKickDays: 35,                        // 5 semaines comme CR
      
      statsUpdateInterval: 5 * 60 * 1000,           // 5 minutes
      
      ...config
    };
    
    this.logger = getActionLogger();
    this.startStatsUpdateLoop();
    this.startDailyReset();
    
    console.log('🏰 ClanService initialized with Clash Royale donation system');
  }

  // === GESTION DES CLANS ===

  /**
   * Créer un nouveau clan
   */
  async createClan(
  leaderId: string,
  clanData: {
    name: string;
    description?: string;
    badge?: string;
    type?: 'open' | 'invite_only' | 'closed';
    requiredTrophies?: number;
    region?: string;
  }
): Promise<{ success: boolean; clan?: IClan; error?: string }> {
  try {
    // Vérifier que l'utilisateur n'est pas déjà dans un clan
    const existingClan = await Clan.getUserClan(new Types.ObjectId(leaderId));
    if (existingClan) {
      return { success: false, error: 'User is already in a clan' };
    }
    
    // Récupérer les données du leader
    const leader = await UserData.findById(leaderId);
    if (!leader) {
      return { success: false, error: 'Leader not found' };
    }
    
    // Vérifier que le nom n'est pas déjà pris
    const nameExists = await Clan.findOne({ 
      name: { $regex: new RegExp(`^${clanData.name}$`, 'i') },
      isActive: true 
    });
    if (nameExists) {
      return { success: false, error: 'Clan name already taken' };
    }
    
    // Créer le clan
    const clan = await Clan.createClan({
      _id: leader._id,
      username: leader.username,
      displayName: leader.displayName,
      level: leader.level,
      trophies: leader.stats.currentTrophies
    }, {
      name: clanData.name,
      description: clanData.description || '',
      badge: clanData.badge || 'default_badge',
      type: clanData.type || 'open',
      requiredTrophies: clanData.requiredTrophies || 0
    });
    
    if (clanData.region) {
      clan.region = clanData.region;
      await clan.save();
    }
    
    // 🔥 CRUCIAL: Mettre à jour le profil utilisateur avec les infos du clan - Fix TypeScript
    leader.clanId = new Types.ObjectId(clan._id as string);
    leader.clanRole = 'leader';
    leader.joinedClanAt = new Date();
    await leader.save();
    
    console.log(`✅ Updated user ${leader.username} with clan info:`, {
      clanId: clan._id,
      clanRole: 'leader',
      joinedClanAt: leader.joinedClanAt
    });
    
    // Logger la création
    await this.logger.logNavigation('clan_joined', leaderId, {
      clanId: clan.clanId,
      clanName: clan.name,
      role: 'leader',
      action: 'created'
    });
    
    this.emit('clanCreated', { clan, leaderId });
    
    console.log(`🏰 Clan "${clan.name}" created by ${leader.username} (${clan.tag})`);
    
    return { success: true, clan };
    
  } catch (error) {
    console.error('Error creating clan:', error);
    return { success: false, error: 'Failed to create clan' };
  }
}

/**
 * Rejoindre un clan - VERSION CORRIGÉE
 */
async joinClan(
  userId: string,
  clanTag: string,
  inviteCode?: string
): Promise<{ success: boolean; clan?: IClan; error?: string }> {
  try {
    // Vérifier que l'utilisateur n'est pas déjà dans un clan
    const existingClan = await Clan.getUserClan(new Types.ObjectId(userId));
    if (existingClan) {
      return { success: false, error: 'User is already in a clan' };
    }
    
    // Trouver le clan
    const clan = await Clan.findByTag(clanTag);
    if (!clan) {
      return { success: false, error: 'Clan not found' };
    }
    
    // Récupérer les données de l'utilisateur
    const user = await UserData.findById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // Vérifier si l'utilisateur peut rejoindre
    if (!clan.canJoin(user.stats.currentTrophies)) {
      if (clan.memberCount >= clan.maxMembers) {
        return { success: false, error: 'Clan is full' };
      }
      if (user.stats.currentTrophies < clan.settings.requiredTrophies) {
        return { success: false, error: `Need ${clan.settings.requiredTrophies} trophies to join` };
      }
      if (clan.settings.type === 'closed') {
        return { success: false, error: 'Clan is closed' };
      }
    }
    
    // Vérifier le code d'invitation si nécessaire
    if (clan.settings.type === 'invite_only' && !inviteCode) {
      return { success: false, error: 'Invitation required' };
    }
    
    // Ajouter le membre au clan
    const success = await clan.addMember(new Types.ObjectId(userId), {
      username: user.username,
      displayName: user.displayName,
      level: user.level,
      trophies: user.stats.currentTrophies
    });
    
    if (!success) {
      return { success: false, error: 'Failed to join clan' };
    }
    
    // 🔥 CRUCIAL: Mettre à jour le profil utilisateur avec les infos du clan - Fix TypeScript
    user.clanId = new Types.ObjectId(clan._id as string);
    user.clanRole = 'member';
    user.joinedClanAt = new Date();
    await user.save();
    
    console.log(`✅ Updated user ${user.username} with clan info:`, {
      clanId: clan._id,
      clanRole: 'member',
      joinedClanAt: user.joinedClanAt
    });
    
    // Logger l'adhésion
    await this.logger.logNavigation('clan_joined', userId, {
      clanId: clan.clanId,
      clanName: clan.name,
      clanTag: clan.tag,
      role: 'member',
      userTrophies: user.stats.currentTrophies,
      clanTrophies: clan.stats.totalTrophies
    });
    
    this.emit('memberJoined', { clan, userId, user });
    
    console.log(`👤 ${user.username} joined clan "${clan.name}" (${clan.tag})`);
    
    return { success: true, clan };
    
  } catch (error) {
    console.error('Error joining clan:', error);
    return { success: false, error: 'Failed to join clan' };
  }
}


  /**
   * Quitter un clan
   */
  async leaveClan(
    userId: string,
    reason: 'voluntary' | 'kicked' | 'inactive' = 'voluntary',
    kickedBy?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const clan = await Clan.getUserClan(new Types.ObjectId(userId));
      if (!clan) {
        return { success: false, error: 'User is not in a clan' };
      }
      
      const member = clan.getMember(new Types.ObjectId(userId));
      if (!member) {
        return { success: false, error: 'Member not found in clan' };
      }
      
      // Le leader ne peut pas quitter (il doit transférer le leadership d'abord)
      if (member.role === 'leader' && reason === 'voluntary') {
        if (clan.memberCount > 1) {
          return { success: false, error: 'Leader must transfer leadership before leaving' };
        }
        // Si c'est le seul membre, on peut dissoudre le clan
        clan.isActive = false;
        await clan.save();
      }
      
      const removedById = kickedBy ? new Types.ObjectId(kickedBy) : new Types.ObjectId(userId);
      const success = await clan.removeMember(new Types.ObjectId(userId), removedById);
      
      if (!success) {
        return { success: false, error: 'Failed to remove member' };
      }
      
      // 🔥 CRUCIAL: Nettoyer le profil utilisateur
      const user = await UserData.findById(userId);
      if (user) {
        user.clanId = null;
        user.clanRole = null;
        user.joinedClanAt = null;
        await user.save();
        
        console.log(`✅ Cleaned clan info from user ${user.username} profile`);
      }
      
      // Logger la sortie
      await this.logger.logNavigation('clan_left', userId, {
        clanId: clan.clanId,
        clanName: clan.name,
        reason,
        kickedBy: kickedBy || undefined,
        memberRole: member.role,
        clanMembersRemaining: clan.memberCount - 1
      });
      
      this.emit('memberLeft', { clan, userId, reason, kickedBy });
      
      console.log(`🚪 ${member.username} left clan "${clan.name}" (${reason})`);
      
      return { success: true };
      
    } catch (error) {
      console.error('Error leaving clan:', error);
      return { success: false, error: 'Failed to leave clan' };
    }
  }

  // === SYSTÈME DE DONATIONS CLASH ROYALE ===

  /**
   * Demander des cartes (système CR complet)
   */
  async requestCards(
    userId: string,
    cardId: string,
    amount?: number
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const clan = await Clan.getUserClan(new Types.ObjectId(userId));
      if (!clan) {
        return { success: false, error: 'User is not in a clan' };
      }
      
      const member = clan.getMember(new Types.ObjectId(userId));
      if (!member) {
        return { success: false, error: 'Member not found' };
      }
      
      // Vérifier les permissions de donation
      if (!clan.chatSettings.allowDonationRequests) {
        return { success: false, error: 'Donations are disabled in this clan' };
      }
      
      // Récupérer les infos de la carte
      const cardData = await CardData.findOne({ id: cardId, isEnabled: true });
      if (!cardData) {
        return { success: false, error: 'Card not found' };
      }
      
      // Vérifier les limites selon la rareté
      const limits = this.DONATION_LIMITS[cardData.rarity as keyof IDonationLimits];
      if (!limits) {
        return { success: false, error: 'Invalid card rarity' };
      }
      
      const requestAmount = amount || limits.maxRequest;
      if (requestAmount > limits.maxRequest) {
        return { success: false, error: `Maximum ${limits.maxRequest} ${cardData.rarity} cards per request` };
      }
      
      // Vérifier qu'il n'y a pas déjà une demande active pour cette carte
      if (clan.isDonationRequestActive(cardId)) {
        return { success: false, error: 'Active donation request already exists for this card' };
      }
      
      // Vérifier le nombre de demandes actives du membre
      const now = new Date();
      const activeRequests = clan.chatMessages.filter(msg => 
        msg.type === 'donation_request' &&
        msg.authorId.equals(new Types.ObjectId(userId)) &&
        msg.donationData?.expiresAt &&
        msg.donationData.expiresAt > now
      );
      
      if (activeRequests.length >= this.config.maxActiveRequests) {
        return { success: false, error: 'Too many active donation requests' };
      }
      
      // Vérifier le cooldown entre demandes
      const lastRequest = clan.chatMessages
        .filter(msg => 
          msg.type === 'donation_request' &&
          msg.authorId.equals(new Types.ObjectId(userId))
        )
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
      
      if (lastRequest && (now.getTime() - lastRequest.timestamp.getTime()) < this.config.donationCooldown) {
        const remainingTime = Math.ceil((this.config.donationCooldown - (now.getTime() - lastRequest.timestamp.getTime())) / 1000 / 60);
        return { success: false, error: `Please wait ${remainingTime} minutes before requesting again` };
      }
      
      // Vérifier que le joueur a de l'espace pour ces cartes
      const collection = await PlayerCollection.findOne({ userId: new Types.ObjectId(userId) });
      if (!collection) {
        return { success: false, error: 'Player collection not found' };
      }
      
      const playerCard = collection.getCard(cardId);
      // TODO: Vérifier les limites de collection si nécessaire
      if (playerCard && playerCard.count > 1000) {
        return { success: false, error: 'Card collection limit reached' };
      }
      
      // Créer la demande de donation
      const expiresAt = new Date(now.getTime() + this.config.donationRequestDuration);
      
      const messageId = await clan.addChatMessage({
        authorId: new Types.ObjectId(userId),
        authorUsername: member.username,
        authorRole: member.role,
        content: `${member.displayName} demande ${requestAmount}x ${cardData.nameKey}`,
        type: 'donation_request',
        donationData: {
          cardId,
          requestedAmount: requestAmount,
          fulfilledAmount: 0,
          contributors: [],
          expiresAt
        },
        isVisible: true
      });
      
      await clan.save();
      
      // Logger la demande
      await this.logger.logCollection('card_obtained', userId, {
        action: 'donation_requested',
        cardId,
        amount: requestAmount,
        rarity: cardData.rarity,
        clanId: clan.clanId,
        expiresAt: expiresAt.toISOString()
      });
      
      this.emit('donationRequested', {
        clan,
        requester: member,
        cardId,
        amount: requestAmount,
        rarity: cardData.rarity,
        messageId,
        expiresAt
      });
      
      console.log(`💝 ${member.username} requested ${requestAmount}x ${cardId} in clan "${clan.name}"`);
      
      return { success: true, messageId };
      
    } catch (error) {
      console.error('Error requesting cards:', error);
      return { success: false, error: 'Failed to request cards' };
    }
  }

  /**
   * Donner des cartes à un membre (système CR complet)
   */
  async donateCards(
    donorId: string,
    messageId: string,
    amount: number
  ): Promise<{ success: boolean; xpGained?: number; error?: string }> {
    try {
      const clan = await Clan.getUserClan(new Types.ObjectId(donorId));
      if (!clan) {
        return { success: false, error: 'User is not in a clan' };
      }
      
      const donor = clan.getMember(new Types.ObjectId(donorId));
      if (!donor) {
        return { success: false, error: 'Donor not found in clan' };
      }
      
      // Trouver le message de demande
      const requestMessage = clan.chatMessages.find(msg => msg.messageId === messageId);
      if (!requestMessage || requestMessage.type !== 'donation_request') {
        return { success: false, error: 'Donation request not found' };
      }
      
      // Vérifier que la demande est encore active
      const now = new Date();
      if (!requestMessage.donationData?.expiresAt || requestMessage.donationData.expiresAt <= now) {
        return { success: false, error: 'Donation request has expired' };
      }
      
      // Vérifier qu'on ne donne pas à soi-même
      if (requestMessage.authorId.equals(new Types.ObjectId(donorId))) {
        return { success: false, error: 'Cannot donate to yourself' };
      }
      
      const donationData = requestMessage.donationData;
      const cardId = donationData.cardId;
      
      // Vérifier qu'il reste des cartes à donner
      const remainingAmount = donationData.requestedAmount - donationData.fulfilledAmount;
      if (remainingAmount <= 0) {
        return { success: false, error: 'Donation request already fulfilled' };
      }
      
      const actualAmount = Math.min(amount, remainingAmount);
      
      // Récupérer les infos de la carte
      const cardData = await CardData.findOne({ id: cardId, isEnabled: true });
      if (!cardData) {
        return { success: false, error: 'Card not found' };
      }
      
      const limits = this.DONATION_LIMITS[cardData.rarity as keyof IDonationLimits];
      if (!limits) {
        return { success: false, error: 'Invalid card rarity' };
      }
      
      // Vérifier les limites quotidiennes du donneur
      const dailyDonated = await this.getDailyDonationCount(donorId, cardData.rarity);
      if (dailyDonated + actualAmount > limits.maxDaily) {
        const remaining = limits.maxDaily - dailyDonated;
        if (remaining <= 0) {
          return { success: false, error: `Daily ${cardData.rarity} donation limit reached` };
        }
        return { success: false, error: `Can only donate ${remaining} more ${cardData.rarity} cards today` };
      }
      
      // Vérifier que le donneur possède assez de cartes
      const donorCollection = await PlayerCollection.findOne({ userId: new Types.ObjectId(donorId) });
      if (!donorCollection) {
        return { success: false, error: 'Donor collection not found' };
      }
      
      const donorCard = donorCollection.getCard(cardId);
      if (!donorCard || donorCard.count < actualAmount) {
        return { success: false, error: 'Not enough cards to donate' };
      }
      
      // Récupérer la collection du receveur
      const recipientCollection = await PlayerCollection.findOne({ userId: requestMessage.authorId });
      if (!recipientCollection) {
        return { success: false, error: 'Recipient collection not found' };
      }
      
      // Effectuer la transaction
      
      // 1. Retirer les cartes du donneur
      donorCard.count -= actualAmount;
      donorCard.lastLevelUp = new Date();
      donorCollection.markModified('cards');
      
      // 2. Ajouter les cartes au receveur
      recipientCollection.addCards(cardId, actualAmount);
      
      // 3. Calculer l'XP gagné
      const xpGained = limits.xpReward * actualAmount;
      
      // 4. Mettre à jour les stats des membres
      donor.donationsGiven += actualAmount;
      
      const recipient = clan.getMember(requestMessage.authorId);
      if (recipient) {
        recipient.donationsReceived += actualAmount;
      }
      
      // 5. Mettre à jour la demande de donation
      donationData.fulfilledAmount += actualAmount;
      donationData.contributors.push({
        userId: new Types.ObjectId(donorId),
        username: donor.username,
        amount: actualAmount,
        timestamp: now
      });
      
      // 6. Mettre à jour le cache des donations quotidiennes
      await this.updateDailyDonationCount(donorId, cardData.rarity, actualAmount);
      
      // 7. Sauvegarder tout
      await Promise.all([
        donorCollection.save(),
        recipientCollection.save(),
        clan.save()
      ]);
      
      // 8. Créer un message de confirmation si la demande est complètement remplie
      if (donationData.fulfilledAmount >= donationData.requestedAmount) {
        await clan.addChatMessage({
          authorId: new Types.ObjectId(donorId),
          authorUsername: donor.username,
          authorRole: donor.role,
          content: `Donation complétée ! ${donationData.requestedAmount}x ${cardData.nameKey} donnés à ${requestMessage.authorUsername}`,
          type: 'donation_fulfilled',
          isVisible: true
        });
        
        await clan.save();
      }
      
      // 9. Logger la donation
      await this.logger.logCollection('card_obtained', donorId, {
        action: 'cards_donated',
        cardId,
        amount: actualAmount,
        rarity: cardData.rarity,
        recipientId: requestMessage.authorId.toString(),
        xpGained,
        clanId: clan.clanId
      });
      
      await this.logger.logCollection('card_obtained', requestMessage.authorId.toString(), {
        action: 'cards_received',
        cardId,
        amount: actualAmount,
        rarity: cardData.rarity,
        donorId,
        clanId: clan.clanId
      });
      
      this.emit('cardsdonated', {
        clan,
        donor,
        recipient: requestMessage.authorUsername,
        cardId,
        amount: actualAmount,
        xpGained,
        requestFulfilled: donationData.fulfilledAmount >= donationData.requestedAmount
      });
      
      console.log(`💝 ${donor.username} donated ${actualAmount}x ${cardId} to ${requestMessage.authorUsername} (+${xpGained} XP)`);
      
      return { success: true, xpGained };
      
    } catch (error) {
      console.error('Error donating cards:', error);
      return { success: false, error: 'Failed to donate cards' };
    }
  }

  /**
   * Obtenir le nombre de cartes données aujourd'hui par rareté
   */
  private async getDailyDonationCount(userId: string, rarity: string): Promise<number> {
    const userCache = this.dailyDonationCache.get(userId);
    if (userCache && userCache.has(rarity)) {
      return userCache.get(rarity) || 0;
    }
    
    // Si pas en cache, calculer depuis la base de données
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const clan = await Clan.getUserClan(new Types.ObjectId(userId));
    if (!clan) return 0;
    
    let totalDonated = 0;
    
    for (const message of clan.chatMessages) {
      if (message.type === 'donation_fulfilled' && 
          message.timestamp >= today &&
          message.donationData?.contributors) {
        
        const contribution = message.donationData.contributors.find(c => 
          c.userId.equals(new Types.ObjectId(userId))
        );
        
        if (contribution) {
          // Récupérer la rareté de la carte
          const cardData = await CardData.findOne({ id: message.donationData.cardId });
          if (cardData && cardData.rarity === rarity) {
            totalDonated += contribution.amount;
          }
        }
      }
    }
    
    // Mettre en cache
    if (!this.dailyDonationCache.has(userId)) {
      this.dailyDonationCache.set(userId, new Map());
    }
    this.dailyDonationCache.get(userId)!.set(rarity, totalDonated);
    
    return totalDonated;
  }

  /**
   * Mettre à jour le compteur quotidien de donations
   */
  private async updateDailyDonationCount(userId: string, rarity: string, amount: number): Promise<void> {
    if (!this.dailyDonationCache.has(userId)) {
      this.dailyDonationCache.set(userId, new Map());
    }
    
    const userCache = this.dailyDonationCache.get(userId)!;
    const current = userCache.get(rarity) || 0;
    userCache.set(rarity, current + amount);
  }

  // === GESTION DU CHAT ===

  /**
   * Envoyer un message dans le chat du clan
   */
  async sendChatMessage(
    userId: string,
    content: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const clan = await Clan.getUserClan(new Types.ObjectId(userId));
      if (!clan) {
        return { success: false, error: 'User is not in a clan' };
      }
      
      const member = clan.getMember(new Types.ObjectId(userId));
      if (!member) {
        return { success: false, error: 'Member not found' };
      }
      
      // Vérifications de base
      if (!content || content.trim().length === 0) {
        return { success: false, error: 'Message cannot be empty' };
      }
      
      if (content.length > 500) {
        return { success: false, error: 'Message too long (max 500 characters)' };
      }
      
      // Vérifier le cooldown
      const now = new Date();
      const lastMessage = clan.chatMessages
        .filter(msg => msg.authorId.equals(new Types.ObjectId(userId)))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
      
      if (lastMessage && (now.getTime() - lastMessage.timestamp.getTime()) < this.config.chatMessageCooldown) {
        return { success: false, error: 'Please wait before sending another message' };
      }
      
      // Ajouter le message
      const messageId = await clan.addChatMessage({
        authorId: new Types.ObjectId(userId),
        authorUsername: member.username,
        authorRole: member.role,
        content: content.trim(),
        type: 'text',
        isVisible: true
      });
      
      await clan.save();
      
      // Logger le message
      await this.logger.logNavigation('message_sent', userId, {
        clanId: clan.clanId,
        messageLength: content.length,
        channel: 'clan_chat'
      });
      
      this.emit('chatMessage', {
        clan,
        author: member,
        content,
        messageId,
        timestamp: now
      });
      
      console.log(`💬 ${member.username} in clan "${clan.name}": ${content}`);
      
      return { success: true, messageId };
      
    } catch (error) {
      console.error('Error sending chat message:', error);
      return { success: false, error: 'Failed to send message' };
    }
  }

  // === GESTION DES RÔLES ET PERMISSIONS ===

  /**
   * Promouvoir un membre
   */
  async promoteMember(
    promoterId: string,
    targetId: string
  ): Promise<{ success: boolean; newRole?: string; error?: string }> {
    try {
      const clan = await Clan.getUserClan(new Types.ObjectId(promoterId));
      if (!clan) {
        return { success: false, error: 'User is not in a clan' };
      }
      
      const promoter = clan.getMember(new Types.ObjectId(promoterId));
      const target = clan.getMember(new Types.ObjectId(targetId));
      
      if (!promoter || !target) {
        return { success: false, error: 'Member not found' };
      }
      
      // Vérifier les permissions
      if (!this.canPromote(promoter.role, target.role)) {
        return { success: false, error: 'Insufficient permissions' };
      }
      
      const success = await clan.promoteMember(new Types.ObjectId(targetId), new Types.ObjectId(promoterId));
      if (!success) {
        return { success: false, error: 'Failed to promote member' };
      }
      
      const updatedTarget = clan.getMember(new Types.ObjectId(targetId));
      const newRole = updatedTarget?.role || 'member';
      
      // Logger la promotion
      await this.logger.logNavigation('button_clicked', promoterId, {
        action: 'member_promoted',
        targetId,
        targetUsername: target.username,
        newRole,
        clanId: clan.clanId
      });
      
      this.emit('memberPromoted', {
        clan,
        promoter,
        target,
        newRole
      });
      
      console.log(`⬆️ ${promoter.username} promoted ${target.username} to ${newRole} in clan "${clan.name}"`);
      
      return { success: true, newRole };
      
    } catch (error) {
      console.error('Error promoting member:', error);
      return { success: false, error: 'Failed to promote member' };
    }
  }

  /**
   * Rétrograder un membre
   */
  async demoteMember(
    demoterId: string,
    targetId: string
  ): Promise<{ success: boolean; newRole?: string; error?: string }> {
    try {
      const clan = await Clan.getUserClan(new Types.ObjectId(demoterId));
      if (!clan) {
        return { success: false, error: 'User is not in a clan' };
      }
      
      const demoter = clan.getMember(new Types.ObjectId(demoterId));
      const target = clan.getMember(new Types.ObjectId(targetId));
      
      if (!demoter || !target) {
        return { success: false, error: 'Member not found' };
      }
      
      // Vérifier les permissions
      if (!this.canDemote(demoter.role, target.role)) {
        return { success: false, error: 'Insufficient permissions' };
      }
      
      const success = await clan.demoteMember(new Types.ObjectId(targetId), new Types.ObjectId(demoterId));
      if (!success) {
        return { success: false, error: 'Failed to demote member' };
      }
      
      const updatedTarget = clan.getMember(new Types.ObjectId(targetId));
      const newRole = updatedTarget?.role || 'member';
      
      // Logger la rétrogradation
      await this.logger.logNavigation('button_clicked', demoterId, {
        action: 'member_demoted',
        targetId,
        targetUsername: target.username,
        newRole,
        clanId: clan.clanId
      });
      
      this.emit('memberDemoted', {
        clan,
        demoter,
        target,
        newRole
      });
      
      console.log(`⬇️ ${demoter.username} demoted ${target.username} to ${newRole} in clan "${clan.name}"`);
      
      return { success: true, newRole };
      
    } catch (error) {
      console.error('Error demoting member:', error);
      return { success: false, error: 'Failed to demote member' };
    }
  }

  /**
   * Expulser un membre
   */
  async kickMember(
    kickerId: string,
    targetId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const clan = await Clan.getUserClan(new Types.ObjectId(kickerId));
      if (!clan) {
        return { success: false, error: 'User is not in a clan' };
      }
      
      const kicker = clan.getMember(new Types.ObjectId(kickerId));
      const target = clan.getMember(new Types.ObjectId(targetId));
      
      if (!kicker || !target) {
        return { success: false, error: 'Member not found' };
      }
      
      // Vérifier les permissions
      if (!this.canKick(kicker.role, target.role)) {
        return { success: false, error: 'Insufficient permissions' };
      }
      
      // Ne pas pouvoir se kicker soi-même
      if (kickerId === targetId) {
        return { success: false, error: 'Cannot kick yourself' };
      }
      
      const result = await this.leaveClan(targetId, 'kicked', kickerId);
      if (!result.success) {
        return result;
      }
      
      // Logger l'expulsion
      await this.logger.logNavigation('button_clicked', kickerId, {
        action: 'member_kicked',
        targetId,
        targetUsername: target.username,
        reason: reason || 'No reason provided',
        clanId: clan.clanId
      });
      
      this.emit('memberKicked', {
        clan,
        kicker,
        target,
        reason
      });
      
      console.log(`🥾 ${kicker.username} kicked ${target.username} from clan "${clan.name}" (${reason || 'No reason'})`);
      
      return { success: true };
      
    } catch (error) {
      console.error('Error kicking member:', error);
      return { success: false, error: 'Failed to kick member' };
    }
  }

  /**
   * Transférer le leadership
   */
  async transferLeadership(
    currentLeaderId: string,
    newLeaderId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const clan = await Clan.getUserClan(new Types.ObjectId(currentLeaderId));
      if (!clan) {
        return { success: false, error: 'User is not in a clan' };
      }
      
      const currentLeader = clan.getMember(new Types.ObjectId(currentLeaderId));
      const newLeader = clan.getMember(new Types.ObjectId(newLeaderId));
      
      if (!currentLeader || !newLeader) {
        return { success: false, error: 'Member not found' };
      }
      
      // Vérifier que l'utilisateur actuel est bien le leader
      if (currentLeader.role !== 'leader') {
        return { success: false, error: 'Only the leader can transfer leadership' };
      }
      
      // Changer les rôles
      currentLeader.role = 'co-leader';
      newLeader.role = 'leader';
      
      // Mettre à jour les listes de leadership
      clan.leaderId = new Types.ObjectId(newLeaderId);
      
      // Retirer l'ancien leader des co-leaders et ajouter le nouveau aux co-leaders
      clan.coLeaders = clan.coLeaders.filter((id: Types.ObjectId) => !id.equals(new Types.ObjectId(currentLeaderId)));
      if (!clan.coLeaders.some((id: Types.ObjectId) => id.equals(new Types.ObjectId(currentLeaderId)))) {
        clan.coLeaders.push(new Types.ObjectId(currentLeaderId));
      }
      
      // Retirer le nouveau leader des co-leaders/elders
      clan.coLeaders = clan.coLeaders.filter((id: Types.ObjectId) => !id.equals(new Types.ObjectId(newLeaderId)));
      clan.elders = clan.elders.filter((id: Types.ObjectId) => !id.equals(new Types.ObjectId(newLeaderId)));
      
      await clan.save();
      
      // Ajouter message système
      await clan.addChatMessage({
        authorId: new Types.ObjectId(currentLeaderId),
        authorUsername: currentLeader.username,
        authorRole: 'co-leader', // Son nouveau rôle
        content: `${currentLeader.displayName} a transféré le leadership à ${newLeader.displayName}`,
        type: 'system',
        isVisible: true
      });
      
      await clan.save();
      
      // Logger le transfert
      await this.logger.logNavigation('button_clicked', currentLeaderId, {
        action: 'leadership_transferred',
        newLeaderId,
        newLeaderUsername: newLeader.username,
        clanId: clan.clanId
      });
      
      this.emit('leadershipTransferred', {
        clan,
        oldLeader: currentLeader,
        newLeader
      });
      
      console.log(`👑 Leadership of clan "${clan.name}" transferred from ${currentLeader.username} to ${newLeader.username}`);
      
      return { success: true };
      
    } catch (error) {
      console.error('Error transferring leadership:', error);
      return { success: false, error: 'Failed to transfer leadership' };
    }
  }

  // === RECHERCHE ET DÉCOUVERTE DE CLANS ===

  /**
   * Rechercher des clans
   */
  async searchClans(query: {
    name?: string;
    tag?: string;
    minTrophies?: number;
    maxTrophies?: number;
    type?: 'open' | 'invite_only' | 'closed';
    region?: string;
    hasSpace?: boolean;
    minMembers?: number;
    maxMembers?: number;
  }): Promise<{ success: boolean; clans?: any[]; error?: string }> {
    try {
      let clans: IClan[] = [];
      
      // Recherche par tag (prioritaire)
      if (query.tag) {
        const clan = await Clan.findByTag(query.tag);
        clans = clan ? [clan] : [];
      } else {
        // Recherche générale
        clans = await Clan.searchClans(query);
      }
      
      // Formater les résultats pour le client
      const formattedClans = clans.map(clan => ({
        clanId: clan.clanId,
        name: clan.name,
        tag: clan.tag,
        description: clan.settings.description,
        badge: clan.settings.badge,
        type: clan.settings.type,
        requiredTrophies: clan.settings.requiredTrophies,
        memberCount: clan.memberCount,
        maxMembers: clan.maxMembers,
        stats: {
          totalTrophies: clan.stats.totalTrophies,
          averageTrophies: clan.stats.averageTrophies,
          totalDonations: clan.stats.totalDonations,
          warWinRate: clan.stats.warWinRate,
          localRank: clan.stats.localRank,
          globalRank: clan.stats.globalRank
        },
        region: clan.region,
        leader: {
          username: clan.members.find((m: IClanMember) => m.role === 'leader')?.username || 'Unknown',
          displayName: clan.members.find((m: IClanMember) => m.role === 'leader')?.displayName || 'Unknown'
        },
        canJoin: clan.settings.type !== 'closed' && clan.memberCount < clan.maxMembers,
        lastActivity: Math.max(...clan.members.map((m: IClanMember) => m.lastActivity.getTime()))
      }));
      
      console.log(`🔍 Found ${formattedClans.length} clans matching search criteria`);
      
      return { success: true, clans: formattedClans };
      
    } catch (error) {
      console.error('Error searching clans:', error);
      return { success: false, error: 'Failed to search clans' };
    }
  }

  /**
   * Obtenir le classement des clans
   */
  async getTopClans(
    region?: string,
    limit: number = 100
  ): Promise<{ success: boolean; clans?: any[]; error?: string }> {
    try {
      const clans = await Clan.getTopClans(limit, region);
      
      const formattedClans = clans.map((clan: any, index: number) => ({
        rank: index + 1,
        clanId: clan.clanId,
        name: clan.name,
        tag: clan.tag,
        badge: clan.settings?.badge || 'default_badge',
        memberCount: clan.memberCount,
        totalTrophies: clan.stats?.totalTrophies || 0,
        averageTrophies: clan.stats?.averageTrophies || 0,
        region: clan.region || 'global'
      }));
      
      return { success: true, clans: formattedClans };
      
    } catch (error) {
      console.error('Error getting top clans:', error);
      return { success: false, error: 'Failed to get top clans' };
    }
  }

  // === MÉTHODES UTILITAIRES ===

  /**
   * Vérifier si un rôle peut promouvoir un autre rôle
   */
  private canPromote(promoterRole: IClanMember['role'], targetRole: IClanMember['role']): boolean {
    const roleHierarchy = {
      leader: 4,
      'co-leader': 3,
      elder: 2,
      member: 1
    };
    
    const promoterLevel = roleHierarchy[promoterRole];
    const targetLevel = roleHierarchy[targetRole];
    
    // Peut promouvoir si le promoteur a un niveau supérieur et que la cible n'est pas déjà au maximum
    return promoterLevel > targetLevel && targetLevel < promoterLevel - 1;
  }

  /**
   * Vérifier si un rôle peut rétrograder un autre rôle
   */
  private canDemote(demoterRole: IClanMember['role'], targetRole: IClanMember['role']): boolean {
    const roleHierarchy = {
      leader: 4,
      'co-leader': 3,
      elder: 2,
      member: 1
    };
    
    const demoterLevel = roleHierarchy[demoterRole];
    const targetLevel = roleHierarchy[targetRole];
    
    // Le leader peut rétrograder les co-leaders, les co-leaders peuvent rétrograder les elders
    return demoterLevel > targetLevel && targetLevel > 1;
  }

  /**
   * Vérifier si un rôle peut expulser un autre rôle
   */
  private canKick(kickerRole: IClanMember['role'], targetRole: IClanMember['role']): boolean {
    const roleHierarchy = {
      leader: 4,
      'co-leader': 3,
      elder: 2,
      member: 1
    };
    
    const kickerLevel = roleHierarchy[kickerRole];
    const targetLevel = roleHierarchy[targetRole];
    
    // Peut expulser si le kicker a un niveau supérieur (mais pas égal)
    return kickerLevel > targetLevel;
  }

  /**
   * Obtenir les informations d'un clan
   */
  async getClanInfo(clanTag: string): Promise<{ success: boolean; clan?: any; error?: string }> {
    try {
      const clan = await Clan.findByTag(clanTag);
      if (!clan) {
        return { success: false, error: 'Clan not found' };
      }
      
      // Formater les informations détaillées
      const clanInfo = {
        clanId: clan.clanId,
        name: clan.name,
        tag: clan.tag,
        description: clan.settings.description,
        badge: clan.settings.badge,
        type: clan.settings.type,
        requiredTrophies: clan.settings.requiredTrophies,
        location: clan.settings.location,
        language: clan.settings.language,
        warFrequency: clan.settings.warFrequency,
        
        memberCount: clan.memberCount,
        maxMembers: clan.maxMembers,
        
        stats: clan.stats,
        
        members: clan.members.map((member: IClanMember) => ({
          userId: member.userId,
          username: member.username,
          displayName: member.displayName,
          level: member.level,
          trophies: member.trophies,
          role: member.role,
          donationsGiven: member.donationsGiven,
          donationsReceived: member.donationsReceived,
          isOnline: member.isOnline,
          lastSeen: member.lastSeen,
          joinedAt: member.joinedAt
        })).sort((a, b) => {
          // Trier par rôle puis par trophées
          const roleOrder = { leader: 4, 'co-leader': 3, elder: 2, member: 1 };
          const roleA = roleOrder[a.role as keyof typeof roleOrder];
          const roleB = roleOrder[b.role as keyof typeof roleOrder];
          
          if (roleA !== roleB) return roleB - roleA;
          return b.trophies - a.trophies;
        }),
        
        recentChat: clan.chatMessages
          .filter(msg => msg.isVisible)
          .slice(-20)
          .map(msg => ({
            messageId: msg.messageId,
            author: msg.authorUsername,
            role: msg.authorRole,
            content: msg.content,
            type: msg.type,
            timestamp: msg.timestamp,
            donationData: msg.donationData
          })),
        
        region: clan.region,
        createdAt: clan.createdAt,
        updatedAt: clan.updatedAt
      };
      
      return { success: true, clan: clanInfo };
      
    } catch (error) {
      console.error('Error getting clan info:', error);
      return { success: false, error: 'Failed to get clan info' };
    }
  }

  // === MAINTENANCE ET MISE À JOUR ===

  /**
   * Démarrer la boucle de mise à jour des statistiques
   */
  private startStatsUpdateLoop(): void {
    this.statsUpdateTimer = setInterval(async () => {
      await this.updateAllClanStats();
    }, this.config.statsUpdateInterval);
  }

  /**
   * Mettre à jour les statistiques de tous les clans actifs
   */
  private async updateAllClanStats(): Promise<void> {
    try {
      const activeClans = await Clan.find({ isActive: true });
      
      for (const clan of activeClans) {
        await clan.updateStats();
        await clan.save();
      }
      
      console.log(`📊 Updated stats for ${activeClans.length} active clans`);
      
    } catch (error) {
      console.error('Error updating clan stats:', error);
    }
  }

  /**
   * Démarrer le reset quotidien des donations
   */
  private startDailyReset(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.resetDailyDonations();
      
      // Puis répéter chaque 24h
      setInterval(() => {
        this.resetDailyDonations();
      }, 24 * 60 * 60 * 1000);
      
    }, msUntilMidnight);
  }

  /**
   * Reset quotidien des compteurs de donations
   */
  private resetDailyDonations(): void {
    this.dailyDonationCache.clear();
    console.log('🔄 Daily donation limits reset');
    this.emit('dailyReset');
  }

  /**
   * Nettoyer les clans inactifs
   */
  async cleanupInactiveClans(): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.inactivityKickDays);
      
      const inactiveClans = await Clan.find({
        isActive: true,
        'members.lastActivity': { $lt: cutoffDate },
        memberCount: { $lte: 1 } // Seulement les clans avec 1 membre ou moins
      });
      
      let cleanedCount = 0;
      
      for (const clan of inactiveClans) {
        clan.isActive = false;
        await clan.save();
        cleanedCount++;
        
        console.log(`🧹 Deactivated inactive clan: "${clan.name}" (${clan.tag})`);
      }
      
      return cleanedCount;
      
    } catch (error) {
      console.error('Error cleaning up inactive clans:', error);
      return 0;
    }
  }

  /**
   * Obtenir les statistiques du service
   */
  getServiceStats() {
    return {
      config: this.config,
      donationLimits: this.DONATION_LIMITS,
      activeDonationCacheEntries: this.dailyDonationCache.size,
      uptime: process.uptime()
    };
  }

  /**
   * Arrêter le service
   */
  stop(): void {
    if (this.statsUpdateTimer) {
      clearInterval(this.statsUpdateTimer);
      this.statsUpdateTimer = null;
    }
    
    this.dailyDonationCache.clear();
    
    console.log('🏰 ClanService stopped');
  }
}

// Export singleton
let clanServiceInstance: ClanService | null = null;

export function getClanService(config?: Partial<IClanServiceConfig>): ClanService {
  if (!clanServiceInstance) {
    clanServiceInstance = new ClanService(config);
  }
  return clanServiceInstance;
}

export { ClanService };
