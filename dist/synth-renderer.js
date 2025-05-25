// renderer process script for the synth window

// Create an AudioContext
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const gainNode = audioContext.createGain();
gainNode.connect(audioContext.destination);

// Map keyboard keys to notes and frequencies
const keyToNote = {
    'a': 'C4',
    'w': 'C#4',
    's': 'D4',
    'e': 'D#4',
    'd': 'E4',
    'f': 'F4',
    't': 'F#4',
    'g': 'G4',
    'y': 'G#4',
    'h': 'A4',
    'u': 'A#4',
    'j': 'B4',
    'k': 'C5'
};

const notes = {
  'C4': 261.63,
  'C#4': 277.18,
  'D4': 293.66,
  'D#4': 311.13,
  'E4': 329.63,
  'F4': 349.23,
  'F#4': 369.99,
  'G4': 392.00,
  'G#4': 415.30,
  'A4': 440.00,
  'A#4': 466.16,
  'B4': 493.88,
  'C5': 523.25
};

function getFrequency(note) {
    return notes[note];
}

// Keep track of active oscillators
const activeOscillators = {};

// Function to start a note
function startNote(note) {
  if (!audioContext) return;

  const frequency = getFrequency(note);
  if (!frequency || activeOscillators[note]) return; // Don't start if already playing or invalid note

  // Create oscillator
  const oscillator = audioContext.createOscillator();
  const waveformType = document.getElementById('waveformType').value;
  oscillator.type = waveformType; // Set waveform from selector
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  // Connect to gain node and start
  oscillator.connect(gainNode);
  oscillator.start();

  // Store active oscillator
  activeOscillators[note] = oscillator;
}

// Function to stop a note
function stopNote(note) {
  if (!activeOscillators[note]) return;

  // Stop and disconnect oscillator
  // Use a small ramp to avoid clicking noise
  activeOscillators[note].stop(audioContext.currentTime + 0.02);
  activeOscillators[note].disconnect();

  // Remove from active oscillators
  delete activeOscillators[note];
}

// --- Event Listeners ---

// On-screen keyboard button event listeners
document.querySelectorAll('.synth-keyboard button').forEach(button => {
  const note = button.dataset.note;

  button.addEventListener('mousedown', () => {
    startNote(note);
  });

  button.addEventListener('mouseup', () => {
    stopNote(note);
  });

  // Also handle touchend for mobile devices
  button.addEventListener('touchend', () => {
    stopNote(note);
  });
});

// Keyboard event listeners
document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    const note = keyToNote[key];
    if (note && !event.repeat) { // Added !event.repeat to prevent multiple notes on hold
        startNote(note);
    }
});

document.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    const note = keyToNote[key];
    if (note) {
        stopNote(note);
    }
});

// Resume audio context on user interaction
document.addEventListener('mousedown', resumeAudioContext);
document.addEventListener('keydown', resumeAudioContext);

function resumeAudioContext() {
  if (audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      console.log('AudioContext resumed successfully');
      // Remove listeners after resuming
      document.removeEventListener('mousedown', resumeAudioContext);
      document.removeEventListener('keydown', resumeAudioContext);
    });
  }
}

// Volume slider event listener
const volumeSlider = document.getElementById('volumeSlider');
volumeSlider.addEventListener('input', (event) => {
    const volume = parseFloat(event.target.value);
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
});

// Window controls event listeners (send IPC messages to main process)
document.getElementById('minimizeBtn').addEventListener('click', () => {
    window.synth.minimize();
});

document.getElementById('maximizeBtn').addEventListener('click', () => {
    window.synth.maximize();
});

document.getElementById('closeBtn').addEventListener('click', () => {
    window.synth.close();
});