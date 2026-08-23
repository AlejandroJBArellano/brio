/**
 * Native Web Audio API Synthesizer for Ambient Focus Sounds & Binaural Brainwaves.
 * Zero external audio files or bandwidth required - runs entirely in-browser!
 */

export type AmbientSoundType =
  | "none"
  | "gamma"
  | "alpha"
  | "theta"
  | "brown"
  | "rain"
  | "space"
  | "cafe";

export interface AmbientSoundOption {
  id: AmbientSoundType;
  label: string;
  sublabel: string;
  icon: string;
  category: "waves" | "nature" | "ambient";
}

export const AMBIENT_SOUND_OPTIONS: AmbientSoundOption[] = [
  { id: "gamma", label: "Ondas Gamma 40Hz", sublabel: "Hiperfoco & Memoria", icon: "🧠", category: "waves" },
  { id: "alpha", label: "Ondas Alfa 10Hz", sublabel: "Flujo & Creatividad", icon: "🧘", category: "waves" },
  { id: "theta", label: "Ondas Theta 6Hz", sublabel: "Intuición & Calma", icon: "🌊", category: "waves" },
  { id: "brown", label: "Brown Noise", sublabel: "Aislamiento Acústico", icon: "🎧", category: "ambient" },
  { id: "rain", label: "Lluvia Calma", sublabel: "Precipitación Suave", icon: "🌧️", category: "nature" },
  { id: "space", label: "Espacio Cósmico", sublabel: "Drone Profundo", icon: "🌌", category: "ambient" },
  { id: "cafe", label: "Café Calmo", sublabel: "Atmósfera Acogedora", icon: "☕", category: "ambient" },
  { id: "none", label: "Silencio", sublabel: "Sin audio de fondo", icon: "🔇", category: "ambient" },
];

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private activeNodes: (AudioNode | { stop?: () => void; disconnect?: () => void })[] = [];
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
    this.gainNode.gain.setValueAtTime(Math.max(0.001, volume), this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);

    switch (type) {
      case "gamma":
        this.createBinauralBeat(200, 40); // 200 Hz carrier, 40 Hz Gamma difference
        break;
      case "alpha":
        this.createBinauralBeat(180, 10); // 180 Hz carrier, 10 Hz Alpha difference
        break;
      case "theta":
        this.createBinauralBeat(140, 6); // 140 Hz carrier, 6 Hz Theta difference
        break;
      case "brown":
        this.createBrownNoise();
        break;
      case "rain":
        this.createRainSound();
        break;
      case "space":
        this.createSpaceDrone();
        break;
      case "cafe":
        this.createCafeAmbience();
        break;
    }

    this.currentType = type;
  }

  public setVolume(volume: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(Math.max(0.001, volume), this.ctx.currentTime);
    }
  }

  public stop() {
    this.activeNodes.forEach((node) => {
      try {
        if ("stop" in node && typeof node.stop === "function") {
          node.stop();
        }
        if ("disconnect" in node && typeof node.disconnect === "function") {
          node.disconnect();
        }
      } catch {
        // ignore
      }
    });
    this.activeNodes = [];

    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch {
        // ignore
      }
      this.gainNode = null;
    }
    this.currentType = "none";
  }

  public getCurrentType(): AmbientSoundType {
    return this.currentType;
  }

  /**
   * Generates real stereo Binaural Beats with low warm carrier and gentle harmonic noise.
   */
  private createBinauralBeat(carrierFreq: number, beatFreq: number) {
    if (!this.ctx || !this.gainNode) return;

    // Left Ear Oscillator
    const oscLeft = this.ctx.createOscillator();
    oscLeft.type = "sine";
    oscLeft.frequency.value = carrierFreq;

    // Right Ear Oscillator
    const oscRight = this.ctx.createOscillator();
    oscRight.type = "sine";
    oscRight.frequency.value = carrierFreq + beatFreq;

    // Stereo Panner (or Merged Channels if StereoPanner unsupported)
    if ("createStereoPanner" in this.ctx) {
      const panLeft = this.ctx.createStereoPanner();
      panLeft.pan.value = -0.9;
      oscLeft.connect(panLeft).connect(this.gainNode);
      this.activeNodes.push(panLeft);

      const panRight = this.ctx.createStereoPanner();
      panRight.pan.value = 0.9;
      oscRight.connect(panRight).connect(this.gainNode);
      this.activeNodes.push(panRight);
    } else {
      oscLeft.connect(this.gainNode);
      oscRight.connect(this.gainNode);
    }

    // Warm background brown noise bed to soften sine wave tone
    const brownBed = this.createBrownNoiseSource(0.3);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 300;
    brownBed.connect(filter).connect(this.gainNode);
    this.activeNodes.push(filter, brownBed);

    oscLeft.start(0);
    oscRight.start(0);
    this.activeNodes.push(oscLeft, oscRight);
  }

  /**
   * Pure deep Brownian Noise (Deep Rumble for ADHD & isolation).
   */
  private createBrownNoise() {
    if (!this.ctx || !this.gainNode) return;
    const source = this.createBrownNoiseSource(1.0);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 450;
    source.connect(filter).connect(this.gainNode);
    this.activeNodes.push(source, filter);
  }

  /**
   * Calming Rain Synthesizer (layered multi-band filtered pink noise).
   */
  private createRainSound() {
    if (!this.ctx || !this.gainNode) return;

    // Base rain wash
    const rainSource = this.createBrownNoiseSource(0.8);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1100;
    filter.Q.value = 0.7;
    rainSource.connect(filter).connect(this.gainNode);
    this.activeNodes.push(rainSource, filter);

    // High frequency droplets
    const dropSource = this.createWhiteNoiseSource(0.25);
    const highFilter = this.ctx.createBiquadFilter();
    highFilter.type = "highpass";
    highFilter.frequency.value = 3500;
    dropSource.connect(highFilter).connect(this.gainNode);
    this.activeNodes.push(dropSource, highFilter);
  }

  /**
   * Deep Cosmic Ambient Drone (Sub-bass detuned chords with smooth modulation).
   */
  private createSpaceDrone() {
    if (!this.ctx || !this.gainNode) return;

    const notes = [65.41, 98.0, 130.81]; // C2, G2, C3 chord
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.gainNode) return;
      const osc = this.ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq + (idx === 1 ? 0.35 : -0.2); // subtle binaural detune

      const subGain = this.ctx.createGain();
      subGain.gain.value = 0.25;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 280;

      osc.connect(subGain).connect(filter).connect(this.gainNode);
      osc.start(0);
      this.activeNodes.push(osc, subGain, filter);
    });
  }

  /**
   * Warm Cafe / Coffee Shop Ambience (warm textured murmur & acoustic rumble).
   */
  private createCafeAmbience() {
    if (!this.ctx || !this.gainNode) return;

    const source = this.createBrownNoiseSource(0.6);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 750;
    filter.Q.value = 1.2;

    source.connect(filter).connect(this.gainNode);
    this.activeNodes.push(source, filter);
  }

  private createBrownNoiseSource(gainMultiplier = 1.0): AudioNode {
    if (!this.ctx) throw new Error("No context");
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5 * gainMultiplier;
    }

    const brownNoise = this.ctx.createBufferSource();
    brownNoise.buffer = noiseBuffer;
    brownNoise.loop = true;
    brownNoise.start(0);
    this.activeNodes.push(brownNoise);
    return brownNoise;
  }

  private createWhiteNoiseSource(gainMultiplier = 1.0): AudioNode {
    if (!this.ctx) throw new Error("No context");
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * gainMultiplier;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    whiteNoise.start(0);
    this.activeNodes.push(whiteNoise);
    return whiteNoise;
  }
}

export const ambientAudio = new AmbientAudioEngine();
