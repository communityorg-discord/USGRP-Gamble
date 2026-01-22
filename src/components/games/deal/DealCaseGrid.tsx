'use client';

import { motion } from 'framer-motion';

interface DealCaseGridProps {
    totalCases: number;
    playerCase: number;
    openedCases: { caseNumber: number; value: number }[];
    onOpenCase: (caseNumber: number) => void;
    canOpen: boolean;
    isOpening: boolean;
    openingCase: number | null;
}

export default function DealCaseGrid({
    totalCases,
    playerCase,
    openedCases,
    onOpenCase,
    canOpen,
    isOpening,
    openingCase,
}: DealCaseGridProps) {
    const openedCaseNumbers = openedCases.map(c => c.caseNumber);

    // Generate case grid layout
    const getCaseRows = () => {
        if (totalCases <= 12) {
            return [
                Array.from({ length: 6 }, (_, i) => i + 1),
                Array.from({ length: 6 }, (_, i) => i + 7),
            ];
        } else if (totalCases <= 18) {
            return [
                Array.from({ length: 6 }, (_, i) => i + 1),
                Array.from({ length: 6 }, (_, i) => i + 7),
                Array.from({ length: 6 }, (_, i) => i + 13),
            ];
        } else {
            // 26 cases for high roller
            return [
                Array.from({ length: 7 }, (_, i) => i + 1),
                Array.from({ length: 6 }, (_, i) => i + 8),
                Array.from({ length: 7 }, (_, i) => i + 14),
                Array.from({ length: 6 }, (_, i) => i + 21),
            ];
        }
    };

    const rows = getCaseRows();

    // Format value for display
    const formatValue = (value: number): string => {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
        if (value < 1) return `$${value.toFixed(2)}`;
        return `$${value.toLocaleString()}`;
    };

    // Get value color based on amount
    const getValueColor = (value: number): string => {
        if (value >= 100000) return 'from-yellow-400 to-yellow-600'; // Gold
        if (value >= 10000) return 'from-orange-400 to-orange-600';
        if (value >= 1000) return 'from-green-400 to-green-600';
        if (value >= 100) return 'from-blue-400 to-blue-600';
        if (value >= 10) return 'from-purple-400 to-purple-600';
        return 'from-gray-400 to-gray-600'; // Low values
    };

    return (
        <div className="space-y-3">
            {rows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-center gap-2 md:gap-3">
                    {row.filter(num => num <= totalCases).map((caseNum) => {
                        const isPlayerCase = caseNum === playerCase;
                        const isOpened = openedCaseNumbers.includes(caseNum);
                        const openedData = openedCases.find(c => c.caseNumber === caseNum);
                        const isCurrentlyOpening = openingCase === caseNum;

                        return (
                            <motion.button
                                key={caseNum}
                                onClick={() => onOpenCase(caseNum)}
                                disabled={!canOpen || isOpened || isPlayerCase || isOpening}
                                whileHover={canOpen && !isOpened && !isPlayerCase ? { scale: 1.05, y: -2 } : {}}
                                whileTap={canOpen && !isOpened && !isPlayerCase ? { scale: 0.95 } : {}}
                                className={`
                                    relative w-12 h-16 md:w-16 md:h-20 rounded-lg font-bold text-sm md:text-base
                                    transition-all duration-300 overflow-hidden
                                    ${isPlayerCase
                                        ? 'bg-gradient-to-b from-casino-gold to-yellow-600 text-black ring-2 ring-casino-gold shadow-neon-gold cursor-default'
                                        : isOpened
                                            ? 'bg-transparent border-2 border-dashed border-gray-600 cursor-default'
                                            : 'bg-gradient-to-b from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-white border-2 border-amber-600/50 shadow-lg cursor-pointer'
                                    }
                                    ${!canOpen && !isOpened && !isPlayerCase ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                {isCurrentlyOpening ? (
                                    <motion.div
                                        initial={{ rotateY: 0 }}
                                        animate={{ rotateY: 180 }}
                                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                                        className="absolute inset-0 flex items-center justify-center"
                                    >
                                        <span className="text-2xl">📦</span>
                                    </motion.div>
                                ) : isOpened && openedData ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.3, delay: 0.2 }}
                                        className={`absolute inset-0 flex items-center justify-center bg-gradient-to-b ${getValueColor(openedData.value)} rounded-lg`}
                                    >
                                        <span className="text-xs md:text-sm font-bold text-white drop-shadow-lg">
                                            {formatValue(openedData.value)}
                                        </span>
                                    </motion.div>
                                ) : (
                                    <>
                                        {/* Case number */}
                                        <span className="relative z-10">{caseNum}</span>

                                        {/* Player's case indicator */}
                                        {isPlayerCase && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                                <span className="text-xs">👤</span>
                                            </div>
                                        )}

                                        {/* Case shine effect */}
                                        {!isOpened && !isPlayerCase && (
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
                                        )}
                                    </>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            ))}

            {/* Legend */}
            <div className="flex justify-center gap-4 mt-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-gradient-to-b from-casino-gold to-yellow-600 rounded" />
                    <span>Your Case</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-gradient-to-b from-amber-700 to-amber-900 rounded border border-amber-600/50" />
                    <span>Unopened</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 border-2 border-dashed border-gray-600 rounded" />
                    <span>Opened</span>
                </div>
            </div>
        </div>
    );
}
