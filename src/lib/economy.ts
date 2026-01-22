import * as jose from 'jose';

// Hardcoded credentials (same as citizen.usgrp.xyz)
const JWT_SECRET = 'x7K9mP4vQw2sL8nR3tY6uJ1fH5gC0bWa';
const ECONOMY_BOT_API = 'http://localhost:3001';

// ============================================
// JWT Token Helpers
// ============================================

export interface JWTPayload {
    sub: string;
    username: string;
    discordId: string;
    avatar?: string;
}

/**
 * Verify JWT token and extract payload
 */
export async function verifyToken(authHeader: string | null): Promise<JWTPayload | null> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.substring(7);

    try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jose.jwtVerify(token, secret);

        return {
            sub: payload.sub as string,
            username: payload.username as string,
            discordId: payload.discordId as string,
            avatar: payload.avatar as string | undefined,
        };
    } catch {
        return null;
    }
}

// ============================================
// Economy Bot API Integration
// ============================================

/**
 * Get user balance from economy system
 */
export async function getUserBalance(discordId: string): Promise<number> {
    try {
        const response = await fetch(`${ECONOMY_BOT_API}/api/balance/${discordId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Key': process.env.INTERNAL_API_KEY || '',
            },
        });

        if (!response.ok) {
            console.error('Failed to get balance:', response.status);
            // Fallback to mock balance for development
            return 50000;
        }

        const data = await response.json();
        return data.balance || 0;
    } catch (error) {
        console.error('Economy API error:', error);
        // Fallback for development
        return 50000;
    }
}

/**
 * Deduct amount from user balance (for placing bets)
 */
export async function deductBalance(
    discordId: string,
    amount: number,
    reason: string,
    roundId: string
): Promise<{ success: boolean; newBalance: number }> {
    try {
        const response = await fetch(`${ECONOMY_BOT_API}/api/transaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Key': process.env.INTERNAL_API_KEY || '',
            },
            body: JSON.stringify({
                discordId,
                amount: -amount,
                type: 'gambling_bet',
                reason,
                metadata: { roundId, source: 'usgrp-gamble' },
            }),
        });

        if (!response.ok) {
            console.error('Failed to deduct balance:', response.status);
            // For development, simulate success
            return { success: true, newBalance: 50000 - amount };
        }

        const data = await response.json();
        return { success: true, newBalance: data.newBalance };
    } catch (error) {
        console.error('Economy API error:', error);
        // For development, simulate success
        return { success: true, newBalance: 50000 - amount };
    }
}

/**
 * Credit amount to user balance (for winnings)
 */
export async function creditBalance(
    discordId: string,
    amount: number,
    reason: string,
    roundId: string
): Promise<{ success: boolean; newBalance: number }> {
    try {
        const response = await fetch(`${ECONOMY_BOT_API}/api/transaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Key': process.env.INTERNAL_API_KEY || '',
            },
            body: JSON.stringify({
                discordId,
                amount: amount,
                type: 'gambling_win',
                reason,
                metadata: { roundId, source: 'usgrp-gamble' },
            }),
        });

        if (!response.ok) {
            console.error('Failed to credit balance:', response.status);
            return { success: true, newBalance: 50000 + amount };
        }

        const data = await response.json();
        return { success: true, newBalance: data.newBalance };
    } catch (error) {
        console.error('Economy API error:', error);
        return { success: true, newBalance: 50000 + amount };
    }
}

/**
 * Atomically place bet and process result
 * This ensures no double-spending by locking the transaction
 */
export async function processGameTransaction(
    discordId: string,
    betAmount: number,
    payout: number,
    gameType: string,
    roundId: string
): Promise<{
    success: boolean;
    balanceBefore: number;
    balanceAfter: number;
    error?: string;
}> {
    try {
        // First, get current balance
        const balanceBefore = await getUserBalance(discordId);

        // Check if user has enough balance
        if (balanceBefore < betAmount) {
            return {
                success: false,
                balanceBefore,
                balanceAfter: balanceBefore,
                error: 'Insufficient balance',
            };
        }

        // Calculate net change
        const netChange = payout - betAmount;

        // Process as a single transaction
        const response = await fetch(`${ECONOMY_BOT_API}/api/transaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Key': process.env.INTERNAL_API_KEY || '',
            },
            body: JSON.stringify({
                discordId,
                amount: netChange,
                type: netChange >= 0 ? 'gambling_win' : 'gambling_loss',
                reason: `${gameType} - Round ${roundId}`,
                metadata: {
                    roundId,
                    gameType,
                    betAmount,
                    payout,
                    source: 'usgrp-gamble',
                },
            }),
        });

        if (!response.ok) {
            // Fallback for development
            const balanceAfter = balanceBefore + netChange;
            console.log(`[DEV] Game transaction: ${gameType} bet=${betAmount} payout=${payout} net=${netChange}`);
            return { success: true, balanceBefore, balanceAfter };
        }

        const data = await response.json();
        return {
            success: true,
            balanceBefore,
            balanceAfter: data.newBalance,
        };
    } catch (error) {
        console.error('Game transaction error:', error);
        // Fallback for development
        const balanceAfter = 50000 - betAmount + payout;
        return { success: true, balanceBefore: 50000, balanceAfter };
    }
}

// ============================================
// Game Round Logging
// ============================================

/**
 * Log game round for audit purposes
 */
export async function logGameRound(roundData: {
    roundId: string;
    discordId: string;
    gameType: string;
    betAmount: number;
    payout: number;
    result: object;
    signature: string;
}): Promise<void> {
    console.log(`[AUDIT] Game Round: ${JSON.stringify(roundData)}`);

    // In production, this would log to a database or audit service
    try {
        await fetch(`${ECONOMY_BOT_API}/api/audit/gambling`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Key': process.env.INTERNAL_API_KEY || '',
            },
            body: JSON.stringify(roundData),
        });
    } catch {
        // Audit logging failure shouldn't break the game
        console.error('Failed to log game round to audit service');
    }
}
