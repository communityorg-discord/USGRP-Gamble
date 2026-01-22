'use client';

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

// Official Fishing Frenzy symbols (Blueprint Gaming inspired)
const SYMBOL_CONFIG = [
    // Low value - Card symbols
    { id: 0, emoji: '🔟', name: '10', multiplier: 0.5, color: '#94a3b8', isWild: false, isScatter: false },
    { id: 1, emoji: 'J', name: 'Jack', multiplier: 0.8, color: '#94a3b8', isWild: false, isScatter: false },
    { id: 2, emoji: 'Q', name: 'Queen', multiplier: 1, color: '#94a3b8', isWild: false, isScatter: false },
    { id: 3, emoji: 'K', name: 'King', multiplier: 1.2, color: '#94a3b8', isWild: false, isScatter: false },
    { id: 4, emoji: 'A', name: 'Ace', multiplier: 1.5, color: '#94a3b8', isWild: false, isScatter: false },
    // Medium value - Fishing gear
    { id: 5, emoji: '🧰', name: 'Tackle Box', multiplier: 5, color: '#f97316', isWild: false, isScatter: false },
    { id: 6, emoji: '🛟', name: 'Lifebuoy', multiplier: 8, color: '#ef4444', isWild: false, isScatter: false },
    { id: 7, emoji: '🎣', name: 'Fishing Rod', multiplier: 12, color: '#8b5cf6', isWild: false, isScatter: false },
    { id: 8, emoji: '🦅', name: 'Pelican', multiplier: 20, color: '#06b6d4', isWild: false, isScatter: false },
    // High value - Fish with cash values
    { id: 9, emoji: '🐟', name: 'Blue Fish', multiplier: 2, color: '#3b82f6', isWild: false, isScatter: false, hasCashValue: true },
    { id: 10, emoji: '🐠', name: 'Orange Fish', multiplier: 5, color: '#f97316', isWild: false, isScatter: false, hasCashValue: true },
    { id: 11, emoji: '🐡', name: 'Puffer Fish', multiplier: 10, color: '#eab308', isWild: false, isScatter: false, hasCashValue: true },
    { id: 12, emoji: '🦈', name: 'Shark', multiplier: 25, color: '#6366f1', isWild: false, isScatter: false, hasCashValue: true },
    { id: 13, emoji: '🐋', name: 'Whale', multiplier: 100, color: '#0ea5e9', isWild: false, isScatter: false, hasCashValue: true },
    // Special symbols
    { id: 14, emoji: '👨‍🦱', name: 'Fisherman', multiplier: 0, color: '#ffd700', isWild: true, isScatter: false },
    { id: 15, emoji: '⛵', name: 'Fishing Boat', multiplier: 0, color: '#22c55e', isWild: false, isScatter: true },
];

// Fish cash value multipliers (assigned randomly to fish symbols)
const FISH_CASH_VALUES = [2, 5, 10, 15, 20, 25, 50, 100];

// Canvas dimensions for 5 reels
const REEL_WIDTH = 100;
const REEL_HEIGHT = 300;
const SYMBOL_HEIGHT = 100;
const VISIBLE_SYMBOLS = 3;
const REEL_GAP = 8;
const TOTAL_REELS = 5;

// Animation timing
const NORMAL_SPIN_DURATION = { min: 1600, max: 2400 };
const TURBO_SPIN_DURATION = { min: 700, max: 1000 };
const REEL_STOP_DELAY = [0, { min: 120, max: 180 }, { min: 220, max: 320 }, { min: 340, max: 460 }, { min: 480, max: 620 }];
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
    spin: (resultSymbols: number[][], fishCashValues: Record<string, number>, turboMode: boolean, onComplete: () => void) => void;
    isSpinning: () => boolean;
}

interface FishingReelCanvasProps {
    winningLines?: number[];
    onSpinStart?: () => void;
    onSpinComplete?: () => void;
    isFreeSpins?: boolean;
}

const FishingReelCanvas = forwardRef<FishingReelCanvasHandle, FishingReelCanvasProps>(
    ({ winningLines = [], onSpinComplete, isFreeSpins = false }, ref) => {
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const animationFrameRef = useRef<number>(0);
        const reelStatesRef = useRef<ReelState[]>([]);
        const symbolStripsRef = useRef<number[][]>([]);
        const resultSymbolsRef = useRef<number[][]>([]);
        const fishCashValuesRef = useRef<Record<string, number>>({});
        const isSpinningRef = useRef(false);
        const turboModeRef = useRef(false);
        const onCompleteCallbackRef = useRef<(() => void) | null>(null);
        const winningLinesRef = useRef<number[]>(winningLines);

        useEffect(() => {
            winningLinesRef.current = winningLines;
        }, [winningLines]);

        const generateSymbolStrip = useCallback((length: number = 40): number[] => {
            // Weighted random - rare symbols are less common
            const weights = [
                15, 15, 15, 15, 15, // Cards (0-4)
                10, 10, 8, 6,       // Gear (5-8)
                8, 6, 4, 2, 1,      // Fish (9-13)
                2, 3,               // Wild (14), Scatter (15)
            ];
            const totalWeight = weights.reduce((a, b) => a + b, 0);

            return Array.from({ length }, () => {
                let random = Math.random() * totalWeight;
                for (let i = 0; i < weights.length; i++) {
                    random -= weights[i];
                    if (random <= 0) return i;
                }
                return 0;
            });
        }, []);

        // Initialize
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
            // Initial display - show a variety
            resultSymbolsRef.current = [
                [5, 7, 6],
                [9, 14, 8],
                [10, 7, 11],
                [8, 12, 5],
                [6, 9, 7],
            ];
            setTimeout(() => render(), 50);
        }, [generateSymbolStrip]);

        const randomInRange = (min: number, max: number): number => {
            return min + Math.random() * (max - min);
        };

        // Draw symbol
        const drawSymbol = useCallback((
            ctx: CanvasRenderingContext2D,
            symbolId: number,
            x: number,
            y: number,
            highlight: boolean = false,
            cashValue?: number
        ) => {
            const symbol = SYMBOL_CONFIG[symbolId] || SYMBOL_CONFIG[0];

            // Background - light underwater style
            let bgColor = 'rgba(255, 255, 255, 0.85)';
            if (symbol.isWild) bgColor = 'rgba(255, 230, 150, 0.95)';
            else if (symbol.isScatter) bgColor = 'rgba(180, 255, 200, 0.95)';
            else if (highlight) bgColor = 'rgba(255, 255, 200, 0.95)';

            ctx.fillStyle = bgColor;
            ctx.beginPath();
            ctx.roundRect(x + 3, y + 3, REEL_WIDTH - 6, SYMBOL_HEIGHT - 6, 8);
            ctx.fill();

            // Border
            ctx.strokeStyle = highlight ? '#ffd700' : symbol.isWild ? '#ffd700' : symbol.isScatter ? '#22c55e' : 'rgba(100, 180, 200, 0.4)';
            ctx.lineWidth = highlight ? 3 : symbol.isWild || symbol.isScatter ? 2 : 1;
            ctx.stroke();

            // Symbol
            if (symbol.emoji.length === 1) {
                // Single character (J, Q, K, A) - use colorful card style
                ctx.font = 'bold 48px Arial';
                // Colorful card symbols like the screenshot
                const cardColors: Record<string, string> = { '10': '#06b6d4', 'J': '#10b981', 'Q': '#ec4899', 'K': '#ef4444', 'A': '#f59e0b' };
                ctx.fillStyle = cardColors[symbol.name] || symbol.color;
            } else {
                ctx.font = '48px Arial';
            }
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(symbol.emoji, x + REEL_WIDTH / 2, y + SYMBOL_HEIGHT / 2 - (cashValue ? 8 : 0));

            // Cash value for fish
            if (cashValue && symbol.hasCashValue) {
                ctx.font = 'bold 14px Arial';
                ctx.fillStyle = '#ffd700';
                ctx.fillText(`${cashValue}x`, x + REEL_WIDTH / 2, y + SYMBOL_HEIGHT - 18);
            }

            // Wild/Scatter label
            if (symbol.isWild) {
                ctx.font = 'bold 11px Arial';
                ctx.fillStyle = '#ffd700';
                ctx.fillText('WILD', x + REEL_WIDTH / 2, y + SYMBOL_HEIGHT - 12);
            } else if (symbol.isScatter) {
                ctx.font = 'bold 11px Arial';
                ctx.fillStyle = '#22c55e';
                ctx.fillText('SCATTER', x + REEL_WIDTH / 2, y + SYMBOL_HEIGHT - 12);
            }

            // Glow for wins
            if (highlight) {
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 15;
                ctx.fillText(symbol.emoji, x + REEL_WIDTH / 2, y + SYMBOL_HEIGHT / 2 - (cashValue ? 8 : 0));
                ctx.shadowBlur = 0;
            }
        }, []);

        // Draw reel
        const drawReel = useCallback((
            ctx: CanvasRenderingContext2D,
            reelIndex: number,
            x: number
        ) => {
            const state = reelStatesRef.current[reelIndex];
            const symbols = symbolStripsRef.current[reelIndex];
            const result = resultSymbolsRef.current[reelIndex];
            const cashValues = fishCashValuesRef.current;

            // Reel background - light underwater blue like official game
            const bgGradient = ctx.createLinearGradient(x, 0, x, REEL_HEIGHT);
            bgGradient.addColorStop(0, '#b8e6f0');
            bgGradient.addColorStop(0.5, '#c8eef5');
            bgGradient.addColorStop(1, '#a8dce8');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(x, 0, REEL_WIDTH, REEL_HEIGHT);

            const offset = state.position % SYMBOL_HEIGHT + state.settleOffset;
            const startIndex = Math.floor(state.position / SYMBOL_HEIGHT);

            for (let i = -1; i <= VISIBLE_SYMBOLS + 1; i++) {
                const symbolIndex = (startIndex + i + symbols.length * 100) % symbols.length;
                let symbolId: number;

                if (state.phase === 'idle' || state.phase === 'settling') {
                    if (i >= 0 && i < VISIBLE_SYMBOLS) {
                        symbolId = result[i];
                    } else {
                        symbolId = symbols[symbolIndex];
                    }
                } else {
                    symbolId = symbols[symbolIndex];
                }

                const symbolY = i * SYMBOL_HEIGHT - offset;

                if (symbolY > -SYMBOL_HEIGHT && symbolY < REEL_HEIGHT) {
                    const isWinning = state.phase === 'idle' && winningLinesRef.current.length > 0;
                    const cashKey = `${reelIndex}-${i}`;
                    const cashValue = cashValues[cashKey];
                    drawSymbol(ctx, symbolId, x, symbolY, isWinning, cashValue);
                }
            }

            // Gradient overlays - subtle top/bottom fade
            const gradient = ctx.createLinearGradient(x, 0, x, REEL_HEIGHT);
            gradient.addColorStop(0, 'rgba(80, 150, 180, 0.4)');
            gradient.addColorStop(0.08, 'rgba(80, 150, 180, 0)');
            gradient.addColorStop(0.92, 'rgba(80, 150, 180, 0)');
            gradient.addColorStop(1, 'rgba(80, 150, 180, 0.4)');
            ctx.fillStyle = gradient;
            ctx.fillRect(x, 0, REEL_WIDTH, REEL_HEIGHT);

            // Reel border - subtle blue line
            ctx.strokeStyle = 'rgba(80, 150, 180, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, 0, REEL_WIDTH, REEL_HEIGHT);
        }, [drawSymbol]);

        // Main render
        const render = useCallback(() => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!canvas || !ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < TOTAL_REELS; i++) {
                const x = i * (REEL_WIDTH + REEL_GAP);
                drawReel(ctx, i, x);
            }

            // Center payline indicator
            ctx.strokeStyle = 'rgba(233, 69, 96, 0.7)';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 4]);
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
                    state.position += state.velocity;
                    state.velocity = turboModeRef.current ? 45 : 35;

                    if (timestamp >= state.stopTime) {
                        state.phase = 'stopping';
                    }
                } else if (state.phase === 'stopping') {
                    allIdle = false;
                    const progress = Math.min(1, (timestamp - state.stopTime) / 500);
                    const easedProgress = easeOutQuint(progress);
                    state.velocity = (1 - easedProgress) * (turboModeRef.current ? 40 : 30);
                    state.position += state.velocity;

                    if (progress >= 1) {
                        state.position = state.targetPosition;
                        state.velocity = 0;
                        state.phase = 'settling';
                        state.settleStartTime = timestamp;
                    }
                } else if (state.phase === 'settling') {
                    allIdle = false;
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

        // Start spin
        const startSpin = useCallback((
            resultSymbols: number[][],
            fishCashValues: Record<string, number>,
            turboMode: boolean,
            onComplete: () => void
        ) => {
            if (isSpinningRef.current) return;

            isSpinningRef.current = true;
            turboModeRef.current = turboMode;
            resultSymbolsRef.current = resultSymbols;
            fishCashValuesRef.current = fishCashValues;
            onCompleteCallbackRef.current = onComplete;

            symbolStripsRef.current = Array(TOTAL_REELS).fill(null).map(() => generateSymbolStrip(50));

            const now = performance.now();
            const duration = turboMode ? TURBO_SPIN_DURATION : NORMAL_SPIN_DURATION;

            for (let i = 0; i < TOTAL_REELS; i++) {
                const state = reelStatesRef.current[i];
                state.phase = 'spinning';
                state.velocity = turboMode ? 45 : 35;

                const baseTime = now + randomInRange(duration.min, duration.max);
                const delay = i === 0 ? 0 :
                    typeof REEL_STOP_DELAY[i] === 'number'
                        ? REEL_STOP_DELAY[i] as number
                        : randomInRange(
                            (REEL_STOP_DELAY[i] as { min: number; max: number }).min,
                            (REEL_STOP_DELAY[i] as { min: number; max: number }).max
                        );

                state.stopTime = baseTime + delay;
                state.targetPosition = Math.floor(state.position / SYMBOL_HEIGHT) * SYMBOL_HEIGHT + SYMBOL_HEIGHT * 12;
                state.settleOffset = 0;
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        }, [animate, generateSymbolStrip]);

        useImperativeHandle(ref, () => ({
            spin: startSpin,
            isSpinning: () => isSpinningRef.current,
        }), [startSpin]);

        useEffect(() => {
            render();
        }, [render]);

        useEffect(() => {
            return () => {
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
            };
        }, []);

        const canvasWidth = TOTAL_REELS * REEL_WIDTH + (TOTAL_REELS - 1) * REEL_GAP;

        return (
            <div className="relative">
                <canvas
                    ref={canvasRef}
                    width={canvasWidth}
                    height={REEL_HEIGHT}
                    className="rounded-xl border-4 border-casino-gold/50 shadow-lg"
                    style={{
                        background: 'linear-gradient(180deg, #0a0a1a 0%, #050510 100%)',
                    }}
                />
                {isFreeSpins && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 px-4 py-1 bg-casino-green/80 rounded-full text-sm font-bold animate-pulse">
                        🎣 FREE SPINS 🎣
                    </div>
                )}
            </div>
        );
    }
);

FishingReelCanvas.displayName = 'FishingReelCanvas';

export default FishingReelCanvas;
export { SYMBOL_CONFIG, FISH_CASH_VALUES };
