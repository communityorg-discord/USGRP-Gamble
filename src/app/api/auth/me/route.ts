import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'usgrp-gambling-secret-key';
const ECONOMY_BOT_API = process.env.ECONOMY_BOT_API || 'http://localhost:3001';

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
