
const volumeSlider = document.getElementById('volumeSlider');
const pitchSlider = document.getElementById('pitchSlider');
const playCheckbox = document.getElementById('playCheckbox');
const frequencyDisplay = document.getElementById('frequencyDisplay');
const canvas = document.getElementById('waveCanvas');
const ctx = canvas.getContext('2d');

// Audio variables
let audioCtx;
let oscillator;
let gainNode;

// Function to start the sound using Web Audio API
function startSound() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  oscillator = audioCtx.createOscillator();
  gainNode = audioCtx.createGain();

  // Set oscillator frequency and gain based on slider values
  oscillator.frequency.setValueAtTime(pitchSlider.value, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(volumeSlider.value, audioCtx.currentTime);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();
}

// Function to stop the sound
function stopSound() {
  if (oscillator) {
    oscillator.stop();
    oscillator.disconnect();
    oscillator = null;
  }
  if (gainNode) {
    gainNode.disconnect();
    gainNode = null;
  }
  if (audioCtx) {
    audioCtx.close();
    audioCtx = null;
  }
}

// Listen for changes to the play checkbox to start/stop sound
playCheckbox.addEventListener('change', function() {
  if (this.checked) {
    startSound();
  } else {
    stopSound();
  }
});

// Update gain when the volume slider changes
volumeSlider.addEventListener('input', function() {
  if (gainNode) {
    gainNode.gain.setValueAtTime(this.value, audioCtx.currentTime);
  }
});

// Update oscillator frequency and the frequency display when the pitch slider changes
pitchSlider.addEventListener('input', function() {
  if (oscillator) {
    oscillator.frequency.setValueAtTime(this.value, audioCtx.currentTime);
  }
  frequencyDisplay.textContent = this.value;
});

// Animation variables for drawing the wave
let time = 0;
function draw() {
  requestAnimationFrame(draw);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Retrieve current slider values
  const volume = parseFloat(volumeSlider.value);
  const pitch = parseFloat(pitchSlider.value);

  // Map the volume to an amplitude (scaling to half the canvas height)
  const amplitude = volume * canvas.height / 2;

  // For the visual representation, scale the pitch to a number of cycles:
  // For example, at 100 Hz, show 1 cycle; at 1000 Hz, show 10 cycles.
  const visualCycles = pitch / 100;
  const angularFrequency = visualCycles * 2 * Math.PI / canvas.width;

  // Draw grid lines to highlight the wave cycles
  const periodPixels = canvas.width / visualCycles;
  ctx.strokeStyle = "#eee";
  ctx.lineWidth = 1;
  for (let i = 0; i <= visualCycles; i++) {
    const x = i * periodPixels;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Draw the sine wave
  ctx.beginPath();
  for (let x = 0; x < canvas.width; x++) {
    let y = canvas.height / 2 + amplitude * Math.sin(angularFrequency * x + time);
    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.strokeStyle = '#007ACC';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Increment time to animate the wave (simulate movement)
  time += 0.05;
}
draw();
