import { createHmac, randomBytes, randomUUID } from 'crypto';

// ============================================
// Cryptographically Secure RNG
// ============================================

/**
 * Generate a cryptographically secure random number between 0 and max (exclusive)
 */
export function secureRandomInt(max: number): number {
    const bytes = randomBytes(4);
    const value = bytes.readUInt32BE(0);
    return value % max;
}

/**
 * Generate a cryptographically secure random float between 0 and 1
 */
export function secureRandomFloat(): number {
    const bytes = randomBytes(4);
    const value = bytes.readUInt32BE(0);
    return value / 0xFFFFFFFF;
}

/**
 * Shuffle an array using Fisher-Yates with secure random
 */
export function secureShuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = secureRandomInt(i + 1);
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

// ============================================
// Round ID and Signature Generation
// ============================================

/**
 * Generate a unique round ID
 */
export function generateRoundId(): string {
    return randomUUID();
}

/**
 * Generate HMAC signature for round verification
 */
export function generateSignature(data: object): string {
    const secret = process.env.JWT_SECRET || 'usgrp-gambling-secret-key';
    const payload = JSON.stringify(data);
    return createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Verify round signature
 */
export function verifySignature(data: object, signature: string): boolean {
    const expected = generateSignature(data);
    return expected === signature;
}

// ============================================
// Animation Timing Helpers
// ============================================

/**
 * Generate random timing within a range (for realistic reel animation)
 */
export function randomInRange(min: number, max: number): number {
    return min + secureRandomFloat() * (max - min);
}

/**
 * EaseOutQuint easing function for smooth deceleration
 */
export function easeOutQuint(t: number): number {
    return 1 - Math.pow(1 - t, 5);
}

/**
 * Spring settle function for reel bounce
 */
export function springSettle(t: number, damping: number = 0.5): number {
    return 1 - Math.exp(-t * 6) * Math.cos(t * 10 * damping);
}

// ============================================
// Fishing Frenzy Helpers
// ============================================

// Fishing symbols with their properties
export const FISHING_SYMBOLS = [
    { id: 0, name: 'Seaweed', emoji: '🌿', multiplier: 0, color: '#22c55e', isWild: false },
    { id: 1, name: 'Starfish', emoji: '⭐', multiplier: 2, color: '#fbbf24', isWild: false },
    { id: 2, name: 'Shell', emoji: '🐚', multiplier: 3, color: '#f472b6', isWild: false },
    { id: 3, name: 'Crab', emoji: '🦀', multiplier: 4, color: '#ef4444', isWild: false },
    { id: 4, name: 'Fish', emoji: '🐟', multiplier: 5, color: '#3b82f6', isWild: false },
    { id: 5, name: 'Tropical Fish', emoji: '🐠', multiplier: 8, color: '#f97316', isWild: false },
    { id: 6, name: 'Dolphin', emoji: '🐬', multiplier: 12, color: '#06b6d4', isWild: false },
    { id: 7, name: 'Shark', emoji: '🦈', multiplier: 20, color: '#6366f1', isWild: false },
    { id: 8, name: 'Treasure', emoji: '💎', multiplier: 50, color: '#8b5cf6', isWild: false },
    { id: 9, name: 'Golden Fish', emoji: '🐡', multiplier: 0, color: '#ffd700', isWild: true }, // Wild
];

/**
 * Generate random reel strip with weighted probabilities
 */
export function generateReelStrip(length: number = 30): number[] {
    // Weights for each symbol (lower = rarer)
    const weights = [20, 18, 16, 14, 12, 8, 5, 3, 1, 2]; // Wild (9) is rare but not rarest
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    const strip: number[] = [];
    for (let i = 0; i < length; i++) {
        let random = secureRandomFloat() * totalWeight;
        let symbolId = 0;
        for (let j = 0; j < weights.length; j++) {
            random -= weights[j];
            if (random <= 0) {
                symbolId = j;
                break;
            }
        }
        strip.push(symbolId);
    }
    return strip;
}

/**
 * Generate the visible 3x3 grid result for fishing slots
 */
export function generateFishingResult(): number[][] {
    // Generate 3 reels, each with 3 visible symbols
    return [
        generateReelStrip(3),
        generateReelStrip(3),
        generateReelStrip(3),
    ];
}

/**
 * Calculate paylines and payouts for fishing result
 * Paylines: horizontal rows (3 lines for 3x3 grid)
 */
export function calculateFishingPayout(resultSymbols: number[][], betAmount: number): {
    paylines: { line: number; symbols: number[]; multiplier: number }[];
    totalPayout: number;
} {
    const paylines: { line: number; symbols: number[]; multiplier: number }[] = [];
    let totalPayout = 0;

    // Check each row (3 rows)
    for (let row = 0; row < 3; row++) {
        const rowSymbols = [
            resultSymbols[0][row],
            resultSymbols[1][row],
            resultSymbols[2][row],
        ];

        // Count matches (wilds count as matching)
        const wildId = 9;
        const nonWildSymbols = rowSymbols.filter(s => s !== wildId);

        if (nonWildSymbols.length === 0) {
            // All wilds - big win!
            const multiplier = 100;
            paylines.push({ line: row, symbols: rowSymbols, multiplier });
            totalPayout += betAmount * multiplier;
        } else {
            // Check if all non-wild symbols match
            const firstNonWild = nonWildSymbols[0];
            const allMatch = nonWildSymbols.every(s => s === firstNonWild);

            if (allMatch) {
                const symbol = FISHING_SYMBOLS[firstNonWild];
                if (symbol.multiplier > 0) {
                    // Wild multiplier bonus
                    const wildCount = rowSymbols.filter(s => s === wildId).length;
                    const wildBonus = wildCount > 0 ? 1 + (wildCount * 0.5) : 1;
                    const multiplier = symbol.multiplier * wildBonus;

                    paylines.push({ line: row, symbols: rowSymbols, multiplier });
                    totalPayout += betAmount * multiplier;
                }
            }
        }
    }

    return { paylines, totalPayout: Math.floor(totalPayout) };
}

// ============================================
// Deal or No Deal Helpers
// ============================================

// Case values by difficulty
export const DEAL_VALUES = {
    casual: [
        0.01, 1, 5, 10, 25, 50,
        75, 100, 200, 300, 400, 500,
    ],
    standard: [
        0.01, 1, 5, 10, 25, 50,
        75, 100, 200, 300, 400, 500,
        750, 1000, 2500, 5000, 7500, 10000,
    ],
    highroller: [
        0.01, 1, 5, 10, 25, 50,
        75, 100, 200, 300, 400, 500,
        750, 1000, 2500, 5000, 7500, 10000,
        25000, 50000, 75000, 100000, 200000, 500000,
        750000, 1000000,
    ],
};

// Cases to open per round by difficulty
export const CASES_PER_ROUND = {
    casual: [6, 3, 2, 1],
    standard: [6, 5, 4, 3, 2, 1],
    highroller: [6, 5, 4, 3, 2, 1, 1, 1, 1],
};

// Banker personality affects offer percentage of expected value
export const BANKER_EV_RANGE = {
    conservative: { min: 0.75, max: 0.85 },
    fair: { min: 0.85, max: 0.95 },
    aggressive: { min: 0.90, max: 1.05 },
};

/**
 * Generate shuffled case values for a game
 */
export function generateCaseValues(difficulty: 'casual' | 'standard' | 'highroller'): Record<number, number> {
    const values = [...DEAL_VALUES[difficulty]];
    const shuffled = secureShuffleArray(values);

    const cases: Record<number, number> = {};
    shuffled.forEach((value, index) => {
        cases[index + 1] = value;
    });

    return cases;
}

/**
 * Calculate expected value of remaining cases
 */
export function calculateExpectedValue(
    cases: Record<number, number>,
    openedCases: number[]
): number {
    const remainingValues = Object.entries(cases)
        .filter(([caseNum]) => !openedCases.includes(parseInt(caseNum)))
        .map(([, value]) => value);

    if (remainingValues.length === 0) return 0;

    return remainingValues.reduce((a, b) => a + b, 0) / remainingValues.length;
}

/**
 * Calculate banker offer based on EV and personality
 */
export function calculateBankerOffer(
    cases: Record<number, number>,
    openedCases: number[],
    personality: 'conservative' | 'fair' | 'aggressive',
    round: number,
    totalRounds: number
): number {
    const ev = calculateExpectedValue(cases, openedCases);
    const range = BANKER_EV_RANGE[personality];

    // Offer percentage increases as game progresses
    const progressFactor = round / totalRounds;
    const basePercentage = range.min + (range.max - range.min) * progressFactor;

    // Add some randomness
    const variance = 0.05;
    const randomFactor = basePercentage + (secureRandomFloat() - 0.5) * variance;

    return Math.floor(ev * randomFactor);
}

/**
 * Get number of cases to open this round
 */
export function getCasesToOpen(
    difficulty: 'casual' | 'standard' | 'highroller',
    round: number
): number {
    const schedule = CASES_PER_ROUND[difficulty];
    return schedule[Math.min(round, schedule.length - 1)];
}

/**
 * Get total number of rounds for difficulty
 */
export function getTotalRounds(difficulty: 'casual' | 'standard' | 'highroller'): number {
    return CASES_PER_ROUND[difficulty].length;
}
