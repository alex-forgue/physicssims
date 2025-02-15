
const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

// controls for UCM parameters
const radiusInput = document.getElementById('radius');
const speedInput = document.getElementById('speed'); // velocity
const massInput = document.getElementById('mass');
const forceInput = document.getElementById('force');
const frictionToggle = document.getElementById('frictionToggle');
const frictionInput = document.getElementById('friction');
const vectorToggle = document.getElementById('vectorToggle');
const accelerationToggle = document.getElementById('accelerationToggle');
const pauseToggle = document.getElementById('pauseToggle');
const experimentToggle = document.getElementById('experimentToggle'); // New toggle for design

// data table elements
const dataSpeed = document.getElementById('dataSpeed');
const dataAcceleration = document.getElementById('dataAcceleration');
const dataForce = document.getElementById('dataForce');
const dataMass = document.getElementById('dataMass');
const dataFriction = document.getElementById('dataFriction');
const dataFrictionForce = document.getElementById('dataFrictionForce');
const dataAngularVelocity = document.getElementById('dataAngularVelocity');
const dataPeriod = document.getElementById('dataPeriod');

// Get Experimental Design radio groups
const ivRadios = document.getElementsByName('ivGroup');
const dvRadios = document.getElementsByName('dvGroup');
const experimentDesignDiv = document.getElementById('experimentDesign');

// Global simulation variables
let radius = parseFloat(radiusInput.value);
let speed = parseFloat(speedInput.value);
let mass = parseFloat(massInput.value);
let force = parseFloat(forceInput.value);
let frictionCoefficient = parseFloat(frictionInput.value);
let angle = 0; // current angular position
let lastTime = null;
const g = 9.8; // gravitational acceleration (m/s²)
let computedCentripetalForce = 0;

// Helper: get selected radio value from a NodeList
function getSelectedValue(radioNodeList) {
  for (let radio of radioNodeList) {
    if (radio.checked) return radio.value;
  }
  return null;
}

// Helper: get the input field corresponding to a variable name
function getInputField(varName) {
  switch(varName) {
    case "mass": return massInput;
    case "velocity": return speedInput;
    case "radius": return radiusInput;
    case "force": return forceInput;
    case "friction": return frictionInput;
    default: return null;
  }
}

// Update experimental design controls:
// - Disable a radio option in one column if it’s selected in the other.
function updateExperimentalDesign() {
  const selectedIV = getSelectedValue(ivRadios);
  const selectedDV = getSelectedValue(dvRadios);
  
  // For IV radios: disable the option that equals the selected DV.
  ivRadios.forEach(radio => {
    radio.disabled = (radio.value === selectedDV);
  });
  // For DV radios: disable the option that equals the selected IV.
  dvRadios.forEach(radio => {
    radio.disabled = (radio.value === selectedIV);
  });
  
  // Disable the input field for the variable that is the DV; enable others.
  const variables = ["mass", "velocity", "radius", "force", "friction"];
  variables.forEach(varName => {
    const input = getInputField(varName);
    if (varName === selectedDV) {
      input.disabled = true;
    } else {
      input.disabled = false;
    }
  });
}

// Compute the dependent variable (DV) value using the appropriate relation.
// For force, mass, velocity, and radius we use F = m*v^2/r.
// For friction coefficient, we use μ = v^2/(r*g).
function computeDependentVariable() {
  const selectedDV = getSelectedValue(dvRadios);
  
  // Gather current values from the input fields that are NOT the DV.
  let values = {};
  if (selectedDV !== "mass") values.mass = parseFloat(massInput.value);
  if (selectedDV !== "velocity") values.velocity = parseFloat(speedInput.value);
  if (selectedDV !== "radius") values.radius = parseFloat(radiusInput.value);
  if (selectedDV !== "force") values.force = parseFloat(forceInput.value);
  if (selectedDV !== "friction") values.friction = parseFloat(frictionInput.value);
  
  let computed;
  switch (selectedDV) {
    case "force":
      computed = values.mass * Math.pow(values.velocity, 2) / values.radius;
      forceInput.value = computed.toFixed(2);
      values.force = computed;
      break;
    case "velocity":
      computed = Math.sqrt(values.force * values.radius / values.mass);
      speedInput.value = computed.toFixed(2);
      values.velocity = computed;
      break;
    case "mass":
      computed = values.force * values.radius / Math.pow(values.velocity, 2);
      massInput.value = computed.toFixed(2);
      values.mass = computed;
      break;
    case "radius":
      computed = values.mass * Math.pow(values.velocity, 2) / values.force;
      radiusInput.value = computed.toFixed(2);
      values.radius = computed;
      break;
    case "friction":
      computed = Math.pow(values.velocity, 2) / (values.radius * g);
      frictionInput.value = computed.toFixed(2);
      values.friction = computed;
      break;
  }
}

// Update all simulation parameters, experimental design, and data table values.
function updateParameters() {
  // Show/hide experimental design based on the experiment toggle.
  if (experimentToggle.checked) {
    experimentDesignDiv.style.display = "block";
    updateExperimentalDesign();
    computeDependentVariable();
  } else {
    experimentDesignDiv.style.display = "none";
    // Enable all inputs if experimental design is off.
    ["mass", "velocity", "radius", "force", "friction"].forEach(varName => {
      const input = getInputField(varName);
      input.disabled = false;
    });
  }
  
  // Update friction coefficient from its input.
  frictionCoefficient = parseFloat(frictionInput.value);
  
  // Re-read all values after any potential DV computation.
  mass = parseFloat(massInput.value);
  speed = parseFloat(speedInput.value);
  radius = parseFloat(radiusInput.value);
  force = parseFloat(forceInput.value);
  
  // Calculate centripetal acceleration: a = v² / r.
  const centripetalAcceleration = Math.pow(speed, 2) / radius;
  // Calculate centripetal force: F = m * v² / r.
  computedCentripetalForce = mass * centripetalAcceleration;
  // Angular velocity: ω = v / r.
  const angularVelocity = speed / radius;
  // Period: T = 2π / ω.
  const period = 2 * Math.PI / angularVelocity;
  
  // If friction is enabled, friction force available = μ * m * g.
  const frictionForce = frictionToggle.checked ? frictionCoefficient * mass * g : 0;
  
  // Update data tables.
  dataSpeed.textContent = speed.toFixed(2);
  dataAcceleration.textContent = centripetalAcceleration.toFixed(2);
  dataForce.textContent = computedCentripetalForce.toFixed(2);
  dataMass.textContent = mass.toFixed(2);
  dataFriction.textContent = frictionToggle.checked ? frictionCoefficient.toFixed(2) : 'N/A';
  dataFrictionForce.textContent = frictionToggle.checked ? frictionForce.toFixed(2) : 'N/A';
  dataAngularVelocity.textContent = angularVelocity.toFixed(2);
  dataPeriod.textContent = period.toFixed(2);
}

// Draw an arrow from (fromX, fromY) to (toX, toY) with a given color and line width.
function drawArrow(ctx, fromX, fromY, toX, toY, color, lineWidth) {
  const headLength = 10; // Length of the arrow head in pixels.
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);
  // Draw the main line.
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  // Draw the arrow head.
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
  ctx.lineTo(toX, toY);
  ctx.fillStyle = color;
  ctx.fill();
}

// Listen for changes to all input controls.
[radiusInput, speedInput, massInput, forceInput, frictionInput].forEach(input =>
  input.addEventListener('input', updateParameters)
);
frictionToggle.addEventListener('change', updateParameters);
experimentToggle.addEventListener('change', updateParameters);

// Listen for changes in the experimental design radio buttons.
ivRadios.forEach(radio => radio.addEventListener('change', updateParameters));
dvRadios.forEach(radio => radio.addEventListener('change', updateParameters));

// Animation loop: update the diagram and draw the vectors and computed force.
function animate(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const deltaTime = (timestamp - lastTime) / 1000; // in seconds
  lastTime = timestamp;
  
  // Update parameters (which also computes the DV if design is enabled) before drawing.
  updateParameters();
  
  // Clear canvas.
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw the circular path.
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // For uniform circular motion, the speed remains constant.
  if (!pauseToggle.checked) {
    angle += (speed / radius) * deltaTime;
  }
  
  // Compute the particle's position.
  const particleX = centerX + radius * Math.cos(angle);
  const particleY = centerY + radius * Math.sin(angle);
  
  // Draw the particle.
  ctx.beginPath();
  ctx.arc(particleX, particleY, 8, 0, 2 * Math.PI);
  ctx.fillStyle = 'blue';
  ctx.fill();
  
  // Set scaling factors so the arrows are larger.
  const velocityVectorScale = 2.0;
  const accelerationVectorScale = 0.5;
  
  // Draw the velocity vector (tangent to the circle) with an arrow.
  if (vectorToggle.checked) {
    const vX = Math.cos(angle) * speed;
    const vY = Math.sin(angle) * speed;
    drawArrow(ctx, particleX, particleY, particleX + vX * velocityVectorScale, particleY + vY * velocityVectorScale, 'green', 2);
  }
  
  // Draw the centripetal acceleration vector (pointing inward) with an arrow.
  if (accelerationToggle.checked) {
    const centripetalAcceleration = Math.pow(speed, 2) / radius;
    const aX = -Math.cos(angle) * centripetalAcceleration;
    const aY = -Math.sin(angle) * centripetalAcceleration;
    drawArrow(ctx, particleX, particleY, particleX + aX * accelerationVectorScale, particleY + aY * accelerationVectorScale, 'red', 2);
  }
  
  // Display the computed centripetal force in the upper right corner.
  ctx.font = "16px Arial";
  ctx.fillStyle = "black";
  ctx.textAlign = "right";
  ctx.fillText("F = " + computedCentripetalForce.toFixed(2) + " N", canvas.width - 10, 20);
  
  requestAnimationFrame(animate);
}

// Start the animation loop.
requestAnimationFrame(animate);
