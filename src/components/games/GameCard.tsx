'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, TrendingUp } from 'lucide-react';

interface GameCardProps {
    game: {
        id: string;
        title: string;
        description: string;
        icon: string;
        gradient: string;
        minBet: number;
        maxWin: string;
        popular?: boolean;
        isNew?: boolean;
    };
}

export function GameCard({ game }: GameCardProps) {
    return (
        <Link href={`/games/${game.id}`}>
            <motion.div
                className="game-card group relative overflow-hidden"
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
            >
                {/* NEW badge */}
                {game.isNew && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-casino-accent/30 rounded-full border border-casino-accent/50 animate-pulse">
                        <span className="text-xs font-bold text-casino-accent">NEW</span>
                    </div>
                )}

                {/* Popular badge */}
                {game.popular && (
                    <div className={`absolute top-3 ${game.isNew ? 'right-3' : 'right-3'} flex items-center gap-1 px-2 py-1 bg-casino-gold/20 rounded-full border border-casino-gold/40`}>
                        <Star className="w-3 h-3 text-casino-gold fill-casino-gold" />
                        <span className="text-xs font-medium text-casino-gold">Popular</span>
                    </div>
                )}

                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${game.gradient} flex items-center justify-center text-3xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    {game.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-display font-bold mb-2 group-hover:text-casino-gold transition-colors">
                    {game.title}
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                    {game.description}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm">
                    <div>
                        <span className="text-gray-500">Min Bet</span>
                        <p className="font-medium text-casino-green">${game.minBet}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-gray-500">Max Win</span>
                        <p className="font-medium text-casino-gold flex items-center gap-1 justify-end">
                            <TrendingUp className="w-3 h-3" />
                            {game.maxWin}
                        </p>
                    </div>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-casino-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
        </Link>
    );
}
