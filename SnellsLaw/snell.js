
// Speed of light in vacuum (m/s)
const c = 3e8;
// Dispersion coefficient to simulate a small dependence on wavelength.
// Effective refractive index: n_eff = n_input + dispersionCoefficient * ((650 - wavelength_nm) / 650)
const dispersionCoefficient = 0.05;
// Colors for each slider (for up to 4 mediums)
const sliderColors = ["red", "green", "blue", "purple"];

// When the page loads, attach listeners and build the inputs.
window.onload = function() {
  document.getElementById("numMediums").addEventListener("change", createMediumInputs);
  createMediumInputs();
  attachListeners();
  updateSimulation();
};

// Build the slider inputs for the mediums.
function createMediumInputs() {
  const numMediums = parseInt(document.getElementById("numMediums").value);
  const container = document.getElementById("mediumInputs");
  container.innerHTML = "";
  for (let i = 1; i <= numMediums; i++) {
    const sliderContainer = document.createElement("div");
    sliderContainer.className = "slider-container";
    
    const label = document.createElement("span");
    label.className = "slider-label";
    label.textContent = `Medium ${i} Index (n): `;
    sliderContainer.appendChild(label);
    
    const input = document.createElement("input");
    input.type = "range";
    input.id = "n" + i;
    input.min = "1";
    input.max = "2.5";
    input.step = "0.01";
    let defaultValue = (i === 1) ? 1.0 : (i === 2 ? 1.33 : 1.5);
    input.value = defaultValue;
    input.style.accentColor = sliderColors[i-1];
    sliderContainer.appendChild(input);
    
    const output = document.createElement("span");
    output.id = "n" + i + "Value";
    output.style.marginLeft = "10px";
    output.textContent = defaultValue;
    sliderContainer.appendChild(output);
    
    container.appendChild(sliderContainer);
    
    input.addEventListener("input", function() {
      output.textContent = input.value;
      updateSimulation();
    });
    input.addEventListener("change", updateSimulation);
  }
  updateSimulation();
}

// Convert a wavelength (nm) to an approximate RGB color string.
function getColorFromWavelength(wavelength) {
  let R = 0, G = 0, B = 0;
  if (wavelength >= 380 && wavelength < 440) {
    R = -(wavelength - 440) / (440 - 380);
    G = 0.0;
    B = 1.0;
  } else if (wavelength >= 440 && wavelength < 490) {
    R = 0.0;
    G = (wavelength - 440) / (490 - 440);
    B = 1.0;
  } else if (wavelength >= 490 && wavelength < 510) {
    R = 0.0;
    G = 1.0;
    B = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
    R = (wavelength - 510) / (580 - 510);
    G = 1.0;
    B = 0.0;
  } else if (wavelength >= 580 && wavelength < 645) {
    R = 1.0;
    G = -(wavelength - 645) / (645 - 580);
    B = 0.0;
  } else if (wavelength >= 645 && wavelength <= 750) {
    R = 1.0;
    G = 0.0;
    B = 0.0;
  } else {
    R = G = B = 0;
  }
  let factor = 1.0;
  if (wavelength >= 380 && wavelength < 420) {
    factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
  } else if (wavelength >= 645 && wavelength <= 750) {
    factor = 0.3 + 0.7 * (750 - wavelength) / (750 - 645);
  }
  R = Math.round(R * factor * 255);
  G = Math.round(G * factor * 255);
  B = Math.round(B * factor * 255);
  return `rgb(${R},${G},${B})`;
}

// Toggle between entering a wavelength value and selecting a color.
document.getElementById("wavelengthRadio").addEventListener("change", function() {
  document.getElementById("wavelengthInputDiv").style.display = "block";
  document.getElementById("colorSelectDiv").style.display = "none";
  updateSimulation();
});
document.getElementById("colorRadio").addEventListener("change", function() {
  document.getElementById("wavelengthInputDiv").style.display = "none";
  document.getElementById("colorSelectDiv").style.display = "block";
  updateSimulation();
});

// Attach listeners to all input and select elements.
function attachListeners() {
  const controls = document.querySelectorAll("input, select");
  controls.forEach(el => {
    el.addEventListener("input", updateSimulation);
    el.addEventListener("change", updateSimulation);
  });
}

// Main update function that recalculates the simulation and updates both tables and the canvas.
function updateSimulation() {
  const numMediums = parseInt(document.getElementById("numMediums").value);
  let n = [];
  for (let i = 1; i <= numMediums; i++) {
    n.push(parseFloat(document.getElementById("n" + i).value));
  }
  
  let incidentAngle = parseFloat(document.getElementById("incidentAngle").value);
  
  let wavelength_nm;
  if (document.getElementById("wavelengthRadio").checked) {
    wavelength_nm = parseFloat(document.getElementById("wavelengthInput").value);
  } else {
    wavelength_nm = parseFloat(document.getElementById("colorSelect").value);
  }
  if(wavelength_nm < 380) wavelength_nm = 380;
  if(wavelength_nm > 750) wavelength_nm = 750;
  
  const wavelength_m = wavelength_nm * 1e-9;
  const frequency = c / wavelength_m;
  
  let n_eff = n.map(n_val => n_val + dispersionCoefficient * ((650 - wavelength_nm) / 650));
  
  let mediums = [];
  let angles = [];
  
  angles.push(incidentAngle);
  mediums.push({
    n: n_eff[0],
    angle: incidentAngle,
    speed: c / n_eff[0],
    wavelength: wavelength_nm / n_eff[0]
  });
  
  let criticalApplied = false;
  for (let i = 1; i < numMediums; i++) {
    if (criticalApplied) {
      angles.push(NaN);
      mediums.push({
        n: n_eff[i],
        angle: NaN,
        speed: c / n_eff[i],
        wavelength: wavelength_nm / n_eff[i]
      });
      continue;
    }
    let showCrit = document.getElementById("showCritical").checked;
    if (showCrit && n_eff[i - 1] > n_eff[i]) {
      let critAngle = Math.asin(n_eff[i] / n_eff[i - 1]) * 180 / Math.PI;
      angles[i - 1] = critAngle;
      angles.push(90);
      mediums.push({
        n: n_eff[i],
        angle: 90,
        speed: c / n_eff[i],
        wavelength: wavelength_nm / n_eff[i]
      });
      criticalApplied = true;
    } else {
      let prevAngleRad = angles[i - 1] * Math.PI / 180;
      let sinTheta = (n_eff[i - 1] / n_eff[i]) * Math.sin(prevAngleRad);
      if (sinTheta > 1) {
        angles.push(NaN);
        mediums.push({
          n: n_eff[i],
          angle: NaN,
          speed: c / n_eff[i],
          wavelength: wavelength_nm / n_eff[i]
        });
        criticalApplied = true;
      } else {
        let angle_i = Math.asin(sinTheta) * 180 / Math.PI;
        angles.push(angle_i);
        mediums.push({
          n: n_eff[i],
          angle: angle_i,
          speed: c / n_eff[i],
          wavelength: wavelength_nm / n_eff[i]
        });
      }
    }
  }
  
  // Update primary data table.
  const tbody = document.getElementById("dataTable").getElementsByTagName("tbody")[0];
  tbody.innerHTML = "";
  for (let i = 0; i < mediums.length; i++) {
    let row = tbody.insertRow();
    row.insertCell().textContent = i + 1;
    row.insertCell().textContent = mediums[i].n.toFixed(3);
    row.insertCell().textContent = mediums[i].speed.toExponential(2);
    row.insertCell().textContent = isNaN(mediums[i].angle) ? "TIR" : mediums[i].angle.toFixed(2);
    row.insertCell().textContent = mediums[i].wavelength.toFixed(2);
    row.insertCell().textContent = frequency.toExponential(2);
  }
  
  // Update second data table.
  const iTbody = document.getElementById("interfaceTable").getElementsByTagName("tbody")[0];
  iTbody.innerHTML = "";
  for (let i = 0; i < mediums.length; i++) {
    let row = iTbody.insertRow();
    row.insertCell().textContent = i + 1;
    let incidentVal = isNaN(angles[i]) ? "TIR" : angles[i].toFixed(2);
    row.insertCell().textContent = incidentVal;
    if (i < mediums.length - 1) {
      let refractedVal = isNaN(angles[i+1]) ? "TIR" : angles[i+1].toFixed(2);
      row.insertCell().textContent = refractedVal;
      row.insertCell().textContent = refractedVal;
    } else {
      row.insertCell().textContent = "N/A";
      row.insertCell().textContent = incidentVal;
    }
  }
  
  drawSimulation(mediums, angles, wavelength_nm);
}

// Draw the simulation on the canvas.
function drawSimulation(mediums, angles, wavelength_nm) {
  const canvas = document.getElementById("simulationCanvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const numMediums = mediums.length;
  const mediumHeight = canvas.height / numMediums;
  
  // Draw backgrounds for each medium using a linear color interpolation:
  // n=1 -> white (255,255,255); n=2.5 -> dark blue-grey (44,62,80)
  for (let i = 0; i < numMediums; i++) {
    let n_val = mediums[i].n; // effective index
    let t = (n_val - 1) / (2.5 - 1); // normalized between 0 and 1
    let R = Math.round(255 - t * (255 - 44));  // 255 -> 44
    let G = Math.round(255 - t * (255 - 62));  // 255 -> 62
    let B = Math.round(255 - t * (255 - 80));  // 255 -> 80
    ctx.fillStyle = `rgb(${R},${G},${B})`;
    ctx.fillRect(0, i * mediumHeight, canvas.width, mediumHeight);
  }
  
  // Draw horizontal boundaries.
  ctx.strokeStyle = "#ccc";
  ctx.lineWidth = 1;
  for (let i = 0; i <= numMediums; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * mediumHeight);
    ctx.lineTo(canvas.width, i * mediumHeight);
    ctx.stroke();
  }
  
  // Determine ray color based on wavelength.
  let lightColor = getColorFromWavelength(wavelength_nm);
  
  // Draw ray path.
  let xPositions = [];
  let startX = 0;
  let startY = mediumHeight / 2;
  xPositions.push(startX);
  
  ctx.strokeStyle = lightColor;
  ctx.lineWidth = 3;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  
  let currentX = startX;
  let currentY = startY;
  for (let i = 0; i < numMediums; i++) {
    let theta = angles[i];
    if (isNaN(theta)) {
      currentX += canvas.width / (numMediums * 2);
      currentY += mediumHeight;
      ctx.lineTo(currentX, currentY);
      xPositions.push(currentX);
      continue;
    }
    let angleRad = theta * Math.PI / 180;
    let dx = mediumHeight * Math.tan(angleRad);
    currentX += dx;
    currentY += mediumHeight;
    ctx.lineTo(currentX, currentY);
    xPositions.push(currentX);
  }
  ctx.stroke();
  
  // Draw normals and annotate angles.
  for (let i = 1; i < numMediums; i++) {
    let xInt = xPositions[i];
    let yInt = i * mediumHeight;
    
    // Draw normal (vertical dashed line).
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.moveTo(xInt, yInt - mediumHeight / 2);
    ctx.lineTo(xInt, yInt + mediumHeight / 2);
    ctx.stroke();
    ctx.restore();
    
    // Draw reflected ray.
    let incAngle = angles[i - 1];
    if (!isNaN(incAngle)) {
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "purple";
      ctx.beginPath();
      ctx.moveTo(xInt, yInt);
      let reflLength = mediumHeight / 2;
      let dxRefl = reflLength * Math.tan(incAngle * Math.PI / 180);
      ctx.lineTo(xInt - dxRefl, yInt - reflLength);
      ctx.stroke();
      ctx.restore();
    }
    
    // Annotate angles with increased offset.
    ctx.fillStyle = "black";
    ctx.font = "12px Arial";
    if (!isNaN(incAngle)) {
      ctx.fillText(`θi=${incAngle.toFixed(1)}°`, xInt + 15, yInt - mediumHeight / 4 - 5);
      ctx.fillText(`θr=${isNaN(angles[i]) ? "TIR" : angles[i].toFixed(1)}°`, xInt - 60, yInt - mediumHeight / 4 - 5);
    }
    let refrAngle = angles[i];
    if (!isNaN(refrAngle)) {
      ctx.fillText(`θt=${refrAngle.toFixed(1)}°`, xInt + 15, yInt + mediumHeight / 4 + 5);
    } else {
      ctx.fillText(`TIR`, xInt + 15, yInt + mediumHeight / 4 + 5);
    }
  }
}
