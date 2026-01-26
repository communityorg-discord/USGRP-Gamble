import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getWalletInfo, depositToGamble, withdrawFromGamble } from '@/lib/economy';

// Force dynamic - uses request.headers
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('Authorization');
    const user = await verifyToken(authHeader);

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wallet = await getWalletInfo(user.discordId);

    return NextResponse.json({
        gambleBalance: wallet.gambleBalance,
        bankBalance: wallet.bankBalance,
        stats: wallet.stats,
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

        if (action === 'deposit') {
            const result = await depositToGamble(user.discordId, amount);
            
            if (!result.success) {
                return NextResponse.json({ error: result.error || 'Deposit failed' }, { status: 400 });
            }

            return NextResponse.json({
                success: true,
                action: 'deposit',
                amount,
                gambleBalance: result.newGambleBalance,
                bankBalance: result.newBankBalance,
            });

        } else if (action === 'withdraw') {
            const result = await withdrawFromGamble(user.discordId, amount);
            
            if (!result.success) {
                return NextResponse.json({ error: result.error || 'Withdrawal failed' }, { status: 400 });
            }

            return NextResponse.json({
                success: true,
                action: 'withdraw',
                amount,
                gambleBalance: result.newGambleBalance,
                bankBalance: result.newBankBalance,
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Wallet error:', error);
        return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
    }
}
