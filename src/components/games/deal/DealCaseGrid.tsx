'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface CaseData {
    caseNumber: number;
    isOpened: boolean;
    value?: number;
    isPlayerCase: boolean;
    isMystery?: boolean;
    isGolden?: boolean;
}

interface DealCaseGridProps {
    cases: CaseData[];
    onCaseClick: (caseNumber: number) => void;
    disabled: boolean;
    phase: 'selecting' | 'opening' | 'offer' | 'complete';
    casesToOpen: number;
}

export default function DealCaseGrid({
    cases,
    onCaseClick,
    disabled,
    phase,
    casesToOpen,
}: DealCaseGridProps) {
    const formatValue = (value: number): string => {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
        if (value < 1) return `$${value.toFixed(2)}`;
        return `$${value.toLocaleString()}`;
    };

    const getCaseStyle = (caseData: CaseData) => {
        if (caseData.isPlayerCase) {
            return 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.5)]';
        }
        if (caseData.isOpened) {
            return 'bg-gray-700/50 border-gray-600';
        }
        if (caseData.isGolden) {
            return 'bg-gradient-to-br from-amber-500 to-yellow-600 border-yellow-400 shadow-[0_0_25px_rgba(251,191,36,0.6)] animate-pulse';
        }
        if (caseData.isMystery) {
            return 'bg-gradient-to-br from-purple-600 to-pink-600 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]';
        }
        return 'bg-gradient-to-br from-orange-500 to-orange-700 border-orange-400 hover:from-orange-400 hover:to-orange-600 hover:shadow-[0_0_15px_rgba(249,115,22,0.4)]';
    };

    return (
        <div className="w-full">
            {/* Header instruction */}
            {phase === 'opening' && casesToOpen > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-4"
                >
                    <span className="text-casino-accent font-bold text-lg">
                        Open {casesToOpen} more case{casesToOpen !== 1 ? 's' : ''}
                    </span>
                </motion.div>
            )}

            {/* Case Grid - 6 columns */}
            <div className="grid grid-cols-6 gap-2 md:gap-3">
                {cases.map((caseData) => (
                    <motion.button
                        key={caseData.caseNumber}
                        onClick={() => onCaseClick(caseData.caseNumber)}
                        disabled={disabled || caseData.isOpened || caseData.isPlayerCase}
                        whileHover={!disabled && !caseData.isOpened && !caseData.isPlayerCase ? { scale: 1.05, y: -3 } : {}}
                        whileTap={!disabled && !caseData.isOpened && !caseData.isPlayerCase ? { scale: 0.95 } : {}}
                        className={`
                            relative aspect-square rounded-lg border-2 transition-all duration-200
                            flex flex-col items-center justify-center
                            ${getCaseStyle(caseData)}
                            ${disabled || caseData.isOpened || caseData.isPlayerCase ? 'cursor-default' : 'cursor-pointer'}
                        `}
                    >
                        {/* Case opened - show value */}
                        <AnimatePresence mode="wait">
                            {caseData.isOpened && caseData.value !== undefined ? (
                                <motion.div
                                    initial={{ rotateY: 90, opacity: 0 }}
                                    animate={{ rotateY: 0, opacity: 1 }}
                                    exit={{ rotateY: -90, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-center"
                                >
                                    <span className={`text-xs md:text-sm font-bold ${caseData.value >= 1000 ? 'text-orange-400' : 'text-blue-400'
                                        }`}>
                                        {formatValue(caseData.value)}
                                    </span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="text-center"
                                >
                                    {/* Player's case icon */}
                                    {caseData.isPlayerCase && (
                                        <div className="absolute -top-1 -right-1 text-xs">📦</div>
                                    )}

                                    {/* Mystery case indicator */}
                                    {caseData.isMystery && !caseData.isOpened && (
                                        <motion.span
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                            className="text-xl md:text-2xl"
                                        >
                                            ❓
                                        </motion.span>
                                    )}

                                    {/* Golden case indicator */}
                                    {caseData.isGolden && !caseData.isOpened && (
                                        <motion.span
                                            animate={{ rotate: [0, 10, -10, 0] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="text-xl md:text-2xl"
                                        >
                                            ✨
                                        </motion.span>
                                    )}

                                    {/* Regular case number */}
                                    {!caseData.isMystery && !caseData.isGolden && (
                                        <span className="text-lg md:text-2xl font-bold text-white drop-shadow-lg">
                                            {caseData.caseNumber}
                                        </span>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 md:gap-6 mt-4 text-xs md:text-sm text-gray-400">
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-yellow-400 to-yellow-600 border border-yellow-300"></div>
                    <span>Your Case</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-orange-500 to-orange-700 border border-orange-400"></div>
                    <span>Unopened</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-gray-700/50 border border-gray-600"></div>
                    <span>Opened</span>
                </div>
            </div>
        </div>
    );
}
