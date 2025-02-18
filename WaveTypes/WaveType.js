(function() {
  // Get references to DOM elements
  const canvas = document.getElementById('waveCanvas');
  const ctx = canvas.getContext('2d');
  const controlElements = {
    waveType: document.getElementById('waveType'),
    showWavelength: document.getElementById('showWavelength'),
    showPeriod: document.getElementById('showPeriod'),
    showAmplitude: document.getElementById('showAmplitude'),
    showCrest: document.getElementById('showCrest'),
    showTrough: document.getElementById('showTrough'),
    showDisplacementDirection: document.getElementById('showDisplacementDirection'),
    showEnergyTransferDirection: document.getElementById('showEnergyTransferDirection'),
    showParticleMovement: document.getElementById('showParticleMovement'),
    showOneParticle: document.getElementById('showOneParticle'),
    showOneArea: document.getElementById('showOneArea'),
    amplitude: document.getElementById('amplitude'),
    wavelength: document.getElementById('wavelength'),
    period: document.getElementById('period'),
    frequency: document.getElementById('frequency'),
    amplitudeValue: document.getElementById('amplitudeValue'),
    wavelengthValue: document.getElementById('wavelengthValue'),
    periodValue: document.getElementById('periodValue'),
    frequencyValue: document.getElementById('frequencyValue')
  };

  // Resize canvas to fill its container
  function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Update slider display values
  function updateSliderDisplays() {
    controlElements.amplitudeValue.textContent = controlElements.amplitude.value;
    controlElements.wavelengthValue.textContent = controlElements.wavelength.value;
    controlElements.periodValue.textContent = controlElements.period.value;
    controlElements.frequencyValue.textContent = controlElements.frequency.value;
  }
  ['amplitude', 'wavelength', 'period', 'frequency'].forEach(id => {
    controlElements[id].addEventListener('input', updateSliderDisplays);
  });
  updateSliderDisplays();

  // Wave class definition
  class Wave {
    constructor(amplitude, wavelength, period, frequency, type) {
      this.amplitude = amplitude;
      this.wavelength = wavelength;
      this.period = period; // in milliseconds
      this.frequency = frequency;
      this.type = type; // 'transverse' or 'longitudinal'
    }
    
    // Calculate wave speed: speed = wavelength / (period in seconds)
    get speed() {
      return this.wavelength / (this.period / 1000);
    }
    
    // Displacement function: displacement(x,t) = A * sin(k*x - ω*t)
    displacement(x, t) {
      let periodSec = this.period / 1000;
      let omega = 2 * Math.PI / periodSec;
      let k = 2 * Math.PI / this.wavelength;
      return this.amplitude * Math.sin(k * x - omega * t);
    }
    
    // Draw the wave lines and crest/trough overlays.
    // Blue (wave) lines are drawn only if either arrow checkbox is checked.
    // For longitudinal waves, if "showOneArea" is checked, only draw overlays (and line) for a central area.
    draw(ctx, areaHeight, t, controls) {
      if (this.type === 'transverse') {
        // Transverse wave: sine curve (y = midline - displacement)
        if (controls.showDisplacementDirection.checked || controls.showEnergyTransferDirection.checked) {
          ctx.beginPath();
          for (let x = 0; x <= canvas.width; x += 2) {
            let y = areaHeight / 2 - this.displacement(x, t);
            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.strokeStyle = 'blue';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      } else {
        // Longitudinal wave
        if (controls.showOneArea.checked) {
          // Only draw overlays for a single central area.
          let x = canvas.width / 2;
          let disp = this.displacement(x, t);
          let wavefrontX = x + disp;
          let periodSec = this.period / 1000;
          let omega = 2 * Math.PI / periodSec;
          let k = 2 * Math.PI / this.wavelength;
          let deriv = this.amplitude * k * Math.cos(k * x - omega * t);
          let rectWidth = 40 * 0.8;
          let rectX = wavefrontX - rectWidth / 2;
          if (controls.showCrest.checked && deriv < 0) {
            ctx.fillStyle = "rgba(144,238,144,0.3)";
            ctx.fillRect(rectX, 0, rectWidth, areaHeight);
          } else if (controls.showTrough.checked && deriv > 0) {
            ctx.fillStyle = "rgba(255,165,0,0.3)";
            ctx.fillRect(rectX, 0, rectWidth, areaHeight);
          }
          if (controls.showDisplacementDirection.checked || controls.showEnergyTransferDirection.checked) {
            ctx.beginPath();
            ctx.moveTo(wavefrontX, 0);
            ctx.lineTo(wavefrontX, areaHeight);
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        } else {
          // Draw overlays for all wavefronts.
          let spacing = 40;
          for (let x = 0; x <= canvas.width; x += spacing) {
            let disp = this.displacement(x, t);
            let wavefrontX = x + disp;
            let periodSec = this.period / 1000;
            let omega = 2 * Math.PI / periodSec;
            let k = 2 * Math.PI / this.wavelength;
            let deriv = this.amplitude * k * Math.cos(k * x - omega * t);
            let rectWidth = spacing * 0.8;
            let rectX = wavefrontX - rectWidth / 2;
            if (controls.showCrest.checked && deriv < 0) {
              ctx.fillStyle = "rgba(144,238,144,0.3)";
              ctx.fillRect(rectX, 0, rectWidth, areaHeight);
            } else if (controls.showTrough.checked && deriv > 0) {
              ctx.fillStyle = "rgba(255,165,0,0.3)";
              ctx.fillRect(rectX, 0, rectWidth, areaHeight);
            }
            if (controls.showDisplacementDirection.checked || controls.showEnergyTransferDirection.checked) {
              ctx.beginPath();
              ctx.moveTo(wavefrontX, 0);
              ctx.lineTo(wavefrontX, areaHeight);
              ctx.strokeStyle = 'blue';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          }
        }
      }
    }
    
    // Draw particles showing the medium's oscillations.
    drawParticles(ctx, areaHeight, t, controls) {
      ctx.fillStyle = 'red';
      if (this.type === 'transverse') {
        for (let x = 0; x <= canvas.width; x += 20) {
          let y = areaHeight / 2 - this.displacement(x, t);
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
      } else {
        let spacing = 20;
        for (let x = 0; x <= canvas.width; x += spacing) {
          let u = this.displacement(x, t);
          let newX = x + u;
          let y = areaHeight / 2;
          ctx.beginPath();
          ctx.arc(newX, y, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }
    
    // Draw common labels; for transverse waves, also show crest/trough text labels.
    drawLabels(ctx, areaHeight, t, controls) {
      ctx.fillStyle = 'black';
      ctx.font = '12px Arial';
      if (controls.showAmplitude.checked) {
        ctx.fillText("Amplitude: " + this.amplitude, 10, 20);
      }
      if (controls.showWavelength.checked) {
        ctx.fillText("Wavelength: " + this.wavelength, 10, 40);
      }
      if (controls.showPeriod.checked) {
        ctx.fillText("Period: " + this.period + " ms", 10, 60);
      }
      if (this.type === 'transverse') {
        for (let x = 0; x <= canvas.width; x += 20) {
          let disp = this.displacement(x, t);
          let y = areaHeight / 2 - disp;
          if (controls.showCrest.checked && disp > 0.9 * this.amplitude) {
            ctx.fillText("Crest", x, y - 10);
          }
          if (controls.showTrough.checked && disp < -0.9 * this.amplitude) {
            ctx.fillText("Trough", x, y + 20);
          }
        }
      }
    }
  }

  // Draw a green arrow for displacement direction.
  // For transverse waves, the arrow points up; for longitudinal waves, it points down.
  function drawDisplacementArrow(ctx, simulationAreaHeight, waveType) {
    let arrowX = 50;
    let arrowSize = 10;
    ctx.strokeStyle = 'green';
    ctx.fillStyle = 'green';
    ctx.lineWidth = 4;
    if (waveType === 'transverse') {
      // Arrow pointing up near bottom.
      let arrowY = simulationAreaHeight - 50;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX, arrowY - arrowSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY - arrowSize);
      ctx.lineTo(arrowX - arrowSize/2, arrowY - arrowSize + arrowSize/2);
      ctx.lineTo(arrowX + arrowSize/2, arrowY - arrowSize + arrowSize/2);
      ctx.closePath();
      ctx.fill();
    } else {
      // Longitudinal: Arrow pointing down near top.
      let arrowY = 50;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX, arrowY + arrowSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY + arrowSize);
      ctx.lineTo(arrowX - arrowSize/2, arrowY + arrowSize - arrowSize/2);
      ctx.lineTo(arrowX + arrowSize/2, arrowY + arrowSize - arrowSize/2);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Draw a red arrow for energy transfer direction (always pointing right).
  function drawEnergyArrow(ctx, simulationAreaHeight) {
    let y = 30;
    let xStart = 20;
    let xEnd = canvas.width - 20;
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(xStart, y);
    ctx.lineTo(xEnd, y);
    ctx.stroke();
    let arrowSize = 10;
    ctx.beginPath();
    ctx.moveTo(xEnd, y);
    ctx.lineTo(xEnd - arrowSize, y - arrowSize / 2);
    ctx.lineTo(xEnd - arrowSize, y + arrowSize / 2);
    ctx.closePath();
    ctx.fillStyle = 'red';
    ctx.fill();
  }

  // Draw a single particle along a dotted guide line.
  function drawOneParticle(ctx, simulationAreaHeight, t, wave, controls) {
    ctx.fillStyle = 'purple';
    ctx.strokeStyle = 'gray';
    ctx.lineWidth = 1;
    if (wave.type === 'transverse') {
      let x = canvas.width / 2;
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, simulationAreaHeight);
      ctx.stroke();
      ctx.restore();
      let y = simulationAreaHeight / 2 - wave.displacement(x, t);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      let y = simulationAreaHeight / 2;
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
      ctx.restore();
      let x = canvas.width / 2 + wave.displacement(canvas.width / 2, t);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  // Draw one area for longitudinal waves: two particles with a dotted line between,
  // showing the local compression (crest) or expansion (trough).
  function drawOneArea(ctx, simulationAreaHeight, t, wave, controls) {
    let baseX = canvas.width / 2;
    let delta = 20;
    let leftX = baseX - delta / 2;
    let rightX = baseX + delta / 2;
    let uLeft = wave.displacement(leftX, t);
    let uRight = wave.displacement(rightX, t);
    let x1 = leftX + uLeft;
    let x2 = rightX + uRight;
    let y = simulationAreaHeight / 2 + 50;
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'gray';
    ctx.beginPath();
    ctx.moveTo(baseX - delta, y);
    ctx.lineTo(baseX + delta, y);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'purple';
    ctx.beginPath();
    ctx.arc(x1, y, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x2, y, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
  }

  // Graph functions: For both wave types we now sample the displacement of the fixed particle (canvas.width/2).
  function drawGraphWavelength(ctx, graphAreaY, graphAreaHeight, wave, t) {
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(40, graphAreaY + graphAreaHeight / 2);
    ctx.lineTo(canvas.width - 10, graphAreaY + graphAreaHeight / 2);
    ctx.stroke();
    ctx.fillStyle = 'black';
    ctx.fillText("Distance", canvas.width - 50, graphAreaY + graphAreaHeight / 2 + 15);
    ctx.fillText("Displacement", 10, graphAreaY + 15);
    
    ctx.strokeStyle = 'green';
    ctx.beginPath();
    let fixedX = canvas.width / 2;
    let disp = wave.displacement(fixedX, t);
    let y = graphAreaY + graphAreaHeight / 2 - disp;
    ctx.moveTo(40, y);
    ctx.lineTo(canvas.width - 10, y);
    ctx.stroke();
  }

  function drawGraphPeriod(ctx, graphAreaY, graphAreaHeight, wave, t) {
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(40, graphAreaY + graphAreaHeight / 2);
    ctx.lineTo(canvas.width - 10, graphAreaY + graphAreaHeight / 2);
    ctx.stroke();
    ctx.fillStyle = 'black';
    ctx.fillText("Time", canvas.width - 50, graphAreaY + graphAreaHeight / 2 + 15);
    ctx.fillText("Displacement", 10, graphAreaY + 15);
    
    let fixedX = canvas.width / 2;
    ctx.strokeStyle = 'purple';
    ctx.beginPath();
    let timeWindow = 2;
    let samples = 200;
    for (let i = 0; i <= samples; i++) {
      let tSample = t - timeWindow / 2 + (i / samples) * timeWindow;
      let disp = wave.displacement(fixedX, tSample);
      let x = 40 + (i / samples) * (canvas.width - 50 - 40);
      let y = graphAreaY + graphAreaHeight / 2 - disp;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  // Main animation loop
  let startTime = null;
  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    let t = (timestamp - startTime) / 1000;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let graphEnabled = controlElements.showWavelength.checked || controlElements.showPeriod.checked;
    let graphAreaHeight = graphEnabled ? 200 : 0;
    let simulationAreaHeight = canvas.height - graphAreaHeight;
    
    // Create the current wave from control values.
    let wave = new Wave(
      parseFloat(controlElements.amplitude.value),
      parseFloat(controlElements.wavelength.value),
      parseFloat(controlElements.period.value),
      parseFloat(controlElements.frequency.value),
      controlElements.waveType.value
    );
    
    // Draw background.
    ctx.fillStyle = "#eaeaea";
    ctx.fillRect(0, 0, canvas.width, simulationAreaHeight);
    
    // Draw wave lines (blue) and crest/trough overlays.
    wave.draw(ctx, simulationAreaHeight, t, controlElements);
    
    // Draw displacement (green) arrow if enabled.
    if (controlElements.showDisplacementDirection.checked) {
      drawDisplacementArrow(ctx, simulationAreaHeight, wave.type);
    }
    // Draw energy transfer (red) arrow if enabled.
    if (controlElements.showEnergyTransferDirection.checked) {
      drawEnergyArrow(ctx, simulationAreaHeight);
    }
    
    // Draw particles: if "Show one particle" is checked, only draw that one; otherwise, show all.
    if (controlElements.showOneParticle.checked) {
      drawOneParticle(ctx, simulationAreaHeight, t, wave, controlElements);
    } else if (controlElements.showParticleMovement.checked) {
      wave.drawParticles(ctx, simulationAreaHeight, t, controlElements);
    }
    
    // For longitudinal waves, if "Show one area" is checked, draw the two-particle area.
    if (wave.type === 'longitudinal' && controlElements.showOneArea.checked) {
      drawOneArea(ctx, simulationAreaHeight, t, wave, controlElements);
    }
    
    // Draw labels.
    wave.drawLabels(ctx, simulationAreaHeight, t, controlElements);
    
    // Draw graphs if enabled.
    if (graphEnabled) {
      ctx.strokeStyle = 'gray';
      ctx.beginPath();
      ctx.moveTo(0, simulationAreaHeight);
      ctx.lineTo(canvas.width, simulationAreaHeight);
      ctx.stroke();
      if (controlElements.showWavelength.checked && controlElements.showPeriod.checked) {
        let halfHeight = graphAreaHeight / 2;
        drawGraphWavelength(ctx, simulationAreaHeight, halfHeight, wave, t);
        drawGraphPeriod(ctx, simulationAreaHeight + halfHeight, halfHeight, wave, t);
      } else if (controlElements.showWavelength.checked) {
        drawGraphWavelength(ctx, simulationAreaHeight, graphAreaHeight, wave, t);
      } else if (controlElements.showPeriod.checked) {
        drawGraphPeriod(ctx, simulationAreaHeight, graphAreaHeight, wave, t);
      }
    }
    
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
})();
