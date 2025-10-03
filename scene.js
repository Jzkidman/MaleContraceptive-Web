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
let pillModel = null;
let mixer = null;
const clock = new THREE.Clock();

// Load GLTF model
const loader = new THREE.GLTFLoader();
loader.load('./Assets/blueRound.gltf', function(gltf) {
    pillModel = gltf.scene;

    // Scale and position the model
    pillModel.scale.set(20, 20, 20);
    pillModel.position.set(-2, 0, 0);

    // Enable shadows and fix normals
    pillModel.traverse(function(child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // Fix polygon shading issues
            if (child.geometry) {
                // Compute smooth normals for better shading
                child.geometry.computeVertexNormals();
            }

            // Improve material properties for better shading
            if (child.material) {
                // Clone material to avoid affecting other objects
                child.material = child.material.clone();

                child.material.side = THREE.FrontSide; // Use FrontSide instead of DoubleSide
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
                    child.material.normalScale.set(0.5, 0.5); // Reduce normal intensity
                }

                // Ensure proper vertex colors if they exist
                if (child.geometry.attributes.color) {
                    child.material.vertexColors = true;
                }

                child.material.needsUpdate = true;
            }
        }
    });

    scene.add(pillModel);

    // Hide loading text
    document.getElementById('loading').style.display = 'none';

    console.log('Model loaded successfully');
}, function(progress) {
    console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
}, function(error) {
    console.error('Error loading model:', error);
    document.getElementById('loading').textContent = 'Error loading 3D model';
});

// Camera position
camera.position.set(0, 0, 10);
camera.lookAt(-2, 0, 0);

// Animation variables
let time = 0;
let scrollY = 0;

// Define scroll-based positions for each section
const scrollPositions = [
    { y: 0, position: { x: -2, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 1 }, scale: { x: 50, y: 50, z: 50 } },
    { y: window.innerHeight * 0.2, position: { x: -1, y: -1, z: 0 }, rotation: { x: 0, y: 0, z: 1 }, scale: { x: 45, y: 45, z: 45 } },
    { y: window.innerHeight * 0.8, position: { x: -1, y: 2, z: -1 }, rotation: { x: Math.PI * 0.5, y: Math.PI * 0.3, z: 0 }, scale: { x: 35, y: 35, z: 35 } },
    { y: window.innerHeight * 1.6, position: { x: -3, y: 0, z: 1 }, rotation: { x: Math.PI, y: Math.PI * 0.8, z: Math.PI * 0.2 }, scale: { x: 15, y: 15, z: 15 } },
    { y: window.innerHeight * 2.4, position: { x: -1.5, y: -1, z: 0 }, rotation: { x: Math.PI * 1.5, y: Math.PI * 1.2, z: Math.PI * 0.5 }, scale: { x: 45, y: 45, z: 45 } },
    { y: window.innerHeight * 3.2, position: { x: -2.5, y: 1, z: -0.5 }, rotation: { x: Math.PI * 2, y: Math.PI * 1.8, z: Math.PI * 0.8 }, scale: { x: 25, y: 25, z: 25 } }
];

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

    if (pillModel) {
        // Get interpolated values based on scroll
        const interpolated = getInterpolatedValues(scrollY);

        // Apply scroll-based position and rotation
        pillModel.position.x = interpolated.position.x + Math.cos(time * 1) * 0.1;
        pillModel.position.y = interpolated.position.y + Math.sin(time * 1.5) * 0.15;
        pillModel.position.z = interpolated.position.z;

        pillModel.rotation.x = interpolated.rotation.x + Math.sin(time * 0.5) * 0.05;
        pillModel.rotation.y = interpolated.rotation.y + Math.cos(time * 0.8) * 0.05;
        pillModel.rotation.z = interpolated.rotation.z + Math.sin(time * 0.3) * 0.03;

        // Apply scroll-based scale with subtle breathing effect
        const breathingScale = 1 + Math.sin(time * 2) * 0.02; // 2% breathing effect
        pillModel.scale.x = interpolated.scale.x * breathingScale;
        pillModel.scale.y = interpolated.scale.y * breathingScale;
        pillModel.scale.z = interpolated.scale.z * breathingScale;

        // Update directional light target to follow the pill
        directionalLight.target.position.x = pillModel.position.x;
        directionalLight.target.position.y = pillModel.position.y;
        directionalLight.target.position.z = pillModel.position.z;

        // Update rim light position to maintain consistent backlighting
        rimLight.position.x = pillModel.position.x;
        rimLight.position.y = pillModel.position.y;
        rimLight.position.z = pillModel.position.z - 8;
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
