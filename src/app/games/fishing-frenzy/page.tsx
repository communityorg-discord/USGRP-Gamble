'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/app/providers';
import FishingReelCanvas, { FishingReelCanvasHandle } from '@/components/games/fishing/FishingReelCanvas';
import FishingControls from '@/components/games/fishing/FishingControls';
import FishingPaytable from '@/components/games/fishing/FishingPaytable';
import type { FishingSpinResponse } from '@/lib/types';

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
    const [lastResult, setLastResult] = useState<FishingSpinResponse | null>(null);
    const [winningLines, setWinningLines] = useState<number[]>([]);
    const [sessionProfit, setSessionProfit] = useState(0);

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

    // Refs for auto-spin
    const autoSpinTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Check if auto-spin should stop
    const shouldStopAutoSpin = useCallback((result: FishingSpinResponse): boolean => {
        const { onWin, onBigWin, balanceBelow, profitTarget } = autoSpinStopConditions;

        if (onWin && result.payout > 0) return true;
        if (onBigWin && result.payout >= betAmount * 10) return true;
        if (balanceBelow !== null && result.balanceAfter < balanceBelow) return true;
        if (profitTarget !== null && sessionProfit + (result.payout - betAmount) >= profitTarget) return true;

        return false;
    }, [autoSpinStopConditions, betAmount, sessionProfit]);

    // Spin function
    const spin = useCallback(async () => {
        if (isSpinning || !user || user.balance < betAmount) return;
        if (reelCanvasRef.current?.isSpinning()) return;

        setIsSpinning(true);
        setLastResult(null);
        setWinningLines([]);

        try {
            // Get token from localStorage
            const token = localStorage.getItem('token');

            // Call the API
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

            const result: FishingSpinResponse = await response.json();

            // Start the reel animation with server result
            reelCanvasRef.current?.spin(result.resultSymbols, turboMode, () => {
                // Animation complete callback
                setLastResult(result);
                setWinningLines(result.paylines.map(p => p.line));

                // Update balance
                setUser({ ...user, balance: result.balanceAfter });

                // Update session profit
                const spinProfit = result.payout - betAmount;
                setSessionProfit(prev => prev + spinProfit);

                // Win effects
                if (result.payout > 0 && !skipWinAnimations) {
                    if (result.payout >= betAmount * 20) {
                        // Mega win
                        confetti({
                            particleCount: 300,
                            spread: 120,
                            origin: { y: 0.5 },
                            colors: ['#ffd700', '#00ff88', '#e94560', '#8b5cf6'],
                        });
                    } else if (result.payout >= betAmount * 10) {
                        // Big win
                        confetti({
                            particleCount: 150,
                            spread: 100,
                            origin: { y: 0.6 },
                            colors: ['#ffd700', '#00ff88'],
                        });
                    } else {
                        // Normal win
                        confetti({
                            particleCount: 50,
                            spread: 60,
                            origin: { y: 0.7 },
                        });
                    }
                }

                setIsSpinning(false);

                // Handle auto-spin
                if (autoSpinRemaining !== null) {
                    if (shouldStopAutoSpin(result)) {
                        setAutoSpinRemaining(null);
                        setAutoSpinCount(null);
                    } else if (autoSpinRemaining > 1 || autoSpinRemaining === Infinity) {
                        const nextRemaining = autoSpinRemaining === Infinity ? Infinity : autoSpinRemaining - 1;
                        setAutoSpinRemaining(nextRemaining);

                        // Queue next spin
                        autoSpinTimeoutRef.current = setTimeout(() => {
                            spin();
                        }, turboMode ? 500 : 1000);
                    } else {
                        setAutoSpinRemaining(null);
                        setAutoSpinCount(null);
                    }
                }
            });
        } catch (error) {
            console.error('Spin error:', error);
            setIsSpinning(false);
        }
    }, [isSpinning, user, betAmount, turboMode, setUser, skipWinAnimations, autoSpinRemaining, shouldStopAutoSpin]);

    // Handle spin button click
    const handleSpin = useCallback(() => {
        if (autoSpinCount !== null && autoSpinRemaining === null) {
            // Start auto-spin
            setAutoSpinRemaining(autoSpinCount);
        }
        spin();
    }, [autoSpinCount, autoSpinRemaining, spin]);

    // Handle auto-spin count change
    const handleAutoSpinChange = useCallback((count: number | null) => {
        setAutoSpinCount(count);
        setAutoSpinRemaining(null);

        // Clear any pending auto-spins
        if (autoSpinTimeoutRef.current) {
            clearTimeout(autoSpinTimeoutRef.current);
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (autoSpinTimeoutRef.current) {
                clearTimeout(autoSpinTimeoutRef.current);
            }
        };
    }, []);

    // Stop auto-spin when settings change
    useEffect(() => {
        if (autoSpinRemaining !== null && autoSpinTimeoutRef.current) {
            clearTimeout(autoSpinTimeoutRef.current);
            setAutoSpinRemaining(null);
            setAutoSpinCount(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [betAmount]);

    const canSpin = !!user && user.balance >= betAmount && !isSpinning;

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
                        🎣 <span className="gradient-text">Fishing Frenzy</span>
                    </h1>
                    <p className="text-gray-400">Cast your line and reel in the big wins!</p>
                </div>

                {/* Session Stats */}
                <div className="flex justify-center gap-6 mb-6">
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
                <div className="glass rounded-3xl p-8 mb-8 border border-white/10">
                    {/* Reels */}
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <FishingReelCanvas
                                ref={reelCanvasRef}
                                winningLines={winningLines}
                            />

                            {/* Underwater effect overlay */}
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-blue-500/5 via-transparent to-blue-900/10 rounded-2xl" />
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
                                        {lastResult.payout >= betAmount * 20 ? '🎉 MEGA WIN! 🎉' :
                                            lastResult.payout >= betAmount * 10 ? '🎊 BIG WIN! 🎊' :
                                                '✨ YOU WIN! ✨'}
                                    </span>
                                    <Trophy className="w-6 h-6 text-casino-gold" />
                                </div>
                                <p className="text-3xl font-display font-bold neon-gold">
                                    +${lastResult.payout.toLocaleString()}
                                </p>
                                {lastResult.paylines.length > 0 && (
                                    <p className="text-sm text-gray-400 mt-1">
                                        {lastResult.paylines.map(p => `${p.multiplier}x`).join(' + ')} Multiplier
                                    </p>
                                )}
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
                    />
                </div>

                {/* Paytable */}
                <FishingPaytable />
            </div>
        </div>
    );
}
