import { Room, Client, ServerError } from 'colyseus';
import { Schema, MapSchema, ArraySchema, type } from '@colyseus/schema';
import { getActionLogger, ActionLoggerService } from '../services/ActionLoggerService';
import { TokenService } from '../middleware/AuthData';
import BattleSession, { IBattleSession } from '../models/BattleSession';
import UserData from '../models/UserData';
import PlayerCollection from '../models/PlayerCollection';
import * as http from 'http';

// === COLYSEUS SCHEMAS ===

// Position sur le terrain (grille 18x32 comme CR)
export class Position extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
}

// Unité sur le terrain
export class BattleUnit extends Schema {
  @type("string") id: string = "";
  @type("string") cardId: string = "";
  @type("string") ownerId: string = "";
  @type(Position) position: Position = new Position();
  @type("number") hitpoints: number = 0;
  @type("number") maxHitpoints: number = 0;
  @type("number") level: number = 1;
  @type("string") state: string = "moving"; // moving, attacking, dying
  @type("number") targetX: number = 0;
  @type("number") targetY: number = 0;
  @type("string") targetId: string = "";
  @type("number") lastActionTick: number = 0;
}

// Tour de défense
export class Tower extends Schema {
  @type("string") id: string = "";
  @type("string") type: string = ""; // left, right, king
  @type("string") ownerId: string = "";
  @type(Position) position: Position = new Position();
  @type("number") hitpoints: number = 0;
  @type("number") maxHitpoints: number = 0;
  @type("boolean") isDestroyed: boolean = false;
  @type("string") targetId: string = "";
  @type("number") lastAttackTick: number = 0;
}

// État d'un joueur dans la bataille
export class BattlePlayerState extends Schema {
  @type("string") userId: string = "";
  @type("string") username: string = "";
  @type("string") displayName: string = "";
  @type("number") level: number = 1;
  @type("number") trophies: number = 0;
  @type("boolean") isReady: boolean = false;
  @type("boolean") isBot: boolean = false;
  
  // Ressources
  @type("number") currentElixir: number = 5;
  @type("number") maxElixir: number = 10;
  @type("number") elixirRegenRate: number = 2800; // ms par élixir (2.8s)
  @type("number") lastElixirTick: number = 0;
  
  // Deck et cartes
  @type(["string"]) deck: ArraySchema<string> = new ArraySchema<string>();
  @type(["number"]) deckLevels: ArraySchema<number> = new ArraySchema<number>();
  @type(["string"]) cardsInHand: ArraySchema<string> = new ArraySchema<string>();
  @type("string") nextCard: string = "";
  @type("number") cardCycle: number = 0;
  
  // Tours
  @type("number") leftTowerHP: number = 1400;
  @type("number") rightTowerHP: number = 1400;
  @type("number") kingTowerHP: number = 2600;
  @type("number") towersDestroyed: number = 0;
  
  // Stats de bataille
  @type("number") cardsPlayed: number = 0;
  @type("number") elixirSpent: number = 0;
  @type("number") damageDealt: number = 0;
  @type("number") unitsDeployed: number = 0;
  
  // État
  @type("string") connectionStatus: string = "connected"; // connected, disconnected, reconnecting
  @type("number") ping: number = 0;
  @type("boolean") hasSurrendered: boolean = false;
}

// État global de la bataille
export class BattleRoomState extends Schema {
  @type("string") battleId: string = "";
  @type("string") matchId: string = "";
  @type("string") gameMode: string = "ranked";
  @type("string") battleType: string = "1v1";
  
  // État du match
  @type("string") phase: string = "preparing"; // preparing, countdown, battle, overtime, finished
  @type("number") currentTick: number = 0;
  @type("number") battleDuration: number = 360000; // 6 minutes en ms
  @type("number") remainingTime: number = 360000;
  @type("number") elixirMultiplier: number = 1; // 2x en overtime
  
  // Joueurs
  @type(BattlePlayerState) player1: BattlePlayerState = new BattlePlayerState();
  @type(BattlePlayerState) player2: BattlePlayerState = new BattlePlayerState();
  
  // Terrain
  @type({ map: BattleUnit }) units: MapSchema<BattleUnit> = new MapSchema<BattleUnit>();
  @type({ map: Tower }) towers: MapSchema<Tower> = new MapSchema<Tower>();
  
  // Spectateurs
  @type("number") spectatorCount: number = 0;
  @type(["string"]) spectatorList: ArraySchema<string> = new ArraySchema<string>();
  
  // Résultat
  @type("string") winner: string = ""; // "player1", "player2", "draw"
  @type("string") winCondition: string = ""; // "towers", "timeout", "surrender"
  @type("boolean") isFinished: boolean = false;
  
  // Métadonnées
  @type("number") serverTick: number = 0;
  @type("number") tickRate: number = 20; // 20 TPS comme CR
  @type("boolean") isPaused: boolean = false;
}

// === INTERFACES MESSAGES CLIENT ===

interface PlaceCardMessage {
  cardId: string;
  position: { x: number; y: number };
  deckIndex: number;
}

interface CastSpellMessage {
  spellId: string;
  position: { x: number; y: number };
  targetId?: string;
  deckIndex: number;
}

interface EmoteMessage {
  emoteId: string;
  position?: { x: number; y: number };
}

interface SurrenderMessage {
  confirm: boolean;
}

interface ReadyMessage {
  isReady: boolean;
}

interface SpectateMessage {
  spectatorName: string;
}

interface PingMessage {
  timestamp: number;
}

interface PauseRequestMessage {
  reason: string;
}

// === BATTLEROOM PRINCIPALE ===

export class BattleRoom extends Room<BattleRoomState> {
  private logger!: ActionLoggerService;
  private battleSession!: IBattleSession;
  
  // Game loop
  private gameLoopTimer: NodeJS.Timeout | null = null;
  private readonly TICK_RATE = 50; // 20 TPS = 50ms per tick
  private tickCount = 0;
  
  // Configuration
  private config = {
    maxSpectators: 10,
    reconnectTimeout: 30000,
    surrenderCooldown: 60000, // 1 minute avant surrender
    pauseLimit: 3, // 3 pauses max par joueur
    maxBattleDuration: 480000, // 8 minutes max (6min + 2min overtime)
  };
  
  // État interne
  private playersLoaded = new Set<string>();
  private disconnectedPlayers = new Map<string, number>();
  private lastElixirUpdate = new Map<string, number>();
  
  async onAuth(client: Client, options: any, request?: http.IncomingMessage) {
    try {
      // Vérifier le token JWT
      const authToken = options?.authToken;
      if (!authToken) throw new ServerError(401, 'Auth token required');
      
      const decoded = TokenService.verifyAccessToken(authToken);
      const user = await UserData.findById(decoded.userId);
      if (!user || !user.isActive) throw new ServerError(401, 'User not found or inactive');
      
      return {
        userId: decoded.userId,
        username: decoded.username,
        user: user,
        isSpectator: options.isSpectator || false,
        matchId: options.matchId
      };
      
    } catch (error) {
      throw new ServerError(401, 'Authentication failed');
    }
  }

  async onCreate(options: any) {
    this.setState(new BattleRoomState());
    this.logger = getActionLogger();
    
    console.log('⚔️ BattleRoom created with options:', options);
    
    // Configuration de la room
    this.maxClients = 2 + this.config.maxSpectators; // 2 joueurs + spectateurs
    this.autoDispose = true;
    
    // Initialiser l'état de base
    this.state.battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    this.state.matchId = options.matchId || '';
    this.state.gameMode = options.gameMode || 'ranked';
    this.state.battleType = options.battleType || '1v1';
    this.state.phase = 'preparing';
    
    // Setup des handlers de messages
    this.setupMessageHandlers();
    
    // Initialiser les tours
    this.initializeTowers();
    
    // Logger la création de la battle room
    await this.logger.log('system', 'battle_started', {
      battleId: this.state.battleId,
      matchId: this.state.matchId,
      gameMode: this.state.gameMode,
      roomId: this.roomId
    });
  }

  async onJoin(client: Client, options: any, auth: any) {
    console.log(`⚔️ Player ${client.sessionId} joining BattleRoom`);
    
    try {
      if (auth.isSpectator) {
        await this.handleSpectatorJoin(client, auth);
      } else {
        await this.handlePlayerJoin(client, auth);
      }
      
    } catch (error) {
      console.error('❌ Error in BattleRoom onJoin:', error);
      throw error;
    }
  }

  async onLeave(client: Client, consented: boolean) {
    const auth = client.auth;
    if (!auth) return;
    
    if (auth.isSpectator) {
      await this.handleSpectatorLeave(client);
    } else {
      await this.handlePlayerLeave(client, consented);
    }
  }

  onDispose() {
    console.log('⚔️ BattleRoom disposing...');
    
    // Arrêter le game loop
    if (this.gameLoopTimer) {
      clearTimeout(this.gameLoopTimer);
      this.gameLoopTimer = null;
    }
    
    // Finaliser la battle session si pas encore fait
    if (this.battleSession && !this.state.isFinished) {
      this.battleSession.finalizeBattle();
    }
    
    console.log('✅ BattleRoom disposed');
  }

  // === GESTION DES JOUEURS ===

  private async handlePlayerJoin(client: Client, auth: any) {
    // Vérifier qu'il y a de la place
    if (this.clients.filter(c => !c.auth?.isSpectator).length >= 2) {
      throw new ServerError(400, 'Battle room is full');
    }
    
    // Charger la collection du joueur
    const collection = await PlayerCollection.findOne({ userId: auth.userId });
    if (!collection) {
      throw new ServerError(400, 'Player collection not found');
    }
    
    // Déterminer quel joueur (player1 ou player2)
    const isPlayer1 = this.clients.filter(c => !c.auth?.isSpectator).length === 0;
    const playerState = isPlayer1 ? this.state.player1 : this.state.player2;
    
    // Initialiser l'état du joueur
    playerState.userId = auth.userId;
    playerState.username = auth.username;
    playerState.displayName = auth.user.displayName;
    playerState.level = auth.user.level;
    playerState.trophies = auth.user.stats.currentTrophies;
    playerState.isBot = auth.user.username.includes('bot_') || false;
    
    // Charger le deck actif
    const deck = collection.getDeck();
    if (deck.length !== 8) {
      throw new ServerError(400, 'Invalid deck - must have 8 cards');
    }
    
    // Initialiser le deck
    deck.forEach((slot: any) => {
      playerState.deck.push(slot.cardId);
      // TODO: récupérer le niveau réel depuis collection
      playerState.deckLevels.push(3); // Niveau par défaut pour test
    });
    
    // Cartes en main (4 premières)
    for (let i = 0; i < 4; i++) {
      playerState.cardsInHand.push(deck[i].cardId);
    }
    playerState.nextCard = deck[4].cardId;
    playerState.cardCycle = 4;
    
    // Associer le client au joueur
    client.userData = { playerNumber: isPlayer1 ? '1' : '2' };
    this.lastElixirUpdate.set(client.sessionId, Date.now());
    
    // Logger le join
    await this.logger.logBattle('battle_started', auth.userId, {
      battleId: this.state.battleId,
      isPlayer1,
      deck: playerState.deck,
      trophies: playerState.trophies
    });
    
    // Envoyer confirmation au client
    client.send('battle_joined', {
      battleId: this.state.battleId,
      playerNumber: isPlayer1 ? '1' : '2',
      phase: this.state.phase,
      deck: playerState.deck.slice(),
      cardsInHand: playerState.cardsInHand.slice()
    });
    
    console.log(`✅ Player ${playerState.username} joined as player${isPlayer1 ? '1' : '2'}`);
    
    // Vérifier si on peut commencer
    await this.checkStartConditions();
  }

  private async handleSpectatorJoin(client: Client, auth: any) {
    if (this.state.spectatorCount >= this.config.maxSpectators) {
      throw new ServerError(400, 'Too many spectators');
    }
    
    this.state.spectatorCount++;
    this.state.spectatorList.push(auth.username);
    
    // Logger spectateur
    await this.logger.logNavigation('screen_viewed', auth.userId, {
      scene: 'battle_spectator',
      battleId: this.state.battleId
    });
    
    client.send('spectator_joined', {
      battleId: this.state.battleId,
      phase: this.state.phase,
      spectatorCount: this.state.spectatorCount
    });
    
    console.log(`👁️ Spectator ${auth.username} joined (${this.state.spectatorCount} total)`);
  }

  private async handlePlayerLeave(client: Client, consented: boolean) {
    const playerNumber = client.userData?.playerNumber;
    if (!playerNumber) return;
    
    const playerState = playerNumber === '1' ? this.state.player1 : this.state.player2;
    
    if (consented || this.state.phase === 'finished') {
      // Déconnexion volontaire ou partie finie
      console.log(`👋 Player ${playerState.username} left voluntarily`);
    } else {
      // Déconnexion involontaire - permettre reconnexion
      playerState.connectionStatus = 'disconnected';
      this.disconnectedPlayers.set(client.sessionId, Date.now());
      
      console.log(`🔌 Player ${playerState.username} disconnected unexpectedly`);
      
      // Auto-surrender après timeout si pas de reconnexion
      setTimeout(() => {
        if (playerState.connectionStatus === 'disconnected') {
          this.handleSurrender(playerState.userId, 'disconnect_timeout');
        }
      }, this.config.reconnectTimeout);
    }
    
    // Logger la déconnexion
    await this.logger.logBattle('battle_ended', playerState.userId, {
      battleId: this.state.battleId,
      reason: consented ? 'voluntary_leave' : 'disconnect',
      duration: Date.now() - this.battleSession?.startTime.getTime() || 0
    });
  }

  private async handleSpectatorLeave(client: Client) {
    const auth = client.auth;
    if (!auth) return;
    
    this.state.spectatorCount = Math.max(0, this.state.spectatorCount - 1);
    
    // Retirer de la liste
    const index = this.state.spectatorList.findIndex(name => name === auth.username);
    if (index !== -1) {
      this.state.spectatorList.deleteAt(index);
    }
    
    console.log(`👋 Spectator ${auth.username} left (${this.state.spectatorCount} remaining)`);
  }

  // === MESSAGE HANDLERS ===

  private setupMessageHandlers() {
    // Actions de gameplay
    this.onMessage('place_card', (client, message: PlaceCardMessage) => {
      this.handlePlaceCard(client, message);
    });
    
    this.onMessage('cast_spell', (client, message: CastSpellMessage) => {
      this.handleCastSpell(client, message);
    });
    
    this.onMessage('emote', (client, message: EmoteMessage) => {
      this.handleEmote(client, message);
    });
    
    this.onMessage('surrender', (client, message: SurrenderMessage) => {
      this.handleSurrenderMessage(client, message);
    });
    
    // État du joueur
    this.onMessage('ready', (client, message: ReadyMessage) => {
      this.handleReady(client, message);
    });
    
    this.onMessage('ping', (client, message: PingMessage) => {
      this.handlePing(client, message);
    });
    
    // Spectateurs
    this.onMessage('spectate', (client, message: SpectateMessage) => {
      this.handleSpectate(client, message);
    });
    
    // Contrôles avancés
    this.onMessage('pause_request', (client, message: PauseRequestMessage) => {
      this.handlePauseRequest(client, message);
    });
  }

  private async handlePlaceCard(client: Client, message: PlaceCardMessage) {
    const playerNumber = client.userData?.playerNumber;
    if (!playerNumber || this.state.phase !== 'battle') return;
    
    const playerState = playerNumber === '1' ? this.state.player1 : this.state.player2;
    const { cardId, position, deckIndex } = message;
    
    // Vérifications
    if (!this.isValidPosition(position, playerNumber)) {
      client.send('action_error', { message: 'Invalid card placement position' });
      return;
    }
    
    if (!playerState.cardsInHand.includes(cardId)) {
      client.send('action_error', { message: 'Card not in hand' });
      return;
    }
    
    // TODO: Récupérer le coût d'élixir depuis CardData
    const elixirCost = this.getCardElixirCost(cardId);
    if (playerState.currentElixir < elixirCost) {
      client.send('action_error', { message: 'Not enough elixir' });
      return;
    }
    
    // Consommer l'élixir
    playerState.currentElixir -= elixirCost;
    playerState.elixirSpent += elixirCost;
    playerState.cardsPlayed++;
    
    // Créer l'unité sur le terrain
    const unitId = `unit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const unit = new BattleUnit();
    unit.id = unitId;
    unit.cardId = cardId;
    unit.ownerId = playerState.userId;
    unit.position.x = position.x;
    unit.position.y = position.y;
    unit.level = playerState.deckLevels[deckIndex] || 1;
    
    // TODO: Récupérer les stats depuis CardData
    unit.hitpoints = this.getCardStats(cardId, unit.level).hitpoints;
    unit.maxHitpoints = unit.hitpoints;
    
    this.state.units.set(unitId, unit);
    playerState.unitsDeployed++;
    
    // Cycle des cartes
    this.cycleCard(playerState);
    
    // Logger l'action
    await this.logger.logBattle('card_played', playerState.userId, {
      battleId: this.state.battleId,
      cardId,
      position,
      elixirCost,
      tick: this.state.currentTick
    });
    
    // Notifier tous les clients
    this.broadcast('card_placed', {
      playerId: playerState.userId,
      cardId,
      position,
      unitId,
      tick: this.state.currentTick
    });
    
    console.log(`🃏 ${playerState.username} played ${cardId} at (${position.x}, ${position.y})`);
  }

  private async handleCastSpell(client: Client, message: CastSpellMessage) {
    const playerNumber = client.userData?.playerNumber;
    if (!playerNumber || this.state.phase !== 'battle') return;
    
    const playerState = playerNumber === '1' ? this.state.player1 : this.state.player2;
    const { spellId, position, targetId } = message;
    
    // Vérifications similaires à place_card
    if (!playerState.cardsInHand.includes(spellId)) {
      client.send('action_error', { message: 'Spell not in hand' });
      return;
    }
    
    const elixirCost = this.getCardElixirCost(spellId);
    if (playerState.currentElixir < elixirCost) {
      client.send('action_error', { message: 'Not enough elixir' });
      return;
    }
    
    // Consommer l'élixir
    playerState.currentElixir -= elixirCost;
    playerState.elixirSpent += elixirCost;
    playerState.cardsPlayed++;
    
    // Appliquer l'effet du sort immédiatement
    await this.applySpellEffect(spellId, position, targetId, playerState);
    
    // Cycle des cartes
    this.cycleCard(playerState);
    
    // Logger l'action
    await this.logger.logBattle('spell_cast', playerState.userId, {
      battleId: this.state.battleId,
      spellId,
      position,
      targetId,
      elixirCost,
      tick: this.state.currentTick
    });
    
    // Notifier tous les clients
    this.broadcast('spell_cast', {
      playerId: playerState.userId,
      spellId,
      position,
      targetId,
      tick: this.state.currentTick
    });
    
    console.log(`✨ ${playerState.username} cast ${spellId} at (${position.x}, ${position.y})`);
  }

  private async handleEmote(client: Client, message: EmoteMessage) {
    const playerNumber = client.userData?.playerNumber;
    if (!playerNumber) return;
    
    const playerState = playerNumber === '1' ? this.state.player1 : this.state.player2;
    const { emoteId, position } = message;
    
    // Logger l'emote
    await this.logger.logBattle('emote_used', playerState.userId, {
      battleId: this.state.battleId,
      emoteId,
      position,
      tick: this.state.currentTick
    });
    
    // Broadcaster à tous les clients
    this.broadcast('emote_used', {
      playerId: playerState.userId,
      emoteId,
      position,
      tick: this.state.currentTick
    });
  }

  private async handleSurrenderMessage(client: Client, message: SurrenderMessage) {
    const playerNumber = client.userData?.playerNumber;
    if (!playerNumber || this.state.phase !== 'battle') return;
    
    const playerState = playerNumber === '1' ? this.state.player1 : this.state.player2;
    
    if (!message.confirm) return;
    
    // Vérifier le cooldown
    if (this.state.currentTick < this.config.surrenderCooldown / this.TICK_RATE) {
      client.send('action_error', { message: 'Cannot surrender yet' });
      return;
    }
    
    await this.handleSurrender(playerState.userId, 'voluntary');
  }

  private async handleReady(client: Client, message: ReadyMessage) {
    const playerNumber = client.userData?.playerNumber;
    if (!playerNumber) return;
    
    const playerState = playerNumber === '1' ? this.state.player1 : this.state.player2;
    playerState.isReady = message.isReady;
    
    console.log(`✅ ${playerState.username} is ${message.isReady ? 'ready' : 'not ready'}`);
    
    await this.checkStartConditions();
  }

  private handlePing(client: Client, message: PingMessage) {
    const playerNumber = client.userData?.playerNumber;
    if (!playerNumber) return;
    
    const playerState = playerNumber === '1' ? this.state.player1 : this.state.player2;
    playerState.ping = Date.now() - message.timestamp;
    
    client.send('pong', {
      timestamp: message.timestamp,
      serverTime: Date.now()
    });
  }

  private handleSpectate(client: Client, message: SpectateMessage) {
    // Déjà géré dans handleSpectatorJoin
    client.send('spectate_confirmed', {
      spectatorName: message.spectatorName
    });
  }

  private handlePauseRequest(client: Client, message: PauseRequestMessage) {
    // TODO: Implémenter système de pause
    console.log(`⏸️ Pause requested by ${client.auth?.username}: ${message.reason}`);
  }

  // === GAME LOOP ===

  private async checkStartConditions() {
    const player1Ready = this.state.player1.userId && this.state.player1.isReady;
    const player2Ready = this.state.player2.userId && this.state.player2.isReady;
    
    if (player1Ready && player2Ready && this.state.phase === 'preparing') {
      await this.startBattle();
    }
  }

  private async startBattle() {
    console.log('🚀 Starting battle!');
    
    this.state.phase = 'countdown';
    
    // Créer la BattleSession en base
    this.battleSession = await BattleSession.createBattle(
      {
        userId: this.state.player1.userId,
        username: this.state.player1.username,
        displayName: this.state.player1.displayName,
        level: this.state.player1.level,
        trophies: this.state.player1.trophies,
        deck: this.state.player1.deck.slice(),
        deckLevels: this.state.player1.deckLevels.slice()
      },
      {
        userId: this.state.player2.userId,
        username: this.state.player2.username,
        displayName: this.state.player2.displayName,
        level: this.state.player2.level,
        trophies: this.state.player2.trophies,
        deck: this.state.player2.deck.slice(),
        deckLevels: this.state.player2.deckLevels.slice()
      },
      this.roomId,
      {
        gameMode: this.state.gameMode,
        battleType: this.state.battleType,
        matchId: this.state.matchId
      }
    );
    
    this.state.battleId = this.battleSession.battleId;
    
    // Countdown 3 secondes
    this.broadcast('battle_countdown', { countdown: 3 });
    
    setTimeout(() => {
      this.state.phase = 'battle';
      this.startGameLoop();
      
      this.broadcast('battle_started', {
        battleId: this.state.battleId,
        startTime: Date.now()
      });
    }, 3000);
  }

  private startGameLoop() {
    console.log('🎮 Game loop started (20 TPS)');
    
    const gameLoop = () => {
      if (this.state.phase === 'battle' && !this.state.isPaused) {
        this.gameTick();
      }
      
      // Programmer le prochain tick
      this.gameLoopTimer = setTimeout(gameLoop, this.TICK_RATE);
    };
    
    gameLoop();
  }

  private gameTick() {
    this.tickCount++;
    this.state.currentTick = this.tickCount;
    this.state.serverTick = Date.now();
    
    // Mise à jour du temps restant
    this.state.remainingTime = Math.max(0, this.state.battleDuration - (this.tickCount * this.TICK_RATE));
    
    // Régénération d'élixir
    this.updateElixirRegeneration();
    
    // Mise à jour des unités
    this.updateUnits();
    
    // Vérifier les conditions de victoire
    this.checkVictoryConditions();
    
    // Vérifier overtime
    if (this.state.remainingTime <= 0 && this.state.phase === 'battle') {
      this.enterOvertime();
    }
    
    // Envoyer update aux clients (moins fréquent pour optimiser)
    if (this.tickCount % 4 === 0) { // Envoyer state update 5 fois par seconde
      this.broadcast('game_tick', {
        tick: this.state.currentTick,
        remainingTime: this.state.remainingTime,
        phase: this.state.phase
      });
    }
  }

  private updateElixirRegeneration() {
    const now = Date.now();
    
    [this.state.player1, this.state.player2].forEach(player => {
      if (player.currentElixir < player.maxElixir) {
        const lastUpdate = this.lastElixirUpdate.get(player.userId) || now;
        const timePassed = now - lastUpdate;
        const regenRate = player.elixirRegenRate / this.state.elixirMultiplier;
        
        if (timePassed >= regenRate) {
          player.currentElixir = Math.min(player.maxElixir, player.currentElixir + 1);
          this.lastElixirUpdate.set(player.userId, now);
          
          // Notifier le client
          this.broadcast('elixir_update', {
            playerId: player.userId,
            currentElixir: player.currentElixir,
            tick: this.state.currentTick
          }, { except: this.clients.filter(c => c.auth?.isSpectator) });
        }
      }
    });
  }

  private updateUnits() {
    // Mise à jour de toutes les unités sur le terrain
    this.state.units.forEach((unit, unitId) => {
      // Logique de mouvement et combat basique
      this.updateUnitBehavior(unit);
      
      // Supprimer les unités mortes
      if (unit.hitpoints <= 0 && unit.state !== 'dying') {
        unit.state = 'dying';
        
        // Programmer la suppression après l'animation
        setTimeout(() => {
          this.state.units.delete(unitId);
          this.broadcast('unit_destroyed', {
            unitId,
            tick: this.state.currentTick
          });
        }, 500);
      }
    });
  }

  private updateUnitBehavior(unit: BattleUnit) {
    // TODO: Implémenter la logique de comportement des unités
    // - Pathfinding vers la cible
    // - Attaque des ennemis à portée
    // - Ciblage des tours
    // - États (moving, attacking, dying)
    
    // Exemple basique: avancer vers la tour du roi ennemi
    if (unit.state === 'moving') {
      const isPlayer1Unit = unit.ownerId === this.state.player1.userId;
      const targetY = isPlayer1Unit ? 0 : 32; // Vers le bas pour P1, vers le haut pour P2
      
      if (Math.abs(unit.position.y - targetY) > 1) {
        unit.position.y += isPlayer1Unit ? -0.5 : 0.5; // Vitesse basique
        unit.lastActionTick = this.state.currentTick;
      }
    }
  }

  private checkVictoryConditions() {
    const p1Towers = this.state.player1.towersDestroyed;
    const p2Towers = this.state.player2.towersDestroyed;
    
    // Victoire par destruction de la tour du roi
    if (this.state.player1.kingTowerHP <= 0) {
      this.endBattle('2', 'towers');
      return;
    }
    if (this.state.player2.kingTowerHP <= 0) {
      this.endBattle('1', 'towers');
      return;
    }
    
    // Victoire par plus de tours détruites (à la fin du temps)
    if (this.state.remainingTime <= 0 && this.state.phase === 'overtime') {
      if (p1Towers > p2Towers) {
        this.endBattle('1', 'towers');
      } else if (p2Towers > p1Towers) {
        this.endBattle('2', 'towers');
      } else {
        this.endBattle('draw', 'timeout');
      }
      return;
    }
  }

  private enterOvertime() {
    console.log('⏰ Entering overtime!');
    
    this.state.phase = 'overtime';
    this.state.elixirMultiplier = 2; // Double élixir
    this.state.remainingTime = 120000; // 2 minutes d'overtime
    
    this.broadcast('overtime_started', {
      remainingTime: this.state.remainingTime,
      elixirMultiplier: this.state.elixirMultiplier
    });
  }

  private async endBattle(winner: string, condition: string) {
    console.log(`🏁 Battle ended: ${winner} wins by ${condition}`);
    
    this.state.phase = 'finished';
    this.state.isFinished = true;
    this.state.winner = winner;
    this.state.winCondition = condition;
    
    // Arrêter le game loop
    if (this.gameLoopTimer) {
      clearTimeout(this.gameLoopTimer);
      this.gameLoopTimer = null;
    }
    
    // Finaliser la BattleSession
    if (this.battleSession) {
      await this.battleSession.finalizeBattle(winner === 'draw' ? undefined : winner);
    }
    
    // Logger la fin de bataille
    await this.logger.logBattle('battle_ended', 'system', {
      battleId: this.state.battleId,
      winner,
      condition,
      duration: this.battleSession?.duration || 0,
      player1Trophies: this.state.player1.trophies,
      player2Trophies: this.state.player2.trophies
    });
    
    // Notifier tous les clients
    this.broadcast('battle_ended', {
      winner,
      winCondition: condition,
      duration: this.battleSession?.duration || 0,
      finalStats: {
        player1: {
          cardsPlayed: this.state.player1.cardsPlayed,
          elixirSpent: this.state.player1.elixirSpent,
          damageDealt: this.state.player1.damageDealt,
          unitsDeployed: this.state.player1.unitsDeployed
        },
        player2: {
          cardsPlayed: this.state.player2.cardsPlayed,
          elixirSpent: this.state.player2.elixirSpent,
          damageDealt: this.state.player2.damageDealt,
          unitsDeployed: this.state.player2.unitsDeployed
        }
      }
    });
    
    // Auto-dispose de la room après 30 secondes
    setTimeout(() => {
      this.disconnect();
    }, 30000);
  }

  private async handleSurrender(userId: string, reason: string) {
    const playerState = userId === this.state.player1.userId ? this.state.player1 : this.state.player2;
    const opponentState = userId === this.state.player1.userId ? this.state.player2 : this.state.player1;
    
    playerState.hasSurrendered = true;
    
    // Logger le surrender
    await this.logger.logBattle('battle_abandoned', userId, {
      battleId: this.state.battleId,
      reason,
      tick: this.state.currentTick
    });
    
    // L'adversaire gagne
    const winner = userId === this.state.player1.userId ? '2' : '1';
    await this.endBattle(winner, 'surrender');
    
    console.log(`🏳️ ${playerState.username} surrendered (${reason})`);
  }

  // === UTILITAIRES ===

  private initializeTowers() {
    // Tours du joueur 1 (en bas)
    this.createTower('player1_left', 'left', this.state.player1.userId, { x: 6, y: 28 });
    this.createTower('player1_right', 'right', this.state.player1.userId, { x: 12, y: 28 });
    this.createTower('player1_king', 'king', this.state.player1.userId, { x: 9, y: 30 });
    
    // Tours du joueur 2 (en haut)
    this.createTower('player2_left', 'left', this.state.player2.userId, { x: 6, y: 4 });
    this.createTower('player2_right', 'right', this.state.player2.userId, { x: 12, y: 4 });
    this.createTower('player2_king', 'king', this.state.player2.userId, { x: 9, y: 2 });
  }

  private createTower(id: string, type: string, ownerId: string, position: { x: number; y: number }) {
    const tower = new Tower();
    tower.id = id;
    tower.type = type;
    tower.ownerId = ownerId;
    tower.position.x = position.x;
    tower.position.y = position.y;
    tower.hitpoints = type === 'king' ? 2600 : 1400;
    tower.maxHitpoints = tower.hitpoints;
    
    this.state.towers.set(id, tower);
  }

  private isValidPosition(position: { x: number; y: number }, playerNumber: string): boolean {
    const { x, y } = position;
    
    // Vérifier les limites du terrain
    if (x < 0 || x >= 18 || y < 0 || y >= 32) return false;
    
    // Vérifier le côté du joueur
    if (playerNumber === '1') {
      // Joueur 1 peut placer sur sa moitié (y >= 16)
      return y >= 16;
    } else {
      // Joueur 2 peut placer sur sa moitié (y <= 16)
      return y <= 16;
    }
  }

  private cycleCard(playerState: BattlePlayerState) {
    // Retirer la carte jouée de la main
    const playedCardIndex = playerState.cardsInHand.findIndex(card => 
      card === playerState.cardsInHand[0] // Simplification - première carte
    );
    
    if (playedCardIndex !== -1) {
      playerState.cardsInHand.deleteAt(playedCardIndex);
    }
    
    // Ajouter la prochaine carte
    playerState.cardsInHand.push(playerState.nextCard);
    
    // Calculer la prochaine carte dans le cycle
    playerState.cardCycle = (playerState.cardCycle + 1) % playerState.deck.length;
    playerState.nextCard = playerState.deck[playerState.cardCycle];
  }

  private getCardElixirCost(cardId: string): number {
    // TODO: Récupérer depuis CardData
    const costs: Record<string, number> = {
      'knight': 3,
      'archers': 3,
      'goblins': 2,
      'arrows': 3,
      'fireball': 4,
      'cannon': 3
    };
    return costs[cardId] || 3;
  }

  private getCardStats(cardId: string, level: number): { hitpoints: number; damage: number } {
    // TODO: Récupérer depuis CardData avec niveau
    const baseStats: Record<string, { hitpoints: number; damage: number }> = {
      'knight': { hitpoints: 1400, damage: 167 },
      'archers': { hitpoints: 304, damage: 118 },
      'goblins': { hitpoints: 214, damage: 169 },
      'cannon': { hitpoints: 734, damage: 320 }
    };
    
    const base = baseStats[cardId] || { hitpoints: 100, damage: 50 };
    const multiplier = 1 + (level - 1) * 0.1; // +10% par niveau
    
    return {
      hitpoints: Math.round(base.hitpoints * multiplier),
      damage: Math.round(base.damage * multiplier)
    };
  }

  private async applySpellEffect(spellId: string, position: { x: number; y: number }, targetId: string | undefined, caster: BattlePlayerState) {
    // TODO: Implémenter les effets des sorts
    console.log(`✨ Applying spell ${spellId} at (${position.x}, ${position.y})`);
    
    // Exemple pour fireball
    if (spellId === 'fireball') {
      const damage = this.getCardStats(spellId, 1).damage;
      const radius = 2.5;
      
      // Infliger des dégâts aux unités dans la zone
      this.state.units.forEach(unit => {
        const distance = Math.sqrt(
          Math.pow(unit.position.x - position.x, 2) + 
          Math.pow(unit.position.y - position.y, 2)
        );
        
        if (distance <= radius && unit.ownerId !== caster.userId) {
          unit.hitpoints = Math.max(0, unit.hitpoints - damage);
          caster.damageDealt += Math.min(damage, unit.hitpoints);
        }
      });
      
      // Dégâts aux tours
      this.state.towers.forEach(tower => {
        const distance = Math.sqrt(
          Math.pow(tower.position.x - position.x, 2) + 
          Math.pow(tower.position.y - position.y, 2)
        );
        
        if (distance <= radius && tower.ownerId !== caster.userId) {
          const towerDamage = Math.round(damage * 0.4); // Dégâts réduits sur les tours
          tower.hitpoints = Math.max(0, tower.hitpoints - towerDamage);
          caster.damageDealt += Math.min(towerDamage, tower.hitpoints);
          
          // Mettre à jour l'état du joueur
          this.updateTowerHP(tower);
        }
      });
    }
  }

  private updateTowerHP(tower: Tower) {
    const playerState = tower.ownerId === this.state.player1.userId ? this.state.player1 : this.state.player2;
    
    switch (tower.type) {
      case 'left':
        playerState.leftTowerHP = tower.hitpoints;
        if (tower.hitpoints <= 0) playerState.towersDestroyed++;
        break;
      case 'right':
        playerState.rightTowerHP = tower.hitpoints;
        if (tower.hitpoints <= 0) playerState.towersDestroyed++;
        break;
      case 'king':
        playerState.kingTowerHP = tower.hitpoints;
        break;
    }
    
    if (tower.hitpoints <= 0) {
      tower.isDestroyed = true;
    }
  }

  // === MÉTHODES PUBLIQUES ===

  /**
   * Obtenir les statistiques actuelles de la bataille
   */
  getBattleStats() {
    return {
      battleId: this.state.battleId,
      phase: this.state.phase,
      currentTick: this.state.currentTick,
      remainingTime: this.state.remainingTime,
      players: {
        player1: {
          username: this.state.player1.username,
          trophies: this.state.player1.trophies,
          cardsPlayed: this.state.player1.cardsPlayed,
          elixirSpent: this.state.player1.elixirSpent,
          towersDestroyed: this.state.player1.towersDestroyed,
          connectionStatus: this.state.player1.connectionStatus
        },
        player2: {
          username: this.state.player2.username,
          trophies: this.state.player2.trophies,
          cardsPlayed: this.state.player2.cardsPlayed,
          elixirSpent: this.state.player2.elixirSpent,
          towersDestroyed: this.state.player2.towersDestroyed,
          connectionStatus: this.state.player2.connectionStatus
        }
      },
      spectators: this.state.spectatorCount,
      units: this.state.units.size,
      totalClients: this.clients.length
    };
  }

  /**
   * Forcer la fin de la bataille (pour admin/debug)
   */
  async forceBattleEnd(winner?: string) {
    if (this.state.isFinished) return false;
    
    await this.endBattle(winner || 'draw', 'forced');
    return true;
  }

  /**
   * Ajouter du temps à la bataille (pour debug)
   */
  addBattleTime(seconds: number) {
    this.state.remainingTime += seconds * 1000;
    this.broadcast('time_added', { addedTime: seconds * 1000 });
  }
}
