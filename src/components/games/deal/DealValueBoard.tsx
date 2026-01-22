'use client';

import { motion } from 'framer-motion';

interface DealValueBoardProps {
    allValues: number[];
    eliminatedValues: number[];
    buyIn: number;
}

export default function DealValueBoard({
    allValues,
    eliminatedValues,
    buyIn,
}: DealValueBoardProps) {
    // Scale values based on buy-in
    const scaleFactor = buyIn / 1000;
    const scaledValues = allValues.map(v => Math.floor(v * scaleFactor)).sort((a, b) => a - b);
    const scaledEliminated = eliminatedValues.map(v => Math.floor(v * scaleFactor));

    // Split into low and high columns
    const midPoint = Math.ceil(scaledValues.length / 2);
    const lowValues = scaledValues.slice(0, midPoint);
    const highValues = scaledValues.slice(midPoint);

    // Format value for display
    const formatValue = (value: number): string => {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
        if (value < 1) return `$${value.toFixed(2)}`;
        return `$${value.toLocaleString()}`;
    };

    // Get color based on value tier
    const getValueColor = (value: number, isEliminated: boolean): string => {
        if (isEliminated) return 'bg-gray-800 text-gray-500 line-through opacity-50';

        const maxValue = scaledValues[scaledValues.length - 1];
        const ratio = value / maxValue;

        if (ratio >= 0.8) return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black';
        if (ratio >= 0.5) return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white';
        if (ratio >= 0.2) return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
        if (ratio >= 0.05) return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white';
    };

    const ValueItem = ({ value, isLow }: { value: number; isLow: boolean }) => {
        const isEliminated = scaledEliminated.includes(value);

        return (
            <motion.div
                initial={isEliminated ? { opacity: 1 } : false}
                animate={isEliminated ? { opacity: 0.4, scale: 0.95 } : { opacity: 1, scale: 1 }}
                className={`
                    px-3 py-1.5 rounded-lg text-sm font-bold text-center
                    transition-all duration-300
                    ${getValueColor(value, isEliminated)}
                    ${isEliminated ? 'relative' : ''}
                `}
            >
                {formatValue(value)}
                {isEliminated && (
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-y-0 left-2 right-2 flex items-center"
                    >
                        <div className="w-full h-0.5 bg-red-500" />
                    </motion.div>
                )}
            </motion.div>
        );
    };

    return (
        <div className="glass rounded-2xl p-4">
            <h3 className="text-center font-display font-bold mb-4 text-sm text-gray-400">
                REMAINING VALUES
            </h3>

            <div className="grid grid-cols-2 gap-4">
                {/* Low Values Column */}
                <div className="space-y-2">
                    <div className="text-xs text-center text-gray-500 mb-2">Low</div>
                    {lowValues.map((value, index) => (
                        <ValueItem key={`low-${index}`} value={value} isLow={true} />
                    ))}
                </div>

                {/* High Values Column */}
                <div className="space-y-2">
                    <div className="text-xs text-center text-gray-500 mb-2">High</div>
                    {highValues.map((value, index) => (
                        <ValueItem key={`high-${index}`} value={value} isLow={false} />
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="mt-4 pt-3 border-t border-white/10 flex justify-between text-xs text-gray-400">
                <span>Remaining: {scaledValues.length - scaledEliminated.length}</span>
                <span>Eliminated: {scaledEliminated.length}</span>
            </div>
        </div>
    );
}
