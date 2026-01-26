'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Trophy, Zap, Users } from 'lucide-react';
import { GameCard } from '@/components/games/GameCard';
import { useMemo } from 'react';

const featuredGames = [
    {
        id: 'slots',
        title: 'Mega Slots',
        description: 'Spin the reels for massive jackpots',
        icon: '🎰',
        gradient: 'from-purple-600 to-pink-500',
        minBet: 10,
        maxWin: '10,000x',
        popular: true,
    },
    {
        id: 'roulette',
        title: 'Roulette',
        description: 'Place your bets on the wheel',
        icon: '🎡',
        gradient: 'from-red-600 to-orange-500',
        minBet: 25,
        maxWin: '35x',
    },
    {
        id: 'blackjack',
        title: 'Blackjack',
        description: 'Beat the dealer to 21',
        icon: '🃏',
        gradient: 'from-green-600 to-emerald-500',
        minBet: 50,
        maxWin: '3x',
    },
    {
        id: 'coinflip',
        title: 'Coin Flip',
        description: 'Simple 50/50 odds',
        icon: '🪙',
        gradient: 'from-yellow-500 to-amber-600',
        minBet: 5,
        maxWin: '2x',
    },
];

const stats = [
    { label: 'Active Players', value: '2,847', icon: Users },
    { label: 'Total Jackpot', value: '$1.2M', icon: Trophy },
    { label: 'Games Played', value: '847K', icon: Zap },
];

export default function HomePage() {
    // Generate stable random values on client only to avoid hydration mismatch
    const recentWinners = useMemo(() => {
        if (typeof window === 'undefined') {
            // SSR: return placeholder data
            return [...Array(10)].map((_, i) => ({
                id: i,
                player: `Player${100 + i}`,
                amount: 1000 + i * 500
            }));
        }
        // Client: generate random data
        return [...Array(10)].map((_, i) => ({
            id: i,
            player: `Player${Math.floor(Math.random() * 1000)}`,
            amount: Math.floor(Math.random() * 10000)
        }));
    }, []);

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative py-20 px-4 overflow-hidden">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-6">
                            <Sparkles className="w-4 h-4 text-casino-gold" />
                            <span className="text-sm font-medium">Premium Gaming Experience</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-display font-bold mb-6">
                            <span className="gradient-text">USGRP</span>
                            <br />
                            <span className="text-white">Casino</span>
                        </h1>

                        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
                            The ultimate gambling destination. Play slots, blackjack, roulette, and more
                            with your USGRP balance. Real stakes, real wins.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/games" className="btn-gold text-lg px-8 py-4">
                                Start Playing
                            </Link>
                            <Link href="/login" className="btn-outline text-lg px-8 py-4">
                                Login with Discord
                            </Link>
                        </div>
                    </motion.div>

                    {/* Floating slot symbols */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {['🍒', '💎', '7️⃣', '🍀', '⭐'].map((emoji, i) => (
                            <motion.span
                                key={i}
                                className="absolute text-4xl opacity-20"
                                style={{
                                    left: `${10 + i * 20}%`,
                                    top: `${20 + (i % 3) * 20}%`,
                                }}
                                animate={{
                                    y: [0, -20, 0],
                                    rotate: [0, 10, -10, 0],
                                }}
                                transition={{
                                    duration: 3 + i,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            >
                                {emoji}
                            </motion.span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="py-8 glass-dark border-y border-white/5">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center justify-center gap-4"
                            >
                                <stat.icon className="w-8 h-8 text-casino-gold" />
                                <div>
                                    <p className="text-2xl font-display font-bold neon-gold">{stat.value}</p>
                                    <p className="text-sm text-gray-400">{stat.label}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Games */}
            <section className="py-16 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-display font-bold">Featured Games</h2>
                        <Link href="/games" className="text-casino-accent hover:underline">
                            View All →
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {featuredGames.map((game, i) => (
                            <motion.div
                                key={game.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <GameCard game={game} />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Live Winners */}
            <section className="py-16 px-4 glass-dark">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-display font-bold mb-8 text-center">
                        🏆 Recent Winners
                    </h2>

                    <div className="overflow-hidden">
                        <motion.div
                            className="flex gap-6"
                            animate={{ x: [0, -1000] }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        >
                            {recentWinners.map((winner) => (
                                <div
                                    key={winner.id}
                                    className="flex-shrink-0 glass rounded-xl p-4 min-w-[250px]"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-casino-purple to-casino-accent" />
                                        <div>
                                            <p className="font-medium">{winner.player}</p>
                                            <p className="text-sm text-gray-400">Won on Slots</p>
                                        </div>
                                        <p className="ml-auto text-casino-green font-bold">
                                            +${winner.amount.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="glass rounded-3xl p-12 border border-casino-gold/20"
                    >
                        <h2 className="text-4xl font-display font-bold mb-4 gradient-text">
                            Ready to Win Big?
                        </h2>
                        <p className="text-xl text-gray-400 mb-8">
                            Join thousands of players winning real USGRP currency every day.
                        </p>
                        <Link href="/games" className="btn-gold text-lg px-8 py-4 inline-block">
                            Play Now
                        </Link>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
