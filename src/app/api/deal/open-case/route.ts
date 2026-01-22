import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/economy';
import { getActiveGame, setActiveGame } from '@/lib/game-store';
import type { DealOpenCaseRequest, DealOpenCaseResponse, APIError } from '@/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse<DealOpenCaseResponse | APIError>> {
    try {
        // 1. Verify authentication
        const user = await verifyToken(request.headers.get('Authorization'));
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse request body
        const body: DealOpenCaseRequest = await request.json();
        const { roundId, caseNumber } = body;

        if (!roundId || !caseNumber) {
            return NextResponse.json(
                { error: 'Missing roundId or caseNumber' },
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
        if (gameState.gamePhase !== 'opening') {
            return NextResponse.json(
                { error: `Cannot open cases in ${gameState.gamePhase} phase` },
                { status: 400 }
            );
        }

        // 6. Validate case number
        const totalCases = Object.keys(gameState.cases).length;
        if (caseNumber < 1 || caseNumber > totalCases) {
            return NextResponse.json(
                { error: 'Invalid case number' },
                { status: 400 }
            );
        }

        // 7. Check if case is already opened
        if (gameState.openedCases.includes(caseNumber)) {
            return NextResponse.json(
                { error: 'Case already opened' },
                { status: 400 }
            );
        }

        // 8. Check if trying to open player's case
        if (caseNumber === gameState.playerCase) {
            return NextResponse.json(
                { error: 'Cannot open your own case yet' },
                { status: 400 }
            );
        }

        // 9. Open the case
        gameState.openedCases.push(caseNumber);
        const revealedValue = gameState.cases[caseNumber];

        // 10. Calculate remaining cases to open this round
        const remainingCasesToOpen = gameState.casesToOpenThisRound -
            gameState.openedCases.filter((c: number) => c !== gameState.playerCase).length %
            (gameState.casesToOpenThisRound + 1);

        // Calculate how many cases opened this round
        const casesOpenedTotal = gameState.openedCases.length;
        let casesOpenedThisRound = 0;
        let casesSoFar = 0;

        // Import CASES_PER_ROUND logic
        const casesPerRound = gameState.difficulty === 'casual'
            ? [6, 3, 2, 1]
            : gameState.difficulty === 'standard'
                ? [6, 5, 4, 3, 2, 1]
                : [6, 5, 4, 3, 2, 1, 1, 1, 1];

        for (let round = 0; round <= gameState.currentRound; round++) {
            const casesForRound = casesPerRound[Math.min(round, casesPerRound.length - 1)];
            if (round === gameState.currentRound) {
                casesOpenedThisRound = casesOpenedTotal - casesSoFar;
            }
            casesSoFar += casesForRound;
        }

        const casesNeededThisRound = casesPerRound[Math.min(gameState.currentRound, casesPerRound.length - 1)];
        const actualRemaining = casesNeededThisRound - casesOpenedThisRound;
        const readyForOffer = actualRemaining <= 0;

        // 11. If ready for offer, update game phase
        if (readyForOffer) {
            gameState.gamePhase = 'offer';
        }

        // Update game state
        setActiveGame(roundId, gameState);

        // 12. Build response
        const response: DealOpenCaseResponse = {
            roundId,
            caseNumber,
            revealedValue,
            openedCases: gameState.openedCases,
            remainingCasesToOpen: Math.max(0, actualRemaining - 1),
            readyForOffer,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Open case error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
