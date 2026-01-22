'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, Coins } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { useState, useEffect } from 'react';

export function WalletBar() {
    const { user } = useAuth();
    const [displayBalance, setDisplayBalance] = useState(0);
    const [balanceChange, setBalanceChange] = useState<{ amount: number; type: 'win' | 'loss' } | null>(null);

    // Animate balance changes
    useEffect(() => {
        if (user?.balance !== undefined) {
            const diff = user.balance - displayBalance;
            if (diff !== 0 && displayBalance !== 0) {
                setBalanceChange({
                    amount: Math.abs(diff),
                    type: diff > 0 ? 'win' : 'loss'
                });
                setTimeout(() => setBalanceChange(null), 2000);
            }

            // Animate the balance number
            const duration = 500;
            const steps = 20;
            const increment = diff / steps;
            let current = displayBalance;
            let step = 0;

            const interval = setInterval(() => {
                current += increment;
                step++;
                if (step >= steps) {
                    setDisplayBalance(user.balance);
                    clearInterval(interval);
                } else {
                    setDisplayBalance(Math.round(current));
                }
            }, duration / steps);

            return () => clearInterval(interval);
        }
    }, [user?.balance]);

    if (!user) return null;

    return (
        <div className="fixed top-16 left-0 right-0 z-40 glass border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex items-center justify-between">
                    {/* Balance Display */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-casino-gold to-yellow-600 flex items-center justify-center shadow-neon-gold">
                                <Coins className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Balance</p>
                                <div className="flex items-center gap-2">
                                    <motion.p
                                        className="text-xl font-bold font-display neon-gold"
                                        key={displayBalance}
                                        initial={{ scale: 1 }}
                                        animate={{ scale: balanceChange ? [1, 1.1, 1] : 1 }}
                                    >
                                        ${displayBalance.toLocaleString()}
                                    </motion.p>

                                    {/* Balance change indicator */}
                                    <AnimatePresence>
                                        {balanceChange && (
                                            <motion.span
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className={`text-sm font-bold flex items-center gap-1 ${balanceChange.type === 'win' ? 'text-casino-green' : 'text-casino-accent'
                                                    }`}
                                            >
                                                {balanceChange.type === 'win' ? (
                                                    <TrendingUp className="w-4 h-4" />
                                                ) : (
                                                    <TrendingDown className="w-4 h-4" />
                                                )}
                                                {balanceChange.type === 'win' ? '+' : '-'}${balanceChange.amount.toLocaleString()}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2">
                        <button className="px-4 py-2 text-sm font-medium text-casino-green border border-casino-green/30 rounded-lg hover:bg-casino-green/10 transition-colors">
                            Deposit
                        </button>
                        <button className="px-4 py-2 text-sm font-medium text-gray-400 border border-gray-600 rounded-lg hover:bg-white/5 transition-colors">
                            Withdraw
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
