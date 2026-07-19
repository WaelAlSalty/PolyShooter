export class AudioManager {
    private ctx: AudioContext;

    constructor() {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    public resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    public playShoot() {
        this.playTone(400, 'square', 0.1, -200, 0.05);
    }

    public playHit() {
        this.playTone(200, 'sawtooth', 0.1, -100, 0.05);
    }

    public playExplosion() {
        this.playNoise(0.3, 0.2);
    }

    public playHeal() {
        this.playTone(600, 'sine', 0.1, 200, 0.1);
        setTimeout(() => this.playTone(800, 'sine', 0.2, 300, 0.1), 100);
    }

    public playDamage() {
        this.playTone(150, 'sawtooth', 0.3, -50, 0.2);
    }

    private playTone(freq: number, type: OscillatorType, duration: number, slide: number = 0, volume: number = 0.1) {
        if (this.ctx.state !== 'running') return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slide !== 0) {
            osc.frequency.linearRampToValueAtTime(freq + slide, this.ctx.currentTime + duration);
        }
        
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    private playNoise(duration: number, volume: number = 0.2) {
        if (this.ctx.state !== 'running') return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        noise.connect(gain);
        gain.connect(this.ctx.destination);
        
        noise.start();
    }
}
