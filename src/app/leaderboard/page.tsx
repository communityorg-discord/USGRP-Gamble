'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, TrendingUp, Flame, Crown } from 'lucide-react';

// Mock leaderboard data
const LEADERBOARD_DATA = [
    { rank: 1, username: 'LuckyAce777', avatar: null, totalWon: 2847500, biggestWin: 500000, gamesPlayed: 1245, winRate: 62 },
    { rank: 2, username: 'DiamondKing', avatar: null, totalWon: 1985000, biggestWin: 250000, gamesPlayed: 987, winRate: 58 },
    { rank: 3, username: 'GoldenSlots', avatar: null, totalWon: 1654200, biggestWin: 150000, gamesPlayed: 2341, winRate: 45 },
    { rank: 4, username: 'RoyalFlush99', avatar: null, totalWon: 1245800, biggestWin: 100000, gamesPlayed: 856, winRate: 54 },
    { rank: 5, username: 'JackpotJoe', avatar: null, totalWon: 987600, biggestWin: 75000, gamesPlayed: 1567, winRate: 41 },
    { rank: 6, username: 'WheelSpinner', avatar: null, totalWon: 856400, biggestWin: 50000, gamesPlayed: 2154, winRate: 38 },
    { rank: 7, username: 'CardShark', avatar: null, totalWon: 745200, biggestWin: 45000, gamesPlayed: 645, winRate: 61 },
    { rank: 8, username: 'BetMaster', avatar: null, totalWon: 634500, biggestWin: 35000, gamesPlayed: 1876, winRate: 35 },
    { rank: 9, username: 'CoinFlipKing', avatar: null, totalWon: 523400, biggestWin: 25000, gamesPlayed: 3456, winRate: 52 },
    { rank: 10, username: 'SlotMachine', avatar: null, totalWon: 412300, biggestWin: 20000, gamesPlayed: 987, winRate: 42 },
];

const timeframes = [
    { id: 'daily', label: 'Today' },
    { id: 'weekly', label: 'This Week' },
    { id: 'monthly', label: 'This Month' },
    { id: 'alltime', label: 'All Time' },
];

const categories = [
    { id: 'earnings', label: 'Top Earners', icon: TrendingUp },
    { id: 'winners', label: 'Most Wins', icon: Trophy },
    { id: 'streaks', label: 'Win Streaks', icon: Flame },
];

function getRankBadge(rank: number) {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 text-center font-bold text-gray-500">#{rank}</span>;
}

export default function LeaderboardPage() {
    const [activeTimeframe, setActiveTimeframe] = useState('weekly');
    const [activeCategory, setActiveCategory] = useState('earnings');

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
                        🏆 <span className="gradient-text">Leaderboard</span>
                    </h1>
                    <p className="text-gray-400">See who's winning big at USGRP Casino</p>
                </div>

                {/* Top 3 Podium */}
                <div className="flex justify-center items-end gap-4 mb-12">
                    {/* 2nd Place */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass rounded-2xl p-6 text-center w-40"
                    >
                        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-2xl">
                            🥈
                        </div>
                        <p className="font-bold truncate">{LEADERBOARD_DATA[1].username}</p>
                        <p className="text-casino-gold font-bold">${(LEADERBOARD_DATA[1].totalWon / 1000).toFixed(0)}K</p>
                    </motion.div>

                    {/* 1st Place */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-2xl p-8 text-center w-48 border border-casino-gold/50 shadow-neon-gold"
                    >
                        <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-yellow-400 to-casino-gold flex items-center justify-center text-3xl">
                            👑
                        </div>
                        <p className="font-bold text-lg truncate">{LEADERBOARD_DATA[0].username}</p>
                        <p className="text-casino-gold font-bold text-xl">${(LEADERBOARD_DATA[0].totalWon / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-gray-400 mt-1">{LEADERBOARD_DATA[0].winRate}% Win Rate</p>
                    </motion.div>

                    {/* 3rd Place */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass rounded-2xl p-6 text-center w-40"
                    >
                        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-2xl">
                            🥉
                        </div>
                        <p className="font-bold truncate">{LEADERBOARD_DATA[2].username}</p>
                        <p className="text-casino-gold font-bold">${(LEADERBOARD_DATA[2].totalWon / 1000).toFixed(0)}K</p>
                    </motion.div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                    {/* Timeframe */}
                    <div className="flex gap-2">
                        {timeframes.map((tf) => (
                            <button
                                key={tf.id}
                                onClick={() => setActiveTimeframe(tf.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTimeframe === tf.id
                                        ? 'bg-casino-accent text-white'
                                        : 'glass text-gray-400 hover:text-white'
                                    }`}
                            >
                                {tf.label}
                            </button>
                        ))}
                    </div>

                    {/* Category */}
                    <div className="flex gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeCategory === cat.id
                                        ? 'bg-casino-purple text-white'
                                        : 'glass text-gray-400 hover:text-white'
                                    }`}
                            >
                                <cat.icon className="w-4 h-4" />
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Leaderboard Table */}
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Rank</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Player</th>
                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Total Won</th>
                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-400 hidden md:table-cell">Biggest Win</th>
                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-400 hidden md:table-cell">Games</th>
                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Win Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {LEADERBOARD_DATA.map((player, i) => (
                                    <motion.tr
                                        key={player.rank}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className={`border-b border-white/5 hover:bg-white/5 transition-colors ${player.rank <= 3 ? 'bg-casino-gold/5' : ''
                                            }`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                {getRankBadge(player.rank)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-casino-accent to-casino-purple flex items-center justify-center text-sm font-bold">
                                                    {player.username.charAt(0)}
                                                </div>
                                                <span className="font-medium">{player.username}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-casino-green font-bold">
                                                ${player.totalWon.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right hidden md:table-cell">
                                            <span className="text-casino-gold">
                                                ${player.biggestWin.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right hidden md:table-cell text-gray-400">
                                            {player.gamesPlayed.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`font-medium ${player.winRate >= 50 ? 'text-casino-green' : 'text-gray-400'
                                                }`}>
                                                {player.winRate}%
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Your Stats */}
                <div className="mt-8 glass rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-4">Your Ranking</h3>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="text-3xl font-bold text-gray-500">#247</div>
                            <div>
                                <p className="font-medium">You</p>
                                <p className="text-sm text-gray-400">Keep playing to climb the ranks!</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-casino-green font-bold">$12,450</p>
                            <p className="text-sm text-gray-400">Total Won</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
