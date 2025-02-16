// Get DOM elements
const massAInput = document.getElementById('massA');
const massBInput = document.getElementById('massB');
const gravityInput = document.getElementById('gravity');
const showVectorsCheckbox = document.getElementById('showVectors');
const startButton = document.getElementById('startSim');
const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

// Update displayed slider values
massAInput.addEventListener('input', () => {
  document.getElementById('massAValue').textContent = massAInput.value;
});
massBInput.addEventListener('input', () => {
  document.getElementById('massBValue').textContent = massBInput.value;
});
gravityInput.addEventListener('input', () => {
  document.getElementById('gravityValue').textContent = gravityInput.value;
});

// Global physics variables
let mA, mB, g, a, T;
const animationTime = 5000; // Max animation duration in ms (if not stopped earlier)
let startTime;

// Canvas geometry
const posA0 = 200; // Initial top coordinate for Mass A
const posB0 = 200; // Initial top coordinate for Mass B
const massWidth = 40, massHeight = 40;
// Pulley parameters
const pulleyX = canvas.width / 2;
const pulleyY = 50;
const pulleyRadius = 20;

// Arrow scaling factors: adjust these to suit your display.
const weightScale = 0.5;   // Multiplies (m*g) to get arrow length (in pixels)
const tensionScale = 0.5;  // Multiplies tension (T) to get arrow length (in pixels)

// Convention: Up is positive and down is negative.
// a is the upward acceleration for Mass A (so Mass B’s acceleration is -a).

// Draw the simulation for the current positions
function drawSimulation(posA, posB) {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Set stroke style for pulley and rope to black.
  ctx.strokeStyle = "black";
  
  // Draw the pulley
  ctx.beginPath();
  ctx.arc(pulleyX, pulleyY, pulleyRadius, 0, Math.PI * 2);
  ctx.stroke();
  
  // Calculate center x positions for masses
  const posAX = pulleyX - 100; // x-coordinate for Mass A rectangle
  const posAXCenter = posAX + massWidth / 2;
  const posBX = pulleyX + 60;  // x-coordinate for Mass B rectangle
  const posBXCenter = posBX + massWidth / 2;
  
  // Draw Mass A (red) and label it with a bold "A"
  ctx.fillStyle = '#ff9999';
  ctx.fillRect(posAX, posA, massWidth, massHeight);
  ctx.font = "bold 16px Arial";
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("A", posAXCenter, posA + massHeight / 2);
  
  // Draw Mass B (green) and label it with a bold "B"
  ctx.fillStyle = '#99ff99';
  ctx.fillRect(posBX, posB, massWidth, massHeight);
  ctx.fillStyle = "black";
  ctx.fillText("B", posBXCenter, posB + massHeight / 2);
  
  // Draw the rope connecting the masses through the pulley (in black)
  ctx.beginPath();
  // From top center of Mass A to the pulley
  ctx.moveTo(posAXCenter, posA);
  ctx.lineTo(pulleyX, pulleyY);
  // From the pulley to top center of Mass B
  ctx.lineTo(posBXCenter, posB);
  ctx.stroke();
  
  // If force vectors are enabled, draw them with labels.
  if (showVectorsCheckbox.checked) {
    // Compute the magnitudes for weight on each mass.
    const weightA = mA * g;
    const weightB = mB * g;
    
    // Calculate arrow lengths based on forces
    const tensionArrowLength = T * tensionScale;
    const weightArrowLengthA = weightA * weightScale;
    const weightArrowLengthB = weightB * weightScale;
    
    // Set font for vector labels
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // For Mass A:
    // Tension arrow from top center going upward.
    drawArrow(posAXCenter, posA, 0, -tensionArrowLength, 'red');
    // Label "T" near the midpoint of the tension arrow.
    ctx.fillStyle = 'red';
    ctx.fillText("T", posAXCenter - 15, posA - tensionArrowLength / 2);
    
    // Weight arrow from bottom center going downward.
    drawArrow(posAXCenter, posA + massHeight, 0, weightArrowLengthA, 'green');
    // Label "W" near the midpoint of the weight arrow.
    ctx.fillStyle = 'green';
    ctx.fillText("W", posAXCenter + 15, posA + massHeight + weightArrowLengthA / 2);
    
    // For Mass B:
    // Tension arrow from top center going upward.
    drawArrow(posBXCenter, posB, 0, -tensionArrowLength, 'red');
    ctx.fillStyle = 'red';
    ctx.fillText("T", posBXCenter - 15, posB - tensionArrowLength / 2);
    
    // Weight arrow from bottom center going downward.
    drawArrow(posBXCenter, posB + massHeight, 0, weightArrowLengthB, 'green');
    ctx.fillStyle = 'green';
    ctx.fillText("W", posBXCenter + 15, posB + massHeight + weightArrowLengthB / 2);
  }
}

// Helper function to draw an arrow from (fromx, fromy) with displacement (dx, dy)
function drawArrow(fromx, fromy, dx, dy, color) {
  const headlen = 10; // Arrow head length
  const angle = Math.atan2(dy, dx);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(fromx, fromy);
  ctx.lineTo(fromx + dx, fromy + dy);
  ctx.stroke();
  // Draw arrow head
  ctx.beginPath();
  ctx.moveTo(fromx + dx, fromy + dy);
  ctx.lineTo(fromx + dx - headlen * Math.cos(angle - Math.PI / 6), 
             fromy + dy - headlen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(fromx + dx - headlen * Math.cos(angle + Math.PI / 6), 
             fromy + dy - headlen * Math.sin(angle + Math.PI / 6));
  ctx.lineTo(fromx + dx, fromy + dy);
  ctx.fill();
}

// Update the data table with calculated values
function updateDataTable() {
  // With up as positive, Mass A’s acceleration is a and Mass B’s is -a.
  const accelerationA = a;
  const accelerationB = -a;
  const netForceA = mA * accelerationA;
  const netForceB = mB * accelerationB;
  document.getElementById('accelerationAData').textContent = accelerationA.toFixed(2);
  document.getElementById('accelerationBData').textContent = accelerationB.toFixed(2);
  document.getElementById('netForceAData').textContent = netForceA.toFixed(2);
  document.getElementById('netForceBData').textContent = netForceB.toFixed(2);
  document.getElementById('tensionData').textContent = T.toFixed(2);
  document.getElementById('weightAData').textContent = (mA * g).toFixed(2);
  document.getElementById('weightBData').textContent = (mB * g).toFixed(2);
}

// Animation loop. The simulation stops when the lighter (upward-moving) mass reaches the bottom of the pulley.
function animate(timestamp) {
  if (!startTime) startTime = timestamp;
  const elapsed = timestamp - startTime;
  const t = elapsed / 1000; // Time in seconds
  
  // Displacement from kinematics: s = 0.5 * a * t^2.
  const displacement = 0.5 * a * Math.pow(t, 2);
  
  // Convert displacement to canvas coordinates.
  // Since canvas y increases downward, for Mass A (accelerating upward) we subtract displacement.
  const posA = posA0 - displacement;
  const posB = posB0 + displacement;
  
  drawSimulation(posA, posB);
  
  // Stop animation when the lighter mass (the one moving upward) reaches the pulley.
  let lighterMassReached = false;
  if (a > 0) {
    // Mass A moving upward.
    if (posA <= (pulleyY + pulleyRadius)) {
      lighterMassReached = true;
    }
  } else {
    // a < 0: Mass B moving upward.
    if (posB <= (pulleyY + pulleyRadius)) {
      lighterMassReached = true;
    }
  }
  
  if (!lighterMassReached && elapsed < animationTime) {
    requestAnimationFrame(animate);
  }
}

// When "Start Simulation" is clicked, calculate values, update the data table, and start the animation.
startButton.addEventListener('click', () => {
  startTime = null;  // Reset timer
  mA = parseFloat(massAInput.value);
  mB = parseFloat(massBInput.value);
  g = parseFloat(gravityInput.value);
  
  // Using our sign convention (up is positive):
  // a = (mB - mA) * g / (mA + mB) gives the upward acceleration of Mass A.
  a = (mB - mA) * g / (mA + mB);
  // Tension calculated from the Atwood machine equations:
  T = (2 * mA * mB * g) / (mA + mB);
  
  updateDataTable();
  requestAnimationFrame(animate);
});
