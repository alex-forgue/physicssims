// Constants
const v = 343; // Wave speed in m/s
const tolerance = 0.01; // 1% tolerance for valid standing wave condition
const scaleFactor = 100; // pixels per meter (for drawing physical lengths)
const pipeHeight = 100;  // Height of the pipe body in pixels

// Global control variables
let pipeLengthSlider, harmonicSlider, freqSlider, wavelengthSlider, pipeSelect, speedSlider;
let pipeLengthDisplay, harmonicDisplay, freqDisplay, wavelengthDisplay, speedDisplay;
let halfWaveCheckbox, fullWaveCheckbox, markersButton, pauseButton;

// Canvas dimensions
let canvasWidth = 800, canvasHeight = 400;

// Animation control
let paused = false;
let timeOffset = 0;
let lastPauseTime = 0;

// For avoiding circular updates between frequency and wavelength sliders.
let isSyncing = false;

// For toggling length markers.
let showMarkers = false;

function setup() {
  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent("canvasContainer");

  // Select controls
  pipeLengthSlider = select('#pipeLengthSlider');
  harmonicSlider = select('#harmonicSlider');
  freqSlider = select('#freqSlider');
  wavelengthSlider = select('#wavelengthSlider');
  pipeSelect = select('#pipeSelect');
  speedSlider = select('#speedSlider');
  halfWaveCheckbox = select('#halfWaveCheckbox');
  fullWaveCheckbox = select('#fullWaveCheckbox');
  markersButton = select('#markersButton');
  pauseButton = select('#pauseButton');

  // Select display spans
  pipeLengthDisplay = select('#pipeLengthDisplay');
  harmonicDisplay = select('#harmonicDisplay');
  freqDisplay = select('#freqDisplay');
  wavelengthDisplay = select('#wavelengthDisplay');
  speedDisplay = select('#speedDisplay');

  // Set initial standing wave parameters.
  updateStandingWaveParameters();

  // Update valid parameters when controls change.
  pipeLengthSlider.input(() => { updateStandingWaveParameters(); });
  harmonicSlider.input(() => { updateStandingWaveParameters(); });
  pipeSelect.changed(() => { updateStandingWaveParameters(); });

  // Link frequency and wavelength sliders (keeping v = f * λ constant).
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

  // Update slow motion display.
  speedSlider.input(() => {
    updateDisplay();
  });

  // Toggle length markers when button is pressed.
  markersButton.mousePressed(() => {
    showMarkers = !showMarkers;
    markersButton.html(showMarkers ? "Hide Length Markers" : "Show Length Markers");
  });

  // Set up pause/resume functionality.
  pauseButton.mousePressed(togglePause);
}

function togglePause() {
  if (paused) {
    paused = false;
    let resumeTime = millis() / 1000;
    timeOffset += resumeTime - lastPauseTime;
    pauseButton.html("Pause");
  } else {
    paused = true;
    lastPauseTime = millis() / 1000;
    pauseButton.html("Resume");
  }
}

function updateStandingWaveParameters() {
  if (isSyncing) return;
  isSyncing = true;
  
  let L = Number(pipeLengthSlider.value()); // Pipe length in meters
  let sliderHarmonic = Number(harmonicSlider.value());
  let pipeType = pipeSelect.value();
  
  // Compute effective harmonic: for closed-open, only odd modes (2n-1) are valid.
  let harmonicEffective = (pipeType === 'closed-open') ? (2 * sliderHarmonic - 1) : sliderHarmonic;
  
  // Calculate valid frequency and wavelength based on pipe type and effective harmonic.
  let f_valid, lambda_valid;
  if (pipeType === 'open-open' || pipeType === 'closed-closed') {
    f_valid = harmonicEffective * v / (2 * L);
    lambda_valid = 2 * L / harmonicEffective;
  } else if (pipeType === 'closed-open') {
    f_valid = harmonicEffective * v / (4 * L);
    lambda_valid = 4 * L / harmonicEffective;
  }
  
  // Set frequency and wavelength sliders to the valid values.
  freqSlider.value(f_valid);
  wavelengthSlider.value(lambda_valid);
  
  updateDisplay();
  isSyncing = false;
}

function updateDisplay() {
  pipeLengthDisplay.html(Number(pipeLengthSlider.value()).toFixed(1));
  // For closed-open pipes, display the effective (odd) harmonic.
  let sliderHarmonic = Number(harmonicSlider.value());
  let pipeType = pipeSelect.value();
  if (pipeType === 'closed-open') {
    harmonicDisplay.html(2 * sliderHarmonic - 1);
  } else {
    harmonicDisplay.html(sliderHarmonic);
  }
  freqDisplay.html(Number(freqSlider.value()).toFixed(1));
  wavelengthDisplay.html(Number(wavelengthSlider.value()).toFixed(2));
  speedDisplay.html(Number(speedSlider.value()).toFixed(1));
}

function draw() {
  background(255);
  
  let L = Number(pipeLengthSlider.value()); // Pipe length in meters
  let sliderHarmonic = Number(harmonicSlider.value());
  let pipeType = pipeSelect.value();
  
  // Compute effective harmonic.
  let harmonicEffective = (pipeType === 'closed-open') ? (2 * sliderHarmonic - 1) : sliderHarmonic;
  
  // Recalculate valid standing wave parameters.
  let f_valid, lambda_valid;
  if (pipeType === 'open-open' || pipeType === 'closed-closed') {
    f_valid = harmonicEffective * v / (2 * L);
    lambda_valid = 2 * L / harmonicEffective;
  } else if (pipeType === 'closed-open') {
    f_valid = harmonicEffective * v / (4 * L);
    lambda_valid = 4 * L / harmonicEffective;
  }
  
  let f_input = Number(freqSlider.value());
  let lambda_input = v / f_input;
  let validStandingWave = (abs(f_input - f_valid) / f_valid) < tolerance;
  
  // Convert pipe length to pixels.
  let L_pixels = L * scaleFactor;
  
  // Determine which sides are closed.
  let leftClosed = (pipeType === "closed-closed" || pipeType === "closed-open");
  let rightClosed = (pipeType === "closed-closed");
  
  // Center the pipe horizontally.
  let pipeBodyX = (canvasWidth - L_pixels) / 2;
  // Vertical position of the pipe.
  let pipeY = (canvasHeight - pipeHeight) / 2;
  
  // Draw the pipe as a rectangle with top and bottom boundaries always drawn.
  stroke(0);
  strokeWeight(2);
  // Top and bottom lines.
  line(pipeBodyX, pipeY, pipeBodyX + L_pixels, pipeY);
  line(pipeBodyX, pipeY + pipeHeight, pipeBodyX + L_pixels, pipeY + pipeHeight);
  // Left vertical line if closed.
  if (leftClosed) {
    line(pipeBodyX, pipeY, pipeBodyX, pipeY + pipeHeight);
  }
  // Right vertical line if closed.
  if (rightClosed) {
    line(pipeBodyX + L_pixels, pipeY, pipeBodyX + L_pixels, pipeY + pipeHeight);
  }
  
  // Draw the valid standing wave parameters above the pipe.
  noStroke();
  fill(0);
  textSize(14);
  text("Valid frequency: " + f_valid.toFixed(1) + " Hz", 10, 20);
  text("Valid wavelength: " + lambda_valid.toFixed(2) + " m", 10, 40);
  
  // Get the effective animation time with slow-motion factor.
  let slowMotion = Number(speedSlider.value());
  let t_eff = (paused ? lastPauseTime : (millis()/1000 - timeOffset)) * slowMotion;
  
  // Draw the standing wave inside the pipe if valid.
  if (validStandingWave) {
    stroke(0, 0, 255);
    strokeWeight(2);
    noFill();
    beginShape();
    let amplitude = pipeHeight / 3;
    for (let x = 0; x <= L_pixels; x++) {
      let spatialVal = 0;
      if (pipeType === 'open-open') {
        spatialVal = cos((harmonicEffective * PI * x) / L_pixels);
      } else if (pipeType === 'closed-closed') {
        spatialVal = sin((harmonicEffective * PI * x) / L_pixels);
      } else if (pipeType === 'closed-open') {
        // Use the slider value to compute the effective odd harmonic for drawing.
        spatialVal = sin(((2 * sliderHarmonic - 1) * PI * x) / (2 * L_pixels));
      }
      let y = amplitude * spatialVal * cos(TWO_PI * f_input * t_eff);
      vertex(pipeBodyX + x, pipeY + pipeHeight/2 + y);
    }
    endShape();
    
    // Mark node positions (using spatial function at t=0).
    fill('red');
    noStroke();
    let nodePositions = [];
    if (pipeType === 'open-open') {
      for (let k = 0; k < harmonicEffective; k++) {
        let xPos = pipeBodyX + L_pixels * (2 * k + 1) / (2 * harmonicEffective);
        nodePositions.push(xPos);
      }
    } else if (pipeType === 'closed-closed') {
      for (let k = 0; k <= harmonicEffective; k++) {
        let xPos = pipeBodyX + L_pixels * k / harmonicEffective;
        nodePositions.push(xPos);
      }
    } else if (pipeType === 'closed-open') {
      for (let k = 0; k <= sliderHarmonic; k++) {
        let xPos = pipeBodyX + (2 * L_pixels * k) / (2 * sliderHarmonic - 1);
        if (xPos <= pipeBodyX + L_pixels) nodePositions.push(xPos);
      }
    }
    nodePositions.forEach(xPos => {
      ellipse(xPos, pipeY + pipeHeight/2, 8, 8);
    });
    
    // Highlight a segment of the wave corresponding to one wavelength or half-wavelength,
    // starting from the left edge of the pipe.
    if (halfWaveCheckbox.checked()) {
      let segLength = (lambda_input / 2) * scaleFactor;
      let startX_seg = pipeBodyX;  // from left side
      stroke('red');
      strokeWeight(4);
      noFill();
      beginShape();
      for (let x = 0; x <= segLength; x++) {
        let relativeX = x; // relative to left edge
        let spatialVal = 0;
        if (pipeType === 'open-open') {
          spatialVal = cos((harmonicEffective * PI * relativeX) / L_pixels);
        } else if (pipeType === 'closed-closed') {
          spatialVal = sin((harmonicEffective * PI * relativeX) / L_pixels);
        } else if (pipeType === 'closed-open') {
          spatialVal = sin(((2 * sliderHarmonic - 1) * PI * relativeX) / (2 * L_pixels));
        }
        let y_val = amplitude * spatialVal * cos(TWO_PI * f_input * t_eff);
        vertex(startX_seg + x, pipeY + pipeHeight/2 + y_val);
      }
      endShape();
    }
    if (fullWaveCheckbox.checked()) {
      let segLength = (lambda_input) * scaleFactor;
      let startX_seg = pipeBodyX;  // from left side
      stroke('green');
      strokeWeight(4);
      noFill();
      beginShape();
      for (let x = 0; x <= segLength; x++) {
        let relativeX = x;
        let spatialVal = 0;
        if (pipeType === 'open-open') {
          spatialVal = cos((harmonicEffective * PI * relativeX) / L_pixels);
        } else if (pipeType === 'closed-closed') {
          spatialVal = sin((harmonicEffective * PI * relativeX) / L_pixels);
        } else if (pipeType === 'closed-open') {
          spatialVal = sin(((2 * sliderHarmonic - 1) * PI * relativeX) / (2 * L_pixels));
        }
        let y_val = amplitude * spatialVal * cos(TWO_PI * f_input * t_eff);
        vertex(startX_seg + x, pipeY + pipeHeight/2 + y_val);
      }
      endShape();
    }
    
  } else {
    fill(255, 0, 0);
    noStroke();
    textSize(16);
    text("Not a valid standing wave for current conditions.", pipeBodyX, pipeY + pipeHeight + 40);
  }
  
  // Draw dotted vertical markers at L/4, L/2, and 3L/4, with labels.
  if (showMarkers) {
    let markerX1 = pipeBodyX + L_pixels / 4;
    let markerX2 = pipeBodyX + L_pixels / 2;
    let markerX3 = pipeBodyX + 3 * L_pixels / 4;
    stroke(0);
    strokeWeight(1);
    drawingContext.setLineDash([5, 5]);
    line(markerX1, pipeY, markerX1, pipeY + pipeHeight);
    line(markerX2, pipeY, markerX2, pipeY + pipeHeight);
    line(markerX3, pipeY, markerX3, pipeY + pipeHeight);
    drawingContext.setLineDash([]);
    textAlign(CENTER, BOTTOM);
    text("L/4", markerX1, pipeY - 5);
    text("L/2", markerX2, pipeY - 5);
    text("L/4", markerX3, pipeY - 5);
  }
}
