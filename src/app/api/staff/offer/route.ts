// Force dynamic - uses request.headers
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { setStaffOffer, getStaffOffer, clearStaffOffer } from '@/lib/casino-store';

/**
 * POST /api/staff/offer - Send a custom offer to a player
 */
export async function POST(request: NextRequest) {
    try {
        const { playerId, offer, message } = await request.json();

        if (!playerId || !offer || offer <= 0) {
            return NextResponse.json({ error: 'Invalid offer' }, { status: 400 });
        }

        setStaffOffer(playerId, offer, message);

        return NextResponse.json({
            success: true,
            message: 'Offer sent',
            offer: {
                playerId,
                amount: offer,
                customMessage: message,
            },
        });

    } catch (error) {
        console.error('Offer API error:', error);
        return NextResponse.json({ error: 'Failed to send offer' }, { status: 500 });
    }
}

/**
 * GET /api/staff/offer - Check for pending offer (player polls this)
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
        return NextResponse.json({ error: 'Player ID required' }, { status: 400 });
    }

    const pendingOffer = getStaffOffer(playerId);

    if (pendingOffer) {
        // Clear the offer after fetching (one-time use)
        clearStaffOffer(playerId);
    }

    return NextResponse.json({
        hasPendingOffer: !!pendingOffer,
        offer: pendingOffer,
    });
}

