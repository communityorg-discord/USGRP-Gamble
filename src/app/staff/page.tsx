'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Users, Phone, DollarSign, RefreshCw, X, Send } from 'lucide-react';

interface ActivePlayer {
    discordId: string;
    username: string;
    avatar?: string;
    currentGame: string;
    chips: number;
    lastActivity: number;
}

interface BankerSession {
    playerId: string;
    staffId: string;
    staffName: string;
    gameType: string;
    startedAt: number;
}

const STAFF_CODE = '470303';

export default function StaffPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [codeInput, setCodeInput] = useState('');
    const [codeError, setCodeError] = useState('');

    const [activePlayers, setActivePlayers] = useState<ActivePlayer[]>([]);
    const [bankerSessions, setBankerSessions] = useState<BankerSession[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<ActivePlayer | null>(null);
    const [customOffer, setCustomOffer] = useState('');
    const [offerMessage, setOfferMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Check for saved auth
    useEffect(() => {
        const savedAuth = sessionStorage.getItem('staff_auth');
        if (savedAuth === STAFF_CODE) {
            setIsAuthenticated(true);
        }
    }, []);

    // Handle code submission
    const handleCodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (codeInput === STAFF_CODE) {
            setIsAuthenticated(true);
            sessionStorage.setItem('staff_auth', STAFF_CODE);
            setCodeError('');
        } else {
            setCodeError('Invalid code');
        }
    };

    // Fetch active players
    const fetchPlayers = useCallback(async () => {
        try {
            const response = await fetch('/api/staff/players');
            if (response.ok) {
                const data = await response.json();
                setActivePlayers(data.players || []);
                setBankerSessions(data.bankerSessions || []);
            }
        } catch (error) {
            console.error('Failed to fetch players:', error);
        }
    }, []);

    // Poll for updates
    useEffect(() => {
        if (!isAuthenticated) return;

        fetchPlayers();
        const interval = setInterval(fetchPlayers, 3000);
        return () => clearInterval(interval);
    }, [isAuthenticated, fetchPlayers]);

    // Start Real Banker session
    const startBankerSession = async (player: ActivePlayer) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/staff/banker', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'start',
                    playerId: player.discordId,
                    gameType: player.currentGame,
                }),
            });

            if (response.ok) {
                setSelectedPlayer(player);
                fetchPlayers();
            }
        } catch (error) {
            console.error('Failed to start session:', error);
        }
        setIsLoading(false);
    };

    // End Real Banker session
    const endBankerSession = async (playerId: string) => {
        try {
            await fetch('/api/staff/banker', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'end',
                    playerId,
                }),
            });

            if (selectedPlayer?.discordId === playerId) {
                setSelectedPlayer(null);
            }
            fetchPlayers();
        } catch (error) {
            console.error('Failed to end session:', error);
        }
    };

    // Send custom offer
    const sendOffer = async () => {
        if (!selectedPlayer || !customOffer) return;

        setIsLoading(true);
        try {
            await fetch('/api/staff/offer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId: selectedPlayer.discordId,
                    offer: parseInt(customOffer),
                    message: offerMessage,
                }),
            });

            setCustomOffer('');
            setOfferMessage('');
        } catch (error) {
            console.error('Failed to send offer:', error);
        }
        setIsLoading(false);
    };

    // Code entry screen
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass rounded-2xl p-8 w-full max-w-md text-center"
                >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-white" />
                    </div>

                    <h1 className="text-2xl font-display font-bold mb-2">Staff Access</h1>
                    <p className="text-gray-400 mb-6">Enter staff code to continue</p>

                    <form onSubmit={handleCodeSubmit}>
                        <input
                            type="password"
                            value={codeInput}
                            onChange={(e) => setCodeInput(e.target.value)}
                            placeholder="Enter code"
                            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-center text-2xl tracking-widest focus:border-red-500 focus:outline-none"
                            maxLength={6}
                        />

                        {codeError && (
                            <p className="text-red-400 text-sm mt-2">{codeError}</p>
                        )}

                        <button
                            type="submit"
                            className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 font-bold hover:from-red-500 hover:to-red-600 transition-all"
                        >
                            Access Staff Panel
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    // Staff dashboard
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-red-400">Staff Panel</h1>
                        <p className="text-gray-400">Casino Floor Control</p>
                    </div>
                    <button
                        onClick={fetchPlayers}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Active Players */}
                    <div className="lg:col-span-2">
                        <div className="glass rounded-2xl p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-green-400" />
                                Active Players ({activePlayers.length})
                            </h2>

                            {activePlayers.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No active players</p>
                            ) : (
                                <div className="space-y-3">
                                    {activePlayers.map((player) => {
                                        const hasSession = bankerSessions.some(s => s.playerId === player.discordId);

                                        return (
                                            <div
                                                key={player.discordId}
                                                className={`flex items-center justify-between p-4 rounded-xl transition-colors ${hasSession ? 'bg-red-500/20 border border-red-500/40' : 'bg-slate-800/50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {player.avatar ? (
                                                        <img
                                                            src={`https://cdn.discordapp.com/avatars/${player.discordId}/${player.avatar}.png`}
                                                            alt={player.username}
                                                            className="w-10 h-10 rounded-full"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                                                            {player.username[0]?.toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-bold">{player.username}</p>
                                                        <p className="text-sm text-gray-400">
                                                            {player.currentGame} • ${player.chips.toLocaleString()} chips
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {hasSession ? (
                                                        <button
                                                            onClick={() => endBankerSession(player.discordId)}
                                                            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-bold"
                                                        >
                                                            End Session
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => startBankerSession(player)}
                                                            disabled={isLoading}
                                                            className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-sm font-bold disabled:opacity-50"
                                                        >
                                                            Be Banker
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Banker Control Panel */}
                    <div>
                        <div className="glass rounded-2xl p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Phone className="w-5 h-5 text-yellow-400" />
                                Banker Control
                            </h2>

                            {selectedPlayer ? (
                                <div className="space-y-4">
                                    <div className="bg-slate-800 rounded-xl p-4">
                                        <p className="text-sm text-gray-400">Controlling</p>
                                        <p className="font-bold text-lg">{selectedPlayer.username}</p>
                                        <p className="text-sm text-gray-400">{selectedPlayer.currentGame}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm text-gray-400 block mb-1">Custom Offer</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="number"
                                                    value={customOffer}
                                                    onChange={(e) => setCustomOffer(e.target.value)}
                                                    placeholder="Amount"
                                                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:border-yellow-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm text-gray-400 block mb-1">Message (optional)</label>
                                        <input
                                            type="text"
                                            value={offerMessage}
                                            onChange={(e) => setOfferMessage(e.target.value)}
                                            placeholder="e.g., Take it or leave it!"
                                            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:border-yellow-500 focus:outline-none"
                                        />
                                    </div>

                                    <button
                                        onClick={sendOffer}
                                        disabled={!customOffer || isLoading}
                                        className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-600 to-orange-600 font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <Send className="w-4 h-4" />
                                        Send Offer
                                    </button>

                                    <button
                                        onClick={() => endBankerSession(selectedPlayer.discordId)}
                                        className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
                                    >
                                        End Session
                                    </button>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">
                                    Select a player to control their game
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
