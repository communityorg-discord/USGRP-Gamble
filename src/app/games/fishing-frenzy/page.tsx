'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Fish } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/app/providers';
import FishingReelCanvas, { FishingReelCanvasHandle } from '@/components/games/fishing/FishingReelCanvas';
import FishingControls from '@/components/games/fishing/FishingControls';
import FishingPaytable from '@/components/games/fishing/FishingPaytable';

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

interface AutoSpinStopConditions {
    onWin: boolean;
    onBigWin: boolean;
    balanceBelow: number | null;
    profitTarget: number | null;
}

export default function FishingFrenzyPage() {
    const { user, setUser } = useAuth();
    const reelCanvasRef = useRef<FishingReelCanvasHandle>(null);

    // Game state
    const [betAmount, setBetAmount] = useState(100);
    const [isSpinning, setIsSpinning] = useState(false);
    const [lastResult, setLastResult] = useState<SpinResponse | null>(null);
    const [winningLines, setWinningLines] = useState<number[]>([]);
    const [sessionProfit, setSessionProfit] = useState(0);

    // Free Spins state
    const [freeSpinsRemaining, setFreeSpinsRemaining] = useState(0);
    const [freeSpinsTotalWin, setFreeSpinsTotalWin] = useState(0);
    const [showFreeSpinsTrigger, setShowFreeSpinsTrigger] = useState(false);
    const [freeSpinsAwarded, setFreeSpinsAwarded] = useState(0);

    // Fisherman bonus state
    const [showFishermanBonus, setShowFishermanBonus] = useState(false);
    const [fishermanBonusAmount, setFishermanBonusAmount] = useState(0);

    // Settings
    const [turboMode, setTurboMode] = useState(false);
    const [autoSpinCount, setAutoSpinCount] = useState<number | null>(null);
    const [autoSpinRemaining, setAutoSpinRemaining] = useState<number | null>(null);
    const [skipWinAnimations, setSkipWinAnimations] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [musicEnabled, setMusicEnabled] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [autoSpinStopConditions, setAutoSpinStopConditions] = useState<AutoSpinStopConditions>({
        onWin: false,
        onBigWin: false,
        balanceBelow: null,
        profitTarget: null,
    });

    const autoSpinTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const shouldStopAutoSpin = useCallback((result: SpinResponse): boolean => {
        const { onWin, onBigWin, balanceBelow, profitTarget } = autoSpinStopConditions;

        if (onWin && result.payout > 0) return true;
        if (onBigWin && result.payout >= betAmount * 10) return true;
        if (balanceBelow !== null && result.balanceAfter < balanceBelow) return true;
        if (profitTarget !== null && sessionProfit + (result.payout - (result.isFreeSpin ? 0 : betAmount)) >= profitTarget) return true;

        return false;
    }, [autoSpinStopConditions, betAmount, sessionProfit]);

    const spin = useCallback(async () => {
        if (isSpinning) return;
        if (!user && freeSpinsRemaining === 0) return;
        if (user && user.balance < betAmount && freeSpinsRemaining === 0) return;
        if (reelCanvasRef.current?.isSpinning()) return;

        setIsSpinning(true);
        setLastResult(null);
        setWinningLines([]);
        setShowFishermanBonus(false);

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
                return;
            }

            const result: SpinResponse = await response.json();

            // Start reel animation with new API response format
            reelCanvasRef.current?.spin(result.resultSymbols, result.fishCashValues, turboMode, () => {
                setLastResult(result);
                setWinningLines(result.paylines.map(p => p.line));

                // Update balance
                if (user) {
                    setUser({ ...user, balance: result.balanceAfter });
                }

                // Update session profit
                const spinCost = result.isFreeSpin ? 0 : betAmount;
                const spinProfit = result.payout - spinCost;
                setSessionProfit(prev => prev + spinProfit);

                // Update free spins
                setFreeSpinsRemaining(result.freeSpinsRemaining);
                if (result.freeSpinsAwarded > 0) {
                    setFreeSpinsAwarded(result.freeSpinsAwarded);
                    setShowFreeSpinsTrigger(true);
                    setTimeout(() => setShowFreeSpinsTrigger(false), 3000);
                }

                // Track free spins winnings
                if (result.isFreeSpin) {
                    setFreeSpinsTotalWin(prev => prev + result.payout);
                }

                // Show Fisherman bonus animation
                if (result.fishermanBonus > 0) {
                    setFishermanBonusAmount(result.fishermanBonus);
                    setShowFishermanBonus(true);
                    setTimeout(() => setShowFishermanBonus(false), 2500);
                }

                // Win effects
                if (result.payout > 0 && !skipWinAnimations) {
                    if (result.payout >= betAmount * 50 || result.freeSpinsAwarded >= 10) {
                        // Mega win
                        confetti({
                            particleCount: 400,
                            spread: 140,
                            origin: { y: 0.5 },
                            colors: ['#ffd700', '#00ff88', '#e94560', '#8b5cf6', '#06b6d4'],
                        });
                    } else if (result.payout >= betAmount * 15 || result.fishermanBonus > 0) {
                        // Big win
                        confetti({
                            particleCount: 200,
                            spread: 110,
                            origin: { y: 0.6 },
                            colors: ['#ffd700', '#00ff88'],
                        });
                    } else if (result.payout >= betAmount * 3) {
                        // Normal win
                        confetti({
                            particleCount: 80,
                            spread: 70,
                            origin: { y: 0.7 },
                        });
                    }
                }

                setIsSpinning(false);

                // Handle auto-spin
                const shouldContinue = autoSpinRemaining !== null && (autoSpinRemaining > 1 || autoSpinRemaining === Infinity);
                const hasMoreFreeSpins = result.freeSpinsRemaining > 0;

                if (shouldContinue || hasMoreFreeSpins) {
                    if (shouldStopAutoSpin(result) && !hasMoreFreeSpins) {
                        setAutoSpinRemaining(null);
                        setAutoSpinCount(null);
                    } else {
                        if (autoSpinRemaining !== null && autoSpinRemaining !== Infinity) {
                            setAutoSpinRemaining(autoSpinRemaining - 1);
                        }

                        autoSpinTimeoutRef.current = setTimeout(() => {
                            spin();
                        }, turboMode ? 400 : 800);
                    }
                } else if (autoSpinRemaining !== null) {
                    setAutoSpinRemaining(null);
                    setAutoSpinCount(null);
                }
            });
        } catch (error) {
            console.error('Spin error:', error);
            setIsSpinning(false);
        }
    }, [isSpinning, user, betAmount, turboMode, setUser, skipWinAnimations, autoSpinRemaining, shouldStopAutoSpin, freeSpinsRemaining]);

    const handleSpin = useCallback(() => {
        if (autoSpinCount !== null && autoSpinRemaining === null) {
            setAutoSpinRemaining(autoSpinCount);
        }
        spin();
    }, [autoSpinCount, autoSpinRemaining, spin]);

    const handleAutoSpinChange = useCallback((count: number | null) => {
        setAutoSpinCount(count);
        setAutoSpinRemaining(null);
        if (autoSpinTimeoutRef.current) {
            clearTimeout(autoSpinTimeoutRef.current);
        }
    }, []);

    useEffect(() => {
        return () => {
            if (autoSpinTimeoutRef.current) {
                clearTimeout(autoSpinTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (autoSpinRemaining !== null && autoSpinTimeoutRef.current) {
            clearTimeout(autoSpinTimeoutRef.current);
            setAutoSpinRemaining(null);
            setAutoSpinCount(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [betAmount]);

    const canSpin = (!!user && user.balance >= betAmount && !isSpinning) || freeSpinsRemaining > 0;

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
                        🎣 <span className="gradient-text">Fishin&apos; Frenzy</span>
                    </h1>
                    <p className="text-gray-400">Cast your line and reel in the big wins!</p>
                </div>

                {/* Free Spins & Session Stats */}
                <div className="flex justify-center gap-4 mb-6 flex-wrap">
                    {freeSpinsRemaining > 0 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="glass rounded-xl px-5 py-3 text-center border-2 border-casino-green"
                        >
                            <p className="text-xs text-casino-green font-bold">🎣 FREE SPINS</p>
                            <p className="text-2xl font-bold text-casino-green">{freeSpinsRemaining}</p>
                            {freeSpinsTotalWin > 0 && (
                                <p className="text-xs text-gray-400">Won: ${freeSpinsTotalWin.toLocaleString()}</p>
                            )}
                        </motion.div>
                    )}
                    <div className="glass rounded-xl px-4 py-2 text-center">
                        <p className="text-xs text-gray-400">Session Profit</p>
                        <p className={`text-lg font-bold ${sessionProfit >= 0 ? 'text-casino-green' : 'text-red-400'}`}>
                            {sessionProfit >= 0 ? '+' : ''}${sessionProfit.toLocaleString()}
                        </p>
                    </div>
                    {autoSpinRemaining !== null && (
                        <div className="glass rounded-xl px-4 py-2 text-center border border-casino-accent/30">
                            <p className="text-xs text-gray-400">Auto Spins</p>
                            <p className="text-lg font-bold text-casino-accent">
                                {autoSpinRemaining === Infinity ? '∞' : autoSpinRemaining}
                            </p>
                        </div>
                    )}
                </div>

                {/* Slot Machine */}
                <div className="glass rounded-3xl p-6 md:p-8 mb-8 border border-white/10 relative overflow-hidden">
                    {/* Free Spins Trigger Overlay */}
                    <AnimatePresence>
                        {showFreeSpinsTrigger && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute inset-0 z-20 flex items-center justify-center bg-black/80"
                            >
                                <div className="text-center">
                                    <motion.div
                                        animate={{ rotate: [0, -10, 10, -10, 0] }}
                                        transition={{ repeat: Infinity, duration: 0.5 }}
                                        className="text-6xl mb-4"
                                    >
                                        ⛵
                                    </motion.div>
                                    <h2 className="text-4xl font-display font-bold text-casino-green mb-2">
                                        FREE SPINS!
                                    </h2>
                                    <p className="text-2xl text-casino-gold">
                                        {freeSpinsAwarded} Free Spins Awarded!
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Fisherman Bonus Overlay */}
                    <AnimatePresence>
                        {showFishermanBonus && (
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -50 }}
                                className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-gradient-to-r from-casino-gold/90 to-yellow-500/90 px-6 py-3 rounded-xl shadow-neon-gold"
                            >
                                <div className="flex items-center gap-3">
                                    <Fish className="w-8 h-8 text-white animate-bounce" />
                                    <div>
                                        <p className="text-sm font-bold text-white/80">FISHERMAN BONUS!</p>
                                        <p className="text-2xl font-display font-bold text-white">
                                            +${fishermanBonusAmount.toLocaleString()}
                                        </p>
                                    </div>
                                    <Fish className="w-8 h-8 text-white animate-bounce" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Reels */}
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <FishingReelCanvas
                                ref={reelCanvasRef}
                                winningLines={winningLines}
                                isFreeSpins={freeSpinsRemaining > 0}
                            />
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-blue-500/5 via-transparent to-blue-900/10 rounded-xl" />
                        </div>
                    </div>

                    {/* Win Display */}
                    <AnimatePresence>
                        {lastResult && lastResult.payout > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="text-center py-4 rounded-xl mb-6 bg-gradient-to-r from-casino-gold/20 via-casino-green/20 to-casino-gold/20 border border-casino-gold/40"
                            >
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Trophy className="w-6 h-6 text-casino-gold" />
                                    <span className="text-xl text-casino-gold">
                                        {lastResult.payout >= betAmount * 50 ? '🎉 MEGA WIN! 🎉' :
                                            lastResult.payout >= betAmount * 15 ? '🎊 BIG WIN! 🎊' :
                                                '✨ YOU WIN! ✨'}
                                    </span>
                                    <Trophy className="w-6 h-6 text-casino-gold" />
                                </div>
                                <p className="text-3xl font-display font-bold neon-gold">
                                    +${lastResult.payout.toLocaleString()}
                                </p>
                                <div className="flex justify-center gap-4 mt-2 text-sm text-gray-400">
                                    {lastResult.linePayout > 0 && (
                                        <span>Lines: ${lastResult.linePayout.toLocaleString()}</span>
                                    )}
                                    {lastResult.fishermanBonus > 0 && (
                                        <span className="text-casino-gold">
                                            <Zap className="w-3 h-3 inline" /> Fisherman: ${lastResult.fishermanBonus.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* No Win Display */}
                    <AnimatePresence>
                        {lastResult && lastResult.payout === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center py-3 rounded-xl mb-6 bg-white/5"
                            >
                                <p className="text-gray-400">No catch this time. Try again!</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Controls */}
                    <FishingControls
                        betAmount={betAmount}
                        onBetChange={setBetAmount}
                        turboMode={turboMode}
                        onTurboToggle={() => setTurboMode(!turboMode)}
                        autoSpinCount={autoSpinCount}
                        onAutoSpinChange={handleAutoSpinChange}
                        skipWinAnimations={skipWinAnimations}
                        onSkipWinAnimationsToggle={() => setSkipWinAnimations(!skipWinAnimations)}
                        soundEnabled={soundEnabled}
                        musicEnabled={musicEnabled}
                        onSoundToggle={() => setSoundEnabled(!soundEnabled)}
                        onMusicToggle={() => setMusicEnabled(!musicEnabled)}
                        isSpinning={isSpinning}
                        onSpin={handleSpin}
                        canSpin={canSpin}
                        showSettings={showSettings}
                        onSettingsToggle={() => setShowSettings(!showSettings)}
                        autoSpinStopConditions={autoSpinStopConditions}
                        onAutoSpinStopConditionsChange={setAutoSpinStopConditions}
                        isFreeSpins={freeSpinsRemaining > 0}
                    />
                </div>

                {/* Game Info */}
                <div className="glass rounded-2xl p-6 mb-6">
                    <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                        <Fish className="w-5 h-5 text-casino-gold" />
                        How to Play
                    </h2>
                    <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-300">
                        <div className="bg-white/5 rounded-xl p-4">
                            <div className="text-2xl mb-2">👨‍🦱</div>
                            <h3 className="font-bold text-casino-gold mb-1">Fisherman Wild</h3>
                            <p>Substitutes for all symbols except Scatter. When it lands, it reels in all Fish cash values!</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                            <div className="text-2xl mb-2">⛵</div>
                            <h3 className="font-bold text-casino-green mb-1">Scatter Free Spins</h3>
                            <p>3+ Scatter symbols trigger Free Spins! 3=10, 4=15, 5=20 free games.</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                            <div className="text-2xl mb-2">🐟</div>
                            <h3 className="font-bold text-blue-400 mb-1">Fish Cash Values</h3>
                            <p>Fish symbols have cash multipliers. When Fisherman lands, collect all fish values!</p>
                        </div>
                    </div>
                </div>

                {/* Paytable */}
                <FishingPaytable />
            </div>
        </div>
    );
}
