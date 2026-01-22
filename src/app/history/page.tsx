'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { History, TrendingUp, TrendingDown, Filter, Calendar } from 'lucide-react';

// Mock history data
const HISTORY_DATA = [
    { id: 1, game: 'Slots', icon: '🎰', bet: 100, result: 750, won: true, time: '2 minutes ago', multiplier: '7.5x' },
    { id: 2, game: 'Blackjack', icon: '🃏', bet: 200, result: -200, won: false, time: '5 minutes ago', multiplier: '0x' },
    { id: 3, game: 'Roulette', icon: '🎡', bet: 50, result: 1750, won: true, time: '12 minutes ago', multiplier: '35x' },
    { id: 4, game: 'Coin Flip', icon: '🪙', bet: 500, result: 1000, won: true, time: '18 minutes ago', multiplier: '2x' },
    { id: 5, game: 'Dice', icon: '🎲', bet: 150, result: -150, won: false, time: '25 minutes ago', multiplier: '0x' },
    { id: 6, game: 'Slots', icon: '🎰', bet: 100, result: -100, won: false, time: '32 minutes ago', multiplier: '0x' },
    { id: 7, game: 'Horse Racing', icon: '🏇', bet: 250, result: 2500, won: true, time: '45 minutes ago', multiplier: '10x' },
    { id: 8, game: 'Lottery', icon: '🎱', bet: 10, result: 50, won: true, time: '1 hour ago', multiplier: '5x' },
    { id: 9, game: 'Scratch', icon: '🎟️', bet: 100, result: -100, won: false, time: '1 hour ago', multiplier: '0x' },
    { id: 10, game: 'Blackjack', icon: '🃏', bet: 300, result: 450, won: true, time: '2 hours ago', multiplier: '1.5x' },
    { id: 11, game: 'Slots', icon: '🎰', bet: 200, result: 3000, won: true, time: '2 hours ago', multiplier: '15x' },
    { id: 12, game: 'Roulette', icon: '🎡', bet: 100, result: -100, won: false, time: '3 hours ago', multiplier: '0x' },
];

const gameFilters = [
    { id: 'all', label: 'All Games' },
    { id: 'slots', label: '🎰 Slots' },
    { id: 'blackjack', label: '🃏 Blackjack' },
    { id: 'roulette', label: '🎡 Roulette' },
    { id: 'coinflip', label: '🪙 Coin Flip' },
    { id: 'dice', label: '🎲 Dice' },
    { id: 'racing', label: '🏇 Racing' },
    { id: 'lottery', label: '🎱 Lottery' },
    { id: 'scratch', label: '🎟️ Scratch' },
];

export default function HistoryPage() {
    const [filter, setFilter] = useState('all');
    const [resultFilter, setResultFilter] = useState<'all' | 'wins' | 'losses'>('all');

    const filteredHistory = HISTORY_DATA.filter(item => {
        if (filter !== 'all' && item.game.toLowerCase() !== filter) return false;
        if (resultFilter === 'wins' && !item.won) return false;
        if (resultFilter === 'losses' && item.won) return false;
        return true;
    });

    const totalWon = HISTORY_DATA.filter(h => h.won).reduce((sum, h) => sum + h.result, 0);
    const totalLost = HISTORY_DATA.filter(h => !h.won).reduce((sum, h) => sum + Math.abs(h.result), 0);
    const netProfit = totalWon - totalLost;
    const winRate = (HISTORY_DATA.filter(h => h.won).length / HISTORY_DATA.length * 100).toFixed(1);

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
                        📜 <span className="gradient-text">Game History</span>
                    </h1>
                    <p className="text-gray-400">Track your gambling activity and results</p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="glass rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-casino-green">+${totalWon.toLocaleString()}</p>
                        <p className="text-sm text-gray-400">Total Won</p>
                    </div>
                    <div className="glass rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-red-400">-${totalLost.toLocaleString()}</p>
                        <p className="text-sm text-gray-400">Total Lost</p>
                    </div>
                    <div className="glass rounded-xl p-4 text-center">
                        <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-casino-green' : 'text-red-400'}`}>
                            {netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-400">Net Profit</p>
                    </div>
                    <div className="glass rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-casino-gold">{winRate}%</p>
                        <p className="text-sm text-gray-400">Win Rate</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                    {/* Game Filter */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {gameFilters.slice(0, 5).map((game) => (
                            <button
                                key={game.id}
                                onClick={() => setFilter(game.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filter === game.id
                                        ? 'bg-casino-accent text-white'
                                        : 'glass text-gray-400 hover:text-white'
                                    }`}
                            >
                                {game.label}
                            </button>
                        ))}
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="px-4 py-2 rounded-lg text-sm font-medium glass text-gray-400 bg-transparent border-none focus:outline-none cursor-pointer"
                        >
                            <option value="all">More...</option>
                            {gameFilters.slice(5).map((game) => (
                                <option key={game.id} value={game.id}>{game.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Result Filter */}
                    <div className="flex gap-2">
                        {(['all', 'wins', 'losses'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setResultFilter(type)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${resultFilter === type
                                        ? type === 'wins' ? 'bg-casino-green/20 text-casino-green' :
                                            type === 'losses' ? 'bg-red-500/20 text-red-400' :
                                                'bg-casino-purple text-white'
                                        : 'glass text-gray-400 hover:text-white'
                                    }`}
                            >
                                {type === 'wins' && <TrendingUp className="w-4 h-4" />}
                                {type === 'losses' && <TrendingDown className="w-4 h-4" />}
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* History List */}
                <div className="glass rounded-2xl overflow-hidden">
                    {filteredHistory.length > 0 ? (
                        <div className="divide-y divide-white/5">
                            {filteredHistory.map((item, i) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="p-4 hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
                                                {item.icon}
                                            </div>
                                            <div>
                                                <p className="font-medium">{item.game}</p>
                                                <p className="text-sm text-gray-400 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {item.time}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold text-lg ${item.won ? 'text-casino-green' : 'text-red-400'}`}>
                                                {item.won ? '+' : ''}{item.result >= 0 ? `$${item.result.toLocaleString()}` : `-$${Math.abs(item.result).toLocaleString()}`}
                                            </p>
                                            <div className="flex items-center justify-end gap-2 text-sm">
                                                <span className="text-gray-400">Bet: ${item.bet}</span>
                                                <span className={`${item.won ? 'text-casino-gold' : 'text-gray-500'}`}>
                                                    {item.multiplier}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <History className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                            <p className="text-gray-400">No games found matching your filters</p>
                            <button
                                onClick={() => { setFilter('all'); setResultFilter('all'); }}
                                className="mt-4 text-casino-accent hover:underline"
                            >
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>

                {/* Load More */}
                {filteredHistory.length > 0 && (
                    <div className="text-center mt-6">
                        <button className="px-6 py-3 glass rounded-xl font-medium hover:bg-white/10 transition-colors">
                            Load More History
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
