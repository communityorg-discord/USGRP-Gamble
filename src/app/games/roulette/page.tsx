'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, RotateCcw, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/app/providers';

// Roulette numbers with colors
const ROULETTE_NUMBERS = [
    { num: 0, color: 'green' },
    { num: 32, color: 'red' }, { num: 15, color: 'black' }, { num: 19, color: 'red' }, { num: 4, color: 'black' },
    { num: 21, color: 'red' }, { num: 2, color: 'black' }, { num: 25, color: 'red' }, { num: 17, color: 'black' },
    { num: 34, color: 'red' }, { num: 6, color: 'black' }, { num: 27, color: 'red' }, { num: 13, color: 'black' },
    { num: 36, color: 'red' }, { num: 11, color: 'black' }, { num: 30, color: 'red' }, { num: 8, color: 'black' },
    { num: 23, color: 'red' }, { num: 10, color: 'black' }, { num: 5, color: 'red' }, { num: 24, color: 'black' },
    { num: 16, color: 'red' }, { num: 33, color: 'black' }, { num: 1, color: 'red' }, { num: 20, color: 'black' },
    { num: 14, color: 'red' }, { num: 31, color: 'black' }, { num: 9, color: 'red' }, { num: 22, color: 'black' },
    { num: 18, color: 'red' }, { num: 29, color: 'black' }, { num: 7, color: 'red' }, { num: 28, color: 'black' },
    { num: 12, color: 'red' }, { num: 35, color: 'black' }, { num: 3, color: 'red' }, { num: 26, color: 'black' },
];

type BetType = 'red' | 'black' | 'odd' | 'even' | 'low' | 'high' | number;

interface Bet {
    type: BetType;
    amount: number;
}

const BET_BUTTONS = [
    { type: 'red' as BetType, label: 'Red', color: 'bg-red-600', payout: '2x' },
    { type: 'black' as BetType, label: 'Black', color: 'bg-gray-800', payout: '2x' },
    { type: 'odd' as BetType, label: 'Odd', color: 'bg-purple-600', payout: '2x' },
    { type: 'even' as BetType, label: 'Even', color: 'bg-blue-600', payout: '2x' },
    { type: 'low' as BetType, label: '1-18', color: 'bg-teal-600', payout: '2x' },
    { type: 'high' as BetType, label: '19-36', color: 'bg-orange-600', payout: '2x' },
];

export default function RoulettePage() {
    const { user, setUser } = useAuth();
    const [chipValue, setChipValue] = useState(25);
    const [bets, setBets] = useState<Bet[]>([]);
    const [isSpinning, setIsSpinning] = useState(false);
    const [wheelRotation, setWheelRotation] = useState(0);
    const [result, setResult] = useState<{
        number: typeof ROULETTE_NUMBERS[0];
        won: boolean;
        winAmount: number;
    } | null>(null);
    const [history, setHistory] = useState<typeof ROULETTE_NUMBERS[0][]>([]);

    const totalBet = bets.reduce((sum, bet) => sum + bet.amount, 0);

    const placeBet = (type: BetType) => {
        if (!user || user.balance < chipValue + totalBet) return;

        const existingBet = bets.find(b => b.type === type);
        if (existingBet) {
            setBets(bets.map(b =>
                b.type === type ? { ...b, amount: b.amount + chipValue } : b
            ));
        } else {
            setBets([...bets, { type, amount: chipValue }]);
        }
    };

    const clearBets = () => {
        setBets([]);
        setResult(null);
    };

    const calculateWinnings = (winningNumber: typeof ROULETTE_NUMBERS[0]) => {
        let totalWin = 0;

        for (const bet of bets) {
            if (typeof bet.type === 'number') {
                // Straight bet - 35:1
                if (bet.type === winningNumber.num) {
                    totalWin += bet.amount * 36;
                }
            } else if (bet.type === 'red' && winningNumber.color === 'red') {
                totalWin += bet.amount * 2;
            } else if (bet.type === 'black' && winningNumber.color === 'black') {
                totalWin += bet.amount * 2;
            } else if (bet.type === 'odd' && winningNumber.num % 2 === 1 && winningNumber.num !== 0) {
                totalWin += bet.amount * 2;
            } else if (bet.type === 'even' && winningNumber.num % 2 === 0 && winningNumber.num !== 0) {
                totalWin += bet.amount * 2;
            } else if (bet.type === 'low' && winningNumber.num >= 1 && winningNumber.num <= 18) {
                totalWin += bet.amount * 2;
            } else if (bet.type === 'high' && winningNumber.num >= 19 && winningNumber.num <= 36) {
                totalWin += bet.amount * 2;
            }
        }

        return totalWin;
    };

    const spin = async () => {
        if (isSpinning || bets.length === 0 || !user) return;

        setIsSpinning(true);
        setResult(null);

        // Deduct bet amount
        const newBalance = user.balance - totalBet;
        setUser({ ...user, balance: newBalance });

        // Pick random result
        const resultIndex = Math.floor(Math.random() * ROULETTE_NUMBERS.length);
        const winningNumber = ROULETTE_NUMBERS[resultIndex];

        // Calculate wheel rotation (at least 5 full spins + final position)
        const slotAngle = 360 / ROULETTE_NUMBERS.length;
        const targetRotation = wheelRotation + 360 * 5 + (360 - resultIndex * slotAngle);
        setWheelRotation(targetRotation);

        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Calculate winnings
        const winAmount = calculateWinnings(winningNumber);
        const won = winAmount > 0;

        // Update balance with winnings
        if (won) {
            setUser({ ...user, balance: newBalance + winAmount });
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: winningNumber.color === 'red' ? ['#ef4444', '#fca5a5'] :
                    winningNumber.color === 'black' ? ['#1f2937', '#6b7280'] : ['#22c55e', '#86efac'],
            });
        }

        setResult({ number: winningNumber, won, winAmount });
        setHistory(prev => [winningNumber, ...prev.slice(0, 9)]);
        setIsSpinning(false);
        setBets([]);
    };

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
                        🎡 <span className="gradient-text">Roulette</span>
                    </h1>
                    <p className="text-gray-400">Place your bets and spin the wheel!</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Wheel Section */}
                    <div className="lg:col-span-2">
                        <div className="glass rounded-3xl p-8 relative overflow-hidden">
                            {/* Roulette Wheel */}
                            <div className="relative w-80 h-80 mx-auto mb-8">
                                {/* Wheel base shadow */}
                                <div className="absolute inset-0 rounded-full bg-black/50 blur-xl transform translate-y-4" />

                                {/* Wheel */}
                                <motion.div
                                    className="absolute inset-0 rounded-full roulette-wheel"
                                    style={{
                                        background: `conic-gradient(${ROULETTE_NUMBERS.map((n, i) => {
                                            const color = n.color === 'red' ? '#dc2626' : n.color === 'black' ? '#1f2937' : '#16a34a';
                                            const start = (i / ROULETTE_NUMBERS.length) * 100;
                                            const end = ((i + 1) / ROULETTE_NUMBERS.length) * 100;
                                            return `${color} ${start}% ${end}%`;
                                        }).join(', ')})`,
                                    }}
                                    animate={{ rotate: wheelRotation }}
                                    transition={{ duration: 5, ease: [0.2, 0.8, 0.2, 1] }}
                                >
                                    {/* Number labels */}
                                    {ROULETTE_NUMBERS.map((n, i) => {
                                        const angle = (i / ROULETTE_NUMBERS.length) * 360 + (180 / ROULETTE_NUMBERS.length);
                                        return (
                                            <div
                                                key={n.num}
                                                className="absolute w-full h-full"
                                                style={{ transform: `rotate(${angle}deg)` }}
                                            >
                                                <span
                                                    className="absolute top-2 left-1/2 -translate-x-1/2 text-white text-xs font-bold"
                                                    style={{ transform: `rotate(${-angle}deg)` }}
                                                >
                                                    {n.num}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </motion.div>

                                {/* Center hub */}
                                <div className="absolute inset-[30%] rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-4 border-casino-gold flex items-center justify-center">
                                    <span className="text-2xl font-display font-bold text-casino-gold">SPIN</span>
                                </div>

                                {/* Ball pointer */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
                                    <div className="w-4 h-8 bg-casino-gold rounded-b-full shadow-neon-gold" />
                                </div>
                            </div>

                            {/* Result Display */}
                            <AnimatePresence>
                                {result && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className={`text-center py-4 px-6 rounded-xl mb-6 ${result.won
                                                ? 'bg-gradient-to-r from-casino-gold/20 via-casino-green/20 to-casino-gold/20 border border-casino-gold/40'
                                                : 'bg-red-500/10 border border-red-500/30'
                                            }`}
                                    >
                                        <div className="flex items-center justify-center gap-4">
                                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${result.number.color === 'red' ? 'bg-red-600' :
                                                    result.number.color === 'black' ? 'bg-gray-800' : 'bg-green-600'
                                                }`}>
                                                {result.number.num}
                                            </div>
                                            <div>
                                                {result.won ? (
                                                    <>
                                                        <p className="text-xl text-casino-gold mb-1">🎉 YOU WIN! 🎉</p>
                                                        <p className="text-2xl font-display font-bold neon-gold">
                                                            +${result.winAmount.toLocaleString()}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <p className="text-xl text-gray-400">No win. Try again!</p>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Spin Button */}
                            <div className="text-center">
                                <motion.button
                                    onClick={spin}
                                    disabled={isSpinning || bets.length === 0}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`px-12 py-4 rounded-2xl font-display font-bold text-xl transition-all ${isSpinning || bets.length === 0
                                            ? 'bg-gray-600 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-casino-accent to-casino-purple hover:shadow-neon-pink'
                                        }`}
                                >
                                    {isSpinning ? (
                                        <span className="flex items-center gap-2">
                                            <motion.span
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            >
                                                🎡
                                            </motion.span>
                                            SPINNING...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Zap className="w-6 h-6" />
                                            SPIN (${totalBet})
                                        </span>
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    </div>

                    {/* Betting Panel */}
                    <div className="space-y-6">
                        {/* Chip Selector */}
                        <div className="glass rounded-2xl p-4">
                            <h3 className="text-lg font-bold mb-3">Chip Value</h3>
                            <div className="flex gap-2 flex-wrap">
                                {[10, 25, 50, 100, 500].map((value) => (
                                    <button
                                        key={value}
                                        onClick={() => setChipValue(value)}
                                        className={`px-4 py-2 rounded-full font-bold transition-all ${chipValue === value
                                                ? 'bg-casino-gold text-black shadow-neon-gold'
                                                : 'bg-white/10 hover:bg-white/20'
                                            }`}
                                    >
                                        ${value}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Outside Bets */}
                        <div className="glass rounded-2xl p-4">
                            <h3 className="text-lg font-bold mb-3">Outside Bets (2:1)</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {BET_BUTTONS.map((button) => {
                                    const bet = bets.find(b => b.type === button.type);
                                    return (
                                        <button
                                            key={button.type}
                                            onClick={() => placeBet(button.type)}
                                            disabled={isSpinning}
                                            className={`${button.color} p-3 rounded-lg font-bold transition-all hover:scale-105 relative`}
                                        >
                                            {button.label}
                                            {bet && (
                                                <span className="absolute -top-2 -right-2 bg-casino-gold text-black text-xs px-2 py-1 rounded-full">
                                                    ${bet.amount}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Number Grid (Straight Bets) */}
                        <div className="glass rounded-2xl p-4">
                            <h3 className="text-lg font-bold mb-3">Straight Bets (35:1)</h3>
                            <div className="grid grid-cols-6 gap-1">
                                <button
                                    onClick={() => placeBet(0)}
                                    disabled={isSpinning}
                                    className="col-span-6 bg-green-600 p-2 rounded font-bold hover:scale-105 transition-all relative"
                                >
                                    0
                                    {bets.find(b => b.type === 0) && (
                                        <span className="absolute -top-2 -right-2 bg-casino-gold text-black text-xs px-2 py-1 rounded-full">
                                            ${bets.find(b => b.type === 0)?.amount}
                                        </span>
                                    )}
                                </button>
                                {[...Array(36)].map((_, i) => {
                                    const num = i + 1;
                                    const isRed = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(num);
                                    const bet = bets.find(b => b.type === num);
                                    return (
                                        <button
                                            key={num}
                                            onClick={() => placeBet(num)}
                                            disabled={isSpinning}
                                            className={`p-2 rounded font-bold text-sm hover:scale-105 transition-all relative ${isRed ? 'bg-red-600' : 'bg-gray-800'
                                                }`}
                                        >
                                            {num}
                                            {bet && (
                                                <span className="absolute -top-1 -right-1 bg-casino-gold text-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                                                    {bet.amount >= 100 ? `${bet.amount / 100}h` : bet.amount}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Current Bets & Clear */}
                        <div className="glass rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-bold">Current Bets</h3>
                                <button
                                    onClick={clearBets}
                                    disabled={isSpinning || bets.length === 0}
                                    className="text-sm text-gray-400 hover:text-casino-accent flex items-center gap-1 disabled:opacity-50"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Clear
                                </button>
                            </div>
                            <p className="text-2xl font-bold text-casino-gold">
                                Total: ${totalBet.toLocaleString()}
                            </p>
                        </div>

                        {/* History */}
                        {history.length > 0 && (
                            <div className="glass rounded-2xl p-4">
                                <h3 className="text-lg font-bold mb-3">History</h3>
                                <div className="flex gap-2 flex-wrap">
                                    {history.map((h, i) => (
                                        <div
                                            key={i}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${h.color === 'red' ? 'bg-red-600' :
                                                    h.color === 'black' ? 'bg-gray-800' : 'bg-green-600'
                                                }`}
                                        >
                                            {h.num}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
