'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { motion } from 'framer-motion';

function AuthSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            login(token).then(() => {
                router.push('/games');
            });
        } else {
            router.push('/login?error=no_token');
        }
    }, [searchParams, login, router]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
        >
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-casino-gold border-t-transparent"
            />
            <h1 className="text-2xl font-display font-bold mb-2">Logging you in...</h1>
            <p className="text-gray-400">Please wait while we set up your account</p>
        </motion.div>
    );
}

export default function AuthSuccessPage() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Suspense fallback={
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-casino-gold border-t-transparent animate-spin" />
                    <p className="text-gray-400">Loading...</p>
                </div>
            }>
                <AuthSuccessContent />
            </Suspense>
        </div>
    );
}
