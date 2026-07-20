import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Player } from '../entities/Player';
import { World } from '../world/World';
import { InputManager } from '../controls/InputManager';
import { MobileUIManager } from '../ui/MobileUIManager';
import { EnemyManager } from '../systems/EnemyManager';
import { ParticleSystem } from '../systems/ParticleSystem';
import { CollectibleManager } from '../systems/CollectibleManager';
import { AudioManager } from '../systems/AudioManager';
import { Crosshair } from '../ui/Crosshair';

export class Game {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private player: Player;
    private world: World;
    private inputManager: InputManager;
    private uiManager: MobileUIManager;
    private enemyManager: EnemyManager;
    private particleSystem: ParticleSystem;
    private collectibleManager: CollectibleManager;
    private audioManager: AudioManager;
    private crosshair: Crosshair;
    private lastTime: number;
    private isGameOver: boolean = false;
    private score: number = 0;
    private highScore: number = 0;
    
    // Variaveis do Modelo 3D
    private playerModel?: THREE.Group;
    private animationMixer?: THREE.AnimationMixer;

    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); 
        this.scene.fog = new THREE.Fog(0x87ceeb, 20, 80); 
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.rotation.order = 'YXZ';
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true; 
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);

        this.setupLighting();

        this.inputManager = new InputManager();
        this.world = new World(this.scene);
        this.particleSystem = new ParticleSystem(this.scene);
        this.collectibleManager = new CollectibleManager(this.scene);
        this.audioManager = new AudioManager();
        this.crosshair = new Crosshair();

        this.highScore = parseInt(localStorage.getItem('survival_highscore') || '0', 10);

        window.addEventListener('mousedown', () => this.audioManager.resume(), { once: true });
        window.addEventListener('touchstart', () => this.audioManager.resume(), { once: true });
        window.addEventListener('keydown', () => this.audioManager.resume(), { once: true });
        
        this.uiManager = new MobileUIManager(
            this.inputManager, 
            () => this.startGame()
        );

        this.player = new Player(
            this.scene, 
            (hp, maxHp) => this.updateUI(hp, maxHp),
            () => this.onGameOver(),
            () => this.audioManager.playShoot()
        );

        this.enemyManager = new EnemyManager(
            this.scene,
            (type) => {
                let points = 10;
                if (type === 'fast') points = 15;
                if (type === 'boss') points = 100;
                this.addScore(points);
            }
        );

        this.lastTime = performance.now();
        
        // Inicia o carregamento do personagem 3D
        this.loadPlayerModel();
    }

    private loadPlayerModel() {
        const gltfLoader = new GLTFLoader();
        gltfLoader.load(
            'wizard.gltf', // Atualizado para o nome do arquivo que voce usou
            (gltf) => {
                this.playerModel = gltf.scene;
                this.playerModel.scale.set(1, 1, 1);
                
                this.playerModel.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                this.scene.add(this.playerModel);

                const animations = gltf.animations;
                if (animations && animations.length > 0) {
                    this.animationMixer = new THREE.AnimationMixer(this.playerModel);
                    
                    // Imprime os nomes de todas as animacoes no Console (F12)
                    console.log('Animações disponíveis:', animations.map(a => a.name));

                    // Procura automaticamente pela animacao "Idle" (Ficar parado respirando)
                    let clipToPlay = animations.find(a => a.name.toLowerCase().includes('idle'));
                    
                    // Se por acaso nao existir "Idle", volta a pegar a primeira
                    if (!clipToPlay) {
                        clipToPlay = animations[0];
                    }

                    const action = this.animationMixer.clipAction(clipToPlay);
                    action.play();
                }
                console.log('Wizard loaded successfully!');
            },
            (progress) => {
                // Removemos o console de progresso para limpar o console
            },
            (error) => {
                console.error('Error loading the 3D character:', error);
            }
        );
    }

    private setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(50, 50, 20);
        dirLight.castShadow = true;
        
        dirLight.shadow.camera.top = 50;
        dirLight.shadow.camera.bottom = -50;
        dirLight.shadow.camera.left = -50;
        dirLight.shadow.camera.right = 50;
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 200;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        
        this.scene.add(dirLight);
    }

    private updateUI(hp?: number, maxHp?: number) {
        if (!this.uiManager) return;
        
        const currentHp = hp !== undefined ? hp : (this.player ? this.player.getHp() : 100);
        const currentMaxHp = maxHp !== undefined ? maxHp : (this.player ? this.player.getMaxHp() : 100);
        const wave = this.enemyManager ? this.enemyManager.getWave() : 1;
        
        this.uiManager.updateStats(
            currentHp, 
            currentMaxHp, 
            this.score, 
            this.highScore,
            wave
        );
    }

    public start(): void {
        this.animate();
    }

    private startGame(): void {
        this.isGameOver = false;
        this.score = 0;
        this.player.reset();
        this.enemyManager.reset();
        this.particleSystem.reset();
        this.collectibleManager.reset();
        this.updateUI();
        this.crosshair.show();
    }

    private onGameOver(): void {
        this.isGameOver = true;
        this.uiManager.showGameOver();
        this.crosshair.hide();
    }

    private addScore(points: number): void {
        this.score += points;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('survival_highscore', this.highScore.toString());
        }
        this.updateUI();
        this.updateWeaponProgression();
    }

    private updateWeaponProgression(): void {
        if (this.score >= 500) {
            this.player.setWeaponLevel(3);
        } else if (this.score >= 200) {
            this.player.setWeaponLevel(2);
        } else {
            this.player.setWeaponLevel(1);
        }
    }

    private animate(): void {
        requestAnimationFrame(() => this.animate());

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        if (this.animationMixer) {
            this.animationMixer.update(deltaTime);
        }
        
        const cameraDelta = this.inputManager.consumeCameraDelta();
        
        this.camera.rotation.y -= cameraDelta.x * 0.003;
        this.camera.rotation.x -= cameraDelta.y * 0.003;
        
        this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x));
        this.camera.rotation.z = 0;

        if (!this.isGameOver) {
            this.player.update(
                deltaTime, 
                this.inputManager.getMovementX(), 
                this.inputManager.getMovementZ(), 
                this.inputManager.consumeJump(),
                this.inputManager.getShooting(),
                this.inputManager.consumeDash(),
                this.camera.rotation.y,
                this.world.colliders
            );
            
            if (this.playerModel) {
                const playerPos = this.player.getPosition();
                this.playerModel.position.set(playerPos.x, playerPos.y - 1, playerPos.z);
                this.playerModel.rotation.y = this.camera.rotation.y + Math.PI; 
            }

            this.enemyManager.update(
                deltaTime, 
                this.player.getPosition(), 
                (amount) => {
                    this.player.takeDamage(amount);
                    this.audioManager.playDamage();
                }
            );

            this.collectibleManager.update(
                deltaTime, 
                this.player.getPosition(), 
                (type) => {
                    if (type === 'heal') {
                        this.player.heal(25);
                    } else if (type === 'shield') {
                        this.player.addBuff('shield');
                    } else if (type === 'rapidFire') {
                        this.player.addBuff('rapidFire');
                    }
                    this.audioManager.playHeal(); 
                }
            );

            this.particleSystem.update(deltaTime);

            const bullets = this.player.getBullets();
            for (let i = bullets.length - 1; i >= 0; i--) {
                const bullet = bullets[i];
                let hit = false;
                
                for (let j = this.enemyManager.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemyManager.enemies[j];
                    if (bullet.mesh.position.distanceTo(enemy.mesh.position) < enemy.collisionRadius + 0.5) {
                        enemy.takeDamage(10);
                        
                        if (enemy.hp <= 0) {
                            if (enemy.type === 'boss') {
                                this.particleSystem.spawn(enemy.mesh.position, 100, 0x8a2be2, 30);
                                this.collectibleManager.spawn(enemy.mesh.position);
                                this.collectibleManager.spawn(enemy.mesh.position);
                                this.audioManager.playExplosion();
                            } else {
                                const explosionColor = enemy.type === 'fast' ? 0xff8800 : 0xff0000;
                                this.particleSystem.spawn(enemy.mesh.position, 20, explosionColor, 15);
                                this.collectibleManager.spawn(enemy.mesh.position);
                                this.audioManager.playExplosion();
                            }
                        } else {
                            const hitColor = enemy.type === 'boss' ? 0x8a2be2 : 0xff0000;
                            this.particleSystem.spawn(bullet.mesh.position, 5, hitColor, 8);
                            this.audioManager.playHit();
                        }
                        
                        hit = true;
                        break; 
                    }
                }

                if (hit) {
                    this.particleSystem.spawn(bullet.mesh.position, 3, 0xffff00, 5);
                    this.player.destroyBullet(i);
                }
            }
        }

        const playerPosition = this.player.getPosition();
        const offset = new THREE.Vector3(0, 2, 5);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.camera.rotation.y);
        
        this.camera.position.set(
            playerPosition.x + offset.x, 
            playerPosition.y + offset.y, 
            playerPosition.z + offset.z
        );

        this.renderer.render(this.scene, this.camera);
    }
}
