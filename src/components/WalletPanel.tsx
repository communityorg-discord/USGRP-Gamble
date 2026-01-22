'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, X, Loader2 } from 'lucide-react';
import { sounds } from '@/lib/sounds';

interface WalletPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onBalanceChange?: (chips: number, mainBalance: number) => void;
}

export default function WalletPanel({ isOpen, onClose, onBalanceChange }: WalletPanelProps) {
    const [chips, setChips] = useState(0);
    const [mainBalance, setMainBalance] = useState(0);
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Fetch wallet data
    const fetchWallet = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/wallet', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setChips(data.chips || 0);
                setMainBalance(data.mainBalance || 0);
            }
        } catch (err) {
            console.error('Failed to fetch wallet:', err);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchWallet();
        }
    }, [isOpen]);

    // Handle deposit/withdraw
    const handleTransaction = async (action: 'deposit' | 'withdraw') => {
        const value = parseInt(amount);
        if (!value || value <= 0) {
            setError('Enter a valid amount');
            return;
        }

        if (action === 'deposit' && value > mainBalance) {
            setError('Insufficient main balance');
            return;
        }

        if (action === 'withdraw' && value > chips) {
            setError('Insufficient casino chips');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/wallet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ action, amount: value }),
            });

            const data = await response.json();

            if (response.ok) {
                setChips(data.chips);
                setMainBalance(data.mainBalance);
                setAmount('');
                setSuccess(`${action === 'deposit' ? 'Deposited' : 'Withdrew'} $${value.toLocaleString()}`);
                sounds.coins();

                if (onBalanceChange) {
                    onBalanceChange(data.chips, data.mainBalance);
                }
            } else {
                setError(data.error || 'Transaction failed');
            }
        } catch (err) {
            setError('Transaction failed');
        } finally {
            setIsLoading(false);
        }
    };

    // Quick amount buttons
    const quickAmounts = [100, 500, 1000, 5000];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="glass rounded-2xl p-6 max-w-md w-full"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                                <Wallet className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Casino Wallet</h2>
                                <p className="text-sm text-gray-400">Manage your chips</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Balances */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-800/60 rounded-xl p-4 text-center">
                            <p className="text-xs text-gray-400 mb-1">Casino Chips</p>
                            <p className="text-2xl font-bold text-yellow-400">
                                ${chips.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-slate-800/60 rounded-xl p-4 text-center">
                            <p className="text-xs text-gray-400 mb-1">Main Balance</p>
                            <p className="text-2xl font-bold text-green-400">
                                ${mainBalance.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div className="mb-4">
                        <label className="text-sm text-gray-400 block mb-2">Amount</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-yellow-500 focus:outline-none text-lg"
                        />
                    </div>

                    {/* Quick Amounts */}
                    <div className="flex gap-2 mb-6">
                        {quickAmounts.map((qa) => (
                            <button
                                key={qa}
                                onClick={() => setAmount(qa.toString())}
                                className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-sm font-medium"
                            >
                                ${qa.toLocaleString()}
                            </button>
                        ))}
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="bg-red-500/20 border border-red-500/40 rounded-lg px-4 py-2 mb-4 text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-500/20 border border-green-500/40 rounded-lg px-4 py-2 mb-4 text-green-400 text-sm">
                            {success}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => handleTransaction('deposit')}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 font-bold disabled:opacity-50 transition-all"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <ArrowDownToLine className="w-5 h-5" />
                                    Deposit
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => handleTransaction('withdraw')}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 font-bold disabled:opacity-50 transition-all"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <ArrowUpFromLine className="w-5 h-5" />
                                    Withdraw
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
