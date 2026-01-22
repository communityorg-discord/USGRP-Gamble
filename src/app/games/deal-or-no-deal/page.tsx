'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCw, Sparkles, Gift, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/app/providers';
import DealCaseGrid from '@/components/games/deal/DealCaseGrid';
import DealValueBoard from '@/components/games/deal/DealValueBoard';
import DealBankerPanel from '@/components/games/deal/DealBankerPanel';
import { sounds } from '@/lib/sounds';

// Standard 18 case values
const STANDARD_VALUES = [
    0.01, 1, 5, 10, 25, 50,
    75, 100, 200, 300, 400, 500,
    750, 1000, 2500, 5000, 7500, 10000,
];

// Cases to open per round
const CASES_PER_ROUND = [6, 5, 4, 3, 2, 1, 1, 1, 1];

interface GameState {
    buyIn: number;
    cases: Record<number, number>;
    playerCase: number;
    openedCases: number[];
    currentRound: number;
    phase: 'setup' | 'selecting' | 'opening' | 'offer' | 'complete';
    offer: number | null;
    finalValue: number | null;
    acceptedOffer: boolean;
    mysteryCase: number | null;
    goldenCase: number | null;
    streakCount: number;
    bankerBonus: { type: string; description: string } | null;
    bankerType: 'computer' | 'real';
}

export default function DealOrNoDealPage() {
    const { user, setUser } = useAuth();

    const [gameState, setGameState] = useState<GameState>({
        buyIn: 1000,
        cases: {},
        playerCase: 0,
        openedCases: [],
        currentRound: 1,
        phase: 'setup',
        offer: null,
        finalValue: null,
        acceptedOffer: false,
        mysteryCase: null,
        goldenCase: null,
        streakCount: 0,
        bankerBonus: null,
        bankerType: 'computer',
    });

    const [bankerPhase, setBankerPhase] = useState<'waiting' | 'calling' | 'revealed' | 'decision'>('waiting');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Real Banker state
    const [hasRealBanker, setHasRealBanker] = useState(false);
    const [realBankerName, setRealBankerName] = useState<string | null>(null);
    const [staffOffer, setStaffOffer] = useState<{ offer: number; message?: string } | null>(null);
    const [waitingForStaff, setWaitingForStaff] = useState(false);

    // Calculate cases remaining to open this round
    const casesToOpenThisRound = CASES_PER_ROUND[Math.min(gameState.currentRound - 1, CASES_PER_ROUND.length - 1)] || 1;
    const casesOpenedThisRound = gameState.openedCases.filter(c => {
        // Track cases opened in current round
        const prevRoundCases = CASES_PER_ROUND.slice(0, gameState.currentRound - 1).reduce((a, b) => a + b, 0);
        return gameState.openedCases.indexOf(c) >= prevRoundCases;
    }).length;
    const remainingCasesToOpen = Math.max(0, casesToOpenThisRound - casesOpenedThisRound);

    // Get all values and eliminated values (with null safety)
    const allValues = gameState.cases ? Object.values(gameState.cases) : [];
    const eliminatedValues = gameState.openedCases.map(c => gameState.cases?.[c]).filter((v): v is number => v !== undefined);

    // Expected value calculation
    const remainingValues = allValues.filter((v) => {
        if (!gameState.cases) return false;
        const caseNum = Object.keys(gameState.cases).find(k => gameState.cases[parseInt(k)] === v && parseInt(k) !== gameState.playerCase);
        return caseNum && !gameState.openedCases.includes(parseInt(caseNum));
    });
    const expectedValue = remainingValues.length > 0
        ? remainingValues.reduce((a, b) => a + b, 0) / remainingValues.length
        : 0;

    // Start a new game
    const startGame = async () => {
        if (!user) return;
        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/deal/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ buyIn: gameState.buyIn }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to start game');
            }

            const data = await response.json();

            // Assign random mystery and golden cases
            const availableCases = Array.from({ length: 18 }, (_, i) => i + 1);
            const mysteryCase = availableCases[Math.floor(Math.random() * 18)];
            let goldenCase = availableCases[Math.floor(Math.random() * 18)];
            while (goldenCase === mysteryCase) {
                goldenCase = availableCases[Math.floor(Math.random() * 18)];
            }

            setGameState({
                ...gameState,
                cases: data.cases,
                playerCase: 0,
                openedCases: [],
                currentRound: 1,
                phase: 'selecting',
                offer: null,
                finalValue: null,
                acceptedOffer: false,
                mysteryCase,
                goldenCase,
                streakCount: 0,
                bankerBonus: null,
            });

            if (user) {
                setUser({ ...user, balance: data.balanceAfter });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start game');
        } finally {
            setIsLoading(false);
        }
    };

    // Select player's case
    const selectCase = (caseNumber: number) => {
        if (gameState.phase !== 'selecting') return;
        if (!gameState.cases || Object.keys(gameState.cases).length === 0) return;

        setGameState(prev => ({
            ...prev,
            playerCase: caseNumber,
            phase: 'opening',
        }));
    };

    // Open a case
    const openCase = async (caseNumber: number) => {
        if (gameState.phase !== 'opening') return;
        if (caseNumber === gameState.playerCase) return;
        if (gameState.openedCases.includes(caseNumber)) return;
        if (!gameState.cases || !gameState.cases[caseNumber]) return;

        const revealedValue = gameState.cases[caseNumber];
        const newOpenedCases = [...gameState.openedCases, caseNumber];

        // Play sound effect
        sounds.caseOpen();
        setTimeout(() => {
            if (revealedValue >= 1000) {
                sounds.revealHighValue();
            } else {
                sounds.revealLowValue();
            }
        }, 300);

        // Track low value streak
        let newStreakCount = gameState.streakCount;
        if (revealedValue <= 100) {
            newStreakCount++;
        } else {
            newStreakCount = 0;
        }

        setGameState(prev => ({
            ...prev,
            openedCases: newOpenedCases,
            streakCount: newStreakCount,
        }));

        // Check if round is complete
        const prevRoundCases = CASES_PER_ROUND.slice(0, gameState.currentRound - 1).reduce((a, b) => a + b, 0);
        const casesThisRound = newOpenedCases.length - prevRoundCases;
        const targetCases = CASES_PER_ROUND[gameState.currentRound - 1] || 1;

        if (casesThisRound >= targetCases) {
            // Round complete, get offer
            getBankerOffer();
        }
    };

    // Get banker's offer
    const getBankerOffer = async () => {
        setBankerPhase('calling');
        sounds.phoneRing();

        // Simulate banker call delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            // If Real Banker mode, poll for staff offer
            if (gameState.bankerType === 'real' && user) {
                setWaitingForStaff(true);

                // Poll for staff offer (up to 30 seconds)
                let staffOfferData = null;
                for (let i = 0; i < 30; i++) {
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    const pollResponse = await fetch(`/api/staff/offer?playerId=${user.discordId}`);
                    const pollData = await pollResponse.json();

                    if (pollData.hasPendingOffer) {
                        staffOfferData = pollData.offer;
                        break;
                    }
                }

                setWaitingForStaff(false);

                if (staffOfferData) {
                    setStaffOffer(staffOfferData);
                    setGameState(prev => ({
                        ...prev,
                        phase: 'offer',
                        offer: staffOfferData.offer,
                        bankerBonus: staffOfferData.message
                            ? { type: 'staff_message', description: `📞 "${staffOfferData.message}"` }
                            : null,
                    }));

                    setBankerPhase('revealed');
                    sounds.offerReveal();
                    await new Promise(resolve => setTimeout(resolve, 800));
                    setBankerPhase('decision');
                    return;
                }

                // If no staff offer after timeout, fall back to computer
                setError('Staff banker timed out, using computer offer...');
            }

            // Computer banker offer
            const token = localStorage.getItem('token');
            const response = await fetch('/api/deal/offer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to get offer');
            }

            const data = await response.json();

            // Check for streak bonus (+10% offer)
            let adjustedOffer = data.offer;
            let bonus = null;

            if (gameState.streakCount >= 3) {
                adjustedOffer = Math.floor(data.offer * 1.1);
                bonus = { type: 'streak', description: '🔥 Streak Bonus! +10% offer for revealing 3+ low values in a row!' };
            }

            // Random banker bonus (15% chance)
            if (Math.random() < 0.15 && !bonus) {
                const bonuses = [
                    { type: 'wild_card', description: 'Swap your case with any unopened case!' },
                    { type: 'double_value', description: 'If next case is $1000+, it doubles!' },
                    { type: 'safety_net', description: 'Minimum next offer guaranteed: $500' },
                ];
                bonus = bonuses[Math.floor(Math.random() * bonuses.length)];
            }

            setGameState(prev => ({
                ...prev,
                phase: 'offer',
                offer: adjustedOffer,
                bankerBonus: bonus,
            }));

            setBankerPhase('revealed');
            sounds.offerReveal();

            // Short delay then show decision buttons
            await new Promise(resolve => setTimeout(resolve, 800));
            setBankerPhase('decision');

        } catch (err) {
            setError('Failed to get offer');
            setBankerPhase('waiting');
        }
    };

    // Accept deal
    const acceptDeal = async () => {
        setIsLoading(true);
        sounds.dealAccept();

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/deal/decision', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ decision: 'deal' }),
            });

            if (!response.ok) {
                throw new Error('Failed to process decision');
            }

            const data = await response.json();

            // Calculate final payout with multipliers
            let finalPayout = data.payout;

            // Mystery case multiplier
            if (gameState.mysteryCase && gameState.openedCases.includes(gameState.mysteryCase)) {
                const multiplier = 1 + Math.random() * 0.5; // 1x-1.5x
                finalPayout = Math.floor(finalPayout * multiplier);
            }

            setGameState(prev => ({
                ...prev,
                phase: 'complete',
                finalValue: data.playerCaseValue,
                acceptedOffer: true,
            }));

            if (user) {
                setUser({ ...user, balance: data.balanceAfter });
            }

            // Win celebration
            if (finalPayout > gameState.buyIn) {
                confetti({
                    particleCount: 150,
                    spread: 100,
                    origin: { y: 0.6 },
                    colors: ['#ffd700', '#00ff88', '#e94560'],
                });
            }

        } catch (err) {
            setError('Failed to process decision');
        } finally {
            setIsLoading(false);
        }
    };

    // Reject deal
    const rejectDeal = () => {
        sounds.noDeal();
        // Check if this is the final case
        const remainingCases = Object.keys(gameState.cases || {})
            .map(Number)
            .filter(c => c !== gameState.playerCase && !gameState.openedCases.includes(c));

        if (remainingCases.length <= 1) {
            // Final round - open the last case and reveal player's case
            endGame();
        } else {
            // Continue to next round
            setGameState(prev => ({
                ...prev,
                phase: 'opening',
                currentRound: prev.currentRound + 1,
                offer: null,
                bankerBonus: null,
            }));
            setBankerPhase('waiting');
        }
    };

    // End game (open player's case)
    const endGame = async () => {
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/deal/decision', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ decision: 'no_deal' }),
            });

            if (!response.ok) {
                throw new Error('Failed to end game');
            }

            const data = await response.json();

            // Apply golden case bonus
            let finalPayout = data.payout;
            if (gameState.goldenCase === gameState.playerCase) {
                finalPayout = Math.floor(finalPayout * 1.5);
            }

            setGameState(prev => ({
                ...prev,
                phase: 'complete',
                finalValue: data.playerCaseValue,
                acceptedOffer: false,
            }));

            if (user) {
                setUser({ ...user, balance: data.balanceAfter });
            }

            if (finalPayout > gameState.buyIn * 2) {
                confetti({
                    particleCount: 300,
                    spread: 140,
                    origin: { y: 0.5 },
                    colors: ['#ffd700', '#00ff88', '#8b5cf6'],
                });
            }

        } catch (err) {
            setError('Failed to end game');
        } finally {
            setIsLoading(false);
        }
    };

    // Format case data for grid
    const getCaseData = () => {
        return Array.from({ length: 18 }, (_, i) => {
            const caseNum = i + 1;
            return {
                caseNumber: caseNum,
                isOpened: gameState.openedCases.includes(caseNum),
                value: (gameState.openedCases.includes(caseNum) || gameState.phase === 'complete')
                    ? gameState.cases?.[caseNum]
                    : undefined,
                isPlayerCase: caseNum === gameState.playerCase,
                isMystery: caseNum === gameState.mysteryCase && !gameState.openedCases.includes(caseNum) && caseNum !== gameState.playerCase,
                isGolden: caseNum === gameState.goldenCase && !gameState.openedCases.includes(caseNum) && caseNum !== gameState.playerCase,
            };
        });
    };

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
                        💼 <span className="gradient-text">Deal or No Deal</span>
                    </h1>
                    <p className="text-gray-400">Make smart choices and beat the Banker!</p>
                </div>

                {/* Game Info Bar */}
                {gameState.phase !== 'setup' && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-xl p-3 mb-6 flex items-center justify-between text-sm"
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-gray-400">Buy-In <span className="text-casino-gold font-bold">${gameState.buyIn.toLocaleString()}</span></span>
                            {gameState.playerCase > 0 && (
                                <span className="text-gray-400">Your Case <span className="text-yellow-400 font-bold">#{gameState.playerCase}</span></span>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-400">Round <span className="text-white font-bold">{gameState.currentRound}</span></span>
                            {remainingCasesToOpen > 0 && gameState.phase === 'opening' && (
                                <span className="text-casino-accent font-bold">Open {remainingCasesToOpen} more cases</span>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 text-center">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {/* Setup Phase */}
                {gameState.phase === 'setup' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md mx-auto glass rounded-2xl p-8 text-center"
                    >
                        <div className="text-5xl mb-4">💼</div>
                        <h2 className="text-2xl font-display font-bold mb-4">Start a New Game</h2>

                        <div className="mb-6">
                            <label className="text-sm text-gray-400 block mb-2">Buy-In Amount</label>
                            <div className="flex gap-2 flex-wrap justify-center">
                                {[500, 1000, 2500, 5000, 10000].map(amount => (
                                    <button
                                        key={amount}
                                        onClick={() => setGameState(prev => ({ ...prev, buyIn: amount }))}
                                        className={`px-4 py-2 rounded-lg font-bold transition-all ${gameState.buyIn === amount
                                            ? 'bg-casino-gold text-black'
                                            : 'glass text-gray-300 hover:text-white'
                                            }`}
                                    >
                                        ${amount.toLocaleString()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Banker Type Selector */}
                        <div className="mb-6">
                            <label className="text-sm text-gray-400 block mb-2">Choose Your Banker</label>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setGameState(prev => ({ ...prev, bankerType: 'computer' }))}
                                    className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${gameState.bankerType === 'computer'
                                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                                            : 'glass text-gray-400 hover:text-white'
                                        }`}
                                >
                                    🤖 Computer
                                </button>
                                <button
                                    onClick={() => setGameState(prev => ({ ...prev, bankerType: 'real' }))}
                                    className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${gameState.bankerType === 'real'
                                            ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg'
                                            : 'glass text-gray-400 hover:text-white'
                                        }`}
                                >
                                    👤 Real Banker
                                </button>
                            </div>
                            {gameState.bankerType === 'real' && (
                                <p className="text-xs text-orange-400 mt-2">
                                    ⚠️ Requires a staff member to be online at /staff
                                </p>
                            )}
                        </div>

                        <button
                            onClick={startGame}
                            disabled={isLoading || !user || user.balance < gameState.buyIn}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-casino-gold to-yellow-500 text-black font-bold text-lg hover:shadow-neon-gold transition-shadow disabled:opacity-50"
                        >
                            {isLoading ? 'Starting...' : `Start Game - $${gameState.buyIn.toLocaleString()}`}
                        </button>

                        {user && user.balance < gameState.buyIn && (
                            <p className="text-red-400 text-sm mt-2">Insufficient balance</p>
                        )}

                        {/* Bonus Features Info */}
                        <div className="mt-6 pt-4 border-t border-white/10 text-left">
                            <p className="text-sm font-bold text-gray-400 mb-2">🎁 Bonus Features</p>
                            <div className="space-y-1 text-xs text-gray-500">
                                <p>❓ <span className="text-purple-400">Mystery Case</span> - Win multiplier bonus</p>
                                <p>✨ <span className="text-yellow-400">Golden Case</span> - 1.5x if it's yours</p>
                                <p>🔥 <span className="text-orange-400">Streak Bonus</span> - +10% offer for low reveals</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Selecting Phase */}
                {gameState.phase === 'selecting' && (
                    <div className="text-center">
                        <motion.h2
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xl font-display font-bold mb-6 text-casino-gold"
                        >
                            Choose Your Case!
                        </motion.h2>
                        <DealCaseGrid
                            cases={getCaseData()}
                            onCaseClick={selectCase}
                            disabled={false}
                            phase="selecting"
                            casesToOpen={0}
                        />
                    </div>
                )}

                {/* Main Game Layout */}
                {(gameState.phase === 'opening' || gameState.phase === 'offer' || gameState.phase === 'complete') && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Left: Value Board */}
                        <div className="lg:col-span-1">
                            <DealValueBoard
                                allValues={allValues}
                                eliminatedValues={eliminatedValues}
                            />
                        </div>

                        {/* Center: Case Grid + Banker */}
                        <div className="lg:col-span-3 space-y-6">
                            <DealCaseGrid
                                cases={getCaseData()}
                                onCaseClick={openCase}
                                disabled={gameState.phase !== 'opening' || isLoading}
                                phase={gameState.phase}
                                casesToOpen={remainingCasesToOpen}
                            />

                            <DealBankerPanel
                                offer={gameState.offer}
                                expectedValue={expectedValue}
                                onDeal={acceptDeal}
                                onNoDeal={rejectDeal}
                                phase={bankerPhase}
                                round={gameState.currentRound}
                                bankerBonus={gameState.bankerBonus}
                            />
                        </div>
                    </div>
                )}

                {/* Game Complete */}
                {gameState.phase === 'complete' && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 glass rounded-2xl p-8 text-center"
                    >
                        <Trophy className="w-16 h-16 mx-auto text-casino-gold mb-4" />
                        <h2 className="text-3xl font-display font-bold mb-4">
                            {gameState.acceptedOffer ? 'DEAL!' : 'NO DEAL!'}
                        </h2>

                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-white/5 rounded-xl p-4">
                                <p className="text-sm text-gray-400">Your Case Value</p>
                                <p className="text-2xl font-bold text-casino-gold">
                                    ${gameState.finalValue?.toLocaleString() ?? '---'}
                                </p>
                            </div>
                            {gameState.acceptedOffer && (
                                <div className="bg-white/5 rounded-xl p-4">
                                    <p className="text-sm text-gray-400">Banker's Offer</p>
                                    <p className="text-2xl font-bold text-casino-green">
                                        ${gameState.offer?.toLocaleString() ?? '---'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {gameState.acceptedOffer && gameState.finalValue !== null && gameState.offer !== null && (
                            <p className={`text-lg mb-4 ${gameState.offer > gameState.finalValue ? 'text-casino-green' : 'text-red-400'}`}>
                                {gameState.offer > gameState.finalValue
                                    ? `🎉 Great choice! You won $${(gameState.offer - gameState.finalValue).toLocaleString()} more!`
                                    : `😅 Your case had $${(gameState.finalValue - gameState.offer).toLocaleString()} more...`
                                }
                            </p>
                        )}

                        {gameState.goldenCase === gameState.playerCase && (
                            <div className="mb-4 text-casino-gold">
                                ✨ Golden Case Bonus Applied! (1.5x)
                            </div>
                        )}

                        <button
                            onClick={() => setGameState(prev => ({ ...prev, phase: 'setup' }))}
                            className="px-8 py-3 rounded-xl bg-gradient-to-r from-casino-accent to-casino-purple font-bold flex items-center gap-2 mx-auto"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Play Again
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
