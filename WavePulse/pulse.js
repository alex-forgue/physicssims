const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

const sendPulseBtn = document.getElementById('sendPulseBtn');
const sendInvertedPulseBtn = document.getElementById('sendInvertedPulseBtn');
const pauseBtn = document.getElementById('pauseBtn');

const amplitudeSlider = document.getElementById('amplitudeSlider');
const amplitudeValue = document.getElementById('amplitudeValue');
const densityASlider = document.getElementById('densityASlider');
const densityAValue = document.getElementById('densityAValue');
const densityBSlider = document.getElementById('densityBSlider');
const densityBValue = document.getElementById('densityBValue');
const fixedEndCheckbox = document.getElementById('fixedEndCheckbox');

const timeControlDiv = document.getElementById('timeControl');
const timeSlider = document.getElementById('timeSlider');
const timeValue = document.getElementById('timeValue');

const initialAmplitudeCell = document.getElementById('initialAmplitudeCell');
const reflectedAmplitudeCell = document.getElementById('reflectedAmplitudeCell');
const transmittedAmplitudeCell = document.getElementById('transmittedAmplitudeCell');

let pulses = []; 
// Each pulse: { x0, startTime, amplitude, width, direction, medium, label, eventTriggered }

let simulationTime = 0;
let dt = 1;  // Time step per frame
let isPaused = false;

// Canvas and rope settings
const v = 2;  // Pulse speed (pixels per time unit)
const baseline = canvas.height / 2;
const interfaceX = canvas.width / 2;

// Update control panel displays
amplitudeSlider.addEventListener('input', () => {
  amplitudeValue.textContent = amplitudeSlider.value;
});
densityASlider.addEventListener('input', () => {
  densityAValue.textContent = parseFloat(densityASlider.value).toFixed(1);
});
densityBSlider.addEventListener('input', () => {
  densityBValue.textContent = parseFloat(densityBSlider.value).toFixed(1);
});

// When the time slider is moved (while paused), update simulationTime.
timeSlider.addEventListener('input', () => {
  simulationTime = parseFloat(timeSlider.value);
  timeValue.textContent = simulationTime;
  updateInterfaceEvent();
});

// Pause/Resume toggle.
pauseBtn.addEventListener('click', () => {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "Resume" : "Pause";
  // Show the time slider only when paused.
  timeControlDiv.style.display = isPaused ? "block" : "none";
  if (!isPaused) {
    timeSlider.value = simulationTime;
    timeValue.textContent = simulationTime;
  }
});

// Pulse constructor.
function createPulse(x0, startTime, amplitude, width, direction, medium, label = "") {
  return {
    x0,
    startTime,
    amplitude,
    width,
    direction,
    medium,
    label,
    eventTriggered: false
  };
}

// Compute the final simulation time based on the pulse travel distances.
// Reflected pulse: from interfaceX to x=0; Transmitted pulse: from interfaceX to canvas.width.
function computeFinalTime() {
  const t_interface = (interfaceX - 50) / v;
  const T_reflected_end = t_interface + (interfaceX - 0) / v;
  const T_transmitted_end = t_interface + (canvas.width - interfaceX) / v;
  return Math.max(T_reflected_end, T_transmitted_end);
}

// Reset simulation state and send a new initial pulse.
function sendInitialPulse(sign = 1) {
  simulationTime = 0;
  timeSlider.value = 0;
  timeValue.textContent = 0;
  pulses = [];
  
  // Compute final simulation time and set slider max.
  const T_final = computeFinalTime();
  timeSlider.max = T_final;
  
  initialAmplitudeCell.textContent = (sign * amplitudeSlider.value).toFixed(2);
  reflectedAmplitudeCell.textContent = "-";
  transmittedAmplitudeCell.textContent = "-";
  
  // Create initial pulse in Medium A starting at x = 50.
  const amplitude = sign * parseFloat(amplitudeSlider.value);
  const initialPulse = createPulse(50, 0, amplitude, 40, 1, "A", "Initial");
  pulses.push(initialPulse);
}

sendPulseBtn.addEventListener('click', () => {
  sendInitialPulse(1);
});
sendInvertedPulseBtn.addEventListener('click', () => {
  sendInitialPulse(-1);
});

// Compute current x-position of a pulse based on simulationTime.
function getPulseX(pulse) {
  if (simulationTime < pulse.startTime) return pulse.x0;
  return pulse.x0 + pulse.direction * v * (simulationTime - pulse.startTime);
}

// Check and update the interface event for the initial pulse.
function updateInterfaceEvent() {
  const initialPulse = pulses.find(p => p.label === "Initial");
  if (!initialPulse) return;
  
  const t_interface = initialPulse.startTime + (interfaceX - initialPulse.x0) / v;
  const densityA = parseFloat(densityASlider.value);
  const densityB = parseFloat(densityBSlider.value);
  const fixedEnd = fixedEndCheckbox.checked;
  
  if (simulationTime >= t_interface && !initialPulse.eventTriggered) {
    let R = 0, T = 0;
    if (fixedEnd) {
      // For a fixed end, the reflected pulse has the same amplitude inverted.
      R = -initialPulse.amplitude;
      T = 0;
    } else {
      // Use the previous rules.
      let r = Math.abs(densityA - densityB) / (densityA + densityB);
      if (initialPulse.amplitude >= 0) {
        if (densityB > densityA) {
          R = -initialPulse.amplitude * r;
        } else {
          R = initialPulse.amplitude * r;
        }
        T = initialPulse.amplitude - Math.abs(R);
      } else {
        if (densityA > densityB) {
          R = initialPulse.amplitude * r;
        } else {
          R = -initialPulse.amplitude * r;
        }
        T = initialPulse.amplitude + Math.abs(R);
      }
    }
    
    // Create reflected pulse in Medium A (moving left).
    const reflectedPulse = createPulse(interfaceX, t_interface, R, initialPulse.width, -1, "A", "Reflected");
    pulses.push(reflectedPulse);
    // Create transmitted pulse only if not a fixed end.
    if (!fixedEnd && T !== 0) {
      const transmittedPulse = createPulse(interfaceX, t_interface, T, initialPulse.width, 1, "B", "Transmitted");
      pulses.push(transmittedPulse);
    }
    initialPulse.eventTriggered = true;
    reflectedAmplitudeCell.textContent = R.toFixed(2);
    transmittedAmplitudeCell.textContent = T.toFixed(2);
  }
  
  // If scrubbing back before the interface event, remove the event pulses.
  if (simulationTime < t_interface && initialPulse.eventTriggered) {
    pulses = pulses.filter(p => p.label === "Initial");
    initialPulse.eventTriggered = false;
    reflectedAmplitudeCell.textContent = "-";
    transmittedAmplitudeCell.textContent = "-";
  }
}

// Update simulation state.
function updateSimulation() {
  updateInterfaceEvent();
}

// Draw the baseline ropes.
function drawRopeBaseline() {
  const densityA = parseFloat(densityASlider.value);
  ctx.beginPath();
  ctx.strokeStyle = "red";
  ctx.lineWidth = densityA * 2;
  ctx.moveTo(0, baseline);
  ctx.lineTo(interfaceX, baseline);
  ctx.stroke();
  
  const densityB = parseFloat(densityBSlider.value);
  if (fixedEndCheckbox.checked) {
    // Draw only the fixed wall.
    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;
    ctx.moveTo(interfaceX, baseline - 50);
    ctx.lineTo(interfaceX, baseline + 50);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.strokeStyle = "blue";
    ctx.lineWidth = densityB * 2;
    ctx.moveTo(interfaceX, baseline);
    ctx.lineTo(canvas.width, baseline);
    ctx.stroke();
  }
}

// Draw the rope's waveform.
function drawRopeWave() {
  const points = [];
  const dx = 2;
  for (let x = 0; x <= canvas.width; x += dx) {
    let yOffset = 0;
    for (let pulse of pulses) {
      if (simulationTime >= pulse.startTime) {
        const pulseX = getPulseX(pulse);
        if ((x < interfaceX && pulse.medium === "A") || (x >= interfaceX && pulse.medium === "B")) {
          let distance = x - pulseX;
          yOffset += pulse.amplitude * Math.exp(- (distance * distance) / (2 * pulse.width * pulse.width));
        }
      }
    }
    points.push({ x: x, y: baseline + yOffset });
  }
  
  ctx.beginPath();
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.moveTo(points[0].x, points[0].y);
  for (let pt of points) {
    ctx.lineTo(pt.x, pt.y);
  }
  ctx.stroke();
}

// Draw labels near each pulse's peak.
function drawPulseLabels() {
  ctx.font = "12px Arial";
  ctx.fillStyle = "black";
  pulses.forEach(pulse => {
    if (pulse.label !== "" && simulationTime >= pulse.startTime) {
      const pulseX = getPulseX(pulse);
      const peakY = baseline + pulse.amplitude;
      const offsetY = pulse.amplitude >= 0 ? -10 : 20;
      ctx.fillText(pulse.label, pulseX, peakY + offsetY);
    }
  });
}

// Main animation loop.
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawRopeBaseline();
  updateSimulation();
  drawRopeWave();
  drawPulseLabels();
  
  if (!isPaused) {
    simulationTime += dt;
    timeSlider.value = simulationTime;
    timeValue.textContent = simulationTime;
  }
  
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
