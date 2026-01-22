'use client';

import { motion } from 'framer-motion';
import { Minus, Plus, Zap, Repeat, Volume2, VolumeX, Music, SkipForward, Settings } from 'lucide-react';

interface FishingControlsProps {
    betAmount: number;
    onBetChange: (amount: number) => void;
    turboMode: boolean;
    onTurboToggle: () => void;
    autoSpinCount: number | null;
    onAutoSpinChange: (count: number | null) => void;
    skipWinAnimations: boolean;
    onSkipWinAnimationsToggle: () => void;
    soundEnabled: boolean;
    musicEnabled: boolean;
    onSoundToggle: () => void;
    onMusicToggle: () => void;
    isSpinning: boolean;
    onSpin: () => void;
    canSpin: boolean;
    showSettings: boolean;
    onSettingsToggle: () => void;
    autoSpinStopConditions: {
        onWin: boolean;
        onBigWin: boolean;
        balanceBelow: number | null;
        profitTarget: number | null;
    };
    onAutoSpinStopConditionsChange: (conditions: FishingControlsProps['autoSpinStopConditions']) => void;
}

const BET_PRESETS = [10, 25, 50, 100, 250, 500];
const AUTO_SPIN_OPTIONS = [10, 25, 50, 100, Infinity];

export default function FishingControls({
    betAmount,
    onBetChange,
    turboMode,
    onTurboToggle,
    autoSpinCount,
    onAutoSpinChange,
    skipWinAnimations,
    onSkipWinAnimationsToggle,
    soundEnabled,
    musicEnabled,
    onSoundToggle,
    onMusicToggle,
    isSpinning,
    onSpin,
    canSpin,
    showSettings,
    onSettingsToggle,
    autoSpinStopConditions,
    onAutoSpinStopConditionsChange,
}: FishingControlsProps) {
    const adjustBet = (delta: number) => {
        const newBet = Math.max(10, Math.min(10000, betAmount + delta));
        onBetChange(newBet);
    };

    return (
        <div className="space-y-4">
            {/* Main Controls Row */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                {/* Bet Amount */}
                <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm">BET</span>
                    <button
                        onClick={() => adjustBet(-10)}
                        disabled={isSpinning || betAmount <= 10}
                        className="w-10 h-10 rounded-lg glass flex items-center justify-center hover:bg-white/10 disabled:opacity-50 transition-all"
                    >
                        <Minus className="w-4 h-4" />
                    </button>

                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-casino-gold">$</span>
                        <input
                            type="number"
                            value={betAmount}
                            onChange={(e) => onBetChange(Math.max(10, Math.min(10000, parseInt(e.target.value) || 10)))}
                            disabled={isSpinning}
                            className="w-28 pl-7 pr-3 py-2 text-xl font-bold text-center glass rounded-xl border border-casino-gold/30 focus:border-casino-gold focus:outline-none bg-transparent neon-gold"
                        />
                    </div>

                    <button
                        onClick={() => adjustBet(10)}
                        disabled={isSpinning || betAmount >= 10000}
                        className="w-10 h-10 rounded-lg glass flex items-center justify-center hover:bg-white/10 disabled:opacity-50 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Spin Button */}
                <motion.button
                    onClick={onSpin}
                    disabled={!canSpin || isSpinning}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-16 py-4 rounded-2xl font-display font-bold text-xl transition-all relative overflow-hidden ${isSpinning
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-casino-accent to-casino-purple hover:shadow-neon-pink'
                        }`}
                >
                    {isSpinning ? (
                        <span className="flex items-center gap-2">
                            <motion.span
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                                🎣
                            </motion.span>
                            {turboMode ? 'TURBO...' : 'SPINNING...'}
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <Zap className="w-6 h-6" />
                            {autoSpinCount !== null ? `AUTO (${autoSpinCount === Infinity ? '∞' : autoSpinCount})` : 'SPIN'}
                        </span>
                    )}

                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
                </motion.button>

                {/* Quick Controls */}
                <div className="flex items-center gap-2">
                    {/* Turbo Toggle */}
                    <button
                        onClick={onTurboToggle}
                        disabled={isSpinning}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${turboMode
                                ? 'bg-casino-accent text-white shadow-neon-pink'
                                : 'glass text-gray-400 hover:text-white'
                            }`}
                        title="Turbo Mode"
                    >
                        <Zap className="w-4 h-4" />
                        <span className="hidden sm:inline">Turbo</span>
                    </button>

                    {/* Settings Toggle */}
                    <button
                        onClick={onSettingsToggle}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${showSettings
                                ? 'bg-casino-purple text-white'
                                : 'glass text-gray-400 hover:text-white'
                            }`}
                        title="Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Bet Presets */}
            <div className="flex gap-2 justify-center flex-wrap">
                {BET_PRESETS.map((preset) => (
                    <button
                        key={preset}
                        onClick={() => onBetChange(preset)}
                        disabled={isSpinning}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${betAmount === preset
                                ? 'bg-casino-gold text-black'
                                : 'glass text-gray-300 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        ${preset}
                    </button>
                ))}
            </div>

            {/* Expanded Settings Panel */}
            {showSettings && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="glass rounded-2xl p-4 space-y-4"
                >
                    {/* Auto Spin */}
                    <div>
                        <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                            <Repeat className="w-4 h-4" />
                            Auto Spin
                        </h4>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => onAutoSpinChange(null)}
                                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${autoSpinCount === null
                                        ? 'bg-casino-accent text-white'
                                        : 'glass text-gray-400 hover:text-white'
                                    }`}
                            >
                                Off
                            </button>
                            {AUTO_SPIN_OPTIONS.map((count) => (
                                <button
                                    key={count}
                                    onClick={() => onAutoSpinChange(count)}
                                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${autoSpinCount === count
                                            ? 'bg-casino-accent text-white'
                                            : 'glass text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {count === Infinity ? '∞' : count}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Auto Spin Stop Conditions */}
                    {autoSpinCount !== null && (
                        <div className="pl-4 border-l-2 border-casino-accent/30 space-y-2">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={autoSpinStopConditions.onWin}
                                    onChange={(e) => onAutoSpinStopConditionsChange({
                                        ...autoSpinStopConditions,
                                        onWin: e.target.checked,
                                    })}
                                    className="rounded"
                                />
                                Stop on any win
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={autoSpinStopConditions.onBigWin}
                                    onChange={(e) => onAutoSpinStopConditionsChange({
                                        ...autoSpinStopConditions,
                                        onBigWin: e.target.checked,
                                    })}
                                    className="rounded"
                                />
                                Stop on big win (10x+)
                            </label>
                            <div className="flex items-center gap-2 text-sm">
                                <span>Stop if balance below:</span>
                                <input
                                    type="number"
                                    value={autoSpinStopConditions.balanceBelow || ''}
                                    onChange={(e) => onAutoSpinStopConditionsChange({
                                        ...autoSpinStopConditions,
                                        balanceBelow: e.target.value ? parseInt(e.target.value) : null,
                                    })}
                                    placeholder="$"
                                    className="w-24 px-2 py-1 rounded glass text-sm bg-transparent"
                                />
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span>Stop at profit target:</span>
                                <input
                                    type="number"
                                    value={autoSpinStopConditions.profitTarget || ''}
                                    onChange={(e) => onAutoSpinStopConditionsChange({
                                        ...autoSpinStopConditions,
                                        profitTarget: e.target.value ? parseInt(e.target.value) : null,
                                    })}
                                    placeholder="$"
                                    className="w-24 px-2 py-1 rounded glass text-sm bg-transparent"
                                />
                            </div>
                        </div>
                    )}

                    {/* Audio Controls */}
                    <div className="flex items-center gap-4">
                        <h4 className="text-sm font-bold">Audio</h4>
                        <button
                            onClick={onSoundToggle}
                            className={`p-2 rounded-lg transition-all ${soundEnabled ? 'text-casino-gold' : 'text-gray-500'
                                }`}
                            title="Sound Effects"
                        >
                            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={onMusicToggle}
                            className={`p-2 rounded-lg transition-all ${musicEnabled ? 'text-casino-gold' : 'text-gray-500'
                                }`}
                            title="Background Music"
                        >
                            <Music className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Skip Win Animations */}
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={skipWinAnimations}
                            onChange={onSkipWinAnimationsToggle}
                            className="rounded"
                        />
                        <SkipForward className="w-4 h-4" />
                        Skip win animations
                    </label>
                </motion.div>
            )}
        </div>
    );
}
