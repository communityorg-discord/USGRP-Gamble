import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';

// Force dynamic - uses request.headers
export const dynamic = 'force-dynamic';

// Hardcoded credentials (same as citizen.usgrp.xyz)
const JWT_SECRET = 'x7K9mP4vQw2sL8nR3tY6uJ1fH5gC0bWa';
const ECONOMY_BOT_API = 'http://localhost:3001';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.substring(7);

        // Verify JWT
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jose.jwtVerify(token, secret);

        // Get balance from economy system
        // For now, return mock data until integrated
        const balance = 50000; // This would come from economy bot

        return NextResponse.json({
            user: {
                id: payload.sub,
                username: payload.username,
                discordId: payload.discordId,
                balance,
                avatar: payload.avatar,
            }
        });
    } catch (error) {
        console.error('Auth error:', error);
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
}
