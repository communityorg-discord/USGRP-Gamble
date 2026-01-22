'use client';

import { motion } from 'framer-motion';
import { Minus, Plus, Settings2 } from 'lucide-react';
import type { DealDifficulty, BankerPersonality } from '@/lib/types';

interface DealSettingsProps {
    buyIn: number;
    onBuyInChange: (amount: number) => void;
    difficulty: DealDifficulty;
    onDifficultyChange: (difficulty: DealDifficulty) => void;
    bankerPersonality: BankerPersonality;
    onBankerPersonalityChange: (personality: BankerPersonality) => void;
    onStartGame: () => void;
    canStart: boolean;
    isStarting: boolean;
}

const BUY_IN_PRESETS = [100, 500, 1000, 5000, 10000];

const DIFFICULTY_INFO = {
    casual: {
        label: 'Casual',
        cases: 12,
        description: 'Perfect for beginners',
        color: 'from-green-500 to-green-600',
        maxWin: '500x',
    },
    standard: {
        label: 'Standard',
        cases: 18,
        description: 'Balanced gameplay',
        color: 'from-blue-500 to-blue-600',
        maxWin: '10,000x',
    },
    highroller: {
        label: 'High Roller',
        cases: 26,
        description: 'Maximum stakes',
        color: 'from-casino-gold to-yellow-600',
        maxWin: '1,000,000x',
    },
};

const BANKER_INFO = {
    conservative: {
        label: 'Conservative',
        description: '75-85% of expected value',
        icon: '🧐',
        color: 'text-blue-400',
    },
    fair: {
        label: 'Fair',
        description: '85-95% of expected value',
        icon: '🤝',
        color: 'text-casino-green',
    },
    aggressive: {
        label: 'Aggressive',
        description: '90-105% of expected value',
        icon: '😈',
        color: 'text-casino-gold',
    },
};

export default function DealSettings({
    buyIn,
    onBuyInChange,
    difficulty,
    onDifficultyChange,
    bankerPersonality,
    onBankerPersonalityChange,
    onStartGame,
    canStart,
    isStarting,
}: DealSettingsProps) {
    const adjustBuyIn = (delta: number) => {
        const newBuyIn = Math.max(100, Math.min(100000, buyIn + delta));
        onBuyInChange(newBuyIn);
    };

    const difficultyData = DIFFICULTY_INFO[difficulty];

    return (
        <div className="space-y-6">
            {/* Buy-In Selection */}
            <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    💰 Buy-In Amount
                </h3>

                <div className="flex items-center justify-center gap-3 mb-4">
                    <button
                        onClick={() => adjustBuyIn(-100)}
                        disabled={buyIn <= 100}
                        className="w-10 h-10 rounded-lg glass flex items-center justify-center hover:bg-white/10 disabled:opacity-50 transition-all"
                    >
                        <Minus className="w-4 h-4" />
                    </button>

                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-casino-gold text-lg">$</span>
                        <input
                            type="number"
                            value={buyIn}
                            onChange={(e) => onBuyInChange(Math.max(100, Math.min(100000, parseInt(e.target.value) || 100)))}
                            className="w-36 pl-8 pr-3 py-3 text-2xl font-bold text-center glass rounded-xl border border-casino-gold/30 focus:border-casino-gold focus:outline-none bg-transparent neon-gold"
                        />
                    </div>

                    <button
                        onClick={() => adjustBuyIn(100)}
                        disabled={buyIn >= 100000}
                        className="w-10 h-10 rounded-lg glass flex items-center justify-center hover:bg-white/10 disabled:opacity-50 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Presets */}
                <div className="flex gap-2 justify-center flex-wrap">
                    {BUY_IN_PRESETS.map((preset) => (
                        <button
                            key={preset}
                            onClick={() => onBuyInChange(preset)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${buyIn === preset
                                    ? 'bg-casino-gold text-black'
                                    : 'glass text-gray-300 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            ${preset.toLocaleString()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Difficulty Selection */}
            <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Settings2 className="w-5 h-5" />
                    Difficulty
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(Object.entries(DIFFICULTY_INFO) as [DealDifficulty, typeof DIFFICULTY_INFO.casual][]).map(([key, info]) => (
                        <motion.button
                            key={key}
                            onClick={() => onDifficultyChange(key)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-4 rounded-xl text-left transition-all border-2 ${difficulty === key
                                    ? `bg-gradient-to-br ${info.color} border-transparent shadow-lg`
                                    : 'glass border-transparent hover:border-white/20'
                                }`}
                        >
                            <p className={`font-bold mb-1 ${difficulty === key ? 'text-white' : ''}`}>
                                {info.label}
                            </p>
                            <p className={`text-xs mb-2 ${difficulty === key ? 'text-white/80' : 'text-gray-400'}`}>
                                {info.description}
                            </p>
                            <div className={`text-xs ${difficulty === key ? 'text-white/70' : 'text-gray-500'}`}>
                                <span>{info.cases} cases</span>
                                <span className="mx-2">•</span>
                                <span>Max {info.maxWin}</span>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Banker Personality */}
            <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    🎩 Banker Personality
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(Object.entries(BANKER_INFO) as [BankerPersonality, typeof BANKER_INFO.conservative][]).map(([key, info]) => (
                        <motion.button
                            key={key}
                            onClick={() => onBankerPersonalityChange(key)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-4 rounded-xl text-center transition-all border-2 ${bankerPersonality === key
                                    ? 'bg-white/10 border-casino-accent shadow-neon-pink'
                                    : 'glass border-transparent hover:border-white/20'
                                }`}
                        >
                            <span className="text-3xl block mb-2">{info.icon}</span>
                            <p className={`font-bold mb-1 ${info.color}`}>{info.label}</p>
                            <p className="text-xs text-gray-400">{info.description}</p>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Potential Winnings Preview */}
            <div className="glass rounded-2xl p-6 text-center">
                <p className="text-gray-400 mb-2">Maximum Potential Win</p>
                <p className="text-3xl font-display font-bold neon-gold">
                    ${(buyIn * (difficulty === 'highroller' ? 1000 : difficulty === 'standard' ? 10 : 0.5)).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                    Based on {difficultyData.cases} cases • {difficultyData.label} mode
                </p>
            </div>

            {/* Start Game Button */}
            <motion.button
                onClick={onStartGame}
                disabled={!canStart || isStarting}
                whileHover={canStart ? { scale: 1.02 } : {}}
                whileTap={canStart ? { scale: 0.98 } : {}}
                className={`w-full py-4 rounded-2xl font-display font-bold text-xl transition-all ${canStart && !isStarting
                        ? 'bg-gradient-to-r from-casino-accent to-casino-purple hover:shadow-neon-pink'
                        : 'bg-gray-600 cursor-not-allowed'
                    }`}
            >
                {isStarting ? (
                    <span className="flex items-center justify-center gap-2">
                        <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                            📦
                        </motion.span>
                        Starting Game...
                    </span>
                ) : (
                    <span className="flex items-center justify-center gap-2">
                        🎬 START GAME
                    </span>
                )}
            </motion.button>

            {!canStart && (
                <p className="text-center text-sm text-red-400">
                    Insufficient balance to start this game
                </p>
            )}
        </div>
    );
}
