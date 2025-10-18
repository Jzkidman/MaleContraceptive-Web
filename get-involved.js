// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

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
scene.add(directionalLight);
scene.add(directionalLight.target);

// Fill lights
const fillLight1 = new THREE.DirectionalLight(0xffffff, 0.4);
fillLight1.position.set(-8, 5, 5);
scene.add(fillLight1);

const fillLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
fillLight2.position.set(8, 5, 5);
scene.add(fillLight2);

// Rim light
const rimLight = new THREE.PointLight(0x88aaff, 0.6, 30);
rimLight.position.set(0, 0, -8);
scene.add(rimLight);

// Variables
let bluePillModel = null;
const clock = new THREE.Clock();

// Mouse tracking variables
let mouseX = 0;
let mouseY = 0;
let targetRotationX = 0;
let targetRotationY = 0;
let currentRotationX = 0;
let currentRotationY = 0;

// Device orientation variables
let deviceOrientationEnabled = false;
let isMobileDevice = false;

// Smooth interpolation factor (lower = smoother but slower)
const lerpFactor = 0.05;

// Detect if device is mobile/tablet
function isMobileOrTablet() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 1024 && 'ontouchstart' in window);
}

isMobileDevice = isMobileOrTablet();

// Mouse move event listener (only for desktop)
if (!isMobileDevice) {
    document.addEventListener('mousemove', (event) => {
        // Normalize mouse position to -1 to 1
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

        // Map to rotation angles (in radians)
        // Limit rotation range for more subtle effect
        // Inverted Y-axis for natural "pointing" behavior
        targetRotationY = -mouseX * Math.PI * 0.3; // Left-right rotation (inverted)
        targetRotationX = -mouseY * Math.PI * 0.2; // Up-down rotation (inverted)
    });
}

// Device orientation event listener (for mobile/tablet)
if (isMobileDevice) {
    // Request permission for iOS 13+ devices
    function requestDeviceOrientation() {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        enableDeviceOrientation();
                    } else {
                        console.log('Device orientation permission denied');
                    }
                })
                .catch(console.error);
        } else {
            // Non-iOS devices or older iOS versions
            enableDeviceOrientation();
        }
    }

    function enableDeviceOrientation() {
        window.addEventListener('deviceorientation', handleOrientation, true);
        deviceOrientationEnabled = true;
        console.log('Device orientation enabled');
    }

    function handleOrientation(event) {
        // beta: front-to-back tilt (range: -180 to 180)
        // gamma: left-to-right tilt (range: -90 to 90)
        const beta = event.beta;   // front-back tilt
        const gamma = event.gamma; // left-right tilt

        if (beta !== null && gamma !== null) {
            // Normalize beta and gamma to -1 to 1 range
            // Beta: -90 to 90 degrees (tilting forward/backward)
            // Gamma: -45 to 45 degrees (tilting left/right)
            const normalizedBeta = Math.max(-1, Math.min(1, beta / 90));
            const normalizedGamma = Math.max(-1, Math.min(1, gamma / 45));

            // Map to rotation angles (inverted for natural feel)
            targetRotationX = normalizedBeta * Math.PI * 0.2;
            targetRotationY = -normalizedGamma * Math.PI * 0.3;
        }
    }

    // Auto-request permission on first user interaction
    document.addEventListener('click', function requestOnFirstTouch() {
        if (!deviceOrientationEnabled) {
            requestDeviceOrientation();
        }
        document.removeEventListener('click', requestOnFirstTouch);
    }, { once: true });

    // Also try on touch
    document.addEventListener('touchstart', function requestOnFirstTouch() {
        if (!deviceOrientationEnabled) {
            requestDeviceOrientation();
        }
        document.removeEventListener('touchstart', requestOnFirstTouch);
    }, { once: true });
}

// Helper function to setup pill materials
function setupPillMaterial(model) {
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

                if (child.material.map) {
                    child.material.map.minFilter = THREE.LinearMipmapLinearFilter;
                    child.material.map.magFilter = THREE.LinearFilter;
                    child.material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
                    child.material.map.needsUpdate = true;
                }

                if (child.material.normalMap) {
                    child.material.normalMap.minFilter = THREE.LinearMipmapLinearFilter;
                    child.material.normalMap.magFilter = THREE.LinearFilter;
                    child.material.normalScale.set(0.5, 0.5);
                }

                child.material.needsUpdate = true;
            }
        }
    });
}

// Load blue pill model
const loader = new THREE.GLTFLoader();

loader.load('./assets/blueRound.gltf', function(gltf) {
    bluePillModel = gltf.scene;
    bluePillModel.scale.set(25, 25, 25);
    bluePillModel.position.set(0, 0, 0);
    setupPillMaterial(bluePillModel);
    scene.add(bluePillModel);

    document.getElementById('loading').style.display = 'none';
    console.log('Blue pill loaded successfully');
}, function(progress) {
    const percentComplete = (progress.loaded / progress.total * 100).toFixed(0);
    document.getElementById('loading').textContent = `Loading... ${percentComplete}%`;
    console.log('Blue pill loading progress:', percentComplete + '%');
}, function(error) {
    console.error('Error loading blue pill:', error);
    document.getElementById('loading').textContent = 'Error loading 3D model';
});

// Camera position
camera.position.set(0, 0, 10);
camera.lookAt(0, 0, 0);

// Interpolation function for smooth transitions
function lerp(start, end, factor) {
    return start + (end - start) * factor;
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    if (bluePillModel) {
        // Smooth interpolation of rotation based on mouse position
        currentRotationX = lerp(currentRotationX, targetRotationX, lerpFactor);
        currentRotationY = lerp(currentRotationY, targetRotationY, lerpFactor);

        // Breathing effect (subtle scale pulsing)
        const breathingScale = 1 + Math.sin(time * 1.5) * 0.02;

        // Idle wobble effect (very subtle)
        const idleWobbleX = Math.sin(time * 0.5) * 0.02;
        const idleWobbleY = Math.cos(time * 0.7) * 0.02;
        const idleWobbleZ = Math.sin(time * 0.3) * 0.01;

        // Apply rotation: base rotation + mouse tracking + idle wobble
        bluePillModel.rotation.x = currentRotationX + idleWobbleX;
        bluePillModel.rotation.y = currentRotationY + idleWobbleY;
        bluePillModel.rotation.z = idleWobbleZ;

        // Apply breathing scale
        bluePillModel.scale.set(
            25 * breathingScale,
            25 * breathingScale,
            25 * breathingScale
        );

        // Subtle floating effect
        bluePillModel.position.y = Math.sin(time * 0.8) * 0.15;

        // Update directional light to follow pill
        directionalLight.target.position.copy(bluePillModel.position);
        rimLight.position.set(
            bluePillModel.position.x,
            bluePillModel.position.y,
            bluePillModel.position.z - 8
        );
    }

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
animate();
