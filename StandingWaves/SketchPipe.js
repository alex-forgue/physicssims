// Constants
const v = 343; // Wave speed (m/s)
const tolerance = 0.01; // 1% tolerance for valid standing wave condition
const scaleFactor = 100; // pixels per meter for drawing

// Global variables for controls and display elements
let pipeLengthSlider, harmonicSlider, freqSlider, wavelengthSlider, pipeSelect;
let pipeLengthDisplay, harmonicDisplay, freqDisplay, wavelengthDisplay;
let canvasWidth = 800, canvasHeight = 400;
let offsetX = 50, offsetY = 200; // drawing offsets

// Flag to prevent circular updates between frequency and wavelength sliders
let isSyncing = false;

function setup() {
  createCanvas(canvasWidth, canvasHeight);
  
  // Grab the control elements
  pipeLengthSlider = select('#pipeLengthSlider');
  harmonicSlider = select('#harmonicSlider');
  freqSlider = select('#freqSlider');
  wavelengthSlider = select('#wavelengthSlider');
  pipeSelect = select('#pipeSelect');
  
  pipeLengthDisplay = select('#pipeLengthDisplay');
  harmonicDisplay = select('#harmonicDisplay');
  freqDisplay = select('#freqDisplay');
  wavelengthDisplay = select('#wavelengthDisplay');
  
  // Set initial valid standing wave parameters (from pipe length, harmonic, & pipe type)
  updateStandingWaveParameters();
  
  // When the pipe length, harmonic, or pipe type changes, update the valid frequency/wavelength.
  pipeLengthSlider.input(() => { updateStandingWaveParameters(); });
  harmonicSlider.input(() => { updateStandingWaveParameters(); });
  pipeSelect.changed(() => { updateStandingWaveParameters(); });
  
  // Link the frequency and wavelength sliders to keep v = f·λ constant.
  freqSlider.input(() => {
    if (isSyncing) return;
    isSyncing = true;
    let f = Number(freqSlider.value());
    let lambda = v / f;
    wavelengthSlider.value(lambda);
    updateDisplay();
    isSyncing = false;
  });
  
  wavelengthSlider.input(() => {
    if (isSyncing) return;
    isSyncing = true;
    let lambda = Number(wavelengthSlider.value());
    let f = v / lambda;
    freqSlider.value(f);
    updateDisplay();
    isSyncing = false;
  });
}

function updateStandingWaveParameters() {
  if (isSyncing) return; // avoid recursion
  isSyncing = true;
  
  let L = Number(pipeLengthSlider.value()); // Pipe length in meters
  let harmonic = Number(harmonicSlider.value());
  let pipeType = pipeSelect.value();
  
  // Calculate valid frequency and wavelength for a standing wave.
  let f_valid, lambda_valid;
  if (pipeType === 'open-open' || pipeType === 'closed-closed') {
    f_valid = harmonic * v / (2 * L);
    lambda_valid = 2 * L / harmonic;
  } else if (pipeType === 'closed-open') {
    f_valid = (2 * harmonic - 1) * v / (4 * L);
    lambda_valid = 4 * L / (2 * harmonic - 1);
  }
  
  // Set the frequency and wavelength sliders to the valid standing wave values.
  freqSlider.value(f_valid);
  wavelengthSlider.value(lambda_valid);
  
  updateDisplay();
  isSyncing = false;
}

function updateDisplay() {
  // Update the on-screen displays for each control.
  pipeLengthDisplay.html(Number(pipeLengthSlider.value()).toFixed(1));
  harmonicDisplay.html(harmonicSlider.value());
  freqDisplay.html(Number(freqSlider.value()).toFixed(1));
  wavelengthDisplay.html(Number(wavelengthSlider.value()).toFixed(2));
}

function draw() {
  background(255);
  
  let L = Number(pipeLengthSlider.value()); // in meters
  let harmonic = Number(harmonicSlider.value());
  let pipeType = pipeSelect.value();
  
  // Recalculate valid parameters (for display purposes)
  let f_valid, lambda_valid;
  if (pipeType === 'open-open' || pipeType === 'closed-closed') {
    f_valid = harmonic * v / (2 * L);
    lambda_valid = 2 * L / harmonic;
  } else if (pipeType === 'closed-open') {
    f_valid = (2 * harmonic - 1) * v / (4 * L);
    lambda_valid = 4 * L / (2 * harmonic - 1);
  }
  
  // Get the current frequency (and compute wavelength from v = f·λ)
  let f_input = Number(freqSlider.value());
  let lambda_input = v / f_input;
  
  // Check if the current frequency is within tolerance of the valid frequency.
  let validStandingWave = (abs(f_input - f_valid) / f_valid) < tolerance;
  
  // Map physical length (m) to pixels.
  let L_pixels = L * scaleFactor;
  
  // Draw the pipe boundaries.
  stroke(0);
  strokeWeight(2);
  line(offsetX, offsetY - 50, offsetX, offsetY + 50);
  line(offsetX + L_pixels, offsetY - 50, offsetX + L_pixels, offsetY + 50);
  
  // Show valid parameters.
  noStroke();
  fill(0);
  textSize(14);
  text("Valid frequency for standing wave: " + f_valid.toFixed(1) + " Hz", offsetX, 30);
  text("Valid wavelength for standing wave: " + lambda_valid.toFixed(2) + " m", offsetX, 50);
  
  // Draw the standing wave if the current frequency is valid.
  if (validStandingWave) {
    let t = millis() / 1000;
    stroke(0, 0, 255);
    strokeWeight(2);
    noFill();
    beginShape();
    for (let x = 0; x <= L_pixels; x++) {
      let spatialVal = 0;
      // Choose the spatial function based on pipe type.
      if (pipeType === 'open-open') {
        spatialVal = cos((harmonic * PI * x) / L_pixels);
      } else if (pipeType === 'closed-closed') {
        spatialVal = sin((harmonic * PI * x) / L_pixels);
      } else if (pipeType === 'closed-open') {
        spatialVal = sin(((2 * harmonic - 1) * PI * x) / (2 * L_pixels));
      }
      // The complete standing wave includes a time-varying factor.
      let y = 50 * spatialVal * cos(TWO_PI * f_input * t);
      vertex(offsetX + x, offsetY + y);
    }
    endShape();
    
    // Calculate and draw node positions (using the spatial function at t = 0).
    fill('red');
    noStroke();
    let nodePositions = [];
    if (pipeType === 'open-open') {
      // For cosine, nodes occur where cos((harmonic*PI*x)/L_pixels)=0:
      // x = L_pixels * (2k+1)/(2*harmonic) for k = 0 to harmonic-1.
      for (let k = 0; k < harmonic; k++) {
        let xPos = offsetX + L_pixels * (2 * k + 1) / (2 * harmonic);
        nodePositions.push(xPos);
      }
    } else if (pipeType === 'closed-closed') {
      // For sine, nodes occur at x = L_pixels * k/harmonic for k = 0 to harmonic.
      for (let k = 0; k <= harmonic; k++) {
        let xPos = offsetX + L_pixels * k / harmonic;
        nodePositions.push(xPos);
      }
    } else if (pipeType === 'closed-open') {
      // For a closed-open pipe, nodes occur at:
      // x = (2*L_pixels*k)/(2*harmonic - 1) for k = 0 to harmonic, ensuring x ≤ L_pixels.
      for (let k = 0; k <= harmonic; k++) {
        let xPos = offsetX + (2 * L_pixels * k) / (2 * harmonic - 1);
        if (xPos <= offsetX + L_pixels) nodePositions.push(xPos);
      }
    }
    
    // Draw small circles at each node.
    nodePositions.forEach(xPos => {
      ellipse(xPos, offsetY, 8, 8);
    });
    
  } else {
    // Display a message if the frequency/wavelength does not produce a standing wave.
    fill(255, 0, 0);
    noStroke();
    textSize(16);
    text("Not a valid standing wave for current conditions.", offsetX, offsetY + 80);
  }
}
