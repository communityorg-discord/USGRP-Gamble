import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { WalletBar } from '@/components/layout/WalletBar';
import { Providers } from './providers';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

const outfit = Outfit({
    subsets: ['latin'],
    variable: '--font-outfit',
});

export const metadata: Metadata = {
    title: 'USGRP Casino | Premium Gambling Experience',
    description: 'The official USGRP gambling platform. Play slots, blackjack, roulette, and more with your USGRP balance.',
    keywords: ['casino', 'gambling', 'slots', 'blackjack', 'roulette', 'USGRP'],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
            <body className="min-h-screen bg-casino-bg font-body antialiased">
                <Providers>
                    {/* Background gradient effects */}
                    <div className="fixed inset-0 pointer-events-none">
                        <div className="absolute top-0 left-1/4 w-96 h-96 bg-casino-purple/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-casino-accent/10 rounded-full blur-3xl" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-casino-gold/5 rounded-full blur-3xl" />
                    </div>

                    <div className="relative z-10 flex flex-col min-h-screen">
                        <Navbar />
                        <WalletBar />
                        <main className="flex-1 pt-32">
                            {children}
                        </main>
                        <footer className="glass-dark mt-auto py-6 text-center text-sm text-gray-400">
                            <p>© 2026 USGRP Casino. All rights reserved.</p>
                            <p className="mt-1 text-xs">Gamble responsibly. Must be 18+ to play.</p>
                        </footer>
                    </div>
                </Providers>
            </body>
        </html>
    );
}
