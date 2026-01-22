'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/app/providers';

// Dice face configurations
const DICE_FACES: Record<number, boolean[]> = {
    1: [false, false, false, false, true, false, false, false, false],
    2: [true, false, false, false, false, false, false, false, true],
    3: [true, false, false, false, true, false, false, false, true],
    4: [true, false, true, false, false, false, true, false, true],
    5: [true, false, true, false, true, false, true, false, true],
    6: [true, false, true, true, false, true, true, false, true],
};

function DiceFace({ value, rolling }: { value: number; rolling: boolean }) {
    const dots = DICE_FACES[value] || DICE_FACES[1];

    return (
        <motion.div
            className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-xl shadow-lg grid grid-cols-3 gap-1 p-2"
            animate={rolling ? {
                rotateX: [0, 360, 720],
                rotateY: [0, 360, 720],
                scale: [1, 0.8, 1],
            } : {}}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
            {dots.map((show, i) => (
                <div key={i} className="flex items-center justify-center">
                    {show && (
                        <div className="w-4 h-4 md:w-5 md:h-5 bg-gray-900 rounded-full" />
                    )}
                </div>
            ))}
        </motion.div>
    );
}

type BetType = 'over' | 'under' | 'exact';

export default function DicePage() {
    const { user, setUser } = useAuth();
    const [betAmount, setBetAmount] = useState(100);
    const [betType, setBetType] = useState<BetType>('over');
    const [targetNumber, setTargetNumber] = useState(7);
    const [isRolling, setIsRolling] = useState(false);
    const [dice, setDice] = useState<[number, number]>([1, 1]);
    const [result, setResult] = useState<{
        won: boolean;
        total: number;
        payout: number;
    } | null>(null);
    const [history, setHistory] = useState<number[]>([]);

    const diceTotal = dice[0] + dice[1];

    // Calculate odds/payouts based on bet type and target
    const getOdds = (): { probability: number; multiplier: number } => {
        if (betType === 'exact') {
            // Probability of exact sum on 2d6
            const ways = Math.min(targetNumber - 1, 13 - targetNumber);
            const probability = ways / 36;
            return { probability, multiplier: Math.floor(1 / probability) };
        } else if (betType === 'over') {
            // Probability of rolling over target
            let waysOver = 0;
            for (let sum = targetNumber + 1; sum <= 12; sum++) {
                waysOver += Math.min(sum - 1, 13 - sum);
            }
            const probability = waysOver / 36;
            return { probability, multiplier: Math.max(1.1, +(1 / probability).toFixed(2)) };
        } else {
            // Probability of rolling under target
            let waysUnder = 0;
            for (let sum = 2; sum < targetNumber; sum++) {
                waysUnder += Math.min(sum - 1, 13 - sum);
            }
            const probability = waysUnder / 36;
            return { probability, multiplier: Math.max(1.1, +(1 / probability).toFixed(2)) };
        }
    };

    const { probability, multiplier } = getOdds();

    const adjustBet = (delta: number) => {
        const newBet = Math.max(10, Math.min(10000, betAmount + delta));
        setBetAmount(newBet);
    };

    const roll = async () => {
        if (isRolling || !user || user.balance < betAmount) return;

        setIsRolling(true);
        setResult(null);

        // Deduct bet
        setUser({ ...user, balance: user.balance - betAmount });

        // Animate dice rolling
        const rollInterval = setInterval(() => {
            setDice([
                Math.floor(Math.random() * 6) + 1,
                Math.floor(Math.random() * 6) + 1,
            ]);
        }, 100);

        await new Promise(resolve => setTimeout(resolve, 1000));
        clearInterval(rollInterval);

        // Final result
        const die1 = Math.floor(Math.random() * 6) + 1;
        const die2 = Math.floor(Math.random() * 6) + 1;
        const total = die1 + die2;
        setDice([die1, die2]);

        // Check win
        let won = false;
        if (betType === 'over' && total > targetNumber) won = true;
        if (betType === 'under' && total < targetNumber) won = true;
        if (betType === 'exact' && total === targetNumber) won = true;

        const payout = won ? Math.floor(betAmount * multiplier) : 0;

        if (won) {
            setUser({ ...user, balance: user.balance - betAmount + payout });
            confetti({
                particleCount: 80,
                spread: 60,
                origin: { y: 0.6 },
            });
        }

        setResult({ won, total, payout });
        setHistory(prev => [total, ...prev.slice(0, 19)]);
        setIsRolling(false);
    };

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
                        🎲 <span className="gradient-text">Dice Roll</span>
                    </h1>
                    <p className="text-gray-400">Predict the outcome and win big!</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Game */}
                    <div className="lg:col-span-2">
                        <div className="glass rounded-3xl p-8">
                            {/* Dice Display */}
                            <div className="flex justify-center gap-8 mb-8">
                                <DiceFace value={dice[0]} rolling={isRolling} />
                                <DiceFace value={dice[1]} rolling={isRolling} />
                            </div>

                            {/* Total */}
                            <div className="text-center mb-8">
                                <p className="text-gray-400 mb-1">Total</p>
                                <motion.p
                                    key={diceTotal}
                                    initial={{ scale: 0.5 }}
                                    animate={{ scale: 1 }}
                                    className="text-5xl font-display font-bold neon-gold"
                                >
                                    {diceTotal}
                                </motion.p>
                            </div>

                            {/* Result */}
                            <AnimatePresence>
                                {result && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className={`text-center py-4 px-6 rounded-xl mb-6 ${result.won
                                                ? 'bg-gradient-to-r from-casino-gold/20 via-casino-green/20 to-casino-gold/20 border border-casino-gold/40'
                                                : 'bg-red-500/10 border border-red-500/30'
                                            }`}
                                    >
                                        {result.won ? (
                                            <>
                                                <p className="text-xl text-casino-gold mb-1">🎉 YOU WIN! 🎉</p>
                                                <p className="text-2xl font-display font-bold neon-gold">
                                                    +${result.payout.toLocaleString()}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-xl text-gray-400">
                                                {result.total} - Better luck next time!
                                            </p>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Bet Type Selection */}
                            <div className="mb-6">
                                <p className="text-center text-gray-400 mb-3">Select your bet</p>
                                <div className="flex gap-3 justify-center flex-wrap">
                                    <button
                                        onClick={() => setBetType('under')}
                                        disabled={isRolling}
                                        className={`px-6 py-3 rounded-xl font-bold transition-all ${betType === 'under'
                                                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg'
                                                : 'glass hover:bg-white/10'
                                            }`}
                                    >
                                        Under {targetNumber}
                                    </button>
                                    <button
                                        onClick={() => setBetType('exact')}
                                        disabled={isRolling}
                                        className={`px-6 py-3 rounded-xl font-bold transition-all ${betType === 'exact'
                                                ? 'bg-gradient-to-r from-casino-gold to-yellow-500 text-black shadow-neon-gold'
                                                : 'glass hover:bg-white/10'
                                            }`}
                                    >
                                        Exactly {targetNumber}
                                    </button>
                                    <button
                                        onClick={() => setBetType('over')}
                                        disabled={isRolling}
                                        className={`px-6 py-3 rounded-xl font-bold transition-all ${betType === 'over'
                                                ? 'bg-gradient-to-r from-green-600 to-emerald-500 shadow-lg'
                                                : 'glass hover:bg-white/10'
                                            }`}
                                    >
                                        Over {targetNumber}
                                    </button>
                                </div>
                            </div>

                            {/* Target Number Slider */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-400">Target Number</span>
                                    <span className="text-2xl font-bold text-casino-gold">{targetNumber}</span>
                                </div>
                                <input
                                    type="range"
                                    min="3"
                                    max="11"
                                    value={targetNumber}
                                    onChange={(e) => setTargetNumber(parseInt(e.target.value))}
                                    disabled={isRolling}
                                    className="w-full h-3 rounded-full appearance-none bg-gray-700 cursor-pointer accent-casino-accent"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>3</span>
                                    <span>7</span>
                                    <span>11</span>
                                </div>
                            </div>

                            {/* Odds Display */}
                            <div className="glass rounded-xl p-4 mb-6 grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-gray-400 text-sm">Win Chance</p>
                                    <p className="text-xl font-bold text-casino-green">
                                        {(probability * 100).toFixed(1)}%
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Multiplier</p>
                                    <p className="text-xl font-bold text-casino-gold">{multiplier}x</p>
                                </div>
                            </div>

                            {/* Bet Controls */}
                            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-400">Bet:</span>
                                    <button
                                        onClick={() => adjustBet(-50)}
                                        disabled={isRolling}
                                        className="w-10 h-10 rounded-lg glass flex items-center justify-center hover:bg-white/10"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <input
                                        type="number"
                                        value={betAmount}
                                        onChange={(e) => setBetAmount(Math.max(10, Math.min(10000, parseInt(e.target.value) || 10)))}
                                        disabled={isRolling}
                                        className="w-24 text-center text-xl font-bold bg-transparent border-none focus:outline-none neon-gold"
                                    />
                                    <button
                                        onClick={() => adjustBet(50)}
                                        disabled={isRolling}
                                        className="w-10 h-10 rounded-lg glass flex items-center justify-center hover:bg-white/10"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                <motion.button
                                    onClick={roll}
                                    disabled={isRolling || !user || (user?.balance || 0) < betAmount}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`px-12 py-4 rounded-2xl font-display font-bold text-xl transition-all ${isRolling
                                            ? 'bg-gray-600 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-casino-accent to-casino-purple hover:shadow-neon-pink'
                                        }`}
                                >
                                    {isRolling ? (
                                        <span className="flex items-center gap-2">
                                            <motion.span
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                                            >
                                                🎲
                                            </motion.span>
                                            ROLLING...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Zap className="w-6 h-6" />
                                            ROLL
                                        </span>
                                    )}
                                </motion.button>
                            </div>

                            {/* Potential Win */}
                            <p className="text-center mt-4 text-gray-400">
                                Potential Win: <span className="text-casino-green font-bold">
                                    ${Math.floor(betAmount * multiplier).toLocaleString()}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* History */}
                        <div className="glass rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-4">Roll History</h3>
                            {history.length > 0 ? (
                                <div className="grid grid-cols-5 gap-2">
                                    {history.map((total, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${total <= 6 ? 'bg-blue-600/30 text-blue-400' :
                                                    total >= 8 ? 'bg-green-600/30 text-green-400' :
                                                        'bg-gray-600/30 text-gray-400'
                                                }`}
                                        >
                                            {total}
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm">No rolls yet</p>
                            )}
                        </div>

                        {/* Probability Chart */}
                        <div className="glass rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-4">Probability Chart</h3>
                            <div className="space-y-2">
                                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
                                    const ways = Math.min(num - 1, 13 - num);
                                    const prob = (ways / 36) * 100;
                                    return (
                                        <div key={num} className="flex items-center gap-2">
                                            <span className="w-6 text-right text-sm text-gray-400">{num}</span>
                                            <div className="flex-1 h-4 bg-gray-700 rounded overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-casino-accent to-casino-purple"
                                                    style={{ width: `${prob * 2}%` }}
                                                />
                                            </div>
                                            <span className="w-12 text-right text-xs text-gray-500">
                                                {prob.toFixed(1)}%
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
