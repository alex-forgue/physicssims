 // Global scene variables and wave parameters
    let scene, camera, renderer, controls;
    let lineE, lineB;
    let arrowEGroup, arrowBGroup, velArrow;
    let velLabel;
    let axisGroup;
    let photonGroup;
    let showVectorArrows = true;
    let showVectorLabels = true;
    let showAxes = true;
    let paused = false;
    let t = 0;
    
    // Highlight meshes for filled curves
    let highlightEMesh = null, highlightEContainer = null;
    let highlightBMesh = null, highlightBContainer = null;
    
    // Wave parameters
    const amplitudeE = 5, amplitudeB = 5;
    const k = 0.2;       // wave number
    const ω = 0.1;       // angular frequency
    const numPoints = 100;
    const uMin = -50, uMax = 50;
    
    // --- Utility Functions ---
    // Return an index for the axis letter (0 for x, 1 for y, 2 for z)
    function axisIndex(axis) {
      return axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    }
    
    // Return a unit vector for the given axis letter.
    function getAxisVector(axis) {
      switch(axis) {
        case 'x': return new THREE.Vector3(1, 0, 0);
        case 'y': return new THREE.Vector3(0, 1, 0);
        case 'z': return new THREE.Vector3(0, 0, 1);
        default: return new THREE.Vector3(1, 0, 0);
      }
    }
    
    // Given the chosen E and B axes, return the remaining axis for propagation.
    function getPropagationAxis(eAxis, bAxis) {
      const axes = ['x','y','z'];
      return axes.filter(a => a !== eAxis && a !== bAxis)[0];
    }
    
    // Create a text sprite using a canvas texture.
    function createTextSprite(message, parameters) {
      parameters = parameters || {};
      const fontface = parameters.fontface || "Arial";
      const fontsize = parameters.fontsize || 24;
      const borderThickness = parameters.borderThickness || 4;
      const textColor = parameters.textColor || { r:0, g:0, b:0, a:1.0 };
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      context.font = fontsize + "px " + fontface;
      const metrics = context.measureText(message);
      const textWidth = metrics.width;
      canvas.width = textWidth + borderThickness * 2;
      canvas.height = fontsize * 1.4 + borderThickness * 2;
      context.font = fontsize + "px " + fontface;
      context.fillStyle = "rgba(" + textColor.r + "," + textColor.g + "," + textColor.b + "," + textColor.a + ")";
      context.fillText(message, borderThickness, fontsize + borderThickness);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(10, 5, 1);
      return sprite;
    }
    
    // Update the magnetic field axis dropdown so that B ≠ E.
    function updateBAxisOptions() {
      const eSelect = document.getElementById('eAxisSelect');
      const bSelect = document.getElementById('bAxisSelect');
      const eVal = eSelect.value;
      let options = [];
      if(eVal === 'x') { options = ['y','z']; }
      else if(eVal === 'y') { options = ['x','z']; }
      else if(eVal === 'z') { options = ['x','y']; }
      bSelect.innerHTML = "";
      options.forEach(opt => {
        const optionElem = document.createElement("option");
        optionElem.value = opt;
        optionElem.text = opt.toUpperCase();
        bSelect.appendChild(optionElem);
      });
    }
    
    // Create white axes with labels for X, Y, and Z.
    function createAxisGroup() {
      const group = new THREE.Group();
      const material = new THREE.LineBasicMaterial({ color: 0xffffff });
      
      // X axis from (-50,0,0) to (50,0,0)
      const xGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-50,0,0), new THREE.Vector3(50,0,0)]);
      const xAxis = new THREE.Line(xGeom, material);
      group.add(xAxis);
      const xLabel = createTextSprite("X", { fontsize: 30, textColor: {r:255, g:255, b:255, a:1} });
      xLabel.position.set(55, 0, 0);
      group.add(xLabel);
      
      // Y axis from (0,-50,0) to (0,50,0)
      const yGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-50,0), new THREE.Vector3(0,50,0)]);
      const yAxis = new THREE.Line(yGeom, material);
      group.add(yAxis);
      const yLabel = createTextSprite("Y", { fontsize: 30, textColor: {r:255, g:255, b:255, a:1} });
      yLabel.position.set(0, 55, 0);
      group.add(yLabel);
      
      // Z axis from (0,0,-50) to (0,0,50)
      const zGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,-50), new THREE.Vector3(0,0,50)]);
      const zAxis = new THREE.Line(zGeom, material);
      group.add(zAxis);
      const zLabel = createTextSprite("Z", { fontsize: 30, textColor: {r:255, g:255, b:255, a:1} });
      zLabel.position.set(0, 0, 55);
      group.add(zLabel);
      
      return group;
    }
    
    // --- Initialization ---
    function init() {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      document.getElementById('container').appendChild(renderer.domElement);
      
      camera.position.set(0, 20, 100);
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      
      // Create our custom white axes group with labels.
      axisGroup = createAxisGroup();
      scene.add(axisGroup);
      
      // Update the magnetic field dropdown initially and when E changes.
      updateBAxisOptions();
      document.getElementById('eAxisSelect').addEventListener('change', updateBAxisOptions);
      
      // Create buffer geometries for the E and B field lines.
      const geometryE = new THREE.BufferGeometry();
      const positionsE = new Float32Array(numPoints * 3);
      geometryE.setAttribute('position', new THREE.BufferAttribute(positionsE, 3));
      
      const geometryB = new THREE.BufferGeometry();
      const positionsB = new Float32Array(numPoints * 3);
      geometryB.setAttribute('position', new THREE.BufferAttribute(positionsB, 3));
      
      lineE = new THREE.Line(geometryE, new THREE.LineBasicMaterial({ color: 0x0000ff }));
      lineB = new THREE.Line(geometryB, new THREE.LineBasicMaterial({ color: 0xff0000 }));
      scene.add(lineE);
      scene.add(lineB);
      
      // Create arrow groups for field vectors (one arrow every 10 points)
      arrowEGroup = new THREE.Group();
      arrowBGroup = new THREE.Group();
      for(let i = 0; i < numPoints; i += 10) {
        // Electric field arrow with label.
        const arrowE = new THREE.ArrowHelper(new THREE.Vector3(0,1,0), new THREE.Vector3(), 1, 0x0000ff);
        arrowEGroup.add(arrowE);
        const labelE = createTextSprite("E", { fontsize: 20, textColor: {r:0, g:0, b:255, a:1} });
        scene.add(labelE);
        arrowE.userData.label = labelE;
        
        // Magnetic field arrow with label.
        const arrowB = new THREE.ArrowHelper(new THREE.Vector3(0,1,0), new THREE.Vector3(), 1, 0xff0000);
        arrowBGroup.add(arrowB);
        const labelB = createTextSprite("B", { fontsize: 20, textColor: {r:255, g:0, b:0, a:1} });
        scene.add(labelB);
        arrowB.userData.label = labelB;
      }
      scene.add(arrowEGroup);
      scene.add(arrowBGroup);
      
      // Velocity arrow (green) with label "v"
      velArrow = new THREE.ArrowHelper(new THREE.Vector3(1,0,0), new THREE.Vector3(0,0,0), 10, 0x00ff00);
      scene.add(velArrow);
      velLabel = createTextSprite("v", { fontsize: 20, textColor: {r:0, g:150, b:0, a:1} });
      scene.add(velLabel);
      
      // Create photon group (yellow spheres representing photon motion)
      photonGroup = new THREE.Group();
      const photonCount = 10;
      const photonSpeed = 1.0; // units per time step
      for (let i = 0; i < photonCount; i++){
        const sphereGeometry = new THREE.SphereGeometry(1, 16, 16);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        // Evenly space initial offsets along [uMin, uMax]
        sphere.userData.offset = (uMax - uMin) * i / photonCount;
        photonGroup.add(sphere);
      }
      scene.add(photonGroup);
      
      // UI controls for toggles.
      document.getElementById('toggleVectorArrows').addEventListener('click', () => {
        showVectorArrows = !showVectorArrows;
        arrowEGroup.visible = showVectorArrows;
        arrowBGroup.visible = showVectorArrows;
        velArrow.visible = showVectorArrows;
      });
      
      document.getElementById('toggleVectorLabels').addEventListener('click', () => {
        showVectorLabels = !showVectorLabels;
        arrowEGroup.children.forEach(arrow => { 
          if(arrow.userData.label) arrow.userData.label.visible = showVectorLabels; 
        });
        arrowBGroup.children.forEach(arrow => { 
          if(arrow.userData.label) arrow.userData.label.visible = showVectorLabels; 
        });
        velLabel.visible = showVectorLabels;
      });
      
      document.getElementById('toggleAxes').addEventListener('click', () => {
        showAxes = !showAxes;
        axisGroup.visible = showAxes;
      });
      
      document.getElementById('pauseResume').addEventListener('click', function(){
        paused = !paused;
        this.textContent = paused ? "Resume" : "Pause";
      });
      
      // Toggle for E wave, B wave, and Photon motion.
      document.getElementById('toggleEWave').addEventListener('change', (e)=>{
        lineE.visible = e.target.checked;
      });
      document.getElementById('toggleBWave').addEventListener('change', (e)=>{
        lineB.visible = e.target.checked;
      });
      document.getElementById('togglePhotonMotion').addEventListener('change', (e)=>{
        photonGroup.visible = e.target.checked;
      });
      
      window.addEventListener('resize', onWindowResize, false);
      
      animate();
    }
    
    function onWindowResize() {
      camera.aspect = window.innerWidth/window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    // --- Animation Loop ---
    function animate() {
      requestAnimationFrame(animate);
      if(!paused) {
        t += 0.05;
        updateWave();
      }
      controls.update();
      renderer.render(scene, camera);
    }
    
    // --- Update Wave Function ---
    function updateWave() {
      // Get current axis selections.
      const eAxis = document.getElementById('eAxisSelect').value;
      const bAxis = document.getElementById('bAxisSelect').value;
      const vAxis = getPropagationAxis(eAxis, bAxis);
      const eIndex = axisIndex(eAxis);
      const bIndex = axisIndex(bAxis);
      const vIndex = axisIndex(vAxis);
      
      // Update field line vertices.
      const posE = lineE.geometry.attributes.position.array;
      const posB = lineB.geometry.attributes.position.array;
      for(let i = 0; i < numPoints; i++) {
        const u = uMin + (uMax - uMin) * i / (numPoints - 1);
        const phase = k * u - ω * t;
        const Evalue = amplitudeE * Math.sin(phase);
        const Bvalue = amplitudeB * Math.sin(phase + Math.PI/2);
        
        // Electric field: u along propagation axis and displacement along eAxis.
        let pointE = [0,0,0];
        pointE[vIndex] = u;
        pointE[eIndex] = Evalue;
        posE[i*3 + 0] = pointE[0];
        posE[i*3 + 1] = pointE[1];
        posE[i*3 + 2] = pointE[2];
        
        // Magnetic field: u along propagation axis and displacement along bAxis.
        let pointB = [0,0,0];
        pointB[vIndex] = u;
        pointB[bIndex] = Bvalue;
        posB[i*3 + 0] = pointB[0];
        posB[i*3 + 1] = pointB[1];
        posB[i*3 + 2] = pointB[2];
      }
      lineE.geometry.attributes.position.needsUpdate = true;
      lineB.geometry.attributes.position.needsUpdate = true;
      
      // Update vector arrows (every 10th point)
      let arrowIndex = 0;
      for(let i = 0; i < numPoints; i += 10) {
        const u = uMin + (uMax - uMin) * i / (numPoints - 1);
        const phase = k * u - ω * t;
        const Evalue = amplitudeE * Math.sin(phase);
        const Bvalue = amplitudeB * Math.sin(phase + Math.PI/2);
        
        // Base position along propagation axis.
        let base = [0,0,0];
        base[vIndex] = u;
        
        // Update E field arrow.
        const arrowE = arrowEGroup.children[arrowIndex];
        const dirE = getAxisVector(eAxis).clone().multiplyScalar(Evalue);
        if(dirE.length() > 0) { dirE.normalize(); }
        arrowE.position.set(base[0], base[1], base[2]);
        arrowE.setDirection(dirE);
        const lenE = Math.abs(Evalue) * 2;
        arrowE.setLength(lenE);
        if(arrowE.userData.label && arrowE.cone) {
          const tipPos = new THREE.Vector3();
          arrowE.cone.getWorldPosition(tipPos);
          arrowE.userData.label.position.copy(tipPos);
        }
        
        // Update B field arrow.
        const arrowB = arrowBGroup.children[arrowIndex];
        const dirB = getAxisVector(bAxis).clone().multiplyScalar(Bvalue);
        if(dirB.length() > 0) { dirB.normalize(); }
        arrowB.position.set(base[0], base[1], base[2]);
        arrowB.setDirection(dirB);
        const lenB = Math.abs(Bvalue) * 2;
        arrowB.setLength(lenB);
        if(arrowB.userData.label && arrowB.cone) {
          const tipPos = new THREE.Vector3();
          arrowB.cone.getWorldPosition(tipPos);
          arrowB.userData.label.position.copy(tipPos);
        }
        arrowIndex++;
      }
      
      // Update the velocity arrow: always along the propagation (v) axis.
      const vDir = getAxisVector(vAxis);
      velArrow.setDirection(vDir);
      const baseV = new THREE.Vector3();
      baseV.setComponent(vIndex, uMin);
      velArrow.position.copy(baseV);
      const vLen = (uMax - uMin) / 4;
      velArrow.setLength(vLen);
      if(velArrow.cone) {
        const tipPos = new THREE.Vector3();
        velArrow.cone.getWorldPosition(tipPos);
        velLabel.position.copy(tipPos);
      }
      
      // --- Highlight Areas ---
      // E field highlight
      if(document.getElementById('highlightEField').checked) {
        let shapeE = new THREE.Shape();
        shapeE.moveTo(uMin, 0);
        for(let i = 0; i < numPoints; i++) {
          const u = uMin + (uMax - uMin) * i / (numPoints - 1);
          const phase = k * u - ω * t;
          const value = amplitudeE * Math.sin(phase);
          shapeE.lineTo(u, value);
        }
        shapeE.lineTo(uMax, 0);
        const geometryShapeE = new THREE.ShapeGeometry(shapeE);
        if(!highlightEMesh) {
          const material = new THREE.MeshBasicMaterial({
            color: 0x0000ff, transparent: true, opacity: 0.3, side: THREE.DoubleSide
          });
          highlightEMesh = new THREE.Mesh(geometryShapeE, material);
          highlightEContainer = new THREE.Object3D();
          highlightEContainer.add(highlightEMesh);
          scene.add(highlightEContainer);
        } else {
          highlightEMesh.geometry.dispose();
          highlightEMesh.geometry = geometryShapeE;
        }
        // Transform the 2D shape (drawn in X–Y) so that X maps to the propagation axis and Y maps to the E field axis.
        const uAxis = getAxisVector(vAxis);
        const fAxis = getAxisVector(eAxis);
        const wAxis = new THREE.Vector3().crossVectors(uAxis, fAxis);
        const matrix = new THREE.Matrix4();
        matrix.makeBasis(uAxis, fAxis, wAxis);
        highlightEContainer.setRotationFromMatrix(matrix);
      } else {
        if(highlightEMesh) {
          scene.remove(highlightEContainer);
          highlightEMesh = null;
          highlightEContainer = null;
        }
      }
      
      // B field highlight
      if(document.getElementById('highlightBField').checked) {
        let shapeB = new THREE.Shape();
        shapeB.moveTo(uMin, 0);
        for(let i = 0; i < numPoints; i++) {
          const u = uMin + (uMax - uMin) * i / (numPoints - 1);
          const phase = k * u - ω * t;
          const value = amplitudeB * Math.sin(phase + Math.PI/2);
          shapeB.lineTo(u, value);
        }
        shapeB.lineTo(uMax, 0);
        const geometryShapeB = new THREE.ShapeGeometry(shapeB);
        if(!highlightBMesh) {
          const material = new THREE.MeshBasicMaterial({
            color: 0xff0000, transparent: true, opacity: 0.3, side: THREE.DoubleSide
          });
          highlightBMesh = new THREE.Mesh(geometryShapeB, material);
          highlightBContainer = new THREE.Object3D();
          highlightBContainer.add(highlightBMesh);
          scene.add(highlightBContainer);
        } else {
          highlightBMesh.geometry.dispose();
          highlightBMesh.geometry = geometryShapeB;
        }
        const uAxis = getAxisVector(vAxis);
        const fAxis = getAxisVector(bAxis);
        const wAxis = new THREE.Vector3().crossVectors(uAxis, fAxis);
        const matrix = new THREE.Matrix4();
        matrix.makeBasis(uAxis, fAxis, wAxis);
        highlightBContainer.setRotationFromMatrix(matrix);
      } else {
        if(highlightBMesh) {
          scene.remove(highlightBContainer);
          highlightBMesh = null;
          highlightBContainer = null;
        }
      }
      
      // --- Update Photon Motion ---
      // The photons (yellow spheres) move along the propagation (v) axis.
      const photonSpeed = 1.0; // units per time step
      photonGroup.children.forEach(photon => {
        let offset = photon.userData.offset;
        let newU = ((offset + t * photonSpeed) % (uMax - uMin));
        if(newU < 0) newU += (uMax - uMin);
        newU = newU + uMin;
        let pos = new THREE.Vector3(0,0,0);
        pos.setComponent(vIndex, newU);
        photon.position.copy(pos);
      });
    }
    
    init();
 
