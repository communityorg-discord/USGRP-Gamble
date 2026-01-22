'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Settings, Info, ChevronUp, ChevronDown, RotateCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/app/providers';
import FishingReelCanvas, { FishingReelCanvasHandle } from '@/components/games/fishing/FishingReelCanvas';

interface PaylineResult {
    line: number;
    symbols: number[];
    multiplier: number;
    count: number;
}

interface SpinResponse {
    roundId: string;
    resultSymbols: number[][];
    fishCashValues: Record<string, number>;
    paylines: PaylineResult[];
    payout: number;
    linePayout: number;
    fishermanBonus: number;
    balanceAfter: number;
    signature: string;
    scatterCount: number;
    freeSpinsAwarded: number;
    freeSpinsRemaining: number;
    isFreeSpin: boolean;
}

const BET_OPTIONS = [1, 2, 5, 10, 20, 50, 100, 200, 500];

// Pre-generate stable bubble data to avoid hydration mismatches
const BUBBLE_DATA = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: (i * 7 + 3) % 100,
    xOffset: ((i * 13) % 40) - 20,
    duration: 8 + (i % 6),
    delay: (i * 0.5) % 5,
}));

export default function FishingFrenzyPage() {
    const { user, setUser } = useAuth();
    const reelCanvasRef = useRef<FishingReelCanvasHandle>(null);

    // Hydration-safe mounting state
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Game state
    const [betAmount, setBetAmount] = useState(100);
    const [isSpinning, setIsSpinning] = useState(false);
    const [lastResult, setLastResult] = useState<SpinResponse | null>(null);
    const [winningLines, setWinningLines] = useState<number[]>([]);
    const [autoPlay, setAutoPlay] = useState(false);
    const [turboMode, setTurboMode] = useState(false);

    // Free Spins state
    const [freeSpinsRemaining, setFreeSpinsRemaining] = useState(0);
    const [freeSpinsTotalWin, setFreeSpinsTotalWin] = useState(0);
    const [showFreeSpinsTrigger, setShowFreeSpinsTrigger] = useState(false);
    const [freeSpinsAwarded, setFreeSpinsAwarded] = useState(0);

    // UI state
    const [showPaytable, setShowPaytable] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // Ways counter animation
    const [waysCount, setWaysCount] = useState(15625);

    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

    // Adjust bet
    const adjustBet = (delta: number) => {
        const currentIndex = BET_OPTIONS.indexOf(betAmount);
        const newIndex = Math.max(0, Math.min(BET_OPTIONS.length - 1, currentIndex + delta));
        setBetAmount(BET_OPTIONS[newIndex]);
    };

    const spin = useCallback(async () => {
        if (isSpinning) return;
        if (!user && freeSpinsRemaining === 0) return;
        if (user && user.balance < betAmount && freeSpinsRemaining === 0) return;
        if (reelCanvasRef.current?.isSpinning()) return;

        setIsSpinning(true);
        setLastResult(null);
        setWinningLines([]);

        // Animate ways counter
        const waysInterval = setInterval(() => {
            setWaysCount(Math.floor(Math.random() * 15000) + 500);
        }, 50);

        try {
            const token = localStorage.getItem('token');

            const response = await fetch('/api/fishing/spin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    betAmount,
                    turboMode,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Spin error:', error);
                setIsSpinning(false);
                clearInterval(waysInterval);
                return;
            }

            const result: SpinResponse = await response.json();

            reelCanvasRef.current?.spin(result.resultSymbols, result.fishCashValues, turboMode, () => {
                clearInterval(waysInterval);
                setWaysCount(15625);
                setLastResult(result);
                setWinningLines(result.paylines.map(p => p.line));

                if (user) {
                    setUser({ ...user, balance: result.balanceAfter });
                }

                // Free spins
                setFreeSpinsRemaining(result.freeSpinsRemaining);
                if (result.freeSpinsAwarded > 0) {
                    setFreeSpinsAwarded(result.freeSpinsAwarded);
                    setShowFreeSpinsTrigger(true);
                    setTimeout(() => setShowFreeSpinsTrigger(false), 3000);
                }

                if (result.isFreeSpin) {
                    setFreeSpinsTotalWin(prev => prev + result.payout);
                }

                // Win effects
                if (result.payout > 0) {
                    if (result.payout >= betAmount * 50 || result.freeSpinsAwarded >= 10) {
                        confetti({
                            particleCount: 400,
                            spread: 140,
                            origin: { y: 0.5 },
                            colors: ['#ffd700', '#00ff88', '#e94560', '#0ea5e9'],
                        });
                    } else if (result.payout >= betAmount * 10) {
                        confetti({
                            particleCount: 150,
                            spread: 90,
                            origin: { y: 0.6 },
                        });
                    }
                }

                setIsSpinning(false);

                // Auto play
                if (autoPlay && (result.freeSpinsRemaining > 0 || !result.freeSpinsAwarded)) {
                    autoPlayRef.current = setTimeout(() => {
                        spin();
                    }, turboMode ? 500 : 1000);
                }
            });
        } catch (error) {
            console.error('Spin error:', error);
            setIsSpinning(false);
            clearInterval(waysInterval);
        }
    }, [isSpinning, user, betAmount, turboMode, setUser, autoPlay, freeSpinsRemaining]);

    // Stop auto play
    const stopAutoPlay = () => {
        setAutoPlay(false);
        if (autoPlayRef.current) {
            clearTimeout(autoPlayRef.current);
        }
    };

    useEffect(() => {
        return () => {
            if (autoPlayRef.current) {
                clearTimeout(autoPlayRef.current);
            }
        };
    }, []);

    const canSpin = (!!user && user.balance >= betAmount && !isSpinning) || freeSpinsRemaining > 0;

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Underwater Background */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    background: 'linear-gradient(180deg, #0a3d62 0%, #0c2840 30%, #071a2e 70%, #030d16 100%)',
                }}
            >
                {/* Underwater light rays */}
                <div className="absolute inset-0 overflow-hidden opacity-20">
                    <div className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-cyan-300 via-transparent to-transparent rotate-12 blur-sm"></div>
                    <div className="absolute top-0 left-1/2 w-2 h-full bg-gradient-to-b from-cyan-200 via-transparent to-transparent -rotate-6 blur-sm"></div>
                    <div className="absolute top-0 right-1/4 w-1 h-full bg-gradient-to-b from-cyan-300 via-transparent to-transparent rotate-3 blur-sm"></div>
                </div>

                {/* Bubble particles - only render on client to avoid hydration issues */}
                {isMounted && (
                    <div className="absolute inset-0">
                        {BUBBLE_DATA.map((bubble) => (
                            <motion.div
                                key={bubble.id}
                                className="absolute w-2 h-2 rounded-full bg-white/20"
                                style={{ left: `${bubble.left}%`, bottom: '-10px' }}
                                animate={{
                                    y: [0, -1200],
                                    x: [0, bubble.xOffset],
                                    opacity: [0.3, 0]
                                }}
                                transition={{
                                    duration: bubble.duration,
                                    repeat: Infinity,
                                    delay: bubble.delay,
                                    ease: 'linear'
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Coral/underwater elements on sides */}
                <div className="absolute bottom-0 left-0 w-32 h-64 bg-gradient-to-t from-emerald-900/30 to-transparent rounded-tr-full"></div>
                <div className="absolute bottom-0 right-0 w-40 h-80 bg-gradient-to-t from-cyan-900/30 to-transparent rounded-tl-full"></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center py-4 px-4">

                {/* Logo/Title */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-4"
                >
                    <h1 className="text-3xl md:text-4xl font-display font-bold">
                        <span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">FISHIN&apos;</span>
                        <span className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]"> FRENZY</span>
                    </h1>
                    <p className="text-cyan-300/60 text-sm">MEGAWAYS™</p>
                </motion.div>

                {/* Ways Counter */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mb-4"
                >
                    <div className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 rounded-full px-6 py-2 border-2 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)]">
                        <motion.span
                            key={waysCount}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xl font-bold text-black tracking-wider"
                        >
                            {waysCount.toLocaleString()} MEGAWAYS™
                        </motion.span>
                    </div>
                </motion.div>

                {/* Game Container */}
                <div className="relative flex items-stretch gap-4">

                    {/* Left Control Panel */}
                    <div className="hidden md:flex flex-col items-center justify-center gap-3 p-3 rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-cyan-500/30 backdrop-blur-sm">
                        {/* Bet Up */}
                        <button
                            onClick={() => adjustBet(1)}
                            disabled={isSpinning || betAmount >= BET_OPTIONS[BET_OPTIONS.length - 1]}
                            className="w-12 h-12 rounded-xl bg-gradient-to-b from-cyan-600 to-cyan-700 flex items-center justify-center text-white shadow-lg hover:from-cyan-500 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronUp className="w-6 h-6" />
                        </button>

                        {/* Bet Display */}
                        <div className="text-center py-3 px-2 rounded-xl bg-slate-900/80 border border-cyan-500/20">
                            <div className="text-xs text-cyan-400/70 mb-1">BET</div>
                            <div className="text-xl font-bold text-white">${betAmount}</div>
                        </div>

                        {/* Bet Down */}
                        <button
                            onClick={() => adjustBet(-1)}
                            disabled={isSpinning || betAmount <= BET_OPTIONS[0]}
                            className="w-12 h-12 rounded-xl bg-gradient-to-b from-cyan-600 to-cyan-700 flex items-center justify-center text-white shadow-lg hover:from-cyan-500 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronDown className="w-6 h-6" />
                        </button>

                        {/* Menu */}
                        <button
                            onClick={() => setShowPaytable(!showPaytable)}
                            className="w-12 h-12 rounded-xl bg-gradient-to-b from-slate-600 to-slate-700 flex items-center justify-center text-white shadow-lg hover:from-slate-500 hover:to-slate-600 transition-all mt-2"
                        >
                            <Info className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Main Slot Machine Frame */}
                    <div className="relative">
                        {/* Frame Border */}
                        <div className="absolute -inset-3 md:-inset-4 rounded-2xl bg-gradient-to-b from-yellow-600 via-yellow-700 to-yellow-800 opacity-80 blur-sm"></div>
                        <div className="absolute -inset-2 md:-inset-3 rounded-xl bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-2 border-yellow-500/50"></div>

                        {/* Reel Container */}
                        <div className="relative bg-gradient-to-b from-cyan-100 via-cyan-50 to-cyan-100 rounded-lg p-1 shadow-inner">
                            <FishingReelCanvas
                                ref={reelCanvasRef}
                                winningLines={winningLines}
                                isFreeSpins={freeSpinsRemaining > 0}
                            />
                        </div>

                        {/* Free Spins Trigger Overlay */}
                        <AnimatePresence>
                            {showFreeSpinsTrigger && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 rounded-lg"
                                >
                                    <div className="text-center">
                                        <motion.div
                                            animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] }}
                                            transition={{ repeat: Infinity, duration: 0.5 }}
                                            className="text-6xl mb-4"
                                        >
                                            ⛵
                                        </motion.div>
                                        <h2 className="text-3xl font-display font-bold text-cyan-400 mb-2">
                                            FREE SPINS!
                                        </h2>
                                        <p className="text-xl text-yellow-400">
                                            {freeSpinsAwarded} Free Spins Awarded!
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Control Panel */}
                    <div className="hidden md:flex flex-col items-center justify-center gap-3 p-3 rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-cyan-500/30 backdrop-blur-sm">
                        {/* Spin Button */}
                        <motion.button
                            onClick={isSpinning ? undefined : (autoPlay ? stopAutoPlay : spin)}
                            disabled={!canSpin && !autoPlay}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all ${isSpinning
                                ? 'bg-gradient-to-b from-gray-500 to-gray-600 cursor-wait'
                                : autoPlay
                                    ? 'bg-gradient-to-b from-red-500 to-red-600 hover:from-red-400 hover:to-red-500'
                                    : 'bg-gradient-to-b from-green-500 to-green-600 hover:from-green-400 hover:to-green-500'
                                } border-4 border-white/30`}
                        >
                            {isSpinning ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                >
                                    <RotateCw className="w-8 h-8 text-white" />
                                </motion.div>
                            ) : autoPlay ? (
                                <div className="w-6 h-6 bg-white rounded-sm"></div>
                            ) : (
                                <RotateCw className="w-8 h-8 text-white" />
                            )}
                        </motion.button>

                        {/* Auto Play */}
                        <button
                            onClick={() => { setAutoPlay(!autoPlay); if (!autoPlay && !isSpinning) spin(); }}
                            disabled={isSpinning && !autoPlay}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all ${autoPlay
                                ? 'bg-gradient-to-b from-green-500 to-green-600 text-white'
                                : 'bg-gradient-to-b from-slate-600 to-slate-700 text-white hover:from-slate-500 hover:to-slate-600'
                                }`}
                        >
                            <span className="text-xs font-bold">AUTO</span>
                        </button>

                        {/* Turbo */}
                        <button
                            onClick={() => setTurboMode(!turboMode)}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all ${turboMode
                                ? 'bg-gradient-to-b from-yellow-500 to-yellow-600 text-black'
                                : 'bg-gradient-to-b from-slate-600 to-slate-700 text-white hover:from-slate-500 hover:to-slate-600'
                                }`}
                        >
                            <span className="text-xs font-bold">⚡</span>
                        </button>

                        {/* Sound */}
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className="w-12 h-12 rounded-xl bg-gradient-to-b from-slate-600 to-slate-700 flex items-center justify-center text-white shadow-lg hover:from-slate-500 hover:to-slate-600 transition-all"
                        >
                            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Bottom Panel */}
                <div className="mt-4 w-full max-w-2xl">
                    <div className="flex items-center justify-between bg-slate-900/80 backdrop-blur-sm rounded-xl px-6 py-3 border border-cyan-500/20">
                        {/* Credit */}
                        <div>
                            <div className="text-xs text-cyan-400/70 uppercase tracking-wider">Credit</div>
                            <div className="text-lg font-bold text-white">
                                ${user?.balance.toLocaleString() ?? '0'}
                            </div>
                        </div>

                        {/* Win Display */}
                        <AnimatePresence>
                            {lastResult && lastResult.payout > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-center"
                                >
                                    <div className="text-xs text-yellow-400/70 uppercase tracking-wider">Win</div>
                                    <motion.div
                                        className="text-2xl font-bold text-yellow-400"
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ repeat: 3, duration: 0.3 }}
                                    >
                                        ${lastResult.payout.toLocaleString()}
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Free Spins Counter */}
                        {freeSpinsRemaining > 0 && (
                            <div className="text-center px-4 py-1 bg-cyan-500/20 rounded-lg border border-cyan-400/40">
                                <div className="text-xs text-cyan-400 uppercase tracking-wider">Free Spins</div>
                                <div className="text-lg font-bold text-cyan-300">{freeSpinsRemaining}</div>
                            </div>
                        )}

                        {/* Total Bet */}
                        <div className="text-right">
                            <div className="text-xs text-cyan-400/70 uppercase tracking-wider">Total Bet</div>
                            <div className="text-lg font-bold text-white">${betAmount}</div>
                        </div>
                    </div>
                </div>

                {/* Mobile Controls */}
                <div className="md:hidden mt-4 flex items-center justify-center gap-4">
                    <button
                        onClick={() => adjustBet(-1)}
                        disabled={isSpinning || betAmount <= BET_OPTIONS[0]}
                        className="w-12 h-12 rounded-xl bg-cyan-600 flex items-center justify-center text-white disabled:opacity-50"
                    >
                        <ChevronDown className="w-6 h-6" />
                    </button>

                    <div className="text-center px-4">
                        <div className="text-xs text-cyan-400/70">BET</div>
                        <div className="text-xl font-bold text-white">${betAmount}</div>
                    </div>

                    <button
                        onClick={() => adjustBet(1)}
                        disabled={isSpinning || betAmount >= BET_OPTIONS[BET_OPTIONS.length - 1]}
                        className="w-12 h-12 rounded-xl bg-cyan-600 flex items-center justify-center text-white disabled:opacity-50"
                    >
                        <ChevronUp className="w-6 h-6" />
                    </button>

                    <motion.button
                        onClick={spin}
                        disabled={!canSpin}
                        whileTap={{ scale: 0.95 }}
                        className={`w-16 h-16 rounded-full flex items-center justify-center ${isSpinning ? 'bg-gray-600' : 'bg-green-500'
                            } border-4 border-white/30`}
                    >
                        {isSpinning ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                <RotateCw className="w-8 h-8 text-white" />
                            </motion.div>
                        ) : (
                            <RotateCw className="w-8 h-8 text-white" />
                        )}
                    </motion.button>
                </div>
            </div>

            {/* Paytable Modal */}
            <AnimatePresence>
                {showPaytable && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                        onClick={() => setShowPaytable(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-slate-900 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto border border-cyan-500/30"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-2xl font-bold text-cyan-400 mb-4">🎣 PAYTABLE</h2>

                            <div className="space-y-4 text-sm">
                                <div className="bg-slate-800 rounded-lg p-3">
                                    <h3 className="font-bold text-yellow-400 mb-2">👨‍🦱 FISHERMAN (WILD)</h3>
                                    <p className="text-gray-300">Substitutes all except Scatter. Reels in ALL fish values!</p>
                                </div>

                                <div className="bg-slate-800 rounded-lg p-3">
                                    <h3 className="font-bold text-green-400 mb-2">⛵ FISHING BOAT (SCATTER)</h3>
                                    <p className="text-gray-300">3+ = Free Spins (10/15/20)</p>
                                </div>

                                <div className="bg-slate-800 rounded-lg p-3">
                                    <h3 className="font-bold text-cyan-400 mb-2">🐟 FISH SYMBOLS</h3>
                                    <p className="text-gray-300">Fish show cash values (2x-100x). Collected when Fisherman appears!</p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-slate-800 rounded-lg p-2 text-center">
                                        <span className="text-lg">🦅</span> Pelican <span className="text-yellow-400">200x</span>
                                    </div>
                                    <div className="bg-slate-800 rounded-lg p-2 text-center">
                                        <span className="text-lg">🎣</span> Rod <span className="text-yellow-400">120x</span>
                                    </div>
                                    <div className="bg-slate-800 rounded-lg p-2 text-center">
                                        <span className="text-lg">🛟</span> Lifebuoy <span className="text-yellow-400">80x</span>
                                    </div>
                                    <div className="bg-slate-800 rounded-lg p-2 text-center">
                                        <span className="text-lg">🧰</span> Tackle <span className="text-yellow-400">50x</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowPaytable(false)}
                                className="w-full mt-4 py-2 rounded-lg bg-cyan-600 text-white font-bold hover:bg-cyan-500 transition-colors"
                            >
                                Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
