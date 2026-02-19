// Простой генератор фоновой музыки с использованием Web Audio API
// Создаёт лёгкую ambient-музыку без внешних файлов

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private oscillators: OscillatorNode[] = [];
  private intervals: number[] = [];
  
  constructor() {
    // AudioContext создаём только после взаимодействия пользователя
  }
  
  async init() {
    if (this.audioContext) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.15; // Низкая громкость
      this.masterGain.connect(this.audioContext.destination);
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }
  
  start() {
    if (!this.audioContext || !this.masterGain || this.isPlaying) return;
    
    this.isPlaying = true;
    
    // Ambient pad (мягкий фон)
    this.playAmbientPad();
    
    // Мелодические нотки
    this.playMelody();
    
    // Лёгкий ритм
    this.playRhythm();
  }
  
  private playAmbientPad() {
    if (!this.audioContext || !this.masterGain) return;
    
    const chords = [
      [261.63, 329.63, 392.00], // C major
      [293.66, 369.99, 440.00], // D major
      [329.63, 415.30, 493.88], // E major
      [349.23, 440.00, 523.25], // F major
    ];
    
    let chordIndex = 0;
    
    const playChord = () => {
      if (!this.audioContext || !this.masterGain || !this.isPlaying) return;
      
      const chord = chords[chordIndex % chords.length];
      chordIndex++;
      
      chord.forEach((freq) => {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq / 2; // Октава ниже
        
        gain.gain.value = 0;
        gain.gain.linearRampToValueAtTime(0.05, this.audioContext!.currentTime + 0.5);
        gain.gain.linearRampToValueAtTime(0, this.audioContext!.currentTime + 4);
        
        osc.connect(gain);
        gain.connect(this.masterGain!);
        
        osc.start();
        osc.stop(this.audioContext!.currentTime + 4.5);
        
        this.oscillators.push(osc);
      });
    };
    
    playChord();
    const interval = window.setInterval(playChord, 4000);
    this.intervals.push(interval);
  }
  
  private playMelody() {
    if (!this.audioContext || !this.masterGain) return;
    
    const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 659.25, 523.25, 440.00];
    let noteIndex = 0;
    
    const playNote = () => {
      if (!this.audioContext || !this.masterGain || !this.isPlaying) return;
      
      // 30% шанс проиграть ноту
      if (Math.random() > 0.3) return;
      
      const freq = notes[noteIndex % notes.length];
      noteIndex++;
      
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      filter.type = 'lowpass';
      filter.frequency.value = 2000;
      
      gain.gain.value = 0;
      gain.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1.5);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.start();
      osc.stop(this.audioContext.currentTime + 2);
      
      this.oscillators.push(osc);
    };
    
    const interval = window.setInterval(playNote, 2000);
    this.intervals.push(interval);
  }
  
  private playRhythm() {
    if (!this.audioContext || !this.masterGain) return;
    
    const playBeat = () => {
      if (!this.audioContext || !this.masterGain || !this.isPlaying) return;
      
      // Kick-like sound
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = 60;
      osc.frequency.exponentialRampToValueAtTime(30, this.audioContext.currentTime + 0.1);
      
      gain.gain.value = 0.1;
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.3);
      
      this.oscillators.push(osc);
    };
    
    const interval = window.setInterval(playBeat, 4000);
    this.intervals.push(interval);
  }
  
  stop() {
    this.isPlaying = false;
    
    // Остановить все интервалы
    this.intervals.forEach(id => clearInterval(id));
    this.intervals = [];
    
    // Остановить все осцилляторы
    this.oscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Уже остановлен
      }
    });
    this.oscillators = [];
  }
  
  toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.init().then(() => this.start());
    }
    return !this.isPlaying;
  }
  
  setVolume(value: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, value));
    }
  }
  
  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

// Singleton instance
export const audioManager = new AudioManager();
