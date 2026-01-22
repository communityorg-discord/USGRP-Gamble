'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Timer, Trophy, Users } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/app/providers';

const TICKET_PRICE = 10;
const MAX_NUMBER = 49;
const NUMBERS_TO_PICK = 6;

// Prize tiers based on matches
const PRIZE_TIERS = [
    { matches: 6, prize: 'JACKPOT', multiplier: 0 }, // Jackpot is variable
    { matches: 5, prize: '$50,000', multiplier: 5000 },
    { matches: 4, prize: '$1,000', multiplier: 100 },
    { matches: 3, prize: '$50', multiplier: 5 },
    { matches: 2, prize: '$5', multiplier: 0.5 },
];

export default function LotteryPage() {
    const { user, setUser } = useAuth();
    const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
    const [tickets, setTickets] = useState<number[][]>([]);
    const [jackpot, setJackpot] = useState(1250000);
    const [nextDraw, setNextDraw] = useState<Date | null>(null);
    const [countdown, setCountdown] = useState('');
    const [isRevealing, setIsRevealing] = useState(false);
    const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
    const [result, setResult] = useState<{
        won: boolean;
        matches: number;
        prize: number;
    } | null>(null);

    // Calculate next Friday 8 PM
    useEffect(() => {
        const getNextFriday = () => {
            const now = new Date();
            const daysUntilFriday = (5 - now.getDay() + 7) % 7 || 7;
            const nextFri = new Date(now);
            nextFri.setDate(now.getDate() + daysUntilFriday);
            nextFri.setHours(20, 0, 0, 0);
            if (nextFri <= now) {
                nextFri.setDate(nextFri.getDate() + 7);
            }
            return nextFri;
        };

        setNextDraw(getNextFriday());

        // Jackpot increases
        const jackpotInterval = setInterval(() => {
            setJackpot(prev => prev + Math.floor(Math.random() * 50));
        }, 2000);

        return () => clearInterval(jackpotInterval);
    }, []);

    // Countdown timer
    useEffect(() => {
        if (!nextDraw) return;

        const updateCountdown = () => {
            const now = new Date();
            const diff = nextDraw.getTime() - now.getTime();

            if (diff <= 0) {
                setCountdown('DRAWING NOW!');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [nextDraw]);

    const toggleNumber = (num: number) => {
        if (selectedNumbers.includes(num)) {
            setSelectedNumbers(selectedNumbers.filter(n => n !== num));
        } else if (selectedNumbers.length < NUMBERS_TO_PICK) {
            setSelectedNumbers([...selectedNumbers, num]);
        }
    };

    const quickPick = () => {
        const picks: number[] = [];
        while (picks.length < NUMBERS_TO_PICK) {
            const num = Math.floor(Math.random() * MAX_NUMBER) + 1;
            if (!picks.includes(num)) {
                picks.push(num);
            }
        }
        setSelectedNumbers(picks.sort((a, b) => a - b));
    };

    const buyTicket = () => {
        if (!user || user.balance < TICKET_PRICE || selectedNumbers.length !== NUMBERS_TO_PICK) return;

        setUser({ ...user, balance: user.balance - TICKET_PRICE });
        setTickets([...tickets, [...selectedNumbers].sort((a, b) => a - b)]);
        setSelectedNumbers([]);
    };

    const simulateDraw = async () => {
        if (tickets.length === 0 || isRevealing) return;

        setIsRevealing(true);
        setResult(null);
        setDrawnNumbers([]);

        // Draw 6 numbers one by one
        const drawn: number[] = [];
        while (drawn.length < NUMBERS_TO_PICK) {
            await new Promise(resolve => setTimeout(resolve, 800));
            let num = Math.floor(Math.random() * MAX_NUMBER) + 1;
            while (drawn.includes(num)) {
                num = Math.floor(Math.random() * MAX_NUMBER) + 1;
            }
            drawn.push(num);
            setDrawnNumbers([...drawn].sort((a, b) => a - b));
        }

        // Check all tickets for matches
        let bestMatches = 0;
        for (const ticket of tickets) {
            const matches = ticket.filter(n => drawn.includes(n)).length;
            if (matches > bestMatches) bestMatches = matches;
        }

        // Calculate prize
        let prize = 0;
        const tier = PRIZE_TIERS.find(t => t.matches === bestMatches);
        if (tier) {
            if (tier.matches === 6) {
                prize = jackpot;
            } else {
                prize = TICKET_PRICE * tier.multiplier;
            }
        }

        if (prize > 0 && user) {
            setUser({ ...user, balance: user.balance + prize });

            if (bestMatches >= 4) {
                confetti({
                    particleCount: 200,
                    spread: 100,
                    origin: { y: 0.5 },
                    colors: ['#ffd700', '#ff4488', '#44ffdd'],
                });
            } else {
                confetti({
                    particleCount: 50,
                    spread: 60,
                });
            }
        }

        setResult({
            won: prize > 0,
            matches: bestMatches,
            prize,
        });

        setIsRevealing(false);
    };

    const clearTickets = () => {
        setTickets([]);
        setDrawnNumbers([]);
        setResult(null);
    };

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
                        🎱 <span className="gradient-text">Lottery</span>
                    </h1>
                    <p className="text-gray-400">Pick 6 numbers and win the jackpot!</p>
                </div>

                {/* Jackpot Display */}
                <motion.div
                    className="glass rounded-2xl p-8 mb-8 text-center border border-casino-gold/30"
                    animate={{ boxShadow: ['0 0 20px rgba(255,215,0,0.3)', '0 0 40px rgba(255,215,0,0.5)', '0 0 20px rgba(255,215,0,0.3)'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Trophy className="w-6 h-6 text-casino-gold" />
                        <span className="text-lg font-medium text-casino-gold">CURRENT JACKPOT</span>
                        <Trophy className="w-6 h-6 text-casino-gold" />
                    </div>
                    <motion.p
                        key={jackpot}
                        initial={{ scale: 1.02 }}
                        animate={{ scale: 1 }}
                        className="text-5xl md:text-6xl font-display font-bold neon-gold"
                    >
                        ${jackpot.toLocaleString()}
                    </motion.p>
                    <div className="flex items-center justify-center gap-2 mt-4 text-gray-400">
                        <Timer className="w-5 h-5" />
                        <span>Next Draw: {countdown}</span>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Number Selection */}
                    <div className="lg:col-span-2">
                        <div className="glass rounded-2xl p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold">Select {NUMBERS_TO_PICK} Numbers</h3>
                                <button
                                    onClick={quickPick}
                                    className="px-4 py-2 rounded-lg bg-casino-accent/20 text-casino-accent hover:bg-casino-accent/30 transition-colors text-sm font-medium"
                                >
                                    🎲 Quick Pick
                                </button>
                            </div>

                            {/* Number Grid */}
                            <div className="grid grid-cols-7 gap-2 mb-4">
                                {Array.from({ length: MAX_NUMBER }, (_, i) => i + 1).map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => toggleNumber(num)}
                                        disabled={!selectedNumbers.includes(num) && selectedNumbers.length >= NUMBERS_TO_PICK}
                                        className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${selectedNumbers.includes(num)
                                                ? 'bg-gradient-to-br from-casino-gold to-yellow-600 text-black scale-110 shadow-neon-gold'
                                                : drawnNumbers.includes(num)
                                                    ? 'bg-casino-green text-black'
                                                    : 'bg-gray-700 hover:bg-gray-600 disabled:opacity-50'
                                            }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>

                            {/* Selected Numbers Display */}
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-gray-400">Your picks:</span>
                                <div className="flex gap-2">
                                    {Array.from({ length: NUMBERS_TO_PICK }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${selectedNumbers[i]
                                                    ? 'bg-gradient-to-br from-casino-gold to-yellow-600 text-black'
                                                    : 'bg-gray-800 text-gray-500 border-2 border-dashed border-gray-600'
                                                }`}
                                        >
                                            {selectedNumbers[i] || '?'}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Buy Button */}
                            <motion.button
                                onClick={buyTicket}
                                disabled={selectedNumbers.length !== NUMBERS_TO_PICK || !user || (user?.balance || 0) < TICKET_PRICE}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-casino-accent to-casino-purple hover:shadow-neon-pink disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Ticket className="w-5 h-5" />
                                Buy Ticket (${TICKET_PRICE})
                            </motion.button>
                        </div>

                        {/* Drawn Numbers */}
                        {drawnNumbers.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass rounded-2xl p-6 mb-6"
                            >
                                <h3 className="text-xl font-bold mb-4 text-center">Winning Numbers</h3>
                                <div className="flex gap-3 justify-center">
                                    {drawnNumbers.map((num, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0, rotate: -180 }}
                                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="w-14 h-14 rounded-full bg-gradient-to-br from-casino-green to-emerald-600 flex items-center justify-center text-xl font-bold text-black shadow-neon-green"
                                        >
                                            {num}
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Result */}
                        <AnimatePresence>
                            {result && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className={`p-6 rounded-2xl text-center ${result.won
                                            ? 'bg-gradient-to-r from-casino-gold/20 via-casino-green/20 to-casino-gold/20 border border-casino-gold/40'
                                            : 'bg-red-500/10 border border-red-500/30'
                                        }`}
                                >
                                    {result.won ? (
                                        <>
                                            <p className="text-xl mb-2">🎉 {result.matches} Numbers Matched! 🎉</p>
                                            <p className="text-3xl font-display font-bold neon-gold">
                                                +${result.prize.toLocaleString()}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-xl text-gray-400">
                                            {result.matches} match{result.matches !== 1 ? 'es' : ''} - No prize this time
                                        </p>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Your Tickets */}
                        <div className="glass rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Ticket className="w-5 h-5" />
                                    Your Tickets
                                </h3>
                                {tickets.length > 0 && (
                                    <button
                                        onClick={clearTickets}
                                        className="text-sm text-gray-400 hover:text-casino-accent"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            {tickets.length > 0 ? (
                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {tickets.map((ticket, i) => (
                                        <div
                                            key={i}
                                            className="flex gap-2 p-2 rounded-lg bg-white/5"
                                        >
                                            {ticket.map((num) => (
                                                <div
                                                    key={num}
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${drawnNumbers.includes(num)
                                                            ? 'bg-casino-green text-black'
                                                            : 'bg-gray-700'
                                                        }`}
                                                >
                                                    {num}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm">No tickets yet</p>
                            )}

                            {/* Draw Button (for demo) */}
                            {tickets.length > 0 && !isRevealing && (
                                <motion.button
                                    onClick={simulateDraw}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full mt-4 py-3 rounded-xl font-bold bg-gradient-to-r from-casino-gold to-yellow-600 text-black hover:shadow-neon-gold"
                                >
                                    🎱 Simulate Draw
                                </motion.button>
                            )}

                            {isRevealing && (
                                <div className="text-center text-gray-400 mt-4 animate-pulse">
                                    Drawing numbers...
                                </div>
                            )}
                        </div>

                        {/* Prize Table */}
                        <div className="glass rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-4">Prize Table</h3>
                            <div className="space-y-2">
                                {PRIZE_TIERS.map((tier) => (
                                    <div
                                        key={tier.matches}
                                        className={`flex justify-between items-center p-2 rounded-lg ${tier.matches === 6 ? 'bg-casino-gold/10 border border-casino-gold/30' : ''
                                            }`}
                                    >
                                        <span className="text-gray-400">{tier.matches} matches</span>
                                        <span className={`font-bold ${tier.matches === 6 ? 'text-casino-gold' : ''}`}>
                                            {tier.prize}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="glass rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                This Week
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-casino-accent">12,847</p>
                                    <p className="text-xs text-gray-400">Tickets Sold</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-casino-green">$84,320</p>
                                    <p className="text-xs text-gray-400">Prizes Won</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
