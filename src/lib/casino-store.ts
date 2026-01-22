// Casino chip storage module - shared across game APIs
// In production, this would use Redis or a database

// Chip balances by discordId
const casinoChips = new Map<string, number>();

// Active Real Banker sessions
// Key: playerId, Value: staffId controlling their game
const realBankerSessions = new Map<string, {
    staffId: string;
    staffName: string;
    gameType: string;
    startedAt: number;
}>();

// Pending banker offers (staff → player)
// Key: playerId, Value: custom offer details
const pendingOffers = new Map<string, {
    offer: number;
    message?: string;
    expiresAt: number;
}>();

// Staff authentication code
export const STAFF_CODE = '470303';

// ============================================
// Casino Chips
// ============================================

export function getCasinoChips(discordId: string): number {
    return casinoChips.get(discordId) || 0;
}

export function setCasinoChips(discordId: string, amount: number): void {
    casinoChips.set(discordId, Math.max(0, amount));
}

export function adjustCasinoChips(discordId: string, delta: number): number {
    const current = getCasinoChips(discordId);
    const newBalance = Math.max(0, current + delta);
    casinoChips.set(discordId, newBalance);
    return newBalance;
}

// ============================================
// Real Banker Sessions
// ============================================

export function startRealBankerSession(
    playerId: string,
    staffId: string,
    staffName: string,
    gameType: string
): void {
    realBankerSessions.set(playerId, {
        staffId,
        staffName,
        gameType,
        startedAt: Date.now(),
    });
}

export function endRealBankerSession(playerId: string): void {
    realBankerSessions.delete(playerId);
    pendingOffers.delete(playerId);
}

export function getRealBankerSession(playerId: string) {
    return realBankerSessions.get(playerId) || null;
}

export function getAllRealBankerSessions() {
    return Array.from(realBankerSessions.entries()).map(([playerId, session]) => ({
        playerId,
        ...session,
    }));
}

export function getSessionsForStaff(staffId: string) {
    return Array.from(realBankerSessions.entries())
        .filter(([_, session]) => session.staffId === staffId)
        .map(([playerId, session]) => ({ playerId, ...session }));
}

// ============================================
// Banker Offers
// ============================================

export function setStaffOffer(playerId: string, offer: number, message?: string): void {
    pendingOffers.set(playerId, {
        offer,
        message,
        expiresAt: Date.now() + 60000, // 60 second expiry
    });
}

export function getStaffOffer(playerId: string) {
    const offer = pendingOffers.get(playerId);
    if (!offer) return null;

    // Check expiry
    if (Date.now() > offer.expiresAt) {
        pendingOffers.delete(playerId);
        return null;
    }

    return offer;
}

export function clearStaffOffer(playerId: string): void {
    pendingOffers.delete(playerId);
}

// ============================================
// Active Players (for staff dashboard)
// ============================================

const activePlayers = new Map<string, {
    discordId: string;
    username: string;
    avatar?: string;
    currentGame: string;
    chips: number;
    lastActivity: number;
}>();

export function updateActivePlayer(
    discordId: string,
    username: string,
    avatar: string | undefined,
    currentGame: string
): void {
    activePlayers.set(discordId, {
        discordId,
        username,
        avatar,
        currentGame,
        chips: getCasinoChips(discordId),
        lastActivity: Date.now(),
    });
}

export function getActivePlayers() {
    // Clean up stale entries (inactive for > 5 minutes)
    const cutoff = Date.now() - 5 * 60 * 1000;
    for (const [id, player] of activePlayers.entries()) {
        if (player.lastActivity < cutoff) {
            activePlayers.delete(id);
        }
    }

    return Array.from(activePlayers.values());
}

export function removeActivePlayer(discordId: string): void {
    activePlayers.delete(discordId);
}
