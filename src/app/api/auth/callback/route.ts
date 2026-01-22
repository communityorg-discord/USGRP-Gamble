import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';

// Hardcoded credentials (same as citizen.usgrp.xyz)
const JWT_SECRET = 'x7K9mP4vQw2sL8nR3tY6uJ1fH5gC0bWa';
const DISCORD_CLIENT_ID = '1459400314372489246';
const DISCORD_CLIENT_SECRET = 'cVot7bjutcnVS9SAc-nI8ISD3T59LM-t';
const REDIRECT_URI = 'https://gamble.usgrp.xyz/api/auth/callback';
const BASE_URL = 'https://gamble.usgrp.xyz';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(`${BASE_URL}/login?error=discord_denied`);
    }

    if (!code) {
        return NextResponse.redirect(`${BASE_URL}/login?error=no_code`);
    }

    try {
        // Exchange code for tokens
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: DISCORD_CLIENT_ID,
                client_secret: DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI,
            }),
        });

        if (!tokenResponse.ok) {
            throw new Error('Failed to exchange code');
        }

        const tokens = await tokenResponse.json();

        // Get user info from Discord
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
            },
        });

        if (!userResponse.ok) {
            throw new Error('Failed to get user info');
        }

        const discordUser = await userResponse.json();

        // Create JWT token
        const secret = new TextEncoder().encode(JWT_SECRET);
        const token = await new jose.SignJWT({
            sub: discordUser.id,
            username: discordUser.username,
            discordId: discordUser.id,
            avatar: discordUser.avatar
                ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
                : null,
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .sign(secret);

        // Redirect to app with token (use hardcoded BASE_URL, not request.url)
        return NextResponse.redirect(`${BASE_URL}/auth/success?token=${token}`);
    } catch (error) {
        console.error('OAuth error:', error);
        return NextResponse.redirect(`${BASE_URL}/login?error=oauth_failed`);
    }
}

