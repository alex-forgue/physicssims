// Global variables for frequencies and time
let f1 = 440;
let f2 = 444;
let t = 0;
let lastTime = performance.now();
let isPaused = false;
let pausedTime = 0;

// DOM elements
const canvas = document.getElementById("waveCanvas");
const ctx = canvas.getContext("2d");
const freqASlider = document.getElementById("freqA");
const freqBSlider = document.getElementById("freqB");
const freqAValueDisplay = document.getElementById("freqAValue");
const freqBValueDisplay = document.getElementById("freqBValue");
const dataFreqA = document.getElementById("dataFreqA");
const dataFreqB = document.getElementById("dataFreqB");
const dataBeat = document.getElementById("dataBeat");
const toggleWaves = document.getElementById("toggleWaves");
const restrictDiffCheckbox = document.getElementById("restrictDiff");
const playButton = document.getElementById("playAudio");
const stopButton = document.getElementById("stopAudio");
const pauseButton = document.getElementById("pauseAnimation");
const timeControlDiv = document.getElementById("timeControl");
const timeSlider = document.getElementById("timeSlider");
const timeValueDisplay = document.getElementById("timeValue");

// Audio variables
let audioCtx;
let oscillatorA, oscillatorB;
let isPlaying = false;

// Function to update frequencies and, if enabled, enforce a maximum 12 Hz difference
function updateFrequencies(changedSlider) {
  f1 = parseFloat(freqASlider.value);
  f2 = parseFloat(freqBSlider.value);
  const restrictDiffChecked = restrictDiffCheckbox.checked;
  
  if (restrictDiffChecked) {
    if (changedSlider === "freqA") {
      if (f2 - f1 > 12) {
        f2 = f1 + 12;
        freqBSlider.value = f2;
      } else if (f1 - f2 > 12) {
        f2 = f1 - 12;
        freqBSlider.value = f2;
      }
    } else if (changedSlider === "freqB") {
      if (f2 - f1 > 12) {
        f1 = f2 - 12;
        freqASlider.value = f1;
      } else if (f1 - f2 > 12) {
        f1 = f2 + 12;
        freqASlider.value = f1;
      }
    }
  }
  
  // Update displayed values and data table
  freqAValueDisplay.textContent = f1;
  freqBValueDisplay.textContent = f2;
  dataFreqA.textContent = f1;
  dataFreqB.textContent = f2;
  dataBeat.textContent = Math.abs(f2 - f1).toFixed(2);
  
  // Update oscillator frequencies if audio is playing
  if (isPlaying && audioCtx) {
    oscillatorA.frequency.setValueAtTime(f1, audioCtx.currentTime);
    oscillatorB.frequency.setValueAtTime(f2, audioCtx.currentTime);
  }
}

// Event listeners for frequency sliders and the restriction checkbox
freqASlider.addEventListener("input", () => {
  updateFrequencies("freqA");
});
freqBSlider.addEventListener("input", () => {
  updateFrequencies("freqB");
});
restrictDiffCheckbox.addEventListener("change", () => {
  updateFrequencies("freqA");
});

// Event listener for the time slider (visible when paused)
timeSlider.addEventListener("input", function() {
  pausedTime = parseFloat(timeSlider.value);
  timeValueDisplay.textContent = pausedTime.toFixed(2);
});

// Pause/resume animation button event listener
pauseButton.addEventListener("click", function() {
  if (!isPaused) {
    // Pause the animation
    isPaused = true;
    pausedTime = t; // capture current time
    timeSlider.value = pausedTime;
    timeValueDisplay.textContent = pausedTime.toFixed(2);
    timeControlDiv.style.display = "block";
    pauseButton.textContent = "Resume Animation";
  } else {
    // Resume the animation
    isPaused = false;
    t = pausedTime; // resume from current slider value
    timeControlDiv.style.display = "none";
    pauseButton.textContent = "Pause Animation";
    lastTime = performance.now(); // reset time base to avoid jump
  }
});

// Animation loop for drawing the waves
function draw() {
  const now = performance.now();
  if (!isPaused) {
    const dt = (now - lastTime) / 1000; // seconds
    lastTime = now;
    t += dt;
  } else {
    t = pausedTime;
  }
  
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const centerY = canvas.height / 2;
  const amplitude = 50;
  const timeScale = 0.005;
  
  // Draw the beat envelope (solid purple line)
  ctx.beginPath();
  ctx.strokeStyle = "purple";
  ctx.lineWidth = 2;
  for (let x = 0; x < canvas.width; x++) {
    const timePoint = t + x * timeScale;
    const envelope = Math.abs(Math.cos(Math.PI * Math.abs(f2 - f1) * timePoint));
    const y = centerY + amplitude * envelope;
    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  
  // Optionally draw the individual waves (dotted lines)
  if (toggleWaves.checked) {
    // Wave A (red dotted line)
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "red";
    for (let x = 0; x < canvas.width; x++) {
      const timePoint = t + x * timeScale;
      const y = centerY + amplitude * Math.sin(2 * Math.PI * f1 * timePoint);
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    
    // Wave B (blue dotted line)
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "blue";
    for (let x = 0; x < canvas.width; x++) {
      const timePoint = t + x * timeScale;
      const y = centerY + amplitude * Math.sin(2 * Math.PI * f2 * timePoint);
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    
    // Reset dash style
    ctx.setLineDash([]);
  }
  
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

// Audio functions using the Web Audio API
function startAudio() {
  if (isPlaying) return;
  
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  oscillatorA = audioCtx.createOscillator();
  oscillatorB = audioCtx.createOscillator();
  
  oscillatorA.frequency.value = f1;
  oscillatorB.frequency.value = f2;
  
  const gainA = audioCtx.createGain();
  const gainB = audioCtx.createGain();
  gainA.gain.value = 0.5;
  gainB.gain.value = 0.5;
  
  oscillatorA.connect(gainA);
  oscillatorB.connect(gainB);
  
  gainA.connect(audioCtx.destination);
  gainB.connect(audioCtx.destination);
  
  oscillatorA.start();
  oscillatorB.start();
  
  isPlaying = true;
}

function stopAudio() {
  if (!isPlaying) return;
  oscillatorA.stop();
  oscillatorB.stop();
  if (audioCtx && audioCtx.close) {
    audioCtx.close();
  }
  isPlaying = false;
}

playButton.addEventListener("click", startAudio);
stopButton.addEventListener("click", stopAudio);
