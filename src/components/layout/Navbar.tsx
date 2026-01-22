'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Gamepad2, Trophy, User, LogOut, Wallet } from 'lucide-react';
import { useAuth } from '@/app/providers';
import WalletPanel from '@/components/WalletPanel';

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/games', label: 'Games' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/history', label: 'History' },
];

export function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isWalletOpen, setIsWalletOpen] = useState(false);
    const { user, logout, isLoading } = useAuth();

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 glass-dark">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-casino-gold to-casino-accent flex items-center justify-center shadow-neon-gold group-hover:scale-110 transition-transform">
                                <Gamepad2 className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-display font-bold text-xl gradient-text hidden sm:block">
                                USGRP Casino
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-gray-300 hover:text-white transition-colors font-medium relative group"
                                >
                                    {link.label}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-casino-accent transition-all group-hover:w-full" />
                                </Link>
                            ))}
                        </div>

                        {/* User Menu */}
                        <div className="flex items-center gap-4">
                            {!isLoading && (
                                <>
                                    {user ? (
                                        <div className="flex items-center gap-3">
                                            {/* Wallet Button */}
                                            <button
                                                onClick={() => setIsWalletOpen(true)}
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 hover:border-yellow-500/60 transition-all"
                                                title="Casino Wallet"
                                            >
                                                <Wallet className="w-4 h-4 text-yellow-400" />
                                                <span className="text-yellow-400 font-medium text-sm hidden sm:inline">Wallet</span>
                                            </button>

                                            <div className="hidden sm:flex items-center gap-2 px-4 py-2 glass rounded-full">
                                                <img
                                                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=e94560&color=fff`}
                                                    alt={user.username}
                                                    className="w-8 h-8 rounded-full"
                                                />
                                                <span className="font-medium">{user.username}</span>
                                            </div>
                                            <button
                                                onClick={logout}
                                                className="p-2 text-gray-400 hover:text-casino-accent transition-colors"
                                                title="Logout"
                                            >
                                                <LogOut className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <Link href="/login" className="btn-primary text-sm">
                                            Login with Discord
                                        </Link>
                                    )}
                                </>
                            )}

                            {/* Mobile menu button */}
                            <button
                                className="md:hidden p-2 text-gray-300 hover:text-white"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden glass-dark border-t border-white/10"
                        >
                            <div className="px-4 py-4 space-y-2">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="block py-3 px-4 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Wallet Panel */}
            <WalletPanel
                isOpen={isWalletOpen}
                onClose={() => setIsWalletOpen(false)}
            />
        </>
    );
}

