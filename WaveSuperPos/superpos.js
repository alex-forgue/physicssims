// Constants
const speed = 1000; // m/s
const titleMargin = 0; // Titles are now external, so no reserved top space in canvas

// Global wave parameters
let waveA = { amplitude: 1, frequency: 2 }; // Wave A (red)
let waveB = { amplitude: 1, frequency: 3 }; // Wave B (blue)
let phaseDiff = 0; // in radians; default 0

let paused = false;
let time = 0;
let showTime = false; // toggled via checkbox

// Get canvas contexts
const canvasA = document.getElementById('canvasA').getContext('2d');
const canvasB = document.getElementById('canvasB').getContext('2d');
const canvasAnim = document.getElementById('canvasAnim').getContext('2d');
const canvasResult = document.getElementById('canvasResult').getContext('2d');

// Get control elements
const phaseDiffSelect = document.getElementById("phaseDiffSelect");
const sliderWaveB_freq = document.getElementById("sliderWaveB_freq");
const showTimeCheckbox = document.getElementById("showTimeCheckbox");
const waveA_amp_val = document.getElementById("waveA_amp_val");
const waveA_freq_val = document.getElementById("waveA_freq_val");
const waveB_amp_val = document.getElementById("waveB_amp_val");
const waveB_freq_val = document.getElementById("waveB_freq_val");

// Update phase difference when dropdown changes
phaseDiffSelect.addEventListener("change", (e) => {
  const deg = parseFloat(e.target.value);
  phaseDiff = deg * Math.PI / 180;
  // If phase difference is nonzero, force Wave B frequency to match Wave A and disable its slider.
  if (deg !== 0) {
    waveB.frequency = waveA.frequency;
    sliderWaveB_freq.disabled = true;
    sliderWaveB_freq.value = waveA.frequency;
    waveB_freq_val.textContent = waveA.frequency.toFixed(2);
  } else {
    sliderWaveB_freq.disabled = false;
  }
});

// Update showTime flag when checkbox is toggled
showTimeCheckbox.addEventListener("change", (e) => {
  showTime = e.target.checked;
});

// Draw grid with y-axis labels on the left.
// maxVal: current maximum amplitude to display (graph will show from -maxVal to +maxVal)
// scale: pixels per unit amplitude
function drawGrid(ctx, maxVal, scale) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const baseline = height / 2;
  ctx.save();
  ctx.strokeStyle = "#ddd";
  ctx.lineWidth = 1;
  
  // Define horizontal grid levels and labels.
  const levels = [maxVal, maxVal/2, 0, -maxVal/2, -maxVal];
  ctx.font = "10px sans-serif";
  ctx.fillStyle = "black";
  ctx.textAlign = "right";
  
  levels.forEach(level => {
    const y = baseline - level * scale;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
    // Label on left side.
    ctx.fillText(level.toFixed(2), 35, y - 2);
  });
  
  // Draw default vertical grid lines every 50 pixels.
  for (let x = 0; x <= width; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  // If "Show Time" is enabled, add extra vertical lines at T/8, T/4, T/2, and T.
  if (showTime) {
    ctx.save();
    ctx.strokeStyle = "orange";
    ctx.lineWidth = 2;
    let positions = [width/8, width/4, width/2, width];
    let labels = ["T/8", "T/4", "T/2", "T"];
    positions.forEach((x, idx) => {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      // Label the line at the bottom.
      ctx.fillStyle = "orange";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(labels[idx], x, height - 2);
    });
    ctx.restore();
  }
  
  ctx.restore();
}

// Draw an individual wave so that one period exactly fills the canvas width.
// For Wave B, an extra phase (phaseDiff) is added.
function drawWave(ctx, amplitude, frequency, time, color, extraPhase=0) {
  // Ensure a minimum vertical range of 1.
  const currentMax = Math.max(Math.abs(amplitude), 1);
  // One period: wavelength = speed / frequency.
  const wavelength = speed / frequency;
  const scaleX = ctx.canvas.width / wavelength; // not used directly here
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const baseline = height / 2;
  const scaleY = height / (2 * currentMax);
  
  ctx.clearRect(0, 0, width, height);
  drawGrid(ctx, currentMax, scaleY);
  
  ctx.beginPath();
  ctx.strokeStyle = color;
  
  for (let x = 0; x < width; x++) {
    // Map x (in pixels) to physical distance over one period.
    let physical_x = (x / width) * wavelength;
    let y = amplitude * Math.sin(2 * Math.PI * frequency * (physical_x / speed - time) + extraPhase);
    let canvasY = baseline - y * scaleY;
    if (x === 0) {
      ctx.moveTo(x, canvasY);
    } else {
      ctx.lineTo(x, canvasY);
    }
  }
  ctx.stroke();
}

// Draw the resultant wave (sum of Wave A and Wave B) on its canvas.
// Vertical scaling is determined by the maximum displacement of (yA+yB).
function drawResultantWave(ctx, time) {
  const wavelengthA = speed / waveA.frequency;
  const wavelengthB = speed / waveB.frequency;
  const effectiveWavelength = (wavelengthA + wavelengthB) / 2;
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const baseline = height / 2;
  const currentMax = Math.max(Math.abs(waveA.amplitude + waveB.amplitude), 1);
  const scaleY = height / (2 * currentMax);
  
  ctx.clearRect(0, 0, width, height);
  drawGrid(ctx, currentMax, scaleY);
  
  ctx.beginPath();
  ctx.strokeStyle = 'purple';
  for (let x = 0; x < width; x++) {
    let physical_x = (x / width) * effectiveWavelength;
    let yA = waveA.amplitude * Math.sin(2 * Math.PI * waveA.frequency * (physical_x / speed - time));
    let yB = waveB.amplitude * Math.sin(2 * Math.PI * waveB.frequency * (physical_x / speed - time) + phaseDiff);
    let yTotal = yA + yB;
    let canvasY = baseline - yTotal * scaleY;
    if (x === 0) {
      ctx.moveTo(x, canvasY);
    } else {
      ctx.lineTo(x, canvasY);
    }
  }
  ctx.stroke();
}

// Draw the stacked waves view: at each x, draw a red vertical line for Wave A
// and then a blue vertical line for Wave B (with phase difference) starting from the end of the red segment.
function drawStackedWaves(ctx, time) {
  const wavelengthA = speed / waveA.frequency;
  const wavelengthB = speed / waveB.frequency;
  const effectiveWavelength = (wavelengthA + wavelengthB) / 2;
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const baseline = height / 2;
  
  // For stacked view, maximum displacement is the sum of individual maximums.
  const currentMax = Math.max(Math.abs(waveA.amplitude), 1) + Math.max(Math.abs(waveB.amplitude), 1);
  const scaleY = height / (2 * currentMax);
  
  ctx.clearRect(0, 0, width, height);
  drawGrid(ctx, currentMax, scaleY);
  
  for (let x = 0; x < width; x++) {
    let physical_x = (x / width) * effectiveWavelength;
    let yA = waveA.amplitude * Math.sin(2 * Math.PI * waveA.frequency * (physical_x / speed - time));
    let yB = waveB.amplitude * Math.sin(2 * Math.PI * waveB.frequency * (physical_x / speed - time) + phaseDiff);
    
    const yA_pixels = yA * scaleY;
    const yTotal_pixels = (yA + yB) * scaleY;
    
    // Draw Wave A segment (red)
    ctx.beginPath();
    ctx.strokeStyle = 'red';
    ctx.moveTo(x, baseline);
    ctx.lineTo(x, baseline - yA_pixels);
    ctx.stroke();
    
    // Draw Wave B segment (blue) on top
    ctx.beginPath();
    ctx.strokeStyle = 'blue';
    ctx.moveTo(x, baseline - yA_pixels);
    ctx.lineTo(x, baseline - yTotal_pixels);
    ctx.stroke();
  }
}

// Utility functions for wavelength and period
function calculateWavelength(frequency) {
  return speed / frequency;
}
function calculatePeriod(frequency) {
  return 1 / frequency;
}

// Update the data table with current values.
function updateDataTable() {
  document.getElementById('ampA').textContent = waveA.amplitude.toFixed(2);
  document.getElementById('freqA').textContent = waveA.frequency.toFixed(2);
  document.getElementById('lambdaA').textContent = calculateWavelength(waveA.frequency).toFixed(2);
  document.getElementById('periodA').textContent = calculatePeriod(waveA.frequency).toFixed(2);
  
  document.getElementById('ampB').textContent = waveB.amplitude.toFixed(2);
  document.getElementById('freqB').textContent = waveB.frequency.toFixed(2);
  document.getElementById('lambdaB').textContent = calculateWavelength(waveB.frequency).toFixed(2);
  document.getElementById('periodB').textContent = calculatePeriod(waveB.frequency).toFixed(2);
  
  const canvas = canvasResult.canvas;
  const xCenter = canvas.width / 2;
  const wavelengthA = speed / waveA.frequency;
  const wavelengthB = speed / waveB.frequency;
  const effectiveWavelength = (wavelengthA + wavelengthB) / 2;
  const physical_x = (xCenter / canvas.width) * effectiveWavelength;
  const yA = waveA.amplitude * Math.sin(2 * Math.PI * waveA.frequency * (physical_x / speed - time));
  const yB = waveB.amplitude * Math.sin(2 * Math.PI * waveB.frequency * (physical_x / speed - time) + phaseDiff);
  const yResult = yA + yB;
  document.getElementById('ampR').textContent = Math.abs(yResult).toFixed(2);
  
  const avgFreq = (waveA.frequency + waveB.frequency) / 2;
  document.getElementById('freqR').textContent = avgFreq.toFixed(2);
  document.getElementById('lambdaR').textContent = (speed / avgFreq).toFixed(2);
  document.getElementById('periodR').textContent = (1 / avgFreq).toFixed(2);
}

// Mouse event handling: when the cursor moves over a canvas, display the corresponding physical x-value
// and the displacement (or, for the stacked view, the individual and total displacements).
function addMouseEvents(ctx, type) {
  const canvas = ctx.canvas;
  canvas.addEventListener("mousemove", function(e) {
    let x = e.offsetX;
    let wavelength, physical_x, yA_val, yB_val, y;
    if (type === "A") {
      wavelength = speed / waveA.frequency;
      physical_x = (x / canvas.width) * wavelength;
      y = waveA.amplitude * Math.sin(2 * Math.PI * waveA.frequency * (physical_x / speed - time));
      document.getElementById("infoPanel").textContent = "Wave A: x = " + physical_x.toFixed(2) + " m, y = " + y.toFixed(2);
    } else if (type === "B") {
      wavelength = speed / waveB.frequency;
      physical_x = (x / canvas.width) * wavelength;
      y = waveB.amplitude * Math.sin(2 * Math.PI * waveB.frequency * (physical_x / speed - time) + phaseDiff);
      document.getElementById("infoPanel").textContent = "Wave B: x = " + physical_x.toFixed(2) + " m, y = " + y.toFixed(2);
    } else if (type === "Resultant") {
      const wavelengthA = speed / waveA.frequency;
      const wavelengthB = speed / waveB.frequency;
      const effectiveWavelength = (wavelengthA + wavelengthB) / 2;
      physical_x = (x / canvas.width) * effectiveWavelength;
      yA_val = waveA.amplitude * Math.sin(2 * Math.PI * waveA.frequency * (physical_x / speed - time));
      yB_val = waveB.amplitude * Math.sin(2 * Math.PI * waveB.frequency * (physical_x / speed - time) + phaseDiff);
      y = yA_val + yB_val;
      document.getElementById("infoPanel").textContent = "Resultant: x = " + physical_x.toFixed(2) + " m, y = " + y.toFixed(2);
    } else if (type === "Stacked") {
      const wavelengthA = speed / waveA.frequency;
      const wavelengthB = speed / waveB.frequency;
      const effectiveWavelength = (wavelengthA + wavelengthB) / 2;
      physical_x = (x / canvas.width) * effectiveWavelength;
      yA_val = waveA.amplitude * Math.sin(2 * Math.PI * waveA.frequency * (physical_x / speed - time));
      yB_val = waveB.amplitude * Math.sin(2 * Math.PI * waveB.frequency * (physical_x / speed - time) + phaseDiff);
      document.getElementById("infoPanel").textContent = "Stacked: x = " + physical_x.toFixed(2) + " m, Wave A y = " + yA_val.toFixed(2) + ", Wave B y = " + yB_val.toFixed(2) + ", Total y = " + (yA_val+yB_val).toFixed(2);
    }
  });
  canvas.addEventListener("mouseout", function() {
    document.getElementById("infoPanel").textContent = "";
  });
}

// Attach mouse event handlers to each canvas.
addMouseEvents(canvasA, "A");
addMouseEvents(canvasB, "B");
addMouseEvents(canvasResult, "Resultant");
addMouseEvents(canvasAnim, "Stacked");

// Main animation loop
function animate() {
  // If phase difference is nonzero, force Wave B frequency to match Wave A.
  if (phaseDiff !== 0) {
    waveB.frequency = waveA.frequency;
    sliderWaveB_freq.value = waveA.frequency;
    waveB_freq_val.textContent = waveA.frequency.toFixed(2);
  }
  if (!paused) {
    time += 0.02;
  }
  
  // Draw the individual waves (one period per canvas).
  drawWave(canvasA, waveA.amplitude, waveA.frequency, time, 'red');
  drawWave(canvasB, waveB.amplitude, waveB.frequency, time, 'blue', phaseDiff);
  // Draw the stacked view (only red and blue waves) and the resultant wave.
  drawStackedWaves(canvasAnim, time);
  drawResultantWave(canvasResult, time);
  
  updateDataTable();
  requestAnimationFrame(animate);
}

// Slider event listeners for updating wave parameters and displaying slider values.
document.getElementById('sliderWaveA_amp').addEventListener('input', (e) => {
  waveA.amplitude = parseFloat(e.target.value);
  waveA_amp_val.textContent = waveA.amplitude.toFixed(2);
});
document.getElementById('sliderWaveA_freq').addEventListener('input', (e) => {
  waveA.frequency = parseFloat(e.target.value);
  waveA_freq_val.textContent = waveA.frequency.toFixed(2);
  // If phase difference is active, update Wave B frequency too.
  if (phaseDiff !== 0) {
    waveB.frequency = waveA.frequency;
    sliderWaveB_freq.value = waveA.frequency;
    waveB_freq_val.textContent = waveA.frequency.toFixed(2);
  }
});
document.getElementById('sliderWaveB_amp').addEventListener('input', (e) => {
  waveB.amplitude = parseFloat(e.target.value);
  waveB_amp_val.textContent = waveB.amplitude.toFixed(2);
});
document.getElementById('sliderWaveB_freq').addEventListener('input', (e) => {
  waveB.frequency = parseFloat(e.target.value);
  waveB_freq_val.textContent = waveB.frequency.toFixed(2);
});

// Pause/Resume button listener.
document.getElementById('pauseButton').addEventListener('click', () => {
  paused = !paused;
  document.getElementById('pauseButton').textContent = paused ? 'Resume' : 'Pause';
});

// Start the animation loop.
animate();
