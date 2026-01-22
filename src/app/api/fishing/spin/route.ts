import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, processGameTransaction, logGameRound } from '@/lib/economy';
import { generateRoundId, generateSignature, secureRandomInt, secureRandomFloat } from '@/lib/game-utils';

// Force dynamic - uses request.headers
export const dynamic = 'force-dynamic';
const SYMBOLS = {
    CARD_10: 0, CARD_J: 1, CARD_Q: 2, CARD_K: 3, CARD_A: 4,
    TACKLE_BOX: 5, LIFEBUOY: 6, FISHING_ROD: 7, PELICAN: 8,
    FISH_BLUE: 9, FISH_ORANGE: 10, FISH_PUFFER: 11, SHARK: 12, WHALE: 13,
    WILD: 14, SCATTER: 15
};

// Symbol multipliers for 5-of-a-kind
const SYMBOL_MULTIPLIERS: Record<number, number> = {
    [SYMBOLS.CARD_10]: 5,
    [SYMBOLS.CARD_J]: 8,
    [SYMBOLS.CARD_Q]: 10,
    [SYMBOLS.CARD_K]: 12,
    [SYMBOLS.CARD_A]: 15,
    [SYMBOLS.TACKLE_BOX]: 50,
    [SYMBOLS.LIFEBUOY]: 80,
    [SYMBOLS.FISHING_ROD]: 120,
    [SYMBOLS.PELICAN]: 200,
};

// Fish cash value multipliers (applied when Fisherman reels them in)
const FISH_CASH_MULTIPLIERS = [2, 5, 10, 15, 20, 25, 50, 100];

// Symbol weights for random generation
const SYMBOL_WEIGHTS = [
    15, 15, 15, 15, 15, // Cards
    10, 10, 8, 6,        // Gear
    8, 6, 4, 2, 1,       // Fish
    2, 3,                // Wild, Scatter
];
const TOTAL_WEIGHT = SYMBOL_WEIGHTS.reduce((a, b) => a + b, 0);

// 10 paylines for 5x3 grid (left-to-right combinations)
const PAYLINES = [
    [1, 1, 1, 1, 1], // Middle row
    [0, 0, 0, 0, 0], // Top row
    [2, 2, 2, 2, 2], // Bottom row
    [0, 1, 2, 1, 0], // V shape
    [2, 1, 0, 1, 2], // Inverted V
    [0, 0, 1, 2, 2], // Diagonal down
    [2, 2, 1, 0, 0], // Diagonal up
    [1, 0, 0, 0, 1], // Top flat
    [1, 2, 2, 2, 1], // Bottom flat
    [0, 1, 1, 1, 0], // U shape
];

// In-memory free spins state (would use Redis in production)
const freeSpinsState = new Map<string, {
    remaining: number;
    totalWin: number;
    startedAt: number;
}>();

function generateSymbol(): number {
    let random = secureRandomFloat() * TOTAL_WEIGHT;
    for (let i = 0; i < SYMBOL_WEIGHTS.length; i++) {
        random -= SYMBOL_WEIGHTS[i];
        if (random <= 0) return i;
    }
    return 0;
}

function generateGrid(): number[][] {
    // Generate 5 reels x 3 rows
    return Array(5).fill(null).map(() =>
        Array(3).fill(null).map(() => generateSymbol())
    );
}

function assignFishCashValues(grid: number[][]): Record<string, number> {
    const values: Record<string, number> = {};
    for (let reel = 0; reel < 5; reel++) {
        for (let row = 0; row < 3; row++) {
            const symbol = grid[reel][row];
            // Fish symbols (9-13) get cash values
            if (symbol >= SYMBOLS.FISH_BLUE && symbol <= SYMBOLS.WHALE) {
                const valueIndex = secureRandomInt(FISH_CASH_MULTIPLIERS.length);
                values[`${reel}-${row}`] = FISH_CASH_MULTIPLIERS[valueIndex];
            }
        }
    }
    return values;
}

function countScatters(grid: number[][]): number {
    let count = 0;
    for (let reel = 0; reel < 5; reel++) {
        for (let row = 0; row < 3; row++) {
            if (grid[reel][row] === SYMBOLS.SCATTER) count++;
        }
    }
    return count;
}

function hasWildOnGrid(grid: number[][]): boolean {
    for (let reel = 0; reel < 5; reel++) {
        for (let row = 0; row < 3; row++) {
            if (grid[reel][row] === SYMBOLS.WILD) return true;
        }
    }
    return false;
}

function calculateFishermanBonus(grid: number[][], fishCashValues: Record<string, number>, betAmount: number): number {
    if (!hasWildOnGrid(grid)) return 0;

    let bonus = 0;
    for (const [key, multiplier] of Object.entries(fishCashValues)) {
        bonus += betAmount * multiplier;
    }
    return bonus;
}

function calculatePaylinePayout(
    grid: number[][],
    betAmount: number
): { paylines: { line: number; symbols: number[]; multiplier: number; count: number }[]; totalPayout: number } {
    const paylines: { line: number; symbols: number[]; multiplier: number; count: number }[] = [];
    let totalPayout = 0;

    for (let lineIndex = 0; lineIndex < PAYLINES.length; lineIndex++) {
        const payline = PAYLINES[lineIndex];
        const lineSymbols = payline.map((row, reel) => grid[reel][row]);

        // Find first non-wild symbol
        let baseSymbol = -1;
        for (const sym of lineSymbols) {
            if (sym !== SYMBOLS.WILD && sym !== SYMBOLS.SCATTER) {
                baseSymbol = sym;
                break;
            }
        }

        if (baseSymbol === -1) {
            // All wilds - big win!
            const allWilds = lineSymbols.every(s => s === SYMBOLS.WILD);
            if (allWilds) {
                const multiplier = 1000;
                paylines.push({ line: lineIndex, symbols: lineSymbols, multiplier, count: 5 });
                totalPayout += betAmount * multiplier;
            }
            continue;
        }

        // Count matching symbols from left (Wild substitutes)
        let matchCount = 0;
        for (const sym of lineSymbols) {
            if (sym === baseSymbol || sym === SYMBOLS.WILD) {
                matchCount++;
            } else {
                break;
            }
        }

        // Need at least 3 matching for a win
        if (matchCount >= 3) {
            const baseMultiplier = SYMBOL_MULTIPLIERS[baseSymbol] || 0;
            if (baseMultiplier > 0) {
                // Scale multiplier based on match count (3=0.2x, 4=0.5x, 5=1x)
                const countScale = matchCount === 3 ? 0.2 : matchCount === 4 ? 0.5 : 1;
                const multiplier = baseMultiplier * countScale;
                paylines.push({ line: lineIndex, symbols: lineSymbols, multiplier, count: matchCount });
                totalPayout += betAmount * multiplier;
            }
        }
    }

    return { paylines, totalPayout: Math.floor(totalPayout) };
}

export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('Authorization');
    const user = await verifyToken(authHeader);

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { betAmount = 100, turboMode = false } = body;

        // Validate bet
        if (betAmount < 10 || betAmount > 100000) {
            return NextResponse.json({ error: 'Invalid bet amount' }, { status: 400 });
        }

        const roundId = generateRoundId();

        // Check for active free spins
        const freeSpins = freeSpinsState.get(user.discordId);
        const isFreeSpin = freeSpins && freeSpins.remaining > 0;

        // Only deduct balance if not a free spin
        let balanceAfter = 0;
        if (!isFreeSpin) {
            const transaction = await processGameTransaction(
                user.discordId,
                betAmount,
                0, // Will add payout later
                'fishing_frenzy',
                roundId
            );

            if (!transaction.success) {
                return NextResponse.json({ error: transaction.error }, { status: 400 });
            }
            balanceAfter = transaction.balanceAfter;
        }

        // Generate result
        const resultSymbols = generateGrid();
        const fishCashValues = assignFishCashValues(resultSymbols);
        const scatterCount = countScatters(resultSymbols);

        // Calculate payouts
        const { paylines, totalPayout: linePayout } = calculatePaylinePayout(resultSymbols, betAmount);
        const fishermanBonus = calculateFishermanBonus(resultSymbols, fishCashValues, betAmount);
        let totalPayout = linePayout + fishermanBonus;

        // Handle scatter bonus (free spins)
        let freeSpinsAwarded = 0;
        if (scatterCount >= 3) {
            freeSpinsAwarded = scatterCount === 3 ? 10 : scatterCount === 4 ? 15 : 20;

            const existingSpins = freeSpinsState.get(user.discordId);
            freeSpinsState.set(user.discordId, {
                remaining: (existingSpins?.remaining || 0) + freeSpinsAwarded,
                totalWin: existingSpins?.totalWin || 0,
                startedAt: existingSpins?.startedAt || Date.now(),
            });
        }

        // Update free spins state
        if (isFreeSpin && freeSpins) {
            freeSpins.remaining--;
            freeSpins.totalWin += totalPayout;

            if (freeSpins.remaining <= 0) {
                // Free spins ended, add total win to balance
                const bonusWin = freeSpins.totalWin;
                freeSpinsState.delete(user.discordId);
                totalPayout = bonusWin;
            }
        }

        // Credit winnings
        if (totalPayout > 0 && !isFreeSpin) {
            const creditResult = await processGameTransaction(
                user.discordId,
                0,
                totalPayout,
                'fishing_frenzy_win',
                roundId
            );
            balanceAfter = creditResult.balanceAfter;
        }

        // Generate signature
        const signature = generateSignature({
            roundId,
            resultSymbols,
            payout: totalPayout,
            timestamp: Date.now(),
        });

        // Log for audit
        await logGameRound({
            roundId,
            discordId: user.discordId,
            gameType: 'fishing_frenzy',
            betAmount: isFreeSpin ? 0 : betAmount,
            payout: totalPayout,
            result: {
                symbols: resultSymbols,
                fishCashValues,
                paylines,
                fishermanBonus,
                scatterCount,
                freeSpinsAwarded,
                isFreeSpin,
            },
            signature,
        });

        const currentFreeSpins = freeSpinsState.get(user.discordId);

        return NextResponse.json({
            roundId,
            resultSymbols,
            fishCashValues,
            paylines,
            payout: totalPayout,
            linePayout,
            fishermanBonus,
            balanceAfter,
            signature,
            scatterCount,
            freeSpinsAwarded,
            freeSpinsRemaining: currentFreeSpins?.remaining || 0,
            isFreeSpin,
        });

    } catch (error) {
        console.error('Spin error:', error);
        return NextResponse.json({ error: 'Spin failed' }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        symbols: Object.keys(SYMBOLS),
        paylines: PAYLINES.length,
        fishCashMultipliers: FISH_CASH_MULTIPLIERS,
        features: ['10 paylines', 'Fisherman Wild', 'Scatter Free Spins', 'Fish Cash Values'],
    });
}
