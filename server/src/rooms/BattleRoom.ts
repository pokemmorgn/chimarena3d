import { Room, Client, ServerError } from 'colyseus';
import { Schema, MapSchema, ArraySchema, type } from '@colyseus/schema';
import { getActionLogger, ActionLoggerService } from '../services/ActionLoggerService';
import { TokenService } from '../middleware/AuthData';
import BattleSession, { IBattleSession } from '../models/BattleSession';
import UserData from '../models/UserData';
import PlayerCollection from '../models/PlayerCollection';
import * as http from 'http';
import { getCombatSystem } from '../gameplay/systems/CombatSystem';
import { getTargetingSystem } from '../gameplay/systems/TargetingSystem';
import BaseUnit, { ITower } from '../gameplay/units/BaseUnit';
import BattleTower from '../gameplay/units/buildings/Tower';

// === COLYSEUS SCHEMAS (GARDÉES EXISTANTES) ===

export class Position extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
}

export class BattleUnit extends Schema {
  @type("string") id: string = "";
  @type("string") cardId: string = "";
  @type("string") ownerId: string = "";
  @type(Position) position: Position = new Position();
  @type("number") hitpoints: number = 0;
  @type("number") maxHitpoints: number = 0;
  @type("number") level: number = 1;
  @type("string") state: string = "moving";
  @type("number") targetX: number = 0;
  @type("number") targetY: number = 0;
  @type("string") targetId: string = "";
  @type("number") lastActionTick: number = 0;
}

export class Tower extends Schema {
  @type("string") id: string = "";
  @type("string") type: string = "";
  @type("string") ownerId: string = "";
  @type(Position) position: Position = new Position();
  @type("number") hitpoints: number = 0;
  @type("number") maxHitpoints: number = 0;
  @type("boolean") isDestroyed: boolean = false;
  @type("string") targetId: string = "";
  @type("number") lastAttackTick: number = 0;
}

export class BattlePlayerState extends Schema {
  @type("string") userId: string = "";
  @type("string") username: string = "";
  @type("string") displayName: string = "";
  @type("number") level: number = 1;
  @type("number") trophies: number = 0;
  @type("boolean") isReady: boolean = false;
  @type("boolean") isBot: boolean = false;
  
  @type("number") currentElixir: number = 5;
  @type("number") maxElixir: number = 10;
  @type("number") elixirRegenRate: number = 2800;
  @type("number") lastElixirTick: number = 0;
  
  @type(["string"]) deck: ArraySchema<string> = new ArraySchema<string>();
  @type(["number"]) deckLevels: ArraySchema<number> = new ArraySchema<number>();
  @type(["string"]) cardsInHand: ArraySchema<string> = new ArraySchema<string>();
  @type("string") nextCard: string = "";
  @type("number") cardCycle: number = 0;
  
  @type("number") leftTowerHP: number = 1400;
  @type("number") rightTowerHP: number = 1400;
  @type("number") kingTowerHP: number = 2600;
  @type("number") towersDestroyed: number = 0;
  
  @type("number") cardsPlayed: number = 0;
  @type("number") elixirSpent: number = 0;
  @type("number") damageDealt: number = 0;
  @type("number") unitsDeployed: number = 0;
  
  @type("string") connectionStatus: string = "connected";
  @type("number") ping: number = 0;
  @type("boolean") hasSurrendered: boolean = false;
}

export class BattleRoomState extends Schema {
  @type("string") battleId: string = "";
  @type("string") matchId: string = "";
  @type("string") gameMode: string = "ranked";
  @type("string") battleType: string = "1v1";
  
  @type("string") phase: string = "preparing";
  @type("number") currentTick: number = 0;
  @type("number") battleDuration: number = 360000;
  @type("number") remainingTime: number = 360000;
  @type("number") elixirMultiplier: number = 1;
  
  @type(BattlePlayerState) player1: BattlePlayerState = new BattlePlayerState();
  @type(BattlePlayerState) player2: BattlePlayerState = new BattlePlayerState();
  
  @type({ map: BattleUnit }) units: MapSchema<BattleUnit> = new MapSchema<BattleUnit>();
  @type({ map: Tower }) towers: MapSchema<Tower> = new MapSchema<Tower>();
  
  @type("number") spectatorCount: number = 0;
  @type(["string"]) spectatorList: ArraySchema<string> = new ArraySchema<string>();
  
  @type("string") winner: string = "";
  @type("string") winCondition: string = "";
  @type("boolean") isFinished: boolean = false;
  
  @type("number") serverTick: number = 0;
  @type("number") tickRate: number = 20;
  @type("boolean") isPaused: boolean = false;
}

// === INTERFACES MESSAGES (GARDÉES) ===
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

interface PingMessage {
  timestamp: number;
}

// === NOUVEAU TICK SYSTEM ===

// Performance monitoring
interface ITickPerformance {
  targetTPS: number;
  actualTPS: number;
  ticksProcessed: number;
  averageTickTime: number;
  maxTickTime: number;
  lagSpikes: number;
  lastPerformanceUpdate: number;
}

// Élixir tracking précis
interface IElixirState {
  playerId: string;
  currentElixir: number;
  lastRegenTick: number;
  regenRate: number; // En ticks (56 ticks = 1 élixir en normal)
  nextRegenTick: number;
}

export class BattleRoom extends Room<BattleRoomState> {
  private logger!: ActionLoggerService;
  private battleSession!: IBattleSession;
  
  // === TICK SYSTEM CONSTANTS ===
  private readonly TICK_RATE_MS = 50;           // 20 TPS = 50ms per tick
  private readonly TARGET_TPS = 20;             // Clash Royale standard
  private readonly BATTLE_DURATION_TICKS = 7200; // 6 minutes × 60s × 20 TPS
  private readonly OVERTIME_DURATION_TICKS = 2400; // 2 minutes × 60s × 20 TPS
  private readonly ELIXIR_REGEN_TICKS = 56;     // 2.8s × 20 TPS = 56 ticks
  private readonly BROADCAST_INTERVAL = 4;      // State update tous les 4 ticks (5/sec)
  
  // === TICK SYSTEM STATE ===
  private gameLoopTimer: NodeJS.Timeout | null = null;
  private tickCount = 0;
  private gameStartTime = 0;
  private isTickProcessing = false;
  
  // === PERFORMANCE MONITORING ===
  private performance: ITickPerformance = {
    targetTPS: this.TARGET_TPS,
    actualTPS: 0,
    ticksProcessed: 0,
    averageTickTime: 0,
    maxTickTime: 0,
    lagSpikes: 0,
    lastPerformanceUpdate: 0
  };
  
  // === ELIXIR SYSTEM ===
  private elixirStates = new Map<string, IElixirState>();
  
  // === PAUSE/RESUME SYSTEM ===
  private pauseState = {
    isPaused: false,
    pauseStartTick: 0,
    totalPausedTicks: 0,
    pauseRequests: new Set<string>(),
    resumeVotes: new Set<string>()
  };
  
  // === CONFIGURATION ===
  private config = {
    maxSpectators: 10,
    reconnectTimeout: 30000,
    surrenderCooldown: 60000,
    pauseLimit: 3,
    maxBattleDuration: 480000, // 8 minutes max total
    performanceMonitoringInterval: 5000,
    lagThresholdMs: 100,
    maxConsecutiveLagSpikes: 5
  };
  
  private disconnectedPlayers = new Map<string, number>();
  
  // === COMBAT SYSTEM INTEGRATION ===
  private combatSystem = getCombatSystem();
  private targetingSystem = getTargetingSystem();
  private battleUnits = new Map<string, BaseUnit>();
  private battleTowers = new Map<string, BattleTower>();
  
  // === AUTH ET SETUP (GARDÉS) ===
  async onAuth(_client: Client, options: any, _request?: http.IncomingMessage) {
    try {
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
    
    console.log('⚔️ BattleRoom created with PRODUCTION tick system');
    
    this.maxClients = 2 + this.config.maxSpectators;
    this.autoDispose = true;
    
    this.state.battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    this.state.matchId = options.matchId || '';
    this.state.gameMode = options.gameMode || 'ranked';
    this.state.battleType = options.battleType || '1v1';
    this.state.phase = 'preparing';
    
    this.setupMessageHandlers();
    this.initializeTowers();
    this.startPerformanceMonitoring();
    
    await this.logger.log('system', 'battle_started', {
      battleId: this.state.battleId,
      matchId: this.state.matchId,
      gameMode: this.state.gameMode,
      roomId: this.roomId
    });
  }

  // === MESSAGE HANDLERS (GARDÉS MAIS INTÉGRÉS AU TICK SYSTEM) ===
  private setupMessageHandlers() {
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
    
    this.onMessage('ready', (client, message: ReadyMessage) => {
      this.handleReady(client, message);
    });
    
    this.onMessage('ping', (client, message: PingMessage) => {
      this.handlePing(client, message);
    });
    
    this.onMessage('pause_request', (client) => {
      this.handlePauseRequest(client);
    });
    
    this.onMessage('resume_vote', (client) => {
      this.handleResumeVote(client);
    });
  }

  // === NOUVEAU TICK SYSTEM PRINCIPAL ===
  
  /**
   * Démarrer la bataille avec tick system précis
   */
  private async startBattle() {
    console.log('🚀 Starting battle with 20 TPS tick system!');
    
    this.state.phase = 'countdown';
    
    // Créer BattleSession
    this.battleSession = await BattleSession.createBattle(
      this.getPlayerData(this.state.player1),
      this.getPlayerData(this.state.player2),
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
      this.gameStartTime = Date.now();
      this.tickCount = 0;
      
      // Initialiser l'élixir system
      this.initializeElixirSystem();
      
      // DÉMARRER LE TICK SYSTEM
      this.startPrecisionGameLoop();
      
      this.broadcast('battle_started', {
        battleId: this.state.battleId,
        startTime: this.gameStartTime
      });
      
      console.log('🎮 TICK SYSTEM STARTED - 20 TPS Production Ready');
    }, 3000);
  }

  /**
   * Démarrer le game loop avec timing précis
   */
  private startPrecisionGameLoop(): void {
    let lastTickTime = Date.now();
    let tickDrift = 0;
    
    const gameLoop = () => {
      if (this.state.phase !== 'battle' && this.state.phase !== 'overtime') {
        return;
      }
      
      const startTime = Date.now();
      const timeSinceLastTick = startTime - lastTickTime;
      
      // Compensation de dérive temporelle
      tickDrift += timeSinceLastTick - this.TICK_RATE_MS;
      
      // Traitement du tick
      if (!this.isTickProcessing) {
        this.processTick(startTime);
      }
      
      // Performance monitoring
      const tickProcessingTime = Date.now() - startTime;
      this.updatePerformanceMetrics(tickProcessingTime, timeSinceLastTick);
      
      // Calculer le délai pour le prochain tick avec compensation
      const nextTickDelay = Math.max(1, this.TICK_RATE_MS - tickDrift);
      tickDrift = Math.max(-this.TICK_RATE_MS, Math.min(this.TICK_RATE_MS, tickDrift));
      
      lastTickTime = startTime;
      this.gameLoopTimer = setTimeout(gameLoop, nextTickDelay);
    };
    
    // Premier tick
    this.gameLoopTimer = setTimeout(gameLoop, this.TICK_RATE_MS);
  }

  /**
   * Traitement principal d'un tick
   */
  private processTick(tickStartTime: number): void {
    if (this.pauseState.isPaused) {
      this.pauseState.totalPausedTicks++;
      return;
    }
    
    this.isTickProcessing = true;
    this.tickCount++;
    this.state.currentTick = this.tickCount;
    this.state.serverTick = tickStartTime;
    
    try {
      // 1. Mise à jour du temps de bataille
      this.updateBattleTime();
      
      // 2. Régénération d'élixir PRÉCISE
      this.updateElixirRegeneration();
      
      // 3. Mise à jour des unités
      this.updateUnits();
      
      // 4. Vérifier conditions de victoire
      this.checkVictoryConditions();
      
      // 5. Vérifier overtime
      this.checkOvertimeTransition();
      
      // 6. Broadcast state (optimisé - pas à chaque tick)
      if (this.tickCount % this.BROADCAST_INTERVAL === 0) {
        this.broadcastGameState();
      }
      
    } catch (error) {
      console.error('❌ Tick processing error:', error);
      this.performance.lagSpikes++;
    } finally {
      this.isTickProcessing = false;
      this.performance.ticksProcessed++;
    }
  }

  /**
   * Mise à jour précise du temps de bataille
   */
  private updateBattleTime(): void {
    const elapsedTicks = this.tickCount - this.pauseState.totalPausedTicks;
    const remainingTicks = this.BATTLE_DURATION_TICKS - elapsedTicks;
    
    this.state.remainingTime = Math.max(0, Math.round(remainingTicks * this.TICK_RATE_MS));
    
    // Overtime check
    if (this.state.phase === 'overtime') {
      const overtimeElapsed = elapsedTicks - this.BATTLE_DURATION_TICKS;
      const overtimeRemaining = this.OVERTIME_DURATION_TICKS - overtimeElapsed;
      this.state.remainingTime = Math.max(0, Math.round(overtimeRemaining * this.TICK_RATE_MS));
    }
  }

  /**
   * Système d'élixir EXACT comme Clash Royale
   */
  private initializeElixirSystem(): void {
    // Initialiser pour les deux joueurs
    [this.state.player1, this.state.player2].forEach(player => {
      const elixirState: IElixirState = {
        playerId: player.userId,
        currentElixir: 5, // Démarrage CR standard
        lastRegenTick: this.tickCount,
        regenRate: this.ELIXIR_REGEN_TICKS, // 56 ticks = 2.8s
        nextRegenTick: this.tickCount + this.ELIXIR_REGEN_TICKS
      };
      
      this.elixirStates.set(player.userId, elixirState);
      player.currentElixir = 5;
      player.lastElixirTick = this.tickCount;
    });
  }

  private updateElixirRegeneration(): void {
    this.elixirStates.forEach((elixirState, playerId) => {
      const player = playerId === this.state.player1.userId ? this.state.player1 : this.state.player2;
      
      // Vérifier si c'est le moment de régénérer
      if (this.tickCount >= elixirState.nextRegenTick && player.currentElixir < player.maxElixir) {
        // Régénérer 1 élixir
        player.currentElixir = Math.min(player.maxElixir, player.currentElixir + 1);
        elixirState.currentElixir = player.currentElixir;
        
        // Calculer le prochain tick de régénération
        const actualRegenRate = Math.round(elixirState.regenRate / this.state.elixirMultiplier);
        elixirState.nextRegenTick = this.tickCount + actualRegenRate;
        elixirState.lastRegenTick = this.tickCount;
        
        player.lastElixirTick = this.tickCount;
        
        // Log pour debug
        if (this.tickCount % 100 === 0) { // Log occasionnel
          console.log(`⚡ Elixir regen: Player ${playerId} -> ${player.currentElixir}/10 (next in ${actualRegenRate} ticks)`);
        }
      }
    });
  }

  /**
   * Transition vers overtime
   */
  private checkOvertimeTransition(): void {
    if (this.state.phase === 'battle' && this.state.remainingTime <= 0) {
      this.enterOvertime();
    } else if (this.state.phase === 'overtime' && this.state.remainingTime <= 0) {
      this.endBattleByTimeout();
    }
  }

  private enterOvertime(): void {
    console.log('⏰ ENTERING OVERTIME - 2x Elixir!');
    
    this.state.phase = 'overtime';
    this.state.elixirMultiplier = 2;
    this.state.remainingTime = this.OVERTIME_DURATION_TICKS * this.TICK_RATE_MS;
    
    // Mettre à jour les taux d'élixir pour tous les joueurs
    this.elixirStates.forEach((elixirState) => {
      const newRegenRate = Math.round(this.ELIXIR_REGEN_TICKS / 2); // Division par 2 pour doubler la vitesse
      elixirState.regenRate = newRegenRate;
      elixirState.nextRegenTick = this.tickCount + newRegenRate;
    });
    
    this.broadcast('overtime_started', {
      remainingTime: this.state.remainingTime,
      elixirMultiplier: this.state.elixirMultiplier,
      tick: this.tickCount
    });
  }

  /**
   * Performance monitoring système
   */
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.calculatePerformanceMetrics();
      this.checkPerformanceIssues();
    }, this.config.performanceMonitoringInterval);
  }

  private updatePerformanceMetrics(tickTime: number, _timeSinceLastTick: number): void {
    this.performance.maxTickTime = Math.max(this.performance.maxTickTime, tickTime);
    
    if (tickTime > this.config.lagThresholdMs) {
      this.performance.lagSpikes++;
    }
    
    // Moyenne mobile pour le temps de tick
    const alpha = 0.1; // Facteur de lissage
    this.performance.averageTickTime = this.performance.averageTickTime * (1 - alpha) + tickTime * alpha;
  }

  private calculatePerformanceMetrics(): void {
    const now = Date.now();
    const elapsed = now - this.performance.lastPerformanceUpdate;
    
    if (elapsed > 0) {
      const ticksInPeriod = this.performance.ticksProcessed;
      this.performance.actualTPS = Math.round((ticksInPeriod * 1000) / elapsed);
      
      // Reset compteurs
      this.performance.ticksProcessed = 0;
      this.performance.lastPerformanceUpdate = now;
      
      // Log performance occasionnel
      if (this.tickCount % 400 === 0) { // Toutes les 20 secondes
        console.log(`🎯 PERFORMANCE: ${this.performance.actualTPS}/${this.TARGET_TPS} TPS, avg: ${Math.round(this.performance.averageTickTime)}ms, lag spikes: ${this.performance.lagSpikes}`);
      }
    }
  }

  private checkPerformanceIssues(): void {
    // Détecter problèmes de performance
    if (this.performance.actualTPS < this.TARGET_TPS * 0.8) { // -20% du target
      console.warn(`⚠️ LOW TPS WARNING: ${this.performance.actualTPS}/${this.TARGET_TPS}`);
      
      // Mesures d'urgence si nécessaire
      if (this.performance.lagSpikes > this.config.maxConsecutiveLagSpikes) {
        console.error('🚨 CRITICAL LAG DETECTED - Implementing emergency measures');
        this.handleCriticalLag();
      }
    }
  }

  private handleCriticalLag(): void {
    // Mesures d'urgence en cas de lag critique
    console.log('🚨 Activating lag compensation measures...');
    
    // 1. Réduire la fréquence de broadcast
    // 2. Nettoyer les unités mortes immédiatement
    // 3. Limiter les calculs non-essentiels
    
    // Notifier les clients du lag
    this.broadcast('lag_warning', {
      actualTPS: this.performance.actualTPS,
      targetTPS: this.TARGET_TPS,
      tick: this.tickCount
    });
  }

  /**
   * Système de pause/resume
   */
  private handlePauseRequest(client: Client): void {
    const auth = client.auth;
    if (!auth || this.state.phase !== 'battle') return;
    
    this.pauseState.pauseRequests.add(auth.userId);
    
    // Si les deux joueurs demandent pause
    if (this.pauseState.pauseRequests.size >= 2) {
      this.pauseBattle();
    }
  }

  private handleResumeVote(client: Client): void {
    const auth = client.auth;
    if (!auth || !this.pauseState.isPaused) return;
    
    this.pauseState.resumeVotes.add(auth.userId);
    
    // Si les deux joueurs votent pour reprendre
    if (this.pauseState.resumeVotes.size >= 2) {
      this.resumeBattle();
    }
  }

  private pauseBattle(): void {
    if (this.pauseState.isPaused) return;
    
    this.pauseState.isPaused = true;
    this.pauseState.pauseStartTick = this.tickCount;
    this.state.isPaused = true;
    
    console.log(`⏸️ Battle PAUSED at tick ${this.tickCount}`);
    
    this.broadcast('battle_paused', {
      tick: this.tickCount,
      reason: 'player_request'
    });
  }

  private resumeBattle(): void {
    if (!this.pauseState.isPaused) return;
    
    this.pauseState.isPaused = false;
    this.pauseState.pauseRequests.clear();
    this.pauseState.resumeVotes.clear();
    this.state.isPaused = false;
    
    console.log(`▶️ Battle RESUMED at tick ${this.tickCount}`);
    
    this.broadcast('battle_resumed', {
      tick: this.tickCount,
      totalPausedTicks: this.pauseState.totalPausedTicks
    });
  }

  /**
   * Broadcast optimisé du state
   */
  private broadcastGameState(): void {
    // Broadcast state complet optimisé
    this.broadcast('game_tick', {
      tick: this.state.currentTick,
      remainingTime: this.state.remainingTime,
      phase: this.state.phase,
      elixirMultiplier: this.state.elixirMultiplier,
      performance: {
        actualTPS: this.performance.actualTPS,
        averageTickTime: Math.round(this.performance.averageTickTime)
      },
      players: {
        player1: {
          elixir: this.state.player1.currentElixir,
          leftTowerHP: this.state.player1.leftTowerHP,
          rightTowerHP: this.state.player1.rightTowerHP,
          kingTowerHP: this.state.player1.kingTowerHP
        },
        player2: {
          elixir: this.state.player2.currentElixir,
          leftTowerHP: this.state.player2.leftTowerHP,
          rightTowerHP: this.state.player2.rightTowerHP,
          kingTowerHP: this.state.player2.kingTowerHP
        }
      }
    });
  }

  // === MÉTHODES UTILITAIRES (GARDÉES) ===
  
  async onJoin(client: Client, _options: any, auth: any) {
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
    
    // Arrêter le tick system
    if (this.gameLoopTimer) {
      clearTimeout(this.gameLoopTimer);
      this.gameLoopTimer = null;
    }
    
    // Finaliser la bataille
    if (this.battleSession && !this.state.isFinished) {
      this.battleSession.finalizeBattle();
    }
    
    // Log final performance
    console.log('📊 Final Performance Stats:');
    console.log(`   Ticks processed: ${this.performance.ticksProcessed + this.tickCount}`);
    console.log(`   Average TPS: ${this.performance.actualTPS}`);
    console.log(`   Lag spikes: ${this.performance.lagSpikes}`);
    console.log(`   Total paused ticks: ${this.pauseState.totalPausedTicks}`);
    
    console.log('✅ BattleRoom disposed with tick system cleanup');
  }

  // === HANDLERS EXISTANTS (simplifiés avec tick system) ===
  
  private async handlePlayerJoin(client: Client, auth: any) {
    if (this.clients.filter(c => !c.auth?.isSpectator).length >= 2) {
      throw new ServerError(400, 'Battle room is full');
    }
    
    const collection = await PlayerCollection.findOne({ userId: auth.userId });
    if (!collection) {
      throw new ServerError(400, 'Player collection not found');
    }
    
    const isPlayer1 = this.clients.filter(c => !c.auth?.isSpectator).length === 0;
    const playerState = isPlayer1 ? this.state.player1 : this.state.player2;
    
    // Initialiser l'état du joueur
    playerState.userId = auth.userId;
    playerState.username = auth.username;
    playerState.displayName = auth.user.displayName;
    playerState.level = auth.user.level;
    playerState.trophies = auth.user.stats.currentTrophies;
    playerState.isBot = auth.user.username.includes('bot_') || false;
    
    // Charger le deck
    const deck = collection.getDeck();
    if (deck.length !== 8) {
      throw new ServerError(400, 'Invalid deck - must have 8 cards');
    }
    
    deck.forEach((slot: any) => {
      playerState.deck.push(slot.cardId);
      playerState.deckLevels.push(3); // Niveau par défaut
    });
    
    for (let i = 0; i < 4; i++) {
      playerState.cardsInHand.push(deck[i].cardId);
    }
    playerState.nextCard = deck[4].cardId;
    playerState.cardCycle = 4;
    
    client.userData = { playerNumber: isPlayer1 ? '1' : '2' };
    
    await this.logger.logBattle('battle_started', auth.userId, {
      battleId: this.state.battleId,
      isPlayer1,
      deck: playerState.deck,
      trophies: playerState.trophies
    });
    
    client.send('battle_joined', {
      battleId: this.state.battleId,
      playerNumber: isPlayer1 ? '1' : '2',
      phase: this.state.phase,
      deck: playerState.deck.slice(),
      cardsInHand: playerState.cardsInHand.slice()
    });
    
    console.log(`✅ Player ${playerState.username} joined as player${isPlayer1 ? '1' : '2'}`);
    await this.checkStartConditions();
  }

  private async handleSpectatorJoin(client: Client, auth: any) {
    if (this.state.spectatorCount >= this.config.maxSpectators) {
      throw new ServerError(400, 'Too many spectators');
    }
    
    this.state.spectatorCount++;
    this.state.spectatorList.push(auth.username);
    
    await this.logger.logNavigation('screen_viewed', auth.userId, {
      scene: 'battle_spectator',
      battleId: this.state.battleId
    });
    
    client.send('spectator_joined', {
      battleId: this.state.battleId,
      phase: this.state.phase,
      spectatorCount: this.state.spectatorCount
    });
  }

  private async handlePlayerLeave(client: Client, consented: boolean) {
    const playerNumber = client.userData?.playerNumber;
    if (!playerNumber) return;
    
    const playerState = playerNumber === '1' ? this.state.player1 : this.state.player2;
    
    if (consented || this.state.phase === 'finished') {
      console.log(`👋 Player ${playerState.username} left voluntarily`);
    } else {
      playerState.connectionStatus = 'disconnected';
      this.disconnectedPlayers.set(client.sessionId, Date.now());
      
      console.log(`🔌 Player ${playerState.username} disconnected unexpectedly`);
      
      setTimeout(() => {
        if (playerState.connectionStatus === 'disconnected') {
          this.handleSurrender(playerState.userId, 'disconnect_timeout');
        }
      }, this.config.reconnectTimeout);
    }
    
    await this.logger.logBattle('battle_ended', playerState.userId, {
      battleId: this.state.battleId,
      reason: consented ? 'voluntary_leave' : 'disconnect',
      duration: Date.now() - (this.battleSession?.startTime.getTime() || 0)
    });
  }

  private async handleSpectatorLeave(client: Client) {
    const auth = client.auth;
    if (!auth) return;
    
    this.state.spectatorCount = Math.max(0, this.state.spectatorCount - 1);
    
    const index = this.state.spectatorList.findIndex(name => name === auth.username);
    if (index !== -1) {
      this.state.spectatorList.deleteAt(index);
    }
  }

  // === HANDLERS DE GAMEPLAY INTÉGRÉS AU TICK SYSTEM ===

  private async handlePlaceCard(client: Client, message: PlaceCardMessage) {
    const playerNumber = client.userData?.playerNumber;
    if (!playerNumber || this.state.phase !== 'battle') return;
    
    const playerState = playerNumber === '1' ? this.state.player1 : this.state.player2;
    const { cardId, position, deckIndex } = message;
    
    if (!this.isValidPosition(position, playerNumber)) {
      client.send('action_error', { message: 'Invalid card placement position' });
      return;
    }
    
    if (!playerState.cardsInHand.includes(cardId)) {
      client.send('action_error', { message: 'Card not in hand' });
      return;
    }
    
    const elixirCost = this.getCardElixirCost(cardId);
    if (playerState.currentElixir < elixirCost) {
      client.send('action_error', { message: 'Not enough elixir' });
      return;
    }
    
    // Consommer l'élixir et mettre à jour le state d'élixir
    playerState.currentElixir -= elixirCost;
    playerState.elixirSpent += elixirCost;
    playerState.cardsPlayed++;
    
    // Mettre à jour l'état d'élixir dans le système
    const elixirState = this.elixirStates.get(playerState.userId);
    if (elixirState) {
      elixirState.currentElixir = playerState.currentElixir;
    }
    
    // Créer l'unité
    const unitId = `unit_${this.tickCount}_${Math.random().toString(36).substr(2, 4)}`;
    const unit = new BattleUnit();
    unit.id = unitId;
    unit.cardId = cardId;
    unit.ownerId = playerState.userId;
    unit.position.x = position.x;
    unit.position.y = position.y;
    unit.level = playerState.deckLevels[deckIndex] || 1;
    unit.lastActionTick = this.tickCount;
    
    const stats = this.getCardStats(cardId, unit.level);
    unit.hitpoints = stats.hitpoints;
    unit.maxHitpoints = stats.hitpoints;
    
    this.state.units.set(unitId, unit);
    playerState.unitsDeployed++;
    
    this.cycleCard(playerState);
    
    await this.logger.logBattle('card_played', playerState.userId, {
      battleId: this.state.battleId,
      cardId,
      position,
      elixirCost,
      tick: this.state.currentTick
    });
    
    this.broadcast('card_placed', {
      playerId: playerState.userId,
      cardId,
      position,
      unitId,
      tick: this.state.currentTick
    });
  }

  private async handleCastSpell(client: Client, message: CastSpellMessage) {
    const playerNumber = client.userData?.playerNumber;
    if (!playerNumber || this.state.phase !== 'battle') return;
    
    const playerState = playerNumber === '1' ? this.state.player1 : this.state.player2;
    const { spellId, position, targetId } = message;
    
    if (!playerState.cardsInHand.includes(spellId)) {
      client.send('action_error', { message: 'Spell not in hand' });
      return;
    }
    
    const elixirCost = this.getCardElixirCost(spellId);
    if (playerState.currentElixir < elixirCost) {
      client.send('action_error', { message: 'Not enough elixir' });
      return;
    }
    
    playerState.currentElixir -= elixirCost;
    playerState.elixirSpent += elixirCost;
    playerState.cardsPlayed++;
    
    // Mettre à jour l'état d'élixir
    const elixirState = this.elixirStates.get(playerState.userId);
    if (elixirState) {
      elixirState.currentElixir = playerState.currentElixir;
    }
    
    await this.applySpellEffect(spellId, position, targetId, playerState);
    this.cycleCard(playerState);
    
    await this.logger.logBattle('spell_cast', playerState.userId, {
      battleId: this.state.battleId,
      spellId,
      position,
      targetId,
      elixirCost,
      tick: this.state.currentTick
    });
    
    this.broadcast('spell_cast', {
      playerId: playerState.userId,
      spellId,
      position,
      targetId,
      tick: this.state.currentTick
    });
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
      serverTime: Date.now(),
      tick: this.tickCount
    });
  }

  private async handleEmote(client: Client, message: EmoteMessage) {
    const playerNumber = client.userData?.playerNumber;
    if (!playerNumber) return;
    
    const playerState = playerNumber === '1' ? this.state.player1 : this.state.player2;
    const { emoteId, position } = message;
    
    await this.logger.logBattle('emote_used', playerState.userId, {
      battleId: this.state.battleId,
      emoteId,
      position,
      tick: this.state.currentTick
    });
    
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
    
    // Vérifier le cooldown (en ticks)
    const surrenderCooldownTicks = (this.config.surrenderCooldown / this.TICK_RATE_MS);
    if (this.state.currentTick < surrenderCooldownTicks) {
      client.send('action_error', { message: 'Cannot surrender yet' });
      return;
    }
    
    await this.handleSurrender(playerState.userId, 'voluntary');
  }

  // === MÉTHODES DE BATAILLE INTÉGRÉES AU TICK SYSTEM ===

  private async checkStartConditions() {
    const player1Ready = this.state.player1.userId && this.state.player1.isReady;
    const player2Ready = this.state.player2.userId && this.state.player2.isReady;
    
    if (player1Ready && player2Ready && this.state.phase === 'preparing') {
      await this.startBattle();
    }
  }

  private updateUnits() {
    // Mise à jour de toutes les unités sur le terrain
    this.state.units.forEach((unit, unitId) => {
      this.updateUnitBehavior(unit);
      
      // Supprimer les unités mortes
      if (unit.hitpoints <= 0 && unit.state !== 'dying') {
        unit.state = 'dying';
        
        // Programmer la suppression après animation (0.5 seconde)
        setTimeout(() => {
          if (this.state.units.has(unitId)) {
            this.state.units.delete(unitId);
            this.broadcast('unit_destroyed', {
              unitId,
              tick: this.state.currentTick
            });
          }
        }, 500);
      }
    });
  }

  private updateUnitBehavior(unit: BattleUnit) {
    // Logique de base - avancement vers la tour ennemie
    if (unit.state === 'moving') {
      const isPlayer1Unit = unit.ownerId === this.state.player1.userId;
      const targetY = isPlayer1Unit ? 0 : 32;
      
      if (Math.abs(unit.position.y - targetY) > 1) {
        // Vitesse basée sur le tick system (mouvement précis)
        const moveSpeed = 0.025; // Vitesse par tick (ajustable selon la carte)
        unit.position.y += isPlayer1Unit ? -moveSpeed : moveSpeed;
        unit.lastActionTick = this.state.currentTick;
      }
    }
  }

  private checkVictoryConditions() {
    // Vérifier destruction tour du roi
    if (this.state.player1.kingTowerHP <= 0) {
      this.endBattle('2', 'towers');
      return;
    }
    if (this.state.player2.kingTowerHP <= 0) {
      this.endBattle('1', 'towers');
      return;
    }
  }

  private endBattleByTimeout() {
    const p1Towers = this.state.player1.towersDestroyed;
    const p2Towers = this.state.player2.towersDestroyed;
    
    if (p1Towers > p2Towers) {
      this.endBattle('1', 'towers');
    } else if (p2Towers > p1Towers) {
      this.endBattle('2', 'towers');
    } else {
      this.endBattle('draw', 'timeout');
    }
  }

  private async endBattle(winner: string, condition: string) {
    console.log(`🏁 Battle ended: ${winner} wins by ${condition} at tick ${this.tickCount}`);
    
    this.state.phase = 'finished';
    this.state.isFinished = true;
    this.state.winner = winner;
    this.state.winCondition = condition;
    
    // Arrêter le tick system
    if (this.gameLoopTimer) {
      clearTimeout(this.gameLoopTimer);
      this.gameLoopTimer = null;
    }
    
    // Finaliser la bataille
    if (this.battleSession) {
      await this.battleSession.finalizeBattle(winner === 'draw' ? undefined : winner);
    }
    
    await this.logger.logBattle('battle_ended', 'system', {
      battleId: this.state.battleId,
      winner,
      condition,
      totalTicks: this.tickCount,
      actualDuration: this.battleSession?.duration || 0,
      pausedTicks: this.pauseState.totalPausedTicks,
      finalTPS: this.performance.actualTPS
    });
    
    this.broadcast('battle_ended', {
      winner,
      winCondition: condition,
      totalTicks: this.tickCount,
      duration: this.battleSession?.duration || 0,
      performance: {
        actualTPS: this.performance.actualTPS,
        lagSpikes: this.performance.lagSpikes,
        pausedTicks: this.pauseState.totalPausedTicks
      },
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
    
    // Auto-dispose après 30 secondes
    setTimeout(() => {
      this.disconnect();
    }, 30000);
  }

  private async handleSurrender(userId: string, reason: string) {
    const playerState = userId === this.state.player1.userId ? this.state.player1 : this.state.player2;
    
    playerState.hasSurrendered = true;
    
    await this.logger.logBattle('battle_abandoned', userId, {
      battleId: this.state.battleId,
      reason,
      tick: this.state.currentTick
    });
    
    const winner = userId === this.state.player1.userId ? '2' : '1';
    await this.endBattle(winner, 'surrender');
  }

  // === MÉTHODES UTILITAIRES ===

  private async initializeTowers(): Promise<void> {
      console.log('🏰 Initializing battle towers with CombatSystem...');
      
      // Créer les vraies tours de combat
      const leftTower1 = BattleTower.create('player1_left', 'left', this.state.player1.userId, { x: 6, y: 28 }, 13);
      const rightTower1 = BattleTower.create('player1_right', 'right', this.state.player1.userId, { x: 12, y: 28 }, 13);
      const kingTower1 = BattleTower.create('player1_king', 'king', this.state.player1.userId, { x: 9, y: 30 }, 13);
      
      const leftTower2 = BattleTower.create('player2_left', 'left', this.state.player2.userId, { x: 6, y: 4 }, 13);
      const rightTower2 = BattleTower.create('player2_right', 'right', this.state.player2.userId, { x: 12, y: 4 }, 13);
      const kingTower2 = BattleTower.create('player2_king', 'king', this.state.player2.userId, { x: 9, y: 2 }, 13);
      
      // Stocker les vraies tours
      this.battleTowers.set('player1_left', leftTower1);
      this.battleTowers.set('player1_right', rightTower1);
      this.battleTowers.set('player1_king', kingTower1);
      this.battleTowers.set('player2_left', leftTower2);
      this.battleTowers.set('player2_right', rightTower2);
      this.battleTowers.set('player2_king', kingTower2);
      
      // Créer aussi les Schema pour Colyseus (synchronisation client)
      this.createTowerSchema('player1_left', 'left', this.state.player1.userId, { x: 6, y: 28 });
      this.createTowerSchema('player1_right', 'right', this.state.player1.userId, { x: 12, y: 28 });
      this.createTowerSchema('player1_king', 'king', this.state.player1.userId, { x: 9, y: 30 });
      this.createTowerSchema('player2_left', 'left', this.state.player2.userId, { x: 6, y: 4 });
      this.createTowerSchema('player2_right', 'right', this.state.player2.userId, { x: 12, y: 4 });
      this.createTowerSchema('player2_king', 'king', this.state.player2.userId, { x: 9, y: 2 });
      
      // Enregistrer dans le CombatSystem
      this.battleTowers.forEach(tower => {
        this.combatSystem.registerTower(tower.toCombatant());
      });
      
      console.log('✅ Battle towers initialized with CombatSystem');
    }
  
    private createTowerSchema(id: string, type: string, ownerId: string, position: { x: number; y: number }) {
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
    
    if (x < 0 || x >= 18 || y < 0 || y >= 32) return false;
    
    if (playerNumber === '1') {
      return y >= 16; // Joueur 1 - moitié du bas
    } else {
      return y <= 16; // Joueur 2 - moitié du haut
    }
  }

  private cycleCard(playerState: BattlePlayerState) {
    const playedCardIndex = playerState.cardsInHand.findIndex(card => 
      card === playerState.cardsInHand[0]
    );
    
    if (playedCardIndex !== -1) {
      playerState.cardsInHand.deleteAt(playedCardIndex);
    }
    
    playerState.cardsInHand.push(playerState.nextCard);
    
    playerState.cardCycle = (playerState.cardCycle + 1) % playerState.deck.length;
    const nextCardId = playerState.deck[playerState.cardCycle];
    if (nextCardId) {
      playerState.nextCard = nextCardId;
    }
  }

  private getCardElixirCost(cardId: string): number {
    const costs: Record<string, number> = {
      'knight': 3, 'archers': 3, 'goblins': 2, 'arrows': 3, 'fireball': 4, 'cannon': 3
    };
    return costs[cardId] || 3;
  }

  private getCardStats(cardId: string, level: number): { hitpoints: number; damage: number } {
    const baseStats: Record<string, { hitpoints: number; damage: number }> = {
      'knight': { hitpoints: 1400, damage: 167 },
      'archers': { hitpoints: 304, damage: 118 },
      'goblins': { hitpoints: 214, damage: 169 },
      'cannon': { hitpoints: 734, damage: 320 }
    };
    
    const base = baseStats[cardId] || { hitpoints: 100, damage: 50 };
    const multiplier = 1 + (level - 1) * 0.1;
    
    return {
      hitpoints: Math.round(base.hitpoints * multiplier),
      damage: Math.round(base.damage * multiplier)
    };
  }

  private async applySpellEffect(spellId: string, position: { x: number; y: number }, _targetId: string | undefined, caster: BattlePlayerState) {
    if (spellId === 'fireball') {
      const damage = this.getCardStats(spellId, 1).damage;
      const radius = 2.5;
      
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
      
      this.state.towers.forEach(tower => {
        const distance = Math.sqrt(
          Math.pow(tower.position.x - position.x, 2) + 
          Math.pow(tower.position.y - position.y, 2)
        );
        
        if (distance <= radius && tower.ownerId !== caster.userId) {
          const towerDamage = Math.round(damage * 0.4);
          tower.hitpoints = Math.max(0, tower.hitpoints - towerDamage);
          caster.damageDealt += Math.min(towerDamage, tower.hitpoints);
          
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

  private getPlayerData(playerState: BattlePlayerState) {
    return {
      userId: playerState.userId,
      username: playerState.username,
      displayName: playerState.displayName,
      level: playerState.level,
      trophies: playerState.trophies,
      deck: playerState.deck.slice(),
      deckLevels: playerState.deckLevels.slice()
    };
  }

  // === MÉTHODES PUBLIQUES POUR MONITORING ===

  getBattleStats() {
    return {
      battleId: this.state.battleId,
      phase: this.state.phase,
      currentTick: this.state.currentTick,
      remainingTime: this.state.remainingTime,
      tickSystem: {
        targetTPS: this.TARGET_TPS,
        actualTPS: this.performance.actualTPS,
        ticksProcessed: this.tickCount,
        averageTickTime: this.performance.averageTickTime,
        lagSpikes: this.performance.lagSpikes,
        pausedTicks: this.pauseState.totalPausedTicks
      },
      players: {
        player1: {
          username: this.state.player1.username,
          trophies: this.state.player1.trophies,
          elixir: this.state.player1.currentElixir,
          cardsPlayed: this.state.player1.cardsPlayed,
          connectionStatus: this.state.player1.connectionStatus
        },
        player2: {
          username: this.state.player2.username,
          trophies: this.state.player2.trophies,
          elixir: this.state.player2.currentElixir,
          cardsPlayed: this.state.player2.cardsPlayed,
          connectionStatus: this.state.player2.connectionStatus
        }
      },
      spectators: this.state.spectatorCount,
      units: this.state.units.size,
      totalClients: this.clients.length
    };
  }

  async forceBattleEnd(winner?: string) {
    if (this.state.isFinished) return false;
    
    await this.endBattle(winner || 'draw', 'forced');
    return true;
  }

  addBattleTime(seconds: number) {
    const additionalTicks = Math.round((seconds * 1000) / this.TICK_RATE_MS);
    this.state.remainingTime += seconds * 1000;
    
    this.broadcast('time_added', { 
      addedTime: seconds * 1000,
      addedTicks: additionalTicks,
      tick: this.tickCount
    });
  }
}
