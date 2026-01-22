'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneCall, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';

interface BankerBonus {
    type: string | null;
    description: string;
}

interface DealBankerPanelProps {
    offer: number | null;
    expectedValue: number;
    onDeal: () => void;
    onNoDeal: () => void;
    phase: 'waiting' | 'calling' | 'revealed' | 'decision';
    round: number;
    bankerBonus?: BankerBonus | null;
    onBonusAccept?: () => void;
}

export default function DealBankerPanel({
    offer,
    expectedValue,
    onDeal,
    onNoDeal,
    phase,
    round,
    bankerBonus,
    onBonusAccept,
}: DealBankerPanelProps) {
    const [displayedOffer, setDisplayedOffer] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    // Animated counter for offer reveal
    useEffect(() => {
        if (phase === 'revealed' && offer !== null) {
            setIsAnimating(true);
            const duration = 1500;
            const steps = 30;
            const stepDuration = duration / steps;
            const increment = offer / steps;

            let current = 0;
            const interval = setInterval(() => {
                current += increment;
                if (current >= offer) {
                    setDisplayedOffer(offer);
                    setIsAnimating(false);
                    clearInterval(interval);
                } else {
                    setDisplayedOffer(Math.floor(current));
                }
            }, stepDuration);

            return () => clearInterval(interval);
        }
    }, [phase, offer]);

    const offerPercentage = offer && expectedValue > 0
        ? Math.round((offer / expectedValue) * 100)
        : 0;

    const formatValue = (value: number): string => {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
        return `$${value.toLocaleString()}`;
    };

    const getBonusIcon = () => {
        switch (bankerBonus?.type) {
            case 'wild_card': return '🃏';
            case 'double_value': return '✖️2';
            case 'safety_net': return '🛡️';
            default: return '🎁';
        }
    };

    return (
        <div className="glass rounded-2xl p-4 md:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <motion.div
                        animate={phase === 'calling' ? { rotate: [0, -15, 15, -15, 15, 0] } : {}}
                        transition={{ repeat: phase === 'calling' ? Infinity : 0, duration: 0.5 }}
                    >
                        {phase === 'calling' ? (
                            <PhoneCall className="w-6 h-6 text-casino-gold" />
                        ) : (
                            <Phone className="w-6 h-6 text-gray-400" />
                        )}
                    </motion.div>
                    <span className="font-display font-bold text-lg">Banker</span>
                </div>
                <span className="text-sm text-gray-400">Round {round}</span>
            </div>

            {/* Banker Bonus Alert */}
            <AnimatePresence>
                {bankerBonus && bankerBonus.type && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.8 }}
                        className="mb-4 p-3 rounded-xl bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/50"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <span className="text-sm font-bold text-purple-300">BANKER BONUS!</span>
                            <span className="text-xl">{getBonusIcon()}</span>
                        </div>
                        <p className="text-sm text-gray-300">{bankerBonus.description}</p>
                        {onBonusAccept && (
                            <button
                                onClick={onBonusAccept}
                                className="mt-2 px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-bold transition-colors"
                            >
                                Accept Bonus
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="min-h-[120px] flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                    {phase === 'waiting' && (
                        <motion.div
                            key="waiting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center text-gray-400"
                        >
                            <p>Open cases to get the banker&apos;s offer</p>
                        </motion.div>
                    )}

                    {phase === 'calling' && (
                        <motion.div
                            key="calling"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="text-center"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className="text-4xl mb-2"
                            >
                                📞
                            </motion.div>
                            <p className="text-casino-gold font-bold">The Banker is calling...</p>
                        </motion.div>
                    )}

                    {(phase === 'revealed' || phase === 'decision') && offer !== null && (
                        <motion.div
                            key="offer"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center w-full"
                        >
                            <p className="text-sm text-gray-400 mb-1">The Banker offers</p>
                            <motion.div
                                animate={isAnimating ? { scale: [1, 1.02, 1] } : {}}
                                transition={{ repeat: isAnimating ? Infinity : 0, duration: 0.2 }}
                                className="text-4xl md:text-5xl font-display font-bold text-casino-gold mb-2"
                            >
                                {formatValue(displayedOffer)}
                            </motion.div>

                            {/* Offer percentage indicator */}
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <div className="h-2 w-32 bg-gray-700 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(offerPercentage, 100)}%` }}
                                        transition={{ delay: 0.5, duration: 0.8 }}
                                        className={`h-full rounded-full ${offerPercentage >= 90 ? 'bg-casino-green' :
                                            offerPercentage >= 70 ? 'bg-casino-gold' :
                                                'bg-red-500'
                                            }`}
                                    />
                                </div>
                                <span className={`text-sm font-bold ${offerPercentage >= 90 ? 'text-casino-green' :
                                    offerPercentage >= 70 ? 'text-casino-gold' :
                                        'text-red-400'
                                    }`}>
                                    {offerPercentage}% EV
                                </span>
                            </div>

                            {/* Deal/No Deal Buttons */}
                            {phase === 'decision' && (
                                <div className="flex gap-3 justify-center">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={onDeal}
                                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-casino-green to-emerald-600 font-bold text-lg shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-shadow"
                                    >
                                        <ThumbsUp className="w-5 h-5" />
                                        DEAL
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={onNoDeal}
                                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 font-bold text-lg shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-shadow"
                                    >
                                        <ThumbsDown className="w-5 h-5" />
                                        NO DEAL
                                    </motion.button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
