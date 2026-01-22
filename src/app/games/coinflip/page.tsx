'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/app/providers';

type CoinSide = 'heads' | 'tails';

export default function CoinflipPage() {
    const { user, setUser } = useAuth();
    const [betAmount, setBetAmount] = useState(100);
    const [selectedSide, setSelectedSide] = useState<CoinSide | null>(null);
    const [isFlipping, setIsFlipping] = useState(false);
    const [result, setResult] = useState<{
        side: CoinSide;
        won: boolean;
        amount: number;
    } | null>(null);
    const [flipRotation, setFlipRotation] = useState(0);
    const [history, setHistory] = useState<CoinSide[]>([]);

    const adjustBet = (delta: number) => {
        const newBet = Math.max(5, Math.min(10000, betAmount + delta));
        setBetAmount(newBet);
    };

    const flip = async () => {
        if (isFlipping || !selectedSide || !user || user.balance < betAmount) return;

        setIsFlipping(true);
        setResult(null);

        // Determine result (48% win rate - slight house edge)
        const isHeads = Math.random() < 0.5;
        const resultSide: CoinSide = isHeads ? 'heads' : 'tails';
        const won = resultSide === selectedSide;

        // Calculate rotations for animation
        // Heads = even number of half rotations, Tails = odd number
        const baseRotations = 6; // 3 full rotations
        const finalRotation = flipRotation + (baseRotations * 360) + (isHeads ? 0 : 180);
        setFlipRotation(finalRotation);

        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Update balance
        const newBalance = won
            ? user.balance + betAmount
            : user.balance - betAmount;

        setUser({ ...user, balance: newBalance });

        if (won) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#ffd700', '#ffdf00', '#f0c000'],
            });
        }

        setResult({
            side: resultSide,
            won,
            amount: won ? betAmount : -betAmount,
        });
        setHistory(prev => [resultSide, ...prev.slice(0, 19)]);
        setIsFlipping(false);
    };

    const headsCount = history.filter(h => h === 'heads').length;
    const tailsCount = history.filter(h => h === 'tails').length;

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
                        🪙 <span className="gradient-text">Coin Flip</span>
                    </h1>
                    <p className="text-gray-400">Pick a side and double your money!</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Game Area */}
                    <div className="lg:col-span-2">
                        <div className="glass rounded-3xl p-8">
                            {/* Coin */}
                            <div className="relative w-48 h-48 mx-auto mb-8" style={{ perspective: '1000px' }}>
                                <motion.div
                                    className="relative w-full h-full"
                                    style={{ transformStyle: 'preserve-3d' }}
                                    animate={{ rotateY: flipRotation }}
                                    transition={{ duration: 2, ease: [0.2, 0.8, 0.2, 1] }}
                                >
                                    {/* Heads side */}
                                    <div
                                        className="absolute inset-0 rounded-full flex items-center justify-center text-6xl font-bold"
                                        style={{
                                            backfaceVisibility: 'hidden',
                                            background: 'linear-gradient(145deg, #ffd700, #b8860b)',
                                            boxShadow: 'inset 0 -8px 20px rgba(0,0,0,0.3), 0 10px 30px rgba(255,215,0,0.4)',
                                        }}
                                    >
                                        <div className="absolute inset-2 rounded-full border-4 border-yellow-600/50" />
                                        <span className="relative z-10">👤</span>
                                    </div>

                                    {/* Tails side */}
                                    <div
                                        className="absolute inset-0 rounded-full flex items-center justify-center text-6xl font-bold"
                                        style={{
                                            backfaceVisibility: 'hidden',
                                            transform: 'rotateY(180deg)',
                                            background: 'linear-gradient(145deg, #c0c0c0, #808080)',
                                            boxShadow: 'inset 0 -8px 20px rgba(0,0,0,0.3), 0 10px 30px rgba(192,192,192,0.4)',
                                        }}
                                    >
                                        <div className="absolute inset-2 rounded-full border-4 border-gray-500/50" />
                                        <span className="relative z-10">🦅</span>
                                    </div>
                                </motion.div>

                                {/* Coin edge glow */}
                                <div
                                    className="absolute inset-0 rounded-full pointer-events-none"
                                    style={{
                                        boxShadow: '0 0 40px rgba(255,215,0,0.3)',
                                    }}
                                />
                            </div>

                            {/* Side Selection */}
                            <div className="flex justify-center gap-4 mb-8">
                                <motion.button
                                    onClick={() => !isFlipping && setSelectedSide('heads')}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`px-8 py-4 rounded-2xl font-display font-bold text-xl transition-all ${selectedSide === 'heads'
                                            ? 'bg-gradient-to-r from-yellow-500 to-casino-gold text-black shadow-neon-gold'
                                            : 'glass border-2 border-casino-gold/30 hover:border-casino-gold'
                                        }`}
                                >
                                    👤 Heads
                                </motion.button>
                                <motion.button
                                    onClick={() => !isFlipping && setSelectedSide('tails')}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`px-8 py-4 rounded-2xl font-display font-bold text-xl transition-all ${selectedSide === 'tails'
                                            ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-black shadow-lg'
                                            : 'glass border-2 border-gray-500/30 hover:border-gray-400'
                                        }`}
                                >
                                    🦅 Tails
                                </motion.button>
                            </div>

                            {/* Result Display */}
                            <AnimatePresence>
                                {result && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className={`text-center py-6 px-8 rounded-2xl mb-8 ${result.won
                                                ? 'bg-gradient-to-r from-casino-gold/20 via-casino-green/20 to-casino-gold/20 border border-casino-gold/40'
                                                : 'bg-red-500/10 border border-red-500/30'
                                            }`}
                                    >
                                        <p className="text-2xl mb-2">
                                            It landed on <span className="font-bold">{result.side === 'heads' ? '👤 Heads' : '🦅 Tails'}</span>!
                                        </p>
                                        {result.won ? (
                                            <>
                                                <p className="text-xl text-casino-gold mb-1">🎉 YOU WIN! 🎉</p>
                                                <p className="text-3xl font-display font-bold neon-gold">
                                                    +${Math.abs(result.amount).toLocaleString()}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-xl text-gray-400">Better luck next time!</p>
                                                <p className="text-2xl font-display font-bold text-red-400">
                                                    -${Math.abs(result.amount).toLocaleString()}
                                                </p>
                                            </>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Bet Controls */}
                            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                                {/* Bet Amount */}
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-400">Bet:</span>
                                    <button
                                        onClick={() => adjustBet(-50)}
                                        disabled={isFlipping}
                                        className="w-10 h-10 rounded-lg glass flex items-center justify-center hover:bg-white/10 disabled:opacity-50"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <div className="w-32 text-center">
                                        <input
                                            type="number"
                                            value={betAmount}
                                            onChange={(e) => setBetAmount(Math.max(5, Math.min(10000, parseInt(e.target.value) || 5)))}
                                            disabled={isFlipping}
                                            className="w-full text-center text-2xl font-bold bg-transparent border-none focus:outline-none neon-gold"
                                        />
                                    </div>
                                    <button
                                        onClick={() => adjustBet(50)}
                                        disabled={isFlipping}
                                        className="w-10 h-10 rounded-lg glass flex items-center justify-center hover:bg-white/10 disabled:opacity-50"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Quick Bet Buttons */}
                                <div className="flex gap-2">
                                    {[50, 100, 500, 1000].map((amount) => (
                                        <button
                                            key={amount}
                                            onClick={() => setBetAmount(amount)}
                                            disabled={isFlipping}
                                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${betAmount === amount
                                                    ? 'bg-casino-accent text-white'
                                                    : 'glass text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            ${amount}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Flip Button */}
                            <div className="text-center mt-8">
                                <motion.button
                                    onClick={flip}
                                    disabled={isFlipping || !selectedSide || !user || (user?.balance || 0) < betAmount}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`px-16 py-5 rounded-2xl font-display font-bold text-2xl transition-all ${isFlipping || !selectedSide
                                            ? 'bg-gray-600 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-casino-accent to-casino-purple hover:shadow-neon-pink'
                                        }`}
                                >
                                    {isFlipping ? (
                                        <span className="flex items-center gap-2">
                                            <motion.span
                                                animate={{ rotateY: 360 }}
                                                transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                                            >
                                                🪙
                                            </motion.span>
                                            FLIPPING...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Zap className="w-6 h-6" />
                                            FLIP FOR ${betAmount}
                                        </span>
                                    )}
                                </motion.button>

                                {!selectedSide && (
                                    <p className="text-gray-400 mt-3 text-sm">Select heads or tails to continue</p>
                                )}
                            </div>

                            {/* Potential Win */}
                            <div className="text-center mt-6 text-gray-400">
                                <p>Potential Win: <span className="text-casino-green font-bold">${(betAmount * 2).toLocaleString()}</span></p>
                                <p className="text-xs mt-1">Payout: 2x (1.96x after house edge)</p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Statistics */}
                        <div className="glass rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-4">Session Stats</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
                                    <p className="text-3xl font-bold text-casino-gold">{headsCount}</p>
                                    <p className="text-sm text-gray-400">👤 Heads</p>
                                </div>
                                <div className="text-center p-4 bg-gray-500/10 rounded-xl border border-gray-500/30">
                                    <p className="text-3xl font-bold text-gray-400">{tailsCount}</p>
                                    <p className="text-sm text-gray-400">🦅 Tails</p>
                                </div>
                            </div>

                            {history.length > 0 && (
                                <div className="mt-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-400">Heads</span>
                                        <span className="text-sm text-gray-400">Tails</span>
                                    </div>
                                    <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-yellow-500 to-casino-gold transition-all"
                                            style={{ width: `${(headsCount / history.length) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-center text-xs text-gray-500 mt-2">
                                        {((headsCount / history.length) * 100).toFixed(1)}% / {((tailsCount / history.length) * 100).toFixed(1)}%
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* History */}
                        <div className="glass rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-4">History</h3>
                            {history.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {history.map((h, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${h === 'heads'
                                                    ? 'bg-gradient-to-br from-yellow-500 to-casino-gold'
                                                    : 'bg-gradient-to-br from-gray-400 to-gray-600'
                                                }`}
                                        >
                                            {h === 'heads' ? '👤' : '🦅'}
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm">No flips yet. Start playing!</p>
                            )}
                        </div>

                        {/* Game Info */}
                        <div className="glass rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-4">How to Play</h3>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li className="flex items-start gap-2">
                                    <span className="text-casino-gold">1.</span>
                                    <span>Choose your bet amount</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-casino-gold">2.</span>
                                    <span>Pick Heads 👤 or Tails 🦅</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-casino-gold">3.</span>
                                    <span>Click FLIP and watch the coin!</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-casino-gold">4.</span>
                                    <span>Win 2x your bet if you're right!</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
