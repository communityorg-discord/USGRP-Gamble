// Shared types for USGRP Casino games

// ============================================
// Common Types
// ============================================

export interface User {
    id: string;
    username: string;
    discordId: string;
    balance: number;
    avatar?: string;
}

export interface GameRound {
    roundId: string;
    userId: string;
    gameType: 'fishing' | 'deal';
    betAmount: number;
    payout: number;
    balanceBefore: number;
    balanceAfter: number;
    signature: string;
    createdAt: string;
    completedAt?: string;
}

// ============================================
// Fishing Frenzy Types
// ============================================

export interface FishingSymbol {
    id: number;
    name: string;
    emoji: string;
    multiplier: number;
    color: string;
    isWild?: boolean;
    isScatter?: boolean;
}

export interface FishingPayline {
    line: number;
    symbols: number[];
    multiplier: number;
}

export interface FishingSpinRequest {
    betAmount: number;
    turboMode?: boolean;
}

export interface FishingSpinResponse {
    roundId: string;
    resultSymbols: number[][]; // 3 reels x 3 visible symbols (symbol IDs)
    paylines: FishingPayline[];
    payout: number;
    balanceBefore: number;
    balanceAfter: number;
    signature: string;
    createdAt: string;
    turboMode: boolean;
}

export interface FishingReelState {
    symbols: number[];
    position: number;
    spinning: boolean;
    targetPosition: number;
}

// ============================================
// Deal or No Deal Types
// ============================================

export type DealDifficulty = 'casual' | 'standard' | 'highroller';
export type BankerPersonality = 'conservative' | 'fair' | 'aggressive';

export interface DealCase {
    caseNumber: number;
    value: number;
    isOpened: boolean;
    isPlayerCase: boolean;
}

export interface DealGameState {
    roundId: string;
    userId: string;
    buyIn: number;
    difficulty: DealDifficulty;
    bankerPersonality: BankerPersonality;
    playerCase: number;
    cases: Record<number, number>; // caseNumber -> value (hidden from client until revealed)
    openedCases: number[];
    currentRound: number;
    casesToOpenThisRound: number;
    bankerOffer: number | null;
    gamePhase: 'selecting' | 'opening' | 'offer' | 'decision' | 'completed';
    finalValue: number | null;
    acceptedOffer: number | null;
    balanceBefore: number;
    createdAt: string;
    completedAt?: string;
}

export interface DealStartRequest {
    buyIn: number;
    difficulty: DealDifficulty;
    bankerPersonality: BankerPersonality;
}

export interface DealStartResponse {
    roundId: string;
    difficulty: DealDifficulty;
    bankerPersonality: BankerPersonality;
    caseCount: number;
    playerCase: number;
    balanceBefore: number;
    balanceAfter: number;
    casesToOpenThisRound: number;
    createdAt: string;
}

export interface DealOpenCaseRequest {
    roundId: string;
    caseNumber: number;
}

export interface DealOpenCaseResponse {
    roundId: string;
    caseNumber: number;
    revealedValue: number;
    openedCases: number[];
    remainingCasesToOpen: number;
    readyForOffer: boolean;
}

export interface DealOfferRequest {
    roundId: string;
}

export interface DealOfferResponse {
    roundId: string;
    currentRound: number;
    bankerOffer: number;
    remainingValues: number[];
    expectedValue: number;
    offerPercentage: number; // offer as % of EV
}

export interface DealDecisionRequest {
    roundId: string;
    decision: 'deal' | 'no_deal' | 'open_case'; // open_case is for final case
}

export interface DealDecisionResponse {
    roundId: string;
    decision: 'deal' | 'no_deal' | 'open_case';
    gameComplete: boolean;
    // If deal accepted
    acceptedOffer?: number;
    playerCaseValue?: number;
    // If no deal and not final round
    casesToOpenNextRound?: number;
    // If game complete
    finalPayout?: number;
    balanceAfter?: number;
}

export interface DealStateResponse {
    roundId: string;
    gamePhase: DealGameState['gamePhase'];
    playerCase: number;
    openedCases: { caseNumber: number; value: number }[];
    remainingCaseNumbers: number[];
    currentRound: number;
    casesToOpenThisRound: number;
    bankerOffer: number | null;
    buyIn: number;
    difficulty: DealDifficulty;
    bankerPersonality: BankerPersonality;
}

// ============================================
// API Error Response
// ============================================

export interface APIError {
    error: string;
    code?: string;
}
