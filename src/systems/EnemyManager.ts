import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Enemy } from '../entities/Enemy';
import type { EnemyType } from '../entities/Enemy';

export class EnemyManager {
    public enemies: Enemy[] = [];
    private spawnTimer: number = 0;
    private spawnInterval: number = 2.0;
    private currentWave: number = 1;
    private killsInCurrentWave: number = 0;
    private enemiesPerWave: number = 10;
    private isBossActive: boolean = false;

    // 3D Model Cache
    private baseEnemyModel?: THREE.Group;
    private baseAnimations?: THREE.AnimationClip[];

    // Wander mechanic state for when the player is hidden
    private wanderData: Map<Enemy, { target: THREE.Vector3, timer: number }> = new Map();

    constructor(
        private scene: THREE.Scene,
        private onEnemyKilled: (type: EnemyType) => void
    ) {
        this.loadAlienModel();
    }

    private loadAlienModel() {
        const loader = new GLTFLoader();
        loader.load(
            'Alien.gltf', 
            (gltf) => {
                this.baseEnemyModel = gltf.scene;
                this.baseAnimations = gltf.animations;
                
                this.baseEnemyModel.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                console.log('Alien loaded into memory successfully!');
            },
            undefined,
            (error) => console.error('Error loading Alien:', error)
        );
    }

    public getWave(): number {
        return this.currentWave;
    }

    public update(dt: number, playerPosition: THREE.Vector3, isPlayerHidden: boolean, playerTakeDamage: (amount: number) => void) {
        this.spawnTimer += dt;
        
        if (!this.isBossActive && this.spawnTimer > this.spawnInterval) {
            this.spawnEnemy(playerPosition);
            this.spawnTimer = 0;
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            let targetPosition: THREE.Vector3;

            // WANDER MECHANIC: If player is hidden, enemies pick random points to patrol
            if (isPlayerHidden) {
                let wander = this.wanderData.get(enemy);
                
                // If the enemy doesn't have a wander target or the timer expired, create a new one
                if (!wander || wander.timer <= 0) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = 5 + Math.random() * 10; // Walk 5 to 15 units away
                    const newTarget = new THREE.Vector3(
                        enemy.mesh.position.x + Math.cos(angle) * distance,
                        enemy.mesh.position.y,
                        enemy.mesh.position.z + Math.sin(angle) * distance
                    );
                    
                    wander = { target: newTarget, timer: 2 + Math.random() * 3 }; // Wander for 2 to 5 seconds
                    this.wanderData.set(enemy, wander);
                }
                
                wander.timer -= dt;
                targetPosition = wander.target;
            } else {
                targetPosition = playerPosition;
                
                // Clean up wander data if player is visible again
                if (this.wanderData.has(enemy)) {
                    this.wanderData.delete(enemy);
                }
            }

            enemy.update(dt, targetPosition);

            // STEALTH LOGIC: Enemies cannot deal damage if player is hidden
            if (!isPlayerHidden && enemy.mesh.position.distanceTo(playerPosition) < enemy.collisionRadius && enemy.attackCooldown <= 0) {
                playerTakeDamage(10 * enemy.damageMultiplier); 
                enemy.attackCooldown = 1.0; 
            }

            if (enemy.isDead) {
                this.onEnemyKilled(enemy.type);
                this.wanderData.delete(enemy); // Prevent memory leaks
                
                if (enemy.type === 'boss') {
                    this.isBossActive = false;
                    this.startNextWave();
                } else if (!this.isBossActive) {
                    this.killsInCurrentWave++;
                    if (this.killsInCurrentWave >= this.enemiesPerWave) {
                        this.spawnBoss(playerPosition);
                    }
                }

                this.enemies.splice(i, 1);
            }
        }
    }

    private spawnEnemy(playerPosition: THREE.Vector3) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 10;
        const spawnPos = new THREE.Vector3(
            playerPosition.x + Math.cos(angle) * distance,
            1,
            playerPosition.z + Math.sin(angle) * distance
        );
        
        const type: EnemyType = Math.random() < 0.3 ? 'fast' : 'normal';
        const enemy = new Enemy(this.scene, spawnPos, type, this.baseEnemyModel, this.baseAnimations);
        this.enemies.push(enemy);
    }

    private spawnBoss(playerPosition: THREE.Vector3) {
        this.isBossActive = true;
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 25;
        const spawnPos = new THREE.Vector3(
            playerPosition.x + Math.cos(angle) * distance,
            2,
            playerPosition.z + Math.sin(angle) * distance
        );
        
        const boss = new Enemy(this.scene, spawnPos, 'boss', this.baseEnemyModel, this.baseAnimations);
        boss.hp += (this.currentWave - 1) * 50; 
        this.enemies.push(boss);
    }

    private startNextWave() {
        this.currentWave++;
        this.killsInCurrentWave = 0;
        this.enemiesPerWave += 5; 
        this.spawnInterval = Math.max(0.5, 2.0 - (this.currentWave * 0.15));
    }

    public reset() {
        this.enemies.forEach(e => {
            e.hp = 0;
            e.isDead = true;
            e.scene.remove(e.mesh);
        });
        this.enemies = [];
        this.wanderData.clear();
        this.spawnTimer = 0;
        this.spawnInterval = 2.0;
        this.currentWave = 1;
        this.killsInCurrentWave = 0;
        this.enemiesPerWave = 10;
        this.isBossActive = false;
    }
}