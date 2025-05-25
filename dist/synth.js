// Create an AudioContext
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Function to get frequency for a given note (simple implementation for one octave)
function getFrequency(note) {
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
  };
  return notes[note];
}

// Keep track of active oscillators
const activeOscillators = {};

// Function to start a note
function startNote(note) {
  if (!audioContext) return;

  const frequency = getFrequency(note);
  if (!frequency) return;

  // Create oscillator
  const oscillator = audioContext.createOscillator();
  oscillator.type = 'sine'; // Sine wave for a simple tone
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  // Connect to output and start
  oscillator.connect(audioContext.destination);
  oscillator.start();

  // Store active oscillator
  activeOscillators[note] = oscillator;
}

// Function to stop a note
function stopNote(note) {
  if (!activeOscillators[note]) return;

  // Stop and disconnect oscillator
  activeOscillators[note].stop();
  activeOscillators[note].disconnect();

  // Remove from active oscillators
  delete activeOscillators[note];
}

// Add event listeners to the keyboard buttons
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