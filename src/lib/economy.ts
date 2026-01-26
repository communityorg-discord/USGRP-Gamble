import * as jose from 'jose';

// Hardcoded credentials (same as citizen.usgrp.xyz)
const JWT_SECRET = 'x7K9mP4vQw2sL8nR3tY6uJ1fH5gC0bWa';
const ECONOMY_BOT_API = 'http://localhost:3320';
const ECONOMY_API_KEY = 'citizen-portal-key';

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
// Gamble Wallet API Integration
// ============================================

export interface WalletInfo {
    gambleBalance: number;
    bankBalance: number;
    stats: {
        totalDeposited: number;
        totalWithdrawn: number;
        totalWagered: number;
        totalWon: number;
    };
}

/**
 * Get user's gamble wallet and bank balance
 */
export async function getWalletInfo(discordId: string): Promise<WalletInfo> {
    try {
        const response = await fetch(`${ECONOMY_BOT_API}/api/gamble/balance/${discordId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': ECONOMY_API_KEY,
            },
        });

        if (!response.ok) {
            console.error('Failed to get wallet info:', response.status);
            return { gambleBalance: 0, bankBalance: 0, stats: { totalDeposited: 0, totalWithdrawn: 0, totalWagered: 0, totalWon: 0 } };
        }

        const data = await response.json();
        return {
            gambleBalance: data.gambleBalance || 0,
            bankBalance: data.bankBalance || 0,
            stats: data.stats || { totalDeposited: 0, totalWithdrawn: 0, totalWagered: 0, totalWon: 0 },
        };
    } catch (error) {
        console.error('Economy API error:', error);
        return { gambleBalance: 0, bankBalance: 0, stats: { totalDeposited: 0, totalWithdrawn: 0, totalWagered: 0, totalWon: 0 } };
    }
}

/**
 * Get user's gamble balance (for games)
 */
export async function getUserBalance(discordId: string): Promise<number> {
    const wallet = await getWalletInfo(discordId);
    return wallet.gambleBalance;
}

/**
 * Deposit from bank to gamble wallet
 */
export async function depositToGamble(
    discordId: string,
    amount: number
): Promise<{ success: boolean; newGambleBalance: number; newBankBalance: number; error?: string }> {
    try {
        const response = await fetch(`${ECONOMY_BOT_API}/api/gamble/deposit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': ECONOMY_API_KEY,
            },
            body: JSON.stringify({ discordId, amount }),
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, newGambleBalance: 0, newBankBalance: 0, error: data.error };
        }

        return {
            success: true,
            newGambleBalance: data.newGambleBalance,
            newBankBalance: data.newBankBalance,
        };
    } catch (error) {
        console.error('Deposit error:', error);
        return { success: false, newGambleBalance: 0, newBankBalance: 0, error: 'Network error' };
    }
}

/**
 * Withdraw from gamble wallet to bank
 */
export async function withdrawFromGamble(
    discordId: string,
    amount: number
): Promise<{ success: boolean; newGambleBalance: number; newBankBalance: number; error?: string }> {
    try {
        const response = await fetch(`${ECONOMY_BOT_API}/api/gamble/withdraw`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': ECONOMY_API_KEY,
            },
            body: JSON.stringify({ discordId, amount }),
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, newGambleBalance: 0, newBankBalance: 0, error: data.error };
        }

        return {
            success: true,
            newGambleBalance: data.newGambleBalance,
            newBankBalance: data.newBankBalance,
        };
    } catch (error) {
        console.error('Withdraw error:', error);
        return { success: false, newGambleBalance: 0, newBankBalance: 0, error: 'Network error' };
    }
}

/**
 * Deduct amount from gamble wallet (for placing bets)
 */
export async function deductBalance(
    discordId: string,
    amount: number,
    reason: string,
    roundId: string
): Promise<{ success: boolean; newBalance: number }> {
    try {
        const response = await fetch(`${ECONOMY_BOT_API}/api/gamble/transaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': ECONOMY_API_KEY,
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
            const err = await response.json();
            console.error('Failed to deduct balance:', err.error);
            return { success: false, newBalance: 0 };
        }

        const data = await response.json();
        return { success: true, newBalance: data.newBalance };
    } catch (error) {
        console.error('Economy API error:', error);
        return { success: false, newBalance: 0 };
    }
}

/**
 * Credit amount to gamble wallet (for winnings)
 */
export async function creditBalance(
    discordId: string,
    amount: number,
    reason: string,
    roundId: string
): Promise<{ success: boolean; newBalance: number }> {
    try {
        const response = await fetch(`${ECONOMY_BOT_API}/api/gamble/transaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': ECONOMY_API_KEY,
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
            return { success: false, newBalance: 0 };
        }

        const data = await response.json();
        return { success: true, newBalance: data.newBalance };
    } catch (error) {
        console.error('Economy API error:', error);
        return { success: false, newBalance: 0 };
    }
}

/**
 * Atomically place bet and process result using gamble wallet
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
        // First, get current gamble balance
        const balanceBefore = await getUserBalance(discordId);

        // Check if user has enough balance
        if (balanceBefore < betAmount) {
            return {
                success: false,
                balanceBefore,
                balanceAfter: balanceBefore,
                error: 'Insufficient balance. Please deposit funds first.',
            };
        }

        // Calculate net change
        const netChange = payout - betAmount;

        // Process as a single transaction
        const response = await fetch(`${ECONOMY_BOT_API}/api/gamble/transaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': ECONOMY_API_KEY,
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
            const err = await response.json();
            return {
                success: false,
                balanceBefore,
                balanceAfter: balanceBefore,
                error: err.error || 'Transaction failed',
            };
        }

        const data = await response.json();
        return {
            success: true,
            balanceBefore,
            balanceAfter: data.newBalance,
        };
    } catch (error) {
        console.error('Game transaction error:', error);
        return {
            success: false,
            balanceBefore: 0,
            balanceAfter: 0,
            error: 'Network error',
        };
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

    try {
        await fetch(`${ECONOMY_BOT_API}/api/audit/gambling`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': ECONOMY_API_KEY,
            },
            body: JSON.stringify(roundData),
        });
    } catch {
        console.error('Failed to log game round to audit service');
    }
}
