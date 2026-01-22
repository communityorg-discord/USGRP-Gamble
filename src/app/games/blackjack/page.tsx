'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Zap, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/app/providers';

// Card types
const SUITS = ['♠', '♥', '♦', '♣'] as const;
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;

type Suit = typeof SUITS[number];
type Rank = typeof RANKS[number];

interface Card {
    suit: Suit;
    rank: Rank;
    hidden?: boolean;
}

type GameState = 'betting' | 'playing' | 'dealer' | 'finished';

const getCardValue = (rank: Rank): number => {
    if (rank === 'A') return 11;
    if (['K', 'Q', 'J'].includes(rank)) return 10;
    return parseInt(rank);
};

const calculateHandValue = (cards: Card[]): number => {
    let value = 0;
    let aces = 0;

    for (const card of cards) {
        if (card.hidden) continue;
        const cardValue = getCardValue(card.rank);
        value += cardValue;
        if (card.rank === 'A') aces++;
    }

    // Reduce aces from 11 to 1 if busting
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }

    return value;
};

const createDeck = (): Card[] => {
    const deck: Card[] = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ suit, rank });
        }
    }
    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

function PlayingCard({ card, index, flipped = false }: { card: Card; index: number; flipped?: boolean }) {
    const isRed = card.suit === '♥' || card.suit === '♦';
    const showBack = card.hidden || flipped;

    return (
        <motion.div
            initial={{ opacity: 0, y: -50, rotateY: 180 }}
            animate={{ opacity: 1, y: 0, rotateY: showBack ? 180 : 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="relative w-20 h-28 md:w-24 md:h-32"
            style={{ perspective: '1000px' }}
        >
            <div
                className="absolute inset-0 rounded-xl transition-transform duration-500"
                style={{
                    transformStyle: 'preserve-3d',
                    transform: showBack ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}
            >
                {/* Front */}
                <div
                    className={`absolute inset-0 rounded-xl bg-white shadow-lg flex flex-col items-center justify-center ${isRed ? 'text-red-500' : 'text-gray-900'
                        }`}
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <span className="text-2xl md:text-3xl font-bold">{card.rank}</span>
                    <span className="text-xl md:text-2xl">{card.suit}</span>
                </div>

                {/* Back */}
                <div
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 border-4 border-blue-700 flex items-center justify-center"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                    <div className="w-12 h-16 rounded border-2 border-blue-500 bg-blue-800" />
                </div>
            </div>
        </motion.div>
    );
}

export default function BlackjackPage() {
    const { user, setUser } = useAuth();
    const [betAmount, setBetAmount] = useState(100);
    const [gameState, setGameState] = useState<GameState>('betting');
    const [deck, setDeck] = useState<Card[]>([]);
    const [playerHand, setPlayerHand] = useState<Card[]>([]);
    const [dealerHand, setDealerHand] = useState<Card[]>([]);
    const [result, setResult] = useState<{
        message: string;
        won: boolean;
        amount: number;
    } | null>(null);

    const playerValue = calculateHandValue(playerHand);
    const dealerValue = calculateHandValue(dealerHand);

    const adjustBet = (delta: number) => {
        const newBet = Math.max(10, Math.min(5000, betAmount + delta));
        setBetAmount(newBet);
    };

    const deal = () => {
        if (!user || user.balance < betAmount) return;

        // Deduct bet
        setUser({ ...user, balance: user.balance - betAmount });

        const newDeck = createDeck();
        const pHand: Card[] = [newDeck.pop()!, newDeck.pop()!];
        const dHand: Card[] = [newDeck.pop()!, { ...newDeck.pop()!, hidden: true }];

        setDeck(newDeck);
        setPlayerHand(pHand);
        setDealerHand(dHand);
        setGameState('playing');
        setResult(null);

        // Check for blackjack
        const pValue = calculateHandValue(pHand);
        if (pValue === 21) {
            // Player blackjack - check dealer
            setTimeout(() => revealAndFinish(newDeck, pHand, dHand), 500);
        }
    };

    const hit = () => {
        if (gameState !== 'playing' || deck.length === 0) return;

        const newCard = deck.pop()!;
        const newHand = [...playerHand, newCard];
        setPlayerHand(newHand);
        setDeck([...deck]);

        const value = calculateHandValue(newHand);
        if (value > 21) {
            // Bust
            finishGame(newHand, dealerHand, 'bust');
        } else if (value === 21) {
            // Auto-stand on 21
            stand();
        }
    };

    const stand = () => {
        if (gameState !== 'playing') return;
        setGameState('dealer');
        revealAndFinish(deck, playerHand, dealerHand);
    };

    const doubleDown = () => {
        if (gameState !== 'playing' || playerHand.length !== 2) return;
        if (!user || user.balance < betAmount) return;

        // Double the bet
        setUser({ ...user, balance: user.balance - betAmount });
        const doubleBet = betAmount * 2;

        // Draw one card and stand
        const newCard = deck.pop()!;
        const newHand = [...playerHand, newCard];
        setPlayerHand(newHand);

        const value = calculateHandValue(newHand);
        if (value > 21) {
            finishGame(newHand, dealerHand, 'bust', doubleBet);
        } else {
            setGameState('dealer');
            revealAndFinish(deck, newHand, dealerHand, doubleBet);
        }
    };

    const revealAndFinish = async (
        currentDeck: Card[],
        pHand: Card[],
        dHand: Card[],
        currentBet = betAmount
    ) => {
        // Reveal dealer's hidden card
        const revealedDealerHand: Card[] = dHand.map(c => ({ ...c, hidden: false }));
        setDealerHand(revealedDealerHand);

        let dealerCards: Card[] = [...revealedDealerHand];
        let dealerVal = calculateHandValue(dealerCards);

        // Dealer draws until 17
        await new Promise(resolve => setTimeout(resolve, 500));

        while (dealerVal < 17 && currentDeck.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const newCard = currentDeck.pop()!;
            dealerCards = [...dealerCards, { ...newCard, hidden: false }];
            setDealerHand(dealerCards);
            dealerVal = calculateHandValue(dealerCards);
        }

        finishGame(pHand, dealerCards, 'compare', currentBet);
    };

    const finishGame = (
        pHand: Card[],
        dHand: Card[],
        reason: 'bust' | 'compare',
        currentBet = betAmount
    ) => {
        setGameState('finished');

        const pValue = calculateHandValue(pHand);
        const dValue = calculateHandValue(dHand.map(c => ({ ...c, hidden: false })));

        let message: string;
        let won: boolean;
        let payout = 0;

        if (reason === 'bust') {
            message = 'Bust! You went over 21';
            won = false;
        } else if (dValue > 21) {
            message = 'Dealer busts! You win!';
            won = true;
            payout = currentBet * 2;
        } else if (pValue === 21 && pHand.length === 2 && !(dValue === 21 && dHand.length === 2)) {
            message = 'BLACKJACK! You win!';
            won = true;
            payout = currentBet * 2.5; // Blackjack pays 3:2
        } else if (pValue > dValue) {
            message = 'You win!';
            won = true;
            payout = currentBet * 2;
        } else if (pValue < dValue) {
            message = 'Dealer wins';
            won = false;
        } else {
            message = 'Push - Tie game';
            won = false;
            payout = currentBet; // Return bet on push
        }

        if (payout > 0 && user) {
            setUser({ ...user, balance: user.balance + payout });
        }

        if (won) {
            confetti({
                particleCount: 80,
                spread: 60,
                origin: { y: 0.6 },
                colors: ['#ffd700', '#00ff88'],
            });
        }

        setResult({
            message,
            won,
            amount: won ? payout - currentBet : -currentBet,
        });
    };

    const newGame = () => {
        setPlayerHand([]);
        setDealerHand([]);
        setDeck([]);
        setResult(null);
        setGameState('betting');
    };

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
                        🃏 <span className="gradient-text">Blackjack</span>
                    </h1>
                    <p className="text-gray-400">Get closer to 21 than the dealer without going over!</p>
                </div>

                {/* Game Table */}
                <div className="glass rounded-3xl p-8 bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700/30">
                    {/* Dealer Section */}
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-300">Dealer</h3>
                            <span className="text-2xl font-bold">
                                {gameState === 'betting' ? '-' : dealerValue}
                            </span>
                        </div>
                        <div className="flex gap-3 justify-center min-h-32">
                            {dealerHand.map((card, i) => (
                                <PlayingCard key={i} card={card} index={i} />
                            ))}
                            {dealerHand.length === 0 && (
                                <div className="w-24 h-32 rounded-xl border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-500">
                                    ?
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-green-700/50 my-8" />

                    {/* Player Section */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Your Hand</h3>
                            <span className={`text-2xl font-bold ${playerValue > 21 ? 'text-red-500' :
                                playerValue === 21 ? 'neon-gold' : ''
                                }`}>
                                {gameState === 'betting' ? '-' : playerValue}
                            </span>
                        </div>
                        <div className="flex gap-3 justify-center min-h-32">
                            {playerHand.map((card, i) => (
                                <PlayingCard key={i} card={card} index={i} />
                            ))}
                            {playerHand.length === 0 && (
                                <div className="w-24 h-32 rounded-xl border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-500">
                                    Deal to start
                                </div>
                            )}
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
                                    : result.amount === 0
                                        ? 'bg-yellow-500/10 border border-yellow-500/30'
                                        : 'bg-red-500/10 border border-red-500/30'
                                    }`}
                            >
                                <p className="text-2xl font-bold mb-2">{result.message}</p>
                                {result.amount !== 0 && (
                                    <p className={`text-xl font-display font-bold ${result.won ? 'neon-gold' : 'text-red-400'
                                        }`}>
                                        {result.won ? '+' : ''}{result.amount.toLocaleString()}
                                    </p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Controls */}
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        {gameState === 'betting' && (
                            <>
                                {/* Bet Amount */}
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-400">Bet:</span>
                                    <button
                                        onClick={() => adjustBet(-50)}
                                        className="w-10 h-10 rounded-lg glass flex items-center justify-center hover:bg-white/10"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <input
                                        type="number"
                                        value={betAmount}
                                        onChange={(e) => setBetAmount(Math.max(10, Math.min(5000, parseInt(e.target.value) || 10)))}
                                        className="w-24 text-center text-xl font-bold bg-transparent border-none focus:outline-none neon-gold"
                                    />
                                    <button
                                        onClick={() => adjustBet(50)}
                                        className="w-10 h-10 rounded-lg glass flex items-center justify-center hover:bg-white/10"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                <motion.button
                                    onClick={deal}
                                    disabled={!user || (user?.balance || 0) < betAmount}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-12 py-4 rounded-2xl font-display font-bold text-xl bg-gradient-to-r from-casino-accent to-casino-purple hover:shadow-neon-pink disabled:opacity-50"
                                >
                                    <span className="flex items-center gap-2">
                                        <Zap className="w-6 h-6" />
                                        DEAL
                                    </span>
                                </motion.button>
                            </>
                        )}

                        {gameState === 'playing' && (
                            <div className="flex gap-3">
                                <motion.button
                                    onClick={hit}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-8 py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-green-600 to-green-500"
                                >
                                    HIT
                                </motion.button>
                                <motion.button
                                    onClick={stand}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-8 py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-red-600 to-red-500"
                                >
                                    STAND
                                </motion.button>
                                {playerHand.length === 2 && user && user.balance >= betAmount && (
                                    <motion.button
                                        onClick={doubleDown}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="px-8 py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-casino-gold to-yellow-500 text-black"
                                    >
                                        DOUBLE
                                    </motion.button>
                                )}
                            </div>
                        )}

                        {gameState === 'dealer' && (
                            <div className="text-xl text-gray-400 animate-pulse">
                                Dealer is playing...
                            </div>
                        )}

                        {gameState === 'finished' && (
                            <motion.button
                                onClick={newGame}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-12 py-4 rounded-2xl font-display font-bold text-xl bg-gradient-to-r from-casino-accent to-casino-purple hover:shadow-neon-pink flex items-center gap-2"
                            >
                                <RotateCcw className="w-6 h-6" />
                                NEW GAME
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Game Rules */}
                <div className="mt-8 glass rounded-2xl p-6">
                    <h3 className="text-xl font-bold mb-4">Quick Rules</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
                        <div>
                            <p className="text-white font-medium mb-1">Goal</p>
                            <p>Get closer to 21 than the dealer without going over</p>
                        </div>
                        <div>
                            <p className="text-white font-medium mb-1">Card Values</p>
                            <p>2-10 = face value, J/Q/K = 10, A = 1 or 11</p>
                        </div>
                        <div>
                            <p className="text-white font-medium mb-1">Payouts</p>
                            <p>Win = 2x, Blackjack = 2.5x, Push = bet returned</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
