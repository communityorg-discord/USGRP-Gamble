'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Frown } from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { useAuth } from '@/app/providers';
import DealCaseGrid from '@/components/games/deal/DealCaseGrid';
import DealBankerPanel from '@/components/games/deal/DealBankerPanel';
import DealValueBoard from '@/components/games/deal/DealValueBoard';
import DealSettings from '@/components/games/deal/DealSettings';
import type {
    DealDifficulty,
    BankerPersonality,
    DealStartResponse,
    DealOpenCaseResponse,
    DealOfferResponse,
    DealDecisionResponse,
    DealStateResponse,
} from '@/lib/types';

// Base values for each difficulty (scaled by buy-in / 1000)
const BASE_VALUES = {
    casual: [0.01, 1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500],
    standard: [0.01, 1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500, 750, 1000, 2500, 5000, 7500, 10000],
    highroller: [0.01, 1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500, 750, 1000, 2500, 5000, 7500, 10000, 25000, 50000, 75000, 100000, 200000, 500000, 750000, 1000000],
};

type GamePhase = 'setup' | 'opening' | 'offer' | 'decision' | 'completed';

interface GameResult {
    won: boolean;
    payout: number;
    decision: 'deal' | 'open_case';
    playerCaseValue?: number;
    acceptedOffer?: number;
}

export default function DealOrNoDealPage() {
    const { user, setUser } = useAuth();

    // Setup state
    const [buyIn, setBuyIn] = useState(1000);
    const [difficulty, setDifficulty] = useState<DealDifficulty>('standard');
    const [bankerPersonality, setBankerPersonality] = useState<BankerPersonality>('fair');

    // Game state
    const [gamePhase, setGamePhase] = useState<GamePhase>('setup');
    const [roundId, setRoundId] = useState<string | null>(null);
    const [playerCase, setPlayerCase] = useState<number>(0);
    const [openedCases, setOpenedCases] = useState<{ caseNumber: number; value: number }[]>([]);
    const [casesToOpenThisRound, setCasesToOpenThisRound] = useState(0);
    const [casesOpenedThisRound, setCasesOpenedThisRound] = useState(0);
    const [currentRound, setCurrentRound] = useState(1);
    const [totalCases, setTotalCases] = useState(0);

    // Banker offer state
    const [bankerOffer, setBankerOffer] = useState<number | null>(null);
    const [expectedValue, setExpectedValue] = useState(0);
    const [offerPercentage, setOfferPercentage] = useState(0);
    const [isCalculatingOffer, setIsCalculatingOffer] = useState(false);

    // UI state
    const [isStarting, setIsStarting] = useState(false);
    const [isOpening, setIsOpening] = useState(false);
    const [openingCase, setOpeningCase] = useState<number | null>(null);
    const [gameResult, setGameResult] = useState<GameResult | null>(null);

    // Get token helper
    const getToken = () => localStorage.getItem('token');

    // Check for existing game on mount
    useEffect(() => {
        const checkExistingGame = async () => {
            try {
                const response = await fetch('/api/deal/state', {
                    headers: { 'Authorization': `Bearer ${getToken()}` },
                });

                if (response.ok) {
                    const state: DealStateResponse = await response.json();
                    // Restore game state
                    setRoundId(state.roundId);
                    setPlayerCase(state.playerCase);
                    setOpenedCases(state.openedCases);
                    setCasesToOpenThisRound(state.casesToOpenThisRound);
                    setCurrentRound(state.currentRound);
                    setDifficulty(state.difficulty);
                    setBankerPersonality(state.bankerPersonality);
                    setBuyIn(state.buyIn);
                    setTotalCases(BASE_VALUES[state.difficulty].length);
                    setBankerOffer(state.bankerOffer);

                    // Calculate cases opened this round
                    // This is approximate - server tracks the real state
                    setCasesOpenedThisRound(0);

                    if (state.gamePhase === 'offer' || state.gamePhase === 'decision') {
                        setGamePhase('decision');
                        // Fetch the current offer
                        fetchBankerOffer(state.roundId);
                    } else {
                        setGamePhase('opening');
                    }
                }
            } catch {
                // No existing game, stay in setup
            }
        };

        if (user) {
            checkExistingGame();
        }
    }, [user]);

    // Start new game
    const startGame = async () => {
        if (!user || user.balance < buyIn) return;

        setIsStarting(true);
        try {
            const response = await fetch('/api/deal/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ buyIn, difficulty, bankerPersonality }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Start game error:', error);
                return;
            }

            const data: DealStartResponse = await response.json();

            setRoundId(data.roundId);
            setPlayerCase(data.playerCase);
            setTotalCases(data.caseCount);
            setCasesToOpenThisRound(data.casesToOpenThisRound);
            setCasesOpenedThisRound(0);
            setCurrentRound(1);
            setOpenedCases([]);
            setBankerOffer(null);
            setGamePhase('opening');
            setGameResult(null);

            // Update balance
            setUser({ ...user, balance: data.balanceAfter });
        } catch (error) {
            console.error('Start game error:', error);
        } finally {
            setIsStarting(false);
        }
    };

    // Open a case
    const openCase = async (caseNumber: number) => {
        if (!roundId || isOpening || gamePhase !== 'opening') return;

        setIsOpening(true);
        setOpeningCase(caseNumber);

        try {
            const response = await fetch('/api/deal/open-case', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ roundId, caseNumber }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Open case error:', error);
                return;
            }

            const data: DealOpenCaseResponse = await response.json();

            // Animate case opening
            await new Promise(resolve => setTimeout(resolve, 350)); // Match animation duration

            setOpenedCases(prev => [...prev, { caseNumber, value: data.revealedValue }]);
            setCasesOpenedThisRound(prev => prev + 1);

            // Check if ready for banker offer
            if (data.readyForOffer) {
                setGamePhase('decision');
                fetchBankerOffer(roundId);
            }
        } catch (error) {
            console.error('Open case error:', error);
        } finally {
            setIsOpening(false);
            setOpeningCase(null);
        }
    };

    // Fetch banker offer
    const fetchBankerOffer = async (gameRoundId: string) => {
        setIsCalculatingOffer(true);
        setBankerOffer(null);

        try {
            const response = await fetch('/api/deal/offer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ roundId: gameRoundId }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Offer error:', error);
                return;
            }

            const data: DealOfferResponse = await response.json();

            // Delay to show suspense animation
            await new Promise(resolve => setTimeout(resolve, 500));

            setBankerOffer(data.bankerOffer);
            setExpectedValue(data.expectedValue);
            setOfferPercentage(data.offerPercentage);
            setCurrentRound(data.currentRound);
        } catch (error) {
            console.error('Offer error:', error);
        } finally {
            setIsCalculatingOffer(false);
        }
    };

    // Handle deal decision
    const handleDeal = async () => {
        if (!roundId) return;

        try {
            const response = await fetch('/api/deal/decision', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ roundId, decision: 'deal' }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Decision error:', error);
                return;
            }

            const data: DealDecisionResponse = await response.json();

            if (data.gameComplete && user) {
                setUser({ ...user, balance: data.balanceAfter! });
                setGameResult({
                    won: data.acceptedOffer! > buyIn,
                    payout: data.acceptedOffer!,
                    decision: 'deal',
                    acceptedOffer: data.acceptedOffer,
                    playerCaseValue: data.playerCaseValue,
                });
                setGamePhase('completed');

                // Celebration
                if (data.acceptedOffer! > buyIn) {
                    confetti({
                        particleCount: 150,
                        spread: 100,
                        origin: { y: 0.6 },
                        colors: ['#ffd700', '#00ff88', '#e94560'],
                    });
                }
            }
        } catch (error) {
            console.error('Decision error:', error);
        }
    };

    // Handle no deal decision
    const handleNoDeal = async () => {
        if (!roundId) return;

        try {
            const response = await fetch('/api/deal/decision', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ roundId, decision: 'no_deal' }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Decision error:', error);
                return;
            }

            const data: DealDecisionResponse = await response.json();

            if (!data.gameComplete) {
                setCasesToOpenThisRound(data.casesToOpenNextRound || 1);
                setCasesOpenedThisRound(0);
                setBankerOffer(null);
                setGamePhase('opening');
            }
        } catch (error) {
            console.error('Decision error:', error);
        }
    };

    // Handle open final case
    const handleOpenFinalCase = async () => {
        if (!roundId) return;

        try {
            const response = await fetch('/api/deal/decision', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ roundId, decision: 'open_case' }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Decision error:', error);
                return;
            }

            const data: DealDecisionResponse = await response.json();

            if (data.gameComplete && user) {
                setUser({ ...user, balance: data.balanceAfter! });
                setGameResult({
                    won: data.playerCaseValue! > buyIn,
                    payout: data.playerCaseValue!,
                    decision: 'open_case',
                    playerCaseValue: data.playerCaseValue,
                });
                setGamePhase('completed');

                // Celebration based on win
                if (data.playerCaseValue! > buyIn * 5) {
                    confetti({
                        particleCount: 200,
                        spread: 120,
                        origin: { y: 0.5 },
                        colors: ['#ffd700', '#00ff88', '#e94560', '#8b5cf6'],
                    });
                } else if (data.playerCaseValue! > buyIn) {
                    confetti({
                        particleCount: 100,
                        spread: 80,
                        origin: { y: 0.6 },
                    });
                }
            }
        } catch (error) {
            console.error('Decision error:', error);
        }
    };

    // Calculate if this is the final round
    const remainingCases = totalCases - openedCases.length - 1; // -1 for player's case
    const isFinalRound = remainingCases <= 1;

    // Reset game
    const resetGame = () => {
        setGamePhase('setup');
        setRoundId(null);
        setPlayerCase(0);
        setOpenedCases([]);
        setBankerOffer(null);
        setGameResult(null);
    };

    const canOpenCase = gamePhase === 'opening' && casesOpenedThisRound < casesToOpenThisRound;
    const canDecide = gamePhase === 'decision' && bankerOffer !== null && !isCalculatingOffer;
    const canStart = !!user && user.balance >= buyIn;

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
                        💼 <span className="gradient-text">Deal or No Deal</span>
                    </h1>
                    <p className="text-gray-400">Will you take the banker's offer?</p>
                </div>

                {/* Setup Phase */}
                {gamePhase === 'setup' && (
                    <div className="max-w-2xl mx-auto">
                        <DealSettings
                            buyIn={buyIn}
                            onBuyInChange={setBuyIn}
                            difficulty={difficulty}
                            onDifficultyChange={setDifficulty}
                            bankerPersonality={bankerPersonality}
                            onBankerPersonalityChange={setBankerPersonality}
                            onStartGame={startGame}
                            canStart={canStart}
                            isStarting={isStarting}
                        />
                    </div>
                )}

                {/* Active Game */}
                {(gamePhase === 'opening' || gamePhase === 'decision') && (
                    <>
                        {/* Game Info Bar */}
                        <div className="flex justify-between items-center mb-6 glass rounded-xl px-4 py-3">
                            <div className="flex items-center gap-4">
                                <div>
                                    <span className="text-xs text-gray-400">Buy-In</span>
                                    <p className="font-bold">${buyIn.toLocaleString()}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400">Your Case</span>
                                    <p className="font-bold text-casino-gold">#{playerCase}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-gray-400">Round {currentRound}</span>
                                {gamePhase === 'opening' && (
                                    <p className="font-bold text-casino-accent">
                                        Open {casesToOpenThisRound - casesOpenedThisRound} more case{casesToOpenThisRound - casesOpenedThisRound !== 1 ? 's' : ''}
                                    </p>
                                )}
                                {gamePhase === 'decision' && (
                                    <p className="font-bold text-casino-green">Banker Calling...</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Value Board */}
                            <div className="lg:col-span-1 order-2 lg:order-1">
                                <DealValueBoard
                                    allValues={BASE_VALUES[difficulty]}
                                    eliminatedValues={openedCases.map(c => c.value)}
                                    buyIn={buyIn}
                                />
                            </div>

                            {/* Case Grid & Banker Panel */}
                            <div className="lg:col-span-2 order-1 lg:order-2 space-y-6">
                                {/* Case Grid */}
                                <div className="glass rounded-2xl p-6">
                                    <DealCaseGrid
                                        totalCases={totalCases}
                                        playerCase={playerCase}
                                        openedCases={openedCases}
                                        onOpenCase={openCase}
                                        canOpen={canOpenCase}
                                        isOpening={isOpening}
                                        openingCase={openingCase}
                                    />
                                </div>

                                {/* Banker Panel */}
                                <DealBankerPanel
                                    bankerOffer={bankerOffer}
                                    expectedValue={expectedValue}
                                    offerPercentage={offerPercentage}
                                    isCalculating={isCalculatingOffer}
                                    onDeal={handleDeal}
                                    onNoDeal={handleNoDeal}
                                    canDecide={canDecide}
                                    currentRound={currentRound}
                                    isFinalRound={isFinalRound}
                                    onOpenFinalCase={handleOpenFinalCase}
                                />
                            </div>
                        </div>
                    </>
                )}

                {/* Game Complete */}
                <AnimatePresence>
                    {gamePhase === 'completed' && gameResult && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-lg mx-auto"
                        >
                            <div className={`glass rounded-3xl p-8 text-center border-2 ${gameResult.won ? 'border-casino-gold/50' : 'border-gray-600/50'
                                }`}>
                                {gameResult.won ? (
                                    <>
                                        <Trophy className="w-16 h-16 text-casino-gold mx-auto mb-4" />
                                        <h2 className="text-3xl font-display font-bold mb-2 neon-gold">
                                            🎉 YOU WIN! 🎉
                                        </h2>
                                    </>
                                ) : (
                                    <>
                                        <Frown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <h2 className="text-3xl font-display font-bold mb-2 text-gray-400">
                                            Better Luck Next Time
                                        </h2>
                                    </>
                                )}

                                <div className="space-y-4 my-6">
                                    <div>
                                        <p className="text-sm text-gray-400">
                                            {gameResult.decision === 'deal' ? 'You accepted the offer' : 'You opened your case'}
                                        </p>
                                        <p className="text-4xl font-display font-bold neon-gold">
                                            ${gameResult.payout.toLocaleString()}
                                        </p>
                                    </div>

                                    {gameResult.decision === 'deal' && gameResult.playerCaseValue !== undefined && (
                                        <div className="p-4 rounded-xl bg-white/5">
                                            <p className="text-sm text-gray-400 mb-1">Your case contained</p>
                                            <p className={`text-2xl font-bold ${gameResult.playerCaseValue > gameResult.payout
                                                    ? 'text-red-400'
                                                    : 'text-casino-green'
                                                }`}>
                                                ${gameResult.playerCaseValue.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {gameResult.playerCaseValue > gameResult.payout
                                                    ? 'You could have won more!'
                                                    : 'Good call taking the deal!'}
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-sm px-4">
                                        <div>
                                            <span className="text-gray-400">Buy-In:</span>
                                            <span className="ml-2">${buyIn.toLocaleString()}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Profit:</span>
                                            <span className={`ml-2 font-bold ${gameResult.payout - buyIn >= 0 ? 'text-casino-green' : 'text-red-400'
                                                }`}>
                                                {gameResult.payout - buyIn >= 0 ? '+' : ''}
                                                ${(gameResult.payout - buyIn).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 justify-center">
                                    <motion.button
                                        onClick={resetGame}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-casino-accent to-casino-purple hover:shadow-neon-pink transition-all"
                                    >
                                        Play Again
                                    </motion.button>
                                    <Link href="/games">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="px-8 py-3 rounded-xl font-bold glass hover:bg-white/10 transition-all flex items-center gap-2"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            All Games
                                        </motion.button>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
