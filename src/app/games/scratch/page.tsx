'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/app/providers';

const SCRATCH_TIERS = {
    bronze: {
        name: 'Bronze',
        emoji: '🥉',
        price: 25,
        color: 'from-amber-700 to-amber-900',
        prizes: [0, 0, 0, 5, 10, 25, 50, 100, 250],
        jackpot: 1000,
        jackpotChance: 0.001,
    },
    silver: {
        name: 'Silver',
        emoji: '🥈',
        price: 100,
        color: 'from-gray-400 to-gray-600',
        prizes: [0, 0, 0, 25, 50, 100, 200, 500, 1000],
        jackpot: 5000,
        jackpotChance: 0.0005,
    },
    gold: {
        name: 'Gold',
        emoji: '🥇',
        price: 500,
        color: 'from-yellow-500 to-yellow-700',
        prizes: [0, 0, 0, 100, 250, 500, 1000, 2500, 5000],
        jackpot: 25000,
        jackpotChance: 0.0002,
    },
    diamond: {
        name: 'Diamond',
        emoji: '💎',
        price: 2500,
        color: 'from-cyan-400 to-blue-600',
        prizes: [0, 0, 500, 750, 1250, 2500, 5000, 12500, 25000],
        jackpot: 100000,
        jackpotChance: 0.0001,
    },
};

type TierKey = keyof typeof SCRATCH_TIERS;

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣', '🎰', '💰'];

interface ScratchCard {
    tier: TierKey;
    symbols: string[];
    revealed: boolean[];
    prize: number;
    isJackpot: boolean;
}

export default function ScratchPage() {
    const { user, setUser } = useAuth();
    const [selectedTier, setSelectedTier] = useState<TierKey>('bronze');
    const [card, setCard] = useState<ScratchCard | null>(null);
    const [isScratching, setIsScratching] = useState(false);
    const [revealedCount, setRevealedCount] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const tier = SCRATCH_TIERS[selectedTier];

    const buyCard = () => {
        if (!user || user.balance < tier.price) return;

        // Deduct price
        setUser({ ...user, balance: user.balance - tier.price });

        // Generate card
        const isJackpot = Math.random() < tier.jackpotChance;
        let prize = 0;
        let symbols: string[];

        if (isJackpot) {
            // Jackpot - all matching
            const jackpotSymbol = '💰';
            symbols = Array(9).fill(jackpotSymbol);
            prize = tier.jackpot;
        } else {
            // Generate random symbols
            symbols = Array(9).fill(null).map(() =>
                SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
            );

            // Check for 3 matching
            const symbolCounts = new Map<string, number>();
            symbols.forEach(s => symbolCounts.set(s, (symbolCounts.get(s) || 0) + 1));

            for (const [, count] of symbolCounts.entries()) {
                if (count >= 3) {
                    // Win! Pick a random prize
                    prize = tier.prizes[Math.floor(Math.random() * tier.prizes.length)];
                    break;
                }
            }
        }

        setCard({
            tier: selectedTier,
            symbols,
            revealed: Array(9).fill(false),
            prize,
            isJackpot,
        });
        setRevealedCount(0);

        // Initialize canvas
        setTimeout(initCanvas, 100);
    };

    const initCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Fill with scratch-off material
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#c0c0c0');
        gradient.addColorStop(0.5, '#a0a0a0');
        gradient.addColorStop(1, '#c0c0c0');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add some texture
        ctx.fillStyle = '#b0b0b0';
        for (let i = 0; i < 100; i++) {
            ctx.beginPath();
            ctx.arc(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                Math.random() * 3,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        // Add "SCRATCH HERE" text
        ctx.fillStyle = '#808080';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SCRATCH HERE!', canvas.width / 2, canvas.height / 2);
    };

    const handleScratch = (e: React.MouseEvent | React.TouchEvent) => {
        if (!card || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        let x, y;

        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        // Scale coordinates
        x = (x / rect.width) * canvas.width;
        y = (y / rect.height) * canvas.height;

        // Erase in a circle
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.fill();

        // Check scratch progress
        checkScratchProgress();
    };

    const checkScratchProgress = () => {
        const canvas = canvasRef.current;
        if (!canvas || !card) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let clearedPixels = 0;

        for (let i = 3; i < imageData.data.length; i += 4) {
            if (imageData.data[i] === 0) clearedPixels++;
        }

        const totalPixels = (canvas.width * canvas.height);
        const clearedPercent = clearedPixels / totalPixels;

        if (clearedPercent > 0.5 && !card.revealed.every(r => r)) {
            // Reveal all and show result
            revealAll();
        }
    };

    const revealAll = () => {
        if (!card) return;

        setCard({
            ...card,
            revealed: Array(9).fill(true),
        });

        // Clear canvas completely
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }

        // Handle win
        if (card.prize > 0 && user) {
            setUser({ ...user, balance: user.balance + card.prize });

            if (card.isJackpot) {
                confetti({
                    particleCount: 300,
                    spread: 150,
                    origin: { y: 0.5 },
                    colors: ['#ffd700', '#ff4488', '#44ffdd'],
                });
            } else {
                confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.6 },
                });
            }
        }
    };

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
                        🎟️ <span className="gradient-text">Scratch Cards</span>
                    </h1>
                    <p className="text-gray-400">Scratch to reveal your prize!</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Card Area */}
                    <div className="lg:col-span-2">
                        <div className="glass rounded-3xl p-8">
                            {!card ? (
                                /* Tier Selection */
                                <div>
                                    <h3 className="text-xl font-bold mb-6 text-center">Choose Your Card</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {(Object.keys(SCRATCH_TIERS) as TierKey[]).map((tierKey) => {
                                            const t = SCRATCH_TIERS[tierKey];
                                            return (
                                                <button
                                                    key={tierKey}
                                                    onClick={() => setSelectedTier(tierKey)}
                                                    className={`p-6 rounded-2xl border-2 transition-all ${selectedTier === tierKey
                                                        ? 'border-casino-gold shadow-neon-gold'
                                                        : 'border-gray-700 hover:border-gray-500'
                                                        }`}
                                                >
                                                    <span className="text-4xl block mb-2">{t.emoji}</span>
                                                    <p className="font-bold text-lg">{t.name}</p>
                                                    <p className="text-casino-gold">${t.price}</p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Jackpot: ${t.jackpot.toLocaleString()}
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <motion.button
                                        onClick={buyCard}
                                        disabled={!user || (user?.balance || 0) < tier.price}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full mt-8 py-4 rounded-2xl font-display font-bold text-xl bg-gradient-to-r from-casino-accent to-casino-purple hover:shadow-neon-pink disabled:opacity-50"
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            <Sparkles className="w-6 h-6" />
                                            Buy {tier.name} Card (${tier.price})
                                        </span>
                                    </motion.button>
                                </div>
                            ) : (
                                /* Active Card */
                                <div>
                                    <div className="text-center mb-4">
                                        <span className="text-2xl">{tier.emoji}</span>
                                        <p className="text-lg font-bold">{tier.name} Card</p>
                                    </div>

                                    {/* Scratch Card */}
                                    <div
                                        className={`relative w-full aspect-square max-w-md mx-auto rounded-2xl overflow-hidden bg-gradient-to-br ${tier.color}`}
                                    >
                                        {/* Symbols Grid */}
                                        <div className="absolute inset-4 grid grid-cols-3 gap-2">
                                            {card.symbols.map((symbol, i) => (
                                                <div
                                                    key={i}
                                                    className={`flex items-center justify-center text-4xl md:text-5xl bg-white/90 rounded-xl ${card.revealed[i] ? 'opacity-100' : 'opacity-0'
                                                        }`}
                                                >
                                                    {symbol}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Scratch Canvas */}
                                        <canvas
                                            ref={canvasRef}
                                            width={400}
                                            height={400}
                                            className="absolute inset-0 w-full h-full cursor-crosshair"
                                            onMouseDown={() => setIsDrawing(true)}
                                            onMouseUp={() => setIsDrawing(false)}
                                            onMouseLeave={() => setIsDrawing(false)}
                                            onMouseMove={(e) => isDrawing && handleScratch(e)}
                                            onTouchStart={() => setIsDrawing(true)}
                                            onTouchEnd={() => setIsDrawing(false)}
                                            onTouchMove={(e) => handleScratch(e)}
                                        />
                                    </div>

                                    {/* Result */}
                                    {card.revealed.every(r => r) && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`mt-6 p-6 rounded-2xl text-center ${card.prize > 0
                                                ? 'bg-gradient-to-r from-casino-gold/20 via-casino-green/20 to-casino-gold/20 border border-casino-gold/40'
                                                : 'bg-red-500/10 border border-red-500/30'
                                                }`}
                                        >
                                            {card.prize > 0 ? (
                                                <>
                                                    <p className="text-xl mb-2">
                                                        {card.isJackpot ? '🎉 JACKPOT!!! 🎉' : '🎉 You Won! 🎉'}
                                                    </p>
                                                    <p className="text-3xl font-display font-bold neon-gold">
                                                        +${card.prize.toLocaleString()}
                                                    </p>
                                                </>
                                            ) : (
                                                <p className="text-xl text-gray-400">No win. Try again!</p>
                                            )}
                                        </motion.div>
                                    )}

                                    {/* New Card Button */}
                                    {card.revealed.every(r => r) && (
                                        <motion.button
                                            onClick={() => setCard(null)}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            whileHover={{ scale: 1.02 }}
                                            className="w-full mt-4 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 transition-colors"
                                        >
                                            Buy Another Card
                                        </motion.button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info Sidebar */}
                    <div className="space-y-6">
                        {/* Current Tier Info */}
                        <div className="glass rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-4">Prize Table</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center p-2 bg-casino-gold/10 rounded-lg border border-casino-gold/30">
                                    <span className="text-casino-gold font-bold">💰 JACKPOT</span>
                                    <span className="text-casino-gold font-bold">${tier.jackpot.toLocaleString()}</span>
                                </div>
                                {[...new Set(tier.prizes.filter(p => p > 0))].sort((a, b) => b - a).map((prize, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">3 Matching</span>
                                        <span className="font-medium">${prize.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* How to Play */}
                        <div className="glass rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-4">How to Play</h3>
                            <ul className="space-y-3 text-sm text-gray-400">
                                <li className="flex items-start gap-2">
                                    <span className="text-casino-gold">1.</span>
                                    <span>Select a card tier based on price and potential prizes</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-casino-gold">2.</span>
                                    <span>Click/drag to scratch the card and reveal symbols</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-casino-gold">3.</span>
                                    <span>Match 3 symbols to win a prize!</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-casino-gold">4.</span>
                                    <span>Match 3 💰 for the JACKPOT!</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
