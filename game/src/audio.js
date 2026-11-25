// Golden Skillet sound: every effect and the background tune are synthesised with
// WebAudio oscillators and filtered noise — there are no audio files. The context is
// created lazily and resumed on the first user gesture, as browsers require; until
// then (and in screenshot mode) every call here is a silent no-op.

export function createAudio() {
  let ctx = null;
  let master = null;
  let musicGain = null;
  let muted = false;
  let musicTimer = null;
  let nextNoteTime = 0;
  let chordIndex = 0;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.16;
    musicGain.connect(master);
    return true;
  }

  /** A short oscillator blip with an exponential decay envelope. */
  function tone(freqFrom, freqTo, seconds, type, volume, when = 0, destination = null) {
    if (!ensure()) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), t0 + seconds);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(gain);
    gain.connect(destination ?? master);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.02);
  }

  /** A burst of white noise through a band-pass filter (sizzles, puffs, paper). */
  function noise(seconds, filterFreq, volume, when = 0, q = 1) {
    if (!ensure()) return;
    const t0 = ctx.currentTime + when;
    const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(t0);
  }

  const sfx = {
    /** Ingredient lands on the tray. */
    pop() { tone(520, 240, 0.09, 'square', 0.12); },
    /** A portion starts cooking / is taken off the heat. */
    sizzle() { noise(0.35, 5200, 0.10, 0, 0.7); },
    /** Something lands in the bin. */
    trash() { noise(0.16, 700, 0.16); tone(180, 70, 0.14, 'triangle', 0.10); },
    /** A serve the kitchen cannot make. */
    buzz() { tone(140, 120, 0.22, 'sawtooth', 0.12); tone(147, 126, 0.22, 'sawtooth', 0.10); },
    /** A happy customer: the till bell. */
    ding() { tone(1318, 1318, 0.35, 'sine', 0.16); tone(1760, 1760, 0.3, 'sine', 0.08, 0.02); },
    /** Coins: a quick two-note sparkle. */
    coin() { tone(988, 988, 0.08, 'square', 0.10); tone(1319, 1319, 0.16, 'square', 0.10, 0.07); },
    /** A customer gives up and leaves. */
    leave() { tone(392, 392, 0.14, 'triangle', 0.12); tone(330, 330, 0.14, 'triangle', 0.12, 0.13); tone(262, 240, 0.22, 'triangle', 0.12, 0.26); },
    /** A new ticket pins itself to the board. */
    ticket() { noise(0.06, 2400, 0.10); tone(740, 660, 0.07, 'triangle', 0.08); },
    /** A button press. */
    click() { tone(660, 520, 0.05, 'triangle', 0.08); },
    /** The day is won. */
    fanfare() {
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => tone(f, f, 0.22, 'triangle', 0.14, i * 0.11));
    },
  };

  // A gentle bistro loop: soft triangle chords (C – Am – F – G) with a slow bass,
  // one chord every two seconds, scheduled a little ahead of the clock.
  const CHORDS = [
    [261.6, 329.6, 392.0],
    [220.0, 261.6, 329.6],
    [174.6, 220.0, 261.6],
    [196.0, 246.9, 293.7],
  ];
  const BASS = [130.8, 110.0, 87.3, 98.0];
  const CHORD_SECONDS = 2.0;

  function scheduleChord() {
    const chord = CHORDS[chordIndex % CHORDS.length];
    const when = Math.max(0, nextNoteTime - ctx.currentTime);
    tone(BASS[chordIndex % BASS.length], BASS[chordIndex % BASS.length], CHORD_SECONDS * 0.9, 'sine', 0.5, when, musicGain);
    chord.forEach((f) => tone(f, f, CHORD_SECONDS * 0.85, 'triangle', 0.16, when, musicGain));
    chordIndex += 1;
    nextNoteTime += CHORD_SECONDS;
  }

  function startMusic() {
    if (!ensure() || musicTimer !== null) return;
    nextNoteTime = ctx.currentTime + 0.06;
    chordIndex = 0;
    scheduleChord();
    musicTimer = window.setInterval(() => {
      if (!ctx) return;
      while (nextNoteTime < ctx.currentTime + CHORD_SECONDS * 1.5) scheduleChord();
    }, 500);
  }

  function stopMusic() {
    if (musicTimer !== null) {
      window.clearInterval(musicTimer);
      musicTimer = null;
    }
  }

  return {
    sfx,
    startMusic,
    stopMusic,
    unlock() { ensure(); },
    setMuted(value) {
      muted = value;
      if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 0.9, ctx.currentTime, 0.02);
    },
    isMuted() { return muted; },
  };
}
