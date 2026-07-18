import * as THREE from 'three';

// --- VARIÁVEIS GLOBAIS ---
let score = 0;
const scoreElement = document.getElementById('scoreBoard') as HTMLElement;

// --- CONFIGURAÇÃO DA CENA ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- PLAYER ---
const player = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x00ff00 }));
scene.add(player);

// --- ARRAYS DE JOGO ---
const enemies: THREE.Mesh[] = [];
const bullets: THREE.Mesh[] = [];

// --- FUNÇÃO SPAWN INIMIGOS ---
function spawnEnemy() {
    const geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const enemy = new THREE.Mesh(geo, mat);
    enemy.position.set((Math.random() - 0.5) * 20, 0, (Math.random() - 0.5) * 20);
    scene.add(enemy);
    enemies.push(enemy);
}
setInterval(spawnEnemy, 2000);

// --- CHÃO E LUZ ---
const floor = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), new THREE.MeshStandardMaterial({ color: 0x444444 }));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.5;
scene.add(floor);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 5, 5);
scene.add(dirLight);

// --- CONTROLES ---
const keys: { [key: string]: boolean } = {};
window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

window.addEventListener('mousedown', () => {
    const bullet = new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
    bullet.position.copy(player.position);
    bullet.userData.velocity = new THREE.Vector3(0, 0, -0.5); 
    scene.add(bullet);
    bullets.push(bullet);
});

// --- LOOP DE JOGO ---
function animate() {
    requestAnimationFrame(animate);

    // 1. Movimento Player
    if (keys['w']) player.position.z -= 0.1;
    if (keys['s']) player.position.z += 0.1;
    if (keys['a']) player.position.x -= 0.1;
    if (keys['d']) player.position.x += 0.1;

    // 2. IA Inimigos
    enemies.forEach(enemy => {
        const direction = new THREE.Vector3().subVectors(player.position, enemy.position).normalize();
        enemy.position.add(direction.multiplyScalar(0.03));
    });

    // 3. Balas e Colisões
    bullets.forEach((bullet, bIndex) => {
        bullet.position.add(bullet.userData.velocity);
        enemies.forEach((enemy, eIndex) => {
            if (bullet.position.distanceTo(enemy.position) < 0.8) {
                scene.remove(enemy);
                enemies.splice(eIndex, 1);
                scene.remove(bullet);
                bullets.splice(bIndex, 1);
                score += 10;
                scoreElement.innerText = `Score: ${score}`;
            }
        });
    });

    // 4. Câmera
    camera.position.set(player.position.x, 5, player.position.z + 10);
    camera.lookAt(player.position.x, 0, player.position.z);

    renderer.render(scene, camera);
}

animate();