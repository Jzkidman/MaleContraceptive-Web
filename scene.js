// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Improve rendering quality to eliminate visual artifacts
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Enable anisotropic filtering
const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
console.log('Max anisotropy:', maxAnisotropy);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Lighting setup
const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
scene.add(ambientLight);

// Main directional light - centered and closer
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(0, 8, 8);
directionalLight.target.position.set(-2, 0, 0); // Target the pill's general area
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
rimLight.position.set(-2, 0, -8);
scene.add(rimLight);

// Variables for animation
let blueRoundModel = null;
let blueTextModel = null;
let redPillModel = null;
let whitePillModel = null;
let sceneModelsLoaded = 0;
let mixer = null;
const clock = new THREE.Clock();

// Mobile scaling factor
let mobileScaleFactor = 1;
let mobileMovementFactor = 1;
function updateMobileScaleFactor() {
    if (window.innerWidth <= 768) {
        mobileScaleFactor = window.innerWidth / 768;
        mobileMovementFactor = 0.3; // Reduce x-axis movement to 30% on mobile
    } else {
        mobileScaleFactor = 1;
        mobileMovementFactor = 1;
    }
}
updateMobileScaleFactor();

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

// Load non-text blue pill
loader.load('./assets/blueRound.gltf', function(gltf) {
    blueRoundModel = gltf.scene;
    blueRoundModel.scale.set(20, 20, 20);
    blueRoundModel.position.set(-2, 0, 0);
    setupPillMaterial(blueRoundModel);
    scene.add(blueRoundModel);
    sceneModelsLoaded++;
    if (sceneModelsLoaded === 1) {
        document.getElementById('loading').style.display = 'none';
    }
    console.log('Blue pill (no text) loaded successfully');
}, function(progress) {
    console.log('Blue pill loading progress:', (progress.loaded / progress.total * 100) + '%');
}, function(error) {
    console.error('Error loading blue pill:', error);
    document.getElementById('loading').textContent = 'Error loading 3D model';
});

// Load text blue pill
loader.load('./assets/bluetext.gltf', function(gltf) {
    blueTextModel = gltf.scene;
    blueTextModel.scale.set(20, 20, 20);
    blueTextModel.position.set(-2, 0, 0);
    setupPillMaterial(blueTextModel);
    // Add to scene and immediately remove to force GPU compilation
    scene.add(blueTextModel);
    renderer.render(scene, camera);
    scene.remove(blueTextModel);
    sceneModelsLoaded++;
    console.log('Blue pill with text loaded successfully');
}, function(progress) {
    console.log('Blue pill (text) loading progress:', (progress.loaded / progress.total * 100) + '%');
}, function(error) {
    console.error('Error loading blue pill (text):', error);
});

// Load red pill
loader.load('./assets/RedLong.gltf', function(gltf) {
    redPillModel = gltf.scene;
    redPillModel.scale.set(5, 5, 5);
    redPillModel.position.set(-8, 1, 0);
    redPillModel.rotation.set(0, 0, -0.5);
    setupPillMaterial(redPillModel);
    scene.add(redPillModel);
    sceneModelsLoaded++;
    console.log('Red pill loaded successfully');
}, function(progress) {
    console.log('Red pill loading progress:', (progress.loaded / progress.total * 100) + '%');
}, function(error) {
    console.error('Error loading red pill:', error);
});

// Load white pill
loader.load('./assets/longWhite.gltf', function(gltf) {
    whitePillModel = gltf.scene;
    whitePillModel.scale.set(5, 5, 5);
    whitePillModel.position.set(4, 1, 0);
    whitePillModel.rotation.set(0, 0, 0.5);
    setupPillMaterial(whitePillModel);
    scene.add(whitePillModel);
    sceneModelsLoaded++;
    console.log('White pill loaded successfully');
}, function(progress) {
    console.log('White pill loading progress:', (progress.loaded / progress.total * 100) + '%');
}, function(error) {
    console.error('Error loading white pill:', error);
});

// Camera position
camera.position.set(0, 0, 10);
camera.lookAt(-2, 0, 0);

// Animation variables
let time = 0;
let scrollY = 0;

const DEBUG_MODE = true;

let debugPanel;
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

// Store manual overrides for current section
let manualOverrides = {};
let lastSection = -1;
let isInteracting = false;

// Define scroll-based positions for each section
const scrollPositions = [
    { y: window.innerHeight * 0.0, position: { x: -2, y: 0, z: 0 }, rotation: { x: 0.00, y: 3.5, z: 1.00 }, scale: { x: 5, y: 5, z: 5 } },
    { y: window.innerHeight * 1.2, position: { x: -2, y: 0, z: 0 }, rotation: { x: 0, y: 0.5, z: 3 }, scale: { x: 12, y: 12, z: 12 } },
    { y: window.innerHeight * 2.35, position: { x: -2, y: 0, z: 0 }, rotation: { x: 0, y: -3, z: 0 }, scale: { x: 5, y: 5, z: 5 } },
    { y: window.innerHeight * 3.10, position: { x: -2, y: 0, z: 0 }, rotation: { x: 0, y: 0.20, z: 0 }, scale: { x: 35, y: 35, z: 35 } },
    { y: window.innerHeight * 4.12, position: { x: 4, y: 0, z: 1 }, rotation: { x: -0.74, y: 2.51, z: 0.63 }, scale: { x: 15, y: 15, z: 15 } },
    { y: window.innerHeight * 5.31, position: { x: -10.5, y: -1.5, z: 0 }, rotation: { x: -0.3, y: -0.1, z: 0 }, scale: { x: 25, y: 25, z: 25 } },
    { y: window.innerHeight * 5.86, position: { x: -2.5, y: 1, z: -0.5 }, rotation: { x: 2.90, y: 2.50, z: 2.00 }, scale: { x: 8, y: 8, z: 8 } },
    { y: window.innerHeight * 6.5, position: { x: -2, y: 0, z: -0.5 }, rotation: { x: 2.9, y: -0.4, z: 0.1 }, scale: { x: 25, y: 25, z: 25 } },
    { y: window.innerHeight * 8, position: { x: -2, y: 0, z: -0.5 }, rotation: { x: 2.9, y: -3.5, z: 0.1 }, scale: { x: 25, y: 25, z: 25 } }
];

// Define scroll-based positions for red and white pills
const redPillPositions = [
    { y: window.innerHeight * 0.0, position: { x: -4, y: 1, z: 0 }, rotation: { x: 0, y: 0, z: -0.5 }, scale: { x: 5.5, y: 5.5, z: 5.5 } },
    { y: window.innerHeight * 0.35, position: { x: -30, y: 4, z: 0 }, rotation: { x: -1, y: -2, z: -2.5 }, scale: { x: 3, y: 3, z: 3 } }
];

const whitePillPositions = [
    { y: window.innerHeight * 0.0, position: { x: 0, y: 1, z: 0 }, rotation: { x: 0, y: 0, z: 0.5 }, scale: { x: 6, y: 6, z: 6 } },
    { y: window.innerHeight * 0.35, position: { x: 15, y: 4, z: 0 }, rotation: { x: 1, y: 2, z: 2.5 }, scale: { x: 3, y: 3, z: 3 } }
];

// Function to initialize debug panel controls
function initializeDebugPanel(currentSection) {
    const sectionMultiplier = scrollPositions[currentSection] ? (scrollPositions[currentSection].y / window.innerHeight).toFixed(1) : 0;
    const override = manualOverrides[currentSection] || scrollPositions[currentSection];

    debugPanel.innerHTML = `
        <strong>PILL 3D DEBUG</strong><br>
        ───────────────────────<br>
        <div id="debug-info"></div>
        ───────────────────────<br>
        <div id="debug-live"></div>
        ───────────────────────<br>
        <strong>Edit Section ${currentSection}:</strong><br>
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

    // Add event listeners once
    document.getElementById('apply-changes').addEventListener('click', () => {
        const newOverride = {
            y: scrollPositions[currentSection].y,
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
            }
        };
        manualOverrides[currentSection] = newOverride;
        scrollPositions[currentSection] = newOverride;
        console.log('Applied changes to section', currentSection, newOverride);
    });

    document.getElementById('reset-section').addEventListener('click', () => {
        delete manualOverrides[currentSection];
        location.reload();
    });

    document.getElementById('copy-values').addEventListener('click', () => {
        const code = `{ y: window.innerHeight * ${sectionMultiplier}, position: { x: ${override.position.x}, y: ${override.position.y}, z: ${override.position.z} }, rotation: { x: ${override.rotation.x.toFixed(2)}, y: ${override.rotation.y.toFixed(2)}, z: ${override.rotation.z.toFixed(2)} }, scale: { x: ${override.scale.x}, y: ${override.scale.y}, z: ${override.scale.z} } }`;
        navigator.clipboard.writeText(code);
        alert('Code copied to clipboard!');
    });

    lastSection = currentSection;
}

// Function to update debug panel (only updates dynamic values)
function updateDebugPanel(interpolated, scrollY) {
    if (!DEBUG_MODE) return;

    const currentSection = getCurrentSection(scrollY);

    // Only rebuild the panel if section changed
    if (currentSection !== lastSection) {
        initializeDebugPanel(currentSection);
    }

    const sectionMultiplier = scrollPositions[currentSection] ? (scrollPositions[currentSection].y / window.innerHeight).toFixed(1) : 0;
    const currentScrollMultiplier = (scrollY / window.innerHeight).toFixed(2);

    // Update only the dynamic info
    const infoDiv = document.getElementById('debug-info');
    if (infoDiv) {
        infoDiv.innerHTML = `
            Scroll Y: ${scrollY.toFixed(0)}px<br>
            Current Scroll Multiplier: ${currentScrollMultiplier}x<br>
            Current Section: ${currentSection}<br>
            Section Multiplier: ${sectionMultiplier}x<br>
            Window Height: ${window.innerHeight}px
        `;
    }

    const liveDiv = document.getElementById('debug-live');
    if (liveDiv) {
        liveDiv.innerHTML = `
            <strong>Live Values:</strong><br>
            Position: (${interpolated.position.x.toFixed(2)}, ${interpolated.position.y.toFixed(2)}, ${interpolated.position.z.toFixed(2)})<br>
            Rotation: (${interpolated.rotation.x.toFixed(2)}, ${interpolated.rotation.y.toFixed(2)}, ${interpolated.rotation.z.toFixed(2)})<br>
            Scale: (${interpolated.scale.x.toFixed(2)}, ${interpolated.scale.y.toFixed(2)}, ${interpolated.scale.z.toFixed(2)})
        `;
    }
}

// Helper function to get current section
function getCurrentSection(scrollY) {
    let currentSection = 0;
    for (let i = scrollPositions.length - 1; i >= 0; i--) {
        if (scrollY >= scrollPositions[i].y) {
            currentSection = i;
            break;
        }
    }
    return currentSection;
}

// Scroll event listener
window.addEventListener('scroll', function() {
    scrollY = window.pageYOffset;
});

// Interpolation function
function lerp(start, end, factor) {
    return start + (end - start) * factor;
}

// Get interpolated values based on scroll position
function getInterpolatedValues(scrollY) {
    // Find the current section
    let currentSection = 0;
    for (let i = scrollPositions.length - 1; i >= 0; i--) {
        if (scrollY >= scrollPositions[i].y) {
            currentSection = i;
            break;
        }
    }

    // If we're at the last section, return its values
    if (currentSection >= scrollPositions.length - 1) {
        return scrollPositions[scrollPositions.length - 1];
    }

    // Calculate interpolation factor
    const current = scrollPositions[currentSection];
    const next = scrollPositions[currentSection + 1];
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
        }
    };
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    time += delta;

    // Calculate scroll multiplier
    const scrollMultiplier = scrollY / window.innerHeight;

    // Determine which blue pill should be visible
    const shouldShowTextPill = scrollMultiplier >= 2.65 && scrollMultiplier <= 4.15;

    // Breathing effect calculation (shared)
    const breathingScale = 1 + Math.sin(time * 2) * 0.02;

    // Get interpolated values based on scroll
    const interpolated = getInterpolatedValues(scrollY);

    // Update debug panel
    updateDebugPanel(interpolated, scrollY);

    // Manage blue round pill visibility
    if (blueRoundModel) {
        if (shouldShowTextPill) {
            // Hide round pill when text pill should be visible
            if (blueRoundModel.parent === scene) {
                scene.remove(blueRoundModel);
            }
        } else {
            // Show round pill
            if (blueRoundModel.parent !== scene) {
                scene.add(blueRoundModel);
            }

            // Apply scroll-based position and rotation with mobile adjustment
            // Keep -2 as center, only scale the deviation from center
            const centerX = -2;
            const deviationFromCenter = (interpolated.position.x - centerX) * mobileMovementFactor;
            const floatingXOffset = Math.cos(time * 1) * 0.1 * mobileMovementFactor;
            blueRoundModel.position.x = centerX + deviationFromCenter + floatingXOffset;
            blueRoundModel.position.y = interpolated.position.y + Math.sin(time * 1.5) * 0.15;
            blueRoundModel.position.z = interpolated.position.z;

            blueRoundModel.rotation.x = interpolated.rotation.x + Math.sin(time * 0.5) * 0.05;
            blueRoundModel.rotation.y = interpolated.rotation.y + Math.cos(time * 0.8) * 0.05;
            blueRoundModel.rotation.z = interpolated.rotation.z + Math.sin(time * 0.3) * 0.03;

            // Apply scroll-based scale with subtle breathing effect and mobile scaling
            blueRoundModel.scale.x = interpolated.scale.x * breathingScale * mobileScaleFactor;
            blueRoundModel.scale.y = interpolated.scale.y * breathingScale * mobileScaleFactor;
            blueRoundModel.scale.z = interpolated.scale.z * breathingScale * mobileScaleFactor;
        }
    }

    // Manage blue text pill visibility
    if (blueTextModel) {
        if (!shouldShowTextPill) {
            // Hide text pill when round pill should be visible
            if (blueTextModel.parent === scene) {
                scene.remove(blueTextModel);
            }
        } else {
            // Show text pill
            if (blueTextModel.parent !== scene) {
                scene.add(blueTextModel);
            }

            // Apply scroll-based position and rotation with mobile adjustment
            // Keep -2 as center, only scale the deviation from center
            const centerX = -2;
            const deviationFromCenter = (interpolated.position.x - centerX) * mobileMovementFactor;
            const floatingXOffset = Math.cos(time * 1) * 0.1 * mobileMovementFactor;
            blueTextModel.position.x = centerX + deviationFromCenter + floatingXOffset;
            blueTextModel.position.y = interpolated.position.y + Math.sin(time * 1.5) * 0.15;
            blueTextModel.position.z = interpolated.position.z;

            blueTextModel.rotation.x = interpolated.rotation.x + Math.sin(time * 0.5) * 0.05;
            blueTextModel.rotation.y = interpolated.rotation.y + Math.cos(time * 0.8) * 0.05;
            blueTextModel.rotation.z = interpolated.rotation.z + Math.sin(time * 0.3) * 0.03;

            // Apply scroll-based scale with subtle breathing effect and mobile scaling
            blueTextModel.scale.x = interpolated.scale.x * breathingScale * mobileScaleFactor;
            blueTextModel.scale.y = interpolated.scale.y * breathingScale * mobileScaleFactor;
            blueTextModel.scale.z = interpolated.scale.z * breathingScale * mobileScaleFactor;
        }
    }

    // Update directional light target to follow the active blue pill
    const activeBluePill = shouldShowTextPill ? blueTextModel : blueRoundModel;
    if (activeBluePill && activeBluePill.parent === scene) {
        directionalLight.target.position.x = activeBluePill.position.x;
        directionalLight.target.position.y = activeBluePill.position.y;
        directionalLight.target.position.z = activeBluePill.position.z;

        // Update rim light position to maintain consistent backlighting
        rimLight.position.x = activeBluePill.position.x;
        rimLight.position.y = activeBluePill.position.y;
        rimLight.position.z = activeBluePill.position.z - 8;
    }

    // Sync home-content with pill wobble and movement
    const homeContent = document.querySelector('#home .home-content');
    if (homeContent && scrollY < window.innerHeight * 0.35) {
        const wobbleX = Math.cos(time * 1) * 0.1;
        const wobbleY = Math.sin(time * 1.5) * 0.15;
        const currentScale = interpolated.scale.x * breathingScale / 100; // Normalize scale

        homeContent.style.transform = `
            rotate(30deg)
            translate(${wobbleX * 50}px, ${wobbleY * 50}px)
            scale(${currentScale})
        `;
    }

    // Animate red pill based on scroll
    if (redPillModel) {
        if (scrollY < redPillPositions[1].y) {
            // Show red pill
            if (redPillModel.parent !== scene) {
                scene.add(redPillModel);
            }

            const current = redPillPositions[0];
            const next = redPillPositions[1];
            const progress = scrollY / next.y;
            const smoothProgress = Math.min(Math.max(progress, 0), 1);
            const eased = smoothProgress * smoothProgress * (3 - 2 * smoothProgress);

            redPillModel.position.x = lerp(current.position.x, next.position.x, eased) + Math.cos(time * 1.5) * 0.15;
            redPillModel.position.y = lerp(current.position.y, next.position.y, eased) + Math.sin(time * 2) * 0.2;
            redPillModel.position.z = lerp(current.position.z, next.position.z, eased);

            redPillModel.rotation.x = lerp(current.rotation.x, next.rotation.x, eased) + Math.sin(time * 0.5) * 0.05;
            redPillModel.rotation.y = lerp(current.rotation.y, next.rotation.y, eased) + Math.cos(time * 0.8) * 0.05;
            redPillModel.rotation.z = lerp(current.rotation.z, next.rotation.z, eased) + Math.sin(time * 1.2) * 0.1;

            redPillModel.scale.x = lerp(current.scale.x, next.scale.x, eased) * mobileScaleFactor;
            redPillModel.scale.y = lerp(current.scale.y, next.scale.y, eased) * mobileScaleFactor;
            redPillModel.scale.z = lerp(current.scale.z, next.scale.z, eased) * mobileScaleFactor;
        } else {
            // Hide red pill when off screen
            if (redPillModel.parent === scene) {
                scene.remove(redPillModel);
            }
        }
    }

    // Animate white pill based on scroll
    if (whitePillModel) {
        if (scrollY < whitePillPositions[1].y) {
            // Show white pill
            if (whitePillModel.parent !== scene) {
                scene.add(whitePillModel);
            }

            const current = whitePillPositions[0];
            const next = whitePillPositions[1];
            const progress = scrollY / next.y;
            const smoothProgress = Math.min(Math.max(progress, 0), 1);
            const eased = smoothProgress * smoothProgress * (3 - 2 * smoothProgress);

            whitePillModel.position.x = lerp(current.position.x, next.position.x, eased) + Math.cos(time * 1.3) * 0.15;
            whitePillModel.position.y = lerp(current.position.y, next.position.y, eased) + Math.sin(time * 1.8) * 0.2;
            whitePillModel.position.z = lerp(current.position.z, next.position.z, eased);

            whitePillModel.rotation.x = lerp(current.rotation.x, next.rotation.x, eased) + Math.sin(time * 0.5) * 0.05;
            whitePillModel.rotation.y = lerp(current.rotation.y, next.rotation.y, eased) + Math.cos(time * 0.8) * 0.05;
            whitePillModel.rotation.z = lerp(current.rotation.z, next.rotation.z, eased) + Math.sin(time * 1.1) * 0.1;

            whitePillModel.scale.x = lerp(current.scale.x, next.scale.x, eased) * mobileScaleFactor;
            whitePillModel.scale.y = lerp(current.scale.y, next.scale.y, eased) * mobileScaleFactor;
            whitePillModel.scale.z = lerp(current.scale.z, next.scale.z, eased) * mobileScaleFactor;
        } else {
            // Hide white pill when off screen
            if (whitePillModel.parent === scene) {
                scene.remove(whitePillModel);
            }
        }
    }

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Update mobile scale factor
    updateMobileScaleFactor();

    // Update scroll positions based on new window height
    scrollPositions[0].y = window.innerHeight * 0.0;
    scrollPositions[1].y = window.innerHeight * 0.35;
    scrollPositions[2].y = window.innerHeight * 1.32;
    scrollPositions[3].y = window.innerHeight * 2.4;
    scrollPositions[4].y = window.innerHeight * 3.32;
    scrollPositions[5].y = window.innerHeight * 3.85;

    redPillPositions[0].y = window.innerHeight * 0.0;
    redPillPositions[1].y = window.innerHeight * 0.35;

    whitePillPositions[0].y = window.innerHeight * 0.0;
    whitePillPositions[1].y = window.innerHeight * 0.35;

    // Refresh GSAP ScrollTrigger if available
    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
    }
});

// Start animation
animate();
