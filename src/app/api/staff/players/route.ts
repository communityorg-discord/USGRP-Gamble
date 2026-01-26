// Force dynamic - uses request.headers
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getActivePlayers, getAllRealBankerSessions } from '@/lib/casino-store';
import { getActiveGames } from '@/lib/game-store';

/**
 * GET /api/staff/players - Get active players and banker sessions
 */
export async function GET() {
    const players = getActivePlayers();
    const bankerSessions = getAllRealBankerSessions();
    
    // Get active games and enrich player data
    const activeGames = getActiveGames();
    
    // Add game info to players
    const enrichedPlayers = players.map(player => {
        const game = activeGames.find(g => g.userId === player.discordId);
        return {
            ...player,
            activeGame: game ? {
                roundId: game.roundId,
                gameType: 'deal-or-no-deal',
                phase: game.gamePhase,
                buyIn: game.buyIn,
            } : null,
        };
    });

    return NextResponse.json({
        players: enrichedPlayers,
        bankerSessions,
        activeGameCount: activeGames.length,
    });
}
