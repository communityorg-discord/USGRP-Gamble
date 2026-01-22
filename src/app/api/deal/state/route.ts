import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/economy';
import { getActiveGame, findUserActiveGame } from '@/lib/game-store';
import type { DealStateResponse, APIError } from '@/lib/types';

export async function GET(request: NextRequest): Promise<NextResponse<DealStateResponse | APIError>> {
    try {
        // 1. Verify authentication
        const user = await verifyToken(request.headers.get('Authorization'));
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Get roundId from query params
        const { searchParams } = new URL(request.url);
        const roundId = searchParams.get('roundId');

        if (!roundId) {
            // If no roundId, find user's active game
            const activeGame = findUserActiveGame(user.discordId);
            if (activeGame) {
                const [id, game] = activeGame;
                const scaleFactor = game.buyIn / 1000;

                return NextResponse.json({
                    roundId: id,
                    gamePhase: game.gamePhase,
                    playerCase: game.playerCase,
                    openedCases: game.openedCases.map((caseNum: number) => ({
                        caseNumber: caseNum,
                        value: Math.floor(game.cases[caseNum] * scaleFactor),
                    })),
                    remainingCaseNumbers: Object.keys(game.cases)
                        .map(Number)
                        .filter(n => !game.openedCases.includes(n) && n !== game.playerCase),
                    currentRound: game.currentRound + 1,
                    casesToOpenThisRound: game.casesToOpenThisRound,
                    bankerOffer: game.bankerOffer,
                    buyIn: game.buyIn,
                    difficulty: game.difficulty,
                    bankerPersonality: game.bankerPersonality,
                });
            }

            return NextResponse.json(
                { error: 'No active game found' },
                { status: 404 }
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

        // 5. Calculate scale factor
        const scaleFactor = gameState.buyIn / 1000;

        // 6. Build response
        const response: DealStateResponse = {
            roundId,
            gamePhase: gameState.gamePhase,
            playerCase: gameState.playerCase,
            openedCases: gameState.openedCases.map((caseNum: number) => ({
                caseNumber: caseNum,
                value: Math.floor(gameState.cases[caseNum] * scaleFactor),
            })),
            remainingCaseNumbers: Object.keys(gameState.cases)
                .map(Number)
                .filter(n => !gameState.openedCases.includes(n) && n !== gameState.playerCase),
            currentRound: gameState.currentRound + 1, // 1-indexed for display
            casesToOpenThisRound: gameState.casesToOpenThisRound,
            bankerOffer: gameState.bankerOffer,
            buyIn: gameState.buyIn,
            difficulty: gameState.difficulty,
            bankerPersonality: gameState.bankerPersonality,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Get state error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
