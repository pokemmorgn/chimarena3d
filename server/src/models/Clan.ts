import mongoose, { Document, Schema, Types, Model } from 'mongoose';

// Interface pour un membre du clan
export interface IClanMember {
  userId: Types.ObjectId;
  username: string;
  displayName: string;
  level: number;
  trophies: number;
  role: 'leader' | 'co-leader' | 'elder' | 'member';
  joinedAt: Date;
  lastSeen: Date;
  
  // Statistiques du membre
  donationsGiven: number;        // Cartes données
  donationsReceived: number;     // Cartes reçues
  warParticipations: number;     // Participations aux guerres
  warWins: number;               // Victoires en guerre
  totalScore: number;            // Score total du membre
  
  // État
  isOnline: boolean;
  lastActivity: Date;
}

// Interface pour les paramètres du clan
export interface IClanSettings {
  type: 'open' | 'invite_only' | 'closed';  // Type d'accès
  requiredTrophies: number;                 // Trophées minimum requis
  description: string;                      // Description du clan
  location: string;                         // Localisation
  badge: string;                            // Badge/emblème du clan
  language: string;                         // Langue principale
  warFrequency: 'always' | 'never' | 'once_per_week'; // Fréquence des guerres
}

// Interface pour le chat du clan
export interface IClanChatMessage {
  messageId: string;
  authorId: Types.ObjectId;
  authorUsername: string;
  authorRole: IClanMember['role'];
  content: string;
  type: 'text' | 'donation_request' | 'donation_fulfilled' | 'system' | 'war_update';
  timestamp: Date;
  
  // Données spécifiques selon le type
  donationData?: {
    cardId: string;
    requestedAmount: number;
    fulfilledAmount: number;
    contributors: {
      userId: Types.ObjectId;
      username: string;
      amount: number;
      timestamp: Date;
    }[];
    expiresAt: Date;
  };
  
  // Métadonnées
  isVisible: boolean;
  editedAt?: Date;
}

// Interface pour les statistiques du clan
export interface IClanStats {
  totalMembers: number;
  onlineMembers: number;
  totalTrophies: number;
  averageTrophies: number;
  totalDonations: number;
  totalScore: number;
  
  // Guerre de clans
  warWins: number;
  warLosses: number;
  warWinRate: number;
  currentWarScore: number;
  
  // Activité
  messagesLast24h: number;
  donationsLast24h: number;
  activeMembers: number;        // Membres actifs dernière semaine
  
  // Classement
  localRank?: number;           // Rang local
  globalRank?: number;          // Rang global
  trophyRequirements: number;   // Trophées requis
}

// Interface principale pour le Clan
export interface IClan extends Document {
  // === IDENTIFIANTS ===
  clanId: string;               // ID unique du clan (généré)
  name: string;                 // Nom du clan
  tag: string;                  // Tag du clan (#ABC123)
  
  // === MEMBRES ===
  members: IClanMember[];       // Liste des membres
  memberCount: number;          // Nombre de membres (pour performance)
  maxMembers: number;           // Limite de membres (50 par défaut)
  
  // === LEADERSHIP ===
  leaderId: Types.ObjectId;     // ID du leader principal
  coLeaders: Types.ObjectId[];  // IDs des co-leaders
  elders: Types.ObjectId[];     // IDs des anciens
  
  // === PARAMÈTRES ===
  settings: IClanSettings;      // Configuration du clan
  
  // === CHAT ===
  chatMessages: IClanChatMessage[]; // Messages du chat (derniers 200)
  chatSettings: {
    maxMessagesStored: number;  // Max messages stockés
    allowDonationRequests: boolean;
    moderationEnabled: boolean;
  };
  
  // === STATISTIQUES ===
  stats: IClanStats;            // Statistiques actuelles
  
  // === GUERRE DE CLANS (optionnel) ===
  currentWar?: {
    warId: string;
    opponent: string;
    startTime: Date;
    endTime: Date;
    status: 'preparation' | 'active' | 'ended';
    participantCount: number;
    score: number;
    opponentScore: number;
  };
  
  // === MÉTADONNÉES ===
  createdAt: Date;
  updatedAt: Date;
  region: string;               // Région géographique
  isActive: boolean;            // Clan actif ou abandonné
  
  // === MÉTHODES ===
  addMember(userId: Types.ObjectId, userInfo: any): Promise<boolean>;
  removeMember(userId: Types.ObjectId, removedBy: Types.ObjectId): Promise<boolean>;
  promoteMember(userId: Types.ObjectId, promotedBy: Types.ObjectId): Promise<boolean>;
  demoteMember(userId: Types.ObjectId, demotedBy: Types.ObjectId): Promise<boolean>;
  updateMemberRole(userId: Types.ObjectId, newRole: IClanMember['role']): Promise<boolean>;
  addChatMessage(message: Omit<IClanChatMessage, 'messageId' | 'timestamp'>): Promise<string>;
  getMember(userId: Types.ObjectId): IClanMember | null;
  canJoin(userTrophies: number): boolean;
  updateStats(): Promise<void>;
  isDonationRequestActive(cardId: string): boolean;
}

// Interface pour les méthodes statiques
export interface IClanModel extends Model<IClan> {
  createClan(
    leaderInfo: any,
    clanData: {
      name: string;
      description?: string;
      badge?: string;
      type?: IClanSettings['type'];
      requiredTrophies?: number;
    }
  ): Promise<IClan>;
  
  findByTag(tag: string): Promise<IClan | null>;
  searchClans(query: {
    name?: string;
    minTrophies?: number;
    maxTrophies?: number;
    type?: IClanSettings['type'];
    region?: string;
    hasSpace?: boolean;
  }): Promise<IClan[]>;
  
  getTopClans(limit?: number, region?: string): Promise<IClan[]>;
  getUserClan(userId: Types.ObjectId): Promise<IClan | null>;
}

// Schema pour les membres
const ClanMemberSchema = new Schema<IClanMember>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'UserData',
    required: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  trophies: {
    type: Number,
    required: true,
    min: 0
  },
  role: {
    type: String,
    enum: ['leader', 'co-leader', 'elder', 'member'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  
  // Statistiques
  donationsGiven: {
    type: Number,
    default: 0,
    min: 0
  },
  donationsReceived: {
    type: Number,
    default: 0,
    min: 0
  },
  warParticipations: {
    type: Number,
    default: 0,
    min: 0
  },
  warWins: {
    type: Number,
    default: 0,
    min: 0
  },
  totalScore: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // État
  isOnline: {
    type: Boolean,
    default: false
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Schema pour les paramètres
const ClanSettingsSchema = new Schema<IClanSettings>({
  type: {
    type: String,
    enum: ['open', 'invite_only', 'closed'],
    default: 'open'
  },
  requiredTrophies: {
    type: Number,
    default: 0,
    min: 0,
    max: 10000
  },
  description: {
    type: String,
    default: '',
    maxlength: 500
  },
  location: {
    type: String,
    default: 'International'
  },
  badge: {
    type: String,
    default: 'default_badge'
  },
  language: {
    type: String,
    default: 'en'
  },
  warFrequency: {
    type: String,
    enum: ['always', 'never', 'once_per_week'],
    default: 'once_per_week'
  }
}, { _id: false });

// Schema pour les messages de chat
const ClanChatMessageSchema = new Schema<IClanChatMessage>({
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  authorId: {
    type: Schema.Types.ObjectId,
    ref: 'UserData',
    required: true
  },
  authorUsername: {
    type: String,
    required: true
  },
  authorRole: {
    type: String,
    enum: ['leader', 'co-leader', 'elder', 'member'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['text', 'donation_request', 'donation_fulfilled', 'system', 'war_update'],
    default: 'text'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  
  // Données de donation
  donationData: {
    cardId: { type: String },
    requestedAmount: { type: Number, min: 1 },
    fulfilledAmount: { type: Number, default: 0 },
    contributors: [{
      userId: { type: Schema.Types.ObjectId, ref: 'UserData' },
      username: { type: String },
      amount: { type: Number, min: 1 },
      timestamp: { type: Date, default: Date.now }
    }],
    expiresAt: { type: Date }
  },
  
  isVisible: {
    type: Boolean,
    default: true
  },
  editedAt: {
    type: Date
  }
}, { _id: false });

// Schema pour les statistiques
const ClanStatsSchema = new Schema<IClanStats>({
  totalMembers: { type: Number, default: 0 },
  onlineMembers: { type: Number, default: 0 },
  totalTrophies: { type: Number, default: 0 },
  averageTrophies: { type: Number, default: 0 },
  totalDonations: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  
  warWins: { type: Number, default: 0 },
  warLosses: { type: Number, default: 0 },
  warWinRate: { type: Number, default: 0 },
  currentWarScore: { type: Number, default: 0 },
  
  messagesLast24h: { type: Number, default: 0 },
  donationsLast24h: { type: Number, default: 0 },
  activeMembers: { type: Number, default: 0 },
  
  localRank: { type: Number },
  globalRank: { type: Number },
  trophyRequirements: { type: Number, default: 0 }
}, { _id: false });

// Schema principal du Clan
const ClanSchema = new Schema<IClan, IClanModel>({
  clanId: {
    type: String,
    required: true,
    unique: true,
    default: () => `clan_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50
  },
  tag: {
    type: String,
    required: true,
    unique: true,
    match: /^#[A-Z0-9]{6,8}$/  // Format Clash Royale: #ABC123XY
  },
  
  // Membres
  members: {
    type: [ClanMemberSchema],
    default: []
  },
  memberCount: {
    type: Number,
    default: 0,
    min: 0,
    max: 50
  },
  maxMembers: {
    type: Number,
    default: 50,
    min: 1,
    max: 50
  },
  
  // Leadership
  leaderId: {
    type: Schema.Types.ObjectId,
    ref: 'UserData',
    required: true
  },
  coLeaders: [{
    type: Schema.Types.ObjectId,
    ref: 'UserData'
  }],
  elders: [{
    type: Schema.Types.ObjectId,
    ref: 'UserData'
  }],
  
  // Configuration
  settings: {
    type: ClanSettingsSchema,
    default: () => ({})
  },
  
  // Chat
  chatMessages: {
    type: [ClanChatMessageSchema],
    default: []
  },
  chatSettings: {
    maxMessagesStored: { type: Number, default: 200 },
    allowDonationRequests: { type: Boolean, default: true },
    moderationEnabled: { type: Boolean, default: false }
  },
  
  // Statistiques
  stats: {
    type: ClanStatsSchema,
    default: () => ({})
  },
  
  // Guerre de clans (optionnelle)
  currentWar: {
    warId: { type: String },
    opponent: { type: String },
    startTime: { type: Date },
    endTime: { type: Date },
    status: {
      type: String,
      enum: ['preparation', 'active', 'ended']
    },
    participantCount: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    opponentScore: { type: Number, default: 0 }
  },
  
  // Métadonnées
  region: {
    type: String,
    default: 'global'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(_doc: any, ret: any) {
      delete ret.__v;
      return ret;
    }
  }
});

// Index pour performance
ClanSchema.index({ clanId: 1 });
ClanSchema.index({ tag: 1 });
ClanSchema.index({ name: 'text', 'settings.description': 'text' });
ClanSchema.index({ 'settings.type': 1, 'settings.requiredTrophies': 1 });
ClanSchema.index({ 'stats.totalTrophies': -1 });
ClanSchema.index({ region: 1, 'stats.totalTrophies': -1 });
ClanSchema.index({ 'members.userId': 1 });
ClanSchema.index({ leaderId: 1 });

// === MÉTHODES D'INSTANCE ===

/**
 * Ajouter un membre au clan
 */
ClanSchema.methods.addMember = async function(userId: Types.ObjectId, userInfo: any): Promise<boolean> {
  if (this.memberCount >= this.maxMembers) {
    return false;
  }
  
  // Vérifier si l'utilisateur n'est pas déjà membre
  if (this.members.some((member: IClanMember) => member.userId.equals(userId))) {
    return false;
  }
  
  const newMember: IClanMember = {
    userId,
    username: userInfo.username,
    displayName: userInfo.displayName,
    level: userInfo.level,
    trophies: userInfo.trophies,
    role: 'member',
    joinedAt: new Date(),
    lastSeen: new Date(),
    donationsGiven: 0,
    donationsReceived: 0,
    warParticipations: 0,
    warWins: 0,
    totalScore: 0,
    isOnline: true,
    lastActivity: new Date()
  };
  
  this.members.push(newMember);
  this.memberCount = this.members.length;
  
  // Ajouter message système
  await this.addChatMessage({
    authorId: userId,
    authorUsername: userInfo.username,
    authorRole: 'member',
    content: `${userInfo.displayName} a rejoint le clan!`,
    type: 'system',
    isVisible: true
  });
  
  await this.updateStats();
  await this.save();
  
  // 🔥 CRUCIAL: Mettre à jour le profil utilisateur
  try {
    const UserData = (await import('./UserData')).default;
    const user = await UserData.findById(userId);
    
    if (user) {
      user.clanId = this._id;
      user.clanRole = newMember.role;
      user.joinedClanAt = newMember.joinedAt;
      await user.save();
      
      console.log(`✅ Updated user ${user.username} profile with clan membership`);
    } else {
      console.warn(`⚠️ Could not find user ${userId} to update clan membership`);
    }
  } catch (error) {
    console.error('Error updating user profile with clan membership:', error);
    // Ne pas faire échouer l'ajout au clan pour cette erreur
  }
  
  return true;
};

/**
 * Retirer un membre du clan
 */
ClanSchema.methods.removeMember = async function(userId: Types.ObjectId, removedBy: Types.ObjectId): Promise<boolean> {
  const memberIndex = this.members.findIndex((member: IClanMember) => member.userId.equals(userId));
  if (memberIndex === -1) return false;
  
  const member = this.members[memberIndex];
  
  // Le leader ne peut pas être retiré (sauf s'il se retire lui-même)
  if (member.role === 'leader' && !userId.equals(removedBy)) {
    return false;
  }
  
  // Retirer des rôles de leadership
  this.coLeaders = this.coLeaders.filter((id: Types.ObjectId) => !id.equals(userId));
  this.elders = this.elders.filter((id: Types.ObjectId) => !id.equals(userId));
  
  // Retirer de la liste des membres
  this.members.splice(memberIndex, 1);
  this.memberCount = this.members.length;
  
  // Message système
  const remover = this.members.find((m: IClanMember) => m.userId.equals(removedBy));
  const isVoluntary = userId.equals(removedBy);
  
  await this.addChatMessage({
    authorId: removedBy,
    authorUsername: remover?.username || 'System',
    authorRole: remover?.role || 'member',
    content: isVoluntary 
      ? `${member.displayName} a quitté le clan.`
      : `${member.displayName} a été exclu du clan.`,
    type: 'system',
    isVisible: true
  });
  
  await this.updateStats();
  await this.save();
  
  // 🔥 CRUCIAL: Nettoyer le profil utilisateur
  try {
    const UserData = (await import('./UserData')).default;
    const user = await UserData.findById(userId);
    
    if (user) {
      user.clanId = null;
      user.clanRole = null;
      user.joinedClanAt = null;
      await user.save();
      
      console.log(`✅ Cleaned clan info from user ${user.username} profile`);
    } else {
      console.warn(`⚠️ Could not find user ${userId} to clean clan membership`);
    }
  } catch (error) {
    console.error('Error cleaning user profile clan membership:', error);
    // Ne pas faire échouer la suppression pour cette erreur
  }
  
  return true;
};

/**
 * Promouvoir un membre
 */
ClanSchema.methods.promoteMember = async function(userId: Types.ObjectId, promotedBy: Types.ObjectId): Promise<boolean> {
  const member = this.members.find((m: IClanMember) => m.userId.equals(userId));
  if (!member) return false;
  
  const promoter = this.members.find((m: IClanMember) => m.userId.equals(promotedBy));
  if (!promoter) return false;
  
  // Règles de promotion
  if (member.role === 'member' && ['leader', 'co-leader', 'elder'].includes(promoter.role)) {
    member.role = 'elder';
    this.elders.push(userId);
  } else if (member.role === 'elder' && ['leader', 'co-leader'].includes(promoter.role)) {
    member.role = 'co-leader';
    this.elders = this.elders.filter((id: Types.ObjectId) => !id.equals(userId));
    this.coLeaders.push(userId);
  } else {
    return false; // Promotion impossible
  }
  
  await this.addChatMessage({
    authorId: promotedBy,
    authorUsername: promoter.username,
    authorRole: promoter.role,
    content: `${member.displayName} a été promu ${member.role}!`,
    type: 'system',
    isVisible: true
  });
  
  await this.save();
  return true;
};

/**
 * Rétrograder un membre
 */
ClanSchema.methods.demoteMember = async function(userId: Types.ObjectId, demotedBy: Types.ObjectId): Promise<boolean> {
  const member = this.members.find((m: IClanMember) => m.userId.equals(userId));
  if (!member) return false;
  
  const demoter = this.members.find((m: IClanMember) => m.userId.equals(demotedBy));
  if (!demoter) return false;
  
  // Règles de rétrogradation
  if (member.role === 'co-leader' && demoter.role === 'leader') {
    member.role = 'elder';
    this.coLeaders = this.coLeaders.filter((id: Types.ObjectId) => !id.equals(userId));
    this.elders.push(userId);
  } else if (member.role === 'elder' && ['leader', 'co-leader'].includes(demoter.role)) {
    member.role = 'member';
    this.elders = this.elders.filter((id: Types.ObjectId) => !id.equals(userId));
  } else {
    return false; // Rétrogradation impossible
  }
  
  await this.addChatMessage({
    authorId: demotedBy,
    authorUsername: demoter.username,
    authorRole: demoter.role,
    content: `${member.displayName} a été rétrogradé ${member.role}.`,
    type: 'system',
    isVisible: true
  });
  
  await this.save();
  return true;
};

/**
 * Ajouter un message au chat
 */
ClanSchema.methods.addChatMessage = async function(message: Omit<IClanChatMessage, 'messageId' | 'timestamp'>): Promise<string> {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  const chatMessage: IClanChatMessage = {
    ...message,
    messageId,
    timestamp: new Date()
  };
  
  this.chatMessages.push(chatMessage);
  
  // Garder seulement les derniers messages
  if (this.chatMessages.length > this.chatSettings.maxMessagesStored) {
    this.chatMessages = this.chatMessages.slice(-this.chatSettings.maxMessagesStored);
  }
  
  this.markModified('chatMessages');
  return messageId;
};

/**
 * Obtenir un membre par son ID
 */
ClanSchema.methods.getMember = function(userId: Types.ObjectId): IClanMember | null {
  return this.members.find((member: IClanMember) => member.userId.equals(userId)) || null;
};

/**
 * Vérifier si un utilisateur peut rejoindre le clan
 */
ClanSchema.methods.canJoin = function(userTrophies: number): boolean {
  if (this.memberCount >= this.maxMembers) return false;
  if (userTrophies < this.settings.requiredTrophies) return false;
  if (this.settings.type === 'closed') return false;
  
  return true;
};

/**
 * Mettre à jour les statistiques du clan
 */
ClanSchema.methods.updateStats = async function(): Promise<void> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Statistiques des membres
  const totalTrophies = this.members.reduce((sum: number, member: IClanMember) => sum + member.trophies, 0);
  const onlineMembers = this.members.filter((member: IClanMember) => member.isOnline).length;
  const activeMembers = this.members.filter((member: IClanMember) => member.lastActivity >= oneWeekAgo).length;
  const totalDonations = this.members.reduce((sum: number, member: IClanMember) => sum + member.donationsGiven, 0);
  
  // Messages récents
  const recentMessages = this.chatMessages.filter((msg: IClanChatMessage) => msg.timestamp >= oneDayAgo).length;
  const recentDonations = this.chatMessages.filter((msg: IClanChatMessage) => 
    msg.type === 'donation_fulfilled' && msg.timestamp >= oneDayAgo
  ).length;
  
  // Mettre à jour les stats
  this.stats = {
    totalMembers: this.memberCount,
    onlineMembers,
    totalTrophies,
    averageTrophies: this.memberCount > 0 ? Math.round(totalTrophies / this.memberCount) : 0,
    totalDonations,
    totalScore: totalTrophies, // Score simple basé sur les trophées
    
    warWins: this.stats.warWins || 0,
    warLosses: this.stats.warLosses || 0,
    warWinRate: this.stats.warWins > 0 ? Math.round((this.stats.warWins / (this.stats.warWins + this.stats.warLosses)) * 100) : 0,
    currentWarScore: this.stats.currentWarScore || 0,
    
    messagesLast24h: recentMessages,
    donationsLast24h: recentDonations,
    activeMembers,
    
    trophyRequirements: this.settings.requiredTrophies
  };
  
  this.markModified('stats');
};

/**
 * Vérifier si une demande de donation est active
 */
ClanSchema.methods.isDonationRequestActive = function(cardId: string): boolean {
  const now = new Date();
  return this.chatMessages.some((msg: IClanChatMessage) => 
    msg.type === 'donation_request' &&
    msg.donationData?.cardId === cardId &&
    msg.donationData.expiresAt &&
    msg.donationData.expiresAt > now &&
    (msg.donationData.fulfilledAmount || 0) < (msg.donationData.requestedAmount || 0)
  );
};

// === MÉTHODES STATIQUES ===

/**
 * Créer un nouveau clan
 */
ClanSchema.statics.createClan = async function(
  leaderInfo: any,
  clanData: {
    name: string;
    description?: string;
    badge?: string;
    type?: IClanSettings['type'];
    requiredTrophies?: number;
  }
): Promise<IClan> {
  // Générer un tag unique
  let tag: string;
  let attempts = 0;
  do {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    tag = '#' + Array.from({length: 8}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    attempts++;
  } while (await this.exists({ tag }) && attempts < 100);
  
  if (attempts >= 100) {
    throw new Error('Could not generate unique clan tag');
  }
  
  const clan = new this({
    name: clanData.name,
    tag,
    leaderId: leaderInfo._id,
    settings: {
      type: clanData.type || 'open',
      requiredTrophies: clanData.requiredTrophies || 0,
      description: clanData.description || '',
      badge: clanData.badge || 'default_badge'
    }
  });
  
  // Ajouter le leader comme premier membre
  await clan.addMember(leaderInfo._id, leaderInfo);
  const leader = clan.members.find(m => m.userId.equals(leaderInfo._id));
  if (leader) {
    leader.role = 'leader';
  }
  
  await clan.save();
  return clan;
};

/**
 * Trouver un clan par son tag
 */
ClanSchema.statics.findByTag = function(tag: string): Promise<IClan | null> {
  return this.findOne({ tag: tag.toUpperCase(), isActive: true });
};

/**
 * Rechercher des clans selon des critères
 */
ClanSchema.statics.searchClans = function(query: {
  name?: string;
  minTrophies?: number;
  maxTrophies?: number;
  type?: IClanSettings['type'];
  region?: string;
  hasSpace?: boolean;
}): Promise<IClan[]> {
  const filter: any = { isActive: true };
  
  if (query.name) {
    filter.$text = { $search: query.name };
  }
  
  if (query.minTrophies !== undefined) {
    filter['stats.totalTrophies'] = { $gte: query.minTrophies };
  }
  
  if (query.maxTrophies !== undefined) {
    filter['stats.totalTrophies'] = { ...filter['stats.totalTrophies'], $lte: query.maxTrophies };
  }
  
  if (query.type) {
    filter['settings.type'] = query.type;
  }
  
  if (query.region) {
    filter.region = query.region;
  }
  
  if (query.hasSpace) {
    filter.$expr = { $lt: ['$memberCount', '$maxMembers'] };
  }
  
  return this.find(filter)
    .sort({ 'stats.totalTrophies': -1 })
    .limit(50)
    .lean();
};

/**
 * Obtenir le top des clans
 */
ClanSchema.statics.getTopClans = function(limit: number = 100, region?: string): Promise<IClan[]> {
  const filter: any = { isActive: true };
  
  if (region) {
    filter.region = region;
  }
  
  return this.find(filter)
    .sort({ 'stats.totalTrophies': -1, 'stats.totalMembers': -1 })
    .limit(limit)
    .select('clanId name tag stats settings memberCount')
    .lean();
};

/**
 * Obtenir le clan d'un utilisateur
 */
ClanSchema.statics.getUserClan = function(userId: Types.ObjectId): Promise<IClan | null> {
  return this.findOne({ 
    'members.userId': userId,
    isActive: true 
  });
};

// Créer et exporter le model avec le bon typage
const Clan = mongoose.model<IClan, IClanModel>('Clan', ClanSchema);

export default Clan;
