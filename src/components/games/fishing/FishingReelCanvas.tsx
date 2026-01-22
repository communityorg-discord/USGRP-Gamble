'use client';

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

// Fishing-themed symbols
const SYMBOL_CONFIG = [
    { id: 0, emoji: '🌿', name: 'Seaweed', color: '#22c55e' },
    { id: 1, emoji: '⭐', name: 'Starfish', color: '#fbbf24' },
    { id: 2, emoji: '🐚', name: 'Shell', color: '#f472b6' },
    { id: 3, emoji: '🦀', name: 'Crab', color: '#ef4444' },
    { id: 4, emoji: '🐟', name: 'Fish', color: '#3b82f6' },
    { id: 5, emoji: '🐠', name: 'Tropical Fish', color: '#f97316' },
    { id: 6, emoji: '🐬', name: 'Dolphin', color: '#06b6d4' },
    { id: 7, emoji: '🦈', name: 'Shark', color: '#6366f1' },
    { id: 8, emoji: '💎', name: 'Treasure', color: '#8b5cf6' },
    { id: 9, emoji: '🐡', name: 'Golden Fish (Wild)', color: '#ffd700' },
];

// Canvas dimensions
const REEL_WIDTH = 120;
const REEL_HEIGHT = 300;
const SYMBOL_HEIGHT = 100;
const VISIBLE_SYMBOLS = 3;
const REEL_GAP = 12;
const TOTAL_REELS = 3;

// Animation timing (in ms)
const NORMAL_SPIN_DURATION = { min: 1600, max: 2400 };
const TURBO_SPIN_DURATION = { min: 700, max: 1000 };
const REEL_STOP_DELAY = [0, { min: 140, max: 220 }, { min: 260, max: 420 }];
const SYMBOL_SLIP = { normal: { min: 1, max: 3 }, turbo: { min: 0, max: 2 } };
const SETTLE_DURATION = { min: 70, max: 110 };

// Easing functions
function easeOutQuint(t: number): number {
    return 1 - Math.pow(1 - t, 5);
}

function springSettle(t: number): number {
    if (t >= 1) return 0;
    return Math.sin(t * Math.PI * 2) * (1 - t) * 8;
}

interface ReelState {
    position: number;
    velocity: number;
    phase: 'idle' | 'spinning' | 'stopping' | 'settling';
    stopTime: number;
    targetPosition: number;
    settleStartTime: number;
    settleOffset: number;
}

export interface FishingReelCanvasHandle {
    spin: (resultSymbols: number[][], turboMode: boolean, onComplete: () => void) => void;
    isSpinning: () => boolean;
}

interface FishingReelCanvasProps {
    winningLines?: number[];
    onSpinStart?: () => void;
    onSpinComplete?: () => void;
}

const FishingReelCanvas = forwardRef<FishingReelCanvasHandle, FishingReelCanvasProps>(
    ({ winningLines = [], onSpinComplete }, ref) => {
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const animationFrameRef = useRef<number>(0);
        const reelStatesRef = useRef<ReelState[]>([]);
        const symbolStripsRef = useRef<number[][]>([]);
        const resultSymbolsRef = useRef<number[][]>([]);
        const isSpinningRef = useRef(false);
        const turboModeRef = useRef(false);
        const onCompleteCallbackRef = useRef<(() => void) | null>(null);
        const winningLinesRef = useRef<number[]>(winningLines);

        // Update winning lines ref
        useEffect(() => {
            winningLinesRef.current = winningLines;
        }, [winningLines]);

        // Generate random symbol strip for spinning
        const generateSymbolStrip = useCallback((length: number = 30): number[] => {
            return Array.from({ length }, () => Math.floor(Math.random() * SYMBOL_CONFIG.length));
        }, []);

        // Initialize reel states and symbol strips
        useEffect(() => {
            reelStatesRef.current = Array(TOTAL_REELS).fill(null).map(() => ({
                position: 0,
                velocity: 0,
                phase: 'idle' as const,
                stopTime: 0,
                targetPosition: 0,
                settleStartTime: 0,
                settleOffset: 0,
            }));
            symbolStripsRef.current = Array(TOTAL_REELS).fill(null).map(() => generateSymbolStrip(50));
            // Initialize with random symbols (nice fish variety)
            resultSymbolsRef.current = [
                [3, 4, 5],  // Crab, Fish, Tropical Fish
                [6, 4, 7],  // Dolphin, Fish, Shark
                [4, 8, 2],  // Fish, Treasure, Shell
            ];
            // Trigger initial render after symbols are set
            setTimeout(() => render(), 50);
        }, [generateSymbolStrip]);

        // Random in range helper
        const randomInRange = (min: number, max: number): number => {
            return min + Math.random() * (max - min);
        };

        // Draw a single symbol
        const drawSymbol = useCallback((
            ctx: CanvasRenderingContext2D,
            symbolId: number,
            x: number,
            y: number,
            highlight: boolean = false
        ) => {
            const symbol = SYMBOL_CONFIG[symbolId] || SYMBOL_CONFIG[0];

            // Background
            ctx.fillStyle = highlight ? 'rgba(255, 215, 0, 0.2)' : 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(x + 4, y + 4, REEL_WIDTH - 8, SYMBOL_HEIGHT - 8);

            // Border
            ctx.strokeStyle = highlight ? '#ffd700' : 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = highlight ? 3 : 1;
            ctx.strokeRect(x + 4, y + 4, REEL_WIDTH - 8, SYMBOL_HEIGHT - 8);

            // Symbol emoji
            ctx.font = '48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(symbol.emoji, x + REEL_WIDTH / 2, y + SYMBOL_HEIGHT / 2);

            // Highlight glow for wins
            if (highlight) {
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 20;
                ctx.fillText(symbol.emoji, x + REEL_WIDTH / 2, y + SYMBOL_HEIGHT / 2);
                ctx.shadowBlur = 0;
            }
        }, []);

        // Draw a single reel
        const drawReel = useCallback((
            ctx: CanvasRenderingContext2D,
            reelIndex: number,
            x: number
        ) => {
            const state = reelStatesRef.current[reelIndex];
            const symbols = symbolStripsRef.current[reelIndex];
            const result = resultSymbolsRef.current[reelIndex];

            // Reel background
            ctx.fillStyle = 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)';
            ctx.fillStyle = '#0f0f1a';
            ctx.fillRect(x, 0, REEL_WIDTH, REEL_HEIGHT);

            // Calculate visible symbols based on position
            const offset = state.position % SYMBOL_HEIGHT + state.settleOffset;
            const startIndex = Math.floor(state.position / SYMBOL_HEIGHT);

            // Draw symbols (one extra above and below for smooth scrolling)
            for (let i = -1; i <= VISIBLE_SYMBOLS + 1; i++) {
                const symbolIndex = (startIndex + i + symbols.length * 100) % symbols.length;
                let symbolId: number;

                // When idle or settling, show result symbols
                if (state.phase === 'idle' || state.phase === 'settling') {
                    if (i >= 0 && i < VISIBLE_SYMBOLS) {
                        symbolId = result[i];
                    } else {
                        symbolId = symbols[symbolIndex];
                    }
                } else {
                    symbolId = symbols[symbolIndex];
                }

                const y = i * SYMBOL_HEIGHT - offset;

                // Only draw if visible
                if (y > -SYMBOL_HEIGHT && y < REEL_HEIGHT) {
                    // Check if this is a winning position (middle row, index 1)
                    const isWinningSymbol =
                        state.phase === 'idle' &&
                        i === 1 &&
                        winningLinesRef.current.includes(1); // Middle row is line 1

                    drawSymbol(ctx, symbolId, x, y, isWinningSymbol);
                }
            }

            // Gradient overlays for depth
            const gradient = ctx.createLinearGradient(x, 0, x, REEL_HEIGHT);
            gradient.addColorStop(0, 'rgba(15, 15, 26, 0.8)');
            gradient.addColorStop(0.2, 'rgba(15, 15, 26, 0)');
            gradient.addColorStop(0.8, 'rgba(15, 15, 26, 0)');
            gradient.addColorStop(1, 'rgba(15, 15, 26, 0.8)');
            ctx.fillStyle = gradient;
            ctx.fillRect(x, 0, REEL_WIDTH, REEL_HEIGHT);

            // Reel border
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, 0, REEL_WIDTH, REEL_HEIGHT);
        }, [drawSymbol]);

        // Main render function
        const render = useCallback(() => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!canvas || !ctx) return;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw each reel
            for (let i = 0; i < TOTAL_REELS; i++) {
                const x = i * (REEL_WIDTH + REEL_GAP);
                drawReel(ctx, i, x);
            }

            // Draw center payline indicator
            ctx.strokeStyle = 'rgba(233, 69, 96, 0.6)';
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 5]);
            const lineY = SYMBOL_HEIGHT + SYMBOL_HEIGHT / 2;
            ctx.beginPath();
            ctx.moveTo(0, lineY);
            ctx.lineTo(canvas.width, lineY);
            ctx.stroke();
            ctx.setLineDash([]);
        }, [drawReel]);

        // Animation loop
        const animate = useCallback((timestamp: number) => {
            const states = reelStatesRef.current;
            let allIdle = true;

            for (let i = 0; i < TOTAL_REELS; i++) {
                const state = states[i];

                if (state.phase === 'spinning') {
                    allIdle = false;
                    // Fast continuous spinning
                    state.position += state.velocity;
                    state.velocity = turboModeRef.current ? 40 : 30;

                    // Check if it's time to stop
                    if (timestamp >= state.stopTime) {
                        state.phase = 'stopping';
                    }
                } else if (state.phase === 'stopping') {
                    allIdle = false;
                    // Decelerate with easeOutQuint
                    const progress = Math.min(1, (timestamp - state.stopTime) / 500);
                    const easedProgress = easeOutQuint(progress);

                    // Calculate position towards target with slip
                    const slip = turboModeRef.current
                        ? randomInRange(SYMBOL_SLIP.turbo.min, SYMBOL_SLIP.turbo.max)
                        : randomInRange(SYMBOL_SLIP.normal.min, SYMBOL_SLIP.normal.max);

                    state.velocity = (1 - easedProgress) * (turboModeRef.current ? 35 : 25);
                    state.position += state.velocity;

                    if (progress >= 1) {
                        // Snap to target position
                        state.position = state.targetPosition;
                        state.velocity = 0;
                        state.phase = 'settling';
                        state.settleStartTime = timestamp;
                    }
                } else if (state.phase === 'settling') {
                    allIdle = false;
                    // Spring bounce effect
                    const settleDuration = randomInRange(SETTLE_DURATION.min, SETTLE_DURATION.max);
                    const progress = Math.min(1, (timestamp - state.settleStartTime) / settleDuration);
                    state.settleOffset = springSettle(progress);

                    if (progress >= 1) {
                        state.phase = 'idle';
                        state.settleOffset = 0;
                    }
                }
            }

            render();

            if (allIdle && isSpinningRef.current) {
                isSpinningRef.current = false;
                if (onCompleteCallbackRef.current) {
                    onCompleteCallbackRef.current();
                    onCompleteCallbackRef.current = null;
                }
                if (onSpinComplete) {
                    onSpinComplete();
                }
            }

            if (!allIdle || isSpinningRef.current) {
                animationFrameRef.current = requestAnimationFrame(animate);
            }
        }, [render, onSpinComplete]);

        // Start spin animation
        const startSpin = useCallback((
            resultSymbols: number[][],
            turboMode: boolean,
            onComplete: () => void
        ) => {
            if (isSpinningRef.current) return;

            isSpinningRef.current = true;
            turboModeRef.current = turboMode;
            resultSymbolsRef.current = resultSymbols;
            onCompleteCallbackRef.current = onComplete;

            // Regenerate symbol strips for this spin
            symbolStripsRef.current = Array(TOTAL_REELS).fill(null).map(() => generateSymbolStrip(50));

            const now = performance.now();
            const duration = turboMode ? TURBO_SPIN_DURATION : NORMAL_SPIN_DURATION;

            for (let i = 0; i < TOTAL_REELS; i++) {
                const state = reelStatesRef.current[i];
                state.phase = 'spinning';
                state.velocity = turboMode ? 40 : 30;

                // Calculate stop time with delays
                const baseTime = now + randomInRange(duration.min, duration.max);
                const delay = i === 0 ? 0 :
                    typeof REEL_STOP_DELAY[i] === 'number'
                        ? REEL_STOP_DELAY[i] as number
                        : randomInRange(
                            (REEL_STOP_DELAY[i] as { min: number; max: number }).min,
                            (REEL_STOP_DELAY[i] as { min: number; max: number }).max
                        );

                state.stopTime = baseTime + delay;
                state.targetPosition = Math.floor(state.position / SYMBOL_HEIGHT) * SYMBOL_HEIGHT + SYMBOL_HEIGHT * 10;
                state.settleOffset = 0;
            }

            // Start animation loop
            animationFrameRef.current = requestAnimationFrame(animate);
        }, [animate, generateSymbolStrip]);

        // Expose methods via ref
        useImperativeHandle(ref, () => ({
            spin: startSpin,
            isSpinning: () => isSpinningRef.current,
        }), [startSpin]);

        // Initial render
        useEffect(() => {
            render();
        }, [render]);

        // Cleanup
        useEffect(() => {
            return () => {
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
            };
        }, []);

        const canvasWidth = TOTAL_REELS * REEL_WIDTH + (TOTAL_REELS - 1) * REEL_GAP;

        return (
            <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={REEL_HEIGHT}
                className="rounded-2xl border-4 border-casino-gold/50 shadow-lg"
                style={{
                    background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
                }}
            />
        );
    }
);

FishingReelCanvas.displayName = 'FishingReelCanvas';

export default FishingReelCanvas;
export { SYMBOL_CONFIG };
