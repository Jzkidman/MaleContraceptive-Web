// Pill Storm Scene - Separate from main scene
const stormScene = new THREE.Scene();
const stormCamera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 1000);
const stormRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

stormRenderer.setSize(window.innerWidth, window.innerHeight);
stormRenderer.setClearColor(0x000000, 0);
stormRenderer.shadowMap.enabled = true;
stormRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
stormRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const stormContainer = document.getElementById('pill-storm-canvas-container');
if (stormContainer) {
    stormContainer.appendChild(stormRenderer.domElement);
}

// Lighting for storm scene
const stormAmbientLight = new THREE.AmbientLight(0x404040, 0.8);
stormScene.add(stormAmbientLight);

const stormDirectionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
stormDirectionalLight.position.set(0, 10, 10);
stormScene.add(stormDirectionalLight);

const stormFillLight1 = new THREE.DirectionalLight(0xffffff, 0.6);
stormFillLight1.position.set(-10, 5, 5);
stormScene.add(stormFillLight1);

const stormFillLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
stormFillLight2.position.set(10, 5, 5);
stormScene.add(stormFillLight2);

// Camera position
stormCamera.position.set(0, 0, 15);
stormCamera.lookAt(0, 0, 0);

// Array to hold all pills
const pills = [];
const pillTypes = [
    { path: './assets/blueRound.gltf', scale: 20 },
    { path: './assets/pg2/greenpill.gltf', scale: 50 },
    { path: './assets/pg2/redpill.gltf', scale: 50 },
    { path: './assets/roundWhite.gltf', scale: 40 }
];

let pillModels = {};
let modelsLoaded = 0;

// Define specific positions and rotations for each pill
const pillPositions = [
    // Blue round pills
    { type: 0, position: { x: -20, y: 7, z: 0 }, rotation: { x: 0, y: 0.2, z: 0 }, scale: 20, fromLeft: true },
    { type: 0, position: { x: 13, y: -6, z: 0 }, rotation: { x: 0, y: -0.3, z: 0 }, scale: 20, fromLeft: false },
    { type: 0, position: { x: -8, y: -9, z: 0 }, rotation: { x: 0, y: 0.4, z: 0 }, scale: 20, fromLeft: true },
    { type: 0, position: { x: 22, y: 3.5, z: 0 }, rotation: { x: 0, y: -0.1, z: 0 }, scale: 20, fromLeft: false },
    { type: 0, position: { x: 0, y: 10, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: 20, fromLeft: true },

    // Green pills
    { type: 1, position: { x: -25, y: -3, z: 0 }, rotation: { x: 0, y: 0.3, z: 0.5 }, scale: 50, fromLeft: true },
    { type: 1, position: { x: 10, y: 9, z: 0 }, rotation: { x: 0, y: -0.2, z: -0.4 }, scale: 50, fromLeft: false },
    { type: 1, position: { x: -15, y: 2, z: 0 }, rotation: { x: 0, y: 0.1, z: 0.6 }, scale: 50, fromLeft: true },
    { type: 1, position: { x: 25, y: -4, z: 0 }, rotation: { x: 0, y: -0.4, z: -0.5 }, scale: 50, fromLeft: false },
    { type: 1, position: { x: 1, y: -4, z: 0 }, rotation: { x: 0, y: 0.2, z: 0.3 }, scale: 50, fromLeft: false },

    // Red/Yellow pills
    { type: 2, position: { x: -15, y: -5, z: 0 }, rotation: { x: 0, y: 0.1, z: 0.8 }, scale: 50, fromLeft: true },
    { type: 2, position: { x: 5, y: 2, z: 0 }, rotation: { x: 0, y: -0.3, z: -0.7 }, scale: 45, fromLeft: false },
    { type: 2, position: { x: -5, y: 5, z: 0 }, rotation: { x: 0, y: 0.2, z: 0.6 }, scale: 50, fromLeft: true },
    { type: 2, position: { x: 3, y: -10, z: 0 }, rotation: { x: 0, y: -0.1, z: -0.9 }, scale: 50, fromLeft: false },
    { type: 2, position: { x: -28, y: 5, z: 0 }, rotation: { x: 0, y: 0.4, z: 0.5 }, scale: 50, fromLeft: true },
    { type: 2, position: { x: 20, y: -9, z: 0 }, rotation: { x: 0, y: 0.4, z: -0.5 }, scale: 45, fromLeft: false },

    // White pills
    { type: 3, position: { x: -12, y: 10, z: 0 }, rotation: { x: 0, y: 0.3, z: 0.4 }, scale: 45, fromLeft: true },
    { type: 3, position: { x: 14, y: 1, z: 0 }, rotation: { x: 0, y: -0.2, z: -0.6 }, scale: 40, fromLeft: false },
    { type: 3, position: { x: -22, y: -10, z: 0 }, rotation: { x: 0, y: 0.1, z: 0.7 }, scale: 50, fromLeft: true },
    { type: 3, position: { x: 20, y: 10, z: 0 }, rotation: { x: 0, y: -0.4, z: -0.3 }, scale: 40, fromLeft: false },
    { type: 3, position: { x: -8, y: -2, z: 0 }, rotation: { x: 0, y: 0.2, z: 0.5 }, scale: 40, fromLeft: true }
];

// Helper function to setup pill materials
function setupStormPillMaterial(model) {
    model.traverse(function(child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.geometry) {
                child.geometry.computeVertexNormals();
            }

            if (child.material) {
                child.material = child.material.clone();
                child.material.side = THREE.FrontSide;
                child.material.flatShading = false;
                child.material.metalness = 0.2;
                child.material.roughness = 0.3;
                child.material.needsUpdate = true;
            }
        }
    });
}

// Load all pill models
const stormLoader = new THREE.GLTFLoader();
pillTypes.forEach((type, index) => {
    stormLoader.load(type.path, function(gltf) {
        pillModels[type.path] = {
            model: gltf.scene,
            scale: type.scale
        };
        modelsLoaded++;
        console.log(`Loaded ${type.path} for storm scene`);

        // Once all models are loaded, create the pill instances
        if (modelsLoaded === pillTypes.length) {
            createPillStorm();
        }
    }, undefined, function(error) {
        console.error(`Error loading ${type.path}:`, error);
    });
});

// Create pill instances from predefined positions
function createPillStorm() {
    pillPositions.forEach((config, i) => {
        const pillType = pillTypes[config.type];
        const modelData = pillModels[pillType.path];

        if (!modelData) {
            console.warn('Model data not found for type', config.type, pillType);
            return;
        }

        // Clone the model
        const pillClone = modelData.model.clone();
        setupStormPillMaterial(pillClone);

        // Create pill data with predefined positions
        const pillData = {
            mesh: pillClone,
            fromLeft: config.fromLeft,
            startX: config.fromLeft ? -40 : 40,
            finalX: config.position.x,
            finalY: config.position.y,
            finalZ: config.position.z,
            typeIndex: config.type,
            speed: 0.4 + (i * 0.01), // Slight variation in speed
            floatOffset: i * 0.3, // Staggered floating
            finalRotation: config.rotation,
            scale: config.scale,
            progress: 0,
            hasArrived: false,
            delay: i * 0.05 // Staggered arrivals
        };

        // Set initial position (off screen) and scale
        pillClone.position.set(pillData.startX, config.position.y, config.position.z);
        pillClone.scale.set(config.scale, config.scale, config.scale);

        stormScene.add(pillClone);
        pills.push(pillData);
    });
}

// Animation variables
const stormClock = new THREE.Clock();
let stormActive = false;
let stormTime = 0;

// Get scroll position of pill storm section
function isStormSectionVisible() {
    const stormSection = document.getElementById('pill-storm');
    if (!stormSection) return false;

    const rect = stormSection.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Check if section is in viewport
    return rect.top < windowHeight && rect.bottom > 0;
}

// Easing function for smooth arrival
function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
}

// Animate storm scene
function animateStorm() {
    requestAnimationFrame(animateStorm);

    const delta = stormClock.getDelta();
    stormActive = isStormSectionVisible();

    if (stormActive && pills.length > 0) {
        stormTime += delta;

        pills.forEach(pillData => {
            // Wait for delay before starting
            const effectiveTime = Math.max(0, stormTime - pillData.delay);

            if (!pillData.hasArrived) {
                // Move to final position
                pillData.progress = Math.min(1, effectiveTime * pillData.speed);
                const easedProgress = easeOutCubic(pillData.progress);

                // Interpolate position
                pillData.mesh.position.x = pillData.startX + (pillData.finalX - pillData.startX) * easedProgress;

                // Interpolate rotation to final rotation
                pillData.mesh.rotation.set(
                    pillData.finalRotation.x * easedProgress,
                    pillData.finalRotation.y * easedProgress,
                    pillData.finalRotation.z * easedProgress
                );

                // Fade in
                pillData.mesh.traverse(child => {
                    if (child.isMesh && child.material) {
                        child.material.transparent = true;
                        child.material.opacity = Math.min(1, pillData.progress * 2);
                    }
                });

                // Check if arrived
                if (pillData.progress >= 1) {
                    pillData.hasArrived = true;
                }
            } else {
                // Very subtle floating motion when arrived
                const floatX = Math.sin(stormTime * 0.3 + pillData.floatOffset) * 0.15;
                const floatY = Math.cos(stormTime * 0.4 + pillData.floatOffset) * 0.15;

                pillData.mesh.position.x = pillData.finalX + floatX;
                pillData.mesh.position.y = pillData.finalY + floatY;
                pillData.mesh.position.z = pillData.finalZ;

                // Keep final rotation - no spinning
                pillData.mesh.rotation.set(pillData.finalRotation.x, pillData.finalRotation.y, pillData.finalRotation.z);

                // Full opacity
                pillData.mesh.traverse(child => {
                    if (child.isMesh && child.material) {
                        child.material.transparent = true;
                        child.material.opacity = 1;
                    }
                });
            }
        });

        stormRenderer.render(stormScene, stormCamera);
    }
}

// Handle window resize for storm scene
window.addEventListener('resize', function() {
    stormCamera.aspect = window.innerWidth / window.innerHeight;
    stormCamera.updateProjectionMatrix();
    stormRenderer.setSize(window.innerWidth, window.innerHeight);
});

// Start storm animation
animateStorm();
