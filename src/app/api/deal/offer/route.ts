import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/economy';
import { calculateBankerOffer, calculateExpectedValue, getTotalRounds } from '@/lib/game-utils';
import { getActiveGame, setActiveGame } from '@/lib/game-store';
import type { DealOfferRequest, DealOfferResponse, APIError } from '@/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse<DealOfferResponse | APIError>> {
    try {
        // 1. Verify authentication
        const user = await verifyToken(request.headers.get('Authorization'));
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse request body
        const body: DealOfferRequest = await request.json();
        const { roundId } = body;

        if (!roundId) {
            return NextResponse.json(
                { error: 'Missing roundId' },
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
        if (gameState.gamePhase !== 'offer') {
            return NextResponse.json(
                { error: `Cannot get offer in ${gameState.gamePhase} phase` },
                { status: 400 }
            );
        }

        // 6. Calculate expected value and banker offer
        const expectedValue = calculateExpectedValue(gameState.cases, gameState.openedCases);
        const totalRounds = getTotalRounds(gameState.difficulty);

        // Scale the offer by buyIn ratio (values are relative to buyIn)
        const scaleFactor = gameState.buyIn / 1000; // Base values assume 1000 buyIn
        const scaledCases: Record<number, number> = {};
        for (const [key, value] of Object.entries(gameState.cases)) {
            scaledCases[parseInt(key)] = (value as number) * scaleFactor;
        }

        const bankerOffer = calculateBankerOffer(
            scaledCases,
            gameState.openedCases,
            gameState.bankerPersonality,
            gameState.currentRound,
            totalRounds
        );

        // 7. Get remaining values for display
        const remainingValues = Object.entries(gameState.cases)
            .filter(([caseNum]) =>
                !gameState.openedCases.includes(parseInt(caseNum)) &&
                parseInt(caseNum) !== gameState.playerCase
            )
            .map(([, value]) => (value as number) * scaleFactor)
            .sort((a, b) => a - b);

        // Add player's case value (unknown to player, but we track it)
        remainingValues.push(gameState.cases[gameState.playerCase] * scaleFactor);
        remainingValues.sort((a, b) => a - b);

        // 8. Store the offer
        gameState.bankerOffer = bankerOffer;
        gameState.gamePhase = 'decision';
        setActiveGame(roundId, gameState);

        // 9. Calculate offer as percentage of EV
        const scaledEV = expectedValue * scaleFactor;
        const offerPercentage = scaledEV > 0 ? (bankerOffer / scaledEV) * 100 : 0;

        // 10. Build response
        const response: DealOfferResponse = {
            roundId,
            currentRound: gameState.currentRound + 1, // 1-indexed for display
            bankerOffer: Math.floor(bankerOffer),
            remainingValues: remainingValues.map(v => Math.floor(v)),
            expectedValue: Math.floor(scaledEV),
            offerPercentage: Math.round(offerPercentage),
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Banker offer error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
