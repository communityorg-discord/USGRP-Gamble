// Force dynamic - uses request.headers
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getActivePlayers, getAllRealBankerSessions } from '@/lib/casino-store';

/**
 * GET /api/staff/players - Get active players and banker sessions
 */
export async function GET() {
    const players = getActivePlayers();
    const bankerSessions = getAllRealBankerSessions();

    return NextResponse.json({
        players,
        bankerSessions,
    });
}

