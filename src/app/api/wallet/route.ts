import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserBalance, deductBalance, creditBalance } from '@/lib/economy';
import { getCasinoChips, setCasinoChips } from '@/lib/casino-store';

// Force dynamic - uses request.headers
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('Authorization');
    const user = await verifyToken(authHeader);

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chips = getCasinoChips(user.discordId);
    const mainBalance = await getUserBalance(user.discordId);

    return NextResponse.json({
        chips,
        mainBalance,
        discordId: user.discordId,
    });
}

/**
 * POST /api/wallet - Deposit or withdraw
 * Body: { action: 'deposit' | 'withdraw', amount: number }
 */
export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('Authorization');
    const user = await verifyToken(authHeader);

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { action, amount } = await request.json();

        if (!action || !amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const currentChips = getCasinoChips(user.discordId);
        const mainBalance = await getUserBalance(user.discordId);

        if (action === 'deposit') {
            // Transfer from main balance to casino chips
            if (mainBalance < amount) {
                return NextResponse.json({ error: 'Insufficient main balance' }, { status: 400 });
            }

            // Deduct from main economy
            const roundId = `deposit_${Date.now()}`;
            const deductResult = await deductBalance(user.discordId, amount, 'casino_deposit', roundId);
            if (!deductResult.success) {
                return NextResponse.json({ error: 'Deposit failed' }, { status: 400 });
            }

            // Add to casino chips
            const newChips = currentChips + amount;
            setCasinoChips(user.discordId, newChips);

            return NextResponse.json({
                success: true,
                action: 'deposit',
                amount,
                chips: newChips,
                mainBalance: deductResult.newBalance,
            });

        } else if (action === 'withdraw') {
            // Transfer from casino chips to main balance
            if (currentChips < amount) {
                return NextResponse.json({ error: 'Insufficient casino chips' }, { status: 400 });
            }

            // Credit to main economy
            const roundId = `withdraw_${Date.now()}`;
            const creditResult = await creditBalance(user.discordId, amount, 'casino_withdrawal', roundId);
            if (!creditResult.success) {
                return NextResponse.json({ error: 'Withdrawal failed' }, { status: 400 });
            }

            // Deduct from casino chips
            const newChips = currentChips - amount;
            setCasinoChips(user.discordId, newChips);

            return NextResponse.json({
                success: true,
                action: 'withdraw',
                amount,
                chips: newChips,
                mainBalance: creditResult.newBalance,
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Wallet error:', error);
        return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
    }
}
