// Shared game state store for Deal or No Deal
// In production, this should use Redis or a database

import type { DealGameState } from './types';

// In-memory game state store
export const activeGames = new Map<string, DealGameState>();

// Helper functions for the store
export function getActiveGame(roundId: string): DealGameState | undefined {
    return activeGames.get(roundId);
}

export function setActiveGame(roundId: string, state: DealGameState): void {
    activeGames.set(roundId, state);
}

export function deleteActiveGame(roundId: string): boolean {
    return activeGames.delete(roundId);
}

export function findUserActiveGame(userId: string): [string, DealGameState] | undefined {
    for (const [roundId, game] of activeGames) {
        if (game.userId === userId && game.gamePhase !== 'completed') {
            return [roundId, game];
        }
    }
    return undefined;
}

export function cleanupOldGames(maxCompleted: number = 100): void {
    const completedGames = [...activeGames.entries()]
        .filter(([, g]) => g.gamePhase === 'completed')
        .sort((a, b) => new Date(a[1].createdAt).getTime() - new Date(b[1].createdAt).getTime());

    while (completedGames.length > maxCompleted) {
        const [oldId] = completedGames.shift()!;
        activeGames.delete(oldId);
    }
}
