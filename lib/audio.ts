/**
 * Native Web Audio API Synthesizer for Ambient Focus Sounds.
 * Zero external audio files or bandwidth required - runs entirely in-browser!
 */

export type AmbientSoundType = "none" | "brown" | "white" | "rain" | "binaural";

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private currentType: AmbientSoundType = "none";

  private initContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public play(type: AmbientSoundType, volume = 0.35) {
    this.stop();
    if (type === "none") return;

    this.initContext();
    if (!this.ctx) return;

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);

    if (type === "brown") {
      this.noiseNode = this.createBrownNoise();
      this.noiseNode.connect(this.gainNode);
    } else if (type === "white") {
      this.noiseNode = this.createWhiteNoise();
      this.noiseNode.connect(this.gainNode);
    } else if (type === "rain") {
      this.noiseNode = this.createRainSound();
      this.noiseNode.connect(this.gainNode);
    } else if (type === "binaural") {
      this.noiseNode = this.createBinauralBeats();
      this.noiseNode.connect(this.gainNode);
    }

    this.currentType = type;
  }

  public setVolume(volume: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
    }
  }

  public stop() {
    if (this.noiseNode) {
      try {
        if ("stop" in this.noiseNode && typeof this.noiseNode.stop === "function") {
          this.noiseNode.stop();
        }
        this.noiseNode.disconnect();
      } catch (e) {
        // ignore
      }
      this.noiseNode = null;
    }
    this.currentType = "none";
  }

  public getCurrentType(): AmbientSoundType {
    return this.currentType;
  }

  private createWhiteNoise(): AudioNode {
    if (!this.ctx) throw new Error("No context");
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    whiteNoise.start(0);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1000;
    whiteNoise.connect(filter);
    return filter;
  }

  private createBrownNoise(): AudioNode {
    if (!this.ctx) throw new Error("No context");
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Gain boost
    }

    const brownNoise = this.ctx.createBufferSource();
    brownNoise.buffer = noiseBuffer;
    brownNoise.loop = true;
    brownNoise.start(0);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 450; // Deep soothing rumble
    brownNoise.connect(filter);
    return filter;
  }

  private createRainSound(): AudioNode {
    if (!this.ctx) throw new Error("No context");
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.05 * white) / 1.05;
      lastOut = output[i];
      output[i] *= 2.5;
    }

    const rain = this.ctx.createBufferSource();
    rain.buffer = noiseBuffer;
    rain.loop = true;
    rain.start(0);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1200;
    filter.Q.value = 0.5;
    rain.connect(filter);
    return filter;
  }

  private createBinauralBeats(): AudioNode {
    if (!this.ctx) throw new Error("No context");
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 180; // Alpha/Beta frequency base
    osc.start(0);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 250;
    osc.connect(filter);
    return filter;
  }
}

export const ambientAudio = new AmbientAudioEngine();
