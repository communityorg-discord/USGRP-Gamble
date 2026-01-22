'use client';

import { motion } from 'framer-motion';

interface DealValueBoardProps {
    allValues: number[];
    eliminatedValues: number[];
}

export default function DealValueBoard({ allValues, eliminatedValues }: DealValueBoardProps) {
    // Sort values and split into low and high
    const sortedValues = [...allValues].sort((a, b) => a - b);
    const midpoint = Math.ceil(sortedValues.length / 2);
    const lowValues = sortedValues.slice(0, midpoint);
    const highValues = sortedValues.slice(midpoint);

    const formatValue = (value: number): string => {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
        if (value < 1) return `$${value.toFixed(2)}`;
        return `$${value.toLocaleString()}`;
    };

    const isEliminated = (value: number) => eliminatedValues.includes(value);

    const remainingCount = allValues.length - eliminatedValues.length;
    const eliminatedCount = eliminatedValues.length;

    return (
        <div className="glass rounded-2xl p-4 md:p-6">
            <h3 className="text-center font-display font-bold text-lg mb-4 tracking-wide text-gray-300">
                REMAINING VALUES
            </h3>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
                {/* Low Values Column */}
                <div>
                    <div className="text-center text-xs text-gray-500 mb-2 font-medium tracking-wider">
                        Low
                    </div>
                    <div className="space-y-1.5">
                        {lowValues.map((value, index) => (
                            <motion.div
                                key={value}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className={`
                                    relative px-3 py-2 rounded-lg text-center font-bold text-sm
                                    transition-all duration-300
                                    ${isEliminated(value)
                                        ? 'bg-gray-800/50 text-gray-600 line-through'
                                        : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
                                    }
                                `}
                            >
                                {isEliminated(value) && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-full h-0.5 bg-gray-600 rotate-[-5deg]"></div>
                                    </div>
                                )}
                                <span className={isEliminated(value) ? 'opacity-50' : ''}>
                                    {formatValue(value)}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* High Values Column */}
                <div>
                    <div className="text-center text-xs text-gray-500 mb-2 font-medium tracking-wider">
                        High
                    </div>
                    <div className="space-y-1.5">
                        {highValues.map((value, index) => {
                            const isTopTier = value >= highValues[Math.floor(highValues.length * 0.6)];
                            return (
                                <motion.div
                                    key={value}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className={`
                                        relative px-3 py-2 rounded-lg text-center font-bold text-sm
                                        transition-all duration-300
                                        ${isEliminated(value)
                                            ? 'bg-gray-800/50 text-gray-600 line-through'
                                            : isTopTier
                                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
                                                : 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md'
                                        }
                                    `}
                                >
                                    {isEliminated(value) && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-full h-0.5 bg-gray-600 rotate-[-5deg]"></div>
                                        </div>
                                    )}
                                    <span className={isEliminated(value) ? 'opacity-50' : ''}>
                                        {formatValue(value)}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="flex justify-between mt-4 pt-3 border-t border-white/10 text-xs text-gray-500">
                <span>Remaining: <span className="text-white font-bold">{remainingCount}</span></span>
                <span>Eliminated: <span className="text-red-400 font-bold">{eliminatedCount}</span></span>
            </div>
        </div>
    );
}
