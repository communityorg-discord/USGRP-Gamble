'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Repeat, Minus, Plus, Trophy, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/app/providers';

// Slot symbols with their values and colors
type SlotSymbol = { emoji: string; name: string; value: number; color: string };

const SYMBOLS: SlotSymbol[] = [
    { emoji: '🍒', name: 'Cherry', value: 2, color: '#ff4444' },
    { emoji: '🍋', name: 'Lemon', value: 3, color: '#ffff44' },
    { emoji: '🍊', name: 'Orange', value: 4, color: '#ff8844' },
    { emoji: '🍇', name: 'Grape', value: 5, color: '#8844ff' },
    { emoji: '🔔', name: 'Bell', value: 10, color: '#ffdd44' },
    { emoji: '⭐', name: 'Star', value: 15, color: '#44ddff' },
    { emoji: '💎', name: 'Diamond', value: 25, color: '#44ffdd' },
    { emoji: '7️⃣', name: 'Seven', value: 50, color: '#ff4488' },
    { emoji: '🎰', name: 'Jackpot', value: 100, color: '#ffd700' },
];

const REEL_COUNT = 5;
const VISIBLE_SYMBOLS = 3;

// Generate random symbols for a reel
const generateReelSymbols = (count: number): SlotSymbol[] => {
    return Array.from({ length: count }, () =>
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
    );
};

export default function SlotsPage() {
    const { user, setUser } = useAuth();
    const [betAmount, setBetAmount] = useState(100);
    const [isSpinning, setIsSpinning] = useState(false);
    const [autoSpin, setAutoSpin] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [reels, setReels] = useState<SlotSymbol[][]>(() =>
        Array.from({ length: REEL_COUNT }, () => generateReelSymbols(20))
    );
    const [reelPositions, setReelPositions] = useState<number[]>(
        Array(REEL_COUNT).fill(0)
    );
    const [result, setResult] = useState<{
        won: boolean;
        amount: number;
        matches: number[];
        multiplier: number;
    } | null>(null);
    const [jackpot, setJackpot] = useState(1247890);

    // Increment jackpot over time
    useEffect(() => {
        const interval = setInterval(() => {
            setJackpot(prev => prev + Math.floor(Math.random() * 10));
        }, 100);
        return () => clearInterval(interval);
    }, []);

    // Calculate win based on middle row
    const calculateWin = (finalReels: SlotSymbol[][]): { won: boolean; amount: number; matches: number[]; multiplier: number } => {
        const middleRow = finalReels.map(reel => reel[1]); // Middle symbol of each reel

        // Check for consecutive matches from left
        let matchCount = 1;
        const firstSymbol = middleRow[0];
        const matchedPositions = [0];

        for (let i = 1; i < middleRow.length; i++) {
            if (middleRow[i].emoji === firstSymbol.emoji) {
                matchCount++;
                matchedPositions.push(i);
            } else {
                break;
            }
        }

        // Calculate winnings
        if (matchCount >= 3) {
            const multiplier = firstSymbol.value * (matchCount - 2);
            const amount = betAmount * multiplier;
            return { won: true, amount, matches: matchedPositions, multiplier };
        }

        // Check for any 3 matching symbols
        const symbolCounts = new Map<string, number[]>();
        middleRow.forEach((sym, i) => {
            const positions = symbolCounts.get(sym.emoji) || [];
            positions.push(i);
            symbolCounts.set(sym.emoji, positions);
        });

        for (const [emoji, positions] of symbolCounts) {
            if (positions.length >= 3) {
                const symbol = SYMBOLS.find(s => s.emoji === emoji)!;
                const multiplier = symbol.value * 0.5;
                const amount = Math.floor(betAmount * multiplier);
                return { won: true, amount, matches: positions, multiplier };
            }
        }

        return { won: false, amount: 0, matches: [], multiplier: 0 };
    };

    const spin = async () => {
        if (isSpinning || !user || user.balance < betAmount) return;

        setIsSpinning(true);
        setResult(null);

        // Generate new reel symbols
        const newReels = Array.from({ length: REEL_COUNT }, () => generateReelSymbols(20));
        setReels(newReels);

        // Animate reels stopping one by one
        const finalPositions: number[] = [];
        for (let i = 0; i < REEL_COUNT; i++) {
            await new Promise(resolve => setTimeout(resolve, 200 + i * 150));
            const pos = Math.floor(Math.random() * (newReels[i].length - VISIBLE_SYMBOLS));
            finalPositions.push(pos);
            setReelPositions([...finalPositions, ...Array(REEL_COUNT - finalPositions.length).fill(-1)]);
        }

        // Get visible symbols for win calculation
        const visibleSymbols = newReels.map((reel, i) =>
            reel.slice(finalPositions[i], finalPositions[i] + VISIBLE_SYMBOLS)
        );

        // Calculate result
        const spinResult = calculateWin(visibleSymbols);
        setResult(spinResult);

        // Update balance
        if (spinResult.won) {
            setUser({ ...user, balance: user.balance - betAmount + spinResult.amount });

            // Celebration effects
            if (soundEnabled) {
                // Play win sound
            }

            if (spinResult.multiplier >= 10) {
                // Big win confetti
                confetti({
                    particleCount: 200,
                    spread: 100,
                    origin: { y: 0.6 },
                    colors: ['#ffd700', '#ff4488', '#44ffdd', '#8844ff'],
                });
            } else {
                confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.7 },
                });
            }
        } else {
            setUser({ ...user, balance: user.balance - betAmount });
        }

        setIsSpinning(false);

        // Auto-spin
        if (autoSpin && user.balance >= betAmount) {
            setTimeout(spin, 1500);
        }
    };

    const adjustBet = (delta: number) => {
        const newBet = Math.max(10, Math.min(10000, betAmount + delta));
        setBetAmount(newBet);
    };

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
                        🎰 <span className="gradient-text">Mega Slots</span>
                    </h1>
                    <p className="text-gray-400">Spin to win up to 10,000x your bet!</p>
                </div>

                {/* Jackpot Display */}
                <motion.div
                    className="glass rounded-2xl p-6 mb-8 text-center border border-casino-gold/30"
                    animate={{ boxShadow: ['0 0 20px rgba(255,215,0,0.3)', '0 0 40px rgba(255,215,0,0.5)', '0 0 20px rgba(255,215,0,0.3)'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Trophy className="w-6 h-6 text-casino-gold" />
                        <span className="text-lg font-medium text-casino-gold">PROGRESSIVE JACKPOT</span>
                        <Trophy className="w-6 h-6 text-casino-gold" />
                    </div>
                    <p className="text-4xl md:text-5xl font-display font-bold neon-gold">
                        ${jackpot.toLocaleString()}
                    </p>
                </motion.div>

                {/* Slot Machine */}
                <div className="glass rounded-3xl p-8 mb-8 border border-white/10">
                    {/* Reels Container */}
                    <div className="bg-black/50 rounded-2xl p-4 mb-6 border-4 border-casino-gold/50">
                        <div className="flex justify-center gap-2 md:gap-4">
                            {reels.map((reel, reelIndex) => (
                                <div
                                    key={reelIndex}
                                    className="w-16 md:w-24 h-48 md:h-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 rounded-xl overflow-hidden relative border-2 border-casino-gold/30"
                                >
                                    {/* Reel strip */}
                                    <motion.div
                                        className="absolute inset-x-0"
                                        animate={{
                                            y: isSpinning && reelPositions[reelIndex] === -1
                                                ? [0, -1000]
                                                : reelPositions[reelIndex] !== undefined && reelPositions[reelIndex] !== -1
                                                    ? -reelPositions[reelIndex] * 64 - 32
                                                    : 0,
                                        }}
                                        transition={{
                                            y: isSpinning && reelPositions[reelIndex] === -1
                                                ? { duration: 0.1, repeat: Infinity, ease: 'linear' }
                                                : { type: 'spring', damping: 15, stiffness: 100 }
                                        }}
                                    >
                                        {reel.map((symbol, symIndex) => (
                                            <div
                                                key={symIndex}
                                                className={`h-16 md:h-20 flex items-center justify-center text-4xl md:text-5xl ${result?.matches.includes(reelIndex) && symIndex === reelPositions[reelIndex] + 1
                                                    ? 'animate-pulse'
                                                    : ''
                                                    }`}
                                            >
                                                {symbol.emoji}
                                            </div>
                                        ))}
                                    </motion.div>

                                    {/* Highlight overlay for wins */}
                                    {result?.matches.includes(reelIndex) && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                                            transition={{ duration: 0.5, repeat: Infinity }}
                                            className="absolute inset-0 bg-casino-gold/30 pointer-events-none"
                                        />
                                    )}

                                    {/* Reel shine effect */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/30 pointer-events-none" />
                                </div>
                            ))}
                        </div>

                        {/* Payline indicator */}
                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-casino-accent/50 pointer-events-none hidden" />
                    </div>

                    {/* Win Display */}
                    <AnimatePresence>
                        {result && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className={`text-center py-4 rounded-xl mb-6 ${result.won
                                    ? 'bg-gradient-to-r from-casino-gold/20 via-casino-green/20 to-casino-gold/20 border border-casino-gold/40'
                                    : 'bg-red-500/10 border border-red-500/30'
                                    }`}
                            >
                                {result.won ? (
                                    <>
                                        <p className="text-xl text-casino-gold mb-1">🎉 YOU WIN! 🎉</p>
                                        <p className="text-3xl font-display font-bold neon-gold">
                                            +${result.amount.toLocaleString()}
                                        </p>
                                        <p className="text-sm text-gray-400 mt-1">{result.multiplier}x Multiplier</p>
                                    </>
                                ) : (
                                    <p className="text-xl text-gray-400">No win this time. Try again!</p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Controls */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        {/* Bet Amount */}
                        <div className="flex items-center gap-3">
                            <span className="text-gray-400">Bet:</span>
                            <button
                                onClick={() => adjustBet(-100)}
                                disabled={isSpinning}
                                className="w-10 h-10 rounded-lg glass flex items-center justify-center hover:bg-white/10 disabled:opacity-50"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <div className="w-32 text-center">
                                <input
                                    type="number"
                                    value={betAmount}
                                    onChange={(e) => setBetAmount(Math.max(10, Math.min(10000, parseInt(e.target.value) || 10)))}
                                    disabled={isSpinning}
                                    className="w-full text-center text-2xl font-bold bg-transparent border-none focus:outline-none neon-gold"
                                />
                            </div>
                            <button
                                onClick={() => adjustBet(100)}
                                disabled={isSpinning}
                                className="w-10 h-10 rounded-lg glass flex items-center justify-center hover:bg-white/10 disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Spin Button */}
                        <motion.button
                            onClick={spin}
                            disabled={isSpinning || !user || (user?.balance || 0) < betAmount}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-12 py-4 rounded-2xl font-display font-bold text-xl transition-all ${isSpinning
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
                                        🎰
                                    </motion.span>
                                    SPINNING...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Zap className="w-6 h-6" />
                                    SPIN
                                </span>
                            )}
                        </motion.button>

                        {/* Extra Controls */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setAutoSpin(!autoSpin)}
                                disabled={isSpinning}
                                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${autoSpin
                                    ? 'bg-casino-accent text-white'
                                    : 'glass text-gray-400 hover:text-white'
                                    }`}
                            >
                                <Repeat className="w-4 h-4" />
                                Auto
                            </button>
                            <button
                                onClick={() => setSoundEnabled(!soundEnabled)}
                                className="w-10 h-10 rounded-lg glass flex items-center justify-center text-gray-400 hover:text-white"
                            >
                                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Paytable */}
                <div className="glass rounded-2xl p-6">
                    <h3 className="text-xl font-display font-bold mb-4 text-center">Paytable</h3>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                        {SYMBOLS.map((symbol) => (
                            <div
                                key={symbol.emoji}
                                className="text-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <span className="text-3xl block mb-2">{symbol.emoji}</span>
                                <p className="text-sm text-gray-400">{symbol.name}</p>
                                <p className="text-casino-gold font-bold">{symbol.value}x</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
