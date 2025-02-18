// Global control variables
let ampA_slider, ampB_slider, playButton, pauseButton, phase_slider, showIndividualToggle;
let ampA_valSpan, ampB_valSpan;
let playing = false;
let phase = 0;       // Phase parameter goes from 0 to 1.
const speed = 0.005; // Animation speed.

// Drawing area settings.
let leftMargin = 50;
let rightMargin = 50;
let topMargin = 20;
let bottomMargin = 20;
let scaleFactor = 20;  // 1 simulation unit equals 20 pixels.
let yMin = -10;
let yMax = 10;
let graphWidth;

// Pulse settings.
let pulseWidth = 100; // Width (in pixels) of each pulse.

function setup() {
  // Create a larger canvas for the simulation.
  createCanvas(1000, 600);
  
  // Get the control panel div.
  let panel = select("#controlPanel");
  
  // --- Wave A Amplitude Slider (red) with value display ---
  let labelA = createSpan("Amplitude of Wave A:");
  labelA.style("color", "red");
  labelA.parent(panel);
  
  ampA_slider = createSlider(-5, 5, 2.5, 0.5);
  ampA_slider.parent(panel);
  ampA_slider.style('width', '150px');
  // Display the current value
  ampA_valSpan = createSpan(ampA_slider.value());
  ampA_valSpan.parent(panel);
  ampA_valSpan.style("margin-left", "5px");
  
  // --- Wave B Amplitude Slider (blue) with value display ---
  let labelB = createSpan("Amplitude of Wave B:");
  labelB.style("color", "blue");
  labelB.parent(panel);
  
  ampB_slider = createSlider(-5, 5, 2.5, 0.5);
  ampB_slider.parent(panel);
  ampB_slider.style('width', '150px');
  // Display the current value
  ampB_valSpan = createSpan(ampB_slider.value());
  ampB_valSpan.parent(panel);
  ampB_valSpan.style("margin-left", "5px");
  
  // --- Play and Pause buttons ---
  playButton = createButton("Play");
  playButton.parent(panel);
  playButton.mousePressed(() => {
    playing = true;
    phase_slider.style('visibility', 'hidden');
  });
  
  pauseButton = createButton("Pause");
  pauseButton.parent(panel);
  pauseButton.mousePressed(() => {
    playing = false;
    phase_slider.style('visibility', 'visible');
  });
  
  // --- Checkbox to toggle individual pulses (dotted lines) ---
  showIndividualToggle = createCheckbox("Show individual waves", false);
  showIndividualToggle.parent(panel);
  
  // --- Create time slider in its own container below the canvas ---
  let timePanel = select("#timePanel");
  phase_slider = createSlider(0, 1, 0, 0.01);
  phase_slider.parent(timePanel);
  phase_slider.style('width', '300px');
  phase_slider.style('visibility', 'hidden');
  
  // Define the drawing area width (full canvas width minus left/right margins).
  graphWidth = width - leftMargin - rightMargin;
}

function draw() {
  background(255);
  
  // Update the amplitude display spans
  ampA_valSpan.html(ampA_slider.value());
  ampB_valSpan.html(ampB_slider.value());
  
  // Set up the simulation coordinate system:
  // Translate by leftMargin, and center vertically (with y = 0 in the middle).
  push();
  translate(leftMargin, topMargin + (height - topMargin - bottomMargin) / 2);
  
  // Draw grid (axes, ticks, major/minor grid lines).
  drawGraph();
  
  // Update phase: if playing, advance automatically; if paused, use slider value.
  if (playing) {
    phase += speed;
    if (phase > 1) phase = 0;
    phase_slider.value(phase);
  } else {
    phase = phase_slider.value();
  }
  
  // Retrieve amplitude values.
  let ampA = ampA_slider.value();
  let ampB = ampB_slider.value();
  
  // Compute the horizontal positions for the pulses.
  // Wave A travels from the left edge to the center and back.
  // Wave B travels from the right edge to the center and back.
  let xA, xB;
  if (phase < 0.5) {
    xA = lerp(0, graphWidth / 2, phase * 2);
    xB = lerp(graphWidth, graphWidth / 2, phase * 2);
  } else {
    xA = lerp(graphWidth / 2, 0, (phase - 0.5) * 2);
    xB = lerp(graphWidth / 2, graphWidth, (phase - 0.5) * 2);
  }
  
  // Draw the resultant pulse as a solid, thick black line.
  stroke(0);
  strokeWeight(4);
  noFill();
  beginShape();
  for (let x = 0; x <= graphWidth; x++) {
    // Use the half-sine pulse for each wave.
    let yA_val = pulse(x, xA, pulseWidth, ampA);
    let yB_val = pulse(x, xB, pulseWidth, ampB);
    let y = yA_val + yB_val;
    vertex(x, -y * scaleFactor);
  }
  endShape();
  
  // Optionally, draw the individual pulses as dotted lines.
  if (showIndividualToggle.checked()) {
    drawingContext.setLineDash([5, 5]);
    
    // Wave A (red).
    stroke('red');
    strokeWeight(3);
    beginShape();
    for (let x = 0; x <= graphWidth; x++) {
      let yA_val = pulse(x, xA, pulseWidth, ampA);
      vertex(x, -yA_val * scaleFactor);
    }
    endShape();
    
    // Wave B (blue).
    stroke('blue');
    strokeWeight(3);
    beginShape();
    for (let x = 0; x <= graphWidth; x++) {
      let yB_val = pulse(x, xB, pulseWidth, ampB);
      vertex(x, -yB_val * scaleFactor);
    }
    endShape();
    
    drawingContext.setLineDash([]);
  }
  
  pop();
}

// pulse(x, center, width, amplitude)
// Returns the displacement of a half-sine pulse defined only over [center - width/2, center + width/2].
// Outside this interval, the function returns 0.
function pulse(x, center, width, amplitude) {
  let start = center - width / 2;
  let end = center + width / 2;
  if (x >= start && x <= end) {
    // Map x from [start, end] to [0, PI] so that the pulse goes from 0 to amplitude and back to 0.
    return amplitude * sin(PI * (x - start) / width);
  } else {
    return 0;
  }
}

// drawGraph() draws the grid, axes, and tick marks in the simulation area.
function drawGraph() {
  // --- Vertical grid lines ---
  for (let x = 0; x <= graphWidth; x += 50) {
    if (x % 100 === 0) {
      stroke(200);  // Major vertical grid line.
      strokeWeight(1.5);
    } else {
      stroke(230);  // Minor vertical grid line.
      strokeWeight(1);
    }
    line(x, - (10 * scaleFactor), x, (10 * scaleFactor));
  }
  
  // --- Horizontal grid lines ---
  for (let y = yMin; y <= yMax; y++) {
    let yPos = -y * scaleFactor; // Invert so that positive simulation y is upward.
    if (y % 2 === 0) {
      stroke(200);  // Major horizontal grid line.
      strokeWeight(1.5);
    } else {
      stroke(230);  // Minor horizontal grid line.
      strokeWeight(1);
    }
    line(0, yPos, graphWidth, yPos);
  }
  
  // --- Draw axes ---
  stroke(0);
  strokeWeight(2);
  // x-axis (y = 0).
  line(0, 0, graphWidth, 0);
  // y-axis (x = 0).
  line(0, - (10 * scaleFactor), 0, (10 * scaleFactor));
  
  // --- Draw y-axis tick marks with labels at even numbers ---
  textAlign(RIGHT, CENTER);
  textSize(12);
  fill(0);
  noStroke();
  for (let y = yMin; y <= yMax; y++) {
    let yPos = -y * scaleFactor;
    if (y % 2 === 0) {
      // Major tick.
      stroke(0);
      strokeWeight(2);
      line(-5, yPos, 0, yPos);
      noStroke();
      text(y, -8, yPos);
    } else {
      // Minor tick.
      stroke(0);
      strokeWeight(1);
      line(-3, yPos, 0, yPos);
    }
  }
  
  // --- Draw x-axis tick marks every 50 pixels ---
  textAlign(CENTER, TOP);
  for (let x = 0; x <= graphWidth; x += 50) {
    stroke(0);
    strokeWeight(1);
    line(x, 0, x, 5);
    noStroke();
    text(x, x, 8);
  }
}
