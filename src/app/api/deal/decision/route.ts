// Force dynamic - uses request.headers
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, creditBalance, logGameRound } from '@/lib/economy';
import { generateSignature, getCasesToOpen } from '@/lib/game-utils';
import { getActiveGame, setActiveGame } from '@/lib/game-store';
import { removeActivePlayer } from '@/lib/casino-store';
import type { DealDecisionRequest, DealDecisionResponse, APIError } from '@/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse<DealDecisionResponse | APIError>> {
    try {
        // 1. Verify authentication
        const user = await verifyToken(request.headers.get('Authorization'));
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse request body
        let body: DealDecisionRequest;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: 'Invalid or missing JSON body' },
                { status: 400 }
            );
        }
        const { roundId, decision } = body;

        if (!roundId || !decision) {
            return NextResponse.json(
                { error: 'Missing roundId or decision' },
                { status: 400 }
            );
        }

        if (!['deal', 'no_deal', 'open_case'].includes(decision)) {
            return NextResponse.json(
                { error: 'Invalid decision' },
                { status: 400 }
            );
        }

        // 3. Get game state
        const gameState = getActiveGame(roundId);
        if (!gameState) {
            return NextResponse.json(
                { error: 'Game not found' },
                { status: 404 }
            );
        }

        // 4. Verify game belongs to user
        if (gameState.userId !== user.discordId) {
            return NextResponse.json(
                { error: 'Not your game' },
                { status: 403 }
            );
        }

        // 5. Check game phase
        if (gameState.gamePhase !== 'decision') {
            return NextResponse.json(
                { error: `Cannot make decision in ${gameState.gamePhase} phase` },
                { status: 400 }
            );
        }

        // Calculate scale factor
        const scaleFactor = gameState.buyIn / 1000;
        const playerCaseValue = Math.floor(gameState.cases[gameState.playerCase] * scaleFactor);

        // 6. Handle decision
        if (decision === 'deal') {
            // Accept the banker's offer
            const acceptedOffer = gameState.bankerOffer!;

            // Credit the winnings
            const creditResult = await creditBalance(
                user.discordId,
                acceptedOffer,
                `Deal or No Deal - Accepted offer`,
                roundId
            );

            // Update game state
            gameState.acceptedOffer = acceptedOffer;
            gameState.finalValue = playerCaseValue;
            gameState.gamePhase = 'completed';
            gameState.completedAt = new Date().toISOString();
            setActiveGame(roundId, gameState);
            
            // Remove from active players
            removeActivePlayer(user.discordId);

            // Log completion
            await logGameRound({
                roundId,
                discordId: user.discordId,
                gameType: 'deal-or-no-deal',
                betAmount: gameState.buyIn,
                payout: acceptedOffer,
                result: {
                    decision: 'deal',
                    acceptedOffer,
                    playerCaseValue,
                    profit: acceptedOffer - gameState.buyIn,
                },
                signature: generateSignature({ roundId, decision, acceptedOffer, playerCaseValue }),
            });

            return NextResponse.json({
                roundId,
                decision: 'deal',
                gameComplete: true,
                acceptedOffer,
                playerCaseValue,
                finalPayout: acceptedOffer,
                balanceAfter: creditResult.newBalance,
            });
        } else if (decision === 'no_deal') {
            // Check if this is the final round (only 2 cases left including player's)
            const remainingCases = Object.keys(gameState.cases).length - gameState.openedCases.length;

            if (remainingCases <= 2) {
                // Final round - must open case next
                gameState.gamePhase = 'decision';
                setActiveGame(roundId, gameState);

                return NextResponse.json({
                    roundId,
                    decision: 'no_deal',
                    gameComplete: false,
                    casesToOpenNextRound: 0, // Signal final choice
                });
            }

            // Continue to next round
            gameState.currentRound++;
            gameState.casesToOpenThisRound = getCasesToOpen(gameState.difficulty, gameState.currentRound);
            gameState.bankerOffer = null;
            gameState.gamePhase = 'opening';
            setActiveGame(roundId, gameState);

            return NextResponse.json({
                roundId,
                decision: 'no_deal',
                gameComplete: false,
                casesToOpenNextRound: gameState.casesToOpenThisRound,
            });
        } else if (decision === 'open_case') {
            // Final decision - open player's case

            // Credit the player's case value
            const creditResult = await creditBalance(
                user.discordId,
                playerCaseValue,
                `Deal or No Deal - Opened case`,
                roundId
            );

            // Update game state
            gameState.finalValue = playerCaseValue;
            gameState.gamePhase = 'completed';
            gameState.completedAt = new Date().toISOString();
            setActiveGame(roundId, gameState);
            
            // Remove from active players
            removeActivePlayer(user.discordId);

            // Log completion
            await logGameRound({
                roundId,
                discordId: user.discordId,
                gameType: 'deal-or-no-deal',
                betAmount: gameState.buyIn,
                payout: playerCaseValue,
                result: {
                    decision: 'open_case',
                    playerCaseValue,
                    lastOffer: gameState.bankerOffer,
                    profit: playerCaseValue - gameState.buyIn,
                },
                signature: generateSignature({ roundId, decision, playerCaseValue }),
            });

            return NextResponse.json({
                roundId,
                decision: 'open_case',
                gameComplete: true,
                playerCaseValue,
                finalPayout: playerCaseValue,
                balanceAfter: creditResult.newBalance,
            });
        }

        return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
    } catch (error) {
        console.error('Decision error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

