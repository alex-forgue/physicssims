
    // -------------------------------
    // Global simulation parameters
    // -------------------------------
    let wavelength = 550;         // in nm
    let slitSeparation = 50;      // in µm (controls vertical gap between slit centers)
    let screenDistance = 1.0;     // in m
    let orderCount = 3;

    let showWaveFronts = true;
    let showInterferencePattern = true;
    let showMaxima = true;
    let showMinima = false;
    let showFringeSpacing = false;
    let showOrders = false;
    let isPaused = false;
    let showIntensityCurve = false; // new option

    // New options
    let showConstructivePath = false;
    let showIntersectionDots = false;
    let showOnePathDiff = false;
    let showHalfPathDiff = false;

    // -------------------------------
    // Canvas and drawing setup
    // -------------------------------
    const simulationCanvas = document.getElementById('simulationCanvas');
    const simCtx = simulationCanvas.getContext('2d');
    const canvasWidth = simulationCanvas.width;
    const canvasHeight = simulationCanvas.height;

    const intensityCanvas = document.getElementById('intensityCanvas');
    const intensityCtx = intensityCanvas.getContext('2d');

    // The barrier (with slits) is drawn at x = slitX.
    const slitX = 100;
    // Global slit center positions (updated in drawBarrier)
    let slit1 = { x: slitX, y: canvasHeight / 2 - 10 };
    let slit2 = { x: slitX, y: canvasHeight / 2 + 10 };

    // The diffraction pattern ("screen") is drawn in a vertical band on the right.
    const screenX = canvasWidth - 100;

    // Conversion: physical meters to canvas pixels (vertical direction)
    const scaleY = 1000; // 1000 pixels per meter
    // Extra scale factor for exaggerating fringe spacing.
    const fringeDisplayScale = 5;

    // For highlighting path differences.
    const pathDiffScale = 1e8; // Adjusted so one wavelength appears visible

    // -------------------------------
    // Wavefront animation parameters
    // -------------------------------
    const waveSpeed = 100;     // pixels per second for expanding wavefronts
    const waveInterval = 0.5;  // seconds between new wavefront generation
    let lastWaveTime = 0;
    let lastFrameTime = 0;
    let waveCounter = 0;
    // Active wavefronts: each with properties: centerX, centerY, radius, origin, id.
    const waveFronts = [];

    // -------------------------------
    // Incoming wave animation parameters
    // -------------------------------
    const incomingSpacing = 15;  // spacing between vertical lines
    let incomingShift = 0;       // phase shift for incoming wave lines
    const incomingSpeed = 50;    // pixels per second

    // -------------------------------
    // Utility: Convert wavelength (nm) to an RGB object.
    // -------------------------------
    function wavelengthToRGB(wl) {
      let r = 0, g = 0, b = 0;
      if (wl >= 380 && wl < 440) {
          r = -(wl - 440) / (440 - 380);
          g = 0;
          b = 1;
      } else if (wl >= 440 && wl < 490) {
          r = 0;
          g = (wl - 440) / (490 - 440);
          b = 1;
      } else if (wl >= 490 && wl < 510) {
          r = 0;
          g = 1;
          b = -(wl - 510) / (510 - 490);
      } else if (wl >= 510 && wl < 580) {
          r = (wl - 510) / (580 - 510);
          g = 1;
          b = 0;
      } else if (wl >= 580 && wl < 645) {
          r = 1;
          g = -(wl - 645) / (645 - 580);
          b = 0;
      } else if (wl >= 645 && wl <= 750) {
          r = 1;
          g = 0;
          b = 0;
      }
      let factor = 1;
      if (wl >= 380 && wl < 420) {
          factor = 0.3 + 0.7 * (wl - 380) / (420 - 380);
      } else if (wl >= 645 && wl <= 750) {
          factor = 0.3 + 0.7 * (750 - wl) / (750 - 645);
      }
      r = Math.round(r * factor * 255);
      g = Math.round(g * factor * 255);
      b = Math.round(b * factor * 255);
      return { r, g, b };
    }

    // -------------------------------
    // Update control display values
    // -------------------------------
    function updateDisplay() {
      document.getElementById('wavelengthDisplay').textContent = wavelength;
      document.getElementById('slitSeparationDisplay').textContent = slitSeparation;
      document.getElementById('screenDistanceDisplay').textContent = screenDistance.toFixed(1);
    }

    // -------------------------------
    // Event Listeners for UI Controls
    // -------------------------------
    document.getElementById('wavelength').addEventListener('input', e => {
      wavelength = Number(e.target.value);
      updateDisplay();
    });
    document.getElementById('slitSeparation').addEventListener('input', e => {
      slitSeparation = Number(e.target.value);
      updateDisplay();
    });
    document.getElementById('screenDistance').addEventListener('input', e => {
      screenDistance = Number(e.target.value);
      updateDisplay();
    });
    document.getElementById('toggleMaxima').addEventListener('change', e => {
      showMaxima = e.target.checked;
    });
    document.getElementById('toggleMinima').addEventListener('change', e => {
      showMinima = e.target.checked;
    });
    document.getElementById('toggleInterferencePattern').addEventListener('change', e => {
      showInterferencePattern = e.target.checked;
    });
    document.getElementById('toggleWaveFronts').addEventListener('change', e => {
      showWaveFronts = e.target.checked;
    });
    document.getElementById('toggleFringeSpacing').addEventListener('change', e => {
      showFringeSpacing = e.target.checked;
    });
    document.getElementById('toggleOrders').addEventListener('change', e => {
      showOrders = e.target.checked;
    });
    document.getElementById('orderCount').addEventListener('input', e => {
      orderCount = Number(e.target.value);
    });
    // New option listeners.
    document.getElementById('toggleConstructivePath').addEventListener('change', e => {
      showConstructivePath = e.target.checked;
    });
    document.getElementById('toggleIntersectionDots').addEventListener('change', e => {
      showIntersectionDots = e.target.checked;
    });
    document.getElementById('toggleOnePathDiff').addEventListener('change', e => {
      showOnePathDiff = e.target.checked;
    });
    document.getElementById('toggleHalfPathDiff').addEventListener('change', e => {
      showHalfPathDiff = e.target.checked;
    });
    document.getElementById('toggleIntensityCurve').addEventListener('change', e => {
      showIntensityCurve = e.target.checked;
      document.getElementById('intensityCurveBox').style.display = showIntensityCurve ? "block" : "none";
    });
    document.getElementById('toggleAnimation').addEventListener('click', e => {
      isPaused = !isPaused;
      e.target.textContent = isPaused ? 'Play' : 'Pause';
      if (!isPaused) {
        lastFrameTime = performance.now();
        requestAnimationFrame(animate);
      }
    });

    // -------------------------------
    // Animation loop
    // -------------------------------
    function animate(timestamp) {
      if (isPaused) return;
      if (!lastFrameTime) lastFrameTime = timestamp;
      const deltaTime = (timestamp - lastFrameTime) / 1000;
      lastFrameTime = timestamp;
      
      // Update incoming wave shift.
      incomingShift += incomingSpeed * deltaTime;
      if (incomingShift > incomingSpacing) {
        incomingShift -= incomingSpacing;
      }

      simCtx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Draw the moving incoming planar wave (only on the left side of the barrier).
      drawIncomingWave();

      // Draw the barrier with two slit gaps.
      drawBarrier();

      if (showWaveFronts) {
        updateWaveFronts(deltaTime);
        drawWaveFronts();
      } else {
        waveFronts.length = 0;
      }
      if (showInterferencePattern) {
        drawInterferencePattern();
      }
      if (showMaxima) drawMaxima();
      if (showMinima) drawMinima();
      if (showFringeSpacing) drawFringeSpacing();
      if (showOrders) drawOrders();
      if (showConstructivePath) drawConstructivePaths();
      if (showIntersectionDots) drawWavefrontIntersectionDots();
      if (showOnePathDiff) highlightOnePathDiff();
      if (showHalfPathDiff) highlightHalfPathDiff();

      if (showIntensityCurve) {
        drawIntensityDistributionCurve();
      }

      requestAnimationFrame(animate);
    }

    // -------------------------------
    // Drawing functions for simulation
    // -------------------------------

    // Draw moving vertical lines representing the incoming planar wave,
    // only for x < slitX (i.e. left of the barrier). The lines move rightward.
    function drawIncomingWave() {
      const waveColor = wavelengthToRGB(wavelength);
      simCtx.strokeStyle = `rgb(${waveColor.r}, ${waveColor.g}, ${waveColor.b})`;
      simCtx.lineWidth = 2;
      // Draw vertical lines with spacing, shifted by incomingShift.
      for (let x = -incomingShift; x < slitX; x += incomingSpacing) {
        simCtx.beginPath();
        simCtx.moveTo(x, 0);
        simCtx.lineTo(x, canvasHeight);
        simCtx.stroke();
      }
    }

    // Draw a long vertical barrier at x = slitX with two gaps for the slits.
    // The gap centers are determined by the user-set slit separation.
    function drawBarrier() {
      let centerY = canvasHeight / 2;
      let offsetPixels = (slitSeparation / 50) * 10;
      // Define slit centers.
      let slitCenter1 = { x: slitX, y: centerY - offsetPixels };
      let slitCenter2 = { x: slitX, y: centerY + offsetPixels };
      // Update global slit positions.
      slit1 = slitCenter1;
      slit2 = slitCenter2;
      
      const gapHeight = 20; // fixed gap height
      const halfGap = gapHeight / 2;
      
      simCtx.strokeStyle = 'black';
      simCtx.lineWidth = 4;
      
      // Draw from top to just above first slit.
      simCtx.beginPath();
      simCtx.moveTo(slitX, 0);
      simCtx.lineTo(slitX, slitCenter1.y - halfGap);
      simCtx.stroke();
      
      // Draw between the two slits.
      simCtx.beginPath();
      simCtx.moveTo(slitX, slitCenter1.y + halfGap);
      simCtx.lineTo(slitX, slitCenter2.y - halfGap);
      simCtx.stroke();
      
      // Draw from just below second slit to bottom.
      simCtx.beginPath();
      simCtx.moveTo(slitX, slitCenter2.y + halfGap);
      simCtx.lineTo(slitX, canvasHeight);
      simCtx.stroke();
    }

    // Update wavefronts originating from the slits.
    function updateWaveFronts(deltaTime) {
      lastWaveTime += deltaTime;
      if (lastWaveTime >= waveInterval) {
        waveCounter++;
        waveFronts.push({ centerX: slit1.x, centerY: slit1.y, radius: 0, origin: 1, id: waveCounter });
        waveFronts.push({ centerX: slit2.x, centerY: slit2.y, radius: 0, origin: 2, id: waveCounter });
        lastWaveTime = 0;
      }
      for (let i = waveFronts.length - 1; i >= 0; i--) {
        waveFronts[i].radius += waveSpeed * deltaTime;
        if (waveFronts[i].centerX + waveFronts[i].radius > screenX) {
          waveFronts.splice(i, 1);
        }
      }
    }

    // Draw circular wavefronts from the slit gaps.
    function drawWaveFronts() {
      const waveColor = wavelengthToRGB(wavelength);
      simCtx.strokeStyle = `rgb(${waveColor.r},${waveColor.g},${waveColor.b})`;
      simCtx.lineWidth = 1;
      waveFronts.forEach(wf => {
        simCtx.beginPath();
        simCtx.arc(wf.centerX, wf.centerY, wf.radius, 0, 2 * Math.PI);
        simCtx.stroke();
      });
    }

    // Draw the diffraction pattern on the screen.
    function drawInterferencePattern() {
      const screenWidth = canvasWidth - screenX - 10;
      const d = slitSeparation * 1e-6;
      const lambda_m = wavelength * 1e-9;
      const fringeSpacing = (lambda_m * screenDistance) / d;
      const blockSize = 2;
      const centerY = canvasHeight / 2;
      const effectiveScale = scaleY * fringeDisplayScale;
      const baseColor = wavelengthToRGB(wavelength);
      
      for (let y = 0; y < canvasHeight; y += blockSize) {
        let yPhysical = ((y + blockSize/2) - centerY) / effectiveScale;
        let phase = (Math.PI * d * yPhysical) / (lambda_m * screenDistance);
        let f = Math.pow(Math.cos(phase), 2);
        let n = Math.abs(yPhysical) / fringeSpacing;
        let envelope = Math.max(1 - 0.2 * n, 0);
        let color;
        if (f >= 0.95) {
          let r = Math.round(baseColor.r * envelope);
          let g = Math.round(baseColor.g * envelope);
          let b = Math.round(baseColor.b * envelope);
          color = `rgb(${r},${g},${b})`;
        } else if (f >= 0.5) {
          let grey = Math.round(200 - ((f - 0.5) / 0.45) * 100);
          color = `rgb(${grey},${grey},${grey})`;
        } else {
          color = 'rgb(0,0,0)';
        }
        simCtx.fillStyle = color;
        simCtx.fillRect(screenX, y, screenWidth, blockSize);
      }
    }

    function drawMaxima() {
      const d = slitSeparation * 1e-6;
      const lambda_m = wavelength * 1e-9;
      const fringeSpacing = (lambda_m * screenDistance) / d;
      simCtx.strokeStyle = 'blue';
      simCtx.lineWidth = 2;
      const centerY = canvasHeight / 2;
      simCtx.beginPath();
      simCtx.moveTo(screenX, centerY);
      simCtx.lineTo(canvasWidth - 10, centerY);
      simCtx.stroke();
      for (let n = 1; n <= orderCount; n++) {
        let offset = n * fringeSpacing * scaleY * fringeDisplayScale;
        simCtx.beginPath();
        simCtx.moveTo(screenX, centerY - offset);
        simCtx.lineTo(canvasWidth - 10, centerY - offset);
        simCtx.stroke();
        simCtx.beginPath();
        simCtx.moveTo(screenX, centerY + offset);
        simCtx.lineTo(canvasWidth - 10, centerY + offset);
        simCtx.stroke();
      }
    }

    function drawMinima() {
      const d = slitSeparation * 1e-6;
      const lambda_m = wavelength * 1e-9;
      const fringeSpacing = (lambda_m * screenDistance) / d;
      simCtx.strokeStyle = 'yellow';
      simCtx.lineWidth = 1;
      const centerY = canvasHeight / 2;
      for (let n = 0; n < orderCount; n++) {
        let offset = (n + 0.5) * fringeSpacing * scaleY * fringeDisplayScale;
        simCtx.beginPath();
        simCtx.moveTo(screenX, centerY - offset);
        simCtx.lineTo(canvasWidth - 10, centerY - offset);
        simCtx.stroke();
        simCtx.beginPath();
        simCtx.moveTo(screenX, centerY + offset);
        simCtx.lineTo(canvasWidth - 10, centerY + offset);
        simCtx.stroke();
      }
    }

    function drawFringeSpacing() {
      const d = slitSeparation * 1e-6;
      const lambda_m = wavelength * 1e-9;
      const fringeSpacing = (lambda_m * screenDistance) / d;
      const centerY = canvasHeight / 2;
      const y1 = centerY - fringeSpacing * scaleY * fringeDisplayScale;
      simCtx.strokeStyle = 'purple';
      simCtx.lineWidth = 2;
      simCtx.beginPath();
      simCtx.moveTo(screenX - 20, centerY);
      simCtx.lineTo(screenX - 20, y1);
      simCtx.stroke();
      simCtx.fillStyle = 'purple';
      simCtx.font = '12px sans-serif';
      const spacingLabel = (fringeSpacing * 1000).toFixed(2) + ' mm';
      simCtx.fillText(spacingLabel, screenX - 60, (centerY + y1) / 2);
    }

    function drawOrders() {
      const d = slitSeparation * 1e-6;
      const lambda_m = wavelength * 1e-9;
      const fringeSpacing = (lambda_m * screenDistance) / d;
      const centerY = canvasHeight / 2;
      simCtx.fillStyle = 'black';
      simCtx.font = '14px sans-serif';
      simCtx.fillText("n = 0", screenX + 10, centerY);
      for (let n = 1; n <= orderCount; n++) {
        let offset = n * fringeSpacing * scaleY * fringeDisplayScale;
        simCtx.fillText("n = " + n, screenX + 10, centerY - offset);
        simCtx.fillText("n = " + n, screenX + 10, centerY + offset);
      }
    }

    // -------------------------------
    // Additional drawing functions (constructive paths, intersection dots, path differences)
    // -------------------------------
    function drawConstructivePaths() {
      const d = slitSeparation * 1e-6;
      const lambda_m = wavelength * 1e-9;
      const fringeSpacing = (lambda_m * screenDistance) / d;
      const centerY = canvasHeight / 2;
      const destX = screenX + (canvasWidth - screenX) / 2;
      simCtx.strokeStyle = 'orange';
      simCtx.lineWidth = 1;
      simCtx.setLineDash([5, 5]);
      for (let n = 1; n <= orderCount; n++) {
        let offset = n * fringeSpacing * scaleY * fringeDisplayScale;
        let maxYUpper = centerY - offset;
        let maxYLower = centerY + offset;
        simCtx.beginPath();
        simCtx.moveTo(slit1.x, slit1.y);
        simCtx.lineTo(destX, maxYUpper);
        simCtx.stroke();
        simCtx.beginPath();
        simCtx.moveTo(slit2.x, slit2.y);
        simCtx.lineTo(destX, maxYLower);
        simCtx.stroke();
      }
      simCtx.setLineDash([]);
    }

    function drawWavefrontIntersectionDots() {
      const groups = {};
      waveFronts.forEach(wf => {
        if (!groups[wf.id]) groups[wf.id] = [];
        groups[wf.id].push(wf);
      });
      simCtx.fillStyle = 'magenta';
      for (let id in groups) {
        if (groups[id].length === 2) {
          let wf1 = groups[id][0];
          let wf2 = groups[id][1];
          let r = (wf1.radius + wf2.radius) / 2;
          let dx = wf2.centerX - wf1.centerX;
          let dy = wf2.centerY - wf1.centerY;
          let dCenters = Math.sqrt(dx * dx + dy * dy);
          if (dCenters < 1e-6 || r < dCenters / 2) continue;
          let a = dCenters / 2;
          let h = Math.sqrt(r * r - a * a);
          let mx = (wf1.centerX + wf2.centerX) / 2;
          let my = (wf1.centerY + wf2.centerY) / 2;
          let rx = -dy / dCenters;
          let ry = dx / dCenters;
          let ix1 = mx + h * rx;
          let iy1 = my + h * ry;
          let ix2 = mx - h * rx;
          let iy2 = my - h * ry;
          [[ix1, iy1], [ix2, iy2]].forEach(pt => {
            simCtx.beginPath();
            simCtx.arc(pt[0], pt[1], 3, 0, 2 * Math.PI);
            simCtx.fill();
          });
        }
      }
    }

    function drawArrow(fromX, fromY, toX, toY) {
      simCtx.beginPath();
      simCtx.moveTo(fromX, fromY);
      simCtx.lineTo(toX, toY);
      simCtx.stroke();
      let angle = Math.atan2(toY - fromY, toX - fromX);
      let headLength = 10;
      simCtx.beginPath();
      simCtx.moveTo(toX, toY);
      simCtx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6),
                   toY - headLength * Math.sin(angle - Math.PI / 6));
      simCtx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6),
                   toY - headLength * Math.sin(angle + Math.PI / 6));
      simCtx.lineTo(toX, toY);
      simCtx.stroke();
      simCtx.fillStyle = simCtx.strokeStyle;
      simCtx.fill();
    }

    function highlightOnePathDiff() {
      const d = slitSeparation * 1e-6;
      const lambda_m = wavelength * 1e-9;
      const fringeSpacing = (lambda_m * screenDistance) / d;
      const centerY = canvasHeight / 2;
      let offset = fringeSpacing * scaleY * fringeDisplayScale;
      const destX = screenX + (canvasWidth - screenX) / 2;
      let maxY = centerY - offset;
      let baseOffset = (slitSeparation / 50) * 10;
      let upperSlit = { x: slitX, y: centerY - baseOffset };
      let dx = destX - upperSlit.x;
      let dy = maxY - upperSlit.y;
      let len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) return;
      let ux = dx / len, uy = dy / len;
      let arrowLength = lambda_m * pathDiffScale;
      let endX = upperSlit.x + ux * arrowLength;
      let endY = upperSlit.y + uy * arrowLength;
      simCtx.strokeStyle = 'red';
      simCtx.lineWidth = 2;
      simCtx.setLineDash([4, 4]);
      drawArrow(upperSlit.x, upperSlit.y, endX, endY);
      simCtx.setLineDash([]);
      simCtx.fillStyle = 'red';
      simCtx.font = '12px sans-serif';
      simCtx.fillText("λ", (upperSlit.x + endX) / 2, (upperSlit.y + endY) / 2);
    }

    function highlightHalfPathDiff() {
      const d = slitSeparation * 1e-6;
      const lambda_m = wavelength * 1e-9;
      const fringeSpacing = (lambda_m * screenDistance) / d;
      const centerY = canvasHeight / 2;
      let offset = fringeSpacing * scaleY * fringeDisplayScale;
      const destX = screenX + (canvasWidth - screenX) / 2;
      let maxY = centerY - offset;
      let baseOffset = (slitSeparation / 50) * 10;
      let upperSlit = { x: slitX, y: centerY - baseOffset };
      let dx = destX - upperSlit.x;
      let dy = maxY - upperSlit.y;
      let len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) return;
      let ux = dx / len, uy = dy / len;
      let arrowLength = (lambda_m / 2) * pathDiffScale;
      let endX = upperSlit.x + ux * arrowLength;
      let endY = upperSlit.y + uy * arrowLength;
      simCtx.strokeStyle = 'purple';
      simCtx.lineWidth = 2;
      simCtx.setLineDash([4, 4]);
      drawArrow(upperSlit.x, upperSlit.y, endX, endY);
      simCtx.setLineDash([]);
      simCtx.fillStyle = 'purple';
      simCtx.font = '12px sans-serif';
      simCtx.fillText("λ/2", (upperSlit.x + endX) / 2, (upperSlit.y + endY) / 2);
    }

    // -------------------------------
    // New: Draw the intensity distribution curve in a box below the simulation.
    function drawIntensityDistributionCurve() {
      const curveWidth = intensityCanvas.width;
      const curveHeight = intensityCanvas.height;
      const leftMargin = 50;
      const rightMargin = 20;
      const graphWidth = curveWidth - leftMargin - rightMargin;
      
      const effectiveScale = scaleY * fringeDisplayScale;
      const d = slitSeparation * 1e-6;
      const lambda_m = wavelength * 1e-9;
      const centerY = curveHeight / 2;
      const fringeSpacing = (lambda_m * screenDistance) / d;
      
      intensityCtx.clearRect(0, 0, curveWidth, curveHeight);
      
      intensityCtx.strokeStyle = 'red';
      intensityCtx.lineWidth = 2;
      intensityCtx.beginPath();
      const intensityCurveStart = leftMargin;
      for (let y = 0; y <= curveHeight; y += 1) {
          let yPhysical = (y - centerY) / effectiveScale;
          let phase = (Math.PI * d * yPhysical) / (lambda_m * screenDistance);
          let f = Math.pow(Math.cos(phase), 2);
          let n = Math.abs(yPhysical) / fringeSpacing;
          let envelope = Math.max(1 - 0.2 * n, 0);
          let effectiveIntensity = f * envelope;
          let x = intensityCurveStart + effectiveIntensity * graphWidth;
          if (y === 0) {
              intensityCtx.moveTo(x, y);
          } else {
              intensityCtx.lineTo(x, y);
          }
      }
      intensityCtx.stroke();
      
      intensityCtx.fillStyle = 'black';
      intensityCtx.font = '12px sans-serif';
      intensityCtx.fillText("n = 0", 5, centerY + 4);
      for (let n = 1; n <= orderCount; n++) {
          let yTop = centerY - n * fringeSpacing * effectiveScale;
          let yBottom = centerY + n * fringeSpacing * effectiveScale;
          intensityCtx.fillText("n = " + n, 5, yTop + 4);
          intensityCtx.fillText("n = " + n, 5, yBottom + 4);
      }
      intensityCtx.strokeStyle = '#666';
      intensityCtx.lineWidth = 1;
      intensityCtx.strokeRect(leftMargin, 0, graphWidth, curveHeight);
    }

    // -------------------------------
    // Start the simulation
    // -------------------------------
    updateDisplay();
    requestAnimationFrame(animate);

