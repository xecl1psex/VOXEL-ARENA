// Звуковой движок VOXEL ARENA

export class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.musicGain = null;
        this.enabled = true;
        this._musicOn = false;
        this._musicTimer = null;
        this._noiseBuffer = null;
    }

    init() {
        if (this.ctx) return;
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) {
            this.enabled = false;
            return;
        }
        this.ctx = new Ctx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.55;
        this.masterGain.connect(this.ctx.destination);
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.75;
        this.sfxGain.connect(this.masterGain);
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.22;
        this.musicGain.connect(this.masterGain);
        const sr = this.ctx.sampleRate;
        const buf = this.ctx.createBuffer(1, sr, sr);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this._noiseBuffer = buf;
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }

    hit(f = 1800, dur = 0.10, vol = 0.5) {
        if (!this.enabled || !this.ctx || !this._noiseBuffer) return;
        const t = this.ctx.currentTime;
        const s = this.ctx.createBufferSource();
        s.buffer = this._noiseBuffer;
        const fi = this.ctx.createBiquadFilter();
        fi.type = 'highpass';
        fi.frequency.value = f;
        fi.Q.value = 1.2;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        s.connect(fi).connect(g).connect(this.sfxGain);
        s.start(t);
        s.stop(t + dur + 0.02);
    }

    thud(f = 90, dur = 0.35, vol = 0.9) {
        if (!this.enabled || !this.ctx) return;
        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(f, t);
        o.frequency.exponentialRampToValueAtTime(f * 0.35, t + dur);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g).connect(this.sfxGain);
        o.start(t);
        o.stop(t + dur + 0.02);
    }

    step() {
        this.thud(140, 0.08, 0.18);
    }

    growl() {
        if (!this.enabled || !this.ctx) return;
        const t = this.ctx.currentTime, dur = 1.1;
        const o = this.ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(70, t);
        o.frequency.linearRampToValueAtTime(48, t + dur);
        const l = this.ctx.createOscillator();
        l.frequency.value = 18;
        const lg = this.ctx.createGain();
        lg.gain.value = 10;
        l.connect(lg).connect(o.frequency);
        const f = this.ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = 450;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.55, t + 0.15);
        g.gain.linearRampToValueAtTime(0.4, t + dur * 0.7);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(f).connect(g).connect(this.sfxGain);
        o.start(t);
        l.start(t);
        o.stop(t + dur + 0.05);
        l.stop(t + dur + 0.05);
    }

    bowShot() {
        this.hit(600, 0.08, 0.35);
        this.thud(220, 0.15, 0.25);
    }

    bowRelease(p = 1) {
        this.hit(500 + p * 400, 0.10, 0.30 + p * 0.20);
        this.thud(240 - p * 60, 0.15, 0.20 + p * 0.15);
    }

    special() {
        this.hit(2800, 0.25, 0.7);
        this.thud(80, 0.5, 1.0);
    }

    cooldownBlocked() {
        this.hit(200, 0.06, 0.15);
    }

    levelUp() {
        if (!this.enabled || !this.ctx) return;
        const t = this.ctx.currentTime;
        [523, 659, 784, 1047].forEach((f, i) => {
            const o = this.ctx.createOscillator();
            o.type = 'triangle';
            o.frequency.value = f;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.001, t + i * 0.08);
            g.gain.linearRampToValueAtTime(0.25, t + i * 0.08 + 0.03);
            g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.35);
            o.connect(g).connect(this.sfxGain);
            o.start(t + i * 0.08);
            o.stop(t + i * 0.08 + 0.4);
        });
    }

    reward() {
        if (!this.enabled || !this.ctx) return;
        const t = this.ctx.currentTime;
        [392, 523, 659].forEach((f, i) => {
            const o = this.ctx.createOscillator();
            o.type = 'sine';
            o.frequency.value = f;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.001, t + i * 0.05);
            g.gain.linearRampToValueAtTime(0.3, t + i * 0.05 + 0.02);
            g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.3);
            o.connect(g).connect(this.sfxGain);
            o.start(t + i * 0.05);
            o.stop(t + i * 0.05 + 0.35);
        });
    }

    shieldBlock() {
        this.hit(3000, 0.15, 0.6);
        this.thud(300, 0.2, 0.4);
    }

    arenaShift() {
        if (!this.enabled || !this.ctx) return;
        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(60, t);
        o.frequency.linearRampToValueAtTime(180, t + 0.8);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.35, t + 0.3);
        g.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
        o.connect(g).connect(this.sfxGain);
        o.start(t);
        o.stop(t + 1.05);
    }

    startMusic() {
        if (!this.enabled || !this.ctx || this._musicOn) return;
        this._musicOn = true;
        const notes = [55, 55, 65.4, 49];
        let i = 0;
        const loop = () => {
            if (!this._musicOn || !this.ctx) return;
            const t = this.ctx.currentTime;
            const n = notes[i++ % notes.length];
            const o = this.ctx.createOscillator();
            o.type = 'triangle';
            o.frequency.value = n;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.001, t);
            g.gain.linearRampToValueAtTime(0.35, t + 0.05);
            g.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
            o.connect(g).connect(this.musicGain);
            o.start(t);
            o.stop(t + 1.85);
        };
        loop();
        this._musicTimer = setInterval(loop, 2000);
    }

    stopMusic() {
        this._musicOn = false;
        if (this._musicTimer) {
            clearInterval(this._musicTimer);
            this._musicTimer = null;
        }
    }

    setEnabled(on) {
        this.enabled = on;
        if (!on) this.stopMusic();
        else if (this.ctx) this.startMusic();
        if (this.masterGain) this.masterGain.gain.value = on ? 0.55 : 0.0;
    }
}

export const audio = new SoundEngine();
