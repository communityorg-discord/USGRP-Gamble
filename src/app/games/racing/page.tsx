'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trophy, Timer } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/app/providers';

// Horse data
const HORSES = [
    { id: 1, name: 'Thunder Bolt', emoji: '🐎', color: '#ef4444', odds: 2.5 },
    { id: 2, name: 'Golden Star', emoji: '🏇', color: '#f59e0b', odds: 3.0 },
    { id: 3, name: 'Midnight Runner', emoji: '🐴', color: '#3b82f6', odds: 4.5 },
    { id: 4, name: 'Silver Arrow', emoji: '🦓', color: '#8b5cf6', odds: 5.0 },
    { id: 5, name: 'Lucky Charm', emoji: '🦄', color: '#10b981', odds: 6.0 },
    { id: 6, name: 'Dark Shadow', emoji: '🐎', color: '#1f2937', odds: 8.0 },
    { id: 7, name: 'Fire Storm', emoji: '🏇', color: '#dc2626', odds: 10.0 },
    { id: 8, name: 'Underdog', emoji: '🐴', color: '#6b7280', odds: 15.0 },
];

interface HorsePosition {
    id: number;
    position: number; // 0-100 percentage
    speed: number;
}

export default function RacingPage() {
    const { user, setUser } = useAuth();
    const [betAmount, setBetAmount] = useState(100);
    const [selectedHorse, setSelectedHorse] = useState<number | null>(null);
    const [isRacing, setIsRacing] = useState(false);
    const [horses, setHorses] = useState<HorsePosition[]>(
        HORSES.map(h => ({ id: h.id, position: 0, speed: 0 }))
    );
    const [winner, setWinner] = useState<number | null>(null);
    const [result, setResult] = useState<{
        won: boolean;
        horseName: string;
        payout: number;
    } | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const animationRef = useRef<number | null>(null);

    const startRace = async () => {
        if (isRacing || selectedHorse === null || !user || user.balance < betAmount) return;

        // Deduct bet
        setUser({ ...user, balance: user.balance - betAmount });
        setResult(null);
        setWinner(null);

        // Reset positions
        setHorses(HORSES.map(h => ({ id: h.id, position: 0, speed: 0 })));

        // Countdown
        for (let i = 3; i > 0; i--) {
            setCountdown(i);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        setCountdown(null);
        setIsRacing(true);

        // Race animation
        const raceHorses = HORSES.map(h => ({
            id: h.id,
            position: 0,
            speed: 0.5 + Math.random() * 0.5, // Base speed
            acceleration: 0.95 + Math.random() * 0.1,
        }));

        const animate = () => {
            let raceFinished = false;
            let winningHorse: number | null = null;

            const updatedHorses = raceHorses.map(horse => {
                if (horse.position >= 100) {
                    if (!raceFinished) {
                        winningHorse = horse.id;
                        raceFinished = true;
                    }
                    return horse;
                }

                // Random speed changes to make it exciting
                const speedChange = (Math.random() - 0.5) * 0.3;
                horse.speed = Math.max(0.2, Math.min(1.5, horse.speed + speedChange));
                horse.position = Math.min(100, horse.position + horse.speed);

                return horse;
            });

            setHorses(updatedHorses.map(h => ({
                id: h.id,
                position: h.position,
                speed: h.speed,
            })));

            if (raceFinished && winningHorse) {
                setIsRacing(false);
                setWinner(winningHorse);

                const winningHorseData = HORSES.find(h => h.id === winningHorse)!;
                const playerWon = winningHorse === selectedHorse;
                const payout = playerWon ? Math.floor(betAmount * winningHorseData.odds) : 0;

                if (playerWon && user) {
                    setUser({ ...user, balance: user.balance - betAmount + payout });
                    confetti({
                        particleCount: 150,
                        spread: 100,
                        origin: { y: 0.6 },
                        colors: [winningHorseData.color, '#ffd700'],
                    });
                }

                setResult({
                    won: playerWon,
                    horseName: winningHorseData.name,
                    payout: playerWon ? payout : -betAmount,
                });
            } else {
                animationRef.current = requestAnimationFrame(animate);
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    };

    // Cleanup animation on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    const selectedHorseData = selectedHorse ? HORSES.find(h => h.id === selectedHorse) : null;

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
                        🏇 <span className="gradient-text">Horse Racing</span>
                    </h1>
                    <p className="text-gray-400">Pick your horse and watch them race!</p>
                </div>

                {/* Race Track */}
                <div className="glass rounded-3xl p-6 mb-8 overflow-hidden">
                    {/* Countdown Overlay */}
                    <AnimatePresence>
                        {countdown !== null && (
                            <motion.div
                                initial={{ opacity: 0, scale: 2 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className="absolute inset-0 flex items-center justify-center bg-black/70 z-20"
                            >
                                <span className="text-9xl font-display font-bold text-casino-gold neon-gold">
                                    {countdown}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Track */}
                    <div className="relative bg-gradient-to-b from-green-800 to-green-900 rounded-2xl p-4">
                        {/* Finish Line */}
                        <div className="absolute right-12 top-0 bottom-0 w-2 bg-white/20 border-x-2 border-white/40 z-10" />
                        <div className="absolute right-10 top-2 flex flex-col items-center">
                            <Trophy className="w-6 h-6 text-casino-gold" />
                        </div>

                        {/* Lanes */}
                        {HORSES.map((horse, i) => {
                            const horsePosition = horses.find(h => h.id === horse.id);
                            const isSelected = selectedHorse === horse.id;
                            const isWinner = winner === horse.id;

                            return (
                                <div
                                    key={horse.id}
                                    className={`relative h-12 border-b border-white/10 flex items-center ${isSelected ? 'bg-white/10' : ''
                                        } ${isWinner ? 'bg-casino-gold/20' : ''}`}
                                >
                                    {/* Lane number */}
                                    <div className="w-8 text-center text-sm font-bold text-gray-400">
                                        {i + 1}
                                    </div>

                                    {/* Track area */}
                                    <div className="flex-1 relative h-full">
                                        {/* Horse */}
                                        <motion.div
                                            className="absolute top-1/2 -translate-y-1/2 text-3xl"
                                            style={{ left: `${horsePosition?.position || 0}%` }}
                                            animate={isRacing ? { y: [-2, 2, -2] } : {}}
                                            transition={{ duration: 0.2, repeat: Infinity }}
                                        >
                                            {horse.emoji}
                                        </motion.div>
                                    </div>

                                    {/* Odds */}
                                    <div className="w-16 text-right pr-2 text-sm">
                                        <span className="text-casino-gold font-bold">{horse.odds}x</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Horse Selection */}
                    <div className="lg:col-span-2">
                        <div className="glass rounded-2xl p-6">
                            <h3 className="text-xl font-bold mb-4">Select Your Horse</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {HORSES.map((horse) => (
                                    <button
                                        key={horse.id}
                                        onClick={() => !isRacing && setSelectedHorse(horse.id)}
                                        disabled={isRacing}
                                        className={`p-4 rounded-xl border-2 transition-all ${selectedHorse === horse.id
                                                ? 'border-casino-gold bg-casino-gold/10 shadow-neon-gold'
                                                : 'border-gray-700 hover:border-gray-500'
                                            } ${winner === horse.id ? 'ring-2 ring-casino-gold' : ''}`}
                                    >
                                        <span className="text-3xl block mb-2">{horse.emoji}</span>
                                        <p className="font-bold text-sm truncate">{horse.name}</p>
                                        <p className="text-casino-gold text-sm">{horse.odds}x</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Result */}
                        <AnimatePresence>
                            {result && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className={`mt-6 p-6 rounded-2xl text-center ${result.won
                                            ? 'bg-gradient-to-r from-casino-gold/20 via-casino-green/20 to-casino-gold/20 border border-casino-gold/40'
                                            : 'bg-red-500/10 border border-red-500/30'
                                        }`}
                                >
                                    <p className="text-xl mb-2">
                                        🏆 <span className="font-bold">{result.horseName}</span> wins!
                                    </p>
                                    {result.won ? (
                                        <>
                                            <p className="text-lg text-casino-gold mb-1">🎉 YOUR HORSE WON! 🎉</p>
                                            <p className="text-2xl font-display font-bold neon-gold">
                                                +${result.payout.toLocaleString()}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-lg text-gray-400">Better luck next race!</p>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Betting Panel */}
                    <div className="space-y-6">
                        {/* Selected Horse */}
                        {selectedHorseData && (
                            <div className="glass rounded-2xl p-6 border border-casino-gold/30">
                                <h3 className="text-lg font-bold mb-3">Your Pick</h3>
                                <div className="flex items-center gap-4">
                                    <span className="text-4xl">{selectedHorseData.emoji}</span>
                                    <div>
                                        <p className="font-bold">{selectedHorseData.name}</p>
                                        <p className="text-casino-gold">Odds: {selectedHorseData.odds}x</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bet Amount */}
                        <div className="glass rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-3">Bet Amount</h3>
                            <div className="flex gap-2 flex-wrap mb-4">
                                {[50, 100, 250, 500, 1000].map((amount) => (
                                    <button
                                        key={amount}
                                        onClick={() => setBetAmount(amount)}
                                        disabled={isRacing}
                                        className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${betAmount === amount
                                                ? 'bg-casino-accent text-white'
                                                : 'glass hover:bg-white/10'
                                            }`}
                                    >
                                        ${amount}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => setBetAmount(Math.max(10, parseInt(e.target.value) || 10))}
                                disabled={isRacing}
                                className="w-full text-center text-2xl font-bold bg-transparent border border-gray-700 rounded-xl py-3 focus:border-casino-gold focus:outline-none"
                            />
                        </div>

                        {/* Potential Win */}
                        {selectedHorseData && (
                            <div className="glass rounded-2xl p-6 text-center">
                                <p className="text-gray-400 mb-1">Potential Win</p>
                                <p className="text-3xl font-display font-bold neon-gold">
                                    ${Math.floor(betAmount * selectedHorseData.odds).toLocaleString()}
                                </p>
                            </div>
                        )}

                        {/* Race Button */}
                        <motion.button
                            onClick={startRace}
                            disabled={isRacing || selectedHorse === null || !user || (user?.balance || 0) < betAmount}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full py-4 rounded-2xl font-display font-bold text-xl transition-all ${isRacing || selectedHorse === null
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-casino-accent to-casino-purple hover:shadow-neon-pink'
                                }`}
                        >
                            {isRacing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <motion.span
                                        animate={{ x: [0, 10, 0] }}
                                        transition={{ duration: 0.3, repeat: Infinity }}
                                    >
                                        🏇
                                    </motion.span>
                                    RACING...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <Zap className="w-6 h-6" />
                                    START RACE
                                </span>
                            )}
                        </motion.button>

                        {!selectedHorse && (
                            <p className="text-center text-sm text-gray-400">
                                Select a horse to place your bet
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
