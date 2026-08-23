/**
 * Pure Hz & Binaural Brainwave Synthesizer Engine (Web Audio API).
 * Engineered exclusively for acoustic neuroscience: Theta, Delta, Alpha, Gamma,
 * Schumann Resonance (7.83 Hz), Solfeggio tones (432 Hz, 528 Hz, 396 Hz), and pure sub-bass Brown Noise.
 * Zero external sample files or bandwidth required - 100% continuous mathematical synthesis.
 */

export type AmbientSoundType =
  | "none"
  | "alpha"
  | "theta"
  | "delta"
  | "schumann"
  | "gamma"
  | "beta_smr"
  | "solfeggio_432"
  | "solfeggio_528"
  | "solfeggio_396"
  | "brown_pure";

export interface AmbientSoundOption {
  id: AmbientSoundType;
  label: string;
  hzBadge: string;
  sublabel: string;
  icon: string;
  category: "brainwaves" | "solfeggio" | "noise";
}

export const AMBIENT_SOUND_OPTIONS: AmbientSoundOption[] = [
  {
    id: "alpha",
    label: "Ondas Alfa",
    hzBadge: "10 Hz",
    sublabel: "Estado de flujo & concentración relajada",
    icon: "🧘",
    category: "brainwaves",
  },
  {
    id: "theta",
    label: "Ondas Theta",
    hzBadge: "6 Hz",
    sublabel: "Calma mental profunda & creatividad intuitiva",
    icon: "🌊",
    category: "brainwaves",
  },
  {
    id: "schumann",
    label: "Resonancia Schumann",
    hzBadge: "7.83 Hz",
    sublabel: "Equilibrio nervioso & enraizamiento natural",
    icon: "🌍",
    category: "brainwaves",
  },
  {
    id: "gamma",
    label: "Ondas Gamma",
    hzBadge: "40 Hz",
    sublabel: "Hiperfoco cognitivo & retención de datos",
    icon: "🧠",
    category: "brainwaves",
  },
  {
    id: "beta_smr",
    label: "Ondas SMR / Beta",
    hzBadge: "14 Hz",
    sublabel: "Atención ejecutiva sostenida sin fatiga",
    icon: "⚡",
    category: "brainwaves",
  },
  {
    id: "delta",
    label: "Ondas Delta",
    hzBadge: "2.5 Hz",
    sublabel: "Relajación subconsciente & recuperación",
    icon: "🌙",
    category: "brainwaves",
  },
  {
    id: "solfeggio_432",
    label: "Tono Armónico",
    hzBadge: "432 Hz",
    sublabel: "Claridad acústica & reducción de cortisol",
    icon: "✨",
    category: "solfeggio",
  },
  {
    id: "solfeggio_528",
    label: "Tono Transformación",
    hzBadge: "528 Hz",
    sublabel: "Frecuencia de claridad & coherencia mental",
    icon: "🌿",
    category: "solfeggio",
  },
  {
    id: "solfeggio_396",
    label: "Tono Liberación",
    hzBadge: "396 Hz",
    sublabel: "Disolución de tensión & ansiedad de trabajo",
    icon: "🛡️",
    category: "solfeggio",
  },
  {
    id: "brown_pure",
    label: "Brown Noise Sub-Bass",
    hzBadge: "< 350 Hz",
    sublabel: "Aislamiento acústico profundo puro (Anti-TDAH)",
    icon: "🎧",
    category: "noise",
  },
  {
    id: "none",
    label: "Silencio",
    hzBadge: "0 Hz",
    sublabel: "Sin audio de fondo",
    icon: "🔇",
    category: "noise",
  },
];

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private activeNodes: (AudioNode | { stop?: () => void; disconnect?: () => void })[] = [];
  private masterGain: GainNode | null = null;
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
    // 1. Immediately terminate any previous sound synchronously
    this.stop();
    if (type === "none") return;

    // 2. Ensure AudioContext is alive and active
    this.initContext();
    if (!this.ctx) return;

    const safeVol = Math.max(0.01, Math.min(1.0, volume));
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(safeVol, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    switch (type) {
      case "alpha":
        // 180 Hz Left, 190 Hz Right -> 10 Hz Alpha
        this.createPureBinauralBeat(180, 10, 0.15);
        break;
      case "theta":
        // 144 Hz Left, 150 Hz Right -> 6 Hz Theta
        this.createPureBinauralBeat(144, 6, 0.2);
        break;
      case "schumann":
        // 136.1 Hz Left, 143.93 Hz Right -> 7.83 Hz Schumann
        this.createPureBinauralBeat(136.1, 7.83, 0.18);
        break;
      case "gamma":
        // 200 Hz Left, 240 Hz Right -> 40 Hz Gamma
        this.createPureBinauralBeat(200, 40, 0.12);
        break;
      case "beta_smr":
        // 190 Hz Left, 204 Hz Right -> 14 Hz SMR
        this.createPureBinauralBeat(190, 14, 0.15);
        break;
      case "delta":
        // 108 Hz Left, 110.5 Hz Right -> 2.5 Hz Delta
        this.createPureBinauralBeat(108, 2.5, 0.25);
        break;
      case "solfeggio_432":
        this.createSolfeggioDrone(432, 216);
        break;
      case "solfeggio_528":
        this.createSolfeggioDrone(528, 264);
        break;
      case "solfeggio_396":
        this.createSolfeggioDrone(396, 198);
        break;
      case "brown_pure":
        this.createPureBrownNoise();
        break;
    }

    this.currentType = type;
  }

  public setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      const safeVol = Math.max(0.001, Math.min(1.0, volume));
      this.masterGain.gain.setValueAtTime(safeVol, this.ctx.currentTime);
    }
  }

  /**
   * Synchronous, instant cleanup of all currently running oscillators and filters.
   */
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

    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch {
        // ignore
      }
      this.masterGain = null;
    }

    this.currentType = "none";
  }

  public getCurrentType(): AmbientSoundType {
    return this.currentType;
  }

  /**
   * Pure Sine Stereo Binaural Synthesis with soft warm sub-bed.
   */
  private createPureBinauralBeat(carrierFreq: number, beatFreq: number, brownBedMix = 0.15) {
    if (!this.ctx || !this.masterGain) return;

    // Left Ear Channel
    const oscLeft = this.ctx.createOscillator();
    oscLeft.type = "sine";
    oscLeft.frequency.value = carrierFreq;

    // Right Ear Channel
    const oscRight = this.ctx.createOscillator();
    oscRight.type = "sine";
    oscRight.frequency.value = carrierFreq + beatFreq;

    const gainL = this.ctx.createGain();
    gainL.gain.value = 0.45;
    const gainR = this.ctx.createGain();
    gainR.gain.value = 0.45;

    if ("createStereoPanner" in this.ctx) {
      const panL = this.ctx.createStereoPanner();
      panL.pan.value = -0.95;
      const panR = this.ctx.createStereoPanner();
      panR.pan.value = 0.95;

      oscLeft.connect(gainL).connect(panL).connect(this.masterGain);
      oscRight.connect(gainR).connect(panR).connect(this.masterGain);
      this.activeNodes.push(panL, panR);
    } else {
      oscLeft.connect(gainL).connect(this.masterGain);
      oscRight.connect(gainR).connect(this.masterGain);
    }

    // Soft warm sub-bass cushion to avoid harsh pure tone fatigue
    if (brownBedMix > 0) {
      const brownBed = this.createBrownNoiseSource(brownBedMix);
      const bedFilter = this.ctx.createBiquadFilter();
      bedFilter.type = "lowpass";
      bedFilter.frequency.value = 250;
      brownBed.connect(bedFilter).connect(this.masterGain);
      this.activeNodes.push(brownBed, bedFilter);
    }

    oscLeft.start(0);
    oscRight.start(0);
    this.activeNodes.push(oscLeft, oscRight, gainL, gainR);
  }

  /**
   * Solfeggio Resonant Pure Tone with Subharmonic & Gentle LFO Modulation.
   */
  private createSolfeggioDrone(fundamentalHz: number, subharmonicHz: number) {
    if (!this.ctx || !this.masterGain) return;

    // Fundamental Pure Tone
    const oscMain = this.ctx.createOscillator();
    oscMain.type = "sine";
    oscMain.frequency.value = fundamentalHz;

    // Warm octave subharmonic
    const oscSub = this.ctx.createOscillator();
    oscSub.type = "sine";
    oscSub.frequency.value = subharmonicHz;

    const mainGain = this.ctx.createGain();
    mainGain.gain.value = 0.4;

    const subGain = this.ctx.createGain();
    subGain.gain.value = 0.25;

    // Warm low-pass smoothing
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = fundamentalHz * 1.6;

    oscMain.connect(mainGain).connect(filter).connect(this.masterGain);
    oscSub.connect(subGain).connect(filter).connect(this.masterGain);

    oscMain.start(0);
    oscSub.start(0);
    this.activeNodes.push(oscMain, oscSub, mainGain, subGain, filter);
  }

  /**
   * Ultra-deep pure Brownian noise (Low rumble with strict < 320 Hz filter).
   */
  private createPureBrownNoise() {
    if (!this.ctx || !this.masterGain) return;

    const source = this.createBrownNoiseSource(1.0);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 320; // Pure deep low-frequency rumble, zero harshness
    filter.Q.value = 0.5;

    source.connect(filter).connect(this.masterGain);
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
}

export const ambientAudio = new AmbientAudioEngine();
