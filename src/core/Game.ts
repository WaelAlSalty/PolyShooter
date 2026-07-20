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
import { UndergroundShelter } from '../world/UndergroundShelter';

export class Game {
    private static activeGame: Game | null = null;

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
    private shelter: UndergroundShelter;
    
    private lastTime: number;
    private isGameOver: boolean = false;
    private score: number = 0;
    private highScore: number = 0;
    
    private isPlayerHidden: boolean = false;
    
    // Snappy Door / Portal Transition State Variables
    private isInBunker: boolean = false;
    private doorCooldown: number = 0;
    private isDoorTransitioning: boolean = false;
    private doorTransitionTimer: number = 0;
    
    // 3D Model and Animation Variables
    private playerModel?: THREE.Group;
    private animationMixer?: THREE.AnimationMixer;
    private animations: THREE.AnimationClip[] = [];
    private currentAction?: THREE.AnimationAction;
    private attackAction?: THREE.AnimationAction;
    private isAttacking: boolean = false;
    private attackTimer: number = 0;

    constructor() {
        if (Game.activeGame) {
            Game.activeGame.destroy();
        }
        Game.activeGame = this;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); 
        this.scene.fog = new THREE.Fog(0x87ceeb, 20, 80); 
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.rotation.order = 'YXZ';
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true; 
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        document.body.appendChild(this.renderer.domElement);

        this.setupLighting();

        this.inputManager = new InputManager();
        this.world = new World(this.scene);

        this.shelter = new UndergroundShelter(this.scene, new THREE.Vector3(0, 0, 0));
        this.world.colliders.push(...this.shelter.colliders);

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
            () => {
                this.audioManager.playShoot();
                this.triggerAttackAnimation();
            }
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
        this.loadPlayerModel();
    }

    private destroy(): void {
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.forceContextLoss();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }
    }

    private loadPlayerModel() {
        const gltfLoader = new GLTFLoader();
        gltfLoader.load(
            'Wizard.gltf', 
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
                    this.animations = animations;
                    this.animationMixer = new THREE.AnimationMixer(this.playerModel);
                    
                    let clipToPlay = animations.find(a => a.name === 'Idle');
                    if (!clipToPlay) {
                        clipToPlay = animations[0];
                    }

                    this.currentAction = this.animationMixer.clipAction(clipToPlay);
                    this.currentAction.play();
                }
            },
            undefined,
            (error) => console.error('Error loading the 3D character:', error)
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

    private triggerAttackAnimation() {
        if (!this.animationMixer || this.animations.length === 0) return;
        
        const attackClip = this.animations.find(a => a.name === 'Spell1' || a.name === 'Staff_Attack');
        if (!attackClip) return;

        this.isAttacking = true;
        this.attackTimer = 0.4; 

        if (this.attackAction) {
            this.attackAction.stop();
        }

        this.attackAction = this.animationMixer.clipAction(attackClip);
        this.attackAction.reset();
        this.attackAction.setLoop(THREE.LoopOnce, 1);
        this.attackAction.clampWhenFinished = true;
        this.attackAction.play();

        if (this.currentAction) {
            this.attackAction.crossFadeFrom(this.currentAction, 0.1, true);
        }
    }

    private updateUI(hp?: number, maxHp?: number) {
        if (!this.uiManager) return;
        
        const currentHp = hp !== undefined ? hp : (this.player ? this.player.getHp() : 100);
        const currentMaxHp = maxHp !== undefined ? maxHp : (this.player ? this.player.getMaxHp() : 100);
        const wave = this.enemyManager ? this.enemyManager.getWave() : 1;
        
        this.uiManager.updateStats(currentHp, currentMaxHp, this.score, this.highScore, wave);
    }

    public start(): void {
        this.animate();
    }

    private startGame(): void {
        this.isGameOver = false;
        this.score = 0;
        this.isInBunker = false;
        this.isDoorTransitioning = false;
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
        if (Game.activeGame !== this) return;

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
            
            if (!this.isDoorTransitioning) {
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
            }

            this.shelter.update(deltaTime);

            // --- SNAPPY DOOR / PORTAL MECHANIC ---
            if (this.doorCooldown > 0) {
                this.doorCooldown -= deltaTime;
            }

            if (this.isDoorTransitioning) {
                this.doorTransitionTimer += deltaTime;
                if (this.doorTransitionTimer >= 0.25) { // Snappy 0.25s transition feel
                    this.isDoorTransitioning = false;
                    this.doorCooldown = 1.0;
                }
            } else {
                const playerPos = this.player.getPosition();
                const portalY = this.isInBunker ? (this.shelter.bunkerYLevel + 0.2) : 0.2;
                const portalPos = new THREE.Vector3(0, portalY, 2);

                if (this.doorCooldown <= 0) {
                    const distanceToPortal = new THREE.Vector2(playerPos.x - portalPos.x, playerPos.z - portalPos.z).length();
                    
                    if (distanceToPortal < 2.0 && Math.abs(playerPos.y - portalPos.y) < 2.5) {
                        this.isInBunker = !this.isInBunker;
                        this.isDoorTransitioning = true;
                        this.doorTransitionTimer = 0;
                        
                        const destinationY = this.isInBunker ? (this.shelter.bunkerYLevel + 0.2) : 0.2;
                        playerPos.set(0, destinationY, 2);
                        
                        this.audioManager.playShoot();
                    }
                }
            }

            // --- DYNAMIC ENVIRONMENT (FOG & SKY TRANSITION) ---
            const playerY = this.player.getPosition().y;
            const depthRatio = Math.max(0, Math.min(1, -playerY / Math.abs(this.shelter.bunkerYLevel)));
            
            const surfaceColor = new THREE.Color(0x87ceeb); 
            const bunkerColor = new THREE.Color(0x020202);  
            const currentColor = surfaceColor.clone().lerp(bunkerColor, depthRatio);
            
            this.scene.background = currentColor;
            if (this.scene.fog instanceof THREE.Fog) {
                this.scene.fog.color = currentColor;
                this.scene.fog.near = 20 - (depthRatio * 15); 
                this.scene.fog.far = 80 - (depthRatio * 50);  
            }

            // --- STATE TRACKING LOG SYSTEM (STEALTH ZONE) ---
            const currentlyInside = this.shelter.stealthBox.containsPoint(this.player.getPosition()) || this.isInBunker;

            if (currentlyInside && !this.isPlayerHidden) {
                console.log("🟢 [STATE CHANGE] Wizard is underground! Invisible to enemies.");
                this.isPlayerHidden = true; 
            } else if (!currentlyInside && this.isPlayerHidden) {
                console.log("🔴 [STATE CHANGE] Wizard RETURNED to the surface! Enemies are searching...");
                this.isPlayerHidden = false; 
            }
            
            if (this.playerModel) {
                const currentWizardPos = this.player.getPosition();
                this.playerModel.position.set(currentWizardPos.x, currentWizardPos.y - 1, currentWizardPos.z);
                this.playerModel.rotation.y = this.camera.rotation.y + Math.PI; 

                if (this.isAttacking) {
                    this.attackTimer -= deltaTime;
                    if (this.attackTimer <= 0) {
                        this.isAttacking = false;
                        if (this.currentAction && this.attackAction) {
                            this.currentAction.reset().play();
                            this.currentAction.crossFadeFrom(this.attackAction, 0.2, true);
                        }
                    }
                } else if (this.animations.length > 0 && this.animationMixer) {
                    const isMoving = Math.abs(this.inputManager.getMovementX()) > 0.1 || Math.abs(this.inputManager.getMovementZ()) > 0.1;
                    const targetAnimName = isMoving ? 'Run' : 'Idle';

                    if (!this.currentAction || this.currentAction.getClip().name !== targetAnimName) {
                        const targetClip = this.animations.find(a => a.name === targetAnimName);
                        if (targetClip) {
                            const newAction = this.animationMixer.clipAction(targetClip);
                            newAction.reset().play();
                            if (this.currentAction) {
                                newAction.crossFadeFrom(this.currentAction, 0.2, true);
                            }
                            this.currentAction = newAction;
                        }
                    }
                }
            }

            this.enemyManager.update(
                deltaTime, 
                this.player.getPosition(), 
                this.isPlayerHidden, 
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