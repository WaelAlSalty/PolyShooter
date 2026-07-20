import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// 1. Core Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222); // Dark background

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
// Use native screen resolution to avoid blurry pixels on mobile
renderer.setPixelRatio(window.devicePixelRatio); 
document.body.appendChild(renderer.domElement);

// 2. Lighting Setup (Crucial for 3D models to be visible)
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// 3. Animation Variables (TypeScript syntax for optional types)
let playerCharacter: THREE.Group | undefined;
let animationMixer: THREE.AnimationMixer | undefined;
const clock = new THREE.Clock();

// 4. Load 3D Model
const gltfLoader = new GLTFLoader();

gltfLoader.load(
    'assets/model.gltf', // Adjust the path if your bundler requires a specific public folder
    function (gltf) {
        playerCharacter = gltf.scene;
        playerCharacter.scale.set(1, 1, 1);
        playerCharacter.position.set(0, -1, 0); 
        scene.add(playerCharacter);

        const animations = gltf.animations;
        if (animations && animations.length > 0) {
            animationMixer = new THREE.AnimationMixer(playerCharacter);
            const idleAction = animationMixer.clipAction(animations[0]);
            idleAction.play();
        }
        console.log('Character loaded successfully!');
    },
    function (progress) {
        console.log('Loading progress: ' + ((progress.loaded / progress.total) * 100) + '%');
    },
    function (error) {
        console.error('Error loading the character:', error);
    }
);

// 5. Handle Resize for Mobile
window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 6. Game Loop
function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();
    if (animationMixer) {
        animationMixer.update(deltaTime);
    }

    renderer.render(scene, camera);
}

animate();
