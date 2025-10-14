// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Improve rendering quality
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Enable anisotropic filtering
const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
console.log('Max anisotropy:', maxAnisotropy);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Lighting setup
const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
scene.add(ambientLight);

// Main directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(0, 8, 8);
directionalLight.target.position.set(0, 0, 0);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
scene.add(directionalLight);
scene.add(directionalLight.target);

// Fill lights for even illumination
const fillLight1 = new THREE.DirectionalLight(0xffffff, 0.4);
fillLight1.position.set(-8, 5, 5);
scene.add(fillLight1);

const fillLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
fillLight2.position.set(8, 5, 5);
scene.add(fillLight2);

// Rim light for better definition
const rimLight = new THREE.PointLight(0x88aaff, 0.6, 30);
rimLight.position.set(0, 0, -8);
scene.add(rimLight);

// Underside fill light for green text pill (active between scroll 2.8x-3.4x)
const undersideLight = new THREE.DirectionalLight(0xffffff, 0.8);
undersideLight.position.set(0, -5, 8);
undersideLight.target.position.set(0, 0, 0);
scene.add(undersideLight);
scene.add(undersideLight.target);

// Variables for animation
let redPillModel = null;
let greenPillTextModel = null;
let greenPillPlainModel = null;
let modelsLoaded = 0;
const clock = new THREE.Clock();
let time = 0;
let scrollY = 0;

// Create debug panel
const DEBUG_MODE = true;

let debugPanel;
let manualOverrides = {};
let lastSection = -1;
let debugLockPill = null; // Lock a pill in scene while debugging

if (DEBUG_MODE) {
    debugPanel = document.createElement('div');
    debugPanel.id = 'debug-panel';
    debugPanel.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: rgba(0, 0, 0, 0.9);
        color: #00ff00;
        padding: 15px;
        font-family: monospace;
        font-size: 12px;
        z-index: 99999;
        border: 1px solid #00ff00;
        min-width: 350px;
        line-height: 1.6;
        max-height: 80vh;
        overflow-y: auto;
        pointer-events: all !important;
        user-select: text;
    `;
    document.body.appendChild(debugPanel);

    // Add CSS to ensure inputs and buttons work
    const style = document.createElement('style');
    style.textContent = `
        #debug-panel * {
            pointer-events: all !important;
            user-select: text !important;
        }
        #debug-panel input,
        #debug-panel button {
            cursor: pointer !important;
        }
    `;
    document.head.appendChild(style);
}

// Helper function to setup pill materials
function setupPillMaterial(model) {
    model.traverse(function(child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // Fix polygon shading issues
            if (child.geometry) {
                child.geometry.computeVertexNormals();
            }

            // Improve material properties for better shading
            if (child.material) {
                child.material = child.material.clone();
                child.material.side = THREE.FrontSide;
                child.material.flatShading = false;
                child.material.metalness = 0.2;
                child.material.roughness = 0.3;
                child.material.transparent = true; // Enable transparency for opacity control

                // Fix texture filtering if textures exist
                if (child.material.map) {
                    child.material.map.minFilter = THREE.LinearMipmapLinearFilter;
                    child.material.map.magFilter = THREE.LinearFilter;
                    child.material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
                    child.material.map.needsUpdate = true;
                }

                // Add better normal mapping if normal map exists
                if (child.material.normalMap) {
                    child.material.normalMap.minFilter = THREE.LinearMipmapLinearFilter;
                    child.material.normalMap.magFilter = THREE.LinearFilter;
                    child.material.normalScale.set(0.5, 0.5);
                }

                // Ensure proper vertex colors if they exist
                if (child.geometry.attributes.color) {
                    child.material.vertexColors = true;
                }

                child.material.needsUpdate = true;
            }
        }
    });
}

// Load GLTF model
const loader = new THREE.GLTFLoader();

// Load red pill with text
loader.load('./assets/pg2/redpill_text.gltf', function(gltf) {
    redPillModel = gltf.scene;
    redPillModel.scale.set(15, 15, 15);
    redPillModel.position.set(0, 0, 0);
    redPillModel.rotation.set(0, 0, 0);
    setupPillMaterial(redPillModel);
    scene.add(redPillModel); // Add to scene initially (will be removed/added dynamically)
    modelsLoaded++;
    if (modelsLoaded === 2) {
        document.getElementById('loading').style.display = 'none';
    }
    console.log('Red pill with text loaded successfully');
}, function(progress) {
    console.log('Red pill loading progress:', (progress.loaded / progress.total * 100) + '%');
}, function(error) {
    console.error('Error loading red pill:', error);
    document.getElementById('loading').textContent = 'Error loading red pill';
});

// Load green pill with text
loader.load('./assets/pg2/greenpill_text.gltf', function(gltf) {
    greenPillTextModel = gltf.scene;
    greenPillTextModel.scale.set(15, 15, 15);
    greenPillTextModel.position.set(0, 0, 0);
    greenPillTextModel.rotation.set(0, 0, 0);
    setupPillMaterial(greenPillTextModel);
    // Add to scene and immediately remove to force GPU compilation
    scene.add(greenPillTextModel);
    renderer.render(scene, camera);
    scene.remove(greenPillTextModel);
    modelsLoaded++;
    if (modelsLoaded === 3) {
        document.getElementById('loading').style.display = 'none';
    }
    console.log('Green pill with text loaded successfully');
}, function(progress) {
    console.log('Green pill (text) loading progress:', (progress.loaded / progress.total * 100) + '%');
}, function(error) {
    console.error('Error loading green pill (text):', error);
    document.getElementById('loading').textContent = 'Error loading green pill (text)';
});

// Load green pill plain (no text)
loader.load('./assets/pg2/greenpill.gltf', function(gltf) {
    greenPillPlainModel = gltf.scene;
    greenPillPlainModel.scale.set(15, 15, 15);
    greenPillPlainModel.position.set(0, 0, 0);
    greenPillPlainModel.rotation.set(0, 0, 0);
    setupPillMaterial(greenPillPlainModel);
    // Add to scene and immediately remove to force GPU compilation
    scene.add(greenPillPlainModel);
    renderer.render(scene, camera);
    scene.remove(greenPillPlainModel);
    modelsLoaded++;
    if (modelsLoaded === 3) {
        document.getElementById('loading').style.display = 'none';
    }
    console.log('Green pill plain loaded successfully');
}, function(progress) {
    console.log('Green pill (plain) loading progress:', (progress.loaded / progress.total * 100) + '%');
}, function(error) {
    console.error('Error loading green pill (plain):', error);
    document.getElementById('loading').textContent = 'Error loading green pill (plain)';
});

// Camera position
camera.position.set(0, 0, 10);
camera.lookAt(0, 0, 0);

// Scroll event listener
window.addEventListener('scroll', function() {
    scrollY = window.pageYOffset;
});

// Interpolation function
function lerp(start, end, factor) {
    return start + (end - start) * factor;
}

// Red pill positions (sections 0-2, fades out at 1.7)
const redPillPositions = [
    // Section 1: A New Pill, A New Approach - Red pill front view
    { y: window.innerHeight * 0, position: { x: 0, y: -1.5, z: 0 }, rotation: { x: 0, y: 0, z: -1.55 }, scale: { x: 100, y: 100, z: 100 }, opacity: 1 },

    // Section 2: The Controversy - Red pill slight rotation
    { y: window.innerHeight * 0.88, position: { x: 0, y: -1.5, z: 0 }, rotation: { x: 3.00, y: 0, z: 1.55 }, scale: { x: 90, y: 90, z: 90 }, opacity: 1 },

    // Fade out point
    { y: window.innerHeight * 1.6, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 30, y: 30, z: 30 }, opacity: 0 }
];

// Green pill with text positions (sections 2-3.5, fades out at 3.5)
const greenPillTextPositions = [
    // Start invisible at section 1.7
    { y: window.innerHeight * 1.6, position: { x: 0, y: 0, z: 0 }, rotation: { x: 1, y: 0, z: 0 }, scale: { x: 30, y: 30, z: 30 }, opacity: 0 },

    // Section 3: Trust is the Real Side Effect - Fade in
    { y: window.innerHeight * 2, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 90, y: 90, z: 90 }, opacity: 1 },

    { y: window.innerHeight * 2.6, position: { x: 0, y: 0, z: -0.56 }, rotation: { x: 1.40, y: 0.00, z: 0.00 }, scale: { x: 90, y: 90, z: 90 }, opacity: 1 },

    // Section 4: Success Isn't Guaranteed - Complete rotation (180 degrees)
    { y: window.innerHeight * 3.2, position: { x: 0, y: 0, z: -1 }, rotation: { x: 3.3, y: 0, z: 0 }, scale: { x: 90, y: 90, z: 90 }, opacity: 1 },

    { y: window.innerHeight * 3.6, position: { x: 0, y: 0, z: -1 }, rotation: { x: 3, y: 0, z: 0 }, scale: { x: 90, y: 90, z: 90 }, opacity: 1 },

    // Fade out at 3.5
    { y: window.innerHeight * 4, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 10, y: 10, z: 10 }, opacity: 0 }
];

// Green pill plain (no text) positions (sections 3.5-8, fades in at 4.0)
const greenPillPlainPositions = [
    // Section 5: The Pill Exists - Fade in
    { y: window.innerHeight * 3.8, position: { x: 0, y: 0, z: 0 }, rotation: { x: 4, y: 4, z: 0 }, scale: { x: 10, y: 10, z: 10 }, opacity: 0},

    // Section 6: The Interest is Real - Green pill continues
    { y: window.innerHeight * 4.7, position: { x: 0, y: 0, z: 0 }, rotation: { x: 2.80, y: 3.24, z: 0.60 }, scale: { x: 15, y: 15, z: 15 }, opacity: 1 },

    { y: window.innerHeight * 5.46, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0.00, y: 0.00, z: 0.80 }, scale: { x: 70, y: 70, z: 70 }, opacity: 1},
    { y: window.innerHeight * 7.6, position: { x: 0, y: 0, z: 0 }, rotation: { x: -0.30, y: 3.14, z: 0.80 }, scale: { x: 70, y: 70, z: 70 }, opacity: 1 },
    { y: window.innerHeight * 8.2, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 6.3, z: 0 }, scale: { x: 50, y: 50, z: 50 }, opacity: 1 }

];

// Helper function to get current section for a specific positions array
function getCurrentSection(scrollY, positionsArray) {
    let currentSection = 0;
    for (let i = positionsArray.length - 1; i >= 0; i--) {
        if (scrollY >= positionsArray[i].y) {
            currentSection = i;
            break;
        }
    }
    return currentSection;
}

// Function to initialize debug panel controls
function initializeDebugPanel(currentSection) {
    const scrollMultiplier = scrollY / window.innerHeight;
    let pillType, positionsArray, adjustedSection;

    if (scrollMultiplier >= 4.0) {
        pillType = 'GREEN PLAIN';
        positionsArray = greenPillPlainPositions;
        adjustedSection = getCurrentSection(scrollY, greenPillPlainPositions);
    } else if (scrollMultiplier >= 1.5) {
        pillType = 'GREEN TEXT';
        positionsArray = greenPillTextPositions;
        adjustedSection = getCurrentSection(scrollY, greenPillTextPositions);
    } else {
        pillType = 'RED';
        positionsArray = redPillPositions;
        adjustedSection = getCurrentSection(scrollY, redPillPositions);
    }

    const sectionMultiplier = positionsArray[adjustedSection] ? (positionsArray[adjustedSection].y / window.innerHeight).toFixed(1) : 0;
    const override = manualOverrides[currentSection] || positionsArray[adjustedSection];

    const pillColor = pillType === 'RED' ? '#D32F2F' : '#4CAF50';

    debugPanel.innerHTML = `
        <strong>PILL 3D DEBUG - PAGE 2</strong><br>
        <strong style="color: ${pillColor};">Editing: ${pillType} PILL</strong><br>
        ───────────────────────<br>
        <div id="debug-info"></div>
        ───────────────────────<br>
        <div id="debug-live"></div>
        ───────────────────────<br>
        <strong>Edit Section ${adjustedSection}:</strong><br>
        <div style="margin: 5px 0;">
            <strong>Position:</strong><br>
            x: <input type="number" id="pos-x" value="${override.position.x}" step="0.1" style="width: 60px; color: #000; padding: 2px;">
            y: <input type="number" id="pos-y" value="${override.position.y}" step="0.1" style="width: 60px; color: #000; padding: 2px;">
            z: <input type="number" id="pos-z" value="${override.position.z}" step="0.1" style="width: 60px; color: #000; padding: 2px;">
        </div>
        <div style="margin: 5px 0;">
            <strong>Rotation:</strong><br>
            x: <input type="number" id="rot-x" value="${override.rotation.x.toFixed(2)}" step="0.1" style="width: 60px; color: #000; padding: 2px;">
            y: <input type="number" id="rot-y" value="${override.rotation.y.toFixed(2)}" step="0.1" style="width: 60px; color: #000; padding: 2px;">
            z: <input type="number" id="rot-z" value="${override.rotation.z.toFixed(2)}" step="0.1" style="width: 60px; color: #000; padding: 2px;">
        </div>
        <div style="margin: 5px 0;">
            <strong>Scale:</strong><br>
            x: <input type="number" id="scale-x" value="${override.scale.x}" step="1" style="width: 60px; color: #000; padding: 2px;">
            y: <input type="number" id="scale-y" value="${override.scale.y}" step="1" style="width: 60px; color: #000; padding: 2px;">
            z: <input type="number" id="scale-z" value="${override.scale.z}" step="1" style="width: 60px; color: #000; padding: 2px;">
        </div>
        <button id="apply-changes" style="margin-top: 10px; padding: 5px 10px; background: #00ff00; color: #000; border: none; cursor: pointer; font-weight: bold;">Apply Changes</button>
        <button id="reset-section" style="margin-top: 10px; padding: 5px 10px; background: #ff0000; color: #fff; border: none; cursor: pointer; font-weight: bold; margin-left: 5px;">Reset</button>
        <button id="copy-values" style="margin-top: 10px; padding: 5px 10px; background: #0088ff; color: #fff; border: none; cursor: pointer; font-weight: bold; margin-left: 5px;">Copy Code</button>
    `;

    // Add event listeners
    document.getElementById('apply-changes').addEventListener('click', () => {
        const scrollMultiplier = scrollY / window.innerHeight;
        let positionsArray, adjustedSection, lockType;

        if (scrollMultiplier >= 4.0) {
            positionsArray = greenPillPlainPositions;
            adjustedSection = getCurrentSection(scrollY, greenPillPlainPositions);
            lockType = 'greenplain';
        } else if (scrollMultiplier >= 1.5) {
            positionsArray = greenPillTextPositions;
            adjustedSection = getCurrentSection(scrollY, greenPillTextPositions);
            lockType = 'greentext';
        } else {
            positionsArray = redPillPositions;
            adjustedSection = getCurrentSection(scrollY, redPillPositions);
            lockType = 'red';
        }

        const newOverride = {
            y: positionsArray[adjustedSection].y,
            position: {
                x: parseFloat(document.getElementById('pos-x').value),
                y: parseFloat(document.getElementById('pos-y').value),
                z: parseFloat(document.getElementById('pos-z').value)
            },
            rotation: {
                x: parseFloat(document.getElementById('rot-x').value),
                y: parseFloat(document.getElementById('rot-y').value),
                z: parseFloat(document.getElementById('rot-z').value)
            },
            scale: {
                x: parseFloat(document.getElementById('scale-x').value),
                y: parseFloat(document.getElementById('scale-y').value),
                z: parseFloat(document.getElementById('scale-z').value)
            },
            opacity: positionsArray[adjustedSection].opacity
        };
        manualOverrides[currentSection] = newOverride;
        positionsArray[adjustedSection] = newOverride;

        // Lock the pill being edited in the scene
        debugLockPill = lockType;

        console.log('Applied changes to', lockType.toUpperCase(), 'pill section', adjustedSection, newOverride);
    });

    document.getElementById('reset-section').addEventListener('click', () => {
        delete manualOverrides[currentSection];
        location.reload();
    });

    document.getElementById('copy-values').addEventListener('click', () => {
        const posX = parseFloat(document.getElementById('pos-x').value);
        const posY = parseFloat(document.getElementById('pos-y').value);
        const posZ = parseFloat(document.getElementById('pos-z').value);
        const rotX = parseFloat(document.getElementById('rot-x').value);
        const rotY = parseFloat(document.getElementById('rot-y').value);
        const rotZ = parseFloat(document.getElementById('rot-z').value);
        const scaleX = parseFloat(document.getElementById('scale-x').value);
        const scaleY = parseFloat(document.getElementById('scale-y').value);
        const scaleZ = parseFloat(document.getElementById('scale-z').value);

        const code = `{ y: window.innerHeight * ${sectionMultiplier}, position: { x: ${posX}, y: ${posY}, z: ${posZ} }, rotation: { x: ${rotX.toFixed(2)}, y: ${rotY.toFixed(2)}, z: ${rotZ.toFixed(2)} }, scale: { x: ${scaleX}, y: ${scaleY}, z: ${scaleZ} }, opacity: ${override.opacity} }`;
        navigator.clipboard.writeText(code);
        alert('Code copied to clipboard!');
    });

    lastSection = currentSection;
}

// Function to update debug panel (only updates dynamic values)
function updateDebugPanel(redInterpolated, greenTextInterpolated, greenPlainInterpolated, scrollY) {
    if (!DEBUG_MODE) return;

    const scrollMultiplier = scrollY / window.innerHeight;
    let currentPillType, positionsArray, interpolated;

    if (scrollMultiplier >= 4.0) {
        currentPillType = 'GREEN PLAIN';
        positionsArray = greenPillPlainPositions;
        interpolated = greenPlainInterpolated;
    } else if (scrollMultiplier >= 1.5) {
        currentPillType = 'GREEN TEXT';
        positionsArray = greenPillTextPositions;
        interpolated = greenTextInterpolated;
    } else {
        currentPillType = 'RED';
        positionsArray = redPillPositions;
        interpolated = redInterpolated;
    }

    const currentSection = getCurrentSection(scrollY, positionsArray);

    // Only rebuild the panel if section changed
    if (currentSection !== lastSection) {
        initializeDebugPanel(currentSection);
    }

    const sectionMultiplier = positionsArray[currentSection] ? (positionsArray[currentSection].y / window.innerHeight).toFixed(1) : 0;
    const currentScrollMultiplier = (scrollY / window.innerHeight).toFixed(2);

    // Update only the dynamic info
    const infoDiv = document.getElementById('debug-info');
    if (infoDiv) {
        infoDiv.innerHTML = `
            Scroll Y: ${scrollY.toFixed(0)}px<br>
            Current Scroll Multiplier: ${currentScrollMultiplier}x<br>
            Current Section: ${currentSection}<br>
            Section Multiplier: ${sectionMultiplier}x<br>
            Window Height: ${window.innerHeight}px<br>
            Active Pill: ${currentPillType}<br>
            Red In Scene: ${redPillModel && redPillModel.parent === scene ? 'YES' : 'NO'}<br>
            Green Text In Scene: ${greenPillTextModel && greenPillTextModel.parent === scene ? 'YES' : 'NO'}<br>
            Green Plain In Scene: ${greenPillPlainModel && greenPillPlainModel.parent === scene ? 'YES' : 'NO'}<br>
            ${debugLockPill ? `<strong style="color: #FFD600;">⚠ LOCKED: ${debugLockPill.toUpperCase()} PILL</strong>` : ''}
        `;
    }

    const liveDiv = document.getElementById('debug-live');
    if (liveDiv) {
        liveDiv.innerHTML = `
            <strong>Live Values (${currentPillType}):</strong><br>
            Position: (${interpolated.position.x.toFixed(2)}, ${interpolated.position.y.toFixed(2)}, ${interpolated.position.z.toFixed(2)})<br>
            Rotation: (${interpolated.rotation.x.toFixed(2)}, ${interpolated.rotation.y.toFixed(2)}, ${interpolated.rotation.z.toFixed(2)})<br>
            Scale: (${interpolated.scale.x.toFixed(2)}, ${interpolated.scale.y.toFixed(2)}, ${interpolated.scale.z.toFixed(2)})<br>
            Opacity: ${interpolated.opacity.toFixed(2)}
        `;
    }
}

// Get interpolated values based on scroll position for a specific positions array
function getInterpolatedValues(scrollY, positionsArray) {
    // Check if scroll is before the first position (return first position)
    if (scrollY < positionsArray[0].y) {
        return positionsArray[0];
    }

    // Find the current section
    let currentSection = getCurrentSection(scrollY, positionsArray);

    // If we're at the last section, return its values
    if (currentSection >= positionsArray.length - 1) {
        return positionsArray[positionsArray.length - 1];
    }

    // Calculate interpolation factor
    const current = positionsArray[currentSection];
    const next = positionsArray[currentSection + 1];
    const progress = (scrollY - current.y) / (next.y - current.y);
    const smoothProgress = Math.min(Math.max(progress, 0), 1);

    // Apply easing function for smoother transitions
    const eased = smoothProgress * smoothProgress * (3 - 2 * smoothProgress);

    return {
        position: {
            x: lerp(current.position.x, next.position.x, eased),
            y: lerp(current.position.y, next.position.y, eased),
            z: lerp(current.position.z, next.position.z, eased)
        },
        rotation: {
            x: lerp(current.rotation.x, next.rotation.x, eased),
            y: lerp(current.rotation.y, next.rotation.y, eased),
            z: lerp(current.rotation.z, next.rotation.z, eased)
        },
        scale: {
            x: lerp(current.scale.x, next.scale.x, eased),
            y: lerp(current.scale.y, next.scale.y, eased),
            z: lerp(current.scale.z, next.scale.z, eased)
        },
        opacity: lerp(current.opacity, next.opacity, eased)
    };
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    time += delta;

    // Calculate scroll multiplier
    const scrollMultiplier = scrollY / window.innerHeight;

    // Determine which pill should be active based on scroll
    const shouldShowRed = scrollMultiplier <= 2.0;
    const shouldShowGreenText = scrollMultiplier >= 1.5 && scrollMultiplier <= 4.1;
    const shouldShowGreenPlain = scrollMultiplier >= 4.0;

    // Breathing effect calculation (shared)
    const breathingScale = 1 + Math.sin(time * 2) * 0.02;

    let redInterpolated, greenTextInterpolated, greenPlainInterpolated;

    // Animate red pill (visible in sections 0-2)
    if (redPillModel) {
        // Control visibility and scene presence based on scroll position
        const isLockedInDebug = debugLockPill === 'red';

        if (!shouldShowRed && !isLockedInDebug) {
            // Remove from scene when not needed (unless locked in debug)
            if (redPillModel.parent === scene) {
                scene.remove(redPillModel);
            }
        } else {
            // Add to scene when needed or locked in debug
            if (redPillModel.parent !== scene) {
                scene.add(redPillModel);
            }

            // Only calculate interpolation if the pill is visible
            redInterpolated = getInterpolatedValues(scrollY, redPillPositions);

            // Apply scroll-based position and rotation with subtle floating animation
            redPillModel.position.x = redInterpolated.position.x + Math.cos(time * 1) * 0.1;
            redPillModel.position.y = redInterpolated.position.y + Math.sin(time * 1.5) * 0.15;
            redPillModel.position.z = redInterpolated.position.z;

            redPillModel.rotation.x = redInterpolated.rotation.x + Math.sin(time * 0.5) * 0.05;
            redPillModel.rotation.y = redInterpolated.rotation.y + Math.cos(time * 0.8) * 0.05;
            redPillModel.rotation.z = redInterpolated.rotation.z + Math.sin(time * 0.3) * 0.03;

            // Apply scroll-based scale with subtle breathing effect
            redPillModel.scale.x = redInterpolated.scale.x * breathingScale;
            redPillModel.scale.y = redInterpolated.scale.y * breathingScale;
            redPillModel.scale.z = redInterpolated.scale.z * breathingScale;

            // Apply opacity
            redPillModel.traverse(function(child) {
                if (child.isMesh && child.material) {
                    child.material.opacity = redInterpolated.opacity;
                }
            });
        }
    }

    // Animate green pill with text (visible in sections 2-3.5)
    if (greenPillTextModel) {
        // Control visibility and scene presence based on scroll position
        const isLockedInDebug = debugLockPill === 'greentext';

        if (!shouldShowGreenText && !isLockedInDebug) {
            // Remove from scene when not needed (unless locked in debug)
            if (greenPillTextModel.parent === scene) {
                scene.remove(greenPillTextModel);
            }
        } else {
            // Add to scene when needed or locked in debug
            if (greenPillTextModel.parent !== scene) {
                scene.add(greenPillTextModel);
            }

            // Only calculate interpolation if the pill is visible
            greenTextInterpolated = getInterpolatedValues(scrollY, greenPillTextPositions);

            // Apply scroll-based position and rotation with subtle floating animation
            greenPillTextModel.position.x = greenTextInterpolated.position.x + Math.cos(time * 1) * 0.1;
            greenPillTextModel.position.y = greenTextInterpolated.position.y + Math.sin(time * 1.5) * 0.15;
            greenPillTextModel.position.z = greenTextInterpolated.position.z;

            greenPillTextModel.rotation.x = greenTextInterpolated.rotation.x + Math.sin(time * 0.5) * 0.05;
            greenPillTextModel.rotation.y = greenTextInterpolated.rotation.y + Math.cos(time * 0.8) * 0.05;
            greenPillTextModel.rotation.z = greenTextInterpolated.rotation.z + Math.sin(time * 0.3) * 0.03;

            // Apply scroll-based scale with subtle breathing effect
            greenPillTextModel.scale.x = greenTextInterpolated.scale.x * breathingScale;
            greenPillTextModel.scale.y = greenTextInterpolated.scale.y * breathingScale;
            greenPillTextModel.scale.z = greenTextInterpolated.scale.z * breathingScale;

            // Apply opacity
            greenPillTextModel.traverse(function(child) {
                if (child.isMesh && child.material) {
                    child.material.opacity = greenTextInterpolated.opacity;
                }
            });
        }
    }

    // Animate green pill plain (visible in sections 3.5-8)
    if (greenPillPlainModel) {
        // Control visibility and scene presence based on scroll position
        const isLockedInDebug = debugLockPill === 'greenplain';

        if (!shouldShowGreenPlain && !isLockedInDebug) {
            // Remove from scene when not needed (unless locked in debug)
            if (greenPillPlainModel.parent === scene) {
                scene.remove(greenPillPlainModel);
            }
        } else {
            // Add to scene when needed or locked in debug
            if (greenPillPlainModel.parent !== scene) {
                scene.add(greenPillPlainModel);
            }

            // Only calculate interpolation if the pill is visible
            greenPlainInterpolated = getInterpolatedValues(scrollY, greenPillPlainPositions);

            // Apply scroll-based position and rotation with subtle floating animation
            greenPillPlainModel.position.x = greenPlainInterpolated.position.x + Math.cos(time * 1) * 0.1;
            greenPillPlainModel.position.y = greenPlainInterpolated.position.y + Math.sin(time * 1.5) * 0.15;
            greenPillPlainModel.position.z = greenPlainInterpolated.position.z;

            greenPillPlainModel.rotation.x = greenPlainInterpolated.rotation.x + Math.sin(time * 0.5) * 0.05;
            greenPillPlainModel.rotation.y = greenPlainInterpolated.rotation.y + Math.cos(time * 0.8) * 0.05;
            greenPillPlainModel.rotation.z = greenPlainInterpolated.rotation.z + Math.sin(time * 0.3) * 0.03;

            // Apply scroll-based scale with subtle breathing effect
            greenPillPlainModel.scale.x = greenPlainInterpolated.scale.x * breathingScale;
            greenPillPlainModel.scale.y = greenPlainInterpolated.scale.y * breathingScale;
            greenPillPlainModel.scale.z = greenPlainInterpolated.scale.z * breathingScale;

            // Apply opacity
            greenPillPlainModel.traverse(function(child) {
                if (child.isMesh && child.material) {
                    child.material.opacity = greenPlainInterpolated.opacity;
                }
            });
        }
    }

    // Update debug panel (only calculate interpolated values if needed for debug)
    if (DEBUG_MODE) {
        if (!redInterpolated) redInterpolated = getInterpolatedValues(scrollY, redPillPositions);
        if (!greenTextInterpolated) greenTextInterpolated = getInterpolatedValues(scrollY, greenPillTextPositions);
        if (!greenPlainInterpolated) greenPlainInterpolated = getInterpolatedValues(scrollY, greenPillPlainPositions);
        updateDebugPanel(redInterpolated, greenTextInterpolated, greenPlainInterpolated, scrollY);
    }

    // Update lights to follow the active pill
    let activePill = null;
    if (scrollMultiplier >= 4.0 && greenPillPlainModel && greenPillPlainModel.parent === scene) {
        activePill = greenPillPlainModel;
    } else if (scrollMultiplier >= 1.5 && greenPillTextModel && greenPillTextModel.parent === scene) {
        activePill = greenPillTextModel;
    } else if (redPillModel && redPillModel.parent === scene) {
        activePill = redPillModel;
    }

    if (activePill) {
        directionalLight.target.position.x = activePill.position.x;
        directionalLight.target.position.y = activePill.position.y;
        directionalLight.target.position.z = activePill.position.z;

        rimLight.position.x = activePill.position.x;
        rimLight.position.y = activePill.position.y;
        rimLight.position.z = activePill.position.z - 8;
    }

    // Control underside light intensity based on scroll position (2.8x-3.4x)
    if (scrollMultiplier >= 2.8 && scrollMultiplier <= 3.6) {
        // Fade in at 2.8, full at 2.9, fade out at 3.4
        let intensity;
        if (scrollMultiplier < 2.9) {
            intensity = (scrollMultiplier - 2.8) / 0.1; // Fade in from 2.8 to 2.9
        } else if (scrollMultiplier > 3.3) {
            intensity = (3.6 - scrollMultiplier) / 0.1; // Fade out from 3.3 to 3.4
        } else {
            intensity = 1; // Full intensity between 2.9 and 3.3
        }
        undersideLight.intensity = intensity * 0.8;

        // Follow the green text pill if it's active
        if (greenPillTextModel && greenPillTextModel.parent === scene) {
            undersideLight.target.position.x = greenPillTextModel.position.x;
            undersideLight.target.position.y = greenPillTextModel.position.y;
            undersideLight.target.position.z = greenPillTextModel.position.z;
        }
    } else {
        undersideLight.intensity = 0;
    }

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Update red pill scroll positions based on new window height
    redPillPositions[0].y = window.innerHeight * 0;
    redPillPositions[1].y = window.innerHeight * 0.88;
    redPillPositions[2].y = window.innerHeight * 1.7;

    // Update green pill with text scroll positions based on new window height
    greenPillTextPositions[0].y = window.innerHeight * 1.7;
    greenPillTextPositions[1].y = window.innerHeight * 2;
    greenPillTextPositions[2].y = window.innerHeight * 3.2;
    greenPillTextPositions[3].y = window.innerHeight * 3.5;

    // Update green pill plain scroll positions based on new window height
    greenPillPlainPositions[0].y = window.innerHeight * 3.5;
    greenPillPlainPositions[1].y = window.innerHeight * 4;
    greenPillPlainPositions[2].y = window.innerHeight * 5;
    greenPillPlainPositions[3].y = window.innerHeight * 6;
    greenPillPlainPositions[4].y = window.innerHeight * 7;

    // Refresh GSAP ScrollTrigger if available
    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
    }
});

// Start animation
animate();
