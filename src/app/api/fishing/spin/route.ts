import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, processGameTransaction, logGameRound, getUserBalance } from '@/lib/economy';
import {
    generateRoundId,
    generateSignature,
    generateFishingResult,
    calculateFishingPayout,
    FISHING_SYMBOLS,
} from '@/lib/game-utils';
import type { FishingSpinRequest, FishingSpinResponse, APIError } from '@/lib/types';

// In-memory store for round deduplication (in production, use Redis)
const processedRounds = new Map<string, FishingSpinResponse>();

export async function POST(request: NextRequest): Promise<NextResponse<FishingSpinResponse | APIError>> {
    try {
        // 1. Verify authentication
        const user = await verifyToken(request.headers.get('Authorization'));
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse request body
        const body: FishingSpinRequest = await request.json();
        const { betAmount, turboMode = false } = body;

        // 3. Validate bet amount
        if (!betAmount || betAmount < 10 || betAmount > 10000) {
            return NextResponse.json(
                { error: 'Bet amount must be between 10 and 10,000' },
                { status: 400 }
            );
        }

        // 4. Check balance
        const balance = await getUserBalance(user.discordId);
        if (balance < betAmount) {
            return NextResponse.json(
                { error: 'Insufficient balance' },
                { status: 400 }
            );
        }

        // 5. Generate round ID and result BEFORE any transactions
        const roundId = generateRoundId();
        const resultSymbols = generateFishingResult();
        const { paylines, totalPayout } = calculateFishingPayout(resultSymbols, betAmount);

        // 6. Process the transaction atomically
        const transaction = await processGameTransaction(
            user.discordId,
            betAmount,
            totalPayout,
            'fishing-frenzy',
            roundId
        );

        if (!transaction.success) {
            return NextResponse.json(
                { error: transaction.error || 'Transaction failed' },
                { status: 400 }
            );
        }

        // 7. Build response
        const response: FishingSpinResponse = {
            roundId,
            resultSymbols,
            paylines,
            payout: totalPayout,
            balanceBefore: transaction.balanceBefore,
            balanceAfter: transaction.balanceAfter,
            signature: generateSignature({
                roundId,
                resultSymbols,
                payout: totalPayout,
                userId: user.discordId,
            }),
            createdAt: new Date().toISOString(),
            turboMode,
        };

        // 8. Store for deduplication and log for audit
        processedRounds.set(roundId, response);

        await logGameRound({
            roundId,
            discordId: user.discordId,
            gameType: 'fishing-frenzy',
            betAmount,
            payout: totalPayout,
            result: { resultSymbols, paylines },
            signature: response.signature,
        });

        // Clean up old rounds (keep last 1000)
        if (processedRounds.size > 1000) {
            const oldestKey = processedRounds.keys().next().value;
            if (oldestKey) processedRounds.delete(oldestKey);
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Fishing spin error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET endpoint to retrieve symbol information for paytable
export async function GET(): Promise<NextResponse> {
    return NextResponse.json({
        symbols: FISHING_SYMBOLS,
        paylines: [
            { line: 0, description: 'Top row' },
            { line: 1, description: 'Middle row' },
            { line: 2, description: 'Bottom row' },
        ],
        betLimits: { min: 10, max: 10000 },
        rtp: 0.96, // 96% RTP
    });
}
