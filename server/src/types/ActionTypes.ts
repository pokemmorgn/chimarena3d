// src/types/ActionTypes.ts
// Étendre les types d'actions pour inclure les nouveaux types d'auth

import { ActionType as BaseActionType } from '../models/PlayerAction';

// Types d'actions étendus pour l'authentification
export type ExtendedActionType = BaseActionType | 
  'login_attempt' | 'login_success' | 'login_failed' | 
  'logout' | 'auth_expired' | 'world_join_requested' |
  'session_replaced' | 'token_refreshed';

// Helper pour vérifier si un type d'action est valide
export function isValidActionType(action: string): action is ExtendedActionType {
  const validActions: ExtendedActionType[] = [
    // Actions de base du matchmaking
    'queue_joined', 'queue_left', 'match_found', 'match_accepted', 'match_declined',
    'bot_matched', 'queue_timeout',
    
    // Actions de bataille  
    'battle_started', 'battle_ended', 'card_played', 'spell_cast', 'unit_deployed',
    'tower_destroyed', 'elixir_leaked', 'battle_abandoned', 'emote_used',
    
    // Actions de collection
    'card_upgraded', 'card_obtained', 'deck_changed', 'deck_created', 'active_deck_switched',
    
    // Actions d'économie
    'gold_earned', 'gold_spent', 'gems_earned', 'gems_spent', 'chest_opened',
    'shop_purchase', 'shop_refresh', 'quest_completed', 'reward_claimed',
    
    // Actions sociales
    'friend_added', 'clan_joined', 'clan_left', 'message_sent', 'replay_shared',
    
    // Actions de navigation/UI
    'screen_viewed', 'button_clicked', 'tutorial_step', 'settings_changed',
    'app_opened', 'app_closed', 'session_started', 'session_ended',
    
    // Actions de progression
    'level_up', 'achievement_unlocked', 'trophy_gained', 'trophy_lost',
    'arena_promoted', 'arena_demoted',
    
    // Actions d'authentification étendues
    'login_attempt', 'login_success', 'login_failed',
    'logout', 'auth_expired', 'world_join_requested',
    'session_replaced', 'token_refreshed'
  ];
  
  return validActions.includes(action as ExtendedActionType);
}

// Mapping des nouvelles actions vers les catégories existantes
export function getActionCategory(action: ExtendedActionType): string {
  const categoryMapping: Record<string, string> = {
    // Auth actions → navigation category (car c'est du flow utilisateur)
    'login_attempt': 'navigation',
    'login_success': 'navigation', 
    'login_failed': 'navigation',
    'logout': 'navigation',
    'auth_expired': 'system',
    'world_join_requested': 'navigation',
    'session_replaced': 'system',
    'token_refreshed': 'system',
    
    // Actions existantes
    'queue_joined': 'matchmaking',
    'match_found': 'matchmaking',
    'battle_started': 'battle',
    'card_played': 'battle',
    'card_upgraded': 'collection',
    'gold_earned': 'economy',
    'screen_viewed': 'navigation',
    'app_opened': 'navigation',
    'level_up': 'progression'
  };
  
  return categoryMapping[action] || 'system';
}

// Interface pour les données spécifiques à l'auth
export interface IAuthActionData {
  username?: string;
  reason?: string;
  tokenAge?: number;
  sessionDuration?: number;
  targetScene?: string;
  hasToken?: boolean;
  authMethod?: 'password' | 'refresh_token';
}
