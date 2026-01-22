// Casino Sound Effects Utility
// Uses Web Audio API for premium casino sounds

class CasinoSounds {
    private audioContext: AudioContext | null = null;
    private enabled: boolean = true;
    private volume: number = 0.5;

    private getContext(): AudioContext {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return this.audioContext;
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    setVolume(volume: number) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    // Generate a tone with envelope
    private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', attack = 0.01, decay = 0.1) {
        if (!this.enabled || typeof window === 'undefined') return;

        try {
            const ctx = this.getContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type;
            osc.frequency.value = frequency;
            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(this.volume, now + attack);
            gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

            osc.start(now);
            osc.stop(now + duration);
        } catch (e) {
            console.warn('Sound playback failed:', e);
        }
    }

    // Play multiple tones in sequence
    private playSequence(notes: Array<{ freq: number; dur: number; delay: number }>, type: OscillatorType = 'sine') {
        notes.forEach(({ freq, dur, delay }) => {
            setTimeout(() => this.playTone(freq, dur, type), delay * 1000);
        });
    }

    // ========== Casino Sound Effects ==========

    // Case opening sound (suspenseful)
    caseOpen() {
        this.playSequence([
            { freq: 330, dur: 0.1, delay: 0 },
            { freq: 440, dur: 0.1, delay: 0.05 },
            { freq: 550, dur: 0.2, delay: 0.1 },
        ], 'triangle');
    }

    // Case reveal - low value (descending)
    revealLowValue() {
        this.playSequence([
            { freq: 440, dur: 0.15, delay: 0 },
            { freq: 330, dur: 0.15, delay: 0.1 },
            { freq: 220, dur: 0.3, delay: 0.2 },
        ], 'sawtooth');
    }

    // Case reveal - high value (ascending)
    revealHighValue() {
        this.playSequence([
            { freq: 440, dur: 0.15, delay: 0 },
            { freq: 660, dur: 0.15, delay: 0.1 },
            { freq: 880, dur: 0.3, delay: 0.2 },
        ], 'triangle');
    }

    // Phone ringing (banker calling)
    phoneRing() {
        this.playSequence([
            { freq: 600, dur: 0.1, delay: 0 },
            { freq: 800, dur: 0.1, delay: 0.1 },
            { freq: 600, dur: 0.1, delay: 0.3 },
            { freq: 800, dur: 0.1, delay: 0.4 },
        ], 'sine');
    }

    // Offer reveal (dramatic)
    offerReveal() {
        this.playSequence([
            { freq: 200, dur: 0.2, delay: 0 },
            { freq: 300, dur: 0.2, delay: 0.15 },
            { freq: 400, dur: 0.2, delay: 0.3 },
            { freq: 500, dur: 0.3, delay: 0.45 },
            { freq: 600, dur: 0.5, delay: 0.6 },
        ], 'triangle');
    }

    // Deal accepted (positive jingle)
    dealAccept() {
        this.playSequence([
            { freq: 523, dur: 0.15, delay: 0 },
            { freq: 659, dur: 0.15, delay: 0.1 },
            { freq: 784, dur: 0.15, delay: 0.2 },
            { freq: 1047, dur: 0.4, delay: 0.3 },
        ], 'sine');
    }

    // No deal (tension continues)
    noDeal() {
        this.playSequence([
            { freq: 440, dur: 0.1, delay: 0 },
            { freq: 415, dur: 0.1, delay: 0.1 },
            { freq: 392, dur: 0.2, delay: 0.2 },
        ], 'sawtooth');
    }

    // Big win fanfare
    bigWin() {
        this.playSequence([
            { freq: 523, dur: 0.2, delay: 0 },
            { freq: 659, dur: 0.2, delay: 0.15 },
            { freq: 784, dur: 0.2, delay: 0.3 },
            { freq: 1047, dur: 0.2, delay: 0.45 },
            { freq: 1319, dur: 0.3, delay: 0.6 },
            { freq: 1568, dur: 0.5, delay: 0.8 },
        ], 'triangle');
    }

    // Button click
    click() {
        this.playTone(800, 0.05, 'sine');
    }

    // Slot spin start
    spinStart() {
        this.playSequence([
            { freq: 200, dur: 0.05, delay: 0 },
            { freq: 250, dur: 0.05, delay: 0.03 },
            { freq: 300, dur: 0.05, delay: 0.06 },
        ], 'square');
    }

    // Slot reel stop
    reelStop() {
        this.playTone(150, 0.1, 'square');
    }

    // Slot win
    slotWin() {
        this.playSequence([
            { freq: 600, dur: 0.1, delay: 0 },
            { freq: 800, dur: 0.1, delay: 0.1 },
            { freq: 1000, dur: 0.15, delay: 0.2 },
            { freq: 1200, dur: 0.2, delay: 0.35 },
        ], 'sine');
    }

    // Free spins trigger
    freeSpinsTrigger() {
        this.playSequence([
            { freq: 400, dur: 0.2, delay: 0 },
            { freq: 500, dur: 0.2, delay: 0.15 },
            { freq: 600, dur: 0.2, delay: 0.3 },
            { freq: 700, dur: 0.2, delay: 0.45 },
            { freq: 800, dur: 0.2, delay: 0.6 },
            { freq: 1000, dur: 0.5, delay: 0.75 },
        ], 'triangle');
    }

    // Coin sound (deposit/withdraw)
    coins() {
        this.playSequence([
            { freq: 1200, dur: 0.05, delay: 0 },
            { freq: 1400, dur: 0.05, delay: 0.05 },
            { freq: 1300, dur: 0.05, delay: 0.1 },
            { freq: 1500, dur: 0.08, delay: 0.15 },
        ], 'sine');
    }
}

// Singleton instance
export const sounds = typeof window !== 'undefined' ? new CasinoSounds() : {
    setEnabled: () => { },
    setVolume: () => { },
    caseOpen: () => { },
    revealLowValue: () => { },
    revealHighValue: () => { },
    phoneRing: () => { },
    offerReveal: () => { },
    dealAccept: () => { },
    noDeal: () => { },
    bigWin: () => { },
    click: () => { },
    spinStart: () => { },
    reelStop: () => { },
    slotWin: () => { },
    freeSpinsTrigger: () => { },
    coins: () => { },
};
