window.onload = function() {
  // Get canvas and its context
  const canvas = document.getElementById("simulationCanvas");
  const ctx = canvas.getContext("2d");

  // Normal mode elements
  const massInput = document.getElementById("massInput");
  const velocityInput = document.getElementById("velocityInput");
  const radiusInput = document.getElementById("radiusInput");
  const massValueDisplay = document.getElementById("massValue");
  const velocityValueDisplay = document.getElementById("velocityValue");
  const radiusValueDisplay = document.getElementById("radiusValue");

  // Experimental design elements
  const expDesignCheck = document.getElementById("expDesignCheck");
  const expDesignPanel = document.getElementById("expDesignPanel");
  const normalControls = document.getElementById("normalControls");
  const ivExpSelect = document.getElementById("ivExpSelect");
  const dvExpSelect = document.getElementById("dvExpSelect");
  const massExpSlider = document.getElementById("massExp");
  const velocityExpSlider = document.getElementById("velocityExp");
  const radiusExpSlider = document.getElementById("radiusExp");
  const tensionExpSlider = document.getElementById("tensionExp");
  const massExpValueDisplay = document.getElementById("massExpValue");
  const velocityExpValueDisplay = document.getElementById("velocityExpValue");
  const radiusExpValueDisplay = document.getElementById("radiusExpValue");
  const tensionExpValueDisplay = document.getElementById("tensionExpValue");

  // Data table for experimental design
  const expDataTableBody = document.querySelector("#expDataTable tbody");
  const ivHeader = document.getElementById("ivHeader");
  const dvHeader = document.getElementById("dvHeader");
  const dataTableContainer = document.getElementById("dataTableContainer");

  // Tension table elements
  const tensionTopDisplay = document.getElementById("tensionTop");
  const tensionBottomDisplay = document.getElementById("tensionBottom");
  const tensionRightDisplay = document.getElementById("tensionRight");
  const tensionLeftDisplay = document.getElementById("tensionLeft");

  // Error message element
  const errorMessage = document.getElementById("errorMessage");

  // Constants and globals
  const g = 9.8;
  let mass = parseFloat(massInput.value);
  let velocity = parseFloat(velocityInput.value);
  let radius = parseFloat(radiusInput.value);
  let angle = 0;

  // Utility: round to 2 decimals
  function round2(val) {
    return parseFloat(val).toFixed(2);
  }

  // Normal mode update functions
  function updateNormalDisplays() {
    massValueDisplay.textContent = round2(mass);
    velocityValueDisplay.textContent = round2(velocity);
    radiusValueDisplay.textContent = round2(radius);
  }
  function updateTensions() {
    const centripetal = mass * velocity * velocity / radius;
    const tTop = centripetal - mass * g;
    const tBottom = centripetal + mass * g;
    const tSide = centripetal;
    tensionTopDisplay.textContent = round2(tTop);
    tensionBottomDisplay.textContent = round2(tBottom);
    tensionRightDisplay.textContent = round2(tSide);
    tensionLeftDisplay.textContent = round2(tSide);
  }
  function checkUCMValidity() {
    if (velocity < Math.sqrt(g * radius)) {
      errorMessage.innerText = "UCM not possible with these values.";
    } else {
      errorMessage.innerText = "";
    }
  }

  massInput.addEventListener("input", function() {
    mass = parseFloat(massInput.value);
    updateNormalDisplays();
    updateTensions();
    checkUCMValidity();
  });
  velocityInput.addEventListener("input", function() {
    velocity = parseFloat(velocityInput.value);
    updateNormalDisplays();
    updateTensions();
    checkUCMValidity();
  });
  radiusInput.addEventListener("input", function() {
    radius = parseFloat(radiusInput.value);
    updateNormalDisplays();
    updateTensions();
    checkUCMValidity();
  });

  // Experimental design update functions
  function updateExpDisplays() {
    massExpValueDisplay.textContent = round2(massExpSlider.value);
    velocityExpValueDisplay.textContent = round2(velocityExpSlider.value);
    radiusExpValueDisplay.textContent = round2(radiusExpSlider.value);
    tensionExpValueDisplay.textContent = round2(tensionExpSlider.value);
  }
  function updateExpDesignUI() {
    const dvVar = dvExpSelect.value;
    ["mass", "velocity", "radius", "tension"].forEach(function(varName) {
      let slider = getExpSlider(varName);
      slider.disabled = (varName === dvVar);
    });
    ivHeader.textContent = ivExpSelect.value.charAt(0).toUpperCase() + ivExpSelect.value.slice(1);
    dvHeader.textContent = dvExpSelect.value.charAt(0).toUpperCase() + dvExpSelect.value.slice(1);
  }
  function getExpSlider(varName) {
    switch(varName) {
      case "mass": return massExpSlider;
      case "velocity": return velocityExpSlider;
      case "radius": return radiusExpSlider;
      case "tension": return tensionExpSlider;
      default: return null;
    }
  }
  function updateExpGlobals() {
    const dvVar = dvExpSelect.value;
    if(dvVar !== "mass") mass = parseFloat(massExpSlider.value);
    if(dvVar !== "velocity") velocity = parseFloat(velocityExpSlider.value);
    if(dvVar !== "radius") radius = parseFloat(radiusExpSlider.value);
    updateTensions();
    checkUCMValidity();
  }
  // Compute DV based on IV slider manipulation.
  // We support the following pairs using our base equation:
  // T = m*v^2/r + m*g  =>  Solve for each variable:
  // m = T*r/(v^2 + g*r)
  // v = sqrt(r*(T - m*g)/m)
  // r = m*v^2/(T - m*g)
  // T = m*v^2/r + m*g
  function computeExpDesign() {
    const ivVar = ivExpSelect.value;
    const dvVar = dvExpSelect.value;
    let mVal = parseFloat(massExpSlider.value);
    let vVal = parseFloat(velocityExpSlider.value);
    let rVal = parseFloat(radiusExpSlider.value);
    let TVal = parseFloat(tensionExpSlider.value);
    let computedDV = 0;
    switch(ivVar + "_" + dvVar) {
      case "mass_velocity":
        computedDV = Math.sqrt(rVal * (TVal - mVal * g) / mVal);
        break;
      case "mass_radius":
        computedDV = mVal * (vVal * vVal) / (TVal - mVal * g);
        break;
      case "mass_tension":
        computedDV = mVal * (vVal * vVal) / rVal + mVal * g;
        break;
      case "velocity_mass":
        computedDV = TVal * rVal / ((vVal * vVal) + g * rVal);
        break;
      case "velocity_tension":
        computedDV = mVal * (vVal * vVal) / rVal + mVal * g;
        break;
      case "velocity_radius":
        computedDV = mVal * (vVal * vVal) / (TVal - mVal * g);
        break;
      case "radius_mass":
        computedDV = TVal * rVal / ((vVal * vVal) + g * rVal);
        break;
      case "radius_tension":
        computedDV = mVal * (vVal * vVal) / rVal + mVal * g;
        break;
      case "radius_velocity":
        computedDV = Math.sqrt(rVal * (TVal - mVal * g) / mVal);
        break;
      case "tension_mass":
        computedDV = TVal * rVal / ((vVal * vVal) + g * rVal);
        break;
      case "tension_velocity":
        computedDV = Math.sqrt(rVal * (TVal - mVal * g) / mVal);
        break;
      case "tension_radius":
        computedDV = mVal * (vVal * vVal) / (TVal - mVal * g);
        break;
      default:
        computedDV = parseFloat(getExpSlider(dvVar).value);
    }
    if (isNaN(computedDV) || computedDV <= 0) {
      computedDV = parseFloat(getExpSlider(dvVar).value);
    }
    let dvSlider = getExpSlider(dvVar);
    dvSlider.value = round2(computedDV);
    // Update globals based on supported pairs.
    if (ivVar === "mass" && dvVar === "velocity") {
      mass = mVal; velocity = computedDV; radius = rVal;
    } else if (ivVar === "mass" && dvVar === "radius") {
      mass = mVal; velocity = vVal; radius = computedDV;
    } else if (ivVar === "mass" && dvVar === "tension") {
      mass = mVal; velocity = vVal; radius = rVal;
    } else if (ivVar === "velocity" && dvVar === "mass") {
      mass = computedDV; velocity = vVal; radius = rVal;
    } else if (ivVar === "velocity" && dvVar === "tension") {
      mass = mVal; velocity = vVal; radius = rVal;
    } else if (ivVar === "velocity" && dvVar === "radius") {
      mass = mVal; velocity = vVal; radius = computedDV;
    } else if (ivVar === "radius" && dvVar === "mass") {
      mass = computedDV; velocity = vVal; radius = rVal;
    } else if (ivVar === "radius" && dvVar === "tension") {
      mass = mVal; velocity = vVal; radius = rVal;
    } else if (ivVar === "radius" && dvVar === "velocity") {
      mass = mVal; velocity = computedDV; radius = rVal;
    } else if (ivVar === "tension" && dvVar === "mass") {
      mass = computedDV; velocity = vVal; radius = rVal;
    } else if (ivVar === "tension" && dvVar === "velocity") {
      mass = mVal; velocity = computedDV; radius = rVal;
    } else if (ivVar === "tension" && dvVar === "radius") {
      mass = mVal; velocity = vVal; radius = computedDV;
    } else {
      mass = mVal; velocity = vVal; radius = rVal;
    }
    updateTensions();
    checkUCMValidity();
    addDataPoint(ivVar, computedDV);
  }
  function addDataPoint(ivVar, computedDV) {
    let ivVal = round2(getExpSlider(ivVar).value);
    let dvVal = round2(computedDV);
    const row = document.createElement("tr");
    const ivCell = document.createElement("td");
    const dvCell = document.createElement("td");
    ivCell.textContent = ivVal;
    dvCell.textContent = dvVal;
    row.appendChild(ivCell);
    row.appendChild(dvCell);
    expDataTableBody.appendChild(row);
    while(expDataTableBody.children.length > 15) {
      expDataTableBody.removeChild(expDataTableBody.firstChild);
    }
  }

  // Experimental design event listeners
  expDesignCheck.addEventListener("change", function() {
    if(expDesignCheck.checked) {
      expDesignPanel.style.display = "block";
      normalControls.style.display = "none";
      dataTableContainer.style.display = "block";
      expDataTableBody.innerHTML = "";
      updateExpDisplays();
      updateExpDesignUI();
      computeExpDesign();
    } else {
      expDesignPanel.style.display = "none";
      normalControls.style.display = "block";
      dataTableContainer.style.display = "none";
      mass = parseFloat(massInput.value);
      velocity = parseFloat(velocityInput.value);
      radius = parseFloat(radiusInput.value);
      updateNormalDisplays();
      updateTensions();
      checkUCMValidity();
    }
  });
  ivExpSelect.addEventListener("change", function() {
    updateExpDesignUI();
    expDataTableBody.innerHTML = "";
    computeExpDesign();
  });
  dvExpSelect.addEventListener("change", function() {
    updateExpDesignUI();
    expDataTableBody.innerHTML = "";
    computeExpDesign();
  });
  [massExpSlider, velocityExpSlider, radiusExpSlider, tensionExpSlider].forEach(function(slider) {
    slider.addEventListener("input", function() {
      updateExpDisplays();
      let varName = "";
      if(slider === massExpSlider) varName = "mass";
      else if(slider === velocityExpSlider) varName = "velocity";
      else if(slider === radiusExpSlider) varName = "radius";
      else if(slider === tensionExpSlider) varName = "tension";
      if(varName === ivExpSelect.value) {
        computeExpDesign();
      } else {
        updateExpGlobals();
      }
    });
  });

  // Animation loop
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = 50;
    const rPixels = radius * scale;
    ctx.beginPath();
    ctx.arc(centerX, centerY, rPixels, 0, 2 * Math.PI);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.stroke();
    const markerSize = 5;
    const positions = [
      { x: centerX, y: centerY - rPixels },
      { x: centerX, y: centerY + rPixels },
      { x: centerX + rPixels, y: centerY },
      { x: centerX - rPixels, y: centerY }
    ];
    ctx.fillStyle = "red";
    positions.forEach(function(pos) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, markerSize, 0, 2 * Math.PI);
      ctx.fill();
    });
    const angularSpeed = velocity / radius;
    angle += angularSpeed * 0.016;
    angle %= 2 * Math.PI;
    const ballX = centerX + rPixels * Math.cos(angle);
    const ballY = centerY + rPixels * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(ballX, ballY);
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 3;
    ctx.stroke();
    const ballRadius = 10;
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "blue";
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.stroke();
    requestAnimationFrame(draw);
  }
  
  updateNormalDisplays();
  updateTensions();
  checkUCMValidity();
  draw();
};
