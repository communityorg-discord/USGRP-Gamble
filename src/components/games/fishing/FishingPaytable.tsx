'use client';

const SYMBOLS = [
    // Cards
    { emoji: '🔟', name: '10', pay5: 5, pay4: 2, pay3: 1, type: 'card' },
    { emoji: 'J', name: 'Jack', pay5: 8, pay4: 3, pay3: 1.5, type: 'card' },
    { emoji: 'Q', name: 'Queen', pay5: 10, pay4: 4, pay3: 2, type: 'card' },
    { emoji: 'K', name: 'King', pay5: 12, pay4: 5, pay3: 2.5, type: 'card' },
    { emoji: 'A', name: 'Ace', pay5: 15, pay4: 6, pay3: 3, type: 'card' },
    // Gear
    { emoji: '🧰', name: 'Tackle Box', pay5: 50, pay4: 15, pay3: 5, type: 'gear' },
    { emoji: '🛟', name: 'Lifebuoy', pay5: 80, pay4: 25, pay3: 8, type: 'gear' },
    { emoji: '🎣', name: 'Fishing Rod', pay5: 120, pay4: 40, pay3: 12, type: 'gear' },
    { emoji: '🦅', name: 'Pelican', pay5: 200, pay4: 60, pay3: 20, type: 'high' },
    // Fish (collected by Fisherman)
    { emoji: '🐟', name: 'Blue Fish', pay5: '2-5x', pay4: '-', pay3: '-', type: 'fish', note: 'Cash value' },
    { emoji: '🐠', name: 'Orange Fish', pay5: '5-15x', pay4: '-', pay3: '-', type: 'fish', note: 'Cash value' },
    { emoji: '🐡', name: 'Puffer Fish', pay5: '10-25x', pay4: '-', pay3: '-', type: 'fish', note: 'Cash value' },
    { emoji: '🦈', name: 'Shark', pay5: '25-50x', pay4: '-', pay3: '-', type: 'fish', note: 'Cash value' },
    { emoji: '🐋', name: 'Whale', pay5: '50-100x', pay4: '-', pay3: '-', type: 'fish', note: 'Cash value' },
    // Special
    { emoji: '👨‍🦱', name: 'Fisherman (Wild)', pay5: '1000x', pay4: '-', pay3: '-', type: 'wild', note: 'Reels in all fish!' },
    { emoji: '⛵', name: 'Fishing Boat (Scatter)', pay5: '20 Spins', pay4: '15 Spins', pay3: '10 Spins', type: 'scatter', note: 'Free Spins' },
];

export default function FishingPaytable() {
    return (
        <div className="glass rounded-2xl p-6">
            <h2 className="text-xl font-display font-bold mb-4 text-center">
                🎣 Paytable (5-of-a-kind at max)
            </h2>

            {/* Special Symbols */}
            <div className="mb-6">
                <h3 className="text-sm font-bold text-casino-gold mb-3">⭐ Special Symbols</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {SYMBOLS.filter(s => s.type === 'wild' || s.type === 'scatter').map((symbol) => (
                        <div
                            key={symbol.name}
                            className={`flex items-center gap-3 p-3 rounded-xl ${symbol.type === 'wild'
                                    ? 'bg-gradient-to-r from-casino-gold/20 to-yellow-500/10 border border-casino-gold/40'
                                    : 'bg-gradient-to-r from-casino-green/20 to-emerald-500/10 border border-casino-green/40'
                                }`}
                        >
                            <span className="text-3xl">{symbol.emoji}</span>
                            <div className="flex-1">
                                <p className="font-bold">{symbol.name}</p>
                                <p className="text-sm text-gray-400">{symbol.note}</p>
                            </div>
                            <div className="text-right">
                                <span className={`font-bold ${symbol.type === 'wild' ? 'text-casino-gold' : 'text-casino-green'}`}>
                                    {symbol.pay5}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Fish Symbols */}
            <div className="mb-6">
                <h3 className="text-sm font-bold text-blue-400 mb-3">🐟 Fish (Collected by Fisherman)</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {SYMBOLS.filter(s => s.type === 'fish').map((symbol) => (
                        <div
                            key={symbol.name}
                            className="flex flex-col items-center p-3 rounded-xl bg-blue-500/10 border border-blue-500/30"
                        >
                            <span className="text-2xl mb-1">{symbol.emoji}</span>
                            <p className="text-xs text-gray-400">{symbol.name}</p>
                            <p className="text-sm font-bold text-blue-400">{symbol.pay5}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Regular Symbols */}
            <div>
                <h3 className="text-sm font-bold text-gray-400 mb-3">💎 Regular Symbols</h3>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {SYMBOLS.filter(s => s.type === 'gear' || s.type === 'high').map((symbol) => (
                        <div
                            key={symbol.name}
                            className="flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/10"
                        >
                            <span className="text-xl mb-1">{symbol.emoji}</span>
                            <p className="text-xs text-gray-500">{symbol.name}</p>
                            <p className="text-xs font-semibold text-casino-gold">{symbol.pay5}x</p>
                        </div>
                    ))}
                    {SYMBOLS.filter(s => s.type === 'card').map((symbol) => (
                        <div
                            key={symbol.name}
                            className="flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/10"
                        >
                            <span className="text-xl mb-1 font-bold text-gray-400">{symbol.emoji}</span>
                            <p className="text-xs text-gray-500">{symbol.name}</p>
                            <p className="text-xs text-gray-400">{symbol.pay5}x</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Info */}
            <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-500 text-center">
                <p>10 Paylines • Wins pay left to right • Wild substitutes all except Scatter</p>
                <p className="mt-1">When Fisherman appears, all visible Fish values are collected!</p>
            </div>
        </div>
    );
}
