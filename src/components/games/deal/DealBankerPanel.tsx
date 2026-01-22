'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff } from 'lucide-react';

interface DealBankerPanelProps {
    bankerOffer: number | null;
    expectedValue: number;
    offerPercentage: number;
    isCalculating: boolean;
    onDeal: () => void;
    onNoDeal: () => void;
    canDecide: boolean;
    currentRound: number;
    isFinalRound: boolean;
    onOpenFinalCase: () => void;
}

export default function DealBankerPanel({
    bankerOffer,
    expectedValue,
    offerPercentage,
    isCalculating,
    onDeal,
    onNoDeal,
    canDecide,
    currentRound,
    isFinalRound,
    onOpenFinalCase,
}: DealBankerPanelProps) {
    const [displayedOffer, setDisplayedOffer] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showPhone, setShowPhone] = useState(false);

    // Animate offer count-up
    useEffect(() => {
        if (bankerOffer !== null && bankerOffer > 0) {
            setIsAnimating(true);
            setShowPhone(true);

            // Suspense delay
            const suspenseDelay = 400 + Math.random() * 500; // 400-900ms

            setTimeout(() => {
                // Count-up animation
                const duration = 700 + Math.random() * 700; // 0.7-1.4s
                const startTime = Date.now();
                const startValue = 0;
                const endValue = bankerOffer;

                const animate = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);

                    // Ease out cubic
                    const easedProgress = 1 - Math.pow(1 - progress, 3);
                    const currentValue = Math.floor(startValue + (endValue - startValue) * easedProgress);

                    setDisplayedOffer(currentValue);

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        setIsAnimating(false);
                    }
                };

                requestAnimationFrame(animate);
            }, suspenseDelay);
        } else {
            setDisplayedOffer(0);
            setShowPhone(false);
        }
    }, [bankerOffer]);

    // Get offer quality color
    const getOfferColor = (): string => {
        if (offerPercentage >= 95) return 'text-casino-green';
        if (offerPercentage >= 85) return 'text-casino-gold';
        if (offerPercentage >= 75) return 'text-orange-400';
        return 'text-red-400';
    };

    return (
        <div className="glass rounded-2xl p-6 border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-bold flex items-center gap-2">
                    🎩 Banker
                </h3>
                <span className="text-sm text-gray-400">Round {currentRound}</span>
            </div>

            {/* Phone ringing animation */}
            <AnimatePresence>
                {isCalculating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center py-8"
                    >
                        <motion.div
                            animate={{
                                rotate: [-5, 5, -5],
                                scale: [1, 1.1, 1],
                            }}
                            transition={{ duration: 0.2, repeat: Infinity }}
                            className="text-5xl mb-4"
                        >
                            📞
                        </motion.div>
                        <p className="text-gray-400">The banker is calling...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Offer Display */}
            <AnimatePresence>
                {showPhone && !isCalculating && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center"
                    >
                        <p className="text-gray-400 mb-2">The Banker's Offer</p>

                        <motion.div
                            animate={isAnimating ? { scale: [1, 1.02, 1] } : {}}
                            transition={{ duration: 0.1, repeat: isAnimating ? Infinity : 0 }}
                            className="text-4xl md:text-5xl font-display font-bold neon-gold mb-3"
                        >
                            ${displayedOffer.toLocaleString()}
                        </motion.div>

                        {/* Offer analysis */}
                        {!isAnimating && bankerOffer !== null && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="space-y-2 mb-6"
                            >
                                <div className="flex items-center justify-center gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-400">Expected Value: </span>
                                        <span className="font-bold">${expectedValue.toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">Offer: </span>
                                        <span className={`font-bold ${getOfferColor()}`}>
                                            {offerPercentage}% of EV
                                        </span>
                                    </div>
                                </div>

                                {/* Offer quality indicator */}
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(offerPercentage, 100)}%` }}
                                            transition={{ duration: 0.5, delay: 0.5 }}
                                            className={`h-full ${offerPercentage >= 95 ? 'bg-casino-green' :
                                                    offerPercentage >= 85 ? 'bg-casino-gold' :
                                                        offerPercentage >= 75 ? 'bg-orange-400' : 'bg-red-400'
                                                }`}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Decision Buttons */}
                        {canDecide && !isAnimating && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="flex gap-4 justify-center"
                            >
                                {isFinalRound ? (
                                    <>
                                        <motion.button
                                            onClick={onDeal}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="px-8 py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-casino-green to-emerald-600 hover:shadow-neon-green transition-all flex items-center gap-2"
                                        >
                                            <Phone className="w-5 h-5" />
                                            DEAL
                                        </motion.button>
                                        <motion.button
                                            onClick={onOpenFinalCase}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="px-8 py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-casino-accent to-casino-purple hover:shadow-neon-pink transition-all flex items-center gap-2"
                                        >
                                            📦 Open My Case
                                        </motion.button>
                                    </>
                                ) : (
                                    <>
                                        <motion.button
                                            onClick={onDeal}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="px-8 py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-casino-green to-emerald-600 hover:shadow-neon-green transition-all flex items-center gap-2"
                                        >
                                            <Phone className="w-5 h-5" />
                                            DEAL
                                        </motion.button>
                                        <motion.button
                                            onClick={onNoDeal}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="px-8 py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-red-600 to-red-800 hover:shadow-lg transition-all flex items-center gap-2"
                                        >
                                            <PhoneOff className="w-5 h-5" />
                                            NO DEAL
                                        </motion.button>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Waiting state */}
            {!showPhone && !isCalculating && (
                <div className="text-center py-8 text-gray-500">
                    <p>Open cases to get the banker's offer</p>
                </div>
            )}
        </div>
    );
}
