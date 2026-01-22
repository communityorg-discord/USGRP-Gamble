'use client';

import { SYMBOL_CONFIG } from './FishingReelCanvas';

export default function FishingPaytable() {
    return (
        <div className="glass rounded-2xl p-6">
            <h3 className="text-xl font-display font-bold mb-4 text-center">
                🎣 Paytable
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {SYMBOL_CONFIG.filter(s => s.id !== 0).map((symbol) => (
                    <div
                        key={symbol.id}
                        className="text-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                    >
                        <span className="text-3xl block mb-2">{symbol.emoji}</span>
                        <p className="text-xs text-gray-400 mb-1">{symbol.name}</p>
                        <p className="text-casino-gold font-bold">
                            {symbol.id === 9 ? 'WILD' : `${getMultiplier(symbol.id)}x`}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
                <h4 className="text-sm font-bold mb-3 text-center text-casino-gold">Paylines</h4>
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div className="p-2 rounded-lg bg-white/5">
                        <p className="text-gray-400">Top Row</p>
                        <p className="font-bold">Line 1</p>
                    </div>
                    <div className="p-2 rounded-lg bg-casino-accent/20 border border-casino-accent/40">
                        <p className="text-gray-400">Middle Row</p>
                        <p className="font-bold text-casino-accent">Line 2 ★</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5">
                        <p className="text-gray-400">Bottom Row</p>
                        <p className="font-bold">Line 3</p>
                    </div>
                </div>
            </div>

            <div className="mt-4 text-center text-xs text-gray-500">
                <p>Match 3 symbols on a payline to win!</p>
                <p className="mt-1">🐡 Golden Fish is WILD and substitutes for any symbol</p>
                <p className="mt-1">RTP: 96% | Min Bet: $10 | Max Bet: $10,000</p>
            </div>
        </div>
    );
}

function getMultiplier(symbolId: number): number {
    const multipliers: Record<number, number> = {
        1: 2,   // Starfish
        2: 3,   // Shell
        3: 4,   // Crab
        4: 5,   // Fish
        5: 8,   // Tropical Fish
        6: 12,  // Dolphin
        7: 20,  // Shark
        8: 50,  // Treasure
        9: 100, // Wild (all wilds)
    };
    return multipliers[symbolId] || 0;
}
