'use client';

import { motion } from 'framer-motion';
import { GameCard } from '@/components/games/GameCard';
import { Search } from 'lucide-react';
import { useState } from 'react';

const allGames = [
    {
        id: 'fishing-frenzy',
        title: 'Fishing Frenzy',
        description: 'Cast your line for underwater treasures',
        icon: '🎣',
        gradient: 'from-cyan-500 to-blue-600',
        minBet: 10,
        maxWin: '100x',
        popular: true,
        category: 'slots',
        isNew: true,
    },
    {
        id: 'deal-or-no-deal',
        title: 'Deal or No Deal',
        description: 'Outsmart the banker for big prizes',
        icon: '💼',
        gradient: 'from-casino-gold to-amber-600',
        minBet: 100,
        maxWin: '1,000,000x',
        popular: true,
        category: 'special',
        isNew: true,
    },
    {
        id: 'slots',
        title: 'Mega Slots',
        description: 'Spin the reels for massive jackpots',
        icon: '🎰',
        gradient: 'from-purple-600 to-pink-500',
        minBet: 10,
        maxWin: '10,000x',
        popular: true,
        category: 'slots',
    },
    {
        id: 'roulette',
        title: 'Roulette',
        description: 'Place your bets on the wheel',
        icon: '🎡',
        gradient: 'from-red-600 to-orange-500',
        minBet: 25,
        maxWin: '35x',
        category: 'table',
    },
    {
        id: 'blackjack',
        title: 'Blackjack',
        description: 'Beat the dealer to 21',
        icon: '🃏',
        gradient: 'from-green-600 to-emerald-500',
        minBet: 50,
        maxWin: '3x',
        popular: true,
        category: 'table',
    },
    {
        id: 'coinflip',
        title: 'Coin Flip',
        description: 'Simple 50/50 odds',
        icon: '🪙',
        gradient: 'from-yellow-500 to-amber-600',
        minBet: 5,
        maxWin: '2x',
        category: 'instant',
    },
    {
        id: 'dice',
        title: 'Dice Roll',
        description: 'Roll high or low to win',
        icon: '🎲',
        gradient: 'from-blue-500 to-cyan-500',
        minBet: 10,
        maxWin: '6x',
        category: 'instant',
    },
    {
        id: 'racing',
        title: 'Horse Racing',
        description: 'Bet on the winning horse',
        icon: '🏇',
        gradient: 'from-amber-600 to-yellow-500',
        minBet: 100,
        maxWin: '25x',
        category: 'special',
    },
    {
        id: 'lottery',
        title: 'Lottery',
        description: 'Weekly draws for huge prizes',
        icon: '🎱',
        gradient: 'from-indigo-600 to-purple-500',
        minBet: 10,
        maxWin: '1,000,000x',
        popular: true,
        category: 'special',
    },
    {
        id: 'scratch',
        title: 'Scratch Cards',
        description: 'Instant win scratch-off tickets',
        icon: '🎟️',
        gradient: 'from-teal-500 to-green-500',
        minBet: 10,
        maxWin: '500x',
        category: 'instant',
    },
];

const categories = [
    { id: 'all', label: 'All Games' },
    { id: 'slots', label: 'Slots' },
    { id: 'table', label: 'Table Games' },
    { id: 'instant', label: 'Instant Win' },
    { id: 'special', label: 'Special' },
];

export default function GamesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');

    const filteredGames = allGames.filter(game => {
        const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            game.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'all' || game.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
                        All <span className="gradient-text">Games</span>
                    </h1>
                    <p className="text-xl text-gray-400">
                        Choose from our selection of premium casino games
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search games..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 glass rounded-xl border border-white/10 focus:border-casino-accent focus:outline-none transition-colors bg-transparent text-white placeholder-gray-500"
                        />
                    </div>

                    {/* Category Filters */}
                    <div className="flex gap-2 flex-wrap">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setActiveCategory(category.id)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeCategory === category.id
                                    ? 'bg-casino-accent text-white shadow-neon-pink'
                                    : 'glass text-gray-300 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                {category.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Games Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredGames.map((game, i) => (
                        <motion.div
                            key={game.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <GameCard game={game} />
                        </motion.div>
                    ))}
                </div>

                {/* No results */}
                {filteredGames.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-xl text-gray-400">No games found</p>
                        <button
                            onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                            className="mt-4 text-casino-accent hover:underline"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
