'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, AlertCircle, Gamepad2 } from 'lucide-react';
import Link from 'next/link';

// Hardcoded credentials (same as citizen.usgrp.xyz)
const DISCORD_CLIENT_ID = '1459400314372489246';
const REDIRECT_URI = 'https://gamble.usgrp.xyz/api/auth/callback';

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const errorParam = params.get('error');
        if (errorParam) {
            const errorMessages: Record<string, string> = {
                'discord_denied': 'You denied the Discord authorization request.',
                'no_code': 'No authorization code received from Discord.',
                'oauth_failed': 'Failed to authenticate with Discord. Please try again.',
                'not_citizen': 'You must be a registered USGRP citizen to play.',
            };
            setError(errorMessages[errorParam] || 'An error occurred. Please try again.');
        }
    }, []);

    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;

    return (
        <div className="min-h-screen flex items-center justify-center py-16 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full"
            >
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 10 }}
                        className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-casino-gold to-casino-accent flex items-center justify-center shadow-neon-gold"
                    >
                        <Gamepad2 className="w-10 h-10 text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-display font-bold mb-2">
                        Welcome to <span className="gradient-text">USGRP Casino</span>
                    </h1>
                    <p className="text-gray-400">
                        Login with your Discord account to start playing
                    </p>
                </div>

                <div className="glass rounded-2xl p-8">
                    {/* Error Display */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3"
                        >
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-red-400 text-sm">{error}</p>
                        </motion.div>
                    )}

                    {/* Discord Login Button */}
                    <a
                        href={discordAuthUrl}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] transition-all font-bold text-white text-lg"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                        </svg>
                        Login with Discord
                        <ExternalLink className="w-4 h-4" />
                    </a>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        <p>By logging in, you agree to our Terms of Service</p>
                        <p className="mt-1">and acknowledge that you are 18+ years old.</p>
                    </div>
                </div>

                {/* Features */}
                <div className="mt-8 grid grid-cols-3 gap-4">
                    {[
                        { icon: '🎰', label: 'Slots' },
                        { icon: '🃏', label: 'Blackjack' },
                        { icon: '🎡', label: 'Roulette' },
                    ].map((game) => (
                        <div
                            key={game.label}
                            className="glass rounded-xl p-4 text-center hover:border-casino-accent/50 transition-colors"
                        >
                            <span className="text-2xl block mb-1">{game.icon}</span>
                            <span className="text-sm text-gray-400">{game.label}</span>
                        </div>
                    ))}
                </div>

                {/* Back to home */}
                <div className="mt-8 text-center">
                    <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                        ← Back to Home
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
