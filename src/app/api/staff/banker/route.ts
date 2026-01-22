// Force dynamic - uses request.headers
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
    startRealBankerSession,
    endRealBankerSession,
    getRealBankerSession,
    STAFF_CODE
} from '@/lib/casino-store';

/**
 * POST /api/staff/banker - Start or end a Real Banker session
 */
export async function POST(request: NextRequest) {
    try {
        const { action, playerId, gameType, staffCode } = await request.json();

        if (!playerId) {
            return NextResponse.json({ error: 'Player ID required' }, { status: 400 });
        }

        if (action === 'start') {
            // For now, use a simple staff ID - in production would use proper auth
            const staffId = 'staff_' + Date.now();
            const staffName = 'Staff Member';

            startRealBankerSession(playerId, staffId, staffName, gameType || 'deal-or-no-deal');

            return NextResponse.json({
                success: true,
                message: 'Real Banker session started',
                session: {
                    playerId,
                    staffId,
                    staffName,
                    gameType,
                },
            });
        }

        if (action === 'end') {
            endRealBankerSession(playerId);

            return NextResponse.json({
                success: true,
                message: 'Real Banker session ended',
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Banker API error:', error);
        return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
    }
}

/**
 * GET /api/staff/banker - Check if player has a Real Banker session
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
        return NextResponse.json({ error: 'Player ID required' }, { status: 400 });
    }

    const session = getRealBankerSession(playerId);

    return NextResponse.json({
        hasRealBanker: !!session,
        session,
    });
}

