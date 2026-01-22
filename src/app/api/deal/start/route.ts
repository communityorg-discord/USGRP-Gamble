import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, deductBalance, getUserBalance, logGameRound } from '@/lib/economy';
import {
    generateRoundId,
    generateSignature,
    generateCaseValues,
    getCasesToOpen,
    DEAL_VALUES,
} from '@/lib/game-utils';
import { setActiveGame, findUserActiveGame, cleanupOldGames } from '@/lib/game-store';
import type { DealStartRequest, DealStartResponse, DealGameState, APIError } from '@/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse<DealStartResponse | APIError>> {
    try {
        // 1. Verify authentication
        const user = await verifyToken(request.headers.get('Authorization'));
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Check if user already has an active game
        const existingGame = findUserActiveGame(user.discordId);
        if (existingGame) {
            return NextResponse.json(
                { error: 'You already have an active game', code: 'ACTIVE_GAME_EXISTS' },
                { status: 400 }
            );
        }

        // 3. Parse request body
        const body: DealStartRequest = await request.json();
        const { buyIn, difficulty = 'standard', bankerPersonality = 'fair' } = body;

        // 4. Validate buy-in
        if (!buyIn || buyIn < 100 || buyIn > 100000) {
            return NextResponse.json(
                { error: 'Buy-in must be between 100 and 100,000' },
                { status: 400 }
            );
        }

        // 5. Validate difficulty
        if (!['casual', 'standard', 'highroller'].includes(difficulty)) {
            return NextResponse.json(
                { error: 'Invalid difficulty level' },
                { status: 400 }
            );
        }

        // 6. Validate banker personality
        if (!['conservative', 'fair', 'aggressive'].includes(bankerPersonality)) {
            return NextResponse.json(
                { error: 'Invalid banker personality' },
                { status: 400 }
            );
        }

        // 7. Check balance
        const balance = await getUserBalance(user.discordId);
        if (balance < buyIn) {
            return NextResponse.json(
                { error: 'Insufficient balance' },
                { status: 400 }
            );
        }

        // 8. Deduct buy-in
        const deductResult = await deductBalance(
            user.discordId,
            buyIn,
            `Deal or No Deal buy-in`,
            'pending'
        );

        if (!deductResult.success) {
            return NextResponse.json(
                { error: 'Failed to process buy-in' },
                { status: 400 }
            );
        }

        // 9. Generate game state
        const roundId = generateRoundId();
        const cases = generateCaseValues(difficulty);
        const caseCount = DEAL_VALUES[difficulty].length;
        const playerCase = Math.floor(Math.random() * caseCount) + 1;
        const casesToOpenThisRound = getCasesToOpen(difficulty, 0);

        const gameState: DealGameState = {
            roundId,
            userId: user.discordId,
            buyIn,
            difficulty,
            bankerPersonality,
            playerCase,
            cases,
            openedCases: [],
            currentRound: 0,
            casesToOpenThisRound,
            bankerOffer: null,
            gamePhase: 'opening',
            finalValue: null,
            acceptedOffer: null,
            balanceBefore: balance,
            createdAt: new Date().toISOString(),
        };

        // 10. Store game state
        setActiveGame(roundId, gameState);

        // Log game start
        await logGameRound({
            roundId,
            discordId: user.discordId,
            gameType: 'deal-or-no-deal',
            betAmount: buyIn,
            payout: 0, // TBD
            result: { phase: 'started', playerCase, difficulty, bankerPersonality },
            signature: generateSignature({ roundId, playerCase, cases }),
        });

        // Clean up old completed games
        cleanupOldGames(100);

        // 11. Build response (don't reveal case values!)
        const response: DealStartResponse = {
            roundId,
            difficulty,
            bankerPersonality,
            caseCount,
            playerCase,
            balanceBefore: balance,
            balanceAfter: deductResult.newBalance,
            casesToOpenThisRound,
            createdAt: gameState.createdAt,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Deal start error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

